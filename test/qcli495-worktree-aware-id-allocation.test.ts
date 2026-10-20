import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * QCLI-495 (DEC-179 part 1, closing its measurement m1). The allocators were
 * refs-aware only: a record created in a sibling worktree and not yet
 * committed is invisible both to a ref listing and to this checkout's own
 * `.quest`, so two worktrees of one repository each minted N+1 and the merge
 * was an add/add conflict on the same `.quest/tasks/<P>-<N+1>.json`.
 *
 * These run the real CLI in real repositories, as QCLI-279's and QCLI-290's
 * suites do, because the defect lives in the interaction between processes and
 * the filesystem -- a fake Git port would have to reimplement the very thing
 * under test. The lock and the ledger land in `<git-common-dir>/quest/`, which
 * is why the assertions can read them straight off disk.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;

function runQuest(workspace: string, args: readonly string[]) {
  const child = Bun.spawnSync([process.execPath, MAIN, ...args], {
    cwd: workspace,
    env: { ...process.env },
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
  return {
    exitCode: child.exitCode ?? 0,
    stdout: child.stdout ? child.stdout.toString().trim() : "",
    stderr: child.stderr ? child.stderr.toString() : "",
  };
}

/** The same invocation, awaited rather than blocked on, so two of them overlap. */
async function runQuestAsync(workspace: string, args: readonly string[]) {
  const child = Bun.spawn([process.execPath, MAIN, ...args], {
    cwd: workspace,
    env: { ...process.env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { exitCode, stdout, stderr };
}

const ACTOR = ["--actor", "tester", "--actor-kind", "human", "--json"];

/** The command that creates one record of `family`, with a title that makes a
 * failure readable and no `--id`, so the id under test is the allocated one. */
function createArgs(family: string, title: string): readonly string[] {
  return [family, "create", title, ...ACTOR];
}

function created(result: { exitCode: number; stdout: string }): string {
  expect(result.exitCode).toBe(0);
  return (JSON.parse(result.stdout).data as { id: string }).id;
}

function create(workspace: string, family: string, title: string): string {
  return created(runQuest(workspace, createArgs(family, title)));
}

async function createConcurrently(
  workspace: string,
  family: string,
  title: string,
) {
  const result = await runQuestAsync(workspace, createArgs(family, title));
  return created(result);
}

async function gitWorkspace() {
  const root = await mkdtemp(join(tmpdir(), "qcli495-"));
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["config", "user.email", "t@t"]);
  git(root, ["config", "user.name", "t"]);
  runQuest(root, ["init"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-q", "-m", "base"]);
  return root;
}

/** One repository, two worktrees: the exact shape DEC-179's m1 names. */
async function worktreePair() {
  const root = await gitWorkspace();
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

/** Absolute path of a file inside this repository's common Git dir. */
function commonDirFile(workspace: string, name: string): string {
  return join(
    git(workspace, ["rev-parse", "--absolute-git-dir"]).stdout,
    "quest",
    name,
  );
}

function sequenceOf(id: string): number {
  const match = /-(\d+)$/.exec(id);
  if (!match) throw new Error(`Not a canonical id: ${id}`);
  return Number(match[1]);
}

test("a create in a second worktree does not reuse the first worktree's uncommitted id (QCLI-495 AC 2, DEC-179 m1)", async () => {
  const { root, linked, cleanup } = await worktreePair();
  try {
    // Deliberately NOT committed: this is m1's trigger, and the refs-aware
    // scan of either worktree can see no trace of it.
    const first = create(root, "task", "First worktree");
    const second = create(linked, "task", "Second worktree");
    expect(second).not.toBe(first);
    expect(sequenceOf(second)).toBe(sequenceOf(first) + 1);
  } finally {
    await cleanup();
  }
}, 60_000);

test("concurrent creates in two worktrees allocate distinct ids for every id family (QCLI-495 AC 1, AC 3, AC 7)", async () => {
  const { root, linked, cleanup } = await worktreePair();
  try {
    // All four families, because the criterion is about "any id family": a
    // lock that covered tasks but not decisions would pass a task-only suite.
    for (const family of ["task", "draft", "milestone", "decision"]) {
      // Milestones and decisions share `.quest/planning.json`, so two
      // processes writing in ONE worktree race on that file whatever the
      // allocator does (DEC-179 part 3's territory, not this task's). They
      // are therefore launched once per worktree, concurrently ACROSS the
      // two -- which is the shape m1 describes and the one under test.
      const perWorktree = family === "task" || family === "draft" ? 3 : 1;
      const ids = await Promise.all(
        Array.from({ length: perWorktree }, (_unused, n) => n).flatMap((n) => [
          createConcurrently(root, family, `${family} ${n} in main`),
          createConcurrently(linked, family, `${family} ${n} in linked`),
        ]),
      );
      // Named per family so a failure says WHICH family collided.
      expect({ family, distinct: new Set(ids).size }).toEqual({
        family,
        distinct: ids.length,
      });
    }
  } finally {
    await cleanup();
  }
}, 180_000);

test("concurrent questions in two worktrees allocate distinct ids (QCLI-495, the family QCLI-445 added after the criteria were written)", async () => {
  const { root, linked, cleanup } = await worktreePair();
  try {
    const ids = await Promise.all(
      [root, linked, root, linked].map(async (workspace, n) =>
        created(
          await runQuestAsync(workspace, [
            "question",
            "ask",
            "--title",
            `Question ${n}`,
            "--option",
            "A=Yes:Do it",
            "--option",
            "B=No:Do not",
            "--recommend",
            "A",
            ...ACTOR,
          ]),
        ),
      ),
    );
    expect(new Set(ids).size).toBe(ids.length);
  } finally {
    await cleanup();
  }
}, 60_000);

test("auto-allocated ids cross a digit boundary numerically, never by characters (QCLI-495 AC 8)", async () => {
  const root = await gitWorkspace();
  try {
    const seed = create(root, "task", "seed for the prefix");
    const prefix = seed.slice(0, seed.lastIndexOf("-"));
    for (const [low, high] of [
      [9, 10],
      [99, 100],
    ] as const) {
      // Explicit ids so the boundary is set up exactly, then one auto id that
      // must step PAST it: a string sort reads `${prefix}-9` as greater than
      // `${prefix}-10` and hands back the id that already exists.
      runQuest(root, [
        "task",
        "create",
        `${prefix}-${low}`,
        "--id",
        `${prefix}-${low}`,
        ...ACTOR,
      ]);
      runQuest(root, [
        "task",
        "create",
        `${prefix}-${high}`,
        "--id",
        `${prefix}-${high}`,
        ...ACTOR,
      ]);
      expect(create(root, "task", `after ${high}`)).toBe(
        `${prefix}-${high + 1}`,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a .quest with no Git repository behind it allocates exactly as before (QCLI-495 AC 6)", async () => {
  const store = await mkdtemp(join(tmpdir(), "qcli495-plain-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    const first = create(store, "task", "First plain task");
    const second = create(store, "task", "Second plain task");
    expect(sequenceOf(second)).toBe(sequenceOf(first) + 1);
    // No Git, so there is no common dir to lock and no ledger to keep: this
    // path must not have created one beside the store.
    const stray = await readFile(join(store, "reserved-ids"), "utf8").catch(
      () => null,
    );
    expect(stray).toBeNull();
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
}, 60_000);

test("an abandoned allocation lock is broken, and the run says so (QCLI-495 AC 5)", async () => {
  const root = await gitWorkspace();
  try {
    const lockPath = commonDirFile(root, "alloc.lock");
    await mkdir(dirname(lockPath), { recursive: true });
    // A pid that cannot be alive, and an age past the 30s window: both halves
    // of the stale rule, which is what makes breaking it safe to do.
    await writeFile(lockPath, `${999_999}\n${Date.now() - 60_000}\n`, "utf8");
    const result = runQuest(root, createArgs("task", "after the stale lock"));
    expect(result.exitCode).toBe(0);
    const id = (JSON.parse(result.stdout).data as { id: string }).id;
    expect(id).toBe("T-1");
    expect(result.stderr).toContain("broke a stale id allocation lock");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a reservation is dropped once its record is visible (QCLI-495 AC 4)", async () => {
  const root = await gitWorkspace();
  try {
    const ledgerPath = commonDirFile(root, "reserved-ids");
    const first = create(root, "task", "First");
    // Between allocation and the record's appearance the ledger is the only
    // thing holding this id, which is why it is written before the record is.
    expect(await readFile(ledgerPath, "utf8")).toContain(`"id":"${first}"`);
    // The record now exists in the working tree, so the reservation is spent
    // and the next allocation drops it while reserving its own id.
    const second = create(root, "task", "Second");
    const ledger = await readFile(ledgerPath, "utf8");
    expect(ledger).not.toContain(`"id":"${first}"`);
    expect(ledger).toContain(`"id":"${second}"`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a reservation older than 7 days is dropped, and a younger one still counts (QCLI-495 AC 4)", async () => {
  const root = await gitWorkspace();
  try {
    const ledgerPath = commonDirFile(root, "reserved-ids");
    await mkdir(dirname(ledgerPath), { recursive: true });
    const day = 24 * 60 * 60 * 1000;
    // T-50 was reserved 8 days ago and never became a record: it must not
    // hold the counter. T-60 was reserved an hour ago and still must.
    await writeFile(
      ledgerPath,
      `${JSON.stringify({ id: "T-50", at: Date.now() - 8 * day })}\n${JSON.stringify({ id: "T-60", at: Date.now() - 3_600_000 })}\n`,
      "utf8",
    );
    const id = create(root, "task", "After the ledger");
    expect(id).toBe("T-61");
    const ledger = await readFile(ledgerPath, "utf8");
    expect(ledger).not.toContain('"id":"T-50"');
    expect(ledger).toContain('"id":"T-60"');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("allocation runs no fetch and reaches for no remote, even with one configured (QCLI-495 AC 5)", async () => {
  const root = await gitWorkspace();
  let traceFile = "";
  try {
    // A remote that cannot be reached: any network use would fail or stall.
    git(root, ["remote", "add", "origin", "https://127.0.0.1:9/never.git"]);
    // Quest pipes git's stderr, so the trace goes to a file instead.
    traceFile = join(await mkdtemp(join(tmpdir(), "qcli495-trace-")), "t");
    const child = Bun.spawnSync(
      [process.execPath, MAIN, ...createArgs("task", "offline")],
      {
        cwd: root,
        env: { ...process.env, GIT_TRACE: traceFile },
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    expect(child.exitCode).toBe(0);
    const trace = await readFile(traceFile, "utf8");
    // The trace must have been read: an empty one would pass the next checks
    // for the wrong reason.
    expect(trace).toContain("trace: built-in: git");
    expect(trace).not.toMatch(/\b(fetch|ls-remote|pull|push|remote-https?)\b/);
  } finally {
    if (traceFile)
      await rm(dirname(traceFile), { recursive: true, force: true });
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
