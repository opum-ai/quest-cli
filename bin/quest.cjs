#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const os = require("node:os");
const { isatty } = require("node:tty");
const { existsSync } = require("node:fs");
const { join } = require("node:path");

const platform = process.platform;
const arch = process.arch;
const packageName = `@opum-ai/quest-${platform}-${arch}`;
const executable = platform === "win32" ? "quest.exe" : "quest";

let packageDirectory;
try {
  packageDirectory = require.resolve(`${packageName}/package.json`);
} catch {
  console.error(
    `Quest does not support ${platform}-${arch}: optional package ${packageName} is not installed. Reinstall @opum-ai/quest with optional dependencies enabled.`,
  );
  process.exitCode = 1;
  return;
}

const binary = join(packageDirectory, "..", "bin", executable);
if (!existsSync(binary)) {
  console.error(`Quest platform package ${packageName} is missing ${executable}.`);
  process.exitCode = 1;
  return;
}

// QCLI-567 / DEC-282 (a1) item 7: the native child must not outlive this
// wrapper when the wrapper is stopped by SIGTERM, SIGINT or SIGHUP, or exits
// on an uncaught exception. spawnSync blocked the event loop, so a signal
// killed the wrapper while the native binary kept running (orphaned, PPID 1).
// Run it asynchronously, forward the terminating signals, and sweep on exit.
//
// Off a terminal the child gets its own session and process group (setsid), so
// a kill reaches anything it spawned too; the cost is that it has no
// controlling terminal. On a terminal it stays in the caller's foreground
// group, so it keeps the terminal and Ctrl-C reaches it as before.
//
// Design ruled by DEC-282 (a2) (opum-doc ODOC-634): off a terminal the child is
// in its own session and group, a forwarded signal goes to that group, and the
// wrapper sweeps the group on exit; on a terminal it stays in the caller's
// foreground group so Ctrl-C works as before. When the child dies by a signal
// the wrapper dies by that same signal (re-raised), as foreground-child and
// tini do, so a caller sees death by signal, not exit 128+n.
//
// Known limit, until the lifeline pipe ships (DEC-282 (a2) item 2): SIGKILL of
// the wrapper, or a caller's group-wide SIGKILL off a terminal, cannot be
// intercepted and can orphan the child. The documented caller remedy is
// TERM-then-KILL: SIGTERM the wrapper (or a group the caller created for it),
// wait a few seconds, then SIGKILL. A plain SIGTERM is fully handled here.
const ownGroup = platform !== "win32" && !isatty(0);
let child;
let spawnFailed = false;

function signalChild(signal) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (ownGroup && typeof child.pid === "number") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // The child is already gone.
  }
}

// Registered before the spawn, so no signal can land between the two and kill
// the wrapper by default action while the child is already running.
for (const signal of ["SIGTERM", "SIGINT", "SIGHUP"]) {
  try {
    process.on(signal, () => signalChild(signal));
  } catch {
    // The signal is not supported on this platform.
  }
}
const NODE_HANDLED = new Set(["SIGPIPE", "SIGXFSZ", "SIGUSR1"]);

function sweepGroup() {
  if (!child) return;
  if (ownGroup && typeof child.pid === "number") {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      // Nothing left in the group.
    }
  } else {
    signalChild("SIGKILL");
  }
}
// Covers an uncaught exception or any other exit path that skips the handlers.
// In its own group the whole group is swept even after the child itself has
// exited: a grandchild started with SIGINT ignored survives a forwarded
// SIGINT, and must still not outlive the wrapper. A group with no members
// left answers ESRCH, which is the normal case.
process.on("exit", sweepGroup);

function startFailed(error) {
  spawnFailed = true;
  console.error(`Quest could not start ${packageName}: ${error.message}`);
  process.exitCode = 1;
}

try {
  child = spawn(binary, process.argv.slice(2), {
    stdio: "inherit",
    detached: ownGroup,
  });
} catch (error) {
  // spawn() throws synchronously for some failures (ENOEXEC, E2BIG), where it
  // reports others (ENOENT, EACCES) through the 'error' event.
  startFailed(error);
  return;
}
child.on("error", startFailed);
child.on("close", (status, signal) => {
  // A spawn failure also emits 'close', with a negative errno status; the
  // failure has already set exit status 1.
  if (spawnFailed) return;
  if (typeof status === "number" && status >= 0) {
    process.exitCode = status;
    return;
  }
  const number = signal && os.constants.signals[signal];
  if (!number) {
    process.exitCode = 1;
    return;
  }
  // Re-raise the child's terminating signal on ourselves. A signal kill skips
  // the 'exit' handlers, so sweep the group first; then restore the default
  // disposition and die by the signal. If the signal does not kill us (it is
  // ignored or blocked), fall back to the conventional 128+n status.
  sweepGroup();
  process.exitCode = 128 + number;
  // Node does not leave these at the default action: it ignores SIGPIPE and
  // SIGXFSZ (a self-kill would do nothing), and SIGUSR1 starts the inspector
  // on 127.0.0.1:9229. Exit 128+n for them instead of self-killing.
  if (NODE_HANDLED.has(signal)) return;
  for (const name of ["SIGTERM", "SIGINT", "SIGHUP"]) process.removeAllListeners(name);
  try {
    process.kill(process.pid, signal);
  } catch {
    // Not permitted on this platform; the exit status above stands.
  }
});
