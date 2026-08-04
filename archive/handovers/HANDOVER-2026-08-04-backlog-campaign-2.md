# Handover — QCLI-2 clean-room research campaign (waves: 1, tasks resolved: 1 of 10)

**Date**: 2026-08-04 | **Grounded against**: `dev @ d99cf9c`, clean, pushed | **Campaign doc**: `doc-1` at `backlog/docs/campaigns/doc-1 - Backlog-campaign-tracker.md`

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli.

Wave 1 is done: QCLI-2.1 merged as 1f51cce and settled Done. The campaign is
now 10 subtasks (QCLI-2.10 was created mid-campaign at owner approval).

BEFORE dispatching wave 2, read the campaign doc's "Needs a human / blocked"
section. Three owner decisions are pending and two of them gate QCLI-2.9 —
do not dispatch QCLI-2.9 until the charter/ADR contradiction is resolved and
QCLI-2.9's acceptance criteria have been re-read against the owner's already-
made @opum-ai/quest decision. QCLI-2.2 and QCLI-2.7 are unaffected and safe to
dispatch.

The ready set is recomputed live — do not trust any persisted wave plan.

Every worker prompt must carry the clean-room constraints AND the new
per-slice admission rule: docs/reference/quest-cli-research-source-register.md
is now the admission authority. A source may inform a QCLI requirement only if
that register classifies it Allowed. Read it, the component charter, and the
migration ledger before dispatching anyone.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-1`, updated with wave-1 log and owner rulings 1–6 |
| Queue | 10 subtasks; **1 Done** (QCLI-2.1), 9 To Do |
| Waves run | 1 |
| In flight | None — worktree returned to pool, branch deleted |
| Local `dev` vs `origin/dev` | in sync at `d99cf9c` |
| Open PRs | None (PR #1 merged) |

## What landed

`docs/reference/quest-cli-research-source-register.md` — 17 source slices, each
with an explicit `Classification` (Allowed/Contextual/Superseded/Deferred/
Excluded/Quarantined) plus the six provenance fields. **This is now the
admission authority for all Quest research** and supersedes the OCLI-3.1
capsule as the thing a worker checks before citing anything.

## Owner rulings made this session — do not re-ask

1. Backlog.md implementation source stays **Excluded** — the owner was offered a
   reclassification (it's MIT, so reading is legally fine) and declined. The
   constraint is authorship independence, not licensing. Public surface Allowed,
   pinned **v1.49.3** (the owner said v1.49.1; current was chosen).
2. QCLI-2.5 coverage must be **exhaustive, not representative** — enumerate the
   whole CLI surface and exercise every command end to end. Its ACs #4/#5/#6.
3. **QCLI-2.10 created** — Backlog→Quest adoption playbook, deps QCLI-2.5.
4. **lore-cli's Backlog corpus is Contextual** — readable for question discovery,
   citable for nothing, because ADR-0012 says its findings came from Backlog.md
   source. Re-derive everything from the public surface at v1.49.3.
5. **The local Backlog.md clone at `/Volumes/external/repos/Backlog.md` is
   Quarantined** — proximity hazard; the trigger is the ruling, not the clone.
6. **Identity**: quest-cli moves to `opum-ai/quest-cli`, publishes as
   `@opum-ai/quest`, executable stays `quest`. Transfer **not yet executed** —
   `git remote -v` still says `salient-data/quest-cli`.

## Pending owner decisions — these gate wave 2

1. **Charter and ADR contradict the register.** `quest-cli-component-charter.md:23`
   still says "preferred npm package `quest`"; the packaging ADR's decision #1
   still names `salient-data/quest-cli`. Both are recorded as Superseded findings
   inside the register but not amended — that was deliberately out of QCLI-2.1's
   scope. **Fix before QCLI-2.9 runs.**
2. **QCLI-2.9's ACs may no longer fit** — they are framed around resolving an
   allocation question the owner has already answered.
3. **The Lore activation gate may now be satisfied** — see below.

## The Lore gate — material campaign news

`opum-ai/lore-cli`'s `docs/reference/lore-cli-release-truth.md` records
`@opum-ai/lore@0.1.0` as genuinely released: six public npm packages, tag
`v0.1.0` → commit `e621d209be2cc8867d1c38c7c78b4b4acc96d82e`, Actions run
`30870431925`, per-package SHA-256, clean registry install verified, Trusted
Publisher bound. The charter gates Quest *implementation* on the canonical Lore
release, so that gate now appears **satisfied**. QCLI-2.7 owns formal
confirmation — do not treat it as confirmed until QCLI-2.7 says so.

Caveat in Lore's own record: LCLI-278 is still open, so automated
`publish: true` remains prohibited (the `release` environment has no effective
required-reviewer rule).

## Next steps

1. `git fetch` and re-verify `dev`/`origin/dev` before acting (R2).
2. Resolve pending decision 1 (charter + ADR) — proposal 1 in the campaign doc.
3. Recompute the ready set. QCLI-2.2 (`cluster:requirements`) and QCLI-2.7
   (`cluster:lore-gate`) are dependency-clear and cluster-disjoint. QCLI-2.9
   (`cluster:packaging`) is dependency-clear but decision-blocked.
4. Point the QCLI-2.7 worker at `lore-cli-release-truth.md` and
   `runbooks/release-publishing.md` in `/Volumes/external/repos/lore-cli`.

## Critical context / traps

- **The register is now load-bearing.** Wave 1's blocker was that it asserted an
  admission rule it could not satisfy for a third of its own slices. Any future
  edit that adds a slice without a `Classification` reintroduces that defect.
- **Do not cite lore-cli's Backlog documents.** Reading them is allowed and
  genuinely useful; citing them launders source-derived knowledge into Quest and
  defeats ruling 1. The distinction is easy to lose under time pressure.
- `lore sync` **auto-commits**; `lore sync --dry-run` does not. Reviewers must use
  the dry-run form or they mutate the branch they are judging.
- Rebasing a campaign branch onto `dev` conflicts on the task's **own frontmatter**
  (`assignee`, `updated_date`) whenever the orchestrator marked it dispatched on
  `dev`. It is mechanical — take the branch side; labels auto-merge.
- `gh pr merge --delete-branch` **fails to delete the local branch** while the
  worktree still holds it. Return the worktree first, then delete.
- This repo is shared with `@codex`, which has done real work here (QCLI-1,
  QCLI-3, the ledger, the charter). Re-check ground truth every restore.

## Do not repeat

- **Do not dispatch a reviewer while its worker may still be running.** This
  session resumed a worker with an evidence correction and then dispatched review
  without waiting for the resumed run's completion notification. The reviewer
  caught the moving branch and waited it out, but that was luck in the sense that
  a less careful reviewer would have judged a stale diff.
- **Do not hand a subagent unverified evidence.** The first worker prompt carried
  `salient-data/lore-cli` and "no npm publication found"; both were wrong — the
  repo had transferred to `opum-ai` and publishes as `@opum-ai/lore`. GitHub's
  redirect made the stale org reference *succeed silently*, which is exactly why
  it went unnoticed. Verify org/package identity before putting it in a prompt.
