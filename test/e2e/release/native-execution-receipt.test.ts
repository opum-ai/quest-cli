import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  buildReceipt,
  REQUIRED_JOBS,
  REQUIRED_PLATFORMS,
  sha256,
  validateReceipt,
} from "../../../scripts/qualification/native-execution-receipt.mjs";

/**
 * QCLI-135. A receipt is only evidence if the thing it describes is the thing
 * being published, so every test here attacks that binding rather than the
 * document's shape.
 */

const COMMIT = "a".repeat(40);

/** A minimal npm/ tree: six platform packages whose manifests match their bytes. */
async function fixture(
  mutate: (platform: string, bytes: Buffer) => Buffer = (_p, bytes) => bytes,
): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "quest-receipt-fixture-"));
  for (const platform of REQUIRED_PLATFORMS) {
    const executable = platform.startsWith("win32-") ? "quest.exe" : "quest";
    const packageDirectory = join(directory, "npm", `quest-${platform}`);
    await mkdir(join(packageDirectory, "bin"), { recursive: true });
    const bytes = mutate(platform, Buffer.from(`binary for ${platform}`));
    await writeFile(join(packageDirectory, "bin", executable), bytes);
    await writeFile(
      join(packageDirectory, "package.json"),
      JSON.stringify({
        name: `@opum-ai/quest-${platform}`,
        questBinarySha256: sha256(bytes),
      }),
    );
  }
  return directory;
}

const successfulJobs = REQUIRED_JOBS.map((name: string) => ({
  name,
  conclusion: "success",
}));

test("the receipt records the run faithfully, excluding only the job writing it", async () => {
  const directory = await fixture();
  try {
    const receipt = await buildReceipt({
      commit: COMMIT,
      version: "9.9.9",
      runId: 1234,
      // The emitting job has not concluded at the moment it writes this
      // document, so recording it as successful would be an assertion about
      // the future. Any OTHER job the workflow grows is recorded as it was.
      jobs: [
        ...successfulJobs,
        { name: "native-execution-receipt", conclusion: null },
        { name: "some-later-job", conclusion: "success" },
      ],
      directory,
    });
    expect(receipt.ciRun.jobs.map((job: { name: string }) => job.name)).toEqual(
      [...REQUIRED_JOBS, "some-later-job"],
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a receipt cannot be padded with an unrelated job that did not pass", async () => {
  const directory = await fixture();
  try {
    await expect(
      buildReceipt({
        commit: COMMIT,
        runId: 1,
        jobs: [
          ...successfulJobs,
          { name: "flaky-extra", conclusion: "failure" },
        ],
        directory,
      }),
    ).rejects.toThrow(/did not succeed: flaky-extra/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a receipt cannot be built from a run that skipped or failed a platform", async () => {
  const directory = await fixture();
  try {
    await expect(
      buildReceipt({
        commit: COMMIT,
        runId: 1,
        jobs: successfulJobs.filter((job) => job.name !== "win32-arm64"),
        directory,
      }),
    ).rejects.toThrow(/missing: win32-arm64/);

    await expect(
      buildReceipt({
        commit: COMMIT,
        runId: 1,
        jobs: successfulJobs.map((job) =>
          job.name === "linux-x64"
            ? { name: job.name, conclusion: "failure" }
            : job,
        ),
        directory,
      }),
    ).rejects.toThrow(/did not succeed: linux-x64/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a manifest that disagrees with the binary beside it never reaches a receipt", async () => {
  const directory = await fixture();
  try {
    await writeFile(
      join(directory, "npm", "quest-darwin-x64", "package.json"),
      JSON.stringify({
        name: "@opum-ai/quest-darwin-x64",
        questBinarySha256: "b".repeat(64),
      }),
    );
    await expect(
      buildReceipt({
        commit: COMMIT,
        runId: 1,
        jobs: successfulJobs,
        directory,
      }),
    ).rejects.toThrow(/does not match its own manifest/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the gate refuses a receipt bound to a different commit or version", async () => {
  const directory = await fixture();
  try {
    const receipt = await buildReceipt({
      commit: COMMIT,
      version: "1.0.0",
      runId: 7,
      jobs: successfulJobs,
      directory,
    });

    expect(
      await validateReceipt(receipt, {
        commit: COMMIT,
        version: "1.0.0",
        directory,
      }),
    ).toEqual({ ok: true, problems: [] });

    // The exact failure QCLI-135 was filed for: a receipt that outlived the
    // release it described.
    const staleCommit = await validateReceipt(receipt, {
      commit: "c".repeat(40),
      version: "1.0.0",
      directory,
    });
    expect(staleCommit.ok).toBe(false);
    expect(staleCommit.problems.join(" ")).toContain("but the release is");

    const staleVersion = await validateReceipt(receipt, {
      commit: COMMIT,
      version: "1.0.1",
      directory,
    });
    expect(staleVersion.ok).toBe(false);
    expect(staleVersion.problems.join(" ")).toContain("version 1.0.0");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the gate re-derives digests from disk, so a self-consistent receipt is not enough", async () => {
  const directory = await fixture();
  try {
    const receipt = await buildReceipt({
      commit: COMMIT,
      version: "1.0.0",
      runId: 7,
      jobs: successfulJobs,
      directory,
    });
    // Swap the artifact after the receipt was written. Nothing inside the
    // document changed, so a validator that trusted it would still pass.
    await writeFile(
      join(directory, "npm", "quest-linux-arm64", "bin", "quest"),
      "a different binary entirely",
    );
    const result = await validateReceipt(receipt, {
      commit: COMMIT,
      version: "1.0.0",
      directory,
    });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toContain("linux-arm64");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the emitted document satisfies the downstream validator's rules", async () => {
  const directory = await fixture();
  try {
    const receipt = await buildReceipt({
      commit: COMMIT,
      version: "1.0.0",
      runId: 42,
      runEvent: "push",
      jobs: successfulJobs,
      directory,
    });
    // These are opum-cli-e2e/lib/native-receipts.mjs's own requirements,
    // asserted here rather than left to a downstream run: a receipt this
    // repository cannot validate is one it should not have published.
    expect(receipt.schemaVersion).toBe(1);
    expect(receipt.kind).toBe("opum.native-execution-receipt.v1");
    expect(receipt.ciRun.headSha).toBe(receipt.source.commit);
    expect(receipt.ciRun.conclusion).toBe("success");
    expect(receipt.ciRun.url).toMatch(/\/actions\/runs\/42$/);
    expect(
      receipt.platforms.map((row: { platform: string }) => row.platform).sort(),
    ).toEqual([...REQUIRED_PLATFORMS].sort());
    for (const row of receipt.platforms) {
      expect(row.executableSha256).toMatch(/^[0-9a-f]{64}$/);
      expect(row.declaredIn).toContain("questBinarySha256");
    }
    // "These bytes were published" and "these bytes ran here" are different
    // claims; a receipt that merges them certifies more than it earned.
    expect(receipt.notClaimed.join(" ")).toContain(
      "outside its own recorded runner",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
