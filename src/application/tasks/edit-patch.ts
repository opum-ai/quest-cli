import { RecordValidationError } from "../../domain/records.ts";
import type { TaskCheckItem, TaskState } from "../../domain/tasks/tasks.ts";

/** Public tracker edit vocabulary (QCLI-97.11.6) owned by the application layer. */
export interface EditPatchVocabulary {
  readonly status?: string;
  readonly title?: string;
  readonly priority?: string;
  readonly type?: string;
  readonly ordinal?: number;
  readonly summary?: string;
  readonly description?: string;
  readonly finalSummary?: string;
  /**
   * Final-summary retirement and extension (QCLI-149), mirroring
   * `clearAcceptanceCriteria` and `addPlan`. Appending joins with a blank
   * line: a summary extended after review reads as a second paragraph, not a
   * run-on sentence.
   */
  readonly clearFinalSummary?: boolean;
  readonly appendFinalSummary?: readonly string[];
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
  /**
   * Index-addressed checklist operations (QCLI-138). Positions are 1-based on
   * this public surface, matching the tracker vocabulary Quest is at parity
   * with; the domain {@link TaskCheckItem} index stays 0-based. Addressing one
   * entry keeps the other entries byte-identical, so two editors checking
   * different boxes no longer overwrite each other the way two wholesale
   * `acceptanceCriteria` replacements do.
   */
  readonly checkAcceptanceCriteria?: readonly number[];
  readonly uncheckAcceptanceCriteria?: readonly number[];
  readonly removeAcceptanceCriteria?: readonly number[];
  readonly clearAcceptanceCriteria?: boolean;
  readonly checkDefinitionOfDone?: readonly number[];
  readonly uncheckDefinitionOfDone?: readonly number[];
  readonly removeDefinitionOfDone?: readonly number[];
  readonly clearDefinitionOfDone?: boolean;
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
  const finalSummary = foldFinalSummary(
    current.finalSummary,
    patch.finalSummary,
    patch.clearFinalSummary,
    patch.appendFinalSummary,
  );
  if (finalSummary !== undefined) next.finalSummary = finalSummary;
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
  const acceptanceCriteria = foldCheckList(
    current.acceptanceCriteria,
    patch.acceptanceCriteria,
    patch.clearAcceptanceCriteria,
    patch.removeAcceptanceCriteria,
    patch.checkAcceptanceCriteria,
    patch.uncheckAcceptanceCriteria,
  );
  if (acceptanceCriteria !== undefined)
    next.acceptanceCriteria = acceptanceCriteria;
  const definitionOfDone = foldCheckList(
    current.definitionOfDone,
    patch.definitionOfDone,
    patch.clearDefinitionOfDone,
    patch.removeDefinitionOfDone,
    patch.checkDefinitionOfDone,
    patch.uncheckDefinitionOfDone,
  );
  if (definitionOfDone !== undefined) next.definitionOfDone = definitionOfDone;
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

/**
 * Folds the wholesale replacement and the index-addressed checklist operations
 * into one checklist value, or `undefined` when the patch touches neither.
 *
 * Index operations address the task's current list at its 1-based positions.
 * Removals, checks and unchecks all resolve against that one snapshot, so the
 * outcome never depends on operation order, and the survivors are re-indexed
 * exactly once at the end. The snapshot is the state the caller is about to
 * write against — the batch session's locked read, or the revision the single
 * `task edit` path passes to its compare-and-set write — so a racing writer
 * loses the CAS rather than silently reverting an entry it never addressed.
 * A wholesale replacement is passed through untouched so its authored indexes
 * still face the domain's own validation.
 */
function foldCheckList(
  current: readonly (string | TaskCheckItem)[],
  replacement: readonly (string | TaskCheckItem)[] | undefined,
  clear: boolean | undefined,
  removed: readonly number[] | undefined,
  checked: readonly number[] | undefined,
  unchecked: readonly number[] | undefined,
): readonly (string | TaskCheckItem)[] | undefined {
  const addressed =
    (removed?.length ?? 0) > 0 ||
    (checked?.length ?? 0) > 0 ||
    (unchecked?.length ?? 0) > 0;
  // The three families are mutually exclusive: silently merging a wholesale
  // replacement with index operations would hand back a list neither editor
  // asked for, which is exactly the lost-update shape this vocabulary exists
  // to remove.
  if (clear === true) {
    if (addressed || replacement !== undefined)
      throw new RecordValidationError("check_operation_conflict");
    return [];
  }
  if (!addressed) return replacement;
  if (replacement !== undefined)
    throw new RecordValidationError("check_operation_conflict");
  const base = reindex(current);
  const drop = positions(removed, base.length);
  const check = positions(checked, base.length);
  const uncheck = positions(unchecked, base.length);
  for (const position of check)
    if (uncheck.has(position))
      throw new RecordValidationError("check_index_conflict");
  // Removing a position and also (un)checking it are contradictory requests
  // about the same entry; applying removal and discarding the checkmark would
  // silently honour only one of them.
  for (const position of [...check, ...uncheck])
    if (drop.has(position))
      throw new RecordValidationError("check_index_conflict");
  return reindex(
    base
      .map((item, offset) => ({ item, position: offset + 1 }))
      .filter(({ position }) => !drop.has(position))
      .map(({ item, position }) => {
        if (check.has(position)) return { ...item, checked: true };
        if (uncheck.has(position)) return { ...item, checked: false };
        return item;
      }),
  );
}

/** Normalizes a legacy-or-item checklist to positionally indexed items. */
function reindex(
  list: readonly (string | TaskCheckItem)[],
): readonly TaskCheckItem[] {
  return list.map((entry, index) =>
    typeof entry === "string"
      ? { index, text: entry, checked: false }
      : { index, text: entry.text, checked: entry.checked },
  );
}

/** Validates 1-based public positions against the base list length. */
function positions(
  values: readonly number[] | undefined,
  length: number,
): ReadonlySet<number> {
  const result = new Set<number>();
  for (const value of values ?? []) {
    if (!Number.isInteger(value) || value < 1 || value > length)
      throw new RecordValidationError("check_index_out_of_range");
    result.add(value);
  }
  return result;
}

/**
 * Folds the final-summary replacement, clear and append into one value, or
 * `undefined` when the patch touches none of them.
 *
 * `clear` is exclusive for the same reason it is on a checklist: combining it
 * with a value asks for two different outcomes at once. A replacement and an
 * append do compose, in that order, so one command can rewrite a summary and
 * extend it.
 */
function foldFinalSummary(
  current: string | undefined,
  replacement: string | undefined,
  clear: boolean | undefined,
  appended: readonly string[] | undefined,
): string | undefined {
  if (clear === true) {
    if (replacement !== undefined || (appended?.length ?? 0) > 0)
      throw new RecordValidationError("final_summary_operation_conflict");
    return "";
  }
  if (!appended?.length) return replacement;
  const base = replacement ?? current ?? "";
  return [base, ...appended].filter((part) => part.length > 0).join("\n\n");
}
