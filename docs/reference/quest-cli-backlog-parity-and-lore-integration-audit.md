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

| Backlog.md surface | Quest 0.1.0 status | Evidence and required disposition |
| --- | --- | --- |
| `init` project/configuration/Git setup | Missing | `quest init` returns the structured `usage` diagnostic. Add a safe, idempotence-aware workspace initializer; it must not infer or overwrite a workspace. |
| Agent instructions (`init --agent-instructions`, `agents`) | Missing | Quest has no `agents` or `instructions` command. Add opt-in, managed-block integration for `AGENTS.md` and relevant Codex instructions, preserving user-authored content. |
| `config` | Missing | No workspace configuration discovery or inspection is advertised. Add explicit configuration read/write and deterministic discovery. |
| `instructions` and shell `completion` | Missing | Bare `quest` and `quest --help` both fail with usage exit 2. Add help, instructions, and completion as stable public contracts. |
| `mcp` | Missing | No Quest MCP command is advertised. Decide and implement the supported automation transport or record an owner-approved exclusion. |
| `task create`, `list`, `view`, `edit` | Partial | These four operations are advertised, but their metadata/filter/lifecycle scope must be compared field-by-field with Backlog. Quest's actor declaration is a deliberate additional safety requirement. |
| `task archive`, `complete`, `demote` | Missing | Quest has no public archive/completed/draft transition surface. This also exposes the unresolved archival/retention decision. |
| `draft` | Missing | No public draft create/list/promote/archive lifecycle exists. |
| `milestone` | Missing | No milestone CRUD, assignment, or completion view exists. |
| `board` | Missing | No Kanban view or export exists. |
| `decision` | Missing | No decision-record surface exists. This is not part of the excluded document-management group. |
| `search` | Partial | Quest advertises task search only; Backlog searches tasks, decisions, and documents. Excluding `doc` CRUD does not by itself justify omitting decision search. |
| `doctor` | Missing | No duplicate-ID diagnosis or safe repair preview is advertised. |
| `cleanup` | Missing | No completed-record retention/cleanup policy or command is advertised. |
| `browser` | Missing | No local read-only browser/API surface is advertised. |
| `overview` | Missing | No project statistics or readiness overview is advertised. |

Quest's machine-readable manifest and uniform structured diagnostics are useful
compatibility foundations, but they do not compensate for the missing command
groups or bootstrap path.

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
