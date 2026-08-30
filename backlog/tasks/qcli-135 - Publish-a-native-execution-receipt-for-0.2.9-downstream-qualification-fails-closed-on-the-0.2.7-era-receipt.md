---
id: QCLI-135
title: >-
  Publish a native-execution receipt for 0.2.9: downstream qualification fails
  closed on the 0.2.7-era receipt
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-28 21:32'
updated_date: '2026-08-29 23:57'
labels:
  - release
  - provenance
  - e2e
dependencies: []
priority: medium
type: bug
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Downstream qualification cannot attest cross-platform native execution for 0.2.9, because the only published native-execution receipt describes a different build.

opum-cli-e2e carries evidence/native-receipts/quest-01456d7-native-receipts.json (opum.native-execution-receipt.v1), pinned to quest-cli commit 01456d7d8c4fe74c1e413a84b5cfdd81c12a2779, GitHub Actions run 32922744771, with per-platform questBinarySha256 values. Installed quest 0.2.9's darwin-arm64 native binary is sha256 cf10a0fe3ad42fbb2eb1b59d493ee96e1181cddb068d50c964152c5beea1c8e3; the receipt declares 4f5b194853c842a3d11fa655509e0b67c1abc425fc672c0f01d310a0ae021ffa for that target. All six platforms mismatch.

The harness validator is fail-closed by design and correctly refuses the stale binding, so six packaging rows fail. Nothing is broken in the product — this is a release-artifact gap, and no harness change is the right fix. It is filed here because only this repository can close it.

Effect in the current qualification: 6 of 17 failing rows in opum-cli-e2e baselines/v0.2.9. Five of those six moved BLOCKED -> FAIL versus the v0.2.7 baseline, because a receipt now exists but does not describe the candidate under test, which is a worse evidential position than no receipt at all.

Two ways to close it: publish a native-execution receipt for the 0.2.9 tag from a CI run that executed each platform binary, or ship a digest-pinned candidate bundle the harness can bind with --quest-candidate (tarballs/sha256.txt plus evidence/package-metadata.json), as was done for the ODOC-63.4 terminal registry qualification.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A native-execution receipt is published for the 0.2.9 release whose per-platform questBinarySha256 values match the bytes actually published to npm for each of the six platform packages
- [ ] #2 The receipt names its source commit and CI run, and each platform job in that run executed the binary on its own target rather than only building it
- [ ] #3 Receipt generation is wired into the release process so a published version cannot ship without a matching receipt, rather than being produced by hand after the fact
- [ ] #4 opum-cli-e2e re-run against the published 0.2.9 receipt reports zero packaging failures
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Scope ruling for this pass: build the DURABLE half (AC3) and leave the 0.2.9 back-fill as an explicit owner decision. 0.2.9 is superseded by the next cut, no CI run exists at its commit cb33551, and dispatching six platform jobs on a stale tag spends CI on evidence that goes out of date the day it is produced. AC3 is needed whichever way that goes.

Two facts established by direct verification today, which change the design:
1. All six questBinarySha256 values declared at v0.2.9 EXACTLY match the sha256 of the binaries inside the tarballs npm actually serves. Downloaded and hashed all six. The declared data was never wrong.
2. The repository TRACKS the platform binaries (npm/quest-*/bin/quest*, tracked despite a later gitignore rule), and the bytes at tag v0.2.9 are byte-identical to what npm serves. So git at a tag already holds the published artifact.

That means the real evidential gap is narrower than the task assumed. It is not the digests. It is that no CI run exists at the release commit, AND that the workflow's platform jobs run 'bun run build:packages' first, which REBUILDS and overwrites the tracked binary. So even a fresh run would prove 'a binary built from this source executes on this target', not 'the bytes we published execute on this target'. A receipt built on that would overstate its own evidence.

Plan:
1. scripts/qualification/native-execution-receipt.mjs — emit the receipt in the exact opum.native-execution-receipt.v1 shape opum-cli-e2e/lib/native-receipts.mjs validates: schemaVersion, kind, source.commit, ciRun {id,url,event,headSha,conclusion,jobs[]}, platforms[] with executableSha256 + declaredIn, and honest coverageClaim/notClaimed prose. Digests come from the committed npm/quest-<p>/package.json and are cross-checked against the tracked binary bytes, so a receipt cannot describe a manifest that disagrees with its own artifact.
2. A --verify-published <version> mode that downloads the six tarballs from npm and asserts each binary's sha256 equals the receipt's. That is AC1, mechanised, and reusable for every future release.
3. Release-ref reproduction gate in each platform CI job: on a tag, the freshly built binary must reproduce the digest committed at that ref. Without it the receipt's execution claim does not reach the published bytes.
4. Aggregation CI job after the six platform jobs: emit the receipt from real run metadata and upload it as a workflow artifact.
5. scripts/qualification/require-native-receipt.mjs — the AC3 gate: refuses a publish unless a receipt exists for the current version AND commit, validates against the same rules the downstream validator applies, and matches the bytes about to be published.
6. Tests over the emitter and the gate, including a red case per rule.

AC1/AC2/AC4 as written name 0.2.9 specifically and stay open pending the owner's release decision; the machinery above closes them automatically for the next cut.
<!-- SECTION:PLAN:END -->
