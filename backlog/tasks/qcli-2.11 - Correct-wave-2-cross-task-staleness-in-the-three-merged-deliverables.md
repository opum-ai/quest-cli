---
id: QCLI-2.11
title: Correct wave-2 cross-task staleness in the three merged deliverables
status: In Progress
assignee: []
created_date: '2026-08-04 14:34'
updated_date: '2026-08-04 15:12'
labels:
  - campaign
  - research
  - provenance
  - correction
  - no-implementation
  - 'cluster:provenance'
  - wave-3
  - in-review
dependencies: []
parent_task_id: QCLI-2
priority: high
type: docs
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three wave-2 sibling merges each invalidated text in another. Every defect below was correct when written and reviewed; a later merge made it stale. Exact replacement wording for every location is recorded in the wave-2 integration review captured in campaign doc doc-1, and every underlying command was re-verified live on 2026-08-04.

Scope is documentation correction only: no product source, runtime dependency, executable scaffolding, package reservation, publication, or release. Do not re-open any classification, disposition, or acceptance criterion that a wave-2 review already confirmed.

Sites:
1. docs/reference/quest-cli-packaging-contract.md lines 166 and 189 quote the source registers pre-widening permitted use ("cite existence, version, license, and claimed repository only"). QCLI-2.7 widened then bounded that slice; it now enumerates seven fields exhaustively. Line 189s framing must also change from "unresolved tension routed to QCLI-2.7" to a record that QCLI-2.7 closed it — as written it is internally inconsistent with its own evidence table 120 lines above, which already cites maintainers and descriptions.
2. docs/reference/quest-cli-research-source-register.md asserts "846f054^ is c5ebee8". It is 3023468 ("chore(backlog): sync task changes"). Every claim the parenthetical supports is true: c5ebee8 IS the last commit to touch the former path before the rename, established by `git log -1 846f054^ -- docs/reference/opum-fleet-and-prior-art-inventory.md`, and IS an ancestor of 846f054.
3. docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md line 64 records "reachability re-verified" as its method for a content claim (a 14-row remote register and 24-row fleet register). This is the third instance of the same method-vs-claim substitution; the register has already repudiated it in identical wording. QCLI-2.2s own lines 108-113 show it actually performed the content read, so this understates work already done.
4. The d7ca18f currency contradiction: register lines 61 and 138 assert it as opum-doc HEAD while line 112 declares it "already a stale pin by 2026-08-04". d7ca18f is dated 2026-08-01 18:53; opum-doc advanced at 07:49 on 2026-08-04. QCLI-2.2 inherits the same pin across eight sites, four of which carry no read date at all.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Neither line 166 nor line 189 of the packaging contract states or paraphrases the superseded four-field enumeration; both reflect the current exhaustive field list, and line 189 records the gap as closed by QCLI-2.7 rather than open
- [ ] #2 The source register states 846f054^ is 3023468 and attributes c5ebee8 via the command that actually establishes it, retaining the true 292-line and ancestry claims
- [ ] #3 The legacy-requirement reconciliation records content verification rather than reachability for the Git recovery commits, consistent with the registers corrected slice and with the documents own body
- [ ] #4 No document asserts d7ca18f as opum-doc HEAD; every citation of it is phrased as a dated pin and carries a read date
- [ ] #5 lore check --strict, lore validate --strict, and lore orphans all report zero errors, zero warnings, and zero orphans, and no claim is altered beyond the corrections named in this task
<!-- AC:END -->
