# R4 — The wave loop, in full

Read with SKILL.md, which owns the roles, conventions, and the state table. Repeat this loop until a stop condition fires (R4j).

---

## a. Compute the dependency graph

One `backlog task list --json` for the roster, then `backlog task view <ID> --json` for each **campaign-labelled, non-Done** task — that second call is where `dependencies`, `acceptanceCriteria`, and `description` actually live. Do not view the whole backlog, and do not shell out once per task in a loop over everything.

Topologically sort by the native `dependencies` field. A task is dependency-clear when every task it depends on has status `Done`.

**A dependency cycle among non-terminal tasks → HALT scheduling for the cycle members only.** Label them `needs-human`, record the cycle in the campaign doc, surface it at R6, and keep draining the acyclic remainder.

## b. Compute the conflict graph

Two tasks conflict if they might touch the same file.

- Same `cluster:*` label is a cheap **sufficient** condition to treat two tasks as conflicting.
- Different cluster is **not** proof of safety. The authoritative signal is a file-citation read: for each ready task, read its description, acceptance criteria, and `modifiedFiles`, and extract the repo paths it is expected to touch, resolving bare filenames against `git ls-files`. This is orchestrator-side reading comprehension — legitimate to do directly, not a dispatch.
- Ambiguous match → keep every candidate. Over-approximating conflicts costs parallelism only; under-approximating costs a real collision.
- No resolvable file at all → that task conflicts with every other task in its own cluster (safe degradation).

```
conflicts(A,B) := same cluster OR file-sets intersect
```

## c. Build the wave

```
ready = campaign-labelled
      ∧ status "To Do"
      ∧ not labelled needs-human
      ∧ all dependencies Done
      ∧ no conflict with anything still in-flight from an incomplete prior wave
```

Stable-sort by the confirmed queue order from the campaign doc, then greedily add tasks that do not conflict with anything already added, stopping at the wave-size cap (default 6).

Queue order is a **human-confirmed priority, not a scheduling promise** — the builder respects it as a tie-break but guarantees nothing about which wave an item lands in; that depends on live dependency and conflict state.

## d. Acquire worktrees — *then* mark dispatched

> **Ordering matters, and this is a deliberate fix to the upstream skill.** Upstream marked every wave member dispatched *before* acquiring worktrees, so a pool exhaustion (which legitimately shrinks the wave) left tasks marked in-flight that were never dispatched — phantom rows that the next session's R2/R3 would try to reconcile against nonexistent worktrees. Acquire first, shrink to what was actually acquired, mark only those.

1. Pin the wave base once: `WAVE_BASE=$(git rev-parse <default>)`.
2. Acquire a worktree per intended member:

   **Treehouse mode** (preferred when the CLI is on PATH):
   ```bash
   path=$(treehouse get --lease --lease-holder "qcli/<TASK-ID>" --json)
   ```
   Record the allocation — the `lease_id` is the retry-safe return key. Then **pin the base**, which is mandatory because pool acquisition resets to the *moving* default branch, not the wave base:
   ```bash
   git -C "$path" switch --detach "$WAVE_BASE"
   git -C "$path" switch -c <branch>
   ```

   **Fallback mode** (no treehouse):
   ```bash
   git worktree add --detach <path> "$WAVE_BASE"
   git -C <path> switch -c <branch>
   ```
   Root it as a sibling of the real, symlink-resolved repo: `$(dirname "$TOPLEVEL")/$(basename "$TOPLEVEL").worktrees/qcli-<N>` where `TOPLEVEL=$(git rev-parse --show-toplevel)`. Never under `$TMPDIR` and never on a different filesystem than the repo — cross-device builds can silently produce broken output. One dependency install per worktree, never shared or symlinked.

3. **Shrink the wave to the leases/worktrees actually acquired.** A smaller wave is a correct degradation.
4. **Now** mark exactly those members, in one serialized pass:
   ```bash
   backlog task edit QCLI-<N> -s "In Progress" --add-label "wave-<N>"
   ```
   This is what lets a crashed session's R2/R3 tell what actually got underway.

Warm reuse is the point of pooling: dependencies and build cache survive between waves, so do **not** reinstall or clean a pooled worktree "to be safe".

## e. Implement — parallel, isolated

Dispatch one worker agent per member. The prompt must carry:

- The exact worktree path as its working directory.
- The task ID, title, description, and acceptance criteria **verbatim** (the worker should still run `backlog task view QCLI-<N> --plain` itself).
- An instruction to read `backlog instructions task-execution` before mutating anything.
- The project's real verification commands. This repo has no `project-constants.md`; derive gates from CLAUDE.md and the package manifest. **If no automated gate exists yet, say so explicitly in the prompt** and require verification against the task's own acceptance criteria — never let the worker infer gates that do not exist.
- Scope boundary: "Do NOT modify files outside this task's scope."

The worker's sequence:

1. **Plan** — research the current code, then `backlog task edit QCLI-<N> --plan "..."`. Do not reuse an approach proposed at task-creation time.
2. **Implement + verify** — objective evidence only: run the gates or exercise the behaviour. Never code presence or intent.
3. **Record** — `backlog task edit QCLI-<N> --append-notes "..."` with decisions and validation results; `--comment` for review questions.
4. **Commit** — small logical commits, project conventions, `Refs: QCLI-<N>` trailer.
5. **Push** — `git push -u origin <branch>` from within the worktree (no remote → skip). This is the worker's last action.

The worker must **not** check acceptance criteria, write the final summary, move the task to `Done`, touch the campaign doc, or create tasks — all centralized at settlement.

**Out-of-scope discoveries**: `backlog instructions task-execution` says to stop and ask the user. Nothing can wait for interactive approval inside a fan-out, so the worker instead records the discovery in `--append-notes`, stays in scope, and reports it in its structured return. The orchestrator surfaces it at R6.

Structured return: `implemented` or self-reported `blocked`, plus a one-line summary and any out-of-scope findings.

## f. Review — pipelined per completed implementer, not wave-wide barriered

As soon as a member's implementation finishes, mark it (`--add-label in-review`) and dispatch the reviewer **into that same worktree** — no second worktree; the branch is already checked out there.

Give the reviewer:

- The task verbatim, plus `backlog task view QCLI-<N> --plain` for the plan and notes.
- `git diff <default>...<branch>` (three-dot).
- An instruction to **independently re-run** the verification rather than trust the implementer's claims.
- A short manifest (task ID + cluster + one-line note) of sibling tasks still in flight this wave, for overlap-risk context.

Checklist, in order:

1. **Acceptance criteria, one by one** — independently confirmed, with the evidence named. This maps directly onto `--check-ac <index>`, so the verdict must be per-criterion and index-accurate.
2. **Correctness** — a sloppy fix reintroducing a same-class bug is the worst outcome.
3. **Scope** — diff stays within the task's stated files; flag drive-bys.
4. **Conventions.**
5. **Tests** — the right ones exist and were actually run.
6. **Task hygiene** — plan and notes accurate.
7. **Overlap risk** against the sibling manifest.

Structured verdict: `approve` / `request_changes` / `escalate`, with per-criterion detail (criterion index → confirmed/not, evidence) and severity-tagged findings. The reviewer writes nothing itself.

`request_changes` → dispatch a **fresh** worker fix pass into the same worktree, prompted with the reviewer's findings verbatim (not "look at it again") → back through the same review. Cap 2 retries (3 total review passes); on exhaustion auto-flip to `escalate` with reason "fix-cycle budget exhausted".

## g. Merge — strictly serial, orchestrator only

Once the wave's implement→review pipelines settle (every member reached approve / merge-blocked / escalated), walk the `approve` branches in confirmed queue order. Nothing is pruned yet, so each worktree still exists. For each:

1. `git -C <worktree> fetch origin`
2. `git -C <worktree> rebase origin/<default>` — expected for every item after the first in a wave; the **normal** case, not an edge case.
   - Clean → **mandatorily** re-run the task's verification inside that worktree. Never skip because the rebase "looked clean"; a clean rebase can still change behaviour.
   - Real content conflict → one reviewer escalation call with both diffs (the just-merged predecessor's and this branch's). Disposition only, never resolution — see `escalation.md`.
3. `git -C <worktree> push --force-with-lease origin <branch>` — publish the rebased, re-verified bytes.
4. Open the PR if not already open and merge per SKILL.md conventions. PR body: task ID, the path from `task view --json`'s `path` field, and the captured reviewer verdict. **No `Closes` keyword** — Backlog tasks have no GitHub auto-close.
5. `git checkout <default> && git pull --ff-only origin <default>` — sync the orchestrator's own checkout.
6. Release the worktree — treehouse: `treehouse return --force --if-lease-id <id> --if-lease-holder "qcli/<TASK-ID>" "<path>"` (the reset detaches HEAD, freeing the branch, and the warm tree returns to the pool); fallback: `git worktree remove <worktree>`. Either way **before** branch cleanup — `git branch -d` refuses while a worktree holds the branch. Never return a worktree with uncommitted work: return resets the tree, branch refs survive, dirty files do not.
7. `git branch -d <branch>` (the remote copy is handled by `--delete-branch`; the no-`gh` path deletes it manually).

Never let one stuck branch stall the queue — record it and move to the next.

## h. Wave-level integration review

After every approved branch has merged, one more reviewer pass over the *cumulative* wave diff (`$WAVE_BASE...<default>`), explicitly hunting cross-task problems a single-task review structurally cannot see: a rename in one branch versus a new caller of the old name in a sibling; duplicate or contradictory implementations; a contract mismatch.

Findings:

- **Narrow** → direct worker follow-up plus re-review, in a fresh worktree off current `<default>`.
- **Real work** → **do not file a task.** Draft the proposed task (title, description, acceptance criteria) into the campaign doc's follow-up section and surface it at R6 for the user's approval. This project forbids creating follow-up work unprompted.

## i. Settlement — orchestrator only, on `<default>` directly

Never on a per-task branch. For each resolved task, in the order `backlog instructions task-finalization` mandates:

```bash
backlog task edit QCLI-<N> --check-ac 1 --check-ac 2        # only criteria the reviewer's evidence proves
backlog task edit QCLI-<N> --check-dod 1                    # if the task has DoD items
backlog task edit QCLI-<N> --append-notes "Verified: <commands + results>. Merged as <SHA>."
backlog task edit QCLI-<N> --final-summary "<what changed, why, how verified>"
backlog task edit QCLI-<N> -s "Done" --remove-label "in-review,merge-pending"
```

Check **only** the criteria the reviewer independently confirmed. An unconfirmed criterion stays unchecked and the task does not reach `Done` — route it back through review instead.

Escalated-to-human tasks: `-s "To Do" --add-label needs-human --remove-label "wave-<N>,in-review,merge-pending"`, with the reviewer's stated reason recorded in the campaign doc.

Then one campaign-doc write (`backlog doc update <docId> --content "..."`): append **one** wave-log entry for the whole wave, refresh the frontier note, record any needs-human reasons and proposed follow-ups.

### Lore log sync — mandatory, last, once per wave

**Deliberate divergence from upstream (`QCLI-43`; see SKILL.md Provenance).** `docs/log.md` drifted from `<default>` after every campaign before this rule existed — QCLI-35 closed it for doc-7, QCLI-39 closed it for doc-8, doc-9 reopened it again — because every fix so far ran the sync as a one-shot **on a per-task branch**, and that branch's own squash-merge then rewrote the very SHAs the sync had just recorded, the instant the PR landed. The fix here is not a better one-shot; it is running the sync from the one place a squash-merge can never invalidate it. Settlement already runs "orchestrator only, on `<default>` directly. Never on a per-task branch" (above), and only after this wave's own merges (g) have already landed on `<default>`. A commit already on `<default>` stays an ancestor of `<default>` forever under this skill's merge model — fast-forward only, no rebase or force-push of `<default>` anywhere in this skill (see g, R5) — whereas a commit still living only on a branch destined for squash-merge is not. Folding the sync into settlement means every SHA it records is already, permanently, part of `<default>`'s own history, not a branch commit awaiting collapse.

Run once, as the **last** action of this wave's settlement — strictly after every per-task write above and after the campaign-doc write, so the sync reconciles against this wave's *final* state (every resolved task already `Done`, the campaign doc already updated) instead of a stale in-between snapshot that would just need a second sync:

```bash
lore sync --json
```

1. Read the `files` list from the JSON payload — this is exactly what changed (typically `docs/log.md`; possibly `docs/index.md` and/or a Story's `<!-- lore:tasks -->` managed block if this wave flipped a linked task to `Done`). `git add` exactly those paths and commit them together as one commit, e.g. `docs: sync lore log after wave-<N> settlement (doc-<M> campaign)`, with one `Refs: QCLI-<N>` trailer per task resolved this wave. An empty `files` list means this wave's resolved tasks touched no lore-tracked doc — nothing to commit, not an error.
2. `lore sync` also auto-commits `backlog/` if left dirty — its own documented contract (`lore instructions sync`; precedent: QCLI-35 and QCLI-39 notes). Since `backlog/config.yml` sets `auto_commit: false`, nothing else in settlement commits the per-task writes (a) or the campaign-doc write (b) — this auto-commit is what actually persists them to git. Treat it as settlement's own backlog-write commit, not a side effect to undo or fold away.
3. `lore check` — must report 0 errors and 0 warnings before the push below. A drift/link/portability finding here means investigate before handing control back; re-running `lore sync` is the fix for reconciliation drift specifically (`lore instructions check`), never a reason to push past a failing check.
4. `git push origin <default>` (no remote → skip) — publishes every commit accumulated this wave: the `backlog/` auto-commit from step 2 and the docs commit from step 1.

**Per-wave, not per-campaign.** Settlement already runs once per wave — this loop repeats per R4j — so the sync inherits that cadence for free; there is no separate per-campaign step to remember or skip. A per-campaign-only alternative was considered and rejected: it would leave `docs/log.md` stale for every wave but the campaign's last, reproducing the exact "log is one wave behind" gap QCLI-39 existed to close — even *within* a single multi-wave session — and it widens the window a crash has to land in before the log goes stale. This repo's own log history already shows a de facto per-wave cadence (manual entries like "docs: sync log.md and story managed block after wave-1 merges" predate this rule); this rule only makes that cadence mandatory and moves it off the per-task-branch ref that kept undoing it.

**Failure paths:**

- **No remote.** Steps 1–3 above are local (`lore sync`, its `backlog/` auto-commit, the explicit docs commit, `lore check`) and always run; only step 4's `git push` is skipped, per this skill's existing no-remote convention.
- **No `gh`.** Unaffected — `gh` is only used for the optional PR audit trail in (g); the sync reads and writes `<default>`'s actual git history, not PR state.
- **A stuck branch (g).** A task that does not merge this wave is not part of this wave's per-task writes (a) and contributes no new commits to `<default>` — it is simply outside this sync's scope until the wave it actually does merge in. No special-casing needed.
- **A crashed session resuming at R3.** `lore sync` is idempotent (`lore instructions sync`: unchanged inputs produce byte-identical output), so re-running it is always safe even if a prior session partially completed this step — e.g. crashed after the `backlog/` auto-commit but before the explicit docs commit, or after both but before `lore check`/push. R3's reconciliation must include: run `lore sync` again before starting a new wave; if it reports any `files`, commit and push them (step 1) before proceeding. This closes the same gap R3 already closes for Backlog and campaign-doc state — the log is just one more thing R3 verifies against ground truth rather than trusts from the handover.

Do **not** run `backlog task archive` or `backlog task complete` — terminal-status tasks stay put until periodic cleanup.

Crash-safe by design: merged code and `Done` tasks are already the system of record, and the lore log sync's own idempotency (above) means a partially-completed sync is always safely resumable — so only the campaign doc's narrative catch-up defers to the next restore's R3, and R4d's dispatch marking gives it something real to reconcile from.

## j. Loop or stop

Recompute the ready set (newly unblocked dependencies, freed conflicts) and start the next wave, unless a stop condition fires. Check **between** waves only, never mid-wave:

- **Queue empty** → campaign complete (R6).
- **A `human_needed` escalation this wave, or two consecutive waves failing the same way** → stop by default and hand over. The user should see the escalation promptly, not have it scroll past under more routine merges. (Within a wave, an escalated item never blocks its wave-mates; this gates only whether a *further* wave is dispatched.)
- **An explicit user budget** (max waves / max tasks) passed at invocation — default unbounded in full mode, one wave in degraded mode.
- **Context-pressure checkpoint** — after each wave, honestly assess whether this session's own context is getting long, and prefer a clean between-wave stop. Treat automatic compaction strictly as a crash backstop, not the stopping signal: a clean Write-mode stop produces a far richer handover.

---

## Per-task stage numbers

Used by the handover's in-flight table so a resumed session knows exactly where each member stopped.

| # | Stage | Owner |
| - | ----- | ----- |
| 0 | Worktree + branch acquired from the pinned wave base | Orchestrator |
| 1 | Task marked `In Progress` + `wave-<N>`, worker dispatched | Orchestrator |
| 2 | Plan recorded on the task | Worker |
| 3 | Implemented + verified, notes recorded | Worker |
| 4 | Committed | Worker |
| 5 | Pushed | Worker |
| 6 | Reviewed to `approve` | Reviewer |

Opening/merging the PR, settling the task, syncing local `<default>`, and pruning the worktree and branch are **not** part of this sequence — they are shared-state mutations belonging to the serialized merge queue (g) and settlement (i). Do not reintroduce them here.
