---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Migrate from Backlog.md reversibly without inheriting its ID grammar
tags:
  - quest
  - cli
  - migration
  - backlog
  - fidelity
summary: Migration is dry-runnable, reversible, and never mutates the source project, and Quest declines to inherit Backlog.md's identifier grammar.
timestamp: 2026-08-05T11:44:34.912Z
---

# Migrate from Backlog.md reversibly without inheriting its ID grammar

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.5` and operationalised by `QCLI-2.10`, recorded in the
[Backlog migration fidelity contract](../reference/quest-cli-backlog-migration-fidelity-contract.md)
under "The fidelity contract (AC3)", as contract 5 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md),
and as a nine-step procedure in the
[Backlog adoption and migration playbook](../reference/quest-cli-backlog-adoption-and-migration-playbook.md).

Every Backlog.md behaviour cited below derives from the pinned build **v1.49.3**. That
pin's own recheck clause obliges re-verification before anything freezes on it, and it has
not been re-checked since 2026-08-04 — see the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).

## Context

Adopting Quest means moving a project's real, in-use task data. Users have no reason to
trust that migration, and every reason not to: their existing records are the work, and a
migration that mangles them is not recoverable by apologising.

The research studied Backlog.md **only through its public contracts** — published
documentation, help output, plain and JSON output, and artifacts produced by running the
binary against throwaway scratch repositories. Its implementation source and internal
tests are excluded by an owner ruling, not merely unread. That constraint shaped what
could be promised: Quest can commit to preserving what a documented public surface
exposes, and must record as an explicit gap anything it cannot see.

Three findings drove the decision:

- **A same-identifier collision across the active and archive boundary is invisible to
  every enumerated Backlog.md command.** This is not an adversarial construction — it
  arises from ordinary archive-then-recreate usage, and Backlog's own repair command
  scopes itself to active and completed tasks, so it never looks where the collision is.
  A migration that trusted that scope would silently merge two distinct records.
- **Identifier counters are not global.** Promoting, archiving, and demoting free and
  reassign numerals independently, so a source identifier alone does not identify a
  record.
- **Backlog.md's identifier grammar is project-configurable** — prefix, zero-padding, and
  a dot-suffixed hierarchy. Inheriting it would import a stranger's configuration into
  Quest's own domain model permanently.

## Decision

**Migration is previewable, reversible, and never mutates the source. Quest declines to
inherit Backlog.md's identifier grammar.**

Six properties, all normative:

1. **Deterministic dry runs.** A complete no-mutation preview reports exactly what the
   migration would create and map, exits `0`, and returns `requiresApproval: true` plus a
   deterministic digest while approval is outstanding. The preview enumerates, per source
   record, its lifecycle-folder origin, source identifier, proposed target identifier, and
   any flagged collision or gap.
2. **Reversible identifier mapping**, persisted and keyed on **the pair of source folder
   and source identifier** — never the identifier alone, because the identifier alone is
   not unique. Given a target identifier, Quest recovers the exact source file without
   re-scanning the source project.
3. **Collision handling wider than the source tool's own.** Both same-scope and
   cross-scope duplicate identifiers are detected and reported, **never silently
   resolved**. Quest's scan must be strictly wider than Backlog's repair scope, because
   that scope is where the real collision hides.
4. **Source immutability.** The read phase never invokes a source-mutating command against
   a user's live project, at any point, **including for convenience**. Auto-running a
   repair to tidy a collision before reading it is specifically forbidden: report it and
   let the user, or a later explicitly consented step, decide.
5. **One-writer coexistence.** The read pass must not run concurrently with a live
   Backlog.md write session, and this is a documented operational precondition rather than
   a guarantee Quest can enforce — Backlog provides no lock file and no quiescence signal.
   A long-running read pass re-scans and diffs the file list on completion and **flags,
   never silently merges**, anything that changed mid-scan.
6. **Rollback evidence.** For every record created on the target side, Quest records
   source folder, source identifier, target identifier, and a timestamp sufficient for a
   manual rollback without re-running the mapping or re-scanning the source.

And the grammar decision: **Quest defines its own canonical identifier grammar.**
Backlog's configurable prefix, zero-padding, and dot-suffixed hierarchy are a migration
input, not an inherited design.

Deliberately **not** decided here: Quest's actual identifier grammar (register D4);
whether and how to preserve Backlog-era Git history; and whether Quest needs an analogue
of Backlog's cross-branch task-state overlay — a real, currently active feature whose
reconciliation algorithm is not derivable from any admissible public surface.

## Consequences

- **Migration is a first-class subsystem with its own persisted state**, not a one-shot
  import script. The mapping outlives the migration because rollback depends on it.
- **Preview success is explicit, not a completed apply.** A successful read-only preview
  exits `0`, while `requiresApproval: true` and its deterministic digest prevent a caller
  from mistaking reviewable evidence for an applied migration.
- **Some fidelity gaps are permanent and must be stated as gaps**, not quietly
  approximated: a derived completion percentage has no stored counterpart to copy, and
  fuzzy-index state is not exposed by any documented surface.
- **Coexistence is bounded by a documented window** with drift monitoring, per the
  playbook, because one-writer-per-repository cannot be enforced technically.
- **The v1.49.3 pin is a live liability.** The findings above describe that build. A newer
  Backlog.md may have changed any of them, and the contract's recheck clause obliges
  re-verification before Phase 4 relies on it.
