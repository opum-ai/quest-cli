import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-425. Measured 2026-09-30 on the dev source, the built 0.12.0 platform
 * binary and the installed 0.11.0, identically: a guarded `task edit
 * --if-revision` whose value matches nothing exited 5 with a body asserting
 * "Task state changed concurrently" -- a cause the guard never established --
 * and input carrying only actualRevision, so the only revision in the error
 * was the CURRENT one and transcribing "the revision" out of it reproduced
 * sent == actual exactly. Empty string, the literal `null` and a stale
 * sentinel produced byte-identical bodies, and the sent value appeared zero
 * times anywhere.
 *
 * These tests pin the corrected contract: the refusal names the mismatch it
 * established, carries the sent value as input.sentRevision beside
 * input.actualRevision, and a genuine writer race -- which conveys no sent
 * value -- stays distinguishable by carrying no sentRevision and keeping the
 * concurrent-change wording.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const HUMAN = ["--actor", "person-1", "--actor-kind", "human"] as const;

function run(workspace: string, argv: readonly string[]) {
  return runCommand([...argv], {
    cwd: workspace,
  });
}

const quest = (workspace: string, args: readonly string[]) =>
  run(workspace, [process.execPath, MAIN, ...args]);
const git = (workspace: string, args: readonly string[]) =>
  run(workspace, ["git", ...args]);

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), "qcli425-"));
  await Bun.spawn(["git", "init", "-q"], { cwd: root }).exited;
  await Bun.spawn(["git", "config", "user.email", "test@example.invalid"], {
    cwd: root,
  }).exited;
  await Bun.spawn(["git", "config", "user.name", "test"], { cwd: root }).exited;
  quest(root, ["init"]);
  return root;
}

function startedTask(root: string) {
  quest(root, ["task", "create", "Ship the thing", ...HUMAN, "--json"]);
  const id = "T-1";
  expect(quest(root, ["task", "start", id, ...HUMAN, "--json"]).exitCode).toBe(
    0,
  );
  return id;
}

const revisionOf = (root: string, id: string) =>
  JSON.parse(quest(root, ["task", "view", id, "--json"]).stdout).data
    .revision as string;

interface ConflictBody {
  error_type: string;
  message: string;
  hint?: string;
  input?: { sentRevision?: string; actualRevision?: string };
}

const CONCURRENT_WORDING =
  "Task state changed concurrently; the operation was not applied.";

test("the control: sending the current revision still applies the edit (QCLI-425)", async () => {
  const root = await workspace();
  try {
    const id = startedTask(root);
    const revision = revisionOf(root, id);
    const applied = quest(root, [
      "task",
      "edit",
      id,
      "--add-note",
      "control note",
      "--if-revision",
      revision,
      ...HUMAN,
      "--json",
    ]);
    expect(applied.exitCode).toBe(0);
    expect(applied.stderr).toBe("");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a guarded failure names the mismatch and echoes the sent value beside actual (QCLI-425)", async () => {
  const root = await workspace();
  try {
    const id = startedTask(root);
    const current = revisionOf(root, id);
    const SENTINEL = "SENTINEL-qcli425-never-matches";
    const refused = quest(root, [
      "task",
      "edit",
      id,
      "--add-note",
      "stale attempt",
      "--if-revision",
      SENTINEL,
      ...HUMAN,
      "--json",
    ]);
    expect(refused.exitCode).toBe(5);
    expect(refused.stdout).toBe("");
    const body = JSON.parse(refused.stderr) as ConflictBody;
    expect(body.error_type).toBe("conflict");
    // Names the cause the guard ESTABLISHED -- the sent/current mismatch --
    // rather than asserting the record changed concurrently.
    expect(body.message).toContain("does not match the record's current");
    expect(body.message).not.toContain("changed concurrently");
    // Both halves of the comparison are carried, so no argv reconstruction.
    expect(body.input?.sentRevision).toBe(SENTINEL);
    expect(body.input?.actualRevision).toBe(current);
    // The sent value appears in the body -- exactly once, as sentRevision.
    expect(refused.stderr.split(SENTINEL).length - 1).toBe(1);
    // Nothing was written: the revision is unchanged and retrying with the
    // echoed actualRevision is exactly what succeeds.
    expect(revisionOf(root, id)).toBe(current);
    const retried = quest(root, [
      "task",
      "edit",
      id,
      "--add-note",
      "retry",
      "--if-revision",
      body.input?.actualRevision ?? "",
      ...HUMAN,
      "--json",
    ]);
    expect(retried.exitCode).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("an empty-string sent value is echoed as sentRevision, not swallowed (QCLI-425)", async () => {
  const root = await workspace();
  try {
    const id = startedTask(root);
    const refused = quest(root, [
      "task",
      "edit",
      id,
      "--add-note",
      "empty attempt",
      "--if-revision",
      "",
      ...HUMAN,
      "--json",
    ]);
    expect(refused.exitCode).toBe(5);
    const body = JSON.parse(refused.stderr) as ConflictBody;
    expect(body.error_type).toBe("conflict");
    expect(body.input?.sentRevision).toBe("");
    expect(body.input?.actualRevision).toBe(revisionOf(root, id));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

async function runWriters(
  root: string,
  commands: readonly (readonly string[])[],
) {
  return Promise.all(
    commands.map(async (args) => {
      const child = Bun.spawn([process.execPath, MAIN, ...args], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await child.exited;
      return {
        exitCode,
        stdout: await new Response(child.stdout).text(),
        stderr: await new Response(child.stderr).text(),
      };
    }),
  );
}

// QCLI-495 removed the id collision this test used to construct: sixteen
// concurrent auto-allocating creates in one worktree used to mint the same id
// and lose the race. They can still lose the tracker's own revision check -- a
// conflict, not a collision, and more often on a loaded CI runner than here --
// so this test does not bound HOW MANY win (the first version did, and flaked
// in CI). It pins what must hold whatever the count: every winner has its own
// id, and every loser carries the QCLI-425 concurrent wording AND the revision
// it lost to. A collision loser goes through task_already_exists and carries
// neither, so with the lock and ledger bypassed this goes red (10 of 10 runs,
// measured 2026-10-20 in round 1 of #646).
test("concurrent auto-allocating creates in one worktree: winners have distinct ids and every loser lost the revision check, never an id collision (QCLI-495, was the QCLI-425 writer race)", async () => {
  const root = await workspace();
  try {
    const results = await runWriters(
      root,
      Array.from({ length: 16 }, (_, writer) => [
        "task",
        "create",
        `Concurrent ${writer}`,
        ...HUMAN,
        "--json",
      ]),
    );
    const wins = results.filter((result) => result.exitCode === 0);
    expect(wins.length).toBeGreaterThan(0);
    const ids = wins.map(
      (result) =>
        (JSON.parse(result.stdout) as { data: { id: string } }).data.id,
    );
    expect(new Set(ids).size).toBe(wins.length);
    for (const loser of results.filter((result) => result.exitCode !== 0)) {
      expect(loser.exitCode).toBe(5);
      const body = JSON.parse(loser.stderr) as ConflictBody;
      expect(body.message).toBe(CONCURRENT_WORDING);
      expect(body.input?.sentRevision).toBeUndefined();
      // A loser of the tracker's revision check carries the revision it lost
      // to (local-task-repository.ts, conflictFieldsOf). An id-collision loser
      // goes through task_already_exists, which carries no input at all -- so
      // this is what separates "a conflict, not a collision" from the m1
      // defect, without bounding how many writers win.
      expect(typeof body.input?.actualRevision).toBe("string");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

// The contract the old test pinned is still live -- a writer that loses a
// race conveys no sent value, so it keeps the concurrent wording and carries
// no sentRevision, which is what makes it tellable apart from the guarded
// failure. Creates no longer reach it, so sixteen racing edits of one task do:
// measured 2026-10-20, 4 runs of 4 lost 7 to 12 of the 16 writers each time.
// The failure count is still asserted non-zero so this cannot pass vacuously.
test("a lost writer race keeps the concurrent wording and no sentRevision (QCLI-425)", async () => {
  const root = await workspace();
  try {
    const created = quest(root, [
      "task",
      "create",
      "Raced",
      ...HUMAN,
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    const id = (JSON.parse(created.stdout) as { data: { id: string } }).data.id;
    const results = await runWriters(
      root,
      Array.from({ length: 16 }, (_, writer) => [
        "task",
        "edit",
        id,
        "--add-note",
        `note ${writer}`,
        ...HUMAN,
        "--json",
      ]),
    );
    const failures = results.filter((result) => result.exitCode !== 0);
    expect(failures.length).toBeGreaterThan(0);
    for (const failure of failures) {
      expect(failure.exitCode).toBe(5);
      const body = JSON.parse(failure.stderr) as ConflictBody;
      expect(body.error_type).toBe("conflict");
      expect(body.message).toBe(CONCURRENT_WORDING);
      expect(body.input?.sentRevision).toBeUndefined();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
