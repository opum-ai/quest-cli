import { aliasKey } from "../../domain/records.ts";
import type { TaskState } from "../../domain/tasks/tasks.ts";
import type { GitPort } from "../../ports/git.ts";

/**
 * DEC-18 / QCLI-415: a base-relative record-continuity check.
 *
 * A task record may legitimately live in any of three locations and moves
 * between them as its status advances, so "the file is gone" is not by itself
 * a defect -- and that is exactly why a commit that stages only HALF of a move
 * (the deletion, not the addition) passes every check the fleet has today.
 * Measured: ward-cli b2aad11 dropped WCLI-9's record and the repository's
 * Tracker integrity job stayed green on it and on the next commit, because the
 * job parses a listing and never asks whether anything went missing.
 *
 * The check's statement is narrow on purpose: every id and alias that resolved
 * at the merge base of `--base` and HEAD must still resolve, somewhere, now.
 * It says nothing about new records, statuses, or content.
 *
 * The two sides are read from different places on purpose. The base side comes
 * from the commit graph, because that is the only place a past record set
 * still exists. The current side is the working tree's own store -- the same
 * one every other command resolves against -- so a check that passes here and
 * a `task view` that resolves there cannot disagree about what exists.
 */

/** The three task record locations a record moves through over its life.
 * Deliberately a copy of LocalTaskRepository's own layout -- and of the CLI's
 * TASK_RECORD_SUBDIRECTORIES list that tracks it -- because a location added
 * there but not here would make this check blind in the one direction that
 * matters: a record kept only where the check never reads would be reported as
 * dropped. */
export const CONTINUITY_TASK_LOCATIONS = [
  "tasks",
  "completed",
  "archive/tasks",
] as const;

/**
 * The current store as the check needs it: every task record, from every
 * location. `TaskService.listIncludingRetained` satisfies this exactly.
 *
 * Drafts are deliberately absent from the check's population in both
 * directions. `draft promote` removes the draft record by design while the
 * task it becomes is minted under a NEW id, so a draft id legitimately
 * resolves nowhere afterwards -- including it would make every promotion a
 * false positive, which is worse than the blindness it would buy.
 */
export interface ContinuityCurrentStore {
  listIncludingRetained(): Promise<readonly TaskState[]>;
}

export interface ContinuityReport {
  /** The `--base` argument as given, so the report names the caller's input. */
  readonly baseRef: string;
  /** The merge base actually read, which is what DEC-18's rule is relative to. */
  readonly base: string;
  /** Task record files parsed at the merge base. */
  readonly records: number;
  /** Distinct ids and aliases those records declare. */
  readonly references: number;
  readonly resolved: number;
  /** References that resolve to no record in the current store; empty on success. */
  readonly missing: readonly string[];
}

export type ContinuityFailure =
  | { readonly reason: "base_unresolvable"; readonly detail: string }
  | { readonly reason: "no_merge_base"; readonly detail: string }
  | { readonly reason: "empty_base"; readonly base: string }
  | {
      readonly reason: "unreadable_record";
      readonly base: string;
      readonly paths: readonly string[];
    };

export type ContinuityResult =
  | { readonly ok: true; readonly report: ContinuityReport }
  | { readonly ok: false; readonly failure: ContinuityFailure };

/** `aliasKey`, minus its throw on an empty string. Resolution matches
 * `findTask`: id and aliases compared under NFC plus default case folding. An
 * empty alias is not a resolution target on either side of the comparison, so
 * it is skipped rather than fatal -- and skipping it identically on both sides
 * is what keeps the two sets comparable. */
function foldable(value: string): string | undefined {
  return value.length === 0 ? undefined : aliasKey(value);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class ContinuityCheckService {
  constructor(
    private readonly git: GitPort,
    private readonly store: ContinuityCurrentStore,
    private readonly repositoryPath: string,
  ) {}

  async check(baseRef: string): Promise<ContinuityResult> {
    const resolved = await this.resolveBase(baseRef);
    if (!resolved.ok) return resolved;
    const base = resolved.base;

    const files = await this.recordFiles(base);
    // QCLI-415 AC1's positive control: a read of zero records is a failure,
    // not a pass. `listFiles` answers `[]` both for a genuinely empty tree and
    // for any listing Git refused (local-git.ts's defensive contract), so a
    // zero read cannot be told apart from a wrong `--base`, a revision from
    // before the tracker existed, or a layout that moved every record out of
    // the three locations -- and passing then would be the same false green
    // this check exists to remove.
    if (files.length === 0)
      return { ok: false, failure: { reason: "empty_base", base } };

    const references = new Map<string, string>();
    const unreadable: string[] = [];
    for (const path of files) {
      const declared = await this.declaredReferences(base, path);
      if (declared === undefined) {
        unreadable.push(path);
        continue;
      }
      for (const reference of declared) {
        const key = foldable(reference);
        if (key !== undefined && !references.has(key))
          references.set(key, reference);
      }
    }
    // One malformed record fails the whole check rather than dropping out of
    // the population without a word: a record the check could not read is a
    // record whose disappearance it could not report, which is the distinction
    // "report how much was read, not only what was found" exists to keep.
    if (unreadable.length > 0)
      return {
        ok: false,
        failure: { reason: "unreadable_record", base, paths: unreadable },
      };

    const present = new Set<string>();
    for (const task of await this.store.listIncludingRetained()) {
      const id = foldable(task.id);
      if (id !== undefined) present.add(id);
      for (const alias of task.aliases) {
        const key = foldable(alias);
        if (key !== undefined) present.add(key);
      }
    }

    const missing = [...references]
      .filter(([key]) => !present.has(key))
      .map(([, spelling]) => spelling);

    return {
      ok: true,
      report: {
        baseRef,
        base,
        records: files.length,
        references: references.size,
        resolved: references.size - missing.length,
        missing,
      },
    };
  }

  /**
   * `git merge-base` exits non-zero for two different facts -- an unresolvable
   * ref and histories with no common ancestor -- and the caller reports them as
   * different failures (bad input versus a history fact). `readRevision` is the
   * probe that tells them apart: it is the same resolution the merge base
   * itself needed, not an extra dependency of the check.
   */
  private async resolveBase(
    baseRef: string,
  ): Promise<
    { ok: true; base: string } | { ok: false; failure: ContinuityFailure }
  > {
    try {
      return {
        ok: true,
        base: await this.git.mergeBase(this.repositoryPath, baseRef, "HEAD"),
      };
    } catch (error) {
      const detail = describe(error);
      try {
        await this.git.readRevision(this.repositoryPath, baseRef);
      } catch {
        return { ok: false, failure: { reason: "base_unresolvable", detail } };
      }
      return { ok: false, failure: { reason: "no_merge_base", detail } };
    }
  }

  private async recordFiles(base: string): Promise<readonly string[]> {
    const listings = await Promise.all(
      CONTINUITY_TASK_LOCATIONS.map((location) =>
        this.git.listFiles(this.repositoryPath, base, `.quest/${location}`),
      ),
    );
    return listings.flat().filter((path) => path.endsWith(".json"));
  }

  /**
   * The id and aliases one record at the merge base declares, or undefined when
   * the file cannot be read or parsed.
   *
   * Reads are sequential: `git cat-file` is one process per record, and this
   * repository's ~400 records take about two seconds that way; a concurrent
   * version would spawn that many Git processes at once. Deterministic ordering
   * also keeps `missing` in base order rather than scheduler order.
   */
  private async declaredReferences(
    base: string,
    path: string,
  ): Promise<readonly string[] | undefined> {
    const blob = await this.git.readBlob(this.repositoryPath, base, path);
    if (blob === null) return undefined;
    let parsed: unknown;
    try {
      parsed = JSON.parse(blob);
    } catch {
      return undefined;
    }
    if (parsed === null || typeof parsed !== "object") return undefined;
    const record = parsed as { id?: unknown; aliases?: unknown };
    const id =
      typeof record.id === "string" && record.id.length > 0
        ? record.id
        : // A record whose JSON carries no id is still a record the repository
          // locates by its file name; falling back to the stem keeps it in the
          // population rather than letting it vanish without a word.
          path.slice(path.lastIndexOf("/") + 1, -".json".length);
    if (id.length === 0) return undefined;
    const aliases = Array.isArray(record.aliases)
      ? record.aliases.filter(
          (alias): alias is string => typeof alias === "string",
        )
      : [];
    return [id, ...aliases];
  }
}
