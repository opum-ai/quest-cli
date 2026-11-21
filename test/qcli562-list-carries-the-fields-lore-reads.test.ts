import { afterAll, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-562 / DEC-282 item 1. lore-cli's rollup (LCLI-791) reads exactly five
 * fields from ONE `quest task list --include-archived --json` per run instead
 * of one `task view` per task: id, aliases, title, status and path. lore-cli
 * named that list (src/adapters/quest.ts, origin/dev c28290c2) and asked that
 * `revision` NOT be added to list rows, since a list-time hash looks
 * edit-guardable and can go stale.
 *
 * Two things lore's cache key and ambiguity handling depend on and could not
 * confirm from its side: an archived row carries the same five fields with a
 * `path` into the archive directory, and a record moved by `task complete` or
 * `task archive` shows its NEW path in the very next list call.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "person-1", "--actor-kind", "human"] as const;
const FIELDS = ["id", "aliases", "title", "status", "path"] as const;
const roots: string[] = [];

function quest(workspace: string, args: readonly string[]) {
  return runCommand([process.execPath, MAIN, ...args], { cwd: workspace });
}

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), "qcli562-"));
  roots.push(root);
  await Bun.spawn(["git", "init", "-q"], { cwd: root }).exited;
  quest(root, ["init"]);
  quest(root, ["task", "create", "moves", ...ACTOR, "--json"]);
  quest(root, ["task", "create", "stays", ...ACTOR, "--json"]);
  return root;
}

type Row = Record<string, unknown> & { id: string; path: string };

function listed(root: string): readonly Row[] {
  const result = quest(root, ["task", "list", "--include-archived", "--json"]);
  expect(result.exitCode).toBe(0);
  return JSON.parse(result.stdout).data as Row[];
}

const row = (rows: readonly Row[], id: string): Row => {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`${id} missing from the listing`);
  return found;
};

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

test("every list row, archived included, carries the five fields lore reads and no revision", async () => {
  const root = await workspace();
  quest(root, ["task", "edit", "T-1", "--status", "In Progress", ...ACTOR]);
  quest(root, ["task", "complete", "T-1", ...ACTOR]);
  quest(root, ["task", "archive", "T-1", ...ACTOR]);
  const rows = listed(root);
  // Positive control: both the archived and the live record were read.
  expect(rows.map((r) => r.id).sort()).toEqual(["T-1", "T-2"]);
  for (const r of rows) {
    for (const field of FIELDS) expect(Object.hasOwn(r, field)).toBe(true);
    expect(Object.hasOwn(r, "revision")).toBe(false);
  }
});

test("a record moved by complete or archive shows its new path in the very next list call", async () => {
  const root = await workspace();
  expect(row(listed(root), "T-1").path).toBe(".quest/tasks/T-1.json");
  quest(root, ["task", "edit", "T-1", "--status", "In Progress", ...ACTOR]);
  expect(quest(root, ["task", "complete", "T-1", ...ACTOR]).exitCode).toBe(0);
  expect(row(listed(root), "T-1").path).toBe(".quest/completed/T-1.json");
  expect(quest(root, ["task", "archive", "T-1", ...ACTOR]).exitCode).toBe(0);
  const archived = row(listed(root), "T-1");
  expect(archived.path).toBe(".quest/archive/tasks/T-1.json");
  // The untouched record keeps its own path throughout.
  expect(row(listed(root), "T-2").path).toBe(".quest/tasks/T-2.json");
});
