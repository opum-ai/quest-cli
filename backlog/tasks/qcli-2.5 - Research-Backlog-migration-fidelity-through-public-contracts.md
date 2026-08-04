---
id: QCLI-2.5
title: Research Backlog migration fidelity through public contracts
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 16:53'
labels:
  - campaign
  - research
  - migration
  - backlog
  - clean-room
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:migration'
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

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the register, migration ledger, component charter, research program Spec, and prior sibling docs (QCLI-2.4, QCLI-2.7, QCLI-2.2) for citation discipline and document-format conventions.
2. Set up a throwaway scratch Backlog.md repository outside this worktree (/tmp/qcli-2.5-scratch), never touching backlog/ in this worktree or the quarantined local Backlog.md clone.
3. Enumerate the full CLI surface exhaustively via backlog --help, then backlog <command> --help for every listed command, then backlog <command> <subcommand> --help for every listed subcommand, recording the method (recursive --help traversal terminating at leaf commands with no further Commands: section) as the proof nothing was omitted.
4. Exercise every enumerated command end to end against the scratch repo (init with default and alternate config-location/backlog-dir/zero-padded-ids/task-prefix options; full task/draft/milestone/doc/decision/config/search/board CRUD and lifecycle transitions; doctor's dry-run/--fix/--fix --yes repair cycle by inducing a real duplicate ID; browser and mcp start as backgrounded processes probed over HTTP/stdio JSON-RPC; completion install against a fake HOME; cleanup and agents --update-instructions under non-interactive stdin), recording exit code, output shape, and on-disk effect for each, and naming any command that could not be safely exercised with the reason.
5. Author the fidelity contract document: AC1 inventory table, AC2 per-field disposition table (public read contract / owner-supplied fixture / deliberate transformation / explicit unsupported gap), AC3 contract sections (deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, rollback evidence) grounded in the observed evidence, AC4 exhaustive command/flag enumeration with the traversal-method proof, AC5 execution evidence log, AC6 pinned-revision and source-exclusion statement, plus a findings/gaps section for undocumented or surprising behavior discovered while exercising the CLI (ID reuse across the archive boundary, doctor's active/completed-only duplicate scope, init's silent project-name overwrite on reinit, automatic plain-text fallback on non-TTY stdout, decision's write-only CLI surface, cross-branch task-state overlay, cleanup/agents having no non-interactive flags).
6. Run lore sync once as the final content step, then lore check --strict, lore validate --strict, and lore orphans, fixing only drift lore itself reports.
7. Record verification commands and outcomes via --append-notes; flag anything needing owner attention via --comment.
8. Commit in small logical commits with Refs: QCLI-2.5 trailers and push feat/qcli-2.5-migration-fidelity.
<!-- SECTION:PLAN:END -->
