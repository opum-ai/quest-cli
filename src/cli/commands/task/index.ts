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
      readonly patch: TrackerEditPatch;
      readonly operationId: string;
      readonly actor: TaskCommandActor;
    };

/** Mirrors the public tracker contract's edit vocabulary (QCLI-97.11.6). */
export interface TrackerEditPatch {
  readonly status?: string;
  readonly summary?: string;
  readonly description?: string;
  /** Full label replacement; combine with addLabels/removeLabels for merge semantics. */
  readonly labels?: readonly string[];
  readonly addLabels?: readonly string[];
  readonly removeLabels?: readonly string[];
  readonly documentation?: readonly string[];
  readonly plan?: readonly string[];
  readonly addPlan?: readonly string[];
  readonly removePlan?: readonly string[];
  readonly implementationNotes?: readonly string[];
  readonly addNotes?: readonly string[];
  readonly removeNotes?: readonly string[];
  readonly comments?: readonly unknown[];
  readonly addComments?: readonly unknown[];
  readonly removeComments?: readonly string[];
  readonly acceptanceCriteria?: readonly (
    | string
    | {
        readonly index: number;
        readonly text: string;
        readonly checked: boolean;
      }
  )[];
  readonly definitionOfDone?: readonly (
    | string
    | {
        readonly index: number;
        readonly text: string;
        readonly checked: boolean;
      }
  )[];
  readonly addDependencies?: readonly string[];
  readonly removeDependencies?: readonly string[];
  readonly parentId?: string;
  readonly clearParent?: boolean;
  readonly milestoneId?: string;
  readonly clearMilestone?: boolean;
  readonly addAssignees?: readonly string[];
  readonly removeAssignees?: readonly string[];
  readonly addReferences?: readonly string[];
  readonly removeReferences?: readonly string[];
  readonly addModifiedFiles?: readonly string[];
  readonly removeModifiedFiles?: readonly string[];
}

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
      const status = request.status
        ? tasks.resolveStatus(request.status)
        : undefined;
      const listed = await tasks.list();
      return {
        schemaVersion: 1,
        kind: "task.list",
        data: listed.filter(
          (task) =>
            (!status || task.status === status) &&
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
    case "edit": {
      requireWriteActor(request.actor);
      const patch = buildEditPatch(
        await tasks.view(request.reference),
        request.patch,
        tasks,
      );
      return {
        schemaVersion: 1,
        kind: "task.updated",
        data: taskFromMutation(
          await tasks.edit(request.reference, patch, request.operationId),
        ),
      };
    }
  }
}

/**
 * Folds the public replace/add/remove/clear vocabulary into one deterministic
 * TaskState patch: current minus removed, then new entries not already present.
 */
function mergeList(
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

function mergeComments(
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
  const next: Record<string, unknown> = {};
  if (patch.status !== undefined)
    next.status = tasks.resolveStatus(patch.status);
  if (patch.summary !== undefined) next.summary = patch.summary;
  if (patch.description !== undefined) next.description = patch.description;
  if (patch.labels !== undefined) next.labels = [...patch.labels];
  else if (patch.addLabels?.length || patch.removeLabels?.length)
    next.labels = mergeList(
      current.labels,
      patch.addLabels,
      patch.removeLabels,
    );
  if (patch.documentation !== undefined)
    next.documentation = patch.documentation;
  if (patch.plan !== undefined) next.plan = [...patch.plan];
  else if (patch.addPlan?.length || patch.removePlan?.length)
    next.plan = mergeList(current.plan, patch.addPlan, patch.removePlan);
  if (patch.implementationNotes !== undefined)
    next.implementationNotes = [...patch.implementationNotes];
  else if (patch.addNotes?.length || patch.removeNotes?.length)
    next.implementationNotes = mergeList(
      current.implementationNotes,
      patch.addNotes,
      patch.removeNotes,
    );
  if (patch.comments !== undefined) next.comments = [...patch.comments];
  else if (patch.addComments?.length || patch.removeComments?.length)
    next.comments = mergeComments(
      current.comments,
      patch.addComments,
      patch.removeComments,
    );
  if (patch.acceptanceCriteria !== undefined)
    next.acceptanceCriteria = patch.acceptanceCriteria;
  if (patch.definitionOfDone !== undefined)
    next.definitionOfDone = patch.definitionOfDone;
  if (patch.addDependencies?.length || patch.removeDependencies?.length)
    next.dependencies = mergeList(
      current.dependencies,
      patch.addDependencies,
      patch.removeDependencies,
    );
  if (patch.parentId !== undefined) next.parentId = patch.parentId;
  else if (patch.clearParent === true) next.parentId = undefined;
  if (patch.milestoneId !== undefined) next.milestoneId = patch.milestoneId;
  else if (patch.clearMilestone === true) next.milestoneId = undefined;
  if (patch.addAssignees?.length || patch.removeAssignees?.length)
    next.assignees = mergeList(
      current.assignees ?? [],
      patch.addAssignees,
      patch.removeAssignees,
    );
  if (patch.addReferences?.length || patch.removeReferences?.length)
    next.references = mergeList(
      current.references ?? [],
      patch.addReferences,
      patch.removeReferences,
    );
  if (patch.addModifiedFiles?.length || patch.removeModifiedFiles?.length)
    next.modifiedFiles = mergeList(
      current.modifiedFiles ?? [],
      patch.addModifiedFiles,
      patch.removeModifiedFiles,
    );
  return next;
}
