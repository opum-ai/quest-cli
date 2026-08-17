import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  return new TextDecoder().decode(value);
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
      stdout: "0.2.4\n",
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
      message: "--description requires a value.",
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

test("the compiled binary rejects missing and duplicate status values", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-compiled-flags-"));
  try {
    for (const [argv, message] of [
      [["task", "list", "--status", "--json"], "--status requires a value."],
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
    for (const entry of manifest.filter(
      (command): command is { readonly name: string; readonly kind: string } =>
        command.kind !== null,
    )) {
      const argv = invocations[entry.name]?.map((argument) =>
        argument === "--plain" ? mode : argument,
      );
      expect(argv).toBeDefined();
      const stdout =
        entry.name === "browser"
          ? await questUntilOutput(store, argv ?? [])
          : await (async () => {
              const result = await quest(store, argv ?? []);
              if (result.exitCode !== 0)
                throw new Error(`${entry.name}: ${result.stderr}`);
              expect(result.exitCode, entry.name).toBe(0);
              return result.stdout;
            })();
      outputs.set(entry.name, stdout);
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
    expect(envelope.principal, entry.name).toBeNull();
    expect(Object.keys(envelope).at(-1), entry.name).toBe("principal");
  }
}, 15_000);
