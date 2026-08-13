---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI license, platform, and runtime ownership record
tags:
  - quest
  - cli
  - decisions
  - governance
  - license
  - platform
  - ownership
summary: Records the owner's 2026-08-05 D1 (license, provenance), D3 (platform matrix, npm ownership), and D2 (runtime ownership only) rulings, plus the resulting root LICENSE file.
timestamp: 2026-08-05T22:52:48.025Z
---

# Quest CLI license, platform, and runtime ownership record

This Reference records three of the five Phase 1 owner rulings made in a live
session on **2026-08-05**, captured in and cited from the
[Ratify the Quest CLI Phase 1 component decisions](../stories/ratify-the-quest-cli-phase-1-component-decisions.md)
Story — that Story, not a transcript, is this ruling's provenance. The other
two rulings (the result-contract envelope and the canonical identifier
grammar and scale target) are recorded as ADRs by sibling tasks; this
document covers only the [open component decisions
register](quest-cli-open-component-decisions.md)'s D1 and D3 entries in full,
plus D2's ownership question (not its runtime choice).

A root `LICENSE` file implementing the D1 ruling is added to this repository
alongside this document.

## Details

### D1 — Product license and contributor provenance

**License: MIT.**

**Contributor provenance: informal/none for now.** No CLA, DCO, or other
formal contributor-provenance process is adopted at this time.

This closes the register's D1 entry ("Open, Product owner"). The register
itself, the component contracts and delivery graph, and the delivery
roadmap's Phase 1 exit-criteria table are reconciled against this ruling by
a separate task (`QCLI-28`); this document is the closing citation that
reconciliation cites, not the reconciliation itself.

### D3 — Supported-platform matrix and final npm package ownership

**Supported-platform matrix: macOS, Linux, and Windows.**

**Ownership: explicitly claimed as quest-cli-owned.** The register's D3
entry read "Open, no owner" precisely because no task had claimed it
explicitly; this document is that claim.

### D2 — Runtime and native packaging (ownership only)

**Ownership: explicitly claimed as quest-cli-owned.** Quest CLI — not
`quest-doc`, not any other repository — is the component that will make
this decision.

**The runtime choice itself is not decided here and stays deferred to
post-activation.** The register's D2 entry remains gated on completed Lore
evidence reviewed after the activation gate opens; nothing in this document
selects a runtime, a native-packaging approach, or narrows the eventual
choice among options. This document closes only the ownership
question — *who* decides — leaving *what* is decided exactly where it
already was.

### What this record does not touch

Consistent with the owning Story's scope, this record does not close,
reopen, or take a position on:

- D6 (product-wide actor and governance model, routed to `quest-doc`);
- D7a (Quest's own archival and retention model) or D7b (legacy Opum
  evidence retention, owned by `opum-doc`/`OCLI-7`);
- the not-found convention's `lore-doc`-side boundary half (Quest's own
  side is addressed by the Phase 1 result-contract ADR, a sibling task);
- the [open component decisions register](quest-cli-open-component-decisions.md),
  the [component contracts and delivery
  graph](quest-cli-component-contracts-and-delivery-graph.md), or the
  delivery roadmap's Phase 1 exit-criteria table — all three are
  reconciled against this and the other Phase 1 rulings by a separate task
  (`QCLI-28`), not by this document.

## Notes

This task (`QCLI-27`) read, read-only: the [open component decisions
register](quest-cli-open-component-decisions.md) (for the D1/D2/D3 entries
this ruling closes or claims) and the owning Story. It modified no other
document in `docs/` and added one file outside the Lore-managed tree: the
root `LICENSE`.
