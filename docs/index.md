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

This repository currently contains planning, provenance, and research only.
Product source and runtime dependencies remain gated on the full Lore release.

## Start here

- [Prepare Quest's clean-room research foundation](stories/prepare-quests-clean-room-research-foundation.md)
  is the sole active component research campaign.
- [Use quest-cli for the Quest package and command](adr/use-quest-cli-for-the-quest-package-and-command.md)
  is the controlling component decision.
- [Quest CLI pre-implementation research program](specs/quest-cli-pre-implementation-research-program.md)
  defines the current research-only contract.
- [Quest CLI component charter](reference/quest-cli-component-charter.md)
  routes product, website, Lore, and Opum decisions to their owners.
- [Former OCLI to QCLI migration ledger](reference/former-ocli-to-qcli-migration-ledger.md)
  is the normative exact component-provenance map.
- [Quest CLI research source register](reference/quest-cli-research-source-register.md)
  is the revalidated per-slice admission authority: no source informs Quest
  research unless it is classified there.
- [Quest CLI research handover](runbooks/quest-cli-research-handover.md)
  is the context-free pickup path.
- [Audit Quest CLI documentation authority](stories/audit-quest-cli-documentation-authority.md)
  records the repository-local part of the cross-product audit.

<!-- lore:index:begin -->
- [adr](adr/index.md)
- [reference](reference/index.md)
- [runbooks](runbooks/index.md)
- [specs](specs/index.md)
- [stories](stories/index.md)
<!-- lore:index:end -->
