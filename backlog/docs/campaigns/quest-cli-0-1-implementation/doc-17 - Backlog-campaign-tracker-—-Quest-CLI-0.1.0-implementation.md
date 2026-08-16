---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-16 13:00'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up.

## State

- Resolved: QCLI-72 through QCLI-87, plus QCLI-90.
- In flight: QCLI-89 in isolated Treehouse worktree on a pinned `dev` base.
- Blocked: QCLI-88 waits for external prerequisite LCLI-332; QCLI-95 requires explicit owner authorization immediately before publication.
- Ready: none; QCLI-91..94 remain dependency-blocked.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-89 | In progress | Pinned base `c0d6d18528776f7c3f081b5a300fa593682c0678`; leased Treehouse worktree `1`, branch `campaign/qcli-89-jira`. | Implement and validate jira-cli argv/JSON-only importer, then independently review and integrate. |
| QCLI-88 | External prerequisite | QCLI-87 is delivered; LCLI-332 has not been evidenced in this repository. | Leave inactive until the compatible released Lore contract is independently verifiable. |

## Queue

- QCLI-91 waits on QCLI-88 and QCLI-89; QCLI-92 and QCLI-94 wait on QCLI-91; QCLI-93 waits on QCLI-92; QCLI-95 waits on QCLI-93, QCLI-94, and explicit owner authorization.

## Wave log

- 2026-08-16 — Restored against live `dev` at `c0d6d18528776f7c3f081b5a300fa593682c0678` (clean, ahead 25 of `origin/dev`). Reconciled stale prior cursor, activated QCLI-89, recorded its plan, leased Treehouse worktree `1` at the same base, and dispatched the isolated Jira implementation.
- 2026-08-16 — QCLI-86 drift compensation delivered through `40dbd8a`, independently reviewed, and validated.
- 2026-08-16 — QCLI-87 delivered through `9ea0e08`: source inventory and provenance, bounded path containment, approved drift compensation, Backlog/Lore settlement, and Treehouse cleanup completed.
