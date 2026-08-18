/** Public Lore projection boundary consumed by the optional linking application service. */
export const loreProjectionSchemaVersion = "1.0" as const;

export interface LoreProjectionManifest {
  readonly record: "manifest";
  readonly schemaVersion: typeof loreProjectionSchemaVersion;
  readonly bundle: { readonly id: string; readonly gitCommit: string };
}

export interface LoreConceptRecord {
  readonly record: "concept";
  readonly id: string;
  readonly path: string;
  readonly contentHash: string;
}

export interface LoreProjection {
  readonly schemaVersion: 1;
  readonly kind: "projection.export";
  readonly data: {
    readonly projectionSchemaVersion: typeof loreProjectionSchemaVersion;
    readonly records: readonly (LoreProjectionManifest | LoreConceptRecord)[];
  };
}

export interface LoreProjectionReader {
  exportProjection(): Promise<LoreProjection>;
}

/** Public protocol for Lore's Backlog adoption commands. */
export type LoreKnowledgeType =
  | "decision"
  | "specification"
  | "guide"
  | "runbook"
  | "other"
  | "readme";

export interface LoreAdoptionRecord {
  readonly source: {
    readonly id: string;
    readonly path: string;
    readonly type: LoreKnowledgeType;
    readonly digest: string;
  };
  readonly type: "ADR" | "Spec" | "Runbook" | "Reference" | null;
  readonly id: string | null;
  readonly path: string | null;
  readonly contentDigest: string | null;
  readonly collision: { readonly path: string; readonly reason: string } | null;
  readonly fidelityGap: {
    readonly recordId: string;
    readonly sourceType: string;
    readonly reason: string;
  } | null;
}

export interface LoreAdoptionPreview {
  readonly migration: string;
  readonly source: { readonly id: string; readonly revision: string };
  readonly records: readonly LoreAdoptionRecord[];
  readonly approval: {
    readonly schema: "lore-backlog-adoption-plan/1";
    readonly migration: string;
    readonly manifestDigest: string;
    readonly proposedArtifactDigest: string;
    readonly digest: string;
  };
}

export interface LoreAdoptionLedger {
  readonly migration: string;
  readonly state:
    | "previewed"
    | "applied"
    | "rolled-back"
    | "blocked-incomplete";
  readonly created: readonly {
    readonly id: string;
    readonly path: string;
    readonly contentDigest: string;
    readonly removed: boolean;
  }[];
}

/** Adapter-neutral Lore adoption boundary used by the migration application service. */
export interface LoreBacklogAdoption {
  preview(manifest: string, migration?: string): Promise<LoreAdoptionPreview>;
  apply(
    manifest: string,
    approvalDigest: string,
    migration?: string,
  ): Promise<LoreAdoptionLedger>;
  status(migration: string): Promise<LoreAdoptionLedger>;
  rollback(migration: string): Promise<LoreAdoptionLedger>;
}
