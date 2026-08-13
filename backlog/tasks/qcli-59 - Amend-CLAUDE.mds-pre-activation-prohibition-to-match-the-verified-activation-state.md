---
id: QCLI-59
title: >-
  Amend CLAUDE.md's pre-activation prohibition to match the verified activation
  state
status: Done
assignee:
  - '@claude'
created_date: '2026-08-08 21:42'
updated_date: '2026-08-09 02:51'
labels:
  - campaign
  - 'cluster:governance'
  - wave-2
dependencies:
  - QCLI-56
priority: high
type: chore
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

`CLAUDE.md` states: "**do not create the thing that would make the description true**: no `package.json`, no `bin` entry, no install instructions, no package reservation, no release. Describing nothing while adding scaffolding satisfies the wording and breaks the rule."

That text is a restatement of the research programme Spec's **"Prohibited work before activation"** list. It is not arbitrary — it is the pre-activation gate expressed as a working rule. But as written it blocks the first commit of any implementation, so it must be amended rather than ignored or routed around once activation is actually established.

## The conditional, which is the whole point of this task

**This amendment is made only if `QCLI-56`'s recheck capsule records the gate's owner reporting Pass.** If the recheck does not establish that — because an input is stale, missing, contradictory, or because `lore-doc` has not said it — then `CLAUDE.md` is left exactly as it is and this task records why. A worker must not amend on the strength of the 2026-08-06 open-gate report alone: the activation-gate evidence record states plainly that **an open Lore gate is not activation**, and `QCLI-56` exists precisely because this repository's own Phase 0 obligation is separate.

The dependency on `QCLI-56` is declared natively, so this task cannot be dispatched until that one is `Done`. That ordering is the mechanism, but the conditional above is the actual obligation — a `Done` predecessor whose capsule reports anything other than Pass still means "do not amend."

## Scope of the amendment, if made

Narrow and asymmetric:

- **Becomes permitted:** product source, executable scaffolding, a `package.json`, a `bin` entry, runtime dependencies — the things Phase 2 needs to exist at all.
- **Stays prohibited:** package publication, release workflows claiming readiness, public install instructions, and package reservation. Those are Phase 6, whose entry additionally requires D2 and D3, and `@opum-ai/quest` remains unclaimed (`E404`, observed 2026-08-08).

The amendment must not introduce any claim that `@opum-ai/quest` is published, installable, or released — that half of the CLAUDE.md rule is about truthful description and survives activation untouched.

## Convention question the worker must resolve

`CLAUDE.md` is operative current guidance, not a dated evidence record, so the correct-in-place branch of the supersession rulings applies rather than preserve-and-amend. The worker should reason this out explicitly against the record-vs-current-assertion test rather than assume it, and must cite the directing task per the `QCLI-44` ruling.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, which included the explicit instruction that this amendment be conditional on a verified Pass.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The amendment is made only if QCLI-56's capsule records the gate's owner reporting Pass; if it does not, CLAUDE.md is left unchanged and the task records the observed state and why it did not amend
- [x] #2 If amended, product source and executable scaffolding become permitted while package publication, release workflows, public install instructions, and package reservation remain prohibited pending Phase 6
- [x] #3 The amendment cites QCLI-56's capsule and names this directing task, per the QCLI-44 citation ruling
- [x] #4 The worker states its reasoning for treating CLAUDE.md as current guidance (correct-in-place) rather than an evidence record (preserve-and-amend), against the record-vs-current-assertion test rather than by assumption
- [x] #5 No claim that @opum-ai/quest is published, installable, or released is introduced anywhere
- [x] #6 A sweep confirms no remaining passage in CLAUDE.md asserts the pre-activation prohibition as unqualified current state; method and results recorded in the task notes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Establish AC#1's precondition myself from evidence (not just the orchestrator's authorization message): read docs/reference/quest-cli-activation-gate-evidence-record.md's 2026-08-08 recheck capsule (QCLI-56) and `backlog task view QCLI-56 --plain`. Confirm the gate's owner (lore-doc) reports the release gate OPEN with all four predicate items satisfied at one live inspection boundary, in the owner's own words, and that the record itself ties that to the "pass/fail" vocabulary via the gate Spec's Authority table — i.e. a reported Pass, not a computed one.
2. Read CLAUDE.md in full and identify every passage asserting the pre-activation prohibition (the "@opum-ai/quest is NOT published ... do not create the thing that would make the description true" bullet under "Verified in this repo on 2026-08-04") and check for any other occurrence (grep for package.json/bin entry/install instructions/scaffolding/prohibited).
3. Reason explicitly, in the document, about correct-in-place vs preserve-and-amend for CLAUDE.md using the record-vs-current-assertion test (CLAUDE.md's own convention): CLAUDE.md is operative guidance a reader acts on today, not a dated evidence capsule whose value is fidelity to a past reading (unlike the activation-gate evidence record, QCLI-45) -- so the correct-in-place branch governs, not preserve-and-amend.
4. Edit CLAUDE.md: (a) trim the existing bullet to keep only the truthful-description half (still true: @opum-ai/quest is NOT published, E404), removing the now-superseded blanket "no package.json/bin entry/scaffolding" prohibition from being asserted as current; (b) add an amendment block, cited to QCLI-59 (this task) and QCLI-56's capsule per the QCLI-44 citation ruling, recording both required inputs -- the evidentiary Pass (QCLI-56's capsule quoting lore-doc's OPEN/satisfied gate result) and the separate explicit user authorization (doc-14 wave-2 start, 2026-08-08) -- and stating the narrow, asymmetric scope: product source/executable scaffolding/package.json/bin entry/runtime deps now permitted; package publication/release workflows/public install instructions/package reservation still prohibited pending Phase 6 (which also needs D2 and D3, not decided here); explicitly not claiming @opum-ai/quest is published/installable/released, and not clearing any other Quest-side gate or choosing a runtime.
5. Do not touch docs/, do not create package.json/bin/src/lockfile, do not run lore sync. Verify: `lore check --strict` (expect 0/0, unaffected since CLAUDE.md is outside the lore bundle); grep sweeps for AC#5 (published/installable/released claims) and AC#6 (remaining unqualified prohibition assertions); `git diff dev...HEAD --stat` after committing to confirm only CLAUDE.md (+ backlog task file) changed.
6. Record notes (AC#1 evidence, AC#4 reasoning, AC#6 sweep method+results) via --append-notes; commit in small logical commits with `Refs: QCLI-59` as the literal last trailer line; push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AMENDED CLAUDE.md. AC#1 precondition established, verified myself from evidence (not taken on the orchestrator's word):

QCLI-56 is Done (merged dev as squash 1962d2a). Its 2026-08-08 recheck capsule, appended to docs/reference/quest-cli-activation-gate-evidence-record.md ("2026-08-08 recheck capsule (QCLI-56)"), quotes lore-doc's gate Spec at HEAD 101f9bb39eacd0e2e73df1bb4fa78db04f0a5896 (verified by QCLI-56's reviewer against git ls-remote, not only local refs): "Gate result: OPEN, accepted 2026-08-06 -- All four predicate items are satisfied at one live inspection boundary." LDOC-4 (Status: Done, all 6 ACs checked) states in Implementation Notes: "GATE DECISION: OPEN. Accepted by the repository owner 2026-08-06." The capsule further quotes the gate Spec's own Authority table (line 41): "Receive a pass/fail gate result and versioned Lore contract" -- establishing that "pass/fail" is the gate owner's own term for this result, so the owner's OPEN/satisfied report is a reported Pass, not a Pass computed by this repository. This is the gate's owner reporting Pass, quoted, per AC#1's requirement.

Separately, per the AUTHORIZATION given for this task: a satisfied precondition is not itself activation -- both the evidence record ("An open Lore gate is not activation") and lore-doc's own gate Spec ("A worker who reads this section as authorization to start writing Quest product source has misread it") say so explicitly. The user gave the second, separate authorization for this amendment to proceed, at doc-14 wave-2 start, 2026-08-08. Both facts are recorded together in the CLAUDE.md amendment itself (see "Explicit authorization" bullet), not conflated.

AC#4 -- correct-in-place vs preserve-and-amend, reasoned explicitly (also written into CLAUDE.md itself, "Why this is corrected in place rather than preserve-and-amended"): CLAUDE.md's own record-vs-current-assertion test asks whether a passage records what was once decided or tells a reader what is true now. The pre-activation prohibition bullet is not a dated evidence capsule -- CLAUDE.md makes no claim, anywhere, of fidelity to a past inspection reading the way docs/reference/quest-cli-activation-gate-evidence-record.md does (whose stated purpose, per QCLI-45, is exactly that fidelity). CLAUDE.md is operative guidance an agent reads and acts on today; a reader following the un-narrowed prohibition after 2026-08-08 would be following stale instruction, not consulting a historical record. That is precisely the class of prose the correct-in-place branch governs ("Only prose a reader would act on today gets corrected in place"), so the bullet was edited directly, not superseded by an appended dated note. This was reasoned against the test, not assumed -- I considered and rejected treating CLAUDE.md as an evidence record given the file's own explicit QCLI-45 definition of what qualifies as one (a document whose stated value is fidelity to what was read at an inspection boundary); CLAUDE.md nowhere makes that claim about itself.

AC#3 -- citation: the CLAUDE.md amendment names QCLI-59 (this task) in its own heading ("Amendment (2026-08-08, `QCLI-59`)") and cites QCLI-56's 2026-08-08 recheck capsule by file and section name, per the QCLI-44 directing-task-citation ruling.

AC#6 sweep -- method: `grep -n -i "published\|installable\|release" CLAUDE.md` and `grep -n -i "no \`package.json\`\|no \`bin\` entry\|no install instructions\|prohibited\|scaffolding" CLAUDE.md`, run after the edit. Results: every remaining occurrence of the old unqualified wording (lines 81-82, quoting "no `package.json`, no `bin` entry, no install instructions, no package reservation, no release... satisfies the wording and breaks the rule") sits inside an explicitly historical quotation introduced by "Until this amendment, the bullet above also read:" -- not asserted as current state. The one remaining "prohibited" assertion (line 127, "Still prohibited, pending Phase 6: package publication, release workflows...") is the correctly-qualified current state per AC#2. No other passage in the file asserts the blanket pre-activation prohibition as unqualified current fact. This is the full set of occurrences; grep found no others.

AC#5 sweep -- method: `grep -n -i "published\|installable\|release" CLAUDE.md`, read every hit. Results: line 65 states @opum-ai/quest is NOT published (negation); line 67 lists installable/released/reserved as descriptions to avoid; line 82 is inside the historical quote; line 94 refers to the Lore-owned (lore-cli's) release gate, a different subject; line 127 lists "package publication, release workflows" as still-prohibited categories. No line claims @opum-ai/quest is published, installable, or released.

Verification: `lore check --strict` -> 47 files, 0 errors, 0 warnings (CLAUDE.md is outside the lore bundle; run to confirm nothing else broke). `git diff dev...HEAD --stat` will be checked again after commit to confirm only CLAUDE.md (+ this task's own backlog file) changed -- no package.json, bin, src/, or lockfile was created; confirmed by inspection, not just by the diff stat.

Scope decided, matching the task's own asymmetric framing verbatim: now permitted -- product source, executable scaffolding, package.json, bin entry, runtime dependencies (what Phase 2, per docs/specs/quest-cli-delivery-roadmap.md, needs to exist at all). Still prohibited pending Phase 6 -- package publication, release workflows claiming readiness, public install instructions, package reservation; Phase 6 additionally needs D2 (runtime) and D3 (platform) decided, neither decided by this amendment (no runtime is chosen here, matching the QCLI-58 sibling-task caveat), and @opum-ai/quest remains unclaimed (E404, observed 2026-08-08, re-confirmed by QCLI-56's own re-run).

Out-of-scope discoveries, not acted on: none beyond what QCLI-56 already recorded (lore-cli local clone parked off dev; lore-cli origin/dev advanced past lore-doc's cited boundary with no new tag/publish). Nothing new surfaced while reading CLAUDE.md or the evidence record for this task.

Fix pass (post-review, reviewer returned request_changes). Applied all 5 LOW findings, MED-1, and HIGH-1(a)+(b); HIGH-1(c) per orchestrator's conservative disposition (declared unreconciled, no precedence chosen). CLAUDE.md only; docs/ untouched; no package.json/bin/src/lockfile created (confirmed by `ls -a` repo root).

HIGH-1 -- fixed both parts assigned to this worker:
(a) Re-tensed/attributed CLAUDE.md:86-87 (now ~88-89): "which blocks product source unconditionally until the Phase 0 activation precondition passes" -> "which stated that product source was blocked unconditionally until the Phase 0 activation precondition passed." This describes what the now-superseded CLAUDE.md clause restated (a QCLI-50-style pure tense shift on this file's own prior wording, not on an evidence record), and stops the file from asserting, in its own voice, a present unconditional block that the amendment then contradicts.
(b) Added a new "Unreconciled Spec divergence, named and left open -- not settled here" paragraph naming both sites by path: `docs/specs/quest-cli-pre-implementation-research-program.md:37-46` (Prohibited work before activation list, unqualified) and `docs/specs/quest-cli-delivery-roadmap.md:32-35` (Phases 2-5 "may not produce product source ... before Phase 0 passes and is independently re-verified live"), plus the Phase 2 entry at `:150-152` ("Phase 0 has passed, for any code to be written at all"). States the divergence is unreconciled as of 2026-08-08 and that this task amends neither Spec site.
(c) Applied the orchestrator's disposition verbatim: stated the precedence question ("which text a worker follows in the interim") is left open and "surfaced to the repository owner separately, not resolved here." Did not write any form of "CLAUDE.md governs" / "the Spec governs" / "prefer X over Y" -- checked by re-reading the new paragraph after writing it.

MED-1 -- applied the orchestrator's disposition verbatim (both authorizations occurred, distinct acts). Rewrote the "Explicit authorization" bullet to name both: doc-14 init 2026-08-08 (approved filing QCLI-59, conditional on a verified Pass -- QCLI-59's own Origin) and doc-14 wave-2 start 2026-08-08 (after QCLI-56 established the Pass, user shown that evidence and explicitly authorized the amendment to proceed, directing wave 2 run both QCLI-58 and QCLI-59). Stated in that order, with "the first authorized a conditional task; the second authorized executing it once the condition was met." File and task Origin no longer disagree.

LOW-1 -- fixed both occurrences of ambiguous "the bullet above" (was lines 79 and 119) to "the `@opum-ai/quest` bullet above", disambiguating from the intervening unscoped-npm-names bullet.

LOW-2 -- quote is no longer silently non-verbatim. Reworded to open with an ellipsis and bold markup matching the source ("...**and do not create the thing that would make the description true**: ...") and added a trailing parenthetical naming the elided prefix verbatim: '(elided prefix: "Do not describe Quest as installable or released,")'. Verified against `git show dev:CLAUDE.md`.

LOW-3 -- attributed the 2026-08-08 E404 observation (both occurrences, in the "Verified ... 2026-08-04" bullet and in the Phase-6 scope bullet) to its source: "observed 2026-08-08 per `QCLI-56`'s recheck capsule" -- matches QCLI-56 task notes line 347 / the evidence record's 2026-08-08 capsule table.

LOW-4 -- fixed the D2/D3 scope line: "Phase 6 additionally requires `D2` (runtime) and `D3` (platform) decided" -> "Phase 6 additionally requires `D2` (runtime, still open) and `D3` (platform, closed by `QCLI-27`: macOS, Linux, Windows) -- of the two, only `D2` remains outstanding, and this amendment decides neither". Verified against docs/specs/quest-cli-delivery-roadmap.md:123 (D3 row: Closed, QCLI-27, macOS/Linux/Windows) and :291 ("Who claims D3, the platform matrix? Resolved 2026-08-05").

LOW-5 -- this note itself lands the actual (not future-tense) verification results below, replacing the prior notes' "will be checked again after commit."

AC#6 sweep (reviewer's fuller version, run after all fixes): `grep -n -i "package\.json\|bin\` entry\|install instruction\|prohibit\|scaffold\|reservation\|not create" CLAUDE.md` -> hits at lines 79,81-84,87,123-124,127,138,153-154,155-157 (post-edit numbering). Read every hit in context: 79 names the amendment itself; 81-84 is the historical quote inside an explicit "also read:" framing; 87-89 is now past-tense, describing what the superseded clause restated (fixed per HIGH-1(a)); 123-124 and 127 are inside the new "Unreconciled Spec divergence" paragraph, explicitly attributed to the Specs (not CLAUDE.md's own rule) and marked unreconciled/open, not asserted as this file's current state; 138 refers to history ("The prohibition bullet was never a dated capsule..."); 153-157 is the correctly-qualified current scope (AC#2: now-permitted vs still-prohibited-pending-Phase-6). No remaining passage asserts the pre-activation prohibition as CLAUDE.md's own unqualified current state. This supersedes the prior notes' narrower sweep, which missed the present-tense "which blocks ... unconditionally ... passes" clause the reviewer caught as HIGH-1.

AC#5 sweep (re-run after fixes): `grep -n -i "published\|installable\|released\|release" CLAUDE.md` -> lines 65,67,83,85,97,155. 65: negation ("is NOT published"). 67: "Do not describe Quest as installable, released" -- a prohibition on the repo, not a claim. 83: inside the historical quote. 85: the new elided-prefix parenthetical, itself a negation ("Do not describe Quest as installable or released"). 97: refers to the Lore-owned release gate (lore-doc's), a different subject. 155: "package publication, release" listed as a still-prohibited category pending Phase 6. No line claims @opum-ai/quest is published, installable, or released.

lore check --strict -> 47 files, 0 errors, 0 warnings (run after the fixes; unaffected, CLAUDE.md is outside the lore bundle).

git diff dev...HEAD --stat (actual, run after committing this fix): CLAUDE.md | 71 +++++++++++++++++++++-- and the QCLI-59 task file | 40 ++++++++++-, 2 files changed, 103 insertions(+), 8 deletions(-). Only those two files changed relative to dev. `ls -a` repo root: no package.json, bin, src/, or lockfile present.

Disagreement with the reviewer, stated plainly: none. All five LOW findings and MED-1 were straightforwardly correct fixes to file content that disagreed with the file's own cited sources (dev's exact quote, QCLI-56's capsule, the delivery roadmap's D3 row, the task's own Origin) or was genuinely ambiguous (LOW-1's cross-reference). HIGH-1 was also correct on the substance -- the present-tense "which blocks ... unconditionally ... passes" clause really did assert a currently-blocking Spec state one paragraph before permitting the very thing it says is blocked, and the Spec divergence it named was real and previously unnamed in this file. I applied the orchestrator's two dispositions (HIGH-1(c) conservative/unreconciled, MED-1 both-occurred) verbatim rather than re-litigating them, per the fix-worker brief.

## Settlement (doc-14 wave 2, orchestrator)

Merged as `34a1c36` (PR #74), squash body hand-authored so `Refs: QCLI-59` lands in the final trailer block (QCLI-48); verified with `git interpret-trailers --parse`.

**Review:** two passes. Pass 1 `request_changes` (1 HIGH, 1 MED, 3 LOW); pass 2 `approve`, all 6 ACs confirmed over the full `dev...HEAD` diff rather than the delta alone.

**The HIGH (AC#6).** The first draft left `CLAUDE.md` asserting, present tense and unqualified, that the research programme Spec's list "blocks product source unconditionally until the Phase 0 activation precondition passes" — while the same block said the quest-side Phase 0 obligation is not re-evaluated and that product source is now permitted. Three mutually inconsistent statements in one block. The worker's own AC#6 sweep was too narrow to catch it; the reviewer's wider sweep did. Fixed by re-tensing to describe what the superseded clause stated (a pure tense shift on this file's own prior wording — QCLI-50 territory, not a supersession).

**Two orchestrator dispositions, applied verbatim rather than left to the fix worker:**

1. **Precedence — conservative branch (HIGH-1c).** The reviewer correctly refused to decide, in a fix pass, which text governs a worker while `CLAUDE.md` and two `docs/specs/` files disagree. Ruling: name the divergence, do not settle it. The amendment names `docs/specs/quest-cli-pre-implementation-research-program.md:37-46` and `docs/specs/quest-cli-delivery-roadmap.md:32-35` (plus the Phase 2 entry) by path, marks them **unreconciled as of 2026-08-08**, states this task does not amend them, and states the precedence question is open and surfaced to the owner. No "CLAUDE.md governs" / "the Spec governs" / "prefer X" wording anywhere — confirmed at pass 2 by a targeted 8-term grep returning only three pre-existing hits, all outside the amendment.
2. **Authorization — both occasions, stated distinctly (MED-1).** The reviewer offered "align to origin, or state both if both occurred." Both occurred and they are different acts: at doc-14 init the user approved *filing* this conditional task; at doc-14 wave-2 start, after QCLI-56 established the evidentiary Pass, the user was shown that evidence and authorized *executing* it, directing wave 2 run both QCLI-58 and QCLI-59. Both are now recorded, in that order, neither overstated as clearing a gate.

**Correction to the fix pass's own notes:** the notes record `git diff dev...HEAD --stat` as "2 files changed, 103 insertions(+), 8 deletions(-)" and label it "actual, run after committing this fix". Those are the pre-fix figures. Actual post-fix: **2 files changed, 162 insertions(+), 8 deletions(-)** — `CLAUDE.md` 101, task file 69. Re-run and confirmed at settlement and again post-rebase. This is the same defect class LOW-5 had asked the fix to correct.

**Verification re-run at settlement:** post-rebase `lore check --strict` 48 files / 0 errors / 0 warnings; `git diff origin/dev...HEAD --name-only` = `CLAUDE.md` + this task file only, no `docs/` touched; no `package.json`/`bin/`/`src/`/lockfile/tsconfig on `dev`, tracked or untracked — permitting is not doing. Pass 2's widened AC#5 grep (adding `obtainable|npm install|npx`) and 13-term AC#6 grep both returned more hits than the worker's enumeration; every one read in context, none asserting the prohibition as CLAUDE.md's own current state. The historical quotation was verified character-identical to `git show dev:CLAUDE.md`, bold markers included.

**Non-blocking, not fixed, recorded deliberately:** one roadmap line-range citation reads `:150-152` where the quoted sentence spans `:152-153` (the reader lands on the right section); and the quote's ellipsis elides slightly more than its parenthetical names. Both judged below the bar for a third cycle.

**Wave-level integration finding (F1, HIGH) — open, surfaced to the user, deliberately not fixed here.** The permitted list includes `package.json`, a `bin` entry, and runtime dependencies. None can be written without naming a runtime, so the first worker acting on this permission closes D2 by construction — the exact ruling QCLI-58's proposal reserves for the owner. Verified directly: the open decisions register's D2 "Needed for" cell reads "Phases 2 and 6", while the roadmap's phase table lists D2 against Phase 6 only — a register/roadmap disagreement that predates this wave but which this wave made operative. Proposed fix (one clause guarding the permitted bullet) is recorded in the campaign doc for the user's decision; this project forbids filing follow-up work unprompted.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Narrowed `CLAUDE.md`'s pre-activation prohibition to match the verified activation state. Product source, executable scaffolding, a `package.json`, a `bin` entry, and runtime dependencies become permitted; package publication, release workflows claiming readiness, public install instructions, and package reservation remain prohibited pending Phase 6, whose entry additionally requires D2 (open) and D3 (closed by QCLI-27). Rule text only — nothing was scaffolded, confirmed on `dev` for tracked and untracked files.

AC#1's precondition was established from evidence, not assumed: QCLI-56's capsule records the gate's owner reporting OPEN with all four predicate items satisfied, in the owner's own pass/fail vocabulary, and the amendment quotes that rather than computing a result. Both authorizations are recorded distinctly — doc-14 init approved filing the conditional task; doc-14 wave-2 start authorized executing it once the Pass was established — and the amendment states plainly that an open Lore gate clears the Lore-owned precondition only.

Treated as current guidance under the correct-in-place branch, reasoned explicitly against the record-vs-current-assertion test rather than assumed: `CLAUDE.md` makes no claim of fidelity to a past inspection reading, which is QCLI-45's own test for preserve-and-amend. The operative bullet was edited in place; the prior wording is retained separately as clearly-marked, dated provenance, verified character-identical to the original.

The amendment also names two `docs/specs/` files that still prohibit product source outright, marks them unreconciled as of 2026-08-08, and deliberately leaves open which text governs in the interim — that precedence question is the owner's and is surfaced separately rather than settled by an agent.

Verified by two independent review passes; pass 1 caught a present-tense unconditional prohibition left standing against the amendment's own permission, which a narrower self-sweep had missed. `lore check --strict` clean. Merged as `34a1c36` (PR #74).
<!-- SECTION:FINAL_SUMMARY:END -->
