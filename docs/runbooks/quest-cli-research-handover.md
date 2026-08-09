---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Quest CLI research handover
tags:
  - quest
  - cli
  - handover
  - clean-room
  - lore
summary: Provides the safe pickup cursor for QCLI research while product implementation remains gated on Lore release evidence.
timestamp: 2026-08-01T17:11:23.923Z
---

# Quest CLI research handover

## Purpose

Give a new worker a safe, context-free cursor for QCLI research while Quest
product implementation remains blocked on Lore release evidence.

## Prerequisites

- Worktree: `/Volumes/external/repos/quest-cli`; remote
  `git@github.com:opum-ai/quest-cli.git`; Backlog prefix QCLI.
- Product hub: `/Volumes/external/repos/quest-doc`.
- Former OCLI provenance and Opum SaaS hub:
  `/Volumes/external/repos/opum-doc`.
- Lore gate owners: `/Volumes/external/repos/lore-doc` and live
  `/Volumes/external/repos/lore-cli`.
- Canonical Lore policy:
  [Quest integration and Lore release gate](https://github.com/opum-ai/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md).
- Read repository instructions; run `backlog instructions overview` and the
  lifecycle-specific guide, then `lore instructions`.
- Preserve unexplained worktree changes and never normalize state through a
  reset, cleanup, or history rewrite.

## Steps

1. Read the component ADR, charter, migration ledger, and research program.
2. Inspect QCLI-1 and QCLI-2 through Backlog. If foundation setup is complete,
   the first future research task is QCLI-2.1; activate only a task explicitly
   assigned by the user or campaign coordinator.
3. Re-check the exact old OCLI source revision and permitted-use class before
   citing it. Treat the old task as provenance, never as a parallel worker.
4. Author only the research output named by the active task. Do not add product
   source, runtime dependencies, generated scaffolding, or package metadata
   that implies a release.
5. Stop when an answer depends on unfinished Lore runtime, LadybugDB,
   packaging, supported-target, or release evidence. Record the named blocker
   in QCLI-2.7 instead of guessing.
6. Verify the owning task's evidence and run strict Lore and diff gates before
   finalization.

### Activation check for a later implementation session

Implementation remains prohibited until `quest-doc`'s canonical handover and
the current Lore-owned release gate both pass from live owner evidence. Follow
the linked Lore Spec and its owner-held evidence; do not reconstruct or copy
the gate here. A local build, a dated snapshot, or a consumer summary is not
proof that the gate passed.

### Ready-to-paste prompt

```text
Continue Quest CLI research in /Volumes/external/repos/quest-cli. Read the repo
instructions, run backlog instructions overview and lore instructions, then
read the component ADR, charter, OCLI-to-QCLI ledger, research program, and
handover. Inspect QCLI-2 and select only the next eligible assigned research
task; QCLI-2.1 is the first dependency when the foundation is complete.

Quest owns execution and its command is quest. quest-doc owns product-wide
decisions; opum-doc owns future SaaS policy and former OCLI provenance. This is
research-only until the full Lore release gate passes. Do not add product
source, runtime dependencies, package scaffolding, or publication; do not
inspect Backlog.md source/tests or quarantined artifacts. Preserve old OCLI IDs
and cite exact admitted evidence.
```

## Rollback

Before implementation, rollback is to leave QCLI delivery tasks inactive and
revert only focused documentation changes. Preserve all authored research and
old OCLI history. After implementation eventually starts, revert focused
component commits and rebuild only derived state; never delete user task data,
rewrite history, or switch two task systems into concurrent writers.
