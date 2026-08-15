import type { TaskService } from "../../../application/tasks/tasks.ts";

type TrackerTask = Awaited<ReturnType<TaskService["view"]>>;
type TrackerTaskInput = Parameters<TaskService["create"]>[1];

export interface TaskCommandActor {
  readonly id: string;
  readonly kind: "human" | "delegated-agent";
  readonly accountableHumanId?: string;
}

export type TaskCommandRequest =
  | { readonly command: "status-flow" }
  | {
      readonly command: "list";
      readonly status?: string;
      readonly labels?: readonly string[];
    }
  | { readonly command: "view"; readonly reference: string }
  | { readonly command: "search"; readonly query: string }
  | {
      readonly command: "create";
      readonly id: string;
      readonly input: TrackerTaskInput;
      readonly operationId: string;
      readonly actor: TaskCommandActor;
    }
  | {
      readonly command: "edit";
      readonly reference: string;
      readonly patch: Parameters<TaskService["edit"]>[1];
      readonly operationId: string;
      readonly actor: TaskCommandActor;
    };

export type TaskCommandResponse =
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.status-flow";
      readonly data: {
        readonly statuses: readonly string[];
        readonly terminalStatuses: readonly string[];
      };
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.list";
      readonly data: readonly TrackerTask[];
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.view" | "task.created" | "task.updated";
      readonly data: TrackerTask;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.search";
      readonly data: readonly TrackerTask[];
    };

function requireWriteActor(actor: TaskCommandActor): void {
  if (
    !actor.id ||
    (actor.kind !== "human" && actor.kind !== "delegated-agent")
  ) {
    throw new Error("tracker_write_actor_required");
  }
  if (actor.kind === "delegated-agent" && !actor.accountableHumanId) {
    throw new Error("tracker_delegated_actor_requires_accountable_human");
  }
}

function taskFromMutation(
  result: Awaited<ReturnType<TaskService["create"]>>,
): TrackerTask {
  if (result.kind === "conflict") throw new Error("tracker_write_conflict");
  return result.task;
}

/** Maps the public tracker vocabulary without choosing a repository or actor identity provider. */
export async function dispatchTrackerTaskCommand(
  tasks: TaskService,
  request: TaskCommandRequest,
): Promise<TaskCommandResponse> {
  switch (request.command) {
    case "status-flow":
      return {
        schemaVersion: 1,
        kind: "task.status-flow",
        data: {
          statuses: ["To Do", "In Progress", "Done"],
          terminalStatuses: ["Done"],
        },
      };
    case "list": {
      const listed = await tasks.list();
      return {
        schemaVersion: 1,
        kind: "task.list",
        data: listed.filter(
          (task) =>
            (!request.status || task.status === request.status) &&
            (!request.labels?.length ||
              request.labels.every((label) => task.labels.includes(label))),
        ),
      };
    }
    case "view":
      return {
        schemaVersion: 1,
        kind: "task.view",
        data: await tasks.view(request.reference),
      };
    case "search":
      return {
        schemaVersion: 1,
        kind: "task.search",
        data: await tasks.search(request.query),
      };
    case "create":
      requireWriteActor(request.actor);
      return {
        schemaVersion: 1,
        kind: "task.created",
        data: taskFromMutation(
          await tasks.create(request.id, request.input, request.operationId),
        ),
      };
    case "edit":
      requireWriteActor(request.actor);
      return {
        schemaVersion: 1,
        kind: "task.updated",
        data: taskFromMutation(
          await tasks.edit(
            request.reference,
            request.patch,
            request.operationId,
          ),
        ),
      };
  }
}
