import {
  appendFile,
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { decision, milestone } from "../../domain/planning/planning.ts";
import {
  canonicalId,
  RecordConflictError,
  RecordValidationError,
} from "../../domain/records.ts";
import {
  type DraftLocation,
  type DraftState,
  draftId,
  draftState,
  type TaskLocation,
  type TaskState,
  taskState,
  validateMilestoneClosure,
} from "../../domain/tasks/tasks.ts";
import type {
  MigrationTransactionRepository,
  MigrationTransactionRequest,
} from "../../ports/backlog-import.ts";
import type { PlanningRepository } from "../../ports/planning.ts";
import type {
  LifecycleTaskRepository,
  LifecycleWriteRequest,
  TaskWriteRequest,
} from "./tasks.ts";

const LOCK_WAIT_MS = 500;

/**
 * Small repository-local storage used by the executable composition root.
 * It intentionally stores only validated public task records beneath .quest.
 */
export class LocalTaskRepository
  implements LifecycleTaskRepository, MigrationTransactionRepository
{
  constructor(
    private readonly directory: string,
    private readonly planningRepository?: PlanningRepository,
  ) {}

  /** Typed active-record persistence shared by single writes and sessions. */
  async writeActiveRecord(task: TaskState): Promise<void> {
    const destination = this.pathFor(task.id);
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(task)}\n`, "utf8");
    await rename(temporary, destination);
  }

  private pathFor(id: string): string {
    return join(this.directory, `${id}.json`);
  }

  batchJournalPath(): string {
    return join(this.directory, ".batch.journal.jsonl");
  }

  /**
   * Reads a leftover batch journal and verifies it really belongs to a dead
   * process on this host. Anything ambiguous returns null so callers treat
   * the lock as live.
   */
  private async readOrphanJournal(): Promise<
    | undefined
    | {
        readonly sessionId: string;
        readonly appliedOperationIds: readonly string[];
      }
  > {
    try {
      const lines = (await readFile(this.batchJournalPath(), "utf8"))
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0);
      if (lines.length === 0) return undefined;
      const parsed = lines.map((line) => JSON.parse(line));
      const sessionId =
        typeof parsed[0]?.sessionId === "string"
          ? (parsed[0].sessionId as string)
          : undefined;
      const pid =
        typeof parsed[0]?.pid === "number"
          ? (parsed[0].pid as number)
          : undefined;
      if (!sessionId || !pid) return undefined;
      // Local liveness proof: the recorded pid must be ours-or-dead on the
      // same host to qualify as an orphan.
      if (pid === process.pid) return undefined;
      try {
        process.kill(pid, 0);
        return undefined; // still alive elsewhere: treat lock as live
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ESRCH") return undefined; // cannot prove death safely
      }
      return {
        sessionId,
        appliedOperationIds: parsed
          .map((entry) =>
            typeof entry.operationId === "string" ? entry.operationId : null,
          )
          .filter((value): value is string => value !== null),
      };
    } catch {
      return undefined;
    }
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
  private lifecycleJournalPath(): string {
    return join(this.directory, ".lifecycle.journal.json");
  }
  /**
   * A lifecycle journal is durable input after a process crash. Validate its
   * complete shape before replaying any change so a corrupt journal cannot
   * partially apply a deletion or escape the repository's lifecycle folders.
   */
  private validateLifecycleRequest(value: unknown): LifecycleWriteRequest {
    if (!value || typeof value !== "object")
      throw new RecordValidationError("invalid_lifecycle_journal");
    const request = value as Partial<LifecycleWriteRequest>;
    if (
      typeof request.expectedRevision !== "string" ||
      typeof request.operationId !== "string" ||
      !Array.isArray(request.ownedPaths) ||
      !request.ownedPaths.every((path) => typeof path === "string") ||
      !Array.isArray(request.taskChanges) ||
      !Array.isArray(request.draftChanges)
    )
      throw new RecordValidationError("invalid_lifecycle_journal");

    const taskLocations: readonly TaskLocation[] = [
      "tasks",
      "completed",
      "archive/tasks",
    ];
    const draftLocations: readonly DraftLocation[] = [
      "drafts",
      "archive/drafts",
    ];
    const paths = new Set<string>();
    const uniquePath = (path: string): void => {
      if (paths.has(path))
        throw new RecordValidationError("invalid_lifecycle_journal");
      paths.add(path);
    };
    for (const change of request.taskChanges) {
      if (
        !change ||
        typeof change !== "object" ||
        !taskLocations.includes(change.location)
      )
        throw new RecordValidationError("invalid_lifecycle_journal");
      if ("remove" in change) {
        if (change.remove !== true || typeof change.taskId !== "string")
          throw new RecordValidationError("invalid_lifecycle_journal");
        if (canonicalId(change.taskId) !== change.taskId)
          throw new RecordValidationError("invalid_lifecycle_journal");
        uniquePath(this.taskPath(change.taskId, change.location));
      } else {
        const task = taskState(change.task);
        uniquePath(this.taskPath(task.id, change.location));
      }
    }
    for (const change of request.draftChanges) {
      if (
        !change ||
        typeof change !== "object" ||
        !draftLocations.includes(change.location)
      )
        throw new RecordValidationError("invalid_lifecycle_journal");
      if ("remove" in change) {
        if (change.remove !== true || typeof change.draftId !== "string")
          throw new RecordValidationError("invalid_lifecycle_journal");
        if (draftId(change.draftId) !== change.draftId)
          throw new RecordValidationError("invalid_lifecycle_journal");
        uniquePath(this.draftPath(change.draftId, change.location));
      } else {
        const draft = draftState(change.draft);
        uniquePath(this.draftPath(draft.id, change.location));
      }
    }
    return request as LifecycleWriteRequest;
  }
  private async writeLifecycleRecord(
    path: string,
    value: unknown,
  ): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value)}\n`, "utf8");
    await rename(temporary, path);
  }
  /** Replays a durable operation with destinations first, so a fault cannot lose the source record. */
  private async applyLifecycle(request: LifecycleWriteRequest): Promise<void> {
    const removals: string[] = [];
    for (const change of request.taskChanges) {
      const path = this.taskPath(
        "remove" in change ? change.taskId : change.task.id,
        change.location,
      );
      if ("remove" in change) removals.push(path);
      else await this.writeLifecycleRecord(path, change.task);
    }
    for (const change of request.draftChanges) {
      const path = this.draftPath(
        "remove" in change ? change.draftId : change.draft.id,
        change.location,
      );
      if ("remove" in change) removals.push(path);
      else await this.writeLifecycleRecord(path, change.draft);
    }
    for (const path of removals) await rm(path, { force: true });
  }
  private async recoverLifecycle(): Promise<void> {
    try {
      const request = this.validateLifecycleRequest(
        JSON.parse(await readFile(this.lifecycleJournalPath(), "utf8")),
      );
      await this.applyLifecycle(request);
      await rm(this.lifecycleJournalPath(), { force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }

  private async recordsAt<T>(
    directory: string,
    decode: (value: unknown) => T,
  ): Promise<readonly T[]> {
    try {
      const names = await readdir(directory);
      return await Promise.all(
        names
          // Journals live beside task records so recovery can acquire the same
          // lock. They are operational metadata, never authored records.
          .filter((name) => !name.startsWith(".") && name.endsWith(".json"))
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

  /** Protected (not private) so tests can instrument scan counts on a subclass. */
  protected async snapshot() {
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

  /**
   * Deterministically splices an upserted task record into an already
   * authoritative snapshot and derives the post-write revision without a
   * second full directory rescan (QCLI-122). The splice is only used when
   * the record replaces an existing active-row in place; every other case
   * falls back to an authoritative fresh read. Byte-equivalence with a
   * fresh read holds because the embedded record is reconstructed through
   * exactly the same JSON round trip (`taskState(JSON.parse(payload))`)
   * that `snapshot()` applies, and `recordsAt` sorts filenames so an
   * in-place replacement cannot change ordering.
   */
  private splicedSnapshotAfterUpsert(
    current: Awaited<ReturnType<LocalTaskRepository["readAll"]>>,
    payload: string,
  ): { snapshot: Awaited<ReturnType<LocalTaskRepository["snapshot"]>> } {
    const reparsed = taskState(JSON.parse(payload));
    const replaced = current.taskRecords.find(
      (record) => record.location === "tasks" && record.task.id === reparsed.id,
    );
    if (!replaced) throw new RecordValidationError("task_upsert_target_absent");
    return {
      snapshot: {
        taskRecords: current.taskRecords.map((record) =>
          record === replaced ? { ...record, task: reparsed } : record,
        ),
        drafts: current.drafts,
      },
    };
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

  /**
   * QCLI-122 batch session (corrected): amortizes per-operation directory
   * rescans and inter-process lock churn behind one locked session. Entry
   * performs the same revision CAS as a single write under the same lock;
   * EVERY non-locked exit (conflict, throw) releases the owned lock. Lock
   * ownership is journaled while held: an orphan journal proves the previous
   * holder died (its pid no longer exists), enabling real stale-lock
   * recovery instead of a permanent conflict.
   */
  async beginTaskBatch(expectedRevision: string): Promise<
    | {
        readonly kind: "locked";
        readonly session: TaskBatchSession;
        readonly recovered?: {
          readonly sessionId: string;
          readonly appliedOperationIds: readonly string[];
        };
      }
    | {
        readonly kind: "conflict";
        readonly expectedRevision: string;
        readonly actualRevision: string;
      }
    | {
        readonly kind: "unrecoverable_lock";
        readonly message: string;
      }
  > {
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".write.lock");
    const lockAcquired = await this.acquireLock(lock);
    if (!lockAcquired) {
      // Real stale-lock recovery: an orphaned journal proves the previous
      // holder crashed before finishing. Bounded single retry — never
      // recursion — and the recovered receipt travels to the caller.
      const orphan = await this.readOrphanJournal();
      if (!orphan)
        return {
          kind: "unrecoverable_lock",
          message:
            "Another writer holds .write.lock and no crash evidence exists.",
        };
      // Window A (crash before any marked write) still carries the session
      // id with an EMPTY operation receipt; windows B/C list what was
      // durably marked before death.
      const recoveredReceipt = {
        sessionId: orphan.sessionId,
        appliedOperationIds: orphan.appliedOperationIds,
      };
      await rm(lock, { recursive: true, force: true });
      const retried = await this.acquireLock(lock);
      if (!retried)
        return {
          kind: "unrecoverable_lock",
          message: "Recovered journal but failed to reclaim the freed lock.",
        };
      // Blocker #2 (fourth pass): the REACQUIRED lock belongs to this call
      // — every non-transfer exit (stale-revision conflict, read failure)
      // releases it through one bounded cleanup, matching main-path rules.
      let reacquisitionReleased = false;
      const releaseReacquired = async (): Promise<void> => {
        if (!reacquisitionReleased) {
          reacquisitionReleased = true;
          await rm(lock, { recursive: true, force: true });
        }
      };
      try {
        let current: Awaited<ReturnType<LocalTaskRepository["readAll"]>>;
        try {
          current = await this.readAll();
        } catch (error) {
          await releaseReacquired();
          throw error;
        }
        if (current.revision !== expectedRevision) {
          await releaseReacquired();
          return {
            kind: "conflict",
            expectedRevision,
            actualRevision: current.revision,
          };
        }
        const session = new LocalTaskBatchSession(
          this,
          lock,
          crypto.randomUUID(),
        );
        await session.journalReady();
        return { kind: "locked", session, recovered: recoveredReceipt };
      } catch (error) {
        await releaseReacquired();
        throw error;
      }
    }
    // From here on this process owns the freshly-created lock: EVERY exit
    // path that does not hand ownership to a returned session must remove
    // it exactly once. released tracks whether an early return cleaned up;
    // a throw falls through to the same cleanup before rethrowing.
    let released = false;
    const releaseOwnedLock = async (): Promise<void> => {
      if (!released) {
        released = true;
        await rm(lock, { recursive: true, force: true });
      }
    };
    try {
      let current: Awaited<ReturnType<LocalTaskRepository["readAll"]>>;
      try {
        current = await this.readAll();
      } catch (error) {
        await releaseOwnedLock();
        throw error;
      }
      if (current.revision !== expectedRevision) {
        await releaseOwnedLock();
        return {
          kind: "conflict",
          expectedRevision,
          actualRevision: current.revision,
        };
      }
      const sessionId = crypto.randomUUID();
      const session = new LocalTaskBatchSession(
        this,
        lock,
        sessionId,
        async () => {
          released = true;
        },
      );
      await session.journalReady();
      return { kind: "locked", session };
    } catch (error) {
      await releaseOwnedLock();
      throw error;
    }
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
      const payload = `${JSON.stringify(request.task)}\n`;
      const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, payload, "utf8");
      await rename(temporary, destination);
      // QCLI-122: derive the post-write revision by splicing the written
      // record into the locked snapshot instead of rescanning every stored
      // record; fall back to an authoritative read whenever the upsert is
      // not a plain in-place replacement of an existing active row.
      let revision: string;
      try {
        const spliced = this.splicedSnapshotAfterUpsert(current, payload);
        revision = this.revision(spliced.snapshot);
      } catch (error) {
        if (
          error instanceof RecordValidationError &&
          (error as Error).message === "task_upsert_target_absent"
        ) {
          revision = (await this.readAll()).revision;
        } else {
          throw error;
        }
      }
      return {
        kind: "success" as const,
        revision,
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
      request = this.validateLifecycleRequest(request);
      await this.recoverLifecycle();
      const current = await this.readAll();
      if (current.revision !== request.expectedRevision)
        return {
          kind: "conflict" as const,
          expectedRevision: request.expectedRevision,
          actualRevision: current.revision,
          operationId: request.operationId,
          ownedPaths: request.ownedPaths,
        };
      await this.writeLifecycleRecord(this.lifecycleJournalPath(), request);
      await this.applyLifecycle(request);
      await rm(this.lifecycleJournalPath(), { force: true });
      return {
        kind: "success" as const,
        revision: (await this.readAll()).revision,
      };
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }

  async applyTransaction(request: MigrationTransactionRequest) {
    if (!request.operationId.trim())
      throw new RecordValidationError("operation_id_required");
    await mkdir(this.directory, { recursive: true });
    const lock = join(this.directory, ".write.lock");
    if (!(await this.acquireLock(lock))) {
      const current = await this.readAll();
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedTaskRevision,
        actualRevision: current.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    }
    try {
      await this.recoverLifecycle();
      const current = await this.readAll();
      if (current.revision !== request.expectedTaskRevision)
        return {
          kind: "conflict" as const,
          expectedRevision: request.expectedTaskRevision,
          actualRevision: current.revision,
          operationId: request.operationId,
          ownedPaths: request.ownedPaths,
        };

      // Fail loud instead of silently skipping the planning revision guard:
      // a transaction that claims cross-store atomicity must be able to
      // verify and compensate both stores.
      const planning = this.planningRepository;
      if (!planning)
        throw new RecordValidationError("planning_repository_unavailable");
      const planningSnapshot = await planning.read();
      if (planningSnapshot.revision !== request.expectedPlanningRevision)
        return {
          kind: "conflict" as const,
          expectedRevision: request.expectedPlanningRevision,
          actualRevision: planningSnapshot.revision,
          operationId: request.operationId,
          ownedPaths: request.ownedPaths,
        };

      const taskRecords = current.taskRecords ?? [];
      const byId = new Map<
        string,
        { task: TaskState; location: TaskLocation }
      >();
      for (const record of taskRecords) byId.set(record.task.id, record);

      const nextRecords = new Map(byId);
      for (const change of request.taskChanges) {
        if ("remove" in change) {
          nextRecords.delete(change.taskId);
        } else {
          nextRecords.set(change.task.id, {
            task: change.task,
            location: change.location,
          });
        }
      }

      const nextTasks = Array.from(nextRecords.values()).map((r) => r.task);
      const nextMilestones = request.milestones.map(milestone);
      const nextDecisions = request.decisions.map(decision);

      validateMilestoneClosure(nextTasks, nextMilestones);

      const nextRecordsArray = Array.from(nextRecords.values());
      const nextSnapshot = {
        taskRecords: nextRecordsArray,
        drafts: current.drafts ?? [],
      };
      if (
        new Set(nextSnapshot.taskRecords.map((r) => r.task.id)).size !==
        nextSnapshot.taskRecords.length
      )
        throw new RecordConflictError("task_lifecycle_duplicate_identity");

      const nextTaskRevision = this.revision(nextSnapshot);

      const removedTaskIds = new Set(
        Array.from(byId.values())
          .filter((record) => !nextRecords.has(record.task.id))
          .map((record) => record.task.id),
      );
      const addedTaskIds = new Set(
        nextRecordsArray
          .filter((record) => !byId.has(record.task.id))
          .map((record) => record.task.id),
      );

      for (const record of nextRecordsArray) {
        await this.writeLifecycleRecord(
          this.taskPath(record.task.id, record.location),
          record.task,
        );
      }
      for (const record of Array.from(byId.values())) {
        if (!nextRecords.has(record.task.id)) {
          await rm(this.taskPath(record.task.id, record.location), {
            force: true,
          });
        }
      }
      {
        const planningResult = await planning.write({
          expectedRevision: request.expectedPlanningRevision,
          milestones: nextMilestones,
          decisions: nextDecisions,
          operationId: request.operationId,
        });
        if (planningResult.kind === "conflict") {
          // Compensate every touched record, not only removals: updated
          // in-place tasks must return to their pre-transaction content so a
          // failed planning write never leaves half-mutated task state.
          for (const record of Array.from(byId.values())) {
            await this.writeLifecycleRecord(
              this.taskPath(record.task.id, record.location),
              record.task,
            );
          }
          for (const record of nextRecordsArray) {
            if (!byId.has(record.task.id)) {
              await rm(this.taskPath(record.task.id, record.location), {
                force: true,
              });
            }
          }
          return {
            kind: "conflict" as const,
            expectedRevision: request.expectedPlanningRevision,
            actualRevision: planningSnapshot.revision,
            operationId: request.operationId,
            ownedPaths: request.ownedPaths,
          };
        }
      }

      return {
        kind: "success" as const,
        revision: nextTaskRevision,
        operationId: request.operationId,
        taskIds: Array.from(addedTaskIds),
        removedTaskIds: Array.from(removedTaskIds),
        milestoneIds: nextMilestones.map((m) => m.id),
      };
    } finally {
      await rm(lock, { recursive: true, force: true });
    }
  }
}

/** Public session contract consumed by the typed BatchTaskRepository port. */
export interface TaskBatchSession {
  /** Persists one record atomically, identical to a single-op write payload. */
  writeRecord(task: TaskState, operationId?: string): Promise<void>;
  /** Appends one journaled, already-persisted operation for crash proofing. */
  markApplied(operationId: string, taskId: string): Promise<void>;
  /** Removes the journal then releases the owned lock; idempotent. */
  finish(): Promise<void>;
}

class LocalTaskBatchSession implements TaskBatchSession {
  private finished = false;
  constructor(
    private readonly repository: LocalTaskRepository,
    private readonly lock: string,
    readonly sessionId: string,
    private readonly onReleased?: () => Promise<void>,
  ) {
    this.startJournalWrite = appendFile(
      this.repository.batchJournalPath(),
      `${JSON.stringify({
        schemaVersion: 1,
        sessionId,
        pid: process.pid,
        at: new Date().toISOString(),
      })}\n`,
      "utf8",
    );
  }

  /** Resolves once the session-START journal line is durably appended. */
  async journalReady(): Promise<void> {
    await this.startJournalWrite;
  }

  private readonly startJournalWrite: Promise<void>;

  async writeRecord(task: TaskState): Promise<void> {
    await this.repository.writeActiveRecord(task);
  }

  /** Synchronous durable journal append (rename-before-append window aware). */
  async markApplied(operationId: string, taskId: string): Promise<void> {
    if (this.finished) return;
    await this.appendJournal(operationId, taskId);
  }

  private async appendJournal(
    operationId?: string,
    taskId?: string,
  ): Promise<void> {
    const path = this.repository.batchJournalPath();
    const line = `${JSON.stringify({
      schemaVersion: 1,
      sessionId: this.sessionId,
      pid: process.pid,
      at: new Date().toISOString(),
      ...(operationId ? { operationId } : {}),
      ...(taskId ? { taskId } : {}),
    })}\n`;
    await appendFile(path, line, "utf8");
  }

  async finish(): Promise<void> {
    if (this.finished) return;
    this.finished = true;
    // Journal first: once gone, a lingering lock can only be foreign work in
    // flight, never our own crashed session.
    await rm(this.repository.batchJournalPath(), { force: true });
    await rm(this.lock, { recursive: true, force: true });
    await this.onReleased?.();
  }
}
