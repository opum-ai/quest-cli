---
id: QCLI-138
title: Index-addressed acceptance-criteria and DoD checkbox operations
status: To Do
assignee: []
created_date: '2026-08-29 00:31'
labels:
  - cli
  - parity
  - correctness
dependencies:
  - QCLI-134
references:
  - src/application/tasks/edit-patch.ts
  - src/application/command-contract.ts
priority: high
type: feature
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Quest can only replace acceptance criteria and definition-of-done wholesale, via --acceptance-criteria / --definition-of-done taking a JSON array. Checking one box is therefore read-modify-write: read the list, flip one entry, write the whole list back. Two editors doing that concurrently silently lose each other checkmarks.

Backlog 1.50.1 addresses entries by index instead: --check-ac, --uncheck-ac, --remove-ac, --clear-ac and the --check-dod / --uncheck-dod / --remove-dod peers.

QCLI-134 identifies this as the only one of its nine parity gaps with a correctness dimension rather than ergonomics. Filed out of that register with the owner deciding to implement (2026-08-29).

Quest already has the machinery: EditPatchVocabulary and foldEditPatch (src/application/tasks/edit-patch.ts) are the single fold both task edit and task edit-batch consume, and the checklist value type already carries {index, text, checked}.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 task edit supports index-addressed check, uncheck, remove and clear for acceptance criteria, and the same for definition of done.
- [ ] #2 Checking one box does not rewrite untouched entries: a concurrent-editor test proves two sequential index-addressed edits both survive, where two wholesale replaces would not.
- [ ] #3 task edit-batch accepts the same operations through the shared fold, and the manifest field lists for task edit and task edit-batch declare them.
- [ ] #4 The existing wholesale --acceptance-criteria / --definition-of-done replace continues to work unchanged.
<!-- AC:END -->
