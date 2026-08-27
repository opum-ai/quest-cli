import { RecordValidationError } from "../../domain/records.ts";
import {
  canonicalizeTaskLinks,
  closeMilestoneReference,
  createDraft,
  createTask,
  createTaskLinkSession,
  type DraftInput,
  type DraftLocation,
  type DraftState,
  defaultLifecyclePolicy,
  evaluateReadySet,
  findTask,
  type LifecyclePolicy,
  type ReadySet,
  resolveConfiguredStatus,
  searchTasks,
  type TaskInput,
  type TaskLocation,
  type TaskState,
  type TaskStatus,
  taskState,
  transitionTask,
} from "../../domain/tasks/tasks.ts";
import type { MigrationTransactionRepository } from "../../ports/backlog-import.ts";
import type { PlanningRepository } from "../../ports/planning.ts";
import { type EditPatchVocabulary, foldEditPatch } from "./edit-patch.ts";

/** The authoritative store is Git-backed in production; query methods deliberately have no write capability. */
export interface TaskReader {
  readAll(): Promise<TaskReadSnapshot>;
}
export interface TaskReadSnapshot {
  readonly revision: string;
  readonly tasks: readonly TaskState[];
  /** All task records, including retention locations. Omitted by legacy readers. */
  readonly taskRecords?: readonly LocatedTask[];
  readonly drafts?: readonly LocatedDraft[];
}
export interface LocatedTask {
  readonly task: TaskState;
  readonly location: TaskLocation;
}
export interface LocatedDraft {
  readonly draft: DraftState;
  readonly location: DraftLocation;
}
export interface TaskWriteRequest {
  readonly task: TaskState;
  readonly expectedRevision: string;
  readonly operationId: string;
  /** Predeclared authored paths passed through to QCLI-79's owned Git operation. */
  readonly ownedPaths: readonly string[];
}
export interface TaskWriteSuccess {
  readonly kind: "success";
  readonly revision: string;
}
export interface TaskWriteConflict {
  readonly kind: "conflict";
  readonly expectedRevision: string;
  readonly actualRevision: string;
  readonly operationId: string;
  readonly ownedPaths: readonly string[];
}
export type TaskWriteResult = TaskWriteSuccess | TaskWriteConflict;
export interface TaskWriter {
  write(request: TaskWriteRequest): Promise<TaskWriteResult>;
}
export interface TaskRepository extends TaskReader, TaskWriter {}
export interface LifecycleWriteRequest {
  readonly expectedRevision: string;
  readonly operationId: string;
  readonly ownedPaths: readonly string[];
  readonly taskChanges: readonly (
    | { readonly task: TaskState; readonly location: TaskLocation }
    | {
        readonly taskId: string;
        readonly location: TaskLocation;
        readonly remove: true;
      }
  )[];
  readonly draftChanges: readonly (
    | { readonly draft: DraftState; readonly location: DraftLocation }
    | {
        readonly draftId: string;
        readonly location: DraftLocation;
        readonly remove: true;
      }
  )[];
}
export interface LifecycleTaskRepository extends TaskRepository {
  writeLifecycle(request: LifecycleWriteRequest): Promise<TaskWriteResult>;
}

/** Typed capability port for locked multi-operation sessions (QCLI-122). */
export interface BatchTaskRepository extends LifecycleTaskRepository {
  beginTaskBatch(expectedRevision: string): Promise<
    | {
        readonly kind: "locked";
        readonly session: {
          writeRecord(
            task: import("../../domain/tasks/tasks.ts").TaskState,
            operationId?: string,
          ): Promise<void>;
          markApplied(operationId: string, taskId: string): Promise<void>;
          finish(): Promise<void>;
        };
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
    | { readonly kind: "unrecoverable_lock"; readonly message: string }
  >;
}
export type TaskMutationResult =
  | {
      readonly kind: "success";
      readonly task: TaskState;
      readonly revision: string;
    }
  | TaskWriteConflict;

/** Application-level default so CLI composition never imports the domain layer directly. */
export const defaultTaskLifecyclePolicy = defaultLifecyclePolicy;

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly lifecyclePolicy: LifecyclePolicy = defaultLifecyclePolicy,
    private readonly ownedPathFor = (task: TaskState) =>
      `.quest/tasks/${task.id}.md`,
    private readonly planning?: PlanningRepository,
  ) {}

  /**
   * Persists a task whose milestone reference changed with atomic forward/back
   * milestone closure: the planning revision is verified and both stores are
   * written in one revision-guarded transaction.
   */
  private async persistWithMilestoneClosure(
    persisted: TaskState,
    previousMilestoneId: string | undefined,
    snapshot: TaskReadSnapshot,
    operationId: string,
    location: TaskLocation,
  ): Promise<TaskMutationResult> {
    const transactional = this.repository as unknown as
      | MigrationTransactionRepository
      | undefined;
    if (
      !transactional ||
      typeof transactional.applyTransaction !== "function" ||
      !this.planning
    )
      throw new RecordValidationError("planning_repository_unavailable");
    const planningSnapshot = await this.planning.read();
    const milestones = [...planningSnapshot.milestones];
    const index =
      persisted.milestoneId !== undefined
        ? milestones.findIndex((m) => m.id === persisted.milestoneId)
        : -1;
    if (persisted.milestoneId !== undefined && index < 0)
      throw new RecordValidationError("milestone_reference_dangling");
    let closedTask = persisted;
    // Close from the pre-change state so closeMilestoneReference observes the
    // actual transition instead of mistaking a fresh link for drift.
    const baseTask =
      persisted.milestoneId !== previousMilestoneId
        ? { ...persisted, milestoneId: previousMilestoneId }
        : persisted;
    const movingFromPrevious =
      previousMilestoneId !== undefined &&
      previousMilestoneId !== persisted.milestoneId;
    if (movingFromPrevious) {
      // Unlink the previous milestone first so a move is one atomic re-close.
      const previousIndex = milestones.findIndex(
        (m) => m.id === previousMilestoneId,
      );
      if (previousIndex >= 0) {
        const unlinked = closeMilestoneReference(
          baseTask,
          milestones[previousIndex],
          false,
        );
        closedTask = unlinked.task;
        milestones[previousIndex] = {
          ...milestones[previousIndex],
          taskIds: unlinked.milestone.taskIds,
        };
      }
    }
    if (
      persisted.milestoneId !== undefined &&
      persisted.milestoneId !== previousMilestoneId
    ) {
      const closed = closeMilestoneReference(
        closedTask.milestoneId === persisted.milestoneId
          ? baseTask
          : closedTask,
        milestones[Math.max(index, 0)],
        true,
      );
      closedTask = closed.task;
      milestones[Math.max(index, 0)] = {
        ...milestones[Math.max(index, 0)],
        taskIds: closed.milestone.taskIds,
      };
    }
    const result = await transactional.applyTransaction({
      expectedTaskRevision: snapshot.revision,
      expectedPlanningRevision: planningSnapshot.revision,
      operationId,
      ownedPaths: [this.ownedPathFor(closedTask)],
      taskChanges: [{ task: closedTask, location }],
      milestones,
      decisions: planningSnapshot.decisions,
    });
    return result.kind === "success"
      ? { kind: "success", task: closedTask, revision: result.revision }
      : {
          kind: "conflict",
          expectedRevision: result.expectedRevision,
          actualRevision: result.actualRevision,
          operationId: result.operationId,
          ownedPaths: result.ownedPaths,
        };
  }
  async create(
    id: string,
    input: TaskInput,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const tasks = snapshot.tasks;
    const task = createTask(id, input, this.lifecycle);
    // Validation before persistence makes bad references and alias conflicts non-mutating.
    const canonical = canonicalizeTaskLinks([...tasks, task]);
    const persisted = canonical.at(-1);
    if (!persisted) throw new Error("task_canonicalization_failed");
    if (
      this.taskRecords(snapshot).some(
        (existing) => existing.task.id === task.id,
      )
    )
      throw new Error("task_already_exists");
    if (persisted.milestoneId !== undefined)
      return this.persistWithMilestoneClosure(
        persisted,
        undefined,
        snapshot,
        operationId,
        "tasks",
      );
    const result = await this.repository.write({
      task: persisted,
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [this.ownedPathFor(persisted)],
    });
    return result.kind === "success"
      ? { kind: "success", task: persisted, revision: result.revision }
      : result;
  }
  async list(): Promise<readonly TaskState[]> {
    return [...(await this.repository.readAll()).tasks].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
  /** Lists every canonical task, including retained lifecycle records. */
  async listIncludingRetained(): Promise<readonly TaskState[]> {
    const snapshot = await this.repository.readAll();
    return this.taskRecords(snapshot)
      .map((record) => record.task)
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  /** The configured lifecycle policy; status-flow reports it, never a hardcoded copy. */
  get lifecycle(): LifecyclePolicy {
    return this.lifecyclePolicy;
  }
  private lifecycleRepository(): LifecycleTaskRepository {
    if (!("writeLifecycle" in this.repository))
      throw new Error("task_lifecycle_repository_required");
    return this.repository as LifecycleTaskRepository;
  }
  private taskRecords(snapshot: TaskReadSnapshot): readonly LocatedTask[] {
    return (
      snapshot.taskRecords ??
      snapshot.tasks.map((task) => ({ task, location: "tasks" as const }))
    );
  }
  private async moveTask(
    reference: string,
    destination: TaskLocation,
    operationId: string,
    transform: (task: TaskState) => TaskState = (task) => task,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const records = this.taskRecords(snapshot);
    const selected = findTask(
      records.map((record) => record.task),
      reference,
    );
    const current = records.find((record) => record.task.id === selected.id);
    if (!current) throw new RecordValidationError("task_not_found");
    const task = transform(current.task);
    if (current.location === destination)
      throw new RecordValidationError("task_lifecycle_already_at_destination");
    const result = await this.lifecycleRepository().writeLifecycle({
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [
        this.ownedPathForLocation(current.task.id, current.location),
        this.ownedPathForLocation(task.id, destination),
      ],
      taskChanges: [
        { taskId: current.task.id, location: current.location, remove: true },
        { task, location: destination },
      ],
      draftChanges: [],
    });
    return result.kind === "success"
      ? { kind: "success", task, revision: result.revision }
      : result;
  }
  private ownedPathForLocation(id: string, location: TaskLocation): string {
    return `.quest/${location}/${id}.json`;
  }
  /** Completes the next legal terminal transition and retains the record separately. */
  async complete(
    reference: string,
    operationId: string,
  ): Promise<TaskMutationResult> {
    return this.moveTask(reference, "completed", operationId, (task) => {
      const terminal = this.lifecycle.terminalStatuses[0];
      if (!terminal)
        throw new RecordValidationError(
          "Lifecycle terminal status is not configured.",
        );
      return transitionTask(task, terminal, this.lifecycle);
    });
  }
  async archive(
    reference: string,
    operationId: string,
  ): Promise<TaskMutationResult> {
    return this.moveTask(reference, "archive/tasks", operationId);
  }
  async demote(
    reference: string,
    operationId: string,
  ): Promise<TaskMutationResult> {
    return this.moveTask(reference, "tasks", operationId, (task) =>
      taskState({
        ...task,
        status: this.lifecycle.statuses[0] ?? task.status,
        claim: undefined,
      }),
    );
  }
  async createDraft(
    id: string,
    input: DraftInput,
    operationId: string,
  ): Promise<
    | {
        readonly kind: "success";
        readonly draft: DraftState;
        readonly revision: string;
      }
    | TaskWriteConflict
  > {
    const snapshot = await this.repository.readAll();
    const draft = createDraft(id, input);
    if ((snapshot.drafts ?? []).some((record) => record.draft.id === draft.id))
      throw new RecordValidationError("draft_already_exists");
    const result = await this.lifecycleRepository().writeLifecycle({
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [`.quest/drafts/${draft.id}.json`],
      taskChanges: [],
      draftChanges: [{ draft, location: "drafts" }],
    });
    return result.kind === "success"
      ? { kind: "success", draft, revision: result.revision }
      : result;
  }
  async listDrafts(includeArchived = false): Promise<readonly LocatedDraft[]> {
    return (
      (await this.repository.readAll()).drafts
        ?.filter((record) => includeArchived || record.location === "drafts")
        .sort((a, b) => a.draft.id.localeCompare(b.draft.id)) ?? []
    );
  }
  async viewDraft(id: string): Promise<LocatedDraft> {
    const record = (await this.repository.readAll()).drafts?.find(
      (entry) => entry.draft.id === id,
    );
    if (!record) throw new RecordValidationError("draft_not_found");
    return record;
  }
  async archiveDraft(
    id: string,
    operationId: string,
  ): Promise<
    | {
        readonly kind: "success";
        readonly draft: DraftState;
        readonly revision: string;
      }
    | TaskWriteConflict
  > {
    const snapshot = await this.repository.readAll();
    const current = snapshot.drafts?.find((record) => record.draft.id === id);
    if (!current) throw new RecordValidationError("draft_not_found");
    if (current.location === "archive/drafts")
      throw new RecordValidationError("draft_lifecycle_already_at_destination");
    const result = await this.lifecycleRepository().writeLifecycle({
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [
        `.quest/drafts/${id}.json`,
        `.quest/archive/drafts/${id}.json`,
      ],
      taskChanges: [],
      draftChanges: [
        { draftId: id, location: current.location, remove: true },
        { draft: current.draft, location: "archive/drafts" },
      ],
    });
    return result.kind === "success"
      ? { kind: "success", draft: current.draft, revision: result.revision }
      : result;
  }
  async promoteDraft(
    id: string,
    taskId: string,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const current = snapshot.drafts?.find((record) => record.draft.id === id);
    if (!current) throw new RecordValidationError("draft_not_found");
    const allTasks = this.taskRecords(snapshot);
    if (allTasks.some((record) => record.task.id === taskId))
      throw new RecordValidationError("task_already_exists");
    const task = createTask(
      taskId,
      {
        title: current.draft.title,
        description: current.draft.description,
        labels: current.draft.labels,
        documentation: current.draft.documentation,
        source: current.draft.source,
      },
      this.lifecycle,
    );
    const result = await this.lifecycleRepository().writeLifecycle({
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [
        `.quest/${current.location}/${id}.json`,
        `.quest/tasks/${task.id}.json`,
      ],
      taskChanges: [{ task, location: "tasks" }],
      draftChanges: [{ draftId: id, location: current.location, remove: true }],
    });
    return result.kind === "success"
      ? { kind: "success", task, revision: result.revision }
      : result;
  }
  async view(reference: string): Promise<TaskState> {
    const snapshot = await this.repository.readAll();
    return findTask(
      this.taskRecords(snapshot).map((record) => record.task),
      reference,
    );
  }

  /**
   * Resolves the mutable task and its authoritative snapshot in one read
   * (QCLI-122). Pair with {@link editOn} in the CLI composition root so one
   * public mutation performs exactly one authoritative collection read.
   */
  async prepareMutation(
    reference: string,
  ): Promise<{ snapshot: TaskReadSnapshot; task: TaskState }> {
    const snapshot = await this.repository.readAll();
    return {
      snapshot,
      task: findTask(
        this.taskRecords(snapshot).map((r) => r.task),
        reference,
      ),
    };
  }
  async search(query: string): Promise<readonly TaskState[]> {
    const snapshot = await this.repository.readAll();
    return searchTasks(
      this.taskRecords(snapshot).map((record) => record.task),
      query,
    );
  }
  async edit(
    reference: string,
    patch: Partial<Omit<TaskState, "id" | "gates" | "gateEvents">>,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    return this.editOn(snapshot, reference, patch, operationId);
  }

  /**
   * Single-snapshot variant of {@link edit} for the CLI composition root
   * (QCLI-122): one public task mutation reads the authoritative collection
   * exactly once instead of once per service call. Behavior, validation,
   * and result envelopes are identical to {@link edit}.
   */
  async editOn(
    snapshot: TaskReadSnapshot,
    reference: string,
    patch: Partial<Omit<TaskState, "id" | "gates" | "gateEvents">>,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const tasks = snapshot.tasks;
    const task = findTask(tasks, reference);
    const unsafe = patch as Partial<TaskState>;
    if ("gates" in unsafe || "gateEvents" in unsafe)
      throw new RecordValidationError("task_gate_events_managed");
    const authorizedPatch = unsafe;
    if (
      authorizedPatch.status !== undefined &&
      authorizedPatch.status !== task.status
    )
      transitionTask(task, authorizedPatch.status, this.lifecycle);
    const next = taskState({ ...task, ...authorizedPatch, id: task.id });
    const canonical = canonicalizeTaskLinks(
      tasks.map((item) => (item.id === task.id ? next : item)),
    );
    const persisted = findTask(canonical, task.id);
    if (persisted.milestoneId !== task.milestoneId) {
      const located = this.taskRecords(snapshot).find(
        (record) => record.task.id === task.id,
      );
      return this.persistWithMilestoneClosure(
        persisted,
        task.milestoneId,
        snapshot,
        operationId,
        located?.location ?? "tasks",
      );
    }
    const result = await this.repository.write({
      task: persisted,
      expectedRevision: snapshot.revision,
      operationId,
      ownedPaths: [this.ownedPathFor(persisted)],
    });
    return result.kind === "success"
      ? { kind: "success", task: persisted, revision: result.revision }
      : result;
  }
  async transition(
    reference: string,
    status: TaskStatus,
    operationId: string,
  ): Promise<TaskMutationResult> {
    return this.edit(reference, { status }, operationId);
  }

  /**
   * QCLI-122 batch mutation: applies many distinct domain-patch operations
   * inside one locked repository session so large stores pay one entry CAS
   * and one final authoritative revision instead of per-operation rescans.
   * Each applied record is persisted atomically exactly like a single edit;
   * per-item validation failures are recorded and do not abort the batch;
   * milestone-transition items execute through the ordinary single-edit path
   * after the session releases (planning closure keeps its own CAS), in the
   * order submitted. The returned revision is the authoritative terminal
   * store revision.
   */
  /**
   * QCLI-122 batch mutation (corrected under FMC 05fe52e8):
   * - results preserve exact input order, exactly one per submitted item;
   * - milestone-transition items are rejected AT THEIR INDEX with a
   *   documented error instead of being deferred after later items;
   * - the returned revision is always the true terminal authoritative
   *   revision after every durable write completed;
   * - empty input returns the authoritative revision (never fabricated);
   * - each applied record is individually atomic; crash recovery relies on
   *   the session journal proof implemented by {@link LocalTaskRepository}.
   */
  async editBatch(
    items: readonly {
      readonly reference: string;
      readonly patch?: Partial<
        Omit<TaskState, "id" | "gates" | "gateEvents"> & EditPatchVocabulary
      >;
      readonly operationId?: string;
    }[],
  ): Promise<
    | {
        readonly kind: "success";
        readonly items: readonly (
          | {
              readonly kind: "updated";
              readonly reference: string;
              readonly operationId: string;
              readonly task: TaskState;
            }
          | {
              readonly kind: "error";
              readonly reference: string;
              readonly operationId: string;
              readonly message: string;
            }
        )[];
        readonly revision: string;
      }
    | TaskWriteConflict
  > {
    if (!("beginTaskBatch" in this.repository)) {
      throw new RecordValidationError("batch_repository_unavailable");
    }
    const batchRepository = this.repository as unknown as BatchTaskRepository;

    // Fold everything against the entry snapshot first so malformed or
    // unsupported items can be attributed before any durable write.
    const initial = await this.repository.readAll();
    const folded: (
      | {
          readonly ok: true;
          readonly reference: string;
          readonly operationId: string;
          readonly next: TaskState;
        }
      | { readonly ok: false; readonly message: string }
    )[] = [];
    const seenOperationIds = new Set<string>();
    let linkSession: ReturnType<typeof createTaskLinkSession> | undefined;

    const resolvedItems = items.map((item, index) => ({
      item,
      operationId: item.operationId ?? `batch-item-${index + 1}`,
    }));
    for (const [index, { operationId }] of resolvedItems.entries()) {
      if (seenOperationIds.has(operationId)) {
        return Promise.reject(
          new RecordValidationError(
            `batch_duplicate_operation_id_at_line_${index + 1}`,
          ),
        );
      }
      seenOperationIds.add(operationId);
    }

    // One open-transaction simulation across the entry snapshot keeps
    // validation identical to sequential edits while nothing is persisted.
    linkSession = createTaskLinkSession(initial.tasks);
    for (const [index, { item, operationId }] of resolvedItems.entries()) {
      void index;
      try {
        const current = findTask(initial.tasks, item.reference);
        const unsafe = foldEditPatch(
          current,
          (item.patch ?? {}) as EditPatchVocabulary,
          (status) => this.resolveStatus(status),
        ) as Partial<TaskState>;
        if ("gates" in unsafe || "gateEvents" in unsafe)
          throw new RecordValidationError("task_gate_events_managed");
        const authorizedPatch = unsafe;
        if (
          authorizedPatch.status !== undefined &&
          authorizedPatch.status !== current.status
        )
          transitionTask(current, authorizedPatch.status, this.lifecycle);
        const rawNext = taskState({
          ...current,
          ...authorizedPatch,
          id: current.id,
        });
        if (rawNext.milestoneId !== current.milestoneId)
          throw new RecordValidationError(
            "milestone_transition_requires_single_edit",
          );
        const persisted = linkSession.apply(rawNext);
        folded.push({
          ok: true,
          reference: item.reference,
          operationId,
          next: persisted,
        });
      } catch (error) {
        folded.push({
          ok: false,
          message:
            error instanceof Error ? error.message : "unknown_batch_item_error",
        });
        void operationId;
      }
    }

    const opened = await batchRepository.beginTaskBatch(initial.revision);
    if (opened.kind === "conflict")
      return {
        kind: "conflict",
        expectedRevision: opened.expectedRevision,
        actualRevision: opened.actualRevision,
        operationId: "task-edit-batch",
        ownedPaths: [],
      };
    if (opened.kind === "unrecoverable_lock") {
      const everyItemError = await this.editBatch(
        items.map((item) => ({
          ...item,
          operationId: item.operationId,
        })),
      );
      return everyItemError;
    }
    const session = opened.session;
    try {
      if (opened.recovered)
        console.error(
          `[quest] recovered ${opened.recovered.appliedOperationIds.length} journaled operations from crashed batch ${opened.recovered.sessionId}`,
        );
      // CAS proved the store unchanged since our entry snapshot; the folded
      // sequence replays deterministically over that state.
      const workingRowsById = new Map(
        initial.tasks.map((task) => [task.id, task]),
      );
      const slotsById = new Map<string, number>(
        initial.tasks.map((task, index) => [task.id, index]),
      );
      const workingTasks = [...initial.tasks];
      const finalResults: (
        | {
            readonly kind: "updated";
            readonly reference: string;
            readonly operationId: string;
            readonly task: TaskState;
          }
        | {
            readonly kind: "error";
            readonly reference: string;
            readonly operationId: string;
            readonly message: string;
          }
      )[] = [];
      const duplicateGuard = new Map(
        folded.map(() => [Math.random(), Math.random()]),
      );
      void duplicateGuard;
      for (let index = 0; index < folded.length; index += 1) {
        const outcome = folded[index];
        const operationId = resolvedItems[index].operationId;
        const reference = items[index]?.reference ?? "";
        if (!outcome.ok || outcome.next === undefined) {
          finalResults.push({
            kind: "error",
            reference,
            operationId,
            message: outcome.ok === false ? outcome.message : "",
          });
          continue;
        }
        try {
          await session.writeRecord(outcome.next);
          await session.markApplied(operationId, outcome.next.id);
          if (slotsById.has(outcome.next.id)) {
            workingTasks[slotsById.get(outcome.next.id)!] = outcome.next;
            workingRowsById.set(outcome.next.id, outcome.next);
          }
          finalResults.push({
            kind: "updated",
            reference,
            operationId,
            task: outcome.next,
          });
        } catch (error) {
          finalResults.push({
            kind: "error",
            reference,
            operationId,
            message:
              error instanceof Error ? error.message : "durable_write_failed",
          });
        }
      }
      await session.finish();
      const terminal = await this.repository.readAll();
      return {
        kind: "success",
        items: finalResults,
        revision: terminal.revision,
      };
    } finally {
      await session.finish();
    }
  }

  resolveStatus(status: string): TaskStatus {
    return resolveConfiguredStatus(status, this.lifecycle);
  }
  async ready(now: Date): Promise<ReadySet> {
    return evaluateReadySet(
      (await this.repository.readAll()).tasks,
      now,
      this.lifecycle,
    );
  }
}
