---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI black-box acceptance scenarios
tags:
  - quest
  - cli
  - black-box
  - scenarios
  - clean-room
  - acceptance-criteria
summary: Independently authored, implementation-neutral Quest CLI black-box scenarios for lease/heartbeat, gates, read-only purity, recovery, hostile paths, dirty worktrees, canonical IDs, and Git effects.
timestamp: 2026-08-04T15:08:31.000Z
---

# Quest CLI black-box acceptance scenarios

This Reference is `QCLI-2.3`'s deliverable: the current, independently
authored observable black-box scenario corpus the
[dated Opum fleet and prior-art inventory](https://github.com/opum-ai/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md)
itself says will replace its own 11 scenario seeds ("These dated,
implementation-neutral defect classes remain here until QCLI-2.3 replaces
them with a current, source-attributed corpus"). It is the current
successor to former `OCLI-3.3` ("Turn prototype failures into black-box
regression scenarios") per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md) row `OCLI-3.3 →
QCLI-2.3 black-box scenarios`. It stays consistent with, and does not
restate or override, the
[research source register](quest-cli-research-source-register.md) (owned
this wave by `QCLI-2.11`; cited here read-only — every admission below
traces to a slice that register already classifies **Allowed**), the
[component charter](quest-cli-component-charter.md), and the
[legacy Opum requirement reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md)
(`QCLI-2.2`'s deliverable, cited read-only), which all remain normative
over this document.

Every scenario below is independently authored. None reproduces a
prototype test, fixture, source file organization, or algorithm — no such
artifact was opened to produce this document (see Independence and
verification, below). The 11 dated scenario seeds and `OCLI-3.3`'s own
(unexecuted) task narrative are used strictly as **prompts**, exactly as
the register's own permitted use allows ("QCLI-2.3 may use the scenario
seeds as prompts for independently authored scenarios, never as copied
tests or algorithms").

## Details

### Scope and provenance (AC3 grounding)

| Source | Repository / path | Revision | Register classification | Used for |
| --- | --- | --- | --- | --- |
| Dated Opum fleet and prior-art inventory | `opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md` | `opum-doc` HEAD `c9b6741` (`c9b67411a07fa5e70a29f2d3ca324c173677b0dd`, 2026-08-04 10:07:27 -0500) (observed 2026-08-04; moving reference, re-verify before relying), re-verified live 2026-08-04: unchanged since commit `bee848a` (2026-08-04 07:49:11 -0500, a one-line link-fix), which itself is the only change since the `846f054` condensation (`git diff 846f054..HEAD -- <path>` shows exactly that one line; `wc -l` = 120) | Allowed — register's own "Dated Opum fleet and prior-art inventory" slice | The 11 "Unique prototype scenario seeds" (lines 89-108), used only as independently-reauthored prompts, per that slice's explicit permitted use naming `QCLI-2.3`; see the recheck clause below |
| `OCLI-3.3` task narrative | `opum-doc:backlog/tasks/ocli-3.3 - Turn-prototype-failures-into-black-box-regression-scenarios.md` | `opum-doc` HEAD `c9b6741` (observed 2026-08-04; moving reference, re-verify before relying), file last touched at the immutable commit `3023468` (2026-08-01 13:49:31 -0500), read 2026-08-04 | Allowed — register's "Historical OCLI Story/Spec/Runbook/task records" slice, gated by the migration ledger's row-by-row disposition (row `OCLI-3.3 → QCLI-2.3`) | Sole content predecessor; confirms it is historical, unexecuted, and that `QCLI-2.3` is its sole active successor; supplies the AC-field vocabulary (preconditions, interleaving, structured result/exit, effects, recovery) this document's own scenario shape independently converges on, and the observation that first-release scenarios must be distinguished from deferred MCP/dashboard/explorer/hosted-service ones; see the recheck clause below |
| Quest CLI component charter | `docs/reference/quest-cli-component-charter.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | The current-boundary authority every scenario category below is grounded against (the "Owns here" list; the first-release non-goals used to justify the Deferred section) |
| Legacy Opum requirement reconciliation for Quest CLI | `docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md` (this repo, `QCLI-2.2`, owned this wave by `QCLI-2.11`) | this branch | Allowed — "Prior QCLI research records" | Confirms which candidate mechanisms (claims, leases, gates, read-only purity, operation-owned commits, canonical IDs/aliases) are current quest-cli scope (Reusable/Adapted) versus routed elsewhere (candidate #6, actor semantics, routed to `quest-doc` — not designed here) |
| Former OCLI to QCLI migration ledger | `docs/reference/former-ocli-to-qcli-migration-ledger.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | Row-gating authority for `OCLI-3.3`'s admission and the explicit statement that its 11 seeds "remain historical evidence until QCLI-2.3 authors the current black-box corpus" |
| Quest CLI research source register | `docs/reference/quest-cli-research-source-register.md` (this repo, owned this wave by `QCLI-2.11`) | this branch | Allowed — "Prior QCLI research records" | Per-slice admission authority for every citation above; also the source of the Deferred classification for the stdio MCP smoke-boundary surface (see the Deferred section, below) |

Not used to inform any scenario, named here for completeness: Backlog.md
implementation source/tests (Excluded), the local Backlog.md clone
(Quarantined), the quarantined non-Git Opum artifacts, and the Deferred
`jeremy-newhouse/opum-engine` prototype PR surfaces beyond their
register-cited existence and disposition (see the Deferred section). No
Backlog.md behavior claim appears anywhere in this document — it is out of
this task's scope (`QCLI-2.5`'s), and none was needed to author these
scenarios.

#### Recheck clause (moving reference)

The `opum-doc` HEAD pin above (`c9b6741`) is a moving reference, not an
immutable anchor: `opum-doc`'s `dev` branch can advance past it at any time
after this observation, independent of any edit to this document — the two
commit SHAs it names (`bee848a`, `846f054`) and the OCLI-3.3 file's
last-touch commit (`3023468`) are themselves immutable anchors and need no
recheck, but the claim that `c9b6741` is still the current tip, and that
nothing has changed downstream of it, does. Per the research program
Spec's
["Recheck clause requirement"](../specs/quest-cli-pre-implementation-research-program.md#recheck-clause-requirement),
before relying on this document's 11-seed traceability table or its
provenance claims, a later worker MUST re-run, live, in
`/Volumes/external/repos/opum-doc` on branch `dev`:

- `git fetch origin && git rev-parse origin/dev` — compare the result
  against `c9b67411a07fa5e70a29f2d3ca324c173677b0dd`. A match means
  nothing has moved and every citation above still holds as observed.
- If it differs: `git diff
  c9b67411a07fa5e70a29f2d3ca324c173677b0dd..origin/dev --
  docs/reference/dated-opum-fleet-and-prior-art-inventory.md`. A non-empty
  result touching the "Unique prototype scenario seeds" section
  (originally lines 89-108) means the seed wording this document's
  traceability table maps from may have changed. That is a new fact for
  `QCLI-2.3`'s owner (or the wave's integration reviewer) to rule on —
  the affected traceability row(s) must be re-derived against the new
  text; a worker may not silently reconcile the discrepancy or assume the
  independently authored scenarios (BB-01..BB-17) are still correctly
  attributed. A diff outside that section does not by itself invalidate
  this document.
- If it differs: `git diff c9b67411a07fa5e70a29f2d3ca324c173677b0dd..origin/dev
  -- "backlog/tasks/ocli-3.3 - Turn-prototype-failures-into-black-box-regression-scenarios.md"`.
  This file is historical and frozen by the migration ledger's own
  disposition (row `OCLI-3.3 → QCLI-2.3`); any non-empty result is itself
  a surprise finding to report, not something to silently trust or act on
  unilaterally.

A changed inventory does not retroactively invalidate an independently
authored scenario — AC3's independence claim never depended on the
inventory staying fixed, only on it never having been copied from. It
only means this document's *citations* need re-verification, exactly the
distinction the Spec's
["Moving vs. immutable references"](../specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references)
subsection draws.

### Seed-to-category traceability

`QCLI-2.3` AC1 requires coverage of eight categories. Every one of the
inventory's 11 dated seeds maps to at least one category and at least one
scenario below; seed 10 is the one deliberate exception (Deferred, see
below).

| # | Dated seed (prompt only, not copied) | AC1 category | Scenario(s) |
| --- | --- | --- | --- |
| 1 | Lease expiry folded incorrectly | Lease and heartbeat failures | BB-01 |
| 2 | Late or nonce-mismatched heartbeats could target the wrong lease | Lease and heartbeat failures | BB-02 |
| 3 | Four-eyes approval behavior was inverted or insufficiently separated | Human gates | BB-03, BB-04 |
| 4 | A supposedly read-only dashboard or launch path mutated a worktree | Read-only purity | BB-05, BB-06 |
| 5 | A failed refresh loop could stop permanently | Recovery | BB-07, BB-08 |
| 6 | Non-ASCII, quoted, or unusual task paths disappeared | Hostile paths | BB-09 |
| 7 | Synchronization downgraded unrelated task state | Operation-owned Git effects | BB-17 |
| 8 | Aliases bypassed canonical-ID uniqueness or claim rules | Canonical IDs | BB-14, BB-15 |
| 9 | Synchronization could stage or commit unrelated dirty changes | Dirty worktrees; Operation-owned Git effects | BB-12, BB-13, BB-16 |
| 10 | stdio MCP lacked a proven smoke boundary and was deferred | — (Deferred, see below) | none |
| 11 | Path, subdirectory, non-UTF-8, error-classification, and scoped-commit behavior needed explicit scenarios | Hostile paths; Operation-owned Git effects | BB-10, BB-11, BB-16 |

### Scenario field definitions

Each scenario states five fields, matching `QCLI-2.3` AC2 exactly:

- **Preconditions** — the observable starting state (workspace, Git,
  claims/leases/gates already in effect) required before the action.
- **Action or concurrency interleaving** — the single action, or the
  explicit ordered sequence of two or more actors' actions, that triggers
  the scenario.
- **Structured result and exit** — the caller-observable outcome: a
  structured (machine-readable) result plus an exit class. Exit classes
  are described **categorically** (success / a structured decline or
  conflict distinct from success / a structured error distinct from both),
  not as literal exit-code integers or a fixed schema — the concrete
  command vocabulary, JSON envelope shape, and exit-code table are
  [`QCLI-2.8`](../../backlog/tasks/qcli-2.8%20-%20Synthesize-Quest-research-into-activation-ready-contracts.md)
  AC2's scope ("CLI identity, lifecycle, JSON and exits, Git mutation,
  migration, projection, and Lore integration are specified functionally")
  and the [research program Spec](../specs/quest-cli-pre-implementation-research-program.md)'s
  Required Outputs ("The final synthesis must cover... CLI JSON/exits...
  safe Git mutation..."), not fixed by this document (component charter:
  "command vocabulary, deterministic JSON, human output, and exit
  behavior" is owned here, but not yet authored). `QCLI-2.4`'s glossary is
  not the owner here: its own terms are explicitly candidates only, "not a
  frozen schema, command, or exit-code table" (its own wording) — this
  document's earlier pointer to `QCLI-2.4` for this scope was wrong and is
  corrected here per the wave-3 integration review.
- **Allowed effects** — exactly which filesystem and Git mutations may
  occur, and the explicit statement of what must remain untouched.
- **Recovery checks** — what a read-only inspection must show afterward,
  including after a failure, to confirm no partial or inconsistent state
  was left behind.

Scenarios use generic **operation categories** rather than concrete
command names, since Quest's command vocabulary is not yet authored:
a *claim* operation, a *lease-renewal (heartbeat)* operation, a
*gate-guarded* operation, a *read-only inspection* command, a
*synchronization/refresh* operation, and a *recovery/resume* operation —
all drawn directly from the component charter's "Owns here" list
("dependency readiness, claims, leases, gates, lifecycle, and evidence";
"safe filesystem and operation-owned Git behavior"; "rebuildable local
projection, freshness, recovery, and scale"; "migration, coexistence,
aliases, and reversible fidelity reports").

This document does not define **who** may supply gate approval (which
identities count as accountable humans, delegated agents, reviewers, or
approvers) — that is Quest-wide actor-model vocabulary the legacy
reconciliation document already routed to `quest-doc`, not a quest-cli-local
mechanism. The human-gate scenarios below (BB-03, BB-04) test only the
observable **mechanism** (a gate blocks until a distinct recorded identity
supplies approval evidence; self-supplied evidence does not satisfy it),
never a specific actor taxonomy.

### Scenarios

#### Lease and heartbeat failures

**BB-01 — Lease expiry is computed identically by a live check and a rebuilt projection**

- *Preconditions:* a canonical task's authored history contains a claim
  event establishing a lease with an explicit issued time and TTL; the
  local projection has not been rebuilt since that event.
- *Action or interleaving:* (a) a live claim-conflict check runs against
  the current lease before its TTL should have elapsed, immediately
  followed by (b) a full local-projection rebuild from the same authored
  history.
- *Structured result and exit:* both (a) and (b) report the identical
  expiry instant and the identical held/expired status for the same
  wall-clock read time; a discrepancy between the two is itself reported
  as a distinct, named inconsistency — never silently resolved by picking
  one value.
- *Allowed effects:* the rebuild reads authored history and writes only
  the disposable local projection; it performs no Git mutation and does
  not alter the authored lease event.
- *Recovery checks:* repeating the rebuild against unchanged history is
  idempotent (state-equivalent projection output) and continues to agree
  with the live check.

**BB-02 — A late, stale-lease heartbeat cannot renew a lease it no longer holds**

- *Preconditions:* Actor A holds a lease established under token `N1`.
  The lease is released and re-claimed by Actor B under a new token `N2`
  before A's next heartbeat is sent.
- *Action or interleaving:* A's heartbeat for `N1`, delayed in flight,
  arrives after B's claim under `N2` has already taken effect.
- *Structured result and exit:* the late heartbeat is rejected with a
  structured "stale/token-mismatched heartbeat" result — a decline
  distinct from both success and a not-found error — and it does not
  renew, extend, or otherwise touch B's current lease.
- *Allowed effects:* zero mutation to B's lease record from A's stale
  heartbeat; the rejection itself may be recorded as evidence without
  altering lease state.
- *Recovery checks:* reading B's lease afterward shows an expiry
  consistent only with B's own claim/heartbeat history; A must issue a
  fresh claim (not a retried heartbeat) to regain any hold.

#### Human gates

**BB-03 — A gate blocks progress until a distinct identity records approval evidence**

- *Preconditions:* an operation requires gate satisfaction before it may
  proceed (e.g., a lifecycle transition); no approval evidence exists yet.
- *Action or interleaving:* the gate-guarded operation is attempted before
  any approval evidence exists.
- *Structured result and exit:* a structured "blocked — gate unsatisfied"
  result, a decline distinct from both success and a hard error, naming
  the unsatisfied gate.
- *Allowed effects:* zero mutation of the guarded resource; the blocked
  attempt may itself be recorded as an evidence entry without advancing
  lifecycle state.
- *Recovery checks:* re-attempting after evidence is recorded from a
  distinct identity succeeds; re-attempting with no new evidence blocks
  identically (an idempotent block, not a one-time bypass).

**BB-04 — Self-supplied approval evidence does not satisfy a separation-requiring gate**

- *Preconditions:* the same gate as BB-03; identity `X` initiates the
  gated operation.
- *Action or interleaving:* `X` immediately attempts to record approval
  evidence for its own request.
- *Structured result and exit:* the gate reports remaining unsatisfied;
  the self-supplied evidence is rejected or recorded as non-qualifying,
  with a structured result naming the reason (evidence identity matches
  requester identity) — a decline, not a success.
- *Allowed effects:* no lifecycle mutation results from the self-approval
  attempt; only a rejected/non-qualifying evidence record may be written.
- *Recovery checks:* after a distinct second identity supplies approval,
  the same operation succeeds; the earlier non-qualifying evidence remains
  visible under a read-only inspection (not silently erased).

#### Read-only purity

**BB-05 — A read-only inspection command performs zero mutation, including on its error path**

- *Preconditions:* a clean worktree (`git status --porcelain` empty) with
  a known modification-time snapshot for tracked and untracked files.
- *Action or interleaving:* a read-only inspection command is invoked
  twice: once against a nonexistent task identifier (forcing a not-found
  path) and once against an existing one (the success path).
- *Structured result and exit:* the success case returns a structured
  read result; the not-found case returns a structured not-found result —
  in both cases the command's own output is the only observable effect.
- *Allowed effects:* zero, on both paths — `git status --porcelain` is
  still empty afterward, no tracked file's content changed, and no new
  untracked file was created, in the error path exactly as in the success
  path.
- *Recovery checks:* not applicable — no mutation occurred; the absence of
  any change is itself the check this scenario exists to make.

**BB-06 — Read-only purity holds under a concurrent writer**

- *Preconditions:* as BB-05, plus a second, concurrent mutating operation
  (e.g., a claim) is in flight against the same task the read-only command
  inspects.
- *Action or interleaving:* the read-only command's read is interleaved
  mid-way through the concurrent writer's own multi-step mutation (after
  the writer's authored-history append, before its projection update
  completes).
- *Structured result and exit:* the read-only command returns a structured
  result reflecting either the pre- or post-mutation state consistently
  (never a torn read mixing both).
- *Allowed effects:* the read-only command still performs zero mutation
  regardless of the writer's concurrent activity; only the writer's own
  operation produces the writer's owned effects.
- *Recovery checks:* after the writer completes, a subsequent read-only
  call returns state consistent with the writer's completed effect,
  confirming the earlier read was a genuine snapshot, not corruption.

#### Recovery

**BB-07 — An interrupted synchronization operation resumes instead of restarting or stalling**

- *Preconditions:* a synchronization/refresh operation is mid-flight
  (some but not all pending authored-history events processed into the
  local projection) when the process is abruptly terminated.
- *Action or interleaving:* the same synchronization operation is invoked
  again after the interruption, with no other intervening change.
- *Structured result and exit:* success — the operation reports that it
  resumed from the last durably-recorded progress point (not from zero,
  and not by silently skipping unprocessed events) and reaches a
  caught-up state.
- *Allowed effects:* only the disposable local projection is written; no
  authored history or Git-tracked record is mutated by the resumed
  refresh itself.
- *Recovery checks:* the resulting projection state is state-equivalent
  to a full rebuild-from-scratch of the same history.

**BB-08 — Repeated interruption never permanently wedges the refresh loop**

- *Preconditions:* as BB-07.
- *Action or interleaving:* the refresh operation is interrupted a second
  time, at a different point in its processing, immediately after the
  first resume.
- *Structured result and exit:* a third invocation still succeeds and
  still reaches a caught-up state; the operation never reports success
  while the projection remains behind the authored history's true tip,
  and no invocation count causes every future invocation to report the
  same unresolved failure.
- *Allowed effects:* the same bound as BB-07.
- *Recovery checks:* an explicit forced full rebuild (distinct from
  incremental resume) is also available and produces the same
  state-equivalent result, as a documented escape hatch.

#### Hostile paths

**BB-09 — Non-ASCII and quoted task titles round-trip without loss**

- *Preconditions:* an initialized workspace.
- *Action or interleaving:* create a task whose title contains non-ASCII
  Unicode characters (e.g., combining diacritics, CJK characters) and
  embedded quote and shell-metacharacters (`$`, backtick, semicolon);
  read it back via a read-only inspection command; then rename it.
- *Structured result and exit:* creation, read, and rename all succeed
  with structured results echoing the exact original content byte-for-byte
  — no mangling, truncation, or silent transliteration — and no
  shell-metacharacter is ever interpreted (it is data, never executed).
- *Allowed effects:* exactly the files/records the create and rename
  operations own; nothing outside the intended path is touched, and no
  subprocess is spawned using the untrusted string unescaped.
- *Recovery checks:* a fresh read-only inspection after rename still finds
  the record (nothing "disappeared"), unchanged from creation.

**BB-10 — Deeply nested subdirectory placement is honored and enumerable**

- *Preconditions:* a workspace whose records may be organized under
  subdirectories.
- *Action or interleaving:* create a task nested several subdirectory
  levels deep; run a read-only enumeration command scoped to the
  workspace root.
- *Structured result and exit:* the enumeration includes the nested record
  exactly once (not zero times, and not duplicated); a targeted lookup by
  canonical ID also succeeds regardless of nesting depth.
- *Allowed effects:* only the intended nested path is created; no
  parent-traversal or flattening side effect occurs.
- *Recovery checks:* repeating the enumeration is stable (same result set)
  across repeated invocations with no intervening change.

**BB-11 — Non-UTF-8 content gets a defined error classification, not silent data loss**

- *Preconditions:* an operation accepts a field (e.g., imported or
  migrated content) that contains a byte sequence that is not valid UTF-8.
- *Action or interleaving:* attempt the operation with that content.
- *Structured result and exit:* either (a) the operation rejects the
  input with a structured, specifically-named encoding-error
  classification (distinct from a generic unclassified error), or (b) if
  accepted, the exact bytes are preserved losslessly on read-back — the
  scenario forbids a third outcome, silent replacement or truncation
  reported as success.
- *Allowed effects:* on rejection, zero mutation; on acceptance, only the
  intended record is written, byte-preserving.
- *Recovery checks:* after a rejection, retrying with corrected content
  succeeds normally, and no partial or corrupt record was left behind by
  the rejected attempt.

#### Dirty worktrees

**BB-12 — An operation never stages or commits pre-existing unrelated dirty changes**

- *Preconditions:* the worktree has a pre-existing, unrelated uncommitted
  modification (a dirty tracked file unrelated to the operation, plus an
  unrelated untracked file) before any Quest operation runs.
- *Action or interleaving:* run a mutating operation that legitimately
  needs to write and commit its own owned file (e.g., a claim that
  commits an event record).
- *Structured result and exit:* success — the operation completes and
  reports its own structured result.
- *Allowed effects:* the operation's commit contains exactly its own
  owned file(s); `git status --porcelain` afterward still shows the
  pre-existing unrelated dirty tracked file as modified-not-committed and
  the unrelated untracked file as still untracked — neither was staged,
  committed, nor discarded.
- *Recovery checks:* Git history shows the new commit's file list is
  exactly the operation's own files, with no unrelated path present.

**BB-13 — A failed operation's recovery path does not discard unrelated dirty changes**

- *Preconditions:* the same unrelated dirty state as BB-12; the mutating
  operation is set up to fail partway (a precondition fails after some
  internal work began, or the process is interrupted).
- *Action or interleaving:* the operation is invoked and fails before
  completing its own commit; any recovery logic then runs, on the next
  invocation.
- *Structured result and exit:* the failure is reported with a structured
  error result, not silently; recovery, if it runs, reports what it
  recovered.
- *Allowed effects:* recovery may roll back or clean up only the failed
  operation's own partial state; the pre-existing unrelated dirty tracked
  file and untracked file remain exactly as they were — not reset,
  stashed, or committed; no blanket discard-equivalent effect ever
  touches unrelated paths.
- *Recovery checks:* `git status --porcelain` shows the same unrelated
  dirty state as before the failed attempt, unchanged; a retry of the
  operation, once its precondition is fixed, succeeds cleanly.

#### Canonical IDs

**BB-14 — An alias cannot be used to claim a task already claimed under its canonical ID**

- *Preconditions:* a task has a canonical ID and at least one registered
  alias (e.g., from a migrated or coexisting identifier scheme); the task
  is currently claimed under its canonical ID.
- *Action or interleaving:* a second actor attempts to claim the same
  task by supplying the alias rather than the canonical ID.
- *Structured result and exit:* the claim attempt resolves to the same
  canonical record (the alias is not a separate claimable identity) and
  is rejected with the same structured "already claimed" result an
  attempt via the canonical ID itself would receive.
- *Allowed effects:* zero mutation from the rejected alias-based claim; in
  particular, no second, alias-scoped lease record is created alongside
  the canonical one.
- *Recovery checks:* a read-only inspection by either the canonical ID or
  the alias returns the identical single current lease-holder; exactly
  one lease record exists system-wide for this task, not one per
  identifier form.

**BB-15 — Two concurrent claims on the same canonical ID resolve to exactly one winner**

- *Preconditions:* an unclaimed task with a canonical ID.
- *Action or interleaving:* two actors submit a claim for the same
  canonical ID at effectively the same time — a genuine race at the
  authoritative write point, where both read "unclaimed" before either
  write lands.
- *Structured result and exit:* exactly one claim succeeds; the other
  receives a structured conflict/decline result — never both succeeding,
  and never both failing.
- *Allowed effects:* exactly one lease-establishing commit exists
  afterward for this canonical ID.
- *Recovery checks:* the losing actor's read-only inspection immediately
  after shows the winner as current holder; the losing actor may then
  issue a fresh claim attempt, itself subject to BB-14/BB-15's same rules.

#### Operation-owned Git effects

**BB-16 — A synchronization operation commits only its own owned changes, scoped per file**

- *Preconditions:* multiple tasks exist with independent state; a
  synchronization/projection-refresh operation is triggered that
  legitimately needs to update only a subset of them (e.g., those with
  new upstream events).
- *Action or interleaving:* run the synchronization operation.
- *Structured result and exit:* a structured result listing exactly which
  records it updated.
- *Allowed effects:* the resulting commit(s) touch exactly the files
  backing the listed updated records; every other task's file is
  byte-identical before and after.
- *Recovery checks:* a read-only inspection of the unrelated tasks shows
  unchanged status/content; re-running the same synchronization with no
  new upstream events is a no-op, not a repeated write.

**BB-17 — A synchronization operation never downgrades unrelated task state**

- *Preconditions:* a task is in a more-advanced lifecycle state than the
  synchronization operation's own upstream source currently reflects
  (e.g., the local record progressed via a Quest-side event beyond what
  an external or coexisting system has observed yet).
- *Action or interleaving:* the synchronization operation runs while this
  lag exists.
- *Structured result and exit:* the operation either leaves that task's
  state untouched, or reports a structured conflict/needs-reconciliation
  result for it — never a result where it silently overwrites the
  more-advanced local state with an older external value.
- *Allowed effects:* no mutation to the lagging-source task's tracked
  state file; other, non-conflicting tasks may still be updated normally
  by the same run (partial success is itself part of the structured
  result, not an all-or-nothing failure that also blocks unrelated
  tasks).
- *Recovery checks:* a read-only inspection confirms the advanced task's
  state is unchanged post-sync; the reported conflict is itself recorded
  so a later reconciliation pass can address it deliberately.

### Deferred — explicitly out of first-release scope

Seed 10 ("stdio MCP lacked a proven smoke boundary and was deferred") is
**not** converted into an active first-release scenario. The register
classifies the "Deferred Opum prototype surfaces" — which include
`jeremy-newhouse/opum-engine`'s stdio MCP smoke-boundary gap — Deferred,
with permitted use "preserve the open question and its revisit trigger
only; do not design or scaffold against it now," and its exclusions state
"no current QCLI research task may treat these as an active requirement
source." The component charter independently lists "local MCP" among
first-release non-goals. This corpus therefore preserves the open
question without authoring a scenario against it: if a future release
brings a local MCP surface into scope, its smoke-boundary behavior will
need an explicit black-box scenario at that time — a preserved question,
not a present requirement.

Consistent with the same charter non-goals, no scenario in this corpus
targets a hosted service, dashboard, explorer, RBAC, or accounts surface;
the legacy reconciliation document already classifies that whole cluster
Deferred (candidate #14) or Deferred (candidate #15, the `opum-engine`
prototype surfaces themselves).

### Independence and verification

This document did not open, search, copy, execute, or derive design from
Backlog.md implementation source or internal tests, the local Backlog.md
clone, any Quarantined legacy Opum artifact, or the Deferred
`jeremy-newhouse/opum-engine` prototype surfaces beyond their
register-cited existence and disposition. The only opum-doc material read
was the dated fleet inventory (for its 11 seeds, used as prompts) and
`OCLI-3.3`'s own historical, unexecuted task narrative (for its AC-field
vocabulary and deferred/first-release framing) — both Allowed per the
research source register, re-verified live in the local `opum-doc`
checkout on 2026-08-04 (`git log`, `git diff 846f054..HEAD`, `git show -s`,
`wc -l`, all shown in the provenance table above). No prototype test,
fixture, source file organization, or algorithm exists to copy from either
document — they are prose narratives, not code — and none was treated as
normative; every scenario's five fields, operation-category vocabulary,
and concrete interleaving are independently authored here. This session
made no repository, package, release, or remote mutation, and it did not
edit the source register, the packaging contract, the pre-implementation
research program Spec, or any file owned by a sibling task this wave.
