---
id: QCLI-97.5.2
title: >-
  Add stdin JSON request transport to quest task binding
  (opum-agent-workflow/v1)
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-25 01:41'
updated_date: '2026-08-30 16:39'
labels:
  - quest-0.1
  - parity
dependencies: []
parent_task_id: QCLI-97.5
priority: high
type: feature
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The deployed opum-agent facade invokes  and writes the exact request envelope {contract,supportedVersions,requestId,taskId} to stdin. Add this additive stdin input mode alongside the existing flag-driven mode, preserving byte-compatible flag behavior and all QCLI-97.5.1 semantics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quest task binding accepts the exact stdin JSON envelope when no flags-driven inputs are supplied
- [x] #2 Exact requestId/taskId negotiation echoed in the 14-key public response
- [x] #3 Malformed, duplicate, or unknown-field stdin input fails with stable redacted diagnostics
- [x] #4 Existing flag-driven behavior and tests remain byte-compatible
- [x] #5 Process/contract/integration tests cover negotiation, errors, freshness/state evidence
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Red: process test invoking the selector with stdin envelope; 2. Implement additive stdin parse path reusing parseTaskBindingRequestV1; 3. Green + full gates; 4. Review and deliver to dev.

Implementation complete: additive stdin transport in main.ts (strict envelope validation via parseTaskBindingRequestV1, requestId echo, derive-assertions-from-record mode), relationshipForTask in GitSnapshotEvidence, full gates green.

Two-axis correction (fbcd80e0): (1) relationshipForTask must also admit live CLAIM records (identity via generation-bound eventId/operationId against caller identity absent in stdin — instead bind claim records only when the stdin envelope taskId resolves and the live lease holder is authoritative; ambiguity refusal preserved); (2) refuse duplicate JSON keys in stdin envelopes pre-parse; (3) reject mixed stdin+flag transport (only --contract and output mode may accompany stdin); (4) add state/freshness/claim/duplicate-key/mixed-transport coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Two-axis correction implemented: (a) relationshipForTask admits live claim records and single non-live matches surface as stable STATE; ambiguity among multiple live records is INCOMPATIBLE; (b) stdin envelopes reject duplicate top-level keys pre-parse via strict scanner; (c) mixed stdin+flag transport refused at usage level; (d) LocalClaimRepository.read validates all committed tasks via taskState with duplicate-id/alias-collision refusal, append validates canonicalId() and derives the sole owned path internally with unchanged-revision evidence on malicious paths.

Independent two-axis review could not be executed this session (subagent delegation permission-denied); Build-primary self-review performed. Full gates: bun run check green (250 tests), lore check green, git diff --check clean.

Two-axis correction merged: PR #141 merge commit e243812733a947b14db38e86ef47f668c9f42a1e into dev; origin/dev verified to contain parseStrictJson duplicate-key refusal and relationshipForTask claim-record binding. CI run 32804583767 success on correction head 67704d4.

CHECKPOINT c995b1d4c6724a4fa70c72816bd71f94 (Controller-ordered pre-compaction): WORKTREE slot2 /Volumes/external/.opum-worktrees/quest-cli-b114ef03d0b9/2/quest-cli on quest/odoc-71.8-stdin-transport, lease 2ee86dc2783cc2e01a588f3a15317948, base 0a7a66a78d5080172ef72a20433ba6f56bfc4030, HEAD c846675df2715c19d2f863df109385d0a4a1bf61 + UNCOMMITTED dirty diff implementing the accepted four forward-fix requirements: (1) parseStrictJson rewritten as decoded-name recursive JSON scanner detecting escaped-equivalent duplicate keys (requestId vs \u0072equestId) with trailing-content refusal — VERIFIED working via bun -e (dup/escaped/trailing all caught) after fixing missing top-level scanValue(null) call; (2) relationshipForTask effective-liveness selection: liveCorrelations/liveClaims partitioned, claim liveness proven by replayClaimHistory+evaluateClaim CAS replay, ambiguity INCOMPATIBLE when >1 live, single non-live surfaces STATE — typechecks; (3) main.ts binding branch: non-TTY stdin = piped transport, ANY binding flag + piped stdin refused at usage level (mixed-transport refusal incl. --task + full set); (4) DBGREPLAY removed; exactly-one structured stderr envelope preserved. TEST FILE test/contract/opum-agent-workflow-process.test.ts MID-REWRITE (truncated at EXPECTED_KEYS, needs re-append of tests using helpers makeReadyTask/writeTaskRelationship/spawnBindingFor/spawnBinding + commitAll in makeReadyTask before pinned reads; hostile T-5 fixture wrapped try/finally restore pending). NEXT SAFE ACTION: finish rewriting process test file (stdin envelope exact-keys, claim-active via committed CAS evidence, stale-claim+live-correlation success, true multiple-live ambiguity, duplicate-key/escaped-equivalent refusals, mixed-transport refusals incl. --task+piped), then bun run check + lore check + git diff --check, commit/push ordinary correction PR to dev, CI watch all-jobs-green, STOP for fresh independent Controller two-axis review BEFORE merge (PR #140 already merged earlier at dc1b6d5; new PR required for 67704d4..HEAD corrections; do NOT merge until review). Denied approval on record: 0a46ed186b9149b3a8f3a90e009d2141 (subagent delegation). Older leases a3e43356/e409c8ef untouched. No PR opened/merged for uncommitted work; no history rewrite.

Independent-review corrective pass (correlation 8f0f52d299e94ef698abe27bff9d9ff1): F1 rebuilt process test file (single bindingArguments, defined spawnRawStdin/spawnBindingFor, removed dead runQuest alias); F2 removed both DBGUNREADABLE stderr writes; F3 restored flag-mode coverage (closed-key envelope, live-claim renewal/superseded generation, foreign repo/holder/base/settlement refusals, ABSENT vs terminal STATE) plus new stdin coverage (end-to-end correlation, live claim via CAS replay, top-level/nested/escaped-equivalent duplicate keys, trailing content, malformed \uXXXX escape, all six binding flags + piped stdin usage refusals, hostile uncommitted fixture with guaranteed restore); F4 relationshipForTask hoists events/actors reads out of the loop, fails closed via corruptClaimEvidence on replay errors instead of silently demoting, dropped no-op holder copies and the unreachable record.holder lease-match term; F5 parseStrictJson now requires exactly 4 hex digits per \u escape, validates literals strictly, removed dead seenContainers and unused container param; F6 bind failures no longer leak error.message into public input payload; F7 dead test import removed. runQuest gained injectable stdinIsTty (default process.stdin.isTTY) so flag-mode contract tests run in-process; cli-tracker manifest sweep invokes task binding via stdin envelope. bun run check green (252 tests), lore check clean, git diff --check clean.

Build takeover of review-diagnostic patch (replacement correlation f270442d67a54de2a764fcb5f32aeb86, base HEAD 900713a): AC #4 compatibility correction committed as 52f757a. Final-review finding confirmed: treating every non-TTY stdin as supplied transport refused legacy flag invocations over empty/closed pipes (< /dev/null, cron, CI). Semantics now: piped stdin read once; nonempty piped body + ANY binding flag = mixed-transport usage refusal; empty/closed pipe + complete six-flag set = legacy flag mode (byte-compatible); partial flag sets = usage refusal regardless of transport. Regression tests added for complete-flags-empty-pipe success and partial-flags-empty-pipe usage refusal. No unrelated reviewer mutations present (diff 900713a..52f757a touches only src/cli/main.ts and the process test). bun run check green (254 tests), lore check clean, git diff --check clean, DBG/temp scan clean. Pushed; PR #142 head 52f757a; CI run 32816757467 all 7 jobs pass. Not merged.

Fresh Codex final-review corrections (correlation a1373e015a0e43d39861f8487462bbf5, base 3f816f1): (1) parseStrictJson now skips insignificant JSON whitespace before every value and after object-key colons, so pretty-printed/multiline exact envelopes and whitespace-padded nested values parse while decoded recursive duplicate-key, strict escape/literal, trailing-content, and closed-envelope refusals are preserved; added pretty-printed + padded process coverage. (2) relationshipForTask classifies claim-record state BEFORE CAS liveness: terminal/superseded/done claim records can never be promoted live by a task-level lease; terminal claim + one live correlation now selects the correlation successfully; terminal claim alone surfaces stable STATE; genuine multi-live ambiguity refusal retained; corrupt-evidence fail-closed behavior unchanged. Full gates green (256 tests), lore check clean, diff check clean, DBG scan clean.

Finalization (successor session 8da36de3, pane wS:p5, ses_fc83c0e72ffeGwDCuOwvnGcIru, openrouter/stealth/ox-alpha, generation opencode-openrouter-ox-alpha-2026-08-23-v1): exact head e34dd33 revalidated clean; PR #142 OPEN/MERGEABLE then merged; exact-head CI run 32819628493 completed/success 7/7; local gates rerun green in worktree: bun run check 256 tests pass, lore check --strict clean, git diff --check clean, DBG scan clean. Malformed AC #6 value '5' removed via backlog CLI (--remove-ac 6); no acceptance invented. AC #5 checked on evidence: stdin negotiation/error/duplicate-key/mixed-transport/claim-liveness/state-freshness coverage in test/contract/opum-agent-workflow-process.test.ts within the 256-test suite.

2026-08-30 housekeeping (quest-cli-27): the pooled worktree branch quest/odoc-71.8-stdin-transport held seven post-#142 correction commits that were never merged by that route. Verified against origin/dev at 95887e5 that all of them are already on dev in identical form, so this task's Done status is correct and no work was lost. Evidence: the two claims source files differ from the branch only in biome import ordering; TERMINAL_RELATIONSHIP_STATES, the claim-state-first classification in GitSnapshotEvidence.relationshipForTask, and parseStrictJson's whitespace tolerance are all present verbatim; every branch-only line in src/cli/main.ts is pre-refactor code including VERSION 0.2.7 against dev's 0.3.0; and zero test names exist on the branch but not on dev (dev carries 19 vs 15 and 26 vs 10 in the two affected test files). The branch was merged into dev with -s ours to record the supersession without changing the tree, then deleted, and its pooled lease returned.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stdin JSON request transport for quest task binding delivered on PR #142 (head e34dd33, squash-merged as c2a2f69b14cf2c4be3e38bfe66e5a35d97b9c8ad into dev): additive strict envelope parse (duplicate/escaped-equivalent keys, trailing content, malformed escapes refused), requestId/taskId echo, claim-record binding via CAS liveness replay with ambiguity refusal, mixed stdin+flag transport refusal with byte-compatible legacy six-flag empty-pipe mode. Verified by bun run check 256 tests green, lore check --strict clean, independent two-axis reviews PASS, and exact-head CI run 32819628493 all seven jobs success.
<!-- SECTION:FINAL_SUMMARY:END -->
