<!-- BACKLOG.MD GUIDELINES START -->
<!-- backlog.md-instructions-version: 1.48.0 -->
<CRITICAL_INSTRUCTION>

## Backlog.md Workflow

This project uses Backlog.md for task and project management.

**For every user request in this project, run `backlog instructions overview` before answering or taking action.**

Use the overview to decide whether to search, read, create, or update Backlog tasks.

Before task lifecycle actions, read the matching detailed guide:
- `backlog instructions task-creation` before creating or splitting tasks
- `backlog instructions task-execution` before planning, changing status or assignee, adding a plan or implementation notes, or implementing task work
- `backlog instructions task-finalization` before checking acceptance criteria, writing final summaries, or moving tasks to terminal statuses

Use `backlog <command> --help` before running unfamiliar commands. Help shows options, fields, and examples.

Do not edit Backlog task, draft, document, decision, or milestone markdown files directly. Use the `backlog` CLI so metadata, relationships, and history stay consistent.

</CRITICAL_INSTRUCTION>
<!-- BACKLOG.MD GUIDELINES END -->

<!-- lore:agents:begin -->
This repo uses **lore** — an OKF-native documentation CLI — for the docs bundle under `docs/`.
When working on documentation, drive it through `lore` (not a plain editor) so Story <-> Task
coupling, managed blocks, and cross-links stay coherent.

- **Skill:** `.claude/skills/lore/SKILL.md` — how to drive lore.
- **Just-in-time detail:** run `lore instructions` for the canonical agent loop, then
  `lore instructions <topic>` (`linking`, `sync`, `check`, `validation`, `workspace`).
<!-- lore:agents:end -->

## Consolidated authority routing

`quest-cli` owns the `quest` package and command, component contracts, formats,
Git/filesystem behavior, implementation, tests, migration, packaging, releases,
and local operations. Read its local evidence before making a component claim.

Route product-wide strategy, architecture, roadmap, and provenance policy directly to
the [consolidated Quest namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/quest).
Route Lore-owned integration and activation-gate policy directly to the
[consolidated Lore namespace](https://github.com/opum-ai/opum-doc/tree/dev/docs/lore).
Route portfolio, billing, hosted collaboration, and commercial policy to `opum-doc`.

Do not copy mutable product or gate criteria into this repository. A local activation
record may preserve its dated observations and state only what quest-cli consumed; the
current gate result and criteria belong to the Lore owner. If local evidence disagrees
with either consolidated namespace, record the drift and route it to that owner.

All estate repositories are private. GitHub links are access-gated; a 404 is not path
evidence. Cite moving authority by path and branch, not a guessed current SHA. Historical
`quest-doc`, `lore-doc`, or `salient-data/*` mentions in dated provenance stay historical
and must not be promoted into active instructions.
