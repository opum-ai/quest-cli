---
id: QCLI-2.5
title: Research Backlog migration fidelity through public contracts
status: In Progress
assignee: []
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 17:02'
labels:
  - campaign
  - research
  - migration
  - backlog
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:migration'
  - wave-4
  - in-review
dependencies:
  - QCLI-2.1
  - QCLI-2.4
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Determine which user-owned Backlog records Quest must preserve and what documented public interfaces can export without inspecting Backlog implementation source or internal tests. Produce a fidelity contract and gaps report, not an importer.

Owner ruling, 2026-08-04 — strict clean-room, reaffirmed. Backlog.md implementation source and internal tests are EXCLUDED: do not read, cite, or port them. Permitted evidence is published documentation, `backlog --help` and each command's own help, `--plain` and `--json` output, and on-disk artifacts produced by running the tool against a throwaway scratch repository. Pinned research revision: backlog.md v1.49.3 (current release and the locally installed build; the earlier v1.49.1 figure is superseded, and a newer release is a reclassification trigger requiring recheck before any contract freezes).

Owner direction, 2026-08-04 — coverage must be exhaustive, not representative. Enumerate the entire CLI surface at the pinned revision and exercise every command end to end, recording observed behavior rather than inferring it from help text alone. Undocumented or surprising behavior is a finding to record, never a reason to open the source.

Any Quest-wide vocabulary, architecture, or roadmap consequence is a proposal to quest-doc, not normative here.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The inventory covers active, completed, archived, draft, hierarchy, dependencies, milestones, lifecycle metadata, plans, criteria, notes, comments, references, timestamps, and final summaries
- [ ] #2 Every field maps to a public read contract, owner-supplied fixture, deliberate transformation, or explicit unsupported gap
- [ ] #3 The contract defines deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, and rollback evidence
- [ ] #4 The full backlog CLI surface at the pinned revision is enumerated exhaustively — every command, subcommand, flag, and option reachable from `backlog --help` and from each command's own help — with a stated method proving nothing was omitted
- [ ] #5 Every enumerated command is exercised end to end against a throwaway scratch repository, with observed output shape, exit code, and on-disk effect recorded as evidence; commands that could not be safely exercised are listed with the reason
- [ ] #6 The pinned research revision is recorded as backlog.md v1.49.3, and the report states that Backlog implementation source and internal tests were not inspected
<!-- AC:END -->
