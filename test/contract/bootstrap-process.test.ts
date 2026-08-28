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
    });
    expect(await readFile(join(root, ".quest", "workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );

    await writeFile(
      join(root, "AGENTS.md"),
      currentInstructions.replace("0.2.9", "0.0.0"),
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

    const drifted = currentContent.replace("0.2.9", "0.0.0");
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
