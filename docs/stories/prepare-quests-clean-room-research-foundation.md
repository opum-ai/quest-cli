---
type: Story
title: Prepare Quest's clean-room research foundation
tags:
  - quest
  - research
  - clean-room
  - campaign
summary: Complete the independently authored Quest research campaign before implementation activates.
timestamp: 2026-08-01T17:11:23.688Z
status: in-progress
tasks:
  - qcli-2
  - qcli-2.1
  - qcli-2.2
  - qcli-2.3
  - qcli-2.4
  - qcli-2.5
  - qcli-2.6
  - qcli-2.7
  - qcli-2.8
  - qcli-2.9
---

# Prepare Quest's clean-room research foundation

## Goal

Produce independently authored evidence and implementation-neutral contracts
for Quest while Lore delivery continues. The campaign may classify provenance,
reconcile admitted requirements, write black-box scenarios, define workflows,
study public migration contracts, model threats, and track Lore evidence. It
may not implement or publish Quest.

## Acceptance criteria

- Every source slice has exact provenance, classification, permitted use, and
  exclusions before it informs a normative requirement.
- Legacy Opum intent and observable prototype defects become independently
  authored Quest workflows, invariants, threats, and scenarios without source
  or test copying.
- Migration fidelity, Git safety, concurrency, projection, and Lore integration
  are expressed as observable contracts rather than inherited implementation.
- The final synthesis distinguishes resolved contracts from explicit owner or
  Lore blockers and leaves implementation work inactive.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-2](../../backlog/tasks/qcli-2%20-%20Prepare-Quests-clean-room-research-foundation-before-implementation.md) | Prepare Quest's clean-room research foundation before implementation | To Do |
| [QCLI-2.1](../../backlog/tasks/qcli-2.1%20-%20Revalidate-Quest-research-provenance-and-the-migration-boundary.md) | Revalidate Quest research provenance and the migration boundary | Done |
| [QCLI-2.2](../../backlog/tasks/qcli-2.2%20-%20Reconcile-legacy-Opum-requirements-into-Quest-decisions.md) | Reconcile legacy Opum requirements into Quest CLI candidates | Done |
| [QCLI-2.3](../../backlog/tasks/qcli-2.3%20-%20Turn-prototype-failures-into-Quest-black-box-scenarios.md) | Turn prototype failures into Quest black-box scenarios | Done |
| [QCLI-2.4](../../backlog/tasks/qcli-2.4%20-%20Define-Quest-actors-workflows-and-domain-language.md) | Define Quest CLI actors, workflows, and domain-language candidates | Done |
| [QCLI-2.5](../../backlog/tasks/qcli-2.5%20-%20Research-Backlog-migration-fidelity-through-public-contracts.md) | Research Backlog migration fidelity through public contracts | In Progress |
| [QCLI-2.6](../../backlog/tasks/qcli-2.6%20-%20Model-Quest-Git-filesystem-and-concurrency-threats.md) | Model Quest Git, filesystem, and concurrency threats | In Progress |
| [QCLI-2.7](../../backlog/tasks/qcli-2.7%20-%20Track-Lore-dependencies-and-Quest-activation-evidence.md) | Track Lore dependencies and Quest activation evidence | Done |
| [QCLI-2.8](../../backlog/tasks/qcli-2.8%20-%20Synthesize-Quest-research-into-activation-ready-contracts.md) | Synthesize Quest CLI research into activation-ready component contracts | To Do |
| [QCLI-2.9](../../backlog/tasks/qcli-2.9%20-%20Resolve-the-%60quest%60-npm-package-allocation-and-provenance-gate.md) | Resolve the `quest` npm package allocation and provenance gate | Done |
<!-- lore:tasks:end -->

## Notes

Follow the dependency order in QCLI-2. Start with provenance revalidation.
`quest-doc` owns product-wide decisions; this Story owns only the component
research outputs needed to implement them later.

Read the controlling
[component ADR](../adr/use-quest-cli-for-the-quest-package-and-command.md),
[component charter](../reference/quest-cli-component-charter.md),
[research specification](../specs/quest-cli-pre-implementation-research-program.md),
[normative migration ledger](../reference/former-ocli-to-qcli-migration-ledger.md),
[revalidated source register](../reference/quest-cli-research-source-register.md),
and [context-free handover](../runbooks/quest-cli-research-handover.md) before
selecting a QCLI task. QCLI-2.1's revalidation gates every later research
task's source admission. The
[Lore-owned integration and release gate](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md)
controls later implementation activation.
