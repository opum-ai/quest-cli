---
id: QCLI-169
title: >-
  Document --preserve-source-ids's three id-preservation guarantees in the
  migration fidelity contract
status: To Do
assignee: []
created_date: '2026-09-03 04:25'
labels:
  - migration
  - docs
  - cutover
dependencies: []
priority: high
ordinal: 198000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Backlog migration fidelity contract doc (docs/reference/quest-cli-backlog-migration-fidelity-contract.md) predates --preserve-source-ids entirely -- it was last requalified 2026-08-15, the flag shipped 2026-08-31 (QCLI-160) -- and covers only default migration. git grep -c "preserve-source-ids" across origin/dev's docs/reference/*.md returns nothing: the flag has no documented contract anywhere in the reference bundle. The only places its dotted-id-translation behavior is recorded today are an e2e test and quest migration backlog preview --help's summary text. opag (2026-09-02) ruled this a cutover prerequisite, not cleanup: the fleet's decision to keep citing dotted subtask ids in prose across five repos after migration rests entirely on the alias-retention property holding, and a property that consumers depend on but no contract names is one refactor away from being removed by someone with no reason to know it matters.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/reference/quest-cli-backlog-migration-fidelity-contract.md gains a section documenting --preserve-source-ids as an opt-in migration mode
- [ ] #2 the section states the three guarantees the e2e suite already asserts: a flat in-family id is preserved verbatim; a dotted subtask id is translated to a freshly minted flat id; the dotted spelling is retained as a resolving alias, with its parent threaded through
- [ ] #3 scope stays minimal -- this is a new section in the existing contract doc, not a general migration guide
- [ ] #4 the section cites QCLI-160 as the origin of the ruling and behavior
- [ ] #5 the change is made through lore (not a plain editor) and lore check exits 0
<!-- AC:END -->
