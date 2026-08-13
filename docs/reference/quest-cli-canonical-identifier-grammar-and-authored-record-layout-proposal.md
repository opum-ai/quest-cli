---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI canonical identifier grammar and authored-record layout proposal
tags:
  - quest
  - cli
  - identity
  - identifiers
  - grammar
  - record-layout
  - proposal
  - decisions
summary: "Non-normative proposal for owner ruling on register entry D4: a canonical identifier grammar, its Unicode/case-folding rules across two real filesystems, and the authored-record layout it implies."
timestamp: 2026-08-05T15:29:37.776Z
---

# Quest CLI canonical identifier grammar and authored-record layout proposal

This Reference is `QCLI-19`'s deliverable: **a proposal, for owner ruling, of the
canonical identifier grammar and the authored-record layout it implies** — register
entry D4 in the
[open component decisions register](quest-cli-open-component-decisions.md), left
resolved by no document in the research campaign. **Nothing in this document is
accepted.** No ADR is created here, no register entry is edited here, and the register
itself remains the authority on D4's status until a separate reconciliation pass acts
on an owner's ruling.

**Ratified — 2026-08-05 (`QCLI-25`).** The component owner has since ruled on register
entry D4. [Adopt a T-prefixed canonical identifier grammar and its authored-record
layout](../adr/adopt-a-t-prefixed-canonical-identifier-grammar-and-its-authored-record-layout.md)
is the accepted ADR that closes it. The "nothing in this document is accepted" framing
above no longer holds; it is preserved here unedited, as the proposal that ADR rules on,
per this project's inline-supersession convention.

It is grounded in, and does not restate or reopen, four already-admitted records: the
accepted
[migration ADR](../adr/migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar.md)
(Quest declines to inherit Backlog.md's project-configurable prefix, zero-padding, and
dot-suffixed hierarchy — settled, not reopenable here); the accepted
[lease ADR](../adr/bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md)
("exactly one lease exists per canonical task, system-wide — not one per identifier
form"); the
[Git, filesystem, and concurrency threat model](quest-cli-git-filesystem-and-concurrency-threat-model.md)
(its "Aliases", "Case sensitivity", and "Subdirectories" threats, and scenarios `TM-10`
and `TM-11`); and the
[functional requirements](../specs/quest-cli-functional-requirements.md) rows
`FR-IDENT-3`, `FR-IDENT-4`, `FR-IDENT-6`, `FR-IDENT-7`, `FR-IDENT-8`, `FR-MIG-2`, and
`FR-MIG-7`. All four are cited read-only. This document is the owning
[Story](../stories/follow-through-on-the-quest-cli-design-layer.md)'s proposal for "the
canonical identifier grammar," one of its three Phase 1 proposal deliverables.

## Details

### The five settled constraints this proposal must satisfy

Named in `QCLI-19`'s own description and traced above to the corpus that actually
settled each one. None of the five is reopened here; each is treated as a fixed test
the grammar below must pass.

1. Quest does not inherit Backlog.md's project-configurable prefix, zero-padding, or
   dot-suffixed hierarchy (accepted migration ADR).
2. A task has one canonical identity; aliases resolve to it and never constitute a
   second identity (`FR-IDENT-3`; `BB-14`; threat model, "Aliases").
3. Identifier uniqueness is enforced by Quest's own comparison logic, never delegated
   to filesystem case behaviour, because that differs across platforms and would make
   identity platform-dependent (`FR-IDENT-4`; threat model, "Case sensitivity"; `TM-10`).
4. Exactly one lease exists per canonical task, system-wide, not one per identifier
   form (lease ADR).
5. Migration maps on the pair of source folder and source identifier, and must be
   reversible (migration ADR property 2; `FR-MIG-2`).

### Alternatives considered

**A — An opaque, generated identifier (UUID v4 or ULID).** Trivially unique without a
shared counter or coordination, and if restricted to lowercase hex it has no case to
fold at all. Rejected as the primary form: a 32+ character opaque token is hostile to
the exact place this identifier is used most — typed by a human into a CLI, pasted into
a commit message, read aloud in review. It does not fail any of the five constraints,
but it fails the document's own implicit purpose (a *canonical* identifier a caller can
use) worse than any option that passes all five.

**B — A slug derived from the task's title.** Human-readable without a counter or a
prefix. Rejected outright: a title is content, not identity. It is exactly the source of
the hazards constraint 3 and the Unicode/case-folding requirement exist to name —
two titles differing only in case or in accent composition, or two authors choosing the
same title — and it is unstable: editing a title after creation would either change the
identifier (breaking every existing reference and lease key) or require silently
decoupling the "identity" slug from the current, editable title, which reintroduces
exactly the two-identities-for-one-task hazard constraint 2 forbids.

**C — Backlog.md's own grammar (project-configurable prefix, zero-padding,
dot-suffixed hierarchy), used as-is or lightly reskinned.** Not a live alternative —
constraint 1 forecloses it, and the migration ADR already gives the reason: "Inheriting
it would import a stranger's configuration into Quest's own domain model permanently."
Listed here only so the option is visibly considered and visibly rejected, not silently
absent.

**D — Recommended: a fixed (non-configurable) short literal prefix plus a flat,
unpadded, monotonically increasing decimal sequence, drawn from a single global
counter, in a restricted ASCII alphabet with one fixed canonical case.** Human-typable
like the familiar short-ID ergonomics, while each of the three axes constraint 1 names
is concretely absent: the prefix is a fixed literal the grammar itself defines (not a
per-project configuration value), the sequence carries no zero-padding, and the
namespace is flat (no dot-suffixed parent.child hierarchy). Restricting the alphabet to
ASCII removes Unicode normalisation as a hazard for the identifier itself (detailed
below), and a single *global* counter — scoped to the whole canonical-task namespace,
never per subdirectory or per lifecycle state — avoids the specific defect the migration
ADR found in Backlog.md ("identifier counters are not global... promoting, archiving,
and demoting free and reassign numerals independently"). Allocating the next sequence
number is itself an authoritative Git write and needs no new coordination primitive: it
is a compare-and-swap against the same ref-update mechanism already accepted for claims
in
[Coordinate through Git compare-and-swap without a central arbiter](../adr/coordinate-through-git-compare-and-swap-without-a-central-arbiter.md),
applied to a new purpose rather than requiring one.

### Recommended grammar

```
canonical-id  := prefix "-" sequence
prefix        := ASCII-letter , 0*4( ASCII-letter )   ; fixed literal; not project-configurable
sequence      := non-zero-digit , *digit              ; decimal; no leading zeros; no zero-padding
```

The literal prefix shown in examples below (`T-142`, `T-1337`) is illustrative only —
picking the actual literal is exactly the kind of narrow, non-technical choice this
document leaves to the owner (see "What the owner is asked to rule on"). What is
recommended is the *shape*: fixed literal, unpadded decimal, flat namespace, single
global counter, ASCII-only, one fixed canonical case (this proposal suggests
upper-case, e.g. `T`, purely for legibility against lower-case prose; not load-bearing).

**Aliases** are a deliberately broader grammar than the canonical form, because
constraint 2 requires aliases to admit whatever a migrated or coexisting scheme already
used (Backlog.md's own dot-suffixed, zero-padded, prefixed identifiers among them) without
promoting any of them to a second canonical identity:

```
alias := 1*char                                       ; any non-empty Unicode string
```

An alias is never itself parsed against the `canonical-id` grammar above; it is looked
up in the alias-resolution step (see "Authored-record layout", below) and, on a match,
resolves to exactly one canonical-id before any further processing — including before
any claim, lease, or gate check, per the threat model's own requirement that "alias
resolution must happen *before* any claim/lease/gate check, never after."

### How the recommendation satisfies each settled constraint

1. **Non-inheritance.** The prefix is a single literal the grammar itself fixes, never a
   per-project configuration value; the sequence carries no zero-padding; the namespace
   is flat, with no dot-suffixed parent-child hierarchy. All three axes the migration ADR
   names are concretely absent, not merely renamed.
2. **One canonical identity; aliases resolve, never duplicate.** The `alias` grammar is
   syntactically disjoint from — and never validated against — the `canonical-id`
   grammar. An alias is a pointer, stored beside the one canonical record it names (see
   below), and alias resolution is the *first* step of any operation, so nothing
   downstream of it — a claim, a lease, a gate — ever observes an alias as anything but
   the canonical record it resolves to.
3. **Uniqueness by Quest's own logic, never the filesystem's.** Creating a canonical-id
   requires Quest to enumerate every existing record (see "Enumeration", below) and
   compare each discovered id's *folded* form (not its raw bytes, and never "does this
   path already exist on disk") against the candidate's folded form; a match is rejected
   before any file is written. Because the alphabet is ASCII-only and the fold applied is
   defined independently of any filesystem, the same yes/no answer is produced whether
   the check runs on a case-sensitive or a case-insensitive clone — see "Unicode
   normalisation and case-folding", below, for the fold itself and the `TM-10` case in
   particular.
4. **Exactly one lease per canonical task, system-wide.** Because a task has exactly one
   authoritative file (see "Authored-record layout", below) named by its canonical-id's
   fixed-case form, and every access path — the canonical id typed directly, the same id
   in a different case, or any alias — resolves through the same fold-then-lookup step to
   that one file before a lease is read or written, there is structurally one place a
   lease can live for a given task. "One per identifier form" is not a state this grammar
   can even represent, because no identifier form other than the single canonical,
   folded key is ever used as a lease key.
5. **Migration mapping on (source folder, source identifier), reversible.** Canonical ids
   under this grammar are minted fresh from Quest's own global counter at migration time
   and never derived from, or required to encode, the source folder or source identifier
   in any way. The already-settled reversible map — keyed on the *pair* precisely because
   a source identifier alone is not unique (the migration ADR's own finding: "a
   same-identifier collision across the active and archive boundary is invisible to every
   enumerated Backlog.md command") — needs nothing from this grammar beyond a fresh,
   collision-free target id per source record, which a global (never per-folder) counter
   gives it by construction. Two source records sharing an identifier in different
   folders simply receive two different canonical ids; the ambiguity that made the bare
   identifier insufficient cannot reappear inside Quest's own namespace.

### Unicode normalisation and case-folding behaviour

Two different strings are compared, never two raw byte sequences and never "does the
filesystem consider these the same path":

- **Canonical ids.** The grammar's alphabet is restricted to ASCII letters, ASCII digits,
  and a single ASCII hyphen. Unicode normalisation (NFC vs. NFD) is therefore a **non-issue
  for the identifier itself** — there is no code point in the grammar with more than one
  normalised representation. Case-folding is still specified explicitly, for two reasons:
  defence in depth (nothing prevents a caller from typing a canonical id in the wrong
  case), and because the *filenames* that carry canonical ids (see below) are exactly the
  path components `TM-10` puts under test. The fold applied is ASCII case-folding to a
  single fixed case (this proposal's convention: fold to upper-case) — sufficient because
  the alphabet excludes every code point where ASCII folding and full Unicode folding
  would disagree (e.g. German `ß`, Turkish dotted/dotless `I`).
- **Aliases and any other free-text identity-adjacent string** (a migrated Backlog.md
  identifier, a hand-registered nickname) are **not** restricted to ASCII, so both steps
  of Unicode's own default caseless-matching recipe apply, in order: normalise to **NFC**,
  then apply **Unicode default case folding** (the full `CaseFolding.txt` mapping, not a
  naive ASCII lowercase) to produce the comparison key. The author's original spelling
  and normalisation form is preserved for display; only the derived key is ever compared,
  stored as a lease key, or checked for collision.
- **The cross-filesystem collision case, `TM-10`.** Two real clones of the same
  repository, one on a case-sensitive filesystem and one on a case-preserving-but-
  case-insensitive one; a creating operation on the case-sensitive clone is asked to mint
  two canonical records whose ids (and, by the naming scheme below, whose filenames)
  differ only by case. This proposal's creation-time check (constraint 3, above) folds
  every candidate and every existing id to the same fixed case *before* comparing, using
  Quest's own comparison logic — never a filesystem existence check — so the second
  creation is rejected identically on either clone, before either filesystem is ever asked
  to resolve the resulting path. `TM-10`'s required outcome is satisfied by construction
  for anything created through Quest: the "creating operation itself is rejected before
  ever reaching that state" branch, not the "checkout fails loud" branch. The second
  branch remains the fallback this proposal still requires for a record that reaches that
  state some other way (a manual edit outside Quest, or a pre-Quest migrated file): a
  sync, checkout, or enumeration pass that discovers two files whose folded canonical ids
  collide must report a **structured, named conflict** distinct from success — never
  silently present one file as if the other did not exist, and never silently merge them.
  This is the same discipline `INV-3` (conflict detection) already requires for a losing
  compare-and-swap, applied to a collision discovered by enumeration instead of by a
  rejected ref update.
- **Case differences that are *not* an identity hazard.** Two organisational subdirectory
  names differing only by case (e.g. an author's `Sprint-1/` versus another's
  `sprint-1/`) are an ordinary, harmless filesystem quirk under this proposal, *because*
  directory names carry no identity meaning (see below) — Quest's canonical-id lookup
  never uses a directory path as part of a record's identity or uniqueness key, so two
  differently-cased directories holding unrelated files never becomes a canonical-id
  collision. Only the leading token of the filename itself is identity-bearing, and that
  token is exactly the canonical id this section already covers.

### Authored-record layout and naming scheme

One Git-tracked file is the sole authoritative record for a canonical task, consistent
with "Git-tracked authored records are authoritative" in the
[component charter](quest-cli-component-charter.md). Its filename is anchored on the
canonical id in fixed case, optionally followed by a separator and a free-text, purely
informational slug that is never re-validated against the current title and never
treated as identity-bearing:

```
<canonical-id>[ - <informational-slug>].md
```

e.g. `T-142 - Fix the login redirect loop.md`. Renaming a task's title never requires
renaming its file and never changes its canonical id; the slug may drift from the
current title with no correctness consequence, because only the leading `<canonical-id>`
token is ever parsed for identity.

**Placement.** Records may be organised under arbitrary, author-chosen subdirectories to
any depth (grouped by epic, sprint, component, or any other convention an author picks).
Directories carry **no identity meaning whatsoever** — they are purely organisational,
exactly as the threat model's "Subdirectories" threat and `BB-10`/`TM-11` already require
("no parent-traversal or flattening side effect" as a consequence of nesting; a
canonical-id lookup that "succeeds regardless of nesting depth"). Nothing about creating,
moving, or renesting a task folder is itself a legitimate reason to alter a record's
canonical id or its filename's leading token.

**Aliases** are stored **co-located inside the one canonical record they name** — a field
on that same authoritative file — never in a second, free-standing authoritative index
that could drift out of sync with the record it maps to. There is exactly one place that
can assert "this string resolves to this canonical task," and it lives beside the
identity it defines. A derived, disposable, rebuildable local projection (the same
"rebuildable local projection, freshness, recovery, and scale" concept the charter
already names) may cache the canonical-id/alias space for lookup performance; this
proposal takes no position on whether such a cache exists, what it is keyed by beyond
the folded key already defined above, or how it is sized — that is register entry D5
(scale target), untouched by this task.

### Enumeration: exactly once across nested subdirectories

A workspace-scoped enumeration (`BB-10`) must find every legitimate record exactly once
— "not zero times, and not duplicated" — at any nesting depth the workspace permits, with
no depth-dependent omission or duplication (`TM-11`). The recommended algorithm:

1. Walk the task root recursively, to unbounded depth, **never following symlinks**
   (a symlink cycle or a symlink aliasing one physical file at two logical paths is
   exactly the kind of hazard that would double-count a single record without any
   canonical-id ambiguity at all).
2. For each regular file encountered, attempt to match the `canonical-id` grammar
   anchored at the start of the filename (before any ` - ` separator or the `.md`
   extension). A file whose name does not begin with a syntactically valid canonical id
   is not a task record and is skipped.
3. Fold every matched candidate id to its fixed canonical case (as defined above) and use
   the folded value — never the file's path — as the join key for the enumeration result.
4. If two distinct physical files fold to the same key, this is a **structured conflict**,
   reported as such — never silently deduplicated, never resolved by picking whichever
   file the walk order happened to visit first, and never merged. The enumeration for a
   tree in that state reports the conflict as its result, rather than a record count that
   silently omits or double-counts.

Because the join key is the folded canonical id rather than the path, a legitimate record
appears in the result exactly once regardless of how many subdirectory levels separate it
from the task root — nesting changes only *where* the file is found, never *what* its key
resolves to — and the only way two entries could ever collide on that key is the create-
time collision constraint 3 already forbids, which enumeration here treats as a conflict
rather than a silent merge.

### What this proposal deliberately leaves open

- **The literal prefix string.** Illustrative only (`T` above); the owner may choose any
  fixed literal without changing the grammar's shape.
- **Whether a migrated source identifier is automatically registered as an alias.** A
  migration-design call this proposal does not make; it only establishes that aliases —
  however they come to be registered — are syntactically unconstrained Unicode strings
  resolved via NFC-plus-default-case-fold, co-located with the canonical record they name.
- **The exact persisted shape of the global sequence counter** (a file, a derived value,
  or something else) beyond that its allocation is a Git compare-and-swap write, per the
  already-accepted coordination ADR.
- **Register D5 (scale target) and any storage or index engine** a cache over this
  layout might use.
- **Register D7a (archival and retention)** — whether an archived task keeps, reuses, or
  retires its canonical-id slot is a separate, explicitly open decision this proposal does
  not prejudge.
- **Concrete lease and heartbeat timing parameters** — already, and deliberately, left
  open by the lease ADR; unaffected by anything proposed here.

### What the owner is asked to rule on

1. Accept, reject, or amend the recommended grammar **shape** — fixed literal prefix,
   unpadded flat decimal sequence, single global counter, ASCII-only alphabet, one fixed
   canonical case — against the alternatives considered above.
2. Choose the actual literal prefix, if the shape is accepted.
3. Accept, reject, or amend the recommended authored-record layout: one file per
   canonical task, filename anchored on the canonical id with an optional
   non-identity-bearing slug, identity-free subdirectories, and alias data co-located on
   the canonical record rather than in a separate index.
4. Accept, reject, or amend the Unicode-normalisation-plus-case-folding rules above,
   including the ASCII-fold-suffices argument for canonical ids and the
   NFC-plus-default-case-fold rule for aliases.

A ruling here is the input a separate, later pass needs to reconcile register D4 (and,
if the owner accepts a shape, to author the corresponding ADR) — neither of which this
task performs.
