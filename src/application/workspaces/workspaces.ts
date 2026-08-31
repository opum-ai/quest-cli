import { join } from "node:path";

import { canonicalIdPrefixPattern } from "../../domain/records.ts";
import {
  WorkspaceError,
  type WorkspaceConfiguration,
  type WorkspaceIdentity,
  type WorkspacePort,
} from "../../ports/workspaces.ts";

export {
  WorkspaceError,
  type WorkspaceConfiguration,
  type WorkspaceIdentity,
  type WorkspacePort,
} from "../../ports/workspaces.ts";

/** Re-exported for the CLI boundary, which may not reach into the domain
 * layer directly (see scripts/check-layers.mjs). */
export function isValidTaskIdPrefix(value: string): boolean {
  return canonicalIdPrefixPattern.test(value);
}

export interface WorkspaceEntry extends WorkspaceIdentity {
  readonly state: "present" | "missing" | "invalid";
}

export interface WorkspaceInitializationInput {
  readonly name?: string;
  readonly taskIdPrefix?: string;
}

export const workspaceConfigurationPath = ".quest/workspace.toml";

/** Escapes exactly the two TOML basic-string metacharacters; the values
 * Quest writes here are short operator-declared names, never raw input from
 * an external boundary. */
function tomlStringLiteral(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function serializeConfiguration(input: WorkspaceInitializationInput): string {
  const lines = ["schemaVersion = 1"];
  if (input.name) lines.push(`name = ${tomlStringLiteral(input.name)}`);
  if (input.taskIdPrefix)
    lines.push(`taskIdPrefix = ${tomlStringLiteral(input.taskIdPrefix)}`);
  return `${lines.join("\n")}\n`;
}

/** Validates an operator-supplied relative Quest path before any write. */
export function assertSafeWorkspaceRelativePath(path: string): void {
  if (
    !path ||
    path.includes("\0") ||
    path.startsWith("/") ||
    path.startsWith("\\")
  ) {
    throw new WorkspaceError("unsafe_path", "Workspace path is not safe.");
  }
  const pieces = path.split(/[\\/]/u);
  if (pieces.some((piece) => !piece || piece === "." || piece === "..")) {
    throw new WorkspaceError("unsafe_path", "Workspace path is not safe.");
  }
  const keys = pieces.map((piece) =>
    piece.normalize("NFC").toLocaleLowerCase("en-US"),
  );
  if (new Set(keys).size !== keys.length) {
    throw new WorkspaceError(
      "unsafe_path",
      "Workspace path has a case collision.",
    );
  }
}

/** Creates precisely the declared authored configuration in a non-bare worktree. */
export async function initializeWorkspace(
  port: WorkspacePort,
  path: string,
  input: WorkspaceInitializationInput = {},
): Promise<WorkspaceIdentity> {
  assertSafeWorkspaceRelativePath(workspaceConfigurationPath);
  const identity = await port.inspect(path);
  const configured = await port.exists(
    join(identity.worktreePath, workspaceConfigurationPath),
  );
  // A directory can hold real task records with no workspace.toml -- e.g.
  // something removed only the config file, or a caller is re-running init
  // against a directory `rm -rf .quest && quest init` already emptied of
  // config but not (yet) of content (QCLI-161). Absent config is not the
  // same fact as "nothing here": refuse rather than silently treat it as a
  // fresh workspace and orphan whatever is already on disk.
  if (!configured && (await port.hasOwnedContent(identity.worktreePath)))
    throw new WorkspaceError(
      "stray_content",
      "This directory holds Quest task records but no workspace.toml. Refusing to treat it as a fresh workspace.",
    );
  await port.writeInitialization(
    identity.worktreePath,
    serializeConfiguration(input),
  );
  return identity;
}

/**
 * Updates an existing workspace's declared name/taskIdPrefix without
 * deleting and recreating .quest/ -- the supported alternative to the
 * `rm -rf .quest && quest init` workaround that emptied opum-agent's
 * workspace of 26 tracked task records (QCLI-161). Fields not given keep
 * their current value. Also the recovery path for a workspace.toml that
 * went missing while its task records survived: it adopts them under the
 * newly declared configuration instead of requiring `quest init` to refuse.
 * A directory with neither existing config nor any owned content has
 * nothing to reconfigure -- that is what plain `quest init` is for.
 */
export async function reconfigureWorkspace(
  port: WorkspacePort,
  path: string,
  input: WorkspaceInitializationInput,
): Promise<WorkspaceIdentity> {
  assertSafeWorkspaceRelativePath(workspaceConfigurationPath);
  const identity = await port.inspect(path);
  const configured = await port.exists(
    join(identity.worktreePath, workspaceConfigurationPath),
  );
  if (!configured && !(await port.hasOwnedContent(identity.worktreePath)))
    throw new WorkspaceError(
      "not_initialized",
      "Workspace is not initialized. Run quest init (without --reconfigure) from a Git worktree.",
    );
  const current = configured
    ? await port.readConfiguration(identity.worktreePath)
    : ({ schemaVersion: 1 } as const);
  await port.writeConfiguration(
    identity.worktreePath,
    serializeConfiguration({
      name: input.name ?? current.name,
      taskIdPrefix: input.taskIdPrefix ?? current.taskIdPrefix,
    }),
  );
  return identity;
}

/** Resolves a command's initialized worktree without creating tracker state. */
export async function resolveInitializedWorkspace(
  port: WorkspacePort,
  path: string,
): Promise<WorkspaceIdentity> {
  const identity = await port.inspect(path);
  if (
    !(await port.exists(
      join(identity.worktreePath, workspaceConfigurationPath),
    ))
  ) {
    throw new WorkspaceError(
      "not_initialized",
      "Workspace is not initialized. Run quest init from a Git worktree.",
    );
  }
  return identity;
}

/** Reads the initialized workspace's declared configuration. name and
 * taskIdPrefix are absent for every workspace initialized before they
 * existed; callers apply their own default. */
export async function resolveWorkspaceConfiguration(
  port: WorkspacePort,
  path: string,
): Promise<WorkspaceConfiguration> {
  const identity = await resolveInitializedWorkspace(port, path);
  return port.readConfiguration(identity.worktreePath);
}

/** Explicit local enrollment.  A common Git directory may have many worktrees. */
export async function enrollWorkspace(
  port: WorkspacePort,
  registryPath: string,
  path: string,
): Promise<WorkspaceIdentity> {
  const identity = await port.inspect(path);
  const current = await port.readRegistry(registryPath);
  const normalized = identity.worktreePath
    .normalize("NFC")
    .toLocaleLowerCase("en-US");
  if (
    current.some(
      (entry) =>
        entry.worktreePath.normalize("NFC").toLocaleLowerCase("en-US") ===
        normalized,
    )
  ) {
    throw new WorkspaceError(
      "registry_conflict",
      "This worktree is already enrolled.",
    );
  }
  await port.writeRegistry(registryPath, [...current, identity]);
  return identity;
}

/** Read-only: preserves enrollment order and reports missing entries without repairing them. */
export async function discoverWorkspaces(
  port: WorkspacePort,
  registryPath: string,
): Promise<readonly WorkspaceEntry[]> {
  const entries = await port.readRegistry(registryPath);
  const result: WorkspaceEntry[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const key = entry.worktreePath.normalize("NFC").toLocaleLowerCase("en-US");
    if (seen.has(key)) continue;
    seen.add(key);
    if (!(await port.exists(entry.worktreePath))) {
      result.push({ ...entry, state: "missing" });
      continue;
    }
    try {
      const observed = await port.inspect(entry.worktreePath);
      result.push({ ...observed, state: "present" });
    } catch {
      result.push({ ...entry, state: "invalid" });
    }
  }
  return result;
}
