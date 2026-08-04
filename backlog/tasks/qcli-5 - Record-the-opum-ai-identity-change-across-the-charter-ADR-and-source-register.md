---
id: QCLI-5
title: >-
  Record the opum-ai identity change across the charter, ADR, and source
  register
status: In Progress
assignee: []
created_date: '2026-08-04 12:18'
updated_date: '2026-08-04 12:20'
labels:
  - documentation
  - authority
  - provenance
  - quest
  - identity
  - no-implementation
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
documentation:
  - docs/reference/quest-cli-component-charter.md
  - docs/adr/use-quest-cli-for-the-quest-package-and-command.md
  - docs/stories/audit-quest-cli-documentation-authority.md
priority: high
type: docs
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The repository was transferred from `salient-data/quest-cli` to `opum-ai/quest-cli` on 2026-08-04 at the owner's direction, and the package name decision moved to the scoped `@opum-ai/quest` with the executable still `quest`. Three governing documents still assert the superseded identity and must be brought into agreement.

QCLI-2.1 recorded both disagreements as classified findings in `docs/reference/quest-cli-research-source-register.md` but was deliberately barred from amending the source documents; this task performs that amendment and cites itself as the directing task, per the migration ledger's supersession convention (inline, scoped to the exact artifact overridden, never a blanket flip).

Scope is documentation only: no product source, runtime dependency, executable scaffolding, package reservation, publication, or release. The npm package `@opum-ai/quest` is unclaimed and stays unclaimed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The component ADR records an inline, dated amendment superseding decision #1's `salient-data/quest-cli` with `opum-ai/quest-cli`, citing this task, without rewriting the original decision text
- [ ] #2 The ADR records that decision #2's owner-approved scope fallback is now exercised as `@opum-ai/quest`, with the executable remaining `quest`
- [ ] #3 The component charter no longer asserts the unscoped `quest` package as preferred, and states `@opum-ai/quest` with the executable `quest`
- [ ] #4 The source register's claim that the transfer had not been executed is updated to record the completed transfer with its date, and the corresponding reclassification trigger is marked fired
- [ ] #5 `lore check --strict` and `lore validate --strict` pass with zero errors and zero warnings
- [ ] #6 No repository, package, or release action is taken beyond documentation
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify which sibling repos actually moved before touching any link: quest-doc, lore-doc, opum-doc, quest-web are all still in salient-data — only lore-cli and quest-cli are in opum-ai, so the charter's Routes-elsewhere links stay untouched.
2. ADR: add an inline, dated Amendment block after the Decision list, superseding decision #1's repository identity and recording that decision #2's owner-approved scope fallback is now exercised. Do not rewrite the original numbered decisions — the migration ledger's convention is inline supersession scoped to the exact artifact, citing the directing task.
3. Charter: change the single ':23' bullet from the unscoped preferred name to '@opum-ai/quest', executable unchanged.
4. Source register: update the identity slice's 'Repository or URL' from 'not yet transferred' to the completed transfer with its date and the redirect behaviour; update Exclusions to record that QCLI-5 performed the ADR/charter amendments QCLI-2.1 was barred from; mark the 'transfer completing' reclassification trigger fired.
5. Run lore sync, then lore check --strict and lore validate --strict; capture real output.
6. Commit with Refs: QCLI-5.
<!-- SECTION:PLAN:END -->
