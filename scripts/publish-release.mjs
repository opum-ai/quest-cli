// Local, interactive release publish (QCLI-135).
//
// The CI path (.github/workflows/release.yml) is the intended one and needs no
// credential once trusted publishing is configured. This exists for the case
// that blocked 0.3.0: trusted publishing not yet set up, and every stored token
// dead because npm restricted the kind that could be stored.
//
// An interactive `npm login` session token is a different thing from the
// automation tokens npm restricted — it is the human publish path, and it works
// with 2FA. So: `npm login`, then this, with an OTP.
//
// It refuses for the same reasons CI refuses. A publish performed by hand at
// the end of a long day is exactly when the gates matter most.

import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  REQUIRED_PLATFORMS,
  validateReceipt,
} from "./qualification/native-execution-receipt.mjs";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

async function run(args, cwd) {
  const { stdout, stderr } = await execFile("npm", args, {
    cwd,
    maxBuffer: 32 * 1024 * 1024,
  });
  return `${stdout}${stderr}`;
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

  if (!dryRun && !otp)
    throw new Error(
      "--otp <code> is required for a real publish; the account has 2FA and npm will reject the write without one",
    );

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
    const args = [
      "publish",
      "--access",
      "public",
      ...(dryRun ? ["--dry-run"] : []),
      ...(otp ? ["--otp", otp] : []),
    ];
    process.stdout.write(`${target.name} ... `);
    try {
      await run(args, target.cwd);
      console.log(dryRun ? "ok (dry run)" : "published");
    } catch (error) {
      console.log("FAILED");
      console.error(String(error.stderr ?? error.message).slice(0, 600));
      // Stop rather than continue: a partial platform set is worse than none,
      // because the root would resolve to a mix of versions.
      process.exit(1);
    }
  }

  if (dryRun) {
    console.log(
      "\nDry run only. Re-run with --publish --otp <code> to publish.",
    );
    return;
  }
  console.log("\nVerifying the registry serves the bytes the receipt names...");
  await execFile(
    "node",
    [
      join(root, "scripts", "qualification", "native-execution-receipt.mjs"),
      "--verify-published",
      version,
      "--receipt",
      receiptPath,
    ],
    { cwd: root, maxBuffer: 32 * 1024 * 1024 },
  );
  console.log(`@opum-ai/quest ${version} published and verified.`);
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
