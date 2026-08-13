---
# yaml-language-server: $schema=../.lore/schemas/reference.schema.json
type: Reference
title: Documentation
summary: Root index of this OKF documentation bundle, created by `lore init`.
timestamp: 2026-08-01T15:57:19.464Z
okf_version: "0.1"
---

# Quest CLI documentation

This bundle belongs to the **Quest CLI component**. It owns the future `quest`
package and command, component-local functional contracts, authored formats,
Git/filesystem behavior, projection, migration, tests, releases, and operating
runbooks.

Quest-wide strategy and cross-repository architecture are canonical in
`quest-doc`. The public `questgraph.dev` site belongs to `quest-web`; Lore-wide
gates belong to `lore-doc`; Opum SaaS and commercial policy belong to
`opum-doc`.

This repository currently contains planning, provenance, research, and design
only. Product source and runtime dependencies remain gated on the full Lore
release.

## Start here

Read these four in order. They are the derived design layer: what Quest is, what
it must do, how it is shaped, and what gets built when.

- [Quest CLI delivery roadmap](specs/quest-cli-delivery-roadmap.md)
  is the entry point. Seven phases with entry and exit criteria — and the
  finding that Phase 1 is decision work not blocked on the Lore gate, and so
  is the next actionable unit of work.
- [Quest CLI functional requirements](specs/quest-cli-functional-requirements.md)
  is the single requirement identifier space, tracing every requirement to its
  source research, its verifying scenario, and its delivery phase.
- [Quest CLI architecture](specs/quest-cli-architecture.md)
  is the runtime-neutral component structure: layers, ports, trust model,
  durability tiers, and error taxonomy.
- [Quest CLI open component decisions](reference/quest-cli-open-component-decisions.md)
  is every question still open, with owner, unblock condition, and the phase
  that needs it. Check it before freezing anything.

The [architecture decision records](adr/index.md) hold the decisions the
research settled, each citing the document and task that settled it.
[Use quest-cli for the Quest package and command](adr/use-quest-cli-for-the-quest-package-and-command.md)
is the controlling component decision.

## Research foundation

The evidence the design layer derives from. These are provenance records: they
carry dated observations, admission classifications, and recheck clauses, and
they are cited rather than rewritten.

- [Quest CLI component charter](reference/quest-cli-component-charter.md)
  routes product, website, Lore, and Opum decisions to their owners.
- [Quest CLI component contracts and delivery graph](reference/quest-cli-component-contracts-and-delivery-graph.md)
  is the research synthesis the design layer draws on most heavily.
- [Quest CLI research source register](reference/quest-cli-research-source-register.md)
  is the revalidated per-slice admission authority: no source informs Quest
  research unless it is classified there.
- [Former OCLI to QCLI migration ledger](reference/former-ocli-to-qcli-migration-ledger.md)
  is the normative exact component-provenance map.
- [Quest CLI pre-implementation research program](specs/quest-cli-pre-implementation-research-program.md)
  defines the research-only contract and the prohibited-work list that still
  binds every phase.
- [Quest CLI Lore dependency and adapter contract evidence](reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md)
  tracks Lore-dependent Quest choices with owning evidence and reviews the
  lore-cli adapter contract quest-cli must honor.
- [Quest CLI research handover](runbooks/quest-cli-research-handover.md)
  is the context-free pickup path.

## Campaigns

- [Prepare Quest CLI for implementation activation](stories/prepare-quest-cli-for-implementation-activation.md)
  is the active campaign: the derived design layer and the activation-gate
  evidence record.
- [Prepare Quest's clean-room research foundation](stories/prepare-quests-clean-room-research-foundation.md)
  is the completed research campaign.
- [Audit Quest CLI documentation authority](stories/audit-quest-cli-documentation-authority.md)
  records the repository-local part of the cross-product audit.

<!-- lore:index:begin -->
- [adr](adr/index.md)
- [reference](reference/index.md)
- [runbooks](runbooks/index.md)
- [specs](specs/index.md)
- [stories](stories/index.md)
<!-- lore:index:end -->
