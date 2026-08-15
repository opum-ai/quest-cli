import type {
  GitOperation,
  GitOperationResult,
  GitPort,
  GitSynchronization,
  OwnedFileChange,
} from "../../ports/git.ts";

export type {
  GitOperation,
  GitOperationResult,
  GitPort,
  GitSynchronization,
  OwnedFileChange,
} from "../../ports/git.ts";

export class MutationDefinitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MutationDefinitionError";
  }
}

function normalizedPath(path: string): string {
  if (
    !path ||
    path.includes("\0") ||
    path.startsWith("/") ||
    path.startsWith("\\")
  ) {
    throw new MutationDefinitionError(
      "Owned paths must be workspace-relative.",
    );
  }
  const parts = path.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) {
    throw new MutationDefinitionError(
      "Owned paths must not traverse directories.",
    );
  }
  return parts.join("/");
}

/** Fails closed before adapter I/O if an operation has an ambiguous scope. */
export function assertDeclaredOwnedChanges(
  ownedPaths: readonly string[],
  changes: readonly OwnedFileChange[],
): void {
  const owned = ownedPaths.map(normalizedPath);
  const changed = changes.map((change) => normalizedPath(change.path));
  if (!owned.length || new Set(owned).size !== owned.length) {
    throw new MutationDefinitionError(
      "Owned paths must be a non-empty unique set.",
    );
  }
  if (
    changed.length !== owned.length ||
    new Set(changed).size !== changed.length ||
    changed.some((path) => !owned.includes(path))
  ) {
    throw new MutationDefinitionError(
      "Changes must exactly match the operation's predeclared owned paths.",
    );
  }
}

/** Reads the CAS basis before any write, then makes exactly one commit attempt. */
export async function commitOwnedOperation(
  port: GitPort,
  operation: Omit<GitOperation, "expectedRevision">,
): Promise<GitOperationResult> {
  assertDeclaredOwnedChanges(operation.ownedPaths, operation.changes);
  const expectedRevision = await port.readRevision(
    operation.repositoryPath,
    operation.targetRef,
  );
  return port.commit({ ...operation, expectedRevision });
}

/** Synchronization similarly takes one observed basis and never retries a loss. */
export async function synchronizeOwnedOperation(
  port: GitPort,
  operation: Omit<GitSynchronization, "expectedRevision">,
): Promise<GitOperationResult> {
  const expectedRevision = await port.readRevision(
    operation.repositoryPath,
    operation.targetRef,
  );
  return port.synchronize({ ...operation, expectedRevision });
}
