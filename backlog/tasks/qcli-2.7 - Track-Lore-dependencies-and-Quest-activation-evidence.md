---
id: QCLI-2.7
title: Track Lore dependencies and Quest activation evidence
status: In Progress
assignee:
  - '@claude-worker'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 13:50'
labels:
  - campaign
  - research
  - lore
  - evidence
  - activation-gate
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:lore-gate'
  - wave-2
dependencies:
  - QCLI-2.1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Maintain the Quest CLI dependency-status and evidence-consumer matrix for choices that depend on Lore. Link the Lore-wide gate policy in lore-doc and read implementation or immutable release evidence from the owning Lore component, currently lore-cli for the package and command. Observe owners without modifying them or copying their mutable gate criteria.

Owner direction, 2026-08-04 (restore #2) — adapter alignment folded in. This task now also reviews the current lore-cli for alignment on the adapter quest-cli must honor. The component charter states quest-cli owns "versioned Lore import/link/adapter behavior", but no campaign task previously produced the adapter-contract evidence QCLI-2.8 would synthesize from. ACs #4/#5/#6 cover it. This remains research: describe the contract and name the divergences, do not implement an adapter.

Owner ruling, 2026-08-04 (restore #2) — the SPLIT RULE for lore-cli source admissibility. The research source register previously excluded all design derivation from lore-cli TypeScript. That exclusion is now split:

  ADMISSIBLE — lore-cli source and its own ADRs as evidence of what Lore REQUIRES of any task-tracker backend: the adapter interface shape, the structured-output envelope and schema-version expectations, capability-probe and fail-loud semantics, the write path, identifier capture, and the back-reference/metadata-storage constraint. This is Opum-owned MIT code describing Lore own design, and quest-cli is chartered to honor it.

  NOT ADMISSIBLE — any assertion about how Backlog.md BEHAVES, even when lore source or lore ADRs state it. Owner ruling 1 (strict clean-room, Backlog.md source Excluded) and ruling 5 (lore-cli Backlog corpus Contextual: readable for question discovery, citable for nothing) are unchanged. Every Quest assertion about Backlog.md must still be independently re-derived from the public surface at the pinned v1.49.3 and cited to that observation.

  The line: cite Lore for what Lore needs; never cite Lore for what Backlog does. Record the split rule in the source register as part of this task.

This task OWNS all edits to docs/reference/quest-cli-research-source-register.md for wave 2. QCLI-2.2 and QCLI-2.9 run concurrently and must cite the register read-only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The matrix links the canonical lore-doc gate and names the owning Lore task, specification, runbook, or immutable evidence for every component dependency
- [ ] #2 Each Quest CLI choice is classified evidence-complete, provisionally researchable, blocked on a named owner result, or requiring owner input
- [ ] #3 The handover requires live owner verification before implementation activation and does not restate the Lore gate
- [ ] #4 The current lore-cli adapter contract is reviewed against quest-cli stated obligation to honor versioned Lore import/link/adapter behavior, recording at the pinned released revision: the invocation surface Lore requires of a task CLI, the structured-output envelope and schema-version expectation, the capability-probe and fail-loud semantics, the write path and new-identifier capture requirement, the existence-check contract, and the back-reference/metadata-storage constraint
- [ ] #5 Each adapter requirement is classified as already satisfiable by Quest chartered contract, requiring a Quest contract change, or requiring a lore-doc boundary decision, with every divergence named explicitly rather than summarized
- [ ] #6 Drift between lore-cli published/pinned revision and its current development line is recorded with dated evidence, and any change to the documented adapter surface is flagged as a reclassification trigger
- [ ] #7 The split rule for lore-cli source admissibility is recorded in the research source register, and every adapter finding cites Lore for what Lore requires without citing Lore for any claim about Backlog.md behavior
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Research (done): re-read the research source register, component charter, migration ledger, research-program Spec, Story, and handover runbook; re-verify live drift evidence in lore-cli (npm/local version, tag commit, dev HEAD, ahead/behind, ancestor check, diff --stat of cli-surface.md/cli-contract.md/okf-projection-contract.md, src/adapters/backlog.ts, src/, and docs/ between v0.1.0 and dev HEAD); read src/adapters/backlog.ts in full (probe, envelope schemas, BacklogAdapter interface, createBacklogAdapter, status-flow parsing) plus lore-design.md and architecture.md sec 3 for adapter-boundary framing; read lore-doc's quest-integration-and-lore-release-gate.md and LDOC-4's live status (To Do) without copying its checklist; discover ADR-0009 as an additional Backlog-behavior-tainted lore-cli document (states 'Backlog.md drops unknown frontmatter keys on edit' uncited) alongside the already-known historical-upstream-backlog-json-tag-watch.md gap.
2. Author one new Reference concept via 'lore new reference' under docs/reference/ with two parts: Part 1 the Lore dependency and activation-evidence matrix (AC1-3: links the lore-doc gate without restating it, names owning Lore task/spec/runbook/evidence per dependency, classifies each Quest choice evidence-complete/provisionally-researchable/blocked-on-named-owner-result/requires-owner-input, and states live owner re-verification is required before activation); Part 2 the lore-cli adapter contract review (AC4-6: invocation surface, structured-output envelope + schemaVersion, capability-probe + fail-loud semantics, write path + new-id capture, existence-check contract, back-reference/metadata-storage constraint, each cited to src/adapters/backlog.ts at tag v0.1.0/commit e621d20; AC5 three-way classification against Quest's chartered contract with every divergence named explicitly, including the hard finding that lore-cli has no generic TaskAdapter abstraction today -- BacklogAdapter is the only adapter type -- so a second backend is a lore-doc boundary question, not solely a Quest one; AC6 dated drift table).
3. Edit docs/reference/quest-cli-research-source-register.md (AC7, sole owner this wave): record the split rule verbatim as its own subsection; classify lore-cli-release-truth.md and release-publishing.md (currently named but unclassified per the known gap); extend the Backlog-corpus closed list with a catch-all clause covering any further lore-cli document deriving from Backlog.md source, naming historical-upstream-backlog-json-tag-watch.md and the newly discovered ADR-0009 as instances; do not restate or duplicate any Lore gate criteria.
4. Add a one-line pointer to the new Reference doc from docs/index.md's hand-authored 'Start here' section (docs/reference/index.md's own listing is lore-managed and regenerates via sync); no edits to the campaign Story's managed blocks.
5. Run 'lore sync' then the verification gates ('lore check --strict --plain', 'lore validate --strict --plain', 'lore orphans --plain'); fix to zero errors/warnings.
6. Record implementation notes (decisions, split-rule refusals with rationale, literal gate output) via --append-notes; commit in small logical commits with 'Refs: QCLI-2.7'; push the branch as the last action. Do not check ACs, write a final summary, or move the task to Done.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deliverable: docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md (new Reference, 415 lines) plus edits to docs/reference/quest-cli-research-source-register.md (AC7, sole-owner edit) and a one-line docs/index.md pointer.

Part 1 (AC1-3): matrix links the lore-doc gate (docs/specs/quest-integration-and-lore-release-gate.md) and LDOC-4 (re-verified live To Do) without restating the predicate; 5 rows classified evidence-complete / provisionally researchable / blocked on a named owner result / requiring owner input; explicit Activation handover section requires live re-verification and treats "blocked"/"requiring owner input" rows as an unconditional stop.

Part 2 (AC4-6): adapter contract reviewed against src/adapters/backlog.ts at tag v0.1.0 (commit e621d20), re-verified byte-identical against dev HEAD 4056068 (29 commits ahead; the "tag not an ancestor" result is a branch-topology artifact of a promote-to-main merge, not content divergence -- confirmed via git merge-base --is-ancestor on the merge's second parent). Central finding: BacklogAdapter is lore-cli's only adapter type (27 files reference it by name; zero hits for TaskAdapter/pluggable/task-tracker across src+docs/specs+docs/adr) -- no generic backend abstraction exists, so several AC5 items land on "requiring a lore-doc boundary decision" rather than Quest's alone. 18-row AC5 classification table names every divergence explicitly (binary name/config, envelope shape divergence from Lore's own outbound contract, MIN-version-floor+probe-sequence, create's without-json/without-plain regex convention, existence-check exit-code-vs-JSON-error tension, doc: label-format reuse).

Split rule (AC7): new register subsection "The lore-cli source-admissibility split rule" records the owner's admissible/not-admissible line verbatim-equivalent and amends the prior blanket TypeScript-derivation exclusion inline. Closed two known register gaps: classified lore-cli-release-truth.md + release-publishing.md (named as QCLI-2.7 evidence, previously unclassified); retired the Backlog-corpus slice's closed 5/6-document list for a standing catch-all, naming historical-upstream-backlog-json-tag-watch.md (known gap) plus a newly discovered instance, docs/adr/0009-story-task-coupling-reconciliation.md, which asserts uncited Backlog.md behavior claims ("Backlog.md drops unknown frontmatter keys on edit"; "--doc annotation is not reliably queryable") in the same taint style as ADR-0002/ADR-0012 despite not using ADR-0012's exact "verified against Backlog.md source" phrasing.

Split-rule refusals: read docs/adr/0009 for question discovery only, cited nothing from it -- sourced the back-reference/metadata-storage requirement (AC4 item 6) from src/adapters/backlog.ts's BacklogTask.labels/EditTaskPatch/CreateTaskInput directly instead, which states the requirement without any Backlog-behavior claim. Never opened docs/adr/0002, docs/adr/0012, backlog-cli-contract.md, backlog-json-schema.md, or backlog-json-patch.md in this session (already-known-tainted; relied on the register's existing summary of them). Never opened Backlog.md implementation source, the local Backlog.md clone, or any Quarantined artifact.

Gates (run from /Users/jdnewhouse/.treehouse/quest-cli-f11e72/2/quest-cli after `lore sync`):
lore check --strict --plain -> "17 files, 0 errors, 0 warnings"
lore validate --strict --plain -> "17 files, 0 errors, 0 warnings, 6 skipped"
lore orphans --plain -> "orphans: 0 orphan tasks, 0 dangling links"

Commits: e17b527 (new Reference doc), c03c63b (register split rule + gap closures), e69bb9b (pre-existing lore-sync drift reconciliation: docs/log.md + two Story managed blocks, unrelated hand edits).

Out of scope, reported not acted on: docs/adr/0009's Backlog-behavior claims (recorded in the register's catch-all, not independently re-derived -- that re-derivation is QCLI-2.5's job at the public v1.49.3 surface if ever needed). Runtime/native-packaging/supported-platform Lore-precedent evidence explicitly left to QCLI-2.9, not evaluated in the Part 1 matrix, per the wave's cluster-scope split.

Post-report correction (team-lead relay from QCLI-2.2's review): fixed a falsified content-identity claim in the register's "dated Opum fleet and prior-art inventory" slice. The prior text asserted file content "unchanged since d42c016 as of opum-doc HEAD d7ca18f", verified only by commit reachability (git show <sha> --stat succeeding), never by confirming those commits touch the cited path. Independently re-verified in /Volumes/external/repos/opum-doc (not taking the report on faith): git cat-file -e confirms the path is ABSENT at both 7b82afc and d42c016 -- those commits authored/refreshed the file at its FORMER path docs/reference/opum-fleet-and-prior-art-inventory.md (292 lines). Commit 846f054 condensed+renamed to the current path (120 lines, recorded as a plain delete+add, not a detected Git rename). Commit bee848a (2026-08-04) made one further one-line link-URL fix, postdating the previously-cited d7ca18f -- so even the "as of d7ca18f" framing concealed that the file had already moved again by the time of my session. Corrected the slice with the verified lineage and re-pinned to opum-doc's current live HEAD 7b512d9.

Swept the rest of the register (grep for unchanged/reachab/--stat/byte-identical/matches/confirmed) for the same reachability-vs-content-identity failure class: found none. The "Git recovery commits" slice's own reachability-only claim is safe by construction (its permitted use is "recover the historical text AT that commit", which reachability genuinely establishes -- no current-state identity claim is layered on top). The lore-cli release-identity claims (npm/tag/version match) were independently re-verified live by me via direct commands, not inherited.

Also widened the "npm package name occupancy" slice's permitted-use enumeration per QCLI-2.9's review: added maintainer identities, description text, and publish/version history (same class of npm-registry metadata as version/license/repository, retrieved the same way via npm view, no package source/test inspection either way) since QCLI-2.9's own AC1 requires citing exactly those facts. QCLI-2.9 still dates and cites its own observations; this only widens what the register admits.

Gates re-run clean after both fixes: lore check --strict --plain -> "17 files, 0 errors, 0 warnings"; lore validate --strict --plain -> "17 files, 0 errors, 0 warnings, 6 skipped"; lore orphans --plain -> "orphans: 0 orphan tasks, 0 dangling links".

Commit: e0ea127. Pushed.

Review fix pass (2026-08-04, worktree 2): supersedes two false verification claims and four small imprecisions the reviewer found in this task's own deliverable and register edits. Re-verified every underlying fact myself before editing (release-publishing.md lines 130-140 and lore-cli-release-truth.md:63 re-read live in /Volumes/external/repos/lore-cli; the three source-comment quotes re-located in this document; unlink's absence as a separate source file confirmed; the version-floor comment block's real line range confirmed at 34-46).

BLOCKING F1 (register, "lore-cli release-gate evidence" slice, ~line 486-511): the prior text claimed QCLI-2.7 "confirmed both are non-Backlog-derived (neither asserts a Backlog.md behavior claim)" and framed a Backlog cross-link exclusion as hypothetical ("should any accrue later"). Both were false: release-publishing.md's own "## Prerequisites" section (lines 133-137) states a dated Backlog.md release-history fact ("Backlog.md v1.49.0, published 2026-08-02, is the first tagged release containing PR #790/BACK-545") as fact, not as a Lore requirement -- exactly the class of fact the slice's own Permitted use admits ("package/tag/workflow/registry/install facts"), which opened a live laundering path. Fixed: the "Exact revision or retrieval date" bullet now states the split explicitly -- lore-cli-release-truth.md:63 is a Lore requirement and citable; release-publishing.md's Prerequisites bullet is a Backlog.md release-history fact and is not. The Exclusions bullet now names that exact passage (release-publishing.md, "## Prerequisites", lines 133-137) as an explicit carve-out "in effect now (not hypothetical)," and drops the "should any accrue later" framing. lore-cli-release-truth.md:63 itself is unchanged and remains correctly framed as a Lore requirement, per the split rule -- not touched.

BLOCKING F2 (deliverable, "Admissibility discipline applied in this document", ~line 384-423): the prior text stated "No claim here about how Backlog.md itself behaves is sourced from Lore" and listed release-publishing.md under a "non-Backlog-derived surface" enumeration. Both were false: three verbatim lore-cli source-comment quotes this document itself reproduces do contain Backlog.md-behavior assertions -- SS1's "unsupported, LORE-57" note on edit's --json support (src/adapters/backlog.ts:753), SS3's version-floor comment "a pre-`--json` stock release can still report a version at or above this floor" (backlog.ts:34-46), and SS4's createTask comment "`--plain` suppresses the `Created task <ID>` line lore captures, and create emits no JSON envelope" (backlog.ts:919-920). None is a substantive leak -- each is Lore's own stated rationale for its own invocation convention, not load-bearing for any Quest requirement in the AC5 table -- but the blanket sentence was simply false on its own document's contents. Fixed: qualified the disclaimer to name the three quotes, state they are reproduced strictly as Lore's rationale for its own convention and are not admitted as evidence about Backlog.md, and that any Backlog.md claim a Quest requirement needs must still be independently re-derived from Backlog.md's public surface at v1.49.3 (QCLI-2.5's job). release-publishing.md is no longer listed as uniformly non-Backlog-derived; the paragraph now explains why (same Prerequisites passage as F1) and confirms this document does not cite, quote, or rely on that passage anywhere -- true on inspection.

LOW 1: deliverable ~line 84 ("only one of four conditions feeding") and register ~line 505/513 ("three further, separately-held conditions") both restated the mutable owner-held gate predicate's condition count. Both now read "further, separately-held conditions" with no number.

LOW 2: deliverable ~line 56-59 said the matrix does not reproduce the release-gate predicate, integration-obligation list, or open questions, while matrix row 5 (~line 87) quotes one fragment of each list verbatim -- in tension, though not contradictory (quoting one item is not reproducing the list). Reworded line 56-59 to say the document does not reproduce either list "in full" and to note row 5 quotes one fragment of each solely to name the specific gap it evidences.

NIT 3: this task's own implementation notes above state the new Reference is "415 lines"; it was 419 at review time (git show at the reviewed commit confirms). Not re-editing that note's text (superseding per this note instead, per project convention) -- recording the correction here. The file is now 441 lines after this fix pass's edits.

NIT 4: "Central finding" section (~line 292-295) listed `unlink` alongside `sync`/`check`/`link`/`tasks`/`orphans` as if it were a separate file among the 27; there is no src/commands/unlink.ts -- unlink is implemented inside link.ts, itself already one of the 27. Reworded to "`link` -- which also implements the inverse `unlink` command --" so the list names files, not commands, consistently.

NIT 5: SS3's version-floor citation said "the source's own comment (lines 30-45)"; the actual JSDoc block is backlog.ts:34-46 (opening /** at 34, closing */ at 46; confirmed via `sed -n '25,50p' src/adapters/backlog.ts` in the local lore-cli clone). Corrected to lines 34-46.

Gates re-run clean after all fixes (lore sync run first): lore check --strict --plain -> "17 files, 0 errors, 0 warnings"; lore validate --strict --plain -> "17 files, 0 errors, 0 warnings, 6 skipped"; lore orphans --plain -> "orphans: 0 orphan tasks, 0 dangling links (none -- every task has an owning doc, every linked task is live)".

Scope discipline: did not touch the AC5 18-row table's classifications, did not restructure either document, did not open/read/cite the quarantined local Backlog.md clone, did not write to lore-cli/lore-doc/opum-doc/quest-doc (read-only re-verification only), did not touch QCLI-2.2 or QCLI-2.9 deliverables, did not check ACs or move status.

Review fix pass, supplement (2026-08-04, worktree 2): the full reviewer verdict landed after the first fix pass and found four more low-severity register issues plus three notes-hygiene nits. F1/F2 from the first fix pass are unchanged. Verified every claim myself before editing (opum-doc read-only checkout: line counts at 7b82afc/d42c016/c5ebee8/846f054^, table row counts at both commits, npm-occupancy wording).

S1 (register, npm-occupancy Permitted use): the widened enumeration ended with a generalizing "all `npm view <pkg>`-surfaced registry metadata" clause, broader than its own list -- read literally it would admit `npm view <pkg> readme` (full authored README) and `dependencies` (dependency graph), neither enumerated and both closer to source than metadata. Bounded the clause to "registry metadata limited to the fields enumerated above" and named readme/dependencies as explicitly excluded, non-illustrative examples.

S2 (register, "Git recovery commits" slice): its own Permitted use asserts a 14-row remote register and 24-row fleet register, justified only as "reachability re-verified" -- which proves the commits exist and touch the path, not that the row counts are correct. Same method/claim mismatch this task corrected elsewhere, reproduced inside the sweep that declared the class absent. Content-verified live in /Volumes/external/repos/opum-doc (read-only): `git show 7b82afc:<former path>` and `git show d42c016:<former path>` both show the "Normative source register" table with 14 data rows and the "Four-host fleet" table with 24 data rows, at both commits. The claim was already TRUE -- corrected only the recorded verification method, did not weaken or reopen the slice.

S3 (register, "Dated Opum fleet and prior-art inventory" slice): "the file was **not** unchanged even as of the previously-cited `d7ca18f` ... in the sense the wording implied" read as flatly contradicting QCLI-2.2's true, properly-bounded "unchanged 846f054 -> HEAD d7ca18f" claim. Reworded to state both facts as complementary: unchanged from 846f054 through d7ca18f, but d7ca18f was already a stale pin by 2026-08-04 (bee848a made one further one-line edit after it). QCLI-2.2 needed no change.

S4 (register, same slice): "292 lines immediately before the rename" was grammatically attached to `7b82afc`/`d42c016`, which are actually 284 and 287 lines at the file's former path -- confirmed via `git show 7b82afc:<former path> | wc -l` = 284, `git show d42c016:<former path> | wc -l` = 287. The 292-line figure belongs to `c5ebee8` ("docs: establish Opum SaaS documentation hub", 2026-08-01), which is `846f054^` -- confirmed via `git show 846f054^:<former path> | wc -l` = 292 and `git log -1 --format='%H %s' c5ebee8`. Named `c5ebee8` explicitly so the 5-line growth (287 -> 292) is no longer unattributed.

S5 (notes hygiene -- corrections to this task's own prose, not the register, which was already precise on all three points):
- The prior "Post-report correction" note said "re-pinned to opum-doc's **current live HEAD** `7b512d9`"; the register text itself correctly said "then-current" throughout. "Current" is unsustainable -- opum-doc's origin/dev has moved past 7b512d9 more than once since (re-verified live 2026-08-04, read-only). The register's "then-current" framing is the only defensible form; matching it here.
- The same note wrote "(292 lines)" attached to `7b82afc`/`d42c016` with no qualifier -- worse than S4's register issue, since those commits are 284 and 287 lines, not 292 (292 is `c5ebee8`/`846f054^`, per S4 above).
- The original implementation notes (top of this task's history) state the new Reference is "415 lines"; it was 419 at first review and is now 460 after both fix-pass commits (wc -l confirmed) -- not correcting the historical figure in place, recording the current one here per the superseding-note convention this campaign uses.

Gates re-run clean after this supplement (lore sync run first): lore check --strict --plain -> "17 files, 0 errors, 0 warnings"; lore validate --strict --plain -> "17 files, 0 errors, 0 warnings, 6 skipped"; lore orphans --plain -> "orphans: 0 orphan tasks, 0 dangling links (none -- every task has an owning doc, every linked task is live)".

Scope discipline unchanged: did not touch the deliverable's AC5 table, did not restructure either document, did not write to opum-doc/lore-cli/lore-doc/quest-doc (read-only re-verification only), did not touch QCLI-2.2/QCLI-2.9, did not check ACs or move status, did not open the quarantined Backlog.md clone.

Self-correction (2026-08-04, same session): the S5 note immediately above miscounted the deliverable's current line count as "460 after both fix-pass commits." Only the register was edited in this supplement's commit (61759e1); the deliverable itself was last touched in 16b60d7 (first fix pass) and has not changed since. `wc -l docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md` and `git show 16b60d7:<path> | wc -l` both confirm 443, not 460. Correcting in place here rather than leaving the wrong figure standing; no document content is affected, only this task's own prose.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: lore-doc owns gate policy, owning Lore components hold implementation/release evidence, and this task only consumes and maps that evidence.
---
<!-- COMMENTS:END -->
