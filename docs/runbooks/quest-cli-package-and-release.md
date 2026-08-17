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
- Package checks that prove root/platform version and SHA-256 agreement,
  platform constraints, license, repository identity, and published-file
  contents.
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

5. Immediately before a separately authorized publish, recheck the registry
   name and conflicts, the repository identity, current Lore release gate, and
   package metadata. If any fact changed, stop for an owner decision; do not
   substitute a package name or artifact.

6. Publish the exact reviewed immutable artifacts only after the owner grants
   that authorization. Then clean-install from the registry and repeat the
   public version, manifest, task, projection, and migration smokes. Only this
   successful verification permits availability or install documentation.

## Rollback

Before publication, discard only candidate artifacts and keep the evidence
showing that nothing was released. After publication, preserve the immutable
version, integrity values, source commit, and verification record. Do not
claim an unpublished candidate is available, overwrite published history, or
quietly replace an artifact. If withdrawal or deprecation is required, obtain
separate owner authorization and document the registry's actual state.
