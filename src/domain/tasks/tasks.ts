import { z } from "zod";

import {
  blockingGatesSatisfied,
  replayGateHistory,
  type GateEvent,
} from "../gates/gates.ts";
import {
  aliasKey,
  canonicalId,
  canonicalIdSchema,
  type CanonicalId,
  RecordConflictError,
  RecordValidationError,
} from "../records.ts";

export const taskStatuses = ["To Do", "In Progress", "Done"] as const;
export type TaskStatus = string;
/** Storage location is lifecycle metadata, never part of the task identifier. */
export type TaskLocation = "tasks" | "completed" | "archive/tasks";
export type DraftLocation = "drafts" | "archive/drafts";
export type DraftId = `D-${number}`;
export interface LifecyclePolicy {
  readonly statuses: readonly TaskStatus[];
  readonly terminalStatuses: readonly TaskStatus[];
}
export const defaultLifecyclePolicy: LifecyclePolicy = {
  statuses: taskStatuses,
  terminalStatuses: ["Done"],
};

function lifecyclePolicy(policy: LifecyclePolicy): LifecyclePolicy {
  if (
    !policy.statuses.length ||
    new Set(policy.statuses).size !== policy.statuses.length
  )
    throw new RecordValidationError(
      "Lifecycle statuses must be a non-empty unique order.",
    );
  if (
    policy.terminalStatuses.some((status) => !policy.statuses.includes(status))
  )
    throw new RecordValidationError(
      "Lifecycle terminal status is not configured.",
    );
  return policy;
}

export interface TaskComment {
  readonly id: string;
  readonly authorId: string;
  readonly body: string;
  readonly createdAt: string;
}

export interface SourceProvenance {
  readonly system: string;
  readonly reference: string;
  readonly importedAt?: string;
}

export interface BlockerEvent {
  readonly kind: "opened" | "cleared";
  readonly blockId: string;
  readonly actorId: string;
  readonly at: string;
  readonly reason?: string;
  readonly evidence?: readonly string[];
}

export interface TaskClaim {
  readonly holderId: string;
  readonly leaseGeneration: string;
  readonly expiresAt: string;
}

export interface TaskCheckItem {
  readonly index: number;
  readonly text: string;
  readonly checked: boolean;
}

/** Legacy records store bare strings; taskState() always normalizes to items. */
export type TaskCheckList = readonly (string | TaskCheckItem)[];

/** Structural side of a milestone; domain/planning's Milestone is assignable. */
export interface MilestoneTaskSide {
  readonly id: string;
  readonly taskIds: readonly string[];
}

const milestoneIdPattern = /^M-[1-9][0-9]*$/;

export interface TaskGate {
  readonly id: string;
  readonly title: string;
  readonly blocking?: boolean;
  readonly state: "pending" | "satisfied";
  readonly evidence: readonly string[];
  readonly satisfiedBy?: string;
}

export interface TaskState {
  readonly id: CanonicalId;
  readonly aliases: readonly string[];
  readonly title: string;
  readonly status: TaskStatus;
  readonly summary?: string;
  readonly description?: string;
  readonly priority?: string;
  readonly type?: string;
  readonly ordinal?: number;
  readonly acceptanceCriteria: TaskCheckList;
  readonly definitionOfDone: TaskCheckList;
  readonly plan: readonly string[];
  readonly implementationNotes: readonly string[];
  readonly comments: readonly TaskComment[];
  readonly labels: readonly string[];
  readonly documentation: readonly string[];
  readonly parentId?: string;
  readonly dependencies: readonly string[];
  readonly assignees?: readonly string[];
  readonly references?: readonly string[];
  readonly modifiedFiles?: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly finalSummary?: string;
  readonly milestoneId?: string;
  readonly blockers: readonly BlockerEvent[];
  readonly gates: readonly TaskGate[];
  /** Append-only authored gate history; `gates` is its materialized projection. */
  readonly gateEvents: readonly GateEvent[];
  readonly claim?: TaskClaim;
  readonly source?: SourceProvenance;
}

export interface TaskInput
  extends Omit<
    TaskState,
    | "id"
    | "status"
    | "aliases"
    | "acceptanceCriteria"
    | "definitionOfDone"
    | "plan"
    | "implementationNotes"
    | "comments"
    | "labels"
    | "documentation"
    | "dependencies"
    | "blockers"
    | "gates"
    | "gateEvents"
  > {
  readonly status?: TaskStatus;
  readonly aliases?: readonly string[];
  readonly acceptanceCriteria?: TaskCheckList;
  readonly definitionOfDone?: TaskCheckList;
  readonly plan?: readonly string[];
  readonly implementationNotes?: readonly string[];
  readonly comments?: readonly TaskComment[];
  readonly labels?: readonly string[];
  readonly documentation?: readonly string[];
  readonly dependencies?: readonly string[];
  readonly blockers?: readonly BlockerEvent[];
}

export interface DraftState {
  readonly id: DraftId;
  readonly title: string;
  readonly description?: string;
  readonly labels: readonly string[];
  readonly documentation: readonly string[];
  readonly createdAt?: string;
  readonly source?: SourceProvenance;
}

export interface DraftInput
  extends Omit<DraftState, "id" | "labels" | "documentation"> {
  readonly labels?: readonly string[];
  readonly documentation?: readonly string[];
}

const statusSchema = z.string().min(1);
const checkItemSchema = z.object({
  index: z.number().int().min(0),
  text: z.string(),
  checked: z.boolean(),
});
const checkListSchema = z.array(z.union([z.string(), checkItemSchema]));
const draftIdSchema = z.string().regex(/^D-[1-9][0-9]*$/) as z.ZodType<DraftId>;
const draftSchema = z.object({
  id: draftIdSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  labels: z.array(z.string()),
  documentation: z.array(z.string()),
  createdAt: z.string().optional(),
  source: z
    .object({
      system: z.string().min(1),
      reference: z.string().min(1),
      importedAt: z.string().optional(),
    })
    .optional(),
});
const taskSchema = z.object({
  id: canonicalIdSchema,
  aliases: z.array(z.string().min(1)),
  title: z.string().min(1),
  status: statusSchema,
  summary: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().optional(),
  type: z.string().optional(),
  ordinal: z.number().finite().optional(),
  acceptanceCriteria: checkListSchema,
  definitionOfDone: checkListSchema,
  plan: z.array(z.string()),
  implementationNotes: z.array(z.string()),
  comments: z.array(
    z.object({
      id: z.string().min(1),
      authorId: z.string().min(1),
      body: z.string(),
      createdAt: z.string().min(1),
    }),
  ),
  labels: z.array(z.string()),
  documentation: z.array(z.string()),
  parentId: z.string().optional(),
  dependencies: z.array(z.string()),
  assignees: z.array(z.string()).optional(),
  references: z.array(z.string()).optional(),
  modifiedFiles: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  finalSummary: z.string().optional(),
  milestoneId: z.string().regex(milestoneIdPattern).optional(),
  blockers: z.array(
    z.object({
      kind: z.enum(["opened", "cleared"]),
      blockId: z.string().min(1),
      actorId: z.string().min(1),
      at: z.string().min(1),
      reason: z.string().optional(),
      evidence: z.array(z.string()).optional(),
    }),
  ),
  gates: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      blocking: z.boolean().optional(),
      state: z.enum(["pending", "satisfied"]),
      evidence: z.array(z.string()),
      satisfiedBy: z.string().min(1).optional(),
    }),
  ),
  gateEvents: z.array(z.unknown()),
  claim: z
    .object({
      holderId: z.string().min(1),
      leaseGeneration: z.string().min(1),
      expiresAt: z.string().min(1),
    })
    .optional(),
  source: z
    .object({
      system: z.string().min(1),
      reference: z.string().min(1),
      importedAt: z.string().optional(),
    })
    .optional(),
});

function unique(values: readonly string[], name: string): void {
  if (new Set(values).size !== values.length)
    throw new RecordValidationError(`${name} cannot contain duplicates.`);
}

/** Locale-invariant casefold for configured-status matching; storage keeps the canonical spelling. */
export function statusKey(status: string): string {
  return status.trim().toLowerCase();
}

export function resolveConfiguredStatus(
  requested: string,
  policy = defaultLifecyclePolicy,
): TaskStatus {
  const configured = lifecyclePolicy(policy);
  const match = configured.statuses.find(
    (status) => statusKey(status) === statusKey(requested),
  );
  if (!match) throw new RecordValidationError("Task status is not configured.");
  return match;
}

function normalizeCheckList(list: TaskCheckList): readonly TaskCheckItem[] {
  return list.map((entry, index) => {
    if (typeof entry === "string")
      return { index, text: entry, checked: false };
    if (entry.index !== index)
      throw new RecordValidationError("check_item_index_mismatch");
    return entry;
  });
}

/** Normalizes defaults and rejects malformed authored task state. */
export function taskState(value: TaskState): TaskState {
  const parsed = taskSchema.safeParse(value);
  if (!parsed.success) throw new RecordValidationError("Invalid task state.");
  let state = parsed.data as TaskState;
  state = {
    ...state,
    acceptanceCriteria: normalizeCheckList(state.acceptanceCriteria),
    definitionOfDone: normalizeCheckList(state.definitionOfDone),
  };
  unique(state.labels, "Labels");
  unique(state.assignees ?? [], "Assignees");
  unique(state.references ?? [], "References");
  unique(state.modifiedFiles ?? [], "Modified files");
  unique(state.documentation, "Documentation links");
  unique(
    state.comments.map((comment) => comment.id),
    "Comment ids",
  );
  unique(state.aliases.map(aliasKey), "Aliases");
  unique(
    state.gates.map((gate) => gate.id),
    "Gate ids",
  );
  if (!state.gateEvents.length) {
    if (state.gates.length)
      throw new RecordValidationError("gate_materialization_drift");
  } else {
    const replayed = replayGateHistory(state.gateEvents);
    if (replayed.taskId !== state.id)
      throw new RecordValidationError("gate_task_mismatch");
    const gates: readonly TaskGate[] = replayed.gates.map((gate) => ({
      id: gate.id,
      title: gate.title,
      blocking: gate.blocking,
      state: gate.state,
      evidence: gate.evidence.map((item) => item.reference),
      ...(gate.satisfiedBy ? { satisfiedBy: gate.satisfiedBy } : {}),
    }));
    // A projection is never separately authored when a gate event stream exists.
    if (JSON.stringify(state.gates) !== JSON.stringify(gates))
      throw new RecordValidationError("gate_materialization_drift");
    state = { ...state, gates };
  }
  return state;
}

export function createTask(
  id: string,
  input: TaskInput,
  policy = defaultLifecyclePolicy,
): TaskState {
  const configured = lifecyclePolicy(policy);
  const status =
    input.status === undefined
      ? configured.statuses[0]
      : resolveConfiguredStatus(input.status, policy);
  return taskState({
    ...input,
    id: canonicalId(id),
    status,
    aliases: input.aliases ?? [],
    acceptanceCriteria: input.acceptanceCriteria ?? [],
    definitionOfDone: input.definitionOfDone ?? [],
    plan: input.plan ?? [],
    implementationNotes: input.implementationNotes ?? [],
    comments: input.comments ?? [],
    labels: input.labels ?? [],
    documentation: input.documentation ?? [],
    dependencies: input.dependencies ?? [],
    blockers: input.blockers ?? [],
    gates: [],
    gateEvents: [],
  });
}

export function draftId(value: string): DraftId {
  if (!/^D-[1-9][0-9]*$/.test(value))
    throw new RecordValidationError(`Invalid draft id: ${value}`);
  return value as DraftId;
}

export function draftState(value: DraftState): DraftState {
  const parsed = draftSchema.safeParse(value);
  if (!parsed.success) throw new RecordValidationError("Invalid draft state.");
  const state = parsed.data as DraftState;
  unique(state.labels, "Draft labels");
  unique(state.documentation, "Draft documentation links");
  return state;
}

export function createDraft(id: string, input: DraftInput): DraftState {
  return draftState({
    ...input,
    id: draftId(id),
    labels: input.labels ?? [],
    documentation: input.documentation ?? [],
  });
}

export function transitionTask(
  task: TaskState,
  next: TaskStatus,
  policy = defaultLifecyclePolicy,
): TaskState {
  const configured = lifecyclePolicy(policy);
  const position = configured.statuses.indexOf(task.status);
  if (position < 0)
    throw new RecordValidationError(
      "Task transition uses an unconfigured status.",
    );
  const resolved = resolveConfiguredStatus(next, policy);
  if (configured.statuses.indexOf(resolved) !== position + 1)
    throw new RecordValidationError(
      `Illegal task transition: ${task.status} -> ${resolved}.`,
    );
  if (
    configured.terminalStatuses.includes(resolved) &&
    !blockingGatesSatisfied(
      task.gateEvents.length
        ? replayGateHistory(task.gateEvents).gates
        : task.gates.map((gate) => ({
            id: gate.id,
            title: gate.title,
            blocking: gate.blocking ?? true,
            state: gate.state,
            evidence: [],
            ...(gate.satisfiedBy ? { satisfiedBy: gate.satisfiedBy } : {}),
          })),
    )
  )
    throw new RecordValidationError("task_terminal_transition_gate_blocked");
  return taskState({ ...task, status: resolved });
}

export function activeBlockers(
  events: readonly BlockerEvent[],
): readonly BlockerEvent[] {
  const open = new Map<string, BlockerEvent>();
  for (const event of events) {
    if (event.kind === "opened") {
      if (!event.reason)
        throw new RecordValidationError("blocker_duplicate_open");
      if (open.has(event.blockId))
        throw new RecordValidationError("blocker_duplicate_open");
      open.set(event.blockId, event);
    } else {
      if (!open.has(event.blockId))
        throw new RecordValidationError("blocker_unknown_or_repeat_clear");
      if (!event.reason && !event.evidence?.length)
        throw new RecordValidationError("blocker_clear_requires_evidence");
      open.delete(event.blockId);
    }
  }
  return [...open.values()];
}

export type ClaimState = "unclaimed" | "live" | "reclaimable";
export function claimState(task: TaskState, now: Date): ClaimState {
  if (!task.claim) return "unclaimed";
  const expiry = Date.parse(task.claim.expiresAt);
  if (Number.isNaN(expiry)) throw new RecordValidationError("lease_invalid");
  return expiry > now.getTime() ? "live" : "reclaimable";
}

export interface ReadinessReason {
  readonly taskId: CanonicalId;
  readonly reason: string;
}
export interface ReadySet {
  readonly ready: readonly CanonicalId[];
  readonly excluded: readonly ReadinessReason[];
}

function resolver(tasks: readonly TaskState[]): Map<string, CanonicalId> {
  const resolved = new Map<string, CanonicalId>();
  for (const task of tasks) {
    for (const value of [task.id, ...task.aliases]) {
      const key = aliasKey(value);
      if (resolved.has(key))
        throw new RecordValidationError("dependency_target_ambiguous");
      resolved.set(key, task.id);
    }
  }
  return resolved;
}

/** Validates all dependency and parent links as one authoritative workspace graph. */
export function validateTaskGraph(
  tasks: readonly TaskState[],
): Map<CanonicalId, readonly CanonicalId[]> {
  const byId = new Map<CanonicalId, TaskState>();
  for (const task of tasks) {
    taskState(task);
    activeBlockers(task.blockers);
    if (byId.has(task.id))
      throw new RecordValidationError("dependency_target_ambiguous");
    byId.set(task.id, task);
  }
  const aliases = resolver(tasks);
  const resolve = (raw: string): CanonicalId => {
    const id = aliases.get(aliasKey(raw));
    if (!id) throw new RecordValidationError("dependency_target_not_found");
    return id;
  };
  const links = new Map<CanonicalId, readonly CanonicalId[]>();
  for (const task of tasks) {
    const dependencies = task.dependencies.map(resolve);
    if (dependencies.some((id) => id === task.id))
      throw new RecordValidationError("dependency_self_edge");
    if (new Set(dependencies).size !== dependencies.length)
      throw new RecordValidationError("dependency_duplicate_edge");
    if (task.parentId) {
      const parent = resolve(task.parentId);
      if (parent === task.id)
        throw new RecordValidationError("parent_self_edge");
    }
    links.set(task.id, dependencies);
  }
  // A parent cycle is also invalid even though parenthood is not a readiness edge.
  const parentOf = new Map<CanonicalId, CanonicalId>();
  for (const task of tasks)
    if (task.parentId) parentOf.set(task.id, resolve(task.parentId));
  for (const task of tasks) {
    const seen = new Set<CanonicalId>();
    let current: CanonicalId | undefined = task.id;
    while (current && parentOf.has(current)) {
      if (seen.has(current)) throw new RecordValidationError("parent_cycle");
      seen.add(current);
      current = parentOf.get(current);
    }
  }
  const visited = new Set<CanonicalId>();
  const visiting = new Set<CanonicalId>();
  const walk = (id: CanonicalId): void => {
    if (visiting.has(id)) throw new RecordValidationError("dependency_cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of links.get(id) ?? []) walk(dependency);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of [...byId.keys()].sort()) walk(id);
  return links;
}

/** Canonicalizes aliases before an authored record is persisted. */
export function canonicalizeTaskLinks(
  tasks: readonly TaskState[],
): readonly TaskState[] {
  for (const task of tasks) taskState(task);
  const aliases = resolver(tasks);
  const resolve = (raw: string): CanonicalId => {
    const id = aliases.get(aliasKey(raw));
    if (!id) throw new RecordValidationError("dependency_target_not_found");
    return id;
  };
  const canonical = tasks.map((task) =>
    taskState({
      ...task,
      dependencies: task.dependencies.map(resolve),
      parentId: task.parentId ? resolve(task.parentId) : undefined,
    }),
  );
  validateTaskGraph(canonical);
  return canonical;
}

/**
 * Pure forward/back reference closure between one task and one milestone.
 * Callers persist both returned records in the same commit path.
 */
export function closeMilestoneReference(
  task: TaskState,
  milestone: MilestoneTaskSide,
  link: boolean,
): { readonly task: TaskState; readonly milestone: MilestoneTaskSide } {
  taskState(task);
  if (!milestoneIdPattern.test(milestone.id))
    throw new RecordValidationError("milestone_id_invalid");
  const linked = milestone.taskIds.includes(task.id);
  if (link) {
    if (task.milestoneId !== undefined && task.milestoneId !== milestone.id)
      throw new RecordValidationError("milestone_reference_conflict");
    if (!linked && task.milestoneId === milestone.id)
      throw new RecordValidationError("milestone_reference_drift");
    if (linked && task.milestoneId === milestone.id) return { task, milestone };
    return {
      task: taskState({ ...task, milestoneId: milestone.id }),
      milestone: linked
        ? milestone
        : {
            ...milestone,
            taskIds: [...milestone.taskIds, task.id].sort(),
          },
    };
  }
  if (task.milestoneId !== milestone.id || !linked)
    throw new RecordValidationError("milestone_reference_drift");
  return {
    task: taskState({ ...task, milestoneId: undefined }),
    milestone: {
      ...milestone,
      taskIds: milestone.taskIds.filter((id) => id !== task.id),
    },
  };
}

/** Fails loud when any milestone forward/back reference pair is open or dangling. */
export function validateMilestoneClosure(
  tasks: readonly TaskState[],
  milestones: readonly MilestoneTaskSide[],
): void {
  const seen = new Set(milestones.map((m) => m.id));
  if (
    seen.size !== milestones.length ||
    milestones.some((m) => !milestoneIdPattern.test(m.id))
  )
    throw new RecordValidationError("milestone_id_invalid");
  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const task of tasks)
    if (task.milestoneId !== undefined && !seen.has(task.milestoneId))
      throw new RecordValidationError("milestone_reference_dangling");
  for (const m of milestones)
    for (const taskId of m.taskIds) {
      const task = byId.get(taskId);
      if (!task || task.milestoneId !== m.id)
        throw new RecordValidationError("milestone_reference_dangling");
    }
}

/** Pure, deterministic ready-set evaluation; validates the whole graph before returning anything. */
export function evaluateReadySet(
  tasks: readonly TaskState[],
  now: Date,
  policy = defaultLifecyclePolicy,
): ReadySet {
  const configured = lifecyclePolicy(policy);
  const links = validateTaskGraph(tasks);
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ready: CanonicalId[] = [];
  const excluded: ReadinessReason[] = [];
  for (const task of [...tasks].sort((a, b) => a.id.localeCompare(b.id))) {
    if (task.status !== configured.statuses[0]) {
      excluded.push({ taskId: task.id, reason: "lifecycle_ineligible" });
      continue;
    }
    if (
      (links.get(task.id) ?? []).some((id) => {
        const dependency = byId.get(id);
        return (
          !dependency ||
          !configured.terminalStatuses.includes(dependency.status)
        );
      })
    ) {
      excluded.push({ taskId: task.id, reason: "dependency_incomplete" });
      continue;
    }
    if (activeBlockers(task.blockers).length) {
      excluded.push({ taskId: task.id, reason: "explicitly_blocked" });
      continue;
    }
    if (task.gates.some((gate) => gate.state === "pending")) {
      excluded.push({ taskId: task.id, reason: "pending_gate" });
      continue;
    }
    if (claimState(task, now) === "live") {
      excluded.push({ taskId: task.id, reason: "live_claim" });
      continue;
    }
    ready.push(task.id);
  }
  return { ready, excluded };
}

export function searchTasks(
  tasks: readonly TaskState[],
  query: string,
): readonly TaskState[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return [...tasks].sort((a, b) => a.id.localeCompare(b.id));
  return tasks
    .filter((task) =>
      [
        task.id,
        task.title,
        task.summary ?? "",
        task.description ?? "",
        ...task.aliases,
        ...task.labels,
      ]
        .join("\n")
        .toLocaleLowerCase()
        .includes(needle),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function findTask(
  tasks: readonly TaskState[],
  reference: string,
): TaskState {
  const matches = tasks.filter((task) =>
    [task.id, ...task.aliases].some(
      (value) => aliasKey(value) === aliasKey(reference),
    ),
  );
  if (matches.length === 0) throw new RecordValidationError("task_not_found");
  if (matches.length > 1)
    throw new RecordConflictError("task_reference_ambiguous");
  const match = matches[0];
  if (!match) throw new RecordValidationError("task_not_found");
  return match;
}
