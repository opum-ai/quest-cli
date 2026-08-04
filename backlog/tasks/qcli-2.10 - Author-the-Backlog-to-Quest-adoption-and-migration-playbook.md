---
id: QCLI-2.10
title: Author the Backlog-to-Quest adoption and migration playbook
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-04 06:23'
updated_date: '2026-08-04 22:19'
labels:
  - campaign
  - research
  - migration
  - backlog
  - adoption
  - clean-room
  - no-implementation
  - 'cluster:migration'
dependencies:
  - QCLI-2.5
documentation:
  - docs/reference/quest-cli-component-charter.md
  - docs/reference/former-ocli-to-qcli-migration-ledger.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Turn the QCLI-2.5 fidelity contract into an operational plan an existing Backlog.md project can actually follow to adopt Quest, without building an importer.

Scope: the human/agent procedure and its evidence requirements — preconditions, cutover sequence, the coexistence window while both tools can see the same repository, dry-run expectations, and reversible rollback. Tool-neutral: describe what must be true and what must be proven at each step, not which code performs it.

Clean-room constraint (owner ruling, 2026-08-04): research uses only published documentation, `backlog --help` / per-command help, `--plain` and `--json` output, and on-disk artifacts produced by running the tool. Backlog.md implementation source and internal tests are EXCLUDED and must not be inspected, cited, or ported. Pinned research revision: backlog.md v1.49.3.

Any Quest-wide vocabulary, architecture, or roadmap consequence is a proposal to quest-doc, not normative here. This task authorizes no product source, runtime dependency, executable scaffolding, package publication, or release.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A per-project cutover sequence states preconditions, ordered steps, the observable success signal for each step, and the abort condition that stops the migration
- [ ] #2 The coexistence window is specified: which tool is the single writer at each phase, how a reader detects drift, and what happens when both have written
- [ ] #3 Dry-run and rollback are defined with the evidence each must produce, such that a project can prove it returned to its pre-migration state
- [ ] #4 The playbook covers active, completed, archived, and draft records plus parent/subtask hierarchy, dependencies, and milestones, and names any record class it deliberately does not carry over
- [ ] #5 No importer, script, or executable scaffolding is produced; the deliverable is a documented procedure and its evidence contract
- [ ] #6 Every Backlog-side step cites a public interface (documentation, command help, --plain/--json output, or an on-disk artifact) at the pinned revision; no Backlog implementation source is cited
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-verify pin: `backlog --version` and `npm view backlog.md version` both 1.49.3 (done, live 2026-08-04). Read QCLI-2.5 fidelity contract, migration ledger, component charter (read-only refs) and the research source register's admitted slices (Backlog.md public surface: Allowed; Prior QCLI research records: Allowed).
2. Scaffold a new Reference doc via `lore new reference` at docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md; do not touch the register or migration ledger.
3. Author the playbook body: global preconditions (version pin, config enumeration, same-scope and cross-scope collision scan via `doctor` + on-disk archive walk); a 9-step ordered cutover sequence (freeze/snapshot -> read pass -> collision/gap scan -> dry-run preview -> human consent -> apply(target-only, Backlog untouched) -> coexistence-window open -> drift monitoring -> window close), each step with precondition/action/success-signal/abort-condition; a coexistence-window section naming the single writer per phase, the fingerprint-based drift-detection mechanism (Backlog exposes no lock file per the fidelity contract), and the never-silently-merge disposition procedure for a detected both-written case; dedicated Dry-run and Rollback sections defining the evidence each must produce, citing the fidelity contract's Deterministic dry runs/Rollback evidence/Source immutability sections; a record-coverage table for active/completed/archived/draft/hierarchy/dependencies/milestones/documents/decisions citing the fidelity contract's AC1/AC2 tables; an explicit deliberate-non-carry-over list (Backlog-era git history of backlog/, cross-branch task-state overlay, derived milestone completion percentage, browser's undocumented /api/tasks endpoint, interactive-wizard state). Every Backlog-behavior claim cites a specific `--help`/`--plain`/`--json`/on-disk-artifact observation (fresh or via the fidelity contract), never Backlog source. No importer/script is produced -- commands shown are single verification invocations, not chained automation.
4. Verify: `lore validate --strict docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md`, `lore check --strict`, `lore orphans`; re-check each AC's exact text against the written sections; confirm no edits landed in the register or migration ledger (`git diff --stat` scoped to those two paths is empty).
5. Record notes on the task, commit in small logical commits with `Refs: QCLI-2.10`, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md (Reference), commit 4373a6c.

Sources checked against the register: "Backlog.md public surface" (Allowed)
grounds every Backlog-behavior claim; "Prior QCLI research records" (Allowed)
grounds citing the fidelity contract, component charter, and migration
ledger. lore-cli's Backlog corpus (Contextual) was not read or cited. The
local Backlog.md clone and Backlog.md implementation source were not opened.
Pin re-verified live 2026-08-04: `backlog --version` and `npm view
backlog.md version` both 1.49.3.

AC evidence:
- AC1: "Global preconditions" table (P1-P6) + "The cutover sequence" table
  (9 steps), each row with Precondition/Action/Success signal/Abort
  condition columns.
- AC2: "The coexistence window" section, three named subsections -- Single
  writer per phase, How a reader detects drift (snapshot-fingerprint diff;
  Backlog has no lock file per the fidelity contract), What happens when
  both have written (delta report, per-record migrate-or-discard
  disposition, never silent merge).
- AC3: dedicated "Dry run -- definition and evidence" and "Rollback --
  definition and evidence" sections; rollback evidence explicitly names the
  one thing it cannot recover (coexistence-window-only target-side work)
  rather than silently omitting it.
- AC4: "Record coverage (AC4)" table covers active/completed/archived/draft
  tasks, hierarchy, dependencies, milestones, plus documents and decisions;
  "What this playbook deliberately does not carry over" names
  backlog/'s own Git commit history as the record-class-level exclusion
  (plus the browser /api/tasks endpoint and interactive-wizard state), and
  states explicitly that no current-state record family is dropped
  wholesale.
- AC5: no code fences anywhere in the document (grep-verified); every cited
  command is a single verification invocation of Backlog's own CLI or
  ordinary git, never a chained script; an explicit "This document is not"
  list states the no-importer/no-scaffolding boundary and that
  @opum-ai/quest is unpublished.
- AC6: every substantive Backlog-behavior claim links to a named fidelity-
  contract section/table (each itself grounded in --help/--plain/--json/
  on-disk evidence) or a fresh --help re-run recorded in Notes; no Backlog
  implementation source cited anywhere.

Verification run: `lore validate --strict` on the new file (0 errors, 0
warnings), `lore check --strict` (24 files, 0 errors, 0 warnings), `lore
orphans` (0 orphan tasks, 0 dangling links) -- all after `lore sync`
regenerated docs/log.md and docs/reference/index.md. `git diff --stat` on
the register and migration ledger is empty -- neither was touched, per this
task's scope boundary.

Out-of-scope finding (not acted on, reported to the orchestrator): the
component charter and migration ledger are read-only references for this
task and were not backlinked from the new playbook or vice versa, per the
task's explicit instruction not to edit either file even to add a
backlink. Separately, the owning Story
(docs/stories/prepare-quests-clean-room-research-foundation.md) frontmatter
`tasks:` list still enumerates only qcli-2 through qcli-2.9 and was not
updated to add qcli-2.10 (nor were qcli-2.11-2.14 added by their own tasks)
-- `lore orphans` reports this as clean regardless, since Story<->Task
`tasks:` coupling and "does every Backlog task have some owning artifact"
appear to be different checks, but the Story's own task table is stale
relative to the campaign's actual task roster; left unresolved here since
editing that Story is outside this task's named scope.
<!-- SECTION:NOTES:END -->
