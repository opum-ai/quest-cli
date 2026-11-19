#!/usr/bin/env node
"use strict";

const { spawn } = require("node:child_process");
const os = require("node:os");
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

// QCLI-567 / DEC-282 (a1) item 7: the native child must never outlive this
// wrapper. spawnSync blocked the event loop, so a signal killed the wrapper
// while the native binary kept running (orphaned, PPID 1). Run it
// asynchronously, forward the terminating signals, and kill the child on the
// wrapper's own exit.
//
// Off a terminal the child gets its own process group, so a kill reaches
// anything it spawned too. On a terminal it stays in the foreground group:
// a background group would be stopped by SIGTTIN/SIGTTOU on terminal I/O.
// SIGKILL of the wrapper cannot be intercepted by any handler; callers that
// need it covered should signal the process group or send SIGTERM first.
const ownGroup = platform !== "win32" && !process.stdin.isTTY;
const child = spawn(binary, process.argv.slice(2), {
  stdio: "inherit",
  detached: ownGroup,
});

function signalChild(signal) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (ownGroup && typeof child.pid === "number") process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    // The child is already gone.
  }
}

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

child.on("error", (error) => {
  console.error(`Quest could not start ${packageName}: ${error.message}`);
  process.exitCode = 1;
});
child.on("close", (status, signal) => {
  if (typeof status === "number") process.exitCode = status;
  else if (signal && os.constants.signals[signal])
    process.exitCode = 128 + os.constants.signals[signal];
  else process.exitCode = 1;
});
