import { createHash } from "node:crypto";

import type { TrackerOutcome, TrackerTask } from "./index.ts";

/**
 * Public, read-only task-binding adapter for the opum-doc control plane
 * (ODOC-71.8). It consumes only the public tracker subprocess contract:
 * no Lore calls, no worktree operations, no private-storage coupling, and
 * no mutating commands are reachable through this surface.
 */
export const OPUM_AGENT_WORKFLOW_SCHEMA = "opum-agent-workflow/v1" as const;

/** Minimum public tracker contract version this adapter binds against. */
export const OPUM_AGENT_WORKFLOW_TRACKER_CONTRACT_VERSION = 1 as const;

export class OpumAgentWorkflowError extends Error {
  constructor(
    readonly error_type: TrackerOutcome,
    message: string,
    readonly input?: unknown,
  ) {
    super(message);
  }
}

function validation(message: string, input?: unknown): never {
  throw new OpumAgentWorkflowError("validation", message, input);
}

export interface TaskBindingRequest {
  /** Exact Quest task identifier to bind (for example `QCLI-97.5.1`). */
  readonly taskId: string;
  /**
   * Either a live claim reference or the driving correlation id that makes
   * this read accountable. Purely evidentiary: the adapter performs no claim
   * writes and acquires nothing.
   */
  readonly claimOrCorrelationId: string;
  /** Maximum accepted age of the task's own `updatedAt` evidence. */
  readonly maxAgeMs?: number;
  /** Deterministic observation instant; defaults to the current time. */
  readonly now?: Date;
}

export interface TaskBindingEvidence {
  readonly schemaVersion: typeof OPUM_AGENT_WORKFLOW_SCHEMA;
  readonly identity: {
    readonly taskId: string;
    readonly claimOrCorrelationId: string;
  };
  readonly revision: {
    /** Task-reported last modification timestamp, when published. */
    readonly updatedAt?: string;
    /** Instant at which the binding observation was made. */
    readonly observedAt: string;
    /**
     * Whether `updatedAt` is present and within `maxAgeMs` of `observedAt`.
     * When `maxAgeMs` is unset freshness is reported without an age bound.
     */
    readonly fresh: boolean;
  };
  /** Deterministic SHA-256 digest over the canonical task projection. */
  readonly digest: string;
  /** The full public task projection as returned by the tracker. */
  readonly task: TrackerTask;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, item]) => [key, canonicalize(item)] as const);
    return Object.fromEntries(entries);
  }
  return value;
}

/** Stable JSON serialization with sorted keys and no undefined fields. */
export function canonicalTaskJson(task: TrackerTask): string {
  return JSON.stringify(canonicalize(task));
}

/** Deterministic digest over the canonical public task projection. */
export function taskBindingDigest(task: TrackerTask): string {
  return createHash("sha256").update(canonicalTaskJson(task)).digest("hex");
}

/** Minimal read facade so callers can substitute any contract-conformant client. */
export interface OpumAgentTaskReader {
  view(id: string): Promise<TrackerTask>;
}

/**
 * Read-only binding adapter. Every operation maps subprocess or envelope
 * failures onto strict typed diagnostics; it never issues writes.
 */
export class OpumAgentWorkflowAdapter {
  constructor(private readonly reader: OpumAgentTaskReader) {}

  async bind(request: TaskBindingRequest): Promise<TaskBindingEvidence> {
    if (!request.taskId || typeof request.taskId !== "string") {
      validation("Task binding requires a non-empty taskId.", request);
    }
    if (
      !request.claimOrCorrelationId ||
      typeof request.claimOrCorrelationId !== "string"
    ) {
      validation(
        "Task binding requires a non-empty claimOrCorrelationId.",
        request,
      );
    }
    let task: TrackerTask;
    try {
      task = await this.reader.view(request.taskId);
    } catch (error) {
      if (error instanceof OpumAgentWorkflowError) throw error;
      throw new OpumAgentWorkflowError(
        "drift",
        "Quest task read failed contract conformance.",
        request.taskId,
      );
    }
    if (task.id !== request.taskId) {
      throw new OpumAgentWorkflowError(
        "conflict",
        "Quest returned a different task than the bound identifier.",
        { requested: request.taskId, returned: task.id },
      );
    }
    const observedAt = request.now ?? new Date();
    const observedMs = observedAt.getTime();
    if (!Number.isFinite(observedMs)) {
      validation("Binding requires a finite observation instant.", request.now);
    }
    let fresh = true;
    if (request.maxAgeMs !== undefined) {
      if (typeof request.maxAgeMs !== "number" || request.maxAgeMs < 0) {
        validation("maxAgeMs must be a non-negative number.", request);
      }
      fresh =
        task.updatedAt !== undefined &&
        Number.isFinite(Date.parse(task.updatedAt)) &&
        observedMs - Date.parse(task.updatedAt) <= request.maxAgeMs;
    }
    return {
      schemaVersion: OPUM_AGENT_WORKFLOW_SCHEMA,
      identity: {
        taskId: request.taskId,
        claimOrCorrelationId: request.claimOrCorrelationId,
      },
      revision: {
        ...(task.updatedAt === undefined ? {} : { updatedAt: task.updatedAt }),
        observedAt: observedAt.toISOString(),
        fresh,
      },
      digest: taskBindingDigest(task),
      task,
    };
  }
}
