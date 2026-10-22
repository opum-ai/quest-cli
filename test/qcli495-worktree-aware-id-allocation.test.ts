import { spawnSync } from "node:child_process";
import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
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

function created(result: {
  exitCode: number;
  stdout: string;
  stderr?: string;
}): string {
  // Name the refusal: a bare exit code says nothing about WHICH create lost.
  if (result.exitCode !== 0)
    throw new Error(
      `create exited ${result.exitCode}: ${result.stderr ?? "(no stderr)"}`,
    );
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

/** A pid that is certainly gone: a child spawned and reaped here. A fixed
 * number is dead on macOS (pid_max 99998) but can be live on a Linux runner. */
const deadPid = (() => {
  const child = spawnSync(process.execPath, ["--version"]);
  if (child.pid === undefined) throw new Error("could not spawn a child");
  return child.pid;
})();

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
      // One create per worktree per round, the two launched together: the
      // shape m1 describes. Two creates in ONE worktree are not used, because
      // they race the tracker's own revision check whatever the allocator does
      // (exit 5, a conflict and not a collision): the first version of this
      // test did that and failed on a loaded CI runner. Neither worktree can
      // see the other's uncommitted record, so without the lock and ledger the
      // pair collides in the runs measured (3 of 3 red), though that is evidence and not a guarantee.
      const ids: string[] = [];
      for (let round = 0; round < 3; round += 1) {
        ids.push(
          ...(await Promise.all([
            createConcurrently(root, family, `${family} ${round} in main`),
            createConcurrently(linked, family, `${family} ${round} in linked`),
          ])),
        );
      }
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
    const ask = async (workspace: string, n: number) =>
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
      );
    // One per worktree per round, for the reason the every-family test gives.
    const ids: string[] = [];
    for (let round = 0; round < 2; round += 1)
      ids.push(...(await Promise.all([ask(root, round), ask(linked, round)])));
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
    // No Git, so there is no common dir to lock and no ledger to keep. The
    // ledger and the lock live at `<common-dir>/quest/...`, so that is the
    // path a broken non-Git branch would write if it took the store for a
    // common dir -- the first version read `<store>/reserved-ids`, which the
    // code never writes even when it is broken.
    for (const name of ["reserved-ids", "alloc.lock"]) {
      expect(
        await readFile(join(store, "quest", name), "utf8").catch(() => null),
      ).toBeNull();
    }
    expect(await readdir(store).then((names) => names.includes("quest"))).toBe(
      false,
    );
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
    await writeFile(lockPath, `${deadPid}\n${Date.now() - 60_000}\n`, "utf8");
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
      `${JSON.stringify({ id: "T-50", at: Date.now() - 8 * day, family: "task" })}\n${JSON.stringify({ id: "T-60", at: Date.now() - 3_600_000, family: "task" })}\n`,
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
    const network = /\b(fetch|ls-remote|pull|push|remote-https?)\b/;
    expect(trace).not.toMatch(network);
    // Positive control: the same trace and the same pattern DO catch a
    // deliberate fetch, so the absence above is the allocator's and not a
    // pattern that matches nothing.
    const controlTrace = join(dirname(traceFile), "control");
    Bun.spawnSync(["git", "fetch", "origin"], {
      cwd: root,
      env: { ...process.env, GIT_TRACE: controlTrace },
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(await readFile(controlTrace, "utf8")).toMatch(network);
  } finally {
    if (traceFile)
      await rm(dirname(traceFile), { recursive: true, force: true });
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("an isolated worktree scan: an uncommitted --id record in one worktree raises the floor in another, with no ledger entry to help (QCLI-495 round 1, finding 4)", async () => {
  const { root, linked, cleanup } = await worktreePair();
  try {
    // `--id` takes no lock and writes no ledger entry (idForCreate), so the
    // ONLY thing that can tell the other worktree about T-5 is the scan of that
    // worktree's own, uncommitted `.quest`.
    const explicit = runQuest(root, [
      "task",
      "create",
      "Explicit",
      "--id",
      "T-5",
      ...ACTOR,
    ]);
    expect(explicit.exitCode).toBe(0);
    const ledger = await readFile(
      commonDirFile(root, "reserved-ids"),
      "utf8",
    ).catch(() => "");
    expect(ledger).not.toContain("T-5");
    expect(create(linked, "task", "Auto in the other worktree")).toBe("T-6");
  } finally {
    await cleanup();
  }
}, 60_000);

test("after a stale lock is broken, concurrent creates in two worktrees still get distinct ids (QCLI-495 round 1, finding 1)", async () => {
  const { root, linked, cleanup } = await worktreePair();
  try {
    const lockPath = commonDirFile(root, "alloc.lock");
    await mkdir(dirname(lockPath), { recursive: true });
    await writeFile(lockPath, `${deadPid}\n${Date.now() - 60_000}\n`, "utf8");
    const ids: string[] = [];
    for (let round = 0; round < 3; round += 1)
      ids.push(
        ...(await Promise.all([
          createConcurrently(root, "task", `main ${round}`),
          createConcurrently(linked, "task", `linked ${round}`),
        ])),
      );
    expect(new Set(ids).size).toBe(ids.length);
  } finally {
    await cleanup();
  }
}, 60_000);

test("a live holder that never lets go makes a create fail as a conflict whose hint names the lock, the pid and the way out (QCLI-495 round 1, finding 6)", async () => {
  const root = await gitWorkspace();
  try {
    const lockPath = commonDirFile(root, "alloc.lock");
    await mkdir(dirname(lockPath), { recursive: true });
    // The test process is the holder: alive, so the stale rule never breaks it.
    await writeFile(lockPath, `${process.pid}\n${Date.now()}\n`, "utf8");
    const result = await runQuestAsync(root, createArgs("task", "blocked"));
    expect(result.exitCode).toBe(5);
    const body = JSON.parse(result.stderr) as {
      error_type: string;
      message: string;
      hint: string;
      input?: { lockPath?: string; holderPid?: number };
    };
    expect(body.error_type).toBe("conflict");
    expect(body.message).toContain(lockPath);
    expect(body.message).toContain(`pid ${process.pid}`);
    expect(body.message).not.toMatch(/held (it )?for/u);
    expect(body.hint).toContain(lockPath);
    expect(body.hint).toContain(`pid ${process.pid}`);
    expect(body.hint).toContain(
      `no process with pid ${process.pid} is running`,
    );
    expect(body.input?.holderPid).toBe(process.pid);
    // The live holder's lock was not touched, and nothing was created.
    expect(await readFile(lockPath, "utf8")).toStartWith(`${process.pid}\n`);
    expect(
      await readdir(join(root, ".quest", "tasks"))
        .catch(() => [] as string[])
        .then((names) => names.filter((name) => name.endsWith(".json"))),
    ).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
