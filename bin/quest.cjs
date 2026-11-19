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
// Off a terminal the child gets its own process group (and, on POSIX, its own
// session), so a kill reaches anything it spawned too. On a terminal it stays
// in the foreground group: a background group would be stopped by
// SIGTTIN/SIGTTOU on terminal I/O.
//
// Known limits. SIGKILL of the wrapper cannot be intercepted by any handler,
// so the child can outlive it. Off a terminal the trade-off is sharper: the
// child has left the caller's process group, so a caller's group-wide SIGKILL
// (kill -9 -<pgid>, killpg) now reaches only the wrapper and orphans the
// child, where the old wrapper kept both in one group. Staying in the
// caller's group would keep that working but could not sweep grandchildren.
// Which placement is right is pending a design ruling (QCLI-567).
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
// Covers an uncaught exception or any other exit path that skips the handlers.
// In its own group the whole group is swept even after the child itself has
// exited: a grandchild started with SIGINT ignored survives a forwarded
// SIGINT, and must still not outlive the wrapper. A group with no members
// left answers ESRCH, which is the normal case.
process.on("exit", () => {
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
});

child = spawn(binary, process.argv.slice(2), {
  stdio: "inherit",
  detached: ownGroup,
});
child.on("error", (error) => {
  spawnFailed = true;
  console.error(`Quest could not start ${packageName}: ${error.message}`);
  process.exitCode = 1;
});
child.on("close", (status, signal) => {
  // A spawn failure also emits 'close', with a negative errno status; the
  // failure has already set exit status 1.
  if (spawnFailed) return;
  if (typeof status === "number" && status >= 0) process.exitCode = status;
  else if (signal && os.constants.signals[signal])
    process.exitCode = 128 + os.constants.signals[signal];
  else process.exitCode = 1;
});
