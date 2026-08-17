import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  const child = Bun.spawn([process.execPath, source, ...arguments_], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
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
      currentInstructions.replace("0.1.0", "0.0.0"),
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
