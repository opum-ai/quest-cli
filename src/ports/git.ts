/** A complete, predeclared authored file effect. `null` removes the path. */
export interface OwnedFileChange {
  readonly path: string;
  readonly content: string | null;
}

/** The application supplies every owned path before the adapter begins I/O. */
export interface GitOperation {
  readonly repositoryPath: string;
  readonly targetRef: string;
  readonly expectedRevision: string;
  readonly operationId: string;
  readonly message: string;
  readonly ownedPaths: readonly string[];
  readonly changes: readonly OwnedFileChange[];
}

export interface GitOperationSuccess {
  readonly kind: "success";
  readonly revision: string;
  /** True when a previous invocation had already committed this operation. */
  readonly recovered: boolean;
}

export interface GitOperationConflict {
  readonly kind: "conflict";
  readonly code: "cas_conflict" | "integration_conflict" | "operation_conflict";
  readonly expectedRevision: string;
  readonly actualRevision: string;
  readonly paths: readonly string[];
}

export type GitOperationResult = GitOperationSuccess | GitOperationConflict;

export interface GitSynchronization {
  readonly repositoryPath: string;
  readonly targetRef: string;
  readonly expectedRevision: string;
  readonly sourceRevision: string;
  readonly operationId: string;
  readonly message: string;
  /** Prefixes whose concurrent changes are never integrated automatically. */
  readonly sharedNamespaces?: readonly string[];
}

export interface GitPort {
  readRevision(repositoryPath: string, ref: string): Promise<string>;
  commit(operation: GitOperation): Promise<GitOperationResult>;
  synchronize(operation: GitSynchronization): Promise<GitOperationResult>;
}
