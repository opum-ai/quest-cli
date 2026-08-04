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
authors the current black-box corpus. No source slice is admitted into current
research until QCLI-2.1 verifies its identity, revision, ownership, permitted
use, exclusions, and contamination boundary.

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
`salient-data/opum-doc` on 2026-08-01. GitHub redirects the old name, but active
links should use the current repository identity.
