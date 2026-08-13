---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Git, filesystem, and concurrency threat model
tags:
  - quest
  - cli
  - git
  - filesystem
  - concurrency
  - threat-model
  - clean-room
summary: Implementation-independent threat model for Git-coordinated task/event records across worktrees and clones; derives safety, mutation, and recovery invariants without a physical storage design.
timestamp: 2026-08-04T16:48:33.585Z
---

# Quest CLI Git, filesystem, and concurrency threat model

This Reference is `QCLI-2.6`'s deliverable: an implementation-independent
threat model for the authoritative task and event records Quest CLI
coordinates through Git across local worktrees and multiple clones, and the
observable safety and recovery requirements those threats derive — without
selecting a physical storage design (file layout, lock mechanism, merge
algorithm, or schema). It is the current successor to former `OCLI-3.6`
("Git/filesystem/concurrency threats") per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md) row
`OCLI-3.6 → QCLI-2.6`. It stays consistent with, and does not restate or
override, the [component charter](quest-cli-component-charter.md), the
[research source register](quest-cli-research-source-register.md) (cited
here read-only; owned this wave by `QCLI-2.12`), the
[migration ledger](former-ocli-to-qcli-migration-ledger.md) itself (cited
here read-only; also owned this wave by `QCLI-2.12`), and the
[research program Spec](../specs/quest-cli-pre-implementation-research-program.md)
(cited here read-only; owned this wave by `QCLI-2.14`) — all of which remain
normative over this document.

This document depends on, and does not duplicate, three already-admitted
deliverables: `QCLI-2.2`'s
[legacy requirement reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md),
which classifies the candidate mechanisms this model must make safe (Git
CAS-backed claims, TTL leases, gates, read-only purity, operation-owned
commits, canonical task identity/aliases — all Adapted or Reusable, none a
ported legacy design); `QCLI-2.3`'s
[black-box acceptance scenarios](quest-cli-black-box-acceptance-scenarios.md)
(`BB-01`–`BB-17`), which already specify the *caller-observable* behavior for
lease/heartbeat failures, read-only purity, recovery, hostile paths, dirty
worktrees, canonical IDs, and operation-owned Git effects — this document
supplies the *invariants those scenarios are instances of*, not a second copy
of them; and `QCLI-2.4`'s
[component glossary, actors, and workflows](quest-cli-component-glossary-actors-and-workflows.md),
which explicitly routes "concurrency mechanics," "concurrent reclamation
attempts," and the "claim conflict... schema" to this task rather than
resolving them itself.

## Details

### Scope, grounding, and non-goals

| Source | Repository / path | Revision | Register classification | Used for |
| --- | --- | --- | --- | --- |
| Quest CLI component charter | `docs/reference/quest-cli-component-charter.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | The owned-surface authority ("safe filesystem and operation-owned Git behavior"; "dependency readiness, claims, leases, gates, lifecycle, and evidence"; "migration, coexistence, aliases, and reversible fidelity reports"; "rebuildable local projection, freshness, recovery, and scale") and the "Sources of truth" statement every invariant below is grounded against |
| Former OCLI to QCLI migration ledger | `docs/reference/former-ocli-to-qcli-migration-ledger.md` (this repo, owned this wave by `QCLI-2.12`) | this branch | Allowed — "Prior QCLI research records" | Row-gating authority for this task's identity as `OCLI-3.6`'s successor |
| Quest CLI pre-implementation research program (Spec) | `docs/specs/quest-cli-pre-implementation-research-program.md` (this repo, owned this wave by `QCLI-2.14`) | this branch | Allowed — "Prior QCLI research records" | Confirms this task's dependency order (`QCLI-2.2`–`QCLI-2.4`), its required output ("model Git, filesystem, identity, lease, and concurrency threats"; "safe Git mutation" in the final synthesis), and the non-goals this document declines to close (canonical ID grammar, authored-record layout, event schema, scale target, supported-platform matrix) |
| Legacy Opum requirement reconciliation for Quest CLI | `docs/reference/legacy-opum-requirement-reconciliation-for-quest-cli.md` (this repo, `QCLI-2.2`) | this branch | Allowed — "Prior QCLI research records" | Candidate dispositions this model must make safe: #1 event-derived state, #2 workspace enrollment, #3 Git CAS-backed claims, #4 TTL leases, #5 gates (mechanism only), #8 read-only purity, #9 operation-owned commits, #10 canonical ID/alias handling — all cited read-only, none re-classified here |
| Quest CLI black-box acceptance scenarios | `docs/reference/quest-cli-black-box-acceptance-scenarios.md` (this repo, `QCLI-2.3`) | this branch | Allowed — "Prior QCLI research records" | Caller-observable behavior this model's invariants must be consistent with: `BB-01`/`BB-02` (lease/heartbeat), `BB-05`/`BB-06` (read-only purity), `BB-07`/`BB-08` (recovery), `BB-09`–`BB-11` (hostile paths), `BB-12`/`BB-13` (dirty worktrees), `BB-14`/`BB-15` (canonical IDs), `BB-16`/`BB-17` (operation-owned Git effects) |
| Quest CLI component glossary, actors, and workflows | `docs/reference/quest-cli-component-glossary-actors-and-workflows.md` (this repo, `QCLI-2.4`) | this branch | Allowed — "Prior QCLI research records" | Candidate vocabulary this model reuses without re-defining (Claim, Lease, Reclamation, Recovery, Projection, Freshness/Staleness) and the explicit deferrals to this task ("concurrency mechanics are `QCLI-2.6`'s scope"; "concurrent reclamation attempts are a `QCLI-2.6` concurrency question") |

Not cited to inform any threat or invariant below: Backlog.md's
implementation source, internal tests, or public surface (this model is about
Quest's own authoritative Git storage, not Backlog.md migration fidelity,
which is `QCLI-2.5`'s territory); `QCLI-2.7`'s Lore dependency and adapter
contract evidence (out of scope — "Topology and trust model," below, bounds
Lore out of the authoritative-write surface using `QCLI-2.4`'s own workflow
table instead, not `QCLI-2.7`'s); any Quarantined or Deferred artifact.

A minority of the threats below (case sensitivity, symlink handling) are
grounded in Git's and POSIX/NTFS/APFS filesystems' own publicly documented,
cross-platform behavior rather than in any admitted Quest-cli or Opum source.
Git itself is not Backlog.md, is not a competitor product, and is the direct
substrate the charter already commits quest-cli to using safely ("safe
filesystem and operation-owned Git behavior"); citing Git's own documented
behavior is not a clean-room admission question the source register governs,
and no such citation asserts anything about Backlog.md, Opum, or any
excluded/quarantined material. Each such threat says so explicitly where it
applies.

#### Non-goals

This model intentionally does not: choose a file layout, naming scheme,
canonical-ID grammar, event schema, locking primitive, merge/rebase strategy,
or storage engine (the research program Spec lists "canonical ID grammar,
authored-record layout, event schema, and scale target" as an open question
this document does not close); assert which supported platforms Quest CLI
ships for (also open, per the same Spec); or specify how a Quest command's
JSON envelope or exit codes represent a given failure (`QCLI-2.3`'s
scenario-field-definition note already routes that to `QCLI-2.8` and the
Spec's Required Outputs). It derives *observable safety and recovery
requirements* — properties any physical design must satisfy — not the design
itself.

### Topology and trust model

Quest CLI's authoritative records are "Git-tracked authored records" (charter,
"Sources of truth"); "[a]ny graph/index is derived, disposable,
deterministically rebuildable, and explicitly workspace-scoped" (same
section) — this is the
[glossary](quest-cli-component-glossary-actors-and-workflows.md)'s
"Projection" term. This task's own description names the topology explicitly:
"local worktrees and multiple clones." Three consequences ground every threat
below:

1. **No central arbiter.** Nothing outside Git itself (no server process, no
   lock service) is assumed to exist. Whatever ordering guarantee an
   operation needs, it must obtain from Git's own compare-and-swap ref-update
   semantics (an update to a ref succeeds only if the ref's current value
   matches the value the writer last observed) — this is Git's own documented
   mechanism, not a Quest-specific design choice, and the only ordering
   primitive this model assumes.
2. **Multiple independent working copies.** A "worktree" is a checked-out
   working directory (possibly one of several sharing one `.git`, via
   `git worktree`, or the sole working directory of an independent clone); a
   "clone" is an independently cloned repository, with its own object
   database and its own view of which commits it has fetched. An actor's
   local worktree/clone can be arbitrarily stale relative to any other
   actor's, and arbitrarily stale relative to whatever remote the fleet
   treats as shared (the charter does not name a specific remote topology,
   and this document does not invent one — "shared/remote history" below
   means whatever ref the deployment's actors agree is authoritative, not a
   specific hosting choice).
3. **Lore is out of the authoritative-write surface.** Per the
   [glossary](quest-cli-component-glossary-actors-and-workflows.md)'s actor
   table, "Lore... [n]othing inside Quest's authoritative records — Lore is a
   link/import target, not a writer here," and its "Optional Lore link"
   workflow row: "[i]f Lore is unreachable... the link workflow fails loud
   and leaves the task's own authoritative state untouched." This model
   therefore excludes Lore reachability/availability from every threat and
   invariant below; a Lore-link failure is bounded to that one optional
   workflow, never a hazard to Git/filesystem/concurrency safety.

Because no central arbiter exists, every invariant in this document that
resembles "exactly one winner" or "conflict is detected, never silently
overwritten" reduces, at the mechanism level, to Git's own ref-update
compare-and-swap — the *contract* this model requires an operation to honor,
not a *specific locking implementation* this model chooses.

### Threat catalog (AC1)

One subsection per category named in this task's acceptance criterion #1, in
the order given.

#### Dirty worktrees

**Threat:** a worktree already has uncommitted changes — tracked-file
modifications, staged-but-uncommitted content, or untracked files —
unrelated to the operation about to run, before that operation starts.

**Why it matters:** an operation that stages "whatever the worktree currently
shows as changed" (rather than exactly its own owned files) will silently
absorb a bystander's unrelated, unreviewed work into its own commit — or, on
a failure path, a naive recovery/rollback (`git checkout -- .`,
`git clean -fd`, `git reset --hard`) will silently discard it. `QCLI-2.3`'s
`BB-12` and `BB-13` already specify the caller-observable requirement (an
operation's commit contains exactly its own files; a failed operation's
recovery path never touches the pre-existing dirty state); this model
supplies the underlying invariant (see "Operation-owned staging and
commits," below) both scenarios are instances of.

**Requirement:** every mutating operation must identify its own owned paths
*before* touching the index, stage only those paths, and never invoke a
working-tree-wide reset/clean/stash as part of ordinary operation or failure
recovery.

#### Partial writes

**Threat:** the process is interrupted (killed, crashed, powered off) after
starting a multi-step write — some files/index entries touched, others not —
or after populating the Git index but before the commit that would make the
change durable and visible.

**Why it matters:** Git's own object write and ref update are each atomic at
the mechanism level (a ref update either fully lands or is rejected; there is
no Git-internal "half-committed" ref), but *the sequence of filesystem and
index operations a Quest operation performs to build up one logical commit*
is not automatically atomic just because the final `git commit` call is — an
interruption before that call can leave the working tree or index in an
intermediate state distinguishable from both "not started" and "done."
`QCLI-2.3`'s `BB-07`/`BB-08` specify the caller-observable resume/never-wedge
requirement for one such operation (synchronization); this threat generalizes
it to every mutating operation.

**Requirement:** on restart, an operation must be able to recognize any of
its own leftover partial state (staged-but-uncommitted index entries,
partially written files) and either resume deterministically to the same
eventual state a clean run would reach, or fully discard its own partial
state and start over — never leave a partial result indistinguishable from
success, and never require a second, different operation to clean up after
it (see "Atomicity," below).

#### Retries

**Threat:** a caller (human, script, or another Quest invocation) re-issues
the same logical request after an ambiguous outcome — a timeout, a crash
before the caller received a result, or an operator simply re-running a
command that may already have succeeded.

**Why it matters:** the *operation itself* may have already completed (its
commit already landed) even though the caller never observed success. If a
retried operation performs its write unconditionally, it produces the
"duplicate events" hazard below. `BB-02`'s "late... heartbeat cannot renew a
lease it no longer holds" is one instance (a retried heartbeat arriving late
must not act on stale state); the general case covers every mutating
operation, not only heartbeats.

**Requirement:** a retried operation must be safe to invoke any number of
times for the same logical request and reach the same observable end state
as a single successful invocation (see "Idempotency," below) — it must not
need the caller to first determine whether the prior attempt succeeded.

#### Duplicate events

**Threat:** two authored event records exist in history for what should be
one logical occurrence — from an unsafe retry (above), from two independent
actors or processes each unaware of the other issuing what they believe is a
first-time request, or from any at-least-once delivery path (a queue, a
wrapper script, a CI re-run) that does not itself guarantee exactly-once
execution.

**Why it matters:** the
[glossary](quest-cli-component-glossary-actors-and-workflows.md) grounds
task/workspace state as "a projection of event history, not a separately
mutated record" (Event, Reconciliation candidate #1, Adapted) — a projection
has no way to distinguish "two occurrences really happened" from "one
occurrence was recorded twice," so a duplicate silently corrupts every
derived read (counts, latest-state lookups, audit history) without any
single command doing anything obviously wrong.

**Requirement:** every mutating operation must carry or be able to derive an
idempotency basis (see "Idempotency," below) sufficient to recognize, before
writing, that its own logical effect already exists in history — and either
no-op (returning the prior result) or fail with a structured "already
applied" result, never append a second event for the same logical
occurrence.

#### Aliases

**Threat:** a task has more than one identifier that resolves to it — a
canonical ID and one or more aliases, e.g. from a migrated or coexisting
identifier scheme (charter: "migration, coexistence, aliases, and reversible
fidelity reports"; reconciliation candidate #10, canonical task identity and
alias handling, Adapted). Two distinct hazards follow: (a) an operation
supplied an alias treats the alias as if it names a *second*, independently
claimable record rather than the same canonical one; (b) an alias is
registered concurrently with an operation on the canonical record it will
resolve to, racing the two.

**Why it matters:** `BB-14` already specifies the caller-observable
requirement for hazard (a) — an alias-based claim attempt on an
already-claimed task resolves to, and is rejected the same as, the canonical
record, with "exactly one lease record... system-wide for this task, not one
per identifier form." Hazard (b) is not covered by `BB-14`/`BB-15` (which
assume the alias already exists) and is this model's own addition.

**Requirement:** alias resolution must happen *before* any claim/lease/gate
check, never after (so an alias can never observe a different state than its
canonical ID would); registering a new alias for a canonical record must
itself be conflict-detected against concurrent claim/lease/gate activity on
that same canonical record, using the same compare-and-swap mechanism as any
other authoritative write — an alias registration is itself an authoritative
write, not a side channel exempt from the invariants below.

#### Clocks and leases

**Threat:** two distinct clock hazards. (a) *Accidental skew* — the machine
that established a lease and the machine later evaluating its expiry have
wall clocks that disagree, so the same lease reads as live on one and
expired on the other. (b) *Self-reported timestamps* — because there is no
central arbiter (see "Topology and trust model"), any timestamp recorded in
an authored event is necessarily supplied by whichever actor authored that
event; an actor with a skewed (accidentally or deliberately) clock can record
a lease-issued time that makes its own claim appear fresher, or a heartbeat
appear more recent, than wall-clock reality.

**Why it matters:** `BB-01` already specifies the caller-observable
requirement that a live claim-conflict check and a full projection rebuild
"report the identical expiry instant and the identical held/expired status
for the same wall-clock read time," treating any discrepancy as "a distinct,
named inconsistency — never silently resolved by picking one value." That
scenario proves *internal consistency* (two evaluators of the same history,
at the same observation time, must agree) but does not by itself address
cross-actor clock skew or self-reported-timestamp trust — this model adds
those. `BB-02` grounds the companion requirement that a stale-token renewal
must never silently extend a newer holder's lease, generalized below as
"generation-scoped renewal."

**Requirement:** (1) lease expiry must be evaluable from the authored
history alone (issued time + TTL) plus the *evaluating* actor's own local
clock — never by trusting a remote peer's live "is it still valid?" answer
as ground truth; (2) any two honest evaluators computing expiry for the same
history at materially the same wall-clock moment must reach the same
held/expired status, and a detected disagreement is a named anomaly, not
silently resolved (per `BB-01`); (3) the system must tolerate bounded clock
skew between actors without treating ordinary skew as an attack, while a
self-reported issued-time inconsistent with the surrounding authored-history
order (e.g., claiming an issue time earlier than its own parent commit's
recorded time) is a detectable anomaly to surface, not a value to trust
blindly; (4) a lease renewal (heartbeat) must be scoped to the exact lease
generation/token it was issued against, so a late or stale renewal can never
extend a different, newer holder's lease (`BB-02`).

#### Races

**Threat:** two categories. (a) *Ground-level authoritative-write races* —
two operations each read the same ref at the same "before" state and each
attempt to advance it; only one ref update can win, by Git's own
compare-and-swap mechanism (see "Topology and trust model"). (b) *Logical
races riding on top of (a)* — two claims on the same canonical ID (`BB-15`);
an alias registration racing a claim (see "Aliases," above); a projection
rebuild reading history while a writer's multi-step mutation is only partway
landed (`BB-06`'s "torn read" concern, generalized from a single read command
to the rebuild path specifically).

**Why it matters:** `BB-15` already specifies the caller-observable
requirement for the claim case ("exactly one claim succeeds; the other
receives a structured conflict/decline result — never both succeeding, and
never both failing"). Every other logical race in this model
(alias-vs-claim, gate-evidence-vs-gate-evidence, sync-vs-concurrent-claim)
reduces to the same underlying mechanism, which is why "conflict detection"
(below) is stated once, as a single invariant, rather than once per race.

**Requirement:** every authoritative write must be conditioned on the ref
state it read (a compare-and-swap, not a blind write); a losing writer must
receive a structured conflict result distinct from both success and an
unrelated error, and must never have its losing attempt silently applied,
partially applied, or silently retried on the winner's behalf without the
caller's knowledge; a projection rebuild reading history concurrently with
an in-flight writer must observe either the pre- or post-write state
consistently, never an internally inconsistent mixture (extending `BB-06`'s
read-only-command requirement to the rebuild path, which is a bulk read, not
a single command invocation).

#### Divergence

**Threat:** two or more clones' local views of "shared" history disagree —
not from a simultaneous race (above), but from time passing: Clone A commits
and pushes; Clone B, holding an older fetch, later attempts a write based on
that stale basis; or Clone A and Clone B each accumulate local, unpushed
commits independently before either synchronizes, and by the time they do,
neither is a fast-forward of the other.

**Why it matters:** `BB-17` already specifies the caller-observable
requirement for one instance — a synchronization operation must never let an
external or coexisting system's lagging view silently overwrite Quest's own
more-advanced local state ("never a result where it silently overwrites the
more-advanced local state with an older external value"). Divergence between
two *Quest-authoritative* clones (not an external system) is this model's
addition: the same non-overwrite discipline must hold symmetrically between
any two clones of the same authoritative history, not only between Quest and
an external coexisting system.

**Requirement:** any operation about to advance a shared ref must first
observe that ref's current tip and detect whether its own basis is stale
before writing (reusing the same compare-and-swap contract as "Races,"
above — divergence and simultaneous races share one mechanism, differing
only in how much time separates the two writers' reads); a stale-basis write
must fail with a structured conflict, never force-overwrite or silently
rebase away the other side's committed history; a clone with unpushed local
commits that later synchronizes must reconcile explicitly (fast-forward if
possible, or a structured conflict if not) rather than assume its own local
history is uniquely authoritative.

#### Hostile paths

**Threat:** an untrusted string (a task title, an imported field, a migrated
identifier) is used, directly or after light transformation, to construct a
filesystem path or a subprocess argument. Concrete payload classes:
path-traversal segments (`../`), an absolute path where a relative one is
expected, embedded null bytes, shell metacharacters (`` ` ``, `$`, `;`,
quotes), and symlinks whose target resolves outside the intended workspace
root.

**Why it matters:** `BB-09` already specifies the caller-observable
requirement that non-ASCII and quoted/shell-metacharacter content round-trips
byte-for-byte and "no shell-metacharacter is ever interpreted (it is data,
never executed)," and that "no subprocess is spawned using the untrusted
string unescaped." `BB-10` covers the companion requirement for legitimately
nested subdirectory placement (enumerated exactly once, no parent-traversal
or flattening side effect) — this model separates *legitimate* nesting (see
"Subdirectories," below) from *hostile* path construction, since the two
require different defenses (validation for depth/enumeration versus
rejection for escape/injection).

**Requirement:** every path derived from untrusted input must be resolved
and checked to remain within the intended workspace root before any
filesystem operation touches it (rejecting or refusing to follow a
resolution that would escape, including through a symlink); no untrusted
string is ever interpolated into a shell command line — subprocess
invocation must pass untrusted values as discrete arguments, never through a
string the shell re-parses; a null byte or other filesystem-illegal byte in
an untrusted string is a structured validation error, not a source of
undefined behavior.

#### Encoding

**Threat:** a field accepts content (typed input, an imported record, a
migrated value) containing a byte sequence that is not valid UTF-8.

**Why it matters:** `BB-11` already specifies the caller-observable
requirement precisely: either a structured, specifically-named
encoding-error classification distinct from a generic error, or (if
accepted) byte-for-byte lossless preservation on read-back — "the scenario
forbids a third outcome, silent replacement or truncation reported as
success." This model adds only the underlying reason that third outcome is a
live risk: a naive read/re-encode/write round-trip (e.g., decoding as UTF-8
with a lossy replacement-character fallback, or re-encoding through a
locale-dependent codec) silently converts invalid bytes into a different,
valid-looking value with no error at all — the most dangerous outcome
because nothing signals it happened.

**Requirement:** as `BB-11` states — reject with a distinct classification,
or preserve losslessly; any code path that could silently substitute or drop
bytes on a decode/encode round-trip is itself a defect against this
invariant, independent of whether a specific scenario exercises it.

#### Case sensitivity

**Threat:** the same logical path or identifier, differing only in letter
case, behaves differently depending on which filesystem a given clone's
worktree sits on. This is general, publicly documented Git and filesystem
behavior, not sourced from Backlog.md, Opum, or any admitted/excluded QCLI
source: some filesystems are case-sensitive (most Linux filesystems), some
are case-preserving but case-insensitive by default (macOS APFS, Windows
NTFS as commonly configured) — Git itself documents and ships a
`core.ignorecase` configuration precisely because checkout, status, and diff
behavior differ across these; two paths differing only by case can check out
as one file colliding with itself on a case-insensitive filesystem while
remaining two distinct, non-conflicting files in the same commit's tree on a
case-sensitive one.

**Why it matters:** the task's own topology ("local worktrees and multiple
clones") means different actors' clones may sit on different filesystems for
the identical shared history. A design that relies on the checkout
filesystem to distinguish two canonical identities or paths (for example,
two canonical IDs that differ only by case) will appear to work for every
actor on a case-sensitive filesystem and silently collide, or checkout-fail,
for any actor on a case-insensitive one — a defect that is invisible in a
same-filesystem test run and only surfaces once the fleet is heterogeneous.

**Requirement:** canonical-ID uniqueness and path-to-record mapping must be
enforced by Quest's own comparison logic, independent of and never delegated
to the checkout filesystem's case behavior; two canonical identities or
paths that differ only by case must be treated as a conflict (rejected or
explicitly disambiguated) at the point of creation, not discovered later as
a checkout-dependent collision.

#### Subdirectories

**Threat:** a task or record is legitimately organized several directory
levels deep within the workspace (charter: task/event/workspace schemas; the
reconciliation doc's workspace-enrollment candidate names an explicit,
scoped enrollment boundary, not a flat one).

**Why it matters:** `BB-10` already specifies the caller-observable
requirement: nested placement is honored, a workspace-scoped enumeration
finds it "exactly once (not zero times, and not duplicated)," and a
canonical-ID lookup succeeds "regardless of nesting depth," with "no
parent-traversal or flattening side effect." Distinct from "Hostile paths"
above (which is about untrusted-input escape/injection), this threat is
about correctness for legitimate, deep, operator-authored nesting: an
enumeration or index that assumes a fixed or shallow depth silently drops or
duplicates records as nesting grows, with no attacker involved at all.

**Requirement:** workspace-scoped enumeration and canonical-ID lookup must
be correct at any nesting depth the workspace boundary permits, with no
depth-dependent silent omission or duplication, and no nesting depth is
itself grounds to flatten, relocate, or otherwise mutate a record's
placement as a side effect of an unrelated operation.

#### Repository removal

**Threat:** three distinct sub-cases. (a) a single worktree (not the whole
clone/shared storage) is removed while other worktrees or clones of the same
authoritative history remain; (b) the sole clone holding some local,
unsynchronized commits is destroyed, and no other clone or shared remote
ever received them; (c) removal is interrupted or partial — a `.git`
directory half-deleted, leaving a corrupted, neither-healthy-nor-empty local
repository.

**Why it matters:** the charter's "Sources of truth" makes only Git-tracked,
and by extension *synchronized*, history authoritative — "[a]ny graph/index
is derived, disposable... deterministically rebuildable" is explicitly about
the *local projection*, not about local-only unpushed Git commits, which are
a third tier this model must name explicitly: (i) authoritative, synchronized
history — safe by definition, recoverable from any other clone or the shared
remote after case (a); (ii) local-only committed-but-unsynchronized
history — exists only in one clone, genuinely lost if that clone is destroyed
before synchronizing (case (b)); (iii) the disposable local projection —
always safe to lose, by design, and never the sole record of anything. A
caller told an operation "succeeded" after only tier (ii) was reached,
followed by that clone's destruction, experiences a false-success report
that this model must not paper over.

**Requirement:** (1) removing a worktree that holds no unsynchronized
commits of its own must be fully safe — every other worktree/clone sees
identical, unaffected authoritative state, per the operation-owned-commits
and synchronized-history discipline above; (2) an operation must not report
success to its caller on the strength of tier (ii) alone if the system's own
definition of "durable" for that operation requires synchronization —
whatever that boundary is, it must be stated and honored consistently, not
left to accident; (3) unsynchronized local history that is destroyed before
ever reaching any other clone is, from every other actor's perspective,
indistinguishable from never having happened — no other actor may be
blocked waiting on it indefinitely, which is exactly what TTL-lease
reclamation already provides for a claim that never synchronizes (composes
with "Clocks and leases," above, and the glossary's Reclamation workflow,
"never rewrites the expired claim's history, only appends a new state");
(4) a corrupted, partially-removed local repository must be detected and
fail loud with a distinct classification, never silently treated as healthy
or as empty, and its documented recovery is a fresh clone from any other
clone or the shared remote — never an in-place partial repair that risks
fabricating history the local repository can no longer prove.

### Mutation invariants (AC2)

Five invariants, named verbatim from this task's acceptance criterion #2.
Each is stated once, independent of any single threat, because — as the
threat catalog above shows repeatedly — the same invariant defends against
several unrelated-looking threats.

#### INV-1 — Atomicity

**Statement:** a mutating operation's owned filesystem and Git effects
either all become visible together or none do; there is no observable
intermediate state between "not started" and "complete" for that operation's
own owned scope.

**Defends against:** Partial writes (directly); Dirty worktrees (an atomic
operation cannot partially absorb bystander state, because its owned scope
is fixed before it writes anything); Repository removal case (a) (a
worktree removed mid-operation leaves either nothing or everything of that
operation's own effect, never a partial trace for another worktree to trip
over).

#### INV-2 — Idempotency

**Statement:** invoking the same logical operation more than once for the
same logical request produces the same observable end state as invoking it
exactly once; a repeat invocation recognizes a prior success (by an
idempotency basis derived from or attached to the request) and returns that
prior result rather than re-applying the effect.

**Defends against:** Retries (directly); Duplicate events (directly —
idempotency is the positive requirement duplicate-event risk is the negative
image of); the resume-not-restart half of Partial writes (`BB-07`/`BB-08`);
the late-heartbeat case within Clocks and leases (`BB-02`, via
generation-scoped renewal, which is idempotency scoped to a specific lease
generation).

#### INV-3 — Conflict detection

**Statement:** an authoritative write is conditioned on the state it read (a
compare-and-swap against the target ref), never blind; when that condition
no longer holds at write time, the write is rejected with a structured
conflict result distinct from both success and an unrelated error — never
silently retried on the caller's behalf, never force-applied, and never
resolved by discarding the losing side's already-committed history.

**Defends against:** Races (directly, both the ground-level ref-update race
and every logical race riding on it — claims, aliases, gate evidence,
projection-rebuild-vs-writer); Divergence (directly — a stale basis is
exactly a failed compare-and-swap, differing from a race only in elapsed
time); Aliases hazard (b) (alias registration racing canonical-record
activity); the non-downgrade half of `BB-17` (an older external or lagging
value never silently overwrites newer authoritative state, because the
write that would do so fails the compare-and-swap).

#### INV-4 — Operation-owned staging and commits

**Statement:** an operation stages and commits exactly the paths it owns for
its own logical effect — determined before any write begins — and never a
working-tree-wide or index-wide catch-all; a commit's file list, inspected
afterward, contains exactly that operation's own files and nothing a
bystander left in the worktree.

**Defends against:** Dirty worktrees (directly, `BB-12`/`BB-13`); the
scoped-commit half of `BB-16`/`BB-17` (a synchronization operation's commits
touch exactly the records it updated, "every other task's file is
byte-identical before and after"); Repository removal case (c) (a corrupted
repository is easiest to detect and safely recover from — via a fresh
clone — precisely because no operation ever wrote outside its own declared
scope, so there is nothing operation-specific to reconcile beyond the
corrupted local copy itself).

#### INV-5 — Zero mutation from read-only commands

**Statement:** a command classified read-only (an inspection, a lookup, an
enumeration) performs no filesystem or Git mutation under any
circumstance — success path, not-found path, or error path alike —
regardless of what a concurrent writer is doing at the same time.

**Defends against:** the entirety of read-only purity (`BB-05`/`BB-06`,
directly); the read side of Races (a concurrent writer's in-flight mutation
must never be an excuse, or a mechanism, for a read-only command's own state
to change); implicitly, every other invariant's own verification — every
recovery check in this document and in `BB-01`–`BB-17` is itself expressed
as a read-only inspection, so this invariant is also a precondition for
every other invariant being *checkable* at all without the check itself
perturbing the system under test.

### Traceability

Every AC1 threat, its grounding, and the invariant(s)/scenario(s) that
address it.

| Threat (AC1) | Grounded in | Invariant(s) | Scenario(s) |
| --- | --- | --- | --- |
| Dirty worktrees | `BB-12`, `BB-13` | INV-4, INV-1 | TM-07 |
| Partial writes | `BB-07`, `BB-08`; Git's own atomic ref-update mechanism | INV-1, INV-2 | TM-01, TM-12 |
| Retries | `BB-02` (generalized) | INV-2 | TM-02 |
| Duplicate events | Glossary "Event" (Reconciliation candidate #1) | INV-2 | TM-02 |
| Aliases | `BB-14`, `BB-15`; Reconciliation candidate #10 | INV-3 | TM-11 |
| Clocks and leases | `BB-01`, `BB-02` | INV-2, INV-3 | TM-05, TM-06 |
| Races | `BB-15`, `BB-06` (generalized) | INV-3, INV-5 | TM-03, TM-11 |
| Divergence | `BB-17` (generalized) | INV-3 | TM-04 |
| Hostile paths | `BB-09`, `BB-10` | INV-1, INV-4 | TM-08 |
| Encoding | `BB-11` | INV-1 | TM-09 |
| Case sensitivity | General, publicly documented Git/filesystem behavior (not Backlog.md/Opum-derived) | INV-3 | TM-10 |
| Subdirectories | `BB-10` | INV-4 | TM-11 |
| Repository removal | Charter "Sources of truth"; Glossary "Reclamation" | INV-1, INV-2, INV-4 | TM-06 |

### Real-clone and fault-injection scenarios (AC3)

Independently authored. No prototype test layout, fixture, or algorithm was
opened to write these — no legacy Opum or Backlog.md source is admitted to
inform this task at all (see "Scope, grounding, and non-goals," above). Each
scenario specifies a real multi-clone or multi-worktree topology and an
injected fault against real Git operations (not a mocked or in-memory
simulation), the invariant(s) it exercises, and the read-only check that must
hold afterward — deliberately in a different shape from `BB-01`–`BB-17`'s
five-field caller-observable-behavior format, since these describe *how the
invariants above get exercised under real faults*, not a caller-facing
command contract.

**TM-01 — Kill mid-write, before commit**

- *Setup:* one real clone; a mutating operation begins writing its owned
  files/index entries.
- *Fault:* the process receives an unrecoverable signal (e.g., `SIGKILL`)
  after the first owned file is written but before the owning commit is
  created.
- *Required outcome:* no commit for this operation exists in history; a
  read-only inspection shows either none of the operation's intended files
  changed, or the operation's own partial artifacts are recognizable as its
  own incomplete attempt (never mistaken for a bystander's unrelated dirty
  state).
- *Verification:* re-invoking the same operation completes successfully and
  reaches the same end state a single clean run would (INV-1, INV-2);
  `git status --porcelain` before the retry shows only this operation's own
  recognizable partial trace, never a change to any unrelated path.

**TM-02 — Kill after commit, before caller receives the result**

- *Setup:* one real clone; a mutating operation's commit is created and
  lands.
- *Fault:* the process is killed after the commit's ref update succeeds but
  before the success result is returned to the caller.
- *Required outcome:* the caller, observing no response, retries the
  identical logical request.
- *Verification:* history contains exactly one event for the logical
  request (`git log` shows one commit for it, not two); the retry's own
  read-only inspection recognizes the prior commit and returns the same
  result rather than appending a second one (INV-2, defends the Duplicate
  events threat).

**TM-03 — Two real clones race the same claim**

- *Setup:* two independent real clones of the same repository, both fetched
  to the same starting tip, sharing one remote.
- *Fault (none injected; the race is the scenario):* both clones' claim
  operations run concurrently, each reading "unclaimed" before either has
  pushed.
- *Required outcome:* both attempt to push their claim commit; exactly one
  push succeeds as a fast-forward, the other is rejected as a
  non-fast-forward update.
- *Verification:* the rejected clone's operation reports a structured
  conflict, not a success and not an unrelated error (INV-3); after the
  losing clone fetches, its own read-only inspection shows the winner as
  sole current holder — never two divergent local branches each believing
  itself the winner.

**TM-04 — Stale-basis write after unnoticed remote advance**

- *Setup:* two real clones, A and B, sharing one remote; both start at the
  same tip.
- *Fault:* A commits and pushes, advancing the remote; B, without
  re-fetching, attempts an unrelated mutating operation based on its now-
  stale local tip.
- *Required outcome:* B's push is rejected (its basis is not an ancestor of
  the remote's new tip).
- *Verification:* B's operation surfaces a structured conflict and does not
  silently rebase, force-push, or otherwise cause A's already-pushed commit
  to disappear from the remote (INV-3); after B fetches and reconciles, both
  A's and B's effects are present in history, or B's is explicitly
  re-attempted — never silently dropped.

**TM-05 — Injected clock skew across the lease-evaluating clones**

- *Setup:* two real clones on two machines (or two processes with
  independently overridable system/process clocks) sharing history; clone A
  establishes a lease.
- *Fault:* clone B's clock is set several minutes ahead of clone A's before
  B evaluates the lease's expiry.
- *Required outcome:* B's live expiry check and a fresh full-history
  projection rebuild on B agree with each other (per `BB-01`'s
  internal-consistency requirement, now under real injected skew rather than
  a same-clock assumption); if B's skew is large enough to flip the
  held/expired status relative to what A itself would compute at the same
  real-world instant, that disagreement is surfaced as a named anomaly.
- *Verification:* no silent, unannounced resolution in either evaluator's
  favor (INV-3); the projection rebuild and the live check never disagree
  with each other on the same clock, even though they may (correctly, and
  visibly) disagree with a differently-skewed peer.

**TM-06 — Worktree/clone destroyed while holding a lease**

- *Setup:* two real clones sharing a remote; clone A claims a task,
  establishing a lease, and pushes.
- *Fault:* clone A's entire working directory (including `.git`) is deleted
  before A ever releases the claim or renews past its TTL.
- *Required outcome:* clone B, once the lease's TTL has elapsed, can reclaim
  the task without any cooperation from A (which no longer exists) and
  without needing to distinguish "A crashed" from "A is slow" from "A's
  clone was deleted" — all three are observably identical to B.
- *Verification:* B's reclamation appends a new claim event without
  rewriting A's original claim event (INV-1, per the glossary's Reclamation
  term); a subsequent read-only inspection from any third clone shows B as
  current holder and A's original claim intact in history, not erased
  (defends Repository removal case (b), composed with Clocks and leases).

**TM-07 — Dirty worktree plus a crash mid-operation**

- *Setup:* one real clone with a pre-existing, unrelated uncommitted
  modification (a dirty tracked file, plus an untracked file) — as
  `BB-12`/`BB-13`'s precondition, but here the operation additionally
  crashes.
- *Fault:* the mutating operation stages its own owned file, then is killed
  before committing.
- *Required outcome:* on the next invocation (retry or an unrelated recovery
  pass), the pre-existing unrelated dirty tracked file and untracked file
  remain exactly as they were before the crash — not staged, committed,
  reset, or stashed by either the crashed attempt or its recovery.
- *Verification:* `git status --porcelain` after recovery shows the
  identical unrelated dirty state as before the crash, plus either nothing
  else (if recovery discarded the operation's own partial state) or the
  operation's completed effect (if recovery resumed it) — INV-1 and INV-4
  composed.

**TM-08 — Hostile path payloads against a real checkout**

- *Setup:* one real clone; an operation accepts an untrusted string destined
  to become part of a path or a subprocess argument.
- *Fault (adversarial input, not a process fault):* the string contains, in
  separate trials, a `../` traversal segment, an absolute path, an embedded
  null byte, shell metacharacters (`` ` ``, `$()`, `;`), and — where the
  operation follows filesystem entries — a symlink whose target resolves
  outside the workspace root.
- *Required outcome:* every trial either is rejected with a structured
  validation error before any filesystem write, or is accepted and
  stored/executed only as inert data — never as a path component that
  escapes the workspace root and never as shell-interpreted content.
- *Verification:* after each trial, a real filesystem scan outside the
  workspace root shows no new or modified file attributable to the trial
  (INV-1, INV-4); no subprocess invocation log (however the implementation
  would observe this) shows the payload having been passed through a shell.

**TM-09 — Non-UTF-8 bytes injected directly on disk**

- *Setup:* one real clone; a record's on-disk content is modified directly
  (bypassing any Quest write path, simulating a hostile or corrupted
  upstream import) to contain a byte sequence that is not valid UTF-8.
- *Fault:* a Quest read-only inspection command then reads that record.
- *Required outcome:* per `BB-11`, either a structured, specifically-named
  encoding-error result, or lossless byte-for-byte read-back — never silent
  replacement/mojibake reported as an ordinary successful read.
- *Verification:* the read-only command performs zero mutation regardless
  of which branch it takes (INV-5, composed with the Encoding threat); a
  subsequent read of the same record is stable (same classification or same
  bytes), not flapping between runs.

**TM-10 — Case-folding collision across two real filesystems**

- *Setup:* two real clones of the same repository, one checked out on a
  case-sensitive filesystem, one on a case-insensitive-but-preserving
  filesystem (or `core.ignorecase` forced to the opposite of the
  filesystem's native behavior, to make the divergence deterministic and
  reproducible rather than dependent on which machine happens to run the
  check).
- *Fault:* an operation on the case-sensitive clone creates two canonical
  records whose paths or IDs differ only by case.
- *Required outcome:* the case-insensitive clone's checkout of the same
  commit either fails loud with a distinct, named error, or the creating
  operation itself is rejected before ever reaching that state — never a
  silent single-file collision on the case-insensitive side with no error
  anywhere.
- *Verification:* Quest's own canonical-ID comparison (not the filesystem's)
  is what determines whether the two records were ever allowed to coexist,
  verified identically regardless of which clone's filesystem performs the
  check (INV-3, defends Case sensitivity).

**TM-11 — Concurrent subdirectory placement and alias registration**

- *Setup:* two real clones sharing a remote; one is about to create a
  canonical record nested several subdirectory levels deep, the other is
  about to register an alias intended to resolve to that same nested record
  once it exists.
- *Fault (a genuine race, not a process fault):* both operations run
  concurrently, each unaware of the other's in-flight write.
- *Required outcome:* the two writes are ordered by the same
  compare-and-swap mechanism as any other race (TM-03); whichever lands
  second either succeeds cleanly against the now-updated tip (if the two
  effects are independent) or is rejected with a structured conflict (if the
  alias registration depended on the record's existence and raced its
  creation).
- *Verification:* a workspace-scoped enumeration afterward finds the nested
  record exactly once regardless of nesting depth (`BB-10`, INV-4); no
  alias resolves to two different canonical records, and no canonical
  record has two conflicting alias registrations silently coexisting
  (INV-3).

**TM-12 — Write failure partway through a multi-file staging operation**

- *Setup:* one real clone, constrained so a filesystem write partway through
  a multi-file operation fails (e.g., a target directory made read-only
  after the operation's first file write, or an injected
  `ENOSPC`-equivalent condition on a scratch/constrained filesystem).
- *Fault:* the second of three files an operation needs to stage fails to
  write.
- *Required outcome:* the operation reports a structured error; none of the
  three files is committed (not even the one that wrote successfully) — the
  operation's owned scope is all three files together, not each file
  independently.
- *Verification:* `git status --porcelain` shows no new committed change
  from this attempt; after the constraint is lifted, retrying the identical
  operation succeeds and reaches the same end state a single unconstrained
  run would have (INV-1 and INV-2 composed — this scenario is the
  end-to-end tie between atomicity, idempotency, and the Partial writes and
  Retries threats).

### Independence and verification

This document opened no Backlog.md implementation source or internal tests,
the local Backlog.md clone, any Quarantined legacy Opum artifact, or the
Deferred `jeremy-newhouse/opum-engine` prototype surfaces. It cites no
Backlog.md behavior claim anywhere — Backlog.md migration fidelity is
`QCLI-2.5`'s territory, out of scope here. Every threat and invariant above
is grounded either in this repository's own already-admitted documents (the
charter, the migration ledger, the research program Spec, and
`QCLI-2.2`/`QCLI-2.3`/`QCLI-2.4`'s deliverables, all cited read-only) or,
where named explicitly, in Git's and mainstream filesystems' own publicly
documented cross-platform behavior — never in any prototype test, fixture,
source file organization, or algorithm. No source that would supply a
specific locking mechanism, file layout, merge algorithm, or schema was
consulted, consistent with this task's own instruction to derive
requirements "without selecting a physical storage design." No product
source, runtime dependency, or executable scaffolding was added by this
document.

## Notes

This task read the component charter, the migration ledger, the research
program Spec, and `QCLI-2.2`'s, `QCLI-2.3`'s, and `QCLI-2.4`'s deliverables —
all in this repository, all cited read-only, none edited. It opened no
Backlog.md implementation source or internal tests, no legacy Opum
implementation source, no artifact classified Quarantined by the source
register, and no `lore-cli` Backlog.md-corpus document. It did not edit the
source register or the migration ledger (owned this wave by `QCLI-2.12`),
the pre-implementation research program Spec or the Lore dependency and
adapter contract evidence document (owned this wave by `QCLI-2.14`), or any
other sibling task's output document. It made no repository, package,
release, or remote mutation, and no external clone (`opum-doc`, `quest-doc`,
`lore-cli`, `lore-doc`) was read or cited — every ground for this document's
threats and invariants is this repository's own admitted material or Git's
own publicly documented behavior, so no moving external reference and no
recheck clause applies (see "Scope, grounding, and non-goals," above).
