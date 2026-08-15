import { expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalWorkspacePort } from "../../../src/adapters/workspaces/local-workspaces.ts";
import {
  assertSafeWorkspaceRelativePath,
  discoverWorkspaces,
  enrollWorkspace,
  initializeWorkspace,
  WorkspaceError,
} from "../../../src/application/workspaces/workspaces.ts";

async function command(path: string, ...args: string[]): Promise<void> {
  const process = Bun.spawn(["git", "-C", path, ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
  expect(await process.exited).toBe(0);
}

async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "quest-workspace-"));
  await command(root, "init", "-q");
  await command(root, "config", "user.email", "quest@example.test");
  await command(root, "config", "user.name", "Quest Test");
  await writeFile(join(root, "README"), "test\n");
  await command(root, "add", "README");
  await command(root, "commit", "-qm", "initial");
  return root;
}

test("initialization writes only its declared authored path in a non-bare worktree", async () => {
  const root = await repository();
  try {
    const port = new LocalWorkspacePort();
    await initializeWorkspace(port, root);
    expect(await readFile(join(root, ".quest/workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );
    await expect(initializeWorkspace(port, root)).rejects.toMatchObject({
      code: "already_initialized",
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("enrollment retains a shared Git common directory and distinct worktree paths", async () => {
  const root = await repository();
  const second = `${root}-second`;
  try {
    await command(root, "worktree", "add", "--detach", second);
    const registry = join(root, "registry.json");
    const port = new LocalWorkspacePort();
    const first = await enrollWorkspace(port, registry, root);
    const other = await enrollWorkspace(port, registry, second);
    expect(first.commonDirectory).toBe(other.commonDirectory);
    expect(first.worktreePath).not.toBe(other.worktreePath);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
  }
});

test("current-worktree identity is deterministic from a nested directory", async () => {
  const root = await repository();
  try {
    const nested = join(root, "one", "two", "three");
    await mkdir(nested, { recursive: true });
    const port = new LocalWorkspacePort();
    expect((await port.inspect(nested)).worktreePath).toBe(
      (await port.inspect(root)).worktreePath,
    );
    await initializeWorkspace(port, nested);
    expect(await readFile(join(root, ".quest/workspace.toml"), "utf8")).toBe(
      "schemaVersion = 1\n",
    );
    await expect(
      readFile(join(nested, ".quest/workspace.toml"), "utf8"),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovery is ordered, distinguishes missing entries, and does not repair the registry", async () => {
  const root = await repository();
  const registryDirectory = await mkdtemp(join(tmpdir(), "quest-registry-"));
  try {
    const registry = join(registryDirectory, "registry.json");
    const port = new LocalWorkspacePort();
    await enrollWorkspace(port, registry, root);
    const before = await readFile(registry, "utf8");
    await rm(root, { recursive: true, force: true });
    const entries = await discoverWorkspaces(port, registry);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.state).toBe("missing");
    expect(await readFile(registry, "utf8")).toBe(before);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(registryDirectory, { recursive: true, force: true });
  }
});

test("hostile components and symlink escapes are rejected before initialization writes", async () => {
  for (const value of [
    "../quest",
    "/tmp/quest",
    "a//b",
    "a/../b",
    "A/a",
    "nul\0value",
  ]) {
    expect(() => assertSafeWorkspaceRelativePath(value)).toThrow(
      WorkspaceError,
    );
  }
  const root = await repository();
  const outside = await mkdtemp(join(tmpdir(), "quest-outside-"));
  try {
    await symlink(outside, join(root, ".quest"));
    await expect(
      initializeWorkspace(new LocalWorkspacePort(), root),
    ).rejects.toMatchObject({ code: "unsafe_path" });
    await expect(
      readFile(join(outside, "workspace.toml"), "utf8"),
    ).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("unsupported bare repositories fail before any Quest path is created", async () => {
  const bare = await mkdtemp(join(tmpdir(), "quest-bare-"));
  try {
    await command(bare, "init", "--bare", "-q");
    await expect(
      initializeWorkspace(new LocalWorkspacePort(), bare),
    ).rejects.toMatchObject({ code: "bare_repository" });
  } finally {
    await rm(bare, { recursive: true, force: true });
  }
});
