#!/usr/bin/env node
/**
 * Deterministic sequential-throughput measurement for the public CLI
 * `quest task edit` at representative scale (default 10_000 records).
 *
 * Method:
 *  - Seeds a temporary Quest workspace by writing N validated task records
 *    straight to disk (import path is exercised elsewhere; seeding must not be
 *    part of what is measured).
 *  - Runs COUNT sequential `bun <main> task edit ...` child processes exactly
 *    as an external actor would (fresh process per edit), timing end-to-end.
 *  - Prints a machine-readable JSON summary.
 *
 * Usage:
 *   node scripts/benchmark-task-edit-throughput.mjs [--tasks N] [--count K]
 *
 * The command shape mirrors docs in the paired-release audit; it does not read
 * or need credentials and never publishes anything.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const argv = process.argv.slice(2);
function option(name, fallback) {
  const index = argv.indexOf(name);
  return index >= 0 ? Number(argv[index + 1]) : fallback;
}
const taskCount = Math.max(1, option("--tasks", 10_000));
const editCount = Math.max(1, option("--count", 20));
const mode = argv.includes("--mode")
  ? argv[argv.indexOf("--mode") + 1]
  : "single";

const repoRoot = new URL("..", import.meta.url).pathname;
const mainEntry = join(repoRoot, "src/cli/main.ts");

/** Record enough of a minimal task state that repository reads accept it. */
async function seedWorkspace(root) {
  const recordShape = {
    schemaVersion: undefined,
  };
  if (recordShape.schemaVersion !== undefined) throw new Error("unexpected");
  // Seed through the repository's own domain validation by invoking a tiny
  // bun inline program that imports createTask/taskState from source.
  const seedProgram = `
      import { createTask } from "${join(repoRoot, "src/domain/tasks/tasks.ts")}";
      const [root, countArg] = process.argv.slice(1);
      const count = Number(countArg);
      const out = [];
      for (let i = 0; i < count; i++) {
        const id = "T-" + (i + 1);
        const task = createTask(id, { title: "Seed task " + (i + 1) });
        out.push(task);
      }
      const payload = out;
      const { mkdir, writeFile } = await import("node:fs/promises");
      const dir = root + "/.quest/tasks";
      await mkdir(dir, { recursive: true });
      for (const t of payload) {
        await writeFile(dir + "/" + t.id + ".json", JSON.stringify(t) + "\\n");
      }
      console.log("seeded:" + payload.length);
    `;
  const result = spawnSync(
    "bun",
    ["--eval", seedProgram, "--", root, String(taskCount)],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env: { ...process.env },
    },
  );
  if (!result.stdout?.includes(`seeded:${taskCount}`)) {
    throw new Error(
      `seeding failed:\nstdout=${result.stdout}\nstderr=${result.stderr}`,
    );
  }
}

function oneEdit(workspaceRoot, reference, suffix) {
  const startedAt = performance.now();
  const result = spawnSync(
    "bun",
    [
      mainEntry,
      "task",
      "edit",
      reference,
      "--description",
      `bench ${suffix}`,
      "--actor",
      "bench",
      "--actor-kind",
      "human",
      "--json",
    ],
    { cwd: workspaceRoot, encoding: "utf8", env: { ...process.env } },
  );
  const elapsedMs = performance.now() - startedAt;
  if (result.status !== 0 || !result.stdout.includes('"kind":"task.updated"')) {
    throw new Error(
      `edit failed (${reference}):\nstatus=${result.status}\nstdout=${result.stdout.slice(0, 400)}\nstderr=${result.stderr?.slice(0, 400)}`,
    );
  }
  return elapsedMs;
}

const summary = { taskCount, editCount, samplesMs: [], passesPerMinute: null };
const root = mkdtempSync(join(tmpdir(), "quest-edit-bench-"));
try {
  await seedWorkspace(root);
  // Quest binds its workspace to the enclosing Git worktree.
  const init = spawnSync("git", ["init", "-q", "."], {
    cwd: root,
    encoding: "utf8",
  });
  if (init.status !== 0)
    throw new Error(`git init failed: ${init.stderr ?? ""}`);
  // Warm the OS caches so steady-state per-op cost dominates.
  const initQuest = spawnSync("bun", [mainEntry, "init", "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  if (initQuest.status !== 0 || !initQuest.stdout.includes("initialized"))
    throw new Error(
      `quest init failed: ${initQuest.stdout.slice(0, 200)} ${initQuest.stderr?.slice(0, 200)}`,
    );
  oneEdit(root, "T-1", "warmup");
  let total = 0;
  for (let i = 0; i < editCount; i++) {
    const ms = oneEdit(root, `T-${i + 2}`, String(i));
    summary.samplesMs.push(Math.round(ms));
    total += ms;
  }
  const avgMs = total / editCount;
  summary.mode = mode;
  summary.averageMs = Math.round(avgMs);
  summary.passesPerMinute = Math.round((60_000 / avgMs) * 10) / 10;
} finally {
}
console.log(JSON.stringify(summary, null, 1));
