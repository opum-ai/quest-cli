---
id: QCLI-2.10
title: Author the Backlog-to-Quest adoption and migration playbook
status: To Do
assignee: []
created_date: '2026-08-04 06:23'
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
