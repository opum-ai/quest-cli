---
id: doc-17
title: Backlog campaign tracker — Quest CLI 0.1.0 implementation
type: other
created_date: '2026-08-14 18:10'
updated_date: '2026-08-16 18:39'
tags:
  - quest
  - quest-0.1
  - campaign
  - implementation
---
## Scope and authority

- Confirmed scope: deliver Quest CLI 0.1.0 foundation-up.

## State

- Resolved: QCLI-72 through QCLI-92 and QCLI-94.
- In flight: QCLI-93 release qualification at `57a5f02`.
- Blocked: QCLI-95 requires QCLI-93 technical gates plus explicit owner authorization immediately before publication.
- Ready: none.

## Frontier

| Task | State | Delivery/evidence | Next action |
| --- | --- | --- | --- |
| QCLI-92 | Done | Integrated through `93db330`; artifact/package and packed-tarball checks, focused CLI tests, typecheck, scoped Biome, and diff check passed after independent review. | Settled. |
| QCLI-94 | Done | Integrated through `d93c946`; Lore-managed operations, migration/recovery, and package/release runbooks passed strict Lore gates and independent review. | Settled. |
| QCLI-93 | In progress / blocked | Integrated through `57a5f02`; native immutable candidate passes with a supplied migration executable; workflow covers six native targets and reports every failed/skipped gate as publication-blocking. | Define/provide the native per-target migration smoke executable and authorize resolution of the existing layer-boundary violation. |

## Queue

- QCLI-95 waits on QCLI-93 technical qualification and explicit owner authorization.
- No other task is ready.

## Wave log

- 2026-08-16 — QCLI-92 settled through `93db330`: six platform candidate packages and Node launcher integrated. A portability repair normalized valid object-keyed versus array `npm pack --json` output.
- 2026-08-16 — QCLI-94 settled through `d93c946`: strict Lore validation/check and public command examples passed; docs preserve unpublished-package truth.
- 2026-08-16 — QCLI-93 qualification integrated through `57a5f02`: Windows-safe six-runner matrix, immutable package clean-install smokes, and structured blocking evidence. A missing native migration smoke executable and existing layer violation block completion/publication.
