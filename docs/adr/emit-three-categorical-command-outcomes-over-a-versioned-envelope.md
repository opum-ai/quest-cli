---
# yaml-language-server: $schema=../../.lore/schemas/adr.schema.json
type: ADR
title: Emit three categorical command outcomes over a versioned envelope
tags:
  - quest
  - cli
  - json
  - exit-codes
  - cli-surface
summary: Every command distinguishes success, structured decline-or-conflict, and structured error, over a deterministic versioned machine-readable envelope.
timestamp: 2026-08-05T11:44:34.843Z
---

# Emit three categorical command outcomes over a versioned envelope

## Status

Accepted as to the **shape** of the contract. The literal envelope keys, the exit-code
table, and the not-found signal convention remain open and are tracked in the
[open component decisions register](../reference/quest-cli-open-component-decisions.md).

This record promotes a decision the research campaign already settled; it does not make a
new one. Settled by `QCLI-2.3`, `QCLI-2.7`, and `QCLI-2.8`, recorded as contract 3 of the
[component contracts and delivery graph](../reference/quest-cli-component-contracts-and-delivery-graph.md)
and as line 24 of the [component charter](../reference/quest-cli-component-charter.md).

## Context

Quest's primary callers are scripts and agents, not people at a terminal. That inverts the
usual priority: the machine-readable result is the contract, and the human-readable output
is a rendering of it.

Two outcomes in Quest's domain are not errors and not successes. A claim that loses a race
did exactly what it should — it detected a conflict and declined — and reporting that as
failure makes every caller unable to distinguish "someone else got there first" from
"something is broken". A read that finds nothing is likewise a legitimate answer, not a
fault. Collapsing either into a generic error forces callers to parse messages to recover
information the tool already had.

The research found a specific, concrete trap here. Lore's own inbound adapter expectation
and Lore's own documented outbound contract **diverge deliberately** — they are not two
descriptions of one shape. So the intuitive shortcut, building Quest's envelope by
mirroring Lore's published `--json` output, produces the wrong shape. Neither can be
copied; Quest must decide its own and then negotiate compatibility.

It also found the write-path hazard that makes this urgent. An existing adapter recovers a
newly created identifier by regex-matching a human-readable stdout line. Any tool whose
callers must do that has made its prose output load-bearing, and every future wording
change becomes a breaking change.

## Decision

**Every command produces a deterministic, versioned, machine-parseable result on request,
distinguishing at minimum three categorical outcomes:**

1. **success**;
2. **a structured decline or conflict**, distinct from success; and
3. **a structured error**, distinct from both.

With four further obligations:

- **A mutating command's success result must carry enough structure to recover any newly
  minted identifier** without parsing a human-readable stdout line. Prose is never a
  contract.
- **A not-found outcome is unambiguous and distinguishable from an unrelated hard error.**
- **`quest --version`, or its equivalent, reports a bare parseable semantic version and
  exits zero** — the one output whose shape is fixed, because tooling probes it before it
  can know anything else.
- **Read-only commands have zero mutation as a caller-observable part of their result
  contract**, on every path including not-found and error. This is `INV-5` from
  [Require atomic idempotent operation-owned mutations](require-atomic-idempotent-operation-owned-mutations.md),
  restated here because it is as much a property of the command surface as of the write
  path.

Deliberately **not** decided here, and open in the register: whether `schemaVersion` is
numeric or another form; the `kind` naming convention; whether a shared `data` key exists
or each kind carries its own payload key; per-command payload-key naming; the literal
exit-code-to-outcome table; the not-found signal convention; and whether create and edit
emit an envelope uniformly. The last two are partly `lore-doc` boundary decisions
(items `5b` and `4b`/`4c`) and are not resolvable by Quest alone.

## Consequences

- **Three outcomes, not two, propagate through every layer.** The application layer cannot
  model results as success-or-throw, because decline is neither.
- **Human output is derived from the structured result**, not produced alongside it.
  Otherwise the two drift, and the prose becomes accidentally normative again.
- **Exit codes must be classified before any command is implemented.** This is Phase 1
  work and it gates Phase 2 — it is not a detail to settle while writing the first command.
- **Compatibility with Lore is a negotiation, not an inheritance.** Quest picks its
  envelope; where Lore's adapter expects something else, that difference is a named
  boundary item, not a Quest defect.
- **Verified by** `BB-02`, `BB-03`, `BB-11`, `BB-15`, and `BB-17` for the categorical
  distinctions, and `BB-05` and `BB-06` for read-only purity.
