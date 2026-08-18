import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type {
  GitOperation,
  GitOperationConflict,
  GitOperationResult,
  GitPort,
  GitPush,
  GitSynchronization,
} from "../../ports/git.ts";

const preparationQueues = new Map<string, Promise<void>>();

export class GitPreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitPreparationError";
  }
}

export class GitInterruptedError extends Error {
  constructor(message = "Git operation interrupted at a checkpoint.") {
    super(message);
    this.name = "GitInterruptedError";
  }
}

interface CommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

async function git(
  repositoryPath: string,
  args: readonly string[],
  options: {
    readonly env?: Record<string, string>;
    readonly stdin?: string;
  } = {},
): Promise<CommandResult> {
  const child = Bun.spawn(["git", "-C", repositoryPath, ...args], {
    stdin:
      options.stdin === undefined
        ? "ignore"
        : new TextEncoder().encode(options.stdin),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, ...options.env },
  });
  return {
    code: await child.exited,
    stdout: (await new Response(child.stdout).text()).trim(),
    stderr: (await new Response(child.stderr).text()).trim(),
  };
}

async function requiredGit(
  repositoryPath: string,
  args: readonly string[],
  options?: { readonly env?: Record<string, string>; readonly stdin?: string },
): Promise<string> {
  const result = await git(repositoryPath, args, options);
  if (result.code !== 0)
    throw new GitPreparationError(result.stderr || "Git failed.");
  return result.stdout;
}

function digest(value: unknown): string {
  return new Bun.CryptoHasher("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function operationDigest(operation: GitOperation | GitSynchronization): string {
  if ("changes" in operation) {
    return digest({
      targetRef: operation.targetRef,
      ownedPaths: [...operation.ownedPaths],
      changes: operation.changes,
      message: operation.message,
    });
  }
  return digest({
    targetRef: operation.targetRef,
    sourceRevision: operation.sourceRevision,
    sharedNamespaces: [...(operation.sharedNamespaces ?? [])],
    message: operation.message,
  });
}

function isPrefix(prefix: string, path: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function assertSafePath(path: string): void {
  if (
    !path ||
    path.includes("\0") ||
    path.startsWith("/") ||
    path.startsWith("\\") ||
    path.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    throw new GitPreparationError(
      "Operation paths must be workspace-relative.",
    );
  }
}

function parseOperationCommit(
  output: string,
  operationId: string,
):
  | {
      readonly revision: string;
      readonly digest: string | undefined;
      readonly result: string | undefined;
    }
  | undefined {
  for (const entry of output.split("\u001e")) {
    const [rawRevision, body] = entry.split("\u0000", 2);
    const revision = rawRevision?.trim();
    if (!revision || !body) continue;
    const foundId = /^Quest-Operation-Id: (.+)$/mu.exec(body)?.[1];
    if (foundId !== operationId) continue;
    return {
      revision,
      digest: /^Quest-Operation-Digest: ([a-f0-9]+)$/mu.exec(body)?.[1],
      result: /^Quest-Result-Revision: ([a-f0-9]+)$/mu.exec(body)?.[1],
    };
  }
  return undefined;
}

export class LocalGitPort implements GitPort {
  async readRevision(repositoryPath: string, ref: string): Promise<string> {
    return requiredGit(repositoryPath, ["rev-parse", "--verify", ref]);
  }

  async commit(operation: GitOperation): Promise<GitOperationResult> {
    this.assertOperationScope(operation);
    const prepared = await this.withPreparationLock(
      operation.repositoryPath,
      async (): Promise<
        | GitOperationResult
        | {
            readonly prepared: true;
            readonly revision: string;
            readonly recovered?: boolean;
          }
      > => {
        const existing = await this.findOperation(
          operation.repositoryPath,
          operation.targetRef,
          operation.operationId,
        );
        const expectedDigest = operationDigest(operation);
        if (existing) {
          if (existing.digest === expectedDigest) {
            return {
              prepared: true,
              revision: existing.revision,
              recovered: true,
            };
          }
          return this.operationConflict(operation, existing.revision);
        }

        const current = await this.readRevision(
          operation.repositoryPath,
          operation.targetRef,
        );
        if (current !== operation.expectedRevision)
          return this.casConflict(operation, current);

        const indexPath = join(
          await this.commonDirectory(operation.repositoryPath),
          `quest-operation-${crypto.randomUUID()}.index`,
        );
        try {
          await requiredGit(
            operation.repositoryPath,
            ["read-tree", operation.expectedRevision],
            {
              env: { GIT_INDEX_FILE: indexPath },
            },
          );
          for (const change of operation.changes) {
            if (change.content === null) {
              await requiredGit(
                operation.repositoryPath,
                ["update-index", "--force-remove", "--", change.path],
                {
                  env: { GIT_INDEX_FILE: indexPath },
                },
              );
              continue;
            }
            const blob = await requiredGit(
              operation.repositoryPath,
              ["hash-object", "-w", "--stdin"],
              {
                stdin: change.content,
              },
            );
            await requiredGit(
              operation.repositoryPath,
              [
                "update-index",
                "--add",
                "--cacheinfo",
                `100644,${blob},${change.path}`,
              ],
              {
                env: { GIT_INDEX_FILE: indexPath },
              },
            );
          }
          const tree = await requiredGit(
            operation.repositoryPath,
            ["write-tree"],
            {
              env: { GIT_INDEX_FILE: indexPath },
            },
          );
          await operation.checkpoint?.("staged");
          const revision = await requiredGit(
            operation.repositoryPath,
            ["commit-tree", tree, "-p", operation.expectedRevision],
            { stdin: this.message(operation, expectedDigest) },
          );
          await this.recordJournal(
            operation.repositoryPath,
            operation.operationId,
            revision,
          );
          await operation.checkpoint?.("committed");
          return { prepared: true, revision };
        } finally {
          await rm(indexPath, { force: true });
        }
      },
    );
    return "prepared" in prepared
      ? this.updateRef(
          operation,
          prepared.revision,
          operation.checkpoint,
          prepared.recovered ?? false,
        )
      : prepared;
  }

  async synchronize(
    operation: GitSynchronization,
  ): Promise<GitOperationResult> {
    for (const namespace of operation.sharedNamespaces ?? [])
      assertSafePath(namespace);
    const prepared = await this.withPreparationLock(
      operation.repositoryPath,
      async (): Promise<
        | GitOperationResult
        | {
            readonly prepared: true;
            readonly revision: string;
            readonly recovered?: boolean;
          }
      > => {
        const existing = await this.findOperation(
          operation.repositoryPath,
          operation.targetRef,
          operation.operationId,
        );
        const expectedDigest = operationDigest(operation);
        if (existing) {
          if (existing.digest === expectedDigest) {
            const intended = existing.result ?? existing.revision;
            const current = await this.readRevision(
              operation.repositoryPath,
              operation.targetRef,
            );
            if (current === intended)
              return { kind: "success", revision: intended, recovered: true };
            if (current !== operation.expectedRevision)
              return this.casConflict(operation, current);
            return { prepared: true, revision: intended, recovered: true };
          }
          return this.operationConflict(operation, existing.revision);
        }
        const current = await this.readRevision(
          operation.repositoryPath,
          operation.targetRef,
        );
        if (current !== operation.expectedRevision)
          return this.casConflict(operation, current);
        if (operation.sourceRevision === current)
          return this.recordSynchronizationNoop(operation, current);
        const base = await requiredGit(operation.repositoryPath, [
          "merge-base",
          current,
          operation.sourceRevision,
        ]);
        if (base === operation.sourceRevision)
          return this.recordSynchronizationNoop(operation, current);
        if (base === current) {
          await this.recordSynchronizationNoop(
            operation,
            operation.sourceRevision,
          );
          return { prepared: true, revision: operation.sourceRevision };
        }

        const targetChanges = await this.changedPaths(
          operation.repositoryPath,
          base,
          current,
        );
        const sourceChanges = await this.changedPaths(
          operation.repositoryPath,
          base,
          operation.sourceRevision,
        );
        const conflicts = [...targetChanges]
          .filter(
            (path) =>
              sourceChanges.has(path) ||
              (operation.sharedNamespaces ?? []).some(
                (prefix) =>
                  isPrefix(prefix, path) &&
                  [...sourceChanges].some((other) => isPrefix(prefix, other)),
              ),
          )
          .sort();
        if (conflicts.length)
          return this.integrationConflict(operation, current, conflicts);

        const merged = await git(operation.repositoryPath, [
          "merge-tree",
          "--write-tree",
          current,
          operation.sourceRevision,
        ]);
        if (merged.code !== 0)
          return this.integrationConflict(
            operation,
            current,
            [...targetChanges, ...sourceChanges].sort(),
          );
        const revision = await requiredGit(
          operation.repositoryPath,
          [
            "commit-tree",
            merged.stdout,
            "-p",
            current,
            "-p",
            operation.sourceRevision,
          ],
          {
            stdin: this.message(operation, expectedDigest),
          },
        );
        await this.recordJournal(
          operation.repositoryPath,
          operation.operationId,
          revision,
        );
        return { prepared: true, revision };
      },
    );
    return "prepared" in prepared
      ? this.updateRef(
          operation,
          prepared.revision,
          operation.checkpoint,
          prepared.recovered ?? false,
        )
      : prepared;
  }

  async push(operation: GitPush): Promise<GitOperationResult> {
    const expectedRevision = await this.readRevision(
      operation.repositoryPath,
      operation.sourceRef,
    );
    const result = await git(operation.repositoryPath, [
      "push",
      "--porcelain",
      operation.remote,
      `${operation.sourceRef}:${operation.targetRef}`,
    ]);
    if (result.code === 0)
      return { kind: "success", revision: expectedRevision, recovered: false };
    const remote = await git(operation.repositoryPath, [
      "ls-remote",
      operation.remote,
      operation.targetRef,
    ]);
    const actualRevision = remote.stdout.split(/\s/u)[0] || "";
    return {
      kind: "conflict",
      code: "push_rejected",
      expectedRevision,
      actualRevision,
      paths: [],
    };
  }

  private async commonDirectory(repositoryPath: string): Promise<string> {
    const value = await requiredGit(repositoryPath, [
      "rev-parse",
      "--git-common-dir",
    ]);
    return resolve(repositoryPath, value);
  }

  private assertOperationScope(operation: GitOperation): void {
    if (!operation.ownedPaths.length)
      throw new GitPreparationError("An operation must own at least one path.");
    const owned = new Set<string>();
    const changed = new Set<string>();
    for (const path of operation.ownedPaths) {
      assertSafePath(path);
      if (owned.has(path))
        throw new GitPreparationError("Operation-owned paths must be unique.");
      owned.add(path);
    }
    for (const change of operation.changes) {
      assertSafePath(change.path);
      if (!owned.has(change.path) || changed.has(change.path))
        throw new GitPreparationError(
          "Changes must exactly match predeclared operation-owned paths.",
        );
      changed.add(change.path);
    }
    if (changed.size !== owned.size)
      throw new GitPreparationError(
        "Changes must exactly match predeclared operation-owned paths.",
      );
  }

  private async withPreparationLock<T>(
    repositoryPath: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const commonDirectory = await this.commonDirectory(repositoryPath);
    const previous =
      preparationQueues.get(commonDirectory) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => next);
    preparationQueues.set(commonDirectory, queued);
    await previous;
    const lockDirectory = join(
      commonDirectory,
      "quest-operation-preparation.lock",
    );
    let acquired = false;
    try {
      await this.acquirePreparationLock(lockDirectory);
      acquired = true;
      return await action();
    } catch (error) {
      if ((error as { code?: string }).code === "EEXIST") {
        throw new GitPreparationError(
          "Another local process is preparing a Git operation.",
        );
      }
      throw error;
    } finally {
      if (acquired) await rm(lockDirectory, { recursive: true, force: true });
      release();
      if (preparationQueues.get(commonDirectory) === queued)
        preparationQueues.delete(commonDirectory);
    }
  }

  /** A directory creation is cross-process atomic; dead owners are reclaimed. */
  private async acquirePreparationLock(lockDirectory: string): Promise<void> {
    for (;;) {
      try {
        await mkdir(lockDirectory);
        await writeFile(
          join(lockDirectory, "owner.json"),
          JSON.stringify({ pid: process.pid, startedAt: Date.now() }),
          "utf8",
        );
        return;
      } catch (error) {
        if ((error as { code?: string }).code !== "EEXIST") throw error;
        if (await this.lockOwnerIsDead(lockDirectory)) {
          await rm(lockDirectory, { recursive: true, force: true });
          continue;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    }
  }

  private async lockOwnerIsDead(lockDirectory: string): Promise<boolean> {
    try {
      const owner = JSON.parse(
        await readFile(join(lockDirectory, "owner.json"), "utf8"),
      ) as { pid?: unknown };
      if (typeof owner.pid !== "number" || !Number.isInteger(owner.pid))
        return true;
      try {
        process.kill(owner.pid, 0);
        return false;
      } catch {
        return true;
      }
    } catch {
      try {
        return Date.now() - (await stat(lockDirectory)).mtimeMs > 100;
      } catch {
        return true;
      }
    }
  }

  private async findOperation(
    repositoryPath: string,
    ref: string,
    operationId: string,
  ) {
    const journal = await git(repositoryPath, [
      "log",
      "--format=%H%x00%B%x1e",
      this.journalRef(operationId),
    ]);
    if (journal.code === 0) {
      const found = parseOperationCommit(journal.stdout, operationId);
      if (found) return found;
    }
    const result = await git(repositoryPath, [
      "log",
      "--format=%H%x00%B%x1e",
      ref,
    ]);
    return result.code === 0
      ? parseOperationCommit(result.stdout, operationId)
      : undefined;
  }

  private journalRef(operationId: string): string {
    return `refs/quest/operations/${digest(operationId)}`;
  }

  private async recordJournal(
    repositoryPath: string,
    operationId: string,
    revision: string,
  ): Promise<void> {
    await requiredGit(repositoryPath, [
      "update-ref",
      this.journalRef(operationId),
      revision,
    ]);
  }

  private async recordSynchronizationNoop(
    operation: GitSynchronization,
    revision: string,
  ): Promise<GitOperationResult> {
    const tree = await requiredGit(operation.repositoryPath, [
      "rev-parse",
      `${revision}^{tree}`,
    ]);
    const journal = await requiredGit(
      operation.repositoryPath,
      ["commit-tree", tree, "-p", revision],
      {
        stdin: `${this.message(operation, operationDigest(operation))}Quest-Result-Revision: ${revision}\n`,
      },
    );
    await this.recordJournal(
      operation.repositoryPath,
      operation.operationId,
      journal,
    );
    return { kind: "success", revision, recovered: false };
  }

  private async changedPaths(
    repositoryPath: string,
    base: string,
    revision: string,
  ): Promise<Set<string>> {
    const output = await requiredGit(repositoryPath, [
      "diff",
      "--name-only",
      base,
      revision,
    ]);
    return new Set(output ? output.split("\n") : []);
  }

  private message(
    operation: GitOperation | GitSynchronization,
    operationDigest: string,
  ): string {
    return `${operation.message}\n\nQuest-Operation-Id: ${operation.operationId}\nQuest-Operation-Digest: ${operationDigest}\n`;
  }

  private async updateRef(
    operation: GitOperation | GitSynchronization,
    revision: string,
    checkpoint?: (
      phase: "staged" | "committed" | "cas",
    ) => void | Promise<void>,
    recovered = false,
  ): Promise<GitOperationResult> {
    await checkpoint?.("cas");
    const result = await git(operation.repositoryPath, [
      "update-ref",
      operation.targetRef,
      revision,
      operation.expectedRevision,
    ]);
    if (result.code === 0) return { kind: "success", revision, recovered };
    return this.casConflict(
      operation,
      await this.readRevision(operation.repositoryPath, operation.targetRef),
    );
  }

  private casConflict(
    operation: GitOperation | GitSynchronization,
    actualRevision: string,
  ): GitOperationConflict {
    return {
      kind: "conflict",
      code: "cas_conflict",
      expectedRevision: operation.expectedRevision,
      actualRevision,
      paths: [],
    };
  }

  private operationConflict(
    operation: GitOperation | GitSynchronization,
    actualRevision: string,
  ): GitOperationConflict {
    return {
      kind: "conflict",
      code: "operation_conflict",
      expectedRevision: operation.expectedRevision,
      actualRevision,
      paths: [],
    };
  }

  private integrationConflict(
    operation: GitSynchronization,
    actualRevision: string,
    paths: readonly string[],
  ): GitOperationConflict {
    return {
      kind: "conflict",
      code: "integration_conflict",
      expectedRevision: operation.expectedRevision,
      actualRevision,
      paths,
    };
  }
}
