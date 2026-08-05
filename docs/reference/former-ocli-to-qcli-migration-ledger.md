---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Former OCLI to QCLI migration ledger
tags:
  - quest
  - opum
  - migration
  - backlog
  - provenance
summary: Maps every former opum-cli research task and record to its preserved history or canonical Quest successor.
timestamp: 2026-08-01T17:11:23.884Z
---

# Former OCLI to QCLI migration ledger

The old OCLI namespace is preserved in `opum-doc`; QCLI is the only active
component namespace. This is a semantic handoff, not an ID rewrite. This
Reference is the normative exact component-task mapping; `quest-doc` retains
only a product-level summary and `opum-doc` retains immutable history.

## Details

| Former record | Current Quest disposition |
| --- | --- |
| OCLI-1 | Historical Backlog/Lore initialization in `opum-doc`; explicit non-adoption because it is repository setup history. **Superseded for one artifact** (QCLI-4): the repository owner explicitly directed porting OCLI-1's `backlog-handover` campaign-driver skill into `quest-cli` at `.claude/skills/backlog-handover/` (rebound `OCLI`/`ocli` → `QCLI`/`qcli`), committed at `287c2b8`. The rest of OCLI-1 (Backlog/Lore repository initialization) remains non-adopted; the opum-doc record itself is unchanged |
| OCLI-2 | Completed research foundation and handover; QCLI-1 is its sole component successor |
| OCLI-3 | Frozen predecessor parent; QCLI-2 is the active research parent |
| OCLI-3.1 | Completed provenance register; QCLI-2.1 revalidates it after the repository split |
| OCLI-3.2 | QCLI-2.2 legacy requirement reconciliation |
| OCLI-3.3 | QCLI-2.3 black-box scenarios |
| OCLI-3.4 | QCLI-2.4 actors, workflows, and language |
| OCLI-3.5 | QCLI-2.5 public-contract migration fidelity |
| OCLI-3.6 | QCLI-2.6 Git/filesystem/concurrency threats |
| OCLI-3.7 | QCLI-2.7 Lore evidence matrix |
| OCLI-3.8 | QCLI-2.8 research synthesis |
| OCLI-4 | Completed conversion of the former repository into the Opum documentation hub; explicit non-adoption because portfolio authority remains in `opum-doc` |
| OCLI-5 | Current Opum hosted-platform validation; explicit non-adoption because SaaS roadmap work belongs to `opum-doc` |
| OCLI-6 | Cross-product documentation authority audit; explicit non-adoption because the control task belongs to `opum-doc` |

### Source provenance boundary

The dated
[Opum fleet and prior-art inventory](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md),
historical OCLI Story/Spec/Runbook, OCLI task records, and Git recovery commits
`7b82afc` and `d42c016` are provenance inputs, not maintained Quest contracts.
The inventory's 11 scenario seeds remain historical evidence until QCLI-2.3
authors the current black-box corpus. **Condition fired (QCLI-2.3,
2026-08-04):** QCLI-2.3 has authored that corpus —
[Quest CLI black-box acceptance scenarios](quest-cli-black-box-acceptance-scenarios.md)
— independently reauthoring all 11 seeds as prompts (never copied) across
17 scenarios (BB-01..BB-17). This sentence's historical claim about the
seeds themselves is left standing, not deleted, per this ledger's own
preservation rules below. No source slice is admitted into current
research until QCLI-2.1's initial revalidation, or a later task's
owner-ruled amendment to the [research source
register](quest-cli-research-source-register.md), verifies its identity,
revision, ownership, permitted use, exclusions, and contamination boundary.
`QCLI-2.10`'s [Backlog adoption and migration
playbook](quest-cli-backlog-adoption-and-migration-playbook.md) cites this
ledger as read-only background per its own Sources and classification
table; this ledger's OCLI→QCLI provenance mapping does not itself inform
that playbook's Backlog-behavior content and is not otherwise relied upon
there.
**Amended 2026-08-04 by `QCLI-2.12`:** QCLI-2.1 is the register's founding
admission event, not its only one — QCLI-2.7 has since, entirely under
explicit owner ruling recorded the same day, added two slices (the lore-cli
source-admissibility split rule and the lore-cli release-gate-evidence
slice), widened a third (npm package name occupancy), and retired the
lore-cli Backlog.md corpus slice's closed document list for a standing
catch-all; each such amendment is itself the six-field verification this
sentence requires, performed by the amending task under owner ruling rather
than by QCLI-2.1.

**Extended 2026-08-04 by this `QCLI-2.12` follow-up (F4):** this note named
only QCLI-2.7's amendments, but QCLI-2.12 itself (same commit, `d55eaf7`)
also amended the register: it widened the lore-cli slice's Permitted use to
admit `@opum-ai/lore`'s ordinary registry metadata (maintainer identity,
license, publish history), added `@opum-ai/quest-cli` to the npm package
name occupancy slice's enumeration, and added members to the "Prior QCLI
research records" slice's own enumeration (the reconciliation doc, this
register, and the accepted ADR — later joined, in a further follow-up, by
three more already-cited documents). These three are not the only register
amendments that same commit made — the register's own Notes section records
six in total, including a fourth Permitted-use clarification (the
`quest-doc` canonical product records slice); this note names only the
three below because those are the ones needing the owner's same-day
confirmation that follows, not the full list. The owner has confirmed
(2026-08-04) that none of these three needed a fresh ruling: the metadata
widening formalizes an admission already permitted by QCLI-2.7's existing
owner-ruled widening of the npm-occupancy slice's own permitted use,
applied here by symmetry; the npm-occupancy addition formalizes an
admission already permitted by that same slice's *pre-widening* permitted
use and its Excluded classification, on a basis the corrected text below
sets out in full — not the widening itself, and not by symmetry.
**Corrected 2026-08-04
by a second `QCLI-2.12` follow-up fix pass (B3):** this sentence previously
named the lore-cli slice's split rule as a second, joint basis alongside
that widening — wrong. The register's own text grounds the lore-cli
metadata widening in closing "an asymmetry with the npm package name
occupancy slice's own widened permitted use," the npm-occupancy widening
alone, applied by symmetry, never the split rule. The split rule governs
design derivation from lore-cli's own TypeScript source as evidence of what
Lore requires of a task-tracker backend (`src/adapters/backlog.ts` and
lore-cli's non-Backlog-derived ADRs/Specs); it says nothing about citing
registry metadata, and the register itself describes the split rule as
unchanged by the metadata widening. **Corrected 2026-08-04 by this same
`QCLI-2.12` follow-up (third pass):** this sentence previously attributed
the npm-occupancy addition to "that slice's own pre-existing widening" —
also imprecise, and for the same reason as the correction above:
`QCLI-2.7`'s widening added *fields* (maintainer identity,
description, publish history) to the slice's Permitted use, not *names* to
its Repository or URL enumeration, so it is not what admits
`@opum-ai/quest-cli`. The npm-occupancy addition (enumerating
`@opum-ai/quest-cli`) instead rests on the slice's *pre-widening* Permitted
use, which already covered "existence, version, license, and repository"
before `QCLI-2.7` ever ran — sufficient on its own to ground the
404-existence observation `QCLI-2.9` cites — together with the slice's
Excluded classification, under which naming one more occupied name in
Repository or URL admits no new source either way, needing no symmetry
argument at all. Both amendments were also
already exercised in practice by `QCLI-2.9`'s contemporaneous citations of
`@opum-ai/lore` maintainer identity and the `@opum-ai/quest-cli` 404
observation; the Prior-QCLI-research-records additions change no
Classification and admit no new source, only naming, under this slice's
existing Allowed status, documents merged deliverables already relied on.
None of the three is a new admission.

### Preservation rules

- Do not rename or duplicate OCLI IDs, check their acceptance criteria, or mark
  them complete to make the transfer look tidy.
- Do not activate an OCLI task and its QCLI successor in parallel.
- Cite the exact OCLI task/document/commit when adopting evidence.
- Revalidate dated fleet facts and source classifications before use.
- If old research conflicts with current `quest-doc`, record a supersession
  decision; never silently blend the two.
- Supersession decisions are recorded inline on the affected row, scoped to
  the exact artifact overridden, with the directing task cited (see OCLI-1 /
  QCLI-4) — never a blanket flip of the original disposition.

Repository history: `salient-data/opum-cli` was renamed in place to
`salient-data/opum-doc` on 2026-08-01. `salient-data/quest-cli` was transferred
to `opum-ai/quest-cli` on 2026-08-04 (QCLI-5), matching the
`salient-data/lore-cli` → `opum-ai/lore-cli` transfer. GitHub redirects the old
names, but active links should use the current repository identity — a redirect
resolves a stale reference silently, so a wrong org reads as correct until
someone checks. The other components named here — `quest-doc`, `lore-doc`,
`opum-doc`, and `quest-web` — remain in `salient-data`.
