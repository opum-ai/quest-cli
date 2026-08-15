import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { TaskRepository, TaskWriteRequest } from "./tasks.ts";
import { taskState, type TaskState } from "../../domain/tasks/tasks.ts";

/**
 * Small repository-local storage used by the executable composition root.
 * It intentionally stores only validated public task records beneath .quest.
 */
export class LocalTaskRepository implements TaskRepository {
  constructor(private readonly directory: string) {}

  private pathFor(id: string): string {
    return join(this.directory, `${id}.json`);
  }

  private async snapshot(): Promise<readonly TaskState[]> {
    try {
      const names = await readdir(this.directory);
      const tasks = await Promise.all(
        names
          .filter((name) => name.endsWith(".json"))
          .sort()
          .map(async (name) =>
            taskState(
              JSON.parse(await readFile(join(this.directory, name), "utf8")),
            ),
          ),
      );
      return tasks;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  private revision(tasks: readonly TaskState[]): string {
    return new Bun.CryptoHasher("sha256")
      .update(JSON.stringify(tasks))
      .digest("hex");
  }

  async readAll() {
    const tasks = await this.snapshot();
    return { revision: this.revision(tasks), tasks };
  }

  async write(request: TaskWriteRequest) {
    const current = await this.readAll();
    if (current.revision !== request.expectedRevision) {
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: current.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    }
    await mkdir(this.directory, { recursive: true });
    const destination = this.pathFor(request.task.id);
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(request.task)}\n`, "utf8");
    await rename(temporary, destination);
    return {
      kind: "success" as const,
      revision: (await this.readAll()).revision,
    };
  }
}
