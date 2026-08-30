---
# yaml-language-server: $schema=../../.lore/schemas/runbook.schema.json
type: Runbook
title: Quest CLI package and release
tags:
  - quest
  - cli
  - packaging
  - release
summary: Immutable package qualification, release, rollback, and publication-truth procedures for Quest.
timestamp: 2026-08-16T18:27:08.312Z
---

# Quest CLI package and release

## Purpose

Qualify immutable Quest package candidates, publish only under explicit owner
authorization, and retain accurate availability and rollback truth when a
release does not complete.

## Prerequisites

- A reviewed source commit and the exact root plus six platform tarballs:
  darwin/linux/win32 on x64 and arm64.
- CI, not a workstation, for any build that must cover all six platforms. Bun
  refuses `bun-windows-aarch64` outright — `error: Unsupported compile target`
  — so no single machine can produce the full set, which is why the win32-arm64
  binary comes off a `windows-11-arm` runner. A local `bun run build:packages`
  gets four of six and then stops, leaving the working tree half-built.
- Package checks that prove root/platform version and SHA-256 agreement,
  platform constraints, license, repository identity, and published-file
  contents.
- A native-execution receipt emitted by the tagged CI run, binding that exact
  commit and version. A receipt made by hand after the fact is not acceptable
  evidence: the one that existed before QCLI-135 outlived the release it
  described, and downstream qualification then failed closed against it.
- Explicit owner authorization immediately before publication. This task does
  not reserve a name, alter registry access, or publish on its own.

## Steps

1. Build candidates from the reviewed commit. Record the source SHA, Bun
   version, root checksum, each platform checksum, and every compiler fallback
   used. A local compiler cache is build infrastructure, never a package
   payload.

2. Run the artifact and packed-tarball gates:

   ```sh
   bun run check:packages
   bun run test:packages
   ```

   The candidate must contain only the root Node launcher or a single platform
   binary, its manifest, and the license. It must not ship source TypeScript,
   development fixtures, private workspace paths, or a host Bun dependency.

3. Require QCLI-93's qualification evidence to name the exact clean-install
   harness and immutable tarball for every platform target. It must cover
   `quest --version`, `quest manifest --json`, a task operation, projection
   access/rebuild, and migration smoke behavior. Projection and migration
   smoke commands are not public 0.1 executable commands, so do not present
   invented interactive syntax here: a missing harness or unavailable target
   is an explicit publication-blocking gate, not an assumed pass.

4. Run the complete qualification record: type, formatting, layer, unit,
   contract, integration, black-box, fault, clone/worktree, migration, scale,
   package, provenance, dependency-license, checksum, and repository-identity
   checks. Attach each command, result, candidate checksum, and skipped-gate
   reason to the release evidence.

5. Require the native-execution receipt for this exact commit and version.
   Create the release tag, then dispatch the qualification workflow **against
   that tag**:

   ```sh
   git tag v<version> && git push origin v<version>
   gh workflow run prepublication-qualification.yml --ref v<version>
   ```

   Dispatch explicitly rather than relying on the tag push to trigger it. The
   workflow's `push` trigger carries a `paths` filter, which is evaluated
   against the tagged commit's own diff, so tagging a commit that did not
   touch those paths starts no run at all. A dispatch against the tag always
   does, and sets `github.ref` to `refs/tags/v<version>`, which is what the
   release-only jobs key off.

   On a tag ref each platform job additionally proves its rebuild reproduces
   the digest committed at that ref, and an aggregation job emits the receipt
   from the run's own metadata and uploads it as the
   `native-execution-receipt` artifact. Download it and run the gate:

   ```sh
   bun run receipt:require -- --receipt native-execution-receipt.json
   ```

   The gate re-derives every digest from the artifacts on disk rather than
   trusting the document, and refuses a receipt bound to any other commit or
   version. A failure here is publication-blocking: without it the run proves
   only that a binary built from this source executes on each target, not that
   the bytes about to be published do.

6. Immediately before a separately authorized publish, recheck the registry
   name and conflicts, the repository identity, current Lore release gate, and
   package metadata. If any fact changed, stop for an owner decision; do not
   substitute a package name or artifact.

7. Publish the exact reviewed immutable artifacts only after the owner grants
   that authorization. Then clean-install from the registry and repeat the
   public version, manifest, task, projection, and migration smokes. Only this
   successful verification permits availability or install documentation.

8. Confirm the receipt describes what the registry actually serves, then hand
   it to downstream qualification:

   ```sh
   bun run receipt:verify-published -- <version> --receipt native-execution-receipt.json
   ```

   This downloads all six platform tarballs and compares each binary's digest
   to the receipt. Publish the receipt to the consuming harness only after it
   passes; a receipt that describes a build nobody published is the exact
   failure this step exists to prevent.

## Exercising a build before it is published

To qualify changes that have not been released, dispatch the qualification
workflow against the branch and collect the `quest-candidate-bundle` artifact:

```sh
gh workflow run prepublication-qualification.yml --ref <branch>
gh run download <run-id> --name quest-candidate-bundle --dir candidate
```

The bundle is digest-pinned and reaches no registry. A consumer binds it with
`--quest-candidate` and installs Quest from the exact tarballs inside it,
recomputing every executable digest from those bytes.

State what it does and does not establish, rather than reporting the verdict
alone. Binding a candidate replaces per-platform CI-receipt rows with
candidate-byte rows: it gains live digest re-derivation and binds the binary
that actually runs the behavioural rows, and it loses execution attestation for
the platforms the running host cannot execute. Six targets attested becomes one
target executed plus six artifacts digest-bound. The native-execution receipt
covers the second, so the two are complementary rather than substitutes, and
neither is soak.

The consuming harness may also read the platform and root `package.json` from a
sibling source checkout rather than from the bundle. Tell the consumer which
checkout and which version to expect, and leave it there for the duration of
the run; a working tree that moves mid-run fails those rows on a mismatch that
has nothing to do with the candidate.

## Rollback

Before publication, discard only candidate artifacts and keep the evidence
showing that nothing was released. After publication, preserve the immutable
version, integrity values, source commit, and verification record. Do not
claim an unpublished candidate is available, overwrite published history, or
quietly replace an artifact. If withdrawal or deprecation is required, obtain
separate owner authorization and document the registry's actual state.
