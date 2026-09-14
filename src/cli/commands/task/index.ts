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

/**
 * Derived from {@link TrackerTask} rather than imported from
 * `domain/tasks/tasks.ts` directly: `cli` may only depend on `application`
 * (scripts/check-layers.mjs), and `TaskState`'s own checklist shape already
 * flows through {@link TaskService}'s return types.
 */
type TaskCheckList = TrackerTask["acceptanceCriteria"];
type TaskCheckItem = Exclude<TaskCheckList[number], string>;

/**
 * QCLI-269: `--check-ac`/`--uncheck-ac`/`--remove-ac` (and the `--*-dod`
 * equivalents) address a checklist item by 1-based position, but every
 * checklist a caller could read back only ever carried the domain's own
 * 0-based `index` -- there was no surface printing the number those flags
 * actually take. A caller who read `index` and passed it straight to
 * `--check-ac` addressed the item before the one they meant, silently, for
 * every in-range value except the first.
 *
 * `position` is additive and presentation-only: it is computed here, at the
 * boundary that builds every read/write envelope, and never touches the
 * persisted domain shape (`TaskCheckItem` in domain/tasks/tasks.ts stays
 * `{index, text, checked}`). A caller can now read `position` off any
 * checklist item and pass it back to `--check-ac`/etc. verbatim -- no
 * index-plus-one arithmetic, and no separate numbered list to consult.
 */
export interface TaskCheckItemView extends TaskCheckItem {
  readonly position: number;
}

/** Adds `position` to every entry; legacy bare strings are 0-based by array order (matches normalizeCheckList). */
function withPositions(list: TaskCheckList): readonly TaskCheckItemView[] {
  return list.map((entry, arrayIndex) => {
    const item: TaskCheckItem =
      typeof entry === "string"
        ? { index: arrayIndex, text: entry, checked: false }
        : entry;
    return { ...item, position: item.index + 1 };
  });
}

interface Checklisted {
  readonly acceptanceCriteria: TaskCheckList;
  readonly definitionOfDone: TaskCheckList;
}

/** `T` with both checklists' entries carrying {@link TaskCheckItemView}'s `position`. */
export type WithCheckPositions<T extends Checklisted> = Omit<
  T,
  "acceptanceCriteria" | "definitionOfDone"
> & {
  readonly acceptanceCriteria: readonly TaskCheckItemView[];
  readonly definitionOfDone: readonly TaskCheckItemView[];
};

/**
 * Applies {@link withPositions} to both checklists of any task-shaped record.
 * Exported so `src/cli/main.ts`'s five direct lifecycle commands
 * (complete/archive/pause/start/demote) -- which build their envelopes
 * without going through {@link dispatchTrackerTaskCommand} -- can carry the
 * same `position` field instead of silently omitting it (QCLI-252's
 * cross-reference).
 */
export function withCheckPositions<T extends Checklisted>(
  task: T,
): WithCheckPositions<T> {
  return {
    ...task,
    acceptanceCriteria: withPositions(task.acceptanceCriteria),
    definitionOfDone: withPositions(task.definitionOfDone),
  };
}

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
        /** QCLI-229: absent when the workspace has pause/start disabled. */
        readonly pausedStatus?: string;
      };
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.list";
      readonly data: readonly WithCheckPositions<TrackerTaskWithPath>[];
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.view";
      readonly data: WithCheckPositions<TrackerTaskWithPath>;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.created" | "task.updated";
      readonly data: WithCheckPositions<TrackerTask>;
    }
  | {
      readonly schemaVersion: 1;
      readonly kind: "task.search";
      readonly data: readonly WithCheckPositions<TrackerTask>[];
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
              readonly task: WithCheckPositions<TrackerTask>;
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

/**
 * QCLI-264: every single-record mutating command puts the written record
 * itself in `data`, never the service's internal mutation envelope. (The
 * batch route is a report rather than a record and keeps its own shape,
 * records at `data.items[].task`.) Unwrapping here is what
 * keeps `task complete` readable the same way as `task edit`; passing the
 * result through instead nests the record under `task`/`draft`, exposes the
 * repository `revision` hash, and shadows the envelope's semantic `kind` with
 * a second `kind: "success"`. A conflict is an exit-5 failure, not a success
 * envelope carrying `kind: "conflict"`, which is what the raw pass-through
 * used to emit.
 */
export function recordFromMutation<
  Result extends { readonly kind: string },
  Field extends keyof Extract<Result, { readonly kind: "success" }> & string,
>(
  result: Result,
  field: Field,
): Extract<Result, { readonly kind: "success" }>[Field] {
  if (result.kind !== "success") throw new Error("tracker_write_conflict");
  return (result as Extract<Result, { readonly kind: "success" }>)[field];
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
          ...(tasks.lifecycle.pausedStatus !== undefined
            ? { pausedStatus: tasks.lifecycle.pausedStatus }
            : {}),
        },
      };
    case "list": {
      const { command: _command, ...query } = request;
      return {
        schemaVersion: 1,
        kind: "task.list",
        data: (await tasks.listFilteredWithPath(query)).map(withCheckPositions),
      };
    }
    case "view":
      return {
        schemaVersion: 1,
        kind: "task.view",
        data: withCheckPositions(await tasks.viewWithPath(request.reference)),
      };
    case "search":
      return {
        schemaVersion: 1,
        kind: "task.search",
        data: (await tasks.search(request.query)).map(withCheckPositions),
      };
    case "create":
      requireWriteActor(request.actor);
      return {
        schemaVersion: 1,
        kind: "task.created",
        data: withCheckPositions(
          taskFromMutation(
            await tasks.create(request.id, request.input, request.operationId),
          ),
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
        data: withCheckPositions(
          taskFromMutation(
            await tasks.editOn(
              prepared.snapshot,
              request.reference,
              patch as Parameters<TaskService["edit"]>[1],
              request.operationId,
            ),
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
          items: result.items.map((item) =>
            item.kind === "updated"
              ? { ...item, task: withCheckPositions(item.task) }
              : item,
          ),
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
