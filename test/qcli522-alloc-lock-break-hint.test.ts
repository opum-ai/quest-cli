import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
 * unreadable fixture is a zero-byte break file -- exactly what a breaker
 * killed between creating the file and writing it leaves -- which is never
 * auto-cleared, so the lock's staleness and the timeout are both real.
 *
 * The mutation control (recorded on the task): deleting the break-file clause
 * from {@link allocationLockTimeoutHint} turns the two break-file text tests
 * red and leaves the no-break-file test and the wiring tests' exit codes
 * green.
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
  expect(hint).toContain("pid 4242 is not a quest process");
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

test("an unreadable break holder is reported as unreadable and blocks the removal", () => {
  const error = new IdAllocationLockTimeoutError(
    "/repo/.git/quest/alloc.lock",
    999_999,
    5000,
    10_000,
    "/repo/.git/quest/alloc.lock.break",
    true,
    null,
    false,
  );
  const hint = allocationLockTimeoutHint(error);
  expect(hint).toContain("/repo/.git/quest/alloc.lock.break");
  expect(hint).toContain("unreadable");
  expect(hint).toContain("NOT safe");
  expect(hint).toContain("never removes or clears it");
});

interface Workspace {
  readonly work: string;
  readonly lockPath: string;
  readonly breakPath: string;
}

async function createWorkspace(): Promise<Workspace> {
  const root = await mkdtemp(join(tmpdir(), "qcli522-"));
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
    expect(error.hint).toContain("NOT safe");
    expect(error.input.breakFilePresent).toBe(true);
    expect(error.input.breakHolderPid).toBeUndefined();
    // The break file is still there: this path never clears it.
    expect(await readFile(workspace.breakPath, "utf8")).toBe("");
  } finally {
    await rm(join(workspace.work, ".."), { recursive: true, force: true });
  }
}, 60_000);
