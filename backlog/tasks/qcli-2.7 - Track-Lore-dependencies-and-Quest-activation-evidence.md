---
id: QCLI-2.7
title: Track Lore dependencies and Quest activation evidence
status: In Progress
assignee:
  - '@claude-worker'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 13:11'
labels:
  - campaign
  - research
  - lore
  - evidence
  - activation-gate
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:lore-gate'
  - wave-2
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Maintain the Quest CLI dependency-status and evidence-consumer matrix for choices that depend on Lore. Link the Lore-wide gate policy in lore-doc and read implementation or immutable release evidence from the owning Lore component, currently lore-cli for the package and command. Observe owners without modifying them or copying their mutable gate criteria.

Owner direction, 2026-08-04 (restore #2) — adapter alignment folded in. This task now also reviews the current lore-cli for alignment on the adapter quest-cli must honor. The component charter states quest-cli owns "versioned Lore import/link/adapter behavior", but no campaign task previously produced the adapter-contract evidence QCLI-2.8 would synthesize from. ACs #4/#5/#6 cover it. This remains research: describe the contract and name the divergences, do not implement an adapter.

Owner ruling, 2026-08-04 (restore #2) — the SPLIT RULE for lore-cli source admissibility. The research source register previously excluded all design derivation from lore-cli TypeScript. That exclusion is now split:

  ADMISSIBLE — lore-cli source and its own ADRs as evidence of what Lore REQUIRES of any task-tracker backend: the adapter interface shape, the structured-output envelope and schema-version expectations, capability-probe and fail-loud semantics, the write path, identifier capture, and the back-reference/metadata-storage constraint. This is Opum-owned MIT code describing Lore own design, and quest-cli is chartered to honor it.

  NOT ADMISSIBLE — any assertion about how Backlog.md BEHAVES, even when lore source or lore ADRs state it. Owner ruling 1 (strict clean-room, Backlog.md source Excluded) and ruling 5 (lore-cli Backlog corpus Contextual: readable for question discovery, citable for nothing) are unchanged. Every Quest assertion about Backlog.md must still be independently re-derived from the public surface at the pinned v1.49.3 and cited to that observation.

  The line: cite Lore for what Lore needs; never cite Lore for what Backlog does. Record the split rule in the source register as part of this task.

This task OWNS all edits to docs/reference/quest-cli-research-source-register.md for wave 2. QCLI-2.2 and QCLI-2.9 run concurrently and must cite the register read-only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The matrix links the canonical lore-doc gate and names the owning Lore task, specification, runbook, or immutable evidence for every component dependency
- [ ] #2 Each Quest CLI choice is classified evidence-complete, provisionally researchable, blocked on a named owner result, or requiring owner input
- [ ] #3 The handover requires live owner verification before implementation activation and does not restate the Lore gate
- [ ] #4 The current lore-cli adapter contract is reviewed against quest-cli stated obligation to honor versioned Lore import/link/adapter behavior, recording at the pinned released revision: the invocation surface Lore requires of a task CLI, the structured-output envelope and schema-version expectation, the capability-probe and fail-loud semantics, the write path and new-identifier capture requirement, the existence-check contract, and the back-reference/metadata-storage constraint
- [ ] #5 Each adapter requirement is classified as already satisfiable by Quest chartered contract, requiring a Quest contract change, or requiring a lore-doc boundary decision, with every divergence named explicitly rather than summarized
- [ ] #6 Drift between lore-cli published/pinned revision and its current development line is recorded with dated evidence, and any change to the documented adapter surface is flagged as a reclassification trigger
- [ ] #7 The split rule for lore-cli source admissibility is recorded in the research source register, and every adapter finding cites Lore for what Lore requires without citing Lore for any claim about Backlog.md behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Research (done): re-read the research source register, component charter, migration ledger, research-program Spec, Story, and handover runbook; re-verify live drift evidence in lore-cli (npm/local version, tag commit, dev HEAD, ahead/behind, ancestor check, diff --stat of cli-surface.md/cli-contract.md/okf-projection-contract.md, src/adapters/backlog.ts, src/, and docs/ between v0.1.0 and dev HEAD); read src/adapters/backlog.ts in full (probe, envelope schemas, BacklogAdapter interface, createBacklogAdapter, status-flow parsing) plus lore-design.md and architecture.md sec 3 for adapter-boundary framing; read lore-doc's quest-integration-and-lore-release-gate.md and LDOC-4's live status (To Do) without copying its checklist; discover ADR-0009 as an additional Backlog-behavior-tainted lore-cli document (states 'Backlog.md drops unknown frontmatter keys on edit' uncited) alongside the already-known historical-upstream-backlog-json-tag-watch.md gap.
2. Author one new Reference concept via 'lore new reference' under docs/reference/ with two parts: Part 1 the Lore dependency and activation-evidence matrix (AC1-3: links the lore-doc gate without restating it, names owning Lore task/spec/runbook/evidence per dependency, classifies each Quest choice evidence-complete/provisionally-researchable/blocked-on-named-owner-result/requires-owner-input, and states live owner re-verification is required before activation); Part 2 the lore-cli adapter contract review (AC4-6: invocation surface, structured-output envelope + schemaVersion, capability-probe + fail-loud semantics, write path + new-id capture, existence-check contract, back-reference/metadata-storage constraint, each cited to src/adapters/backlog.ts at tag v0.1.0/commit e621d20; AC5 three-way classification against Quest's chartered contract with every divergence named explicitly, including the hard finding that lore-cli has no generic TaskAdapter abstraction today -- BacklogAdapter is the only adapter type -- so a second backend is a lore-doc boundary question, not solely a Quest one; AC6 dated drift table).
3. Edit docs/reference/quest-cli-research-source-register.md (AC7, sole owner this wave): record the split rule verbatim as its own subsection; classify lore-cli-release-truth.md and release-publishing.md (currently named but unclassified per the known gap); extend the Backlog-corpus closed list with a catch-all clause covering any further lore-cli document deriving from Backlog.md source, naming historical-upstream-backlog-json-tag-watch.md and the newly discovered ADR-0009 as instances; do not restate or duplicate any Lore gate criteria.
4. Add a one-line pointer to the new Reference doc from docs/index.md's hand-authored 'Start here' section (docs/reference/index.md's own listing is lore-managed and regenerates via sync); no edits to the campaign Story's managed blocks.
5. Run 'lore sync' then the verification gates ('lore check --strict --plain', 'lore validate --strict --plain', 'lore orphans --plain'); fix to zero errors/warnings.
6. Record implementation notes (decisions, split-rule refusals with rationale, literal gate output) via --append-notes; commit in small logical commits with 'Refs: QCLI-2.7'; push the branch as the last action. Do not check ACs, write a final summary, or move the task to Done.
<!-- SECTION:PLAN:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: lore-doc owns gate policy, owning Lore components hold implementation/release evidence, and this task only consumes and maps that evidence.
---
<!-- COMMENTS:END -->
