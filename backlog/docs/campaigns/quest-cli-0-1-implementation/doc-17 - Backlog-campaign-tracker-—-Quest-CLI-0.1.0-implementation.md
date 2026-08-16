---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-16 03:30'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up.

## State

- Resolved: QCLI-72, QCLI-73, QCLI-74, QCLI-75, QCLI-76, QCLI-77, QCLI-78, QCLI-79, QCLI-80, QCLI-81, QCLI-82, QCLI-83, QCLI-84, QCLI-85, QCLI-86, QCLI-90.
- In flight: QCLI-87 safe extractor at `1eb17ea7a1e8295cf39706d45e23466e8e8410af`.
- Human-decision blocked: completing QCLI-87 cutover wiring.
- Ready: QCLI-89 Jira Cloud importer.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-87 | Human-decision blocked | Snapshot-only Backlog extractor committed on `qcli-87-backlog-importer`, with fixture fidelity and provenance tests. Backlog has no lock and source must remain untouched, but QCLI-86 requires a source-side atomic `runIfFingerprint` lease across target mutations. | Decide whether cutover requires an external operational freeze/lease capability, or revise the engine contract to model detectable-but-non-atomic drift. |
| QCLI-89 | Ready | Independent Jira importer. | May proceed after a worktree is available; current QCLI-87 artifact must remain retained. |

## Queue

- QCLI-88 waits on QCLI-87 and LCLI-332; QCLI-91 waits on QCLI-87..90.

## Wave log

- 2026-08-16 — QCLI-86 delivered through `27c8ba0`, independently reviewed, and settled Done.
- 2026-08-16 — QCLI-87 safe extractor committed at `1eb17ea7a1e8295cf39706d45e23466e8e8410af`; cutover wiring is blocked on the source-guard decision.
