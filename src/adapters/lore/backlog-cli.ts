import { createHash } from "node:crypto";

export const loreBacklogAdoptionSourceSchema =
  "lore-backlog-adoption-source/1" as const;
export const loreBacklogAdoptionPlanSchema =
  "lore-backlog-adoption-plan/1" as const;

export type LoreKnowledgeType =
  | "decision"
  | "specification"
  | "guide"
  | "runbook"
  | "other"
  | "readme";

export interface LoreAdoptionSourceRecord {
  readonly id: string;
  readonly type: LoreKnowledgeType;
  readonly path: string;
  readonly digest: string;
  readonly content: string;
  readonly title?: string;
}

export interface LoreAdoptionSourceManifest {
  readonly schema: typeof loreBacklogAdoptionSourceSchema;
  readonly repository: { readonly id: string; readonly revision: string };
  readonly records: readonly LoreAdoptionSourceRecord[];
  readonly migration?: string;
}

export interface LoreAdoptionRecord {
  readonly source: Pick<
    LoreAdoptionSourceRecord,
    "id" | "path" | "type" | "digest"
  >;
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
    readonly schema: typeof loreBacklogAdoptionPlanSchema;
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

export interface LoreCliRunner {
  run(argv: readonly string[]): Promise<{
    readonly exitCode: number;
    readonly stdout: string;
    readonly stderr: string;
  }>;
}

export class LoreBacklogCliError extends Error {
  constructor(
    readonly kind: "unavailable" | "incompatible" | "failed",
    message: string,
  ) {
    super(message);
  }
}

class BunLoreCliRunner implements LoreCliRunner {
  async run(argv: readonly string[]) {
    let child: ReturnType<typeof Bun.spawn>;
    try {
      child = Bun.spawn([...argv], { stdout: "pipe", stderr: "pipe" });
    } catch {
      throw new LoreBacklogCliError(
        "unavailable",
        "Lore could not be started.",
      );
    }
    if (
      !(child.stdout instanceof ReadableStream) ||
      !(child.stderr instanceof ReadableStream)
    )
      throw new LoreBacklogCliError(
        "unavailable",
        "Lore streams are unavailable.",
      );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
  }
}

function invalid(message: string): never {
  throw new LoreBacklogCliError("incompatible", message);
}

function digest(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Lore returned an invalid adoption result.");
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value)
    invalid("Lore returned an incomplete adoption result.");
  return value;
}

function knowledgeType(value: unknown): LoreKnowledgeType {
  if (
    value !== "decision" &&
    value !== "specification" &&
    value !== "guide" &&
    value !== "runbook" &&
    value !== "other" &&
    value !== "readme"
  )
    invalid("Lore returned an unknown Backlog knowledge type.");
  return value;
}

function envelope(
  stdout: string,
  expectedKind: string,
): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    invalid("Lore adoption did not return JSON.");
  }
  const result = record(parsed);
  if (result.schemaVersion !== 1 || result.kind !== expectedKind)
    invalid("Lore adoption result is incompatible.");
  return record(result.data);
}

function preview(value: unknown): LoreAdoptionPreview {
  const result = record(value);
  const approval = record(result.approval);
  if (approval.schema !== loreBacklogAdoptionPlanSchema)
    invalid("Lore adoption plan schema is incompatible.");
  if (!Array.isArray(result.records))
    invalid("Lore adoption preview lacks records.");
  return {
    migration: text(result.migration),
    source: (() => {
      const source = record(result.source);
      return { id: text(source.id), revision: text(source.revision) };
    })(),
    records: result.records.map((item): LoreAdoptionRecord => {
      const candidate = record(item);
      const source = record(candidate.source);
      const type = candidate.type;
      if (
        type !== "ADR" &&
        type !== "Spec" &&
        type !== "Runbook" &&
        type !== "Reference" &&
        type !== null
      )
        invalid("Lore returned an unknown concept type.");
      const nullableText = (entry: unknown) =>
        entry === null ? null : text(entry);
      return {
        source: {
          id: text(source.id),
          path: text(source.path),
          type: knowledgeType(source.type),
          digest: text(source.digest),
        },
        type,
        id: nullableText(candidate.id),
        path: nullableText(candidate.path),
        contentDigest: nullableText(candidate.contentDigest),
        collision:
          candidate.collision === null
            ? null
            : (() => {
                const collision = record(candidate.collision);
                return {
                  path: text(collision.path),
                  reason: text(collision.reason),
                };
              })(),
        fidelityGap:
          candidate.fidelityGap === null
            ? null
            : (() => {
                const gap = record(candidate.fidelityGap);
                return {
                  recordId: text(gap.recordId),
                  sourceType: text(gap.sourceType),
                  reason: text(gap.reason),
                };
              })(),
      };
    }),
    approval: {
      schema: loreBacklogAdoptionPlanSchema,
      migration: text(approval.migration),
      manifestDigest: text(approval.manifestDigest),
      proposedArtifactDigest: text(approval.proposedArtifactDigest),
      digest: text(approval.digest),
    },
  };
}

function ledger(value: unknown): LoreAdoptionLedger {
  const result = record(value);
  const state = result.state;
  if (
    state !== "previewed" &&
    state !== "applied" &&
    state !== "rolled-back" &&
    state !== "blocked-incomplete"
  )
    invalid("Lore returned an unknown adoption state.");
  if (!Array.isArray(result.created))
    invalid("Lore adoption ledger lacks created artifacts.");
  return {
    migration: text(result.migration),
    state,
    created: result.created.map((item) => {
      const created = record(item);
      if (typeof created.removed !== "boolean")
        invalid("Lore adoption ledger has an invalid artifact.");
      return {
        id: text(created.id),
        path: text(created.path),
        contentDigest: text(created.contentDigest),
        removed: created.removed,
      };
    }),
  };
}

/** A narrow adapter for Lore 0.3's published adoption commands only. */
export class LoreBacklogCli {
  constructor(
    private readonly runner: LoreCliRunner = new BunLoreCliRunner(),
    private readonly executable = "lore",
  ) {}

  static sourceManifest(
    repository: LoreAdoptionSourceManifest["repository"],
    records: readonly Omit<LoreAdoptionSourceRecord, "digest">[],
    migration?: string,
  ): LoreAdoptionSourceManifest {
    return {
      schema: loreBacklogAdoptionSourceSchema,
      repository,
      records: records.map((item) => ({
        ...item,
        digest: digest(item.content),
      })),
      ...(migration ? { migration } : {}),
    };
  }

  async preview(
    manifest: string,
    migration?: string,
  ): Promise<LoreAdoptionPreview> {
    return preview(
      await this.invoke("backlog.adoption.preview", [
        "backlog",
        "adopt",
        "preview",
        "--manifest",
        manifest,
        ...(migration ? ["--migration", migration] : []),
      ]),
    );
  }

  async apply(
    manifest: string,
    approvalDigest: string,
    migration?: string,
  ): Promise<LoreAdoptionLedger> {
    return ledger(
      await this.invoke("backlog.adoption.apply", [
        "backlog",
        "adopt",
        "apply",
        "--manifest",
        manifest,
        "--approval-digest",
        approvalDigest,
        ...(migration ? ["--migration", migration] : []),
      ]),
    );
  }

  async status(migration: string): Promise<LoreAdoptionLedger> {
    return ledger(
      await this.invoke("backlog.adoption.status", [
        "backlog",
        "adopt",
        "status",
        "--migration",
        migration,
      ]),
    );
  }

  async rollback(migration: string): Promise<LoreAdoptionLedger> {
    return ledger(
      await this.invoke("backlog.adoption.rollback", [
        "backlog",
        "adopt",
        "rollback",
        "--migration",
        migration,
      ]),
    );
  }

  private async invoke(
    expectedKind: string,
    arguments_: readonly string[],
  ): Promise<Record<string, unknown>> {
    const result = await this.runner.run([
      this.executable,
      ...arguments_,
      "--json",
    ]);
    if (result.exitCode !== 0)
      throw new LoreBacklogCliError(
        "failed",
        result.stderr.trim() || "Lore adoption failed.",
      );
    return envelope(result.stdout, expectedKind);
  }
}
