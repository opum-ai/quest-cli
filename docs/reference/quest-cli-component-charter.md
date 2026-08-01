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

- preferred npm package `quest` and executable `quest`;
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
| Quest promise, roadmap, cross-repository architecture, provenance policy | `quest-doc` |
| `questgraph.dev` code, design implementation, hosting, DNS, site operations | `quest-web` |
| Lore product behavior or Lore release evidence | `lore-doc` / owning `lore-*` repo |
| Accounts, billing, hosted collaboration, remote portfolio, Opum pricing | `opum-doc` / future Opum component |

### First-release non-goals

Generic documentation authoring, graph explorer, local MCP, hosted service,
accounts, RBAC, dashboard, and a separately versioned kernel package.

### Sources of truth

Git-tracked authored records are authoritative. Any graph/index is derived,
disposable, deterministically rebuildable, and explicitly workspace-scoped.
Lore and Quest exchange versioned public data; neither writes the other's
private files or database.
