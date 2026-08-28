import type { TaskState } from "../../domain/tasks/tasks.ts";

/** Public tracker edit vocabulary (QCLI-97.11.6) owned by the application layer. */
export interface EditPatchVocabulary {
  readonly status?: string;
  readonly title?: string;
  readonly priority?: string;
  readonly type?: string;
  readonly ordinal?: number;
  readonly summary?: string;
  readonly description?: string;
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

/**
 * Single source of truth for folding the public tracker edit vocabulary
 * (replace / add / remove / clear) into one deterministic domain patch
 * against a task's current state (QCLI-97.11.6 vocabulary, QCLI-122 batch).
 * Both the ordinary `task edit` dispatch and the batch executor consume this
 * fold so the two transports cannot drift.
 */
export function foldEditPatch(
  current: TaskState,
  patch: EditPatchVocabulary,
  resolveStatus: (status: string) => TaskState["status"],
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  if (patch.status !== undefined) next.status = resolveStatus(patch.status);
  // Plain scalar replaces. The domain has always carried these (TaskState
  // title/priority/type/ordinal); only the public edit vocabulary omitted them,
  // which left a typo in a title permanently unfixable (QCLI-133).
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.priority !== undefined) next.priority = patch.priority;
  if (patch.type !== undefined) next.type = patch.type;
  if (patch.ordinal !== undefined) next.ordinal = patch.ordinal;
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

/**
 * Folds the public replace/add/remove/clear vocabulary into one deterministic
 * list value: current minus removed, then new entries not already present.
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

/** Comment identity is the comment id; add appends unseen comments in order. */
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
