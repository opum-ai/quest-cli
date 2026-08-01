---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Use quest-cli for the Quest package and command
tags:
  - quest
  - cli
  - package
  - repository
  - ownership
summary: Establishes quest-cli as the component home for the quest npm package, executable, contracts, tests, and releases.
timestamp: 2026-08-01T17:11:23.739Z
---

# Use quest-cli for the Quest package and command

## Status

Accepted

## Context

The execution-graph concept was initially researched in a repository named
`opum-cli`, with a planned `opum` package and command. The owner subsequently
named the execution product Quest, reserved Opum for the hosted platform,
renamed that old repository to `opum-doc`, and created this repository as a
clean component home.

A dedicated Quest repository must not erase useful research provenance or
inherit the old product name. It also should not split a kernel package before
there is a demonstrated second consumer.

## Decision

1. `salient-data/quest-cli` and `/Volumes/external/repos/quest-cli` are the
   canonical component repository and local worktree.
2. The executable is `quest`. The preferred npm package is the unscoped name
   `quest`, subject to registry ownership, provenance, licensing, and protected
   release checks; an owner-approved scope is the fallback while the executable
   remains `quest`.
3. Begin as one package with an enforced CLI → application → domain → ports
   boundary. Create a separately released kernel only after a concrete second
   in-process consumer, incompatible runtime needs, independent cadence, or
   measured subprocess cost justifies it.
4. This repository owns local formats and behavior, Git/filesystem mutation,
   migration, projection, tests, packaging, releases, and component runbooks.
   Quest-wide strategy belongs to `quest-doc`; the website belongs to
   `quest-web`; Opum SaaS belongs to `opum-doc`.
5. Adopt former OCLI research only through the migration ledger and fresh
   provenance checks. Do not copy legacy or Backlog.md implementation source
   or internal tests.
6. Research and documentation may proceed before Lore finishes. Product source,
   runtime dependencies, executable scaffolding, and publication wait for the
   canonical Lore release and clean-room activation gates.

## Consequences

Quest has a clean name and implementation home while the former OCLI history
remains auditable. One package reduces versioning and distribution overhead,
but internal boundaries must be enforced from the first implementation slice.

The package name remains a preference, not a release claim. This repository
must not display a working install command until a protected immutable package
is actually published and clean-install verification passes.
