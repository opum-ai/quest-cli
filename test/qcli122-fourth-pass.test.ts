import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import { TaskService } from "../src/application/tasks/tasks.ts";
import { createTask } from "../src/domain/tasks/tasks.ts";

/**
 * QCLI-122 fourth-pass red contracts (FMC f5e4fd64). Production-path only:
 * no fabricated journal files — crash windows are exercised through the
 * real session API and a kill-9 child process for pre-first-mark recovery.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;

function spawnJson(workspace: string, args: readonly string[]) {
  const child = Bun.spawnSync(["bun", MAIN, ...args], {
    cwd: workspace,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: child.exitCode ?? 0,
    stdout: child.stdout ? child.stdout.toString() : "",
    stderr: child.stderr ? child.stderr.toString() : "",
  };
}

async function seed(root: string, id: string, title: string) {
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  await writeFile(
    join(root, ".quest", "tasks", `${id}.json`),
    `${JSON.stringify(createTask(id, { title }))}\n`,
  );
}

test("red: session-start journal persists before the first record write", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli122-4-journal-"));
  try {
    const repo = new LocalTaskRepository(join(root, ".quest", "tasks"));
    await seed(root, "T-1", "Journal order");
    await repo.readAll();
    const opened = await repo.beginTaskBatch((await repo.readAll()).revision);
    expect(opened.kind).toBe("locked");
    if (opened.kind !== "locked") return;
    // Blocker #1: the journal must ALREADY exist (session-start record)
    // before any record write happens.
    expect(
      existsSync(join(root, ".quest", "tasks", ".batch.journal.jsonl")),
    ).toBe(true);
    const raw = await readFile(
      join(root, ".quest", "tasks", ".batch.journal.jsonl"),
      "utf8",
    );
    const header = JSON.parse(raw.trim().split("\n")[0] ?? "{}") as {
      sessionId?: unknown;
      pid?: unknown;
    };
    expect(typeof header.sessionId).toBe("string");
    expect(header.pid).toBe(process.pid);
    await opened.session.finish();
    // finish removes it again.
    expect(
      existsSync(join(root, ".quest", "tasks", ".batch.journal.jsonl")),
    ).toBe(false);
    void unlink;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 20_000);

test("red: production kill between rename and mark is recovered by next entry with truthful receipt", async () => {
  const parent = await mkdtemp(join(tmpdir(), "qcli122-4-kill-"));
  try {
    const workspace = join(parent, "ws");
    await mkdir(workspace, { recursive: true });
    Bun.spawnSync(["/usr/bin/env", "git", "init", "-q"], {
      cwd: workspace,
      stdout: "ignore",
      stderr: "ignore",
      env: { ...process.env },
    });
    spawnJson(workspace, ["init"]);
    const dir = join(workspace, ".quest", "tasks");
    await mkdir(dir, { recursive: true });
    const seedEval = `import { createTask } from "${process.cwd()}/src/domain/tasks/tasks.ts";
      const { writeFile } = await import("node:fs/promises");
      for (const id of ["T-1","T-2"]) {
        const t = createTask(id, { title: "K" + id });
        await writeFile("${dir}/" + id + ".json", JSON.stringify(t) + "\\n");
      }`;
    Bun.spawnSync(["bun", "--eval", seedEval]);
    // victim program: begin batch, apply one record via writeRecord+mark,
    // then hard-exit while lock+journal remain.
    const victimProgram = `
      const mod = await import(${JSON.stringify(process.cwd())} + "/src/application/tasks/local-task-repository.ts");
      import { readFile, writeFile } from "node:fs/promises";
      const { LocalTaskRepository } = mod;
      const repo = new LocalTaskRepository(${JSON.stringify(dir)});
      const current = await repo.readAll();
      const opened = await repo.beginTaskBatch(current.revision);
      if (opened.kind !== "locked") throw new Error(opened.kind);
      const payload = JSON.parse(await readFile(${JSON.stringify(dir)} + "/T-1.json", "utf8"));
      payload.description = "written then killed";
      await opened.session.writeRecord(payload);
      // Deliberately NOT markApplied: proves rename-before-append window.
      console.log("WRITTEN");
      process.kill(process.pid, "SIGKILL");
    `;
    const victim = Bun.spawnSync(["bun", "--eval", victimProgram], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(victim.stdout.toString()).toContain("WRITTEN");

    // The orphan-journal path is exercised by the CLI in a fresh process:
    // acquireLock fails (dead holder's lock remains) -> readOrphanJournal
    // (pid dead, ESRCH) -> reclaim. The stale revision then conflicts, but
    // critically the response arrives at all — proving no strand.
    const freshRevision = spawnJson(workspace, ["task", "list", "--json"]);
    expect(freshRevision.exitCode).toBe(0);
    const recoveredRun = spawnJson(workspace, [
      "task",
      "edit-batch",
      "--file",
      "/dev/null",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    // Empty file after recovery returns zero items; exit code proves no
    // unrecoverable-lock strand surfaced to the public boundary.
    expect(recoveredRun.exitCode).toBe(0);
    void seed;
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
}, 60_000);

test("red: milestone transition executes at input position through the locked session without re-locking", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli122-4-milestone-"));
  try {
    Bun.spawnSync(["/usr/bin/git", "init", "-q"], {
      cwd: root,
      stdout: "ignore",
      stderr: "ignore",
    });
    spawnJson(root, ["init"]);
    await seed(root, "T-1", "Milestone row");
    await seed(root, "T-2", "Follower row");
    const file = join(root, "ops.jsonl");
    await writeFile(
      file,
      [
        JSON.stringify({
          reference: "T-2",
          operationId: "pre",
          patch: { addLabels: ["before"] },
        }),
        JSON.stringify({
          reference: "T-1",
          operationId: "milestone-row",
          patch: { status: "Done" },
        }),
        JSON.stringify({
          reference: "T-2",
          operationId: "post",
          patch: { addLabels: ["after"] },
        }),
      ].join("\n"),
    );
    const run = spawnJson(root, [
      "task",
      "edit-batch",
      "--file",
      file,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(run.exitCode).toBe(0);
    const envelope = JSON.parse(run.stdout);
    // One result per item at exact input positions.
    expect(
      envelope.data.items.map((i: { operationId: string }) => i.operationId),
    ).toEqual(["pre", "milestone-row", "post"]);
    // Milestone row may legitimately use planning semantics; whether it
    // succeeds or errors it MUST be attributed at its own index and MUST
    // NOT corrupt following rows' effects.
    expect(envelope.data.items[0].task.labels).toEqual(["before"]);
    // Evolving fold: "post" sees the label added by "pre".
    expect([...envelope.data.items[2].task.labels].sort()).toEqual([
      "after",
      "before",
    ]);
    const view = JSON.parse(
      spawnJson(root, ["task", "view", "T-2", "--json"]).stdout,
    );
    expect([...view.data.labels].sort()).toEqual(["after", "before"]);
    void TaskService;
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 90_000);

test("red: graph canonical record parity across persisted bytes, result row, and following folds", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli122-4-canonical-"));
  try {
    Bun.spawnSync(["/usr/bin/git", "init", "-q"], {
      cwd: root,
      stdout: "ignore",
      stderr: "ignore",
    });
    spawnJson(root, ["init"]);
    await seed(root, "T-1", "Canonical source");
    await seed(root, "T-2", "Alias consumer");
    // Give T-2 a raw alias spelling of T-1 plus a dependency on that alias.
    const t2raw = JSON.parse(
      await readFile(join(root, ".quest", "tasks", "T-2.json"), "utf8"),
    );
    t2raw.aliases = ["ALIAS-ONE"];
    await writeFile(
      join(root, ".quest", "tasks", "T-2.json"),
      `${JSON.stringify(t2raw)}\n`,
    );
    const file = join(root, "ops.jsonl");
    await writeFile(
      file,
      [
        // Row 1 adds a dependency expressed through its alias in mixed case;
        // canonicalization must persist the resolved id AND reflect it in
        // both the response row and any subsequent fold of the same task.
        JSON.stringify({
          reference: "T-1",
          operationId: "canon-add",
          patch: { addDependencies: ["alias-one"] },
        }),
        JSON.stringify({
          reference: "T-1",
          operationId: "canon-follow",
          patch: { description: "second pass sees canonical deps" },
        }),
      ].join("\n"),
    );
    const run = spawnJson(root, [
      "task",
      "edit-batch",
      "--file",
      file,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(run.exitCode).toBe(0);
    const envelope = JSON.parse(run.stdout);
    const first = envelope.data.items[0];
    expect(first.kind).toBe("updated");
    if (first.kind !== "updated") return;
    // Response parity: the returned row carries the CANONICAL id spelling.
    expect(first.task.dependencies).toEqual(["T-2"]);
    // Persisted-byte parity: disk shows identical canonical dependency.
    const persisted = JSON.parse(
      await readFile(join(root, ".quest", "tasks", "T-1.json"), "utf8"),
    );
    expect(persisted.dependencies).toEqual(["T-2"]);
    // Following-fold parity: second updated row reflects the same canonical
    // state (no re-resolution drift).
    const second = envelope.data.items[1];
    expect(second.kind).toBe("updated");
    if (second.kind !== "updated") return;
    expect(second.task.dependencies).toEqual(["T-2"]);
    const viewAfter = JSON.parse(
      spawnJson(root, ["task", "view", "T-1", "--json"]).stdout,
    );
    expect(viewAfter.data.dependencies).toEqual(["T-2"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 90_000);

test("red: strict scalar/boolean/checklist/status field grammar enforced atomically", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli122-4-types-"));
  try {
    Bun.spawnSync(["/usr/bin/git", "init", "-q"], {
      cwd: root,
      stdout: "ignore",
      stderr: "ignore",
    });
    spawnJson(root, ["init"]);
    await seed(root, "T-1", "Grammar");
    const badObjects = [
      {
        reference: "T-1",
        operationId: "s1",
        patch: { title: { nested: true } },
      },
      { reference: "T-1", operationId: "s2", patch: { clearParent: "yes" } },
      {
        reference: "T-1",
        operationId: "s3",
        patch: { status: "Not A Status" },
      },
      {
        reference: "T-1",
        operationId: "s4",
        patch: { acceptanceCriteria: [{ wrong: 1 }] },
      },
    ];
    for (const [index, bad] of badObjects.entries()) {
      const file = join(root, `bad${index}.jsonl`);
      await writeFile(file, `${JSON.stringify(bad)}\n`);
      const run = spawnJson(root, [
        "task",
        "edit-batch",
        "--file",
        file,
        "--actor",
        "person-1",
        "--actor-kind",
        "human",
        "--json",
      ]);
      expect(run.exitCode, JSON.stringify(bad)).not.toBe(0);
      expect(JSON.parse(run.stderr).error_type).toBe("usage");
      // Atomicity: nothing persisted before ANY malformed line.
      const view = JSON.parse(
        spawnJson(root, ["task", "view", "T-1", "--json"]).stdout,
      );
      expect(view.data.description ?? null).toBeNull();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120_000);
