import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runQuest as runQuestInProcess } from "../src/cli/main.ts";
import { resolveCanonicalCommonDir } from "../src/cli/composition.ts";
import { LocalWorkspacePort } from "../src/adapters/workspaces/local-workspaces.ts";
import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import { AcrossRefsViewService } from "../src/application/refs/across-refs.ts";
import { resolveCommonDirLockPath } from "../src/application/refs/common-dir-lock.ts";
import type {
  DiscoveredPullRequest,
  OriginRemote,
  RefDiscoveryPort,
} from "../src/ports/ref-discovery.ts";

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

    // QCLI-568 Q568-INT A: the ONE shared resolver returns that same canonical
    // (native-realpath'd) spelling, so the lock and Part B's cache key the same
    // directory. It is NOT `LocalGitPort.commonDirectory`'s plain `resolve`.
    expect(await resolveCanonicalCommonDir(root, port)).toBe(
      main.commonDirectory,
    );
    expect(await resolveCanonicalCommonDir(linked, port)).toBe(
      main.commonDirectory,
    );
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

test("a THROWN inner view still writes the unlocked note before the envelope (QCLI-568 T1)", async () => {
  const { root, linked, cleanup } = await fixture();
  try {
    // Broken mechanism, as in the R1 row: `<main>/.git/quest` is a FILE.
    const questPath = join(root, ".git", "quest");
    await rm(questPath, { recursive: true, force: true });
    await writeFile(questPath, "not a directory\n", "utf8");

    // `--parent NOPE-1` makes the INNER view THROW (RecordValidationError
    // task_not_found) instead of returning a failure envelope. Measured at the
    // pre-fix head: exit 3, stdout empty, and NO note line -- the regression
    // this row pins.
    const result = runQuest(linked, [
      "task",
      "list",
      "--across-refs",
      "--ref",
      "HEAD",
      "--parent",
      "NOPE-1",
      "--json",
    ]);

    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("");
    const lines = result.stderr.split("\n").filter((line) => line.length > 0);
    // The note survives the throw and precedes the envelope.
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^note: .*ran unlocked/u);
    // The JSON envelope is the LAST line.
    expect(JSON.parse(lines[lines.length - 1] ?? "").error_type).toBe(
      "not_found",
    );
  } finally {
    await cleanup();
  }
}, 120_000);

test("the broken-file fixture is caught from the MAIN checkout too (QCLI-568 T1)", async () => {
  const { root, cleanup } = await fixture();
  try {
    const questPath = join(root, ".git", "quest");
    await rm(questPath, { recursive: true, force: true });
    await writeFile(questPath, "not a directory\n", "utf8");

    const result = runQuest(root, [
      "task",
      "list",
      "--across-refs",
      "--ref",
      "HEAD",
      "--json",
    ]);

    expect(result.exitCode).toBe(0);
    const lines = result.stderr.split("\n").filter((line) => line.length > 0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^note: .*ran unlocked/u);
  } finally {
    await cleanup();
  }
}, 120_000);

test("a destroyed stderr cannot mask a thrown view's own error (QCLI-568 NIT 4)", async () => {
  const { root, linked, cleanup } = await fixture();
  const original = process.stderr.write;
  try {
    // Broken mechanism, as in T1: `<main>/.git/quest` is a FILE, so the lock
    // writes one note and then the inner view THROWS on `--parent NOPE-1`.
    const questPath = join(root, ".git", "quest");
    await rm(questPath, { recursive: true, force: true });
    await writeFile(questPath, "not a directory\n", "utf8");

    // Make exactly the note write fail, as a destroyed/EPIPE stderr would.
    process.stderr.write = ((chunk: unknown) => {
      if (String(chunk).startsWith("note: "))
        throw new Error("stderr destroyed");
      return original.call(process.stderr, chunk as string);
    }) as typeof process.stderr.write;

    const result = await withTaskStore(linked, () =>
      runQuestInProcess(
        [
          "task",
          "list",
          "--across-refs",
          "--ref",
          "HEAD",
          "--parent",
          "NOPE-1",
          "--json",
        ],
        false,
        false,
      ),
    );

    // The view's own `not_found` error survives; the stderr write failure does
    // not replace it. And the note is genuinely LOST, which proves the failing
    // write path ran (a passing write would have reported `ran unlocked`).
    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("");
    const lines = result.stderr.split("\n").filter((line) => line.length > 0);
    expect(JSON.parse(lines[lines.length - 1] ?? "").error_type).toBe(
      "not_found",
    );
    expect(result.stderr).not.toContain("ran unlocked");
  } finally {
    process.stderr.write = original;
    await cleanup();
  }
}, 120_000);

/**
 * QCLI-568 Q568-INT B item 2: the read cache (and therefore the whole-result
 * records beside it) is rooted at the SAME canonical common dir the lock uses.
 *
 * The differential is exact: the view's resolver is given a DIFFERENT directory
 * from the Git port's own `commonDirectory`, so the cache can only appear at
 * one of them. Before item 2 the view called `git.commonDirectory` -- a plain
 * `resolve` with no realpath -- which is a second spelling of the same place on
 * every platform where the repository path is not already normalised.
 */
const discovery: RefDiscoveryPort = {
  async origin(): Promise<OriginRemote> {
    return { kind: "github", slug: "opum-ai/fixture" };
  },
  async listOpenPullRequests(): Promise<readonly DiscoveredPullRequest[]> {
    return [];
  },
};

test("the read cache is rooted at the canonical common dir, not the git port's spelling (QCLI-568 B item 2)", async () => {
  const { root, cleanup } = await fixture();
  const canonicalMarker = await realpath(
    await mkdtemp(join(tmpdir(), "qcli568-canonical-")),
  );
  try {
    const git = new LocalGitPort();
    const plain = await git.commonDirectory(root);
    expect(plain).not.toBe(canonicalMarker);

    const view = new AcrossRefsViewService(
      git,
      discovery,
      undefined,
      undefined,
      undefined,
      undefined,
      async () => canonicalMarker,
    );
    const outcome = await view.view({
      repositoryPath: root,
      refs: ["HEAD"],
      allowPartial: false,
    });
    expect(outcome.kind).toBe("view");

    // The cache is under the CANONICAL spelling...
    const manifests = join(
      canonicalMarker,
      "quest",
      "across-refs-cache",
      "manifests",
    );
    expect(existsSync(manifests)).toBe(true);
    expect((await readdir(manifests)).length).toBeGreaterThan(0);
    // ...and NOT under the git port's own spelling.
    expect(existsSync(join(plain, "quest", "across-refs-cache"))).toBe(false);
  } finally {
    await rm(canonicalMarker, { recursive: true, force: true });
    await cleanup();
  }
}, 120_000);

test("in a linked worktree the lock and the cache are ONE canonical spelling (QCLI-568 B item 2)", async () => {
  const { root, linked, cleanup } = await fixture();
  try {
    const port = new LocalWorkspacePort();
    const canonical = await resolveCanonicalCommonDir(linked, port);
    expect(canonical).toBe(await resolveCanonicalCommonDir(root, port));
    // The linked worktree's own `.git` is a FILE (a gitfile), so a cache keyed
    // on either worktree-local root would never be shared by the clone.
    expect(await realpath(join(root, ".git"))).toBe(canonical);

    const result = runQuest(linked, [
      "task",
      "list",
      "--across-refs",
      "--ref",
      "HEAD",
      "--json",
    ]);
    expect(result.exitCode).toBe(0);
    // One spelling: the lock path and the cache directory share the canonical
    // common dir exactly.
    const lockPath = resolveCommonDirLockPath(canonical);
    const cacheDir = join(canonical, "quest", "across-refs-cache");
    expect(lockPath.startsWith(`${join(canonical, "quest")}/`)).toBe(true);
    expect(cacheDir.startsWith(`${join(canonical, "quest")}/`)).toBe(true);
    expect(existsSync(join(cacheDir, "manifests"))).toBe(true);
  } finally {
    await cleanup();
  }
}, 120_000);
