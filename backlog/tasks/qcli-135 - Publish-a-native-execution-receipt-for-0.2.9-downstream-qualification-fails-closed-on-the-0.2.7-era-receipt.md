---
id: QCLI-135
title: >-
  Publish a native-execution receipt for 0.2.9: downstream qualification fails
  closed on the 0.2.7-era receipt
status: To Do
assignee: []
created_date: '2026-08-28 21:32'
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
