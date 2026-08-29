---
id: QCLI-134
title: >-
  Backlog tracker-surface parity register against 1.50.1: triage the remaining
  gaps
status: To Do
assignee: []
created_date: '2026-08-28 21:31'
updated_date: '2026-08-29 00:33'
labels:
  - parity
  - audit
  - e2e
dependencies:
  - QCLI-133
priority: medium
type: spike
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A full recursive --help sweep of Backlog.md 1.50.1 against quest 0.2.9, now encoded as executable rows in opum-cli-e2e suites/45-parity-backlog.mjs (39 rows, all passing). This issue is the triage list, not an assertion that every line is a defect — several may be deliberate product policy, and that decision is yours to record.

Parity is scoped to the TRACKER surface. Documentation is Lore's, so the 'doc' namespace is a declared exclusion alongside 'config' and 'mcp' — the harness asserts the positive seam (a Lore concept authored by lore, referenced from a Quest task's --doc field) rather than treating it as a hole.

WHAT ALREADY MATCHES, verified by driving both CLIs: identical status vocabulary ([To Do, In Progress, Done] with Done terminal); title, description, labels and acceptance criteria round-trip identically through create; list, view, search, overview, doctor, archive and the draft/milestone/decision lifecycles all have working counterparts; a hostile non-ASCII title round-trips byte-exact through both stores.

REMAINING GAPS, each shadowing a real Backlog capability:

1. task edit --title/--priority/--type/--ordinal — filed separately as QCLI-133.
2. Acceptance-criteria and DoD checkbox operations. Backlog: --check-ac, --uncheck-ac, --remove-ac, --clear-ac and the --check-dod/--uncheck-dod/--remove-dod equivalents, all index-addressed. Quest can only wholesale-replace via --acceptance-criteria with a JSON array, which is read-modify-write and races under concurrent editors — the one gap here with a correctness dimension, not just ergonomics.
3. task list filters. Quest has --status and --label. Backlog adds --exclude-status, --assignee, --unassigned, --milestone, --parent, --priority, --type, --search, --ready, --limit, --sort. --ready (dependency-unblocked) has no Quest equivalent and is the one an agent picking its next task actually needs.
4. search filters. Quest has --all. Backlog has --type, --task-type, --status, --exclude-status, --priority, --modified-file, --limit.
5. board export [file] --force --readme --export-version. Absent ('quest board export' exits 2, 'board accepts only --json and --plain').
6. milestone archive <name>. Quest offers only milestone delete, so a completed milestone cannot be retired without destroying the record.
7. doctor --fix --yes. Quest diagnoses but cannot repair; Backlog repairs, including atomic duplicate-id rename.
8. instructions <guide> and --list. Backlog serves five workflow guides (overview, task-creation, task-execution, task-finalization, init-required); Quest emits one fixed block.
9. completion. Backlog installs for bash, zsh, fish and pwsh; Quest emits bash only, and prints the script rather than installing it. The generated script is also a flat 'complete -W' word list that flattens every subcommand and flag into one namespace, so it offers 'preview' and '--all' at the top level.

STRUCTURAL DIVERGENCES — not gaps, but they are why a caller cannot be retargeted from one tracker to the other by swapping the binary name. Recorded so the decision is explicit:

- Envelope. Quest emits the Opum contract {schemaVersion, kind, data, principal}; Backlog emits {schemaVersion, kind, tasks|task}. No single reader parses both.
- Attribution. Quest requires --actor/--actor-kind on every write and denies (exit 4) without them; Backlog has no attribution axis at all.
- Value encoding. Quest takes JSON arrays for --acceptance-criteria, --plan, --notes and --comments; Backlog takes repeated plain-text flags.
- 'task complete' means different things. In Quest it performs the transition and enforces the status flow (To Do -> Done is refused, exit 6 validation). In Backlog it is a post-hoc cleanup check that exits 0 and changes nothing unless the task is already Done.
- Only Quest's agents bridge is non-interactive. Backlog's 'agents' is a TUI selector that takes no shell argument, so only Quest's can run in CI.

Quest-only capabilities Backlog has no answer for, recorded so the comparison is not one-sided: manifest, task status-flow, task binding, task edit-batch, migration backlog preview|apply|status|rollback, agents --check (a real CI drift gate, exit 6), search --all, milestone view, and decision view/edit/delete.

Evidence: opum-cli-e2e baselines/v0.2.9 (407 rows), surface parity/backlog. Every gap above is a live row asserting today's classified absence, so a future partial implementation fails the suite loudly rather than drifting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Each of the nine gaps is triaged to one of: accepted as a deliberate exclusion with its rationale recorded, or converted into a sharp implementation task with its own acceptance criteria
- [ ] #2 The acceptance-criteria checkbox gap (item 2) is decided on its correctness merits, not only ergonomics: either index-addressed operations land, or the read-modify-write race under concurrent editors is documented as accepted
- [ ] #3 The declared exclusions are written down in the repository as product policy — doc (Lore owns documentation), config, mcp — so downstream qualification can cite a source rather than inferring intent
- [ ] #4 The structural divergences are recorded as intentional, in particular whether the Quest and Backlog output envelopes are ever meant to converge
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Gap 1 of the nine (task edit --title/--priority/--type/--ordinal) is CLOSED as of dev 3852c3c: QCLI-133 shipped it via PR #172, on both the task edit and task edit-batch transports, with the manifest field lists updated for both. The owner's remaining triage set is therefore 8 gaps (items 2-9) plus the five structural divergences, not nine.

Also relevant to this triage, found while re-verifying QCLI-97.10 under QCLI-133 AC4 and not currently in the nine: the manifest declares createdAt and updatedAt on task list, task view and task create, but the CLI never returns them and .quest/tasks/<id>.json never stores them. Isolated from ordinary unset-field omission by setting summary/description/assignee/reference/modified-file - all appeared, the timestamps did not. That is a contract-vs-implementation gap of the same class as gap 1 and may belong in this register; recorded here rather than filed, pending the owner's call.

No triage decisions taken by this session: every remaining AC requires a product judgment (implement vs accept-as-deliberate-exclusion, the AC-checkbox correctness call, writing declared exclusions down as policy, and whether the envelopes are ever meant to converge). Those are owner decisions under AGENTS.md, not agent-resolvable.

TRIAGE COMPLETE 2026-08-29 — owner decided each of the 8 remaining gaps individually.

| Gap | Decision | Task |
| --- | --- | --- |
| 1. task edit title/priority/type/ordinal | already implemented | QCLI-133 (Done, PR #172) |
| 2. Index-addressed AC/DoD checkbox ops | implement | QCLI-138 (High) |
| 3. task list --ready + selection filters | implement | QCLI-139 |
| 4. search filters | future, not scheduled | QCLI-142 |
| 5. board export | future, not scheduled | QCLI-143 |
| 6. milestone archive | implement | QCLI-140 |
| 7. doctor --fix | future, design pass first | QCLI-144 |
| 8. instructions <guide> + --list | implement now | QCLI-141 |
| 9. completion (flat namespace + shells) | future, not scheduled | QCLI-145 |

AC2 (the acceptance-criteria checkbox correctness call) resolved by choosing to
implement index-addressed operations, not by accepting the race: QCLI-138 requires
a concurrent-editor test proving two sequential index-addressed edits both survive
where two wholesale replaces would not.

Owner design decision recorded on QCLI-141: NO "all" guide. Neither reference
implementation has one — Backlog exposes [guide] plus --list, Lore exposes
[<topic>] and describes itself as task-scoped guidance "on demand". Splitting
guides exists to keep agent context small; an "all" defeats that, and --list
already covers discovery. QCLI-141 also carries the owner's requirement that the
QCLI-129 Quest skill be reconciled against the guides rather than becoming a third
divergent copy.

DOWNSTREAM DEPENDENCY EVIDENCE (asked for during triage, gaps 4 and 5): Lore 0.3.4
depends on none of these. Its shipped 85MB darwin-arm64 binary contains zero
occurrences of --exclude-status, --unassigned, --ready, --sort, --modified-file,
--task-type, or "board export". Its README pins the coupling to exactly three read
commands — backlog task list --json, task view --json, search --json — with no
--plain fallback and no filter flags. So no parity gap here blocks Lore today.

Still open on this task: AC3 (write the doc/config/mcp exclusions down as product
policy in the repository) and AC4 (record whether the Quest and Backlog output
envelopes are ever meant to converge). Both are documentation of settled product
policy and were not taken up in this triage pass.
<!-- SECTION:NOTES:END -->
