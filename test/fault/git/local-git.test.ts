import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../../../src/adapters/git/local-git.ts";
import { commitOwnedOperation } from "../../../src/application/mutations/mutations.ts";

async function command(root: string, ...args: string[]): Promise<string> {
  const child = Bun.spawn(["git", "-C", root, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await child.exited;
  const stdout = (await new Response(child.stdout).text()).trim();
  if (code !== 0) throw new Error(await new Response(child.stderr).text());
  return stdout;
}

async function repository(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "quest-git-"));
  await command(root, "init", "-q", "-b", "main");
  await command(root, "config", "user.email", "quest@example.test");
  await command(root, "config", "user.name", "Quest Test");
  await writeFile(join(root, "README.md"), "base\n");
  await command(root, "add", "README.md");
  await command(root, "commit", "-qm", "base");
  return root;
}

function operation(
  root: string,
  operationId: string,
  path = ".quest/tasks/T-1.json",
) {
  return {
    repositoryPath: root,
    targetRef: "refs/heads/main",
    operationId,
    message: "quest mutation",
    ownedPaths: [path],
    changes: [{ path, content: '{"schemaVersion":1}\n' }],
  };
}

test("isolated index commits only declared paths and leaves a dirty user index intact", async () => {
  const root = await repository();
  try {
    await writeFile(join(root, "unrelated.txt"), "user work\n");
    await command(root, "add", "unrelated.txt");
    await writeFile(join(root, "untracked.txt"), "also user work\n");
    const result = await commitOwnedOperation(
      new LocalGitPort(),
      operation(root, "op-1"),
    );
    expect(result.kind).toBe("success");
    expect(
      await command(
        root,
        "show",
        "--format=",
        "--name-only",
        "refs/heads/main",
      ),
    ).toBe(".quest/tasks/T-1.json");
    const indexPaths = await command(root, "ls-files", "--stage");
    expect(indexPaths).toContain("unrelated.txt");
    expect(indexPaths).not.toContain(".quest/tasks/T-1.json");
    expect(await readFile(join(root, "untracked.txt"), "utf8")).toBe(
      "also user work\n",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a retry recovers one matching operation and rejects a divergent duplicate", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const first = await commitOwnedOperation(port, operation(root, "op-retry"));
    const retry = await commitOwnedOperation(port, operation(root, "op-retry"));
    if (first.kind !== "success")
      throw new Error("initial operation must succeed");
    expect(first).toMatchObject({ kind: "success", recovered: false });
    expect(retry).toEqual({
      kind: "success",
      revision: first.revision,
      recovered: true,
    });
    const divergent = await commitOwnedOperation(port, {
      ...operation(root, "op-retry", ".quest/tasks/T-2.json"),
    });
    expect(divergent).toMatchObject({
      kind: "conflict",
      code: "operation_conflict",
    });
    expect(
      (await command(root, "log", "--format=%H", "refs/heads/main")).split(
        "\n",
      ),
    ).toHaveLength(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a stale basis is a structured CAS conflict and never changes the ref", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const stale = await port.readRevision(root, "refs/heads/main");
    await commitOwnedOperation(port, operation(root, "op-winner"));
    const loser = await port.commit({
      ...operation(root, "op-loser"),
      expectedRevision: stale,
    });
    expect(loser).toMatchObject({
      kind: "conflict",
      code: "cas_conflict",
      expectedRevision: stale,
    });
    expect(
      await command(root, "log", "--format=%s", "-1", "refs/heads/main"),
    ).toBe("quest mutation");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an ambiguous owned scope fails before it can update Git", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const before = await port.readRevision(root, "refs/heads/main");
    await expect(
      port.commit({
        ...operation(root, "unsafe"),
        expectedRevision: before,
        ownedPaths: [".quest/tasks/T-1.json", "../unrelated"],
        changes: [
          { path: ".quest/tasks/T-1.json", content: "{}" },
          { path: "../unrelated", content: "{}" },
        ],
      }),
    ).rejects.toThrow("workspace-relative");
    expect(await port.readRevision(root, "refs/heads/main")).toBe(before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("synchronization integrates sorted disjoint paths but reports shared namespaces", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const base = await port.readRevision(root, "refs/heads/main");
    await command(root, "branch", "source", base);
    await port.commit({
      ...operation(root, "source-op", ".quest/tasks/T-2.json"),
      targetRef: "refs/heads/source",
      expectedRevision: base,
    });
    await commitOwnedOperation(
      port,
      operation(root, "target-op", ".quest/tasks/T-1.json"),
    );
    const target = await port.readRevision(root, "refs/heads/main");
    const source = await port.readRevision(root, "refs/heads/source");
    const blocked = await port.synchronize({
      repositoryPath: root,
      targetRef: "refs/heads/main",
      expectedRevision: target,
      sourceRevision: source,
      operationId: "sync-1",
      message: "sync",
      sharedNamespaces: [".quest/tasks"],
    });
    expect(blocked).toMatchObject({
      kind: "conflict",
      code: "integration_conflict",
    });
    const integrated = await port.synchronize({
      repositoryPath: root,
      targetRef: "refs/heads/main",
      expectedRevision: target,
      sourceRevision: source,
      operationId: "sync-2",
      message: "sync",
    });
    expect(integrated).toMatchObject({ kind: "success", recovered: false });
    expect(
      await command(root, "ls-tree", "-r", "--name-only", "refs/heads/main"),
    ).toContain(".quest/tasks/T-1.json");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
