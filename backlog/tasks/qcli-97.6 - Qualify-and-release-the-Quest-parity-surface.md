---
id: QCLI-97.6
title: Qualify and release the Quest parity surface
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-17 06:07'
updated_date: '2026-08-30 14:08'
labels:
  - quest-0.1
  - parity
  - release
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies:
  - QCLI-97.2
  - QCLI-97.3
  - QCLI-97.4
  - QCLI-97.5
  - QCLI-97.7
  - QCLI-108
  - QCLI-97.9
documentation:
  - docs/reference/quest-cli-backlog-parity-and-lore-integration-audit.md
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
parent_task_id: QCLI-97
priority: high
type: task
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Perform final clean-room and cross-product qualification for the restored Quest parity surface, then record release truth. This task does not authorize a registry publication on its own.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A clean install exposes the complete approved parity manifest, help/instructions, and agent onboarding without relying on repository-local internals
- [x] #2 Qualification covers public parity commands, migration of existing Quest workspaces, all native packages, and real Lore adapter conformance
- [x] #3 Release truth records the supported Backlog and Lore versions, accepted exclusions, source commit, platform artifacts, and verification results
- [x] #4 Publication, if a version change is required, occurs only under separate explicit owner authorization
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live Lore verification on 2026-08-17 found the installed quest is a retained pre-reconciliation 0.2.2 candidate whose schema-1 manifest lacks the four public migration commands. QCLI-97.9 now owns installed-artifact provenance and migration-lifecycle qualification before this release task can complete.

RELEASE APPROVAL POSITION, recorded 2026-08-30 where it was reasoned rather than only in a runbook.

AC#4 requires that publication occur 'only under separate explicit owner authorization'. The owner decided on 2026-08-29 to configure npm trusted publishing across all fourteen @opum-ai package names and to authorize 'publish: true' workflow dispatches, abandoning the token path. That satisfies AC#4's authorization requirement.

What it does NOT provide, and this must not be summarised away: trusted publishing fixes AUTHENTICATION, not APPROVAL. quest-cli's release.yml declares no GitHub environment, so a dispatch carries no second-party review. Anyone able to dispatch the workflow can publish, gated only by the native-execution receipt.

The lore-cli session hit the same gap and had to accept it: GitHub returned 422 adding a required reviewer, because their billing plan does not support protection rules on that repository. They recorded it on LCLI-278 and deliberately left it open.

QUEST'S POSITION IS DIFFERENT AND BETTER, and that is worth acting on rather than inheriting lore's waiver by default. quest-cli is a PUBLIC repository (verified via the API on 2026-08-30, and filed as QCLI-153 because CLAUDE.md asserts the opposite). Environment protection rules, required reviewers included, are available on public repositories regardless of plan. So the second-party approval lore had to waive is actually AVAILABLE here.

I have not added it, for two reasons, both of which are the owner's to overrule: it would block the pending 0.3.0 dispatch, and choosing who reviews a release is a governance decision rather than a mechanical one.

RELEASE-PATH REBUILD SWEEP, prompted by lore-cli finding the same class in their own workflow (LCLI-367), where six qualification jobs each build their own binary and the package job builds again, so every platform attestation describes bytes that never reach the registry. Because Bun's --compile is not byte-reproducible those bytes demonstrably differ; nothing fails because nothing compares them.

Quest was swept for the same shape and is CLEAN after the attestation fix. Every build:packages invocation was checked:
- .github/workflows/prepublication-qualification.yml:71 is now conditional on NOT being a tag, so a release ref executes the committed artifact.
- scripts/deliver-package-artifacts.mjs rebuilds, correctly: that is the authoring step that PRODUCES the committed artifacts, not a step that attests them.
- scripts/test-packed-packages.mjs packs and executes whatever is in npm/, which at release time is the committed artifact. No rebuild.
- .github/workflows/projection-platform.yml runs tests from source and attests no artifact.
So no evidence on quest's release path rests on bytes that will not ship.

ALL FOUR ACs SATISFIED BY THE 0.3.0 RELEASE, 2026-08-30.

AC1 - clean install exposes the parity surface without repository-local internals. opum-cli-e2e's rank-1 run installed quest 0.3.0 from the REGISTRY with 'npm i' into a fresh prefix and exercised the public CLI boundary across 403 rows: discovery 39, records 39, bootstrap 26, project 17, fault 10, parity/backlog 39, identity, packaging 42. Nothing repository-local was on the path.

AC2 - qualification covers public parity commands, migration of existing workspaces, all native packages, and real Lore adapter conformance. 403 rows, 403 PASS, 0 FAIL, 0 BLOCKED, runner exit 0, with contract/lore 39, contract/quest 40 and cross-product 20 all green against PUBLISHED lore 0.3.5. All six native packages are covered: one executed on the host and six digest-bound by the candidate bundle, with the native-execution receipt attesting execution on the other five from their own runners.

AC3 - release truth. Recorded across the release notes (supported Lore version floor, the additive manifest delta, TRACKER_CONTRACT_VERSION unchanged), the native-execution receipt (source commit, CI run, per-platform digests, with an explicit notClaimed list), the candidate bundle's artifactProvenance field, and opum-cli-e2e's evidence directories. The accepted exclusions are the four unscheduled FUTURE items in QCLI-134's register.

AC4 - publication occurred under explicit owner authorization: the owner decided on trusted publishing for all fourteen names on 2026-08-29 and configured quest's seven, and 0.3.0 published through OIDC on run 33315067738. Provenance attestations confirm the mechanism - present on 0.3.0, absent on 0.2.9.

THE APPROVAL GAP RECORDED EARLIER IS NOT CLOSED BY THIS AND SHOULD NOT BE READ AS CLOSED. Trusted publishing fixes AUTHENTICATION, not APPROVAL. release.yml declares 'environment: release' but that environment has no protection rules, so a dispatch still carries no second-party review. quest-cli is a public repository, so required reviewers ARE available here regardless of billing plan - unlike lore, which had to accept the gap. Adding them is a repo-admin decision and remains open.

Nothing here is soak. One host, one run.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Quest 0.3.0 published to npm through OIDC trusted publishing and qualified from a registry install against published lore 0.3.5: 403 rows, 403 pass, 0 fail. Release truth is recorded in the release notes, the native-execution receipt, the candidate bundle's provenance field and opum-cli-e2e's evidence, with the four unscheduled FUTURE items as the accepted exclusions. Publication occurred under explicit owner authorization; the separate question of second-party APPROVAL on a dispatch remains open and is noted rather than closed.
<!-- SECTION:FINAL_SUMMARY:END -->
