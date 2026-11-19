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

function runWrapper(root: string, stdin: "ignore" | "pipe" = "ignore") {
  const proc = spawn("node", [join(root, "bin", "quest.cjs")], {
    stdio: [stdin, "ignore", "ignore"],
  });
  const exited = new Promise<{ code: number | null; signal: string | null }>(
    (resolve) => proc.on("exit", (code, signal) => resolve({ code, signal })),
  );
  return { proc, exited };
}

const LONG_RUNNING = `echo $$ > "$(dirname "$0")/../../../../child.pid"
sleep 300 &
echo $! > "$(dirname "$0")/../../../../grandchild.pid"
wait`;

// POSIX only: process groups, /bin/sh stand-ins and kill(0) liveness probes.
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"] as const) {
  test.skipIf(process.platform === "win32")(
    `${signal} to the wrapper mid-run leaves no quest process alive and the wrapper does not exit 0`,
    async () => {
      const root = await rig(LONG_RUNNING);
      let pids: number[] = [];
      let proc: ReturnType<typeof runWrapper>["proc"] | undefined;
      let exited!: ReturnType<typeof runWrapper>["exited"];
      try {
        ({ proc, exited } = runWrapper(root));
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

        // The no-survivor assertion comes first, so a wrapper that dies without
        // cleaning up fails HERE rather than on a status check.
        await waitFor(
          "native processes to die",
          () => (pids.every((pid) => !alive(pid)) ? true : undefined),
          3_000,
        );

        // How the wrapper itself dies depends on how the stand-in shell dies;
        // the signal-to-status behaviour is pinned by a test below.
        expect(result.signal !== null || (result.code ?? 0) > 0).toBe(true);
      } finally {
        proc?.kill("SIGKILL");
        for (const pid of pids) if (alive(pid)) process.kill(pid, "SIGKILL");
        await rm(root, { recursive: true, force: true });
      }
    },
  );
}

test.skipIf(process.platform === "win32")(
  "the wrapper exits with the child's own status",
  async () => {
    const root = await rig("exit 7");
    try {
      const { exited } = runWrapper(root);
      expect((await exited).code).toBe(7);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform === "win32")(
  "a child killed by a signal makes the wrapper die by that same signal, not exit 128+n",
  async () => {
    const root = await rig("kill -TERM $$\nsleep 5");
    try {
      const { exited } = runWrapper(root);
      const result = await exited;
      expect(result.signal).toBe("SIGTERM");
      expect(result.code).toBeNull();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform === "win32")(
  "piped stdin reaches the native child intact through the wrapper",
  async () => {
    const root = await rig('cat > "$(dirname "$0")/../../../../stdin.out"');
    try {
      const { proc, exited } = runWrapper(root, "pipe");
      proc.stdin?.write("alpha;");
      await sleep(300);
      proc.stdin?.end("beta");
      expect((await exited).code).toBe(0);
      expect(await readFile(join(root, "stdin.out"), "utf8")).toBe(
        "alpha;beta",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform === "win32")(
  "a native binary that cannot be started exits 1, not a negated errno",
  async () => {
    const root = await rig("exit 0");
    try {
      await chmod(
        join(
          root,
          "node_modules",
          "@opum-ai",
          `quest-${process.platform}-${process.arch}`,
          "bin",
          "quest",
        ),
        0o644,
      );
      const { exited } = runWrapper(root);
      expect((await exited).code).toBe(1);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

// Process-group placement (DEC-282 (a2) item 1). The stand-in records its own
// process group and its parent's (the wrapper's).
const PGIDS = `WP=$(ps -o ppid= -p $$ | tr -d ' ')
echo "$(ps -o pgid= -p $$ | tr -d ' ') $(ps -o pgid= -p $WP | tr -d ' ')" > "$(dirname "$0")/../../../../pgids.out"`;

async function readPgids(root: string): Promise<[number, number]> {
  const text = await waitFor("pgids", async () => {
    try {
      const t = (await readFile(join(root, "pgids.out"), "utf8")).trim();
      return t.split(" ").length === 2 ? t : undefined;
    } catch {
      return undefined;
    }
  });
  const [child, wrapper] = text.split(" ").map((n) => Number.parseInt(n, 10));
  return [child as number, wrapper as number];
}

test.skipIf(process.platform === "win32")(
  "off a terminal the child runs in its own process group, apart from the wrapper's",
  async () => {
    const root = await rig(PGIDS);
    try {
      const { exited } = runWrapper(root);
      await exited;
      const [child, wrapper] = await readPgids(root);
      expect(child).not.toBe(wrapper);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

const hasScript = Bun.which("script") !== null;
test.skipIf(process.platform === "win32" || !hasScript)(
  "on a terminal the child stays in the wrapper's foreground group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const wrapper = join(root, "bin", "quest.cjs");
      const args =
        process.platform === "darwin"
          ? ["-q", "/dev/null", "node", wrapper]
          : ["-qec", `node ${wrapper}`, "/dev/null"];
      const proc = spawn("script", args, {
        // /dev/null as stdin: `script` rejects the socket a "pipe" becomes.
        stdio: ["ignore", "ignore", "ignore"],
      });
      const done = new Promise((resolve) => proc.on("exit", resolve));
      try {
        const [child, wrapperGroup] = await readPgids(root);
        expect(child).toBe(wrapperGroup);
      } finally {
        proc.kill("SIGKILL");
        await done;
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform === "win32")(
  "a child that dies by a signal still has its group swept before the wrapper re-raises",
  async () => {
    const root = await rig(`sleep 300 &
echo $! > "$(dirname "$0")/../../../../grandchild.pid"
kill -TERM $$
wait`);
    let grandchild: number | undefined;
    try {
      const { exited } = runWrapper(root);
      const result = await exited;
      expect(result.signal).toBe("SIGTERM");
      grandchild = await waitFor("grandchild pid", async () => {
        try {
          const n = Number.parseInt(
            await readFile(join(root, "grandchild.pid"), "utf8"),
            10,
          );
          return Number.isNaN(n) ? undefined : n;
        } catch {
          return undefined;
        }
      });
      await waitFor(
        "grandchild to die",
        () => (alive(grandchild as number) ? undefined : true),
        3_000,
      );
    } finally {
      if (grandchild !== undefined && alive(grandchild))
        process.kill(grandchild, "SIGKILL");
      await rm(root, { recursive: true, force: true });
    }
  },
);
