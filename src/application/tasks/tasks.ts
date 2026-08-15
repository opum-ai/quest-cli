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
} from "../../domain/tasks/tasks.ts";

/** The authoritative store is Git-backed in production; query methods deliberately have no write capability. */
export interface TaskReader {
  readAll(): Promise<TaskReadSnapshot>;
}
export interface TaskReadSnapshot {
  readonly revision: string;
  readonly tasks: readonly TaskState[];
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
    const task = createTask(id, input);
    // Validation before persistence makes bad references and alias conflicts non-mutating.
    const canonical = canonicalizeTaskLinks([...tasks, task]);
    const persisted = canonical.at(-1);
    if (!persisted) throw new Error("task_canonicalization_failed");
    if (tasks.some((existing) => existing.id === task.id))
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
  async view(reference: string): Promise<TaskState> {
    return findTask((await this.repository.readAll()).tasks, reference);
  }
  async search(query: string): Promise<readonly TaskState[]> {
    return searchTasks((await this.repository.readAll()).tasks, query);
  }
  async edit(
    reference: string,
    patch: Partial<Omit<TaskState, "id">>,
    operationId: string,
  ): Promise<TaskMutationResult> {
    const snapshot = await this.repository.readAll();
    const tasks = snapshot.tasks;
    const task = findTask(tasks, reference);
    if (patch.status !== undefined && patch.status !== task.status)
      transitionTask(task, patch.status, this.lifecycle);
    const next = taskState({ ...task, ...patch, id: task.id });
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
