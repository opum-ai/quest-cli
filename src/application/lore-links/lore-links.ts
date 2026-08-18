import { RecordValidationError } from "../../domain/records.ts";
import type { TaskState } from "../../domain/tasks/tasks.ts";
import {
  type LoreConceptRecord,
  type LoreProjection,
  type LoreProjectionManifest,
  type LoreProjectionReader,
  loreProjectionSchemaVersion,
} from "../../ports/lore.ts";

export type {
  LoreConceptRecord,
  LoreProjection,
  LoreProjectionManifest,
  LoreProjectionReader,
};
export { loreProjectionSchemaVersion as LORE_PROJECTION_SCHEMA_VERSION };

export interface LoreConceptIdentity {
  readonly conceptId: string;
  readonly sourceRepository: string;
  readonly revision: string;
  readonly path: string;
  readonly schemaVersion: typeof loreProjectionSchemaVersion;
  readonly contentProvenance: string;
}

export interface LoreLinkEvent {
  readonly schemaVersion: 1;
  readonly kind: "lore.concept-linked";
  readonly taskId: string;
  readonly operationId: string;
  readonly documentation: string;
  readonly concept: LoreConceptIdentity;
}

export interface LoreLinkSnapshot {
  readonly revision: string;
  readonly task: TaskState;
}

/** The eventual task-record adapter must commit its reference and event atomically. */
export interface LoreLinkStore {
  read(reference: string): Promise<LoreLinkSnapshot>;
  commit(request: {
    readonly expectedRevision: string;
    readonly operationId: string;
    readonly task: TaskState;
    readonly event: LoreLinkEvent;
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | { readonly kind: "conflict" }
  >;
}

export class LoreLinkValidationError extends Error {
  readonly kind = "validation" as const;
}

function invalid(message: string): never {
  throw new LoreLinkValidationError(message);
}

function manifest(
  records: readonly (LoreProjectionManifest | LoreConceptRecord)[],
): LoreProjectionManifest {
  const entries = records.filter(
    (record): record is LoreProjectionManifest => record.record === "manifest",
  );
  if (entries.length !== 1)
    invalid("Lore export must contain exactly one manifest.");
  const value = entries[0];
  if (!value?.bundle.id || !value.bundle.gitCommit)
    invalid("Lore export manifest has incomplete source provenance.");
  return value;
}

/**
 * Re-validates every caller-supplied provenance component against one public,
 * versioned Lore export. It deliberately does no Quest write itself.
 */
export function validateLoreConcept(
  projection: LoreProjection,
  requested: LoreConceptIdentity,
): LoreConceptIdentity {
  if (
    projection.schemaVersion !== 1 ||
    projection.kind !== "projection.export" ||
    projection.data.projectionSchemaVersion !== loreProjectionSchemaVersion
  ) {
    invalid("Lore export capability or schema is incompatible.");
  }
  const source = manifest(projection.data.records);
  if (source.bundle.id !== requested.sourceRepository)
    invalid(
      "Lore export source repository does not match the requested concept.",
    );
  if (source.bundle.gitCommit !== requested.revision)
    invalid("Lore export revision is stale for the requested concept.");
  const concepts = projection.data.records.filter(
    (record): record is LoreConceptRecord =>
      record.record === "concept" && record.id === requested.conceptId,
  );
  if (concepts.length !== 1)
    invalid("Lore concept identifier is missing or ambiguous.");
  const concept = concepts[0];
  if (!concept || requested.schemaVersion !== loreProjectionSchemaVersion)
    invalid("Lore concept schema is incompatible.");
  if (concept.path !== requested.path)
    invalid("Lore concept path does not match the requested concept.");
  if (concept.contentHash !== requested.contentProvenance)
    invalid("Lore concept content provenance is stale.");
  return requested;
}

/** Stable, explicit, and non-display-only reference persisted on the Quest task. */
export function loreDocumentationReference(
  concept: LoreConceptIdentity,
): string {
  const query = new URLSearchParams({
    revision: concept.revision,
    path: concept.path,
    schema: concept.schemaVersion,
    content: concept.contentProvenance,
  });
  return `lore://${encodeURIComponent(concept.sourceRepository)}/concept/${encodeURIComponent(concept.conceptId)}?${query}`;
}

/**
 * Validates the entire Lore public record exchange before reading the task.
 * Consequently unavailable, incompatible, stale, or missing Lore records have
 * no Quest-store effect; a store conflict also never reports success.
 */
export async function linkLoreConcept(
  reader: LoreProjectionReader,
  store: LoreLinkStore,
  request: {
    readonly taskReference: string;
    readonly operationId: string;
    readonly concept: LoreConceptIdentity;
  },
): Promise<
  | {
      readonly kind: "success";
      readonly revision: string;
      readonly event: LoreLinkEvent;
    }
  | { readonly kind: "conflict" }
> {
  if (!request.operationId)
    throw new RecordValidationError("Lore link operation id is required.");
  const concept = validateLoreConcept(
    await reader.exportProjection(),
    request.concept,
  );
  const current = await store.read(request.taskReference);
  const documentation = loreDocumentationReference(concept);
  const task = {
    ...current.task,
    documentation: current.task.documentation.includes(documentation)
      ? current.task.documentation
      : [...current.task.documentation, documentation],
  };
  const event: LoreLinkEvent = {
    schemaVersion: 1,
    kind: "lore.concept-linked",
    taskId: current.task.id,
    operationId: request.operationId,
    documentation,
    concept,
  };
  const result = await store.commit({
    expectedRevision: current.revision,
    operationId: request.operationId,
    task,
    event,
  });
  return result.kind === "success"
    ? { kind: "success", revision: result.revision, event }
    : result;
}
