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

## d. Acquire worktrees — *then* mark dispatched, commit, and re-pin (`QCLI-49`)

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
4. **Now** mark exactly those members, in one serialized pass, and **commit that pass on `<default>` immediately — do not leave it dirty.** `backlog/config.yml` sets `auto_commit: false`, so nothing commits this for you:
   ```bash
   backlog task edit QCLI-<N1> -s "In Progress" --add-label "wave-<N>"
   backlog task edit QCLI-<N2> -s "In Progress" --add-label "wave-<N>"
   # ... one edit per acquired member ...

   git add backlog/tasks/
   git commit -m "$(cat <<'EOF'
   chore(campaign): mark doc-<M> wave-<N> members dispatched

   QCLI-<N1> and QCLI-<N2> to In Progress with the wave-<N> label.

   Refs: QCLI-<N1>
   Refs: QCLI-<N2>
   EOF
   )"
   git interpret-trailers --parse <<<"$(git log -1 --format=%B)"   # confirm every Refs: line parses (QCLI-48)
   ```
   **One commit per dispatch-marking pass, naming every member marked in it — not one commit per task.** Each marked task gets its own `Refs: QCLI-<N>` line in that commit's final trailer block (QCLI-47's hybrid rule, applied the same way the docs-sync commit in (i) already applies it to a multi-task commit). Worked, verified examples on `dev`: `fe92535` (doc-11 wave 2, two trailers) and `3633bc1` (doc-11 wave 3, two trailers) — both committed cleanly with zero merge-queue conflicts.

   **Push `<default>` immediately, before dispatching any worker or re-pinning any worktree** (`QCLI-60`, closing the gap that let doc-13 wave 2's dispatch-marking commit `e532f22` be folded into PR #69's squash-merge `ed3959b` as branch content instead of already being `<default>` history — full worked example at (g) step 5 below):
   ```bash
   git push origin <default>   # no remote → skip, per this skill's existing no-remote convention
   ```
   This is what makes (g) step 2's claim that the re-pinned marking commit is already an ancestor of `origin/<default>` true by construction rather than incidental: from this point until the wave's own approved branches merge, the dispatch-marking commit is real content on `origin/<default>`, not merely a local commit riding along on whichever worker branch happens to reach the remote first. The in-flight-pointer-recording commit (section i's Commit trailer convention table and its Scope note) gets the identical treatment for the identical reason — it is the only other orchestrator-authored `<default>` commit that can land between the wave base and (g)'s merge walk, and section i's scope note now states the same push rule instead of leaving it as this step's unstated twin.

   **If the push is rejected as non-fast-forward** — `origin/<default>` moved since `WAVE_BASE` was pinned (a concurrent human push, or another process) — do not force-push:
   ```bash
   git fetch origin <default>
   git rebase origin/<default>
   git interpret-trailers --parse <<<"$(git log -1 --format=%B)"   # re-confirm every Refs: line still parses after the rebase
   git push origin <default>                                        # retry once
   ```
   Replaying the commit here is safe, and for the same reason step 5's re-pin below is safe: at this point no worker has committed anything and no worktree has been re-pinned onto this commit yet, so a rebase changes only the commit's parent and SHA, not its content. **If the retried push also fails, or the fetch shows the remote tip carries a real, substantive conflict rather than just having moved forward, STOP and escalate per `reference/escalation.md`'s error-handling table** — do not improvise a merge or a force-push.

   **A push failure that is not a non-fast-forward rejection — authentication, network, or an unset `origin/HEAD` — is a different failure class than the recovery above covers: do not fetch/rebase/retry for it.** STOP and escalate per `reference/escalation.md`'s error-handling table immediately (`QCLI-60` fix pass).

   Committing here — instead of leaving the edit dirty — is what lets a crashed session's R2/R3 tell what actually got underway: the marking is a real commit, visible in `git log <default>` no matter when a crash lands relative to the push above, not a working-tree edit a crash silently discards. That crash-visibility rationale for *committing* survives, and strengthens, under the push rule: before `QCLI-60`, an unpushed dispatch-marking commit was an expected, tolerated mid-flight state — a session could legitimately die "before the next push," which was deferred to (e)'s worker pushes or (i)'s settlement. Now that this step pushes immediately, R2 step 1 finding an unpushed dispatch-marking commit is no longer benign: it means the push above either never ran or failed, and R3 must retry it (subject to the same non-fast-forward recovery named above) before treating the wave as resumable, not a routine gap to tolerate. (SKILL.md's R3 carries a pointer to this bullet.)

5. **Re-pin every just-marked worktree onto the marking commit, before dispatching any worker (e):**
   ```bash
   MARK_SHA=$(git rev-parse HEAD)   # the commit just made in step 4
   for path in <acquired worktree paths>; do
     git -C "$path" reset --hard "$MARK_SHA"
   done
   ```
   This is safe here — and *only* here — because no worker has touched the worktree yet: each branch still holds zero commits beyond `WAVE_BASE`, so `reset --hard` discards nothing. It is also what reconciles this section's "acquire, *then* mark" ordering with giving each worker a base that already contains its own task file's marking: every worker's branch now shares the dispatch-marking commit as a common ancestor with `<default>`, so when the worker later commits its own copy of the same task file — the plan/notes writes from (e) stages 2–3, committed at stage 4 — that commit layers *on top of* the shared status+label edit rather than diverging from it. At the merge queue (g), rebasing that branch onto `origin/<default>` therefore replays only the worker's own commits; the label lines are identical on both sides (same ancestor), so there is nothing to conflict on. The worker's committed copy of the task file is what survives at merge — once its branch merges, that copy (dispatch marking plus the worker's own plan/notes on top) becomes the file's state on `<default>`, and there is no second, diverged copy left to reconcile.

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

**This label edit, and the `merge-pending` transition on `approve`, are never committed on `<default>` while that task's branch is still unmerged** (`QCLI-49`, sharpening the root cause behind (d)'s commit-and-re-pin rule; `merge-pending`'s point of action is fixed at `approve` by `QCLI-51`, replacing what used to be an unspecified "later"). By the time a member reaches `in-review`, the worker has already committed its own copy of the task file inside the worktree (stage 4: plan, notes, `updated_date`). Unlike (d) — where the marking commit happens *before* any worker commit exists, so re-pinning an empty worktree onto it costs nothing — there is no empty worktree left here to re-pin onto without discarding the worker's own commits. Committing either label edit on `<default>` at this point would create two independently-edited copies of the same task file's frontmatter block: a real rebase conflict at (g), not a hypothetical one. So instead:

1. Run the edit (`backlog task edit QCLI-<N> --add-label in-review`) as soon as the reviewer is dispatched — this is `in-review`'s point of action.
2. When the reviewer's verdict comes back `approve`, before that branch is handed to (g)'s merge walk, run a second edit on the same task file: `backlog task edit QCLI-<N> --remove-label in-review --add-label merge-pending`. This is `merge-pending`'s point of action, named here directly instead of the trailing "and later" this step used to end on (`QCLI-51`) — section (g)'s eight-step merge walk still never mentions either label, because both are already resolved by the time (g) starts.
3. After each edit, confirm the resulting diff touches only label line(s) and `updated_date` (`git diff -- backlog/tasks/`) — if it touches anything else (it shouldn't; plan/notes/ACs only ever live on the branch), stop and investigate before proceeding.
4. Leave it **uncommitted** across both edits, and discard the accumulated diff (`git checkout -- <path>`) once, **as soon as that task's own review reaches a terminal verdict** — immediately after step 2's `merge-pending` edit is applied and confirmed, for an `approve` outcome; immediately after the `escalate` verdict is returned, for an `escalate` outcome (step 2 never runs in that case, so only the `in-review` half of the diff exists to discard). This is a **per-task** trigger, not a per-task's-own-turn-in-the-merge-queue trigger (`QCLI-53`, correcting the wording here — "before that task's branch reaches (g)'s rebase step" — against what (g)'s own precondition actually requires): section (g) does not begin walking the wave at all until *every* member's review pipeline has settled (see (g)'s own opening line), so discarding as soon as *this* task's own review settles guarantees the diff is already gone before (g)'s walk starts for the wave, not merely before this one task's later turn within it — a materially looser deadline for every member queued after the first, and one that never fires at all for an escalated branch, which never reaches a rebase step. This is what keeps (g)'s clean-checkout precondition true by construction, for both labels and for every wave member, not by relying on merge-queue ordering.
5. Neither label is lost: settlement (i) sets the full, correct label set for a `Done` (or `needs-human`) task in one pass, after the branch has merged and only one copy of the file remains — the discarded mid-wave edits are reconstructed there, not persisted separately.

Evidence: doc-11 wave 2 ran `backlog task edit QCLI-48 --add-label in-review` on `dev` while `QCLI-48`'s branch was still unmerged; the resulting dirty diff was confirmed label+`updated_date`-only, discarded per the steps above, and the label reconstructed at settlement. Doc-13 wave 1 directly exercised `merge-pending`'s step-2 point of action and merged as `d652126`: `in-review` was applied at review dispatch, transitioned to `merge-pending` on the `approve` verdict, both edits remained uncommitted and were discarded before the rebase, and settlement reconstructed the durable label set. The committed result verifies the durability claim without relying on session narration: at `d652126`, QCLI-52's task frontmatter contains only `campaign`, `cluster:skill-docs`, and `wave-1`, while no committed task frontmatter contains either `in-review` or `merge-pending` (`QCLI-55`). That wave was size 1, so the then-current per-task discard deadline (before that branch's rebase) and (g)'s clean-before-the-walk precondition collapsed onto the same instant; it supplies no evidence discriminating those readings and is not a worked case for `QCLI-53`.

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

### Terminal-review snapshot — mandatory once per wave (`QCLI-54`)

After **every** member's review pipeline has reached a terminal verdict (`approve`, `merge-blocked`, or `escalate`), and after (f) step 4 has discarded every review-label diff, the **orchestrator** records one terminal-review snapshot in the campaign doc's in-flight table **before** (g)'s merge walk starts. Update every member in one `backlog doc update` pass:

- `approve` records `6 — reviewed to approve` (additional context may follow after a semicolon);
- any non-`approve` verdict records the highest numbered stage the member actually completed — normally `5 — pushed` — then names the terminal review verdict separately, e.g. `5 — pushed; review escalated, not approved`. A failed or escalated review never becomes stage 6.

Before writing, compare each numeral and its stage annotation with the Per-task stage numbers table below. They must describe the same defined stage; a mismatch such as `6 — under review` is invalid and must be corrected before the pass is written. The annotation may add recovery context, but it may not rename or contradict the numbered stage.

This snapshot is an in-flight-pointer-recording pass under section (i)'s Commit trailer convention and Scope note: commit it on `<default>` immediately, include one parseable `Refs: QCLI-<N>` trailer for every task recorded (`QCLI-47`), push it immediately with the `QCLI-60` recovery rules, and only then enter (g). One pass per terminal review barrier closes the otherwise unrecorded `approve`-before-PR crash window while adding at most one bookkeeping commit and push per wave. Recording every plan/implementation/commit/push transition was rejected as disproportionate churn; retaining dispatch-only recording was rejected because it leaves R2's fourth recovery signal stale for the whole wave.

## g. Merge — strictly serial, orchestrator only

**Precondition: the orchestrator's own `<default>` checkout must be clean before this walk starts, and stays clean across every iteration of it** (`git status --porcelain` empty; `QCLI-49`). Under this skill's chosen rule it cannot be dirty by construction: dispatch marking (d) commits its pass immediately instead of leaving edits in the working tree; the terminal-review snapshot above commits and pushes its campaign-doc pass immediately; and mid-wave label transitions (`in-review`, `merge-pending` — see (f)) are never committed on `<default>` while the affected task's branch is still unmerged, only run-then-discarded as soon as that task's own review reaches a terminal verdict (`QCLI-53`) — which (f) fixes as *before this walk starts for the whole wave*, not merely before that one task's own later turn within it, since this walk itself never begins until every member has already reached a terminal verdict. Nothing this loop does is allowed to leave a stray diff sitting on the orchestrator's checkout at this point. If it is dirty anyway — a bug in the loop, or a hand-run `backlog task edit` outside it — **do not rebase through it**: STOP per `escalation.md`'s "Dirty working tree at preflight" row and resolve it first. This precondition is what closes doc-11 wave 1's actual failure (`error: cannot rebase: You have unstaged changes`, from uncommitted `wave-1`/`in-review` label edits left on the orchestrator's checkout while the merge queue ran) — together with (d), (f), and the snapshot rule, which are what make the precondition true rather than aspirational.

Once the wave's implement→review pipelines settle (every member reached approve / merge-blocked / escalated) **and the terminal-review snapshot above is committed and pushed**, walk the `approve` branches in confirmed queue order. Nothing is pruned yet, so each worktree still exists. For each:

0. Confirm the precondition above still holds (`git status --porcelain` on the orchestrator's own `<default>` checkout is empty) before rebasing this member.
1. `git -C <worktree> fetch origin`
2. `git -C <worktree> rebase origin/<default>` — expected for every item after the first in a wave; the **normal** case, not an edge case. This branch's own task-file commit (plan/notes, from (e) stage 4) sits on top of the dispatch-marking commit the worktree was re-pinned onto in (d) step 5. That commit is an ancestor of `origin/<default>` **by construction, not incidentally**: (d) step 4 pushes it immediately after the trailer check, before any worktree is re-pinned onto it or any worker is dispatched, and the in-flight-pointer-recording commit gets the same treatment (`QCLI-60`; section i's Scope note) — so by the time this rebase runs, both are already real content on the remote, not merely local commits riding along on this branch. The rebase therefore replays only the worker's own commits and never re-touches the label lines both sides already share.
   - Clean → **mandatorily** re-run the task's verification inside that worktree. Never skip because the rebase "looked clean"; a clean rebase can still change behaviour.
   - Real content conflict → one reviewer escalation call with both diffs (the just-merged predecessor's and this branch's). Disposition only, never resolution — see `escalation.md`.
3. `git -C <worktree> push --force-with-lease origin <branch>` — publish the rebased, re-verified bytes.
4. Open the PR if not already open and merge per SKILL.md conventions. PR body: task ID, the path from `task view --json`'s `path` field, and the captured reviewer verdict. **No `Closes` keyword** — Backlog tasks have no GitHub auto-close.
5. `git checkout <default> && git pull --ff-only origin <default>` — sync the orchestrator's own checkout. This must land as a clean fast-forward; if it doesn't, **the cause is not the clean-checkout precondition above** — a dirty working tree cannot produce this error, and step 0 already reconfirmed the checkout was clean before this very iteration. The actual cause class is a local `<default>` commit that reached GitHub as *branch* content instead of already being `origin/<default>` history. Under this rule (`QCLI-60`) that should no longer happen for the dispatch-marking or in-flight-pointer-recording commits, since both are now pushed immediately (d step 4; i's Scope note) — but a push that failed or was skipped, or a commit predating `QCLI-60`, still produces exactly this.

   **Worked example — doc-13 wave 2, the failure this rule closes.** Its dispatch-marking commit `e532f22` (parent `626f369`) was never itself pushed to `origin/dev`. When its task's PR (#69) squash-merged, GitHub folded `e532f22`'s content into the merge commit `ed3959b` — also parented on `626f369` (confirmed: `gh pr view 69 --json commits` lists `e532f22` as PR #69's first commit) — because `e532f22` reached GitHub only as content on the PR's branch. `git merge-base --is-ancestor e532f22 ed3959b` is false: `e532f22` and `ed3959b` are siblings off the same parent, not ancestor and descendant, so no fast-forward existed between local `dev` (at `e532f22`) and the new remote tip. **Contrast doc-13 wave 1**, which did not hit this: its dispatch-marking commit `fe0e46f` was also not pushed by itself, but that wave's in-flight-pointer-recording commit `82fca71` — committed on top of `fe0e46f` — was pushed shortly after (`origin/dev`'s reflog: `82fca71 ... update by push`), incidentally carrying `fe0e46f` to `origin/dev` before the merge walk ran. Wave 1 escaped by accident of unrelated bookkeeping, not by rule; wave 2 had no such rescue because no in-flight-pointer commit was recorded before its merge walk. This rule makes that rescue deliberate and unconditional for every wave instead of a lucky accident.

   Treat a failed fast-forward here as **a bug in the loop, not a routine conflict to resolve inline** — this instruction is unchanged. Run the recovery below before any history-discarding command, and see `reference/escalation.md`'s matching error-handling row.

   **Recovery when step 5 fails to fast-forward** (`QCLI-60`, narrowed by a mandatory-review fix pass — the original check here tested a local-only commit's *class*, not whether its *content* actually reached `origin/<default>`, which is not what "prove no content was lost" requires): STOP this merge-queue walk here for this member — do not proceed to step 6, and do not run any history-discarding command until the checks below have run.

   1. **Enumerate the divergence.** `git fetch origin <default>`, then compare what's local-only against what's remote-only: `git log origin/<default>..<default> --format='%h %s'` (local-only) and `git log <default>..origin/<default> --format='%h %s'` (remote-only — expected to be non-empty; that is the divergence itself).
   2. **Account for every local-only commit — class membership plus content presence, not class alone.** Under this rule, the only commits that can legitimately still be local-only here are *this wave's own* dispatch-marking or in-flight-pointer-recording commit whose push (d step 4; i's Scope note) failed or was skipped, or a commit predating `QCLI-60`. That class check only explains why a commit might still be unpushed — it does not prove its content reached `origin/<default>` by another path. Prove that separately, per commit that passes the class check:
      ```bash
      git merge-base --is-ancestor <sha> <branch>   # <branch> = this iteration's own branch — still checked out, not deleted until step 7
      ```
      True means `<sha>` is an ancestor of the branch this iteration just squash-merged, so its content rode that branch into the squash by construction. This is the dispatch-marking commit's usual shape here: (d) step 5 re-pinned this worktree onto it before the worker was even dispatched, so it is normally an ancestor of `<branch>` — unless the per-member `rebase origin/<default>` at (g)'s own step 2 (above, before this recovery block; not this recovery's own step-2 numbering) replayed it under a new SHA, because `origin/<default>` moved between (d) step 4's push and that rebase (e.g. a concurrent human push); the ancestor check then returns `false` for a commit whose content did in fact reach the remote, under a different SHA. A *mid-wave or R3-recovery* in-flight-pointer-recording commit (the variant section i's trailer table names) is never an ancestor of any worker branch — it is committed only *after* every worktree in the wave was already re-pinned in (d) step 5 — so expect `false` for it; a failed push then means it never reached the remote by any path either, and a squash-merge that never included it cannot have "already folded it in." Age alone ("predates `QCLI-60`") says nothing about which case it is — check it too. If `<branch>` is already gone (a stale local-only commit unrelated to this iteration's own member), fall back to a content diff instead of the ancestor check:
      ```bash
      paths=$(git show <sha> --name-only --format=)
      git diff <default> origin/<default> -- $paths
      ```
      Empty output means `origin/<default>` already matches local content on every path `<sha>` touched.

      **Any commit failing the class check — content this recovery cannot explain at all — STOP and escalate per `reference/escalation.md`'s error-handling table; do not guess and do not reset past it. A commit that passes the class check but whose content presence cannot be proven — the ancestor check returns false, or (when it runs instead) the content-diff fallback is non-empty — is not an escalation: it is step 3's preserve case.**
   3. **Discard only what step 2 proved is already on the remote; preserve the rest.**
      - Every local-only commit that passed step 2 needs nothing further: `git reset --hard origin/<default>`.
      - A local-only commit that failed step 2's content proof (passed the class check, failed the ancestor/diff check) is **not** safe to discard — this is the expected shape of the mid-wave/R3-recovery in-flight-pointer case above. Instead: `git reset --hard origin/<default>` to take the remote history, then `git cherry-pick <sha>` to restore that commit's own content on top (a conflict → STOP and escalate, do not resolve inline), then `git push origin <default>` — retrying the non-fast-forward recovery at (d) step 4 if this push is itself rejected. An *empty* cherry-pick here (git reports "The previous cherry-pick is now empty") is not a conflict and not an escalation — it means this is the replayed-SHA case above (`<sha>`'s content was already folded into `origin/<default>` under a different SHA the ancestor check couldn't match): treat it as the discard case, `git cherry-pick --skip` (or `--allow-empty` only if the wave log needs the marker commit itself preserved), and continue.
   4. Re-verify: `git log --oneline -5` on `<default>` shows the expected squash-merge commit(s) — and, if step 3's cherry-pick path ran, that commit on top of them — and `git status --porcelain` is empty.
   5. Resume the walk at step 6 for this member, and continue to the next member.
   6. Record the recovery in this wave's wave-log entry (campaign doc): every local-only SHA and its disposition — folded into the named remote commit (step 3's discard case), or cherry-picked and re-pushed as a named new SHA (step 3's preserve case) — so a later reader is not surprised by the gap.

   This recovery is a **backstop**, not a substitute for the push rule above — finding it in active use across more than one wave is itself a signal the push rule has a gap worth raising as a new finding, not something to silently re-litigate here.
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

### Commit trailer convention (hybrid rule, `QCLI-47`)

SKILL.md's Commits convention is hybrid, not "always except `lore sync`": a `Refs: QCLI-<N>` trailer is required wherever a commit has one directing task, and named as an exception wherever it genuinely does not. Concretely, for the orchestrator's own bookkeeping commits — the worker's own task-implementation commit is always single-task and always trailed, per SKILL.md's Commits row and (e) above, and is not repeated here:

| Commit | Single directing task? | Trailer |
| ------ | ----------------------- | ------- |
| Dispatch marking (d) — committing the pass's `backlog task edit QCLI-<N> -s "In Progress" --add-label "wave-<N>"` edits | Multiple — every member marked in that pass, not one commit per task (`QCLI-49`) | **Required**: one `Refs: QCLI-<N>` trailer per task marked in that pass (e.g. `fe92535`, `3633bc1`) |
| In-flight pointer recording (mid-wave, or R3 crash recovery) — records the *campaign doc's* in-flight table, not the task file | Multiple — every task whose stage is being recorded in that pass | **Required**: one `Refs: QCLI-<N>` trailer per task recorded in that pass (e.g. `61d48af`) |
| Settle (i, above) — committing the per-task settlement writes | Yes — the task being settled, even when the same commit also closes the campaign (e.g. `342e76d`) | **Required**: `Refs: QCLI-<N>` |
| Docs sync commit (i, step 2 below) | Multiple — every task resolved this wave | **Required**: one `Refs: QCLI-<N>` trailer per resolved task |
| Campaign init (SKILL.md I3) — campaign doc creation, label application | No — spans the whole queued set, not one task | **Exception**: no trailer |
| Campaign close (R6 queue-empty path, or a close-out commit naming no single task) | No | **Exception**: no trailer |
| Handover archive (R5.1, and W-mode's equivalent) | No — session/campaign bookkeeping | **Exception**: no trailer |
| `.claude/handovers/` gitignore setup (SKILL.md I3, one-time) | No | **Exception**: no trailer |
| `lore sync`'s own `backlog/` auto-commit | No — hardcoded, outside this skill's control | **Exception** (pre-existing, `QCLI-43`): no trailer |

The dividing line is **not** the commit's category label, it is whether the commit names one specific task. A settle-and-close commit like `342e76d` still carries that task's trailer because it has one; a pure close-out or init commit does not, because it doesn't.

**Scope note (`QCLI-49`, extended by `QCLI-60`):** in-flight pointer recording writes the *campaign doc's* in-flight table (e.g. `61d48af` touches only `backlog/docs/campaigns/…`), never the task file itself, so it carries none of (f)'s rebase-conflict risk and is always committed immediately, same as (d) — and now **pushed** immediately after that commit too, same rule as (d) step 4: `git push origin <default>` (no remote → skip), the identical non-fast-forward recovery on rejection (fetch, rebase, re-confirm the trailer block, retry once, else escalate per `reference/escalation.md`), for the identical reason — it is the second, and last, orchestrator-authored `<default>` commit type that can land between the wave base and (g)'s merge walk (dispatch marking, above, is the first). Settlement and docs-sync commits, covered elsewhere in this same section, carry no equivalent exposure and need no change here: both run strictly *after* (g)'s walk has already merged the wave's branches, and (i) step 3 already pushes them. Mid-wave label transitions on the *task file* (`in-review`, `merge-pending`) are governed by (f) instead, and are never committed on `<default>` while the affected branch is unmerged — they do not appear as a row in this table because they are deliberately never committed at all; they are folded into the settlement commit's label state instead.

### Trailer placement and verification (`QCLI-48`)

A `Refs: QCLI-<N>` **line in the message text is not automatically a trailer git parses.** Git's trailer machinery (`interpret-trailers`, and `%(trailers:...)` in `log --format`) only recognizes a *contiguous run of trailer-shaped lines at the very end of the message* as "the trailer block." A `Refs:` line separated from that final block by a blank line is body text to git, not a trailer — even though it reads identically to a real one.

This bites hardest on PR squash-merges. A generated squash body typically concatenates each source commit's message, and if the branch had more than one commit, each one's own `Refs: QCLI-<N>` line ends up followed by a blank line and then the *next* commit's block — with the final block in the whole message usually being a synthesized `Co-Authored-By:` line contributed by the merge tooling. Result: the `Refs:` text is present and human-readable, but `git interpret-trailers --parse` reports only the trailing `Co-Authored-By:` line, and `%(trailers:key=Refs)` reports empty.

**Verification.** Never trust the text alone, and never trust `%(trailers:key=Refs)` alone when composing a squash-merge body by hand — it silently agrees with the broken case. Use:

```bash
git interpret-trailers --parse <<<"$(git log -1 --format=%B <sha>)"
```

and confirm the `Refs: QCLI-<N>` line is present in its output. This is the check every commit-authoring step in this skill (d, e, g's squash-merge, i) and every sweep of already-merged history must use.

**Worked correct example** — `342e76d` (a directly-authored settlement commit; `Refs:` is the last line, nothing after it):

```
$ git interpret-trailers --parse <<<"$(git log -1 --format=%B 342e76d)"
Refs: QCLI-43
```

**Worked incorrect example** — `7efc1a4` (a squash-merge of a multi-commit branch; each source commit's own `Refs: QCLI-43` line sits above a blank line and further commit text, and the message's actual final trailer block is a lone `Co-authored-by:` line):

```
$ git log -1 --format='%(trailers:key=Refs)' 7efc1a4
                                                        # <- empty, naive check silently "passes" as absent
$ git interpret-trailers --parse <<<"$(git log -1 --format=%B 7efc1a4)"
Co-authored-by: Claude Opus 5 (1M context) <noreply@anthropic.com>
                                                        # <- Refs: text is in the message but not reported here
```

**When authoring a squash-merge body by hand (g):** put the `Refs: QCLI-<N>` trailer as the literal last line(s) of the message, with no blank line before it and nothing after it. If the branch had multiple commits each carrying their own `Refs:` line, do not carry all of them through — one `Refs: QCLI-<N>` trailer in the final block is sufficient and correct, since a squash-merged branch is single-task by construction (e above).

**Disposition of already-merged unparseable commits.** A `dev`-wide sweep (below) found 36 commits whose message text contains a `Refs:` line that `git interpret-trailers --parse` does not report, including `7efc1a4` (the already-merged `QCLI-43` squash commit named in `QCLI-48`'s task). Per this task's scope, **none of these are amended or re-trailered** — no existing commit on `dev` is rewritten. The sweep result itself, re-runnable with the command below, is the durable record of the gap; a future sweep must not conflate "no `Refs:` text at all" with "`Refs:` text present but unparseable" — run both checks (a text grep for `^Refs:` and `interpret-trailers --parse`) and report both counts.

Sweep command and result (run against `dev` at 258 commits, `QCLI-48`, 2026-08-07):

```bash
git log dev --format='%H' | while read c; do
  msg=$(git log -1 --format=%B "$c")
  if echo "$msg" | grep -qE '^Refs:'; then
    parsed=$(git interpret-trailers --parse <<<"$msg" | grep -E '^Refs:' || true)
    [ -z "$parsed" ] && echo "TEXT_PRESENT_UNPARSEABLE: $c" || echo "OK_PARSES: $c"
  fi
done
```

258 commits scanned; 202 carry `Refs:` text; 36 of those are unparseable (166 parse correctly). Full per-commit list recorded in `QCLI-48`'s task notes, not duplicated here — this skill file documents the rule and the disposition, not a point-in-time sweep result that would go stale.

### Lore log sync — mandatory, last, once per wave

**Deliberate divergence from upstream (`QCLI-43`; see SKILL.md Provenance).** `docs/log.md` drifted from `<default>` after every campaign before this rule existed — QCLI-35 closed it for doc-7, QCLI-39 closed it for doc-8, doc-9 reopened it again — but measurement shows two distinct failure modes, not one.

1. **Squash-rewrite / dangling SHAs.** A worker ran `lore sync` on its own per-task branch; that branch's later squash-merge rewrote the branch's commit SHAs, so the entries the sync had recorded were never ancestors of `<default>`. This fired **repeatedly**, not once — measured via `git show <ref>:docs/log.md` plus a per-SHA `git merge-base --is-ancestor` check at each `docs/log.md`-touching commit: 1 bad SHA at QCLI-16 (`44a7ed8`), 2 at QCLI-17 (`fb8e8e3`), 3 at QCLI-19 (`adea711`), 4 at QCLI-21 (`f43a083`), 5 at QCLI-22 (`2fd6c13`), and 4 at QCLI-28 (`43bc22e`/#44 — `6f4dc18b…`, `a357d12f…`, `a6fc2021…`, `fcb814f4…`, confirmed by `git log -S<sha> --reverse -- docs/log.md` for each). Six episodes, each "fixed for good" by a one-shot regeneration that a later per-task-branch sync reopened — three times over (`d95c1ee`, `a935a36`, `f528d93`) before QCLI-35's fix (`2b30560`). It has not recurred since: 0 bad of 86 measured immediately at `2b30560`, 0 bad of 92 at QCLI-39's `1f252dd`, and 0 bad at every `docs/log.md`-touching commit through the current 95 recorded SHAs. It stopped recurring because syncs stopped running from per-task branches — precisely the constraint this contract makes structural.
2. **Staleness.** New `docs/`-touching commits landing on `<default>` with no sync run to catch them up. Missing entries, not corrupted ones. This is what drove every reopening after QCLI-35 and is the dominant mode today — measured at 3 unrecorded commits at the time of writing (98 `docs/`-touching commits on `<default>` vs 95 currently recorded SHAs).

The remedy targets both modes directly, not by inference from getting the history right. Running the sync from settlement, on `<default>`, strictly after each wave's own merges (g) land, fixes staleness by construction — it can no longer fail to run, because it is now part of every wave's settlement instead of a task someone has to remember to file — and it keeps the dangling-SHA mode closed for the same structural reason it closed after QCLI-35: settlement runs "orchestrator only, on `<default>` directly. Never on a per-task branch" (above), so every SHA the sync ever records is already, permanently, part of `<default>`'s own history at record time — never a branch commit awaiting a squash-merge that could invalidate it. A commit already on `<default>` stays an ancestor of `<default>` forever under this skill's merge model (fast-forward only; no rebase or force-push of `<default>` anywhere in this skill — see g, R5).

Run once, as the **last** action of this wave's settlement — strictly after every per-task write above and after the campaign-doc write, so the sync reconciles against this wave's *final* state (every resolved task already `Done`, the campaign doc already updated) instead of a stale in-between snapshot that would just need a second sync:

```bash
lore sync --json
```

This one invocation does two things: it writes the bundle (regenerating `docs/log.md`, and possibly `docs/index.md` and/or a Story's `<!-- lore:tasks -->` managed block if this wave flipped a linked task to `Done`), and it auto-commits `backlog/` if left dirty. That auto-commit is `lore sync`'s own catch-all sweep, not the narrower `lore link`/`lore unlink` case `lore instructions sync` names — see `lore instructions linking`: "`lore sync`'s own commit step is now a catch-all sweep: it still commits anything left dirty under `backlog/` from another source (a human's direct `backlog task edit`, or a prior run's commit that failed)." Since `backlog/config.yml` sets `auto_commit: false`, nothing else in settlement commits the per-task writes (a) or the campaign-doc write (b) — this auto-commit is what actually persists them to git. Treat it as settlement's own backlog-write commit, not a side effect to undo or fold away. It is also, by design, one of this contract's named untrailered exceptions (see "Commit trailer convention" above) — hardcoded in the lore binary as `chore(backlog): sync task changes`, outside this skill's control — and SKILL.md's Commits convention names this exception, alongside the campaign-scoped bookkeeping exception added at `QCLI-47`, rather than silently drifting from "always a trailer."

`docs/log.md` records only commits that **touch `docs/`**, not every commit on `<default>` — keep that scope in mind when checking AC #1: the recorded-SHA count should match the count of `<default>` commits that touch `docs/`, not `git log <default> | wc -l`. There is also an inherent one-commit lag: the docs commit (step 2 below) itself touches `docs/`, but cannot appear in the log entry it just generated — that commit doesn't exist until after this `lore sync --json` call runs — so immediately after every settlement, `docs/log.md` legitimately records N-1 of the N `docs/`-touching commits on `<default>` at that moment. Benign, and AC #1's "up to the sync commit" phrasing already accommodates it; the next wave's sync catches the missing entry up along with everything else.

1. **Gate before committing.** `lore check --strict` — must report 0 errors and 0 warnings. Run it here, against the sync's uncommitted working-tree output, before step 2 below lands any new commit on `<default>`. A drift/link/portability finding means investigate and re-run `lore sync` — the fix for reconciliation drift specifically (`lore instructions check`) — then re-check, before proceeding; nothing but the `backlog/` auto-commit above has landed on `<default>` yet, so there is no docs-commit to back out of.
2. **Commit the docs changes.** Read the `files` list from the `lore sync --json` call above's JSON payload at `.data.files[].path`, e.g. `jq -r '.data.files[].path'`. The field shape, confirmed by running `lore sync --dry-run --json` on this branch (a real, non-dry-run sync cannot be exercised here without touching `<default>` — the exact trap this contract exists to avoid): `{"schemaVersion":1,"kind":"sync.result","data":{"files":[{"path":"docs/log.md"}],"filesChanged":1,"backlogCommit":{"committed":false,"files":[]},"dryRun":true,"orphanedIndexes":[]}}`. That sample is itself a **dry-run** payload (`"dryRun":true`) — shown only for field shape, not as a real-run example. A real settlement run reports `"dryRun":false`, and `backlogCommit` reflects whatever it actually found: `{"committed":true,"files":[...]}` if `backlog/` was dirty and got swept (the auto-commit the paragraph above describes), or `{"committed":false,"files":[]}` unchanged if `backlog/` was already clean. `git add` exactly the `data.files[].path` paths and commit them together as one commit, e.g. `docs: sync lore log after wave-<N> settlement (doc-<M> campaign)`, with one `Refs: QCLI-<N>` trailer per task resolved this wave. An empty `files` list means this wave's resolved tasks touched no lore-tracked doc — nothing to commit, not an error.
3. `git push origin <default>` (no remote → skip) — publishes every commit accumulated this wave: the `backlog/` auto-commit above and the docs commit from step 2.

**Per-wave, not per-campaign.** Settlement already runs once per wave — this loop repeats per R4j — so the sync inherits that cadence for free; there is no separate per-campaign step to remember or skip. A per-campaign-only alternative was considered and rejected: it would leave `docs/log.md` stale for every wave but the campaign's last, reproducing the exact "log is one wave behind" gap QCLI-39 existed to close — even *within* a single multi-wave session — and it widens the window a crash has to land in before the log goes stale. This repo's own log history already shows a de facto per-wave cadence (manual entries like "docs: sync log.md and story managed block after wave-1 merges" predate this rule); this rule only makes that cadence mandatory and moves it off the per-task-branch ref that kept undoing it.

**Failure paths:**

- **No remote.** The `lore sync --json` call, its `backlog/` auto-commit, `lore check --strict`, and the explicit docs commit are all local and always run; only the final `git push` is skipped, per this skill's existing no-remote convention.
- **No `gh`.** Unaffected — `gh` is only used for the optional PR audit trail in (g); the sync reads and writes `<default>`'s actual git history, not PR state.
- **A stuck branch (g).** A task that does not merge this wave is not part of this wave's per-task writes (a) and contributes no new commits to `<default>` — it is simply outside this sync's scope until the wave it actually does merge in. No special-casing needed.
- **A crashed session resuming at R3.** `lore sync` is idempotent (`lore instructions sync`: unchanged inputs produce byte-identical output), so re-running it is always safe even if a prior session partially completed this step — e.g. crashed after the `backlog/` auto-commit but before `lore check --strict`, or after the docs commit but before push. R3's reconciliation must include: run `lore sync` again before starting a new wave; if it reports any `files`, run `lore check --strict` and commit/push them (step 2) before proceeding. This closes the same gap R3 already closes for Backlog and campaign-doc state — the log is just one more thing R3 verifies against ground truth rather than trusts from the handover. (SKILL.md's R3 carries a pointer to this bullet.)

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

This scale governs the `Stage reached` column in **both** the campaign doc's in-flight table and the active handover's in-flight table. Record it as `<number> — <defined Stage text>`; extra context may follow after a semicolon, but the annotation must not rename or contradict the numbered stage. Stage 6 is reserved for an actual reviewer verdict of `approve`. For `merge-blocked` or `escalate`, retain the highest stage actually completed and name the non-approve verdict separately.

| # | Stage | Owner |
| - | ----- | ----- |
| 0 | Worktree + branch acquired from the pinned wave base | Orchestrator |
| 1 | Task marked `In Progress` + `wave-<N>`, marking committed on `<default>` and the worktree re-pinned onto that commit (d), worker dispatched | Orchestrator |
| 2 | Plan recorded on the task | Worker |
| 3 | Implemented + verified, notes recorded | Worker |
| 4 | Committed | Worker |
| 5 | Pushed | Worker |
| 6 | Reviewed to `approve` | Reviewer |

Opening/merging the PR, settling the task, syncing local `<default>`, and pruning the worktree and branch are **not** part of this sequence — they are shared-state mutations belonging to the serialized merge queue (g) and settlement (i). Do not reintroduce them here.
