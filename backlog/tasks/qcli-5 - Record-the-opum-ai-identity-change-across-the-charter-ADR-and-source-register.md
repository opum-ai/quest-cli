---
id: QCLI-5
title: >-
  Record the opum-ai identity change across the charter, ADR, and source
  register
status: Done
assignee: []
created_date: '2026-08-04 12:18'
updated_date: '2026-08-04 12:21'
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
- [x] #1 The component ADR records an inline, dated amendment superseding decision #1's `salient-data/quest-cli` with `opum-ai/quest-cli`, citing this task, without rewriting the original decision text
- [x] #2 The ADR records that decision #2's owner-approved scope fallback is now exercised as `@opum-ai/quest`, with the executable remaining `quest`
- [x] #3 The component charter no longer asserts the unscoped `quest` package as preferred, and states `@opum-ai/quest` with the executable `quest`
- [x] #4 The source register's claim that the transfer had not been executed is updated to record the completed transfer with its date, and the corresponding reclassification trigger is marked fired
- [x] #5 `lore check --strict` and `lore validate --strict` pass with zero errors and zero warnings
- [x] #6 No repository, package, or release action is taken beyond documentation
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Amended four documents, not the three originally scoped.

The fourth was docs/reference/former-ocli-to-qcli-migration-ledger.md. Its 'Repository history' paragraph documented the opum-cli to opum-doc rename but not this repository's own transfer, which would have left the most obvious place a reader looks for repository identity silently incomplete. It now also states which components did NOT move — quest-doc, lore-doc, opum-doc, and quest-web are all still in salient-data, verified live via gh api before any link was touched. Only lore-cli and quest-cli are in opum-ai, so the charter's Routes-elsewhere links were confirmed correct and deliberately left alone.

Also corrected a fifth site missed in the initial scoping: the source register's classification-vocabulary table (line 44) carried 'ADR text itself left for a separate task' as its Superseded example, which this task made stale.

ADR approach: an inline dated Amendment block after the Decision list, not a rewrite. Decision #1's repository identity is superseded; decisions #3/#4/#5 stand; decision #2 is explicitly recorded as exercised rather than superseded, since it already provided for an owner-approved scope fallback while the executable remains quest. This follows the migration ledger's stated convention -- inline, scoped to the exact artifact overridden, citing the directing task, never a blanket flip.

lore orphans initially reported QCLI-5 as having no owning doc. Linked it to stories/audit-quest-cli-documentation-authority, which already owns QCLI-3 and QCLI-4 (the same class of authority/supersession work). Note lore link takes a concept id, not a path -- a path argument fails with 'not in the bundle' while still exiting 0, so the exit code alone does not prove a link landed.

Verification actually run:
- lore sync --plain -> regenerated docs/log.md and both affected stories, committed backlog/
- lore check --strict --plain -> 16 files, 0 errors, 0 warnings, exit 0
- lore validate --strict --plain -> 16 files, 0 errors, 0 warnings, 6 skipped, exit 0
- lore orphans --plain -> 0 orphan tasks, 0 dangling links (after linking)
- git remote -v -> git@github.com:opum-ai/quest-cli.git; push to the new remote succeeded (865986d..942da73)

AC6 (no action beyond documentation) holds: npm view @opum-ai/quest still returns 404. Nothing was reserved, published, or released.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Brought four governing documents into agreement with the 2026-08-04 opum-ai identity change: the component ADR gained an inline dated amendment superseding decision #1's salient-data/quest-cli (and recording decision #2's scope fallback as exercised, not overridden); the component charter now states @opum-ai/quest with the executable still quest; the research source register's 'not yet transferred' claim became the completed transfer with its two predicted reclassification triggers marked fired; and the migration ledger's repository-history note gained the transfer plus an explicit statement that quest-doc, lore-doc, opum-doc, and quest-web remain in salient-data.

Sibling repository locations were verified live before any link was touched, so no correct link was changed. Every reference records that a GitHub redirect resolves a stale org silently -- the failure mode that let the parallel lore-cli transfer go unnoticed.

Verified with lore check --strict, lore validate --strict (16 files, 0 errors, 0 warnings) and lore orphans (0 orphans, 0 dangling links) after linking the task to its owning Story. Documentation only: @opum-ai/quest remains unclaimed (404), and the package allocation record stays QCLI-2.9's. Committed 942da73.
<!-- SECTION:FINAL_SUMMARY:END -->
