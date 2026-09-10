#!/usr/bin/env node
"use strict";

const { spawnSync } = require("node:child_process");
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

const result = spawnSync(binary, process.argv.slice(2), { stdio: "inherit" });
if (result.error) {
  console.error(`Quest could not start ${packageName}: ${result.error.message}`);
  process.exitCode = 1;
} else if (typeof result.status === "number") {
  process.exitCode = result.status;
} else {
  process.exitCode = 1;
}
