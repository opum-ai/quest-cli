---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Require atomic idempotent operation-owned mutations
tags:
  - quest
  - cli
  - git
  - filesystem
  - invariants
summary: "Five mutation invariants govern every Quest write: atomicity, idempotency, conflict detection, operation-owned staging, and read-only purity."
timestamp: 2026-08-05T11:44:34.703Z
---

# Require atomic idempotent operation-owned mutations

## Status

Accepted. This record promotes a decision the research campaign already settled; it
does not make a new one.

Settled by `QCLI-2.6` as invariants `INV-1` through `INV-5`, recorded in the
[Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
under "Mutation invariants (AC2)" and restated verbatim as contract 4 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md).

## Context

Quest writes into a repository that is not its own. The working tree it mutates belongs
to a user who has their own uncommitted edits in it, their own staging area, and their own
expectations about what a tool is allowed to touch.

The threat model enumerated thirteen categories of thing that goes wrong there — dirty
worktrees, partial writes, retries, duplicate events, aliases, clock skew, races,
divergence, hostile paths, encoding, case folding, subdirectories, repository removal —
and the striking result is that they collapse into a small number of invariants. Most of
the thirteen are the same handful of failures arriving through different doors.

Two of those failures are worth naming because they are the ones that destroy user data
rather than merely failing:

- **Absorbing unrelated changes.** A tool that runs `git add -A` and commits has just
  committed the user's half-finished work under Quest's message. A tool whose *error
  recovery* discards uncommitted changes has done something worse, because it happens at
  exactly the moment the user is least able to predict it.
- **Mutating on a read.** A command a user believes is an inspection, which writes,
  is a command whose safety cannot be reasoned about at all — and the tempting
  implementation, refreshing a cache during a read, is exactly this.

## Decision

**Five invariants govern every Quest mutation. They are not guidelines; a violation is a
defect.**

| Invariant | Statement |
| --- | --- |
| `INV-1` Atomicity | A mutating operation's owned filesystem and Git effects either all become visible together, or none do |
| `INV-2` Idempotency | Invoking the same logical operation more than once for the same logical request produces the same observable end state as invoking it exactly once |
| `INV-3` Conflict detection | An authoritative write is conditioned on the state it read, as a compare-and-swap against the target ref; a losing write is rejected with a structured conflict, never silently retried, force-applied, or resolved by discarding already-committed history |
| `INV-4` Operation-owned staging and commits | An operation stages and commits exactly the paths it owns for its own logical effect, determined before any write begins |
| `INV-5` Zero mutation from read-only commands | A command classified read-only performs no filesystem or Git mutation under any circumstance — success, not-found, or error path alike — regardless of a concurrent writer |

Two details in that table carry more weight than their length suggests. `INV-4` requires
the owned path set to be determined **before any write begins**, which rules out the
natural implementation of discovering what to stage by inspecting the tree afterwards.
`INV-5` says **under any circumstance**, which explicitly includes the error path — the
place where a cleanup routine would otherwise be free to write.

Deliberately **not** decided here: the event schema and locking primitive these
invariants are enforced over. Those remain open in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).
The file layout and naming scheme once grouped alongside them here are no longer
open: both **closed 2026-08-05** by
[Adopt a T-prefixed canonical identifier grammar and its authored-record
layout](adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md)
(`QCLI-25`/D4) — see the register's Git mutation contract entries.

## Consequences

- **Every mutating operation needs a declared path set**, computed up front. This is a
  real constraint on the application layer's shape, not a detail of the Git adapter.
- **Retry is safe by construction**, which is what makes crash recovery tractable: a
  resumed operation may redo work without needing to know whether the previous attempt
  got partway.
- **A rejected write must surface as a distinct outcome** the caller can act on. This is
  why the command surface needs a structured decline-or-conflict result separate from
  error — see
  [Emit three categorical command outcomes over a versioned envelope](emit-three-categorical-command-outcomes-over-a-versioned-envelope.md).
- **Read-only classification becomes part of the command contract**, not an implementation
  property. A command's classification must be knowable without reading its
  implementation, and cache refresh cannot be hidden inside a read.
- **Verification is fault-injection, not unit testing.** These invariants are only
  meaningfully tested by killing the process mid-write (`TM-01`), killing it after commit
  but before the caller sees the result (`TM-02`), crashing with a dirty worktree
  (`TM-07`), and failing partway through multi-file staging (`TM-12`), against real
  clones. Scenarios `BB-05`, `BB-06`, `BB-12`, `BB-13`, `BB-16`, and `BB-17` cover the
  observable half.
