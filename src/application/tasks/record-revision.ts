import { createHash } from "node:crypto";
import type { TaskLocation, TaskState } from "../../domain/tasks/tasks.ts";

/**
 * QCLI-310: the revision of ONE stored task record -- the value `task view
 * --json` exposes for a caller to capture and hand back to `task edit
 * --if-revision`.
 *
 * Deliberately distinct from `LocalTaskRepository`'s own revision, which
 * hashes the WHOLE workspace (`{taskRecords, drafts}`) and stays the unit of
 * the write CAS and of `task edit-batch`'s reported `data.revision`. Hashing
 * that same workspace snapshot here is what made the precondition
 * workspace-scoped: editing an unrelated task changed the revision
 * `task view` emitted for a record that never moved, so a guarded edit of an
 * untouched task was refused with exit 5. That is the opposite of what
 * QCLI-277 set out to build ("apply this edit only if the record is still at
 * the revision I read"), and of what both the published help text and the
 * tracker contract promise ("if the record has moved since").
 *
 * `location` is part of the hash, stated with its actual weight rather than
 * a rationale it has not earned. `task view` reports the derived `path`
 * beside the record, so the location is part of what a capturing caller
 * read, and including it keeps this revision a digest of the located record
 * rather than of the body alone. It is NOT load-bearing today: every
 * lifecycle transition that relocates a record between `tasks/`,
 * `completed/` and `archive/tasks/` also rewrites its body (status and
 * `updatedAt` at minimum), so the body hash moves on its own. It is cheap
 * insurance against a relocation that leaves the body byte-identical, which
 * nothing in the type system forbids -- not a case measured here.
 */
export function recordRevision(record: {
  readonly task: TaskState;
  readonly location: TaskLocation;
}): string {
  return createHash("sha256")
    .update(JSON.stringify({ task: record.task, location: record.location }))
    .digest("hex");
}
