import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * QCLI-567 / DEC-282 (a1) item 7: the node wrapper (bin/quest.cjs) must never
 * orphan the native child. The native binary here is a stand-in shell script
 * that starts a long sleep of its own (a grandchild) and records both pids, so
 * the test can prove that killing the wrapper leaves neither alive.
 */

const wrapperSource = join(import.meta.dir, "..", "bin", "quest.cjs");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitFor<T>(
  what: string,
  probe: () => Promise<T | undefined> | T | undefined,
  ms = 10_000,
): Promise<T> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const value = await probe();
    if (value !== undefined) return value;
    await sleep(25);
  }
  throw new Error(`timed out waiting for ${what}`);
}

/** A wrapper copy beside a fake platform package, whose "native" binary is
 * `body` (a /bin/sh script). The temp root is realpath'd: on macOS the tmpdir
 * is a symlink, and a path-comparing entry guard would silently no-op. */
async function rig(body: string) {
  const root = await realpath(await mkdtemp(join(tmpdir(), "quest-qcli567-")));
  await mkdir(join(root, "bin"), { recursive: true });
  await copyFile(wrapperSource, join(root, "bin", "quest.cjs"));
  const pkg = join(
    root,
    "node_modules",
    "@opum-ai",
    `quest-${process.platform}-${process.arch}`,
  );
  await mkdir(join(pkg, "bin"), { recursive: true });
  await writeFile(
    join(pkg, "package.json"),
    JSON.stringify({ name: "fake", version: "0.0.0" }),
  );
  await writeFile(join(pkg, "bin", "quest"), `#!/bin/sh\n${body}\n`);
  await chmod(join(pkg, "bin", "quest"), 0o755);
  return root;
}

function runWrapper(root: string) {
  const proc = spawn(
    process.execPath === "" ? "node" : "node",
    [join(root, "bin", "quest.cjs")],
    {
      stdio: ["ignore", "ignore", "ignore"],
    },
  );
  const exited = new Promise<{ code: number | null; signal: string | null }>(
    (resolve) => proc.on("exit", (code, signal) => resolve({ code, signal })),
  );
  return { proc, exited };
}

const LONG_RUNNING = `echo $$ > "$(dirname "$0")/../../../../child.pid"
sleep 300 &
echo $! > "$(dirname "$0")/../../../../grandchild.pid"
wait`;

for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
  test(`${signal} to the wrapper mid-run leaves no quest process alive and the wrapper exits non-zero`, async () => {
    const root = await rig(LONG_RUNNING);
    let pids: number[] = [];
    try {
      const { proc, exited } = runWrapper(root);
      const read = async (name: string) => {
        try {
          const n = Number.parseInt(
            await readFile(join(root, name), "utf8"),
            10,
          );
          return Number.isNaN(n) ? undefined : n;
        } catch {
          return undefined;
        }
      };
      const child = await waitFor("child pid", () => read("child.pid"));
      const grandchild = await waitFor("grandchild pid", () =>
        read("grandchild.pid"),
      );
      pids = [child, grandchild];
      // Positive control: both are alive before the kill.
      expect(alive(child)).toBe(true);
      expect(alive(grandchild)).toBe(true);

      proc.kill(signal);
      const result = await exited;
      expect(result.signal).toBeNull();
      // The stand-in shell's own status on a signal is shell-specific; the
      // exact signal-to-status mapping is pinned by the test below.
      expect(result.code).toBeGreaterThan(0);

      await waitFor("native processes to die", () =>
        pids.every((pid) => !alive(pid)) ? true : undefined,
      );
    } finally {
      for (const pid of pids) if (alive(pid)) process.kill(pid, "SIGKILL");
      await rm(root, { recursive: true, force: true });
    }
  });
}

test("the wrapper exits with the child's own status", async () => {
  const root = await rig("exit 7");
  try {
    const { exited } = runWrapper(root);
    expect((await exited).code).toBe(7);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a child killed by a signal maps to 128 plus the signal number", async () => {
  const root = await rig("kill -TERM $$\nsleep 5");
  try {
    const { exited } = runWrapper(root);
    expect((await exited).code).toBe(143);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
