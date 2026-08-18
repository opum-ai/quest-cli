---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Quest CLI migration and recovery
tags:
  - quest
  - cli
  - migration
  - recovery
summary: Safe migration, synchronization, and recovery procedures for Quest workspaces.
timestamp: 2026-08-16T18:27:08.242Z
---

# Quest CLI migration and recovery

## Purpose

Move issue state into Quest and recover interrupted operations without
mistaking a shadow copy, a projection, or a successful-looking partial import
for an authoritative cutover.

## Prerequisites

- Identify the source mode: Backlog issue-only, Backlog plus Lore knowledge,
  or Jira Cloud through the qualified `jira-cli` boundary.
- Capture the source revision/fingerprint, target Git head, migration-plan
  digest, operator identity, and a workspace with unrelated dirty files left
  untouched.
- Review the migration plan and obtain the required approval before any apply
  or cutover. Preview output alone is never approval.

## Steps

1. Run a read-only preview and record its digest, source fingerprint, proposed
   IDs, exclusions, and fidelity warnings. For Backlog-plus-Lore, separately
   enumerate issue records and Lore knowledge so excluded knowledge cannot be
   mistaken for an issue import.

2. Approve the exact preview digest, then create the migration receipt. If a
   source or target fingerprint changes before apply, stop and regenerate the
   preview; do not reuse approval for changed input.

3. Apply into a shadow period. During shadow, use only the migration refresh
   path for imported records. Ordinary target writes are rejected so the
   source-to-target comparison remains meaningful.

4. Refresh from the source until the recorded deadline, compare counts,
   identities, mutable fields, links, and migrated Lore knowledge receipts,
   then record the verification result. Jira access denial, a missing required
   field, or an unqualified fidelity mapping is a blocking result, not an
   empty import.

5. Cut over only after the required shadow evidence is complete. Report source
   status, target status, receipt digest, and exceptions together so operators
   can distinguish a completed cutover from a staged migration.

6. To roll back, use the receipt's compensation path. It must delete or
   revert only records the migration created and must refuse records changed
   after creation. Preserve the source and all receipts for audit.

7. For a failed Git synchronization, repair the authoritative branch through
   the operation's conflict/recovery flow, re-read the records, and retry the
   named operation. Do not reset, force-push, or rewrite history to make a
   migration appear atomic.

8. For a stale, missing, or corrupt SQLite projection, discard that derived
   database and rebuild it from the authoritative Git records. Verify the
   rebuilt projection's source head and freshness before querying it. This is
   not a repair procedure for authored Git state.

## Rollback

Keep the migration receipt, preview, approval, shadow evidence, and source
fingerprint. If compensation cannot establish the recorded target state, stop
the cutover and escalate with those artifacts. Never replace the source with a
projection export or delete history to conceal an incomplete migration.
