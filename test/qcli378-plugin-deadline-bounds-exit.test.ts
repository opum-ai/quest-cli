import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * QCLI-378: the plugin list deadline must bound when the quest PROCESS exits,
 * not only when the adapter's promise settles. A runtime whose backgrounded
 * grandchild holds stdout and stderr kept quest alive until the grandchild
 * ended (measured at origin/dev f21783a: settled at 2.0s, exited at 12.1s).
 * Cancelling the pipe readers alone gets the exit back on time but leaves the
 * grandchild running; only killing the process group reaps it. lore-cli
 * fixed the same defect in dc09ca98 (opum-ai/lore-cli#291).
 *
 * The test times the real CLI's exit, with QUEST_AGENT_PLUGINS_TIMEOUT_MS
 * shortening the 15s default so the run stays fast.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");
const deadlineMs = 500;
const grandchildLifetimeS = 20;

let root: string;
let bin: string;
let pidFile: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "qcli378-"));
  bin = join(root, ".fake-bin");
  pidFile = join(root, ".grandchild.pid");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  const pid = await grandchildPid();
  if (pid !== undefined && alive(pid)) process.kill(pid, "SIGKILL");
  await rm(root, { recursive: true, force: true });
});

async function grandchildPid(): Promise<number | undefined> {
  try {
    return Number((await readFile(pidFile, "utf8")).trim());
  } catch {
    return undefined;
  }
}

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/** Runs `quest agents --check --target codex` against a fake codex that
 * ignores TERM, backgrounds a grandchild inheriting both pipes, records its
 * pid, then blocks: the codex Node launcher's shape. `ownGroup` puts the
 * grandchild in a process group of its own, out of reach of a group kill.
 * That uses perl's setpgrp, not `set -m`: job control in a non-interactive
 * /bin/sh does not move a background job on Ubuntu's dash (measured on the
 * CI runner, where the group kill still reached it). */
async function checkAgainstHangingRuntime(ownGroup: boolean) {
  const script = `#!/bin/sh
trap '' TERM
${ownGroup ? `perl -e 'setpgrp(0, 0); sleep ${grandchildLifetimeS}' &` : `sleep ${grandchildLifetimeS} &`}
echo $! > "${pidFile}"
sleep ${grandchildLifetimeS}
`;
  await writeFile(join(bin, "codex"), script);
  await chmod(join(bin, "codex"), 0o755);

  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
    QUEST_AGENT_PLUGINS_TIMEOUT_MS: String(deadlineMs),
  };
  delete env.QUEST_AGENT_PLUGINS;
  delete env.QUEST_TASK_STORE;
  const started = Date.now();
  const child = Bun.spawn(
    [
      process.execPath,
      source,
      "agents",
      "--check",
      "--target",
      "codex",
      "--json",
    ],
    { cwd: root, stdout: "pipe", stderr: "pipe", env },
  );
  const [exitCode, stdout] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
  ]);
  const elapsed = Date.now() - started;
  return { exitCode, stdout, elapsed };
}

test("a grandchild holding the pipes neither outlives the deadline nor keeps quest alive past it", async () => {
  const { exitCode, stdout, elapsed } = await checkAgainstHangingRuntime(false);
  expect(JSON.parse(stdout).data.plugin).toMatchObject({
    state: "not-detectable",
    reason: `codex plugin list --json did not finish within ${deadlineMs / 1000}s.`,
  });
  expect(exitCode).toBe(0);
  // The process itself exits near the deadline, far short of the grandchild.
  expect(elapsed).toBeLessThan(5000);
  const pid = await grandchildPid();
  expect(pid).toBeNumber();
  expect(alive(pid as number)).toBe(false);
}, 30_000);

test("a grandchild the group kill cannot reach still does not keep quest alive past the deadline", async () => {
  // Cancelling the pipe readers is what bounds the exit here: the grandchild
  // runs in its own process group, so it survives (afterEach reaps it). The
  // alive assertion is the precondition that the escape really happened.
  const { exitCode, stdout, elapsed } = await checkAgainstHangingRuntime(true);
  expect(JSON.parse(stdout).data.plugin).toMatchObject({
    state: "not-detectable",
  });
  expect(exitCode).toBe(0);
  expect(elapsed).toBeLessThan(5000);
  const pid = await grandchildPid();
  expect(pid).toBeNumber();
  expect(alive(pid as number)).toBe(true);
}, 30_000);
