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

## Repository role

`quest-cli` is the Quest tracker CLI: the deterministic, LLM-free task record layer
(package `@opum-ai/quest`, binary `quest`). This repository owns the CLI's implementation,
component contracts, formats, Git/filesystem behavior, tests, migration, packaging,
releases, and local operations — see "Consolidated authority routing" below for what
routes elsewhere.

## Approval routing

`opum-agent` (`opag`) is the user's designated approval proxy for this repository. When
work here is directed by `opag`, or by a peer acting under its authorization, route
requests that would otherwise need interactive confirmation to `opag` rather than
blocking on approval in this session. This does not relax care around destructive or
hard-to-reverse actions — it changes who is asked, not whether asking still matters.

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

Repository visibility is mixed and must be checked rather than assumed: `quest-cli` and
`lore-cli` are public; `opum-cli-e2e` and the doc repositories are private. For a private
repository a 404 on a GitHub link is access-gating, not path evidence; for a public one it
is real evidence the path is wrong. Verify with `gh api repos/<org>/<name> --jq .visibility`
before relying on either reading. Cite moving authority by path and branch, not a guessed
current SHA. Historical `quest-doc`, `lore-doc`, or `salient-data/*` mentions in dated
provenance stay historical and must not be promoted into active instructions.

## Sibling sessions

Quest is developed alongside two sibling repositories, each usually driven by its own
Claude Code session. They are peers, not subordinates: none can commit in another's
repository, and each owns its own evidence.

| Repository | Owns | Reach it |
| --- | --- | --- |
| `lore-cli` | The `lore` CLI and the Lore-side tracker adapter, including `MIN_QUEST_VERSION` and the manifest handshake | `herdr agent prompt wR:pD "…"` |
| `opum-cli-e2e` | The cross-product qualification harness: the row matrix, digest binding, scale evidence, and the native-receipt validator | `herdr agent prompt wK:pR "…"` |

Pane ids move between sessions. Confirm with `herdr agent read <pane>` before trusting one,
or discover peers with `ListAgents` / `list_sessions`.

**Quest and Lore release as a pair.** A Quest release that changes the tracker surface is
qualified against a published Lore, and vice versa. Before cutting a release, tell `lore-cli`
what is landing — in particular any change to `TRACKER_CONTRACT_VERSION`, an envelope `kind`,
or the required command set, which are the three things that break their adapter. Additive
manifest growth is invisible to them, because their `verifyManifest` is a per-command subset
check.

**Working rules that came out of doing it.** Each was learned by getting it wrong:

- Re-derive, do not relay. A claim from a sibling session about its own repository is
  evidence to check, not a fact to act on — a wrong one has already caused work in both
  directions. Read their code or ask for the command that proves it.
- Report failures as failures. Siblings ask for errors rather than diagnoses, because the
  session that owns the code is better placed to read its own error than the one guessing at it.
- Correct against a working reference. When one repository's pipeline works and another's
  does not, a controlled field-by-field comparison beats reasoning about either in isolation.
- Say what a number does not cover. Qualification runs measure one host and one moment;
  they are not soak, and scope limits belong next to the result rather than in a follow-up.
