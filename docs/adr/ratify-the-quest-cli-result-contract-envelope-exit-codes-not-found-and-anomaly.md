---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: "Ratify the Quest CLI result contract: envelope, exit codes, not-found, and anomaly"
tags:
  - quest
  - cli
  - json
  - exit-codes
  - not-found
  - anomaly
  - phase-1
  - cli-contract
summary: Preserves the original Quest-specific result ruling and its QCLI-69 amendment aligning the live wire contract with the frozen Opum command contract.
timestamp: 2026-08-05T22:53:01.790Z
---

# Ratify the Quest CLI result contract: envelope, exit codes, not-found, and anomaly

## Status

Accepted on 2026-08-05, then **amended on 2026-08-13 by `QCLI-69`**. The
original Quest-specific wire details remain below as decision provenance, but the amendment
is the live contract wherever the two conflict.

The original rules on the items
[QCLI-18's proposal](../reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md)
left as recommendations rather than decisions, in a live session on 2026-08-05 captured by
the
[Ratify the Quest CLI Phase 1 component decisions Story](../stories/ratify-the-quest-cli-phase-1-component-decisions.md).
This record closes the
[open component decisions register](../reference/quest-cli-open-component-decisions.md)'s
"JSON and exits" contract row's in-scope items (envelope shape, exit-code table, the
not-found convention's Quest-side half, anomaly placement, and create/edit uniformity); the
register itself, the contracts graph, and the delivery roadmap are reconciled against this
ADR by a separate task under the same Story, not by this document.

## Context

[Emit three categorical command outcomes over a versioned envelope](emit-three-categorical-command-outcomes-over-a-versioned-envelope.md)
accepted the three-outcome contract as to **shape only** — success, a structured
decline-or-conflict, and a structured error, over some versioned envelope — and left the
literal `schemaVersion` form, the `kind` naming convention, the payload-key scheme, the
exit-code table, and the not-found signal convention open.

[QCLI-18's proposal](../reference/quest-cli-result-contract-proposal-envelope-exit-codes-not-found-and-anomaly-placement.md)
worked those open items forward but, per its own scope, decided nothing: it recorded four
recommendations (envelope shape, exit-code table, Quest's own half of the not-found
convention, and anomaly placement) for the component owner to accept, amend, or reject, and
separately named a fifth register item — whether `create`/`edit` emit a JSON envelope
uniformly with every other command — that it did not cover at all.

The component owner ruled on all of it, including the uncovered fifth item, in a live
session on 2026-08-05.

## Decision

### Amendment — 2026-08-13 (`QCLI-69`)

After this ADR was accepted, `opum-doc` task `ODOC-22` froze the shared
[Opum command contract](https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md)
that every Opum command-line component must implement. Quest then recorded its local
adoption obligation in
[Quest CLI Opum command-contract local obligation](../reference/quest-cli-opum-command-contract-local-obligation.md)
(`QCLI-68`). That later, cross-component authority conflicts with the original ruling on
multiple wire surfaces. Quest aligns to it; no `opum-doc` exception or amendment is
requested.

### Exact reconciliation

| Surface | Original 2026-08-05 Quest ruling | Frozen Opum contract and live Quest ruling |
| --- | --- | --- |
| Result-envelope version | String `"1"` | JSON number `1` |
| Result-envelope fields | Separate top-level `kind` and `outcome` fields | `{schemaVersion, kind, data, principal}`; no top-level wire `outcome` field |
| Payload placement | Outcome-specific `result`, `decline`, `error`, or `anomaly` key | One shared `data` object or array on successful result envelopes |
| `kind` | Bare command name such as `claim` or `list` | Stable dotted `command.payload` value such as `query.results`, declared by each command |
| `kind` registry | No live, machine-discoverable registry requirement | Component-owned live manifest/registry whose command names, kinds, and exit codes can be enumerated from source; consumers tolerate additive unknown kinds |
| Failures and diagnostics | Domain `outcome` plus an outcome-specific payload in the result envelope | Structured diagnostic envelope on stderr: `{error_type, message, hint?, input?, principal}`; uncaught failures use `error_type: "uncaught"`; stdout contains only successful payloads or stays silent |
| Exit meanings | `0` success, `1` decline/conflict, `2` error, `3` anomaly, `64` usage | `0` success, `1` uncaught, `2` usage, `3` not_found, `4` denied, `5` conflict, `6` validation or drift |
| Not found | Decline envelope on exit `1` | Diagnostic `error_type: "not_found"` on exit `3` |
| Conflict | Decline envelope on exit `1` | Diagnostic `error_type: "conflict"` on exit `5` |
| Anomaly | Wire `outcome: "anomaly"`, `anomaly` payload, exit `3` | No anomaly-specific wire field or code; the already-named evaluator-disagreement case is a structured `drift` diagnostic on exit `6` |
| Principal | Not reserved | Required final top-level key on successful, classified-error, and uncaught envelopes; emit `principal: null` until the shared `PrincipalRef` shape is ratified and populated |

The original `success` / `decline` / `error` / `anomaly` vocabulary may still describe
application-layer decisions and caller intent. It no longer defines the wire envelope or
exit table. Every command boundary must project its domain result into the frozen result
or diagnostic form: a successful operation emits the numeric-versioned result envelope on
stdout and exits `0`; a classified non-success emits the matching diagnostic on stderr and
uses the shared semantic exit; an unclassified bug uses `uncaught` and exits `1`.

The shared contract also controls output behavior: `--json` takes precedence over
`--plain`, which takes precedence over pretty output; non-TTY stdout selects plain output;
and an invocation does not mix output modes. `create` and `edit` remain uniform with other
commands under that rule rather than retaining a Quest-only envelope variant.

The local conformance obligation must enumerate Quest's live command, dotted-`kind`, and
exit registries; assert non-empty exact equality against independently maintained golden
expectations; and demonstrate failure for vacuous, corrupted, missing, colliding, and
out-of-band cases. Once handlers exist, Quest's tests must additionally invoke representative
success, classified-error, and uncaught paths to prove stream discipline, exact envelope
shape, and the required final `principal: null` slot. Populating that slot remains subject
to the shared contract's ratifying-amendment rule.

This amendment reserves the field only. Establishing principal identity, defining
`PrincipalRef`, and enforcing authorization remain outside this ADR and require separate
cross-component authority.

## Original decision — 2026-08-05 (wire details superseded)

The text in this section records what the owner accepted on 2026-08-05. It is intentionally
preserved rather than silently rewritten; the 2026-08-13 amendment above governs every
conflicting wire detail.

**`schemaVersion` is the literal string `"1"`** — QCLI-18's recommended Option C, accepted
as proposed. A JSON number invites cross-parser coercion/printing footguns (`1` vs `1.0`);
a single-digit string gives exact-match comparison without committing to unrequested
major/minor granularity.

**`kind` and `outcome` are two separate fields — a deliberate deviation from QCLI-18's
recommendation, not a silent substitution.** QCLI-18 recommended a single fused
`<command>_<outcome-class>` `kind` value (e.g. `claim_decline`, Option C of its section 1b).
The owner rejected that fusion. The ruling instead is **two independent fields**:

- `kind` names *which command* produced the result (`claim`, `list`, `renew`, ...).
- `outcome` names the *categorical outcome* it reached: one of `success`, `decline`,
  `error`, or `anomaly` (see below).

**Reason for the deviation:** alignment with the split status/type-discriminant convention
already established by Kubernetes (an object's `kind`/`apiVersion` type identity kept
separate from its `status.phase`/condition-type outcome fields) and Stripe (an object's
`object` type discriminant kept separate from its `status` field). Both are widely used,
independently designed API contracts that treat "what is this" and "what happened to it" as
orthogonal axes rather than concatenating them into one compound token. A consumer can
switch on `outcome` alone without enumerating every command's `kind`, and can filter or log
by `kind` without parsing an underscore-joined compound string apart again.

**Payload keys are `result` / `decline` / `error`**, one key per outcome class, as QCLI-18
recommended (its section 1c, Option C) — plus a fourth key, `anomaly`, activated by the
anomaly decision below.

**Exit-code table**, adopted as QCLI-18 recommended (its section 2, Option A):

| Exit code | Meaning |
| --- | --- |
| `0` | Success (including `quest --version`'s fixed, unconditional zero-exit) |
| `1` | Decline or conflict (sub-kind lives in the envelope's `decline` payload, not in additional exit codes) |
| `2` | Error (corrupt record, unreadable repository, encoding failure, ...) |
| `3` | Anomaly — conditional in QCLI-18's proposal on the anomaly decision below being accepted; it is, so this code is live |
| `64` | Usage error (malformed invocation) — `sysexits.h`'s `EX_USAGE`, deliberately outside the domain-outcome sequence because a malformed invocation never reaches a command outcome at all |

**Not-found convention — Quest's own side only.** A not-found read is a JSON-first decline:
it returns the same envelope shape as any other decline (`outcome: "decline"`, a `decline`
payload key), carrying a structured `reason` discriminant (e.g. `reason: "not_found"`) that
distinguishes it from a lost race, a blocked gate, or any other decline cause, on the shared
decline exit code (`1`).

**Left explicitly open by this ADR:** the `lore-doc` boundary half of the not-found
question — whether a future Lore adapter targeting Quest accepts this JSON-first convention
as-is, or additionally requires Quest to support the bare exit-code-and-empty-stdout pattern
for compatibility with today's `BacklogAdapter` — is not decided, proposed, or assumed
resolved here. That half depends on adapter-abstraction work that does not yet exist on
Lore's side and remains tracked as open in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md)
until a `lore-doc` ruling settles it.

**Anomaly placement.** An anomaly (e.g. two lease evaluators disagreeing about a lease's
state) is **a distinguishable fourth outcome value** — `outcome: "anomaly"` — with its own
exit code (`3`) and its own payload key (`anomaly`), distinct from both `decline` and
`error`. It is neither a routine, often retry-safe decline, nor an internal fault; folding
it into either would make an honest evaluator disagreement look like something it isn't.

**Left explicitly open by this ADR:** this record rules only on how Quest's own
component-level envelope and exit table represent an anomaly. Fully canonizing "anomaly" as
a product-wide outcome-vocabulary term — a class alongside success/decline/error at the
level of Quest's cross-component or product-wide result vocabulary — remains a separate
proposal already routed to `quest-doc` and is not settled, re-opened, or assumed resolved by
this ADR.

**Create/edit uniformity.** `create` and `edit` commands emit the JSON envelope described
above uniformly with every other command — there is no special-cased plain-text-only or
partial-output path for mutating commands.

## Consequences

- Quest has one live result/diagnostic wire contract: the frozen Opum command contract.
  No component-local exception or shared-contract amendment is required.
- Future command and conformance-test design must use the numeric result envelope, shared
  diagnostic shape and exits, live dotted-kind registry, stream/output discipline, and
  reserved final `principal: null` slot described above.
- Domain outcomes remain useful inside the application layer, but code and documentation
  must not expose the original Quest-only `outcome` field, payload-key split, or exit table
  as current wire behavior.
- The 2026-08-05 decision and proposal remain auditable below and in their original records;
  their conflicting wire details are historical rather than silently rewritten.
- Principal establishment, `PrincipalRef`, authorization enforcement, the `lore-doc`
  adapter-boundary half of not-found behavior, and product-wide anomaly vocabulary remain
  outside this amendment.

## Original consequences — 2026-08-05 (wire details superseded)

- The envelope's outcome-class payload keys are now four (`result` / `decline` / `error` /
  `anomaly`), and the exit-code table spans five values (`0`, `1`, `2`, `3`, `64`); Phase 2
  command design proceeds against a closed contract, not a hypothetical one.
- Every consumer reads `outcome` and `kind` as two independent fields — switch on `outcome`
  for categorical handling, read `kind` for which command ran — never by parsing a compound
  token apart again.
- A not-found response is structurally identical to any other decline except for its
  `reason` value; callers get one stable shape to depend on, at the cost of the `lore-doc`
  compatibility question staying open until a future ruling closes it.
- An anomaly is reported, never silently folded into decline or error, consistent with the
  trust model's commitment that evaluator disagreement is surfaced, not silently reconciled
  ([Bound claims with leases evaluated against the evaluator's own clock](bound-claims-with-leases-evaluated-against-the-evaluator-s-own-clock.md)).
- Nothing here freezes the runtime, native packaging, or the projection storage/index
  engine — the scale target and this contract both leave D2 blocked post-activation.
- Still open after this ADR: the not-found convention's `lore-doc` boundary half; D2 (the
  runtime choice itself), D6, D7a, and D7b; and the `quest-doc` anomaly-vocabulary proposal.
  None of those is touched or implied closed here — reconciling the open component decisions
  register, the contracts graph, and the delivery roadmap against this ADR is a separate,
  already-identified task under the owning Story.
