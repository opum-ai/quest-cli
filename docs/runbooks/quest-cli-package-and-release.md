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
- The exact Bun version this repository pins (`packageManager` in
  `package.json`; the workflows' `bun-version` matches it), for any build
  covering all six platforms **and any `bun install`/lockfile touch before
  it**. Cross-compiling `bun-windows-aarch64` requires a recent Bun: 1.2.x
  refuses it outright with `error: Unsupported compile target`, and
  `build:packages` then stops after four of six, leaving the tree
  half-built. A mismatched Bun is also more dangerous the other way:
  running `bun install` with 1.2.x against a repo pinned to 1.3.14 silently
  dropped `bun.lock`'s `configVersion` field — no error, no warning, just a
  lockfile in a format CI's frozen-lockfile install does not expect. Check
  `bun --version` against `package.json`'s `packageManager` before touching
  `bun.lock` or building, not after. `bun upgrade` does not take a version;
  use `bun update --version <version>`, or
  `curl -fsSL https://bun.sh/install | bash -s "bun-v<version>"` for an
  exact pin.
- Package checks that prove root/platform version and SHA-256 agreement,
  platform constraints, license, repository identity, and published-file
  contents. This is why platform binaries get built **locally, before any
  commit**, not via a CI dispatch on the branch: `check:packages` runs as
  part of `source-gates`, and `immutable-candidates` (the job that actually
  rebuilds the six platforms) `needs: source-gates` — so a commit whose
  platform packages don't yet match the bumped root version fails the very
  gate that would let CI fix it. That is expected, not a runbook gap: build
  locally with the matched Bun version first (previous bullet), commit
  root and platform changes together as one reviewed commit, and only then
  let CI validate it.
- A native-execution receipt emitted by the tagged CI run, binding that exact
  commit and version. A receipt made by hand after the fact is not acceptable
  evidence: the one that existed before QCLI-135 outlived the release it
  described, and downstream qualification then failed closed against it.
- Trusted publishing configured for all seven package names, **created by hand
  for each one**. It does not propagate: `@opum-ai/lore` published 0.1.0 through
  0.3.4 with no trusted publisher and only gained one before 0.3.5, on the same
  npm account, the same organization and the same scope as Quest.

  To check whether a package has ever published through it, without publishing:
  npm attaches a provenance attestation automatically on an OIDC publish, so the
  attestation is a fossil of how each version shipped.

  ```sh
  curl -s https://registry.npmjs.org/@opum-ai%2Fquest \
    | python3 -c "import json,sys;d=json.load(sys.stdin);print({v:('attestations' in d['versions'][v].get('dist',{})) for v in d['versions']})"
  ```

  There is no read path for the configuration itself — no CLI subcommand, and
  the `/access` page is browser-only — so this is the only way to tell from
  outside.
- Trusted publishing configured for all seven package names. npm restricted
  classic tokens for direct publishing, so a stored token cannot publish: both a
  local `npm publish` and the workflow's `NPM_TOKEN` return E404 on PUT, npm's
  response to a token that cannot write to the scope. Granular tokens are capped
  at 90 days and must be created on the website, so a token-based release stops
  working every quarter and surfaces as a stalled release rather than a warning.

  One-time setup per package, at `https://www.npmjs.com/package/<name>/access` —
  not the account settings page — for `@opum-ai/quest` and each of the six
  platform packages:

  | Field | Value |
  | --- | --- |
  | Organization | `opum-ai` |
  | Repository | `quest-cli` |
  | Workflow filename | `release.yml` (filename only, not a path) |
  | Environment | `release` (the job declares one) |

  **npm returns E404 on PUT for at least four different causes** and gives no
  way to tell them apart: a token that cannot write to the scope, a token that
  does not authenticate, an npm below the OIDC floor that silently skipped
  trusted publishing, and no trust relationship at all. Quest's 0.3.0 release
  hit three of the four in sequence. The workflow now eliminates the first
  three before the registry is touched — no token is configured, the npm floor
  is asserted rather than assumed — so an E404 that survives all of that means
  the configuration is missing or mistyped.

  Every field is case-sensitive and **npm does not validate them on save**, so a
  typo appears only as a failed publish. GitHub-hosted runners only.
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

   On a tag ref each platform job executes the **committed** artifact rather
   than rebuilding it, having first attested that the binary on disk is
   byte-identical to the blob at that ref. Rebuilding would defeat the receipt:
   Bun's `--compile` output is not byte-reproducible, so a rebuilt binary is a
   different artifact from the one being published. An aggregation job then
   emits the receipt from the run's own metadata and uploads it as the
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
   that authorization. Dispatch the release workflow against the tag, dry run
   first:

   ```sh
   gh workflow run release.yml --ref v<version> -f publish=false
   gh workflow run release.yml --ref v<version> -f publish=true
   ```

   The workflow fetches the receipt from the qualification run for that exact
   commit rather than accepting one as input, and refuses to publish without
   it. Platform packages publish before the root, so the root never briefly
   advertises `optionalDependencies` that do not exist. Then clean-install from the registry and repeat the
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

## Anchor every artifact claim to stored bytes

Bun's `--compile` output is **not byte-reproducible**: the same source at the
same Bun version produces a different binary on a different machine. Measured,
not assumed — six platform jobs each reported a mismatch against binaries built
locally minutes earlier.

So *rebuild and compare* is not available as a verification technique anywhere
in this pipeline. Every claim about an artifact must anchor to bytes that are
**stored** — the blob committed at the release ref — never to bytes that can be
regenerated. Two mistakes have already come from ignoring this: a reproduction
gate that could never pass, and a candidate bundle that named a commit whose
bytes it did not carry.

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
