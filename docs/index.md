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

<!-- lore:index:begin -->
- [adr](adr/index.md)
- [reference](reference/index.md)
- [runbooks](runbooks/index.md)
- [specs](specs/index.md)
- [stories](stories/index.md)
<!-- lore:index:end -->
