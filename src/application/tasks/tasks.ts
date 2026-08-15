import {
  createTask,
  evaluateReadySet,
  findTask,
  searchTasks,
  taskState,
  transitionTask,
  validateTaskGraph,
  type ReadySet,
  type TaskInput,
  type TaskState,
  type TaskStatus,
} from "../../domain/tasks/tasks.ts";

/** The authoritative store is Git-backed in production; query methods deliberately have no write capability. */
export interface TaskReader {
  readAll(): Promise<readonly TaskState[]>;
}
export interface TaskWriter {
  write(task: TaskState, operationId: string): Promise<void>;
}
export interface TaskRepository extends TaskReader, TaskWriter {}

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}
  async create(
    id: string,
    input: TaskInput,
    operationId: string,
  ): Promise<TaskState> {
    const tasks = await this.repository.readAll();
    const task = createTask(id, input);
    // Validation before persistence makes bad references and alias conflicts non-mutating.
    validateTaskGraph([...tasks, task]);
    if (tasks.some((existing) => existing.id === task.id))
      throw new Error("task_already_exists");
    await this.repository.write(task, operationId);
    return task;
  }
  async list(): Promise<readonly TaskState[]> {
    return [...(await this.repository.readAll())].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
  async view(reference: string): Promise<TaskState> {
    return findTask(await this.repository.readAll(), reference);
  }
  async search(query: string): Promise<readonly TaskState[]> {
    return searchTasks(await this.repository.readAll(), query);
  }
  async edit(
    reference: string,
    patch: Partial<Omit<TaskState, "id">>,
    operationId: string,
  ): Promise<TaskState> {
    const tasks = await this.repository.readAll();
    const task = findTask(tasks, reference);
    const next = taskState({ ...task, ...patch, id: task.id });
    validateTaskGraph(tasks.map((item) => (item.id === task.id ? next : item)));
    await this.repository.write(next, operationId);
    return next;
  }
  async transition(
    reference: string,
    status: TaskStatus,
    operationId: string,
  ): Promise<TaskState> {
    const next = transitionTask(await this.view(reference), status);
    await this.repository.write(next, operationId);
    return next;
  }
  async ready(now: Date): Promise<ReadySet> {
    return evaluateReadySet(await this.repository.readAll(), now);
  }
}
