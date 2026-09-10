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
   Quest-wide strategy and retained provenance route through
   [Opum's Quest external routing and provenance record](https://github.com/opum-ai/opum-doc/blob/dev/docs/quest/quest-external-routing-and-provenance.md);
   the website belongs to `quest-web`; Opum SaaS belongs to `opum-doc`.
5. Adopt former OCLI research only through the migration ledger and fresh
   provenance checks. Do not copy legacy or Backlog.md implementation source
   or internal tests.
6. Research and documentation may proceed before Lore finishes. Product source,
   runtime dependencies, executable scaffolding, and publication wait for the
   canonical Lore release and clean-room activation gates.

**Amendment — 2026-08-04 (QCLI-5).** Decision item 1's repository identity is
**superseded**. At the owner's direction the repository was transferred from
`salient-data/quest-cli` to `opum-ai/quest-cli`; `opum-ai/quest-cli` is now the
canonical component repository. GitHub redirects the former path, but active
references should use the current identity — a redirect makes a stale reference
succeed silently, which is how the parallel `salient-data/lore-cli` →
`opum-ai/lore-cli` transfer initially went unnoticed. The local worktree at
`/Volumes/external/repos/quest-cli` is unchanged. Nothing else in decision item
1 is affected.

Decision item 2 is **not** superseded — it is now **exercised**. It already
provided that "an owner-approved scope is the fallback while the executable
remains `quest`". That fallback is taken: the package is `@opum-ai/quest`,
matching `lore-cli`'s observed pattern of repository `<name>-cli` publishing as
`@opum-ai/<name>`, and the executable remains `quest`. The unscoped `quest` is
occupied on the public registry by an unrelated party (v0.4.0), which is now
only the *rationale* for going scoped rather than an open allocation question.
`@opum-ai/quest` is unclaimed as of this amendment and is **not** reserved,
published, or released by it — decision item 6's gate still stands, and the
final allocation record remains QCLI-2.9's.

Decision items 3, 4, and 5 stand unchanged. The provenance classification of
every source slice behind this ADR lives in
[the research source register](../reference/quest-cli-research-source-register.md).

## Consequences

Quest has a clean name and implementation home while the former OCLI history
remains auditable. One package reduces versioning and distribution overhead,
but internal boundaries must be enforced from the first implementation slice.

The package name remains a preference, not a release claim. This repository
must not display a working install command until a protected immutable package
is actually published and clean-install verification passes.
