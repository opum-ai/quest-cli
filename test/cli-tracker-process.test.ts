import { expect, test } from "bun:test";
import { realpathSync, writeFileSync } from "node:fs";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { safeStorageName } from "../src/adapters/claims/local-claim-evidence.ts";

const source = join(import.meta.dir, "..", "src", "cli", "main.ts");
const compiled = join(
  import.meta.dir,
  "..",
  "npm",
  `quest-${process.platform}-${process.arch}`,
  "bin",
  process.platform === "win32" ? "quest.exe" : "quest",
);
const conformance = join(
  import.meta.dir,
  "..",
  "fixtures",
  "tracker",
  "v1",
  "conformance.mjs",
);

async function quest(store: string, argv: readonly string[]) {
  const child = Bun.spawn(["bun", source, ...argv], {
    cwd: store,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function questWithStdin(
  store: string,
  argv: readonly string[],
  stdinBody: string,
) {
  const child = Bun.spawn(["bun", source, ...argv, "--json"], {
    cwd: store,
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  child.stdin.write(stdinBody);
  await child.stdin.end();
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function compiledQuest(store: string, argv: readonly string[]) {
  const child = Bun.spawn([compiled, ...argv], {
    cwd: store,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function questUntilOutput(store: string, argv: readonly string[]) {
  const child = Bun.spawn(["bun", source, ...argv], {
    cwd: store,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  const reader = child.stdout.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  child.kill();
  await child.exited;
  return {
    stdout: new TextDecoder().decode(value),
    stderr: await new Response(child.stderr).text(),
  };
}

async function initializeGitWorktree(path: string): Promise<void> {
  const child = Bun.spawn(["git", "init", "--quiet", path], {
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(await child.exited).toBe(0);
}

async function backlogSourceFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "quest-human-backlog-source-"));
  const tasks = join(root, "backlog", "tasks");
  await mkdir(tasks, { recursive: true });
  await writeFile(
    join(tasks, "TASK-1.md"),
    "---\nid: TASK-1\ntitle: Human output migration\nstatus: To Do\n---\n",
  );
  return root;
}

test("the installed executable routes persistent tracker reads and writes as JSON subprocess records", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-tracker-"));
  try {
    expect(await quest(store, ["--version"])).toMatchObject({
      exitCode: 0,
      stdout: "0.2.9\n",
      stderr: "",
    });
    const manifest = await quest(store, ["manifest", "--json"]);
    expect(JSON.parse(manifest.stdout).data.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "task create", mutates: true }),
      ]),
    );
    const created = await quest(store, [
      "task",
      "create",
      "argv; safe",
      "--label",
      "one",
      "--label",
      "alpha",
      "--doc",
      "docs/example.md",
      "--doc",
      "docs/other.md",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    const createdTask = JSON.parse(created.stdout).data;
    expect(createdTask).toMatchObject({
      title: "argv; safe",
      labels: ["one", "alpha"],
      documentation: ["docs/example.md", "docs/other.md"],
    });
    expect(createdTask.id).toMatch(/^T-[1-9][0-9]*$/);
    const listed = await quest(store, [
      "task",
      "list",
      "--label",
      "one",
      "--label",
      "alpha",
      "--json",
    ]);
    expect(JSON.parse(listed.stdout)).toMatchObject({
      kind: "task.list",
      data: [{ id: createdTask.id }],
    });
    const edited = await quest(store, [
      "task",
      "edit",
      createdTask.id,
      "--add-label",
      "two",
      "--add-label",
      "three",
      "--remove-label",
      "one",
      "--remove-label",
      "alpha",
      "--doc",
      "docs/edited-a.md",
      "--doc",
      "docs/edited-b.md",
      "--actor",
      "agent-1",
      "--actor-kind",
      "delegated-agent",
      "--accountable-human",
      "person-1",
      "--json",
    ]);
    expect(JSON.parse(edited.stdout)).toMatchObject({
      kind: "task.updated",
      data: {
        labels: ["two", "three"],
        documentation: ["docs/edited-a.md", "docs/edited-b.md"],
      },
    });
    const dashValue = await quest(store, [
      "task",
      "create",
      "dash value",
      "--description",
      "--starts-with-dashes",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(dashValue).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(dashValue.stderr)).toMatchObject({
      error_type: "usage",
      message:
        "--description requires a value; use --description=<value> if the value begins with --.",
    });

    const secondTask = JSON.parse(
      (
        await quest(store, [
          "task",
          "create",
          "second",
          "--actor",
          "person-1",
          "--actor-kind",
          "human",
          "--json",
        ])
      ).stdout,
    ).data;
    const milestone = await quest(store, [
      "milestone",
      "create",
      "repeated task refs",
      "--task",
      createdTask.id,
      "--task",
      secondTask.id,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(milestone.exitCode).toBe(0);
    const milestoneId = JSON.parse(milestone.stdout).data.record.id as string;
    const viewedMilestone = await quest(store, [
      "milestone",
      "view",
      milestoneId,
      "--json",
    ]);
    expect(JSON.parse(viewedMilestone.stdout)).toMatchObject({
      data: { taskIds: [createdTask.id, secondTask.id] },
    });
    const thirdTask = JSON.parse(
      (
        await quest(store, [
          "task",
          "create",
          "third",
          "--actor",
          "person-1",
          "--actor-kind",
          "human",
          "--json",
        ])
      ).stdout,
    ).data;
    const added = await quest(store, [
      "milestone",
      "edit",
      milestoneId,
      "--add-task",
      thirdTask.id,
      "--add-task",
      thirdTask.id,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(added.stdout)).toMatchObject({
      kind: "milestone.updated",
      data: {
        record: { taskIds: [createdTask.id, secondTask.id, thirdTask.id] },
      },
    });
    const removed = await quest(store, [
      "milestone",
      "edit",
      milestoneId,
      "--remove-task",
      createdTask.id,
      "--remove-task",
      createdTask.id,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(removed.stdout)).toMatchObject({
      kind: "milestone.updated",
      data: { record: { taskIds: [secondTask.id, thirdTask.id] } },
    });
    const replaced = await quest(store, [
      "milestone",
      "edit",
      milestoneId,
      "--replace-task",
      createdTask.id,
      "--replace-task",
      thirdTask.id,
      "--replace-task",
      createdTask.id,
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(replaced.stdout)).toMatchObject({
      kind: "milestone.updated",
      data: { record: { taskIds: [createdTask.id, thirdTask.id] } },
    });
    for (const argv of [
      ["--task", thirdTask.id],
      ["--replace-task", thirdTask.id, "--add-task", secondTask.id],
      ["--add-task", thirdTask.id, "--remove-task", thirdTask.id],
    ]) {
      const invalid = await quest(store, [
        "milestone",
        "edit",
        milestoneId,
        ...argv,
        "--actor",
        "person-1",
        "--actor-kind",
        "human",
        "--json",
      ]);
      expect(invalid.exitCode).toBe(2);
      expect(JSON.parse(invalid.stderr)).toMatchObject({ error_type: "usage" });
    }
    const decision = JSON.parse(
      (
        await quest(store, [
          "decision",
          "create",
          "unchanged decision",
          "--outcome",
          "original outcome",
          "--actor",
          "person-1",
          "--actor-kind",
          "human",
          "--json",
        ])
      ).stdout,
    ).data.record;
    for (const flag of [
      "--add-task",
      "--remove-task",
      "--replace-task",
    ] as const) {
      const invalid = await quest(store, [
        "decision",
        "edit",
        decision.id,
        flag,
        thirdTask.id,
        "--actor",
        "person-1",
        "--actor-kind",
        "human",
        "--json",
      ]);
      expect(invalid.exitCode).toBe(2);
      expect(JSON.parse(invalid.stderr)).toMatchObject({ error_type: "usage" });
    }
    const viewedDecision = JSON.parse(
      (await quest(store, ["decision", "view", decision.id, "--json"])).stdout,
    );
    expect(viewedDecision).toMatchObject({
      data: { id: decision.id, outcome: "original outcome" },
    });
    const denied = await quest(store, ["task", "create", "no actor", "--json"]);
    expect(denied.exitCode).toBe(4);
    expect(JSON.parse(denied.stderr)).toMatchObject({ error_type: "denied" });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("inline free-text flag values preserve literal dash-prefixed bytes in storage", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-inline-values-"));
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    const description = "--description=first=equals";
    const task = JSON.parse(
      (
        await quest(store, [
          "task",
          "create",
          "Inline task",
          `--description=${description}`,
          ...human,
        ])
      ).stdout,
    ).data;
    expect(
      JSON.parse(
        (await quest(store, ["task", "view", task.id, "--json"])).stdout,
      ),
    ).toMatchObject({ data: { description } });

    const milestone = JSON.parse(
      (
        await quest(store, [
          "milestone",
          "create",
          "Inline milestone",
          ...human,
        ])
      ).stdout,
    ).data.record.id as string;
    const title = "--title=first=equals";
    expect(
      JSON.parse(
        (
          await quest(store, [
            "milestone",
            "edit",
            milestone,
            `--title=${title}`,
            ...human,
          ])
        ).stdout,
      ),
    ).toMatchObject({ data: { record: { title } } });
    expect(
      JSON.parse(
        (await quest(store, ["milestone", "view", milestone, "--json"])).stdout,
      ),
    ).toMatchObject({ data: { title } });

    const context = "--context=first=equals";
    const outcome = "--outcome=first=equals";
    const decision = JSON.parse(
      (
        await quest(store, [
          "decision",
          "create",
          "Inline decision",
          `--context=${context}`,
          `--outcome=${outcome}`,
          ...human,
        ])
      ).stdout,
    ).data.record.id as string;
    expect(
      JSON.parse(
        (await quest(store, ["decision", "view", decision, "--json"])).stdout,
      ),
    ).toMatchObject({ data: { context, outcome } });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("concurrent task writers expose only readable retryable conflicts", async () => {
  const actor = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  for (let round = 0; round < 5; round += 1) {
    const store = await mkdtemp(join(tmpdir(), "quest-contention-"));
    try {
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, writer) =>
          quest(store, [
            "task",
            "create",
            `Concurrent ${round}-${writer}`,
            ...actor,
          ]),
        ),
      );
      const failures = results.filter((result) => result.exitCode !== 0);
      expect(failures.length).toBeGreaterThan(0);
      for (const result of failures) {
        expect(result).toMatchObject({ exitCode: 5, stdout: "" });
        expect(result.stderr).not.toContain("dependency_target_ambiguous");
        expect(JSON.parse(result.stderr)).toMatchObject({
          error_type: "conflict",
          message:
            "Task state changed concurrently; the operation was not applied.",
          hint: "Read the latest task state and retry the operation.",
        });
      }
      const doctor = await quest(store, ["doctor", "--json"]);
      expect(doctor).toMatchObject({ exitCode: 0, stderr: "" });
    } finally {
      await rm(store, { recursive: true, force: true });
    }
  }
}, 30_000);

test("task-store permission failures are denied without mutation", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-permissions-"));
  const taskDirectory = join(store, ".quest", "tasks");
  const actor = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    const created = await quest(store, [
      "task",
      "create",
      "Before permissions",
      ...actor,
    ]);
    expect(created).toMatchObject({ exitCode: 0, stderr: "" });
    await chmod(taskDirectory, 0o555);

    const denied = await quest(store, [
      "task",
      "create",
      "Must not persist",
      ...actor,
    ]);
    expect(denied).toMatchObject({ exitCode: 4, stdout: "" });
    expect(JSON.parse(denied.stderr)).toMatchObject({
      error_type: "denied",
      message: expect.stringContaining("Quest cannot access required storage"),
      hint: "Check the task-store filesystem permissions and retry.",
    });

    const listed = await quest(store, ["task", "list", "--json"]);
    expect(listed).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(listed.stdout).data).toEqual([
      expect.objectContaining({ title: "Before permissions" }),
    ]);
  } finally {
    await chmod(taskDirectory, 0o755).catch(() => undefined);
    await rm(store, { recursive: true, force: true });
  }
});

test("the compiled binary rejects missing and duplicate status values", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-compiled-flags-"));
  try {
    for (const [argv, message] of [
      [
        ["task", "list", "--status", "--json"],
        "--status requires a value; use --status=<value> if the value begins with --.",
      ],
      [
        ["task", "list", "--status", "To Do", "--status", "Done", "--json"],
        "--status may only be provided once.",
      ],
    ] as const) {
      const result = await compiledQuest(store, argv);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message,
      });
    }
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("the versioned fixture runs without importing Quest source", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-conformance-"));
  try {
    const child = Bun.spawn(["bun", conformance], {
      cwd: store,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...Bun.env,
        QUEST_TASK_STORE: store,
        QUEST_EXECUTABLE: "bun",
        QUEST_EXECUTABLE_ARGS: JSON.stringify([source]),
      },
    });
    expect(await child.exited).toBe(0);
    expect(await new Response(child.stdout).text()).toContain(
      "Tracker conformance fixture v1 passed.",
    );
    expect(await new Response(child.stderr).text()).toBe("");
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("a live storage lock produces a bounded conflict diagnostic", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-lock-diagnostic-"));
  try {
    await mkdir(join(store, ".quest", "tasks", ".write.lock"), {
      recursive: true,
    });
    const started = performance.now();
    const result = await quest(store, [
      "task",
      "create",
      "blocked",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(performance.now() - started).toBeLessThan(1_000);
    expect(result.exitCode).toBe(5);
    expect(JSON.parse(result.stderr)).toMatchObject({ error_type: "conflict" });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("public lifecycle, draft, and planning routes preserve their declared envelopes", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-parity-routes-"));
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    const task = JSON.parse(
      (await quest(store, ["task", "create", "Lifecycle task", ...human]))
        .stdout,
    ).data;
    expect(
      JSON.parse(
        (
          await quest(store, [
            "task",
            "edit",
            task.id,
            "--status",
            "In Progress",
            ...human,
          ])
        ).stdout,
      ),
    ).toMatchObject({ kind: "task.updated", data: { id: task.id } });
    expect(
      JSON.parse(
        (await quest(store, ["task", "complete", task.id, ...human])).stdout,
      ),
    ).toMatchObject({
      kind: "task.completed",
      data: { task: { id: task.id, status: "Done" } },
    });
    expect(
      JSON.parse(
        (await quest(store, ["task", "archive", task.id, ...human])).stdout,
      ),
    ).toMatchObject({
      kind: "task.archived",
      data: { task: { id: task.id } },
    });

    const draft = JSON.parse(
      (await quest(store, ["draft", "create", "Draft", ...human])).stdout,
    ).data;
    expect(
      JSON.parse(
        (await quest(store, ["draft", "view", draft.draft.id, "--json"]))
          .stdout,
      ),
    ).toMatchObject({
      kind: "draft.view",
      data: { draft: { id: draft.draft.id } },
    });
    expect(
      JSON.parse(
        (await quest(store, ["draft", "promote", draft.draft.id, ...human]))
          .stdout,
      ),
    ).toMatchObject({
      kind: "draft.promoted",
      data: { task: { id: "T-2" } },
    });

    const milestone = JSON.parse(
      (await quest(store, ["milestone", "create", "M1", ...human])).stdout,
    ).data.record.id as string;
    expect(
      JSON.parse(
        (await quest(store, ["milestone", "view", milestone, "--json"])).stdout,
      ),
    ).toMatchObject({ kind: "milestone.view", data: { id: milestone } });
    const decision = JSON.parse(
      (await quest(store, ["decision", "create", "D1", ...human])).stdout,
    ).data.record.id as string;
    expect(
      JSON.parse(
        (await quest(store, ["decision", "view", decision, "--json"])).stdout,
      ),
    ).toMatchObject({ kind: "decision.view", data: { id: decision } });
    expect(
      JSON.parse(
        (
          await quest(store, [
            "milestone",
            "edit",
            milestone,
            "--title",
            "M1 edited",
            ...human,
          ])
        ).stdout,
      ),
    ).toMatchObject({
      kind: "milestone.updated",
      data: { record: { id: milestone, title: "M1 edited" } },
    });
    expect(
      JSON.parse(
        (
          await quest(store, [
            "decision",
            "edit",
            decision,
            "--outcome",
            "Decided",
            ...human,
          ])
        ).stdout,
      ),
    ).toMatchObject({
      kind: "decision.updated",
      data: { record: { id: decision, outcome: "Decided" } },
    });
    const deletedMilestone = JSON.parse(
      (
        await quest(store, [
          "milestone",
          "create",
          "Delete milestone",
          ...human,
        ])
      ).stdout,
    ).data.record.id as string;
    expect(
      JSON.parse(
        (
          await quest(store, [
            "milestone",
            "delete",
            deletedMilestone,
            ...human,
          ])
        ).stdout,
      ),
    ).toMatchObject({
      kind: "milestone.deleted",
      data: { record: { id: deletedMilestone } },
    });
    const deletedDecision = JSON.parse(
      (await quest(store, ["decision", "create", "Delete decision", ...human]))
        .stdout,
    ).data.record.id as string;
    expect(
      JSON.parse(
        (await quest(store, ["decision", "delete", deletedDecision, ...human]))
          .stdout,
      ),
    ).toMatchObject({
      kind: "decision.deleted",
      data: { record: { id: deletedDecision } },
    });
    for (const [argv, kind] of [
      [["overview", "--json"], "project.overview"],
      [["board", "--json"], "project.board"],
      [["doctor", "--json"], "project.doctor"],
      [["search", "M1", "--all", "--json"], "search.results"],
    ] as const) {
      const result = await quest(store, argv);
      expect(result.exitCode).toBe(0);
      expect(JSON.parse(result.stdout)).toMatchObject({ kind });
    }
    const cleanup = await quest(store, ["cleanup", "--dry-run", ...human]);
    expect(JSON.parse(cleanup.stdout)).toMatchObject({
      kind: "project.cleanup",
    });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

async function invokeEveryManifestPayloadCommand(mode: "--plain" | "--json") {
  const store = await mkdtemp(join(tmpdir(), "quest-human-output-"));
  const backlogSource = await backlogSourceFixture();
  const actor = ["--actor", "person-1", "--actor-kind", "human"];
  try {
    await initializeGitWorktree(store);
    const manifest = JSON.parse(
      (await quest(store, ["manifest", "--json"])).stdout,
    ).data.commands as readonly {
      readonly name: string;
      readonly kind: string | null;
    }[];
    const created = JSON.parse(
      (await quest(store, ["task", "create", "Existing", ...actor, "--json"]))
        .stdout,
    ).data.id as string;
    const draft = JSON.parse(
      (
        await quest(store, [
          "draft",
          "create",
          "Existing draft",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.draft.id as string;
    const archivableDraft = JSON.parse(
      (
        await quest(store, [
          "draft",
          "create",
          "Archivable draft",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.draft.id as string;
    const milestone = JSON.parse(
      (
        await quest(store, [
          "milestone",
          "create",
          "Existing milestone",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.record.id as string;
    const milestoneToArchive = JSON.parse(
      (
        await quest(store, [
          "milestone",
          "create",
          "Archived milestone",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.record.id as string;
    const milestoneToDelete = JSON.parse(
      (
        await quest(store, [
          "milestone",
          "create",
          "Deleted milestone",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.record.id as string;
    const decision = JSON.parse(
      (
        await quest(store, [
          "decision",
          "create",
          "Existing decision",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.record.id as string;
    const decisionToDelete = JSON.parse(
      (
        await quest(store, [
          "decision",
          "create",
          "Deleted decision",
          ...actor,
          "--json",
        ])
      ).stdout,
    ).data.record.id as string;
    const bound = JSON.parse(
      (await quest(store, ["task", "create", "Bound", ...actor, "--json"]))
        .stdout,
    ).data.id as string;
    await quest(store, [
      "task",
      "edit",
      bound,
      "--status",
      "In Progress",
      "--add-reference",
      "binding-correlation",
      ...actor,
      "--json",
    ]);

    const relationshipsDirectory = join(store, ".quest", "relationships");
    await mkdir(relationshipsDirectory, { recursive: true });
    const commonDirectory = Bun.spawnSync(
      ["git", "rev-parse", "--git-common-dir"],
      { cwd: store, stdout: "pipe" },
    )
      .stdout.toString()
      .trim();
    const repositoryId = commonDirectory.startsWith("/")
      ? commonDirectory
      : join(realpathSync(store), commonDirectory);
    await writeFile(
      join(
        relationshipsDirectory,
        `${safeStorageName("binding-correlation")}.json`,
      ),
      JSON.stringify({
        schemaVersion: 1,
        id: "binding-correlation",
        taskId: bound,
        kind: "correlation",
        state: "accepted",
        holder: "person-1",
        baseRef: "origin/dev",
        settlementRef: "origin/dev",
      }),
    );
    Bun.spawnSync(["git", "add", "-A"], { cwd: store });
    Bun.spawnSync(
      [
        "git",
        "-c",
        "user.email=t@t",
        "-c",
        "user.name=t",
        "commit",
        "-m",
        "evidence",
      ],
      { cwd: store },
    );

    const migrationDigest = JSON.parse(
      (
        await quest(store, [
          "migration",
          "backlog",
          "preview",
          "--source",
          backlogSource,
          "--json",
        ])
      ).stdout,
    ).data.digest as string;

    const invocations: Record<string, readonly string[]> = {
      manifest: ["manifest", "--plain"],
      version: ["version"],
      help: ["--help", "--plain"],
      init: ["init", "--plain"],
      instructions: ["instructions", "--plain"],
      agents: ["agents", "--update-instructions", "--plain"],
      completion: ["completion", "bash", "--plain"],
      "migration backlog preview": [
        "migration",
        "backlog",
        "preview",
        "--source",
        backlogSource,
        "--plain",
      ],
      "migration backlog apply": [
        "migration",
        "backlog",
        "apply",
        "--source",
        backlogSource,
        "--digest",
        migrationDigest,
        ...actor,
        "--plain",
      ],
      "migration backlog status": [
        "migration",
        "backlog",
        "status",
        "--digest",
        migrationDigest,
        "--plain",
      ],
      "migration backlog rollback": [
        "migration",
        "backlog",
        "rollback",
        "--digest",
        migrationDigest,
        ...actor,
        "--plain",
      ],
      "task status-flow": ["task", "status-flow", "--plain"],
      "task binding": [
        "task",
        "binding",
        "--contract",
        "opum-agent-workflow/v1",
        "--task",
        bound,
        "--claim-or-correlation",
        "binding-correlation",
        "--holder",
        "person-1",
        "--repository",
        repositoryId,
        "--base",
        "origin/dev",
        "--settlement",
        "origin/dev",
        "--plain",
      ],
      "task list": ["task", "list", "--plain"],
      "task view": ["task", "view", created, "--plain"],
      search: ["search", "Existing", "--plain"],
      "search --all": ["search", "Existing", "--all", "--plain"],
      "task create": ["task", "create", "Plain create", ...actor, "--plain"],
      "task edit": [
        "task",
        "edit",
        created,
        "--status",
        "In Progress",
        ...actor,
        "--plain",
      ],
      "task edit-batch": (() => {
        const operations = join(store, `ops-${safeStorageName(created)}.jsonl`);
        writeFileSync(
          operations,
          [
            JSON.stringify({
              reference: created,
              operationId: "batch-1",
              patch: { addLabels: ["batched"] },
            }),
            "",
          ].join("\n"),
        );
        return [
          "task",
          "edit-batch",
          "--file",
          operations,
          ...actor,
          "--plain",
        ];
      })(),
      "task complete": ["task", "complete", created, ...actor, "--plain"],
      "task archive": ["task", "archive", created, ...actor, "--plain"],
      "task demote": ["task", "demote", created, ...actor, "--plain"],
      "draft create": ["draft", "create", "Plain draft", ...actor, "--plain"],
      "draft list": ["draft", "list", "--plain"],
      "draft view": ["draft", "view", draft, "--plain"],
      "draft promote": ["draft", "promote", draft, ...actor, "--plain"],
      "draft archive": [
        "draft",
        "archive",
        archivableDraft,
        ...actor,
        "--plain",
      ],
      "milestone list": ["milestone", "list", "--plain"],
      "milestone view": ["milestone", "view", milestone, "--plain"],
      "milestone create": [
        "milestone",
        "create",
        "Plain milestone",
        ...actor,
        "--plain",
      ],
      "milestone edit": [
        "milestone",
        "edit",
        milestone,
        "--title",
        "Edited milestone",
        ...actor,
        "--plain",
      ],
      "milestone delete": [
        "milestone",
        "delete",
        milestoneToDelete,
        ...actor,
        "--plain",
      ],
      "milestone archive": [
        "milestone",
        "archive",
        milestoneToArchive,
        ...actor,
        "--plain",
      ],
      "decision list": ["decision", "list", "--plain"],
      "decision view": ["decision", "view", decision, "--plain"],
      "decision create": [
        "decision",
        "create",
        "Plain decision",
        ...actor,
        "--plain",
      ],
      "decision edit": [
        "decision",
        "edit",
        decision,
        "--outcome",
        "Edited decision",
        ...actor,
        "--plain",
      ],
      "decision delete": [
        "decision",
        "delete",
        decisionToDelete,
        ...actor,
        "--plain",
      ],
      overview: ["overview", "--plain"],
      board: ["board", "--plain"],
      doctor: ["doctor", "--plain"],
      cleanup: ["cleanup", "--dry-run", ...actor, "--plain"],
      browser: ["browser", "--plain"],
    };

    const outputs = new Map<string, string>();
    for (const entry of manifest) {
      const recipe = invocations[entry.name];
      expect(
        recipe,
        `missing invocation recipe for ${entry.name}`,
      ).toBeDefined();
      const argv = recipe?.map((argument) =>
        argument === "--plain" ? mode : argument,
      );
      expect(argv).toBeDefined();
      const result =
        entry.name === "browser"
          ? await questUntilOutput(store, argv ?? [])
          : entry.name === "task binding"
            ? await questWithStdin(
                store,
                ["task", "binding", "--contract", "opum-agent-workflow/v1"],
                JSON.stringify({
                  contract: "opum-agent-workflow",
                  supportedVersions: [1],
                  requestId: "0".repeat(32),
                  taskId: bound,
                }),
              )
            : await (async () => {
                const invocation = await quest(store, argv ?? []);
                if (invocation.exitCode !== 0)
                  throw new Error(`${entry.name}: ${invocation.stderr}`);
                expect(invocation.exitCode, entry.name).toBe(0);
                return invocation;
              })();
      const diagnostic = result.stderr
        ? (JSON.parse(result.stderr) as { readonly error_type?: string })
        : undefined;
      expect(diagnostic?.error_type, entry.name).not.toBe("usage");
      outputs.set(entry.name, result.stdout);
    }
    return { manifest, outputs };
  } finally {
    await rm(store, { recursive: true, force: true });
    await rm(backlogSource, { recursive: true, force: true });
  }
}

test("every manifest payload command renders more than its kind in plain mode", async () => {
  const { manifest, outputs } =
    await invokeEveryManifestPayloadCommand("--plain");
  for (const entry of manifest.filter(
    (command): command is { readonly name: string; readonly kind: string } =>
      command.kind !== null,
  )) {
    const stdout = outputs.get(entry.name);
    expect(stdout, entry.name).toBeDefined();
    expect(stdout, entry.name).not.toBe(`${entry.kind}\n`);
    expect(stdout?.trim(), entry.name).not.toBe("");
  }
}, 15_000);

test("every manifest payload command declares principal null as its last JSON key", async () => {
  const { manifest, outputs } =
    await invokeEveryManifestPayloadCommand("--json");
  for (const entry of manifest.filter(
    (command): command is { readonly name: string; readonly kind: string } =>
      command.kind !== null,
  )) {
    const stdout = outputs.get(entry.name);
    expect(stdout, entry.name).toBeDefined();
    const envelope = JSON.parse(stdout ?? "") as Record<string, unknown>;
    if (entry.name === "task binding") {
      // The public opum-agent-workflow/v1 envelope is its own closed shape.
      expect(envelope.contract, entry.name).toBe("opum-agent-workflow");
      continue;
    }
    expect(envelope.principal, entry.name).toBeNull();
    expect(Object.keys(envelope).at(-1), entry.name).toBe("principal");
  }
}, 15_000);

test("task edit can mutate title, priority, type and ordinal (QCLI-133)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-edit-fields-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    const created = await quest(store, [
      "task",
      "create",
      "Typo titel",
      "--priority",
      "High",
      "--type",
      "bug",
      "--ordinal",
      "5",
      ...human,
    ]);
    expect(created.exitCode).toBe(0);
    expect(JSON.parse(created.stdout).data).toMatchObject({
      id: "T-1",
      title: "Typo titel",
      priority: "High",
      type: "bug",
      ordinal: 5,
    });

    // All four previously exited 2 with "task edit received invalid arguments".
    const edited = await quest(store, [
      "task",
      "edit",
      "T-1",
      "--title",
      "Fixed title",
      "--priority",
      "Low",
      "--type",
      "feature",
      "--ordinal",
      "10",
      ...human,
    ]);
    expect(edited.exitCode).toBe(0);
    expect(JSON.parse(edited.stdout).data).toMatchObject({
      id: "T-1",
      title: "Fixed title",
      priority: "Low",
      type: "feature",
      ordinal: 10,
    });

    // The rename keeps the record's identity rather than forcing a replacement.
    const viewed = await quest(store, ["task", "view", "T-1", "--json"]);
    expect(JSON.parse(viewed.stdout).data).toMatchObject({
      id: "T-1",
      title: "Fixed title",
      aliases: [],
    });

    // Each field is independently settable, not all-or-nothing.
    const titleOnly = await quest(store, [
      "task",
      "edit",
      "T-1",
      "--title",
      "Third title",
      ...human,
    ]);
    expect(titleOnly.exitCode).toBe(0);
    expect(JSON.parse(titleOnly.stdout).data).toMatchObject({
      title: "Third title",
      priority: "Low",
      type: "feature",
      ordinal: 10,
    });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task edit --ordinal rejects a non-integer exactly as create does (QCLI-133)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-edit-ordinal-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, ["task", "create", "T", ...human]);
    for (const argv of [
      ["task", "create", "Other", "--ordinal", "1.5", ...human],
      ["task", "edit", "T-1", "--ordinal", "1.5", ...human],
    ]) {
      const result = await quest(store, argv);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message: "--ordinal must be an integer.",
      });
    }
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("the published manifest advertises the four newly editable fields (QCLI-133)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-edit-manifest-"));
  try {
    const manifest = await quest(store, ["manifest", "--json"]);
    const registry = JSON.parse(manifest.stdout);
    // Both edit transports share one fold, so both must advertise the fields.
    for (const name of ["task edit", "task edit-batch"]) {
      const entry = registry.data.commands.find(
        (command: { name: string }) => command.name === name,
      );
      for (const field of ["title", "priority", "type", "ordinal"]) {
        expect(entry.fields, `${name} advertises ${field}`).toContain(field);
      }
    }
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("the published manifest advertises every task list filter (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-manifest-"));
  try {
    const manifest = await quest(store, ["manifest", "--json"]);
    const registry = JSON.parse(manifest.stdout);
    const entry = registry.data.commands.find(
      (command: { name: string }) => command.name === "task list",
    );
    expect([...entry.filters].sort()).toEqual([
      "assignee",
      "exclude-status",
      "label",
      "limit",
      "milestone",
      "parent",
      "priority",
      "ready",
      "search",
      "sort",
      "status",
      "type",
      "unassigned",
    ]);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list --ready returns only dependency-unblocked tasks (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-ready-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, ["task", "create", "Blocker", ...human]);
    await quest(store, [
      "task",
      "create",
      "Blocked",
      "--dependency",
      "T-1",
      ...human,
    ]);
    const listed = await quest(store, ["task", "list", "--ready", "--json"]);
    expect(listed).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(listed.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);
    await quest(store, [
      "task",
      "edit",
      "T-1",
      "--status",
      "In Progress",
      ...human,
    ]);
    await quest(store, ["task", "edit", "T-1", "--status", "Done", ...human]);
    const readyAfterCompletion = await quest(store, [
      "task",
      "list",
      "--ready",
      "--json",
    ]);
    expect(JSON.parse(readyAfterCompletion.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list --ready composes with --label (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-ready-label-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, [
      "task",
      "create",
      "Ready backend",
      "--label",
      "backend",
      ...human,
    ]);
    // Depends on the backend task, which the frontend label filter excludes.
    await quest(store, [
      "task",
      "create",
      "Blocked frontend",
      "--label",
      "frontend",
      "--dependency",
      "T-1",
      ...human,
    ]);
    const listed = await quest(store, [
      "task",
      "list",
      "--ready",
      "--label",
      "backend",
      "--json",
    ]);
    expect(JSON.parse(listed.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);
    // Readiness is computed over the whole collection before the label filter
    // runs. Computing it after would drop the T-1 edge and call T-2 ready.
    const blocked = await quest(store, [
      "task",
      "list",
      "--ready",
      "--label",
      "frontend",
      "--json",
    ]);
    expect(JSON.parse(blocked.stdout).data).toEqual([]);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list selection filters compose: exclude-status, assignee, unassigned, milestone, parent, priority, type, search (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-filters-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, [
      "task",
      "create",
      "Alpha",
      "--priority",
      "high",
      "--type",
      "feature",
      "--assignee",
      "person-1",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Beta",
      "--priority",
      "low",
      "--type",
      "bug",
      "--parent",
      "T-1",
      ...human,
    ]);
    await quest(store, [
      "task",
      "edit",
      "T-1",
      "--status",
      "In Progress",
      ...human,
    ]);
    await quest(store, ["task", "edit", "T-1", "--status", "Done", ...human]);

    const excludeDone = await quest(store, [
      "task",
      "list",
      "--exclude-status",
      "Done",
      "--json",
    ]);
    expect(JSON.parse(excludeDone.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);

    const byAssignee = await quest(store, [
      "task",
      "list",
      "--assignee",
      "person-1",
      "--json",
    ]);
    expect(JSON.parse(byAssignee.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);

    const unassigned = await quest(store, [
      "task",
      "list",
      "--unassigned",
      "--json",
    ]);
    expect(JSON.parse(unassigned.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);

    const byParent = await quest(store, [
      "task",
      "list",
      "--parent",
      "T-1",
      "--json",
    ]);
    expect(JSON.parse(byParent.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);

    const byPriority = await quest(store, [
      "task",
      "list",
      "--priority",
      "high",
      "--json",
    ]);
    expect(JSON.parse(byPriority.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);

    const byType = await quest(store, [
      "task",
      "list",
      "--type",
      "bug",
      "--json",
    ]);
    expect(JSON.parse(byType.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);

    const bySearch = await quest(store, [
      "task",
      "list",
      "--search",
      "Alpha",
      "--json",
    ]);
    expect(JSON.parse(bySearch.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);

    const assigneeAndUnassigned = await quest(store, [
      "task",
      "list",
      "--assignee",
      "person-1",
      "--unassigned",
      "--json",
    ]);
    expect(assigneeAndUnassigned).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(assigneeAndUnassigned.stderr)).toMatchObject({
      error_type: "usage",
      message: "task list --assignee and --unassigned cannot be combined.",
    });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list --sort and --limit apply after every other filter (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-sort-limit-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, [
      "task",
      "create",
      "Alpha",
      "--priority",
      "low",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Beta",
      "--priority",
      "high",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Gamma",
      "--priority",
      "high",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Delta",
      "--priority",
      "medium",
      ...human,
    ]);
    // T-1 low, T-2 high, T-3 high, T-4 medium. Priority sorts by rank, not
    // alphabetically: as strings the order is high, high, low, medium, which
    // puts the lowest priority ahead of medium. Ties break by ascending id.
    const ascending = await quest(store, [
      "task",
      "list",
      "--sort",
      "priority",
      "--json",
    ]);
    expect(
      JSON.parse(ascending.stdout).data.map((t: { id: string }) => t.id),
    ).toEqual(["T-2", "T-3", "T-4", "T-1"]);
    const sorted = await quest(store, [
      "task",
      "list",
      "--sort",
      "priority:desc",
      "--json",
    ]);
    expect(
      JSON.parse(sorted.stdout).data.map((t: { id: string }) => t.id),
    ).toEqual(["T-1", "T-4", "T-2", "T-3"]);
    // Limit truncates the sorted ordering, not the id ordering.
    const limited = await quest(store, [
      "task",
      "list",
      "--sort",
      "priority:asc",
      "--limit",
      "1",
      "--json",
    ]);
    expect(JSON.parse(limited.stdout).data).toEqual([
      expect.objectContaining({ id: "T-2" }),
    ]);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list rejects invalid --sort and --limit values (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-sort-invalid-"));
  try {
    for (const [argv, message] of [
      [
        ["task", "list", "--sort", "bogus", "--json"],
        "--sort must be one of id, title, status, priority, type, ordinal, optionally suffixed with :asc or :desc.",
      ],
      [
        ["task", "list", "--limit", "0", "--json"],
        "--limit must be a positive integer.",
      ],
      [
        ["task", "list", "--limit", "abc", "--json"],
        "--limit must be a positive integer.",
      ],
    ] as const) {
      const result = await quest(store, argv);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message,
      });
    }
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list --status and --label behave exactly as before (QCLI-139 regression)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-regression-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, [
      "task",
      "create",
      "Alpha",
      "--label",
      "backend",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Beta",
      "--label",
      "frontend",
      ...human,
    ]);
    const byStatus = await quest(store, [
      "task",
      "list",
      "--status",
      "To Do",
      "--json",
    ]);
    expect(
      JSON.parse(byStatus.stdout).data.map((t: { id: string }) => t.id),
    ).toEqual(["T-1", "T-2"]);
    const byLabel = await quest(store, [
      "task",
      "list",
      "--label",
      "backend",
      "--json",
    ]);
    expect(JSON.parse(byLabel.stdout).data).toEqual([
      expect.objectContaining({ id: "T-1" }),
    ]);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("task list selection flags fold case, accept comma lists, and union repeats (QCLI-139)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-list-selection-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, [
      "task",
      "create",
      "Parent",
      "--alias",
      "PARENT-ALIAS",
      "--priority",
      "High",
      "--type",
      "Feature",
      "--assignee",
      "Person-1",
      ...human,
    ]);
    await quest(store, [
      "task",
      "create",
      "Child",
      "--parent",
      "T-1",
      "--priority",
      "Low",
      "--type",
      "bug",
      "--assignee",
      "person-2",
      ...human,
    ]);
    const ids = async (argv: readonly string[]) =>
      JSON.parse((await quest(store, [...argv, "--json"])).stdout).data.map(
        (task: { id: string }) => task.id,
      );

    // Priority and type are free-form authored strings; a case mismatch used
    // to return a silent empty list.
    expect(await ids(["task", "list", "--priority", "high"])).toEqual(["T-1"]);
    expect(await ids(["task", "list", "--type", "FEATURE"])).toEqual(["T-1"]);

    // Repeatable or comma-separated, like the tracker Quest is at parity with.
    expect(await ids(["task", "list", "--type", "bug,feature"])).toEqual([
      "T-1",
      "T-2",
    ]);
    expect(
      await ids(["task", "list", "--type", "bug", "--type", "feature"]),
    ).toEqual(["T-1", "T-2"]);
    expect(
      await ids(["task", "list", "--exclude-status", "In Progress,Done"]),
    ).toEqual(["T-1", "T-2"]);

    // A repeated --assignee is a union, not an intersection.
    expect(
      await ids([
        "task",
        "list",
        "--assignee",
        "person-1",
        "--assignee",
        "person-2",
      ]),
    ).toEqual(["T-1", "T-2"]);

    // --parent folds case and aliases, like every other task reference.
    for (const reference of ["T-1", "t-1", "parent-alias"])
      expect(await ids(["task", "list", "--parent", reference])).toEqual([
        "T-2",
      ]);

    const empty = await quest(store, ["task", "list", "--type", ",", "--json"]);
    expect(empty).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(empty.stderr)).toMatchObject({
      error_type: "usage",
      message: "--type requires at least one value.",
    });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("milestone archive retires a milestone and list hides it by default (QCLI-140)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-milestone-archive-"));
  const human = ["--actor", "h", "--actor-kind", "human", "--json"];
  try {
    await quest(store, ["task", "create", "Shipped work", ...human]);
    await quest(store, [
      "milestone",
      "create",
      "Release 1",
      "--status",
      "closed",
      "--task",
      "T-1",
      ...human,
    ]);
    await quest(store, ["milestone", "create", "Release 2", ...human]);

    const archived = await quest(store, [
      "milestone",
      "archive",
      "M-1",
      ...human,
    ]);
    expect(archived.exitCode).toBe(0);
    const envelope = JSON.parse(archived.stdout);
    expect(envelope.kind).toBe("milestone.archived");
    // The task reference survives; that is the difference from delete.
    expect(envelope.data.record).toMatchObject({
      id: "M-1",
      status: "closed",
      taskIds: ["T-1"],
      archived: true,
    });

    const ids = async (argv: readonly string[]) =>
      JSON.parse((await quest(store, [...argv, "--json"])).stdout).data.map(
        (item: { id: string }) => item.id,
      );
    expect(await ids(["milestone", "list"])).toEqual(["M-2"]);
    expect(await ids(["milestone", "list", "--include-archived"])).toEqual([
      "M-1",
      "M-2",
    ]);
    expect(
      JSON.parse(
        (await quest(store, ["milestone", "view", "M-1", "--json"])).stdout,
      ).data,
    ).toMatchObject({ archived: true, taskIds: ["T-1"] });

    // AC3: delete keeps its destructive behaviour and its reference guard.
    const deleted = await quest(store, [
      "milestone",
      "delete",
      "M-1",
      ...human,
    ]);
    expect(deleted.exitCode).toBe(6);
    expect(JSON.parse(deleted.stderr)).toMatchObject({
      message: "milestone_has_task_references",
    });
    const deletedEmpty = await quest(store, [
      "milestone",
      "delete",
      "M-2",
      ...human,
    ]);
    expect(deletedEmpty.exitCode).toBe(0);
    expect(await ids(["milestone", "list", "--include-archived"])).toEqual([
      "M-1",
    ]);

    // Archiving twice, and archiving a decision, are both rejected.
    const again = await quest(store, ["milestone", "archive", "M-1", ...human]);
    expect(again.exitCode).toBe(6);
    expect(JSON.parse(again.stderr)).toMatchObject({
      message: "milestone_lifecycle_already_at_destination",
    });
    const missingActor = await quest(store, [
      "milestone",
      "archive",
      "M-1",
      "--json",
    ]);
    expect(missingActor.exitCode).toBe(4);
    const decisionArchive = await quest(store, [
      "decision",
      "archive",
      "DEC-1",
      ...human,
    ]);
    expect(decisionArchive.exitCode).toBe(2);
    expect(JSON.parse(decisionArchive.stderr)).toMatchObject({
      error_type: "usage",
      message: "decision action is invalid or missing required arguments.",
    });

    // Only the archived M-1 remains at this point. Archived milestones keep
    // their ids, so auto-id allocation must still see them: allocating from
    // the visible list alone finds nothing, reuses M-1, and every subsequent
    // create fails with milestone_already_exists.
    const afterArchive = await quest(store, [
      "milestone",
      "create",
      "Release 3",
      ...human,
    ]);
    expect(afterArchive.exitCode).toBe(0);
    expect(JSON.parse(afterArchive.stdout).data.record.id).toBe("M-2");

    // Editing an archived milestone does not quietly un-archive it.
    await quest(store, [
      "milestone",
      "edit",
      "M-1",
      "--title",
      "Release 1, retired",
      ...human,
    ]);
    expect(
      JSON.parse(
        (await quest(store, ["milestone", "view", "M-1", "--json"])).stdout,
      ).data,
    ).toMatchObject({ title: "Release 1, retired", archived: true });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("instructions serves guides and --list without changing the bare form (QCLI-141)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-instructions-guides-"));
  try {
    // AC2: the bare form is still the managed block, byte for byte. Every
    // existing caller and `agents --check` depend on it.
    const bare = await quest(store, ["instructions", "--json"]);
    expect(bare.exitCode).toBe(0);
    const bareEnvelope = JSON.parse(bare.stdout);
    expect(bareEnvelope.kind).toBe("agent.instructions");
    expect(bareEnvelope.data.content).toContain(
      "<!-- quest:agent-instructions:begin -->",
    );

    const listed = await quest(store, ["instructions", "--list", "--json"]);
    expect(listed.exitCode).toBe(0);
    const listEnvelope = JSON.parse(listed.stdout);
    expect(listEnvelope.kind).toBe("agent.guides");
    expect(
      listEnvelope.data.guides.map((guide: { name: string }) => guide.name),
    ).toEqual([
      "overview",
      "task-creation",
      "task-execution",
      "task-finalization",
      "workspace",
    ]);
    // AC1: every entry carries a one-line purpose.
    for (const guide of listEnvelope.data.guides) {
      expect(guide.summary.length).toBeGreaterThan(0);
      expect(guide.summary).not.toContain("\n");
    }

    // Each guide is distinct content, not the same block five times.
    const bodies = new Set<string>();
    for (const name of listEnvelope.data.guides.map(
      (guide: { name: string }) => guide.name,
    )) {
      const served = await quest(store, ["instructions", name, "--json"]);
      expect({ name, exitCode: served.exitCode }).toEqual({
        name,
        exitCode: 0,
      });
      const envelope = JSON.parse(served.stdout);
      expect(envelope.kind).toBe("agent.guide");
      expect(envelope.data.name).toBe(name);
      bodies.add(envelope.data.content);
    }
    expect(bodies.size).toBe(5);

    // AC3: no "all" guide, and the error says what to do instead.
    const all = await quest(store, ["instructions", "all", "--json"]);
    expect(all.exitCode).toBe(3);
    const diagnostic = JSON.parse(all.stderr);
    expect(diagnostic).toMatchObject({ error_type: "not_found" });
    expect(diagnostic.hint).toContain("--list");
    expect(diagnostic.hint).toContain('no "all" guide');

    const both = await quest(store, [
      "instructions",
      "overview",
      "--list",
      "--json",
    ]);
    expect(both.exitCode).toBe(2);
    expect(JSON.parse(both.stderr)).toMatchObject({ error_type: "usage" });

    // A malformed flag is a usage error, not "unknown guide -x": a leading
    // dash is a flag however many dashes it has.
    for (const flag of ["--nope", "-x", "-l"]) {
      const bogus = await quest(store, ["instructions", flag, "--json"]);
      expect({ flag, exitCode: bogus.exitCode }).toEqual({ flag, exitCode: 2 });
      expect(JSON.parse(bogus.stderr)).toMatchObject({ error_type: "usage" });
    }

    // The guide argument is positional and may precede or follow --json.
    const flagFirst = await quest(store, [
      "instructions",
      "--json",
      "overview",
    ]);
    expect(flagFirst.exitCode).toBe(0);
    expect(JSON.parse(flagFirst.stdout).data.name).toBe("overview");
    const trailing = await quest(store, ["instructions", "overview", "extra"]);
    expect(trailing.exitCode).toBe(2);
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});
