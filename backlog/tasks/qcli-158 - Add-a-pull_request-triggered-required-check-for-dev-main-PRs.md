---
id: QCLI-158
title: Add a pull_request-triggered required check for dev/main PRs
status: Done
assignee:
  - '@jeremy'
created_date: '2026-08-31 00:34'
updated_date: '2026-08-31 00:39'
labels: []
dependencies: []
ordinal: 187000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fleet orchestrator (opag) audit OPAG-9 found none of quest-cli's three GitHub workflows trigger on pull_request, so a dev->main promotion PR gets no CI signal at all and branch protection has nothing to point a required status check at. Add a pull_request trigger (branches: main, dev) to the substantive workflow, without a paths filter on that trigger (a filtered pull_request trigger leaves a required check permanently pending on non-matching PRs -- lore-cli hit this, LCLI-196). Branch protection/ruleset configuration itself is explicitly out of scope; opag is taking that to the user centrally for all five fleet repos.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 One workflow job runs on pull_request events targeting main and dev with no paths filter on that trigger
- [x] #2 The chosen job is fast enough to serve as a required PR check (documented reasoning for which job, and why the six-platform release matrix is excluded)
- [x] #3 Existing push/workflow_dispatch/tag behavior for all three workflows is unchanged
- [x] #4 Verified green on a real PR against this repo, not just locally
- [x] #5 No GitHub branch protection or ruleset changes made
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add pull_request trigger (branches: [main, dev]) to prepublication-qualification.yml, no paths filter on that trigger; keep the existing push paths filter untouched.
2. Gate the immutable-candidates job (6-platform release matrix) to skip on pull_request events via an added if condition, so only source-gates (typecheck/lint/format/layer-check/full test suites, single ubuntu runner) runs and reports for a PR -- keeps the required check fast. candidate-bundle and native-execution-receipt already skip on non-dispatch/non-tag events, unaffected.
3. Leave projection-platform.yml and release.yml triggers unchanged -- prepublication-qualification's source-gates is the substantive, cheap, single-runner check; the projection matrix and release publish are narrower or dispatch-only.
4. Push a branch, open a real PR against dev, confirm the pull_request event fires and source-gates job runs and passes; confirm immutable-candidates does not run on the PR event.
5. Report exact job name to require (source-gates) back to opag, plus verification evidence (PR run link/id).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented: added pull_request (branches: [main, dev], no paths filter) to prepublication-qualification.yml; gated immutable-candidates with if: github.event_name != 'pull_request' so the 6-platform release matrix, candidate-bundle, and native-execution-receipt all skip on PR events. Verified on real PR opum-ai/quest-cli#229: pull_request run 33345023222 -> source-gates passed in 2m53s, matrix/candidate-bundle/native-execution-receipt all reported skipped. Same-commit push run 33345016059 confirms push behavior unchanged (matrix jobs ran). Merged to dev as 6ff5632 (fast-forward, PR #229). Required-check job name to configure in branch protection: source-gates.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added pull_request (branches: [main, dev], unfiltered) to prepublication-qualification.yml. Required check: source-gates (typecheck/lint/format/layer-check/full test suite, single ubuntu-24.04 runner, ~3 min). immutable-candidates (6-platform release matrix) gated with if: github.event_name != 'pull_request', so it and its downstream candidate-bundle/native-execution-receipt jobs skip on PRs -- keeps the required check cheap. projection-platform.yml and release.yml left untouched (narrower/dispatch-only). Verified on real PR opum-ai/quest-cli#229: pull_request run 33345023222 passed source-gates in 2m53s with the matrix/bundle/receipt jobs reporting skipped; the same-commit push run 33345016059 shows the matrix still runs on push, confirming existing behavior is unchanged. Merged to dev at 6ff5632. No branch protection/ruleset changes made.
<!-- SECTION:FINAL_SUMMARY:END -->
