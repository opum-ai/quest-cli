import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import {
  AgentInstructionError,
  type AgentInstructionPort,
} from "../../ports/agent-instructions.ts";

function isContained(root: string, target: string): boolean {
  const path = relative(root, target);
  return (
    path === "" ||
    (!path.startsWith("../") && path !== ".." && !isAbsolute(path))
  );
}

/** Repository-local instruction storage which never follows a file symlink. */
export class LocalAgentInstructionPort implements AgentInstructionPort {
  constructor(private readonly root: string) {}

  private async target(path: string): Promise<string> {
    if (
      !path ||
      path.includes("\0") ||
      isAbsolute(path) ||
      path.includes("/") ||
      path.includes("\\")
    ) {
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
    await writeFile(target, content, "utf8");
  }
}
