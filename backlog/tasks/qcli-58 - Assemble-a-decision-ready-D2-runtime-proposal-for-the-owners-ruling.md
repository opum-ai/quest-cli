---
id: QCLI-58
title: Assemble a decision-ready D2 runtime proposal for the owner's ruling
status: Done
assignee: []
created_date: '2026-08-08 21:42'
updated_date: '2026-08-14 12:18'
labels:
  - campaign
  - 'cluster:decisions'
  - wave-2
  - 'doc:stories/record-quest-cli-post-activation-design-rulings'
dependencies: []
documentation:
  - docs/stories/record-quest-cli-post-activation-design-rulings.md
priority: high
type: spike
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Context

D2 — the runtime choice — is the one Phase 1 decision recorded as **owned but not closed**. The license, platform, and runtime ownership record (`QCLI-27`) claims quest-cli ownership of the question; the choice itself was deferred as blocked pre-activation.

It is also the decision that most directly gates writing any product source at all: Phase 2 cannot produce code without knowing what it is written for, and Phase 6's entry names D2 and D3 explicitly.

## What this task is, and is not

**It does not decide.** D2 stays owned-not-closed until the owner rules. This task assembles the evidence and options so that ruling can be made against a real comparison rather than from memory, and the produced document must say plainly that it decides nothing.

The research programme Spec prohibits "freezing runtime ... choices whose required Lore evidence is unfinished." Lore's evidence is no longer unfinished — `@opum-ai/lore@0.1.1` is published and the Lore-owned gate is reported open — so preparing the comparison is allowed work. Freezing the choice is still the owner's act, not this task's.

## Inputs that must be weighed

- The recorded platform matrix: macOS, Linux, Windows, claimed as quest-cli-owned (`QCLI-27`).
- The packaging contract's constraints, including its mandatory release-time recheck clause.
- Lore's own shipped runtime — **as context whose relevance must be argued, not assumed.** Quest is a separate component with its own platform commitments; "Lore did X" is an input, not a reason.
- The architecture Spec's runtime-neutrality: it was authored deliberately runtime-neutral, so the proposal should identify which architectural boundaries a runtime choice would actually constrain and which it would not.

## Origin

Filed 2026-08-08 with the user's explicit approval at doc-14 init, in a campaign scoped to what is required to begin implementation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The proposal enumerates the candidate runtimes with their tradeoffs assessed against the recorded macOS/Linux/Windows platform matrix, citing QCLI-27 rather than restating it
- [x] #2 Each candidate's implications for Phase 6 packaging and clean-install verification are stated, citing the packaging contract's own constraints
- [x] #3 Lore's shipped runtime is cited as context with its relevance to Quest's choice argued explicitly, not assumed by precedent
- [x] #4 The proposal identifies which architecture-Spec boundaries a runtime choice would actually constrain and which are genuinely runtime-neutral
- [x] #5 The document states explicitly that it decides nothing and that D2 remains owned-not-closed pending the owner's ruling
- [x] #6 The open component decisions register's D2 entry points at the proposal with its status left unchanged
- [x] #7 No runtime is frozen, and no runtime dependency, package metadata, or executable scaffolding is added
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Scaffold a new Reference doc via `lore new reference "Quest CLI D2 runtime proposal"` (matches the existing quest-cli-scale-target-proposal.md / quest-cli-canonical-identifier-grammar-...-proposal.md precedent: a dated Reference in docs/reference/, not an ADR, since it proposes for owner ruling rather than recording an accepted decision).
2. Author the body:
   - Frame: QCLI-58's deliverable; cites D2 in the open component decisions register and QCLI-27's ownership ruling read-only; states up front and in closing that it decides nothing (AC5).
   - Candidate set: Node.js, Bun, Deno, and a compiled-native-binary approach (the packaging-contract's own committed npm/`@opum-ai/quest`/`quest` distribution model plus D2's "native packaging" framing makes this the realistic set) — tradeoffs assessed against the macOS/Linux/Windows matrix, citing QCLI-27's record rather than restating its ruling prose (AC1).
   - Each candidate's Phase 6 packaging + clean-install implications, citing the packaging contract's mandatory release-time recheck clause and its conditionality-of-public-claims section (AC2).
   - Lore's shipped runtime as argued (not assumed) context: live `npm view @opum-ai/lore` shows `engines: { bun: '>=1.3.14' }`, no `node` engine, bin `lore.cjs`. Argue relevance via the architecture Spec's own Lore port ("absent-by-default", subprocess/CLI+JSON boundary) and the lore-dependency-and-adapter-contract-evidence doc's BacklogAdapter subprocess pattern — the integration boundary is already runtime-neutral by design, so Lore's own runtime is circumstantial/ecosystem precedent, not a technical coupling requirement (AC3).
   - Architecture-Spec boundary analysis: cite the Spec's own open question ("no mechanism [for enforcing layering] is chosen, and one that depends on the runtime cannot be chosen until D2 is settled") plus the roadmap's note that the BB/TM scenarios aren't expressible as executable tests until D2 is settled, as the concretely runtime-constrained boundaries (layering enforcement, native packaging/distribution shape, adapter implementation effort, executable test harness) versus the ports-and-adapters shape, domain purity, Git trust model, durability tiers, error taxonomy/envelope, and operation shape, which the Spec already states or implies survive runtime choice (AC4).
3. Edit docs/reference/quest-cli-open-component-decisions.md's D2 table row ("Unblocked by" cell) and its "D2 — Runtime." prose bullet to add one dated, QCLI-58-cited sentence pointing at the new proposal, leaving the Status cell "**Blocked**" and every existing sentence untouched (AC6) — this is a factual addition in this document's own established citation style, not a supersession under the QCLI-44/45/50 rulings (nothing prior is corrected or invalidated).
4. Verify: `lore validate --strict` on the new file; `lore check --strict` on the bundle (do NOT run `lore sync` — orchestrator's job at settlement); re-read each AC against the actual file text with quotes; `git diff dev...HEAD --stat` to confirm AC7 (no package.json/bin/src/lockfile).
5. Record implementation notes with the commands run and their results, small logical commits each with a literal trailing `Refs: QCLI-58`, then push the branch. No `--check-ac`, no status change to Done, no campaign-doc edits.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented as a new Reference doc, docs/reference/quest-cli-d2-runtime-proposal.md, scaffolded via `lore new reference "Quest CLI D2 runtime proposal"`. Compares four candidates (Node.js, Bun, Deno, a compiled Go/Rust binary via npm's per-platform optionalDependencies shim pattern — included because the register's own D2 row bundles "runtime" with "native packaging") against the four inputs the task named:

- AC1: platform-matrix table cites QCLI-27's [license, platform, and runtime ownership record] for the macOS/Linux/Windows matrix rather than restating its ruling prose; notes Bun's Windows support is the youngest of the JS-family candidates', Node's the longest-standing, Deno's cross-compile flow the most uniform, and the compiled-binary candidate's platform maturity as a property of its language toolchain rather than any JS runtime.
- AC2: per-candidate Phase 6/clean-install table cites the packaging contract's "Recorded name (AC3)", "Mandatory release-time recheck clause (AC1)", and "Conditionality of public claims (AC4)" sections verbatim; each candidate's packaging shape (plain package vs SEA/`bun build --compile`/`deno compile` single-file binary vs npm optionalDependencies shim) and clean-install risk stated distinctly.
- AC3: live `npm view @opum-ai/lore <field>` evidence capsule (2026-08-09T02:12:37Z-02:12:40Z UTC): version 0.1.1, engines `{ bun: '>=1.3.14' }` (no `node` engine declared), bin `lore -> bin/lore.cjs`, dependencies none. Relevance argued, not assumed: cites the architecture Spec's Lore port ("absent-by-default") and the Lore-dependency-and-adapter-contract-evidence doc's BacklogAdapter subprocess/JSON pattern to show both integration directions are already a runtime-neutral subprocess boundary, plus the register's own "mirroring Lore's --json output would produce the wrong shape" finding as a precedent against inheriting Lore's choices by precedent. Concludes Lore's runtime is feasibility precedent for the packaging pattern only, not a technical coupling requirement.
- AC4: separates architecture-Spec boundaries a runtime choice actually constrains (the Spec's own "one [layering-enforcement mechanism] that depends on the runtime cannot be chosen until D2 is settled"; Phase 6 native-packaging shape; the roadmap's "neither [BB/TM scenario] is expressible as an executable test until D2 is settled"; port *adapter* implementations) from what the Spec itself frames as runtime-neutral (layering/dependency direction, domain purity, Git trust model, durability tiers, error taxonomy/envelope, operation shape).
- AC5: explicit "This document decides no runtime... D2 remains owned-not-closed" statement in both the opening and a dedicated closing section, plus the frontmatter summary.
- AC6: docs/reference/quest-cli-open-component-decisions.md's D2 table row ("Unblocked by" cell) and its "D2 — Runtime." prose bullet each get one new, dated, QCLI-58-cited sentence pointing at the proposal. Status cell and every pre-existing sentence left untouched — verified by diff (only additive text, no deletions in the D2 entry). Treated as an additive factual note in this doc's own established citation style, not a QCLI-44/45/50-style supersession, since nothing prior is corrected or invalidated.
- AC7: no package.json, bin/, lockfile, or src/ added — see verification commands below.

Verification run:
- `lore validate --strict` on both changed/created files individually: `ok`, 0 errors/warnings each.
- `lore validate --strict` (whole bundle): "48 files, 0 errors, 0 warnings, 6 skipped".
- `lore check --strict`: "48 files, 0 errors, 0 warnings" (run twice, before and after two post-review quote-precision fixes — a truncated Phase 6 exit-criteria quote completed to its full sentence, and a quote's capitalization corrected to match its source verbatim).
- `lore sync` was NOT run, per instructions (orchestrator's job at settlement). The bundle's reference index (docs/reference/index.md) therefore does not yet list the new document; `lore check --strict` passing 0/0 confirms this omission is not a drift/link/anchor error under the current gate.
- `git diff dev...HEAD --stat` was empty pre-commit (HEAD == dev, no commits yet on this branch) — re-verify post-commit.

Out-of-scope findings (not acted on):
- None beyond what doc-14's own tracker already records (D6/D7a/D7b, the lore-doc not-found boundary half) — nothing new surfaced by this task's reading.

Sources read (read-only): docs/reference/quest-cli-open-component-decisions.md, quest-cli-license-platform-and-runtime-ownership-record.md, quest-cli-packaging-contract.md, quest-cli-lore-dependency-and-adapter-contract-evidence.md, quest-cli-activation-gate-evidence-record.md, quest-cli-scale-target-proposal.md (structural precedent); docs/specs/quest-cli-architecture.md, quest-cli-delivery-roadmap.md, quest-cli-pre-implementation-research-program.md; docs/adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md; docs/stories/prepare-quest-cli-for-implementation-activation.md and follow-through-on-the-quest-cli-design-layer.md (both status: done, confirmed neither is this task's owning Story — this campaign's wave-1/2 decision-cluster tasks, e.g. QCLI-57, are not Story-linked either, so this task's document is likewise not `lore link`ed to any Story); backlog doc-14 (campaign tracker, read-only, not touched). Live npm registry checked read-only via `npm view @opum-ai/lore <field>` and `npm view @opum-ai/quest version` (still E404/unclaimed, unchanged). External vendor docs (Node.js SEA, Bun `--compile`, Deno `compile --target`) consulted via web search for the platform/packaging comparison tables, cited generically rather than per-URL since this corpus's citation convention is to internal documents and dated commands, not external web sources; flagged explicitly in the proposal's own Recheck clause as moving references an owner ruling should re-verify if materially stale.

Fix-worker pass (review request_changes -> fixes) on docs/reference/quest-cli-d2-runtime-proposal.md only:

- MED (Deno costless): added Deno's disclosed npm-interop constraint ("partial npm compatibility via `npm:` specifiers", already stated at L68) to the Phase 6/clean-install per-candidate table (Deno row, "Clean-install verification implication" column) and to the owner-facing summary table (Deno row, "Runtime-presence risk at clean-install" column) - same register as the other three candidates' drawbacks (Node: SEA cross-arch limits; Bun: pre-install likelihood; Go/Rust: optionalDependencies resolution failure mode). Re-read all three tables after the edit: all four candidates now carry at least one honestly-stated drawback; none reads as costless; the other three candidates' cells were not touched or softened.
- LOW (misattributed citation): replaced "Where the research programme Spec's open questions landed" with "Contract-level open items" as the section citation for the "wrong shape" quote. Verified against docs/reference/quest-cli-open-component-decisions.md: that quote is at L209, inside the "### Contract-level open items" section (heading at L182); "Where the research programme Spec's open questions landed" is a different section (heading at L160) that does not contain the quote.
- LOW (Phase 1 row miscount): changed "the eight Phase 1 rows" to "the nine Phase 1 rows" and added "where an anomaly sits in the outcome taxonomy" to the enumeration. Verified against docs/specs/quest-cli-delivery-roadmap.md's Phase 1 exit table: 9 rows total (envelope shape, exit-code table, not-found convention, identifier grammar, license, platform ownership, runtime ownership/D2, scale target, anomaly placement) - the doc previously enumerated only 7 plus D2 itself (8), omitting the anomaly-placement row (Closed, component-level placement, QCLI-24).
- LOW (Lore boundary characterization): added one clause to the "integration boundary" paragraph acknowledging the existing BacklogAdapter's one non-subprocess element - a direct, hardcoded, fixed-path read of backlog/config.yml for an ordered statuses list - alongside the subprocess surface, and noted it is equally runtime-neutral (shares no in-process runtime, memory space, or build toolchain either). Verified against docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md: the bullet is at L186-189 inside the same "1. Invocation surface Lore requires of a task CLI" section (heading L159) the proposal already cited; the requirements table (L352) separately classifies the Quest-side analogue as "Requiring a Quest contract change," item 1c - both now cited. The proposal's runtime-neutrality conclusion is unchanged, as the reviewer noted.

Verification:
- `lore check --strict`: "48 files, 0 errors, 0 warnings" (matches expected).
- `lore validate --strict` (whole bundle): "48 files, 0 errors, 0 warnings, 6 skipped" (matches expected); the new/edited file individually reports `ok`.
- `git diff dev...HEAD --stat`: three files only - backlog/tasks/qcli-58 task file, docs/reference/quest-cli-d2-runtime-proposal.md, docs/reference/quest-cli-open-component-decisions.md (367 insertions, 3 deletions total) - matches the orchestrator's scope expectation.
- AC7 mechanical recheck: `git diff dev...HEAD` contains no package.json, package-lock, bun.lockb, yarn.lock, bin/, src/, or tsconfig file; the only hits for those strings are prose mentions (Lore's own shipped `bin/lore.cjs`, and this task's own notes/plan text referring to what was NOT added) - no such file is present in the diff.
- Register's D2 Status cell re-checked: still byte-identical `**Blocked**` (docs/reference/quest-cli-open-component-decisions.md L82) - this fix pass touched only the proposal document, not the register.
- Re-verified every citation touched in this pass by opening the cited source file at the cited line/section (see above per-finding notes) before writing the fix.

Nothing in the reviewer's findings looks wrong on inspection; all four were verifiable defects and are now fixed with the cited evidence re-checked directly against source line numbers.

## Settlement (doc-14 wave 2, orchestrator)

Merged as `f123b9b` (PR #73), squash body hand-authored so `Refs: QCLI-58` lands in the final trailer block (QCLI-48); verified with `git interpret-trailers --parse`.

**Review:** two passes. Pass 1 `request_changes` (1 MED, 3 LOW); pass 2 `approve`, all 7 ACs confirmed with named evidence.

The MED was the substantive one: Deno was the only candidate with no drawback in any comparison cell — its disclosed npm-interop limitation (`npm:` specifiers) appeared at L68 and in none of the three comparison tables, including the summary table an owner rules from. That satisfies "decides nothing" in wording while tilting the comparison in substance. The fix carried the constraint into the Phase 6/clean-install cell and the summary row. Pass 2 proved the cure mechanically rather than by reading: `git diff dcd8e81..HEAD -- <proposal> | grep -E '^[-+]\| (Node\.js|Bun|Compiled)' | wc -l` = 0, i.e. zero added or removed lines in any Node/Bun/Go-Rust row, so no candidate was softened to compensate. All four now carry an honestly-stated cost.

**Correction to the fix pass's own notes:** the notes record `git diff dev...HEAD --stat` as "367 insertions, 3 deletions" and label it as run after the fix. That is the pre-fix figure, carried forward. Actual post-fix: **3 files, 391 insertions(+), 3 deletions(-)** — proposal 325 lines (not 318), task file 60. Re-run and confirmed at settlement. The scope conclusion (three files only) was correct; only the count was wrong. Recorded here because the stale figure propagated into the orchestrator's own pre-merge check before the reviewer caught it.

**Verification re-run at settlement:** post-rebase `lore check --strict` 48 files / 0 errors / 0 warnings; `lore validate --strict` 0/0, 6 skipped; register D2 Status cell byte-identical `**Blocked**`; live `npm view @opum-ai/lore engines` -> `{ bun: '>=1.3.14' }`, no `node` engine, matching the doc's capsule and labelled a moving reference; no `package.json`/`bin/`/`src/`/lockfile anywhere in the diff or on `dev`, tracked or untracked.

**Non-blocking, not fixed, recorded deliberately:** (a) "rather than native `node_modules` resolution" slightly overstates Deno's limitation — Deno supports an opt-in `node_modules` dir via `--node-modules-dir`; the true claim is that the *default* path is `npm:` specifiers through a global cache. The load-bearing claim (partial npm compatibility needing independent verification) is correct, so the comparison is undistorted. (b) The Recheck clause scopes its moving-reference caveat to platform/cross-compilation characteristics, which does not squarely cover an npm-compatibility claim. Both judged below the bar for a third review cycle; re-opening the Deno cell risked disturbing a balance that is now correct.

**Wave-level integration finding against this document (F1, HIGH):** see QCLI-59's settlement note and the campaign doc. In short, the sibling amendment permits `package.json`/`bin`/runtime dependencies, none of which can be written without naming a runtime — so the permission as merged allows a worker to close D2 by construction, the very ruling this proposal reserves for the owner. This document's own text was verified still true on `dev` (every prohibition sentence is scoped to "by this task" or asserts a fact about the research programme Spec, whose list is unchanged). Surfaced to the user; not acted on here.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added `docs/reference/quest-cli-d2-runtime-proposal.md` (325 lines), a decision-ready comparison of four candidate runtimes — Node.js, Bun, Deno, and compiled Go/Rust distributed via npm `optionalDependencies` — assessed against the QCLI-27 platform matrix (cited, not restated), the packaging contract's Phase 6 constraints including its mandatory release-time recheck clause, Lore's own shipped runtime as context whose relevance is argued rather than assumed, and which architecture-Spec boundaries a runtime choice would actually constrain versus which are genuinely runtime-neutral. Pointed the open component decisions register's D2 entry at it, additively, with its Status left `Blocked`.

It decides nothing: D2 remains owned-not-closed pending the owner's ruling, stated in the frontmatter, the opening, and a dedicated non-decision section.

Verified by two independent review passes. Pass 1 caught the failure this task was most at risk of: Deno presented as costless, its one disclosed npm-interop limitation never reaching the tables an owner rules from — a thumb on the scale that satisfied "decides nothing" in wording. Pass 2 confirmed the fix cured it mechanically, with zero changes to any other candidate's cells. Live `npm view @opum-ai/lore engines` -> `{ bun: '>=1.3.14' }` (no `node` engine) was re-verified at both passes and labelled a moving reference; Bun's Windows arm64 claim confirmed published at 1.3.14. `lore check --strict` and `lore validate --strict` clean at 48 files. No runtime frozen and no package metadata, runtime dependency, or executable scaffolding added — confirmed on `dev` for tracked and untracked files alike. Merged as `f123b9b` (PR #73).
<!-- SECTION:FINAL_SUMMARY:END -->
