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
