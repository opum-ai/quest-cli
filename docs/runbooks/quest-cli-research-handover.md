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
- Product authority: [consolidated Quest namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/quest).
- Former OCLI provenance and Opum portfolio authority: `opum-doc`.
- Lore gate authority: [consolidated Lore namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/lore).
- Local release evidence remains with the owning `lore-*` component; do not use
  a local clone or a historical handover as a gate result.
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

Implementation may proceed only under the current owner decisions in the
[consolidated Quest namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/quest)
and the [consolidated Lore namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/lore).
Follow those owner-held records; do not reconstruct or copy gate criteria here.
A local build, dated snapshot, or consumer summary is not proof of a gate result.

### Ready-to-paste prompt

```text
Continue Quest CLI research in /Volumes/external/repos/quest-cli. Read the repo
instructions, run backlog instructions overview and lore instructions, then
read the component ADR, charter, OCLI-to-QCLI ledger, research program, and
handover. Inspect QCLI-2 and select only the next eligible assigned research
task; QCLI-2.1 is the first dependency when the foundation is complete.

Quest CLI owns execution and its command is `quest`. The consolidated Quest
namespace owns product-wide decisions; `opum-doc` owns portfolio policy and
former OCLI provenance. Follow the current consolidated Lore authority for any
activation question. Do not add publication or public-install claims without
owner-held release evidence. Preserve old OCLI IDs and cite exact admitted evidence.
```

## Rollback

Before implementation, rollback is to leave QCLI delivery tasks inactive and
revert only focused documentation changes. Preserve all authored research and
old OCLI history. After implementation eventually starts, revert focused
component commits and rebuild only derived state; never delete user task data,
rewrite history, or switch two task systems into concurrent writers.
