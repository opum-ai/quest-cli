---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Backlog adoption and migration playbook
tags:
  - quest
  - cli
  - backlog
  - migration
  - adoption
  - playbook
  - coexistence
  - rollback
  - clean-room
  - research
summary: Operational cutover, coexistence, dry-run, and rollback procedure for an existing Backlog.md project adopting Quest, with the evidence each step must produce.
timestamp: 2026-08-04T22:11:26.730Z
---

# Quest CLI Backlog adoption and migration playbook

This Reference is `QCLI-2.10`'s output: an operational adoption and migration
playbook for a project that already runs Backlog.md and wants to adopt Quest,
written for a human or an agent to follow by hand. It is **not** an importer
and defines no executable scaffolding — per this task's clean-room
constraint, it authorizes no product source, runtime dependency, package
publication, or release. It turns the design commitments in
[`QCLI-2.5`'s Backlog migration fidelity
contract](quest-cli-backlog-migration-fidelity-contract.md) — deterministic
dry runs, reversible ID mapping, collision handling, source immutability,
one-writer coexistence, and rollback evidence — into an ordered procedure
with a precondition, a success signal, and an abort condition at every step.
Every claim about what Backlog.md does cites a specific public interface
observation (`backlog --help`/per-command `--help`, `--plain`/`--json`
output, or an on-disk artifact) at the pinned revision, never Backlog.md's
implementation source.

**Owner ruling in force (2026-08-04, reaffirmed, strict clean room):** the
same ruling governing the fidelity contract governs this document. Every
Backlog.md fact below traces to published documentation, `--help` output,
`--plain`/`--json` output, or an on-disk artifact produced by running the
installed binary — nearly all of it already captured in the fidelity
contract's Execution evidence, re-cited here rather than re-derived;
`task list --help`, `task view --help`, `draft list --help`, `milestone
list --help`, `search --help`, and `doctor --help` were each freshly re-run
live 2026-08-04 against the same pinned build as a no-drift spot check
before writing this document, and confirmed identical to the flags already
enumerated in the fidelity contract's command-surface tables — this
document relies on no flag the fidelity contract did not already surface.
This document opened no Backlog.md implementation source, the local
Backlog.md clone, or any Quarantined or Contextual-only (lore-cli Backlog
corpus) artifact.

**Requalified public revision (QCLI-73):** `backlog.md` **v1.50.1** — confirmed
on 2026-08-15 as both the locally installed build (`backlog --version` →
`1.50.1`) and the current npm release/latest tag. The v1.49.3 observations
remain dated evidence; the fidelity contract's QCLI-73 requalification is the
current public-contract baseline for this procedure.

**Recheck clause.** Every procedure below assumes v1.50.1's observed public
contract. Before a project follows this playbook, re-run `backlog --version`
and `npm view backlog.md version`; if either reports a version other than
later than `1.50.1`, treat that as a requalification trigger identical to the one the
fidelity contract's own recheck clause defines — re-verify the cited rows of
that document (and, where this document adds its own fresh citations, those
too) against the new build before relying on this procedure, and record the
new version as a fact for the project to track, not grounds to silently
assume this playbook still applies unchanged.

Any Quest-wide vocabulary, architecture, or roadmap consequence surfaced
while producing this document is a proposal to `quest-doc`, not asserted as
a Quest-wide decision here — none is claimed. Every finding below is a
Backlog.md public-contract observation or a component-level Quest migration
procedure, squarely inside `quest-cli`'s own
[charter](quest-cli-component-charter.md) line "migration, coexistence,
aliases, and reversible fidelity reports."

## Details

### Scope, reading order, and what this document is not

Read the [fidelity contract](quest-cli-backlog-migration-fidelity-contract.md)
first — it is the record of *what* Quest must be able to preserve and *why*,
field by field, and this document does not restate its tables. This document
answers the operational question the fidelity contract's own AC3 leaves
open: given those design commitments, what sequence of human/agent actions,
in what order, with what proof at each point, turns an existing Backlog.md
project into one that has adopted Quest without losing data and without an
unrecoverable half-migrated state? For the contract-side view of where this
procedure sits in Quest's own proposed delivery sequence, see `QCLI-2.8`'s
[component contracts and delivery
graph](quest-cli-component-contracts-and-delivery-graph.md#proposed-component-delivery-graph-dormant),
Phase 4 ("Backlog migration") — an informational cross-reference only; this
playbook is not one of that document's synthesis inputs (per the [research
program
Spec](../specs/quest-cli-pre-implementation-research-program.md)'s dependency
table) and this note adds no dependency in either direction.

This document is:

- a per-project procedure (preconditions, ordered steps, success signals,
  abort conditions — AC1);
- a coexistence-window specification naming the single writer at each step,
  the drift-detection mechanism, and the both-written disposition procedure
  (AC2);
- a dry-run and rollback evidence contract precise enough that a project can
  prove it returned to its pre-migration state (AC3);
- a record-coverage statement naming what is carried over and what is
  deliberately not (AC4).

This document is **not**:

- an importer, a migration script, or any executable scaffolding (AC5) —
  every command shown below is a single, independently runnable
  verification or evidence-capture invocation of *Backlog's own* existing
  CLI or of ordinary `git`, in the same spirit the fidelity contract itself
  used to produce its Execution evidence; none is a chained automation a
  project could paste and run end to end as a migration tool;
- a claim that Quest exists as installable software — `@opum-ai/quest` is
  unpublished (per the [research source
  register](quest-cli-research-source-register.md#quest-cli-repository-and-npm-package-identity-owner-decision-2026-08-04)'s
  "quest-cli repository and npm package identity" slice) and this task
  authorizes no scaffolding toward that. Every step below that names an
  action "Quest" takes describes a requirement Quest's eventual migration
  path must satisfy and the evidence that requirement must leave behind —
  not a command a project can run today.

### Vocabulary used below

- **Lifecycle folder.** One of Backlog's record locations for tasks and
  drafts — `backlog/tasks/` (active), `backlog/completed/` (populated only
  by `task complete <id>`), `backlog/drafts/` (populated by `task create
  --draft`, `draft create`, or `task demote`), and the archive tier,
  `backlog/archive/tasks/` and `backlog/archive/drafts/` (populated by
  `task archive`/`draft archive`). `backlog/archive/milestones/`
  (populated by `milestone archive`/`milestone remove`) is grouped with the
  archive tier for the same archive-boundary, source-folder-qualified-ID
  reasoning below, but is not itself a task or draft location — per the
  fidelity contract's [Inventory of user-owned Backlog
  records](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1).
  Documents (`backlog/docs/`) and decisions (`backlog/decisions/`) are
  separate record families with their own lifecycle, addressed in their own
  row of the coverage table below.
- **Source-folder-qualified ID.** A record's identity for migration purposes
  is `(lifecycle folder, Backlog ID)`, not the bare ID string — because
  Backlog's own ID space is not unique across the archive boundary (a live
  `TASK-2` and an archived `TASK-2` can coexist invisibly to every enumerated
  command), per the fidelity contract's [Reversible ID
  mapping](quest-cli-backlog-migration-fidelity-contract.md#reversible-id-mapping)
  and [Collision
  handling](quest-cli-backlog-migration-fidelity-contract.md#collision-handling)
  sections. Every step below that reads or records an "ID" means this pair,
  never the bare ID alone.
- **Snapshot fingerprint.** A dated, reproducible description of exactly
  which on-disk state of `backlog/` (or the project's configured
  `--backlog-dir` equivalent) a given step was performed against, captured
  by `git status --porcelain` plus `git rev-parse HEAD` when `backlog/` is
  tracked in the same Git repository as the rest of the project (the
  ordinary case observed in the fidelity contract's own Initialization
  Execution evidence, where `git init` was run first and `backlog init`
  then populated `backlog/{tasks,drafts,...}` and `backlog/config.yml`
  inside that already-tracked repository; whether `backlog init` would
  itself run a `git init` of its own in a directory with no pre-existing
  Git repository was not exercised by that evidence and is not asserted
  here), or, if `git
  status --porcelain` shows the relevant files untracked or the project has
  `autoCommit: false` (Backlog's own default, confirmed in the fidelity
  contract's Initialization Execution evidence: a fresh `init` leaves
  `backlog/config.yml` untracked and writes no commit), a manifest of every
  file path under `backlog/` paired with its content hash and mtime,
  captured at the same instant. Backlog.md provides no lock file of any kind
  — "confirmed absent by direct filesystem search of the scratch repository
  across every exercised command" per the fidelity contract's [One-writer
  coexistence](quest-cli-backlog-migration-fidelity-contract.md#one-writer-coexistence)
  section — so a fingerprint captured this way, compared byte-for-byte
  against a later fingerprint, is this playbook's only drift-detection
  mechanism; there is no Backlog-side signal to poll instead.

### Global preconditions

A project must confirm every row below before Step 1. Each is independently
verifiable from a public interface; none requires reading Backlog.md source.

| # | Precondition | How it is confirmed | Why it matters |
| --- | --- | --- | --- |
| P1 | Installed Backlog.md matches (or has been re-verified against) the current revision | `backlog --version` and, if network access is available, `npm view backlog.md version`; both reported `1.50.1` live 2026-08-15 for this document | This playbook's every claim about Backlog behavior is scoped to that revision; the recheck clause above governs a later release |
| P2 | The project's own configuration is captured verbatim | `backlog config list` (21 keys observed at pinned revision per the fidelity contract's Initialization Execution evidence) | Task-ID prefix, zero-padding, `--backlog-dir` location, config-file location, the live `statuses`/`priorities`/`types` value sets, and `autoCommit` are all project-configurable, not fixed — the fidelity contract's [Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2) table is explicit that migration "must read the *project's* config, not assume `TASK-N`" |
| P3 | No same-scope duplicate task IDs exist | `backlog doctor` (no `--fix`) exits 0 with `No duplicate task IDs found in active or completed tasks.` | `doctor`'s own scope is "active or completed tasks" only (its own wording, per the fidelity contract's Duplicate-ID collision table) — this precondition closes that class before migration begins, using Backlog's own tooling, never Quest's |
| P4 | No cross-scope duplicate task IDs exist between the active/completed set and the archive set | Enumerate IDs from `backlog task list --json` (covers active + completed, per the fidelity contract's Inventory table) and separately from the raw frontmatter of every file under `backlog/archive/tasks/` and `backlog/archive/drafts/` (no ID-addressed command reaches the archive folders at all, per the same Inventory table's Archived row); diff the two ID sets for any overlap | This collision class is invisible to `doctor` and to `task view`'s own ambiguity guard — "not a manufactured adversarial case — it results from ordinary archive-then-recreate usage" per the fidelity contract's Findings #3; migration must scan wider than Backlog's own tooling does, per [Collision handling](quest-cli-backlog-migration-fidelity-contract.md#collision-handling) class 2 |
| P5 | The project accepts that this playbook is a manual/agent-followed procedure, not a tool it installs | — | This task builds no importer; a project following this playbook is doing the read/verify/record work itself (or via an as-yet-unbuilt Quest that would need to satisfy every evidence requirement below), not running a Quest migration command that does not exist |
| P6 | A snapshot-fingerprint mechanism is chosen and rehearsed once before Step 1 | `git status --porcelain` / `git rev-parse HEAD` if `backlog/` is Git-tracked in the project's own repository; a path+hash+mtime manifest otherwise | Everything from Step 1 onward depends on being able to prove, later, whether `backlog/` changed since a given instant — rehearsing this once catches a broken or slow fingerprint mechanism before it is load-bearing |

Any P3/P4 collision found is not silently resolved here: it is reported to
the project, and only an explicit, human-consented `backlog doctor --fix
--yes` (for the P3 class) closes it — re-verified afterward via `git status
--porcelain`, because the fidelity contract's Findings #4 records that
`doctor --fix` "does not participate in the `autoCommit` convention"
ordinary task writes follow and can leave Git's index pointing at a path its
own repair just deleted. A P4 (cross-scope) collision has no Backlog-side
repair command at all; it is a naming decision the project must make by hand
before Step 1, recorded as evidence the same way every other precondition
is.

### The cutover sequence

Steps run in order. Each step's precondition is the prior step's success
signal unless stated otherwise; an abort at any step returns the project to
the last step whose success signal still holds, never partway into the
next one.

| Step | Precondition | Action | Success signal | Abort condition |
| --- | --- | --- | --- | --- |
| 1. Freeze announcement and snapshot | Global preconditions P1–P6 satisfied | Announce, out of band (a team channel, project doc, or this playbook's own dated evidence log — never a Backlog-file edit, since Backlog has no field for it), that Backlog writes are frozen from timestamp T; capture the snapshot fingerprint of `backlog/` at T | The fingerprint is recorded, and re-capturing it immediately after (T+ε) is identical | Any difference between the T and T+ε fingerprints — a write landed during the announcement window; abort, re-announce, re-snapshot |
| 2. Read pass (non-mutating) | Step 1's fingerprint recorded | Enumerate every record via non-mutating commands only: `task list --json` (active + completed), `draft list --plain` (drafts have no `--json` anywhere in the enumerated surface, per the fidelity contract's Draft row), the archive folders read directly on disk, `milestone list --plain`, `doc list --plain`, decisions read from their raw Markdown files (no `decision list`/`view` command exists, per the fidelity contract's Findings #10), and `task view --json`/`draft view --plain` for every individual record's full detail (description, AC/DoD, plan, notes, comments, refs, deps, milestone, hierarchy) | The total record count from this pass equals an independent on-disk count (e.g. counting `.md` files under every lifecycle folder plus `backlog/docs/` and `backlog/decisions/`) — a completeness proof, not a sampled one, mirroring the fidelity contract's own "no node enumerated from `--help` text alone without a corresponding execution row" discipline | Re-checking the snapshot fingerprint at the end of the read pass shows drift — per the fidelity contract's [One-writer coexistence](quest-cli-backlog-migration-fidelity-contract.md#one-writer-coexistence) instruction to "re-scan and diff the file list after the read completes and flag (never silently merge) any file that changed mid-scan"; abort, return to Step 1 |
| 3. Collision and gap scan | Step 2's inventory complete and fingerprint-verified | Re-apply the P3/P4 collision checks against the full Step 2 inventory (not just a sample); separately, list every field the fidelity contract's [Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2) table marks "Explicit unsupported gap" (the cross-branch task-state overlay, the milestone completion percentage, any fuzzy-search-index state) so the project sees, before proceeding, exactly what will not be reproduced | A written collision/gap report exists covering all four task lifecycle folders plus documents and decisions, with zero unresolved collisions | Any collision remains unresolved (declined by the project, or a claimed resolution cannot be independently re-verified as landed) — abort; migration does not proceed against an ambiguous ID space |
| 4. Dry-run mapping preview (non-mutating) | Step 3's report is clean | Produce the deterministic preview defined in [Deterministic dry runs](quest-cli-backlog-migration-fidelity-contract.md#deterministic-dry-runs) — per source record: lifecycle folder, source-folder-qualified ID, proposed target identity, and any flag carried over from Step 3 | The preview covers 100% of Step 2's count; re-running Step 4 against the unchanged Step 1 snapshot produces a byte-identical preview (idempotence); a fingerprint check taken immediately after preview generation still matches Step 1's | The preview is not idempotent, its coverage is under 100%, or the post-preview fingerprint has drifted — do not proceed; the mapping is not yet trustworthy |
| 5. Human review and apply consent | Step 4's preview accepted as final | The project reviews the preview and records an explicit, dated, attributed consent to apply it — the same preview/apply split `backlog doctor`'s own `--fix`/`--yes` gate models (per the fidelity contract's Duplicate-ID collision table: `doctor --fix` without `--yes` under non-interactive stdin refuses with "Interactive confirmation is unavailable... use --fix --yes") | A dated consent record exists, naming who approved, when, and against which preview's fingerprint | Consent withheld, or the Step 1 snapshot fingerprint no longer matches Backlog's current live state (drift since Step 4) — return to Step 1 |
| 6. Apply (target-only; Backlog untouched) | Step 5 consent recorded and snapshot still current | Create the target-side records from the accepted mapping, once; for every created record, log the rollback-evidence tuple — source folder, source ID, target ID, timestamp — per [Rollback evidence](quest-cli-backlog-migration-fidelity-contract.md#rollback-evidence). No Backlog command from the fidelity contract's mutating list (`task create/edit/archive/complete/demote`, `doctor --fix`, `config set`, `milestone add/rename/remove/archive`, `doc create/update`, `decision create`, `init` against an existing project) is ever invoked against the project's Backlog repository as part of this step, per [Source immutability](quest-cli-backlog-migration-fidelity-contract.md#source-immutability) | Every accepted-preview record has a matching log entry (count-for-count); a fresh fingerprint check on the Backlog project immediately after apply is byte-identical to Step 1's — proving Backlog itself was never written by this step | The created-record count does not match the accepted preview (a partial apply), or the post-apply Backlog fingerprint has changed from Step 1's — treat as a failed apply requiring full rollback (Step 6 has no partial-success path; an unverifiable partial state is, by this contract, not a completed step) |
| 7. Coexistence window opens | Step 6 fully verified | Record, in the same out-of-band evidence log as Step 1 (never in a Backlog file — Backlog exposes no authority/lock field to write it into), which tool is now the single writer for new and updated work: hard cutover (Backlog read-only from this instant, window length ≈ 0) or bounded coexistence (both tools may be *read*, but only the newly-designated tool may be *written*, for a stated, dated window) | The designation and its model (hard/bounded) are recorded with a timestamp, and, for bounded coexistence, an explicit window-close date or condition | Not applicable — this step is a declaration; see Step 8 for what happens if the freeze it declares is violated |
| 8. Drift monitoring during the window | Step 7's designation in force | Re-capture Backlog's fingerprint periodically (at minimum once at window close) and diff against the fingerprint the freeze was declared against | The fingerprint is unchanged through window close — Backlog stayed frozen as designated; no reconciliation needed | Fingerprint has changed — see "What happens when both have written," below; the window does not close until every drift record has a recorded disposition |
| 9. Coexistence window closes | Step 8 resolved (zero drift, or every drift item disposed) | Record window closure in the evidence log | Backlog's fingerprint at closure equals Step 1's fingerprint plus exactly the disposed deltas from Step 8 — nothing unaccounted for | Undisposed drift remains — the window cannot close; return to Step 8 |

### The coexistence window

**Single writer per step.** Backlog's own project files (`backlog/` or its
configured equivalent) are never written by anything this playbook
describes as "Quest" or "the target" at any step — Step 6 creates
target-side records only, and Step 6's own success signal is a fingerprint
proof that Backlog did not change. This extends the fidelity contract's
[Source immutability](quest-cli-backlog-migration-fidelity-contract.md#source-immutability)
commitment (scoped there to the read pass) across the entire procedure: the
single-writer question this playbook answers is never "which tool
physically edits `backlog/`" — that is always either the project's own
ordinary Backlog usage or nothing — but "which tool is authoritative for
new and updated work" from Step 7 onward. Before Step 7, that is
unambiguously Backlog (nothing has moved yet). From Step 7, it is whatever
Step 7's evidence log entry names.

**How a reader detects drift.** Because Backlog.md provides no lock file
("confirmed absent by direct filesystem search... across every exercised
command," fidelity contract, One-writer coexistence section), no in-band
signal exists to poll. Drift detection is exclusively the snapshot-
fingerprint comparison defined above: any reader — a human, or a later
Quest read pass — re-derives the current fingerprint of `backlog/` the same
way Step 1 did and diffs it against the last agreed fingerprint. A
`git status --porcelain` (or manifest-hash) diff that returns empty is
proof of no drift; any non-empty diff is drift, full stop — there is no
partial-credit reading of "probably fine."

**What happens when both have written.** If Step 8 finds drift — a write
landed in Backlog after the declared freeze — it is never silently merged
and never silently discarded. The procedure:

1. Diff the changed file(s) against the frozen snapshot to isolate exactly
   what changed.
2. Produce a delta report naming each changed record by its
   source-folder-qualified ID.
3. For each delta record, require its own explicit, separately consented
   disposition — mirroring Steps 3–5, not a bulk decision:
   - **Migrate as a supplementary batch** — the record gets its own mapping
     entry and its own rollback-evidence tuple, dated after the original
     Step 6 apply, clearly distinguishable in the evidence log as a
     post-cutover addition rather than part of the original migration; or
   - **Discard** — the write is judged a mistake (e.g. someone edited
     Backlog directly out of habit after the freeze); the discard decision
     itself is recorded as evidence, with who decided and why, exactly as
     rigorously as a migrate decision would be.
4. The coexistence window (Step 9) cannot close while any delta record
   lacks a recorded disposition.

This is a direct extension of the fidelity contract's own instruction, in
the same [One-writer
coexistence](quest-cli-backlog-migration-fidelity-contract.md#one-writer-coexistence)
section, to "flag (never silently merge) any file that changed mid-scan" —
applied here to the entire coexistence window, not only the original read
pass.

### Dry run — definition and evidence

A dry run is Step 4 above, named as its own concept because AC3 requires it
independently of the step table. It must satisfy every property below,
directly modeled on the fidelity contract's [Deterministic dry
runs](quest-cli-backlog-migration-fidelity-contract.md#deterministic-dry-runs)
commitment, itself modeled on the observed `backlog doctor` preview pattern
(`doctor` alone reports "Repair preview (no files changed)" and exits 1;
only `doctor --fix --yes` mutates and exits 0 — fidelity contract,
Duplicate-ID collision table):

- **No mutation, provably.** A fingerprint check taken immediately before
  and immediately after dry-run generation must be identical. This is not
  an assumption about the dry-run mechanism's good behavior; it is a
  checked fact every dry run must produce as part of its own evidence.
- **Complete enumeration, not a sample.** The preview must cover every
  record Step 2's inventory found — 100%, not "most" — across all four task
  lifecycle folders plus documents and decisions.
- **Per-record disposition.** For every source record: which lifecycle
  folder it came from, its source-folder-qualified ID, its proposed target
  identity, and any collision or gap flagged against it from Step 3 —
  nothing inferred silently between preview and apply.
- **Idempotent.** Re-running the dry run against an unchanged snapshot
  produces byte-identical output. A dry run that is not reproducible cannot
  be reviewed and consented to (Step 5) with any confidence that Step 6
  will apply the thing that was actually reviewed.
- **Successful preview is success, not a failure.** A complete read-only preview exits
  `0` and returns `requiresApproval: true` with a deterministic digest of the exact
  previewed mapping. The evidence remains unapplied until Step 5 records consent; that
  state is represented in the result, never by a non-zero exit.

### Rollback — definition and evidence

Backlog.md itself provides no generic "undo last operation" for any command
this playbook or the fidelity contract exercises — `task demote` reverses
`draft promote`'s specific effect, but that is a distinct forward command a
project must know to run, not automatic undo, and `doctor --fix`'s own
output never mentions reversal (fidelity contract,
[Rollback evidence](quest-cli-backlog-migration-fidelity-contract.md#rollback-evidence)).
This playbook does not rely on any Backlog-side rollback; it defines its
own, in two cases:

**Rollback invoked before Step 6 (apply).** Nothing exists on the target
side yet. Rollback is simply discarding the preview/mapping draft. Because
every step through Step 5 is non-mutating against Backlog (each with its
own fingerprint-verified success signal above), no further evidence is
needed beyond the fingerprint checks the steps themselves already produced
— Backlog's state was never at risk.

**Rollback invoked after Step 6 (apply has run).** Use the Step 6
rollback-evidence log — one tuple per created record: source folder, source
ID, target ID, timestamp — to identify and remove every created target
record. A completed rollback must produce:

1. A per-record deletion confirmation matching the Step 6 apply log
   one-to-one — every record the log says was created has a corresponding
   confirmation that it no longer exists on the target side.
2. A final Backlog fingerprint identical to Step 1's snapshot — proof that
   Backlog's own pre-migration state was never touched by the migration
   itself and needs no restoration, because it was never altered.
3. An explicit, dated statement of the one thing rollback cannot recover:
   any record created directly in the target tool during the coexistence
   window (Steps 7–9) that has no Backlog counterpart. The fidelity
   contract's migration contract is one-directional (Backlog → Quest); no
   reverse-migration path is defined by this document or that one. If the
   coexistence window was hard-cutover (length ≈ 0), this statement is
   "none." If it was a bounded window during which new work was created
   only on the target side, that work must be named explicitly and does not
   silently disappear from the rollback record — the project must decide,
   as its own separate action, whether to re-enter it into Backlog by hand.

A rollback that produces items 1 and 2 above but is silent on item 3 does
not satisfy this contract — "proof that a project returned to its
pre-migration state" must say what, if anything, it could not also
preserve from the interim.

### Record coverage (AC4)

Every row cites the fidelity contract table that established the disposition;
this document adds only the migration-procedure column.

| Record class | Fidelity contract disposition | This playbook's coverage |
| --- | --- | --- |
| Active tasks | Public read contract via `task list`/`task view`, both `--plain`/`--json` ([Inventory](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1)) | Read in Step 2; mapped in Step 4; created in Step 6 |
| Completed tasks | Same read commands; included in `task list`'s status breakdown ([Inventory](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1)) | Same as active tasks — `task list --json` covers both in one pass, per the fidelity contract's own observation |
| Archived tasks/drafts/milestones | On-disk artifact only — "no dedicated list/view command reaches the archive folders at all" ([Inventory](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1)) | Walked directly by path in Step 2 (not via any ID-addressed command); the P4 precondition's cross-scope collision scan is specifically because archive is otherwise invisible to Backlog's own tooling |
| Draft tasks | `draft list`/`draft view`, `--plain` only, no `--json` anywhere in the enumerated surface ([Inventory](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1)) | Read via `draft list --plain`/`draft view --plain` in Step 2 |
| Parent/subtask hierarchy | `task view --json`'s `subtasks[]` (id+title, one level) and `parentTaskId`; dot-suffixed IDs are a Backlog-specific allocation convention — Deliberate transformation ([Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2)) | Read per-record in Step 2 alongside every other field; the target identity Step 4 proposes is not required to inherit Backlog's `N.M` grammar, per the fidelity contract's own note that Quest's ID grammar is a separate open question |
| Dependencies | `task view --json`'s `dependencies[]`, IDs are Backlog-project-local — Deliberate transformation ([Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2)) | Read in Step 2; because a dependency is itself a source-folder-qualified ID reference, it is resolved through the same Step 4 mapping table as its target record, never copied as a literal string |
| Milestones | `milestone list --plain`; each task's own field stores the milestone's *ID*, not title — Deliberate transformation ([Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2)) | Read via `milestone list --plain` in Step 2; each task's milestone ID is resolved against that list to recover the human title before Step 4 proposes a target identity — never carried over as a bare `m-N` string |
| Documents | Full CRUD except delete through the CLI ([Inventory](quest-cli-backlog-migration-fidelity-contract.md#inventory-of-user-owned-backlog-records-ac1), trailing paragraph); `doc list`/`doc view` are `--plain`-only, no `--json` for documents anywhere in the enumerated surface ([Field-by-field disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2), `Document` row) | Read via `doc list --plain`/`doc view --plain` in Step 2, alongside tasks; subject to the same fingerprint, dry-run, apply, and rollback evidence contract — this playbook does not treat documents as a lesser record class |
| Decisions | Create-only through the CLI; no `decision list`/`view`/`update`/`edit` command exists anywhere in the enumerated 49-node surface; full-fidelity read requires the raw Markdown file, not a structured command ([Findings #10](quest-cli-backlog-migration-fidelity-contract.md#findings-undocumented-or-surprising-behavior)) | Read directly from `backlog/decisions/*.md` in Step 2 (on-disk artifact, still admissible); `search --type decision --plain`/`--json` may corroborate title/status/date but never substitutes for the file read, since it does not return body text |

### What this playbook deliberately does not carry over

None of Backlog's own current-state record families is dropped wholesale —
every one named in the coverage table above (active, completed, archived,
and draft tasks; hierarchy; dependencies; milestones; documents; decisions)
is read, mapped, and carried over. What follows instead is historical or
derived state that sits alongside those records but is not itself one of
them, named here per AC4, distinct from the field-level "Explicit
unsupported gap" entries already itemized in the fidelity contract's
[Field-by-field
disposition](quest-cli-backlog-migration-fidelity-contract.md#field-by-field-disposition-ac2)
table (the cross-branch task-state overlay, the derived milestone
completion percentage, and any fuzzy-search-index state — all restated in
Step 3 above so a project sees them before consenting to apply):

- **Git commit history of the `backlog/` directory itself** (author,
  message, prior file contents at each commit). The fidelity contract
  classifies this an "Owner-supplied fixture": "Backlog.md's own commands
  never read or replay this history back into a task." This playbook's
  default posture is the same — it migrates current-state records, not the
  Backlog-era Git history behind them. A project that wants that history
  preserved must make that an explicit, separate decision; it is not part
  of the evidence contract above, and Step 6's rollback-evidence tuples
  carry no commit-history reference.
- **The `browser` command's `/api/tasks` HTTP endpoint**, as a data source
  for this procedure. It exists and was observed to serve JSON (fidelity
  contract, Execution evidence, Shell integration table), but its field
  shapes diverge from the CLI's own `--json` contract. The register's
  "Backlog.md public surface" slice does not itself exclude this endpoint —
  its stated Exclusions are narrower: "a behavior observed only by reading
  source, not by running the tool, is not admissible" (research source
  register, "Backlog.md public surface" slice), and `/api/tasks` was
  observed by running the tool. The restriction not to treat it as a
  citable migration-evidence source is `QCLI-2.5`'s own, added under the
  enumeration clause the fidelity contract's intro states for
  process-level and HTTP-probe evidence (fidelity contract, Owner ruling
  paragraph: `curl` probes of `browser`'s local HTTP server "recorded...
  as evidence of what `browser` serves, but... not treated as a citable
  public contract") — the same self-imposed-rather-than-register-derived
  pattern `QCLI-2.8`'s own [residual-gap
  note](quest-cli-component-contracts-and-delivery-graph.md#reconciliation-across-the-ten-dependencies)
  identifies for a different evidence class (process-level responses).
  Every read step above uses only the CLI and on-disk artifacts;
  `browser`'s HTTP API is never a migration evidence source.
- **Interactive-wizard session state** (`config` run bare, `cleanup`,
  `agents --update-instructions`). None of these persists anything on disk
  the fidelity contract's Execution evidence could find — there is nothing
  to enumerate, snapshot, or migrate.

### Sources and classification (AC6 grounding)

| Source | Repository / path | Revision | Register classification | Used for |
| --- | --- | --- | --- | --- |
| Backlog.md public surface | `https://backlog.md` docs; `backlog --help`/per-command `--help`; `--plain`/`--json` output; on-disk artifacts | pinned v1.49.3, reconfirmed live 2026-08-04 (`backlog --version` and `npm view backlog.md version`) | Allowed — "Backlog.md public surface" | Grounds every Backlog-behavior claim above, almost entirely by re-citing the fidelity contract's own Execution evidence rows (themselves grounded in this same slice) rather than re-deriving them; the fresh no-drift `--help` spot checks named in the Notes below are grounded here directly |
| Quest CLI Backlog migration fidelity contract (`QCLI-2.5`) | `docs/reference/quest-cli-backlog-migration-fidelity-contract.md` (this repo) | this branch | See the caveat immediately below — not yet an enumerated member of the "Prior QCLI research records" slice, as found by this document's own original settlement pass. **Resolved 2026-08-04:** `QCLI-6` enumerated the fidelity contract into that slice (Allowed — "Prior QCLI research records", SHA-pinned at `418c5eb`); the slice now lists fourteen members, not nine, and the contract is one of them. See the caveat's own appended resolution note below for the full account. | This document's stated primary foundation (this task's own description); every design commitment this playbook operationalizes (deterministic dry runs, reversible ID mapping, collision handling, source immutability, one-writer coexistence, rollback evidence) |
| Quest CLI component charter | `docs/reference/quest-cli-component-charter.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | Read-only background per this task's `Documentation` field; not itself the source of any Backlog-behavior claim above |
| Former OCLI to QCLI migration ledger | `docs/reference/former-ocli-to-qcli-migration-ledger.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | Read-only background per this task's `Documentation` field; its OCLI→QCLI provenance mapping does not inform this document's Backlog-behavior content and is not otherwise cited above |
| Quest CLI research source register | `docs/reference/quest-cli-research-source-register.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | Per-slice admission authority for every row above |

**Caveat — the fidelity contract's own admissibility is not yet enumerated.**
The register's "Prior QCLI research records" slice lists nine specific
members as of this writing — `QCLI-1`/`QCLI-3`/`QCLI-4`'s component charter,
migration ledger, and research Spec; `QCLI-2.2`'s reconciliation; the
register itself; the accepted ADR; `QCLI-2.3`'s black-box scenarios;
`QCLI-2.4`'s glossary; `QCLI-2.7`'s Lore dependency evidence — and the
fidelity contract is not one of them. That slice's own text mentions the
fidelity contract exactly once, and only as a *reader*, not as a member:
"`QCLI-2.7`'s Lore dependency and adapter contract evidence... is read by
`QCLI-2.5`'s Backlog migration fidelity contract Notes." This document
nonetheless cites the fidelity contract as its principal source — per this
task's own directive to turn "the QCLI-2.5 fidelity contract" into an
operational plan — so an accurate accounting cannot claim the "Prior QCLI
research records" slice already covers that reliance; it does not, yet.
This is the same enumeration-gap class `QCLI-2.12` closed for other
already-relied-upon documents ("None of these three was previously named in
this enumeration despite already being relied on, under this slice's
Allowed classification, by merged deliverables" — register, "Prior QCLI
research records" slice). It is recorded here as a genuine register gap and
reported as an out-of-scope finding for the register's owner; this task's
scope boundary excludes editing the register or the migration ledger, so
the gap is not closed from here. This does not weaken AC6 substantively:
every Backlog-behavior fact this document draws from the fidelity contract
is, one level down, itself independently grounded in the "Backlog.md public
surface" slice via the fidelity contract's own Execution-evidence
citations — the open question is only which register slice should list the
fidelity contract itself as an admissible source document, not whether the
underlying Backlog-behavior claims are admissible.

**Resolved 2026-08-04.** The gap this caveat records is closed. `QCLI-6`
added `QCLI-2.5`'s Backlog migration fidelity contract to the register's
"Prior QCLI research records" slice — Allowed classification, SHA-pinned at
`418c5eb` (2026-08-04 15:16:00 -0500, `QCLI-2.5`'s own follow-up fixing a
stale scratch-repo count and evidence-source enumeration) — as one of five
members that task enumerated in the same pass (register, "Prior QCLI
research records" slice). The slice now lists fourteen members, not nine,
and the fidelity contract is one of them. The Sources table's own "Register
classification" cell for the `QCLI-2.5` row above, which pointed a reader to
this caveat as the reason the contract wasn't yet enumerated, was stale for
the identical reason; its own appended note (added alongside this one)
carries this same correction there directly, rather than leaving the table
pointing at a caveat that no longer supports it. Nothing about this
document's own findings changes as a result: as already stated above, every
Backlog-behavior fact this document draws from the fidelity contract was
already independently grounded, one level down, in the "Backlog.md public
surface" slice via the fidelity contract's own Execution-evidence citations
— admissibility of the underlying claims was never in question, only
whether the register's own enumeration reflected reliance already in place.
It now does.

### Notes

This document opened no Backlog.md implementation source, the local
Backlog.md clone at `/Volumes/external/repos/Backlog.md`, or any lore-cli
Backlog corpus document (Contextual, citable for nothing). `backlog
--version` and `npm view backlog.md version` were freshly re-run live
2026-08-04 (both `1.49.3`, per the Pinned research revision note above), and
`task list --help`, `task view --help`, `draft list --help`, `milestone
list --help`, `search --help`, and `doctor --help` were freshly re-run the
same day as a no-drift spot check against the fidelity contract's own
command-surface tables, with no divergence found. Every substantive
Backlog-behavior claim in this document re-cites a specific row of the
fidelity contract's own Execution evidence rather than re-deriving it, per
this task's charge to build on `QCLI-2.5`'s output rather than duplicate
it.

The component charter and the migration ledger are cited or read as
background per this task's own `Documentation` field but neither is edited
by this task, per its explicit scope boundary — see the Sources and
classification table above for what each does and does not ground.

No finding in this document proposes a change to Quest-wide vocabulary,
architecture, or roadmap; every finding here is either a Backlog.md
public-contract observation or a component-level Quest migration-procedure
commitment, both inside `quest-cli`'s own charter.
