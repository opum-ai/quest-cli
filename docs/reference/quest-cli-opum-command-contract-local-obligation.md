---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Opum command-contract local obligation
tags:
  - quest
  - cli
  - opum
  - command-contract
  - principal
  - conformance
summary: Records quest-cli commitment to adopt the frozen Opum command contract before implementation ships, without duplicating the normative Spec.
timestamp: 2026-08-12T11:22:21.840Z
---

# Quest CLI Opum command-contract local obligation

`ODOC-22` froze the shared contract in the
[Opum command contract](https://github.com/opum-ai/opum-doc/blob/dev/docs/specs/opum-command-contract.md).
That Spec remains normative; this note records only quest-cli's local adoption obligation
and does not restate it.

Before quest-cli ships its own command output, its result envelope, exit codes, live `kind`
registry, and diagnostics will conform to that frozen pattern. Both result and diagnostic
error envelopes will reserve `principal` in the wire shape and emit `principal: null` while
the field remains unpopulated.

`QCLI-69` reconciled the earlier Quest-specific result ruling in
[Ratify the Quest CLI result contract](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md).
The live local obligation is therefore unambiguous: successful JSON output uses numeric
`schemaVersion: 1`, a stable dotted `command.payload` `kind`, a shared `data` object or
array, and a final `principal` field. Classified failures use the frozen
`error_type`/`message`/optional `hint` and `input` diagnostic shape on stderr. Until the
shared `PrincipalRef` shape is separately ratified and populated, successful, classified-
error, and uncaught envelopes all end with `principal: null`.

Quest uses the shared exit taxonomy without component-local reassignment: `0` success,
`1` uncaught, `2` usage, `3` not_found, `4` denied, `5` conflict, and `6` validation or
drift. The old Quest-only string schema version, top-level `outcome`, outcome-specific
payload keys, and `0`/`1`/`2`/`3`/`64` table are preserved only as historical decision
provenance in the amended ADR; they are not implementation options.

Quest-cli currently has no product `src/` or `test/` tree, so there is no implementation or
conformance test to cite. Once implementation begins, and before the first result envelope
ships, quest-cli will add its own component-level conformance test. That test will:

- enumerate the live command, dotted-`kind`, and exit-code registries from source and require
  a non-empty exact match against independently maintained golden expectations;
- prove that vacuous, missing, corrupted, colliding, and out-of-band cases fail;
- exercise representative success, classified-error, and uncaught handlers to enforce the
  exact result and diagnostic shapes, output-mode precedence, and stdout/stderr discipline;
  and
- assert that every exercised envelope carries the final wire-form `principal: null` until
  a separately ratified shared `PrincipalRef` is implemented.

This is a forward-looking commitment, not a claim of current coverage.

Establishing a principal's identity, defining and ratifying `PrincipalRef`, and enforcing
authorization from it are separate open problems. This obligation reserves and tests the
wire slot only; it does not resolve any of those mechanisms.
