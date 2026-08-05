---
type: Story
title: Follow through on the Quest CLI design layer
tags:
  - quest
  - cli
  - corrections
  - provenance
  - decisions
  - phase-1
summary: Close the residual corpus defects the design layer surfaced, correct the one error it introduced, and propose the Phase 1 component decisions.
timestamp: 2026-08-05T12:35:09.501Z
status: in-progress
tasks:
  - qcli-12
  - qcli-13
  - qcli-14
  - qcli-15
  - qcli-16
  - qcli-17
  - qcli-18
  - qcli-19
  - qcli-20
---

# Follow through on the Quest CLI design layer

## Goal

The design layer QCLI-10 produced did two things beyond its own deliverables: it
surfaced defects that had been recorded only in per-task settlement notes and never
filed, and it introduced one factual error of its own. This Story closes both, and then
drafts proposals for the component decisions that delivery Phase 1 exists to settle.

Three kinds of work, deliberately in one Story because they share a cause:

- **Residual corpus defects** — six items found in settlement notes across the research
  campaign. Each was correctly deferred by the task that found it, and then never filed,
  because this project files no follow-up without approval.
- **One self-inflicted error** — the open component decisions register asserts that the
  Backlog.md v1.49.3 reclassification trigger has probably fired. A live check on the day
  it was written shows the pin is current. The claim and everything downstream of it are
  wrong.
- **Phase 1 proposals** — the CLI result contract, the canonical identifier grammar, and
  the scale target. Phase 1 is decision work, produces no code, and is the only phase not
  blocked on the Lore-owned release gate.

## Acceptance criteria

- Every residual defect is either fixed, or confirmed already closed with the evidence
  that closed it. Confirming something is already fine is a real outcome, not a failure —
  two of these were narrowed at init precisely because a live check disagreed with the
  note that recorded them.
- Corrections are recorded inline and dated, citing the directing task. Nothing in the
  research corpus is silently rewritten; the inline-supersession convention exists so the
  prior state stays legible.
- Documents pinned by the research source register are handled with their pin. Editing a
  pinned document invalidates the pin on merge whether or not the task meant to touch the
  register, so each such task either self-pins in the same pass or records the need for a
  separate correction.
- Phase 1 outputs are **proposals for an owner ruling**, not decisions. No ADR is created,
  no decision is recorded as accepted, and the open component decisions register is not
  edited by a proposal task.
- Nothing here freezes runtime, native packaging, supported platforms, projection storage
  engine, or product license.
- Strict Lore gates pass throughout: `lore validate --strict`, `lore check`, and
  `lore orphans` all report zero.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-12](../../backlog/tasks/qcli-12%20-%20Fix-the-stale-QCLI-2.8-dependency-order-row-in-the-research-programme-Spec.md) | Fix the stale QCLI-2.8 dependency-order row in the research programme Spec | Done |
| [QCLI-13](../../backlog/tasks/qcli-13%20-%20Backlink-the-adoption-playbook-from-the-component-charter-and-migration-ledger.md) | Backlink the adoption playbook from the component charter and migration ledger | Done |
| [QCLI-14](../../backlog/tasks/qcli-14%20-%20Correct-the-bin-path-row-in-the-packaging-contracts-Description-column.md) | Correct the bin-path row in the packaging contract's Description column | Done |
| [QCLI-15](../../backlog/tasks/qcli-15%20-%20Audit-two-unresolved-register-findings-the-untraceable-Allowed-value-and-QCLI-2.12s-F4-and-F5.md) | Audit two unresolved register findings: the untraceable Allowed value and QCLI-2.12's F4 and F5 | Done |
| [QCLI-16](../../backlog/tasks/qcli-16%20-%20Audit-and-correct-the-licensing-source-misattribution-in-the-contracts-and-delivery-graph.md) | Audit and correct the licensing-source misattribution in the contracts and delivery graph | Done |
| [QCLI-17](../../backlog/tasks/qcli-17%20-%20Correct-the-open-component-decisions-registers-Backlog.md-reclassification-trigger-claim.md) | Correct the open component decisions register's Backlog.md reclassification-trigger claim | In Progress |
| [QCLI-18](../../backlog/tasks/qcli-18%20-%20Propose-the-CLI-result-contract-envelope-shape-exit-code-table-not-found-convention-and-anomaly-placement.md) | Propose the CLI result contract: envelope shape, exit-code table, not-found convention, and anomaly placement | To Do |
| [QCLI-19](../../backlog/tasks/qcli-19%20-%20Propose-the-canonical-identifier-grammar-and-authored-record-layout.md) | Propose the canonical identifier grammar and authored-record layout | To Do |
| [QCLI-20](../../backlog/tasks/qcli-20%20-%20Propose-the-scale-target-and-the-projection-sizing-basis-it-implies.md) | Propose the scale target and the projection sizing basis it implies | To Do |
<!-- lore:tasks:end -->

## Notes

Every member is independently startable — no task here carries a Backlog `dependencies`
entry, and the campaign's wave composition is bounded by authored-file ownership and the
wave-size cap rather than by dependency order.

Authored-file ownership is the real constraint. Each task writes to a distinct
pre-existing document, with one soft edge: the register correction may also need to reach
into the [delivery roadmap](../specs/quest-cli-delivery-roadmap.md) and the
[functional requirements](../specs/quest-cli-functional-requirements.md) if either
inherited the false premise. Serialize anything else touching those two against it.

The [open component decisions register](../reference/quest-cli-open-component-decisions.md)
is the input for the three proposal tasks — entries D4 and D5 and the CLI contract open
items. The proposals deliberately do not edit it; reconciling the register happens once
an owner rules, so that the proposal tasks do not contend for one file.

Three register entries are **not** in this Story and cannot be: product license (D1) is
owner-held, supported-platform ownership (D3) needs a human to assign, and the
product-wide actor model (D6) belongs in `quest-doc`, not this repository.

Campaign tracker: `backlog doc view doc-3`.
