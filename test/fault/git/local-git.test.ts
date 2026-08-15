import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  GitInterruptedError,
  LocalGitPort,
} from "../../../src/adapters/git/local-git.ts";
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

test("recovery finds an operation after later commits have advanced the ref", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const first = await commitOwnedOperation(
      port,
      operation(root, "old-operation"),
    );
    await commitOwnedOperation(
      port,
      operation(root, "later-operation", ".quest/tasks/T-2.json"),
    );
    const retry = await commitOwnedOperation(
      port,
      operation(root, "old-operation"),
    );
    expect(first).toMatchObject({ kind: "success", recovered: false });
    expect(retry).toMatchObject({ kind: "success", recovered: true });
    if (first.kind === "success" && retry.kind === "success")
      expect(retry.revision).toBe(first.revision);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an injected interruption after staging preserves dirty work and retries cleanly", async () => {
  const root = await repository();
  try {
    await writeFile(join(root, "staged.txt"), "staged\n");
    await command(root, "add", "staged.txt");
    await writeFile(join(root, "unstaged.txt"), "unstaged\n");
    await writeFile(join(root, "untracked.txt"), "untracked\n");
    const port = new LocalGitPort();
    await expect(
      commitOwnedOperation(port, {
        ...operation(root, "interrupted"),
        checkpoint: (phase) => {
          if (phase === "staged") throw new GitInterruptedError();
        },
      }),
    ).rejects.toBeInstanceOf(GitInterruptedError);
    expect(await command(root, "ls-files", "--stage")).toContain("staged.txt");
    expect(await readFile(join(root, "unstaged.txt"), "utf8")).toBe(
      "unstaged\n",
    );
    expect(await readFile(join(root, "untracked.txt"), "utf8")).toBe(
      "untracked\n",
    );
    expect(
      await commitOwnedOperation(port, operation(root, "interrupted")),
    ).toMatchObject({ kind: "success" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a committed journal publishes the original prepared commit on retry", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    await expect(
      commitOwnedOperation(port, {
        ...operation(root, "after-commit"),
        checkpoint: (phase) => {
          if (phase === "committed") throw new GitInterruptedError();
        },
      }),
    ).rejects.toBeInstanceOf(GitInterruptedError);
    const retry = await commitOwnedOperation(
      port,
      operation(root, "after-commit"),
    );
    expect(retry).toMatchObject({ kind: "success", recovered: true });
    expect(
      (await command(root, "log", "--format=%s", "refs/heads/main")).split(
        "\n",
      ),
    ).toHaveLength(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a stale cross-process lock owner is reclaimed instead of wedging preparation", async () => {
  const root = await repository();
  try {
    const common = await command(root, "rev-parse", "--git-common-dir");
    const lock = join(root, common, "quest-operation-preparation.lock");
    await mkdir(lock);
    await writeFile(join(lock, "owner.json"), JSON.stringify({ pid: 999999 }));
    expect(
      await commitOwnedOperation(
        new LocalGitPort(),
        operation(root, "reclaimed-lock"),
      ),
    ).toMatchObject({ kind: "success" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a live external process lock waits, then recovers after its owner exits", async () => {
  const root = await repository();
  try {
    const common = await command(root, "rev-parse", "--git-common-dir");
    const lock = join(root, common, "quest-operation-preparation.lock");
    const child = Bun.spawn([
      process.execPath,
      "-e",
      "const fs=require('node:fs/promises'); const lock=process.argv[1]; (async()=>{await fs.mkdir(lock); await fs.writeFile(lock + '/owner.json', JSON.stringify({pid:process.pid})); setTimeout(()=>process.exit(0), 120)})()",
      lock,
    ]);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await readFile(join(lock, "owner.json"));
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    const started = Date.now();
    expect(
      await commitOwnedOperation(
        new LocalGitPort(),
        operation(root, "waited-lock"),
      ),
    ).toMatchObject({ kind: "success" });
    expect(Date.now() - started).toBeGreaterThanOrEqual(80);
    expect(await child.exited).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a linked worktree shares preparation safely without absorbing its dirty state", async () => {
  const root = await repository();
  const linked = `${root}-linked`;
  try {
    await command(root, "worktree", "add", "--detach", linked);
    await writeFile(join(linked, "linked-user.txt"), "dirty\n");
    await command(linked, "add", "linked-user.txt");
    expect(
      await commitOwnedOperation(
        new LocalGitPort(),
        operation(root, "linked-worktree"),
      ),
    ).toMatchObject({ kind: "success" });
    expect(await command(linked, "ls-files", "--stage")).toContain(
      "linked-user.txt",
    );
    expect(await command(linked, "rev-parse", "--git-common-dir")).toEndWith(
      "/.git",
    );
  } finally {
    await rm(linked, { recursive: true, force: true });
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

test("a rejected non-fast-forward push is structured and leaves the remote winner", async () => {
  const remote = await mkdtemp(join(tmpdir(), "quest-remote-"));
  const first = await repository();
  const second = await mkdtemp(join(tmpdir(), "quest-clone-"));
  try {
    await command(remote, "init", "--bare", "-q");
    await command(first, "remote", "add", "origin", remote);
    await command(first, "push", "-qu", "origin", "main");
    await command(second, "clone", "-q", remote, ".");
    await command(second, "config", "user.email", "quest@example.test");
    await command(second, "config", "user.name", "Quest Test");
    const port = new LocalGitPort();
    await commitOwnedOperation(port, operation(first, "remote-winner"));
    expect(
      await port.push({
        repositoryPath: first,
        remote: "origin",
        sourceRef: "refs/heads/main",
        targetRef: "refs/heads/main",
      }),
    ).toMatchObject({ kind: "success" });
    await commitOwnedOperation(
      port,
      operation(second, "remote-loser", ".quest/tasks/T-2.json"),
    );
    expect(
      await port.push({
        repositoryPath: second,
        remote: "origin",
        sourceRef: "refs/heads/main",
        targetRef: "refs/heads/main",
      }),
    ).toMatchObject({ kind: "conflict", code: "push_rejected" });
    expect(await command(remote, "log", "--format=%s", "-1", "main")).toBe(
      "quest mutation",
    );
  } finally {
    await rm(remote, { recursive: true, force: true });
    await rm(first, { recursive: true, force: true });
    await rm(second, { recursive: true, force: true });
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

test("synchronization fast-forwards and rejects a same-path divergence", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const base = await port.readRevision(root, "refs/heads/main");
    await command(root, "branch", "source", base);
    await port.commit({
      ...operation(root, "ff-source"),
      targetRef: "refs/heads/source",
      expectedRevision: base,
    });
    const source = await port.readRevision(root, "refs/heads/source");
    expect(
      await port.synchronize({
        repositoryPath: root,
        targetRef: "refs/heads/main",
        expectedRevision: base,
        sourceRevision: source,
        operationId: "fast-forward",
        message: "sync",
      }),
    ).toMatchObject({ kind: "success", revision: source });

    await command(root, "branch", "other", base);
    await port.commit({
      ...operation(root, "other-path"),
      targetRef: "refs/heads/other",
      expectedRevision: base,
      changes: [{ path: ".quest/tasks/T-1.json", content: "other\n" }],
    });
    const other = await port.readRevision(root, "refs/heads/other");
    expect(
      await port.synchronize({
        repositoryPath: root,
        targetRef: "refs/heads/main",
        expectedRevision: source,
        sourceRevision: other,
        operationId: "same-path",
        message: "sync",
      }),
    ).toMatchObject({
      kind: "conflict",
      code: "integration_conflict",
      paths: [".quest/tasks/T-1.json"],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("synchronization journals no-op and fast-forward operation IDs", async () => {
  const root = await repository();
  try {
    const port = new LocalGitPort();
    const base = await port.readRevision(root, "refs/heads/main");
    const noop = {
      repositoryPath: root,
      targetRef: "refs/heads/main",
      expectedRevision: base,
      sourceRevision: base,
      operationId: "noop-sync",
      message: "sync",
    };
    expect(await port.synchronize(noop)).toMatchObject({ kind: "success" });
    expect(
      await port.synchronize({ ...noop, sourceRevision: "deadbeef" }),
    ).toMatchObject({ kind: "conflict", code: "operation_conflict" });
    await command(root, "branch", "source", base);
    await port.commit({
      ...operation(root, "sync-source"),
      targetRef: "refs/heads/source",
      expectedRevision: base,
    });
    const source = await port.readRevision(root, "refs/heads/source");
    expect(
      await port.synchronize({
        ...noop,
        operationId: "ff-journal",
        sourceRevision: source,
      }),
    ).toMatchObject({ kind: "success" });
    expect(
      await port.synchronize({
        ...noop,
        operationId: "ff-journal",
        sourceRevision: base,
      }),
    ).toMatchObject({ kind: "conflict", code: "operation_conflict" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
