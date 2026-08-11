---
id: QCLI-67
title: Classify and correct superseded salient-data citations
status: Done
assignee:
  - '@codex'
created_date: '2026-08-11 02:19'
updated_date: '2026-08-11 02:29'
labels:
  - docs
  - provenance
  - odoc
  - follow-up
  - 'doc:stories/audit-quest-cli-documentation-authority'
dependencies: []
documentation:
  - docs/stories/audit-quest-cli-documentation-authority.md
priority: high
type: docs
ordinal: 86000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restore the quest-cli portion of opum-doc task ODOC-21 by comprehensively scanning the repository for citations of the superseded salient-data GitHub owner. Classify each citation independently as immutable provenance or live routing/current ownership. Preserve dated evidence, past-decision records, and intentional redirect-hazard warnings; update only live routing/current-owner citations to opum-ai. Exclude backlog/ and archive/ as immutable task provenance, and do not reopen or modify docs/reference/former-ocli-to-qcli-migration-ledger.md (QCLI-66).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every salient-data citation outside backlog/ and archive/ is recorded in a per-file classification as provenance or live routing/current ownership
- [x] #2 All live routing/current-owner citations name opum-ai, while provenance citations remain unchanged
- [x] #3 Intentional redirect-hazard warnings continue to quote salient-data and explain why redirect-based existence checks are insufficient
- [x] #4 docs/reference/former-ocli-to-qcli-migration-ledger.md remains untouched
- [x] #5 Repository gates, including lore sync, lore validate --strict, lore check --strict, and git diff --check, pass with unpiped exit codes recorded
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Couple QCLI-67 to the Audit Quest CLI documentation authority Story and reconcile Lore-managed task status. 2. Update only the five live-routing citations: two in CLAUDE.md, one current lore-doc task link, and the quest-doc/lore-doc authority pointers in the source register. 3. Preserve all 45 provenance or intentional-warning citations, including the QCLI-66 migration ledger, dated probes, superseded decisions, fork lineage, and redirect-hazard examples. 4. Re-scan hidden and tracked repository files outside backlog/ and archive/, verify the migration ledger has no diff, then run lore sync, lore validate --strict, lore check --strict, and git diff --check unpiped. 5. Finalize QCLI-67 with per-criterion evidence, commit, push the feature branch, and open a PR against dev without merging.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Pre-edit inventory: 50 exact case-insensitive salient-data citations across 10 files, with no additional case variants. CLAUDE.md: 4 total = 2 live routing (fleet pointer; current owner matrix) + 2 intentional warnings/provenance. docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md: 2 = 1 live link (LDOC-4 repository target) + 1 dated 2026-08-04 remote observation. docs/reference/quest-cli-packaging-contract.md: 7 provenance/intentional redirect-check evidence. docs/reference/quest-cli-research-source-register.md: 20 = 2 live current-authority pointers (quest-doc and lore-doc) + 18 dated probes, superseded decisions, former identities, or redirect-hazard examples. docs/reference/quest-cli-component-contracts-and-delivery-graph.md: 1 provenance (rejected former home). docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md: 2 provenance (former home and rename). docs/reference/quest-cli-activation-gate-evidence-record.md: 5 provenance (dated external discrepancies and their resolution). docs/reference/former-ocli-to-qcli-migration-ledger.md: 5 immutable provenance/redirect warning; must remain untouched. docs/adr/use-quest-cli-for-the-quest-package-and-command.md: 3 superseded decision/amendment/redirect warning provenance. .claude/skills/backlog-handover/SKILL.md: 1 fork-lineage provenance. GitHub API full_name verification on 2026-08-11 returned opum-ai/quest-cli, opum-ai/opum-doc, opum-ai/lore-doc, opum-ai/quest-doc, opum-ai/quest-web, and opum-ai/lore-cli.

Post-edit verification: the five live-routing citations now use opum-ai. The original 50-source inventory is now 45 retained provenance/intentional-warning matches; Lore task coupling added two generated Story matches containing the QCLI-67 title/path, classified as task-tracking provenance rather than repository-owner routing, for 47 final exact matches across 11 non-Backlog files. Manual focused-diff review confirmed no other source occurrence changed. The protected migration ledger has an empty diff. Unpiped redirected gate exit codes before terminal reconciliation: lore sync 0 (0 files changed on idempotence pass), lore validate --strict 0 (49 files, 0 errors, 0 warnings, 6 skipped), lore check --strict 0 (49 files, 0 errors, 0 warnings), git diff --check 0, protected-ledger git diff --exit-code 0.

Post-terminal reconciliation verification: lore sync exit 0 (Story reconciled to Done; 1 documentation file changed and Backlog task metadata committed), lore validate --strict exit 0 (49 files, 0 errors, 0 warnings, 6 skipped), lore check --strict exit 0 (49 files, 0 errors, 0 warnings), git diff --check exit 0, and protected-ledger git diff --exit-code exit 0. All commands were unpiped with output redirected to dedicated files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Classified 50 pre-existing salient-data citations across 10 files, corrected the five live-routing/current-owner pointers to opum-ai, and preserved all 45 dated provenance and redirect-warning occurrences. Coupled QCLI-67 to the documentation-authority Story and verified the protected QCLI-66 ledger was untouched. Strict Lore and Git gates passed unpiped with exit 0.
<!-- SECTION:FINAL_SUMMARY:END -->
