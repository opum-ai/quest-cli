import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { QUEST_VERSION } from "../../src/application/version.ts";

const source = resolve(import.meta.dir, "../../src/cli/main.ts");

interface ProcessResult {
  readonly exitCode: number;
  readonly stderr: string;
  readonly stdout: string;
}

async function run(
  cwd: string,
  ...arguments_: readonly string[]
): Promise<ProcessResult> {
  const env = { ...Bun.env };
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn([process.execPath, source, ...arguments_], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env,
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function runWithTaskStore(
  cwd: string,
  store: string,
  ...arguments_: readonly string[]
): Promise<ProcessResult> {
  const child = Bun.spawn([process.execPath, source, ...arguments_], {
    cwd,
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

async function git(
  path: string,
  ...arguments_: readonly string[]
): Promise<void> {
  const child = Bun.spawn(["git", "-C", path, ...arguments_], {
    stdout: "ignore",
    stderr: "ignore",
  });
  expect(await child.exited).toBe(0);
}

async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "quest-bootstrap-"));
  await git(root, "init", "-q");
  await git(root, "config", "user.email", "quest@example.test");
  await git(root, "config", "user.name", "Quest Test");
  await writeFile(join(root, "README.md"), "clean workspace\n");
  await git(root, "add", "README.md");
  await git(root, "commit", "-qm", "initial");
  return root;
}

test("the executable safely bootstraps a clean worktree and preserves authored Codex guidance", async () => {
  const root = await repository();
  try {
    const authored = "# Local conventions\n\nKeep this content.\n";
    await writeFile(join(root, "AGENTS.md"), authored);

    const initialized = await run(
      root,
      "init",
      "--agent-instructions",
      "--json",
    );
    expect(initialized).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(initialized.stdout)).toMatchObject({
      schemaVersion: 1,
      kind: "workspace.initialized",
      data: { instructions: { state: "current" } },
    });
    expect(await readFile(join(root, ".quest", "workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );
    const currentInstructions = await readFile(join(root, "AGENTS.md"), "utf8");
    expect(currentInstructions).toStartWith(authored);
    expect(currentInstructions).toContain("# Quest agent instructions");

    const repeated = await run(root, "init", "--json");
    expect(repeated).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(repeated.stderr)).toMatchObject({
      error_type: "validation",
      message: "Workspace is already initialized.",
      hint: expect.stringContaining("--reconfigure"),
    });
    expect(await readFile(join(root, ".quest", "workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );

    await writeFile(
      join(root, "AGENTS.md"),
      currentInstructions.replace(QUEST_VERSION, "0.0.0"),
    );
    const drift = await run(root, "agents", "--check", "--json");
    expect(drift).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(drift.stderr)).toMatchObject({ error_type: "drift" });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain("0.0.0");

    const updated = await run(
      root,
      "agents",
      "--update-instructions",
      "--json",
    );
    expect(updated).toMatchObject({ exitCode: 0, stderr: "" });
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toBe(
      currentInstructions,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("quest init --reconfigure changes the declared task-id-prefix without touching an existing task, and the new prefix takes effect immediately (QCLI-161)", async () => {
  const root = await repository();
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    expect(
      await run(root, "init", "--task-id-prefix", "OLD", "--json"),
    ).toMatchObject({ exitCode: 0 });
    const created = await run(root, "task", "create", "First", ...human);
    expect(JSON.parse(created.stdout).data).toMatchObject({ id: "OLD-1" });

    const reconfigured = await run(
      root,
      "init",
      "--reconfigure",
      "--task-id-prefix",
      "NEW",
      "--json",
    );
    expect(reconfigured).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(reconfigured.stdout)).toMatchObject({
      kind: "workspace.reconfigured",
      data: { configuration: { taskIdPrefix: "NEW" } },
    });

    const second = await run(root, "task", "create", "Second", ...human);
    expect(JSON.parse(second.stdout).data).toMatchObject({ id: "NEW-1" });

    const original = await run(root, "task", "view", "OLD-1", "--json");
    expect(original.exitCode).toBe(0);
    expect(JSON.parse(original.stdout).data).toMatchObject({ id: "OLD-1" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("quest init --reconfigure requires --name and/or --task-id-prefix, and refuses on a directory that was never initialized (QCLI-161)", async () => {
  const root = await repository();
  try {
    const bare = await run(root, "init", "--reconfigure", "--json");
    expect(bare).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(bare.stderr)).toMatchObject({ error_type: "usage" });

    const neverInitialized = await run(
      root,
      "init",
      "--reconfigure",
      "--task-id-prefix",
      "NEW",
      "--json",
    );
    expect(neverInitialized.exitCode).not.toBe(0);
    expect(JSON.parse(neverInitialized.stderr).error_type).toBe("validation");
    await expect(
      readFile(join(root, ".quest/workspace.toml")),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a directory left with task records but no workspace.toml refuses plain init and is only recoverable via --reconfigure (QCLI-161)", async () => {
  const root = await repository();
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    expect(
      await run(root, "init", "--task-id-prefix", "OLD", "--json"),
    ).toMatchObject({ exitCode: 0 });
    const created = await run(root, "task", "create", "Survivor", ...human);
    expect(JSON.parse(created.stdout).data).toMatchObject({ id: "OLD-1" });

    // The state a partial `rm` (or a raw `rm -rf .quest` that only got as
    // far as the config file) leaves behind: real content, no config.
    await rm(join(root, ".quest", "workspace.toml"));

    const plain = await run(root, "init", "--json");
    expect(plain).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(plain.stderr)).toMatchObject({
      error_type: "validation",
      hint: expect.stringContaining("--reconfigure"),
    });
    await expect(
      readFile(join(root, ".quest/workspace.toml")),
    ).rejects.toThrow();

    const recovered = await run(
      root,
      "init",
      "--reconfigure",
      "--task-id-prefix",
      "NEW",
      "--json",
    );
    expect(recovered).toMatchObject({ exitCode: 0, stderr: "" });

    const survivor = await run(root, "task", "view", "OLD-1", "--json");
    expect(survivor.exitCode).toBe(0);
    expect(JSON.parse(survivor.stdout).data).toMatchObject({ id: "OLD-1" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("--agent-instructions also installs the quest skill, and agents --check/--update-instructions cover both targets", async () => {
  const root = await repository();
  const skillFile = join(root, ".claude", "skills", "quest", "SKILL.md");
  try {
    const initialized = await run(
      root,
      "init",
      "--agent-instructions",
      "--json",
    );
    expect(initialized.exitCode).toBe(0);
    expect(JSON.parse(initialized.stdout)).toMatchObject({
      data: {
        instructions: { state: "current" },
        skill: { state: "current" },
      },
    });
    const skillContent = await readFile(skillFile, "utf8");
    expect(skillContent).toContain("name: quest");
    expect(skillContent).toContain("quest instructions");

    // Both targets already current: check reports current for both, no rewrite.
    const current = await run(root, "agents", "--check", "--json");
    expect(current.exitCode).toBe(0);
    expect(JSON.parse(current.stdout)).toMatchObject({
      data: {
        state: "current",
        skill: { state: "current" },
      },
    });

    // Drift only the skill file: AGENTS.md stays current, --check fails on skill drift.
    await writeFile(skillFile, "hand-edited\n");
    const skillDrift = await run(root, "agents", "--check", "--json");
    expect(skillDrift.exitCode).toBe(6);
    expect(JSON.parse(skillDrift.stderr)).toMatchObject({
      error_type: "drift",
      message: "Quest skill file differs from the bundled version.",
    });

    // Missing only the skill file: --require-installed still fails closed.
    await rm(skillFile);
    const skillMissing = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--json",
    );
    expect(skillMissing.exitCode).toBe(6);
    expect(JSON.parse(skillMissing.stderr)).toMatchObject({
      error_type: "validation",
    });

    // update-instructions restores both from a mixed missing/drifted state.
    await writeFile(
      join(root, "AGENTS.md"),
      "drifted\n<!-- quest:agent-instructions:begin -->\nold\n<!-- quest:agent-instructions:end -->\n",
    );
    const restored = await run(
      root,
      "agents",
      "--update-instructions",
      "--json",
    );
    expect(restored.exitCode).toBe(0);
    expect(await readFile(skillFile, "utf8")).toContain("name: quest");
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      "# Quest agent instructions",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("--target claude writes and checks CLAUDE.md instead of AGENTS.md, end to end with no AGENTS.md ever created (QCLI-227)", async () => {
  const root = await repository();
  const claudeFile = join(root, "CLAUDE.md");
  const agentsFile = join(root, "AGENTS.md");
  try {
    const initialized = await run(
      root,
      "init",
      "--agent-instructions",
      "--target",
      "claude",
      "--json",
    );
    expect(initialized.exitCode).toBe(0);
    expect(JSON.parse(initialized.stdout)).toMatchObject({
      data: { instructions: { state: "current" } },
    });
    expect(await readFile(claudeFile, "utf8")).toContain(
      "# Quest agent instructions",
    );
    await expect(stat(agentsFile)).rejects.toThrow();

    const current = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--target",
      "claude",
      "--json",
    );
    expect(current).toMatchObject({ exitCode: 0 });
    expect(JSON.parse(current.stdout)).toMatchObject({
      data: { state: "current" },
    });

    // Checking the other target reports missing: each --target checks exactly
    // one file, never both.
    const codexMissing = await run(root, "agents", "--check", "--json");
    expect(JSON.parse(codexMissing.stdout)).toMatchObject({
      data: { state: "missing" },
    });

    // Drifting CLAUDE.md's managed block is still caught under --target claude.
    await writeFile(
      claudeFile,
      "<!-- quest:agent-instructions:begin -->\nold\n<!-- quest:agent-instructions:end -->\n",
    );
    const drift = await run(
      root,
      "agents",
      "--check",
      "--target",
      "claude",
      "--json",
    );
    expect(drift.exitCode).toBe(6);
    expect(JSON.parse(drift.stderr)).toMatchObject({ error_type: "drift" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("--target is rejected without --agent-instructions on init, and with an invalid value on agents", async () => {
  const root = await repository();
  try {
    const missingFlag = await run(root, "init", "--target", "claude", "--json");
    expect(missingFlag.exitCode).toBe(2);
    expect(JSON.parse(missingFlag.stderr)).toMatchObject({
      error_type: "usage",
      message: "--target requires --agent-instructions.",
    });

    const invalidValue = await run(
      root,
      "agents",
      "--check",
      "--target",
      "pi",
      "--json",
    );
    expect(invalidValue.exitCode).toBe(2);
    expect(JSON.parse(invalidValue.stderr)).toMatchObject({
      error_type: "usage",
      message: '--target must be "claude" or "codex", got "pi".',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("agents strict checks pin missing, current, drift, and malformed exit semantics", async () => {
  const root = await repository();
  const file = join(root, "AGENTS.md");
  try {
    const missing = await run(root, "agents", "--check", "--json");
    expect(missing).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(missing.stdout)).toMatchObject({
      kind: "agent.instructions-status",
      data: { state: "missing" },
    });

    const strictMissing = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--json",
    );
    expect(strictMissing).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(strictMissing.stderr)).toMatchObject({
      error_type: "validation",
      message:
        "Quest agent instruction block is missing. Run quest agents --update-instructions.",
    });
    await expect(stat(file)).rejects.toThrow();

    const invalidUpdate = await run(
      root,
      "agents",
      "--update-instructions",
      "--require-installed",
      "--json",
    );
    expect(invalidUpdate).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(invalidUpdate.stderr)).toMatchObject({
      error_type: "usage",
      message: "--require-installed requires --check.",
    });
    await expect(stat(file)).rejects.toThrow();

    expect(
      await run(root, "agents", "--update-instructions", "--json"),
    ).toMatchObject({ exitCode: 0, stderr: "" });
    const currentContent = await readFile(file, "utf8");
    const current = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--json",
    );
    expect(current).toMatchObject({ exitCode: 0, stderr: "" });
    expect(JSON.parse(current.stdout)).toMatchObject({
      data: { state: "current" },
    });

    const drifted = currentContent.replace(QUEST_VERSION, "0.0.0");
    await writeFile(file, drifted);
    const drift = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--json",
    );
    expect(drift).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(drift.stderr)).toMatchObject({ error_type: "drift" });
    expect(await readFile(file, "utf8")).toBe(drifted);

    const malformed = "<!-- quest:agent-instructions:begin -->\n";
    await writeFile(file, malformed);
    const malformedResult = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--json",
    );
    expect(malformedResult).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(malformedResult.stderr)).toMatchObject({
      error_type: "drift",
      message: "Quest agent instruction markers are malformed or duplicated.",
    });
    expect(await readFile(file, "utf8")).toBe(malformed);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("record and planning commands share the initialized root from a nested directory", async () => {
  const root = await repository();
  const nested = join(root, "packages", "example", "deep");
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    await mkdir(nested, { recursive: true });
    const beforeInitialization = await run(root, "task", "list", "--json");
    expect(beforeInitialization).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(beforeInitialization.stderr)).toMatchObject({
      error_type: "validation",
      message:
        "Workspace is not initialized. Run quest init from a Git worktree.",
    });
    await expect(stat(join(root, ".quest"))).rejects.toThrow();

    expect(await run(root, "init", "--json")).toMatchObject({ exitCode: 0 });
    const created = await run(root, "task", "create", "Root task", ...human);
    expect(JSON.parse(created.stdout)).toMatchObject({
      kind: "task.created",
      data: { id: "T-1", title: "Root task" },
    });
    expect(
      await run(
        root,
        "milestone",
        "create",
        "Root milestone",
        "--task",
        "T-1",
        "--task",
        "T-999",
        ...human,
      ),
    ).toMatchObject({ exitCode: 0 });

    for (const arguments_ of [
      ["task", "list", "--json"],
      ["task", "view", "T-1", "--json"],
      ["overview", "--json"],
      ["board", "--json"],
      ["doctor", "--json"],
      ["search", "Root task", "--json"],
    ]) {
      const fromRoot = await run(root, ...arguments_);
      const fromNested = await run(nested, ...arguments_);
      expect(fromNested).toEqual(fromRoot);
      expect(fromNested.exitCode).toBe(0);
    }

    const nestedWrite = await run(
      nested,
      "task",
      "create",
      "Nested task",
      ...human,
    );
    expect(JSON.parse(nestedWrite.stdout)).toMatchObject({
      kind: "task.created",
      data: { id: "T-2", title: "Nested task" },
    });
    expect(
      JSON.parse((await run(root, "task", "list", "--json")).stdout).data.map(
        (task: { readonly id: string }) => task.id,
      ),
    ).toEqual(["T-1", "T-2"]);
    await expect(stat(join(nested, ".quest"))).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("implicit storage fails closed while QUEST_TASK_STORE remains an explicit override", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-uninitialized-"));
  const store = await mkdtemp(join(tmpdir(), "quest-explicit-store-"));
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    const implicit = await run(cwd, "task", "list", "--json");
    expect(implicit).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(implicit.stderr)).toMatchObject({
      error_type: "validation",
      message:
        "No Git repository was found here. Run `git init` to create one, then re-run `quest init`.",
      hint: "Quest requires an existing Git worktree; it does not create one for you.",
    });
    await expect(stat(join(cwd, ".quest"))).rejects.toThrow();

    const explicit = await runWithTaskStore(
      cwd,
      store,
      "task",
      "create",
      "Explicit task",
      ...human,
    );
    expect(JSON.parse(explicit.stdout)).toMatchObject({
      kind: "task.created",
      data: { id: "T-1", title: "Explicit task" },
    });
    expect(
      JSON.parse(
        (await runWithTaskStore(cwd, store, "task", "list", "--json")).stdout,
      ).data,
    ).toEqual([expect.objectContaining({ id: "T-1" })]);
    await expect(stat(join(cwd, ".quest"))).rejects.toThrow();
    expect(await stat(join(store, ".quest", "tasks", "T-1.json"))).toBeTruthy();
  } finally {
    await rm(cwd, { recursive: true, force: true });
    await rm(store, { recursive: true, force: true });
  }
});

test("quest init outside a Git repository names the missing repository and names the fix", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-no-git-"));
  try {
    const result = await run(cwd, "init", "--json");
    expect(result).toMatchObject({ exitCode: 6, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "validation",
      message:
        "No Git repository was found here. Run `git init` to create one, then re-run `quest init`.",
      hint: "Quest requires an existing Git worktree; it does not create one for you.",
    });
    await expect(stat(join(cwd, ".quest"))).rejects.toThrow();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("quest init inside a real Git worktree is unaffected by the missing-repository message", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-real-git-"));
  try {
    await Bun.spawn(["git", "init", "-q"], { cwd }).exited;
    const result = await run(cwd, "init", "--json");
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      kind: "workspace.initialized",
    });
    expect(await stat(join(cwd, ".quest", "workspace.toml"))).toBeTruthy();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("--name configures the workspace without changing task ID generation", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-flags-"));
  try {
    await Bun.spawn(["git", "init", "-q"], { cwd }).exited;
    const init = await run(cwd, "init", "--name", "My Project", "--json");
    expect(init.exitCode).toBe(0);
    expect(JSON.parse(init.stdout)).toMatchObject({
      data: { configuration: { name: "My Project" } },
    });
    expect(await readFile(join(cwd, ".quest", "workspace.toml"), "utf8")).toBe(
      'schemaVersion = 1\nname = "My Project"\n',
    );

    const created = await run(
      cwd,
      "task",
      "create",
      "First task",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    );
    expect(JSON.parse(created.stdout)).toMatchObject({
      data: { id: "T-1", title: "First task" },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("init with no name/agent-instructions flags keeps writing the legacy schemaVersion-only file", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-legacy-"));
  try {
    await Bun.spawn(["git", "init", "-q"], { cwd }).exited;
    const init = await run(cwd, "init", "--json");
    expect(init.exitCode).toBe(0);
    expect(await readFile(join(cwd, ".quest", "workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );

    const created = await run(
      cwd,
      "task",
      "create",
      "Default prefix task",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    );
    expect(JSON.parse(created.stdout)).toMatchObject({
      data: { id: "T-1" },
    });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("a configured task ID prefix round-trips through create, view, edit and complete", async () => {
  // The exact scenario QCLI-126 could not ship: before QCLI-132 relaxed the
  // domain pattern, `task create` here failed with "Invalid canonical id".
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-prefix-"));
  const human = ["--actor", "person-1", "--actor-kind", "human", "--json"];
  try {
    await Bun.spawn(["git", "init", "-q"], { cwd }).exited;
    const init = await run(
      cwd,
      "init",
      "--name",
      "Demo",
      "--task-id-prefix",
      "QCLI",
      "--json",
    );
    expect(init.exitCode).toBe(0);
    expect(JSON.parse(init.stdout)).toMatchObject({
      data: { configuration: { name: "Demo", taskIdPrefix: "QCLI" } },
    });

    const created = await run(cwd, "task", "create", "First", ...human);
    expect(created.exitCode).toBe(0);
    expect(JSON.parse(created.stdout)).toMatchObject({
      data: { id: "QCLI-1", title: "First" },
    });

    // The sequence advances within the configured family.
    const second = await run(cwd, "task", "create", "Second", ...human);
    expect(JSON.parse(second.stdout)).toMatchObject({ data: { id: "QCLI-2" } });

    // Read and mutate paths accept the id rather than rejecting it downstream.
    const viewed = await run(cwd, "task", "view", "QCLI-1", "--json");
    expect(viewed.exitCode).toBe(0);
    expect(JSON.parse(viewed.stdout)).toMatchObject({
      data: { id: "QCLI-1", title: "First" },
    });

    const edited = await run(
      cwd,
      "task",
      "edit",
      "QCLI-1",
      "--status",
      "In Progress",
      ...human,
    );
    expect(edited.exitCode).toBe(0);

    const completed = await run(cwd, "task", "complete", "QCLI-1", ...human);
    expect(completed.exitCode).toBe(0);

    // list() includes completed tasks by default (QCLI-165); the completed
    // one is retained AND shown, alongside the still-active one.
    const listed = await run(cwd, "task", "list", "--json");
    expect(
      JSON.parse(listed.stdout).data.map((t: { id: string }) => t.id),
    ).toEqual(["QCLI-1", "QCLI-2"]);

    // The retained record still reserves its number: allocation never reuses it.
    const third = await run(cwd, "task", "create", "Third", ...human);
    expect(JSON.parse(third.stdout)).toMatchObject({ data: { id: "QCLI-3" } });
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("an unusable task ID prefix fails at init rather than at the first write", async () => {
  const cwd = await mkdtemp(join(tmpdir(), "quest-init-bad-prefix-"));
  try {
    await Bun.spawn(["git", "init", "-q"], { cwd }).exited;
    const result = await run(cwd, "init", "--task-id-prefix", "1BAD", "--json");
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "usage",
      message:
        "Task ID prefix must start with a letter and contain only letters and digits: 1BAD",
    });
    // Nothing was provisioned by the rejected run.
    await expect(stat(join(cwd, ".quest"))).rejects.toThrow();
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
