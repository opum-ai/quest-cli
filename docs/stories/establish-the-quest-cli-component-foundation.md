---
type: Story
title: Establish the quest-cli component foundation
tags:
  - quest
  - cli
  - repository
  - foundation
summary: Define quest-cli ownership, clean-room constraints, and repository readiness without adding product implementation.
timestamp: 2026-08-01T17:11:23.638Z
status: done
tasks:
  - qcli-1
---

# Establish the quest-cli component foundation

## Goal

Establish `quest-cli` as the clean component home for the preferred npm package
`quest` and executable `quest`, without prematurely adding product source.
Map candidate inputs from the former `opum-cli` campaign through an explicit
migration ledger and create a context-free QCLI pickup path. QCLI-2.1, not this
completed foundation Story, decides which dated source slices are admitted.

## Acceptance criteria

- Repository, package, executable, documentation, and task ownership are
  explicit and do not overlap `quest-doc`, `quest-web`, `lore-doc`, or
  `opum-doc`.
- Every unfinished OCLI research item has a QCLI successor, while the old task
  keeps its original ID and status.
- The clean-room boundary and Lore implementation gate are visible in the root
  index, ADR, charter, research specification, and handover.
- Setup adds no product source, generated executable scaffold, runtime
  dependency, or publication claim.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-1](../../.quest/tasks/QCLI-1.json) | Establish the quest-cli component foundation | Done |
<!-- lore:tasks:end -->

## Notes

Read [Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md),
the [component charter](../reference/quest-cli-component-charter.md),
[migration ledger](../reference/former-ocli-to-qcli-migration-ledger.md), and
[research handover](../runbooks/quest-cli-research-handover.md).
