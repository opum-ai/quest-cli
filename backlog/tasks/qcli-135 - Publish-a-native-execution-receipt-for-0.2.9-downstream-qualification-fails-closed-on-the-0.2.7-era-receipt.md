---
id: QCLI-135
title: >-
  Publish a native-execution receipt for 0.2.9: downstream qualification fails
  closed on the 0.2.7-era receipt
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-28 21:32'
updated_date: '2026-08-30 02:36'
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
- [x] #2 The receipt names its source commit and CI run, and each platform job in that run executed the binary on its own target rather than only building it
- [x] #3 Receipt generation is wired into the release process so a published version cannot ship without a matching receipt, rather than being produced by hand after the fact
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

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC3 delivered on branch quest/qcli-135-native-receipt (3462cb0, 6df68ba).

scripts/qualification/native-execution-receipt.mjs, four modes: --emit (assemble from the run's real jobs), --require (the release gate), --verify-reproduction (release-ref only), --verify-published (assert the digests are the bytes npm serves). CI gains a native-execution-receipt aggregation job gated on the six platform jobs and on a tag ref; each platform job gains a reproduction check on a release ref. The runbook now names the receipt as a prerequisite, adds the gate as a publication-blocking step, and adds a post-publish registry comparison.

Three design points, each of which is a trap the previous hand-made receipt did not have to face:

1. The emitting job is part of the run it describes. The downstream validator rejects ANY job name outside source-gates plus the six platforms, so recording the run's raw job list would produce a document that can never bind. The emitter records only the seven required names and separately asserts each succeeded. Covered by a test.

2. Every digest is re-derived from the tracked binary rather than copied from the manifest beside it, and the gate re-derives again from disk rather than trusting the document. A receipt that agrees only with itself proves nothing.

3. The platform jobs run build:packages, which REBUILDS and overwrites the tracked binary. Without the reproduction gate a green run proves only that a binary built from this source executes on the target - not that the bytes being published do. The receipt states those two claims separately and names what it does not claim, rather than merging them into a certificate it did not earn.

Verified end to end, not by inspection:
- The emitted document is accepted by the REAL downstream validator: opum-cli-e2e/lib/native-receipts.mjs validateNativeReceipts() with declaredDigests bound returns ok:true.
- --verify-published confirms the tracked binaries are byte-identical to all six platform packages npm serves for 0.2.9.
- The gate's refusal paths were exercised: wrong commit, wrong version, a failed platform job, a missing platform job, a manifest disagreeing with its own binary, and an artifact swapped after emission. All refuse.
- Both runbook commands were run before being written down, including the refusal path.
- bun run check exits 0; lore check reports 63 files, 0 errors, 0 warnings.

AC1, AC2 and AC4 name 0.2.9 specifically and stay OPEN. They need a CI run at commit cb33551, which does not exist, and the owner deferred this release twice on 2026-08-29. The machinery above closes all three automatically for the next cut. Recommend re-targeting them at that release rather than back-filling 0.2.9 by hand - it is an owner call, not mine.

Independent review (high effort) of the branch found seven findings. Five were in this task's scope and are fixed; two were out of scope and are filed as QCLI-151 and QCLI-152.

FIXED HERE:
1. HIGH - the module header still described a downstream rule that no longer exists (opum-cli-e2e's extraJobs rejection, removed in their b16cbab), and coverageClaim[0] asserted that EVERY listed job ran prepublish.mjs, which became false the moment the emitter started recording extra jobs. The claim now names the seven required jobs explicitly and says plainly that it makes no claim about any further job recorded.
2. MEDIUM - the success requirement spanned every recorded job, so a sibling job that had not concluded (null) or was conditionally skipped would abort receipt emission and block a tagged release. That directly contradicted the comment beside it saying a workflow may legitimately grow a job. Reordered into two rules: a red job throws FIRST, whether required or not, so nothing below can drop an inconvenient failure; then only successful jobs are recorded, so unconcluded and skipped ones are omitted rather than fatal.
3. MEDIUM, and the worst of the seven - the entrypoint used import.meta.main, which only exists on Node >= 22.18. On anything older it is undefined, main() never runs, and the process exits 0. This file IS the publication gate: it failed OPEN. A maintainer following runbook step 5 on a Node 20 machine would have got a silent pass. Replaced with a process.argv[1] comparison. package.json declares engines.node >=18 and neither CI job pins Node, so this was reachable.
5. LOW - --verify-published defaulted its receipt path to receipt.json, a name nothing produces, so omitting --receipt threw an ENOENT stack instead of a usage error. There is now no default.
6. LOW - a missing flag value silently consumed the next flag, so '--verify-published --receipt r.json' read '--receipt' as the version and reported all six platforms as unpublished. On the mode whose job is to distinguish 'not published' from 'wrong invocation' that is the worst possible failure. Flags now reject a value that begins with --, and the entrypoint prints the message and exits 2 rather than a stack.

FILED OUT OF SCOPE:
- QCLI-151: quest instructions emits kinds agent.guides and agent.guide that the manifest never declares. Same contract-vs-implementation class as QCLI-133/137, inverted.
- QCLI-152: imported Backlog timestamps are copied verbatim and never normalised, so the date sort QCLI-137 restored compares '2025-06-02 14:23' against ISO-8601 lexicographically, and new Date() parses the two forms in different timezones.

Re-verified after every fix: the emitted document still returns ok:true from the real downstream validator, and bun run check exits 0.

Merged to dev as 2be4c98 (PR #187). CI green on the final commit: all six platform jobs plus source-gates pass, and the native-execution-receipt job correctly reports 'skipping' on a non-tag ref, which is the release gate behaving as designed. Verified again against merged dev: bun run check exits 0 and --verify-published 0.2.9 still matches all six published platform packages.

Task stays In Progress: AC3 is closed, AC1/AC2/AC4 need a release.

Candidate bundle delivered (PR #190, dev dc7c9a5). This is the exit criterion the soak deferral did not have.

scripts/build-candidate-bundle.mjs plus a CI candidate-bundle job assemble a digest-pinned bundle of an UNPUBLISHED build, which opum-cli-e2e binds with --quest-candidate. Nothing reaches a registry. The capability existed on their side and neither repo was using it: bin/opum-e2e.mjs:139, already exercised at 309/309 against an unpublished build.

Delivered: /tmp/quest-candidate-030, sourceCommit 5ef5e578d0e534feb7c1e531287b4e1fb5e1a561, version 0.3.0, CI run 33286602773 with all eight jobs green. Verified independently before handing over: shasum -c passes all seven, tar -tvzf shows -rwxr-xr-x on the non-Windows binaries, root tarball carries package/bin/quest.cjs.

What the run will and will not establish, measured by the consumer rather than predicted: 407 rows -> 402, REMOVED 15 / ADDED 10 (identity 9/8, packaging 6/2). Identity is an UPGRADE - nine rows deriving provenance from whatever commit a sibling worktree sits on, replaced by eight deriving it from digest-pinned tarball bytes, with one genuine loss (the candidate's git identity, which a tarball cannot carry). Packaging narrows: six targets attested becomes one target executed plus six artifacts digest-bound. Neither is soak. This must not be reported as costless.

Three failures on the way, recorded because they recur:
1. The version bump left bun.lock stale; CI died before any gate ran. Regenerated with bun 1.3.14 specifically - the local 1.2.23 writes a different lockfile shape and fails the frozen check for a second reason.
2. The bump left all six committed platform manifests at 0.2.9 against a 0.3.0 root, so check:packages failed in source-gates and every downstream job skipped. Fixed by rebuilding all six.
3. Staging 496MB of binaries in one git add got SIGKILLed. deliver:packages already exists for exactly this - it builds and stages one target at a time with bounded pack memory - and should have been the first choice.

A claim I wrote into the runbook and had to correct: 'Bun cannot cross-compile bun-windows-aarch64.' That is a Bun VERSION constraint, not an absolute one - 1.2.23 refuses it, 1.3.14 compiles it. I recorded a mechanism from one observation. Independently corroborated afterwards by lore-cli, whose DEVELOPMENT.md already had the correct version-scoped form.

0.3.0 RECEIPT EXISTS AND BINDS. AC2 is closed for 0.3.0.

Tagged v0.3.0 and dispatched the workflow on the tag: CI run 33288065896, all nine jobs green including native-execution-receipt. Receipt: commit 98ab4c7858ceca4ef62d8e6b6e557c317feadd09, version 0.3.0, six platforms, seven required jobs all successful.

Verified twice, not once:
- 'receipt:require' -> 'Native-execution receipt binds 0.3.0 at 98ab4c7 across all six platforms.'
- The REAL downstream validator, opum-cli-e2e/lib/native-receipts.mjs validateNativeReceipts() with declaredDigests bound -> ok:true.

THE FIRST TAG ATTEMPT FAILED, AND THE FAILURE WAS THE VALUABLE PART. All six platform jobs failed the reproduction gate I had shipped: each rebuilt its binary and got a different digest from the one committed minutes earlier by the same Bun version. Bun's --compile output is NOT byte-reproducible across machines - six independent mismatches, measured rather than assumed.

That made 'rebuild and check it matches' the wrong question. A native-execution receipt attests that the bytes being PUBLISHED ran on their target, and the published bytes are the ones committed at the release ref; rebuilding them first destroys exactly what the receipt is about, because the rebuild is a different artifact from the one shipped. On a release ref the platform job now SKIPS the rebuild and executes the committed artifact, with --verify-committed asserting byte-identity to the blob at that ref by git object id before it runs (PR #193). The coverage claim was corrected too: it had claimed each job 'reproduced the digest committed at that ref', which was never true and could not have become true.

The gate was too strict to satisfy, but it failed closed and loudly, which is why this was found before a receipt existed rather than after one was trusted.

PUBLISH IS BLOCKED ON THE CREDENTIAL, NOT ON THIS REPOSITORY. 'npm whoami' returns E401. 'npm publish' on the first platform package returns E404 on PUT, which is npm's response to a token without write permission on an existing scope. Nothing partial reached the registry: @opum-ai/quest is still 0.2.9 and @opum-ai/quest-darwin-arm64 still lists only 0.2.8 and 0.2.9. The lore-cli session reports the identical symptom on the same account with two different tokens, so it is the credential or the account, not either repository's tooling.

AC1 and AC4 still name 0.2.9 specifically and remain open by their own wording. Their substance is now satisfied for 0.3.0: a receipt exists whose per-platform digests are the committed artifacts that were executed on their own runners.
<!-- SECTION:NOTES:END -->
