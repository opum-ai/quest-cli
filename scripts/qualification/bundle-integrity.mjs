// Is what npm serves the bundle that was qualified? (QCLI-368, QCLI-366.)
//
// `--verify-published` in native-execution-receipt.mjs compares the
// EXECUTABLE inside each published tarball with the native receipt. It could
// not see QCLI-368: the win32 tarballs on npm carried the right executables
// and differed only in LICENSE and package.json line endings. The unit that
// publishes, and the unit opum-cli-e2e's receipt binds, is the whole tarball,
// so this compares the whole tarball -- npm's own dist.integrity (sha512 of
// the .tgz) against the file in the candidate bundle.

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { expectedTarballNames } from "./e2e-receipt.mjs";
import { REQUIRED_PLATFORMS } from "./native-execution-receipt.mjs";

const execFile = promisify(execFileCallback);

/**
 * `ok` only when npm's integrity for pkgName@version is this tarball's sha512.
 * A read failure is `ok: false` with `actual: null`, never a pass.
 */
export async function registryHoldsTarball(
  pkgName,
  version,
  tarball,
  { execFile: execFileFn = execFile } = {},
) {
  const expected = `sha512-${createHash("sha512")
    .update(await readFile(tarball))
    .digest("base64")}`;
  try {
    const { stdout } = await execFileFn("npm", [
      "view",
      `${pkgName}@${version}`,
      "dist.integrity",
    ]);
    const actual = stdout.trim();
    return { ok: actual === expected, expected, actual };
  } catch {
    return { ok: false, expected, actual: null };
  }
}

/** The seven package names, in the order expectedTarballNames lists them. */
export function packageNames() {
  return [
    "@opum-ai/quest",
    ...REQUIRED_PLATFORMS.map((platform) => `@opum-ai/quest-${platform}`),
  ];
}

/**
 * Every published tarball against its bundle file. An unreadable integrity is
 * retried, because the registry's read API lags its writes; a DIFFERENT
 * integrity is not, because no amount of waiting changes published bytes.
 */
export async function verifyRegistryHoldsBundle({
  bundleDir,
  version,
  attempts = 6,
  delayMs = 15_000,
  check = registryHoldsTarball,
  sleep = (ms) => new Promise((done) => setTimeout(done, ms)),
}) {
  const names = packageNames();
  const files = expectedTarballNames(version);
  const results = {};
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    for (const [index, name] of names.entries())
      if (!results[name]?.ok && results[name]?.actual == null)
        results[name] = await check(
          name,
          version,
          join(bundleDir, "tarballs", files[index]),
        );
    const unread = names.filter((name) => results[name].actual == null);
    if (!unread.length || attempt === attempts) break;
    await sleep(delayMs);
  }
  const problems = names
    .filter((name) => !results[name].ok)
    .map((name) =>
      results[name].actual == null
        ? `${name}@${version}: npm returned no dist.integrity`
        : `${name}@${version}: npm serves ${results[name].actual}, the qualified bundle file is ${results[name].expected}`,
    );
  return { ok: problems.length === 0, problems, results };
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    const value = index === -1 ? undefined : argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${name} <value> is required`);
    return value;
  };
  const version = flag("--version");
  const verdict = await verifyRegistryHoldsBundle({
    bundleDir: flag("--bundle"),
    version,
  });
  if (!verdict.ok) {
    console.error(
      `npm does not serve the qualified bundle for ${version} (QCLI-368):`,
    );
    for (const problem of verdict.problems) console.error(`  - ${problem}`);
    process.exit(1);
  }
  console.log(
    `npm serves all ${packageNames().length} ${version} tarballs byte-identical to the qualified bundle.`,
  );
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
