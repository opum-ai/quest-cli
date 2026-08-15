import { z } from "zod";
import { caseFold } from "unicode-case-folding";

export const RECORD_SCHEMA_VERSION = 1 as const;

export class RecordConflictError extends Error {
  readonly kind = "conflict" as const;
}

export class RecordValidationError extends Error {
  readonly kind = "validation" as const;
}

const canonicalIdPattern = /^T-[1-9][0-9]*$/;
export const canonicalIdSchema = z.string().regex(canonicalIdPattern);
export type CanonicalId = z.infer<typeof canonicalIdSchema>;

/** Validates the one fixed, ASCII-only canonical identifier spelling. */
export function canonicalId(value: string): CanonicalId {
  if (!canonicalIdPattern.test(value)) {
    throw new RecordValidationError(`Invalid canonical id: ${value}`);
  }
  return value;
}

export interface GlobalCounter {
  readonly schemaVersion: typeof RECORD_SCHEMA_VERSION;
  readonly revision: string;
  readonly nextSequence: string;
}

/**
 * Produces the CAS precondition and replacement counter record; the Git adapter
 * owns comparing `expectedRevision` and writing the result atomically.
 */
export function allocateCanonicalId(
  counter: GlobalCounter,
  expectedRevision: string,
): { readonly id: CanonicalId; readonly replacement: GlobalCounter } {
  if (counter.revision !== expectedRevision) {
    throw new RecordConflictError("Global counter changed before allocation.");
  }
  if (!/^[1-9][0-9]*$/.test(counter.nextSequence)) {
    throw new RecordValidationError("Global counter sequence is invalid.");
  }
  const sequence = BigInt(counter.nextSequence);
  return {
    id: canonicalId(`T-${sequence}`),
    replacement: { ...counter, nextSequence: String(sequence + 1n) },
  };
}

/** NFC plus Unicode default-case-fold comparison key; input spelling is retained. */
export function aliasKey(alias: string): string {
  if (alias.length === 0)
    throw new RecordValidationError("Alias cannot be empty.");
  return caseFold(alias.normalize("NFC"));
}

export interface Alias {
  readonly display: string;
  readonly key: string;
}

export function alias(display: string): Alias {
  return { display, key: aliasKey(display) };
}

/** Detects every collision before a caller attempts an authored write. */
export function assertAliasesAvailable(
  candidates: readonly string[],
  existing: readonly Alias[],
): readonly Alias[] {
  const seen = new Map(existing.map((entry) => [entry.key, entry.display]));
  const result: Alias[] = [];
  for (const display of candidates) {
    const entry = alias(display);
    const collision = seen.get(entry.key);
    if (collision !== undefined) {
      throw new RecordConflictError(
        `Alias collision: ${JSON.stringify(display)} conflicts with ${JSON.stringify(collision)}.`,
      );
    }
    seen.set(entry.key, entry.display);
    result.push(entry);
  }
  return result;
}

const actorSchema = z.discriminatedUnion("kind", [
  z.object({
    id: z.string().min(1),
    kind: z.literal("human"),
    roles: z.array(z.enum(["reviewer", "maintainer"])).default([]),
  }),
  z.object({
    id: z.string().min(1),
    kind: z.literal("delegated-agent"),
    accountableHumanId: z.string().min(1),
    roles: z.array(z.enum(["reviewer", "maintainer"])).default([]),
  }),
]);
export type Actor = z.infer<typeof actorSchema>;

/** Opaque declarations only: actor IDs deliberately make no authentication claim. */
export function declareActor(value: unknown): Actor {
  const parsed = actorSchema.safeParse(value);
  if (!parsed.success)
    throw new RecordValidationError("Invalid actor declaration.");
  if (
    parsed.data.kind === "delegated-agent" &&
    parsed.data.id === parsed.data.accountableHumanId
  ) {
    throw new RecordValidationError(
      "A delegated agent must name a distinct accountable human.",
    );
  }
  if (new Set(parsed.data.roles).size !== parsed.data.roles.length) {
    throw new RecordValidationError("Actor roles cannot be duplicated.");
  }
  return parsed.data;
}

export const taskEventSchema = z.object({
  schemaVersion: z.literal(RECORD_SCHEMA_VERSION),
  eventId: z.string().min(1),
  operationId: z.string().min(1),
  taskId: canonicalIdSchema,
  actorId: z.string().min(1),
  basis: z.string().min(1).nullable(),
  patch: z.record(z.string(), z.unknown()),
});
export type TaskEvent = z.infer<typeof taskEventSchema>;

export interface TaskMaterialization {
  readonly schemaVersion: typeof RECORD_SCHEMA_VERSION;
  readonly taskId: CanonicalId;
  readonly events: readonly string[];
  readonly state: Readonly<Record<string, unknown>>;
}

function sameJson(left: unknown, right: unknown): boolean {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, entry]) => [key, canonicalize(entry)]),
      );
    }
    return value;
  };
  return (
    JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right))
  );
}

/** Append-only and operation-idempotent. Conflicting duplicate IDs fail before mutation. */
export function appendTaskEvent(
  events: readonly TaskEvent[],
  candidate: TaskEvent,
): readonly TaskEvent[] {
  const event = taskEventSchema.safeParse(candidate);
  if (!event.success) throw new RecordValidationError("Invalid task event.");
  const normalized = event.data;
  const duplicate = events.find(
    (item) =>
      item.eventId === normalized.eventId ||
      item.operationId === normalized.operationId,
  );
  if (duplicate !== undefined) {
    if (sameJson(duplicate, normalized)) return events;
    throw new RecordConflictError(
      "Duplicate event or operation id has different content.",
    );
  }
  if (events.some((item) => item.taskId !== normalized.taskId)) {
    throw new RecordValidationError(
      "A task event stream may contain one task only.",
    );
  }
  return [...events, normalized];
}

/** Replays only the authoritative events, in persisted order, with no hidden state. */
export function materializeTask(
  events: readonly TaskEvent[],
): TaskMaterialization {
  if (events.length === 0)
    throw new RecordValidationError(
      "Cannot materialize an empty task event stream.",
    );
  let accepted: readonly TaskEvent[] = [];
  let state: Record<string, unknown> = {};
  for (const event of events) {
    accepted = appendTaskEvent(accepted, event);
    state = { ...state, ...event.patch };
  }
  return {
    schemaVersion: RECORD_SCHEMA_VERSION,
    taskId: events[0].taskId,
    events: events.map((event) => event.eventId),
    state,
  };
}

export function assertReplayMatches(
  events: readonly TaskEvent[],
  persisted: TaskMaterialization,
): void {
  if (!sameJson(materializeTask(events), persisted)) {
    throw new RecordConflictError(
      "Persisted task materialization drifted from event replay.",
    );
  }
}
