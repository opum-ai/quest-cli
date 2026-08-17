import {
  createTask,
  canonicalizeTaskLinks,
  defaultLifecyclePolicy,
  evaluateReadySet,
  findTask,
  searchTasks,
  taskState,
  transitionTask,
  type ReadySet,
  type LifecyclePolicy,
  type TaskInput,
  type TaskState,
  type TaskStatus,
  type TaskLocation,
  type DraftLocation,
  type DraftState,
  type DraftInput,
  createDraft,
} from "../../domain/tasks/tasks.ts";
import { RecordValidationError } from "../../domain/records.ts";

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
export type TaskMutationResult =
  | {
      readonly kind: "success";
      readonly task: TaskState;
      readonly revision: string;
    }
  | TaskWriteConflict;

export class TaskService {
  constructor(
    private readonly repository: TaskRepository,
    private readonly lifecycle: LifecyclePolicy = defaultLifecyclePolicy,
    private readonly ownedPathFor = (task: TaskState) =>
      `.quest/tasks/${task.id}.md`,
  ) {}
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
  async ready(now: Date): Promise<ReadySet> {
    return evaluateReadySet(
      (await this.repository.readAll()).tasks,
      now,
      this.lifecycle,
    );
  }
}
