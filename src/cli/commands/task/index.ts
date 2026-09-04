import {
  foldEditPatch,
  type EditPatchVocabulary as TrackerEditPatch,
} from "../../../application/tasks/edit-patch.ts";
import type {
  TaskListQuery,
  TaskService,
} from "../../../application/tasks/tasks.ts";

type TrackerTask = Awaited<ReturnType<TaskService["view"]>>;
/** view/list carry the record's current path (QCLI-220); other kinds don't. */
type TrackerTaskWithPath = Awaited<ReturnType<TaskService["viewWithPath"]>>;
type TrackerTaskInput = Parameters<TaskService["create"]>[1];

export interface TaskCommandActor {
  readonly id: string;
  readonly kind: "human" | "delegated-agent";
  readonly accountableHumanId?: string;
}

export type TaskCommandRequest =
  | { readonly command: "status-flow" }
  | ({ readonly command: "list" } & TaskListQuery)
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
      readonly patch: TrackerEditPatch;
      readonly operationId: string;
      readonly actor: TaskCommandActor;
    }
  | {
      readonly command: "edit-batch";
      readonly actor: TaskCommandActor;
      readonly items: readonly {
        readonly reference: string;
        readonly operationId?: string;
        readonly patch?: Partial<TrackerEditPatch>;
      }[];
    };

/** Mirrors the public tracker contract's edit vocabulary (QCLI-97.11.6). */

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
      readonly data: readonly TrackerTaskWithPath[];
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.view";
      readonly data: TrackerTaskWithPath;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.created" | "task.updated";
      readonly data: TrackerTask;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.search";
      readonly data: readonly TrackerTask[];
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.batch-updated";
      readonly data: {
        readonly items: readonly (
          | {
              readonly kind: "updated";
              readonly reference: string;
              readonly operationId: string;
              readonly task: TrackerTask;
            }
          | {
              readonly kind: "error";
              readonly reference: string;
              readonly operationId: string;
              readonly message: string;
            }
        )[];
        readonly applied: number;
        readonly failed: number;
        readonly revision: string;
      };
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
      // Reports the service's configured policy; the default policy is the historical spelling.
      return {
        schemaVersion: 1,
        kind: "task.status-flow",
        data: {
          statuses: tasks.lifecycle.statuses,
          terminalStatuses: tasks.lifecycle.terminalStatuses,
        },
      };
    case "list": {
      const { command: _command, ...query } = request;
      return {
        schemaVersion: 1,
        kind: "task.list",
        data: await tasks.listFilteredWithPath(query),
      };
    }
    case "view":
      return {
        schemaVersion: 1,
        kind: "task.view",
        data: await tasks.viewWithPath(request.reference),
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
    case "edit": {
      requireWriteActor(request.actor);
      // QCLI-122: resolve the current task and its authoritative snapshot in
      // one read, then apply the mutation from that same snapshot instead of
      // performing two independent full-collection reads per public edit.
      const prepared = await tasks.prepareMutation(request.reference);
      const patch = buildEditPatch(prepared.task, request.patch, tasks);
      return {
        schemaVersion: 1,
        kind: "task.updated",
        data: taskFromMutation(
          await tasks.editOn(
            prepared.snapshot,
            request.reference,
            patch as Parameters<TaskService["edit"]>[1],
            request.operationId,
          ),
        ),
      };
    }
    case "edit-batch": {
      requireWriteActor(request.actor);
      const result = await tasks.editBatch(
        request.items.map((item, index) => ({
          reference: item.reference,
          operationId: item.operationId ?? `batch-item-${index + 1}`,
          patch: (item.patch ?? {}) as Partial<
            import("../../../domain/tasks/tasks.ts").TaskState &
              TrackerEditPatch
          >,
        })),
      );
      if (result.kind === "conflict") throw new Error("tracker_write_conflict");
      return {
        schemaVersion: 1,
        kind: "task.batch-updated",
        data: {
          items: result.items,
          applied: result.items.filter((item) => item.kind === "updated")
            .length,
          failed: result.items.filter((item) => item.kind === "error").length,
          revision: result.revision,
        },
      };
    }
  }
}

/**
 * Folds the public replace/add/remove/clear vocabulary into one deterministic
 * TaskState patch: current minus removed, then new entries not already present.
 */
function _mergeList(
  current: readonly string[],
  added: readonly string[] | undefined,
  removed: readonly string[] | undefined,
): readonly string[] {
  const dropped = new Set(removed ?? []);
  const result = current.filter((value) => !dropped.has(value));
  for (const value of added ?? [])
    if (!result.includes(value)) result.push(value);
  return result;
}

function _mergeComments(
  current: readonly unknown[],
  added: readonly unknown[] | undefined,
  removed: readonly string[] | undefined,
): readonly unknown[] {
  const dropped = new Set(removed ?? []);
  const isCommentId = (comment: unknown): boolean =>
    !!comment &&
    typeof comment === "object" &&
    typeof (comment as { id?: unknown }).id === "string";
  const result = current.filter((comment) => {
    const id = isCommentId(comment) ? (comment as { id: string }).id : "";
    return !dropped.has(id);
  });
  for (const comment of added ?? [])
    if (!result.includes(comment)) result.push(comment);
  return result;
}

function buildEditPatch(
  current: TrackerTask,
  patch: TrackerEditPatch,
  tasks: TaskService,
): Record<string, unknown> {
  return foldEditPatch(current, patch, (status) => tasks.resolveStatus(status));
}
