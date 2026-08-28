---
id: QCLI-132
title: Make the canonical task-ID format configurable per workspace
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 21:26'
updated_date: '2026-08-28 23:08'
labels:
  - cli
  - init
  - domain
dependencies:
  - QCLI-126
references:
  - src/domain/records.ts
  - src/domain/gates/gates.ts
  - src/domain/tasks/tasks.ts
  - src/domain/claims/claims.ts
  - src/application/tasks/local-task-repository.ts
  - src/adapters/claims/local-claim-evidence.ts
priority: medium
type: feature
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest init/QCLI-126 lets a workspace declare a taskIdPrefix in .quest/workspace.toml, and nextTaskId already generates IDs with that prefix - but the domain layer rejects anything but the literal T- prefix. canonicalIdPattern = /^T-[1-9][0-9]*$/ is a module-level constant in src/domain/records.ts:14, and canonicalId()/canonicalIdSchema built from it are used across src/domain/records.ts, src/domain/gates/gates.ts, src/domain/tasks/tasks.ts, src/domain/claims/claims.ts, src/application/tasks/local-task-repository.ts, and src/adapters/claims/local-claim-evidence.ts. Confirmed live: quest init --name X (workspace.toml with a manually-set taskIdPrefix) then creating a task with that prefix fails with "Invalid canonical id: <prefix>-1" on the very next read.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A workspace with a configured taskIdPrefix in .quest/workspace.toml can create, view, edit, complete, archive, and reference tasks using that prefix end to end, with no domain-layer validation rejection.
- [x] #2 Every one of the 6 files listed above is audited for a hardcoded T- assumption; each is either parameterized on the configured prefix or confirmed not to need it, with the reasoning recorded.
- [x] #3 A workspace with no configured taskIdPrefix (every workspace initialized before this existed) keeps accepting only T-<N> exactly as today - no regression.
- [x] #4 Once this lands, quest init/QCLI-126 gets a --task-id-prefix flag and its wizard question back.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
DESIGN DECISION (made from evidence, not threaded config):
Relax the domain pattern to accept any well-formed prefix, rather than threading
per-workspace config into pure domain functions. Rationale, all verified in source:
- Every canonicalId() call outside records.ts is a pure assertion ("is this
  structurally a task id"), never a workspace-policy question: gates.ts:121/127,
  claims.ts:115, local-task-repository.ts:174 (identity round-trip),
  local-claim-evidence.ts:513, tasks.ts:376.
- resolver() (tasks.ts:491) maps task.id and task.aliases UNIFORMLY through
  aliasKey(). Nothing branches on canonical-vs-alias shape, so relaxing the
  pattern cannot change dependency/parent resolution.
- Threading workspace config into replayGateHistory/assertEvent would make pure
  domain replay functions workspace-aware - an architectural regression.
- aliases are z.array(z.string().min(1)), never canonicalId-validated, so legacy
  foreign ids (LCLI-315.4) are unaffected either way.

STEPS:
1. src/domain/records.ts: canonicalIdPattern becomes
   /^[A-Za-z][A-Za-z0-9]*-[1-9][0-9]*$/. Prefix cannot contain '-', so the parse
   stays unambiguous; sequence rules (no leading zero, >=1) unchanged; every
   existing T-<N> id still validates identically.
2. src/domain/records.ts: allocateCanonicalId takes an optional prefix (default
   "T") instead of hardcoding `T-${sequence}`. Test-only path today (verified: no
   src/ caller) but corrected so it cannot become a second source of truth.
3. src/cli/main.ts: nextTaskId filters to ids actually starting with
   `${prefix}-` before parsing the sequence, so a foreign-prefixed id can never
   perturb the max.
4. src/cli/main.ts: restore --task-id-prefix on init plus the wizard's third
   question (QCLI-126 AC1, QCLI-136's consumer need). Validate the prefix at the
   CLI boundary against ^[A-Za-z][A-Za-z0-9]*$ so a bad prefix fails at init.
5. src/application/command-help.ts: init entry regains --task-id-prefix.
6. Tests: pattern accepts/rejects table (incl. every previously-rejected case
   still rejected); end-to-end quest init --task-id-prefix QCLI then task create/
   view/edit/complete round-trip; a T- workspace unchanged; nextTaskId ignores
   foreign-prefixed ids.
7. typecheck / lint / layer:check / format:check / test before the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Merged via PR #170 (merge commit 5e0f88e). All 7 CI checks passed, both Windows targets included. AC2's audit outcome per file: records.ts parameterized (pattern + allocateCanonicalId prefix); gates.ts:121/127, claims.ts:115, local-claim-evidence.ts:513, tasks.ts:376 and local-task-repository.ts:174 all confirmed NOT to need the prefix - each is a structural assertion or identity round-trip, none makes a workspace-policy decision. AC4 satisfied in the same PR rather than a follow-up: --task-id-prefix and the wizard's third question are restored.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Relaxed canonicalIdPattern to /^[A-Za-z][A-Za-z0-9]*-[1-9][0-9]*$/ instead of threading per-workspace config through pure domain replay functions - justified by the audit in AC2 and by resolver() (tasks.ts:491) mapping ids and aliases uniformly through aliasKey(), which makes resolution provably indifferent to id shape. Existing T-<N> workspaces are bit-for-bit unaffected: sequence rules untouched, allocateCanonicalId defaults to "T", and an accept/reject table proves every structural case the old pattern rejected still throws. Verified end to end that the exact command from QCLI-136's bug report now works: quest init --name demo --task-id-prefix DEMO --json then task create yields DEMO-1. Merged via PR #170; 303 tests pass (1 unrelated pre-existing failure, QCLI-130).
<!-- SECTION:FINAL_SUMMARY:END -->
