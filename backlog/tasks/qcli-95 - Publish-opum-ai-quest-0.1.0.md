---
id: QCLI-95
title: Publish @opum-ai/quest 0.1.0
status: Done
assignee:
  - '@codex'
created_date: '2026-08-14 18:08'
updated_date: '2026-08-17 05:50'
labels:
  - quest-0.1
  - 'wave:release'
  - 'doc:stories/deliver-quest-cli-0-1-0'
milestone: m-0
dependencies:
  - QCLI-93
  - QCLI-94
documentation:
  - docs/reference/quest-cli-packaging-contract.md
  - docs/runbooks/quest-cli-package-and-release.md
  - docs/stories/deliver-quest-cli-0-1-0.md
  - docs/reference/quest-cli-release-truth.md
modified_files:
  - package.json
  - docs/reference/quest-cli-release-truth.md
  - README.md
priority: high
type: task
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Perform the separately authorized first public Quest release after every implementation and qualification gate passes. This task owns the live registry recheck, immutable publication, clean-install verification, release evidence, and truthful postpublication documentation; it must remain blocked without explicit owner authorization.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The @opum-ai/quest registry name, conflicting names, repository identity, current Lore release, and package metadata are rechecked live immediately before publication
- [x] #2 Publication occurs only with explicit owner authorization and uses the exact reviewed immutable root and six platform artifacts
- [x] #3 The public registry serves the expected version and all clean-install smoke tests pass against registry artifacts
- [x] #4 Immutable release evidence records versions, integrity, provenance, source commit, platform artifacts, and verification results
- [x] #5 Availability and install documentation changes only after successful publication and verification; failure leaves no false availability claim
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Recheck the live npm registry, repository identity, current Lore release gate, and reviewed package metadata. 2. Verify the exact root and six platform immutable artifacts/checksums at dev HEAD. 3. Publish only those reviewed artifacts under the granted authorization. 4. Clean-install from npm and repeat all required public and migration smokes. 5. Record immutable evidence, update availability truth through Lore, verify, and settle the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
QCLI-94 reconciled the release runbook reference to docs/runbooks/quest-cli-package-and-release.md; publication remains blocked pending QCLI-93, QCLI-94, and explicit owner authorization.

Owner explicitly authorized the separately gated QCLI-95 npm publication on 2026-08-17. Beginning required immediate live rechecks; publication will stop if any identity, registry, metadata, or artifact fact diverges.

Immediate prepublication rechecks passed: @opum-ai/quest and all six platform names returned E404/unclaimed; package metadata, repository opum-ai/quest-cli (default dev), current @opum-ai/lore 0.3.2, and all reviewed package checksums matched. Immutable tarballs were prepared under /private/tmp/quest-release.TAdld0. npm publish attempted each platform tarball but npm required interactive EOTP/web authentication; every attempt failed before publication, the root launcher was not attempted, and no registry mutation occurred. Resume only after the owner completes npm CLI authentication.

Postpublication verification: npm now serves @opum-ai/quest@0.1.0 and all six @opum-ai/quest-<os>-<cpu>@0.1.0 packages with the expected repository, license, platform metadata, dist.shasum, and dist.integrity values. A fresh registry install selected darwin-arm64 whose installed native checksum matches the reviewed map; version, manifest, actor-declared task creation/list, SQLite projection, and migration smoke all passed. The six candidate platform smokes passed in GitHub Actions run 31977086471, and the registry integrity values match those exact candidates. Lore strict validation/check passed after release-truth creation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Published @opum-ai/quest 0.1.0 and all six immutable native packages under explicit owner authorization. Verified npm metadata/integrity, public clean-install version/manifest/task/projection/migration behavior, all-platform candidate qualification, and Lore-managed release truth/documentation.
<!-- SECTION:FINAL_SUMMARY:END -->
