---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Backlog parity and Lore integration audit
tags:
  - quest
  - backlog
  - parity
  - lore
  - codex
  - audit
summary: Versioned public-surface audit of Backlog.md 1.50.1, Quest 0.1.0, and Lore CLI 0.3.2, with required parity and agent-onboarding work.
timestamp: 2026-08-17T06:04:47.003Z
---

# Quest CLI Backlog parity and Lore integration audit

This audit compares published, caller-observable interfaces only. It does not
treat an internal Quest module, a completed historical task, or an unreleased
runbook as proof that a command is available to an operator or agent.

## Observed versions and method

- Backlog.md: `1.50.1`, enumerated with `backlog --help` and each public
  command group's `--help` output.
- Quest: `@opum-ai/quest@0.1.0`, enumerated with `quest manifest --json` and
  direct command probes.
- Lore CLI: `0.3.2`, enumerated with `lore --help` and its public setup,
  linking, synchronization, and agent-bridge help.

The agreed parity boundary excludes Backlog's separate `doc` command group.
It does not exclude project initialization, task lifecycle, drafts,
milestones, decisions, search, diagnostics, automation, or agent integration.

## Public-surface parity matrix

| Backlog.md surface | Quest parity-branch status | Evidence and required disposition |
| --- | --- | --- |
| `init` project/configuration/Git setup | Implemented | `quest init` creates or discovers an explicit workspace declaration and rejects unsafe pre-existing state; `init --agent-instructions` is opt-in. Clean-workspace and reinitialization subprocess coverage prove the behavior. |
| Agent instructions (`init --agent-instructions`, `agents`) | Implemented | `quest agents --check` and `--update-instructions` manage only the versioned Quest block in `AGENTS.md`, preserving user-authored content and reporting drift. |
| `config` | Missing | No workspace configuration discovery or inspection is advertised. Add explicit configuration read/write and deterministic discovery. |
| `instructions` and shell `completion` | Implemented | The manifest drives discoverable help, versioned instructions, and Bash completion; command-contract and subprocess tests verify the public envelopes. |
| `mcp` | Missing | No Quest MCP command is advertised. Decide and implement the supported automation transport or record an owner-approved exclusion. |
| `task create`, `list`, `view`, `edit` | Partial | These four operations are advertised, but their metadata/filter/lifecycle scope must be compared field-by-field with Backlog. Quest's actor declaration is a deliberate additional safety requirement. |
| `task archive`, `complete`, `demote` | Implemented | Public lifecycle routes retain canonical task identity across active, completed, and archive locations. Quest deliberately requires actor declarations for writes. |
| `draft` | Implemented | Public draft create/list/view/promote/archive routes retain separate draft identities and promote without reusing archived task IDs. |
| `milestone` | Implemented | Public CRUD/list/view routes persist typed milestones with task-reference validation. |
| `board` | Implemented | A deterministic project board is available as a structured CLI result and through the read-only loopback browser surface. |
| `decision` | Implemented | Public CRUD/list/view routes persist typed decision records; document management remains the agreed exclusion. |
| `search` | Implemented | `quest search --all` combines task, milestone, and decision records while keeping the excluded document group out of scope. |
| `doctor` | Implemented | A deterministic read-only report identifies milestone references to unknown tasks. |
| `cleanup` | Implemented | Cleanup is a preview by default and requires both `--confirm` and an actor declaration before mutating closed milestones or superseded decisions. |
| `browser` | Implemented | The loopback-only browser server exposes read-only overview and board endpoints and rejects mutations. |
| `overview` | Implemented | A deterministic project overview aggregates task, milestone, and decision states. |

Quest's machine-readable manifest and uniform structured diagnostics now cover
the delivered bootstrap, lifecycle, planning, and operator surfaces. The
remaining deliberate gaps are public `config`, `mcp`, and the separate
document-management group; the first two remain owner decisions rather than
implicitly accepted exclusions.

## Task lifecycle compatibility map

| Backlog.md behavior | Quest behavior | Compatibility disposition |
| --- | --- | --- |
| Create accepts title, description, labels, documentation, and administrative metadata. | `task create` accepts title, description, labels, and documentation, and requires an explicit human or accountable delegated actor. | Partial: the common authored fields are supported; actor attribution is deliberately stronger. Administrative metadata remains a parent-level parity decision. |
| List and search filter across the full Backlog task metadata surface. | `task list` filters by status and label; `search` searches task records, while `search --all` also returns milestones and decisions. | Partial: supported filters and result envelopes are deterministic; omitted metadata filters remain visible parity debt rather than an implicit exclusion. |
| View resolves a task reference and exposes authored state. | `task view` resolves canonical IDs and aliases and returns the structured task record. | Implemented for Quest-owned records, including lifecycle location and revision-bearing mutation results. |
| Edit changes fields and lifecycle state subject to Backlog policy. | `task edit` changes status, description, labels, and documentation; all writes require an actor declaration. | Partial: common mutation paths are implemented with a deliberate accountability requirement; unimplemented administrative fields remain parent-level parity debt. |
| Complete/archive retain an observable task history. | `task complete`, `task archive`, and `task demote` move one canonical `T-N` record among active, completed, and archive locations through journaled recovery. | Implemented with stronger global identity preservation and explicit crash recovery. |
| Drafts can be created, inspected, promoted, and archived. | `draft create`, `list`, `view`, `promote`, and `archive` use separate `D-N` identities; promotion allocates a task ID that cannot collide with retained records. | Implemented. |
| Diagnostics use Backlog's CLI result conventions. | Successes use versioned envelopes; usage, not-found, denied, conflict, validation, and drift diagnostics have stable exit codes and retain `principal: null`. | Implemented; actor-free writes are deliberately denied rather than inferred. |

The lifecycle routes are therefore complete within QCLI-97.4's retention and
integrity boundary. The map intentionally leaves broader task administrative
field parity visible for QCLI-97 rather than treating that absence as an
approved exclusion.

## Lore and Codex alignment

Lore 0.3.2 provides `link`, `unlink`, `sync`, and `tasks` for Story-to-task
coupling, and `agents` to regenerate Lore's own skill/agent bridge. Its public
linking surface accepts a concept ID and task IDs; it exposes no flag or
configuration command selecting Quest as the task backend. In the current
repository, `lore link` and `lore sync` operate on Backlog task data and
maintain `doc:` task back-references.

Therefore a globally installed Quest command cannot make Codex aware of a
project by itself, and it cannot currently substitute for Backlog beneath
Lore. A compatible design needs all of the following:

1. `quest init` creates an explicit, repository-local workspace declaration
   and refuses ambiguous or pre-existing unmanaged state.
2. `quest instructions` and `quest agents` expose a versioned agent protocol;
   managed instruction blocks must be opt-in and preserve surrounding content.
3. A negotiated Lore adapter contract selects Quest deliberately rather than
   guessing from task IDs, including read, write, JSON-envelope, actor, and
   synchronization semantics.
4. Cross-product conformance tests run a real Lore operation against a
   initialized Quest workspace and prove managed Story-task synchronization.

## Delivery decomposition

QCLI-97 owns the result. The independently reviewable follow-up slices are:

1. **Bootstrap and agent discovery:** `init`, workspace discovery/config,
   help/instructions/completion, and managed Codex agent instructions.
2. **Task-lifecycle parity:** missing archive/completion/draft behavior plus
   a product decision for retention and lifecycle compatibility.
3. **Planning and operations parity:** milestones, decisions, overview, board,
   search coverage, diagnostics, cleanup, and any explicit exclusions.
4. **Automation and Lore adapter:** MCP decision/surface, a versioned
   Quest-to-Lore adapter contract, and real cross-product conformance tests.
5. **Release qualification:** a new public manifest, migration path for
   existing `.quest` data, CLI/agent documentation, and clean-install tests.

No slice may claim parity merely because a similarly named internal module or
completed QCLI-78--QCLI-91 task exists. The public manifest and clean-installed
behavior are the release contract.
