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
import {
  registryHoldsTarball,
  verifyRegistryHoldsBundle,
} from "./qualification/bundle-integrity.mjs";
import {
  describeOverride,
  requireQualification,
} from "./qualification/e2e-receipt.mjs";
import {
  classifyPublishError,
  classifyVersion,
  describeVersionState,
  waitForConsumerVisibility,
} from "./qualification/registry-visibility.mjs";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

const KEYCHAIN_SERVICE = "npm-opum-ai-publish";
const REPOSITORY = "opum-ai/quest-cli";
const QUALIFICATION_WORKFLOW =
  ".github/workflows/prepublication-qualification.yml";

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
 * QCLI-366. Fetches the candidate bundle the release is made of and gates it
 * on an opum-cli-e2e qualification receipt, before anything touches npm.
 *
 * The run id is the only input. The bundle is downloaded from that run rather
 * than accepted as a directory, and the run is checked to be this repository's
 * prepublication qualification of this exact commit, so "these tarballs came
 * from run N" is established here rather than asserted by whoever runs this.
 */
export async function qualifyBundle({
  runId,
  commit,
  version,
  into,
  gh = (args) => execFile("gh", args, { maxBuffer: 32 * 1024 * 1024 }),
  gate = requireQualification,
}) {
  if (!/^[0-9]+$/.test(String(runId ?? "")))
    return {
      ok: false,
      problems: [`--qualification-run must be a numeric run id, got ${runId}`],
    };
  const { stdout } = await gh([
    "api",
    `repos/${REPOSITORY}/actions/runs/${runId}`,
  ]);
  const run = JSON.parse(stdout);
  const problems = [];
  if (run.path !== QUALIFICATION_WORKFLOW)
    problems.push(`run ${runId} is ${run.path}, not ${QUALIFICATION_WORKFLOW}`);
  if (run.head_sha !== commit)
    problems.push(
      `run ${runId} qualified ${run.head_sha}, the release is ${commit}`,
    );
  if (run.conclusion !== "success")
    problems.push(
      `run ${runId} concluded ${JSON.stringify(run.conclusion)}, not success`,
    );
  if (problems.length) return { ok: false, problems };
  await gh([
    "run",
    "download",
    String(runId),
    "--repo",
    REPOSITORY,
    "--name",
    "quest-candidate-bundle",
    "--dir",
    into,
  ]);
  return gate({ bundleDir: into, version, commit, releaseRunId: runId });
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

// QCLI-366 review: an already-published package is skipped only when npm
// holds the qualified tarball's bytes. Lives beside the post-publish check
// that uses the same comparison (QCLI-368); re-exported for the tests.
export { registryHoldsTarball };

/**
 * The publish sequence, with every side effect injected so the gate can be
 * tested by making it fail on purpose (QCLI-299 AC#6).
 *
 * The ordering guarantee this provides is the one the old comment claimed and
 * the old code could not deliver: the wrapper is not published until a read
 * confirms every platform package RESOLVES, not merely that its write
 * returned success. Write order cannot produce visibility order, and on
 * 0.7.0 the two disagreed in four of six positions.
 *
 * A failed gate returns rather than throws, and leaves the wrapper
 * unpublished. That is the whole point: with no wrapper on the registry at
 * this version, there is nothing advertising an optionalDependency that does
 * not resolve, so the failure mode is a release that did not happen instead
 * of one that installs and leaves no binary.
 */
export async function publishPlatformsThenWrapper({
  platforms,
  wrapper,
  publish,
  alreadyPublished,
  gate,
  log = () => {},
}) {
  const platformNames = platforms.map((target) => target.name);
  for (const target of platforms) {
    if (await alreadyPublished(target.name)) {
      log(`${target.name} ... skip (already on the registry at this version)`);
      continue;
    }
    await publish(target);
  }

  log(
    `\nGating the wrapper publish on all ${platforms.length} platform packages resolving` +
      " for a consumer -- not on their writes having returned success...",
  );
  const visibility = await gate(platformNames);
  if (!visibility.ok)
    return { ok: false, wrapperPublished: false, visibility, platformNames };

  if (await alreadyPublished(wrapper.name))
    log(`${wrapper.name} ... skip (already on the registry at this version)`);
  else await publish(wrapper);
  return { ok: true, wrapperPublished: true, visibility, platformNames };
}

/**
 * Per-package state for everything the gate could not confirm, read from the
 * public registry at the moment of the failure rather than asserted from what
 * npm said earlier in the run.
 */
export async function describeUnresolvedPackages(
  names,
  version,
  { classify = classifyVersion, ...options } = {},
) {
  const lines = [];
  const states = {};
  for (const name of names) {
    const classification = await classify(name, version, options);
    states[name] = classification.state;
    lines.push(...describeVersionState(name, version, classification));
  }
  return { lines, states };
}

/**
 * The 409 probe, behind an explicit operator flag.
 *
 * Staged and never-landed are indistinguishable by reading -- a stage is
 * invisible to the credential that created it -- and the only thing that
 * separates them is attempting the publish again. That costs a write, so it
 * is the operator's decision to make and not a poll's.
 */
export async function diagnoseStaged(target, { publish }) {
  try {
    await publish(target);
    return { state: "was-absent-now-published", detail: null };
  } catch (error) {
    return {
      state: classifyPublishError(error),
      detail: String(error?.stderr ?? error?.message ?? error).slice(0, 600),
    };
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
  const qualificationRun = flag("--qualification-run");
  // Opt-in, because the thing it does that a read cannot is WRITE: it
  // re-attempts the publish so that a 409 can say "staged" out loud.
  const diagnoseStagedRequested = argv.includes("--diagnose-staged");

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

  // QCLI-366: the opum-cli-e2e gate, in dry runs as well as real ones, so a
  // dry run answers "would this publish" rather than a weaker question.
  if (!qualificationRun)
    throw new Error(
      "--qualification-run <id> is required: the prepublication-qualification run on the release tag whose quest-candidate-bundle is published, and which opum-cli-e2e's receipt must name",
    );
  const bundleDir = await mkdtemp(join(tmpdir(), "quest-publish-bundle-"));
  const qualified = await qualifyBundle({
    runId: qualificationRun,
    commit,
    version,
    into: bundleDir,
  });
  if (!qualified.ok) {
    console.error(
      `Refusing to publish ${version} at ${commit.slice(0, 7)}: no opum-cli-e2e qualification receipt binds these bytes (ADR harden-fleet-ci...-unqualified-publication, ruling 3).`,
    );
    for (const problem of qualified.problems) console.error(`  - ${problem}`);
    console.error(
      "An override is honoured only when opum-cli-e2e writes it into the receipt itself; there is no flag or variable for it here.",
    );
    await rm(bundleDir, { recursive: true, force: true });
    process.exit(1);
  }
  if (qualified.override)
    console.log(describeOverride(qualified.override, qualified.source));
  console.log(
    `opum-cli-e2e receipt ${qualified.source} binds ${version} at ${commit.slice(0, 7)}, run ${qualificationRun}, and all ${Object.keys(qualified.bundle.tarballs).length} tarballs. Publishing those files byte-for-byte.`,
  );
  const tarballFor = (name) =>
    join(
      qualified.bundle.directory,
      `${name.replace("@", "").replace("/", "-")}-${version}.tgz`,
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
    // Every target publishes the qualified archive, never the package
    // directory: `npm publish <dir>` repacks the working tree, and those bytes
    // are not the ones the receipt binds (QCLI-368).
    const platforms = REQUIRED_PLATFORMS.map((platform) => ({
      name: `@opum-ai/quest-${platform}`,
      cwd: root,
      tarball: tarballFor(`@opum-ai/quest-${platform}`),
    }));
    const wrapper = {
      name: "@opum-ai/quest",
      cwd: root,
      tarball: tarballFor("@opum-ai/quest"),
    };

    const publish = async (target) => {
      const args = [
        "publish",
        target.tarball,
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
        // landed (alreadyPublished below), rather than erroring on it.
        process.exit(1);
      }
    };

    const outcome = await publishPlatformsThenWrapper({
      platforms,
      wrapper,
      publish,
      alreadyPublished: async (name) => {
        if (dryRun || !(await isPublished(name, version))) return false;
        const target = [...platforms, wrapper].find(
          (candidate) => candidate.name === name,
        );
        const held = await registryHoldsTarball(name, version, target.tarball);
        if (!held.ok) {
          console.error(
            `\nRefusing to continue: ${name}@${version} is already on the registry, but not as the qualified tarball.\n` +
              `  registry  ${held.actual}\n  qualified ${held.expected}\n` +
              "It was published outside this gate. A version cannot be republished; this needs a new version, not a rerun. Do NOT run npm unpublish.",
          );
          process.exit(1);
        }
        return true;
      },
      gate: (names) =>
        dryRun
          ? Promise.resolve({ ok: true, attempts: 0, missing: [] })
          : waitForConsumerVisibility(names, version, {
              onProgress: (event) => {
                if (event.state === "visible")
                  console.log(`  resolves for consumers: ${event.name}`);
                else if (event.state === "regressed")
                  console.log(
                    `  STOPPED resolving, back to waiting: ${event.name}`,
                  );
                else if (event.state === "settling")
                  console.log(
                    `  all ${names.length} resolve; holding ${Math.round(event.waitMs / 1000)}s to cover the measured publisher-early lag, then re-reading`,
                  );
              },
            }),
      log: console.log,
    });

    if (!outcome.ok) {
      const { lines, states } = await describeUnresolvedPackages(
        outcome.visibility.missing,
        version,
      );
      console.error(
        `\nTHE WRAPPER WAS NOT PUBLISHED. ${outcome.visibility.missing.length} of ${platforms.length} platform packages did not resolve for a consumer` +
          ` after ${outcome.visibility.attempts} check(s) across the full wait window.\n` +
          `@opum-ai/quest@${version} is NOT on the registry, so nothing is advertising an optionalDependency that does not resolve.\n` +
          "That is this gate working, not a new failure: an install inside that window succeeds and leaves no binary.\n" +
          "Do NOT run npm unpublish.\n\nPer-package state, read from the public registry just now:",
      );
      for (const line of lines) console.error(line);
      const ambiguous = Object.entries(states)
        .filter(([, state]) => state === "absent-or-staged")
        .map(([name]) => name);
      if (ambiguous.length && diagnoseStagedRequested) {
        console.error(
          "\n--diagnose-staged: re-attempting the publish to separate staged from never-landed.",
        );
        for (const name of ambiguous) {
          const target = platforms.find((candidate) => candidate.name === name);
          const probe = await diagnoseStaged(target, {
            publish: (candidate) =>
              run(
                [
                  "publish",
                  candidate.tarball,
                  "--access",
                  "public",
                  ...(!token && otp ? ["--otp", otp] : []),
                ],
                candidate.cwd,
                envOverrides,
              ),
          });
          console.error(`  ${name}: ${probe.state}`);
          if (probe.detail) console.error(`      ${probe.detail}`);
        }
      } else if (ambiguous.length) {
        console.error(
          "\nRe-run with --diagnose-staged to separate staged from never-landed by attempting the publish again.",
        );
      }
      console.error(
        "\nRe-run this script once the state above is resolved; packages already on the registry are skipped, not re-attempted.",
      );
      process.exit(1);
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
        // What this used to say -- "npm ALREADY CONFIRMED this publish
        // succeeded above, this is registry lag, not a failed release" -- was
        // an assertion the script had not verified at the moment it printed
        // it, and on 0.7.0 it was wrong about the one package that decided
        // whether the release shipped. The unpublish warning stays: that half
        // is protecting against a genuinely destructive action.
        console.error(
          `\nThe registry still does not reflect every published byte after ${wait.attempts} check(s) across the full wait window.\n` +
            "npm's write returned success for every package above. That is NOT evidence the release is fine --\n" +
            "a version can be accepted into a STAGED state: reserved, non-public, and awaiting a 2FA approval.\n" +
            "Do NOT run npm unpublish.\n\nPer-package state, read from the public registry just now:",
        );
        const { lines } = await describeUnresolvedPackages(
          [
            ...receipt.platforms.map((entry) => entry.packageName),
            wrapper.name,
          ],
          version,
        );
        for (const line of lines) console.error(line);
        console.error(
          "\nOnce every line above reads public, re-run just the verification:\n" +
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
    // QCLI-368: the executables matching is not the tarballs matching. Only
    // the whole-tarball comparison sees a difference outside the binary.
    const served = await verifyRegistryHoldsBundle({
      bundleDir,
      version,
    });
    if (!served.ok) {
      console.error(
        `\nnpm does not serve the qualified bundle for ${version}. Do NOT run npm unpublish.`,
      );
      for (const problem of served.problems) console.error(`  - ${problem}`);
      process.exit(1);
    }
    console.log(
      `@opum-ai/quest ${version} published and verified (${wait.attempts} check${wait.attempts === 1 ? "" : "s"}); all seven tarballs on npm are byte-identical to the qualified bundle.`,
    );
  } finally {
    if (tempNpmrcDir) await rm(tempNpmrcDir, { recursive: true, force: true });
    await rm(bundleDir, { recursive: true, force: true });
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
