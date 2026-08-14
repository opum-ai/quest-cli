---
type: Story
title: Audit Quest CLI documentation authority
tags:
  - audit
  - documentation
  - authority
  - quest
  - provenance
  - no-implementation
summary: Align component authority, OCLI provenance, Lore gate pointers, and navigation without implementing Quest.
timestamp: 2026-08-01T17:54:44.190Z
status: done
tasks:
  - qcli-3
  - qcli-4
  - qcli-5
  - qcli-67
  - qcli-71
  - qcli-66
  - qcli-96
---

# Audit Quest CLI documentation authority

## Goal

Keep `quest-cli` authoritative only for the `quest` package, command, component
contracts, research, migration, tests, and releases. Prove exact OCLI
provenance, route product-wide decisions to the consolidated Quest namespace, and consume Lore's
gate through its owner without adding product implementation.

## Acceptance criteria

- The exact OCLI-to-QCLI ledger covers every OCLI record with one component
  successor or an explicit non-adoption disposition.
- The root index and active research Story link the component ADR, charter,
  current Spec, migration ledger, and context-free handover.
- Dated OCLI inputs are provisional until QCLI-2.1 revalidates them, and no
  task can reactivate the former OCLI campaign.
- Lore gate policy is linked from the consolidated Lore namespace; local records contain only the
  Quest CLI evidence-consumer obligation.
- Strict Lore, task-rollup, agent-bridge, and Git checks pass with no product
  source, dependency, package scaffold, or release claim.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-3](../../backlog/tasks/qcli-3%20-%20Align-Quest-CLI-provenance-and-documentation-authority.md) | Align Quest CLI provenance and documentation authority | Done |
| [QCLI-4](../../backlog/tasks/qcli-4%20-%20Record-supersession-of-OCLI-1-non-adoption-for-the-backlog-handover-skill.md) | Record supersession of OCLI-1 non-adoption for the backlog-handover skill | Done |
| [QCLI-5](../../backlog/tasks/qcli-5%20-%20Record-the-opum-ai-identity-change-across-the-charter-ADR-and-source-register.md) | Record the opum-ai identity change across the charter, ADR, and source register | Done |
| [QCLI-67](../../backlog/tasks/qcli-67%20-%20Classify-and-correct-superseded-salient-data-citations.md) | Classify and correct superseded salient-data citations | Done |
| [QCLI-71](../../backlog/tasks/qcli-71%20-%20Adopt-the-autonomous-documentation-campaign-fast-lane.md) | Adopt the autonomous documentation campaign fast lane | Done |
| [QCLI-66](../../backlog/tasks/qcli-66%20-%20Distinguish-frozen-OCLI-provenance-from-live-ODOC-routing-in-the-migration-ledger.md) | Distinguish frozen OCLI provenance from live ODOC routing in the migration ledger | Done |
| [QCLI-96](../../backlog/tasks/qcli-96%20-%20Make-autonomous-campaigns-loop-until-a-true-pause.md) | Make autonomous campaigns loop until a true pause | Done |
<!-- lore:tasks:end -->

## Notes

The controlling records are
[Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md),
the [component charter](../reference/quest-cli-component-charter.md), the
[research program](../specs/quest-cli-pre-implementation-research-program.md),
the [migration ledger](../reference/former-ocli-to-qcli-migration-ledger.md),
and the [research handover](../runbooks/quest-cli-research-handover.md).
