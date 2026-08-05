---
id: QCLI-15
title: >-
  Audit two unresolved register findings: the untraceable Allowed value and
  QCLI-2.12's F4 and F5
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-05 12:32'
updated_date: '2026-08-05 12:55'
labels:
  - campaign
  - 'cluster:provenance'
  - register
  - audit
  - correction
  - no-implementation
  - 'doc:stories/follow-through-on-the-quest-cli-design-layer'
  - wave-1
  - merge-pending
dependencies: []
documentation:
  - docs/stories/follow-through-on-the-quest-cli-design-layer.md
priority: medium
type: spike
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two residual findings against the research source register were recorded in settlement notes and never filed. Both are audits first: confirming one is already closed is a valid and useful outcome, not a failure.

Finding A - QCLI-2.1 settlement recorded that the "Prior QCLI research records" slice is classified Allowed on sound reasoning, but that the specific classification value is not traceable to the task notes it cites. Two sibling findings from the same settlement were later closed by QCLI-2.7; this one was not.

Finding B - QCLI-2.12 notes state "F4/F5 (non-blocking, out of scope for this fix pass) - not touched; left for the orchestrator to track." No tracking record exists. Complicating this: the same task carries a separate escalation over findings also numbered F2, F3, and F4 from the wave-4 integration review, and that escalation was resolved on 2026-08-04 via the Option A self-pin. The two numbering schemes are different, so establish which F4 and F5 the out-of-scope note meant before assuming either is open.

Do not reclassify any source. This task closes a traceability gap and an audit gap, not an admission decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The Allowed classification on the named slice is either traced to admitting evidence, or the gap is recorded explicitly with what would close it
- [ ] #2 The F4 and F5 referenced by QCLI-2.12's out-of-scope note are identified against the correct numbering scheme, and each is recorded as already resolved or still open with evidence
- [ ] #3 No source slice classification value is changed by this task
- [ ] #4 Findings confirmed already closed are recorded as closed with the evidence that closed them, not silently dropped
- [ ] #5 Strict Lore gates pass: lore validate --strict, lore check, and lore orphans all report zero
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Investigated QCLI-2.1 (settlement residual findings), QCLI-2.7 (which closed 2 of 3 sibling findings), and QCLI-2.12 (both its own task file and the review-follow-up section) via backlog task view.
2. Finding A: confirmed via grep that QCLI-1/QCLI-3/QCLI-4's own task notes never discuss the register's Allowed/Contextual/etc. vocabulary (it postdates them, authored by QCLI-2.1 itself) - the Allowed value for 'Prior QCLI research records' traces only to the register's own Ownership-rationale reasoning (current, live quest-cli authored-requirement material), not to any classification statement inside the cited task notes. Per AC1, record this gap explicitly in that slice plus what would close it, without reclassifying.
3. Finding B: disambiguate the two F4/F5 numbering schemes by reading QCLI-2.12's task file directly. Scheme 1 = the pre-merge 'Review follow-up (2026-08-04)' pass (F1 blocking/AC7, F2 blocking/AC6, F3 non-blocking/fixed, F4/F5 non-blocking/out-of-scope/not touched) - this is literally where the quoted out-of-scope sentence appears. Scheme 2 = the wave-4 integration review's separate F2/F3/F4 (register enumeration + revision-pin + ledger attribution gaps), resolved 2026-08-04 via Option A self-pin, merged PR #17 squash c8dfdca - already closed, confirmed via task notes + campaign tracker (backlog/docs/campaigns/doc-1).
4. Searched exhaustively for scheme-1 F4/F5's actual content: QCLI-2.12 task notes, backlog/docs/campaigns/doc-1 and doc-3, archive/handovers/*.md, docs/reference/quest-cli-open-component-decisions.md (which independently records the same gap, corroborating scope but adding no content), git log including dangling/unreachable objects (git fsck), and GitHub PR #14 reviews/comments via gh api (all empty - this repo's review process isn't posted to GitHub, only summarized in backlog notes). Conclusion: scheme-1 F4/F5's substance was never recorded anywhere retrievable in this repository - only the one-line summary survives.
5. Record both findings in docs/reference/quest-cli-research-source-register.md: (a) a dated audit note in the 'Prior QCLI research records' slice for Finding A per AC1/AC3/AC4; (b) a dated audit note in the '## Notes' section (matching the existing QCLI-2.7/QCLI-2.12 narrative-note convention) for Finding B, naming the correct scheme, confirming scheme-2 is closed with evidence, and recording scheme-1 F4/F5 as still-open/untracked with the content-unrecoverable evidence and what would close it, per AC2/AC4.
6. No Classification field value changes anywhere (AC3) - verify via grep/diff before and after.
7. Run lore validate --strict, lore check, lore orphans; capture exact output (AC5).
8. Record decisions + gate evidence via --append-notes; commit docs/ changes (and docs/log.md if lore sync touches it) with Refs: QCLI-15 trailers; push branch.
9. Report out-of-scope observation: docs/reference/quest-cli-open-component-decisions.md's two rows for these exact findings are now stale (should say 'filed as QCLI-15' / 'resolved') but that file is out of my scope per the task brief.
<!-- SECTION:PLAN:END -->
