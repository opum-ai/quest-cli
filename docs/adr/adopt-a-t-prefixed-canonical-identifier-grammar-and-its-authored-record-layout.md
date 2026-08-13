---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Adopt a T-prefixed canonical identifier grammar and its authored-record layout
tags:
  - quest
  - cli
  - identity
  - identifiers
  - grammar
  - record-layout
  - decisions
summary: "Canonical Quest task ids are T-prefixed, unpadded ASCII decimal sequences from one global counter; one Git-tracked file per task is the sole record, with aliases co-located on it."
timestamp: 2026-08-05T22:52:51.123Z
---

# Adopt a T-prefixed canonical identifier grammar and its authored-record layout

## Status

Accepted. This record ratifies a live owner ruling; it does not restate an already-settled
research finding the way most of this ADR log's other records do.

Register entry D4 (canonical ID grammar) was still open after the research campaign.
[`QCLI-19`'s proposal](../reference/quest-cli-canonical-identifier-grammar-and-authored-record-layout-proposal.md)
recommended a grammar shape, an authored-record layout, and Unicode-normalisation-plus-
case-folding rules, but was explicit that "nothing in this document is accepted" and that no
ADR or register edit follows from it directly. The component owner ruled on that proposal in
a live session on 2026-08-05; the ruling is captured in the
[Ratify the Quest CLI Phase 1 component decisions](../stories/ratify-the-quest-cli-phase-1-component-decisions.md)
Story, which cites the live session (not a transcript) as the record of the ruling. This ADR
is that ruling, made durable: `QCLI-19`'s proposal is this ADR's origin and rationale;
that Story is this ADR's provenance for the fact and content of the ruling.

## Context

`QCLI-19`'s proposal is grounded in, and this ADR does not restate, four already-admitted
records: the accepted
[migration ADR](migrate-from-backlog-md-reversibly-without-inheriting-its-id-grammar.md)
(Quest declines to inherit Backlog.md's project-configurable prefix, zero-padding, and
dot-suffixed hierarchy); the accepted
[lease ADR](bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md)
("exactly one lease exists per canonical task, system-wide — not one per identifier form");
the
[Git, filesystem, and concurrency threat model](../reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
(its "Aliases", "Case sensitivity", and "Subdirectories" threats, and scenarios `TM-10` and
`TM-11`); and the
[functional requirements](../specs/quest-cli-functional-requirements.md) rows `FR-IDENT-3`,
`FR-IDENT-4`, `FR-IDENT-6`, `FR-IDENT-7`, `FR-IDENT-8`, `FR-MIG-2`, and `FR-MIG-7`.

The proposal weighed four options for the identifier itself: an opaque generated id (UUID
v4 or ULID), rejected as hostile to a human typing, pasting, or reading it aloud; a
title-derived slug, rejected because a title is content, not identity, and is exactly the
source of the case/composition collision hazard the grammar exists to foreclose; Backlog.md's
own grammar as-is, foreclosed outright by the accepted migration ADR; and the recommended
shape below, which satisfies all five constraints the migration ADR, lease ADR, threat model,
and functional requirements already settle, while staying human-typable.

## Decision

**The recommended grammar shape, authored-record layout, and Unicode/case-folding rules in
`QCLI-19`'s proposal are accepted as proposed, with the literal prefix fixed as `T`.
Register entry D4 is closed.**

### Canonical identifier grammar

```
canonical-id  := prefix "-" sequence
prefix        := "T"                                  ; fixed literal, not project-configurable
sequence      := non-zero-digit , *digit               ; decimal; no leading zeros; no zero-padding
```

- **Fixed literal prefix, `T`.** Not a per-project configuration value; the same literal for
  every Quest installation. Example: `T-142`, `T-1337`.
- **Flat, unpadded decimal sequence.** No zero-padding, no dot-suffixed parent-child
  hierarchy — the namespace is flat.
- **Single global counter.** Scoped to the whole canonical-task namespace, never per
  subdirectory or per lifecycle state, so promoting, archiving, or demoting a task never
  frees or reassigns a numeral independently (the specific defect the migration ADR found in
  Backlog.md).
- **ASCII-only alphabet.** ASCII letters, ASCII digits, and a single ASCII hyphen. Unicode
  normalisation (NFC vs. NFD) is a non-issue for the identifier itself — no code point in the
  grammar has more than one normalised representation.
- **One fixed canonical case.** Canonical ids fold to a single fixed case (upper-case, matching
  the literal prefix `T`) before any comparison, creation-collision check, or lookup —
  Quest's own comparison logic, never filesystem case behaviour.

Aliases remain a deliberately broader, syntactically disjoint grammar — `alias := 1*char`, any
non-empty Unicode string — never itself parsed against `canonical-id`, resolved to exactly one
canonical id before any claim, lease, or gate check.

### Authored-record layout

- **One Git-tracked file is the sole authoritative record for a canonical task**, consistent
  with
  ["Git-tracked authored records are authoritative"](treat-git-tracked-authored-records-as-the-sole-authority.md).
- **Filename anchored on the canonical id in fixed case**, optionally followed by a separator
  and a free-text, purely informational slug that is never re-validated against the current
  title and never treated as identity-bearing: `<canonical-id>[ - <informational-slug>].md`
  (e.g. `T-142 - Fix the login redirect loop.md`). Renaming a task's title never requires
  renaming its file and never changes its canonical id.
- **Identity-free subdirectories.** Records may be organised under arbitrary, author-chosen
  subdirectories to any depth; directories carry no identity meaning. A canonical-id lookup
  succeeds regardless of nesting depth, and nesting, moving, or renesting a task folder is
  never a legitimate reason to alter a record's canonical id or its filename's leading token.
- **Alias data is co-located on the canonical record it names** — a field on that same
  authoritative file — never in a second, free-standing authoritative index that could drift
  out of sync with the record it maps to. A derived, disposable, rebuildable local projection
  may cache the canonical-id/alias space for lookup performance; this ADR takes no position on
  whether such a cache exists, what it is keyed by beyond the folded key defined below, or how
  it is sized (register entry D5, untouched by this ADR).

### Unicode normalisation and case-folding

- **Canonical ids.** ASCII case-folding to the single fixed case above. Sufficient because the
  grammar's alphabet excludes every code point where ASCII folding and full Unicode folding
  would disagree (e.g. German `ß`, Turkish dotted/dotless `I`).
- **Aliases and other free-text identity-adjacent strings** (a migrated Backlog.md identifier,
  a hand-registered nickname) are not restricted to ASCII: normalise to **NFC**, then apply
  **Unicode default case folding** (the full `CaseFolding.txt` mapping, not a naive ASCII
  lowercase) to produce the comparison key. The author's original spelling and normalisation
  form is preserved for display; only the derived key is compared, stored as a lease key, or
  checked for collision.
- **Creation-time and enumeration-time collisions** (including the cross-filesystem case,
  `TM-10`, and the nested-subdirectory case, `TM-11`) are detected by folding every candidate
  and every existing id to the same fixed case and comparing via Quest's own logic — never a
  filesystem existence check — and reported as a **structured, named conflict**, never silently
  deduplicated or merged.

### What this ADR leaves open

Unchanged from what `QCLI-19`'s proposal itself named as deliberately left open — this ADR
settles the grammar shape, the literal prefix, the authored-record layout, and the
Unicode/case-folding rules, and nothing beyond them:

- **Register D5 (scale target)** and any storage or index engine a cache over this layout
  might use.
- **Register D7a (archival and retention)** — whether an archived task keeps, reuses, or
  retires its canonical-id slot.
- **Concrete lease and heartbeat timing parameters** — already, and deliberately, left open by
  the lease ADR.
- **The exact persisted shape of the global sequence counter** (a file, a derived value, or
  something else) beyond that its allocation is a Git compare-and-swap write, per the accepted
  [coordination ADR](coordinate-through-git-compare-and-swap-without-a-central-arbiter.md).
- **Whether a migrated source identifier is automatically registered as an alias** — a
  migration-design call this ADR does not make.

This ADR also does not freeze runtime, native packaging, or the projection storage/index
engine (register D2 stays deferred to post-activation), and does not touch D6 (routed to
`quest-doc`), D7b, or the not-found convention's `lore-doc` boundary half. Reconciling the
[open component decisions register](../reference/quest-cli-open-component-decisions.md), the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md),
and the
[delivery roadmap](../specs/quest-cli-delivery-roadmap.md) against this ADR is a separate,
later reconciliation pass, not performed here.

## Consequences

- **Register entry D4 is closed** and may be cited as closed by this ADR in the reconciliation
  pass that follows.
- **`T` is permanent once anything is minted under it.** Every canonical id, every filename,
  and every cross-reference in an authored record depends on the literal prefix; changing it
  later is a migration, not a configuration edit.
- **Uniqueness enforcement is Quest's own responsibility**, never delegated to filesystem case
  behaviour: implementation must fold and compare every candidate id itself before writing a
  new record, on every supported platform.
- **Alias resolution is a prerequisite step**, not an optimisation: no claim, lease, or gate
  check may run before an alias is resolved to its canonical id.
- **A structured-conflict result type is required** wherever ids are enumerated or created —
  collision detection has a defined failure shape now, not an implementation detail deferred to
  whoever writes the enumerator.
- **The counter's persisted shape is still an implementation decision.** This ADR fixes only
  that allocation is a Git compare-and-swap write; a later, narrower task chooses the concrete
  storage form.
