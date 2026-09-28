import { RecordValidationError } from "../records.ts";

/**
 * A workspace's configured `type` and `priority` vocabulary (QCLI-330,
 * opum-doc ADR "Make quest's type and priority vocabulary
 * workspace-configured, with a canonical default").
 *
 * A field that is ABSENT here is OPEN: any value is accepted and nothing is
 * reported. That is the orchestrator's option-A ruling, and it is what keeps
 * an existing workspace from failing its writes on upgrade: only a workspace
 * that declares a set is held to it. `quest init` declares the canonical
 * default, so every new workspace starts configured.
 */
export interface TaskVocabulary {
  readonly types?: readonly string[];
  readonly priorities?: readonly string[];
}

/**
 * What one configuration read learned about the vocabulary (QCLI-330,
 * reviewer finding 2). `problem` is set when the workspace declares a
 * `[tasks]` table that cannot be read. It is CARRIED, never thrown: the
 * write paths refuse with it, the manifest reports both fields open, and
 * doctor reports the problem -- while every read command carries on,
 * because the manifest is lore-cli's probe and a broken table must not
 * break it.
 */
export interface TaskVocabularyContext {
  readonly vocabulary: TaskVocabulary;
  readonly problem?: string;
}

/** The set `quest init` writes into a fresh workspace. */
export const defaultTaskVocabulary = {
  types: ["feature", "bug", "chore", "docs", "enhancement", "spike"],
  priorities: ["low", "medium", "high", "critical"],
} as const satisfies Required<TaskVocabulary>;

export type TaskVocabularyField = "type" | "priority";

const configuredKey = {
  type: "types",
  priority: "priorities",
} as const satisfies Record<TaskVocabularyField, keyof TaskVocabulary>;

/**
 * The comparison key: the same trim-and-lowercase `task list` filters by
 * (`fold` in src/application/tasks/tasks.ts). It deliberately uses the
 * same locale-sensitive lowering as that fold rather than `toLowerCase()`,
 * because a value normalized here must compare equal under the fold that
 * filters listings; a divergence under a non-en-US locale would be worse
 * than the shared, consistent behaviour.
 */
export function vocabularyKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/** A value outside a configured set. Carries the per-call facts the CLI
 * needs for its error envelope, so the message is never parsed back. */
export class VocabularyValueError extends RecordValidationError {
  constructor(
    readonly field: TaskVocabularyField,
    readonly value: string,
    readonly allowed: readonly string[],
  ) {
    super(
      `task_vocabulary_value_invalid: ${field} ${JSON.stringify(value)} is not in this workspace's configured ${field} set (${allowed.join(", ")})`,
    );
    this.name = "VocabularyValueError";
  }
}

/**
 * Checks one written value. An exact match is kept, a match that differs
 * only in case or outer whitespace is rewritten to the configured spelling,
 * and anything else throws {@link VocabularyValueError}. An open field, or
 * an empty value (which clears the field), passes through untouched.
 */
export function resolveVocabularyValue(
  field: TaskVocabularyField,
  value: string,
  vocabulary: TaskVocabulary,
): string {
  const allowed = vocabulary[configuredKey[field]];
  if (allowed === undefined || value === "") return value;
  if (allowed.includes(value)) return value;
  const key = vocabularyKey(value);
  const match = allowed.find((candidate) => vocabularyKey(candidate) === key);
  if (match === undefined)
    throw new VocabularyValueError(field, value, allowed);
  return match;
}

/** Applies {@link resolveVocabularyValue} to whichever of the two fields a
 * write actually carries. A field the write leaves out is never looked at, so
 * editing anything else on a record with a legacy value still succeeds. */
export function resolveVocabularyPatch<
  T extends { readonly type?: string; readonly priority?: string },
>(patch: T, vocabulary: TaskVocabulary): T {
  const type =
    typeof patch.type === "string"
      ? resolveVocabularyValue("type", patch.type, vocabulary)
      : patch.type;
  const priority =
    typeof patch.priority === "string"
      ? resolveVocabularyValue("priority", patch.priority, vocabulary)
      : patch.priority;
  if (type === patch.type && priority === patch.priority) return patch;
  return {
    ...patch,
    ...(type === undefined ? {} : { type }),
    ...(priority === undefined ? {} : { priority }),
  };
}

/** One stored value outside the configured set, exactly as stored. */
export interface VocabularyDrift {
  readonly field: TaskVocabularyField;
  readonly value: string;
  /** The configured spelling when only case or whitespace differs. */
  readonly normalizesTo?: string;
}

/** What doctor reports for one record. It reads the record and never
 * rewrites it: history is reported, not corrected. */
export function vocabularyDrift(
  task: { readonly type?: string; readonly priority?: string },
  vocabulary: TaskVocabulary,
): readonly VocabularyDrift[] {
  const drift: VocabularyDrift[] = [];
  for (const field of ["type", "priority"] as const) {
    const value = task[field];
    const allowed = vocabulary[configuredKey[field]];
    if (
      allowed === undefined ||
      value === undefined ||
      value === "" ||
      allowed.includes(value)
    )
      continue;
    const match = allowed.find(
      (candidate) => vocabularyKey(candidate) === vocabularyKey(value),
    );
    drift.push({
      field,
      value,
      ...(match === undefined ? {} : { normalizesTo: match }),
    });
  }
  return drift;
}

/**
 * Validates one configured list read from workspace.toml. Returns the
 * problem, or undefined when the list is usable. An empty list is refused
 * rather than read as "nothing is allowed": a workspace that wants a field
 * open leaves the key out, so "open" and "configured" stay two different
 * facts a reader can tell apart.
 */
export function vocabularyListProblem(value: unknown): string | undefined {
  if (!Array.isArray(value)) return "must be an array of strings";
  if (value.length === 0)
    return "must not be empty (leave the key out to keep the field open)";
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || entry.trim() === "")
      return "must hold only non-empty strings";
    if (entry !== entry.trim())
      return `holds ${JSON.stringify(entry)}, which has outer whitespace`;
    const key = vocabularyKey(entry);
    if (seen.has(key))
      return `holds ${JSON.stringify(entry)} twice (compared case-insensitively)`;
    seen.add(key);
  }
  return undefined;
}
