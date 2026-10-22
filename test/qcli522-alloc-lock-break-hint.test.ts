import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  allocationLockTimeoutHint,
  IdAllocationLockTimeoutError,
} from "../src/application/tasks/id-allocation.ts";
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
    "No break file exists at /repo/.git/quest/alloc.lock.break",
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
  expect(hint).toContain("/repo/.git/quest/alloc.lock.break");
  expect(hint).toContain("LIVE pid 5151");
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
  expect(hint).toContain("/repo/.git/quest/alloc.lock.break");
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
  expect(hint).toContain("Remove /repo/.git/quest/alloc.lock.break first");
  expect(hint).toContain("this command never clears it");
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
    expect(error.hint).toContain(workspace.breakPath);
    expect(error.hint).toContain(`LIVE pid ${process.pid}`);
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
    expect(error.hint).toContain(workspace.breakPath);
    expect(error.hint).toContain("unreadable");
    expect(error.hint).toContain("its holder cannot be determined");
    expect(error.hint).toContain("no quest process is running");
    expect(error.hint).toContain("older than 10s");
    expect(error.hint).toContain("NOT safe");
    expect(error.input.breakFilePresent).toBe(true);
    expect(error.input.breakHolderPid).toBeUndefined();
    // The age the hint conditions removal on is carried on the wire.
    expect(typeof error.input.breakFileStampedMillisecondsAgo).toBe("number");
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
    expect(error.hint).toContain(workspace.breakPath);
    expect(error.hint).toContain(`pid ${deadPid}, which is not running`);
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
