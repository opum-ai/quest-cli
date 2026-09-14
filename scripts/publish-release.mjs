// Local, interactive release publish (QCLI-135, extended by QCLI-285).
//
// The CI path (.github/workflows/release.yml) is the intended one and needs no
// credential once trusted publishing is configured. This exists for the case
// that blocked 0.3.0: trusted publishing not yet set up, and every stored token
// dead because npm restricted the kind that could be stored.
//
// Two auth mechanisms, tried in this order:
//
//   1. A stored npm granular access token, in the macOS Keychain under the
//      service name below or in $NPM_TOKEN. Written to a TEMP npmrc for the
//      duration of the run (npm_config_userconfig) so ~/.npmrc is never
//      touched and the token never lands in a file that outlives the
//      process. Shape-checked (length/prefix/whitespace, value never
//      printed) before any publish attempt: an npm PUT to an unauthorised
//      package returns 404, not 403, so it does not disclose whether the
//      package exists -- "wrong credential", "expired credential", and "not
//      a credential at all" all look identical from that response alone,
//      and the cheapest way to rule the last one out is to look at the
//      credential's own shape before ever sending it. Confirmed necessary by
//      a sibling repo's release tonight: a malformed stored value cost two
//      full publish attempts before the shape check existed.
//
//   2. An interactive `npm login` session token, used with --otp. This is
//      the human publish path and it works with 2FA; a stored token above
//      bypasses the interactive OTP requirement entirely (that is what an
//      automation-shaped token is for), so --otp is neither required nor
//      sent when one is present.
//
// Deliberately NOT implemented: npm whoami / npm owner ls / npm config get
// as a pre-publish permission gate. All three were tried and rejected
// elsewhere in this fleet -- whoami 401s for a correctly scoped
// package-only granular token (too strict), owner ls succeeds with no
// token at all (vacuous), and config get redacts the value it would need to
// inspect (a false negative). Write permission is only observable by
// writing, which is exactly why the fail-closed platform-then-root ordering
// and the resumability below matter together: a refusal costs one package,
// not the release.
//
// It refuses for the same reasons CI refuses. A publish performed by hand at
// the end of a long day is exactly when the gates matter most.

import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  REQUIRED_PLATFORMS,
  validateReceipt,
  waitForPublished,
} from "./qualification/native-execution-receipt.mjs";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const KEYCHAIN_SERVICE = "npm-opum-ai-publish";

async function run(args, cwd, envOverrides = {}) {
  const { stdout, stderr } = await execFile("npm", args, {
    cwd,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, ...envOverrides },
  });
  return `${stdout}${stderr}`;
}

/**
 * Length, prefix, and an internal-whitespace flag -- never the value itself.
 * A granular access token is `npm_` followed by 36 characters (length 40).
 */
export function tokenShape(token) {
  return {
    length: token.length,
    prefix: token.startsWith("npm_") ? "npm_" : "OTHER",
    hasWhitespace: /\s/.test(token),
  };
}

export function isValidGranularTokenShape(shape) {
  return shape.prefix === "npm_" && shape.length === 40 && !shape.hasWhitespace;
}

async function findKeychainToken(service, execFileFn) {
  try {
    const { stdout } = await execFileFn("security", [
      "find-generic-password",
      "-s",
      service,
      "-w",
    ]);
    const token = stdout.trim();
    return token || null;
  } catch {
    // Not found, wrong account, or `security` unavailable on this platform --
    // all fall through to the next mechanism rather than fail here.
    return null;
  }
}

/**
 * Tries the Keychain, then $NPM_TOKEN. Returns `{ token: null, source: null }`
 * when neither is present, which the caller reads as "fall back to
 * interactive npm login + --otp" rather than an error: not having a stored
 * token is a normal, supported state.
 */
export async function resolveToken({
  env = process.env,
  keychainService = KEYCHAIN_SERVICE,
  findKeychainPassword = (service) => findKeychainToken(service, execFile),
} = {}) {
  const fromKeychain = await findKeychainPassword(keychainService);
  if (fromKeychain)
    return { token: fromKeychain, source: `Keychain (${keychainService})` };
  if (env.NPM_TOKEN) return { token: env.NPM_TOKEN, source: "NPM_TOKEN" };
  return { token: null, source: null };
}

/**
 * Resumability (QCLI-285): a target already on the registry at this exact
 * version is skipped, not re-attempted. Combined with fail-closed
 * platform-then-root ordering, this is what makes a rerun after a partial
 * failure safe -- without it, every failure after the first successful
 * platform publish needs a human to work out what already landed.
 */
export async function isPublished(
  pkgName,
  version,
  { execFile: execFileFn = execFile } = {},
) {
  try {
    await execFileFn("npm", ["view", `${pkgName}@${version}`, "version"]);
    return true;
  } catch {
    return false;
  }
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${name} requires a value`);
    return value;
  };
  const dryRun = !argv.includes("--publish");
  const otp = flag("--otp");
  const receiptPath = flag("--receipt");

  const version = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  ).version;
  const commit = (
    await execFile("git", ["rev-parse", "HEAD"], { cwd: root })
  ).stdout.trim();

  // Same gate as CI: the receipt must bind THIS commit and version, and every
  // digest is re-derived from the artifact on disk rather than trusted.
  if (!receiptPath)
    throw new Error(
      "--receipt <path> is required: publishing without a native-execution receipt is the failure this tooling exists to prevent",
    );
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const gate = await validateReceipt(receipt, { commit, version });
  if (!gate.ok) {
    console.error(`Refusing to publish ${version} at ${commit.slice(0, 7)}:`);
    for (const problem of gate.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `Receipt binds ${version} at ${commit.slice(0, 7)} across all six platforms.`,
  );

  const { token, source } = await resolveToken();
  let tempNpmrcDir;
  let envOverrides = {};
  if (token) {
    const shape = tokenShape(token);
    console.log(
      `Auth: using a token from ${source} (length=${shape.length} prefix=${shape.prefix} whitespace=${shape.hasWhitespace ? "YES" : "no"}); ~/.npmrc left untouched.`,
    );
    if (!isValidGranularTokenShape(shape))
      throw new Error(
        `Refusing to publish: the credential from ${source} does not look like an npm granular access token (expected length=40 prefix=npm_ no internal whitespace; got length=${shape.length} prefix=${shape.prefix} whitespace=${shape.hasWhitespace ? "yes" : "no"}). An npm PUT to an unauthorised package returns 404, indistinguishable from a permissions problem -- this is very likely the actual cause of one. Fix the stored value before retrying; the value itself is never logged.`,
      );
    tempNpmrcDir = await mkdtemp(join(tmpdir(), "quest-publish-npmrc-"));
    const npmrcPath = join(tempNpmrcDir, ".npmrc");
    await writeFile(npmrcPath, `//registry.npmjs.org/:_authToken=${token}\n`);
    envOverrides = { npm_config_userconfig: npmrcPath };
  } else {
    console.log(
      "Auth: no stored token found (Keychain or NPM_TOKEN); falling back to the interactive npm login session. Each publish call will need --otp.",
    );
    if (!dryRun && !otp)
      throw new Error(
        "--otp <code> is required for a real publish when no token is configured; the account has 2FA and npm will reject the write without one",
      );
  }

  try {
    // Platform packages before the root, so the root never briefly advertises
    // optionalDependencies that do not exist.
    const targets = [
      ...REQUIRED_PLATFORMS.map((platform) => ({
        name: `@opum-ai/quest-${platform}`,
        cwd: join(root, "npm", `quest-${platform}`),
      })),
      { name: "@opum-ai/quest", cwd: root },
    ];

    for (const target of targets) {
      if (!dryRun && (await isPublished(target.name, version))) {
        console.log(
          `${target.name} ... skip (already on the registry at ${version})`,
        );
        continue;
      }
      const args = [
        "publish",
        "--access",
        "public",
        ...(dryRun ? ["--dry-run"] : []),
        // A stored token bypasses the interactive OTP requirement entirely;
        // sending --otp alongside one is unnecessary, not merely redundant.
        ...(!token && otp ? ["--otp", otp] : []),
      ];
      process.stdout.write(`${target.name} ... `);
      try {
        await run(args, target.cwd, envOverrides);
        console.log(dryRun ? "ok (dry run)" : "published");
      } catch (error) {
        console.log("FAILED");
        console.error(String(error.stderr ?? error.message).slice(0, 600));
        // Stop rather than continue: a partial platform set is worse than
        // none, because the root would resolve to a mix of versions. Safe to
        // stop here specifically because a rerun skips whatever already
        // landed (isPublished above), rather than erroring on it.
        process.exit(1);
      }
    }

    if (dryRun) {
      console.log(
        token
          ? "\nDry run only. Re-run with --publish to publish."
          : "\nDry run only. Re-run with --publish --otp <code> to publish.",
      );
      return;
    }

    console.log(
      "\nWaiting for the registry to serve what was just published. npm's write already succeeded; its read API can lag behind it by minutes...",
    );
    const wait = await waitForPublished(receipt, version);
    if (!wait.ok) {
      if (wait.timedOut) {
        console.error(
          `\nThe registry still does not reflect every published byte after ${wait.attempts} check(s) across the full wait window.\n` +
            "npm ALREADY CONFIRMED this publish succeeded above -- this is registry read-after-write lag, not a failed release.\n" +
            "Do NOT run npm unpublish. Re-run this check again in a few minutes once the registry has caught up:\n" +
            `  node scripts/qualification/native-execution-receipt.mjs --verify-published ${version} --receipt ${receiptPath}\n`,
        );
      } else {
        console.error(
          `\nReceipt does not describe the bytes published as ${version}:`,
        );
      }
      for (const problem of wait.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `@opum-ai/quest ${version} published and verified (${wait.attempts} check${wait.attempts === 1 ? "" : "s"}).`,
    );
  } finally {
    if (tempNpmrcDir) await rm(tempNpmrcDir, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
