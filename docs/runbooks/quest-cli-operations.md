---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Quest CLI operations
tags:
  - quest
  - cli
  - operations
summary: Operator procedures for initializing and safely operating a Quest workspace.
timestamp: 2026-08-16T18:27:08.169Z
---

# Quest CLI operations

## Purpose

Operate the released Quest tracker surface without treating a local SQLite
projection, a generated artifact, or an agent session as the source of truth.
Authored records and their Git history are authoritative. The 0.1 executable
is intentionally narrow: use its manifest and tracker commands only for the
operations they advertise.

## Prerequisites

- Work from a clone whose intended branch and remote have been checked with
  `git status --short --branch` and `git remote -v`.
- Install an immutable `@opum-ai/quest` artifact only after a release record
  says that artifact was published and verified. Before then, use the reviewed
  candidate tarballs; do not infer that the package name is available.
- Declare the actor on every mutating tracker request. A delegated actor must
  identify a distinct accountable human.
- Preserve any unrelated dirty paths. Do not use reset, clean, force-push, or
  history rewriting as an operational repair.

## Steps

1. Identify the installed surface and version before automating it:

   ```sh
   quest --version
   quest manifest --json
   quest task status-flow --json
   ```

   The manifest is the compatibility boundary. Do not invoke a command merely
   because an internal module or a future runbook names it.

2. Initialize and enroll a workspace only through an approved integration
   using Quest's workspace boundary. Version 0.1 does not advertise `init`,
   `enroll`, or projection commands in its executable manifest, so an operator
   must not fabricate command syntax for them. The integration must inspect a
   non-bare Git worktree, write only `.quest/workspace.toml`, reject an
   already-initialized workspace, and record each enrolled worktree separately
   even when worktrees share one Git common directory. Preserve a rejected path
   and its diagnostic; never create configuration outside the inspected
   worktree.

3. Inspect work before changing it:

   ```sh
   quest task list --json
   quest task view T-123 --json
   quest search "release readiness" --json
   ```

   Use the canonical task identifier returned by Quest. An alias that is
   ambiguous must be resolved before a claim or a write is attempted.

4. Create or update tracker tasks only with an explicit actor declaration:

   ```sh
   quest task create "Investigate release gate" --actor human-42 --actor-kind human --json
   quest task edit T-123 --status "In Progress" --actor agent-7 --actor-kind delegated-agent --accountable-human human-42 --json
   ```

   Keep the request and result envelope in the task's review evidence. A
   conflict result means the reference advanced: re-read the task and retry
   only the intended operation; never overwrite a newer authored record.

5. For claims and delegation, keep the accountable human stable for the whole
   lease. Renew only a live generation and treat an expired lease as
   reclaimable, not silently owned. A gate is satisfied only by eligible
   evidence; a worker must not self-approve a human-judgement gate.

6. Synchronize through the operation-owned Git path after a bounded change.
   If the branch has moved, re-read the affected authored records and resolve
   the named conflict. Preserve unrelated working-tree changes throughout.

7. Treat projection status as a health observation. Rebuild only from the
   complete authored Git source, then compare the rebuilt state with the
   recorded head before using it for queries. A projection never authorizes a
   task transition or repairs Git.

## Rollback

Stop a failed operation at its reported boundary and retain its diagnostic,
operation identifier, and current Git head. Restore authoritative records by
using the recorded compensating operation or a reviewed Git repair that
preserves history. It is safe to discard and rebuild a derived projection; it
is not safe to discard authored records, lease events, gate evidence, or an
unexplained dirty path.
