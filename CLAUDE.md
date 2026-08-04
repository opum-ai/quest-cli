
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
  `lore instructions <topic>` (`linking`, `sync`, `check`, `validation`).
<!-- lore:agents:end -->

## Fleet routing — read before answering cross-repo questions

Before routing any **cross-repo ownership, package-status, or infrastructure/DNS**
question, consult the fleet record in `salient-data/opum-doc` (branch `dev`):

- `docs/reference/fleet-peer-routing-and-session-invocation.md` — which peer owns
  which answer, and how live sessions actually reach each other.
- `docs/adr/make-saws-the-single-owner-of-infrastructure-and-dns.md` — the
  **authority** for infrastructure and DNS across every provider. An
  infrastructure change is not real until reflected in `saws`.

`opum-doc` is private; confirm read access when you pull. Cite it by path and
branch, not by a pinned SHA — its head moves.

**Verified in this repo on 2026-08-04** (re-verify before relying on any of it):

- This repo is **`opum-ai/quest-cli`**, not `salient-data/quest-cli`. The old URL
  still **redirects and resolves silently**, so a link that works is *not* proof
  it names the current owner.
- **`@opum-ai/quest` is NOT published** — registry returns 404 and there is no
  root `package.json`. Never describe Quest as installable or released.
- Org ownership is **not uniform**: `lore-cli` and `quest-cli` are `opum-ai`;
  `lore-doc`, `quest-doc`, `quest-web`, and `opum-doc` remain `salient-data`.
  Check per repository rather than assuming a pattern.
- The unscoped `quest` and `lore` names on npm belong to **unrelated third
  parties**. Always use the `@opum-ai/` scope.

Existing `salient-data/*` references under `docs/` are frequently **deliberate
supersession records** — the ADR's original decision text, the migration
ledger's transfer history, and the source register's redirect-hazard notes.
Do not "fix" those; the inline-supersession convention exists so the prior
state stays legible. Correct only references asserting a *current* fact.

When a `*-doc` peer and a `*-cli` peer disagree, that is **drift, i.e. a
defect** — the `*-cli` peer is authoritative for what currently ships, the
`*-doc` peer stays normative owner of what the contract is. Report the
divergence to both owners rather than silently promoting either.
