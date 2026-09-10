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
  | "stray_content"
  | "registry_conflict"
  | "registry_invalid"
  | "invalid_configuration";

export class WorkspaceError extends Error {
  constructor(
    readonly code: WorkspaceFailure,
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceError";
  }
}

/** Where the quest Claude Code skill for this workspace comes from: "repo"
 * (default) generates .claude/skills/quest/SKILL.md into this repository;
 * "plugin" declares it ships instead from the opum-quest Claude Code plugin,
 * so quest agents stops writing or proposing the per-repo copy. */
export type AgentSkillSource = "repo" | "plugin";

/** Optional operator-declared identity stored alongside schemaVersion.
 * All three fields are absent on every workspace initialized before they
 * existed. agentSkillSource is stored as an `[agents]` TOML table
 * (`skill_source = "..."`) so an older Quest reading this file simply does
 * not recognize the table and ignores it, rather than erroring. */
export interface WorkspaceConfiguration {
  readonly schemaVersion: 1;
  readonly name?: string;
  readonly taskIdPrefix?: string;
  readonly agentSkillSource?: AgentSkillSource;
}

export interface WorkspacePort {
  inspect(path: string): Promise<WorkspaceIdentity>;
  writeInitialization(path: string, content: string): Promise<void>;
  /** Unconditional create-or-overwrite of workspace.toml, for reconfiguring
   * an existing workspace (or adopting one whose config file alone was
   * removed while its task records survived). Unlike writeInitialization,
   * this never refuses because the file already exists. */
  writeConfiguration(path: string, content: string): Promise<void>;
  readConfiguration(path: string): Promise<WorkspaceConfiguration>;
  /** True if the worktree holds any Quest-owned task/planning record, config
   * file aside -- used to tell a genuinely fresh directory apart from one
   * where only workspace.toml went missing. */
  hasOwnedContent(path: string): Promise<boolean>;
  readRegistry(registryPath: string): Promise<readonly WorkspaceIdentity[]>;
  writeRegistry(
    registryPath: string,
    entries: readonly WorkspaceIdentity[],
  ): Promise<void>;
  exists(path: string): Promise<boolean>;
}
