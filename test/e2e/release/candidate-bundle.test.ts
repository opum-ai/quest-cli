import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);

async function run(
  command: string,
  args: readonly string[],
  cwd: string,
): Promise<string> {
  const { stdout } = await execFile(command, [...args], { cwd });
  return stdout;
}
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildCandidateBundle,
  executableFor,
  REQUIRED_PLATFORMS,
} from "../../../scripts/build-candidate-bundle.mjs";

/**
 * QCLI-135 follow-through. The bundle is how downstream qualification
 * exercises an unpublished build, so the failures worth testing are the ones
 * that would make a run report a product defect when the real problem was a
 * build that was never finished, or bytes that do not match their own manifest.
 */

const COMMIT = "a".repeat(40);

function sha256(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** A minimal repository tree: a root package plus six platform packages. */
async function fixture(
  options: { readonly omit?: string; readonly version?: string } = {},
): Promise<string> {
  const version = options.version ?? "9.9.9";
  const directory = await mkdtemp(join(tmpdir(), "quest-candidate-fixture-"));
  await mkdir(join(directory, "bin"), { recursive: true });
  await writeFile(join(directory, "bin", "quest.cjs"), "#!/usr/bin/env node\n");
  await writeFile(join(directory, "LICENSE"), "MIT\n");
  await writeFile(
    join(directory, "package.json"),
    JSON.stringify({
      name: "@opum-ai/quest",
      version,
      bin: { quest: "./bin/quest.cjs" },
      files: ["bin/quest.cjs", "LICENSE"],
      questPlatformPackages: { stale: "values" },
    }),
  );
  for (const platform of REQUIRED_PLATFORMS) {
    if (platform === options.omit) continue;
    const packageDirectory = join(directory, "npm", `quest-${platform}`);
    await mkdir(join(packageDirectory, "bin"), { recursive: true });
    const bytes = `binary for ${platform}`;
    await writeFile(
      join(packageDirectory, "bin", executableFor(platform)),
      bytes,
    );
    await writeFile(join(packageDirectory, "LICENSE"), "MIT\n");
    await writeFile(
      join(packageDirectory, "package.json"),
      JSON.stringify({
        name: `@opum-ai/quest-${platform}`,
        version,
        files: [`bin/${executableFor(platform)}`],
        questBinarySha256: sha256(bytes),
      }),
    );
  }
  return directory;
}

test("the bundle matches the consumer's contract exactly", async () => {
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    const built = await buildCandidateBundle({
      commit: COMMIT,
      out,
      directory,
    });

    // Every field opum-cli-e2e reads. sourceCommit is required and it throws
    // before recording a row if absent, so a wrong shape here costs a whole run.
    const metadata = JSON.parse(
      await readFile(join(out, "evidence", "package-metadata.json"), "utf8"),
    );
    expect(metadata.sourceCommit).toBe(COMMIT);
    expect(metadata.version).toBe("9.9.9");
    expect(metadata.packages.map((row: { name: string }) => row.name)).toEqual(
      REQUIRED_PLATFORMS.map((platform) => `@opum-ai/quest-${platform}`),
    );
    for (const row of metadata.packages)
      expect(row.name).toMatch(/^@opum-ai\/quest-(.+)$/);

    // The root tarball's filename is matched by name downstream.
    const names = built.digests.map(
      (row: { filename: string }) => row.filename,
    );
    expect(names).toContain("opum-ai-quest-9.9.9.tgz");

    // sha256.txt lines are '<digest>  <filename>' and must be true of the
    // bytes on disk, not merely internally consistent.
    const lines = (await readFile(join(out, "tarballs", "sha256.txt"), "utf8"))
      .trim()
      .split("\n");
    expect(lines.length).toBe(7);
    for (const line of lines) {
      const [digest, filename] = line.split("  ");
      expect(digest).toMatch(/^[0-9a-f]{64}$/);
      expect(
        sha256(await readFile(join(out, "tarballs", filename as string))),
      ).toBe(digest);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("a five-platform build refuses rather than producing a bundle", async () => {
  // Downstream this would surface as a coverage failure that reads like a
  // product defect. It is a build that was never finished, so it fails here.
  const directory = await fixture({ omit: "win32-arm64" });
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    await expect(
      buildCandidateBundle({ commit: COMMIT, out, directory }),
    ).rejects.toThrow(/missing: win32-arm64/);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("a binary that disagrees with its own manifest never reaches a bundle", async () => {
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    await writeFile(
      join(directory, "npm", "quest-linux-x64", "bin", "quest"),
      "swapped after the manifest was written",
    );
    await expect(
      buildCandidateBundle({ commit: COMMIT, out, directory }),
    ).rejects.toThrow(/does not match its own manifest/);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("a platform package left at the previous version is refused", async () => {
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    const path = join(directory, "npm", "quest-darwin-x64", "package.json");
    const manifest = JSON.parse(await readFile(path, "utf8"));
    await writeFile(path, JSON.stringify({ ...manifest, version: "9.9.8" }));
    await expect(
      buildCandidateBundle({ commit: COMMIT, out, directory }),
    ).rejects.toThrow(/version 9\.9\.8, root is 9\.9\.9/);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("the root package's platform digests are re-derived, not carried over", async () => {
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    await buildCandidateBundle({ commit: COMMIT, out, directory });
    const rootPackage = JSON.parse(
      await readFile(join(directory, "package.json"), "utf8"),
    );
    // The fixture seeds a deliberately wrong value; the bundle must replace it
    // with digests computed from the binaries actually present.
    expect(rootPackage.questPlatformPackages.stale).toBeUndefined();
    for (const platform of REQUIRED_PLATFORMS)
      expect(
        rootPackage.questPlatformPackages[`@opum-ai/quest-${platform}`],
      ).toBe(sha256(`binary for ${platform}`));
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("a bundle without a real source commit is refused", async () => {
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    await expect(
      buildCandidateBundle({ commit: "not-a-commit", out, directory }),
    ).rejects.toThrow(/not a 40-hex commit id/);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});

test("a bundle records whether it carries the committed bytes, and refuses rebuilds on a release ref", async () => {
  // Bun's --compile output is not byte-reproducible, so a bundle assembled
  // from fresh builds names a commit whose bytes it does not contain. That
  // happened, and was caught downstream by digest comparison rather than here.
  const directory = await fixture();
  const out = await mkdtemp(join(tmpdir(), "quest-candidate-out-"));
  try {
    await run("git", ["init", "-q"], directory);
    await run("git", ["config", "user.email", "t@example.com"], directory);
    await run("git", ["config", "user.name", "t"], directory);
    await run("git", ["add", "-A"], directory);
    await run("git", ["commit", "-qm", "fixture"], directory);
    const commit = (await run("git", ["rev-parse", "HEAD"], directory)).trim();

    const committed = await buildCandidateBundle({ commit, out, directory });
    expect(committed.artifactProvenance).toBe("committed");
    const metadata = JSON.parse(
      await readFile(join(out, "evidence", "package-metadata.json"), "utf8"),
    );
    expect(metadata.artifactProvenance).toBe("committed");
    expect(metadata.rebuiltPlatforms).toBeUndefined();

    // A real rebuild regenerates the manifest too, so the manifest check
    // cannot catch it. Only the comparison against the committed blob can.
    const bytes = "a genuinely rebuilt binary";
    await writeFile(
      join(directory, "npm", "quest-linux-arm64", "bin", "quest"),
      bytes,
    );
    const manifestPath = join(
      directory,
      "npm",
      "quest-linux-arm64",
      "package.json",
    );
    await writeFile(
      manifestPath,
      JSON.stringify({
        ...JSON.parse(await readFile(manifestPath, "utf8")),
        questBinarySha256: sha256(bytes),
      }),
    );

    const rebuilt = await buildCandidateBundle({ commit, out, directory });
    expect(rebuilt.artifactProvenance).toBe("rebuilt");
    expect(
      JSON.parse(
        await readFile(join(out, "evidence", "package-metadata.json"), "utf8"),
      ).rebuiltPlatforms,
    ).toEqual(["linux-arm64"]);

    // On a release ref it is fatal: a release publishes the committed bytes,
    // so a bundle of rebuilds describes something else entirely.
    await expect(
      buildCandidateBundle({ commit, out, directory, releaseRef: true }),
    ).rejects.toThrow(/rebuilt artifacts.*linux-arm64/s);
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(out, { recursive: true, force: true });
  }
});
