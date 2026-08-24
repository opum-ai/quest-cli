---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: opum-agent shared skill source
tags:
  - opum-agent
  - skills
  - provenance
  - control-plane
summary: Immutable record of the exact opum-agent shared skill source path adopted by the quest-cli control plane (ODOC-71.8).
timestamp: 2026-08-24T14:15:08.384Z
---

# opum-agent shared skill source

This repository adopts the following immutable marker as the canonical opum-agent
shared skill source. The marked path is the authority for agent-facing shared skill
procedures consumed by this repository's control plane; local copies must never
shadow it.

## Marker

```text
opum-agent shared skill source: /Volumes/external/.opum-worktrees/opum-agent-fb33aefbfb36/64/opum-agent/tooling/codex-skills
```

Adopted by [QCLI-97.5.1](../../backlog/tasks/qcli-97.5.1%20-%20Adopt-opum-agent-shared-skill-source-and-deliver-ODOC-71.8-read-only-Quest-task-binding-adapter.md)
under FMC correlation `1465f683c256452a84c18a7def45f817` (ODOC-71.8 policy-adoption).

## Details

The marker is recorded verbatim and is not expected to change with routine edits.
A new source path requires a superseding record rather than an in-place rewrite of
this marker.
