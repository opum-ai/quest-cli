---
id: QCLI-57
title: Re-verify the Backlog.md v1.49.3 pin before Phase 1 exit
status: Done
assignee: []
created_date: '2026-08-08 21:42'
updated_date: '2026-08-14 12:17'
labels:
  - campaign
  - 'cluster:decisions'
  - wave-1
  - 'doc:stories/ratify-the-quest-cli-phase-1-component-decisions'
dependencies: []
documentation:
  - docs/stories/ratify-the-quest-cli-phase-1-component-decisions.md
priority: medium
type: chore
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

The delivery roadmap's Phase 1 exit carries one standing re-verification obligation beyond its decision table: the migration fidelity contract is pinned to Backlog.md **v1.49.3**, and its own recheck clause obliges re-checking that pin "before this phase's exit, or any freeze, whichever comes first." Every `FR-MIG` requirement rests on findings from that build.

This is the last Quest-owned item outstanding in Phase 1. Every other Phase 1 decision is recorded Closed (envelope shape, exit-code table, not-found convention on Quest's side, identifier grammar, license, platform, scale target, anomaly placement). The two that remain open are explicitly **not Quest's to make** — D6's product-wide actor model belongs to `quest-doc`, and the `lore-doc` half of the not-found convention belongs to that owner.

## Precision that matters

The roadmap already carries a correction worth heeding: QCLI-17 corrected an earlier claim that this re-verification was "overdue," which had inherited a since-corrected assertion that the pin was probably stale. It was not — the register records a verified 2026-08-05 registry state with `npm view backlog.md version` and `dist-tags.latest` both `1.49.3` and `time.modified` 2026-08-03.

So the expected outcome is confirmation, not drift. **Do not write this up as though drift were expected, and do not treat an unchanged pin as a null result** — an unchanged pin discharges a real obligation and should be recorded as such, with its date.

## Scope

Read-only registry verification plus a dated recording. This task decides nothing and re-pins nothing.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, as Phase 1's last Quest-owned exit obligation in a campaign scoped to what is required to begin implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 npm view backlog.md version, its dist-tags.latest, and its time.modified are re-run live and recorded with the observation date and literal output
- [x] #2 The observed result is compared explicitly against the recorded v1.49.3 pin, and the comparison's outcome is stated whether or not it changed
- [x] #3 The migration fidelity contract's recheck obligation is discharged with the new dated observation, or its continuing obligation is restated with reasoning if it cannot be
- [x] #4 If the pin moved, the consequence for the FR-MIG requirements resting on that build is named explicitly and the task does not silently re-pin; if it did not move, that is recorded as a positive discharge rather than omitted
- [x] #5 Moving references carry the re-verify qualifier and immutable anchors are stated flat, per the research programme Spec's convention
- [x] #6 Any edit to the open component decisions register is confined to this pin's recorded status; no other decision entry is altered
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Re-run the pinned build's live re-verification commands per the fidelity contract's own recheck clause and the register's recheck clause: `npm view backlog.md version`, `npm view backlog.md dist-tags.latest`, `npm view backlog.md time.modified`, plus the corroborating locally-installed-binary check `backlog --version` (also named by the fidelity contract's recheck clause). Capture literal output, dated 2026-08-08.
2. Compare the observed values against the recorded pin (v1.49.3, docs/reference/quest-cli-backlog-migration-fidelity-contract.md AC6) and the register's last-verified state (docs/reference/quest-cli-open-component-decisions.md, "The Backlog.md version-pin trigger" section, verified 2026-08-05: version/dist-tags.latest both 1.49.3, time.modified 2026-08-03T21:30:58.510Z). State the comparison outcome explicitly either way.
3. Because the scope note (AC6) confines any edit to "the open component decisions register" and to "this pin's recorded status", edit only docs/reference/quest-cli-open-component-decisions.md's existing "The Backlog.md version-pin trigger" section — append a new dated re-verification block for 2026-08-08, do not touch the fidelity contract document itself (its recheck clause is evergreen instructions, not a dated log) and do not touch any other decision entry in the register.
4. If unchanged (expected, per QCLI-17's correction that drift was never the likely outcome): record it explicitly as a positive discharge of the Phase 1 exit recheck obligation, with the observation date — not omitted as an unsurprising null result. If changed: name the consequence for the FR-MIG requirements resting on the pinned build, and do not silently re-pin — leave the changed fact for the fidelity contract's owner to rule on.
5. Apply the moving-vs-immutable convention (research programme Spec) to every new sentence written: `npm view ... version`, `dist-tags.latest`, and `backlog --version` are moving references -> `<value> (observed 2026-08-08; moving reference, re-verify before relying)`; a published release timestamp (`time.modified`) is an immutable anchor -> stated flat.
6. Do not touch docs/reference/quest-cli-activation-gate-evidence-record.md (QCLI-56's file) or backlog/qcli-60 territory (campaign skill).
7. Run `lore check --strict` (must report 0 errors/0 warnings) after the doc edit; run `lore sync` first only if check reports drift.
8. Record implementation notes on QCLI-57 with the literal captured command output, dates, and a per-acceptance-criterion evidence trail (#1-#6).
9. Commit with project style, `Refs: QCLI-57` as the literal last trailer line; verify with `git log -1 --format=%B | git interpret-trailers --parse`; push `-u origin chore/qcli-57-backlog-pin-reverify`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Re-verification run, 2026-08-08

Commands re-run live against the npm registry and this worktree's installed binary, 2026-08-08T21:47:45Z:

    $ npm view backlog.md version
    1.49.3
    $ npm view backlog.md dist-tags.latest
    1.49.3
    $ npm view backlog.md time.modified
    2026-08-03T21:30:58.510Z
    $ backlog --version   (/Users/jdnewhouse/.bun/bin/backlog)
    1.49.3

## Comparison against the recorded pin

- Migration fidelity contract (docs/reference/quest-cli-backlog-migration-fidelity-contract.md, AC6): pinned v1.49.3, set 2026-08-04.
- Open component decisions register's prior verified state (2026-08-05): version 1.49.3, dist-tags.latest 1.49.3, time.modified 2026-08-03T21:30:58.510Z.
- 2026-08-08 observation: identical on all three fields, plus a corroborating `backlog --version` = 1.49.3 from the locally installed binary. The pin has NOT moved. The version-pin trigger has still not fired.

## Recheck obligation disposition

The migration fidelity contract's recheck clause ("re-run before this phase's exit, or any freeze, whichever comes first") is discharged by this dated observation. Per the task's own guidance and QCLI-17's prior correction, this is recorded as a positive discharge, not a null result — the register's "Backlog.md version-pin trigger" section (docs/reference/quest-cli-open-component-decisions.md) now carries a new dated block for 2026-08-08 alongside the existing 2026-08-05 record (not overwriting it), and the section heading is extended to note the re-verification date and this task id.

## Edit scope (AC#6)

Only the "Backlog.md version-pin trigger" section of docs/reference/quest-cli-open-component-decisions.md was touched (heading + one new appended block). No other decision entry (D1-D7b, contract-level open items, external blockers, boundary decisions, residual items) was edited. docs/reference/quest-cli-backlog-migration-fidelity-contract.md was read but not edited -- its recheck clause is evergreen instructions, not a dated log, so there is nothing in it for this observation to update. docs/reference/quest-cli-activation-gate-evidence-record.md (QCLI-56's file) was not opened for editing and was not touched.

## Moving vs. immutable treatment (AC#5)

- `npm view backlog.md version`, `npm view backlog.md dist-tags.latest`, and `backlog --version` are recorded as moving references, each with `(observed 2026-08-08; moving reference, re-verify before relying)`.
- `npm view backlog.md time.modified` (a release timestamp) is recorded as an immutable anchor, stated flat with no qualifier, per the research programme Spec's "Moving vs. immutable references" subsection's own worked example (a release timestamp is named there as an immutable-anchor case).

## Per-acceptance-criterion self-assessment

- #1: `npm view backlog.md version`/`dist-tags.latest`/`time.modified` re-run live 2026-08-08, literal output captured above and in the register.
- #2: Comparison against the recorded v1.49.3 pin stated explicitly in the register's new block and above; outcome: unchanged.
- #3: Recheck obligation discharged with the new dated observation (register block, this task).
- #4: Pin did not move -- recorded as a positive discharge with its date, not omitted. (The "if moved" branch -- naming an FR-MIG consequence and not re-pinning -- does not apply.)
- #5: Moving references carry the qualifier; the immutable anchor (time.modified) is stated flat. Verified by re-reading the appended register block.
- #6: Edit confined to this pin's recorded status within the register; no other decision entry touched.

## Verification

- `lore check --strict` -> `47 files, 0 errors, 0 warnings`.

## Out-of-scope discoveries

None. No new drift, gap, or contract inconsistency was surfaced while doing this read-only verification; the fidelity contract and register were read exactly as scoped, nothing further opened.

## Fix pass 1 — reviewer request_changes correction (2026-08-08)

The mandatory reviewer returned request_changes on this task's original commit
(e235194). AC#5 (moving-vs-immutable classification) was wrong, not merely
imprecise: the register classified npm view backlog.md time.modified as an
immutable anchor. **That classification is incorrect and is corrected here,
not restated.**

**Empirical disproof, re-run independently this pass:**

    $ npm view backlog.md time --json
    time.modified   = 2026-08-03T21:30:58.510Z
    time["1.49.3"]  = 2026-08-03T21:30:58.182Z
    identical?        False (328ms apart)

`time.modified` is the packument's last-modified time, a property of the
whole package document, not the publish timestamp of 1.49.3 specifically.
The two values are only near-identical right now because 1.49.3 happened to
be the package's most recent write. `time.modified` advances on any later
write to the package -- a new publish, a deprecation, an unpublish, a
dist-tag change, an owner change -- which is exactly the "whether a newer
version now exists" event the original (wrong) justification named as safe.
The Spec's Moving vs. immutable references subsection lists "a release
timestamp" among its immutable-anchor *examples*, so citing that label was
textually defensible; the error was applying the label without testing the
behavior the category is actually defined by ("a fact that can change on the
next observation without any document edit ... a re-runnable query result
rather than a fixed record"). time.modified fails that test; it is corrected
to a moving reference in the 2026-08-08 block. time["1.49.3"] (the true,
immutable publish timestamp of the pinned release) is now cited alongside it
as the flat immutable anchor this section can rely on.

Also corrected this pass: a direct-quotation misattribution (the phrase
"before this phase's exit, or any freeze, whichever comes first" was quoted
as if from the fidelity contract's recheck clause and/or this register's own
trigger sentence; neither contains it verbatim -- it is the delivery
roadmap's QCLI-17 correction-note wording, docs/specs/quest-cli-delivery-roadmap.md:137
-- now attributed there), and an inaccurate description of the worktree's
`backlog` binary as worktree-local (it is the user-global bun install on
PATH, /Users/jdnewhouse/.bun/bin/backlog, shared by every worktree).

The 2026-08-05 block (verified state, and QCLI-17's correction note above it)
is untouched -- out of this pin's scope and explicitly out of bounds per the
Spec's "Scope of the convention" disclaimer against retroactive rewrite.

## Settlement (doc-14 wave 1, orchestrator)

Merged to \`dev\` as squash commit \`5c24b48\` (PR #71). Review: two passes, \`request_changes\` then \`approve\`, all six ACs independently confirmed at tip \`eabd779\`.

**Result: the pin has not moved.** \`npm view backlog.md version\` and \`dist-tags.latest\` both \`1.49.3\`; \`time.modified\` \`2026-08-03T21:30:58.510Z\`; local \`backlog --version\` \`1.49.3\`. Reproduced independently by the reviewer at 21:54:18Z, seven minutes after the worker's 21:47:45Z observation — all four values identical. Phase 1's last standing Quest-owned exit obligation is discharged.

**Blocking finding, and why it mattered more than a typo.** \`time.modified\` was classified as an *immutable anchor* and stated flat. It is a *moving reference*: it is the packument's last-modified timestamp, not \`1.49.3\`'s publish time — verified empirically, \`time.modified\` = \`…58.510Z\` versus \`time["1.49.3"]\` = \`…58.182Z\`, 328ms apart across a 227-version packument — and it advances on any later write to the package (publish, deprecate, unpublish, dist-tag change, owner change). The justifying sentence named its own mutator.

The reason it slipped through is instructive: the research programme Spec lists "a release timestamp" among its immutable-anchor *examples*, so the citation was textually defensible. The error was applying the label without testing the behaviour the category is actually defined by — "can it change on the next observation without a document edit?" That is precisely the failure mode this convention exists to prevent, in the one task devoted to exercising it.

The fix corrected the semantics rather than merely appending a qualifier, and added \`time['1.49.3']\` as the genuine flat anchor so the section retains a real immutable reference. The reviewer confirmed that value is immutable for a reason worth recording: npm forbids reusing a version number after unpublish, so no future event can produce a different value for that key.

**Scope boundary held.** The 2026-08-05 block carries the same flat treatment and was deliberately *not* retroactively corrected — the Spec's "Scope of the convention" disclaims retroactive rewrite and AC#6 confines edits to this pin's recorded status. The reviewer flagged over-correcting there as the likely breach; hunk boundaries confirm it did not occur.

**Second finding.** The obligation was quoted as "before this phase's exit, or any freeze, whichever comes first" and attributed to the fidelity contract. That string appears only in the delivery roadmap's QCLI-17 correction note; the contract's actual clause reads "Before relying on any table below, re-run…". The obligation was real; the quotation marks misattributed. Now credited to the roadmap for the *wording* while the trigger and contract clause remain what *oblige* the recheck — a division the reviewer judged more accurate than a bare fix.

**Known nit, deliberately not fixed.** The added \`npm view backlog.md time['1.49.3']\` is shell-dependent: correct under the \`bash\` fence as labelled, but zsh glob-expands the brackets and returns "no matches found," which a future reader could misread as the version having disappeared. Quoting the argument fixes it in both shells. Recorded here rather than spent on a third review pass; fold into any later touch of this section.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-verified the Backlog.md v1.49.3 pin and discharged Phase 1's last standing Quest-owned exit obligation.

What changed: the migration fidelity contract's recheck clause was re-run live (npm view backlog.md version, dist-tags.latest, time.modified, plus the locally installed backlog --version) and the result recorded as a dated block appended to the open component decisions register. The pin has not moved from 1.49.3, and that is recorded as a positive, dated discharge rather than omitted for being unsurprising -- an unchanged pin still retires a real obligation. The block also draws the distinction that it retires the obligation as it stood at Phase 1 exit, not the recheck clause itself, which remains in force.

Why: every FR-MIG requirement rests on findings from that build, and the contract obliges re-checking before Phase 1 exit or any freeze, whichever comes first.

How verified: mandatory review over two passes (request_changes then approve), all six criteria independently confirmed, with every registry value reproduced by the reviewer seven minutes after the worker's observation. The blocking finding was a misclassification of time.modified as an immutable anchor when it is a moving reference -- disproved empirically (time.modified differs from time["1.49.3"] by 328ms and advances on any later package write) and corrected, with time['1.49.3'] added as the genuine flat anchor. The 2026-08-05 block carrying the same treatment was deliberately left unrewritten per the Spec's disclaimer of retroactive rewrites. lore check --strict clean at 47 files; the fidelity contract itself was never edited, so no silent re-pin occurred.
<!-- SECTION:FINAL_SUMMARY:END -->
