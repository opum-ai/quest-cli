---
id: QCLI-2.5
title: Research Backlog migration fidelity through public contracts
status: Done
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 20:16'
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
- [x] #1 The inventory covers active, completed, archived, draft, hierarchy, dependencies, milestones, lifecycle metadata, plans, criteria, notes, comments, references, timestamps, and final summaries
- [x] #2 Every field maps to a public read contract, owner-supplied fixture, deliberate transformation, or explicit unsupported gap
- [x] #3 The contract defines deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, and rollback evidence
- [x] #4 The full backlog CLI surface at the pinned revision is enumerated exhaustively — every command, subcommand, flag, and option reachable from `backlog --help` and from each command's own help — with a stated method proving nothing was omitted
- [x] #5 Every enumerated command is exercised end to end against a throwaway scratch repository, with observed output shape, exit code, and on-disk effect recorded as evidence; commands that could not be safely exercised are listed with the reason
- [x] #6 The pinned research revision is recorded as backlog.md v1.49.3, and the report states that Backlog implementation source and internal tests were not inspected
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-backlog-migration-fidelity-contract.md (lore-scaffolded via 'lore new reference'): a fidelity contract and gaps report, not an importer, per the description's own framing. Pinned research revision backlog.md v1.49.3, confirmed as the locally installed build via 'backlog --version' re-run live 2026-08-04 (matches the register's own pin). No Backlog.md implementation source or internal test was read, cited, or opened at any point; the quarantined local clone at /Volumes/external/repos/Backlog.md was never opened.

AC4 (exhaustive CLI enumeration): recursive '--help' traversal from 'backlog --help''s root Commands: list, terminating at nodes with no further Commands: section, confirmed a leaf by actually running --help on all 31 subcommand leaves and observing no third level anywhere. Method and full count (18 root entries, 9 groups, 31 subcommand leaves = 49 distinct invocable nodes) stated explicitly in the document's 'Method' section, with the full flag list for every node captured verbatim from live --help output.

AC5 (exhaustive exercise): all 49 nodes exercised end to end against two throwaway scratch repos created solely for this task (/tmp/qcli-2.5-scratch/repo, default init config; /tmp/qcli-2.5-scratch/repo2, --config-location root --backlog-dir .backlog --zero-padded-ids 4 --task-prefix QS), both outside this worktree, neither committed anywhere, and never the same path as this worktree's own backlog/ or the quarantined Backlog.md clone. Included: full task/draft/milestone/doc/decision/config CRUD and lifecycle transitions; a manufactured real duplicate-ID collision exercised through doctor's full dry-run -> --fix (no --yes, refused non-interactively) -> --fix --yes repair cycle; mcp start driven over a FIFO-backed stdin to capture a real JSON-RPC initialize response; browser backgrounded and probed over HTTP with curl, then killed; completion install run against a fake HOME to avoid touching real shell rc files. cleanup and agents --update-instructions have no non-interactive flags at all (confirmed via their own --help) — both were exercised (exit 0, no mutation observed under non-interactive stdin) but their move/write step could not be driven to completion without a real TTY; recorded in the document as exercised-but-incomplete with that reason, not as unexercised.

AC1/AC2: inventory table covers active/completed/archived/draft/hierarchy/dependencies/milestones/lifecycle metadata/plans/criteria/notes/comments/references/timestamps/final summaries verbatim per the AC, plus documents and decisions noted as two further record types beyond the named list. Field-by-field table classifies every field as public read contract / owner-supplied fixture / deliberate transformation / explicit unsupported gap; two explicit unsupported gaps recorded: the cross-branch task-state overlay (init's --check-branches/--include-remote/--branch-days, config's checkActiveBranches/activeBranchDays, and live 'Fetching remote branches...'/'Applying latest task states from branch scans...' output on overview/board/task list, real and active but its reconciliation algorithm is not derivable from any admissible source without opening source), and milestone completion percentage as a stored field (it is derived, not stored).

AC3: the six required contract properties (deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, rollback evidence) each written as a grounded design commitment citing a specific Execution-evidence observation, not an implementation.

13 undocumented/surprising findings recorded, most load-bearing: (1) a real, unmanufactured active/archive-boundary TASK-ID collision produced by ordinary archive-then-recreate usage, invisible to 'doctor' (which scopes itself explicitly to 'active or completed tasks') and to 'task view' (which silently resolves to the active file only, no warning); (2) 'doctor --fix' does not participate in the autoCommit convention ordinary task create/edit calls follow in the same session, confirmed via 'git status' showing a deleted-unstaged entry for the renamed-away path immediately after a successful --fix --yes; (3) re-running 'backlog init' against an already-initialized project silently overwrites project_name despite its own 'Current configuration will be preserved where not specified' message; (4) not-found exit codes are inconsistent across command families (task/milestone families exit 1, draft/doc families exit 0 on the same style of not-found message); (5) 'decision' is create-only through the CLI, no list/view/update/edit command exists anywhere in the 49-node surface.

Verification commands and outcomes:
- 'backlog --version' -> 1.49.3 (re-confirmed against the pinned revision).
- 'lore validate docs/reference/quest-cli-backlog-migration-fidelity-contract.md --plain' -> 'ok ...; 1 file, 0 errors, 0 warnings, 0 skipped'.
- 'lore check --strict --plain' (pre-sync) -> exit 6, 2 errors (expected status-drift/managed-block-drift from marking this task In Progress, per the campaign's sync-once rule).
- 'lore sync --plain' -> 'updated docs/log.md' / 'updated docs/reference/index.md' / 'updated docs/stories/prepare-quests-clean-room-research-foundation.md' / 'committed backlog/: 1 file' / '3 files changed'.
- 'lore check --strict --plain' (post-sync) -> '22 files, 0 errors, 0 warnings', exit 0.
- 'lore validate --strict --plain' (post-sync) -> '22 files, 0 errors, 0 warnings, 6 skipped', exit 0.
- 'lore orphans --plain' -> '0 orphan tasks, 0 dangling links', exit 0.
- 'git status --porcelain=v1 --untracked-files=all' confirmed only the new document plus lore-regenerated docs/log.md, docs/reference/index.md, and the Story's managed block are dirty; no sibling-owned file (source register, migration ledger, QCLI-2.7's or QCLI-2.14's deliverables, the research-program Spec) was touched.

Out-of-scope finding for the orchestrator, not acted on here: the browser command exposes an undocumented /api/tasks HTTP JSON endpoint whose field shapes diverge from the CLI's own --json contract (assignee vs assignees, an added rawContent key not present in any CLI JSON envelope). Recorded in the document's Findings #13 as a discovered fact only, explicitly not treated as citable public contract since it falls outside the register's 'published documentation / --help / --plain/--json output' admissibility list — flagging here in case a later task (e.g. QCLI-2.8 synthesis) wants to decide whether that boundary should be revisited.

Review fix (2026-08-04): independent review returned request_changes with one blocking finding (B1) — 'draft create' was enumerated in the AC4 surface table but had no AC5 execution row; the DRAFT-1 referenced elsewhere in the document was produced by 'task create ... --draft', a different node, and 'draft create' itself had never actually been run. This falsified the document's 'every one of the 49 nodes ... independently exercised' and 'all 49 nodes exercised end to end' claims for as long as the gap stood.

Fix: ran 'draft create' for real, twice, against a new third throwaway scratch repo (/tmp/qcli-2.5-fix-scratch/repo, outside this worktree, never committed, not preserved). 'draft create "QCLI-2.5 fix probe" -d "Fix-pass probe for the AC5 draft-create gap" -a @fix-worker -l "clean-room,fix-pass"' -> exit 0, 'Created draft DRAFT-1', file 'backlog/drafts/draft-1 - QCLI-2.5-fix-probe.md' with frontmatter id/title/status:Draft/assignee/created_date/labels/dependencies and a single Description managed block. Second run with '-s "Draft"' confirmed the status flag is accepted but produces the same Draft status a bare draft create already writes. Added this as a new Execution-evidence row in docs/reference/quest-cli-backlog-migration-fidelity-contract.md's Draft/milestone/document/decision table, disambiguated it from the pre-existing DRAFT-1 (from task create --draft) in the adjacent row, updated the document's intro/Notes sections from 'two' to 'three' scratch repos, and added a dated Notes paragraph recording the review finding and fix so the 'all 49 nodes exercised end to end' claim is accurate now and the document is explicit that it was not accurate between original delivery and this correction.

Verification: 'lore sync --plain' -> 'updated docs/log.md' / '1 file changed'. 'lore check --strict --plain' -> '22 files, 0 errors, 0 warnings', exit 0. 'lore validate --strict --plain' -> '22 files, 0 errors, 0 warnings, 6 skipped', exit 0. 'lore orphans --plain' -> '0 orphan tasks, 0 dangling links', exit 0. 'git status --porcelain' confirms only docs/log.md and the contract document changed; no other file touched.

Wave-4 integration review follow-up fix (2026-08-04, branch fix/qcli-2.5-followup-f5-f6): fixed two findings in this document's own text, both stale-prose defects, no new research or evidence gathered. F5 -- line ~194 ('Execution evidence (AC5)' intro) still said 'one of the two scratch repositories' after the B1 fix-pass added a third scratch repo (/tmp/qcli-2.5-fix-scratch/repo); changed 'two' to 'three' so it matches the intro's and Notes' own 'three throwaway scratch repositories' language. F6 -- the 'produced only from' enumeration (lines ~29-33) named published documentation, --help output, and --plain/--json output, and on-disk artifacts, but the Execution evidence section also substantively uses mcp start's stdio JSON-RPC initialize response (server self-reported version, EOF-shutdown behavior) and curl HTTP probes of the browser command's local server -- neither was named in the admissibility enumeration. Amended the enumeration to add 'process-level responses from running that same installed binary ... specifically mcp start's stdio JSON-RPC responses ... and curl probes of the browser command's local HTTP server', explicitly carrying forward the existing browser Execution-evidence row's own disclaimer that the HTTP API is not treated as a citable public contract, while noting mcp start's response is used substantively. Verified: lore check --strict --plain -> '23 files, 0 errors, 0 warnings', exit 0. lore validate --strict --plain -> '23 files, 0 errors, 0 warnings, 6 skipped', exit 0. lore orphans --plain -> '0 orphan tasks, 0 dangling links', exit 0. git status confirms only docs/reference/quest-cli-backlog-migration-fidelity-contract.md changed.

Settlement (orchestrator, wave 4): Merged as PR #12, squash commit 407ea61. Reviewer verdict on 2nd pass: approve — all 6 ACs independently confirmed, including reproduction of ~20 distinct claims against fresh scratch repos and script-verified exhaustive CLI-surface enumeration (49 nodes = 18 root + 31 leaves). Clean-room compliance (no source/test inspection, no quarantined-clone access, scratch-repo-only exercise, v1.49.3 pin) explicitly confirmed. Gates: lore check --strict 22 files 0/0; lore validate --strict 22 files 0/0 6 skipped; lore orphans 0/0. Wave-4 integration review found 2 non-blocking documentation-accuracy findings (F5: stale scratch-repo count; F6: evidence-source enumeration gap) — both fixed and merged separately as PR #16 (squash commit 418c5eb), reviewed and approved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered docs/reference/quest-cli-backlog-migration-fidelity-contract.md: an exhaustive Backlog.md migration fidelity contract and gaps report, produced entirely from public-contract observation (help text, --plain/--json output, on-disk artifacts from 3 throwaway scratch repos) at pinned revision v1.49.3, with zero implementation-source or internal-test inspection. Covers the full 15-category inventory, a 20-row field disposition table, all 6 required contract properties, exhaustive 49-node CLI surface enumeration with a stated completeness method, end-to-end execution evidence for every node, and 13 findings including a real (unmanufactured) active/archive ID-collision hazard. A wave-4 integration-review follow-up (PR #16) corrected a stale scratch-repo count and completed the evidence-source enumeration.
<!-- SECTION:FINAL_SUMMARY:END -->
