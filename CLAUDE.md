
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
- **`@opum-ai/quest` is NOT published** — registry returns 404 (`E404`,
  observed 2026-08-08 per `QCLI-56`'s recheck capsule) and no package is
  reserved. Do not describe Quest as installable, released, or reserved on
  the registry. This half of the rule is about truthful description, is
  unconditional on activation phase, and survives the amendment below
  untouched.
- Org ownership is **not uniform**: `lore-cli` and `quest-cli` are `opum-ai`;
  `lore-doc`, `quest-doc`, `quest-web`, and `opum-doc` remain `salient-data`.
  Check per repository — and check with something a redirect cannot fake:
  `gh api repos/<org>/<repo> --jq .full_name` returns the *current* name even
  when queried under the old one. A 200 from the old URL is not a check.
- The unscoped `quest` and `lore` names on npm belong to **unrelated third
  parties**. Always use the `@opum-ai/` scope.

**Amendment (2026-08-08, `QCLI-59`): the pre-activation prohibition above is
narrowed, not repealed.** Until this amendment, the `@opum-ai/quest` bullet
above also read: "…**and do not create the thing that would make the
description true**: no `package.json`, no `bin` entry, no install
instructions, no package reservation, no release. Describing nothing while
adding scaffolding satisfies the wording and breaks the rule." (elided
prefix: "Do not describe Quest as installable or released,"). That clause
restated the research programme Spec's
`docs/specs/quest-cli-pre-implementation-research-program.md` "Prohibited
work before activation" list, which stated that product source was blocked
unconditionally until the Phase 0 activation precondition passed. It is
narrowed here, not ignored or routed around, because two things now hold
together — recorded together per this repository's citation ruling
(`CLAUDE.md`, `QCLI-44`):

- **Evidentiary Pass.** `QCLI-56`'s 2026-08-08 recheck capsule, appended to
  `docs/reference/quest-cli-activation-gate-evidence-record.md` ("2026-08-08
  recheck capsule (`QCLI-56`)"), records `lore-doc`'s gate Spec and task
  `LDOC-4` both reporting the Lore-owned release gate **OPEN**, "all four
  predicate items satisfied at one live inspection boundary" — in the gate
  owner's own "pass/fail" vocabulary, quoted from that same Spec's Authority
  table.
- **Explicit authorization — two distinct occasions, both required.** An
  evidentiary Pass is not by itself activation: the evidence record and
  `lore-doc`'s own gate Spec both state plainly that an open Lore gate
  clears the Lore-owned precondition only, and that this repository's own
  Phase 0 obligation — clean-room admission, research completeness, and the
  delivery roadmap's component-activation checks — is separate and is not
  re-evaluated by this amendment. Two separate authorizations occurred, and
  both were required: at **doc-14 init, 2026-08-08**, the user approved
  filing `QCLI-59` itself, with the explicit instruction that the amendment
  be conditional on a verified Pass (`QCLI-59`'s own recorded Origin); then,
  once `QCLI-56`'s capsule had established that Pass, at **doc-14 wave-2
  start, 2026-08-08**, the user was shown that evidence and explicitly
  authorized this amendment to proceed now, directing that wave 2 run both
  `QCLI-58` and `QCLI-59`. The first authorized a conditional task; the
  second authorized executing it once the condition was met. Neither fact
  stands in for the other; both are recorded here, in that order, because
  both were required.

**Unreconciled Spec divergence, named and left open — not settled here.**
This repository's own Specs still read as an unconditional block, and this
task amends neither of them:
`docs/specs/quest-cli-pre-implementation-research-program.md:37-46`'s
"Prohibited work before activation" list still names "product source,
runtime dependencies, generated CLI or package scaffolding" without
qualification, and `docs/specs/quest-cli-delivery-roadmap.md:32-35` states
that Phases 2 through 5 "may not produce product source, a runtime
dependency, executable scaffolding, or any packaging artifact before Phase 0
passes and is independently re-verified live" (its Phase 2 entry, `:150-152`,
repeats: "Phase 0 has passed, for any code to be written at all"). The
divergence between this amendment's permission and that Spec text is
**unreconciled as of 2026-08-08**. Which text a worker follows in the
interim is an open precedence question this task does not decide — it is
surfaced to the repository owner separately, not resolved here.

**Why this is corrected in place rather than preserve-and-amended.** This
repository's own record-vs-current-assertion test — "is this text recording
what was once decided, or telling a reader what is true now?" — decides
between the two conventions defined later in this file. The prohibition
bullet was never a dated capsule reporting what this file observed at an
inspection boundary the way the activation-gate evidence record is
(`CLAUDE.md`, `QCLI-45`) — `CLAUDE.md` makes no claim of fidelity to a past
reading; it is operative guidance a reader acts on today, and a reader
following the un-narrowed text after 2026-08-08 would be following a rule
that is no longer this repository's current state. That makes it exactly
the class of prose the correct-in-place convention governs — "only prose a
reader would act on today gets corrected in place" — so the `@opum-ai/quest`
bullet above is edited directly rather than superseded by a dated, appended
note.

**Scope, narrow and asymmetric — the things Phase 2
(`docs/specs/quest-cli-delivery-roadmap.md`) needs to exist at all:**

- **Now permitted:** product source, executable scaffolding, a
  `package.json`, a `bin` entry, runtime dependencies.
- **Still prohibited, pending Phase 6:** package publication, release
  workflows that claim readiness, public install instructions, and package
  reservation. Phase 6 additionally requires `D2` (runtime, still open) and
  `D3` (platform, closed by `QCLI-27`: macOS, Linux, Windows) —
  of the two, only `D2` remains outstanding, and this amendment decides
  neither; it does not choose a runtime. `@opum-ai/quest` remains unclaimed
  (`E404`, observed 2026-08-08 per `QCLI-56`'s recheck capsule).

This narrows nothing else: it does not clear clean-room admission, research
completeness, or any other component activation check in the delivery
roadmap, and it does not touch the truthful-description bullet above, which
stays in force exactly as written.

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

**Ruling (2026-08-07, `QCLI-45`): preserve-and-amend governs evidence records,**
**overriding the correct-in-place branch above.** A dedicated evidence record — a
document whose stated value is fidelity to what was read at a given inspection
boundary — is amended by appending a dated, superseded-marked note even for prose a
reader would otherwise act on today; the correct-in-place branch's "is this text
recording what was once decided, or telling a reader what is true now?" test does not
license deleting or re-tensing an evidence record's own dated reading, because doing so
destroys the thing the record exists to hold. Preserve-and-amend still meets the
correct-in-place branch's underlying concern — a stale reading is marked superseded, not
left to read as current — without that loss. This resolves `QCLI-42` (commit `3b1e9f5`),
which deleted and re-tensed `QCLI-41`'s gate-result paragraph in
`docs/reference/quest-cli-activation-gate-evidence-record.md` instead of appending a
dated amendment; the removed wording is restored there as preserved-and-superseded text
under this ruling. Full reasoning:
`backlog/tasks/qcli-45 - Record-the-evidence-record-amendment-ruling-and-reconcile-QCLI-42-in-place-replacement.md`.

**Ruling (2026-08-07, `QCLI-50`): tense-only edits are not covered by
preserve-and-amend, narrowing the "or re-tensing" wording above.** Read in
isolation, the QCLI-45 sentence that the correct-in-place test "does not
license deleting or re-tensing an evidence record's own dated reading" could
be taken to cover any tense change. It does not: re-tensing falls under
preserve-and-amend only when the edit alters or obscures what the record
asserts was read. A pure present-to-past shift that leaves the recorded
reading intact is ordinary housekeeping, not a supersession. This ratifies,
rather than overturns, the scope judgment QCLI-45's own review already made.
Applied to the case that raised the question: commit `3b1e9f5` (`QCLI-42`)
made a second edit beyond the deletion QCLI-45 restored above — it also
re-tensed a clause in `docs/reference/quest-cli-activation-gate-evidence-record.md`
from "the Spec now reports items 2, 3, and 4 of the predicate as satisfied"
to "the Spec reported items 2, 3, and 4 of the predicate as satisfied." That
re-tensing is not restored: the recorded fact — that the Spec reported items
2, 3, and 4 satisfied at pin `d2a9a9e11ddf` — survives identically in both
phrasings, so there is no destroyed reading to mark superseded. The reason
is also recorded inline in the evidence record itself, where a future
sweeper auditing that document will find it. A variant requiring a logged
amendment for every tense-only edit was considered and rejected: it would
recreate most of the amendment burden this ruling lifts. Full reasoning:
`backlog/tasks/qcli-50 - Settle-whether-tense-only-edits-fall-under-preserve-and-amend.md`.

When a `*-doc` peer and a `*-cli` peer disagree, that is **drift, i.e. a
defect** — the `*-cli` peer is authoritative for what currently ships, the
`*-doc` peer stays normative owner of what the contract is.

**Do not promote either side — not silently, and not loudly.** Announcing the
promotion does not license it. Report the divergence to both owners and leave
the conflict standing until an owner resolves it; a documented conflict is a
correct state, a unilaterally resolved one is not.
