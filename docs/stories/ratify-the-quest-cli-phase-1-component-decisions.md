---
type: Story
title: Ratify the Quest CLI Phase 1 component decisions
tags:
  - quest
  - cli
  - decisions
  - phase-1
  - adr
  - ratification
summary: Record the owner's rulings on the three Phase 1 proposals and D1/D3 as ADRs, then reconcile the open decisions register and roadmap against them.
timestamp: 2026-08-05T22:36:14.337Z
status: done
tasks:
  - qcli-24
  - qcli-25
  - qcli-26
  - qcli-27
  - qcli-28
  - qcli-68
  - qcli-69
  - qcli-29
  - qcli-30
  - qcli-31
  - qcli-32
  - qcli-33
  - qcli-34
  - qcli-37
  - qcli-38
  - qcli-40
  - qcli-57
---

# Ratify the Quest CLI Phase 1 component decisions

## Goal

The [follow-through Story](follow-through-on-the-quest-cli-design-layer.md) produced three
Phase 1 proposals (`QCLI-18` result contract, `QCLI-19` identifier grammar, `QCLI-20` scale
target) and explicitly stopped short of ratifying them — its own acceptance criteria forbid
creating an ADR or editing the open component decisions register from a proposal task. That
Story also named two entries it structurally could not touch: D1 (product license) is
owner-held, and D3 (supported-platform matrix) needs a human to assign.

The component owner has now ruled on all five items in a live session on 2026-08-05. This
Story records those rulings as ADRs and reconciles every document the open items touch, so
Phase 1's exit criteria — every open decision closed and recorded, not worked around — can
be checked off truthfully.

**No code.** This Story produces ADRs and reference-document reconciliation only, consistent
with the roadmap Spec's Phase 1 scope ("no code, not blocked on Phase 0").

## Amendment — 2026-08-13 (`QCLI-69`)

The acceptance criteria below preserve the component owner's 2026-08-05 ruling as
historical fact. They no longer state the live wire contract. After `ODOC-22` froze the
cross-component Opum command contract and `QCLI-68` committed Quest to it, `QCLI-69`
amended the result-contract ADR to align the live Quest wire shape, exit taxonomy, kind
registry, diagnostics, and reserved `principal: null` field with that shared authority.
No Opum exception was retained. Principal establishment and authorization enforcement
remain outside the amendment.

## Acceptance criteria

- An ADR records the CLI result contract ruling: `schemaVersion` as the string `"1"`; **two
  separate fields** `kind` and `outcome` (a deliberate deviation from `QCLI-18`'s recommended
  fused `<command>_<outcome-class>` form, chosen for alignment with the Kubernetes/Stripe
  split-field convention — the deviation and its reasoning are stated explicitly, not
  silently substituted); payload keys `result` / `decline` / `error`; the exit-code table
  `0`/`1`/`2`/`3` (anomaly)/`64`; the not-found convention (JSON-first decline envelope with a
  `reason` discriminant, Quest's own side only — the `lore-doc` boundary half stays open);
  anomaly as a distinguishable fourth outcome value; and that `create`/`edit` emit the JSON
  envelope uniformly with every other command.
- An ADR records the canonical identifier grammar ruling (D4): `QCLI-19`'s proposed shape
  accepted as-is (fixed literal prefix, flat unpadded decimal sequence, single global
  counter, ASCII-only alphabet, one fixed canonical case), literal prefix `T`, the authored-
  record layout accepted as proposed, and the Unicode-normalisation/case-folding rules
  accepted as proposed.
- An ADR records the scale target ruling (D5): `QCLI-20`'s proposed design points accepted
  as-is (~10,000 records and ~100,000-150,000 events per enrolled workspace, ~25 workspaces
  per installation, ~5-10 clones per enrolled repository, rebuild time budget of low
  single-digit seconds at ordinary scale and low minutes at the aggregate bound), and the
  rebuild-on-doubt-remains-sufficient conclusion accepted (no full ACID transactional
  semantics implied).
- A reference document records the D1 and D3 rulings: license MIT, contributor provenance
  informal/none for now; supported-platform matrix macOS + Linux + Windows, explicitly
  claimed as quest-cli-owned; and D2 (runtime) ownership explicitly claimed as quest-cli-owned
  while the runtime choice itself stays deferred to post-activation. A root `LICENSE` file
  (MIT) is added as part of this.
- The [open component decisions register](../reference/quest-cli-open-component-decisions.md),
  the [component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md),
  and the [delivery roadmap](../specs/quest-cli-delivery-roadmap.md)'s Phase 1 exit-criteria
  table are reconciled against the four ADRs/reference records above: D1, D3, D4, D5, and
  the "JSON and exits" contract row's four open items (including the not-found convention's
  Quest-side closure and the create/edit-uniformity item) are marked closed, each citing the
  ADR or reference document that closed it.
- The reconciliation explicitly preserves the still-open, owner-flagged boundaries: the
  not-found convention's `lore-doc` half, D2's runtime choice itself, D6 (routed to
  `quest-doc`), and D7a/D7b — none of those is touched or implied closed by this Story.
- Nothing here freezes runtime, native packaging, or the projection storage/index engine —
  the scale target supplies sizing inputs for a future engine choice; it does not choose one.
- Strict Lore gates pass throughout: `lore validate --strict`, `lore check`, and
  `lore orphans` all report zero.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-24](../../.quest/tasks/QCLI-24.json) | Author an ADR for the Quest CLI result contract: envelope shape, exit codes, not-found convention, and anomaly placement | Done |
| [QCLI-25](../../.quest/tasks/QCLI-25.json) | Author an ADR for the Quest CLI canonical identifier grammar and authored-record layout | Done |
| [QCLI-26](../../.quest/tasks/QCLI-26.json) | Author an ADR for the Quest CLI scale target and rebuild-on-doubt conclusion | Done |
| [QCLI-27](../../.quest/tasks/QCLI-27.json) | Record the Quest CLI D1 (license, contributor provenance) and D3 (platform matrix, ownership) owner rulings | Done |
| [QCLI-28](../../.quest/tasks/QCLI-28.json) | Reconcile the Quest CLI open component decisions register, contracts graph, and delivery roadmap against the Phase 1 ADRs | Done |
| [QCLI-68](../../.quest/tasks/QCLI-68.json) | Record quest-cli local obligation to the frozen Opum command contract | Done |
| [QCLI-69](../../.quest/tasks/QCLI-69.json) | Reconcile the Quest result-contract ADR with the frozen Opum command contract | Done |
| [QCLI-29](../../.quest/tasks/QCLI-29.json) | Correct stale 'nothing accepted' prose in three ratified Quest CLI proposal docs | Done |
| [QCLI-30](../../.quest/tasks/QCLI-30.json) | Fix three prose/header inconsistencies left by the QCLI-28 reconciliation | Done |
| [QCLI-31](../../.quest/tasks/QCLI-31.json) | Reconcile the remaining architecture-Spec passages that still read as open after the Phase 1 ADRs | Done |
| [QCLI-32](../../.quest/tasks/QCLI-32.json) | Run a centralized lore sync to reconcile the Phase-1-ratification Story | Done |
| [QCLI-33](../../.quest/tasks/QCLI-33.json) | Reconcile architecture-Spec Open Questions bullet 4 against the QCLI-26 ADR | Done |
| [QCLI-34](../../.quest/tasks/QCLI-34.json) | Reconcile 'file layout' terminology in the register and delivery-graph contract tables against QCLI-25/D4 | Done |
| [QCLI-37](../../.quest/tasks/QCLI-37.json) | Reconcile the stale 'record layout' status cell at register line 167 | Done |
| [QCLI-38](../../.quest/tasks/QCLI-38.json) | Determine whether 'naming scheme' is also closed by the QCLI-25 authored-record-layout section | Done |
| [QCLI-40](../../.quest/tasks/QCLI-40.json) | Reconcile stale "file layout"/"naming scheme" open-item bundles outside the register and delivery-graph docs | Done |
| [QCLI-57](../../.quest/tasks/QCLI-57.json) | Re-verify the Backlog.md v1.49.3 pin before Phase 1 exit | Done |
<!-- lore:tasks:end -->

## Notes

Ratifies proposals from the [follow-through Story](follow-through-on-the-quest-cli-design-layer.md)
(`QCLI-18`, `QCLI-19`, `QCLI-20`) and closes the two items that Story named as structurally
out of its own scope (D1, D3). Owner rulings were made in a live session on 2026-08-05;
cite this Story, not a transcript, as the record of that ruling.

Campaign tracker: `backlog doc view doc-4`.
