import type {
  LoreConceptRecord,
  LoreProjection,
  LoreProjectionManifest,
} from "../../ports/lore.ts";

export class LoreUnavailableError extends Error {
  readonly kind = "unavailable" as const;
}

export class LoreIncompatibleError extends Error {
  readonly kind = "incompatible" as const;
}

function incompatible(): never {
  throw new LoreIncompatibleError(
    "Lore export capability or schema is incompatible.",
  );
}

/** Runtime decoder for the public Lore export contract. */
export function decodeLoreProjection(value: unknown): LoreProjection {
  if (!value || typeof value !== "object") return incompatible();
  const candidate = value as {
    schemaVersion?: unknown;
    kind?: unknown;
    data?: unknown;
  };
  if (candidate.schemaVersion !== 1 || candidate.kind !== "projection.export")
    return incompatible();
  if (!candidate.data || typeof candidate.data !== "object")
    return incompatible();
  const data = candidate.data as {
    projectionSchemaVersion?: unknown;
    records?: unknown;
  };
  if (data.projectionSchemaVersion !== "1.0" || !Array.isArray(data.records))
    return incompatible();
  const records = data.records.map(
    (record): LoreProjectionManifest | LoreConceptRecord => {
      if (!record || typeof record !== "object") return incompatible();
      const entry = record as Record<string, unknown>;
      if (
        entry.record === "manifest" &&
        entry.schemaVersion === "1.0" &&
        entry.bundle &&
        typeof entry.bundle === "object"
      ) {
        const bundle = entry.bundle as Record<string, unknown>;
        if (
          typeof bundle.id === "string" &&
          typeof bundle.gitCommit === "string"
        )
          return {
            record: "manifest",
            schemaVersion: "1.0",
            bundle: { id: bundle.id, gitCommit: bundle.gitCommit },
          };
      }
      if (
        entry.record === "concept" &&
        typeof entry.id === "string" &&
        typeof entry.path === "string" &&
        typeof entry.contentHash === "string"
      )
        return {
          record: "concept",
          id: entry.id,
          path: entry.path,
          contentHash: entry.contentHash,
        };
      return incompatible();
    },
  );
  return {
    schemaVersion: 1,
    kind: "projection.export",
    data: { projectionSchemaVersion: "1.0", records },
  };
}

/** Invokes only Lore's published `export --json` command; no Lore storage is read. */
export class LoreCliProjectionReader {
  constructor(
    private readonly options: {
      readonly executable?: string;
      readonly cwd?: string;
    } = {},
  ) {}

  async exportProjection(): Promise<LoreProjection> {
    let child: ReturnType<typeof Bun.spawn>;
    try {
      child = Bun.spawn(
        [this.options.executable ?? "lore", "export", "--json"],
        { cwd: this.options.cwd, stdout: "pipe", stderr: "pipe" },
      );
    } catch {
      throw new LoreUnavailableError("Lore could not be started.");
    }
    if (
      !(child.stdout instanceof ReadableStream) ||
      !(child.stderr instanceof ReadableStream)
    )
      throw new LoreUnavailableError("Lore export streams are unavailable.");
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    if (exitCode !== 0)
      throw new LoreUnavailableError(stderr.trim() || "Lore export failed.");
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new LoreUnavailableError("Lore export did not return JSON.");
    }
    return decodeLoreProjection(parsed);
  }
}
