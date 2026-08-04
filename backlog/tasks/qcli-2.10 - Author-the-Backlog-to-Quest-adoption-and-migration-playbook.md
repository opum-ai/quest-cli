---
id: QCLI-2.10
title: Author the Backlog-to-Quest adoption and migration playbook
status: Done
assignee:
  - '@claude'
created_date: '2026-08-04 06:23'
updated_date: '2026-08-04 23:55'
labels:
  - campaign
  - research
  - migration
  - backlog
  - adoption
  - clean-room
  - no-implementation
  - 'cluster:migration'
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - wave-5
dependencies:
  - QCLI-2.5
documentation:
  - docs/reference/quest-cli-component-charter.md
  - docs/reference/former-ocli-to-qcli-migration-ledger.md
  - docs/stories/prepare-quests-clean-room-research-foundation.md
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
- [x] #1 A per-project cutover sequence states preconditions, ordered steps, the observable success signal for each step, and the abort condition that stops the migration
- [x] #2 The coexistence window is specified: which tool is the single writer at each phase, how a reader detects drift, and what happens when both have written
- [x] #3 Dry-run and rollback are defined with the evidence each must produce, such that a project can prove it returned to its pre-migration state
- [x] #4 The playbook covers active, completed, archived, and draft records plus parent/subtask hierarchy, dependencies, and milestones, and names any record class it deliberately does not carry over
- [x] #5 No importer, script, or executable scaffolding is produced; the deliverable is a documented procedure and its evidence contract
- [x] #6 Every Backlog-side step cites a public interface (documentation, command help, --plain/--json output, or an on-disk artifact) at the pinned revision; no Backlog implementation source is cited
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

Review fix pass (2026-08-04), addressing the prior review's findings:

BLOCKING (fixed): the Notes section previously claimed the register's
"Prior QCLI research records" slice covers citing the fidelity contract
("the latter for citing this repository's own prior QCLI Reference
outputs"). Re-checked against the live register
(quest-cli-research-source-register.md lines 787-926): that slice
enumerates nine specific members (component charter, migration ledger,
research Spec, QCLI-2.2 reconciliation, the register itself, the ADR,
QCLI-2.3, QCLI-2.4, QCLI-2.7) and the fidelity contract is not among them
-- it appears in that slice's text exactly once, only as a *reader* of
QCLI-2.7's document, never as an enumerated member. Fix: added a new
"Sources and classification (AC6 grounding)" table (matching the sibling
deliverables' evidence-table convention: quest-cli-black-box-acceptance-
scenarios.md, quest-cli-git-filesystem-and-concurrency-threat-model.md,
legacy-opum-requirement-reconciliation-for-quest-cli.md) that correctly
states the component charter, migration ledger, and register are Allowed
under "Prior QCLI research records", while the fidelity contract's row is
marked "not yet an enumerated member" with a full caveat quoting the
register's own enumeration and its QCLI-2.12 precedent for exactly this
gap class. Recorded as an out-of-scope finding for the register's owner
(below); not fixed by editing the register, per this task's scope
boundary. Rewrote the old Notes prose to remove the false claim while
keeping its true content (no source/clone/Contextual-corpus opened, fresh
--help spot checks, re-citation discipline).

NON-BLOCKING (fixed): the Documents row of the Record coverage (AC4) table
cited "Findings and Notes" for two claims neither section supports.
Retargeted to the two sections that actually do: the Inventory section's
trailing paragraph (full CRUD except delete) and the Field-by-field
disposition table's Document row (--plain-only, no --json).

NON-BLOCKING (fixed): the Snapshot fingerprint vocabulary entry asserted
"backlog init ... does not initialize its own [repository]" without a
supporting observation -- the fidelity contract's Initialization Execution
evidence ran `git init` before `backlog init` in every case, so nothing
rules out `backlog init` running its own `git init` in an untracked
directory. Reworded to state only what was actually observed (backlog init
populating backlog/ inside an already-git-init'd repo) and explicitly note
the untracked-directory case was not exercised and is not asserted.

NON-BLOCKING (addressed by the same table): added the sources-and-
classification table described above, matching the bundle's established
convention rather than a prose-only Notes paragraph, per the review's
"convention divergence" observation.

Re-verified after edits: `lore validate --strict` on the file (0
errors/warnings), `lore check --strict` (24 files, 0 errors/warnings),
`lore orphans` (0 orphan tasks, 0 dangling links), `lore sync` (updated
docs/log.md only), `git diff --stat` on the register and migration ledger
still empty -- neither touched by this fix pass.

Out-of-scope finding (repeated, now the register's live state confirms
it): the research source register's "Prior QCLI research records" slice
does not yet enumerate docs/reference/quest-cli-backlog-migration-fidelity-
contract.md (QCLI-2.5's output) as a member, despite this document (and
QCLI-2.5's own Notes, which cite the fidelity contract's Backlog-behavior
claims to "Backlog.md public surface" directly rather than to this slice)
relying on it as a principal source. This is the same enumeration-gap
class QCLI-2.12 closed for QCLI-2.2/2.3/2.4/2.7's outputs; the fidelity
contract itself is the visible remaining gap. Belongs to the register's
owner, not to this task.

Wave-level integration-review follow-up (branch fix/qcli-2.8-2.10-integration-review-followup, commits 44e22ac/fca2097): fixed cross-doc coherence issues found between this playbook and QCLI-2.8's synthesis. Reattributed the browser /api/tasks HTTP-endpoint restriction (What this playbook deliberately does not carry over) to QCLI-2.5's own self-imposed enumeration clause rather than the register (the register's actual exclusion is narrower: source-only observation is inadmissible, running the tool is fine); cross-referenced the synthesis's own residual-gap note that already identifies the same self-imposed-restriction pattern for a different evidence class. Replaced 'phase' with 'step' in the 4 places this document used it for cutover-procedure steps (frontmatter summary, AC2 bullet, 'Single writer per step' heading and body), reserving 'Phase' for the synthesis's delivery-graph node numbering. Removed two mistargeted 'below' pointers (Step 4, Step 6 table cells) whose linked sections are in the fidelity contract, not below in this document. Fixed the Lifecycle folder definition, which claimed 'four' record locations for tasks/drafts while enumerating backlog/archive/milestones/ alongside them (not a task or draft location). Added an additive, non-dependency cross-reference from the Scope section to the synthesis's Phase 4 delivery-graph node. Ran lore check --strict / validate --strict / orphans clean after the edits; did not run lore sync (see QCLI-2.8's notes for why).

Settlement (orchestrator, wave 5). Merged as PR #19, squash commit de41389. Reviewer verdict on 2nd pass (after 1 fix cycle within the normal 2-retry cap, fixing a false admissibility claim for the fidelity-contract citation): approve — all 6 ACs independently re-confirmed with named evidence, including live re-verification of the pinned Backlog revision (v1.49.3, both backlog --version and npm view) and 4 --help surfaces corroborating the playbook's flag claims first-hand. Gates: lore check --strict 24 files 0/0; lore validate --strict (file) 0/0; lore orphans 0/0.

A subsequent wave-level integration review found 9 cross-document coherence issues against this deliverable's sibling (QCLI-2.8) and 2 orchestrator-scope items; all 9 narrow issues were fixed and re-reviewed (approved first pass) in a follow-up branch, merged as PR #20, squash commit 8935551 — see that PR and QCLI-2.8's notes for the full finding list. Applied to this document: C1 (reattributed a self-imposed restriction to its actual source instead of the register), C5 (added a cross-reference to QCLI-2.8's delivery graph), C6 (removed "phase" terminology overload, 4 occurrences), S1 (fixed two mistargeted "below" pointers), S4 (fixed the Lifecycle-folder definition's count/enumeration mismatch). One real (not narrow) coherence gap the integration review surfaced — the register's "Prior QCLI research records" slice not enumerating this document's foundation (QCLI-2.5's fidelity contract), QCLI-2.6, QCLI-2.9, QCLI-2.8, or itself — is out of scope for this task (its own boundary excludes editing the register) and is proposed as a follow-up task in the campaign doc, pending owner approval. This task's own notes already disclosed the QCLI-2.5-specific instance of this gap accurately before settlement.

Orchestrator-scope item also found and fixed directly: the owning Story's (prepare-quests-clean-room-research-foundation) frontmatter tasks: list and this task's doc: back-reference label were both missing prior to this settlement (along with QCLI-2.11-2.14) — fixed via lore link, commit 8c3133e.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Authored docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md: a tool-neutral, operational playbook turning QCLI-2.5's Backlog migration fidelity contract into a procedure an existing Backlog.md project can follow to adopt Quest. Covers a 9-step cutover sequence with observable success signals and abort conditions, the coexistence window (single writer per step, drift detection, both-written disposition), dry-run/rollback evidence contracts provable by fingerprint comparison, and full record-class coverage (active/completed/archived/draft, hierarchy, dependencies, milestones) with named exclusions. No importer, script, or executable scaffolding produced.

Reviewed and approved after one fix cycle (a citation correctly reattributed rather than falsely claimed as register-covered). A wave-level integration review then found and closed 9 cross-document coherence issues against this document's sibling (QCLI-2.8) in a follow-up (PR #20). One real (not narrow) coherence gap — the register not yet enumerating the fidelity contract this playbook is built on, among other unenumerated research outputs — is proposed as a follow-up task, not fixed here (out of this task's scope); this document already discloses that specific gap accurately.
<!-- SECTION:FINAL_SUMMARY:END -->
