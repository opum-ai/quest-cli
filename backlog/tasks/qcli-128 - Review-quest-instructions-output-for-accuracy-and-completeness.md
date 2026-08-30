---
id: QCLI-128
title: Review quest instructions output for accuracy and completeness
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 18:50'
updated_date: '2026-08-28 21:41'
labels:
  - cli
  - instructions
  - docs
  - review
dependencies:
  - QCLI-124
references:
  - src/cli/main.ts
priority: low
type: spike
ordinal: 160000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest instructions (src/cli/main.ts, kind agent.instructions) returns the managed CLAUDE.md/AGENTS.md block plus version, the same content QCLI-124 derived from the release version for the 0.2.9 candidate. Before this content is leaned on further, for example by the onboarding prompts requested in QCLI-126, confirm it is accurate, complete, and consistent with how CLAUDE.md and AGENTS.md actually route Quest work in this repo. This is a review, not a known defect.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Written comparison of quest instructions output against the current CLAUDE.md and AGENTS.md managed blocks in this repo, noting any drift.
- [x] #2 Confirms whether the content correctly reflects 0.2.9 behavior: exit codes, conflict and retry guidance, and migration command examples.
- [x] #3 Follow-up tasks filed for any inaccuracy or gap found; none required if the review finds no issues.
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reviewed the live quest instructions --json output (version 0.2.9) sentence by sentence against actual CLI behavior verified hands-on this session:
- quest manifest --json discovers the command contract: accurate.
- migration backlog preview/apply flags (--source, --backlog-dir, --digest, --actor, --actor-kind): match the real only(parsed,[...]) arrays exactly (cross-checked against src/application/command-help.ts, built this session from source).
- actor-required-for-writes claim: matches actor()'s denial path in src/cli/main.ts.
- 'current instructions exit 0, missing/drifted/malformed exit 6': verified against src/domain/command-contract.ts's exitCodes (validationOrDrift: 6) and test/contract/bootstrap-process.test.ts's agents strict-check tests (all 4 cases pass exactly as described).
- 'conflict/exit 5': verified against exitCodes.conflict = 5 and the tracker_write_conflict/dependency_target_ambiguous mapping in main.ts's catch-all.
Zero discrepancies found.
questAgentInstructions (src/application/agents/agent-instructions.ts:15) is the single constant both content: <!-- quest:agent-instructions:begin -->
# Quest agent instructions

This project uses Quest CLI 0.2.9 for tracker operations. Run `quest manifest --json` to discover the supported command contract. Use `quest instructions --json` for the current versioned protocol. For Backlog tracker cutover, run `quest migration backlog preview --source <project> --json`, review its digest and mappings, then apply it with `quest migration backlog apply --source <project> --digest <digest> --actor <id> --actor-kind human --json`. Quest writes require an explicit actor declaration; do not edit Quest-authored records directly. CI should run `quest agents --check --require-installed`: current instructions exit 0, while missing, drifted, or malformed managed instructions exit 6. Quest does not retry write conflicts automatically; callers should read the latest task state and perform their own bounded retry when a command returns conflict/exit 5.
<!-- quest:agent-instructions:end -->

version: 0.2.9 and the real managed-block writer/checker (updateQuestAgentInstructions/inspectQuestAgentInstructions) consume - the reported content and what actually lands in CLAUDE.md/AGENTS.md are guaranteed identical by construction, not just observationally similar (this is the QCLI-124 fix).
This repo does not itself carry a quest:agent-instructions managed block (it uses Backlog's and Lore's blocks instead - quest-cli does not dogfood Quest on itself), so there is no in-repo instance to diff against directly; verification instead used the shared-constant proof above plus this session's own test coverage of the real write path.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest instructions' content is accurate and consistent with actual 0.2.9 CLI behavior - verified every factual claim (exit codes, actor requirement, migration flags) against source and tests, zero discrepancies. Its content and the real managed block Quest writes are provably identical (one shared constant, questAgentInstructions), not just plausibly similar. No follow-up needed for content accuracy. Scope note: cross-repo comparison against the consolidated Quest/Lore namespaces (opum-doc) was out of reach from this session per CLAUDE.md's routing rules and is not required for this review's ACs, which are scoped to this repo.
<!-- SECTION:FINAL_SUMMARY:END -->
