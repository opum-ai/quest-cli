import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  stat,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  WorkspaceError,
  type WorkspaceConfiguration,
  type WorkspaceIdentity,
  type WorkspacePort,
} from "../../ports/workspaces.ts";

/** Reads one `key = "value"` line from the small, self-authored TOML subset
 * Quest writes; undefined when the key is absent, quoteless, or malformed. */
function tomlString(content: string, key: string): string | undefined {
  const match = content.match(
    new RegExp(`^${key}\\s*=\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*$`, "mu"),
  );
  return match
    ? match[1].replaceAll('\\"', '"').replaceAll("\\\\", "\\")
    : undefined;
}

async function git(path: string, args: readonly string[]): Promise<string> {
  const process = Bun.spawn(["git", "-C", path, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const exitCode = await process.exited;
  if (exitCode !== 0)
    throw new WorkspaceError("not_git_worktree", "Path is not a Git worktree.");
  return (await new Response(process.stdout).text()).trim();
}

function contained(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path))
  );
}

async function assertNoSymlinkEscape(
  root: string,
  target: string,
): Promise<void> {
  let current = root;
  for (const part of relative(root, target).split(sep)) {
    if (!part) continue;
    current = join(current, part);
    try {
      if (
        (await lstat(current)).isSymbolicLink() &&
        !contained(root, await realpath(current))
      ) {
        throw new WorkspaceError(
          "unsafe_path",
          "Workspace path escapes through a symlink.",
        );
      }
    } catch (error) {
      if (error instanceof WorkspaceError) throw error;
      break; // the remaining leaf will be created only after its parents are checked
    }
  }
}

export class LocalWorkspacePort implements WorkspacePort {
  async inspect(path: string): Promise<WorkspaceIdentity> {
    const suppliedPath = await realpath(path);
    if (
      (await git(suppliedPath, ["rev-parse", "--is-bare-repository"])) ===
      "true"
    ) {
      throw new WorkspaceError(
        "bare_repository",
        "Quest requires a non-bare Git worktree.",
      );
    }
    const worktreePath = await realpath(
      resolve(
        suppliedPath,
        await git(suppliedPath, ["rev-parse", "--show-toplevel"]),
      ),
    );
    const commonDirectory = await realpath(
      resolve(
        worktreePath,
        await git(worktreePath, ["rev-parse", "--git-common-dir"]),
      ),
    );
    return { commonDirectory, worktreePath };
  }

  async writeInitialization(path: string, content: string): Promise<void> {
    const root = await realpath(path);
    const target = resolve(root, ".quest", "workspace.toml");
    if (!contained(root, target))
      throw new WorkspaceError(
        "unsafe_path",
        "Workspace path escapes its root.",
      );
    await assertNoSymlinkEscape(root, target);
    try {
      await stat(target);
      throw new WorkspaceError(
        "already_initialized",
        "Workspace is already initialized.",
      );
    } catch (error) {
      if (error instanceof WorkspaceError) throw error;
    }
    const parent = dirname(target);
    await mkdir(parent, { recursive: true });
    await assertNoSymlinkEscape(root, target);
    await writeFile(target, content, { encoding: "utf8", flag: "wx" });
  }

  async writeConfiguration(path: string, content: string): Promise<void> {
    const root = await realpath(path);
    const target = resolve(root, ".quest", "workspace.toml");
    if (!contained(root, target))
      throw new WorkspaceError(
        "unsafe_path",
        "Workspace path escapes its root.",
      );
    await assertNoSymlinkEscape(root, target);
    const parent = dirname(target);
    await mkdir(parent, { recursive: true });
    await assertNoSymlinkEscape(root, target);
    await writeFile(target, content, "utf8");
  }

  async hasOwnedContent(path: string): Promise<boolean> {
    const root = await realpath(path);
    const questRoot = join(root, ".quest");
    if (await this.exists(join(questRoot, "planning.json"))) return true;
    for (const sub of [
      "tasks",
      "completed",
      "drafts",
      join("archive", "tasks"),
      join("archive", "drafts"),
    ]) {
      try {
        if ((await readdir(join(questRoot, sub))).length > 0) return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return false;
  }

  async readConfiguration(path: string): Promise<WorkspaceConfiguration> {
    const root = await realpath(path);
    const target = resolve(root, ".quest", "workspace.toml");
    let content: string;
    try {
      content = await readFile(target, "utf8");
    } catch {
      return { schemaVersion: 1 };
    }
    const name = tomlString(content, "name");
    const taskIdPrefix = tomlString(content, "taskIdPrefix");
    return {
      schemaVersion: 1,
      ...(name ? { name } : {}),
      ...(taskIdPrefix ? { taskIdPrefix } : {}),
    };
  }

  async readRegistry(
    registryPath: string,
  ): Promise<readonly WorkspaceIdentity[]> {
    try {
      const parsed: unknown = JSON.parse(await readFile(registryPath, "utf8"));
      if (
        !Array.isArray(parsed) ||
        !parsed.every(
          (entry) =>
            entry &&
            typeof entry === "object" &&
            typeof (entry as WorkspaceIdentity).commonDirectory === "string" &&
            typeof (entry as WorkspaceIdentity).worktreePath === "string",
        )
      ) {
        throw new WorkspaceError(
          "registry_invalid",
          "Workspace registry is invalid.",
        );
      }
      return parsed as WorkspaceIdentity[];
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return [];
      if (error instanceof WorkspaceError) throw error;
      throw new WorkspaceError(
        "registry_invalid",
        "Workspace registry is invalid.",
      );
    }
  }

  async writeRegistry(
    registryPath: string,
    entries: readonly WorkspaceIdentity[],
  ): Promise<void> {
    await mkdir(dirname(registryPath), { recursive: true });
    await writeFile(
      registryPath,
      `${JSON.stringify(entries, null, 2)}\n`,
      "utf8",
    );
  }

  async exists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }
}
