import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  LifecycleTaskRepository,
  LifecycleWriteRequest,
  TaskWriteRequest,
} from "./tasks.ts";
import {
  draftState,
  taskState,
  type DraftLocation,
  type DraftState,
  type TaskLocation,
  type TaskState,
} from "../../domain/tasks/tasks.ts";
import { RecordConflictError } from "../../domain/records.ts";

const LOCK_WAIT_MS = 500;

/**
 * Small repository-local storage used by the executable composition root.
 * It intentionally stores only validated public task records beneath .quest.
 */
export class LocalTaskRepository implements LifecycleTaskRepository {
  constructor(private readonly directory: string) {}

  private pathFor(id: string): string {
    return join(this.directory, `${id}.json`);
  }

  private root(): string {
    return dirname(this.directory);
  }
  private taskPath(id: string, location: TaskLocation): string {
    return join(this.root(), location, `${id}.json`);
  }
  private draftPath(id: string, location: DraftLocation): string {
    return join(this.root(), location, `${id}.json`);
  }

  private async recordsAt<T>(
    directory: string,
    decode: (value: unknown) => T,
  ): Promise<readonly T[]> {
    try {
      const names = await readdir(directory);
      return await Promise.all(
        names
          .filter((name) => name.endsWith(".json"))
          .sort()
          .map(async (name) =>
            decode(JSON.parse(await readFile(join(directory, name), "utf8"))),
          ),
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  private async snapshot() {
    const root = this.root();
    const [active, completed, archived, drafts, archivedDrafts] =
      await Promise.all([
        this.recordsAt(this.directory, (value) =>
          taskState(value as TaskState),
        ),
        this.recordsAt(join(root, "completed"), (value) =>
          taskState(value as TaskState),
        ),
        this.recordsAt(join(root, "archive", "tasks"), (value) =>
          taskState(value as TaskState),
        ),
        this.recordsAt(join(root, "drafts"), (value) =>
          draftState(value as DraftState),
        ),
        this.recordsAt(join(root, "archive", "drafts"), (value) =>
          draftState(value as DraftState),
        ),
      ]);
    const taskRecords = [
      ...active.map((task) => ({ task, location: "tasks" as const })),
      ...completed.map((task) => ({ task, location: "completed" as const })),
      ...archived.map((task) => ({
        task,
        location: "archive/tasks" as const,
      })),
    ];
    const draftRecords = [
      ...drafts.map((draft) => ({ draft, location: "drafts" as const })),
      ...archivedDrafts.map((draft) => ({
        draft,
        location: "archive/drafts" as const,
      })),
    ];
    if (
      new Set(taskRecords.map((record) => record.task.id)).size !==
      taskRecords.length
    )
      throw new RecordConflictError("task_lifecycle_duplicate_identity");
    if (
      new Set(draftRecords.map((record) => record.draft.id)).size !==
      draftRecords.length
    )
      throw new RecordConflictError("draft_lifecycle_duplicate_identity");
    return {
      taskRecords,
      drafts: draftRecords,
    };
  }

  private revision(
    snapshot: Awaited<ReturnType<LocalTaskRepository["snapshot"]>>,
  ): string {
    return new Bun.CryptoHasher("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex");
  }

  private async acquireLock(lock: string): Promise<boolean> {
    const deadline = Date.now() + LOCK_WAIT_MS;
    while (Date.now() < deadline) {
      try {
        await mkdir(lock);
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      await Bun.sleep(5);
    }
    return false;
  }

  async readAll() {
    const snapshot = await this.snapshot();
    return {
      revision: this.revision(snapshot),
      tasks: snapshot.taskRecords
        .filter((record) => record.location === "tasks")
        .map((record) => record.task),
      taskRecords: snapshot.taskRecords,
      drafts: snapshot.drafts,
    };
  }

  async write(request: TaskWriteRequest) {
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".write.lock");
    if (!(await this.acquireLock(lock))) {
      const current = await this.readAll();
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: current.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
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

  async writeLifecycle(request: LifecycleWriteRequest) {
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".write.lock");
    if (!(await this.acquireLock(lock))) {
      const current = await this.readAll();
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: current.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    }
    try {
      const current = await this.readAll();
      if (current.revision !== request.expectedRevision)
        return {
          kind: "conflict" as const,
          expectedRevision: request.expectedRevision,
          actualRevision: current.revision,
          operationId: request.operationId,
          ownedPaths: request.ownedPaths,
        };
      const writes: Promise<void>[] = [];
      for (const change of request.taskChanges) {
        const path = this.taskPath(
          "remove" in change ? change.taskId : change.task.id,
          change.location,
        );
        if ("remove" in change) writes.push(rm(path, { force: true }));
        else
          writes.push(
            (async () => {
              await mkdir(dirname(path), { recursive: true });
              const temporary = `${path}.${crypto.randomUUID()}.tmp`;
              await writeFile(
                temporary,
                `${JSON.stringify(change.task)}\n`,
                "utf8",
              );
              await rename(temporary, path);
            })(),
          );
      }
      for (const change of request.draftChanges) {
        const path = this.draftPath(
          "remove" in change ? change.draftId : change.draft.id,
          change.location,
        );
        if ("remove" in change) writes.push(rm(path, { force: true }));
        else
          writes.push(
            (async () => {
              await mkdir(dirname(path), { recursive: true });
              const temporary = `${path}.${crypto.randomUUID()}.tmp`;
              await writeFile(
                temporary,
                `${JSON.stringify(change.draft)}\n`,
                "utf8",
              );
              await rename(temporary, path);
            })(),
          );
      }
      await Promise.all(writes);
      return {
        kind: "success" as const,
        revision: (await this.readAll()).revision,
      };
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }
}
