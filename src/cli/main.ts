#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { readFile, stat, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { Command } from "commander";
import {
  agentInstructionPathForTarget,
  type AgentInstructionCheck,
  type AgentInstructionTarget,
  generatesQuestSkillFile,
  inspectQuestAgentInstructions,
  inspectQuestSkillFile,
  questAgentInstructions,
  questSkillPath,
  updateQuestAgentInstructions,
  updateQuestSkillFile,
} from "../application/agents/agent-instructions.ts";
import { findQuestGuide, questGuides } from "../application/agents/guides.ts";
import { startBrowserServer } from "../application/browser/browser.ts";
import type { QuestTaskBindingV1Response } from "../application/claims/opum-agent-workflow.ts";
import {
  OpumAgentWorkflowBindingService,
  OpumAgentWorkflowError,
  parseStrictJson,
  parseTaskBindingRequestV1,
} from "../application/claims/opum-agent-workflow.ts";
import {
  commandManifest,
  diagnostic,
  exitCodeFor,
  manifestResult,
  type OutputMode,
  selectOutputMode,
} from "../application/command-contract.ts";
import { commandHelp } from "../application/command-help.ts";
import {
  BOOLEAN_FLAGS,
  describeFlag,
  REPEATABLE_CREATE_FLAGS,
  REPEATABLE_EDIT_BATCH_FLAGS,
  REPEATABLE_EDIT_FLAGS,
  REPEATABLE_LIST_FLAGS,
} from "../application/command-parameters.ts";
import { BacklogMigrationRefusedError } from "../application/migration/backlog-public.ts";
import type { PlanningService } from "../application/planning/planning.ts";
import {
  LocalTaskRepository,
  RecordDuplicateIdentityError,
} from "../application/tasks/local-task-repository.ts";
import type { LocatedDraft, TaskService } from "../application/tasks/tasks.ts";
import {
  type AgentSkillSource,
  initializeWorkspace,
  isValidTaskIdPrefix,
  reconfigureWorkspace,
  resolveInitializedWorkspace,
  resolveWorkspaceConfiguration,
  WorkspaceError,
} from "../application/workspaces/workspaces.ts";
import { QUEST_VERSION } from "../application/version.ts";
import {
  dispatchTrackerTaskCommand,
  recordFromMutation,
  TrackerWriteConflictError,
  withCheckPositions,
} from "./commands/task/index.ts";
import {
  createAgentInstructionPort,
  createBacklogImportService,
  createGitPort,
  createPlanningService,
  createTaskBindingModel,
  createTaskService,
  createWorkspacePort,
} from "./composition.ts";
import { migrationSmokeResult } from "./migration-smoke.ts";
import { renderHumanPayload } from "./render.ts";

const VERSION = QUEST_VERSION;

/** Retains the program identity for embedders; subprocess routing uses runQuest. */
export function createQuestProgram(): Command {
  return new Command()
    .name("quest")
    .description("Quest tracker CLI")
    .version(VERSION);
}

export interface InvocationResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

function failure(
  errorType: Parameters<typeof diagnostic>[0],
  message: string,
  options: Parameters<typeof diagnostic>[2] = {},
): InvocationResult {
  const error = diagnostic(errorType, message, options);
  return {
    stdout: "",
    stderr: `${JSON.stringify(error)}\n`,
    exitCode: exitCodeFor(error.error_type),
  };
}

/**
 * QCLI-266: keys `quest help` prints before the alphabetical rest. `summary`
 * and `usage` are the only lines that show a command's positional form, and
 * they used to render last, under ~50 lines of alphabetized field and flag
 * names -- so anything that truncates never reached them.
 */
const HELP_PRIORITY_KEYS = ["summary", "usage", "flags"] as const;

/**
 * QCLI-289: a global counter, deliberately not per-command (agreed with
 * opum-cli-e2e -- a bounded coarse-recheck cost beats an unbounded
 * per-command versioning obligation). Bump this, and only this, the moment
 * any command's `data` payload shape changes in a way an existing decoder
 * would misread. Distinct from `schemaVersion`, which stays the outer
 * envelope-wrapper version.
 */
const CONTRACT_VERSION = 1;

function output(
  data: object | readonly unknown[],
  mode: OutputMode,
  priorityKeys: readonly string[] = [],
  scope?: ListingScope,
): InvocationResult {
  const success = data as {
    readonly schemaVersion: unknown;
    readonly kind: unknown;
    readonly data: unknown;
  };
  // QCLI-316. `scope` is additive and sits BEFORE `principal`, which the
  // shared command contract fixes as the last top-level key -- presence and
  // position are separate constraints there and only presence is obvious.
  // Additive top-level keys on a SUCCESS envelope are permitted (the
  // `contractVersion` precedent, QCLI-289); a consumer that does not know the
  // key ignores it and still reads the same `data`.
  const envelope = {
    schemaVersion: success.schemaVersion,
    contractVersion: CONTRACT_VERSION,
    kind: success.kind,
    data: success.data,
    ...(scope === undefined ? {} : { scope }),
    principal: null,
  };
  return {
    stdout:
      mode === "json"
        ? `${JSON.stringify(envelope)}\n`
        : `${renderHumanPayload(envelope.data, priorityKeys)}${scope === undefined ? "" : renderScopeFooter(scope)}`,
    stderr: "",
    exitCode: 0,
  };
}

/**
 * What object a task listing actually answered about (QCLI-316).
 *
 * `quest task list --status "In Progress"` reads the checked-out ref's
 * `.quest/` and nothing else, while the rule that sends a session to it --
 * "check nothing is still open before you report clear" -- is asking about the
 * REPOSITORY. The two diverge for exactly the tasks most likely to be
 * forgotten, the ones still on an unmerged branch, and the failure direction
 * is the bad one: an empty list reads as THE CHECK PASSING rather than as THE
 * CHECK NOT RUNNING. Reported by opum-doc after an empty In Progress list on
 * `dev` missed a task that was In Progress with an open PR.
 */
interface ListingScope {
  /** The branch answered about, or null when HEAD is detached / not Git. */
  readonly branch: string | null;
  /** Whether other refs were consulted at all -- never left to inference. */
  readonly otherRefsRead: boolean;
  /**
   * Task ids carried by another ref and absent from this one. Present only
   * when `otherRefsRead`, and EMPTY IS A RESULT: it says the listing is
   * load-bearing, which is the answer the caller actually wanted.
   */
  readonly unseenTaskIds?: readonly string[];
}

function renderScopeFooter(scope: ListingScope): string {
  const where =
    scope.branch === null
      ? "the checked-out revision"
      : `branch ${scope.branch}`;
  if (!scope.otherRefsRead)
    return `\nAnswered about ${where}. Other refs may carry task records that were not read.\n`;
  const unseen = scope.unseenTaskIds ?? [];
  if (unseen.length === 0)
    return `\nAnswered about ${where}. No task record exists on any other ref that is absent here.\n`;
  return `\nAnswered about ${where}. ${unseen.length} task record(s) exist on other refs and were NOT read: ${unseen.join(", ")}. An empty or filtered list here is not an answer about the repository.\n`;
}

/**
 * Ids present on some other ref and absent from this one -- a SET DIFFERENCE,
 * deliberately, not a count (QCLI-316).
 *
 * opum-doc built the naive version against a single non-dev ref and got 122
 * lines, essentially all of which `dev` already held: useless as a notice and
 * worse than useless as a safety signal, because a session that sees 122 lines
 * after an empty list learns nothing and stops reading it the second time.
 * Subtracting what the current ref carries left exactly one line -- the task
 * the empty list had missed. Measured here across 20 refs: ~4,500 raw rows,
 * ZERO after the difference. The notice's APPEARANCE is the signal, so being
 * silent in the ordinary case is the property to design for.
 *
 * The subtrahend must span tasks/, completed/ AND archive/tasks/: a record can
 * sit in `tasks/` on a branch and `completed/` on dev, and comparing only
 * `tasks/` would report it as a phantom open task on every ref.
 *
 * FILENAMES ONLY, like the id allocator this borrows from
 * ({@link highestSequenceOnOtherRefs}) -- one tree listing per ref, never a
 * `git show` and never a JSON parse. That is what keeps it free of a merge
 * policy: the allocator's cross-ref operation is max-over-integers, which
 * cannot disagree with itself, whereas READING status across refs would have
 * to answer "which ref wins when two carry the same id with different
 * statuses", and inventing a merge policy for tracker state is a much larger
 * decision than this. Existence is the most this can report without acquiring
 * that question, and existence is enough to tell a caller their empty list is
 * not load-bearing. See DEC-6.
 */
async function taskRecordIdsOnOtherRefs(
  git: ReturnType<typeof createGitPort>,
  root: string,
): Promise<readonly string[] | null> {
  try {
    const refs = await git.listRefs(root);
    if (refs.length === 0) return null;
    const current = await git.currentBranch(root);
    const idsOn = async (ref: string) => {
      const listings = await Promise.all(
        TASK_RECORD_SUBDIRECTORIES.map((subdirectory) =>
          git.listFiles(root, ref, `.quest/${subdirectory}`),
        ),
      );
      return new Set(
        listings
          .flat()
          .filter((file) => file.endsWith(".json"))
          .map((file) =>
            file.slice(file.lastIndexOf("/") + 1, -".json".length),
          ),
      );
    };
    const here = await idsOn(
      current === null ? "HEAD" : `refs/heads/${current}`,
    );
    const unseen = new Set<string>();
    for (const ref of refs) {
      for (const id of await idsOn(ref)) if (!here.has(id)) unseen.add(id);
    }
    return [...unseen].sort();
  } catch {
    // Same degradation as the allocator: a `.quest` directory with no Git
    // behind it keeps today's local-only behaviour exactly, and a listing is
    // never failed because a cross-ref check could not run.
    return null;
  }
}

type ChecklistEntry =
  | string
  | {
      readonly index: number;
      readonly text: string;
      readonly checked: boolean;
    };

type UnresolvedChecklistItem = {
  readonly index: number;
  readonly text: string;
};

/** Legacy bare-string entries are unchecked by construction (domain/tasks/tasks.ts's normalizeCheckList). */
function unresolvedItems(
  list: readonly ChecklistEntry[],
): readonly UnresolvedChecklistItem[] {
  return list.flatMap((entry, position) =>
    typeof entry === "string"
      ? [{ index: position, text: entry }]
      : entry.checked
        ? []
        : [{ index: entry.index, text: entry.text }],
  );
}

/**
 * QCLI-252: computes the additive, presentation-only signal that a completed
 * task still carries unchecked acceptance criteria / definition-of-done.
 * Returns undefined (omit, never an empty object) when nothing is unresolved.
 */
function unresolvedAtCompletion(task: {
  readonly acceptanceCriteria: readonly ChecklistEntry[];
  readonly definitionOfDone: readonly ChecklistEntry[];
}):
  | {
      readonly acceptanceCriteria: readonly UnresolvedChecklistItem[];
      readonly definitionOfDone: readonly UnresolvedChecklistItem[];
    }
  | undefined {
  const acceptanceCriteria = unresolvedItems(task.acceptanceCriteria);
  const definitionOfDone = unresolvedItems(task.definitionOfDone);
  return acceptanceCriteria.length === 0 && definitionOfDone.length === 0
    ? undefined
    : { acceptanceCriteria, definitionOfDone };
}

function describeUnresolved(
  label: string,
  total: number,
  items: readonly UnresolvedChecklistItem[],
): string | undefined {
  if (items.length === 0) return undefined;
  const named = items.map((item) => `#${item.index} "${item.text}"`).join("; ");
  return `${label}: ${items.length} of ${total} unchecked (${named})`;
}

/**
 * Contract §5 (opum-cli-e2e's check.stderrSilentOnSuccess) tolerates a
 * "warning"-prefixed line on an otherwise successful stderr, which is exactly
 * the channel this needs: exit 0 and the record stay a genuine success, but
 * the gap does not go unmentioned the way it did before QCLI-252.
 */
function completionWarning(
  task: {
    readonly id: string;
    readonly acceptanceCriteria: readonly ChecklistEntry[];
    readonly definitionOfDone: readonly ChecklistEntry[];
  },
  unresolved: {
    readonly acceptanceCriteria: readonly UnresolvedChecklistItem[];
    readonly definitionOfDone: readonly UnresolvedChecklistItem[];
  },
): string {
  const parts = [
    describeUnresolved(
      "acceptance criteria",
      task.acceptanceCriteria.length,
      unresolved.acceptanceCriteria,
    ),
    describeUnresolved(
      "definition of done",
      task.definitionOfDone.length,
      unresolved.definitionOfDone,
    ),
  ].filter((part): part is string => part !== undefined);
  return `Warning: task ${task.id} completed with unresolved checklist items -- ${parts.join("; ")}. This does not block completion; see quest instructions task-finalization.`;
}

/** Merges human help content into manifest entries for `quest help` output
 * only; `commandManifest`/`quest manifest` are never touched. Flags carry
 * their value shape (QCLI-266): a bare list of flag names cannot tell a
 * reader that `--label` is repeated per item while `--acceptance-criteria`
 * takes one JSON array, and getting that wrong is a usage error the caller
 * only learns about after the fact. */
function withHelp(entries: typeof commandManifest.commands) {
  return entries.map((entry) => {
    const help = commandHelp[entry.name];
    return {
      ...entry,
      ...help,
      ...(help
        ? { flags: help.flags.map((flag) => describeFlag(flag, entry.name)) }
        : {}),
    };
  });
}

class FlagUsageError extends Error {}

function resolveOutputModes(argv: readonly string[]): {
  readonly arguments: readonly string[];
  readonly json: boolean;
  readonly plain: boolean;
} {
  let json = false;
  let plain = false;
  const arguments_: string[] = [];
  for (const argument of argv) {
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--plain") {
      plain = true;
      continue;
    }
    arguments_.push(argument);
  }
  return { arguments: arguments_, json, plain };
}

function flags(
  argv: readonly string[],
  repeatableValueFlags: readonly string[] = [],
):
  | {
      readonly values: Map<string, string[]>;
      readonly json: boolean;
      readonly plain: boolean;
    }
  | undefined {
  const values = new Map<string, string[]>();
  const json = argv.includes("--json");
  const plain = argv.includes("--plain");
  const repeatable = new Set(repeatableValueFlags);
  const booleanFlags = new Set<string>(BOOLEAN_FLAGS);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const equals = argument?.indexOf("=") ?? -1;
    const flag = equals === -1 ? argument : argument?.slice(0, equals);
    const inlineValue = equals === -1 ? undefined : argument?.slice(equals + 1);
    if (flag === "--json") {
      if (inlineValue !== undefined)
        throw new FlagUsageError("--json does not take a value.");
      continue;
    }
    if (flag === "--plain") {
      if (inlineValue !== undefined)
        throw new FlagUsageError("--plain does not take a value.");
      continue;
    }
    if (!flag?.startsWith("--")) return undefined;
    if (booleanFlags.has(flag)) {
      if (inlineValue !== undefined)
        throw new FlagUsageError(`${flag} does not take a value.`);
      if (values.has(flag))
        throw new FlagUsageError(`${flag} may only be provided once.`);
      values.set(flag, []);
      continue;
    }
    const value = inlineValue ?? argv[index + 1];
    if (
      value === undefined ||
      (inlineValue === undefined && value.startsWith("--"))
    )
      throw new FlagUsageError(
        `${flag} requires a value; use ${flag}=<value> if the value begins with --.`,
      );
    const entries = values.get(flag) ?? [];
    if (entries.length > 0 && !repeatable.has(flag))
      throw new FlagUsageError(`${flag} may only be provided once.`);
    entries.push(value);
    values.set(flag, entries);
    if (inlineValue === undefined) index += 1;
  }
  return { values, json, plain };
}

function one(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string | undefined {
  const values = parsed.values.get(name);
  if (!values) return undefined;
  if (values.length !== 1)
    throw new FlagUsageError(`${name} may only be provided once.`);
  return values[0];
}

function only(
  parsed: NonNullable<ReturnType<typeof flags>>,
  allowed: readonly string[],
): boolean {
  return unknownFlags(parsed, allowed).length === 0;
}

/**
 * Flags the caller passed that are not in `allowed` (QCLI-270). `only()`
 * collapses this to a boolean, which is enough to reject a call but not
 * enough to say why: every one of `only()`'s call sites paired a failed
 * check with one fixed usage sentence regardless of which flag actually
 * caused it, so a caller who supplied a valid reference and a fully-formed
 * actor was still told the reference or actor was missing (`task complete
 * --final-summary ...` was the reported case). `usageFailure` below reads
 * this to name the actual flag instead.
 */
function unknownFlags(
  parsed: NonNullable<ReturnType<typeof flags>>,
  allowed: readonly string[],
): string[] {
  return [...parsed.values.keys()].filter((flag) => !allowed.includes(flag));
}

/**
 * Shared usage-failure formatter for the `!parsed || !only(parsed, allowed)`
 * idiom repeated across this file's command dispatch (QCLI-270). When the
 * rejection is caused by one or more flags outside `allowed`, names them
 * explicitly instead of falling back to `fallback` -- the generic sentence
 * every call site used to hardcode regardless of cause, which reads as a
 * missing reference or actor even when both were supplied correctly and the
 * real problem was an unrecognized flag. Any other rejection reason (a
 * missing reference, an unparseable argument list, a flag-less command given
 * something it does not accept at all) still gets `fallback`, since there is
 * no flag to name.
 *
 * Only covers the direct `if (!parsed || !only(...)) return failure(...)`
 * shape. A handful of call sites (the `migration backlog`, `milestone`/
 * `decision`, and `draft` action dispatchers) instead gate each action with
 * a *positive* `only()` check and cascade past all of them to one shared
 * bottom-of-group fallback message on failure; by the time execution reaches
 * that fallback, which action's allowed-list (if any) was actually being
 * evaluated is no longer known, so this helper does not reach them. That is
 * a structural gap, not an oversight -- see QCLI-270's implementation notes.
 */
function usageFailure(
  parsed: NonNullable<ReturnType<typeof flags>> | undefined,
  allowed: readonly string[],
  fallback: string,
): InvocationResult {
  const unknown = parsed ? unknownFlags(parsed, allowed) : [];
  if (unknown.length === 0) return failure("usage", fallback);
  const word = unknown.length === 1 ? "flag" : "flags";
  const accepted = allowed.length > 0 ? allowed.join(", ") : "--json, --plain";
  return failure(
    "usage",
    `Unrecognized ${word} ${unknown.join(", ")}. Accepted flags: ${accepted}.`,
  );
}

/** Resolves the bare `quest agents` command's persisted skill-source setting.
 * An uninitialized workspace (no `quest init` yet) defaults to today's
 * behavior ("repo") rather than failing `agents --check` outright, since
 * that command has never required initialization. Any other read failure
 * (e.g. a malformed agents.skill_source value) still propagates. */
async function resolveAgentSkillSource(cwd: string): Promise<AgentSkillSource> {
  try {
    const configuration = await resolveWorkspaceConfiguration(
      createWorkspacePort(),
      cwd,
    );
    return configuration.agentSkillSource ?? "repo";
  } catch (error) {
    if (error instanceof WorkspaceError && error.code === "not_initialized")
      return "repo";
    throw error;
  }
}

function stringValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string[] | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every((item) => typeof item === "string")
    )
      throw new Error("not a string array");
    return parsedValue;
  } catch {
    throw new FlagUsageError(`${name} must be a JSON array of strings.`);
  }
}

function checkListValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): (string | { index: number; text: string; checked: boolean })[] | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    const items = parsedValue as readonly unknown[];
    if (
      !Array.isArray(parsedValue) ||
      !items.every(
        (item) =>
          typeof item === "string" ||
          (!!item &&
            typeof item === "object" &&
            Number.isInteger((item as Record<string, unknown>).index) &&
            ((item as Record<string, unknown>).index as number) >= 0 &&
            typeof (item as Record<string, unknown>).text === "string" &&
            typeof (item as Record<string, unknown>).checked === "boolean"),
      )
    )
      throw new Error("not a check list");
    return items as (
      | string
      | { index: number; text: string; checked: boolean }
    )[];
  } catch {
    throw new FlagUsageError(
      `${name} must be a JSON array of strings or {index,text,checked} items.`,
    );
  }
}

/**
 * Parses repeatable 1-based checklist positions (QCLI-138). Anything that is
 * not a positive integer is a usage error here rather than a silent no-op, so
 * `--check-ac 0` or `--check-ac two` never quietly leaves the box unchecked.
 */
function indexListValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): number[] | undefined {
  const values = parsed.values.get(name);
  if (values === undefined) return undefined;
  return values.map((value) => {
    if (!/^[1-9][0-9]*$/.test(value))
      throw new FlagUsageError(`${name} must be a 1-based positive integer.`);
    const parsedValue = Number(value);
    if (!Number.isSafeInteger(parsedValue))
      throw new FlagUsageError(`${name} must be a 1-based positive integer.`);
    return parsedValue;
  });
}

function commentsValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
):
  | { id: string; authorId: string; body: string; createdAt: string }[]
  | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    const items = parsedValue as readonly unknown[];
    if (
      !Array.isArray(parsedValue) ||
      !items.every(
        (item) =>
          !!item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).id === "string" &&
          typeof (item as Record<string, unknown>).authorId === "string" &&
          typeof (item as Record<string, unknown>).body === "string" &&
          typeof (item as Record<string, unknown>).createdAt === "string",
      )
    )
      throw new Error("not a comment array");
    return items as {
      id: string;
      authorId: string;
      body: string;
      createdAt: string;
    }[];
  } catch {
    throw new FlagUsageError(
      `${name} must be a JSON array of {id,authorId,body,createdAt} comments.`,
    );
  }
}

function ordinalValue(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new FlagUsageError("--ordinal must be an integer.");
  return Number(value);
}

const TASK_LIST_SORT_FIELDS = [
  "id",
  "title",
  "status",
  "priority",
  "type",
  "ordinal",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Splits a repeatable selection flag that also accepts one comma-separated
 * value, matching the tracker Quest is at parity with. Blank members are
 * dropped so a trailing comma is not a filter for the empty string.
 */
/**
 * QCLI-250: a fixed set of `task create`/`task edit` flags -- --label,
 * --doc, --alias, --assignee, --reference, --modified-file, --dependency,
 * their matching --add-.../--remove-... edit counterparts, and
 * --remove-comment -- take one raw value per flag occurrence; repeat the
 * flag for multiple values.
 * That is a DIFFERENT convention from --acceptance-criteria/--labels/--plan/
 * --notes, which take a single JSON-array-string occurrence instead. A
 * caller who reaches for the JSON-array form here by analogy previously got
 * silent corruption: the whole array-string was stored as one malformed
 * entry, with no error. These are id/path/name fields, so a value that
 * happens to parse as valid JSON is essentially never the caller's real
 * intent -- reject it loud instead of guessing which convention was meant.
 * Deliberately NOT applied to --add-plan/--remove-plan/--add-note/
 * --remove-note/--append-final-summary/--add-comment: those are free-text
 * fields where genuine content starting with `[` is plausible, and
 * --add-comment already requires and validates a JSON payload.
 */
function rejectArrayLookingValue(
  flag: string,
  values: readonly string[] | undefined,
): void {
  for (const value of values ?? []) {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      continue;
    }
    if (Array.isArray(parsedValue))
      throw new FlagUsageError(
        `${flag} takes one value per occurrence, not a JSON array -- repeat the flag instead (e.g. ${flag} a ${flag} b).`,
      );
  }
}

function csvValues(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string[] | undefined {
  const values = parsed.values.get(name);
  if (values === undefined) return undefined;
  const members = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (members.length === 0)
    throw new FlagUsageError(`${name} requires at least one value.`);
  return members;
}

/** Parses `--sort <field>[:asc|desc]`; default direction is ascending. */
function sortValue(
  value: string | undefined,
): { readonly field: string; readonly direction: "asc" | "desc" } | undefined {
  if (value === undefined) return undefined;
  const [field, direction, ...rest] = value.split(":");
  if (
    rest.length > 0 ||
    !field ||
    !(TASK_LIST_SORT_FIELDS as readonly string[]).includes(field) ||
    (direction !== undefined && direction !== "asc" && direction !== "desc")
  )
    throw new FlagUsageError(
      `--sort must be one of ${TASK_LIST_SORT_FIELDS.join(", ")}, optionally suffixed with :asc or :desc.`,
    );
  return { field, direction: direction === "desc" ? "desc" : "asc" };
}

/** Shared by every flag whose value must be a positive integer (`--limit`, `--max-notes`). */
function positiveIntegerValue(
  value: string | undefined,
  flagName: string,
): number | undefined {
  if (value === undefined) return undefined;
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new FlagUsageError(`${flagName} must be a positive integer.`);
  return Number(value);
}

function limitValue(value: string | undefined): number | undefined {
  return positiveIntegerValue(value, "--limit");
}

/**
 * QCLI-276: caps `task view`'s `implementationNotes` to the most recent N
 * entries. Reuses `--limit`'s exact positive-integer grammar (QCLI-276's
 * task brief: check `task list`'s `--limit` before committing to a shape) --
 * a distinct helper only so the error message names `--max-notes`.
 */
function maxNotesValue(value: string | undefined): number | undefined {
  return positiveIntegerValue(value, "--max-notes");
}

function updatedMilestoneTaskIds(
  current: readonly string[],
  parsed: NonNullable<ReturnType<typeof flags>>,
): readonly string[] {
  const replacement = parsed.values.get("--replace-task");
  const additions = parsed.values.get("--add-task") ?? [];
  const removals = parsed.values.get("--remove-task") ?? [];
  if (replacement && (additions.length > 0 || removals.length > 0))
    throw new FlagUsageError(
      "--replace-task cannot be combined with --add-task or --remove-task.",
    );
  const removed = new Set(removals);
  if (additions.some((taskId) => removed.has(taskId)))
    throw new FlagUsageError(
      "--add-task and --remove-task cannot name the same task.",
    );
  const result: string[] = [];
  const add = (taskId: string) => {
    if (!result.includes(taskId)) result.push(taskId);
  };
  for (const taskId of replacement ?? current) add(taskId);
  if (!replacement) {
    for (const taskId of additions) add(taskId);
    return result.filter((taskId) => !removed.has(taskId));
  }
  return result;
}

function createTaskReader(root: string): LocalTaskRepository {
  return new LocalTaskRepository(join(root, ".quest", "tasks"));
}

async function taskStoreRoot(): Promise<string> {
  if (process.env.QUEST_TASK_STORE !== undefined)
    return process.env.QUEST_TASK_STORE;
  return (
    await resolveInitializedWorkspace(createWorkspacePort(), process.cwd())
  ).worktreePath;
}

function actor(parsed: NonNullable<ReturnType<typeof flags>>) {
  const id = one(parsed, "--actor");
  const kind = one(parsed, "--actor-kind");
  if (kind !== undefined && kind !== "human" && kind !== "delegated-agent")
    throw new FlagUsageError(
      `--actor-kind "${kind}" is not a valid actor kind. Use "human" or "delegated-agent".`,
    );
  if (!id || kind === undefined) return undefined;
  const accountableHumanId = one(parsed, "--accountable-human");
  if (kind === "delegated-agent" && !accountableHumanId) return undefined;
  return {
    id,
    kind,
    ...(accountableHumanId ? { accountableHumanId } : {}),
  } as const;
}

/** Subdirectories, relative to `<workspaceRoot>/.quest`, a task record can
 * live in across its lifecycle -- must track local-task-repository.ts's own
 * layout, or an id retained there would be invisible to this scan too. */
const TASK_RECORD_SUBDIRECTORIES = ["tasks", "completed", "archive/tasks"];

/**
 * QCLI-279: the working tree only shows what THIS ref's `.quest/tasks`
 * happens to contain. A sibling branch carrying an unmerged task record, or
 * a detached HEAD sitting behind a branch that has since moved, both hide a
 * higher id from a scan of the working tree alone -- and allocating from the
 * tree alone then mints a silent duplicate (reproduced three times on this
 * task's own filing; see its implementation notes). Local refs are cheap to
 * check -- a tree listing per ref, not a history walk -- and this covers
 * every reproduced trigger, because the branch or tag that actually carries
 * the newer record is always among them.
 *
 * Degrades to 0 wherever `root` is not a Git working directory, or Git is
 * not installed at all: `listRefs`/`listFiles` return `[]` for a non-zero
 * Git exit (same defensive contract `local-git.ts` already keeps
 * everywhere else), and the outer try/catch below also covers a Git binary
 * that cannot be spawned in the first place -- the same broad-catch shape
 * `createTaskBindingModel` (composition.ts) already uses around its own
 * `readRevision("HEAD")` call for exactly this reason. Either way, a plain
 * (non-Git) `.quest` directory keeps today's local-only behavior exactly.
 */
async function highestSequenceOnOtherRefs(
  git: ReturnType<typeof createGitPort>,
  root: string,
  marker: string,
): Promise<number> {
  try {
    const refs = await git.listRefs(root);
    const filesByRef = await Promise.all(
      refs.map(async (ref) => {
        const filesBySubdirectory = await Promise.all(
          TASK_RECORD_SUBDIRECTORIES.map((subdirectory) =>
            git.listFiles(root, ref, `.quest/${subdirectory}`),
          ),
        );
        return filesBySubdirectory.flat();
      }),
    );
    let highest = 0;
    for (const file of filesByRef.flat()) {
      const name = file.slice(file.lastIndexOf("/") + 1);
      if (!name.startsWith(marker) || !name.endsWith(".json")) continue;
      const numeric = Number(
        name.slice(marker.length, name.length - ".json".length),
      );
      if (Number.isSafeInteger(numeric)) highest = Math.max(highest, numeric);
    }
    return highest;
  } catch {
    return 0;
  }
}

async function nextTaskId(
  tasks: TaskService,
  prefix: string,
  git: ReturnType<typeof createGitPort>,
  root: string,
): Promise<string> {
  const ids = await tasks.listIncludingRetained();
  // Only this prefix's own family can advance the counter: a foreign-prefixed
  // id (an imported record, or a workspace whose prefix changed) must never
  // perturb the sequence.
  const marker = `${prefix}-`;
  const localHighest = ids.reduce((maximum, task) => {
    if (!task.id.startsWith(marker)) return maximum;
    const numeric = Number(task.id.slice(marker.length));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  const highest = Math.max(
    localHighest,
    await highestSequenceOnOtherRefs(git, root, marker),
  );
  return `${prefix}-${highest + 1}`;
}

/**
 * QCLI-265: draft reads carry the draft's own fields with `location` inline,
 * the shape `task view`/`task list` already use for `path`. They used to be
 * the repository's `{draft, location}` pair, which made `draft view` the only
 * read in the CLI where the record was not the payload.
 *
 * `location` is kept under that name rather than renamed to `path` on purpose:
 * it is the field drafts already exposed, it is what `--include-archived`
 * callers distinguish on, and a rename would be a second break for no gain.
 */
function flattenLocatedDraft(
  located: LocatedDraft,
): LocatedDraft["draft"] & { readonly location: LocatedDraft["location"] } {
  return { ...located.draft, location: located.location };
}

async function nextDraftId(tasks: TaskService): Promise<string> {
  const drafts = await tasks.listDrafts(true);
  const highest = drafts.reduce((maximum, record) => {
    const numeric = Number(record.draft.id.slice(2));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `D-${highest + 1}`;
}

/** Asks one question on the real terminal and returns the trimmed answer, or
 * defaultValue when the answer is empty. Swapped out in tests. */
async function readlinePrompt(
  question: string,
  defaultValue: string,
): Promise<string> {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [${defaultValue}]: `);
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
}

export interface InitWizardInstructionFileOption {
  readonly label: string;
  readonly value: AgentInstructionTarget;
}

export interface InitWizardPrompts {
  readonly text: (question: string, defaultValue: string) => Promise<string>;
  /** Returns the selected targets, or undefined if the user cancelled
   * (Ctrl+C) -- distinct from an empty array, which is a deliberate "write
   * nothing" answer and not a cancellation. */
  readonly selectInstructionFiles: (
    options: readonly InitWizardInstructionFileOption[],
  ) => Promise<readonly AgentInstructionTarget[] | undefined>;
}

export interface InitWizardAnswers {
  readonly name: string;
  readonly taskIdPrefix: string;
  readonly targets: readonly AgentInstructionTarget[];
}

/**
 * QCLI-255: a single multi-select replaces the prior yes/no question chain
 * (QCLI-254's "write instructions?" then "claude or codex?"), matching the
 * user's direct request and Backlog.md's reference shape -- agreed with
 * lore-cli so quest init and lore init present the same interaction on the
 * same question, which is the asymmetry the user actually noticed. Nothing
 * is pre-checked (reversing this task's own initial pre-check-claude
 * choice, per the orchestrator): the user's own wording was "they can
 * select and install the ones they want" -- active selection, not
 * deselection. A bare Enter writes nothing, matching lore-cli's parallel
 * reversal of its own pre-select-all default.
 *
 * Returns undefined when the user cancels -- the caller must not treat that
 * as "select nothing" and must not create a partial workspace.
 *
 * The interactive quest init question set, isolated from real readline/TTY
 * so it can run against a fake prompt in tests.
 */
export async function runInitWizard(
  defaultName: string,
  prompts: InitWizardPrompts,
): Promise<InitWizardAnswers | undefined> {
  const name = await prompts.text("Project name", defaultName);
  const taskIdPrefix =
    (await prompts.text("Task ID prefix", "T")).trim() || "T";
  const targets = await prompts.selectInstructionFiles([
    { label: "CLAUDE.md — Claude Code", value: "claude" },
    {
      label:
        "AGENTS.md — Codex, Cursor, Zed, Warp, Aider, RooCode, OpenCode, pi, and other AGENTS.md-reading tools (Antigravity also reads this as an alternative to GEMINI.md)",
      value: "codex",
    },
    {
      label: "GEMINI.md — Google Antigravity, Gemini CLI",
      value: "antigravity",
    },
  ]);
  if (targets === undefined) return undefined;
  return { name, taskIdPrefix, targets };
}

/** Real multiselect prompt via @clack/prompts, wired to the wizard's
 * selectInstructionFiles seam. Isolated here (rather than inline at the call
 * site) so the cancel/message wiring is exercised by nothing but a real
 * terminal, matching readlinePrompt's separation from runInitWizard. */
async function clackSelectInstructionFiles(
  options: readonly InitWizardInstructionFileOption[],
): Promise<readonly AgentInstructionTarget[] | undefined> {
  const clack = await import("@clack/prompts");
  // QCLI-255 reversal: nothing pre-checked. The user's own wording was
  // "they can select and install the ones they want" -- active selection,
  // not deselection. Pre-checking anything (even one, even just claude)
  // inverts that into "here is what you are getting, remove what you do
  // not want", the same shape as the original complaint this task was
  // filed to fix. A bare Enter now writes nothing, an already-tested,
  // legitimate outcome under required: false. Matches lore-cli's parallel
  // reversal of its own pre-select-all default, coordinated directly.
  const result = await clack.multiselect({
    message: "Select instruction files to write (space toggles, enter accepts)",
    options: options.map((option) => ({
      label: option.label,
      value: option.value,
    })),
    required: false,
  });
  if (clack.isCancel(result)) {
    clack.cancel("Cancelled.");
    return undefined;
  }
  // multiselect's declared return type is `Value[] | symbol` (generic
  // symbol, not `typeof CANCEL_SYMBOL`), so isCancel's type guard narrows
  // the cancel branch but not this one -- the cast is safe because clack's
  // own contract is that a multiselect resolves to exactly the array or the
  // cancel symbol, never any other symbol.
  return result as AgentInstructionTarget[];
}

export interface InitInstructionsWriteResult {
  readonly instructions?: AgentInstructionCheck;
  readonly instructionsByTarget?: Readonly<
    Record<string, AgentInstructionCheck>
  >;
  readonly skill?: AgentInstructionCheck;
}

/**
 * QCLI-255: extracted so the multi-target write path is directly testable
 * with a real temp directory -- it is only reachable through the
 * interactive wizard, which needs a live TTY the CLI-process test harness
 * cannot provide.
 *
 * `interactiveTargets` is set only by the wizard (undefined means "the
 * scripted --target/--agent-instructions path"). The scripted path and an
 * interactive selection of exactly one file both keep the original
 * single-object `instructions` shape, byte-identical to before QCLI-255 --
 * every existing --target caller is unaffected. Only an interactive
 * selection of two files (only reachable through the wizard; --target
 * accepts one value) uses the additive `instructionsByTarget` field.
 */
export async function writeInitInstructions(
  agentInstructionPort: Parameters<typeof updateQuestAgentInstructions>[0],
  interactiveTargets: readonly AgentInstructionTarget[] | undefined,
  scriptedTarget: AgentInstructionTarget | undefined,
  agentSkillSource: AgentSkillSource | undefined,
): Promise<InitInstructionsWriteResult> {
  let instructions: AgentInstructionCheck | undefined;
  let instructionsByTarget: Record<string, AgentInstructionCheck> | undefined;
  if (interactiveTargets !== undefined && interactiveTargets.length > 1) {
    const written: Record<string, AgentInstructionCheck> = {};
    for (const perTarget of interactiveTargets)
      written[perTarget] = await updateQuestAgentInstructions(
        agentInstructionPort,
        agentInstructionPathForTarget(perTarget),
        perTarget,
      );
    instructionsByTarget = written;
  } else {
    const resolvedTarget = interactiveTargets?.[0] ?? scriptedTarget;
    instructions = await updateQuestAgentInstructions(
      agentInstructionPort,
      agentInstructionPathForTarget(resolvedTarget),
      resolvedTarget,
    );
  }
  // QCLI-254: "explicit beats config" holds only against a PERSISTED
  // agents.skillSource -- an --agent-instructions request overrides a prior
  // init's/reconfigure's saved opt-out. It does not extend to an explicit
  // --skill-source given on this SAME command line: that is explicit versus
  // explicit, not explicit versus config, and between two explicit
  // instructions in the same breath the more specific one wins. "Do not
  // generate a skill here" is more specific than "set up agent
  // instructions", so skip the write. The skill file is Claude-specific but
  // not per-target: it is written once whenever any instructions were
  // written, regardless of which/how many targets were selected (unchanged
  // from QCLI-254). QCLI-309: "none" skips for the same reason "plugin"
  // does -- both declare this repository generates no skill file, and they
  // differ only in what they assert ships instead.
  const skill =
    agentSkillSource === undefined || generatesQuestSkillFile(agentSkillSource)
      ? await updateQuestSkillFile(agentInstructionPort)
      : undefined;
  return { instructions, instructionsByTarget, skill };
}

async function nextPlanningId(
  planning: PlanningService,
  prefix: "M" | "DEC",
): Promise<string> {
  // Archived milestones keep their ids, so allocation must see them: listing
  // only the live ones would hand out an id that already exists.
  const records =
    prefix === "M"
      ? await planning.listMilestones(true)
      : await planning.listDecisions();
  const highest = records.reduce((maximum, record) => {
    const numeric = Number(record.id.slice(prefix.length + 1));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `${prefix}-${highest + 1}`;
}

/** Executes the stable public tracker CLI against repository-local task storage. */
export async function runQuest(
  input: readonly string[],
  stdoutIsTty: boolean,
  stdinIsTty: boolean = process.stdin.isTTY === true,
): Promise<InvocationResult> {
  try {
    const resolvedModes = resolveOutputModes(input);
    const arguments_ = resolvedModes.arguments;
    if (
      arguments_.length === 1 &&
      ["--version", "version"].includes(arguments_[0] ?? "")
    )
      return { stdout: `${VERSION}\n`, stderr: "", exitCode: 0 };
    const modeFor = (parsed?: NonNullable<ReturnType<typeof flags>>) =>
      selectOutputMode({
        json: resolvedModes.json || parsed?.json,
        plain: resolvedModes.plain || parsed?.plain,
        stdoutIsTty,
      });
    let root: Promise<string> | undefined;
    const resolvedRoot = () => (root ??= taskStoreRoot());
    const git = createGitPort();
    const taskService = async () => createTaskService(await resolvedRoot());
    const taskReader = async () => createTaskReader(await resolvedRoot());
    const planningService = async () =>
      createPlanningService(await resolvedRoot());
    let taskIdPrefix: Promise<string> | undefined;
    const configuredTaskIdPrefix = () =>
      (taskIdPrefix ??= (async () => {
        if (process.env.QUEST_TASK_STORE !== undefined) return "T";
        try {
          const configuration = await resolveWorkspaceConfiguration(
            createWorkspacePort(),
            process.cwd(),
          );
          return configuration.taskIdPrefix ?? "T";
        } catch {
          return "T";
        }
      })());
    if (arguments_.length === 0) {
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands: withHelp(commandManifest.commands) },
        },
        modeFor(),
        HELP_PRIORITY_KEYS,
      );
    }
    const helpFlagIndex = arguments_.findIndex(
      (argument) => argument === "--help" || argument === "-h",
    );
    const helpWordLeading = arguments_[0] === "help";
    if (helpWordLeading || helpFlagIndex !== -1) {
      const helpArguments = arguments_;
      const topicWords = helpWordLeading
        ? helpArguments.slice(1)
        : helpArguments.slice(0, helpFlagIndex);
      const extraWords = helpWordLeading
        ? []
        : helpArguments.slice(helpFlagIndex + 1);
      if (extraWords.length > 0)
        return failure("usage", "help accepts at most one topic.");
      const helpTarget =
        topicWords.length > 0 ? topicWords.join(" ") : undefined;
      const parsed = flags([]);
      if (!parsed || !only(parsed, []))
        return failure("usage", "help accepts only --json and --plain.");
      const matched = helpTarget
        ? commandManifest.commands.filter(
            (entry) =>
              entry.name === helpTarget ||
              entry.name.startsWith(`${helpTarget} `),
          )
        : commandManifest.commands;
      if (helpTarget && matched.length === 0)
        return failure("not_found", `No help is available for ${helpTarget}.`);
      const commands = withHelp(matched);
      const details = {
        valueSyntax:
          "Use --flag=<value> to pass a value that begins with --; the value is preserved exactly after the first =.",
        ...(helpTarget === "agents"
          ? {
              usage:
                "quest agents --check [--require-installed] [--target claude|codex|antigravity] | --update-instructions [--target claude|codex|antigravity] [--force]",
              check:
                "--check reports missing without failing unless --require-installed is present; strict missing exits 6.",
              drift: "Drift or malformed managed markers exit 6.",
              target:
                "--target selects codex (AGENTS.md, the default) or claude (CLAUDE.md); each call checks or updates exactly one file.",
              force:
                'When this workspace\'s agents.skill_source is "plugin" or "none", a leftover .claude/skills/quest/SKILL.md reports as drift; --force removes it only if its bytes exactly match the generated content, never a hand-edited file.',
              skillSource:
                'The skill file is target-independent and governed by agents.skill_source, not --target: "repo" (default) generates it, "plugin" declares it ships from the opum-quest Claude Code plugin, "none" declares this workspace has no quest skill file at all. Set it with `quest init --skill-source <value>`, or on an existing workspace with `quest init --reconfigure --skill-source <value>`.',
            }
          : {}),
      };
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands, details },
        },
        modeFor(parsed),
        HELP_PRIORITY_KEYS,
      );
    }
    if (arguments_[0] === "init") {
      const parsed = flags(arguments_.slice(1));
      const initFlags = [
        "--agent-instructions",
        "--name",
        "--task-id-prefix",
        "--reconfigure",
        "--target",
        "--skill-source",
      ];
      if (!parsed || !only(parsed, initFlags))
        return usageFailure(
          parsed,
          initFlags,
          "init accepts only --name, --task-id-prefix, --agent-instructions, --target, --skill-source, --reconfigure, --json, and --plain.",
        );
      const targetValue = one(parsed, "--target");
      if (
        targetValue !== undefined &&
        targetValue !== "claude" &&
        targetValue !== "codex" &&
        targetValue !== "antigravity"
      )
        return failure(
          "usage",
          `--target must be "claude", "codex", or "antigravity", got "${targetValue}".`,
        );
      if (
        targetValue !== undefined &&
        !parsed.values.has("--agent-instructions")
      )
        return failure("usage", "--target requires --agent-instructions.");
      const target = targetValue as AgentInstructionTarget | undefined;
      const skillSourceValue = one(parsed, "--skill-source");
      if (
        skillSourceValue !== undefined &&
        skillSourceValue !== "repo" &&
        skillSourceValue !== "plugin" &&
        skillSourceValue !== "none"
      )
        return failure(
          "usage",
          `--skill-source must be "repo", "plugin", or "none", got "${skillSourceValue}".`,
        );
      const agentSkillSource = skillSourceValue as AgentSkillSource | undefined;
      const reconfigure = parsed.values.has("--reconfigure");
      if (
        reconfigure &&
        !parsed.values.has("--name") &&
        !parsed.values.has("--task-id-prefix") &&
        !parsed.values.has("--skill-source")
      )
        return failure(
          "usage",
          "--reconfigure requires --name, --task-id-prefix, and/or --skill-source.",
        );
      const explicitFlagsGiven =
        parsed.values.has("--agent-instructions") ||
        parsed.values.has("--name") ||
        parsed.values.has("--task-id-prefix") ||
        parsed.values.has("--skill-source");
      const explicitOutputMode =
        resolvedModes.json ||
        resolvedModes.plain ||
        parsed.json ||
        parsed.plain;
      // --reconfigure updates an existing workspace; the interactive wizard
      // is shaped around a fresh workspace's three questions and does not
      // fit that, so it never applies here regardless of TTY state.
      const interactive =
        !reconfigure &&
        stdoutIsTty &&
        stdinIsTty &&
        !explicitOutputMode &&
        !explicitFlagsGiven;
      let name = one(parsed, "--name");
      let taskIdPrefix = one(parsed, "--task-id-prefix");
      let writeInstructions = parsed.values.has("--agent-instructions");
      // QCLI-255: set only by the interactive wizard, which can select zero,
      // one, or both instruction files -- undefined here means "the
      // scripted --target/--agent-instructions path", not "none selected".
      let interactiveTargets: readonly AgentInstructionTarget[] | undefined;
      if (interactive) {
        const answers = await runInitWizard(basename(process.cwd()), {
          text: readlinePrompt,
          selectInstructionFiles: clackSelectInstructionFiles,
        });
        // Cancelled: exit cleanly with no partial workspace state. clack's
        // own cancel() already printed the message; initializeWorkspace has
        // not run yet, so nothing was written.
        if (answers === undefined)
          return { stdout: "", stderr: "", exitCode: 0 };
        name = answers.name;
        taskIdPrefix = answers.taskIdPrefix;
        interactiveTargets = answers.targets;
        writeInstructions = answers.targets.length > 0;
      }
      // Fail at init rather than at the first task write, which is where an
      // unusable prefix would otherwise surface.
      if (taskIdPrefix !== undefined && !isValidTaskIdPrefix(taskIdPrefix))
        return failure(
          "usage",
          `Task ID prefix must start with a letter and contain only letters and digits: ${taskIdPrefix}`,
        );
      const workspace = reconfigure
        ? await reconfigureWorkspace(createWorkspacePort(), process.cwd(), {
            name,
            taskIdPrefix,
            agentSkillSource,
          })
        : await initializeWorkspace(createWorkspacePort(), process.cwd(), {
            name,
            taskIdPrefix,
            agentSkillSource,
          });
      let instructions: AgentInstructionCheck | undefined;
      let instructionsByTarget:
        | Readonly<Record<string, AgentInstructionCheck>>
        | undefined;
      let skill: AgentInstructionCheck | undefined;
      if (writeInstructions) {
        const agentInstructionPort = createAgentInstructionPort(process.cwd());
        ({ instructions, instructionsByTarget, skill } =
          await writeInitInstructions(
            agentInstructionPort,
            interactiveTargets,
            target,
            agentSkillSource,
          ));
      }
      return output(
        {
          schemaVersion: 1,
          kind: reconfigure
            ? "workspace.reconfigured"
            : "workspace.initialized",
          data: {
            workspace,
            configuration: { name, taskIdPrefix, agentSkillSource },
            instructions,
            instructionsByTarget,
            skill,
          },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "instructions") {
      // Any leading dash is a flag, not a guide name: `-x` must be a usage
      // error like every other malformed flag, not "unknown guide -x".
      const requested = arguments_[1]?.startsWith("-")
        ? undefined
        : arguments_[1];
      const parsed = flags(arguments_.slice(requested ? 2 : 1));
      if (!parsed || !only(parsed, ["--list"]))
        return usageFailure(
          parsed,
          ["--list"],
          "instructions accepts one guide name, --list, --json, and --plain.",
        );
      if (requested && parsed.values.has("--list"))
        return failure(
          "usage",
          "instructions takes a guide name or --list, not both.",
        );
      if (parsed.values.has("--list"))
        return output(
          {
            schemaVersion: 1,
            kind: "agent.guides",
            data: {
              version: VERSION,
              guides: questGuides.map(({ name, summary }) => ({
                name,
                summary,
              })),
            },
          },
          modeFor(parsed),
        );
      if (requested) {
        const guide = findQuestGuide(requested);
        if (!guide)
          return failure(
            "not_found",
            `Unknown guide ${requested}.`,
            // Deliberately no "all" guide (QCLI-141): guides exist to be
            // loaded one at a time, and --list already covers discovery.
            {
              hint: `Run \`quest instructions --list\` to see the guides. There is no "all" guide; read the one that matches the work.`,
            },
          );
        return output(
          {
            schemaVersion: 1,
            kind: "agent.guide",
            data: {
              version: VERSION,
              name: guide.name,
              summary: guide.summary,
              content: guide.content,
            },
          },
          modeFor(parsed),
        );
      }
      // Bare `instructions` keeps returning the managed block: `agents
      // --check` and every existing caller depend on it byte for byte.
      return output(
        {
          schemaVersion: 1,
          kind: "agent.instructions",
          data: { version: VERSION, content: questAgentInstructions },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "agents") {
      const parsed = flags(arguments_.slice(1));
      const agentsFlags = [
        "--check",
        "--require-installed",
        "--update-instructions",
        "--target",
        "--force",
      ];
      if (!parsed || !only(parsed, agentsFlags))
        return usageFailure(
          parsed,
          agentsFlags,
          "agents requires --check or --update-instructions.",
        );
      const check = parsed.values.has("--check");
      const requireInstalled = parsed.values.has("--require-installed");
      const update = parsed.values.has("--update-instructions");
      const force = parsed.values.has("--force");
      if (check === update)
        return failure("usage", "agents requires exactly one action.");
      if (requireInstalled && !check)
        return failure("usage", "--require-installed requires --check.");
      const targetValue = one(parsed, "--target");
      if (
        targetValue !== undefined &&
        targetValue !== "claude" &&
        targetValue !== "codex" &&
        targetValue !== "antigravity"
      )
        return failure(
          "usage",
          `--target must be "claude", "codex", or "antigravity", got "${targetValue}".`,
        );
      const target = targetValue as AgentInstructionTarget | undefined;
      const instructionsPath = agentInstructionPathForTarget(target);
      const agentInstructionPort = createAgentInstructionPort(process.cwd());
      const agentSkillSource = await resolveAgentSkillSource(process.cwd());
      const instructionsResult = check
        ? await inspectQuestAgentInstructions(
            agentInstructionPort,
            instructionsPath,
            target,
          )
        : await updateQuestAgentInstructions(
            agentInstructionPort,
            instructionsPath,
            target,
          );
      const skillResult = check
        ? await inspectQuestSkillFile(
            agentInstructionPort,
            questSkillPath,
            agentSkillSource,
          )
        : await updateQuestSkillFile(
            agentInstructionPort,
            questSkillPath,
            agentSkillSource,
            force,
          );
      if (check) {
        if (instructionsResult.state === "drift")
          return failure("drift", instructionsResult.message);
        if (skillResult.state === "drift" || skillResult.state === "orphaned")
          return failure("drift", skillResult.message);
        if (
          requireInstalled &&
          (instructionsResult.state === "missing" ||
            skillResult.state === "missing")
        )
          return failure(
            "validation",
            `Quest agent instruction block is missing. Run quest agents --update-instructions${target ? ` --target ${target}` : ""}.`,
          );
      }
      return output(
        {
          schemaVersion: 1,
          kind: "agent.instructions-status",
          data: { ...instructionsResult, skill: skillResult },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "completion" && arguments_[1] === "bash") {
      const parsed = flags(arguments_.slice(2));
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          "completion bash accepts only --json and --plain.",
        );
      return output(
        {
          schemaVersion: 1,
          kind: "completion.script",
          data: {
            shell: "bash",
            script: `complete -W '${[...new Set(commandManifest.commands.flatMap((entry) => entry.name.split(" ")))].join(" ")}' quest`,
          },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "sqlite-smoke") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          "sqlite-smoke accepts only --json and --plain.",
        );
      const database = new Database(":memory:");
      try {
        const row = database.query("SELECT 1 AS value").get() as {
          readonly value: number;
        };
        return output(
          {
            schemaVersion: 1,
            kind: "sqlite.smoke",
            data: { value: row.value },
          },
          modeFor(parsed),
        );
      } finally {
        database.close();
      }
    }
    if (arguments_[0] === "migration-smoke") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          "migration-smoke accepts only --json and --plain.",
        );
      return output(await migrationSmokeResult(), modeFor(parsed));
    }
    if (arguments_[0] === "migration" && arguments_[1] === "backlog") {
      const action = arguments_[2];
      const parsed = flags(arguments_.slice(3));
      if (!action || !parsed)
        return failure("usage", "migration backlog requires a valid action.");
      const source = one(parsed, "--source");
      const digest = one(parsed, "--digest");
      const backlogDirectory = one(parsed, "--backlog-dir");
      const preserveSourceIds = parsed.values.has("--preserve-source-ids");
      const sourceFamily = one(parsed, "--source-family");
      const root = await resolvedRoot();
      if (preserveSourceIds !== Boolean(sourceFamily))
        return failure(
          "usage",
          "--preserve-source-ids and --source-family must be given together.",
        );
      if (sourceFamily !== undefined && !isValidTaskIdPrefix(sourceFamily))
        return failure(
          "usage",
          `--source-family must start with a letter and contain only letters and digits: ${sourceFamily}`,
        );
      const preservation = preserveSourceIds
        ? { family: sourceFamily as string }
        : undefined;
      if (
        action === "preview" &&
        source &&
        only(parsed, [
          "--source",
          "--backlog-dir",
          "--preserve-source-ids",
          "--source-family",
        ])
      )
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-preview",
            data: await createBacklogImportService(
              root,
              source,
              backlogDirectory,
              await configuredTaskIdPrefix(),
            ).preview(preservation),
          },
          modeFor(parsed),
        );
      if (
        action === "apply" &&
        source &&
        digest &&
        only(parsed, [
          "--source",
          "--digest",
          "--backlog-dir",
          "--preserve-source-ids",
          "--source-family",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        if (!actor(parsed))
          return failure(
            "denied",
            "Backlog migration writes require an explicit actor declaration.",
          );
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-applied",
            data: await createBacklogImportService(
              root,
              source,
              backlogDirectory,
              await configuredTaskIdPrefix(),
            ).apply(digest, preservation),
          },
          modeFor(parsed),
        );
      }
      if (action === "status" && digest && only(parsed, ["--digest"]))
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-status",
            data: await createBacklogImportService(root, "").status(digest),
          },
          modeFor(parsed),
        );
      if (
        action === "rollback" &&
        digest &&
        only(parsed, [
          "--digest",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        if (!actor(parsed))
          return failure(
            "denied",
            "Backlog migration writes require an explicit actor declaration.",
          );
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-rolled-back",
            data: await createBacklogImportService(root, "").rollback(digest),
          },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        "migration backlog requires preview --source, apply --source --digest, status --digest, or rollback --digest.",
      );
    }
    if (arguments_[0] === "manifest") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          "manifest accepts only --json and --plain.",
        );
      return output(manifestResult(), modeFor(parsed));
    }
    if (arguments_[0] === "board" && arguments_[1] === "export") {
      const target = arguments_[2];
      const parsed = flags(arguments_.slice(target ? 3 : 2));
      if (!target || !parsed || !only(parsed, ["--force"]))
        return usageFailure(
          parsed,
          ["--force"],
          "board export requires a target file and accepts only --force, --json, and --plain.",
        );
      // This writes outside .quest/, so it never clobbers silently.
      const alreadyThere = await stat(target).then(
        () => true,
        () => false,
      );
      if (!parsed.values.has("--force") && alreadyThere)
        return failure("conflict", `${target} already exists.`, {
          hint: "Pass --force to overwrite it.",
        });
      const planning = await planningService();
      const tasks = await taskService();
      const content = await planning.boardMarkdown(
        await taskReader(),
        tasks.lifecycle.statuses,
      );
      try {
        await writeFile(target, content, "utf8");
      } catch (error) {
        return failure(
          "validation",
          `Quest could not write ${target}: ${
            error instanceof Error ? error.message : "unknown error"
          }`,
          { hint: "Check that the parent directory exists and is writable." },
        );
      }
      return output(
        {
          schemaVersion: 1,
          kind: "project.board-export",
          data: { path: target, bytes: Buffer.byteLength(content, "utf8") },
        },
        modeFor(parsed),
      );
    }
    if (["overview", "board", "doctor"].includes(arguments_[0] ?? "")) {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          `${arguments_[0]} accepts only --json and --plain.`,
        );
      const planning = await planningService();
      const data =
        arguments_[0] === "overview"
          ? await planning.overview(await taskReader())
          : arguments_[0] === "board"
            ? await planning.board(await taskReader())
            : await planning.doctor(
                await taskReader(),
                (await taskService()).lifecycle,
              );
      const kind =
        arguments_[0] === "overview"
          ? "project.overview"
          : arguments_[0] === "board"
            ? "project.board"
            : "project.doctor";
      return output({ schemaVersion: 1, kind, data }, modeFor(parsed));
    }
    if (arguments_[0] === "cleanup") {
      const parsed = flags(arguments_.slice(1));
      const cleanupFlags = [
        "--dry-run",
        "--confirm",
        "--actor",
        "--actor-kind",
        "--accountable-human",
      ];
      if (!parsed || !only(parsed, cleanupFlags))
        return usageFailure(
          parsed,
          cleanupFlags,
          "cleanup accepts --dry-run or --confirm with an actor.",
        );
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Cleanup requires an explicit actor declaration.",
        );
      const confirmed = parsed.values.has("--confirm");
      const data = await (await planningService()).cleanup(
        { dryRun: parsed.values.has("--dry-run") || !confirmed, confirmed },
        crypto.randomUUID(),
      );
      return output(
        { schemaVersion: 1, kind: "project.cleanup", data },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "browser") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, ["--port"]))
        return usageFailure(
          parsed,
          ["--port"],
          "browser accepts --port, --json, and --plain.",
        );
      const requestedPort = one(parsed, "--port");
      const port = requestedPort === undefined ? 0 : Number(requestedPort);
      if (!Number.isInteger(port) || port < 0 || port > 65535)
        return failure(
          "usage",
          "browser --port must be an integer from 0 through 65535.",
        );
      const started = await startBrowserServer(
        {
          tasks: await taskReader(),
          planning: await planningService(),
        },
        { port },
      );
      return output(
        {
          schemaVersion: 1,
          kind: "browser.started",
          data: {
            host: started.host,
            port: started.port,
            overview: `http://${started.host}:${started.port}/overview`,
            board: `http://${started.host}:${started.port}/board`,
          },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "milestone" || arguments_[0] === "decision") {
      const group = arguments_[0];
      const action = arguments_[1];
      const rest = arguments_.slice(2);
      const isMilestone = group === "milestone";
      const parsed = flags(
        rest.slice(
          action === "create" ||
            action === "view" ||
            action === "edit" ||
            action === "delete" ||
            action === "archive"
            ? 1
            : 0,
        ),
        action === "create"
          ? ["--task"]
          : action === "edit" && isMilestone
            ? ["--add-task", "--remove-task", "--replace-task"]
            : [],
      );
      if (!action || !parsed)
        return failure("usage", `${group} requires a valid action.`);
      const planning = await planningService();
      if (
        action === "list" &&
        only(parsed, isMilestone ? ["--include-archived"] : [])
      ) {
        const data = isMilestone
          ? await planning.listMilestones(
              parsed.values.has("--include-archived"),
            )
          : await planning.listDecisions();
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.list" : "decision.list",
            data,
          },
          modeFor(parsed),
        );
      }
      if (action === "view" && rest[0] && only(parsed, [])) {
        const data = isMilestone
          ? await planning.viewMilestone(rest[0])
          : await planning.viewDecision(rest[0]);
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.view" : "decision.view",
            data,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "create" &&
        rest[0] &&
        only(parsed, [
          "--id",
          "--status",
          "--description",
          "--context",
          "--outcome",
          "--task",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const id =
          one(parsed, "--id") ??
          (await nextPlanningId(planning, isMilestone ? "M" : "DEC"));
        const result = isMilestone
          ? await planning.createMilestone(
              {
                id: id as `M-${number}`,
                title: rest[0],
                description: one(parsed, "--description"),
                status: (one(parsed, "--status") ?? "open") as
                  | "open"
                  | "closed",
                taskIds: parsed.values.get("--task") ?? [],
              },
              crypto.randomUUID(),
            )
          : await planning.createDecision(
              {
                id: id as `DEC-${number}`,
                title: rest[0],
                context: one(parsed, "--context"),
                outcome: one(parsed, "--outcome") ?? "Undecided",
                status: (one(parsed, "--status") ?? "proposed") as
                  | "proposed"
                  | "accepted"
                  | "superseded",
              },
              crypto.randomUUID(),
            );
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.created" : "decision.created",
            // QCLI-265: the record itself, not {record, result}. `result` is
            // the same mutation wrapper QCLI-264 unwrapped elsewhere.
            data: result.record,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "delete" &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const data = isMilestone
          ? await planning.deleteMilestone(rest[0], crypto.randomUUID())
          : await planning.deleteDecision(rest[0], crypto.randomUUID());
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.deleted" : "decision.deleted",
            data: data.record,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "edit" &&
        rest[0] &&
        only(parsed, [
          "--title",
          "--status",
          "--description",
          "--context",
          "--outcome",
          ...(isMilestone
            ? ["--add-task", "--remove-task", "--replace-task"]
            : []),
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const existingMilestone = isMilestone
          ? await planning.viewMilestone(rest[0])
          : undefined;
        const data = existingMilestone
          ? await planning.updateMilestone(
              {
                ...existingMilestone,
                ...(one(parsed, "--title")
                  ? { title: one(parsed, "--title") }
                  : {}),
                ...(one(parsed, "--description") !== undefined
                  ? { description: one(parsed, "--description") }
                  : {}),
                ...(one(parsed, "--status")
                  ? {
                      status: one(parsed, "--status") as "open" | "closed",
                    }
                  : {}),
                taskIds: updatedMilestoneTaskIds(
                  existingMilestone.taskIds,
                  parsed,
                ),
              },
              crypto.randomUUID(),
            )
          : await planning.updateDecision(
              {
                ...(await planning.viewDecision(rest[0])),
                ...(one(parsed, "--title")
                  ? { title: one(parsed, "--title") }
                  : {}),
                ...(one(parsed, "--context") !== undefined
                  ? { context: one(parsed, "--context") }
                  : {}),
                ...(one(parsed, "--outcome")
                  ? { outcome: one(parsed, "--outcome") }
                  : {}),
                ...(one(parsed, "--status")
                  ? {
                      status: one(parsed, "--status") as
                        | "proposed"
                        | "accepted"
                        | "superseded",
                    }
                  : {}),
              },
              crypto.randomUUID(),
            );
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.updated" : "decision.updated",
            data: data.record,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "archive" &&
        isMilestone &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        return output(
          {
            schemaVersion: 1,
            kind: "milestone.archived",
            data: (
              await planning.archiveMilestone(rest[0], crypto.randomUUID())
            ).record,
          },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        `${group} action is invalid or missing required arguments.`,
      );
    }
    if (arguments_[0] === "search" && arguments_[1]) {
      const parsed = flags(arguments_.slice(2));
      if (!parsed || !only(parsed, ["--all"]))
        return usageFailure(
          parsed,
          ["--all"],
          "search accepts --all, --json, and --plain.",
        );
      if (!parsed.values.has("--all"))
        return output(
          await dispatchTrackerTaskCommand(await taskService(), {
            command: "search",
            query: arguments_[1],
          }),
          modeFor(parsed),
        );
      const [tasks, planning] = await Promise.all([
        dispatchTrackerTaskCommand(await taskService(), {
          command: "search",
          query: arguments_[1],
        }),
        (await planningService()).search(arguments_[1]),
      ]);
      return output(
        {
          schemaVersion: 1,
          kind: "search.results",
          data: { tasks: tasks.data, ...planning },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "draft") {
      const action = arguments_[1];
      const rest = arguments_.slice(2);
      const parsed = flags(
        rest.slice(
          action === "create" ||
            action === "view" ||
            action === "promote" ||
            action === "archive"
            ? 1
            : 0,
        ),
        action === "create" ? ["--label", "--doc"] : [],
      );
      if (!action || !parsed)
        return failure("usage", "draft requires a valid action.");
      const tasks = await taskService();
      if (action === "list" && only(parsed, ["--include-archived"]))
        return output(
          {
            schemaVersion: 1,
            kind: "draft.list",
            data: (
              await tasks.listDrafts(parsed.values.has("--include-archived"))
            ).map(flattenLocatedDraft),
          },
          modeFor(parsed),
        );
      if (action === "view" && rest[0] && only(parsed, []))
        return output(
          {
            schemaVersion: 1,
            kind: "draft.view",
            data: flattenLocatedDraft(await tasks.viewDraft(rest[0])),
          },
          modeFor(parsed),
        );
      if (
        action === "create" &&
        rest[0] &&
        only(parsed, [
          "--id",
          "--description",
          "--label",
          "--doc",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = recordFromMutation(
          await tasks.createDraft(
            one(parsed, "--id") ?? (await nextDraftId(tasks)),
            {
              title: rest[0],
              description: one(parsed, "--description"),
              labels: parsed.values.get("--label"),
              documentation: parsed.values.get("--doc"),
            },
            crypto.randomUUID(),
          ),
          "draft",
        );
        return output(
          { schemaVersion: 1, kind: "draft.created", data },
          modeFor(parsed),
        );
      }
      if (
        action === "promote" &&
        rest[0] &&
        only(parsed, [
          "--task-id",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = recordFromMutation(
          await tasks.promoteDraft(
            rest[0],
            one(parsed, "--task-id") ??
              (await nextTaskId(
                tasks,
                await configuredTaskIdPrefix(),
                git,
                await resolvedRoot(),
              )),
            crypto.randomUUID(),
          ),
          "task",
        );
        return output(
          { schemaVersion: 1, kind: "draft.promoted", data },
          modeFor(parsed),
        );
      }
      if (
        action === "archive" &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = recordFromMutation(
          await tasks.archiveDraft(rest[0], crypto.randomUUID()),
          "draft",
        );
        return output(
          { schemaVersion: 1, kind: "draft.archived", data },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        "draft action is invalid or missing required arguments.",
      );
    }
    if (arguments_[0] !== "task")
      return failure("usage", "Unknown or missing Quest command.");
    const command = arguments_[1];
    const rest = arguments_.slice(2);
    if (
      ["complete", "archive", "pause", "start"].includes(command ?? "") &&
      rest[0]
    ) {
      const parsed = flags(rest.slice(1));
      // QCLI-270: `--final-summary` is complete-only -- archive/pause/start
      // have no terminal "how did this go" question, so widening their
      // allowed set too would just make it silently accepted and dropped.
      const allowedFlags =
        command === "complete"
          ? [
              "--final-summary",
              "--actor",
              "--actor-kind",
              "--accountable-human",
            ]
          : ["--actor", "--actor-kind", "--accountable-human"];
      if (!parsed || !only(parsed, allowedFlags))
        return usageFailure(
          parsed,
          allowedFlags,
          `task ${command} requires a reference and an explicit actor.`,
        );
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      const tasks = await taskService();
      // QCLI-270: a final summary written as part of completion is a plain
      // replace, matching `task edit --final-summary` -- not the
      // clear/append vocabulary, which stays edit-only.
      const finalSummary =
        command === "complete" ? one(parsed, "--final-summary") : undefined;
      // QCLI-269: these five lifecycle commands build their envelope directly
      // rather than through dispatchTrackerTaskCommand, so the same
      // presentation-only `position` field it adds to every checklist item
      // has to be applied here too, or task.completed/archived/paused/started
      // would silently fall back to the bare 0-based `index`.
      const data = withCheckPositions(
        recordFromMutation(
          command === "complete"
            ? await tasks.complete(rest[0], crypto.randomUUID(), finalSummary)
            : command === "archive"
              ? await tasks.archive(rest[0], crypto.randomUUID())
              : command === "pause"
                ? await tasks.pause(rest[0], crypto.randomUUID())
                : await tasks.start(rest[0], crypto.randomUUID()),
          "task",
        ),
      );
      const kind = command === "start" ? "task.started" : `task.${command}d`;
      // QCLI-252: acceptance criteria and definition-of-done stay advisory at
      // completion -- an honestly-unchecked item is not a defect to force
      // closed -- but a completion that leaves items unchecked must say so
      // rather than exit clean and silent. Archive/pause/start have no
      // terminal "was this actually finished" question, so this is
      // deliberately complete-only.
      const unresolved =
        command === "complete" ? unresolvedAtCompletion(data) : undefined;
      const result = output(
        {
          schemaVersion: 1,
          kind,
          data: unresolved
            ? { ...data, unresolvedAtCompletion: unresolved }
            : data,
        },
        modeFor(parsed),
      );
      return unresolved
        ? { ...result, stderr: `${completionWarning(data, unresolved)}\n` }
        : result;
    }
    if (command === "demote" && rest[0]) {
      const parsed = flags(rest.slice(1));
      const demoteFlags = [
        "--to",
        "--actor",
        "--actor-kind",
        "--accountable-human",
      ];
      if (!parsed || !only(parsed, demoteFlags))
        return usageFailure(
          parsed,
          demoteFlags,
          "task demote requires a reference, --to <status>, and an explicit actor.",
        );
      const to = one(parsed, "--to");
      if (!to) return failure("usage", "task demote requires --to <status>.");
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      const tasks = await taskService();
      // QCLI-269: same reasoning as the complete/archive/pause/start branch
      // above -- demote also builds its envelope outside the shared
      // dispatcher, so it needs the `position` field applied explicitly too.
      const data = withCheckPositions(
        recordFromMutation(
          await tasks.demote(rest[0], to, crypto.randomUUID()),
          "task",
        ),
      );
      return output(
        { schemaVersion: 1, kind: "task.demoted", data },
        modeFor(parsed),
      );
    }
    if (command === "status-flow") {
      const parsed = flags(rest);
      if (!parsed || !only(parsed, []))
        return usageFailure(
          parsed,
          [],
          "task status-flow accepts only --json and --plain.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), { command }),
        modeFor(parsed),
      );
    }
    if (command === "list") {
      const parsed = flags(rest, REPEATABLE_LIST_FLAGS);
      const listFlags = [
        "--status",
        "--label",
        "--ready",
        "--exclude-status",
        "--assignee",
        "--unassigned",
        "--milestone",
        "--parent",
        "--priority",
        "--type",
        "--search",
        "--limit",
        "--sort",
        "--include-archived",
      ];
      if (!parsed || !only(parsed, listFlags))
        return usageFailure(
          parsed,
          listFlags,
          "task list received invalid arguments.",
        );
      if (parsed.values.has("--assignee") && parsed.values.has("--unassigned"))
        return failure(
          "usage",
          "task list --assignee and --unassigned cannot be combined.",
        );
      const listing = await dispatchTrackerTaskCommand(await taskService(), {
        command,
        status: one(parsed, "--status"),
        labels: parsed.values.get("--label"),
        ready: parsed.values.has("--ready") || undefined,
        excludeStatuses: csvValues(parsed, "--exclude-status"),
        assignees: csvValues(parsed, "--assignee"),
        unassigned: parsed.values.has("--unassigned") || undefined,
        milestoneId: one(parsed, "--milestone"),
        parentId: one(parsed, "--parent"),
        priority: one(parsed, "--priority"),
        types: csvValues(parsed, "--type"),
        search: one(parsed, "--search"),
        limit: limitValue(one(parsed, "--limit")),
        sort: sortValue(one(parsed, "--sort")),
        includeArchived: parsed.values.has("--include-archived") || undefined,
      });
      // QCLI-316 / DEC-6. The cross-ref difference is read ONLY when this
      // listing came back empty, and that is a deliberate line rather than a
      // cost dodge. A non-empty list already tells the reader that records
      // exist and that this is a filtered view; an EMPTY one is the case that
      // reads as the check passing rather than as the check not running, and
      // it is the only case where naming what was not read changes what the
      // reader concludes. The branch name is stated either way, because "which
      // object did this answer about" is a question every listing owes an
      // answer to and costs one `rev-parse`.
      const listedTasks = (listing as { readonly data?: readonly unknown[] })
        .data;
      const listingIsEmpty =
        Array.isArray(listedTasks) && listedTasks.length === 0;
      const listingRoot = await resolvedRoot();
      const unseenTaskIds = listingIsEmpty
        ? await taskRecordIdsOnOtherRefs(git, listingRoot)
        : null;
      return output(listing, modeFor(parsed), [], {
        branch: await git.currentBranch(listingRoot),
        otherRefsRead: unseenTaskIds !== null,
        ...(unseenTaskIds === null ? {} : { unseenTaskIds }),
      });
    }
    if (command === "view" && rest[0]) {
      const parsed = flags(rest.slice(1));
      if (!parsed || !only(parsed, ["--max-notes"]))
        return usageFailure(
          parsed,
          ["--max-notes"],
          "task view received invalid arguments.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          reference: rest[0],
          maxNotes: maxNotesValue(one(parsed, "--max-notes")),
        }),
        modeFor(parsed),
      );
    }
    if (command === "binding") {
      const parsed = flags(rest);
      const bindingFlagNames = [
        "--task",
        "--claim-or-correlation",
        "--holder",
        "--repository",
        "--base",
        "--settlement",
      ] as const;
      // Non-TTY stdin is piped input. Piped transport requires the exact
      // envelope and NO binding flag; a complete flag set over an empty or
      // closed pipe remains the legacy flag-driven form (AC byte-compat).
      const stdinIsPiped = stdinIsTty !== true;
      const suppliedBindingFlags = parsed
        ? bindingFlagNames.filter((flag) => one(parsed, flag) !== undefined)
        : [];
      let pipedBody: string | null = null;
      if (stdinIsPiped) {
        pipedBody = await Bun.stdin.text();
        if (suppliedBindingFlags.length > 0 && pipedBody.trim() !== "") {
          return failure(
            "usage",
            "task binding accepts either the piped stdin request envelope alone or the complete --task/--claim-or-correlation/--holder/--repository/--base/--settlement flag set, never both.",
          );
        }
      }
      const flagsIncomplete =
        !parsed ||
        (suppliedBindingFlags.length > 0 &&
          bindingFlagNames.some((flag) => one(parsed, flag) === undefined));
      const bindingAllowedFlags = ["--contract", ...bindingFlagNames];
      if (
        !parsed ||
        !only(parsed, bindingAllowedFlags) ||
        !one(parsed, "--contract") ||
        flagsIncomplete
      )
        return usageFailure(
          parsed,
          bindingAllowedFlags,
          "task binding requires --contract plus either the piped stdin request envelope alone or all of --task/--claim-or-correlation/--holder/--repository/--base/--settlement.",
        );
      const stdinTransport = stdinIsPiped && suppliedBindingFlags.length === 0;
      const root = await resolvedRoot();
      // No mutable pre-snapshot task read: the raw reference is resolved
      // entirely inside the immutable revision-pinned snapshot model.
      const bindingService = new OpumAgentWorkflowBindingService(
        await createTaskBindingModel(root),
      );
      let envelopeTaskId = one(parsed, "--task") ?? "";
      let envelopeRequestId = crypto.randomUUID().replaceAll("-", "");
      let deriveAssertionsFromRecord = false;
      let stdinCorrelation: string | undefined;
      if (stdinTransport) {
        // The deployed opum-agent facade writes the exact request envelope to
        // stdin; parse and validate it strictly before any resolution.
        let parsedEnvelope: unknown;
        try {
          parsedEnvelope = parseStrictJson(pipedBody ?? "");
        } catch {
          return failure("drift", "OPUM_WORKFLOW_QUEST_INCOMPATIBLE", {
            input: { code: "OPUM_WORKFLOW_QUEST_INCOMPATIBLE" },
          });
        }
        // Facade transport compatibility: the deployed opum-agent facade
        // appends its claim-or-correlation reference to the piped envelope.
        // Lift that one transport field out before the strict domain
        // validation so the normative four-key envelope is what the domain
        // contract sees; the reference feeds the relationship lookup only.
        if (
          parsedEnvelope !== null &&
          typeof parsedEnvelope === "object" &&
          !Array.isArray(parsedEnvelope) &&
          "claimOrCorrelation" in parsedEnvelope
        ) {
          const { claimOrCorrelation: correlation, ...remainder } =
            parsedEnvelope as Record<string, unknown>;
          if (typeof correlation !== "string") {
            return failure("drift", "OPUM_WORKFLOW_QUEST_INCOMPATIBLE", {
              input: { code: "OPUM_WORKFLOW_QUEST_INCOMPATIBLE" },
            });
          }
          stdinCorrelation = correlation;
          parsedEnvelope = remainder;
        }
        let checked: ReturnType<typeof parseTaskBindingRequestV1>;
        try {
          checked = parseTaskBindingRequestV1(parsedEnvelope);
        } catch (error) {
          if (!(error instanceof OpumAgentWorkflowError)) throw error;
          return failure("drift", error.code, {
            input: { code: error.code },
          });
        }
        envelopeTaskId = checked.taskId;
        envelopeRequestId = checked.requestId;
        deriveAssertionsFromRecord = true;
      }
      let response: QuestTaskBindingV1Response;
      try {
        response = await bindingService.bind({
          contract: one(parsed, "--contract") ?? "",
          taskId: envelopeTaskId,
          claimOrCorrelationId:
            stdinCorrelation ??
            one(parsed, "--claim-or-correlation") ??
            envelopeTaskId,
          holder: one(parsed, "--holder") ?? "",
          repositoryId: one(parsed, "--repository") ?? "",
          baseRef: one(parsed, "--base") ?? "",
          settlementRef: one(parsed, "--settlement") ?? "",
          requestId: envelopeRequestId,
          deriveAssertionsFromRecord,
        });
      } catch (error) {
        if (!(error instanceof OpumAgentWorkflowError)) throw error;
        const errorType =
          error.code === "OPUM_WORKFLOW_QUEST_ABSENT"
            ? "not_found"
            : error.code === "OPUM_WORKFLOW_QUEST_INCOMPATIBLE"
              ? "drift"
              : "conflict";
        return failure(errorType, error.code, {
          input: { code: error.code },
        });
      }
      if (resolvedModes.json || parsed?.json) {
        // The public v1 surface prints the exact binding envelope on stdout.
        return {
          stdout: `${JSON.stringify(response)}\n`,
          stderr: "",
          exitCode: 0,
        };
      }
      const lines = [
        `contract ${response.contract}`,
        `selectedVersion ${response.selectedVersion}`,
        `requestId ${response.requestId}`,
        `taskId ${response.taskId}`,
        `repositoryId ${response.repositoryId}`,
        `holder ${response.holder}`,
        `taskState ${response.taskState}`,
        `relationshipKind ${response.relationshipKind}`,
        `relationshipId ${response.relationshipId}`,
        `relationshipState ${response.relationshipState}`,
        `baseRef ${response.baseRef}`,
        `settlementRef ${response.settlementRef}`,
        `issuedAt ${response.issuedAt}`,
        `expiresAt ${response.expiresAt}`,
      ];
      return {
        stdout:
          modeFor(parsed) === "plain"
            ? `${lines.join("\n")}\n`
            : `${lines.join("\n")}\n`,
        stderr: "",
        exitCode: 0,
      };
    }
    if (command === "create" && rest[0]) {
      const title = rest[0];
      const parsed = flags(rest.slice(1), REPEATABLE_CREATE_FLAGS);
      const createFlags = [
        "--id",
        "--summary",
        "--description",
        "--label",
        "--doc",
        "--priority",
        "--type",
        "--ordinal",
        "--alias",
        "--acceptance-criteria",
        "--definition-of-done",
        "--plan",
        "--implementation-notes",
        "--comments",
        "--assignee",
        "--reference",
        "--modified-file",
        "--dependency",
        "--parent",
        "--milestone",
        "--final-summary",
        "--actor",
        "--actor-kind",
        "--accountable-human",
      ];
      if (!parsed || !only(parsed, createFlags))
        return usageFailure(
          parsed,
          createFlags,
          "task create received invalid arguments.",
        );
      for (const flag of [
        "--label",
        "--doc",
        "--alias",
        "--assignee",
        "--reference",
        "--modified-file",
        "--dependency",
      ] as const)
        rejectArrayLookingValue(flag, parsed.values.get(flag));
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      const tasks = await taskService();
      return output(
        await dispatchTrackerTaskCommand(tasks, {
          command,
          id:
            one(parsed, "--id") ??
            (await nextTaskId(
              tasks,
              await configuredTaskIdPrefix(),
              git,
              await resolvedRoot(),
            )),
          operationId: crypto.randomUUID(),
          actor: writeActor,
          input: {
            title,
            summary: one(parsed, "--summary"),
            description: one(parsed, "--description"),
            labels: parsed.values.get("--label"),
            documentation: parsed.values.get("--doc"),
            priority: one(parsed, "--priority"),
            type: one(parsed, "--type"),
            ordinal: ordinalValue(one(parsed, "--ordinal")),
            aliases: parsed.values.get("--alias"),
            acceptanceCriteria: checkListValue(parsed, "--acceptance-criteria"),
            definitionOfDone: checkListValue(parsed, "--definition-of-done"),
            plan: stringValue(parsed, "--plan"),
            implementationNotes: stringValue(parsed, "--implementation-notes"),
            comments: commentsValue(parsed, "--comments"),
            assignees: parsed.values.get("--assignee"),
            references: parsed.values.get("--reference"),
            modifiedFiles: parsed.values.get("--modified-file"),
            dependencies: parsed.values.get("--dependency"),
            parentId: one(parsed, "--parent"),
            milestoneId: one(parsed, "--milestone"),
            finalSummary: one(parsed, "--final-summary"),
          },
        }),
        modeFor(parsed),
      );
    }
    if (command === "edit-batch") {
      // QCLI-122 public batch boundary (strict JSONL per FMC 05fe52e8):
      // malformed/unknown/managed content fails at parse time or becomes a
      // documented per-item error — never a silent successful no-op.
      const parsed = flags(rest, REPEATABLE_EDIT_BATCH_FLAGS);
      const editBatchFlags = [
        "--file",
        "--actor",
        "--actor-kind",
        "--accountable-human",
      ];
      if (!parsed || !only(parsed, editBatchFlags))
        return usageFailure(
          parsed,
          editBatchFlags,
          "task edit-batch requires exactly one --file pointing at a JSONL operations file plus --actor/--actor-kind.",
        );
      const filePath = one(parsed, "--file");
      if (!filePath)
        return failure(
          "usage",
          "task edit-batch requires --file <operations.jsonl>.",
        );
      let raw: string;
      try {
        raw = await readFile(filePath, "utf8");
      } catch {
        return failure(
          "not_found",
          `Operations file is not readable: ${filePath}`,
        );
      }
      const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      // Empty file is a public no-op: zero items plus the authoritative
      // revision, no lock/journal/mutation (QCLI-122 third pass #8).
      if (lines.length === 0) {
        return output(
          await dispatchTrackerTaskCommand(await taskService(), {
            command,
            actor: writeActor,
            items: [],
          }),
          modeFor(parsed),
        );
      }
      // Allowed patch keys come straight from the published manifest entry so
      // the CLI cannot drift from the public contract.
      const manifestEntry = commandManifest.commands.find(
        (entry: { name: string }) => entry.name === "task edit-batch",
      ) as { fields?: readonly string[] } | undefined;
      const allowedPatchKeys = new Set(manifestEntry?.fields ?? []);
      if (allowedPatchKeys.size === 0) allowedPatchKeys.add("__unavailable__"); // defensive: no-op semantics
      const managedKeys = new Set(["gates", "gateEvents"]);
      const seenOperationIds = new Set<string>();
      const items: unknown[] = [];
      for (const [index, line] of lines.entries()) {
        let value: unknown;
        try {
          value = JSON.parse(line);
        } catch {
          return failure(
            "usage",
            `Malformed operations JSONL at line ${index + 1}.`,
          );
        }
        const record = value as Record<string, unknown>;
        if (!record || typeof record !== "object" || Array.isArray(record))
          return failure(
            "usage",
            `Invalid operations item at line ${index + 1}: expected an object.`,
          );
        // QCLI-277: `ifRevision` is a per-item precondition, not a task
        // field, so it lives beside `reference`/`operationId` rather than
        // inside `patch` -- same reasoning as keeping `--if-revision`
        // outside `task edit`'s own patch vocabulary below.
        const allowedTop = new Set([
          "reference",
          "operationId",
          "patch",
          "ifRevision",
        ]);
        for (const key of Object.keys(record))
          if (!allowedTop.has(key))
            return failure(
              "usage",
              `Unknown field ${key} in operations item at line ${index + 1}.`,
            );
        const reference =
          typeof record.reference === "string" ? record.reference : undefined;
        if (!reference)
          return failure(
            "usage",
            `Missing reference string in operations item at line ${index + 1}.`,
          );
        if (
          record.ifRevision !== undefined &&
          typeof record.ifRevision !== "string"
        )
          return failure(
            "usage",
            `ifRevision must be a string in operations item at line ${index + 1}.`,
          );
        const operationIdRaw = record.operationId;
        if (
          typeof operationIdRaw !== "string" ||
          operationIdRaw.trim().length === 0
        )
          return failure(
            "usage",
            `Operation id must be a non-empty string in operations item at line ${index + 1}.`,
          );
        if (seenOperationIds.has(operationIdRaw))
          return failure(
            "usage",
            `Duplicate operation id ${operationIdRaw} at line ${index + 1}.`,
          );
        seenOperationIds.add(operationIdRaw);
        const patchValue = record.patch;
        if (
          patchValue !== undefined &&
          (typeof patchValue !== "object" ||
            patchValue === null ||
            Array.isArray(patchValue))
        )
          return failure(
            "usage",
            `Patch must be an object in operations item at line ${index + 1}.`,
          );
        const patchObject = (patchValue as Record<string, unknown>) ?? {};
        for (const [patchKey, fieldValue] of Object.entries(patchObject)) {
          if (managedKeys.has(patchKey) || !allowedPatchKeys.has(patchKey))
            return failure(
              "usage",
              `${managedKeys.has(patchKey) ? "Managed" : "Unknown"} patch key ${patchKey} in operations item at line ${index + 1}.`,
            );
          // QCLI-122 third pass #6: value types must match the published
          // vocabulary — a string never silently char-iterates into a list.
          // QCLI-122 fourth pass #5: complete field grammar — scalar vs
          // list vs checklist-object vs boolean, validated atomically.
          // QCLI-138: index-addressed checklist positions are a number list,
          // so they must be classified before the add|remove string-list rule
          // that removeAcceptanceCriteria would otherwise match.
          const indexListFields = new Set([
            "checkAcceptanceCriteria",
            "uncheckAcceptanceCriteria",
            "removeAcceptanceCriteria",
            "checkDefinitionOfDone",
            "uncheckDefinitionOfDone",
            "removeDefinitionOfDone",
          ]);
          const isListField =
            (/^(add|remove)[A-Z]/.test(patchKey) &&
              !indexListFields.has(patchKey)) ||
            [
              "appendFinalSummary",
              "labels",
              "documentation",
              "plan",
              "implementationNotes",
              "assignees",
              "references",
              "modifiedFiles",
              "dependencies",
            ].includes(patchKey);
          const booleanFields = new Set([
            "clearParent",
            "clearMilestone",
            "clearAcceptanceCriteria",
            "clearDefinitionOfDone",
            "clearFinalSummary",
          ]);
          const checklistFields = new Set([
            "acceptanceCriteria",
            "definitionOfDone",
          ]);
          const commentFields = new Set(["comments", "addComments"]);
          if (booleanFields.has(patchKey)) {
            if (typeof fieldValue !== "boolean")
              return failure(
                "usage",
                `Patch key ${patchKey} must be a boolean in operations item at line ${index + 1}.`,
              );
          } else if (indexListFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some(
                (entry) =>
                  !Number.isSafeInteger(entry) || (entry as number) < 1,
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a list of 1-based positive integers in operations item at line ${index + 1}.`,
              );
          } else if (checklistFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some(
                (entry) =>
                  !(
                    typeof entry === "string" ||
                    (entry !== null &&
                      typeof entry === "object" &&
                      !Array.isArray(entry) &&
                      typeof (entry as { index?: unknown }).index ===
                        "number" &&
                      typeof (entry as { text?: unknown }).text === "string" &&
                      typeof (entry as { checked?: unknown }).checked ===
                        "boolean")
                  ),
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a string or {index,text,checked} list in operations item at line ${index + 1}.`,
              );
          } else if (commentFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some((entry) => typeof entry !== "object") ||
              fieldValue.some(
                (entry) =>
                  entry !== null &&
                  typeof entry === "object" &&
                  Array.isArray(entry),
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a comment object list in operations item at line ${index + 1}.`,
              );
          } else if (isListField) {
            if (!Array.isArray(fieldValue))
              return failure(
                "usage",
                `Invalid list value for patch key ${patchKey} in operations item at line ${index + 1}.`,
              );
            if (
              fieldValue.some(
                (entry) =>
                  entry === null ||
                  typeof entry === "object" ||
                  typeof entry === "number" ||
                  typeof entry === "boolean",
              )
            )
              return failure(
                "usage",
                `Invalid list member type for patch key ${patchKey} in operations item at line ${index + 1}.`,
              );
          } else if (patchKey === "status") {
            if (
              typeof fieldValue !== "string" ||
              !["To Do", "In Progress", "Done"].includes(fieldValue)
            )
              return failure(
                "usage",
                `Invalid status value in operations item at line ${index + 1}.`,
              );
          } else if (patchKey === "ordinal") {
            if (!Number.isFinite(fieldValue))
              return failure(
                "usage",
                `Patch key ordinal must be numeric in operations item at line ${index + 1}.`,
              );
          } else {
            // Default: plain scalar string fields from the manifest.
            if (typeof fieldValue !== "string")
              return failure(
                "usage",
                `Patch key ${patchKey} must be a string in operations item at line ${index + 1}.`,
              );
          }
        }
        items.push(record);
      }
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          actor: writeActor,
          items: items as {
            reference: string;
            operationId?: string;
            patch?: Record<string, unknown>;
            ifRevision?: string;
          }[],
        }),
        modeFor(parsed),
      );
    }
    if (command === "edit" && rest[0]) {
      const reference = rest[0];
      const parsed = flags(rest.slice(1), REPEATABLE_EDIT_FLAGS);
      const editFlags = [
        "--status",
        "--title",
        "--priority",
        "--type",
        "--ordinal",
        "--summary",
        "--description",
        "--final-summary",
        "--clear-final-summary",
        "--append-final-summary",
        "--labels",
        "--add-label",
        "--remove-label",
        "--doc",
        "--plan",
        "--add-plan",
        "--remove-plan",
        "--notes",
        "--add-note",
        "--remove-note",
        "--comments",
        "--add-comment",
        "--remove-comment",
        "--acceptance-criteria",
        "--definition-of-done",
        "--check-ac",
        "--uncheck-ac",
        "--remove-ac",
        "--clear-ac",
        "--check-dod",
        "--uncheck-dod",
        "--remove-dod",
        "--clear-dod",
        "--add-dependency",
        "--remove-dependency",
        "--parent",
        "--clear-parent",
        "--milestone",
        "--clear-milestone",
        "--add-assignee",
        "--remove-assignee",
        "--add-reference",
        "--remove-reference",
        "--add-modified-file",
        "--remove-modified-file",
        "--if-revision",
        "--actor",
        "--actor-kind",
        "--accountable-human",
      ];
      if (!parsed || !only(parsed, editFlags))
        return usageFailure(
          parsed,
          editFlags,
          "task edit received invalid arguments.",
        );
      for (const flag of [
        "--add-label",
        "--remove-label",
        "--doc",
        "--add-dependency",
        "--remove-dependency",
        "--add-assignee",
        "--remove-assignee",
        "--add-reference",
        "--remove-reference",
        "--add-modified-file",
        "--remove-modified-file",
        "--remove-comment",
      ] as const)
        rejectArrayLookingValue(flag, parsed.values.get(flag));
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          reference,
          operationId: crypto.randomUUID(),
          actor: writeActor,
          ifRevision: one(parsed, "--if-revision"),
          patch: {
            status: one(parsed, "--status"),
            title: one(parsed, "--title"),
            priority: one(parsed, "--priority"),
            type: one(parsed, "--type"),
            // Same parser create uses, so the two paths cannot diverge.
            ordinal: ordinalValue(one(parsed, "--ordinal")),
            summary: one(parsed, "--summary"),
            description: one(parsed, "--description"),
            finalSummary: one(parsed, "--final-summary"),
            clearFinalSummary:
              parsed.values.has("--clear-final-summary") || undefined,
            appendFinalSummary: parsed.values.get("--append-final-summary"),
            labels: stringValue(parsed, "--labels"),
            addLabels: parsed.values.get("--add-label"),
            removeLabels: parsed.values.get("--remove-label"),
            documentation: parsed.values.get("--doc"),
            plan: stringValue(parsed, "--plan"),
            addPlan: parsed.values.get("--add-plan"),
            removePlan: parsed.values.get("--remove-plan"),
            implementationNotes: stringValue(parsed, "--notes"),
            addNotes: parsed.values.get("--add-note"),
            removeNotes: parsed.values.get("--remove-note"),
            comments: commentsValue(parsed, "--comments"),
            addComments: commentsValue(parsed, "--add-comment"),
            removeComments: parsed.values.get("--remove-comment"),
            acceptanceCriteria: checkListValue(parsed, "--acceptance-criteria"),
            definitionOfDone: checkListValue(parsed, "--definition-of-done"),
            checkAcceptanceCriteria: indexListValue(parsed, "--check-ac"),
            uncheckAcceptanceCriteria: indexListValue(parsed, "--uncheck-ac"),
            removeAcceptanceCriteria: indexListValue(parsed, "--remove-ac"),
            clearAcceptanceCriteria:
              parsed.values.has("--clear-ac") || undefined,
            checkDefinitionOfDone: indexListValue(parsed, "--check-dod"),
            uncheckDefinitionOfDone: indexListValue(parsed, "--uncheck-dod"),
            removeDefinitionOfDone: indexListValue(parsed, "--remove-dod"),
            clearDefinitionOfDone:
              parsed.values.has("--clear-dod") || undefined,
            addDependencies: parsed.values.get("--add-dependency"),
            removeDependencies: parsed.values.get("--remove-dependency"),
            parentId: one(parsed, "--parent"),
            clearParent: parsed.values.has("--clear-parent") || undefined,
            milestoneId: one(parsed, "--milestone"),
            clearMilestone: parsed.values.has("--clear-milestone") || undefined,
            addAssignees: parsed.values.get("--add-assignee"),
            removeAssignees: parsed.values.get("--remove-assignee"),
            addReferences: parsed.values.get("--add-reference"),
            removeReferences: parsed.values.get("--remove-reference"),
            addModifiedFiles: parsed.values.get("--add-modified-file"),
            removeModifiedFiles: parsed.values.get("--remove-modified-file"),
          },
        }),
        modeFor(parsed),
      );
    }
    return failure("usage", "Unknown or missing Quest command.");
  } catch (error) {
    if (error instanceof FlagUsageError) return failure("usage", error.message);
    const message =
      error instanceof Error
        ? error.message
        : "Quest encountered an unexpected error.";
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const kind =
      error && typeof error === "object" && "kind" in error
        ? (error as { kind?: unknown }).kind
        : undefined;
    if (code === "EACCES" || code === "EPERM")
      return failure(
        "denied",
        `Quest cannot access required storage: ${message}`,
        {
          hint: "Check the task-store filesystem permissions and retry.",
        },
      );
    if (error instanceof WorkspaceError && error.code === "not_git_worktree")
      return failure(
        "validation",
        "No Git repository was found here. Run `git init` to create one, then re-run `quest init`.",
        {
          hint: "Quest requires an existing Git worktree; it does not create one for you.",
        },
      );
    if (error instanceof WorkspaceError && error.code === "already_initialized")
      return failure("validation", error.message, {
        hint: "To change name or task-id-prefix on an existing workspace, use `quest init --reconfigure` -- do not delete .quest/ and re-run init, which discards every task record it is not tracked in git.",
      });
    if (error instanceof WorkspaceError && error.code === "stray_content")
      return failure("validation", error.message, {
        hint: "Use `quest init --reconfigure` to adopt this directory's existing task records under a new configuration, or remove .quest/ yourself if you are certain you want to discard them.",
      });
    // Carries the itemized collision/unpreservable-record report; the
    // generic `kind === "conflict"` fallback below would keep only the
    // summary message and drop the list the operator needs to act on it.
    if (error instanceof BacklogMigrationRefusedError)
      return failure("conflict", error.message, { input: error.details });
    // QCLI-261: same rationale as BacklogMigrationRefusedError above -- the
    // generic `kind === "conflict"` fallback would keep only the bare message
    // ("task_lifecycle_duplicate_identity") and drop the id and paths a
    // caller who did not cause the corruption needs to find and fix it.
    if (error instanceof RecordDuplicateIdentityError)
      return failure("conflict", error.message, {
        input: { duplicates: error.duplicates },
        hint: "Every quest command fails closed while a task or draft id exists under more than one of tasks/completed/archive/tasks (or drafts/archive/drafts) -- usually a partial `git add` that staged a move's addition but not its deletion. Compare the listed paths yourself (diff, updatedAt, status): if they are the same record duplicated, keep the one reflecting the record's actual current state and remove the other(s) directly with `rm`/`git rm` -- quest cannot run any command to do this for you while the duplicate exists, so this is a sanctioned exception to editing .quest/ by hand. If the records genuinely differ (two unrelated tasks collided on the same id), this is not a stale copy -- do not delete either without reconciling which one keeps the id.",
      });
    // Decidable from argv alone, so they belong with the other flag-combination
    // usage errors rather than the post-read validation failures. The fold
    // still owns the rule, so `task edit-batch` reports it per item.
    if (message === "check_index_out_of_range")
      return failure(
        "validation",
        "A checklist position does not exist on this task.",
        {
          hint: "Positions are 1-based. Read the task and count from 1, or use --clear-ac/--clear-dod to empty the list.",
        },
      );
    if (message === "final_summary_operation_conflict")
      return failure(
        "usage",
        "--clear-final-summary cannot be combined with a final summary value.",
        {
          hint: "Use --clear-final-summary on its own, or --final-summary/--append-final-summary without it.",
        },
      );
    if (message === "check_operation_conflict")
      return failure(
        "usage",
        "Checklist replacement, --clear-ac/--clear-dod, and the index-addressed operations cannot be combined.",
        {
          hint: "Use --clear-ac or --clear-dod on its own, and keep --acceptance-criteria/--definition-of-done in a separate edit from --check-*/--uncheck-*/--remove-*.",
        },
      );
    // QCLI-313 / DEC-5. `validation` on exit 6, NOT `usage` on exit 2 like the
    // two conflicts above: those are decided by the flag combination alone,
    // while this one depends on the record's current state -- the identical
    // command line is fine against a list with nothing ticked. A caller can
    // therefore tell "I combined flags wrongly" from "the record has state my
    // replacement would destroy" by exit code, without parsing prose. Follows
    // DEC-2, where a mismatch against current state stayed validation.
    if (message === "check_replacement_clears_checked")
      return failure(
        "validation",
        "This checklist replacement would clear a box that is currently checked.",
        {
          hint: 'Replace with the object form, which carries checked state: --acceptance-criteria \'[{"index":0,"text":"...","checked":true}]\' (--definition-of-done takes the same shape). To reset a box deliberately, pass that form with "checked": false. To edit one entry without restating the list, use --check-ac/--uncheck-ac/--remove-ac with its 1-based position.',
        },
      );
    if (message === "check_index_conflict")
      return failure(
        "usage",
        "One checklist position was given contradictory operations.",
        {
          hint: "Address each position once: do not check and uncheck it, or remove and check it, in the same edit.",
        },
      );
    // QCLI-277: same exit-5 conflict shape as the generic branch just below
    // -- this only adds `input.actualRevision`, which `TrackerWriteConflictError`
    // carries and a bare `Error("tracker_write_conflict")` never did, so a
    // caller (in particular one whose `--if-revision` precondition just
    // failed) can re-read without a second round trip.
    if (error instanceof TrackerWriteConflictError)
      return failure(
        "conflict",
        "Task state changed concurrently; the operation was not applied.",
        {
          hint: "Read the latest task state and retry the operation.",
          ...(error.actualRevision !== undefined
            ? { input: { actualRevision: error.actualRevision } }
            : {}),
        },
      );
    if (
      message === "tracker_write_conflict" ||
      message === "dependency_target_ambiguous" ||
      // An auto-allocated id (nextTaskId) racing another writer for the same
      // id surfaces here as task_already_exists (QCLI-223): create() now
      // validates against every location, including one a concurrent
      // sibling just committed to. That is the same symptom as
      // dependency_target_ambiguous above, just caught earlier -- retrying
      // recomputes a fresh id and succeeds.
      message === "task_already_exists"
    )
      return failure(
        "conflict",
        "Task state changed concurrently; the operation was not applied.",
        {
          hint: "Read the latest task state and retry the operation.",
        },
      );
    // QCLI-163: task create's dependency/parent validation runs synchronously
    // at creation, and forward references (naming a not-yet-created task) are
    // deliberately fail-closed (QCLI-62) rather than deferred -- this only
    // adds a next step to that stop, it does not relax the validation.
    if (message === "dependency_target_not_found")
      return failure("validation", message, {
        hint: "The dependency/parent target must already exist -- forward references are not deferred. Create the target first with `quest task create`, then set the edge: --dependency/--parent at creation, or `quest task edit <id> --add-dependency <target-id>` (or --parent <target-id>) afterward.",
      });
    if (kind === "conflict") return failure("conflict", message);
    if (message === "task_not_found") return failure("not_found", message);
    if (
      [
        "task_not_found",
        "draft_not_found",
        "milestone_not_found",
        "decision_not_found",
        // QCLI-257: MigrationBacklogService.status() throws this plain Error
        // for an unknown or never-previewed digest; rollback() calls status()
        // internally and inherits the identical message on the identical
        // path, so this one entry covers both. apply()'s own not-yet-approved
        // case is the differently-shaped migration_approval_digest_mismatch
        // (a freshly recomputed preview digest disagreeing with the caller's)
        // and deliberately stays validation -- see DEC-2.
        "migration_not_found",
      ].includes(message)
    )
      return failure("not_found", message);
    return failure("validation", message);
  }
}

if (import.meta.main) {
  const result = await runQuest(
    process.argv.slice(2),
    Boolean(process.stdout.isTTY),
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
