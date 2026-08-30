import { lstat, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  AgentInstructionError,
  type AgentInstructionPort,
} from "../../ports/agent-instructions.ts";

function isContained(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path))
  );
}

/** Rejects a relative path that reaches its target through a symlinked
 * intermediate directory; the leaf's own symlink-ness is checked separately. */
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
        !isContained(root, await realpath(current))
      ) {
        throw new AgentInstructionError(
          "Agent instruction path escapes through a symlink.",
        );
      }
    } catch (error) {
      if (error instanceof AgentInstructionError) throw error;
      break; // the remaining leaf will be created only after its parents are checked
    }
  }
}

/** Repository-local instruction storage which never follows a file symlink. */
export class LocalAgentInstructionPort implements AgentInstructionPort {
  constructor(private readonly root: string) {}

  private async target(path: string): Promise<string> {
    if (!path || path.includes("\0") || isAbsolute(path)) {
      throw new AgentInstructionError(
        "Agent instruction path is not supported.",
      );
    }
    const root = await realpath(this.root);
    const target = resolve(root, path);
    if (!isContained(root, target))
      throw new AgentInstructionError(
        "Agent instruction path escapes its workspace.",
      );
    await assertNoSymlinkEscape(root, target);
    return target;
  }

  async read(path: string): Promise<string | undefined> {
    const target = await this.target(path);
    try {
      if ((await lstat(target)).isSymbolicLink())
        throw new AgentInstructionError(
          "Agent instruction file must not be a symbolic link.",
        );
      return await readFile(target, "utf8");
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT") return undefined;
      throw error;
    }
  }

  async write(path: string, content: string): Promise<void> {
    const target = await this.target(path);
    try {
      if ((await lstat(target)).isSymbolicLink())
        throw new AgentInstructionError(
          "Agent instruction file must not be a symbolic link.",
        );
    } catch (error) {
      if ((error as { code?: string }).code !== "ENOENT") throw error;
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content, "utf8");
  }
}
