# Escalation policy and error handling

Every situation routes through the **same** reviewer role used for ordinary review — escalation is one of that role's verdicts with a concrete decision procedure, not a separate mechanism. An escalation never blocks its wave-mates or the rest of a merge-queue walk; the one thing it gates is whether the session dispatches a further wave (R4j).

## Triggers

| Trigger | Reviewer is handed | Decision procedure |
| ------- | ------------------ | ------------------ |
| Worker self-reports `blocked` mid-implementation | The blocker report + partial diff | `request_changes` (gave up prematurely — specify what is actually missing; fresh worker attempt in the same worktree) vs `escalate` (genuinely not agent-finishable) |
| A material product/architecture call got baked into an ambiguous acceptance criterion without sign-off | The review checklist applied to the diff | Apply the decide-vs-defer test below. Workers never block waiting for interactive approval — nothing can wait in a fan-out — so they document their interpretation in task notes and proceed; the reviewer is the checkpoint that catches an unauthorized call after the fact |
| Review-found blocking defect | Same as ordinary review | `request_changes` through the capped fix loop; only budget exhaustion, or judging the defect structural, produces `escalate` |
| Merge-time content conflict | Both diffs (predecessor's + this branch's) | Disposition only, never resolution: `reviewer_decided` (mechanical — fresh worker fix, re-enters review, held for a later pass of the same walk) vs `human_needed` (both branches substantively changed overlapping logic — leave pushed and unmerged, record, move on) |
| Wave-level integration finding | The cumulative wave diff | Narrow → direct worker follow-up + re-review. Real work → **propose** a follow-up task in the campaign doc and surface it at R6; never file it unprompted |
| Task turns out not agent-finishable (discovered mid-flight) | Whatever has been learned | Record exactly what remains in the task's notes; `escalate` with `human_needed`; the orchestrator labels it `needs-human` at settlement |
| Out-of-scope work discovered by a worker | The worker's structured return | Not a reviewer call. The worker stays in scope and records it; the orchestrator surfaces it to the user at R6 |

## Decide-vs-defer test

The reviewer makes the call itself, documents the assumption (captured by the orchestrator into the task notes, PR body, and wave log), and the item proceeds as approved or fixed — **only** when the question is narrow, reversible, and low-blast-radius: an ambiguous wording with one obviously reasonable reading, or a trivial mechanical conflict.

Anything genuinely product-level, irreversible, or requiring information the reviewer does not have → `human_needed`. Never guessed past.

---

## Error handling

| Condition | Behaviour |
| --------- | --------- |
| `backlog` CLI missing or the project has no `backlog/` directory | STOP. This skill has no other system of record |
| Dirty working tree at preflight (orchestrator's own checkout) | STOP; show `git status`; let the user decide |
| No parallel Agent dispatch available | Degrade: wave size 1, single feature branch, self-implement plus adversarial self-review, one-wave budget |
| No campaign-labelled tasks | Nothing to drain. Report the queue state and suggest `init` |
| `treehouse get --lease` fails (pool exhausted) | Shrink the wave to the leases actually acquired, and mark only those dispatched (R4d ordering). Between waves, suggest `treehouse prune` or a larger pool; never destroy pool members mid-wave to make room |
| Dependency cycle among campaign tasks | HALT scheduling for cycle members only; label them `needs-human` naming the cycle; keep draining the acyclic remainder |
| Conflict discovered only at merge time | One reviewer escalation call with both diffs — disposition, not resolution |
| Merge fails because `<default>` moved (normal under wave dispatch) | Rebase + **mandatory** re-verify + re-push + retry. Never merge without re-pushing the rebased bytes |
| Merge fails on a real content conflict | Reviewer escalation → `reviewer_decided` (fresh worker fix, re-review) or `human_needed` (leave unmerged, record, move on) |
| `gh` missing/unauthenticated, or repo not GitHub-hosted | Fall back to local `git merge --ff-only` into `<default>`; settle tasks exactly as normal; note it in the handover |
| No remote `origin` | Skip the push/PR/remote-prune halves; note it in the handover |
| `refs/remotes/origin/HEAD` unset | Run `git remote set-head origin -a` once; if that fails, fall back to `dev`, then `main`. Never guess the integration branch |
| Reviewer returns `request_changes` | Fresh worker fix pass, findings verbatim; cap 2 retries, then auto-`escalate` |
| Reviewer returns `escalate` | Decide-vs-defer test; `human_needed` → branch stays pushed and unmerged, records updated, queue keeps moving, session stops before its next wave by default |
| Worker self-reports `blocked` | Route through the reviewer like a review — never trust "unfinishable" uncorroborated |
| Reviewer cannot confirm an acceptance criterion | That criterion stays unchecked and the task does not reach `Done`. Back through review; never check an AC on unproven evidence |
| Task already `Done` when re-checked (drift) | Reconcile at R3; keep draining |
| Archive name collision | Suffix `-2`, `-3`, …; note it |
| Ground-truth command fails | Record the gap explicitly in the handover — never substitute memory |

At completion (success or error), reset the statusline if ECK is present:

```bash
[ -n "$ECK_HOME" ] && [ -x "$ECK_HOME/update-stage.sh" ] && bash "$ECK_HOME/update-stage.sh"
```
