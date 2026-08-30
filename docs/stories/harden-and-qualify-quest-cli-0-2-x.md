---
type: Story
title: Harden and qualify Quest CLI 0.2.x
tags:
  - quest
  - cli
  - parity
  - qualification
  - release
summary: Complete Quest parity, resolve 0.2.x qualification defects, and establish release-ready evidence without rewriting the 0.1.0 delivery record.
timestamp: 2026-08-17T16:25:23.594Z
status: in-progress
tasks:
  - qcli-97
  - qcli-97.1
  - qcli-97.2
  - qcli-97.3
  - qcli-97.4
  - qcli-97.5
  - qcli-97.6
  - qcli-97.7
  - qcli-98
  - qcli-99
  - qcli-100
  - qcli-101
  - qcli-102
  - qcli-103
  - qcli-104
  - qcli-105
  - qcli-106
  - qcli-107
  - qcli-108
  - qcli-109
  - qcli-110
  - qcli-111
  - qcli-112
  - qcli-113
  - qcli-114
---

# Harden and qualify Quest CLI 0.2.x

## Goal

Carry the parity implementation first shipped as the 0.2.0 candidate through
correctness hardening and release qualification. Preserve the completed 0.1.0
Story as historical delivery truth while this Story owns the QCLI-97 parity
campaign, the independent 0.2.0 qualification findings, and any 0.2.x repair
candidate needed to close them.

## Acceptance criteria

- The QCLI-97 parity campaign is complete, including the supported Lore adapter
  and the final clean-install qualification surface.
- Every QCLI-98 through QCLI-107 qualification finding is fixed and verified,
  or remains explicitly open with its owning task and release impact visible.
- Repository type, lint, format, architecture, test, and package gates pass in
  the same pooled-worktree environment used for parallel work.
- Release evidence identifies the exact 0.2.x source, root package, native
  artifacts, checksums, and clean-install results.
- Registry publication remains a separate owner-authorized action; a local
  release candidate is never described as publicly available.

## Release record — 0.3.0, 2026-08-30

This Story's release acceptance criteria are met. `@opum-ai/quest` 0.3.0 is published to npm
through OIDC trusted publishing, qualified from a registry install against the published
`@opum-ai/lore` 0.3.5: 403 rows, 403 pass, 0 fail.

Release evidence identifies the exact source and artifacts, as the criteria require, and does so
in a form a consumer can re-derive rather than a claim it must accept: a native-execution receipt
naming the source commit, CI run and per-platform executable digests, with an explicit
`notClaimed` list; a digest-pinned candidate bundle carrying an `artifactProvenance` field; and a
downstream corroboration row comparing bundle, receipt and published tarballs, each digest
recomputed from bytes. The chain `committed == bundled == attested == installed == published` holds
with every link recomputed.

Publication remained a separate owner-authorized action throughout. No candidate was described as
available before it was.

### What the Story does not yet close

QCLI-97.5 retains three open criteria — the owner-approved adapter contract, explicit workspace
selection, and the managed-region separation — and QCLI-97.11 is unfinished. The 0.3.0
qualification closes AC3 of that task only: real cross-product conformance against supported
published releases of both products.

Nothing in this record is soak. It measures one host at one moment.

## Tasks

<!-- lore:tasks:begin -->
| Task | Title | Status |
|---|---|---|
| [QCLI-97](../../backlog/tasks/qcli-97%20-%20Restore-Quest-parity-project-bootstrap-and-Lore-Codex-integration.md) | Restore Quest parity, project bootstrap, and Lore/Codex integration | To Do |
| [QCLI-97.1](../../backlog/tasks/qcli-97.1%20-%20Audit-Backlog-parity-and-Lore-Codex-onboarding-gaps.md) | Audit Backlog parity and Lore/Codex onboarding gaps | Done |
| [QCLI-97.2](../../backlog/tasks/qcli-97.2%20-%20Implement-Quest-project-bootstrap-discovery-and-Codex-instructions.md) | Implement Quest project bootstrap, discovery, and Codex instructions | Done |
| [QCLI-97.3](../../backlog/tasks/qcli-97.3%20-%20Restore-Quest-planning-and-operations-parity-commands.md) | Restore Quest planning and operations parity commands | Done |
| [QCLI-97.4](../../backlog/tasks/qcli-97.4%20-%20Restore-Quest-task-lifecycle-and-draft-parity.md) | Restore Quest task lifecycle and draft parity | Done |
| [QCLI-97.5](../../backlog/tasks/qcli-97.5%20-%20Establish-and-qualify-the-Lore-CLI-Quest-tracker-adapter.md) | Establish and qualify the Lore CLI Quest tracker adapter | In Progress |
| [QCLI-97.6](../../backlog/tasks/qcli-97.6%20-%20Qualify-and-release-the-Quest-parity-surface.md) | Qualify and release the Quest parity surface | Done |
| [QCLI-97.7](../../backlog/tasks/qcli-97.7%20-%20Restore-the-architecture-layer-gate-after-parity-composition-wiring.md) | Restore the architecture layer gate after parity composition wiring | Done |
| [QCLI-98](../../backlog/tasks/qcli-98%20-%20Render-human-output-for-plain-and-pretty-modes-instead-of-the-envelope-kind.md) | Render human output for plain and pretty modes instead of the envelope kind | Done |
| [QCLI-99](../../backlog/tasks/qcli-99%20-%20Declare-the-reserved-principal-field-on-success-envelopes.md) | Declare the reserved principal field on success envelopes | Done |
| [QCLI-100](../../backlog/tasks/qcli-100%20-%20Stop-consuming-json-and-plain-as-help-targets-in-the-help-spelling.md) | Stop consuming --json and --plain as help targets in the 'help' spelling | Done |
| [QCLI-101](../../backlog/tasks/qcli-101%20-%20Flag-parser-silently-swallows-mode-flags-and-silently-drops-duplicated-filters.md) | Flag parser silently swallows mode flags and silently drops duplicated filters | Done |
| [QCLI-102](../../backlog/tasks/qcli-102%20-%20Manifest-advertises-a-version-command-that-is-not-invocable-and-h-is-unsupported.md) | Manifest advertises a 'version' command that is not invocable, and -h is unsupported | Done |
| [QCLI-103](../../backlog/tasks/qcli-103%20-%20Milestone-and-decision-mutations-return-no-record-and-one-kind-covers-both-lists-and-acks.md) | Milestone and decision mutations return no record, and one kind covers both lists and acks | Done |
| [QCLI-104](../../backlog/tasks/qcli-104%20-%20milestone-edit-task-silently-replaces-the-whole-task-reference-set.md) | milestone edit --task silently replaces the whole task reference set | Done |
| [QCLI-105](../../backlog/tasks/qcli-105%20-%20Record-commands-resolve-the-store-from-cwd-so-a-subdirectory-silently-forks-the-tracker.md) | Record commands resolve the store from cwd, so a subdirectory silently forks the tracker | Done |
| [QCLI-106](../../backlog/tasks/qcli-106%20-%20agents-check-exits-0-when-the-managed-block-is-missing-so-CI-cannot-gate-on-it.md) | agents --check exits 0 when the managed block is missing, so CI cannot gate on it | Done |
| [QCLI-107](../../backlog/tasks/qcli-107%20-%20Error-classification-contention-leaks-dependency_target_ambiguous-and-EACCES-maps-to-validation-not-denied.md) | Error classification: contention leaks dependency_target_ambiguous, and EACCES maps to validation not denied | Done |
| [QCLI-108](../../backlog/tasks/qcli-108%20-%20Keep-repository-checks-from-traversing-pooled-Treehouse-worktrees.md) | Keep repository checks from traversing pooled Treehouse worktrees | Done |
| [QCLI-109](../../backlog/tasks/qcli-109%20-%20No-way-to-pass-a-flag-value-that-begins-with-two-dashes.md) | No way to pass a flag value that begins with two dashes | Done |
| [QCLI-110](../../backlog/tasks/qcli-110%20-%20Output-mode-flags-are-only-recognised-after-the-command-unlike-lore.md) | Output mode flags are only recognised after the command, unlike lore | Done |
| [QCLI-111](../../backlog/tasks/qcli-111%20-%20Diagnose-and-restore-required-Windows-ARM64-SQLite-projection-qualification.md) | Diagnose and restore required Windows ARM64 SQLite projection qualification | Done |
| [QCLI-112](../../backlog/tasks/qcli-112%20-%20Make-six-target-Bun-artifact-delivery-safe-in-Treehouse-worktrees.md) | Make six-target Bun artifact delivery safe in Treehouse worktrees | Done |
| [QCLI-113](../../backlog/tasks/qcli-113%20-%20Settle-FMC-worker-ledger-and-delivery.md) | Settle FMC worker ledger and delivery | Done |
| [QCLI-114](../../backlog/tasks/qcli-114%20-%20Reconcile-completed-0.2.x-delivery-records-into-Lore-ownership.md) | Reconcile completed 0.2.x delivery records into Lore ownership | Done |
<!-- lore:tasks:end -->

## Notes

QCLI-105 is the first completed repair in this Story because it was the only
qualification defect that silently returned wrong data and forked persistent
state. QCLI-97.7 and QCLI-108 restore the repository gates needed before final
qualification can be trusted.
