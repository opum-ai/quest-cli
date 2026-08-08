---
name: backlog-handover
version: "0.9.1-qcli.6"
description: "Multi-session burndown campaign driver for this project's Backlog.md queue. Each restore session recomputes the ready set from native Backlog dependencies, drains as many non-conflicting tasks as it safely can — dispatched in parallel waves to isolated worker subagents in git worktrees, gated by a mandatory top-tier reviewer, merged one at a time by the orchestrator — then writes a grounded handover so the next session continues with '/clear' + restore. Explicit invocation only: this is the heavyweight campaign driver, NOT routine Backlog.md work. Ordinary task reads, creates, edits, and single-task execution use the plain `backlog` CLI per CLAUDE.md."
disable-model-invocation: true
---

# Backlog Handover — DAG-parallel campaign driver

Burn down this project's Backlog.md queue across many small sessions, each draining as much as it safely can. Input: $ARGUMENTS

The orchestrator (this session) never implements or reviews anything itself — it computes what is safe to run in parallel, manages worktrees, dispatches subagents, and serializes the shared-state steps (merge, task settlement, campaign-doc writes) that cannot be parallelized. The user drives the whole campaign with only:

```
/clear  →  /backlog-handover restore  →  (repeat until the queue is empty)
```

**This skill is invoked explicitly, never inferred.** "Work through the backlog" in this project usually means ordinary `backlog task` usage, not a parallel campaign — hence `disable-model-invocation: true`.

---

## Requirements

- **Always**: git; the `backlog` CLI (this project's sole system of record — see CLAUDE.md).
- **Optional**: remote `origin` (push/PR/prune steps skipped without one); `gh` authenticated, for PRs; `treehouse` CLI for pooled worktree reuse (plain `git worktree add` is the fallback).
- **Full wave-parallel execution**: the session must be able to dispatch parallel subagents via the Agent tool with per-call model selection (mid-tier workers, top-tier reviewer). Without it, degrade gracefully — see Execution Model.

Read `backlog instructions overview` at the start of every campaign session, per CLAUDE.md. Workers and reviewers are told to read `task-execution` and `task-finalization` respectively.

### Statusline (optional)

ECK is not required by this skill. Guard every call so a non-ECK environment degrades silently:

```bash
[ -n "$ECK_HOME" ] && [ -x "$ECK_HOME/update-stage.sh" ] && bash "$ECK_HOME/update-stage.sh" "Waves (4/6)"
```

Reset with the same command and no argument at completion (success or error).

| Stage | Subject            | Statusline      |
| ----- | ------------------ | --------------- |
| 1     | Stage 1: Locate    | Locate (1/6)    |
| 2     | Stage 2: Verify    | Verify (2/6)    |
| 3     | Stage 3: Reconcile | Reconcile (3/6) |
| 4     | Stage 4: Waves     | Waves (4/6)     |
| 5     | Stage 5: Re-arm    | Re-arm (5/6)    |
| 6     | Stage 6: Report    | Report (6/6)    |

(Restore mode — the driver. Init reuses it as Inventory / Confirm / Create / Handover; Write and Status are single-stage.)

---

## Usage

```bash
/backlog-handover init      # one-time: build the campaign doc from the open queue, write the first handover
/backlog-handover restore   # THE DRIVER: verify ground truth, drain wave after wave, re-arm
/backlog-handover write     # bailout: session ending with work unfinished — write a grounded handover
/backlog-handover status    # read-only: queue partition, campaign doc, handover, branch/worktree state
```

Mode detection: an explicit mode argument wins. Otherwise infer: continue/resume/burn-down language → `restore`; set-up-a-campaign language → `init`; session-ending-with-work-unfinished → `write`. Genuinely bare or ambiguous → `status` — the only safe default when intent cannot be determined, never a way to silently ignore a clear request to act.

---

## Execution Model

Three tiers, fixed roles — do NOT blur them:

| Tier | Who | Does | Never does |
| ---- | --- | ---- | ---------- |
| **Orchestrator** | This session (top-tier model, Agent-tool parallel dispatch) | Computes the ready/conflict graph; creates and manages every worktree; dispatches workers/reviewers; runs the serialized merge queue; performs every task settlement (AC checks, final summary, terminal status) and every campaign-doc write | Implements code, writes a review verdict, edits a task's code inside its worktree. Its only hands-on contact with a task branch is worktree lifecycle and the final merge |
| **Worker** | Mid-tier agent (e.g. `model: sonnet`), dispatched per task via the Agent tool, worktree path given as explicit cwd | One task: read it, plan, implement, self-verify against real gates, record plan/notes/comments on its own task, commit, push | Create or remove its own worktree; merge; check acceptance criteria; write the final summary; move the task to a terminal status; edit the campaign doc; create new tasks |
| **Reviewer** | Top-tier agent (e.g. `model: opus` or strongest available), dispatched into the worker's existing worktree | The **mandatory** gate for every task and the judgment call for every escalation; independently re-runs verification; returns a structured per-criterion verdict | Resolve conflicts or write fixes itself — it decides disposition and hands fixes to a fresh worker; write to Backlog or git itself — the orchestrator records its verdict |

**Degraded mode** (no parallel dispatch, or no per-call model selection): wave size = 1, a single plain feature branch (no worktree management — only one task ever in flight), implement yourself, and run the review as an explicit adversarial self-review pass — the review step still happens, never skipped. **Default to one wave (= one task) unless the user asks for more**: in degraded mode the implementation transcript accumulates in this session's own context, so the old one-task-per-session bound applies again. Every other rule (merge serialization, settlement centralization, escalation criteria, wave-log format) is unchanged — this is the same algorithm at both ends, not two procedures.

Why waves instead of one task per session: the one-task rule existed to stop a single acting model's context from degrading. Here the orchestrator never does the straining work — implementation and review live in fresh subagents whose transcripts never enter its context — so the unit that must stay small is the *wave* (a bounded, conflict-disjoint batch), not the task.

---

## Conventions

| Thing | Convention |
| ----- | ---------- |
| **System of record** | Backlog.md, via the `backlog` CLI **only**. Never edit files under `backlog/` directly (CLAUDE.md). There is no second tracker: no GitHub Issues, no `tracker:*` primitives |
| **Bulk read** | Two-tier, and this is a real constraint: `backlog task list --json` returns id/title/status/labels/ordinal but **not** dependencies, description, or acceptance criteria. Get the roster from one `task list --json`, then `backlog task view <ID> --json` **only for campaign-labelled, non-Done candidates** — never the whole backlog, never once per task in a loop over everything |
| **Campaign membership** | Label `campaign`. Applied at init to every queued task; the ready-set computation only ever considers labelled tasks, so ad-hoc tasks created outside the campaign are never swept into a wave |
| **Dependencies** | Backlog's **native** `dependencies` field (`--dep` at create, `--dep` at edit — note edit *replaces* the list). This is the dependency graph; do not maintain a parallel Deps table |
| **Stage state** | Backlog has three statuses, the campaign has six stages. Status carries the coarse state, labels carry the sub-stage — see the state table below |
| **Campaign doc** | A Backlog document: `backlog doc create "Backlog campaign tracker" -p campaigns -t other`, thereafter `backlog doc update <docId> --content "..."`. Lands under `backlog/docs/`. **Never** in the lore-managed `docs/` tree, and never hand-edited |
| **Handover** | Active: `.claude/handovers/HANDOVER-{YYYY-MM-DD}-backlog-campaign.md` (gitignored). Consumed → `archive/handovers/` (tracked; on name collision suffix `-2`, `-3`, …). One active handover per topic. Conventions are inlined here — this project has no separate `handover` skill |
| **Wave** | The atomic dispatch unit: a conflict-disjoint subset of the ready set, implemented and reviewed in parallel, merged serially |
| **Wave size cap** | Default 6 concurrent workers regardless of ready-set size — bounds worktree/disk cost, reviewer throughput, and how many sequential rebase-merges one drift check must reconstruct if a session dies mid-wave. A wave shrinking to 1 is the algorithm correctly degrading to sequential, not a bug |
| **Worktrees** | Orchestrator-managed. `treehouse` lease when the CLI is present, else `git worktree add`. Full lifecycle in `reference/wave-loop.md` |
| **Feature branch** | `feat/qcli-<N>-<slug>` or `fix/qcli-<N>-<slug>` per change type. Created by the orchestrator as part of worktree setup — the worker is dispatched *into* an already-branched worktree and never runs `git checkout -b` |
| **Default branch** | `dev` (this repo's integration branch). Resolve as `git symbolic-ref --short refs/remotes/origin/HEAD` stripped of `origin/`; fall back to `dev`, then `main`. If that symbolic ref is missing, run `git remote set-head origin -a` once rather than guessing |
| **Commits** | Project commit conventions. Hybrid trailer rule (`QCLI-47`, refining `QCLI-43`'s single exception): a `Refs: QCLI-<N>` trailer is **required** on every commit that has a directing task — every worker/implementation commit; every orchestrator settlement commit (single task); and every orchestrator dispatch-marking or in-flight-pointer-recording commit (one commit per pass, carrying one `Refs: QCLI-<N>` trailer per task marked or recorded in that pass, not one commit per task — `QCLI-49`). Two exceptions carry **no** trailer, both genuinely task-less: `lore sync`'s own `backlog/` auto-commit (hardcoded in the lore binary as `chore(backlog): sync task changes`, outside this skill's control — `QCLI-43`'s original exception), and campaign-scoped bookkeeping commits with no single directing task — campaign init, campaign close, handover archiving, and the one-time `.claude/handovers/` gitignore setup at I3. A `Refs:` line only counts if `git interpret-trailers --parse` reports it as a trailer — it must sit in the message's final trailer block with no blank line separating it from other trailers (e.g. a squash-merge's generated `Co-Authored-By:` block), a failure mode a naive `%(trailers:key=Refs)` check silently misses (`QCLI-48`). Full per-commit-type breakdown, the placement rule, verification command, and worked examples in `reference/wave-loop.md` section i |
| **PR** | Optional audit trail, not a second approval wait. `gh pr merge <branch> --squash --delete-branch` after rebase + re-verify + re-push. **There is no `Closes #N` auto-close for Backlog tasks** — settlement always moves the task to `Done` explicitly. No `gh`/no remote → local `git merge --ff-only` |
| **Review gate** | Mandatory. Every branch needs an `approve` verdict before it is eligible for the merge queue |
| **Write concurrency** | Worker writes to its **own** task (`--plan`, `--append-notes`, `--comment`) are parallel-safe. AC checks, final summary, terminal status, `--dep` edits, and campaign-doc writes are **orchestrator-only and serialized** |

### Campaign stage → Backlog state

| Stage | Status | Labels | Committed to Backlog? |
| ----- | ------ | ------ | ---------------------- |
| Queued | `To Do` | `campaign` | Yes |
| Dispatched | `In Progress` | `campaign`, `wave-<N>` | Yes — committed by (d)'s dispatch-marking pass |
| In review | `In Progress` | `campaign`, `wave-<N>`, `in-review` | **No — working-tree-only, see below** |
| Merge-pending | `In Progress` | `campaign`, `wave-<N>`, `merge-pending` | **No — working-tree-only, see below** |
| Done | `Done` | `campaign`, `wave-<N>` (ACs checked, final summary set) | Yes — committed at settlement, `reference/wave-loop.md` section (i) |
| Blocked / needs human | `To Do` | `campaign`, `needs-human` (reason recorded in the campaign doc) | Yes |

Everything Backlog can express natively lives in Backlog. The campaign doc holds only what it cannot: human-confirmed priority order, cluster assignments, the wave log, in-flight worktree/branch pointers, and needs-human reasons.

**`in-review` and `merge-pending` are never observable in a committed task file** (`QCLI-51`, sharpening `QCLI-49`). `reference/wave-loop.md` section (f) applies each as a `backlog task edit` on the orchestrator's own `<default>` checkout, confirms the resulting diff is label-only, and discards it uncommitted before the affected branch reaches section (g)'s rebase — so neither label is ever an ancestor of any commit on `<default>`, and a `backlog task view` run against a clean checkout will never show either one, even for a branch that has already been reviewed and approved. Both rows get identical durability treatment for the same reason: committing either mid-wave, while the affected branch is still unmerged, is exactly the rebase conflict `QCLI-49` closed.

The two labels mark different points of action, stated explicitly here rather than left to the trailing "and later" this table used to imply:

- `in-review` is applied when section (f) dispatches the reviewer into the worker's worktree — review's start.
- `merge-pending` is applied when that reviewer's verdict comes back `approve`, before the branch is handed to section (g)'s merge walk — review's end, not an unspecified "later." `reference/wave-loop.md` section (f) names this step directly.

Both are reconstructed correctly once the branch has actually merged: settlement (section i) sets the full label set for a `Done` or `needs-human` task in one pass, on the single surviving copy of the file. Because neither label ever reaches a committed state, R2's crash-recovery classification must not — and does not — cross-check a leftover branch or worktree against either one; see R2 for what it checks instead.

---

## Project rules that override the upstream design

This skill is a fork of an ECK/GitHub-Issues skill. Three of this project's mandated rules change its behaviour — do not "restore" the upstream shape:

1. **No autonomous follow-up tasks.** `backlog instructions task-finalization` states: *do not create or start follow-up tasks without user approval.* Wave-level integration findings and out-of-scope discoveries are therefore **surfaced to the user at R6**, never auto-filed. The orchestrator drafts the proposed task (title, description, ACs) in the campaign doc and the report, and waits.
2. **No archiving of completed work.** Same guide: *tasks in the terminal status stay there until periodic cleanup.* Never run `backlog task archive` or `backlog task complete` on campaign tasks.
3. **Finalization order is fixed.** Verify objectively → `--check-ac <index>` (only what evidence proves) → `--check-dod` → `--append-notes` → `--final-summary` → status `Done`. Never check an AC from code presence, grep output, or implementation intent.

---

## Init Mode

**I1: Inventory.** One `backlog task list --json` for the roster; `backlog task view <ID> --json` for each non-Done candidate. Classify honestly: *agent-resolvable now* (joins the campaign) vs *needs a human / product decision / blocked* (recorded in the campaign doc's needs-human section with the reason, label `needs-human`). A task whose acceptance criteria cannot be objectively verified by an agent alone does not belong in the queue — it only manufactures a stuck wave later. Assign each queued task a one-word cluster (subsystem/topic) as label `cluster:<name>`.

**I2: Confirm with the user.** Propose an order (lowest-risk/highest-information first: doc-only → small code → spikes) and get explicit confirmation via AskUserQuestion. Record it verbatim in the campaign doc. State plainly that it is the wave-builder's tie-break, not a strict execution order.

**I3: Create the campaign doc + directories.** `backlog doc create "Backlog campaign tracker" -p campaigns -t other`, populated from `reference/templates.md`. Apply `campaign` and `cluster:*` labels to queued tasks. Ensure `.claude/handovers/` is gitignored and `mkdir -p archive/handovers`. Commit the gitignore change on the default branch (campaign-scoped, no single directing task — the Commits convention's no-trailer exception, not the `always a trailer` default).

**I4: Write the first handover.** Run Write mode, then tell the user the driver loop: `/clear` → `/backlog-handover restore`.

---

## Restore Mode — the driver

**R1: Locate.** Newest `.claude/handovers/HANDOVER-*-backlog-campaign.md`. No handover but the campaign doc exists → say so and proceed from the doc alone (the handover is an accelerator; Backlog + the campaign doc are the record). Neither exists → suggest `init`; STOP.

**R2: Verify ground truth.** A crashed session may have left branches at *different* lifecycle stages simultaneously. Re-verify everything before acting:

1. `git fetch`; default branch moved past the grounding SHA? Working tree clean? Unpushed commits?
2. `git worktree list --porcelain` **and** `git branch --list 'feat/qcli-*' 'fix/qcli-*'` (local + remote) — enumerate every leftover, not just what the handover mentions. `git worktree add` hard-fails if a branch is already checked out in a stale worktree. With treehouse in play, `treehouse status --json`: a lease whose holder matches this campaign's labels is an in-flight member left by a crashed session — leases survive with zero processes running, so they never show as "in use". A campaign-labelled lease with no matching `In Progress` task is the orphan signal.
3. `gh pr list --state all` for every leftover branch — an open unmerged PR means a session died between opening it and the merge queue.
4. Cross-check every leftover against Backlog state: `In Progress` + `wave-N` means implementation may be mid-flight or done-but-unreviewed — check the worktree's own `git log` to disambiguate. Classify each as *matches Backlog* (resume at its recorded stage) or *orphaned* (report it, reconcile in R3, do NOT silently delete).
5. **Neither `in-review` nor `merge-pending` will ever be present on a leftover task's committed state** — see the stage-state table's durability column (`QCLI-51`). Do not read either label's absence as "review never started" or "never approved," and do not expect either from a fresh `backlog task view`. Derive the review substage instead from what actually persists: step 1's "working tree clean?" check, applied to the *orchestrator's own* `<default>` checkout — since review is pipelined per completed implementer (f), more than one wave member can be mid-review at once, so a dirty diff there can carry one entry per task file currently mid-(f); a label-only dirty entry for *that specific task's* file means a crash landed mid-(f) for it, and which label the entry shows (`in-review` vs `merge-pending`) pins the crash to before or after that branch's `approve` verdict — the worktree's own `git log` (step 2), for whether the worker's own stage-4 task-file commit exists; and step 3's `gh pr list`, since (g) opens a PR only for a branch that already carries `approve` — an open PR is durable proof review passed even though `merge-pending` itself leaves no trace. A leftover `In Progress` + `wave-N` branch with none of these three signals present is presumptively pre-approval; resume it at review rather than guessing a later stage it cannot prove.

Produce a short drift table (`claim → record said → now`). If drift invalidates the plan, adapt and say so — never execute stale instructions.

**R3: Reconcile.** Completed-but-unrecorded work found in R2 goes into Backlog (notes, ACs where evidence exists, final summary, status) and the campaign doc's wave log before any new wave starts. A leftover worktree matching an `In Progress` task resumes from that task's recorded stage rather than restarting. Reconciliation also re-runs the lore log sync: `reference/wave-loop.md` section i's crashed-session failure path is mandatory here — re-run `lore sync` before starting a new wave, and if it reports any `files`, gate with `lore check --strict` and commit/push them before proceeding. A prior session may have died mid-sync, and R3 is where that gets caught, not the next settlement.

**R4: The wave loop — drain until done or blocked.** Full mechanics in `reference/wave-loop.md`. In brief: compute the dependency and conflict graphs → acquire worktrees → mark the acquired members dispatched → implement in parallel → review pipelined per completed implementer → merge strictly serially with rebase and mandatory re-verification → wave-level integration review → settle every task, then sync the lore log (`lore sync` gated by `lore check --strict`, once per wave, last — reference/wave-loop.md section i) → loop or stop.

The orchestrator's context grows only by a roughly constant per-wave increment (dispatch prompts, terse structured returns, verdicts, merge SHAs, one doc delta). This does **not** hold in degraded mode, hence its one-wave budget.

**R5: Re-arm** (once, when the loop terminates).

1. Archive the consumed handover to `archive/handovers/` (collision suffix `-2`, `-3`, …); commit on the default branch (session/campaign bookkeeping, no single directing task — no `Refs:` trailer, per the Commits convention's exception).
2. Write one fresh handover reflecting the session's *cumulative* state across all waves (Write mode) — unless the queue is now empty, in which case R6's campaign-complete handling applies (archive only, no new handover).
3. `git push origin <default>` — unconditional; the archive commit is new even when the wave loop already pushed (no remote → skip).

**R6: Report.** Summarize every task resolved this session, grouped by wave, with evidence and merged SHAs. **Put escalations and needs-human items first and visually distinct** — those are the only things needing the user's attention. Then, separately, **propose** any follow-up tasks the integration review surfaced and ask whether to create them (never create unprompted). State queue counts (resolved / in-flight / blocked / ready-now) and end with the literal next command: `/clear` then `/backlog-handover restore`.

**Queue empty instead?** Campaign complete: summarize resolved work across every wave, archive the final handover (no new one), note completion in the campaign doc, and suggest `init` for a fresh queue. Do not archive the tasks themselves.

---

## Write Mode (bailout / init's final stage)

**W1: Ground truth.** Verify with commands, never memory: current branch + HEAD SHA, `git status --porcelain`, unpushed commits, **every** branch/worktree/PR touched this session, campaign-doc state.

**W2: Flush durable facts first.** Implementation decisions and evidence → task notes/comments. Reviewer verdicts → PR bodies and the wave log. Campaign state → the campaign doc. The handover holds pointers, not facts.

**W3: Write the handover** using the template in `reference/templates.md`. No invented content: every SHA and status verified in W1, gaps stated as gaps. Failed approaches are mandatory when anything failed. **Never persist a "next wave" plan** — the next restore recomputes the ready set live, and a stale plan is worse than none. No secrets or machine-specific paths in anything committed.

**W4: Confirm.** Output the path, waves/tasks resolved this session, and the driver-loop reminder.

---

## Status Mode

Read-only: campaign doc, full queue partition (Done count, in-flight with per-branch/worktree stage, blocked/needs-human, ready-now count), active handover file(s), every campaign branch, `git worktree list` (plus `treehouse status --json` when in play), open PRs, default-branch ahead/behind, dirty files.

Under wave-parallel execution, **several simultaneous branches, worktrees, and open PRs mid-wave are the expected steady state**, not a violation. The actual anomaly is a branch/worktree/PR with no corresponding `In Progress` campaign task — flag it, with the fix (reconcile per R3, or clean up if truly abandoned).

---

## Reference

- `reference/wave-loop.md` — R4 in full: graph computation, worktree lifecycle, dispatch prompts, review stage, the serialized merge queue, settlement, stop conditions
- `reference/escalation.md` — escalation policy and the error-handling table
- `reference/templates.md` — campaign-doc skeleton and handover template

## Provenance

Forked from `opum-doc` `.claude/skills/backlog-handover` v0.9.1-ocli.1, which itself forked `salient-data/skadilabs` `.claude/skills/backlog-handover` v0.9.1 and rebound it from GitHub Issues onto Backlog.md (removing ECK primitive references, `.claude/project-constants.md`, and the companion `handover`/`tracker` skills; inlining their conventions; fixing the upstream dispatch-marking-before-worktree-acquisition defect; removing autonomous follow-up filing and archive-on-complete). This copy's first local change (`0.9.1-qcli.1`) was the task-ID/branch/lease prefix rebind from `OCLI`/`ocli` to `QCLI`/`qcli` for this repo's Backlog project (`task_prefix: qcli` in `backlog/config.yml`) — no other behavioral change at that point.

**Deliberate divergence (`0.9.1-qcli.2`, `QCLI-43`, 2026-08-07):** upstream settlement (R4i) ends at the campaign-doc write. This fork adds a mandatory `lore sync` step, gated by `lore check --strict`, to the end of every wave's settlement (`reference/wave-loop.md` section i), so `docs/log.md` and the bundle's managed blocks are current as of that wave's own settlement instead of drifting further with every subsequent one — closing a drift that had reopened repeatedly (QCLI-35, QCLI-39, and again before this task) for two distinct reasons, not one: a squash-rewrite mechanism that fired repeatedly and left dangling SHAs — measured across six episodes (QCLI-16, QCLI-17, QCLI-19, QCLI-21, QCLI-22, QCLI-28), closed for good by QCLI-35's fix and never recurring since (0 bad of 86 immediately after QCLI-35's merge, 0 bad of 92 immediately after QCLI-39's, 0 bad through the current 95 recorded SHAs) — and ordinary staleness — new `docs/`-touching commits landing with no sync run — which is what actually drove every reopening after that and is the mode this per-wave contract targets. Upstream has no lore/OKF docs bundle and nothing analogous to drift, so this is not a gap upstream needs closed — it is specific to this repo's docs tooling and is not proposed for promotion upstream. See `QCLI-43` for the full analysis, including why running the sync from settlement (on `<default>`, strictly after that wave's merges land, never on a per-task branch — a constraint this skill already enforced for unrelated reasons) is what makes the recorded SHAs permanent `<default>` ancestors instead of doomed branch commits, and why "catches up" means "current as of that wave's settlement commit" rather than a literal same-session zero-lag guarantee — the sync commit itself touches `docs/` and so cannot record itself; see `reference/wave-loop.md` section i.

**Deliberate divergence (`0.9.1-qcli.3`, `QCLI-47`, 2026-08-07):** the Commits convention above was `QCLI-43`'s single exception — always a trailer except `lore sync`'s own `backlog/` auto-commit — but the doc-10 wave-2 reviewer found the orchestrator's own campaign bookkeeping commits routinely lack the trailer in practice: a rule naming exactly one exception sitting next to practice with more than one. Verified 2026-08-07 at doc-11 init that practice is inconsistent, not uniformly absent, correcting how doc-10 first framed it: `%(trailers:key=Refs)` is empty on `8721feb`, `146956d`, `9c63769`, `d0b5f41`, `3686859`, `34bceae`, `8caae19`, `748bf5f`, `6047774`, but carries `Refs: QCLI-43` on `0b63077` and `342e76d`. The split tracks a real distinction, not noise: single-task bookkeeping commits (dispatch marking, in-flight pointer recording, settlement) increasingly do carry the trailer, while genuinely campaign-scoped commits (init, close, handover archiving, the one-time gitignore setup) do not, because they have no single directing task to name. The owner ruling, obtained at doc-11 campaign init before dispatch, is hybrid: keep the trailer required wherever a commit has one directing task — matching what the evidence already shows the orchestrator doing correctly in `0b63077` and `342e76d` — and add campaign-scoped bookkeeping as a second named exception alongside `lore sync`'s auto-commit, rather than discarding the traceability the single-task commits already provide just to make the rule simpler. This is a documentation-only change: no existing commit is amended or re-trailered, and no claim is made about commits predating this ruling. See `QCLI-47` for the full evidence and `reference/wave-loop.md` section i for the per-commit-type breakdown.

**Verification rule added (`0.9.1-qcli.4`, `QCLI-48`, 2026-08-07):** `QCLI-47`'s hybrid rule assumed `Refs:` text in a commit message and a `Refs:` trailer git actually parses were the same thing; doc-11 wave-1 review found they are not. A `Refs: QCLI-<N>` line separated from the message's final trailer block by a blank line — the shape a PR squash-merge produces when its generated body concatenates multiple source commits, each ending its own `Refs:` line, followed by a synthesized `Co-Authored-By:` block — reads as a trailer but is not one: `git interpret-trailers --parse` and `%(trailers:key=Refs)` both silently report nothing for it. This directly threatens `QCLI-47`'s own evidence method, which counts trailers via that same query. Confirmed predating doc-11 and not unique to one commit: `QCLI-47`'s own branch commit `6f3236f` had this shape (caught and fixed at merge time by authoring the squash body explicitly — the merged `694e109` parses correctly), and the already-merged `QCLI-43` squash commit `7efc1a4` has it too. A full sweep of `dev` (258 commits) found 202 carrying `Refs:` text, 36 of those unparseable — command, method, and the full per-commit list are in `reference/wave-loop.md` section i and `QCLI-48`'s task notes. Disposition: none of the 36 are amended or re-trailered — this task's scope is a verification rule plus a sweep, not a history rewrite — and the sweep result itself, re-runnable, stands as the durable record of the gap. `reference/wave-loop.md` section i now states the placement rule, names `git interpret-trailers --parse` as the verification, and shows a worked correct/incorrect pair (`342e76d` / `7efc1a4`). See `QCLI-48` for the full sweep and reasoning.

**Commit rule added (`0.9.1-qcli.5`, `QCLI-49`, 2026-08-07):** `reference/wave-loop.md` sections d and i left one question unanswered — with `backlog/config.yml` setting `auto_commit: false`, does the orchestrator commit its own dispatch-marking task-file writes, given each worker independently commits its *own* copy of the same task file inside its worktree? Doc-11 wave 1 hit the gap directly: `error: cannot rebase: You have unstaged changes`, from uncommitted `wave-1`/`in-review` label edits sitting on the orchestrator's own checkout while the merge queue tried to rebase members onto it. Doc-11 waves 2 and 3 then exercised the "commit it" answer twice, cleanly (`fe92535`, `3633bc1`): the dispatch-marking pass is committed on `<default>` immediately, one `Refs: QCLI-<N>` trailer per task marked in that pass (`QCLI-47`'s hybrid rule, extended to multi-task passes the same way the docs-sync commit already was), and every just-acquired worktree is re-pinned (`git reset --hard`) onto that commit before any worker is dispatched — safe only there, because no worker commit exists yet to lose. That re-pin is what makes a worker's later commit to its own task file (plan/notes) share the dispatch-marking edit as a common ancestor with `<default>`, so the merge-queue rebase in (g) never conflicts on the label lines. A second, sharper root cause surfaced mid-wave-2: an `--add-label in-review` edit run on `dev` for a task whose branch was still unmerged risked the identical conflict, but with no empty worktree left to re-pin onto — resolved by never committing that class of mid-wave task-file edit on `<default>` at all, verifying the dirty diff is label/`updated_date`-only, discarding it before that branch's rebase, and reconstructing the label at settlement instead. `reference/wave-loop.md` sections d, f, g, and i now state both rules explicitly, with runnable commands and the worked commit SHAs above, and (g) carries the resulting precondition: the orchestrator's own `<default>` checkout must be clean before the merge-queue walk starts and stays clean across it, which holds by construction under these two rules rather than by discipline. See `QCLI-49` for the full reasoning.

**Stage-state table reconciled (`0.9.1-qcli.6`, `QCLI-51`, 2026-08-08):** the Campaign stage → Backlog state table listed `in-review` and `merge-pending` as ordinary label rows, but (f) — as amended by `QCLI-49` — applies and then deliberately discards both uncommitted before the affected branch's rebase in (g), reconstructing the real label set only at settlement (i); neither label is therefore ever observable in a committed task file, and R2's crash-recovery cross-check could be read as directing a session to check leftover state against a state that cannot appear. Surfaced by `QCLI-49`'s own worker as an out-of-scope discovery during doc-11 wave 3, correctly left alone there as pre-existing and unrelated to that task's commit-policy scope; re-verified at doc-12 init against `b2ad797` rather than taken on doc-11's word, which corrected two points in the inherited framing rather than confirming it as-is: an add instruction for `merge-pending` does exist (`wave-loop.md`'s (f) step 1, pre-fix) — the defect was a missing point of action, not a missing instruction — and `in-review` sits in the identical position under (f) and is equally affected, not `merge-pending` alone. The owner ruling obtained at that init was broader than any of three offered narrower fixes — treating `merge-pending` as vestigial and dropping the row, giving it a point of action in (g) at the cost of a new write-then-discard ceremony there, or leaving the disposition for the worker to derive — none of which were taken. The disposition: the stage-state table gains a durability column marking `in-review` and `merge-pending` as working-tree-only, with the shared reasoning and each label's distinct point of action stated inline; `reference/wave-loop.md` section (f) now names `merge-pending`'s point of action directly — immediately on the reviewer's `approve` verdict, before (g) — reusing the same run-then-discard mechanism `in-review` already used rather than adding a new one in (g), so section (g)'s merge walk still never mentions either label; and SKILL.md's R2 now states which durable signals — the orchestrator's own `<default>` working-tree cleanliness, the worktree's own commit log, and `gh pr list` — actually classify a leftover branch's review substage, since the two labels themselves cannot. A full `in-review`/`merge-pending` occurrence sweep across SKILL.md and `reference/wave-loop.md` (`QCLI-51`'s task notes) confirmed no remaining passage contradicts this framing. `merge-pending`'s own point-of-action edit has not yet been separately exercised in a recorded wave, unlike `in-review`'s, which doc-11 wave 2's evidence (`QCLI-49`, above) already covers — stated as a gap in (f) rather than overstated as verified. No change to `QCLI-49`'s rule that mid-wave task-file label edits are never committed on `<default>` while the branch is unmerged; this task extends where that rule applies (a second edit under the same rule) without altering the rule itself. See `QCLI-51` for the full reasoning.
