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
component namespace. This is a semantic handoff, not an ID rewrite.

## Details

| Former record | Current Quest disposition |
| --- | --- |
| OCLI-1 | Historical Backlog/Lore initialization in `opum-doc`; no successor needed |
| OCLI-2 | Completed research foundation and handover; adopted by QCLI-1 and current docs |
| OCLI-3 | Frozen predecessor parent; QCLI-2 is the active research parent |
| OCLI-3.1 | Completed provenance register; QCLI-2.1 revalidates it after the repository split |
| OCLI-3.2 | QCLI-2.2 legacy requirement reconciliation |
| OCLI-3.3 | QCLI-2.3 black-box scenarios |
| OCLI-3.4 | QCLI-2.4 actors, workflows, and language |
| OCLI-3.5 | QCLI-2.5 public-contract migration fidelity |
| OCLI-3.6 | QCLI-2.6 Git/filesystem/concurrency threats |
| OCLI-3.7 | QCLI-2.7 Lore evidence matrix |
| OCLI-3.8 | QCLI-2.8 research synthesis |

### Preservation rules

- Do not rename or duplicate OCLI IDs, check their acceptance criteria, or mark
  them complete to make the transfer look tidy.
- Do not activate an OCLI task and its QCLI successor in parallel.
- Cite the exact OCLI task/document/commit when adopting evidence.
- Revalidate dated fleet facts and source classifications before use.
- If old research conflicts with current `quest-doc`, record a supersession
  decision; never silently blend the two.

Repository history: `salient-data/opum-cli` was renamed in place to
`salient-data/opum-doc` on 2026-08-01. GitHub redirects the old name, but active
links should use the current repository identity.
