---
id: QCLI-166
title: Release quest-cli 0.3.1
status: In Progress
assignee: []
created_date: '2026-09-02 21:44'
updated_date: '2026-09-02 21:44'
labels:
  - release
  - packaging
dependencies: []
references:
  - docs/runbooks/quest-cli-package-and-release.md
priority: high
type: chore
ordinal: 195000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User-authorized release (2026-09-02, relayed by opag with verbatim quote, independently confirmed direct with the user in this session before any irreversible action). Patch bump carrying PR #223 (AC checked-state, taskIdPrefix, parentId migration-fidelity fixes) and PR #242 (QCLI-165 task list visibility, QCLI-150 edit compose). Following docs/runbooks/quest-cli-package-and-release.md exactly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Version bumped (package.json, QUEST_VERSION, regenerated npm/quest-*/package.json) and all 6 platform binaries rebuilt via CI (not locally -- local Bun 1.2.23 can't cross-compile win32-arm64, CI pins 1.3.14) and committed to dev
- [ ] #2 v0.3.1 tag created, prepublication-qualification.yml dispatched against the tag, native-execution-receipt fetched and gated locally
- [ ] #3 release.yml dispatched dry-run (publish=false) then real (publish=true) against the tag; registry verified serving all 7 packages; receipt:verify-published passes
- [ ] #4 Published version and gitHead reported back to opag for oe2e to pin as the fidelity-suite candidate
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Bump version: package.json 0.3.0->0.3.1, src/application/version.ts QUEST_VERSION, regenerate bun.lock (frozen-lockfile CI needs it in sync, QCLI-131 precedent).
2. Commit bump to a branch, push, PR into dev (small, low-risk, but keeps an auditable trail for a release-prep change).
3. Dispatch prepublication-qualification.yml via workflow_dispatch against dev/the branch AFTER merge, so immutable-candidates builds fresh 6-platform binaries on CI's correctly-pinned Bun 1.3.14 (not locally -- local Bun 1.2.23 can't cross-compile win32-arm64) and uploads them as quest-package-<target> artifacts (workflow_dispatch triggers the upload condition).
4. Download all 6 quest-package-<target> artifacts, overwrite npm/quest-<target>/bin/quest[.exe] and npm/quest-<target>/package.json with the freshly-built bytes, run bun run check:packages && bun run test:packages locally to verify, commit+push to dev as the actual "reviewed source commit."
5. Tag that commit v0.3.1, push tag.
6. Dispatch prepublication-qualification.yml against the tag (gh workflow run --ref v0.3.1) -- this time immutable-candidates attests the committed artifact instead of rebuilding, and native-execution-receipt job runs (tag-ref-gated).
7. Wait for success, download native-execution-receipt artifact, gate it locally: bun run receipt:require -- --receipt native-execution-receipt.json.
8. Recheck registry/repo facts per runbook step 6.
9. Dispatch release.yml --ref v0.3.1 -f publish=false (dry run), confirm clean.
10. Dispatch release.yml --ref v0.3.1 -f publish=true. Watch to completion.
11. Verify: registry serves all 7 packages, bun run receipt:verify-published -- 0.3.1 --receipt native-execution-receipt.json passes.
12. Report published version + gitHead to opag for oe2e to pin.
Stop and report rather than improvise if any step's actual behavior diverges from this plan or the runbook.
<!-- SECTION:PLAN:END -->
