---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI D2 runtime ruling
tags:
  - quest
  - d2
  - runtime
  - bun
  - decisions
  - governance
summary: "Records the 2026-08-09 owner ruling closing D2: Bun, distributed as compiled per-platform binaries matching the shipped lore-cli pattern."
timestamp: 2026-08-09T07:42:44.501Z
---

# Quest CLI D2 runtime ruling

The component owner ruled D2 — runtime and native packaging — in a live session
on **2026-08-09**. This record states the ruling and its provenance. It follows
the precedent set by the
[license, platform, and runtime ownership record](quest-cli-license-platform-and-runtime-ownership-record.md)
(`QCLI-27`): governance-level rulings that close register entries without an
architectural trade-off are recorded as dated Reference documents, not ADRs.

## Details

### The ruling

**D2 runtime: Bun.** Quest CLI is distributed as compiled per-platform binaries
published as `optionalDependencies` behind a minimal Node launcher, matching the
pattern `@opum-ai/lore` 0.2.0 already ships. An installing user needs Node or
nothing at all, never Bun.

The ruling covers `quest-cli`, `opum-harness`, and `glyph-cli` together, and is
recorded portfolio-wide in `opum-doc` as **Adopt Bun as the runtime for Opum
command-line components**. Quest CLI owns D2 — ownership was claimed by
`QCLI-27` — so the register closure is recorded here rather than there.

### Provenance and prior work

The owner's live ruling on 2026-08-09 is the provenance, in the same shape as
`QCLI-27`'s D1 and D3 rulings.

The comparison the ruling was made against is the
[D2 runtime proposal](quest-cli-d2-runtime-proposal.md) (`QCLI-58`), which
deliberately scored, ranked, and recommended nothing, and stated only what is
true of each candidate. That document proposed; this one decides.

The proposal's own caution is worth preserving: matching Lore's runtime "does not
by itself simplify integration — the argued benefit, if any, is packaging-pattern
precedent within this org, not a technical coupling." The ruling was not made on
consistency alone. The decisive technical argument belongs to `opum-harness`,
whose guard executes on every tool call and therefore places process startup on
its critical path, a constraint Quest CLI does not share. Quest CLI follows for
packaging-pattern precedent and shared-core simplicity; it is a follower in this
ruling, not its cause.

### What this ruling discharges

`QCLI-61` was filed to guard against the first worker acting on `CLAUDE.md`'s
product-source permission deciding D2 **by construction**, since a
`package.json`, a `bin` entry, and runtime dependencies cannot be written
without naming a runtime. That hazard is discharged: the owner has ruled, so no
worker decides it implicitly, and the artifacts that permission authorizes may
now name Bun by citation rather than by assumption.

### What this ruling does not touch

- **The roadmap-versus-register disagreement.** The delivery roadmap does not
  list D2 as gating Phase 2, while the register's "Needed for" cell reads
  "Phases 2 and 6". `QCLI-61` records that disagreement as predating its wave and
  explicitly reserves its resolution for a separate owner ruling on which record
  is authoritative. This record leaves both documents unamended on that point.
- **D6, D7a, and D7b**, which remain as the register states them.
- **The activation gate.** This record states a ruling; it computes no gate
  result and changes no activation status.
