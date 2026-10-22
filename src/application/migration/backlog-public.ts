import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Milestone } from "../../domain/planning/planning.ts";
import {
  type Alias,
  alias,
  type AliasCollision,
  canonicalIdPrefixPattern,
  type CanonicalId,
  assertAliasesAvailable,
  collectAliasCollisions,
  RecordConflictError,
  RecordValidationError,
} from "../../domain/records.ts";
import {
  canonicalizeTaskLinks,
  compareTaskIds,
  type TaskState,
  taskState,
} from "../../domain/tasks/tasks.ts";
import type {
  BacklogImportRecord,
  BacklogImportSource,
  MigrationTransactionRepository,
  PublicTaskRepository,
} from "../../ports/backlog-import.ts";
import type { GitPort } from "../../ports/git.ts";
import type { PlanningRepository } from "../../ports/planning.ts";
import {
  type IdBlockRequest,
  peekIdBlock,
  reserveIdBlock,
} from "../tasks/id-allocation.ts";

/**
 * QCLI-520: what the migration needs to mint its ids through the SHARED
 * allocator (`src/application/tasks/id-allocation.ts`) instead of computing
 * them from its own worktree. The lock, the reservation ledger and the
 * worktree scan all hang off the repository's common git dir, so a caller
 * with no Git repository behind its store supplies an allocation whose
 * `commonDirectory()` resolves null, which the allocator degrades correctly.
 * A PREVIEW or APPLY with no allocation at all is refused by name rather
 * than silently reverting to the pre-QCLI-520 arithmetic (round 1, MINOR 5).
 */
export interface BacklogIdAllocation {
  readonly git: GitPort;
  readonly worktreeRoot: string;
  /** `git rev-parse --git-common-dir`, or null for a raw `QUEST_TASK_STORE`
   * caller -- the same contract `IdAllocationRequest.commonDirectory` carries. */
  readonly commonDirectory: () => Promise<string | null>;
  /**
   * QCLI-520 round 1 (MAJOR 2): the ids this family already carries on local
   * refs. `quest task create` includes this source, and a migration that omits
   * it mints onto an id a sibling branch already published -- which no
   * worktree scan can see, because that branch is not checked out anywhere.
   * `recordDirectories` is the family's file-per-record directories, or null
   * for a family stored inside `.quest/planning.json`.
   */
  readonly idsOnOtherRefs: (
    marker: string,
    recordDirectories: readonly string[] | null,
  ) => Promise<readonly string[]>;
  /**
   * QCLI-520 round 1 (MAJOR 3): withdraw a block this run reserved, under the
   * allocator's lock. Called only on apply's failure paths after a
   * reservation.
   */
  readonly releaseIds: (
    family: string,
    marker: string,
    ids: readonly string[],
  ) => Promise<boolean>;
  /**
   * QCLI-520 round 1 (MINOR 1): a reservation that broke a stale lock says so,
   * exactly as a create's does. Optional: a caller with no output surface to
   * warn through can omit it.
   */
  readonly recordStaleLock?: (block: {
    readonly brokeStaleLock: boolean;
    readonly lockPath: string | null;
  }) => void;
}

export interface BacklogImportMapping {
  readonly sourceIdentifier: string;
  readonly sourceFolder: string;
  readonly targetIdentifier: string;
  readonly aliases: readonly string[];
}

/**
 * One mapping where the preserved-ids run actually changed the id (QCLI-168):
 * a dotted subtask id has no flat equivalent, so it is translated to a freshly
 * minted one rather than kept verbatim. `reason` makes that visible without
 * cross-referencing `aliases` -- the only way `sourceIdentifier` survives is
 * as an alias on the target, and a reader should not have to know that to see
 * this is a translated pair, not two unrelated ids.
 */
export interface BacklogRenumberedMapping {
  readonly sourceIdentifier: string;
  readonly targetIdentifier: string;
  readonly reason: "dotted_subtask_translated";
}

/** Selects one id family (Backlog display prefix) to import with its source
 * ids preserved verbatim, instead of the default positional renumbering.
 * A source backlog holding more than one family (QCLI-160: lore-cli's
 * LCLI+LORE, opum-doc's ODOC+OCLI) is imported one family per run, on
 * purpose -- merging two families into one target namespace was ruled out
 * as inventing a scheme the source data does not itself have. */
export interface BacklogPreservationOptions {
  readonly family: string;
}

export interface BacklogExcludedRecord {
  readonly sourceIdentifier: string;
  readonly family?: string;
}

export interface BacklogUnpreservableRecord {
  readonly sourceIdentifier: string;
  readonly reason: "malformed_source_id" | "parent_not_found";
  readonly detail?: string;
}

/**
 * Thrown instead of failing on the first problem, so the operator sees every
 * id collision and every unpreservable record in one report and can resolve
 * them together rather than rediscovering the next one on a second preview.
 */
export class BacklogMigrationRefusedError extends Error {
  readonly kind = "conflict" as const;
  constructor(
    message: string,
    readonly details: {
      readonly collisions: readonly AliasCollision[];
      readonly unpreservable: readonly BacklogUnpreservableRecord[];
    },
  ) {
    super(message);
  }
}

/**
 * QCLI-520 round 1 (MINOR 4): the allocator answered with fewer ids than the
 * count requested. Each call site this replaced fell back to the pre-QCLI-520
 * arithmetic for the missing position, which would have written one batch
 * numbered by two different schemes; a short block is a contract violation,
 * not a partial success, so it is refused by name instead.
 */
export class BacklogIdBlockShortError extends Error {
  constructor(detail: string) {
    super(`migration_id_block_short: ${detail}`);
    this.name = "BacklogIdBlockShortError";
  }
}

/**
 * QCLI-520 round 1 (MINOR 5): a preview or apply reached an import service
 * with no id allocator wired. The pre-QCLI-520 arithmetic was silently used in
 * that state, which is exactly the defect this task exists to close: a
 * caller with a real repository behind its store must not lose the lock, the
 * ledger and the worktree scan because a construction site forgot a parameter.
 * A caller with NO repository supplies an allocation whose
 * `commonDirectory()` resolves null, which the allocator degrades correctly.
 */
export class BacklogIdAllocationMissingError extends Error {
  constructor() {
    super(
      "migration_id_allocation_missing: this Backlog migration has no id allocator wired, so its minted ids would bypass the shared lock, reservation ledger and worktree scan. A caller with no Git repository behind its store must pass an allocation whose commonDirectory() resolves null.",
    );
    this.name = "BacklogIdAllocationMissingError";
  }
}

/** The id at `index` of a block the allocator returned, or a named refusal.
 * QCLI-520 round 1 (MINOR 4): never a silent fallback to local arithmetic. */
function requiredMintedId(
  ids: readonly string[],
  index: number,
  count: number,
  context: string,
): string {
  const id = ids[index];
  if (id !== undefined) return id;
  throw new BacklogIdBlockShortError(
    `${context} answered ${ids.length} id(s) for a block of ${count}, so the id at position ${index + 1} is missing. Nothing was written.`,
  );
}

interface Receipt {
  readonly schemaVersion: 1;
  readonly kind: "migration.backlog.receipt";
  readonly digest: string;
  readonly sourceFingerprint: string;
  readonly mappings: readonly BacklogImportMapping[];
  readonly state: "applying" | "applied" | "failed" | "rolled-back";
  readonly survivors: readonly string[];
  readonly taskFingerprints: Readonly<Record<string, string>>;
}

export interface BacklogPreview {
  readonly sourceFingerprint: string;
  readonly digest: string;
  readonly mappings: readonly BacklogImportMapping[];
  readonly requiresApproval: true;
  /** Records left behind because they belong to a different id family than
   * the one selected for preservation. Only present in preservation mode. */
  readonly excluded?: readonly BacklogExcludedRecord[];
  /** The subset of `mappings` whose id actually changed (QCLI-168), so a
   * consumer does not have to diff the full list by hand to find out what a
   * preserved-ids run is about to change. Additive: `mappings` itself is
   * unchanged and still carries every record. Only present in preservation
   * mode -- the positional (non-preserved) path renumbers every record, so
   * isolating "the ones that changed" there would just repeat the full list. */
  readonly renumbered?: readonly BacklogRenumberedMapping[];
}

function fingerprint(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function receiptPath(root: string, digest: string): string {
  return join(root, ".quest", "migrations", "backlog", `${digest}.json`);
}

async function save(path: string, receipt: Receipt): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(receipt)}\n`, "utf8");
  await rename(temporary, path);
}

async function load(path: string): Promise<Receipt | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as Receipt;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

/**
 * Backlog writes its dates in three shapes: a bare date (`2025-06-01`), a
 * zone-less local datetime (`2025-06-02 14:23`), and occasionally full
 * ISO-8601. Quest's own stamps are always ISO-8601 UTC, and QCLI-137 made
 * `createdAt`/`updatedAt` sortable. Promoting the source form verbatim made
 * that sort compare mixed formats lexicographically — a space sorts before
 * `T`, so same-instant records interleaved by format rather than by time — and
 * made `new Date(value)` parse imported records in the host's timezone while
 * parsing native ones in UTC.
 *
 * Two decisions this encodes (QCLI-152):
 *
 * Zone-less input is read as UTC, not as local time. The source states no
 * offset, and reading it as local would make the same file import to different
 * instants on different machines — the import would stop being deterministic,
 * which matters more here than guessing the author's chair correctly.
 *
 * A bare date normalises to midnight UTC. That is the canonical instant for
 * "that day", not a claim about the hour; the alternative, refusing to promote
 * it, would leave a whole Backlog corpus unsortable, which is the defect this
 * closes.
 *
 * Anything that does not parse is dropped rather than turned into a wrong
 * date. Nothing is lost by that: the raw source value is retained verbatim in
 * the provenance blob above, so a reader can always recover what Backlog
 * actually wrote.
 */
function isoTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
  const zoneless = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;
  const candidate = dateOnly.test(trimmed)
    ? `${trimmed}T00:00:00.000Z`
    : zoneless.test(trimmed)
      ? `${trimmed.replace(" ", "T")}Z`
      : trimmed;
  const parsed = Date.parse(candidate);
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString();
}

function importedTask(
  record: BacklogImportRecord,
  id: string,
  milestoneId?: string,
): TaskState {
  return taskState({
    id: id as CanonicalId,
    aliases: record.aliases,
    title: record.title,
    status: record.status ?? "To Do",
    // The raw source is intentional: it prevents a partial Quest task schema
    // from silently dropping Backlog fields while the public model evolves.
    description: record.rawMarkdown,
    summary: JSON.stringify({
      backlog: {
        sourcePath: record.sourcePath,
        sourceFolder: record.sourceFolder,
        git: record.git,
        assignees: record.assignees,
        references: record.references,
        modifiedFiles: record.modifiedFiles,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    }),
    priority: record.priority,
    type: record.type,
    ordinal: record.ordinal,
    // Carry the source dates onto the record itself (QCLI-137), not only into
    // the provenance blob. An imported task with no createdAt would sort last
    // forever with its real date sitting two layers away in the same record.
    // Normalised, not copied: see isoTimestamp above (QCLI-152). The blob keeps
    // the raw source form, so source fidelity is not traded for sortability.
    createdAt: isoTimestamp(record.createdAt),
    updatedAt: isoTimestamp(record.updatedAt),
    // Reindexed positionally (not by the source's own #N marker) because
    // normalizeCheckList requires each item's index to equal its array
    // position; preserving `checked` here is the whole point (QCLI-157).
    acceptanceCriteria: record.acceptanceCriteria.map((item, index) => ({
      index,
      text: item.text,
      checked: item.checked,
    })),
    definitionOfDone: record.definitionOfDone.map((item, index) => ({
      index,
      text: item.text,
      checked: item.checked,
    })),
    plan: record.implementationPlan ? [record.implementationPlan] : [],
    implementationNotes: [
      ...(record.implementationNotes ? [record.implementationNotes] : []),
      ...(record.finalSummary ? [record.finalSummary] : []),
    ],
    comments: record.comments.map((comment) => ({
      id: `backlog-${comment.index}`,
      authorId: comment.author ?? "backlog-import",
      body: comment.body,
      createdAt: comment.createdAt ?? "1970-01-01T00:00:00.000Z",
    })),
    labels: record.labels,
    documentation: record.documentation,
    parentId: record.parentTaskId,
    dependencies: record.dependencies,
    milestoneId,
    blockers: [],
    gates: [],
    gateEvents: [],
    source: { system: "backlog", reference: record.sourceIdentifier },
  });
}

/** A Backlog display prefix, e.g. "ODOC" from "ODOC-63.2". */
function sourceFamily(sourceIdentifier: string): string | undefined {
  return sourceIdentifier.match(/^([A-Za-z][A-Za-z0-9]*)-/)?.[1];
}

/** The immediate parent implied by dotted subtask numbering: the id with its
 * last ".N" segment stripped ("ODOC-63.2" -> "ODOC-63", "QCLI-97.5.2" ->
 * "QCLI-97.5"). Only a fallback -- an explicit parentTaskId from the source
 * frontmatter always takes precedence. */
function derivedParentId(sourceIdentifier: string): string {
  return sourceIdentifier.replace(/\.[1-9][0-9]*$/, "");
}

/**
 * Backlog's dotted subtask numbering (QCLI-97.5.2) has no equivalent in
 * Quest's canonical id, which is strictly `<prefix>-<int>` (QCLI-160):
 * allocateCanonicalId and canonicalId() both reject a dot. Quest already has
 * the model for "child of" -- a flat id plus parentId, exactly what native
 * subtask creation (nextTaskId) already does -- so a dotted source id is
 * translated rather than refused or dropped: it gets a freshly minted flat
 * id in the selected family, its dotted spelling survives as an alias (every
 * existing reference to it still resolves), and its parent is threaded
 * through so canonicalizeTaskLinks resolves the link at apply time the same
 * way it already resolves every other migrated cross-reference.
 *
 * A record whose id is neither flat nor dotted in the selected family, or
 * whose parent cannot be found anywhere in the destination or this same
 * batch, is refused at BATCH scope (opag ruling, QCLI-160): the run stops
 * and reports every such record together with every id collision, rather
 * than silently excluding it or shipping a tracker with a dangling link.
 */
async function previewWithPreservedIds(
  snapshot: {
    readonly fingerprint: string;
    readonly records: readonly BacklogImportRecord[];
  },
  occupied: readonly Alias[],
  existingTaskRecords: readonly { readonly task: { readonly id: string } }[],
  options: BacklogPreservationOptions,
  /** QCLI-520: the shared allocator's block for the ids this run must MINT
   * (the dotted subtasks). The service always supplies it; the optional shape
   * is this module function's own contract, not a fallback a caller may rely
   * on (round 1, MINOR 5). The `marker` is the SOURCE family's -- a
   * preserved-ids run mints `ODOC-<n>` in that family, not in the
   * destination's task prefix. */
  mintIds?: (
    count: number,
    visibleIds: readonly string[],
    marker: string,
  ) => Promise<readonly string[]>,
): Promise<{
  preview: BacklogPreview;
  records: readonly BacklogImportRecord[];
}> {
  const { family } = options;
  if (!canonicalIdPrefixPattern.test(family))
    throw new RecordValidationError("backlog_source_family_invalid");
  const marker = `${family}-`;
  const flatPattern = new RegExp(`^${family}-[1-9][0-9]*$`);
  const dottedPattern = new RegExp(`^${family}-[1-9][0-9]*(\\.[1-9][0-9]*)+$`);

  const inFamily = snapshot.records.filter(
    (record) => sourceFamily(record.sourceIdentifier) === family,
  );
  const excluded: BacklogExcludedRecord[] = snapshot.records
    .filter((record) => sourceFamily(record.sourceIdentifier) !== family)
    .map((record) => ({
      sourceIdentifier: record.sourceIdentifier,
      family: sourceFamily(record.sourceIdentifier),
    }));

  // Flat ids reserve their numbers into the mint ceiling before any dotted
  // id is minted, so a freshly minted id can never land on one a later
  // record in the batch preserves verbatim.
  let mintCounter = existingTaskRecords.reduce((maximum, entry) => {
    if (!entry.task.id.startsWith(marker)) return maximum;
    const numeric = Number(entry.task.id.slice(marker.length));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  for (const record of inFamily)
    if (flatPattern.test(record.sourceIdentifier)) {
      const numeric = Number(record.sourceIdentifier.slice(marker.length));
      if (Number.isSafeInteger(numeric))
        mintCounter = Math.max(mintCounter, numeric);
    }

  const unpreservable: BacklogUnpreservableRecord[] = [];
  const assigned: {
    readonly record: BacklogImportRecord;
    readonly targetIdentifier: string;
    readonly parentSourceId?: string;
  }[] = [];
  // QCLI-520: the dotted ids are the ones this run MINTS. Ask the shared
  // allocator for the whole block up front, so the numbers come from the same
  // refs, ledger and worktree sources `quest task create` uses. The visible
  // set includes every flat id this run preserves verbatim, so the block
  // starts above them exactly as `mintCounter` did.
  //
  // QCLI-520 round 1 (NIT): this call is the PEEK half in every path that
  // reaches it -- `apply` hands `previewInternal` its peek source, and the
  // matching block is RESERVED later, after these refusals have thrown. So no
  // reservation is ever held while a refusal is being decided; a peek takes no
  // lock and writes nothing, which is why it is safe to compute here.
  const dottedCount = inFamily.filter((record) =>
    dottedPattern.test(record.sourceIdentifier),
  ).length;
  const minted =
    mintIds === undefined
      ? undefined
      : await mintIds(
          dottedCount,
          [
            ...existingTaskRecords.map((entry) => entry.task.id),
            ...inFamily
              .filter((record) => flatPattern.test(record.sourceIdentifier))
              .map((record) => record.sourceIdentifier),
          ],
          marker,
        );
  let mintedIndex = 0;
  for (const record of inFamily) {
    if (flatPattern.test(record.sourceIdentifier)) {
      assigned.push({ record, targetIdentifier: record.sourceIdentifier });
    } else if (dottedPattern.test(record.sourceIdentifier)) {
      mintCounter += 1;
      const targetIdentifier =
        minted === undefined
          ? `${family}-${mintCounter}`
          : requiredMintedId(
              minted,
              mintedIndex,
              dottedCount,
              "the id allocator",
            );
      mintedIndex += 1;
      assigned.push({
        record,
        targetIdentifier,
        parentSourceId:
          record.parentTaskId ?? derivedParentId(record.sourceIdentifier),
      });
    } else {
      unpreservable.push({
        sourceIdentifier: record.sourceIdentifier,
        reason: "malformed_source_id",
      });
    }
  }

  // A parent reference resolves against the existing destination (already
  // occupied) or any in-family record's own id/aliases -- whether that
  // record preserves its id verbatim or was itself just minted a flat one.
  // Multi-level dotted chains resolve transitively through the same alias
  // mechanism canonicalizeTaskLinks already uses for every other migrated
  // cross-reference.
  const knownAliasKeys = new Set(occupied.map((entry) => entry.key));
  for (const record of inFamily)
    for (const candidate of [record.sourceIdentifier, ...record.aliases])
      knownAliasKeys.add(alias(candidate).key);
  for (const entry of assigned) {
    if (entry.parentSourceId === undefined) continue;
    if (!knownAliasKeys.has(alias(entry.parentSourceId).key))
      unpreservable.push({
        sourceIdentifier: entry.record.sourceIdentifier,
        reason: "parent_not_found",
        detail: entry.parentSourceId,
      });
  }

  const unpreservableIds = new Set(
    unpreservable.map((entry) => entry.sourceIdentifier),
  );
  const preservable = assigned.filter(
    (entry) => !unpreservableIds.has(entry.record.sourceIdentifier),
  );
  // Same per-mapping dedup as the positional path (QCLI-157): a task's own
  // id and its own registered aliases legitimately coincide.
  const candidates = preservable.flatMap((entry) => {
    const perTask = new Map<string, string>();
    for (const candidate of [entry.targetIdentifier, ...entry.record.aliases]) {
      const key = alias(candidate).key;
      if (!perTask.has(key)) perTask.set(key, candidate);
    }
    return [...perTask.values()];
  });
  const collisions = collectAliasCollisions(candidates, occupied);

  if (unpreservable.length > 0 || collisions.length > 0) {
    const parts: string[] = [];
    if (collisions.length) parts.push(`${collisions.length} id collision(s)`);
    if (unpreservable.length)
      parts.push(`${unpreservable.length} unpreservable record(s)`);
    throw new BacklogMigrationRefusedError(
      `Backlog id preservation refused: ${parts.join(", ")}. See the itemized report for detail. No further flag resolves a remaining id collision here: rename or remove the conflicting record in the destination workspace, or rename the id in the source, then retry.`,
      { collisions, unpreservable },
    );
  }

  const mappings: BacklogImportMapping[] = preservable.map((entry) => ({
    sourceIdentifier: entry.record.sourceIdentifier,
    sourceFolder: entry.record.sourceFolder,
    targetIdentifier: entry.targetIdentifier,
    aliases: entry.record.aliases,
  }));
  // Derived from `mappings`, not new source data, so it stays out of the
  // digest: the CAS precondition `apply --digest` checks against must not
  // shift just because this display-only view of the same data was added.
  const renumbered: BacklogRenumberedMapping[] = mappings
    .filter((mapping) => mapping.targetIdentifier !== mapping.sourceIdentifier)
    .map((mapping) => ({
      sourceIdentifier: mapping.sourceIdentifier,
      targetIdentifier: mapping.targetIdentifier,
      reason: "dotted_subtask_translated" as const,
    }));
  const records = preservable.map((entry) =>
    entry.parentSourceId !== undefined
      ? { ...entry.record, parentTaskId: entry.parentSourceId }
      : entry.record,
  );
  const digest = fingerprint({
    sourceFingerprint: snapshot.fingerprint,
    mappings,
    family,
    excluded,
  });
  return {
    preview: {
      sourceFingerprint: snapshot.fingerprint,
      digest,
      mappings,
      requiresApproval: true,
      excluded,
      renumbered,
    },
    records,
  };
}

async function previewInternal(
  source: BacklogImportSource,
  repository: PublicTaskRepository,
  taskIdPrefix: string,
  preserveSourceIds?: BacklogPreservationOptions,
  /** QCLI-520: where minted TASK ids come from. The service always passes the
   * shared allocator's peek (preview) or reserve (apply); the optional shape
   * is this module function's own contract, not a supported fallback (round
   * 1, MINOR 5). */
  taskIds?: (
    count: number,
    visibleIds: readonly string[],
    marker?: string,
  ) => Promise<readonly string[]>,
): Promise<{
  preview: BacklogPreview;
  records: readonly BacklogImportRecord[];
}> {
  const snapshot = await source.readSnapshot();
  // Scoped to the selected family when one is given (QCLI-162): a legacy
  // duplicate inside a family this run is not importing is not this run's
  // problem to refuse on. Without a family, the whole snapshot is what gets
  // imported, so every record's integrity stays load-bearing -- unchanged.
  const relevantDuplicateIds = preserveSourceIds
    ? snapshot.crossFolderDuplicateIds.filter(
        (id) => sourceFamily(id) === preserveSourceIds.family,
      )
    : snapshot.crossFolderDuplicateIds;
  if (relevantDuplicateIds.length)
    throw new Error("backlog_cross_folder_duplicate_id");
  const existing = await repository.readAll();
  const occupied: Alias[] = existing.taskRecords.flatMap((entry) => [
    alias(entry.task.id),
    ...entry.task.aliases.map(alias),
  ]);
  if (preserveSourceIds)
    return previewWithPreservedIds(
      snapshot,
      occupied,
      existing.taskRecords,
      preserveSourceIds,
      taskIds,
    );
  // Targets the destination workspace's own configured taskIdPrefix (QCLI-157)
  // instead of a hardcoded "T-": a migration must land in the same id family
  // native `quest task create` already uses there, not a disconnected island.
  const marker = `${taskIdPrefix}-`;
  const highest = existing.taskRecords.reduce((maximum, entry) => {
    if (!entry.task.id.startsWith(marker)) return maximum;
    const numeric = Number(entry.task.id.slice(marker.length));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  // QCLI-520: every id this run mints comes from the shared allocator when
  // one is wired in -- the same lock, reservation ledger and worktree scan
  // `quest task create` goes through -- so two worktrees migrating before
  // either commits cannot mint the same numbers. The local arithmetic below
  // stays as the no-allocator fallback (raw-store callers, fixtures).
  const minted =
    taskIds === undefined
      ? undefined
      : await taskIds(
          snapshot.records.length,
          existing.taskRecords.map((entry) => entry.task.id),
        );
  const mappings = snapshot.records.map((record, index) => ({
    sourceIdentifier: record.sourceIdentifier,
    sourceFolder: record.sourceFolder,
    targetIdentifier:
      minted === undefined
        ? `${taskIdPrefix}-${highest + index + 1}`
        : requiredMintedId(
            minted,
            index,
            snapshot.records.length,
            "the task id allocator",
          ),
    aliases: record.aliases,
  }));
  // Deduped per mapping, not globally: a task's own newly minted canonical
  // id and its own registered aliases legitimately coincide (most visibly
  // when the destination taskIdPrefix matches the source's own display
  // prefix, so e.g. "FX-1" is both the new id and the bare source alias for
  // that SAME task) -- that is not a collision. assertAliasesAvailable has
  // no per-record grouping of its own, so it cannot tell "claimed by this
  // exact task, about to receive that string as its own alias" apart from
  // "claimed by a different task"; only the caller knows which candidates
  // belong to the same mapping (QCLI-157).
  const candidates = mappings.flatMap((mapping) => {
    const perTask = new Map<string, string>();
    for (const candidate of [mapping.targetIdentifier, ...mapping.aliases]) {
      const key = alias(candidate).key;
      if (!perTask.has(key)) perTask.set(key, candidate);
    }
    return [...perTask.values()];
  });
  try {
    assertAliasesAvailable(candidates, occupied);
  } catch (error) {
    // Deliberately cause-agnostic about WHICH of two collision shapes this
    // is -- positional renumbering shifting an allocation when a dotted
    // subtask flattens, or a genuine, unrelated id already live in the
    // destination -- since the two look identical from here and claiming
    // one would be a diagnosis this code cannot make (QCLI-155, QCLI-166's
    // 2026-09-02 opum-agent migration-preview report). What changed
    // (fleet-reported, 2026-09-09): naming only the renumbering remedy left
    // an operator hitting the OTHER cause reading advice that cannot work
    // for them, with no way to tell which one they have -- confirmed live,
    // --preserve-source-ids does not resolve a genuine dual claim, it only
    // re-reports it as "Backlog id preservation refused". Name both causes
    // and both remedies instead of picking one.
    if (error instanceof RecordConflictError)
      throw new RecordConflictError(
        `${error.message} If this is from positional renumbering (for example a dotted subtask flattening and shifting a later allocation), --preserve-source-ids --source-family <PREFIX> avoids it by keeping each record's own source id instead. If instead this exact id is already a live, unrelated claim in the destination workspace, --preserve-source-ids will not resolve it -- rename or remove the conflicting record in the destination, or rename the id in the source, before retrying.`,
      );
    throw error;
  }
  const digest = fingerprint({
    sourceFingerprint: snapshot.fingerprint,
    mappings,
  });
  return {
    preview: {
      sourceFingerprint: snapshot.fingerprint,
      digest,
      mappings,
      requiresApproval: true,
    },
    records: snapshot.records,
  };
}

export class BacklogImportService {
  constructor(
    private readonly root: string,
    private readonly source: BacklogImportSource,
    private readonly repository: MigrationTransactionRepository,
    private readonly planning: PlanningRepository,
    private readonly taskIdPrefix: string = "T",
    /** QCLI-520: REQUIRED for preview/apply, which refuse by name without it
     * (round 1, MINOR 5). A caller with no Git repository passes an allocation
     * whose `commonDirectory()` resolves null -- no lock, ledger or worktree
     * scan, exactly the allocator's own degraded contract. Optional only so
     * `status`/`rollback`, which never mint an id, can omit it. */
    private readonly allocation?: BacklogIdAllocation,
  ) {}

  /**
   * QCLI-520: one family's id block, from the shared allocator. `peek` and
   * `reserve` differ only in whether the block is written into the ledger --
   * a preview must not move the floor the apply will read.
   */
  private async idBlock(
    family: "task" | "milestone",
    count: number,
    visibleIds: readonly string[],
    mode: "peek" | "reserve",
    markerOverride?: string,
  ): Promise<readonly string[]> {
    if (this.allocation === undefined || count <= 0) return [];
    // Milestones are their own family with their own marker; tasks use the
    // destination workspace's configured prefix, exactly as the local
    // arithmetic did (QCLI-157) -- unless the caller names the SOURCE
    // family's marker, which --preserve-source-ids does when it mints a
    // dotted subtask's replacement id.
    const marker =
      markerOverride ?? (family === "task" ? `${this.taskIdPrefix}-` : "M-");
    const recordDirectories =
      family === "task" ? ["tasks", "completed", "archive/tasks"] : null;
    const request: IdBlockRequest = {
      git: this.allocation.git,
      worktreeRoot: this.allocation.worktreeRoot,
      commonDirectory: await this.allocation.commonDirectory(),
      marker,
      family,
      recordDirectories,
      // QCLI-520 round 1 (MAJOR 2): the same refs source `quest task create`
      // reads. Without it, an id published on a branch that is checked out
      // NOWHERE -- so neither this worktree nor the worktree scan can see it
      // -- is invisible to the migration, which then mints straight onto it.
      visibleIds: [
        ...visibleIds,
        ...(await this.allocation.idsOnOtherRefs(marker, recordDirectories)),
      ],
      count,
    };
    if (mode === "peek") {
      const block = await peekIdBlock(request);
      if (block.length !== count)
        throw new BacklogIdBlockShortError(
          `the ${family} id allocator peeked ${block.length} id(s) for a block of ${count}. Nothing was written.`,
        );
      return block;
    }
    const reserved = await reserveIdBlock(request);
    // QCLI-520 round 1 (MINOR 1): a reservation can break a stale lock, and the
    // caller must be able to say so exactly as a create does.
    this.allocation.recordStaleLock?.(reserved);
    if (reserved.ids.length !== count) {
      // Never leave a block this run cannot use: a short answer is a contract
      // violation, not a partial success.
      await this.allocation.releaseIds(family, marker, reserved.ids);
      throw new BacklogIdBlockShortError(
        `the ${family} id allocator reserved ${reserved.ids.length} id(s) for a block of ${count}. The partial block was released.`,
      );
    }
    return reserved.ids;
  }

  /** QCLI-520 round 1 (MAJOR 3): withdraw a block this run reserved. */
  private async releaseBlock(
    family: "task" | "milestone",
    marker: string,
    ids: readonly string[],
  ): Promise<void> {
    if (this.allocation === undefined || ids.length === 0) return;
    await this.allocation.releaseIds(family, marker, ids);
  }

  async preview(
    preserveSourceIds?: BacklogPreservationOptions,
  ): Promise<BacklogPreview> {
    // QCLI-520 round 1 (MINOR 5): a missing allocator used to select the old
    // local arithmetic silently. A caller with no Git repository passes an
    // allocation whose commonDirectory() resolves null instead.
    if (this.allocation === undefined)
      throw new BacklogIdAllocationMissingError();
    return (
      await previewInternal(
        this.source,
        this.repository,
        this.taskIdPrefix,
        preserveSourceIds,
        this.taskIdSource(),
      )
    ).preview;
  }

  /** The task-id source `previewInternal` consumes. It PEEKS only: `preview`
   * must not move the floor, and `apply` captures its own peek so it can
   * reserve the same block after the preview (and its refusals) is done. */
  private taskIdSource() {
    if (this.allocation === undefined) return undefined;
    return (count: number, visibleIds: readonly string[], marker?: string) =>
      this.idBlock("task", count, visibleIds, "peek", marker);
  }

  async apply(
    digest: string,
    preserveSourceIds?: BacklogPreservationOptions,
  ): Promise<Receipt> {
    const { root, source, repository, taskIdPrefix } = this;
    // QCLI-520 round 1 (MINOR 5): see preview(). A caller with no Git
    // repository passes an allocation whose commonDirectory() resolves null.
    if (this.allocation === undefined)
      throw new BacklogIdAllocationMissingError();
    const path = receiptPath(root, digest);
    const previous = await load(path);
    if (previous?.state === "applied") {
      const snapshot = await source.readSnapshot();
      if (snapshot.fingerprint !== previous.sourceFingerprint)
        throw new Error("migration_source_fingerprint_conflict");
      return previous;
    }
    // QCLI-520: PEEK first and reserve only once the digest is approved, so a
    // stale apply reserves nothing. The block the approved mappings carry is
    // captured here, and the reservation below must reproduce it exactly --
    // if another allocator took ids in between, the approved plan no longer
    // describes what this run would mint, and that is a refusal rather than a
    // silent renumbering.
    let peekedTaskIds: readonly string[] = [];
    let peekedVisibleIds: readonly string[] = [];
    let peekedMarker: string | undefined;
    const peekTaskIds = async (
      count: number,
      visibleIds: readonly string[],
      marker?: string,
    ) => {
      peekedVisibleIds = visibleIds;
      peekedMarker = marker;
      peekedTaskIds = await this.idBlock(
        "task",
        count,
        visibleIds,
        "peek",
        marker,
      );
      return peekedTaskIds;
    };
    const { preview, records } = await previewInternal(
      source,
      repository,
      taskIdPrefix,
      preserveSourceIds,
      peekTaskIds,
    );
    if (preview.digest !== digest)
      throw new Error("migration_approval_digest_mismatch");
    // QCLI-520: the approved mappings are now the contract. Reserve exactly
    // the block they carry; a reservation that comes back different means a
    // concurrent allocator (another worktree's create or migration) took an
    // id between this run's peek and its reserve, so the approved plan would
    // no longer describe what gets written -- refuse and ask for a re-preview
    // instead of minting numbers nobody approved.
    // QCLI-520 round 1 (MAJOR 3): every block THIS RUN reserves is remembered
    // so a failure after the reservation can hand it back. An abandoned block
    // would sit in the ledger for its 7-day TTL, so a retry carrying the same
    // approved digest would peek above it and be refused as a digest
    // mismatch -- undone by an id this run never minted.
    let reservedTaskIds: readonly string[] = [];
    let reservedMilestoneIds: readonly string[] = [];
    const taskMarker = peekedMarker ?? `${taskIdPrefix}-`;
    const releaseReservations = async () => {
      await this.releaseBlock("task", taskMarker, reservedTaskIds);
      await this.releaseBlock("milestone", "M-", reservedMilestoneIds);
      reservedTaskIds = [];
      reservedMilestoneIds = [];
    };
    if (peekedTaskIds.length > 0) {
      const reserved = await this.idBlock(
        "task",
        peekedTaskIds.length,
        peekedVisibleIds,
        "reserve",
        peekedMarker,
      );
      if (reserved.join("\n") !== peekedTaskIds.join("\n")) {
        // The block this run DID reserve is not the approved one; release it
        // before refusing, or the retry would meet the same mismatch again.
        await this.releaseBlock("task", taskMarker, reserved);
        throw new Error(
          "migration_id_block_moved: another writer allocated task ids between this run's peek and its reservation, so the approved digest no longer describes the ids this migration would mint. Nothing was written.",
        );
      }
      reservedTaskIds = reserved;
    }
    try {
      const receipt: Receipt = previous ?? {
        schemaVersion: 1,
        kind: "migration.backlog.receipt",
        digest,
        sourceFingerprint: preview.sourceFingerprint,
        mappings: preview.mappings,
        state: "applying",
        survivors: [],
        taskFingerprints: {},
      };
      await save(path, receipt);
      const survivors = new Set(receipt.survivors);
      const fingerprints = { ...receipt.taskFingerprints };
      // Milestone names map deterministically: sorted distinct source names,
      // reusing an existing planning milestone with the same exact title,
      // otherwise allocating the next free M-<n> id.
      const planningSnapshot = await this.planning.read();
      const milestoneNames = Array.from(
        new Set(
          records
            .map((record) => record.milestone?.trim())
            .filter((name): name is string => !!name),
        ),
      ).sort();
      const byTitle = new Map(
        planningSnapshot.milestones.map((m) => [m.title, m]),
      );
      // QCLI-520: milestone ids are minted only here (they never appear in the
      // preview's mappings, so no approved digest depends on them), which is
      // why reserving them straight away is safe: the ids are durable before
      // any milestone record is written, so a second worktree's migration
      // starts above them instead of reusing them.
      const newMilestoneNames = milestoneNames.filter(
        (name) => !byTitle.has(name),
      );
      const milestoneBlock = await this.idBlock(
        "milestone",
        newMilestoneNames.length,
        planningSnapshot.milestones.map((m) => m.id),
        "reserve",
      );
      reservedMilestoneIds = milestoneBlock;
      const milestoneIdForName = new Map<string, string>();
      for (const name of milestoneNames) {
        const existing = byTitle.get(name);
        if (existing) {
          milestoneIdForName.set(name, existing.id);
          continue;
        }
        const reservedIndex = newMilestoneNames.indexOf(name);
        // QCLI-520 round 1 (MINOR 4): no fallback to `M-<n>` here. The service
        // always has an allocator (MINOR 5), and idBlock refuses a short block,
        // so a missing position at this point is a contract violation.
        milestoneIdForName.set(
          name,
          requiredMintedId(
            milestoneBlock,
            reservedIndex,
            newMilestoneNames.length,
            "the milestone id allocator",
          ),
        );
      }
      // Closure is computed over every mapping (not only non-survivors) so a
      // resumed migration still yields fully closed forward/back references.
      const rawImports = preview.mappings.map((mapping, index) => {
        const record = records[index];
        if (!record) throw new Error("migration_source_record_missing");
        const name = record.milestone?.trim();
        const milestoneId = name ? milestoneIdForName.get(name) : undefined;
        return {
          task: importedTask(record, mapping.targetIdentifier, milestoneId),
          milestoneId,
        };
      });
      // A Backlog record's parentId/dependencies are raw pre-migration source
      // ids (registered above as aliases on the sibling task they name), not
      // the new canonical ids. Every other write path resolves links through
      // canonicalizeTaskLinks before persisting; migration must too, or a
      // migrated child's parentId keeps pointing at a string no current task
      // actually has as its id, and --parent/--dependency lookups silently
      // find nothing post-import (QCLI-157).
      const linkedForImport = await repository.readAll();
      const canonicalById = new Map(
        canonicalizeTaskLinks([
          ...linkedForImport.taskRecords.map((entry) => entry.task),
          ...rawImports.map((entry) => entry.task),
        ]).map((task) => [task.id, task]),
      );
      const taskChanges: {
        readonly task: TaskState;
        readonly location: "tasks";
      }[] = [];
      const imported: { id: string; milestoneId?: string }[] = [];
      for (let index = 0; index < preview.mappings.length; index++) {
        const mapping = preview.mappings[index];
        const { milestoneId } = rawImports[index];
        const task = canonicalById.get(mapping.targetIdentifier);
        if (!task) throw new Error("migration_source_record_missing");
        const current = await repository.readAll();
        const existing = current.taskRecords.find(
          (entry) => entry.task.id === task.id,
        );
        if (existing && fingerprint(existing.task) === fingerprints[task.id]) {
          survivors.add(task.id);
          continue;
        }
        survivors.add(task.id);
        fingerprints[task.id] = fingerprint(task);
        taskChanges.push({ task, location: "tasks" });
        imported.push({ id: task.id, milestoneId });
      }
      // Closure over every mapping (not only non-survivors) so a resumed
      // migration still yields closed forward/back references.
      const milestones = new Map<string, Milestone>();
      for (const name of milestoneNames) {
        const existing = byTitle.get(name);
        const id = milestoneIdForName.get(name);
        if (!id) continue;
        const members = new Set(existing?.taskIds ?? []);
        for (const entry of imported)
          if (entry.milestoneId === id) members.add(entry.id);
        milestones.set(id, {
          // Spread first so a reused milestone keeps every field this import
          // does not own -- `archived` above all, which a field-by-field
          // rebuild would silently clear.
          ...existing,
          id: id as Milestone["id"],
          title: name,
          description: existing?.description,
          status: existing?.status ?? "open",
          taskIds: Array.from(members).sort(compareTaskIds),
        });
      }
      await save(path, {
        ...receipt,
        survivors: Array.from(survivors).sort(),
        taskFingerprints: fingerprints,
      });
      if (taskChanges.length > 0) {
        const current = await repository.readAll();
        const result = await repository.applyTransaction({
          expectedTaskRevision: current.revision,
          expectedPlanningRevision: planningSnapshot.revision,
          operationId: `backlog-import-${digest}`,
          ownedPaths: [
            ".quest/migrations/backlog",
            ...taskChanges.map(({ task }) => `.quest/tasks/${task.id}.json`),
          ],
          taskChanges,
          milestones: [
            ...planningSnapshot.milestones.filter((m) => !milestones.has(m.id)),
            ...Array.from(milestones.values()),
          ],
          decisions: planningSnapshot.decisions,
        });
        if (result.kind === "conflict") {
          const failed = {
            ...receipt,
            state: "failed" as const,
            survivors: Array.from(survivors).sort(),
            taskFingerprints: fingerprints,
          };
          await save(path, failed);
          await releaseReservations();
          return failed;
        }
      }
      const after = await source.readSnapshot();
      if (after.fingerprint !== preview.sourceFingerprint) {
        const failed = {
          ...receipt,
          state: "failed" as const,
          survivors: Array.from(survivors).sort(),
          taskFingerprints: fingerprints,
        };
        await save(path, failed);
        await releaseReservations();
        return failed;
      }
      const applied = {
        ...receipt,
        state: "applied" as const,
        survivors: Array.from(survivors).sort(),
        taskFingerprints: fingerprints,
      };
      await save(path, applied);
      // Success keeps the reservations: the records that carry them are now
      // visible, so the ledger's own visibility rule prunes them.
      return applied;
    } catch (error) {
      // Every throw after the reservation -- including a milestone block that
      // was reserved but never used -- hands this run's blocks back.
      await releaseReservations();
      throw error;
    }
  }

  async status(digest: string): Promise<Receipt> {
    const receipt = await load(receiptPath(this.root, digest));
    if (!receipt) throw new Error("migration_not_found");
    return receipt;
  }

  async rollback(digest: string): Promise<Receipt> {
    const { root, repository } = this;
    const path = receiptPath(root, digest);
    const receipt = await this.status(digest);
    if (receipt.state === "rolled-back") return receipt;
    const survivors: string[] = [];
    const removedIds = new Set<string>();
    for (const mapping of receipt.mappings) {
      const snapshot = await repository.readAll();
      const located = snapshot.taskRecords.find(
        (entry) => entry.task.id === mapping.targetIdentifier,
      );
      if (!located) continue;
      if (
        fingerprint(located.task) !==
        receipt.taskFingerprints[mapping.targetIdentifier]
      ) {
        survivors.push(mapping.targetIdentifier);
        continue;
      }
      const result = await repository.writeLifecycle({
        expectedRevision: snapshot.revision,
        operationId: `backlog-rollback-${digest}`,
        ownedPaths: [`.quest/${located.location}/${located.task.id}.json`],
        taskChanges: [
          { taskId: located.task.id, location: located.location, remove: true },
        ],
        draftChanges: [],
      });
      if (result.kind === "conflict") survivors.push(mapping.targetIdentifier);
      else removedIds.add(mapping.targetIdentifier);
    }
    // Keep forward/back closure: strip removed task ids from milestone
    // membership instead of leaving dangling milestone back-references.
    if (removedIds.size > 0) {
      const planningSnapshot = await this.planning.read();
      const result = await this.planning.write({
        expectedRevision: planningSnapshot.revision,
        operationId: `backlog-rollback-${digest}`,
        decisions: planningSnapshot.decisions,
        milestones: planningSnapshot.milestones.map((m) => ({
          ...m,
          taskIds: m.taskIds.filter((id) => !removedIds.has(id)),
        })),
      });
      if (result.kind === "conflict")
        for (const mapping of receipt.mappings)
          survivors.push(mapping.targetIdentifier);
    }
    const rolled = {
      ...receipt,
      state: "rolled-back" as const,
      survivors: survivors.sort(),
    };
    await save(path, rolled);
    return rolled;
  }
}

export async function removeBacklogReceiptForTest(
  root: string,
  digest: string,
): Promise<void> {
  await rm(receiptPath(root, digest), { force: true });
}
