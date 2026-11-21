import { expect, test } from "bun:test";
import { mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runQuest as runQuestInProcess } from "../src/cli/main.ts";
import { LocalWorkspacePort } from "../src/adapters/workspaces/local-workspaces.ts";
import { resolveCommonDirLockPath } from "../src/application/refs/common-dir-lock.ts";

/**
 * QCLI-568 R1: the WIRING, the common-dir resolution and the DEC-282 (a8)
 * claim, exercised at the CLI boundary rather than only through the decorator.
 *
 * These run the real CLI in a real clone with a LINKED worktree, because the
 * defect lives in the interaction between two worktrees of one clone and the
 * filesystem -- exactly what the unit tests cannot see (a fake resolver cannot
 * tell a realpath'd common dir from a worktree path). The broken-mechanism
 * fixture pre-creates `<main>/.git/quest` as a regular FILE: `mkdir` hits
 * EEXIST (tolerated) and `open(wx)` hits ENOTDIR, a path reachable ONLY if the
 * resolver found the MAIN `.git` rather than the linked worktree's own root.
 */

const MAIN = fileURLToPath(new URL("../src/cli/main.ts", import.meta.url));

/** Blank the one volatile envelope field so two runs compare byte-for-byte. */
function stableStdout(stdout: string): string {
  return stdout.replace(/"discoveredAt":"[^"]*"/gu, '"discoveredAt":"<ts>"');
}

function runQuest(
  workspace: string,
  args: readonly string[],
  env: Record<string, string | undefined> = {},
) {
  const child = Bun.spawnSync([process.execPath, MAIN, ...args], {
    cwd: workspace,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: child.exitCode ?? 0,
    stdout: child.stdout ? child.stdout.toString() : "",
    stderr: child.stderr ? child.stderr.toString() : "",
  };
}

function git(workspace: string, args: readonly string[]) {
  const child = Bun.spawnSync(["git", ...args], {
    cwd: workspace,
    stdout: "pipe",
    stderr: "pipe",
  });
  if ((child.exitCode ?? 0) !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${child.stderr?.toString() ?? ""}`,
    );
  }
  return child.stdout ? child.stdout.toString() : "";
}

async function fixture(): Promise<{
  root: string;
  linked: string;
  cleanup: () => Promise<void>;
}> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli568-cli-")));
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "t@example.test"]);
  git(root, ["config", "user.name", "t"]);
  const init = runQuest(root, ["init"]);
  if (init.exitCode !== 0) throw new Error(`quest init failed: ${init.stderr}`);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "base"]);
  const linked = `${root}-linked`;
  git(root, ["worktree", "add", "-q", linked, "-b", "linked"]);
  return {
    root,
    linked,
    cleanup: async () => {
      await rm(linked, { recursive: true, force: true });
      await rm(root, { recursive: true, force: true });
    },
  };
}

test("a broken common-dir lock proceeds unlocked: one note line, stdout unchanged (QCLI-568 R1)", async () => {
  const { root, linked, cleanup } = await fixture();
  try {
    const args = ["task", "list", "--across-refs", "--ref", "HEAD", "--json"];

    // Baseline: the normal locked path is SILENT and succeeds.
    const baseline = runQuest(linked, args);
    expect(baseline.exitCode).toBe(0);
    expect(baseline.stderr).toBe("");

    // Replace the common dir's `quest/` directory with a regular FILE. mkdir
    // then hits EEXIST (tolerated) and open(wx) hits ENOTDIR -- the broken
    // mechanism, reachable only if the common dir resolved to the MAIN `.git`.
    const questPath = join(root, ".git", "quest");
    await rm(questPath, { recursive: true, force: true });
    await writeFile(questPath, "not a directory\n", "utf8");

    const broken = runQuest(linked, args);
    expect(broken.exitCode).toBe(0);
    // The envelope on stdout is byte-identical to the unlocked run apart from
    // `coverage.discoveredAt`, which is the invocation's own clock and moves
    // between any two runs; normalising just it compares every other byte.
    expect(stableStdout(broken.stdout)).toBe(stableStdout(baseline.stdout));
    const lines = broken.stderr.split("\n").filter((line) => line.length > 0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^note: .*ran unlocked/u);
  } finally {
    await cleanup();
  }
}, 120_000);

test("the main checkout and a linked worktree resolve to one lock path (QCLI-568 R1)", async () => {
  const { root, linked, cleanup } = await fixture();
  try {
    const port = new LocalWorkspacePort();
    const main = await port.inspect(root);
    const other = await port.inspect(linked);

    // One clone -> one realpath'd common dir -> one lock file, so two worktrees
    // actually contend instead of each taking its own lock.
    expect(main.commonDirectory).toBe(other.commonDirectory);
    expect(resolveCommonDirLockPath(main.commonDirectory)).toBe(
      resolveCommonDirLockPath(other.commonDirectory),
    );
    // It is the MAIN `.git`, realpath'd -- not either worktree's own root.
    expect(main.commonDirectory).toBe(await realpath(join(root, ".git")));
    expect(main.worktreePath).not.toBe(other.worktreePath);
  } finally {
    await cleanup();
  }
}, 120_000);

/** Set QUEST_TASK_STORE for an in-process runQuest, restoring it afterwards. */
async function withTaskStore<T>(
  store: string,
  run: () => Promise<T>,
): Promise<T> {
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    return await run();
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
  }
}

test("in-process runQuest captures the unlocked note on result.stderr (QCLI-568 R4 i)", async () => {
  const { root, linked, cleanup } = await fixture();
  try {
    const questPath = join(root, ".git", "quest");
    await rm(questPath, { recursive: true, force: true });
    await writeFile(questPath, "not a directory\n", "utf8");

    const result = await withTaskStore(linked, () =>
      runQuestInProcess(
        ["task", "list", "--across-refs", "--ref", "HEAD", "--json"],
        false,
        false,
      ),
    );

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).kind).toBe("task.list-across-refs");
    const lines = result.stderr.split("\n").filter((line) => line.length > 0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^note: .*ran unlocked/u);
  } finally {
    await cleanup();
  }
}, 120_000);

test("outside a git repo the note precedes the envelope and the envelope stays last (QCLI-568 R4 ii)", async () => {
  const nonGit = await realpath(
    await mkdtemp(join(tmpdir(), "qcli568-nongit-")),
  );
  try {
    const result = await withTaskStore(nonGit, () =>
      runQuestInProcess(
        ["task", "list", "--across-refs", "--ref", "HEAD", "--json"],
        false,
        false,
      ),
    );

    // Measured before the note channel existed, and unchanged by it: the
    // resolver throws (not a Git worktree), the view fails with drift, exit 6,
    // and stdout stays empty.
    expect(result.exitCode).toBe(6);
    expect(result.stdout).toBe("");
    const lines = result.stderr.split("\n").filter((line) => line.length > 0);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^note: .*ran unlocked/u);
    // The JSON envelope is the LAST line.
    expect(JSON.parse(lines[lines.length - 1] ?? "").error_type).toBe("drift");
  } finally {
    await rm(nonGit, { recursive: true, force: true });
  }
}, 120_000);
