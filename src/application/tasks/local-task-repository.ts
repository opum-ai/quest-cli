import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
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
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".write.lock");
    while (true) {
      try {
        await mkdir(lock);
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        await Bun.sleep(1);
      }
    }
    try {
      // The revision check occurs while holding an inter-process lock, so a
      // stale read can only become a structured conflict, never a lost write.
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
      const destination = this.pathFor(request.task.id);
      const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(request.task)}\n`, "utf8");
      await rename(temporary, destination);
      return {
        kind: "success" as const,
        revision: (await this.readAll()).revision,
      };
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }
}
