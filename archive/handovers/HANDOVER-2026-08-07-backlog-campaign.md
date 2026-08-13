# Handover — doc-11 campaign initialized, no waves run yet (waves: 0, tasks: QCLI-45, QCLI-46, QCLI-47)

**Date**: 2026-08-07 | **Grounded against**: `dev` @ `19fc610`, clean, 0 ahead / 0 behind `origin/dev` | **Campaign doc**: `doc-11` (`backlog/docs/campaigns/doc-11 - Backlog-campaign-tracker.md`)

## Paste-ready prompt for the next session

```
Run /backlog-handover restore in /Volumes/external/repos/quest-cli. This is a
FRESH campaign (doc-11) — init completed, 0 waves run, nothing in flight.
3 tasks queued, all To Do with the campaign label: QCLI-45, QCLI-46, QCLI-47.
The ready set is recomputed live at restore — do NOT hardcode a "next wave"
list from this file.

Queue order confirmed by the user on 2026-08-07 (ruling-first): QCLI-45 →
QCLI-46 → QCLI-47. Do not re-ask.

Locked decisions — both blocking owner rulings were obtained at init and are
recorded verbatim in each task's own description AND in doc-11. Do not re-ask
and do not re-derive them:
  - QCLI-45: preserve-and-amend governs evidence records. QCLI-42 should have
    appended a dated amendment, not deleted and re-tensed QCLI-41's paragraph.
  - QCLI-47: hybrid. Refs: QCLI-<N> required on bookkeeping commits with a
    single directing task; campaign-scoped commits (init/close/gitignore) with
    no single task are a documented exception.

Traps: QCLI-46 must RE-DERIVE the outstanding site set — QCLI-44's counts are
wrong in both directions and its notes are append-only so both wrong figures
are still present. QCLI-45 and QCLI-46 conflict (same file + semantic
dependency) and are hard-linked by a native --dep; QCLI-47 is genuinely
disjoint, so wave 1 can be QCLI-45 + QCLI-47 in parallel.
```

## State

| Item | Status |
| ---- | ------ |
| Campaign doc | `doc-11`, created and fully populated this session |
| Queue | 3 To Do (QCLI-45, QCLI-46, QCLI-47), 0 In Progress, 63 Done |
| Ready now | 2 — QCLI-45, QCLI-47. QCLI-46 dependency-blocked on QCLI-45 |
| Waves run | 0 |
| `dev` | `19fc610`, clean, in sync with `origin/dev` (pushed this session) |
| Campaign branches | none, local or remote |
| Open PRs | none |
| Treehouse pool | 6/6 slots available, zero leases |
| Blocked / needs-human | none. Both blocking rulings obtained at init |
| Prior campaign | `doc-10` — complete, correctly closed, its handover archived with no successor |

## This session's in-flight wave

None — init only. No worktree acquired, no branch cut, no task dispatched.

## Next steps

1. `R2` will find nothing to reconcile — the tree was verified clean on every axis at `342e76d` before init and the only commit since is `19fc610` (this init). Confirm rather than assume.
2. Build wave 1. The dependency graph permits **QCLI-45 + QCLI-47 in parallel** — they share no file (`docs/` vs `.claude/skills/backlog-handover/`). QCLI-46 becomes ready only after QCLI-45 merges.
3. QCLI-45's worker must restore removed wording verbatim from `git show 3b1e9f5^:docs/reference/quest-cli-activation-gate-evidence-record.md`, not paraphrase it, and must decide *and state* whether the ruling lands in CLAUDE.md or the evidence record's own methodology section — leaving the two disagreeing is the failure mode.
4. QCLI-46 (wave 2 at the earliest) surfaces one item for the owner at the session report: commit `a4ae6c5` has **no** directing task to cite. Its AC #4 requires a recorded owner disposition, not an invented citation.

## Critical context / traps

- **QCLI-44's site inventory cannot be trusted as a starting point.** Its implementation notes are append-only and carry *two* mutually inconsistent figures: a first-pass "~30+ uniformly non-conformant" and a fix-pass correction to "1 site". Verified at init that **both are wrong** — `docs/reference/quest-cli-backlog-migration-fidelity-contract.md:561` is non-conformant and appears in neither. QCLI-46's AC #1 makes independent re-derivation a gate, not a suggestion.
- **`Refs:` trailer practice is inconsistent, not absent.** `0b63077` and `342e76d` carry `Refs: QCLI-43`; `8721feb`, `146956d`, `9c63769`, `d0b5f41`, `3686859`, `34bceae`, `8caae19`, `748bf5f`, `6047774` do not. doc-10 framed this as uniformly missing — that framing is wrong and QCLI-47's description carries the corrected evidence.
- **QCLI-45 → QCLI-46 is a semantic dependency, not just a file overlap.** QCLI-45 decides the convention QCLI-46 applies. Recorded as a native Backlog `--dep` so the wave builder cannot schedule them together even if a file-overlap heuristic were to read them as disjoint.
- **The supersession convention applies to this work itself.** Both QCLI-45 and QCLI-46 amend text that is *already* a supersession amendment. Every edit must be an inline, dated addition citing the directing task (CLAUDE.md's QCLI-44 ruling); rewriting the prior amendment is the exact defect being fixed.
- **This init commit carries `Refs: QCLI-45, QCLI-46, QCLI-47`** even though QCLI-47's just-made hybrid ruling would exempt a campaign-scoped commit. Deliberate: the ruling is not yet documented in SKILL.md, so the commit satisfies the convention as currently written and is also compatible with the hybrid outcome. Do not read it as pre-applying QCLI-47.

## Do not repeat

Nothing failed this session — init ran clean end to end. Two things were *corrected* rather than failed, both worth not re-deriving: doc-10's site count for QCLI-46 and doc-10's "routinely lack" framing for QCLI-47. Both corrections are captured in the task descriptions and in doc-11's "Verification that changed what got filed" section, so the next session inherits them without re-checking.
