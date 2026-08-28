/** Stable identity for a checkout. `commonDirectory` identifies the clone;
 * `worktreePath` identifies this particular worktree inside that clone. */
export interface WorkspaceIdentity {
  readonly commonDirectory: string;
  readonly worktreePath: string;
}

export type WorkspaceFailure =
  | "not_git_worktree"
  | "not_initialized"
  | "bare_repository"
  | "unsafe_path"
  | "already_initialized"
  | "registry_conflict"
  | "registry_invalid";

export class WorkspaceError extends Error {
  constructor(
    readonly code: WorkspaceFailure,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/** Optional operator-declared identity stored alongside schemaVersion.
 * Both fields are absent on every workspace initialized before this existed. */
export interface WorkspaceConfiguration {
  readonly schemaVersion: 1;
  readonly name?: string;
  readonly taskIdPrefix?: string;
}

export interface WorkspacePort {
  inspect(path: string): Promise<WorkspaceIdentity>;
  writeInitialization(path: string, content: string): Promise<void>;
  readConfiguration(path: string): Promise<WorkspaceConfiguration>;
  readRegistry(registryPath: string): Promise<readonly WorkspaceIdentity[]>;
  writeRegistry(
    registryPath: string,
    entries: readonly WorkspaceIdentity[],
  ): Promise<void>;
  exists(path: string): Promise<boolean>;
}
