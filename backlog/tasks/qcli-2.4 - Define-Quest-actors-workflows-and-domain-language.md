---
id: QCLI-2.4
title: 'Define Quest CLI actors, workflows, and domain-language candidates'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 15:27'
labels:
  - campaign
  - research
  - domain
  - workflows
  - ux
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:domain'
  - wave-3
  - in-review
dependencies:
  - QCLI-2.2
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Define the Quest CLI component from human and agent perspectives before local schemas or commands are frozen. Cover component interactions with repositories, workspaces, accountable ownership, delegation, lifecycle gates, delivery evidence, and optional Lore links. Treat any product-wide vocabulary or actor-model change as a proposal to quest-doc.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A component glossary identifies the execution entities, lifecycle concepts, identities, claims, evidence, workspaces, and projections used by the CLI
- [ ] #2 Component actor responsibilities distinguish accountable humans, delegated agents, reviewers, maintainers, Lore, Git, and derived local projections
- [ ] #3 End-to-end CLI workflows identify authoritative writes, derived reads, human gates, failure recovery, and whether Lore is optional or required
- [ ] #4 Any product-wide vocabulary or actor-model change is routed to quest-doc and remains non-normative until accepted there
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Research (done): re-read quest-cli-component-charter.md, legacy-opum-requirement-reconciliation-for-quest-cli.md (QCLI-2.2, esp. candidate #6 routing), quest-cli-lore-dependency-and-adapter-contract-evidence.md (QCLI-2.7, esp. Part 2 no-generic-adapter finding), the Story, quest-cli-research-source-register.md (read-only admission authority for citation discipline), former-ocli-to-qcli-migration-ledger.md, and quest-cli-pre-implementation-research-program.md (read-only). Also read quest-doc's Allowed canonical quest-clean-room-execution-graph.md (local clone, HEAD 7d4d60c, clean tree) and quest-repository-and-authority-map.md: confirms Quest-wide vocabulary (task/event/workspace/claim/lease/gate/delivery-evidence/human-ownership/delegation) is already quest-doc-adopted, and that no existing quest-doc actor-model glossary exists to conflict with.
2. Scaffold docs/reference/quest-cli-component-glossary-actors-and-workflows.md via 'lore new reference' (done).
3. Author the document: (a) a scope/authorship-boundary section distinguishing component-level quest-cli work from product-wide quest-doc territory, citing the charter's routing rule and the legacy reconciliation doc's candidate #6 disposition; (b) a component glossary (execution entities, lifecycle concepts, identities, claims, evidence, workspaces, projections) framed as candidate domain language, grounded in the already-admitted Adapted/Reusable legacy candidates and quest-doc's core vocabulary, never presented as a frozen schema; (c) a component actor-responsibility table (accountable human, delegated agent, reviewer, maintainer, Lore, Git, derived local projection) explicitly scoped to how these roles act within quest-cli, not a product-wide claim; (d) end-to-end workflows (claim+deliver, lease expiry/reclaim, human review gate, projection rebuild after loss, optional Lore link, delegation handoff), each naming authoritative writes, derived reads, human gates, failure recovery, and whether Lore is optional or required; (e) an explicit AC4 routing section confirming candidate #6 (the product-wide actor model) stays routed to quest-doc and remains non-normative here.
4. Run 'lore sync' exactly once, as the final content step, to regenerate index/log managed blocks.
5. Verify: 'lore check --strict', 'lore validate --strict', 'lore orphans' — all must report zero errors/warnings/orphans.
6. Record notes (--append-notes) with citations and validation command output, and a --comment routing the quest-wide actor-model proposal to quest-doc per AC4.
7. Commit in small logical commits with 'Refs: QCLI-2.4' trailers; push feat/qcli-2.4-domain-language.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-component-glossary-actors-and-workflows.md: a component-level glossary (execution entities, lifecycle concepts, identities, claims, evidence, workspaces, projections), a component actor-responsibility table (accountable human, delegated agent, reviewer, maintainer, Lore, Git, derived local projection), and 6 end-to-end workflows (claim+deliver, lease expiry/reclaim, human review gate, projection rebuild, optional Lore link, delegation handoff), each naming authoritative writes, derived reads, human gates, failure recovery, and Lore optional/required status.

Sources cited (all read-only): quest-cli-component-charter.md, QCLI-2.2's legacy-opum-requirement-reconciliation-for-quest-cli.md (esp. candidate #6's explicit component-vs-product-wide line and candidates #1-#5/#7-#10 as corroboration, not design source), QCLI-2.7's quest-cli-lore-dependency-and-adapter-contract-evidence.md (the no-generic-Lore-adapter central finding, cited for the optional-Lore-link workflow's dependency classification), quest-cli-research-source-register.md, former-ocli-to-qcli-migration-ledger.md, quest-cli-pre-implementation-research-program.md, and the Story. Also cited quest-doc's canonical docs/specs/quest-clean-room-execution-graph.md (Allowed per the register's 'quest-doc canonical product records' slice; local clone /Volumes/external/repos/quest-doc, HEAD 7d4d60c2854a533bbba63e6b69320587b8f88e83, re-verified live 2026-08-04, clean tree) and docs/reference/quest-repository-and-authority-map.md — confirmed the base vocabulary (task/event/workspace/claim/lease/gate/delivery-evidence/human-ownership/delegation) is already Quest-wide-adopted there, and confirmed no existing quest-doc actor-model glossary conflicts (only one unrelated 'reviewer' mention, in its own review-routing rule).

AC1: component glossary table covers execution entities, lifecycle concepts, identities, claims, evidence, workspaces, and projections, each with a grounding citation, framed as candidate language (not frozen schema), per the research program's non-freezing rule.
AC2: actor-responsibility table distinguishes accountable human, delegated agent, reviewer, maintainer, Lore, Git, and derived local projection, explicitly scoped in the doc's 'Scope and authorship boundary' section to how these roles act within quest-cli only.
AC3: 6-row workflow table (claim+deliver, lease expiry/reclaim, human review gate, projection rebuild after loss, optional Lore link, delegation handoff) names authoritative writes, derived reads, human gate, failure recovery, and Lore optional/required for each.
AC4: 'Routing to quest-doc' section names candidate #6 (product-wide actor model) as the sole crossing candidate, explicitly non-normative here; see the routed --comment on this task.

Verification (run from worktree root, 2026-08-04):
- 'lore validate docs/reference/quest-cli-component-glossary-actors-and-workflows.md --plain' -> 'ok ... ; 1 file, 0 errors, 0 warnings, 0 skipped'
- 'lore validate --strict --plain' (repo-wide, pre-sync) -> '20 files, 0 errors, 0 warnings, 6 skipped'
- 'lore orphans --plain' (pre-sync) -> '0 orphan tasks, 0 dangling links'
- 'lore check --strict --plain' (pre-sync) showed the expected status-drift/managed-block-drift errors on the Story (status 'todo' vs live 'in-progress') caused by marking this task In Progress — resolved by the single terminal 'lore sync' run per the campaign's sync-once rule; final post-sync gate output will be appended in a follow-up note before push.

No product source, runtime dependency, or executable scaffolding was added. No sibling-owned file (quest-cli-packaging-contract.md, quest-cli-research-source-register.md, legacy-opum-requirement-reconciliation-for-quest-cli.md, quest-cli-pre-implementation-research-program.md) was edited.

Post-sync final gate verification (2026-08-04, worktree root, after the single terminal 'lore sync' run):
- 'lore sync --plain' -> 'updated docs/log.md' / 'updated docs/reference/index.md' / 'updated docs/stories/prepare-quests-clean-room-research-foundation.md' / '3 files changed' (backlog/ had nothing dirty to auto-commit; the task edits were already committed beforehand).
- 'lore check --strict --plain' -> '20 files, 0 errors, 0 warnings' (exit 0) -- the pre-sync status-drift/managed-block-drift errors are resolved.
- 'lore validate --strict --plain' -> '20 files, 0 errors, 0 warnings, 6 skipped' (exit 0).
- 'lore orphans --plain' -> '0 orphan tasks, 0 dangling links' (exit 0).
All three verification gates pass with zero errors/warnings/orphans. Committed as 990f3fb (doc), 60e7d6a (backlog notes/plan/comment), and 02ef488 (post-sync docs/log.md, docs/reference/index.md, Story regeneration), each with a 'Refs: QCLI-2.4' trailer. Pushing feat/qcli-2.4-domain-language next; leaving status In Progress and all AC checkboxes unchecked per this wave's centralized-settlement instruction.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: this task now produces component-contract candidates and routes Quest-wide language to quest-doc.
---

author: @claude
created: 2026-08-04 15:11
---
Quest-wide proposal routed to quest-doc, per AC4: this task's component-level actor-responsibility mapping (docs/reference/quest-cli-component-glossary-actors-and-workflows.md, AC2 table) is quest-cli-scoped only. It does not settle QCLI-2.2's already-identified reconciliation candidate #6 -- the product-wide, cross-repository actor model (who counts as an accountable human, a delegated agent, a reviewer/approver, and how those roles relate to a gate, as a decision binding quest-doc/quest-web/a future Opum component, not only quest-cli). If a later task pursues candidate #6, the proposal belongs in quest-doc's own repository, informed by (not copied from) this document's component-level table. This is a re-affirmation of an already-routed candidate, not a new product-wide finding -- no other glossary term, actor row, or workflow in this document proposes a change to Quest-wide vocabulary, architecture, or roadmap; the base vocabulary (task/event/workspace/claim/lease/gate/delivery-evidence/human-ownership/delegation) is cited to quest-doc's own already-adopted docs/specs/quest-clean-room-execution-graph.md, not newly proposed here.
---
<!-- COMMENTS:END -->
