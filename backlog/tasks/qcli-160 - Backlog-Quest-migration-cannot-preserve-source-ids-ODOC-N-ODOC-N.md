---
id: QCLI-160
title: Backlog->Quest migration cannot preserve source ids (ODOC-N -> ODOC-N)
status: In Progress
assignee:
  - '@jeremy'
created_date: '2026-08-31 13:26'
updated_date: '2026-08-31 14:54'
labels: []
dependencies: []
priority: high
type: feature
ordinal: 189000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User requirement (relayed via opag, 2026-08-31): "For our migrations we want to keep the backlog id in quest: ODOC -> ODOC" -- the same id, not just the same id family.

Verified against source: previewInternal (src/application/migration/backlog-public.ts:213) allocates targetIdentifier as `${taskIdPrefix}-${highest + index + 1}`, purely by POSITION in snapshot.records. The importer sorts that list lexically by (sourceFolder, sourceIdentifier, sourcePath), so lexical order (id-1, id-10, id-100, id-11, ...) does not match numeric source order -- allocated numbers do not track source numbers. QCLI-157 made the destination prefix configurable (landing in the workspace own id family, e.g. QCLI-N, instead of a hardcoded T-N island) but did not make the NUMBER survive.

Each per-record mapping is deduped internally (own targetIdentifier + own aliases do not self-collide), then assertAliasesAvailable (src/domain/records.ts:106) checks the full candidate set against every existing id/alias in the destination and throws RecordConflictError on any hit -- so a mismatch between positional allocation and a truly id-preserving migration does not merely renumber, it can fail closed the whole import. opag simulated this positional allocation against each fleet repo backlog (2026-08-31, method confirmed against the code above, per-repo counts not independently re-run here and should be reverified against the live backlog when this is picked up): opum-doc 163 records/1 keeps its number/70 collisions with a different task id; lore-cli 712/0/281; quest-cli 204/1/157; opum-cli-e2e 22/1/21; opum-agent 4/1/0.

Confirmed structurally: BacklogImportRecord carries sourceIdentifier and sourceFolder per record (raw source id like "ODOC-24" and its folder), but the importer takes exactly one destination taskIdPrefix for the whole run -- there is no per-record source-prefix extraction or multi-family targeting today.

Two real cases to design against, not hypothetical:
- Mixed-namespace source backlogs: lore-cli task folders hold LCLI=415 and LORE=297 ids; opum-doc holds ODOC=131 and OCLI=31. One taskIdPrefix cannot represent two families in one migration.
- Destination id already taken by unrelated work: opum-agent quest workspace already issued OPAG-1 ("Redeploy the slot-64 canonical skill source"); its Backlog separately has its own OPAG-1 ("Own the agent workspace control plane") -- different work, same id, both Done. An id-preserving mode needs an explicit answer for what happens when the preserved source id is already occupied in the destination by something else.

Tangential context, worth a skim during design: QCLI-66 (this repo) is about opum-doc own OCLI->ODOC prefix rename and preserving frozen provenance in a ledger -- a different problem (documentation cross-linking, not migration id allocation) but touches the same OCLI/ODOC family history and may carry useful framing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A migration mode exists where the destination task id is the source id verbatim when the source id's prefix is available/selected in the destination, instead of always positional renumbering
- [ ] #2 Design states what happens when a preserved source id collides with an unrelated existing destination id/alias (see opum-agent OPAG-1 case): documented resolution, not a silent overwrite and not an unexplained hard failure
- [ ] #3 Design states how a single migration run represents a source backlog with more than one id family/prefix (see lore-cli LCLI+LORE, opum-doc ODOC+OCLI) -- current API takes exactly one taskIdPrefix per run
- [ ] #4 Behavior for records whose source id is unavailable for preservation (prefix not selected, or collision unresolved) is explicit: falls back to positional allocation, or refuses, per the design -- not left implicit
- [ ] #5 Per-repo collision counts are reverified against each backlog live at implementation time rather than trusted from the 2026-08-31 simulation
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research complete on current mechanism (previewInternal/backlog-public.ts, BacklogImporter/adapters/migration/backlog/importer.ts, CLI wiring in main.ts:907-1003). Got opag's rulings on ACs 2-4 (fail-closed with full conflict list on collision; family SELECTION not merge for AC3, driven by lore-cli/opum-doc's own data rulings -- LORE frozen/all-superseded-by-LCLI, OCLI all historical/superseded-by-ODOC; explicit per-run refusal for unpreservable ids). AC1/mode-vs-default left to me.

BLOCKER found before writing allocation logic: Quest's canonicalIdPattern (src/domain/records.ts:20) is strictly <prefix>-<int>, no dots -- cannot represent a dotted Backlog subtask id (e.g. QCLI-97.5.2) at all. 45/206 (~22%) of this repo's own backlog ids are dotted. Read literally, AC4's 'run stops' as whole-batch refusal would make id-preserving migration refuse against any backlog with subtasks, i.e. every real fleet backlog. Escalated to opag for a ruling on whether refusal should be per-record (exclude + itemize, rest of batch proceeds) rather than whole-batch; recommended per-record as the only version that's usable against real data, and flagged full dotted-subtask-id support in Quest's own schema as a separate, larger follow-up rather than folding it into this task. Holding on control-flow implementation until this is settled; proceeding with decision-independent groundwork (family/prefix detection, CLI flag surface) in the meantime.
<!-- SECTION:NOTES:END -->
