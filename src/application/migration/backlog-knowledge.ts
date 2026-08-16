import { createHash } from "node:crypto";

import type {
  LoreAdoptionLedger,
  LoreAdoptionPreview,
  LoreBacklogCli,
  LoreKnowledgeType,
} from "../../adapters/lore/backlog-cli.ts";
import type { MigrationPreview } from "../../domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../domain/records.ts";

import type { MigrationApplyResult, MigrationService } from "./migration.ts";

export interface BacklogKnowledgeRecord {
  readonly id: string;
  readonly path: string;
  readonly title?: string;
  readonly content: string;
  /** Backlog documents and decisions are knowledge; task lifecycle records are issues. */
  readonly kind:
    | "decision"
    | "specification"
    | "guide"
    | "runbook"
    | "other"
    | "readme";
}

export interface BacklogPartition<TIssue> {
  readonly issues: readonly TIssue[];
  readonly knowledge: readonly BacklogKnowledgeRecord[];
}

/** Keeps standalone issue adoption independent from the optional Lore executable. */
export function partitionBacklogRecords<TIssue>(
  issues: readonly TIssue[],
  knowledge: readonly BacklogKnowledgeRecord[],
): BacklogPartition<TIssue> {
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const record of knowledge) {
    if (!record.id || !record.path || !record.content)
      throw new RecordValidationError("backlog_knowledge_record_invalid");
    if (
      record.path.startsWith("/") ||
      record.path.split(/[\\/]/).includes("..")
    )
      throw new RecordValidationError("backlog_knowledge_path_invalid");
    if (ids.has(record.id) || paths.has(record.path))
      throw new RecordConflictError("backlog_knowledge_duplicate_identity");
    ids.add(record.id);
    paths.add(record.path);
  }
  return { issues: [...issues], knowledge: [...knowledge] };
}

export interface BacklogLoreFullPreview {
  readonly digest: string;
  readonly quest: MigrationPreview;
  readonly lore: LoreAdoptionPreview;
}

export interface BacklogLoreFullApply {
  readonly kind: "success" | "compensated" | "blocked-incomplete";
  readonly quest?: MigrationApplyResult;
  readonly lore?: LoreAdoptionLedger;
  /** Stable Lore concept IDs keyed by the Backlog knowledge source ID. */
  readonly conceptLinks: readonly {
    readonly sourceId: string;
    readonly conceptId: string;
  }[];
  /** Exact surviving artifacts, never a guessed clean state. */
  readonly survivors: readonly string[];
  /** Durable public receipts and explicit unknown boundaries from compensation. */
  readonly compensationEvidence: readonly string[];
  readonly cause?: string;
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function planDigest(
  quest: MigrationPreview,
  lore: LoreAdoptionPreview,
): string {
  return createHash("sha256")
    .update(
      canonical({
        questDigest: quest.digest,
        loreApproval: lore.approval.digest,
        migration: lore.migration,
      }),
    )
    .digest("hex");
}

function contentDigest(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

function assertCompatibleLorePreview(
  preview: LoreAdoptionPreview,
  knowledge: readonly BacklogKnowledgeRecord[],
): void {
  if (preview.records.length !== knowledge.length)
    throw new RecordConflictError("lore_knowledge_preview_count_mismatch");
  const expected = new Map(knowledge.map((record) => [record.id, record]));
  for (const record of preview.records) {
    const source = expected.get(record.source.id);
    if (
      !source ||
      source.path !== record.source.path ||
      source.kind !== record.source.type ||
      contentDigest(source.content) !== record.source.digest
    )
      throw new RecordConflictError("lore_knowledge_preview_source_mismatch");
    if (
      record.collision ||
      record.fidelityGap ||
      !record.id ||
      !record.path ||
      !record.type
    )
      throw new RecordConflictError("lore_knowledge_preview_not_applicable");
  }
}

function survivors(
  quest: MigrationApplyResult | undefined,
  lore: LoreAdoptionLedger | undefined,
): string[] {
  const result = [
    ...(quest?.manualReconciliation ?? []).map(
      (identifier) => `quest:${identifier}`,
    ),
    ...(lore?.created
      .filter((created) => !created.removed)
      .map((created) => `lore:${created.id}`) ?? []),
  ];
  return [...new Set(result)].sort();
}

function completeLoreRollback(ledger: LoreAdoptionLedger | undefined): boolean {
  return (
    ledger?.state === "rolled-back" &&
    ledger.created.every((created) => created.removed)
  );
}

/**
 * Coordinates the released Lore migration as a separate product. Quest never
 * writes Lore paths: it supplies a caller-persisted source manifest to Lore's
 * public CLI and consumes only its JSON receipts.
 */
export class BacklogLoreMigrationSaga {
  constructor(
    private readonly quest: MigrationService,
    private readonly lore: LoreBacklogCli,
  ) {}

  /** Issue-only callers use this path and do not need Lore installed. */
  previewIssues(): Promise<MigrationPreview> {
    return this.quest.preview();
  }

  applyIssues(
    preview: MigrationPreview,
    approvedDigest: string,
  ): Promise<MigrationApplyResult> {
    return this.quest.apply(preview, approvedDigest);
  }

  async previewFull(
    manifestPath: string,
    knowledge: readonly BacklogKnowledgeRecord[],
    migration?: string,
  ): Promise<BacklogLoreFullPreview> {
    const [quest, lore] = await Promise.all([
      this.quest.preview(),
      this.lore.preview(manifestPath, migration),
    ]);
    assertCompatibleLorePreview(lore, knowledge);
    return { digest: planDigest(quest, lore), quest, lore };
  }

  async applyFull(
    preview: BacklogLoreFullPreview,
    approvedDigest: string,
    manifestPath: string,
  ): Promise<BacklogLoreFullApply> {
    if (approvedDigest !== planDigest(preview.quest, preview.lore))
      throw new RecordValidationError("backlog_lore_approval_digest_mismatch");
    let lore: LoreAdoptionLedger | undefined;
    let quest: MigrationApplyResult | undefined;
    let loreApplyBegun = false;
    let questApplyBegun = false;
    try {
      // The order is intentional: Lore's receipt provides stable concept IDs before Quest applies.
      loreApplyBegun = true;
      lore = await this.lore.apply(
        manifestPath,
        preview.lore.approval.digest,
        preview.lore.migration,
      );
      if (lore.state !== "applied")
        throw new RecordConflictError("lore_knowledge_apply_not_complete");
      const expectedIds = new Set(
        preview.lore.records.map((record) => record.id),
      );
      const expectedConcepts = new Map(
        preview.lore.records.map((record) => [record.id, record]),
      );
      if (
        lore.created.length !== expectedIds.size ||
        lore.created.some((created) => {
          const expected = expectedConcepts.get(created.id);
          return (
            !expected ||
            expected.path !== created.path ||
            expected.contentDigest !== created.contentDigest
          );
        })
      )
        throw new RecordConflictError("lore_knowledge_apply_mapping_mismatch");
      questApplyBegun = true;
      quest = await this.quest.apply(preview.quest, preview.quest.digest);
      if (quest.kind !== "success")
        throw new RecordConflictError("quest_issue_apply_not_complete");
      return {
        kind: "success",
        quest,
        lore,
        conceptLinks: preview.lore.records.map((record) => {
          if (!record.id)
            throw new RecordConflictError(
              "lore_knowledge_apply_mapping_mismatch",
            );
          return { sourceId: record.source.id, conceptId: record.id };
        }),
        survivors: [],
        compensationEvidence: [],
      };
    } catch (error) {
      // Reverse product order. Both products retain their own durable rollback evidence.
      let questRollback: MigrationApplyResult | undefined;
      let loreRollback = lore;
      const evidence: string[] = [];
      let questRollbackKnown = !questApplyBegun;
      if (quest?.kind === "success") {
        try {
          const result = await this.quest.rollback();
          questRollback = {
            kind: "conflict",
            manualReconciliation: result.manualReconciliation,
          };
          questRollbackKnown = true;
          evidence.push("quest:rollback-receipt");
        } catch {
          evidence.push("quest:rollback-unknown");
        }
      } else if (questApplyBegun) {
        // A conflict/throw has no operation identity from MigrationService. Never
        // risk rolling back a different, pre-existing Quest migration.
        evidence.push("quest:rollback-not-owned");
      }
      let loreRollbackKnown = !loreApplyBegun;
      if (loreApplyBegun) {
        try {
          loreRollback = await this.lore.rollback(preview.lore.migration);
          loreRollbackKnown = completeLoreRollback(loreRollback);
          evidence.push("lore:rollback-receipt");
        } catch {
          // Status is still only the public CLI ledger; never inspect Lore paths.
          try {
            loreRollback = await this.lore.status(preview.lore.migration);
            loreRollbackKnown = completeLoreRollback(loreRollback);
            evidence.push("lore:status-receipt");
          } catch {
            evidence.push("lore:rollback-unknown");
          }
        }
      }
      const remaining = [
        ...survivors(questRollback, loreRollback),
        ...(questRollbackKnown ? [] : ["quest:rollback-unknown"]),
        ...(loreRollbackKnown ? [] : ["lore:rollback-unknown"]),
      ].sort();
      return {
        kind:
          remaining.length || !questRollbackKnown || !loreRollbackKnown
            ? "blocked-incomplete"
            : "compensated",
        ...(quest ? { quest } : {}),
        ...(loreRollback ? { lore: loreRollback } : {}),
        conceptLinks: [],
        survivors: remaining,
        compensationEvidence: evidence,
        cause:
          error instanceof Error
            ? error.message
            : "Backlog/Lore migration failed.",
      };
    }
  }

  static manifestRecords(records: readonly BacklogKnowledgeRecord[]) {
    return records.map((record) => ({
      id: record.id,
      type: record.kind as LoreKnowledgeType,
      path: record.path,
      content: record.content,
      ...(record.title ? { title: record.title } : {}),
    }));
  }
}
