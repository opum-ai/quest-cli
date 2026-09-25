// bun.lock's platform-package pins must follow the version (QCLI-292).
//
// A version bump edits package.json's six `@opum-ai/quest-<platform>`
// optionalDependencies, but bun.lock keeps whatever pins it was last
// generated with until someone runs `bun install`. CI's own
// `bun install --frozen-lockfile` does not catch that at bump time. Measured
// with bun 1.3.14: when the new version is not yet on the registry, the
// optional dependency is skipped rather than compared, and the stale lock
// exits 0. It turns red only once that version is PUBLISHED, which is after
// the release, on whatever unrelated pull request runs next. That is the 0.6.2
// breakage. This check fails on the bump itself, where `bun install` fixes it
// without the new version existing.

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { REQUIRED_PLATFORMS } from "./qualification/native-execution-receipt.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

/**
 * bun.lock is JSON with trailing commas. No string in it contains `,}` or
 * `,]`, so dropping a comma before a closing bracket is safe here.
 */
export function parseBunLock(text) {
  return JSON.parse(text.replace(/,(\s*[}\]])/g, "$1"));
}

/**
 * Every `@opum-ai/quest-<platform>` pin bun.lock carries must equal the
 * package.json version: the root workspace's optionalDependencies block and,
 * where bun has written one, the resolved `packages` entry. Returns the
 * problems found and how many pins were read, so the caller can tell a clean
 * answer from one that read nothing.
 */
export function lockfilePinProblems(rootPackage, lock) {
  const version = rootPackage.version;
  const problems = [];
  let pinsRead = 0;
  const workspacePins = lock?.workspaces?.[""]?.optionalDependencies ?? {};
  for (const platform of REQUIRED_PLATFORMS) {
    const name = `@opum-ai/quest-${platform}`;
    const pinned = workspacePins[name];
    if (pinned === undefined) {
      problems.push(`${name}: no pin in bun.lock's root optionalDependencies`);
      continue;
    }
    pinsRead += 1;
    if (pinned !== version)
      problems.push(
        `${name}: bun.lock pins ${pinned}, package.json is ${version}`,
      );
    const resolved = lock?.packages?.[name]?.[0];
    if (resolved !== undefined && resolved !== `${name}@${version}`)
      problems.push(
        `${name}: bun.lock resolves ${resolved}, package.json is ${version}`,
      );
  }
  return { problems, pinsRead, expected: REQUIRED_PLATFORMS.length };
}

export async function checkLockfilePins(directory = root) {
  const rootPackage = JSON.parse(
    await readFile(join(directory, "package.json"), "utf8"),
  );
  const lock = parseBunLock(
    await readFile(join(directory, "bun.lock"), "utf8"),
  );
  return lockfilePinProblems(rootPackage, lock);
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { problems, pinsRead, expected } = await checkLockfilePins();
  if (problems.length) {
    console.error(
      "bun.lock's platform-package pins do not match package.json:\n" +
        problems.map((problem) => `  - ${problem}`).join("\n") +
        "\nRun `bun install` and commit bun.lock. It works before the new version is published.",
    );
    process.exit(1);
  }
  console.log(
    `bun.lock pins all ${pinsRead} of ${expected} platform packages at the package.json version.`,
  );
}
