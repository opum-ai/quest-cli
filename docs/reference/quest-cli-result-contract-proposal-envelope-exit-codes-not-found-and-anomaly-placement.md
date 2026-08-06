---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: "Quest CLI result contract proposal: envelope, exit codes, not-found, and anomaly placement"
tags:
  - quest
  - cli
  - decisions
  - proposal
  - phase-1
  - json
  - exit-codes
  - cli-contract
summary: "Phase 1 proposal for owner ruling on the CLI result contract: envelope shape, exit-code table, Quest's own not-found convention, and anomaly placement."
timestamp: 2026-08-05T15:27:19.619Z
---

# Quest CLI result contract proposal: envelope, exit codes, not-found, and anomaly placement

This Reference is `QCLI-18`'s output: a proposal, for the owner to rule on, covering the
largest cluster of open items in the
[open component decisions register](quest-cli-open-component-decisions.md)'s "JSON and
exits" contract row — the exact envelope shape, the literal exit-code-to-outcome table,
Quest's own half of the not-found signal convention, and where a detected lease-evaluator
disagreement sits in the outcome taxonomy the
[architecture Spec](../specs/quest-cli-architecture.md) leaves open. It serves the
[Story](../stories/follow-through-on-the-quest-cli-design-layer.md)'s Phase 1
proposal work.

**This document decides nothing.** Every recommendation below is a position for the
component owner to accept, amend, or reject. No item is recorded as accepted, no ADR is
created by this document, and the
[open component decisions register](quest-cli-open-component-decisions.md) is deliberately
not edited here — a separate reconciliation task closes each item once the owner rules, so
that this task and its wave siblings do not contend for the same file.

**Ratified — 2026-08-05 (`QCLI-24`).** The component owner has since ruled on the items
below. [Ratify the Quest CLI result contract: envelope, exit codes, not-found, and
anomaly](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md)
is the accepted ADR that closes them. The "this document decides nothing" framing above no
longer holds; it is preserved here unedited, as the proposal that ADR rules on, per this
project's inline-supersession convention.

## Details

### Grounding

Four documents anchor everything below, and none of them settles the items this proposal
addresses:

- [Emit three categorical command outcomes over a versioned envelope](../adr/emit-three-categorical-command-outcomes-over-a-versioned-envelope.md)
  is **accepted as to shape only** — three categorical outcomes (success; a structured
  decline or conflict; a structured error) over *some* versioned envelope. It explicitly
  leaves open the envelope's literal keys, the exit-code table, and the not-found signal
  convention, and names them as this task's territory.
- The [architecture Spec](../specs/quest-cli-architecture.md)'s "Error taxonomy" already
  places **not-found inside the decline-or-conflict class** ("a not-found read" is listed
  as an example, alongside a lost claim race, a stale-generation heartbeat, and a blocked
  gate). That settles *which of the three classes* a not-found read belongs to; it is not
  what this proposal's not-found item is about (see below). The same section's "Open
  questions" raises the fourth, unresolved thing: an **anomaly** — two evaluators
  disagreeing about a lease — "is neither success, nor a correct decline, nor an internal
  fault," and "Phase 1 must place it."
- The [open component decisions register](quest-cli-open-component-decisions.md)'s "JSON
  and exits" row lists exactly **four** items, **three** of which are this proposal's (the
  envelope shape, the exit-code table, and the not-found convention), plus a fourth
  (whether create/edit emit a JSON envelope uniformly) that `QCLI-18` does not cover and
  that remains open after this document. This proposal's fourth item — anomaly placement —
  has **no register row of its own**; it originates instead in the architecture Spec's
  "Open questions" section (see above), not in the register.
- [`QCLI-2.7`'s adapter contract review](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
  Part 2 is the source of the load-bearing constraint every item below must satisfy.

#### The load-bearing constraint: two Lore shapes, both off-limits as defaults

`QCLI-2.7` Part 2 item 2 found that Lore's own **inbound** adapter expectation (what
`lore-cli`'s `BacklogAdapter` requires of the backend CLI it invokes) and Lore's own
**outbound** contract (what `lore-cli` documents for its *own* `--json` output, in its own
`cli-contract.md`) are two different shapes, diverging **on purpose** (`cli-contract.md`
§2.2's own words: "share a shape on purpose, but are versioned independently"):

| Axis | Lore's inbound adapter expectation | Lore's own outbound contract |
| --- | --- | --- |
| `schemaVersion` | JSON number literal `1` | Documented separately; not proven identical to the inbound form by any admitted source |
| `kind` naming | Hyphenated, per-response literal (`task-list`, `task-view`, `search`) | Dotted `command.payload` form (e.g. `query.results`) |
| Payload key | No shared `data` key — each `kind` carries its own key (`tasks` / `task` / `results`) | A shared `{schemaVersion, kind, data}` shape |

Neither column is a candidate default for Quest. Building Quest's envelope by mirroring
Lore's *published* `--json` output (the right column) produces the wrong shape because
that contract was never designed to be *consumed* as an inbound adapter target. Copying the
left column instead just inherits one Backlog-specific adapter's ad hoc convention — a
convention that exists because `BacklogAdapter` is `lore-cli`'s **only** adapter type today
(`QCLI-2.7`'s "central finding: no generic adapter abstraction exists"), not because it is
a considered contract for a second, differently-shaped backend. Every recommendation below
names, per axis, why it is not simply a reprint of either column.

### 1. Envelope shape

Four sub-decisions, taken together because a caller parses them as one object.

#### 1a. `schemaVersion` form

- **Option A — bare JSON number** (`schemaVersion: 1`). Simple, exact-match comparison.
  This is the literal form Lore's inbound adapter hardcodes today, so choosing it *because*
  it is convenient would be exactly the copy the load-bearing constraint rules out.
- **Option B — dotted numeric string** (`schemaVersion: "1.0"`). Room to express additive
  ("minor") versus breaking ("major") change without changing the field's type. Costs a
  parsing convention every consumer must implement for a distinction Quest has not yet
  shown it needs.
- **Option C — single-digit string** (`schemaVersion: "1"`). Exact-match comparison as
  simple as Option A, but a string rather than a bare number.

**Recommendation: Option C.** A JSON number invites a specific, well-known cross-language
footgun — some consumers coerce or print `1` as `1.0`, and loose numeric comparison
behaves differently across parsers than an exact string match does. A string sidesteps that
without committing to Option B's unrequested major/minor granularity; it can grow into a
dotted form later (`"1"` -> `"1.1"`) without a type change, if that need ever materializes.
This is independently motivated by Quest's own consumers, not by a wish to differ from
Lore for its own sake — but it is also, concretely, not Lore's bare-number literal.

#### 1b. `kind` naming convention

- **Option A — hyphenated, resource-first** (`task-view`, `task-list`). This is Lore
  inbound's literal convention; adopting it verbatim is the specific copy the constraint
  forbids, and it does not even fit Quest's domain — Quest's application layer vocabulary
  is claim/renew/gate/sync/migrate/link plus reads, not CRUD-style resource nouns
  (architecture Spec, "Layers": *"Application ... use cases: claim, renew, gate, sync,
  migrate, link"*).
- **Option B — dotted, command-first** (`claim.result`, `list.result`). Closer to Lore's
  own outbound `command.payload` shape; reusing that punctuation risks being read as an
  inheritance of the very shape the constraint flags, even though the segments would carry
  different meaning.
- **Option C — underscore-joined, two-segment `<command>_<outcome-class>`**
  (`claim_success`, `claim_decline`, `list_error`). The first segment is Quest's own
  command vocabulary; the second is literally one of the ADR's three categorical outcomes.

**Recommendation: Option C.** It decouples two things Lore's inbound `kind` conflates into
one axis (resource *and* read-shape) and Lore's outbound `kind` conflates into a different
one (command *and* payload-shape): Quest's `kind` names *which command produced this
result* and *which categorical outcome it reached*, as two independent, structurally
meaningful segments — a pairing neither Lore shape expresses, because `BacklogAdapter`
models reads only and never needed an outcome axis, and Lore's own outbound contract ties
`kind` to payload shape rather than to the ADR's three-way outcome classification. The
underscore separator is also a genuine, non-cosmetic choice: hyphens are frequently invalid
in bare identifiers used to build enum/switch code across common client languages, and a
dot suggests a nested path a `kind` value is not — so the punctuation itself is chosen for
consumer-code ergonomics, not merely to look different from Lore.

#### 1c. Shared `data` key versus per-kind payload key

- **Option A — shared `data` key** (`{schemaVersion, kind, data}`), matching Lore's own
  outbound shape. A single accessor path for every consumer, at the cost of `data`'s
  contents being untyped from the envelope's own perspective — every consumer must
  branch on `kind` before it can know what is inside `data` anyway.
- **Option B — per-command payload key** (`{schemaVersion, kind, claim: {...}}`,
  `{schemaVersion, kind, tasks: [...]}`), matching Lore inbound's convention structurally
  (though not its literal key names).
- **Option C — per-outcome-class shared key** (`result` for success, `decline` for
  decline/conflict, `error` for the error class), one key per class rather than one per
  command or one universal key.

**Recommendation: Option C.** Since `kind` (per 1b) already encodes the outcome class as
its own segment, the payload key can name *that same class* rather than duplicating either
Lore convention: a caller who already knows it is looking at `claim_success` reads the
`result` key; a caller looking at `claim_decline` reads `decline`. This is deliberately
neither a single universal `data` key (Option A, Lore's outbound shape) nor a distinct key
per command (Option B, structurally Lore inbound's shape even under different names) — it
is a key scheme sized to the ADR's three outcome classes, which is the one contract this
document is actually built on.

This key count is not fixed at three independent of item 4 below: **conditional on item
4's recommendation being accepted**, the payload-key scheme gains a fourth key (`anomaly`)
alongside `result` / `decline` / `error` — the same dependency item 2's exit-code table
already states for its own conditional exit code `3`.

#### 1d. Per-command payload-key naming

Given 1c's recommendation, this narrows to naming the fields *inside* `result` /
`decline` / `error`, which is genuinely per-command (a `claim` result's fields differ from
a `list` result's fields). **Recommendation:** name each field for the domain object it
carries (`task`, `tasks`, `claim`, `lease`, `gate`), matching the architecture Spec's own
domain vocabulary (tasks, events, claims, leases, gates, identifiers) rather than a generic
placeholder — but leave the exhaustive per-command field list to the command-design work
that follows this proposal, since no command surface is designed yet (this is Phase 1
decision work; Phase 2 builds the commands themselves).

#### How this avoids inheriting either side of the Lore envelope divergence

Per axis: 1a picks a type (string) neither column commits to by name; 1b pairs two axes
(command, outcome-class) that neither Lore shape pairs, using a punctuation choice
(underscore) that is neither column's; 1c sizes the payload-key scheme to Quest's own
three-class ADR rather than to either "one shared key" or "one key per command." Nothing
here was chosen by elimination against Lore for its own sake — each choice has an
independent, stated reason — but each is also, concretely, checked against both columns of
the divergence table above and is not a reprint of either.

### 2. Exit-code-to-outcome table

- **Option A — one code per ADR class, sub-classification left to the envelope.**
  `0` success, `1` decline or conflict, `2` error, with a usage failure (malformed
  invocation, never reaching a domain outcome at all) kept out of that sequence entirely
  (see below). Fine-grained distinctions — not-found versus lost race versus blocked gate,
  or corrupt record versus encoding failure — live in the envelope's structured fields,
  not in additional exit codes.
- **Option B — one code per sub-case**, closer to `lore-cli`'s own self-facing convention
  (`0` ok, `2` usage, `3` not_found, `4` denied, `5` conflict, `6` validation/drift, per
  `lore instructions`). Familiar to anyone already scripting against `lore`/`backlog`, but
  it allocates far more of the exit-code space than the ADR's three classes need, and it
  duplicates information the envelope already carries structurally — and reproducing
  `lore-cli`'s own numbering under Quest's name risks being read as exactly the kind of
  default-copying this proposal is required to avoid, even though the constraint's stated
  target is Lore's *adapter/envelope* contract specifically, not `lore-cli`'s own exit
  table.
- **Option C — collapse everything nonzero to `1`**, relying solely on the JSON envelope
  for classification. Rejected: it forces every caller back into parsing structured output
  before it can branch at all, which is precisely the anti-pattern the ADR's ordinary-decline
  discussion (and the write-path capture hazard `QCLI-2.7` found) exists to prevent,
  generalized from "recovering an id" to "recovering an outcome class."

**Recommendation: Option A**, with a distinct code reserved for anomaly if item 4 below is
accepted as a fourth class, and a usage-error code held clearly outside the domain
sequence (a malformed invocation is not one of the ADR's three *command* outcomes — the
command was never reached):

| Exit code | Meaning |
| --- | --- |
| `0` | Success (including `quest --version`'s fixed, unconditional zero-exit) |
| `1` | Decline or conflict (the whole middle class; sub-kind is in the envelope) |
| `2` | Error (something is wrong: corrupt record, unreadable repository, encoding failure) |
| `3` | Anomaly, **conditional on item 4's recommendation being accepted** |
| `64` | Usage error (malformed invocation) — borrowed from the `sysexits.h` `EX_USAGE`
  convention precisely because it is a recognized *external* convention, not a Lore one,
  and its distance from the low domain numbers makes confusing "you invoked this wrong"
  with "the domain declined" structurally harder |

### 3. Not-found signal convention — Quest's side only

`QCLI-2.7` item 5b and the register's "Boundary decisions Quest cannot make alone" entry
5b both name this a genuine three-way tension: "between exit-code-and-empty-stdout and a
JSON-first convention, resolved by no current document," requiring **both** a Quest
contract change **and** a `lore-doc` boundary decision. This proposal covers only the first
half, per the task's own instruction.

- **Option A — bare exit-code-and-empty-stdout**, matching the pattern the current
  `BacklogAdapter`'s `viewTask` hardcodes against Backlog.md (exit code exactly `1`, stdout
  exactly empty; anything else is drift). Maximally compatible with *today's* adapter
  behavior if a future Lore adapter reused this pattern verbatim, at the direct cost of
  Quest's own charter default (a deterministic JSON envelope on request) and of losing any
  structure a not-found response could otherwise carry.
- **Option B — JSON-first**, a not-found read returns the same envelope shape (per item 1)
  as any other decline, with `kind` = `<command>_decline` and a structured discriminant
  identifying the specific decline reason (e.g. a `reason` field distinguishing not-found
  from a lost race or a blocked gate), on the exit code item 2 assigns to the whole decline
  class.
- **Option C — hybrid**: keep a not-found-specific exit code distinct from other declines,
  but still emit the full JSON envelope when `--json` is requested; empty stdout only in
  the human-rendered path.

**Recommendation: Option B.** `QCLI-2.7` item 5a already establishes that an unambiguous,
distinguishable not-found outcome is "already satisfiable by Quest's chartered contract" in
principle; item 5b names this exact tension, and the
[component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md)'s
own rendering of it states that "Quest's own charter default favors a structured error
envelope over a bare exit-code convention" (`QCLI-2.7` item 5b's own words are "a JSON error
envelope with an `error_type`"). Choosing Option B is choosing Quest's own
stated default over the narrower pattern one current, Backlog-specific adapter happens to
expect — consistent with the load-bearing constraint that this pattern is not a default to
inherit. It is also not a compatibility-free choice: no Lore adapter targets Quest today
(`BacklogAdapter` is `lore-cli`'s only adapter type), so there is no existing external
contract this recommendation would break by not matching it.

**Marked explicitly as not settled here:** whether any future Lore adapter targeting Quest
accepts this JSON-first convention, or requires Quest to additionally support the bare
exit-1/empty-stdout pattern for compatibility, is register item 5b's `lore-doc` half. That
depends on work neither designed nor built on Lore's side (the same "no generic adapter
abstraction exists today" gap `QCLI-2.7`'s central finding names) and is not resolved,
proposed as resolved, or assumed resolved by this document.

### 4. Where an anomaly sits in the outcome taxonomy

The architecture Spec's error taxonomy has exactly three classes today, and its own "Open
questions" section states the problem this item answers: a detected lease-evaluator
disagreement "is neither success, nor a correct decline, nor an internal fault," and
"Phase 1 must place it," because "the placement affects the envelope and the exit table."

- **Option A — fold into decline-or-conflict.** No new class; an anomaly is reported as a
  decline with a distinguishing discriminant, the same mechanism item 3 uses for not-found.
  Keeps the exit table and envelope's outcome-class list at exactly three. Costs the
  distinction the Spec itself draws: an ordinary decline (a lost race) is routine and often
  retry-safe: two honest evaluators simply disagreeing about a lease's state is a signal
  about the *evaluators*, not about contention, and collapsing the two risks a caller
  treating a disagreement as "try again" when the trust model says it should be
  **surfaced**, not silently retried past.
- **Option B — fold into error.** Reuses the existing error exit code and envelope
  handling; matches the operational urgency (a disagreement plausibly warrants stopping
  automation, not retrying). Costs the Spec's own explicit statement that an anomaly is
  "neither... an internal fault" — folding it into `error` risks every future reader
  assuming an anomaly means a Quest bug or corrupted repository, when a lease-evaluator
  disagreement is compatible with everything about Quest and the repository being correct
  and only the evaluators' local clocks or views disagreeing.
- **Option C — a distinguishable fourth outcome**, visible in the envelope's outcome
  segment (per item 1b's `kind` scheme, e.g. `renew_anomaly`) and given its own exit code
  (item 2's conditional `3`). Matches the trust model's own commitment (architecture Spec,
  "Trust model" #4): "a projection confers no authority... on disagreement... the
  disagreement is **reported**, never silently reconciled." A caller can distinguish
  "routine decline," "something is broken," and "the evaluators disagree" without parsing
  prose for any of the three.

**Recommendation: Option C**, with an explicit boundary the owner should weigh separately
from the recommendation itself: the architecture Spec's own "Proposals routed to `quest-doc`"
section already names *"whether 'anomaly' is a first-class outcome class alongside
success, decline, and error"* as something that "arises from a component-local mechanism
but would change the product-wide result vocabulary if adopted" — and routes it to
`quest-doc`, not to a Quest-only ruling. That is a **different** boundary than item 3's
`lore-doc` dependency: this document can and does recommend how Quest's *own* component-level
envelope and exit table represent an anomaly (Option C, above), but fully canonizing
"anomaly" as a product-wide vocabulary term is the separate proposal already sitting with
`quest-doc`, and this document neither settles nor assumes that wider question is settled.

### Proposal summary, for owner ruling

| Item | Recommendation | Boundary note |
| --- | --- | --- |
| 1. Envelope shape | String `schemaVersion` (`"1"`); `<command>_<outcome-class>` `kind`; per-outcome-class payload key (`result`/`decline`/`error`, gaining a fourth `anomaly` key conditional on item 4's recommendation being accepted); per-command field names from the domain vocabulary | None — fully within Quest's own remit |
| 2. Exit-code table | `0` success, `1` decline/conflict, `2` error, `3` anomaly (conditional on item 4), `64` usage error | None — fully within Quest's own remit |
| 3. Not-found convention | JSON-first: a decline envelope with a structured not-found discriminant, on the shared decline exit code | Quest side only — the `lore-doc` half (whether a future Lore adapter accepts or requires otherwise) is **not** decided here |
| 4. Anomaly placement | A distinguishable fourth outcome, `kind`-tagged and exit-coded distinctly from decline and error | Quest's own component-level representation is proposed here; elevating "anomaly" to product-wide vocabulary is a separate `quest-doc` proposal, already routed, not re-opened or settled here |

None of the four rows above is a decision. Each is a recommendation for the component
owner to rule on; acceptance, rejection, or amendment of any row happens outside this
document, and the [open component decisions register](quest-cli-open-component-decisions.md)
is updated only by a later reconciliation task once that ruling exists.

## Notes

This proposal was authored against the live text of the
[open component decisions register](quest-cli-open-component-decisions.md), the
[architecture Spec](../specs/quest-cli-architecture.md), the
[emit-three-categorical-outcomes ADR](../adr/emit-three-categorical-command-outcomes-over-a-versioned-envelope.md),
and
[`QCLI-2.7`'s adapter contract review](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
Part 2, all read in this session rather than paraphrased from the task body. It does not
edit any of those documents, the
[component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md),
or the [research source register](quest-cli-research-source-register.md).

**Three** items are explicitly **out of scope** here and remain open, spread across two
different register rows: the register's own "JSON and exits" row's fourth item — whether
create/edit commands emit a JSON envelope uniformly — is named alongside this proposal's
three in-scope items but not claimed by `QCLI-18`; and the register's separate "Lore
integration" row (not "JSON and exits") lists the exact binary-invocation surface and the
probe sequence, both requiring a `lore-doc` boundary decision and both unrelated to the
"JSON and exits" row this proposal draws from.
