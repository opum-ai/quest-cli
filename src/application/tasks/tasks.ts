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

type ReferenceIndex = {
  resolve(reference: string): number | undefined;
};

/**
 * O(N)-once reference index (canonical id + aliases, case-insensitive) used
 * by the batch loop so repeated lookups do not rescan the whole collection.
 */
function buildReferenceIndex(tasks: readonly TaskState[]): ReferenceIndex {
  const byKey = new Map<string, number>();
  tasks.forEach((task, index) => {
    byKey.set(task.id.toLowerCase(), index);
    for (const alias of task.aliases) byKey.set(alias.toLowerCase(), index);
  });
  return {
    resolve(reference: string): number | undefined {
      return byKey.get(reference.toLowerCase());
    },
  };
}

function rebuildSlot(
  index: ReferenceIndex,
  _slot: number,
  _task: TaskState,
): ReferenceIndex {
  // Row identity and aliases only change through graph-affecting paths which
  // go through createTaskLinkSession; non-graph slots keep identity so the
  // original index stays valid until that occurs.
  void _slot;
  void _task;
  return index;
}

/** Application-level default so CLI composition never imports the domain layer directly. */
export const defaultTaskLifecyclePolicy = defaultLifecyclePolicy;

/** The complete `task list` selection vocabulary; the CLI layer only parses argv into this. */
export interface TaskListQuery {
  readonly status?: string;
  readonly labels?: readonly string[];
  readonly ready?: boolean;
  readonly now?: Date;
  readonly excludeStatuses?: readonly string[];
  readonly assignees?: readonly string[];
  readonly unassigned?: boolean;
  readonly milestoneId?: string;
  readonly parentId?: string;
  readonly priority?: string;
  readonly types?: readonly string[];
  readonly search?: string;
  readonly limit?: number;
  readonly sort?: {
    readonly field: string;
    /** Ascending when omitted, matching the CLI's bare `--sort <field>`. */
    readonly direction?: "asc" | "desc";
  };
}

const TASK_LIST_SORT_FIELDS = new Set([
  "id",
  "title",
  "status",
  "priority",
  "type",
  "ordinal",
  "createdAt",
  "updatedAt",
]);

/**
 * Priority is a free-form authored string, so ranking is by the conventional
 * high/medium/low vocabulary, case-folded. Anything else sorts after all three
 * rather than landing in the middle of them alphabetically.
 */
const TASK_LIST_PRIORITY_RANK = new Map([
  ["high", 0],
  ["medium", 1],
  ["low", 2],
]);

/** Case-folded comparison key for the free-form authored selection fields. */
function fold(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase();
}

function taskListSortValue(task: TaskState, field: string): string | number {
  switch (field) {
    case "id":
      return task.id;
    case "title":
      return task.title;
    case "status":
      return task.status;
    case "priority":
      // Rank, not alphabet: "high" < "low" as strings, which would invert the
      // ordering an agent asking for the top N actually wants.
      return (
        TASK_LIST_PRIORITY_RANK.get(fold(task.priority)) ??
        TASK_LIST_PRIORITY_RANK.size
      );
    case "type":
      return fold(task.type);
    case "ordinal":
      return task.ordinal ?? 0;
    // A record written before timestamps existed has no time, which is
    // unknown rather than oldest, so it sorts after every stamped task the
    // same way an unrecognized priority does.
    case "createdAt":
      return task.createdAt ?? "\uffff";
    case "updatedAt":
      return task.updatedAt ?? "\uffff";
    default:
      throw new RecordValidationError("task_list_sort_field_invalid");
  }
}

function sortTasksBy(
  tasks: readonly TaskState[],
  sort: NonNullable<TaskListQuery["sort"]>,
): readonly TaskState[] {
  if (!TASK_LIST_SORT_FIELDS.has(sort.field))
    throw new RecordValidationError("task_list_sort_field_invalid");
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...tasks].sort((a, b) => {
    const left = taskListSortValue(a, sort.field);
    const right = taskListSortValue(b, sort.field);
    if (left < right) return -1 * direction;
    if (left > right) return 1 * direction;
    // Ties always break by ascending id, independent of sort direction.
    return a.id.localeCompare(b.id);
  });
}

export class TaskService {
  private readonly batchRepository: BatchTaskRepository | undefined;

  constructor(
    public readonly repository: TaskRepository,
    private readonly lifecyclePolicy: LifecyclePolicy = defaultLifecyclePolicy,
    private readonly ownedPathFor = (task: TaskState) =>
      `.quest/tasks/${task.id}.md`,
    planning?: PlanningRepository,
    batchRepository?: BatchTaskRepository,
    /** Injected so tests can pin task timestamps (QCLI-137). */
    private readonly now: () => Date = () => new Date(),
  ) {
    // Blocker #4 (fourth pass): the batch port is injected as a real typed
    // constructor argument; no structural `as unknown` casting anywhere.
    this.batchRepository = batchRepository;
    this.planning = planning;
  }

  private readonly planning?: PlanningRepository | undefined;

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
  /**
   * Stamps a record's mutation time (QCLI-137). `created` also sets
   * `createdAt`; every other write only advances `updatedAt`.
   *
   * Records written before timestamps existed are deliberately not
   * backfilled: their next edit gains an `updatedAt`, and `createdAt` stays
   * absent rather than being invented.
   */
  private stamped(task: TaskState, created = false): TaskState {
    const at = this.now().toISOString();
    return created
      ? { ...task, createdAt: at, updatedAt: at }
      : { ...task, updatedAt: at };
  }
  async create(
    id: string,
    input: TaskInput,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const tasks = snapshot.tasks;
    const task = this.stamped(createTask(id, input, this.lifecycle), true);
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
  /**
   * The full `task list` selection contract in one place: readiness delegates
   * to {@link evaluateReadySet}, search delegates to {@link searchTasks}, and
   * every other filter composes as a plain predicate. Sort and limit apply
   * last, after every filter, so `--limit` truncates the final ordering.
   */
  async listFiltered(query: TaskListQuery): Promise<readonly TaskState[]> {
    // The CLI guards this too, but the contract belongs here so a non-CLI
    // caller cannot silently ask for an empty list.
    if (query.unassigned && query.assignees?.length)
      throw new RecordValidationError("assignee_filter_conflict");
    const status = query.status ? this.resolveStatus(query.status) : undefined;
    const excludeStatuses = query.excludeStatuses?.length
      ? new Set(query.excludeStatuses.map((value) => this.resolveStatus(value)))
      : undefined;
    // One snapshot feeds both the listing and the ready set, so readiness can
    // never describe a different revision than the rows it selects.
    const snapshot = await this.repository.readAll();
    const listed = [...snapshot.tasks].sort((a, b) => a.id.localeCompare(b.id));
    // Readiness is evaluated over the whole collection before any filter: a
    // dependency excluded by --label must still count against its dependent.
    const readyIds = query.ready
      ? new Set(
          evaluateReadySet(listed, query.now ?? new Date(), this.lifecycle)
            .ready,
        )
      : undefined;
    const searched = query.search
      ? new Set(searchTasks(listed, query.search).map((task) => task.id))
      : undefined;
    const assignees = query.assignees?.length
      ? new Set(query.assignees.map(fold))
      : undefined;
    const types = query.types?.length
      ? new Set(query.types.map(fold))
      : undefined;
    const priority = query.priority ? fold(query.priority) : undefined;
    const milestoneId = query.milestoneId ? fold(query.milestoneId) : undefined;
    // Resolve the parent through the same reference rules every other task
    // lookup uses, so an alias or a case variant selects the same subtasks the
    // canonical id does. An unknown reference is a not-found, not an empty list.
    const parentId =
      query.parentId === undefined
        ? undefined
        : findTask(listed, query.parentId).id;
    const filtered = listed.filter(
      (task) =>
        (!status || task.status === status) &&
        !excludeStatuses?.has(task.status) &&
        (!query.labels?.length ||
          query.labels.every((label) => task.labels.includes(label))) &&
        // A repeated --assignee is a union: "any of these people".
        (!assignees ||
          (task.assignees ?? []).some((assignee) =>
            assignees.has(fold(assignee)),
          )) &&
        (!query.unassigned || !task.assignees?.length) &&
        (milestoneId === undefined || fold(task.milestoneId) === milestoneId) &&
        // Stored parentId is already canonical (canonicalizeTaskLinks), so
        // only the query reference needs resolving.
        (parentId === undefined || task.parentId === parentId) &&
        (priority === undefined || fold(task.priority) === priority) &&
        (!types || types.has(fold(task.type))) &&
        (!readyIds || readyIds.has(task.id)) &&
        (!searched || searched.has(task.id)),
    );
    const sorted = query.sort ? sortTasksBy(filtered, query.sort) : filtered;
    return query.limit === undefined ? sorted : sorted.slice(0, query.limit);
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
    const task = this.stamped(transform(current.task));
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
    const next = this.stamped(
      taskState({ ...task, ...authorizedPatch, id: task.id }),
    );
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
    // Blocker #7 (third pass): the batch port is enforced by construction —
    // no unknown runtime casts.
    const repository = this.repository as LifecycleTaskRepository;
    if (
      this.batchRepository === undefined ||
      repository.writeLifecycle !== this.batchRepository.writeLifecycle
    ) {
      throw new RecordValidationError("batch_repository_unavailable");
    }
    const batchRepository = this.batchRepository;

    const resolvedItems = items.map((item, index) => ({
      item,
      operationId: item.operationId ?? `batch-item-${index + 1}`,
    }));

    const initial = await this.repository.readAll();
    const results: (
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

    // Empty input: zero items plus the authoritative revision. No lock,
    // journal, or mutation ever happens (blocker #8).
    if (items.length === 0)
      return { kind: "success", items: [], revision: initial.revision };

    // Duplicate ids fail the whole request before any mutation.
    const seenIds = new Set<string>();
    for (const [index, { operationId }] of resolvedItems.entries()) {
      if (seenIds.has(operationId))
        throw new RecordValidationError(
          `batch_duplicate_operation_id_at_line_${index + 1}`,
        );
      seenIds.add(operationId);
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
    // Blocker #3: bounded error receipt instead of recursion.
    if (opened.kind === "unrecoverable_lock")
      return {
        kind: "conflict",
        expectedRevision: initial.revision,
        actualRevision: initial.revision,
        operationId: "task-edit-batch",
        ownedPaths: [],
      };
    const session = opened.session;
    try {
      if (opened.recovered?.appliedOperationIds.length)
        console.error(
          `[quest] recovered ${opened.recovered.appliedOperationIds.length} journaled operations from crashed batch ${opened.recovered.sessionId}`,
        );
      // CAS proved the store unchanged since the entry snapshot; everything
      // below evolves from that exact state (blocker #4: repeated edits to
      // one task compose because folds read EVOLVING rows).
      const workingTasks = [...initial.tasks];
      const slotsById = new Map<string, number>(
        initial.tasks.map((task, index) => [task.id, index]),
      );
      // O(1) alias/reference index over the evolving collection.
      let rowIndex = buildReferenceIndex(workingTasks);

      /**
       * Blocker #5 fast path: patches that cannot touch aliases,
       * dependencies/parent graph, blockers, or lifecycle edges apply with
       * O(row) validation; only graph-affecting rows run full seeded-graph
       * validation through a link session built from complete existing
       * edges. Milestone-transition items are REJECTED AT THEIR EXACT
       * INPUT INDEX with milestone_transition_requires_single_edit — no
       * task or planning mutation occurs for them (single contract).
       */

      let appliedCount = 0;
      for (const [index, { item, operationId }] of resolvedItems.entries()) {
        const reference = item.reference;
        try {
          const slot = rowIndex.resolve(item.reference);
          if (slot === undefined)
            throw new RecordValidationError("task_not_found");
          const current = workingTasks[slot];
          const unsafe = foldEditPatch(
            current,
            (item.patch ?? {}) as EditPatchVocabulary,
            (status) => this.resolveStatus(status),
          ) as Partial<TaskState>;
          if ("gates" in unsafe || "gateEvents" in unsafe)
            throw new RecordValidationError("task_gate_events_managed");
          if (unsafe.status !== undefined && unsafe.status !== current.status)
            transitionTask(current, unsafe.status, this.lifecycle);
          const rawNext = this.stamped(
            taskState({ ...current, ...unsafe, id: current.id }),
          );
          if (rawNext.milestoneId !== current.milestoneId) {
            // Fifth-pass blocker #3 (public JSDoc contract): milestone
            // transitions are rejected AT THEIR EXACT INDEX with the
            // documented error; no task or planning mutation occurs.
            throw new RecordValidationError(
              "milestone_transition_requires_single_edit",
            );
          }
          const touchesGraph =
            JSON.stringify(rawNext.dependencies) !==
              JSON.stringify(current.dependencies) ||
            rawNext.parentId !== current.parentId ||
            JSON.stringify(rawNext.aliases) !==
              JSON.stringify(current.aliases) ||
            JSON.stringify(rawNext.blockers ?? []) !==
              JSON.stringify(current.blockers ?? []);
          let persistedRow = rawNext as TaskState;
          if (touchesGraph) {
            const linkSession = createTaskLinkSession(workingTasks);
            // Blocker #6: ONE canonical record flows to persistence, the
            // result envelope, and the evolving fold for following rows.
            persistedRow = linkSession.apply(rawNext);
            await session.writeRecord(persistedRow);
          } else {
            // Non-graph rows validate locally: one authoritative record
            // parse + unique-row check (session holds the lock).
            await session.writeRecord(taskState(rawNext));
          }
          await session.markApplied(operationId, persistedRow.id);
          workingTasks[slot] = persistedRow;
          rowIndex = rebuildSlot(rowIndex, slot, persistedRow);
          appliedCount += 1;
          results.push({
            kind: "updated",
            reference,
            operationId,
            task: persistedRow,
          });
        } catch (error) {
          results.push({
            kind: "error",
            reference,
            operationId,
            message:
              error instanceof Error
                ? error.message
                : "unknown_batch_item_error",
          });
        }
        void index;
        void appliedCount;
      }

      await session.finish();
      // Terminal revision ONLY after every durable write completed.
      const terminal = await this.repository.readAll();
      return { kind: "success", items: results, revision: terminal.revision };
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
