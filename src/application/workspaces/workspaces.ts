import {
  WorkspaceError,
  type WorkspaceIdentity,
  type WorkspacePort,
} from "../../ports/workspaces.ts";

export {
  WorkspaceError,
  type WorkspaceIdentity,
  type WorkspacePort,
} from "../../ports/workspaces.ts";

export interface WorkspaceEntry extends WorkspaceIdentity {
  readonly state: "present" | "missing" | "invalid";
}

export const workspaceConfigurationPath = ".quest/workspace.toml";
const configuration = "schemaVersion = 1\n";

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
): Promise<WorkspaceIdentity> {
  assertSafeWorkspaceRelativePath(workspaceConfigurationPath);
  const identity = await port.inspect(path);
  await port.writeInitialization(identity.worktreePath, configuration);
  return identity;
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
