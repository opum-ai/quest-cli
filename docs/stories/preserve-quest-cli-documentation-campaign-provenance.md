---
type: Story
title: Preserve Quest CLI documentation campaign provenance
summary: Owns completed campaign-governance and reconciliation records without changing product behavior.
timestamp: 2026-08-14T12:17:39.009Z
status: done
tasks:
  - qcli-35
  - qcli-36
  - qcli-39
  - qcli-43
  - qcli-44
  - qcli-45
  - qcli-46
  - qcli-47
  - qcli-48
  - qcli-49
  - qcli-50
  - qcli-51
  - qcli-52
  - qcli-53
  - qcli-54
  - qcli-55
  - qcli-60
  - qcli-70
---

# Preserve Quest CLI documentation campaign provenance

## Goal

Preserve the completed documentation-campaign operational record: reproducible Lore
reconciliation, accurate task metadata, supersession-amendment rules, and truthful
campaign-stage and Git bookkeeping. This Story records process evidence only; it does
not create, change, or authorize Quest product behavior.

## Acceptance criteria

- Completed campaign records distinguish local evidence, historical provenance, and
  current owner-routed authority without reviving a retired process as an executable
  instruction.
- Lore-managed logs and Backlog task metadata are reconciled after campaign delivery,
  so historical commits remain traceable despite squash merges.
- Campaign guidance records the tested settlement, commit, discard, and stage-state
  conventions as historical operational evidence rather than mutable product policy.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| QCLI-35 | Sync docs/log.md to close pre-existing SHA drift from squash-merge rewrites | Done |
| QCLI-36 | Fix QCLI-34's task metadata: correct the references field to real paths | Done |
| QCLI-39 | Sync docs/log.md again to close post-wave-1 SHA drift | Done |
| QCLI-43 | Fold the lore log sync into campaign settlement to stop recurring docs/log.md SHA drift | Done |
| QCLI-44 | Settle whether inline supersession amendments must cite the directing task | Done |
| QCLI-45 | Record the evidence-record amendment ruling and reconcile QCLI-42 in-place replacement | Done |
| QCLI-46 | Re-derive and reconcile the outstanding inline supersession-citation debt across docs | Done |
| QCLI-47 | Reconcile the Refs trailer convention with campaign bookkeeping practice | Done |
| QCLI-48 | Close the squash-merge Refs trailer-loss vector | Done |
| QCLI-49 | Define the commit step for the orchestrator's dispatch-marking writes | Done |
| QCLI-50 | Settle whether tense-only edits fall under preserve-and-amend | Done |
| QCLI-51 | Reconcile the campaign stage-state table with the never-committed reality of in-review and merge-pending | Done |
| QCLI-52 | Finish the stage-state legibility sweep QCLI-51 started | Done |
| QCLI-53 | Settle the discard-timing looseness between wave-loop (f) and (g)'s clean-checkout precondition | Done |
| QCLI-54 | Bind the campaign doc's Stage reached column to a stage scale and settle post-dispatch recording cadence | Done |
| QCLI-55 | Retire wave-loop.md's not-yet-exercised claim for merge-pending's point of action | Done |
| QCLI-60 | Push the orchestrator's default-branch bookkeeping commits and fix (g) step 5's failed-fast-forward diagnosis | Done |
| QCLI-70 | Adopt the Codex backlog-handover skill from lore-cli | Done |
<!-- lore:tasks:end -->

## Notes

The tasks coupled here are completed housekeeping and campaign-governance work. Their
common deliverable is a trustworthy historical record, not a product capability or an
implementation activation decision.
