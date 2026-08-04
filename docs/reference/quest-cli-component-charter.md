---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI component charter
tags:
  - quest
  - cli
  - ownership
  - boundaries
summary: Defines what quest-cli owns, what it consumes, and what belongs to quest-doc, quest-web, lore-doc, and opum-doc.
timestamp: 2026-08-01T17:11:23.833Z
---

# Quest CLI component charter

Use this charter to reject scope creep and route decisions before a component
task is created.

## Details

### Owns here

- npm package `@opum-ai/quest` and executable `quest`;
- command vocabulary, deterministic JSON, human output, and exit behavior;
- task/event/workspace schemas and local configuration;
- dependency readiness, claims, leases, gates, lifecycle, and evidence;
- safe filesystem and operation-owned Git behavior;
- migration, coexistence, aliases, and reversible fidelity reports;
- rebuildable local projection, freshness, recovery, and scale;
- versioned Lore import/link/adapter behavior;
- unit, contract, integration, real-clone, fault, packaging, and release tests;
- component release and rollback runbooks.

### Routes elsewhere

| Concern | Owner |
| --- | --- |
| Quest promise, roadmap, cross-repository architecture, provenance policy | [`quest-doc`](https://github.com/salient-data/quest-doc/blob/dev/docs/reference/quest-repository-and-authority-map.md) |
| `questgraph.dev` code, design implementation, hosting, DNS, site operations | `quest-web` |
| Lore-wide policy, integration boundary, and dependency-gate definition | [`lore-doc`](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md) |
| Lore implementation and immutable release evidence | Owning `lore-*` repository, currently `lore-cli` for the package/command |
| Accounts, billing, hosted collaboration, remote portfolio, Opum pricing | [`opum-doc`](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/opum-product-family-and-documentation-ownership.md) / future Opum component |

### First-release non-goals

Generic documentation authoring, graph explorer, local MCP, hosted service,
accounts, RBAC, dashboard, and a separately versioned kernel package.

### Sources of truth

Git-tracked authored records are authoritative. Any graph/index is derived,
disposable, deterministically rebuildable, and explicitly workspace-scoped.
Lore and Quest exchange versioned public data; neither writes the other's
private files or database.

Any research result that would change the Quest-wide vocabulary, actor model,
architecture, or roadmap is a proposal to `quest-doc`. It is not normative
merely because a QCLI task produced it.
