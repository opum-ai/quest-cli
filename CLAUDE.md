
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
  which answer, and how live sessions actually reach each other. Read it there;
  do **not** transcribe its procedures into this repo. Copied prose goes stale
  silently — a pointer cannot.
- `docs/adr/make-saws-the-single-owner-of-infrastructure-and-dns.md` — the
  authority for infrastructure and DNS across every provider.
  **This repository creates, modifies, and deletes no DNS record — in any zone,
  for any provider, including preview and ephemeral hostnames — and provisions
  no infrastructure.** Route the request to `saws`; do not perform it here and
  reconcile later.

**Every repository in this estate is private.** Every `github.com` link above
and below is **access-gated** and returns 404 without access — a 404 is not
evidence the path is wrong. Never place these links on a public surface, where
they are broken by construction.

Cite `opum-doc` by path and branch, not by a pinned SHA — its head moves, and
has moved four times in a single working session.

**Verified in this repo on 2026-08-04** (re-verify before relying on any of it):

- This repo is **`opum-ai/quest-cli`**, not `salient-data/quest-cli`. The old URL
  still **redirects and resolves silently**, so a link that works is *not* proof
  it names the current owner.
- **`@opum-ai/quest` is NOT published** — registry returns 404 and there is no
  root `package.json`. Do not describe Quest as installable or released, **and
  do not create the thing that would make the description true**: no
  `package.json`, no `bin` entry, no install instructions, no package
  reservation, no release. Describing nothing while adding scaffolding
  satisfies the wording and breaks the rule.
- Org ownership is **not uniform**: `lore-cli` and `quest-cli` are `opum-ai`;
  `lore-doc`, `quest-doc`, `quest-web`, and `opum-doc` remain `salient-data`.
  Check per repository — and check with something a redirect cannot fake:
  `gh api repos/<org>/<repo> --jq .full_name` returns the *current* name even
  when queried under the old one. A 200 from the old URL is not a check.
- The unscoped `quest` and `lore` names on npm belong to **unrelated third
  parties**. Always use the `@opum-ai/` scope.

Existing `salient-data/*` references under `docs/` are frequently **deliberate
supersession records** — the ADR's original decision text, the migration
ledger's transfer history, and the source register's redirect-hazard notes.
Do not "fix" those; the inline-supersession convention exists so the prior
state stays legible.

The test is **not** "does this sentence assert a current fact" — superseded
decision text reads exactly like a current assertion, which is how it gets
rewritten. Ask instead: **is this text recording what was once decided, or
telling a reader what is true now?** A numbered decision inside an ADR, a
ledger's history paragraph, or a register slice documenting a hazard is a
record — leave it and amend it inline, dated, citing the directing task.
Only prose a reader would act on today gets corrected in place.

**Ruling (2026-08-07, `QCLI-44`): a directing-task citation is required.** An inline
supersession amendment must cite the Backlog task under which the amendment was made,
not only the closing decision it names — so a reader without git history in context can
still reach the full reasoning (task description, acceptance criteria, implementation
notes) from the document itself. This binds every inline supersession amendment in this
repository — there is no exemption for amendments made before this ruling was recorded,
and no claim is made here about when the citing practice began. Some amendments predating
2026-08-07 do not yet carry that citation; that is unreconciled debt against this rule,
not a scope limit on it, and this ruling does not by itself reconcile them. The dated,
explicit inventory of outstanding sites — by file, with counts and reasons — is
maintained in `backlog/tasks/qcli-44 - Settle-whether-inline-supersession-amendments-must-cite-the-directing-task.md`
(Implementation Notes).

When a `*-doc` peer and a `*-cli` peer disagree, that is **drift, i.e. a
defect** — the `*-cli` peer is authoritative for what currently ships, the
`*-doc` peer stays normative owner of what the contract is.

**Do not promote either side — not silently, and not loudly.** Announcing the
promotion does not license it. Report the divergence to both owners and leave
the conflict standing until an owner resolves it; a documented conflict is a
correct state, a unilaterally resolved one is not.
