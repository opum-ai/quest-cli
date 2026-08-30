---
id: QCLI-97.6
title: Qualify and release the Quest parity surface
status: To Do
assignee: []
created_date: '2026-08-17 06:07'
updated_date: '2026-08-30 03:47'
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
- [ ] #1 A clean install exposes the complete approved parity manifest, help/instructions, and agent onboarding without relying on repository-local internals
- [ ] #2 Qualification covers public parity commands, migration of existing Quest workspaces, all native packages, and real Lore adapter conformance
- [ ] #3 Release truth records the supported Backlog and Lore versions, accepted exclusions, source commit, platform artifacts, and verification results
- [ ] #4 Publication, if a version change is required, occurs only under separate explicit owner authorization
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
<!-- SECTION:NOTES:END -->
