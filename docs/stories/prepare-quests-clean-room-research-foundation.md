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
status: done
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
  - qcli-2.10
  - qcli-2.11
  - qcli-2.12
  - qcli-2.13
  - qcli-2.14
  - qcli-6
  - qcli-7
  - qcli-8
  - qcli-9
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
| [QCLI-2](../../backlog/tasks/qcli-2%20-%20Prepare-Quests-clean-room-research-foundation-before-implementation.md) | Prepare Quest's clean-room research foundation before implementation | Done |
| [QCLI-2.1](../../backlog/tasks/qcli-2.1%20-%20Revalidate-Quest-research-provenance-and-the-migration-boundary.md) | Revalidate Quest research provenance and the migration boundary | Done |
| [QCLI-2.2](../../backlog/tasks/qcli-2.2%20-%20Reconcile-legacy-Opum-requirements-into-Quest-decisions.md) | Reconcile legacy Opum requirements into Quest CLI candidates | Done |
| [QCLI-2.3](../../backlog/tasks/qcli-2.3%20-%20Turn-prototype-failures-into-Quest-black-box-scenarios.md) | Turn prototype failures into Quest black-box scenarios | Done |
| [QCLI-2.4](../../backlog/tasks/qcli-2.4%20-%20Define-Quest-actors-workflows-and-domain-language.md) | Define Quest CLI actors, workflows, and domain-language candidates | Done |
| [QCLI-2.5](../../backlog/tasks/qcli-2.5%20-%20Research-Backlog-migration-fidelity-through-public-contracts.md) | Research Backlog migration fidelity through public contracts | Done |
| [QCLI-2.6](../../backlog/tasks/qcli-2.6%20-%20Model-Quest-Git-filesystem-and-concurrency-threats.md) | Model Quest Git, filesystem, and concurrency threats | Done |
| [QCLI-2.7](../../backlog/tasks/qcli-2.7%20-%20Track-Lore-dependencies-and-Quest-activation-evidence.md) | Track Lore dependencies and Quest activation evidence | Done |
| [QCLI-2.8](../../backlog/tasks/qcli-2.8%20-%20Synthesize-Quest-research-into-activation-ready-contracts.md) | Synthesize Quest CLI research into activation-ready component contracts | Done |
| [QCLI-2.9](../../backlog/tasks/qcli-2.9%20-%20Resolve-the-%60quest%60-npm-package-allocation-and-provenance-gate.md) | Resolve the `quest` npm package allocation and provenance gate | Done |
| [QCLI-2.10](../../backlog/tasks/qcli-2.10%20-%20Author-the-Backlog-to-Quest-adoption-and-migration-playbook.md) | Author the Backlog-to-Quest adoption and migration playbook | Done |
| [QCLI-2.11](../../backlog/tasks/qcli-2.11%20-%20Correct-wave-2-cross-task-staleness-in-the-three-merged-deliverables.md) | Correct wave-2 cross-task staleness in the three merged deliverables | Done |
| [QCLI-2.12](../../backlog/tasks/qcli-2.12%20-%20Close-the-research-source-registers-admission-authority-coherence-gaps.md) | Close the research source register's admission-authority coherence gaps | Done |
| [QCLI-2.13](../../backlog/tasks/qcli-2.13%20-%20Adopt-a-moving-vs-immutable-reference-convention-in-the-research-program-Spec.md) | Adopt a moving-vs-immutable reference convention in the research program Spec | Done |
| [QCLI-2.14](../../backlog/tasks/qcli-2.14%20-%20Re-home-the-runtime-native-packaging-and-supported-platform-question.md) | Re-home the runtime, native-packaging, and supported-platform question | Done |
| [QCLI-6](../../backlog/tasks/qcli-6%20-%20Close-remaining-research-source-register-enumeration-gaps-QCLI-2.5-2.6-2.8-2.9-2.10-not-yet-enumerated-in-Prior-QCLI-research-records.md) | Close remaining research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not yet enumerated in 'Prior QCLI research records') | Done |
| [QCLI-7](../../backlog/tasks/qcli-7%20-%20Enumerate-the-campaign-Story-in-the-research-source-registers-Prior-QCLI-research-records-slice.md) | Enumerate the campaign Story in the research-source-register's 'Prior QCLI research records' slice | Done |
| [QCLI-8](../../backlog/tasks/qcli-8%20-%20Reconcile-QCLI-2.10s-playbook-against-the-QCLI-2.5-enumeration-gap-QCLI-6-already-closed.md) | Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration gap QCLI-6 already closed | Done |
| [QCLI-9](../../backlog/tasks/qcli-9%20-%20Re-pin-QCLI-2.10s-playbook-in-the-register-after-QCLI-8s-merge-invalidated-its-commit-pin.md) | Re-pin QCLI-2.10's playbook in the register after QCLI-8's merge invalidated its commit-pin | Done |
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
