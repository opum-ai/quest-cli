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
import { constants as osConstants, tmpdir } from "node:os";
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

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
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
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapper)).toBe(true);
      expect(child).not.toBe(wrapper);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

const hasScript = Bun.which("script") !== null;

/** Run `shellCommand` (a /bin/sh command line) with every fd on a pty, under
 * script(1), and read the pgids the stand-in recorded. */
async function pgidsUnderPty(root: string, shellCommand: string) {
  const args =
    process.platform === "darwin"
      ? ["-q", "/dev/null", "sh", "-c", shellCommand]
      : ["-qec", `sh -c '${shellCommand}'`, "/dev/null"];
  const proc = spawn("script", args, {
    // /dev/null as stdin: `script` rejects the socket a "pipe" becomes.
    stdio: ["ignore", "ignore", "ignore"],
  });
  const done = new Promise((resolve) => proc.on("exit", resolve));
  try {
    return await readPgids(root);
  } finally {
    proc.kill("SIGKILL");
    await done;
  }
}

// A missing `script` skips these tests locally, but FAILS them under CI: a
// silent skip there would leave the on-terminal placement unproven.
const ptyTest = (name: string, body: () => Promise<void>) =>
  test.skipIf(process.platform === "win32" || (!hasScript && !process.env.CI))(
    name,
    async () => {
      expect(hasScript).toBe(true);
      await body();
    },
  );

ptyTest(
  "with every fd on a terminal the child stays in the wrapper's group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const [child, wrapperGroup] = await pgidsUnderPty(
        root,
        `node ${join(root, "bin", "quest.cjs")}`,
      );
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapperGroup)).toBe(true);
      expect(child).toBe(wrapperGroup);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

// DEC-282 (a3): a terminal on ANY of fds 0-2 keeps the child in the caller's
// group (Ctrl-Z, Ctrl-\\, /dev/tty prompts). Here stdin is a pipe and stdout
// and stderr are the terminal.
ptyTest(
  "with stdin piped but stdout on a terminal the child stays in the wrapper's group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const [child, wrapperGroup] = await pgidsUnderPty(
        root,
        `: | node ${join(root, "bin", "quest.cjs")}`,
      );
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapperGroup)).toBe(true);
      expect(child).toBe(wrapperGroup);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

// Each clause of the own-group predicate needs its own witness, or dropping one
// leaves every pty test green because another fd is still a terminal. Here
// stdin is a pipe and stdout is /dev/null, so ONLY stderr is a terminal: this
// goes red if `&& !isatty(2)` is dropped.
ptyTest(
  "with stdin piped and stdout on /dev/null but stderr on a terminal the child stays in the wrapper's group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const [child, wrapperGroup] = await pgidsUnderPty(
        root,
        `: | node ${join(root, "bin", "quest.cjs")} >/dev/null`,
      );
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapperGroup)).toBe(true);
      expect(child).toBe(wrapperGroup);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

// Mirror of the previous test: here stdin is a pipe and stderr is /dev/null, so
// ONLY stdout is a terminal: this goes red if `&& !isatty(1)` is dropped.
ptyTest(
  "with stdin piped and stderr on /dev/null but stdout on a terminal the child stays in the wrapper's group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const [child, wrapperGroup] = await pgidsUnderPty(
        root,
        `: | node ${join(root, "bin", "quest.cjs")} 2>/dev/null`,
      );
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapperGroup)).toBe(true);
      expect(child).toBe(wrapperGroup);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

// The fd-0 clause of the predicate needs its own witness too. In every other
// pty test stdin is a pipe (or all fds are terminals), so dropping
// `&& !isatty(0)` alone leaves them green. Here stdout and stderr are
// /dev/null and ONLY stdin is a terminal: this goes red iff `!isatty(0)` is
// dropped.
ptyTest(
  "with stdout and stderr on /dev/null but stdin on a terminal the child stays in the wrapper's group",
  async () => {
    const root = await rig(PGIDS);
    try {
      const [child, wrapperGroup] = await pgidsUnderPty(
        root,
        `node ${join(root, "bin", "quest.cjs")} >/dev/null 2>/dev/null`,
      );
      expect(Number.isInteger(child)).toBe(true);
      expect(Number.isInteger(wrapperGroup)).toBe(true);
      expect(child).toBe(wrapperGroup);
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

/** Run the wrapper with stderr captured. */
function runCapturing(root: string, nodeArgs: string[] = []) {
  const proc = spawn("node", [...nodeArgs, join(root, "bin", "quest.cjs")], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  let stderr = "";
  proc.stderr?.on("data", (chunk) => {
    stderr += chunk;
  });
  const exited = new Promise<{ code: number | null; signal: string | null }>(
    (resolve) => proc.on("close", (code, signal) => resolve({ code, signal })),
  );
  return { exited, stderr: () => stderr };
}

/** Source for a `--require` preload that replaces process.kill. Every
 * self-kill is recorded to `selfKill` as `swallowed:<signal>` or
 * `forwarded:<signal>`, so a caller can tell a signal the witness caught from
 * one that reached the real kill. It swallows a self-kill with SIGUSR1 —
 * named either by name or by the numeric value from os.constants — so the
 * inspector never starts. Matching BOTH forms is what stops a regression that
 * self-kills with the numeric value from being forwarded. */
function killWitnessSource(armed: string, selfKill: string): string {
  return `"use strict";
const fs = require("node:fs");
const os = require("node:os");
const realKill = process.kill.bind(process);
const armed = ${JSON.stringify(armed)};
const selfKill = ${JSON.stringify(selfKill)};
const USR1 = os.constants.signals.SIGUSR1;
fs.writeFileSync(armed, String(process.pid));
process.kill = function (pid, signal) {
  if (pid === process.pid) {
    const swallow = signal === "SIGUSR1" || signal === USR1;
    fs.writeFileSync(
      selfKill,
      (swallow ? "swallowed:" : "forwarded:") + String(signal),
    );
    if (swallow) return true;
  }
  return realKill(pid, signal);
};
`;
}

// Node ignores SIGPIPE/SIGXFSZ and turns SIGUSR1 into "start the inspector",
// so a self-kill with those signals either does nothing or opens a debugger
// port. The wrapper exits 128+n for them instead.
for (const name of ["PIPE", "USR1"] as const) {
  const expected = 128 + (osConstants.signals[`SIG${name}`] ?? 0);
  test.skipIf(process.platform === "win32")(
    `a child killed by SIG${name} makes the wrapper exit 128+n with no debugger started`,
    async () => {
      const root = await rig(`kill -${name} $$\nsleep 5`);
      try {
        // F4 witness (QCLI-572 / #750 finding 2). A re-raise of SIGUSR1 does
        // not kill the wrapper, so the exit status and signal below cannot
        // distinguish it: the status stays 128+n and the signal stays null.
        // The inspector also prints asynchronously, so its absence from stderr
        // is not reliable evidence either. A --require preload wraps
        // process.kill instead: it records any self-kill attempt to a marker
        // file and swallows one sent to OUR OWN pid as SIGUSR1 (by name or by
        // the numeric value), so the witness is deterministic and the
        // inspector never runs. The armed marker proves the instrument loaded;
        // the self-kill marker must be ABSENT, because the wrapper never
        // re-raises SIGPIPE or SIGUSR1 to itself.
        const armed = join(root, "preload-armed.marker");
        const selfKill = join(root, "selfkill.marker");
        const preload = join(root, "kill-witness.cjs");
        await writeFile(preload, killWitnessSource(armed, selfKill));
        const { exited, stderr } = runCapturing(root, ["--require", preload]);
        const result = await exited;
        expect(result.signal).toBeNull();
        expect(result.code).toBe(expected);
        // Positive control: the preload loaded and wrapped process.kill.
        expect(await fileExists(armed)).toBe(true);
        // The deterministic proof: no self-kill was attempted, for SIGPIPE or
        // for SIGUSR1 (the wrapper never re-raises either Node-handled signal).
        expect(await fileExists(selfKill)).toBe(false);
        // Secondary only (see the note above): a re-raise that somehow printed
        // before the wrapper exited would still be caught here.
        expect(stderr()).not.toContain("Debugger listening");
        expect(stderr()).not.toMatch(/inspector/i);
        expect(stderr()).not.toContain("9229");
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
  );
}

// QCLI-572 round 3 finding 3: a witness that only recognised the signal-name
// form would let a self-kill sent as the numeric value slip past the marker.
// This drives the numeric form through the SAME preload and requires the
// marker to catch it (and records the value it was handed).
test.skipIf(process.platform === "win32")(
  "the SIGUSR1 witness catches a self-kill sent as the numeric signal value",
  async () => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), "quest-qcli567-numeric-")),
    );
    try {
      const armed = join(root, "preload-armed.marker");
      const selfKill = join(root, "selfkill.marker");
      const preload = join(root, "kill-witness.cjs");
      await writeFile(preload, killWitnessSource(armed, selfKill));
      const numeric = osConstants.signals.SIGUSR1;
      const driver = join(root, "driver.cjs");
      await writeFile(
        driver,
        `process.kill(process.pid, ${String(numeric)});\nprocess.exit(0);\n`,
      );
      const proc = spawn("node", ["--require", preload, driver], {
        stdio: ["ignore", "ignore", "ignore"],
      });
      const result = await new Promise<{
        code: number | null;
        signal: string | null;
      }>((resolve) =>
        proc.on("exit", (code, signal) => resolve({ code, signal })),
      );
      // Positive control: the preload loaded and armed.
      expect(await fileExists(armed)).toBe(true);
      // The numeric self-kill was swallowed (not forwarded to the real kill),
      // so the driver survived and the marker records the numeric value it was
      // handed.
      expect(result.signal).toBeNull();
      expect(await readFile(selfKill, "utf8")).toBe(
        `swallowed:${String(numeric)}`,
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test.skipIf(process.platform === "win32")(
  "a spawn() that throws synchronously prints the start-failure message, exits 1, and shows no stack",
  async () => {
    const root = await rig("exit 0");
    try {
      // Node reports ENOEXEC and E2BIG by throwing from spawn() rather than
      // via the 'error' event, but whether a real file gets there is
      // platform-specific: glibc's execvp is believed to retry ENOEXEC through
      // /bin/sh, so on Linux a text file may run as a script instead. (That
      // retry was inferred, never read from a log.) A preload makes the throw
      // deterministic on every platform.
      const preload = join(root, "throwing-spawn.cjs");
      await writeFile(
        preload,
        `require("node:child_process").spawn = () => {
  throw Object.assign(new Error("spawn ENOEXEC"), { code: "ENOEXEC" });
};\n`,
      );
      const { exited, stderr } = runCapturing(root, ["--require", preload]);
      const result = await exited;
      expect(result.code).toBe(1);
      expect(stderr()).toContain("Quest could not start");
      expect(stderr()).not.toMatch(/\n\s+at /);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
