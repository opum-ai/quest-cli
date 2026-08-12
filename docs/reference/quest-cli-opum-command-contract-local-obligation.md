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

Quest-cli currently has no product `src/` or `test/` tree, so there is no implementation or
conformance test to cite. Once implementation begins, and before the first result envelope
ships, quest-cli will add its own component-level conformance test. That test will enumerate
the live command, `kind`, and exit-code registries; require a non-empty exact match against
the component's golden contract; and prove that vacuous, missing, corrupted, colliding, and
out-of-band cases fail. This is a forward-looking commitment, not a claim of current
coverage.

Establishing a principal's identity and enforcing authorization from it are separate open
problems. This obligation reserves the field only and does not resolve either mechanism.
