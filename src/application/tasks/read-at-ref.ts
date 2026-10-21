import { aliasKey } from "../../domain/records.ts";
import {
  type TaskLocation,
  type TaskState,
  findTask,
  taskState,
} from "../../domain/tasks/tasks.ts";
import type { GitPort } from "../../ports/git.ts";
import { CONTINUITY_TASK_LOCATIONS } from "../checks/continuity.ts";
import { recordRevision } from "./record-revision.ts";
import type { TaskStateWithPath } from "./tasks.ts";

/**
 * QCLI-519 / DEC-206 (c3): `quest task view <id> --ref <ref>`.
 *
 * A READ AT A GIT REF, for a consumer that must never hand-parse `.quest/`
 * through `git show` (opum-cli's OCLI-243 piece 3(a); its profile forbids that
 * coupling exactly as this repository's forbids editing record JSON directly).
 * The command answers about the records as they exist AT THE REF and returns
 * the same `data` shape `task view` returns, so a caller needs one decoder for
 * both. The only added envelope key is the ref provenance -- the ref as the
 * caller spelled it and the commit sha it resolved to -- which sits beside
 * `data` (never inside it), so `--fields` projection and `--max-notes` compose
 * unchanged.
 *
 * NOTHING IS WRITTEN and no revision precondition applies: this is a read of
 * objects this repository already holds, and there is no record to guard. It
 * deliberately does NOT fetch. A ref whose object is absent from the local
 * repository is unresolvable here rather than a silent network read: the
 * caller named a ref, and "I fetched something for you" is a different
 * operation with its own failure modes (`task list --across-refs` is where
 * fetching belongs).
 */

/** The ref itself could not be resolved to a commit in this repository. Named
 * distinctly from {@link TaskNotFoundAtRefError} so a caller can tell "no such
 * ref" from "no such task at that ref" without parsing prose. */
export class RefNotResolvableError extends Error {
  constructor(
    readonly ref: string,
    readonly reason: string,
  ) {
    super(
      `ref_not_resolvable: ${JSON.stringify(ref)} does not resolve to a commit in this repository (${reason}). Nothing was written.`,
    );
    this.name = "RefNotResolvableError";
  }
}

/** The task exists nowhere at the ref. Carries the resolved sha so the caller
 * can state exactly which commit was read, rather than only which ref it
 * asked for. */
export class TaskNotFoundAtRefError extends Error {
  constructor(
    readonly reference: string,
    readonly ref: string,
    readonly sha: string,
  ) {
    super(
      `task_not_found: no task matching ${JSON.stringify(reference)} exists at ${JSON.stringify(ref)} (${sha}). Nothing was written.`,
    );
    this.name = "TaskNotFoundAtRefError";
  }
}

/** A tree at the ref could not be listed, or a record under it could not be
 * read or parsed. Distinct from "the task is absent": an unreadable tree
 * would otherwise read as an empty one, which is the false green this error
 * exists to prevent (the same rule `task list --across-refs` applies). */
export class RefRecordsUnreadableError extends Error {
  constructor(
    readonly ref: string,
    readonly sha: string,
    readonly detail: string,
  ) {
    super(
      `ref_records_unreadable: the records at ${JSON.stringify(ref)} (${sha}) could not be read: ${detail}. Nothing was written.`,
    );
    this.name = "RefRecordsUnreadableError";
  }
}

/** Two records carry the same id at one ref. The repository reader refuses
 * this shape (usually a half-staged relocation), so a read that silently kept
 * the first would answer about a state every other command rejects. */
export class RefRecordDuplicateError extends Error {
  constructor(
    readonly ref: string,
    readonly sha: string,
    readonly id: string,
    readonly paths: readonly string[],
  ) {
    super(
      `ref_record_duplicate: ${id} appears at ${paths.join(" and ")} in ${JSON.stringify(ref)} (${sha}). Nothing was written.`,
    );
    this.name = "RefRecordDuplicateError";
  }
}

export interface TaskAtRef {
  /** The record exactly as `task view` returns it: the task plus the `path`
   * the record occupies at the ref. */
  readonly task: TaskStateWithPath;
  /** The record's own revision (QCLI-310's {@link recordRevision}) computed
   * over the record read at the ref, so a caller comparing it with a local
   * read is comparing two records and not two workspaces. */
  readonly revision: string;
  /** The commit the ref resolved to. */
  readonly sha: string;
}

export interface ReadTaskAtRefRequest {
  readonly git: GitPort;
  /** The root of this checkout -- what `git rev-parse` runs against. */
  readonly repositoryPath: string;
  /** The id or alias the caller asked for. */
  readonly reference: string;
  /** The ref the caller named, verbatim, so the answer can echo it. */
  readonly ref: string;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** `.quest`-relative directory a record location occupies, matching
 * `TaskService.ownedPathForLocation`. */
function directoryFor(location: TaskLocation): string {
  return `.quest/${location}`;
}

export async function readTaskAtRef(
  request: ReadTaskAtRefRequest,
): Promise<TaskAtRef> {
  let sha: string;
  try {
    sha = await request.git.readRevision(request.repositoryPath, request.ref);
  } catch (error) {
    throw new RefNotResolvableError(request.ref, describe(error));
  }
  if (!/^[0-9a-f]{40}$/u.test(sha))
    throw new RefNotResolvableError(
      request.ref,
      `git resolved it to ${JSON.stringify(sha)}, which is not a commit sha`,
    );

  let listings: readonly (readonly string[])[];
  try {
    listings = await Promise.all(
      CONTINUITY_TASK_LOCATIONS.map((location) =>
        request.git.listFilesRequired(
          request.repositoryPath,
          sha,
          directoryFor(location),
        ),
      ),
    );
  } catch (error) {
    throw new RefRecordsUnreadableError(
      request.ref,
      sha,
      `the .quest tree could not be listed (${describe(error)})`,
    );
  }

  const records: {
    readonly task: TaskState;
    readonly location: TaskLocation;
  }[] = [];
  const pathById = new Map<string, string>();
  for (const [index, location] of CONTINUITY_TASK_LOCATIONS.entries()) {
    for (const path of listings[index] ?? []) {
      // The same filter the working-tree reader applies: dot-prefixed files
      // beside the records are operational metadata (a journal), never
      // authored records.
      const name = path.slice(path.lastIndexOf("/") + 1);
      if (name.startsWith(".") || !name.endsWith(".json")) continue;
      const blob = await request.git.readBlob(
        request.repositoryPath,
        sha,
        path,
      );
      if (blob === null)
        throw new RefRecordsUnreadableError(
          request.ref,
          sha,
          `${path} could not be read`,
        );
      let task: TaskState;
      try {
        task = taskState(JSON.parse(blob) as TaskState);
      } catch {
        throw new RefRecordsUnreadableError(
          request.ref,
          sha,
          `${path} is not a valid task record`,
        );
      }
      const key = aliasKey(task.id);
      const previous = pathById.get(key);
      if (previous !== undefined)
        throw new RefRecordDuplicateError(request.ref, sha, task.id, [
          previous,
          path,
        ]);
      pathById.set(key, path);
      records.push({ task, location });
    }
  }

  // The SAME resolver the working-tree read uses, so `--ref` accepts exactly
  // what `task view` accepts: an id or any alias, case-insensitively.
  let resolved: TaskState;
  try {
    resolved = findTask(
      records.map((record) => record.task),
      request.reference,
    );
  } catch {
    throw new TaskNotFoundAtRefError(request.reference, request.ref, sha);
  }
  const record = records.find((entry) => entry.task.id === resolved.id);
  if (record === undefined)
    throw new TaskNotFoundAtRefError(request.reference, request.ref, sha);

  return {
    task: {
      ...resolved,
      path: `${directoryFor(record.location)}/${resolved.id}.json`,
    },
    revision: recordRevision(record),
    sha,
  };
}
