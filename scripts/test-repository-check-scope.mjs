import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = await mkdtemp(join(tmpdir(), "quest-repository-check-scope-"));
const fixtureNodeModules = join(fixture, "node_modules");

function run(command) {
  return new Promise((resolveRun, reject) => {
    const child = spawn("bun", ["run", command], {
      cwd: fixture,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolveRun();
      reject(
        new Error(
          `bun run ${command} failed with ${signal ?? `exit code ${code}`}.`,
        ),
      );
    });
  });
}

try {
  await Promise.all(
    ["src", "test", "scripts"].map((directory) =>
      cp(join(root, directory), join(fixture, directory), { recursive: true }),
    ),
  );
  await Promise.all(
    ["biome.json", "package.json", "tsconfig.json"].map((file) =>
      cp(join(root, file), join(fixture, file)),
    ),
  );
  await symlink(
    join(root, "node_modules"),
    fixtureNodeModules,
    process.platform === "win32" ? "junction" : "dir",
  );

  await run("lint");
  await run("format:check");

  await mkdir(join(fixture, ".pooled-worktrees", "pooled-worktree"), {
    recursive: true,
  });
  await writeFile(
    join(fixture, ".pooled-worktrees", "pooled-worktree", "biome.json"),
    '{ "files": { "includes": ["**/*.js"] } }\n',
  );

  await run("lint");
  await run("format:check");
} finally {
  await rm(fixture, { force: true, recursive: true });
}
