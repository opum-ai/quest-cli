---
type: Story
title: Prepare Quest CLI for implementation activation
tags:
  - quest
  - cli
  - design
  - architecture
  - requirements
  - roadmap
  - activation-gate
summary: Turn the completed QCLI research corpus into a derived design layer an implementer can execute against, while implementation stays gated.
timestamp: 2026-08-05T11:41:15.413Z
status: done
tasks:
  - qcli-10
  - qcli-10.1
  - qcli-10.2
  - qcli-10.3
  - qcli-10.4
  - qcli-10.5
  - qcli-11
---

# Prepare Quest CLI for implementation activation

## Goal

Turn the completed clean-room research corpus into a design layer an implementer can
execute against, and record what quest-cli consumed from the Lore-owned activation gate.

The research campaign produced twelve deliverables organised by research task. That
organisation is correct for evidence and wrong for delivery: a reader who wants to know
what to build must read all twelve and derive the design themselves. This Story adds a
derived layer over that evidence — an open-decisions register, ADRs for decisions the
research already settled, one functional-requirement identifier space, a runtime-neutral
architecture, and a staged roadmap — without touching the evidence itself.

Implementation stays inactive throughout. The layer describes what would be built and in
what order; it authorises none of it.

## Acceptance criteria

- The derived layer stands on its own: a reader who opens only the roadmap can identify
  the next actionable work and reach its requirements and open decisions in one hop.
- Every requirement, decision, and phase cites the research document and the task that
  settled it, so the evidence chain survives the reorganisation.
- The twelve research deliverables are unmodified. Their dated provenance, admission
  classifications, and recheck clauses are what the clean-room audit rests on, and a
  derived document may cite them but may not restate or replace them.
- Choices whose required Lore evidence is unfinished stay open and are recorded as open,
  with an owner or an explicit statement that none exists.
- No product source, package metadata, runtime dependency, executable scaffolding, or
  install instruction is added.
- The gate record states what quest-cli consumed and when. It does not evaluate the gate,
  and it does not open it.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-10](../../backlog/tasks/qcli-10%20-%20Consolidate-QCLI-research-into-an-implementation-ready-design-corpus.md) | Consolidate QCLI research into an implementation-ready design corpus | Done |
| [QCLI-10.1](../../backlog/tasks/qcli-10.1%20-%20Author-the-Quest-CLI-open-component-decisions-register.md) | Author the Quest CLI open component decisions register | Done |
| [QCLI-10.2](../../backlog/tasks/qcli-10.2%20-%20Promote-settled-Quest-CLI-decisions-into-ADRs.md) | Promote settled Quest CLI decisions into ADRs | Done |
| [QCLI-10.3](../../backlog/tasks/qcli-10.3%20-%20Author-the-Quest-CLI-functional-requirements-Spec.md) | Author the Quest CLI functional requirements Spec | Done |
| [QCLI-10.4](../../backlog/tasks/qcli-10.4%20-%20Author-the-Quest-CLI-architecture-Spec.md) | Author the Quest CLI architecture Spec | Done |
| [QCLI-10.5](../../backlog/tasks/qcli-10.5%20-%20Author-the-Quest-CLI-delivery-roadmap-Spec.md) | Author the Quest CLI delivery roadmap Spec | Done |
| [QCLI-11](../../backlog/tasks/qcli-11%20-%20Record-quest-clis-activation-gate-evidence-and-decision-time.md) | Record quest-cli's activation-gate evidence and decision time | Done |
<!-- lore:tasks:end -->

## Notes

Read the [research programme Spec](../specs/quest-cli-pre-implementation-research-program.md)
before starting any task here — its "Prohibited work before activation" list still binds,
and its moving-vs-immutable reference convention governs how every dated observation in
the new layer must be written.

The [component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md)
is the single most important input: it holds the seven functional contracts, the seven
unresolved component decisions, and the dormant delivery graph the roadmap makes
executable.

Dependency order within the campaign: QCLI-10.1 and QCLI-10.2 are extractions and can run
first and independently. QCLI-10.3 establishes the requirement identifier space that
QCLI-10.4 and QCLI-10.5 both reference. QCLI-11 is independent of all of them.

Only one task may edit any given pre-existing document — every task here writes into one
bundle, so cluster disjointness alone is not enough to make two tasks concurrent.

`quest-doc` owns product-wide architecture and roadmap; anything this campaign produces
that would change Quest-wide vocabulary, the actor model, or the product promise is a
proposal to that repository, not normative because a QCLI task wrote it.
