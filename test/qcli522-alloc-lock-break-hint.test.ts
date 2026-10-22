import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  allocateId,
  allocationLockTimeoutHint,
  breakStaleLock,
  IdAllocationLockTimeoutError,
  type LockReadIo,
} from "../src/application/tasks/id-allocation.ts";
import type { GitPort } from "../src/ports/git.ts";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-522: the allocation-lock timeout hint must report `alloc.lock.break`.
 *
 * Two halves, because the defect had two:
 *
 *  - the TEXT is asserted directly through {@link allocationLockTimeoutHint},
 *    which is why that function exists -- the alternative is a ten-second
 *    spawn per assertion, and the text is the thing the acceptance criteria
 *    are about;
 *  - the WIRING is asserted end to end, by planting a real `alloc.lock` beside
 *    a real `alloc.lock.break` in a real repository and reading what
 *    `quest task create` prints. A hint builder nothing calls would satisfy
 *    the first half alone.
 *
 * The live-pid fixture uses the TEST process's own pid, so "live" is a fact
 * about a running process rather than a number that happens to be high. The
 * unreadable fixture is a zero-byte break file -- equally what a breaker
 * killed between creating the file and writing it leaves AND what a LIVE
 * breaker mid-write looks like, which is why the hint says the holder cannot
 * be determined and conditions removal on process quiescence and age. The
 * dead-pid fixture is a break file naming a child that has been spawned and
 * reaped, so "not running" is measured rather than assumed.
 *
 * The mutation control (recorded on the task): each break-file branch of
 * {@link allocationLockTimeoutHint} is mutated on its own and the tests that
 * go red are counted. Deleting the unreadable-holder branch and deleting the
 * dead-holder branch each turn their own text and end-to-end cases red, so
 * neither branch can be removed with the suite staying green.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "t", "--actor-kind", "human"] as const;

interface Run {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(cwd: string, argv: readonly string[]): Run {
  return runCommand([...argv], {
    cwd,
    env: { ...process.env, QUEST_AGENT_PLUGINS: "off" },
  });
}

function git(cwd: string, ...args: readonly string[]): string {
  const result = run(cwd, ["git", ...args]);
  if (result.exitCode !== 0)
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}

const quest = (cwd: string, args: readonly string[]): Run =>
  run(cwd, [process.execPath, MAIN, ...args]);

function questOk(cwd: string, args: readonly string[]): Run {
  const result = quest(cwd, [...args, "--json"]);
  expect({ args, exitCode: result.exitCode, stderr: result.stderr }).toEqual({
    args,
    exitCode: 0,
    stderr: "",
  });
  return result;
}

/** A pid that is certainly gone: a child this process spawned and reaped. */
const deadPid = (() => {
  const child = spawnSync(process.execPath, ["--version"]);
  if (child.pid === undefined) throw new Error("could not spawn a child");
  return child.pid;
})();

test("with no break file the hint says so and names the safe condition", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    4242,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    false,
    null,
    false,
  );
  const hint = allocationLockTimeoutHint(error);
  expect(hint).toContain(
    "No break file exists at /repo/.git/quest/alloc.lock.break.",
  );
  expect(hint).toContain("removing /repo/.git/quest/alloc.lock is safe only");
  // Existence only: the module cannot say a pid BELONGS to quest.
  expect(hint).toContain("no process with pid 4242 is running");
  expect(hint).not.toContain("is not a quest process");
});

test("a LIVE break holder makes the hint name the break file and refuse the removal", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    4242,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    true,
    5151,
    true,
  );
  const hint = allocationLockTimeoutHint(error);
  // The exact clause, not a bare path: a path that is a SUBSTRING of the one
  // reported must not pass (QCLI-528, N7).
  expect(hint).toContain(
    "A break file EXISTS at /repo/.git/quest/alloc.lock.break, held by LIVE pid 5151.",
  );
  expect(hint).toContain("NOT safe");
  // Any statement about removing the lock is conditioned on there being no
  // live break holder -- never an unconditional "safe to remove".
  expect(hint).toContain("safe only when no live break holder exists");
});

test("an unreadable break holder is not given a cause, and removing it is conditional on quiescence and age", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    999_999,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    true,
    null,
    false,
    60_000,
  );
  const hint = allocationLockTimeoutHint(error);
  expect(hint).toContain(
    "A break file EXISTS at /repo/.git/quest/alloc.lock.break and its holder cannot be determined (it was written 60s ago)",
  );
  expect(hint).toContain("its holder cannot be determined");
  // MAJOR-1: the hint must not assert the killed-breaker cause -- an empty
  // file is equally a LIVE breaker between creating it and writing its pid.
  expect(hint).not.toContain("killed between creating and writing it");
  expect(hint).toContain("unreadable");
  expect(hint).toContain("it was written 60s ago");
  expect(hint).toContain("no quest process is running");
  expect(hint).toContain("older than 10s");
  expect(hint).toContain("never removes or clears it");
  expect(hint).toContain("NOT safe");
});

test("an unreadable break file inside the write window is called possibly live, not removable", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    999_999,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    true,
    null,
    false,
    1_000,
  );
  const hint = allocationLockTimeoutHint(error);
  expect(hint).toContain("its holder cannot be determined");
  expect(hint).toContain("may be a LIVE breaker mid-write");
  expect(hint).toContain("retry shortly");
  expect(hint).toContain("no quest process is running");
  expect(hint).toContain("older than 10s");
});

test("a readable break pid that is NOT alive is named as not running and removal is advised", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    4242,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    true,
    777_777,
    false,
    60_000,
  );
  const hint = allocationLockTimeoutHint(error);
  expect(hint).toContain("held by pid 777777, which is not running");
  // QCLI-528, N6: pid reuse can make a break file naming a dead pid another
  // process's, so the advice is conditional on the file still naming that pid.
  expect(hint).toContain(
    "Remove /repo/.git/quest/alloc.lock.break first if it still names pid 777777",
  );
  expect(hint).toContain("this command never clears it");
});

/**
 * QCLI-528: run the allocator IN PROCESS with injected lock reads, against a
 * lock this live process holds, and return the timeout it raises. The clock is
 * fake and `sleep` advances it, so the ten-second wait costs no wall time and
 * the stat-then-read window is driven exactly rather than raced.
 */
async function timeoutWithReadIo(lockReadIo: LockReadIo): Promise<{
  readonly timeout: IdAllocationLockTimeoutError;
  readonly breakPath: string;
}> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli528-")));
  const questDirectory = join(root, "quest");
  const lockPath = join(questDirectory, "alloc.lock");
  const breakPath = `${lockPath}.break`;
  try {
    await mkdir(questDirectory, { recursive: true });
    // This process is the lock holder, so the stale rule never breaks it.
    await writeFile(lockPath, `${process.pid}\n${Date.now()}\n`, "utf8");
    await writeFile(breakPath, `${process.pid}\n${Date.now()}\n`, "utf8");
    let clock = 1_000_000;
    const failure = await allocateId({
      git: { listWorktrees: async () => [root] } as unknown as GitPort,
      worktreeRoot: root,
      commonDirectory: root,
      marker: "T-",
      family: "task",
      recordDirectories: ["tasks"],
      visibleIds: [],
      processId: process.pid,
      now: () => clock,
      sleep: async (milliseconds) => {
        clock += milliseconds * 40;
      },
      lockReadIo,
    }).then(
      () => null,
      (error: unknown) => error,
    );
    expect(failure).toBeInstanceOf(IdAllocationLockTimeoutError);
    return { timeout: failure as IdAllocationLockTimeoutError, breakPath };
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("a break file that cannot be STAT'd is reported PRESENT with an unreadable age, never absent (QCLI-528, N2)", async () => {
  const { timeout, breakPath } = await timeoutWithReadIo({
    stat: async (path) => {
      if (path.endsWith(".break"))
        throw Object.assign(new Error("EACCES: permission denied"), {
          code: "EACCES",
        });
      return stat(path);
    },
    readFile: (path) => readFile(path, "utf8"),
  });
  // PRESENT, not absent: the defect was collapsing EACCES into ENOENT, and
  // "absent" is the branch that tells an operator the lock is safe to remove.
  expect(timeout.breakFilePresent).toBe(true);
  expect(timeout.breakHolderPid).toBeNull();
  expect(timeout.breakFileAgeMilliseconds).toBeNull();
  const hint = allocationLockTimeoutHint(timeout);
  expect(hint).toContain(
    `A break file EXISTS at ${breakPath} and its holder cannot be determined (its age could not be read)`,
  );
  expect(hint).not.toContain(`No break file exists at ${breakPath}`);
});

test("a break file removed between the stat and the read is reported ABSENT by the hint (QCLI-528, N1)", async () => {
  const { timeout, breakPath } = await timeoutWithReadIo({
    stat: (path) => stat(path),
    readFile: (path) =>
      path.endsWith(".break")
        ? Promise.reject(
            Object.assign(new Error("ENOENT: no such file or directory"), {
              code: "ENOENT",
            }),
          )
        : readFile(path, "utf8"),
  });
  // stat succeeded and the read then said ENOENT: the file was REMOVED in the
  // window, which is absence -- the one state that licenses removing the lock.
  expect(timeout.breakFilePresent).toBe(false);
  expect(timeout.breakHolderPid).toBeNull();
  expect(timeout.breakFileAgeMilliseconds).toBeNull();
  expect(allocationLockTimeoutHint(timeout)).toContain(
    `No break file exists at ${breakPath}.`,
  );
});

test("a lock that cannot be STAT'd is never judged stale or removed (QCLI-528, N2)", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli528-stale-")));
  try {
    const questDirectory = join(root, "quest");
    await mkdir(questDirectory, { recursive: true });
    const lockPath = join(questDirectory, "alloc.lock");
    // Stale by BOTH halves of the rule -- dead pid and past the 30s window --
    // so only the unreadable stat can save it.
    const content = `${deadPid}\n${Date.now() - 60_000}\n`;
    await writeFile(lockPath, content, "utf8");
    const broke = await breakStaleLock(lockPath, () => Date.now(), {
      readIo: {
        stat: async () => {
          throw Object.assign(new Error("EACCES: permission denied"), {
            code: "EACCES",
          });
        },
        readFile: (path) => readFile(path, "utf8"),
      },
    });
    expect(broke).toBe(false);
    expect(await readFile(lockPath, "utf8")).toBe(content);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

interface Workspace {
  readonly work: string;
  readonly lockPath: string;
  readonly breakPath: string;
}

async function createWorkspace(): Promise<Workspace> {
  // realpath: on macOS tmpdir() sits behind the /var -> /private/var symlink
  // and the CLI reports realpath'd paths. A lexical root happens to pass the
  // substring assertions on macOS (/var is a suffix of /private/var) but is
  // the wrong path, and would fail anywhere the symlink is shaped differently
  // (QCLI-522 round 1, MINOR 4).
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli522-")));
  const work = join(root, "work");
  git(root, "init", "-q", "-b", "dev", work);
  git(work, "config", "user.email", "t@example.invalid");
  git(work, "config", "user.name", "T");
  questOk(work, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
  const common = git(work, "rev-parse", "--git-common-dir");
  const absolute = common.startsWith("/") ? common : join(work, common);
  const questDirectory = join(absolute, "quest");
  await mkdir(questDirectory, { recursive: true });
  return {
    work,
    lockPath: join(questDirectory, "alloc.lock"),
    breakPath: join(questDirectory, "alloc.lock.break"),
  };
}

test("end to end: a live-pid break file is named in the hint, and removing the lock is refused", async () => {
  const workspace = await createWorkspace();
  try {
    const now = Date.now();
    // The lock holder is this test process -- alive for the whole run, so
    // the allocator cannot break the lock and must time out.
    await writeFile(workspace.lockPath, `${process.pid}\n${now}\n`, "utf8");
    await writeFile(workspace.breakPath, `${process.pid}\n${now}\n`, "utf8");

    const result = quest(workspace.work, [
      "task",
      "create",
      "blocked by a live breaker",
      ...ACTOR,
      "--json",
    ]);
    expect(result.exitCode).toBe(5);
    const error = JSON.parse(result.stderr) as {
      error_type: string;
      hint: string;
      input: Record<string, unknown>;
    };
    expect(error.error_type).toBe("conflict");
    // The exact clause, so a path that is only a substring cannot pass
    // (QCLI-528, N7).
    expect(error.hint).toContain(
      `A break file EXISTS at ${workspace.breakPath}, held by LIVE pid ${process.pid}.`,
    );
    expect(error.hint).toContain("NOT safe");
    expect(error.input.breakFilePresent).toBe(true);
    expect(error.input.breakHolderPid).toBe(process.pid);
    // Nothing was cleared, and nothing was written.
    expect(await readFile(workspace.breakPath, "utf8")).toBe(
      `${process.pid}\n${now}\n`,
    );
    expect(await readFile(workspace.lockPath, "utf8")).toBe(
      `${process.pid}\n${now}\n`,
    );
  } finally {
    await rm(join(workspace.work, ".."), { recursive: true, force: true });
  }
}, 60_000);

test("end to end: an unreadable break file blocks breaking a stale lock and says so", async () => {
  const workspace = await createWorkspace();
  try {
    const now = Date.now();
    // A STALE lock (dead pid, stamp past the 30s window) that a breaker
    // would normally clear -- and a zero-byte break file, which is never
    // auto-cleared and refuses the break.
    await writeFile(
      workspace.lockPath,
      `${deadPid}\n${now - 60_000}\n`,
      "utf8",
    );
    await writeFile(workspace.breakPath, "", "utf8");
    // QCLI-528, N4: a zero-byte break file has no stamp, so its age comes from
    // its MTIME. Pin it 60s back: the reported age must be that mtime, and the
    // hint must take the AGED branch rather than the write-window one (N8).
    const breakMtime = now - 60_000;
    await utimes(
      workspace.breakPath,
      new Date(breakMtime),
      new Date(breakMtime),
    );

    const result = quest(workspace.work, [
      "task",
      "create",
      "blocked by an unreadable breaker",
      ...ACTOR,
      "--json",
    ]);
    expect(result.exitCode).toBe(5);
    const error = JSON.parse(result.stderr) as {
      error_type: string;
      hint: string;
      input: Record<string, unknown>;
    };
    expect(error.error_type).toBe("conflict");
    expect(error.hint).toContain(
      `A break file EXISTS at ${workspace.breakPath} and its holder cannot be determined (it was written `,
    );
    expect(error.hint).toContain("its holder cannot be determined");
    // QCLI-528, N8: both unreadable branches share the quiescence and age
    // clauses, so only branch-specific wording can tell which one ran. A file
    // 60s old is outside the write window, so the AGED branch must be the one.
    expect(error.hint).toContain(
      "an empty or unreadable file may be a breaker killed before writing its pid",
    );
    expect(error.hint).not.toContain("may be a LIVE breaker mid-write");
    expect(error.hint).toContain("no quest process is running");
    expect(error.hint).toContain("older than 10s");
    expect(error.hint).toContain("NOT safe");
    expect(error.input.breakFilePresent).toBe(true);
    expect(error.input.breakHolderPid).toBeUndefined();
    // QCLI-528, N4: the age is carried on the wire under a name that does not
    // claim a stamp, and for a zero-byte file it is measured from the MTIME
    // set above (60s before the write, ~10s more by the timeout).
    expect(error.input.breakFileStampedMillisecondsAgo).toBeUndefined();
    expect(error.input.breakFileAgeMilliseconds as number).toBeGreaterThan(
      65_000,
    );
    expect(error.input.breakFileAgeMilliseconds as number).toBeLessThan(
      120_000,
    );
    // The break file is still there: this path never clears it.
    expect(await readFile(workspace.breakPath, "utf8")).toBe("");
  } finally {
    await rm(join(workspace.work, ".."), { recursive: true, force: true });
  }
}, 60_000);

test("end to end: a readable break pid that is not running is named, and the break file is untouched", async () => {
  const workspace = await createWorkspace();
  try {
    const now = Date.now();
    // The LOCK holder is this test process -- alive for the whole run, so the
    // allocator can neither break the lock nor reach takeBreakFile and clear
    // the break file. The break file names a pid that has been spawned and
    // reaped, so "not running" is measured rather than a number that happens
    // to be high.
    await writeFile(workspace.lockPath, `${process.pid}\n${now}\n`, "utf8");
    await writeFile(workspace.breakPath, `${deadPid}\n${now}\n`, "utf8");

    const result = quest(workspace.work, [
      "task",
      "create",
      "blocked by a dead breaker",
      ...ACTOR,
      "--json",
    ]);
    expect(result.exitCode).toBe(5);
    const error = JSON.parse(result.stderr) as {
      error_type: string;
      hint: string;
      input: Record<string, unknown>;
    };
    expect(error.error_type).toBe("conflict");
    expect(error.hint).toContain(
      `A break file EXISTS at ${workspace.breakPath}, held by pid ${deadPid}, which is not running.`,
    );
    expect(error.hint).toContain(
      `Remove ${workspace.breakPath} first if it still names pid ${deadPid}`,
    );
    expect(error.input.breakFilePresent).toBe(true);
    expect(error.input.breakHolderPid).toBe(deadPid);
    // This path never clears the break file, and never touches the lock.
    expect(await readFile(workspace.breakPath, "utf8")).toBe(
      `${deadPid}\n${now}\n`,
    );
    expect(await readFile(workspace.lockPath, "utf8")).toBe(
      `${process.pid}\n${now}\n`,
    );
  } finally {
    await rm(join(workspace.work, ".."), { recursive: true, force: true });
  }
}, 60_000);
