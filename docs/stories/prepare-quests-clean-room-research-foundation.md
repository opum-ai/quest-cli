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
  - qcli-23
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
| QCLI-2 | Prepare Quest's clean-room research foundation before implementation | Done |
| QCLI-175 | Revalidate Quest research provenance and the migration boundary | Done |
| QCLI-181 | Reconcile legacy Opum requirements into Quest CLI candidates | Done |
| QCLI-182 | Turn prototype failures into Quest black-box scenarios | Done |
| QCLI-183 | Define Quest CLI actors, workflows, and domain-language candidates | Done |
| QCLI-184 | Research Backlog migration fidelity through public contracts | Done |
| QCLI-185 | Model Quest Git, filesystem, and concurrency threats | Done |
| QCLI-186 | Track Lore dependencies and Quest activation evidence | Done |
| QCLI-187 | Synthesize Quest CLI research into activation-ready component contracts | Done |
| QCLI-188 | Resolve the `quest` npm package allocation and provenance gate | Done |
| QCLI-176 | Author the Backlog-to-Quest adoption and migration playbook | Done |
| QCLI-177 | Correct wave-2 cross-task staleness in the three merged deliverables | Done |
| QCLI-178 | Close the research source register's admission-authority coherence gaps | Done |
| QCLI-179 | Adopt a moving-vs-immutable reference convention in the research program Spec | Done |
| QCLI-180 | Re-home the runtime, native-packaging, and supported-platform question | Done |
| QCLI-6 | Close remaining research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8, 2.9, 2.10 not yet enumerated in 'Prior QCLI research records') | Done |
| QCLI-7 | Enumerate the campaign Story in the research-source-register's 'Prior QCLI research records' slice | Done |
| QCLI-8 | Reconcile QCLI-2.10's playbook against the QCLI-2.5 enumeration gap QCLI-6 already closed | Done |
| QCLI-9 | Re-pin QCLI-2.10's playbook in the register after QCLI-8's merge invalidated its commit-pin | Done |
| QCLI-23 | Re-verify QCLI-2.7 drift table against lore-cli v0.1.1 and refresh dependent documents | Done |
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
[Lore-owned integration and release gate](https://github.com/opum-ai/opum-doc/tree/dev/docs/lore)
controls later implementation activation.
