---
id: QCLI-135
title: >-
  Publish a native-execution receipt for 0.2.9: downstream qualification fails
  closed on the 0.2.7-era receipt
status: In Progress
assignee:
  - '@quest-cli'
created_date: '2026-08-28 21:32'
updated_date: '2026-08-30 07:11'
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

PUBLISH IS BLOCKED BY AN NPM ACCOUNT CONFIGURATION NEITHER REPOSITORY CAN CHANGE. Tested three ways rather than assumed:
1. Local 'npm publish' -> E404 on PUT.
2. CI with the repository's own NPM_TOKEN secret (created 2026-08-06, previously unused) -> E404 on PUT. The dry run was perfect: receipt fetched from the qualification run, gate bound, all seven packages in order.
3. CI with trusted publishing wired (id-token: write, npm upgraded past the 11.5.1 OIDC floor) -> still E404, as expected, because OIDC needs a trust relationship configured on npm's side first.

Three credentials, two repositories, two execution environments, all E404 on PUT. Nothing partial landed on any attempt; the registry is still 0.2.9 and quest-darwin-arm64 still lists only 0.2.9.

Root cause, researched by the lore-cli session and confirmed here independently: npm restricted classic tokens for direct publishing. Granular tokens are capped at 90 days and must be created on the website, so a token-based release stops working every quarter and surfaces as a stalled release rather than a warning. The fix is trusted publishing, which needs one website step per package that no automation can perform. The runbook now carries the exact field values for all seven names.

QUEST 0.3.0 IS OTHERWISE COMPLETE:
  tag        v0.3.0 -> d803bcb3636c102736e3614550a22a783be1c83b
  CI         all nine jobs green; receipt emitted, bound by the release gate
  bundle     provenance-checked, byte-identical to the receipt's six digests
  qualified  quest 0.3.0 + lore 0.3.5, 402 rows, 401 PASS 0 FAIL
  publish    one command once trust exists

TWO DEFECTS FOUND AND FIXED WHILE GETTING HERE, both the same class and both caught by evidence rather than reasoning:
1. The candidate bundle was MISATTRIBUTED - it declared a sourceCommit whose bytes it did not carry, because it packed rebuilt artifacts. opum-cli-e2e caught it by digest comparison after qualifying 402 rows against bytes that will never ship. Now closed: the bundle compares each binary against the committed blob and refuses rebuilt artifacts on a release ref.
2. That check then refused its own first tag run, on the two win32 packages, over FILE MODE. The .exe files are committed 100755 and artifact upload does not preserve modes; only the four POSIX binaries had +x restored. Not a false positive - the bundle would have shipped Windows tarballs whose mode differs from the attested artifact.

The generalisation is now in the runbook: because Bun's --compile output is not byte-reproducible, 'rebuild and compare' is not available as a verification technique anywhere in this pipeline. Every artifact claim must anchor to bytes that are STORED, never to bytes that can be regenerated. Both of the above, and the earlier reproduction-gate mistake, are instances of ignoring that.

DEFINITIVE CREDENTIAL DIAGNOSIS, 2026-08-30. The preflight added to release.yml answers the question three opaque E404s could not.

'npm whoami' with the repository's NPM_TOKEN returns E401. The token DOES NOT AUTHENTICATE AT ALL - it is not a valid-but-unscoped token. That distinction matters because the two faults have different fixes and the publish error alone could not tell them apart: npm returns E404 on PUT both for a token that cannot write to a scope and for one that is not recognised.

So all three credentials tried today - the local one, the repository secret, and the OIDC path before npm-side trust exists - fail for the same reason: there is no working credential, and npm has restricted the kind that used to be stored. Consistent with the lore-cli session's research and with their identical symptom on a different package.

The only remaining path is trusted publishing, which requires a per-package website step no automation can perform.

FINAL STATE OF 0.3.0, everything except that step:
  tag        v0.3.0 -> 870d76ef89697ab90411af175156be00f99c0b8c
  CI         all nine jobs green; receipt emitted and bound by the release gate
  bundle     provenance-checked; refuses rebuilt artifacts on a release ref
  qualified  quest 0.3.0 + lore 0.3.5: 402 rows, 402 PASS, 0 FAIL, 0 BLOCKED.
             The first fully qualified run opum-cli-e2e has produced. Scale bound
             BY DIGEST over 10,000 tasks and 100,001 mutating operations.
  provenance committed == bundled == attested == installed, verified four ways
  registry   NOT published. Nothing partial landed on any of four attempts.
  publish    one dispatch once trust exists:
             gh workflow run release.yml --ref v0.3.0 -f publish=true

TRUSTED PUBLISHING IS NOT CONFIGURED FOR QUEST'S SEVEN PACKAGES. That is now a supported conclusion rather than an assumption, because every other cause has been eliminated in CI and the eliminations are visible in the run log.

Run 33298452455, publish job:
  npm 11.19.1          asserted against the 11.5.1 OIDC floor, not assumed
  node v24.19.0        above the 22.14.0 floor
  id-token: write      scoped to the publish job
  environment: release declared, so the OIDC token carries an environment claim
  NODE_AUTH_TOKEN      NOT set, so npm cannot fall back to token auth
  result               E404 on PUT, first package, nothing published

Three wrong diagnoses preceded this, and each was a real defect worth fixing on its own:
1. A dead NPM_TOKEN passed to setup-node's registry-url wrote _authToken into .npmrc, so npm authenticated with a token known to return E401 and NEVER ATTEMPTED OIDC. I had called it a harmless fallback. It was standing in front of the mechanism it was supposed to back up.
2. No environment was declared, so the OIDC token carried no environment claim and could not match a publisher configured with one.
3. Node 22 bundles npm 10.x and the upgrade was never verified. An npm below the floor does not announce itself - it silently skips OIDC and falls back to token auth, producing the same opaque E404.

All three produce E404 on PUT, identically, and so does a missing trust relationship. That is why this took six attempts: npm returns one error for at least four distinct causes, and the only way to reach the fourth was to eliminate the other three in the run log.

The lore-cli session published 0.3.5 successfully through the same mechanism, and their trust relationship turned out to have been configured all along - which is what made 'quest's simply is not' the remaining explanation rather than a guess.
<!-- SECTION:NOTES:END -->
