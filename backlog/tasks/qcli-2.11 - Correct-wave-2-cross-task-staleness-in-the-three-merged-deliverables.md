---
id: QCLI-2.11
title: Correct wave-2 cross-task staleness in the three merged deliverables
status: Done
assignee:
  - '@jdnewhouse'
created_date: '2026-08-04 14:34'
updated_date: '2026-08-04 22:57'
labels:
  - campaign
  - research
  - provenance
  - correction
  - no-implementation
  - 'cluster:provenance'
  - wave-3
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
dependencies: []
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: docs
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Three wave-2 sibling merges each invalidated text in another. Every defect below was correct when written and reviewed; a later merge made it stale. Exact replacement wording for every location is recorded in the wave-2 integration review captured in campaign doc doc-1, and every underlying command was re-verified live on 2026-08-04.

Scope is documentation correction only: no product source, runtime dependency, executable scaffolding, package reservation, publication, or release. Do not re-open any classification, disposition, or acceptance criterion that a wave-2 review already confirmed.

Sites:
1. docs/reference/quest-cli-packaging-contract.md lines 166 and 189 quote the source registers pre-widening permitted use ("cite existence, version, license, and claimed repository only"). QCLI-2.7 widened then bounded that slice; it now enumerates seven fields exhaustively. Line 189s framing must also change from "unresolved tension routed to QCLI-2.7" to a record that QCLI-2.7 closed it — as written it is internally inconsistent with its own evidence table 120 lines above, which already cites maintainers and descriptions.
2. docs/reference/quest-cli-research-source-register.md asserts "846f054^ is c5ebee8". It is 3023468 ("chore(backlog): sync task changes"). Every claim the parenthetical supports is true: c5ebee8 IS the last commit to touch the former path before the rename, established by `git log -1 846f054^ -- docs/reference/opum-fleet-and-prior-art-inventory.md`, and IS an ancestor of 846f054.
3. docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md line 64 records "reachability re-verified" as its method for a content claim (a 14-row remote register and 24-row fleet register). This is the third instance of the same method-vs-claim substitution; the register has already repudiated it in identical wording. QCLI-2.2s own lines 108-113 show it actually performed the content read, so this understates work already done.
4. The d7ca18f currency contradiction: register lines 61 and 138 assert it as opum-doc HEAD while line 112 declares it "already a stale pin by 2026-08-04". d7ca18f is dated 2026-08-01 18:53; opum-doc advanced at 07:49 on 2026-08-04. QCLI-2.2 inherits the same pin across eight sites, four of which carry no read date at all.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Neither line 166 nor line 189 of the packaging contract states or paraphrases the superseded four-field enumeration; both reflect the current exhaustive field list, and line 189 records the gap as closed by QCLI-2.7 rather than open
- [x] #2 The source register states 846f054^ is 3023468 and attributes c5ebee8 via the command that actually establishes it, retaining the true 292-line and ancestry claims
- [x] #3 The legacy-requirement reconciliation records content verification rather than reachability for the Git recovery commits, consistent with the registers corrected slice and with the documents own body
- [x] #4 No document asserts d7ca18f as opum-doc HEAD; every citation of it is phrased as a dated pin and carries a read date
- [x] #5 lore check --strict, lore validate --strict, and lore orphans all report zero errors, zero warnings, and zero orphans, and no claim is altered beyond the corrections named in this task
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Independently re-verify each of the four Sites before touching any file (research phase):
   - Site 1: read quest-cli-packaging-contract.md lines 166/189 live and the register's
     "npm package name occupancy" slice live; confirm the register's permitted-use list is
     now a 7-field exhaustive enumeration (existence, version, license, claimed repository,
     maintainer identities, description text, publish/version history), widened 2026-08-04
     by QCLI-2.7, and that lines 166/189 still paraphrase/quote the old 4-field list.
   - Site 2: use the local /Volumes/external/repos/opum-doc checkout (has full Git history)
     to run `git log -1 --format='%H %s' 846f054^`, `git log -1 846f054^ -- docs/reference/
     opum-fleet-and-prior-art-inventory.md`, `git merge-base --is-ancestor c5ebee8 846f054`,
     and `git show 846f054^:docs/reference/opum-fleet-and-prior-art-inventory.md | wc -l` to
     confirm/refute the register's `846f054^ is c5ebee8` claim.
   - Site 3: read legacy-opum-requirement-reconciliation-for-quest-cli.md line 64 and its own
     lines 104-113 finding section; confirm the row's stated verification method ("reachability
     re-verified", `--stat`) mismatches the content read the document's own body performed
     (`git show d42c016:<path>` recovering the named table), and cross-check against the
     opum-doc checkout that the same section exists at 7b82afc too.
   - Site 4: grep all `d7ca18f` occurrences in the register and the legacy-reconciliation doc;
     classify each as a live "HEAD" assertion vs. an already-corrected/quoted-historical mention;
     confirm opum-doc's actual current HEAD has moved past d7ca18f (register's own text already
     records bee848a/7b512d9 superseding it same-day).
2. Implement only corrections confirmed real:
   - packaging-contract.md: line 166 (7-field list, not 4-field) and the AC1 paragraph around
     line 189 (record QCLI-2.7 closed the widening rather than "routed to QCLI-2.7").
   - research-source-register.md: fix the 846f054^ attribution to 3023468, keep c5ebee8 but
     attribute it via `git log -1 846f054^ -- <path>` (the command that actually establishes
     "last commit to touch the former path"), retain the 292-line and ancestry claims; rephrase
     the two live "opum-doc HEAD d7ca18f" assertions (former opum-cli identity slice, Historical
     OCLI Story/Spec/Runbook/task records slice) as dated-pin observations, not current HEAD.
   - legacy-opum-requirement-reconciliation-for-quest-cli.md: fix the Git-recovery-commits row's
     verification-method claim from reachability to content-verified; rephrase all "opum-doc HEAD
     d7ca18f" citations (8 sites: 7 matrix rows + 1 prose mention) as dated pins, adding a read
     date to every one that lacked it.
3. Run `lore check --strict`, `lore validate --strict`, `lore orphans`; verify each AC against
   the edited text.
4. Record verification commands/output in --append-notes; flag any premise mismatch found via
   --comment.
5. Commit in small logical commits (Refs: QCLI-2.11), run `lore sync` once, push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification performed, all four Sites re-verified live (not trusted from the task text):

SITE 1 (packaging-contract.md lines 166, 189) — CONFIRMED as described.
Live grep against docs/reference/quest-cli-research-source-register.md's "npm package name
occupancy" slice, permitted use, shows: "cite existence, version, license, claimed repository,
maintainer identities, description text, and publish/version history — registry metadata
limited to the fields enumerated above... This enumeration is exhaustive, not illustrative...
Widened 2026-08-04 by QCLI-2.7." Seven fields. `grep -n "cite existence\|narrower" docs/reference/
quest-cli-packaging-contract.md` before the fix showed lines 188-189 still quoting the
pre-widening 4-field list ("cite existence, version, license, and claimed repository only")
and line 166 paraphrasing the same 4 fields. Fixed both to the current 7-field list and
reframed the AC1 paragraph to record the gap as closed by QCLI-2.7 rather than open/routed.

SITE 2 (register's `846f054^ is c5ebee8` claim) — task's premise CONFIRMED WRONG, fix applied.
/Volumes/external/repos/opum-doc is a full local clone (not just the register's own citation)
with these commits present. Commands run there:
  $ git log -1 --format='%H %s' 846f054^
  3023468a22f78ca51e37855395f1931f9e29d3b0 chore(backlog): sync task changes
  $ git log -1 846f054^ -- docs/reference/opum-fleet-and-prior-art-inventory.md
  c5ebee8f83ab4f7eff14b2d176472dde178b201c docs: establish Opum SaaS documentation hub
  $ git merge-base --is-ancestor c5ebee8 846f054 && echo YES
  YES
  $ git show c5ebee8:docs/reference/opum-fleet-and-prior-art-inventory.md | wc -l
       292
  $ git show 846f054^:docs/reference/opum-fleet-and-prior-art-inventory.md | wc -l
       292
Confirms: 846f054^ is 3023468 ("chore(backlog): sync task changes"), not c5ebee8. c5ebee8 is
the last commit to touch the former path before the rename (established via `git log -1
846f054^ -- <path>`, not `git show 846f054^:<path> | wc -l`, which only proves line count).
c5ebee8 is an ancestor of 846f054. The file is 292 lines at both c5ebee8 and 846f054^/3023468 —
unchanged between them. All four downstream claims (292-line size, "immediately before the
rename," ancestry, unchanged-content) hold; only the `846f054^ is c5ebee8` identity and the
cited command were wrong. Register text corrected accordingly.

SITE 3 (legacy-reconciliation.md line 64, "reachability re-verified") — CONFIRMED as described.
Line 64's Revision column read "reachability re-verified live 2026-08-04 (`git show 7b82afc
--stat` / `git show d42c016 --stat`, both succeed)" — this only proves the commits exist and
touch the path. The same document's own finding section (then lines ~104-113) shows a real
content read was performed: `git show d42c016:docs/reference/opum-fleet-and-prior-art-
inventory.md` recovering the "Authoritative owned requirement sources" table naming
ADR-042/SPEC-FEAT-011/etc. Cross-checked against the opum-doc clone:
  $ git show d42c016:docs/reference/opum-fleet-and-prior-art-inventory.md | grep -n
    "Authoritative owned requirement sources"
  202:### Authoritative owned requirement sources
  $ git show 7b82afc:docs/reference/opum-fleet-and-prior-art-inventory.md | grep -n
    "Authoritative owned requirement sources"
  199:### Authoritative owned requirement sources
Both commits actually contain the section — content-verified, not merely reachable. Row's
Revision column corrected to state content verification, consistent with the register's own
already-corrected "Git recovery commits" slice and with this document's own body.

SITE 4 (d7ca18f currency contradiction) — CONFIRMED as described, with one count discrepancy noted.
`grep -n d7ca18f` on both files before the fix. Register: lines ~61 and ~138 asserted "opum-doc
HEAD d7ca18f" / "local HEAD d7ca18f" as a live fact; line ~90 quotes it inside "the prior text
asserted..." (already framed as superseded — left untouched); lines ~110-117 already correctly
call it "already a stale pin by 2026-08-04" superseded by bee848a/7b512d9 (QCLI-2.7's prior
fix — left untouched). Fixed the two live assertions (former opum-cli identity slice; Historical
OCLI Story/Spec/Runbook/task records slice) to read "opum-doc, pinned at d7ca18f as observed
2026-08-04 — a moving branch reference, not asserted current beyond that observation."
Legacy-reconciliation.md: 8 total d7ca18f occurrences (7 matrix rows + 1 prose mention in the
grep-sweep finding), matching the task's "eight sites" count. All 8 fixed to the same dated-pin
phrasing, with a read date (2026-08-04) added to every row that lacked one. Note: my own count
of undated rows before the fix was 5 (OCLI-3, the Spec, the Story, the Runbook, and the Dated
Opum fleet and prior-art inventory row), not the 4 the task text stated — the task's own count
appears to have excluded the "Dated Opum fleet and prior-art inventory" row's inline HEAD
mention, which also lacked an explicit date. Fixed all 5, not just 4; flagged via --comment.
Also confirmed opum-doc's own current local HEAD (5da8949, "docs: my own 'of any kind' rule had
the defect it was written to fix") has moved well past both d7ca18f and 7b512d9, reinforcing
that any bare "HEAD" assertion goes stale immediately and must be phrased as a dated pin.

GATES (run from the worktree root after all edits, before commit):
  $ lore check --strict
  19 files, 0 errors, 0 warnings
  $ lore validate --strict
  19 files, 0 errors, 0 warnings, 6 skipped (all "ok", 6 non-concept index/log files skipped)
  $ lore orphans
  orphans: 0 orphan tasks, 0 dangling links
  (none — every task has an owning doc, every linked task is live)
All three exit 0. No claim altered beyond the four Sites' named corrections.

Settlement (orchestrator, wave 3, 2026-08-04): reviewer independently confirmed all 5 ACs, including external re-verification of the 846f054^/3023468/c5ebee8 chain against a live /Volumes/external/repos/opum-doc clone (byte-identical blob diff, not just line count), and byte-identical Classification/Permitted-use fields versus dev confirming zero unauthorized reclassification. The worker's own premise-mismatch correction (5 undated d7ca18f sites found, not the task text's stated 4) was independently re-derived and confirmed correct. Merged as squash commit 3b5cd8c (PR #7). Gates on final merged dev: lore check --strict 21 files 0/0; lore validate --strict 21 files 0/0 6 skipped; lore orphans 0/0.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
created: 2026-08-04 15:10
---
Premise-mismatch finding for reviewer attention (not silently corrected, scope stayed within
AC4): the task text says the d7ca18f pin appears "across eight sites (in the legacy-
reconciliation doc), four of which carry no read date at all." My own live grep confirms eight
total occurrences (matches), but finds five without a read date, not four — the fifth being the
"Dated Opum fleet and prior-art inventory" matrix row, whose Revision cell said "...condensed
into the current path at commit `846f054` (120 lines); unchanged `846f054`→`opum-doc` HEAD
`d7ca18f` (independently re-verified via `git cat-file`/`git diff`, not copied from the
register)" — no explicit "2026-08-04" (or any date) attached to that HEAD clause, same defect
as the other four. AC4 requires every citation to carry a read date, so I fixed all five
undated rows (not just four) plus the three that already had dates, for eight total, rather
than leaving one out to match the task text's count. Author @jdnewhouse
---
<!-- COMMENTS:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Corrected 4 cross-task staleness sites surfaced by the wave-2 integration review, across quest-cli-packaging-contract.md, quest-cli-research-source-register.md, and legacy-opum-requirement-reconciliation-for-quest-cli.md: (1) reflects QCLI-2.7's widened 7-field permitted-use list and records the gap as closed rather than open; (2) fixes a false 846f054^ commit attribution (was c5ebee8, is 3023468) with the correct establishing command; (3) records content verification rather than reachability for the Git recovery commits; (4) rephrases all d7ca18f citations as dated pins (8 sites total — the worker found and fixed one more than the task text's stated 4, flagged and independently confirmed correct). No source reclassified, no permitted use narrowed. Verified via a single, thorough review pass with full external re-derivation.
<!-- SECTION:FINAL_SUMMARY:END -->
