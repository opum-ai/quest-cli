---
# yaml-language-server: $schema=../../.lore/schemas/spec.schema.json
type: Spec
title: Quest CLI pre-implementation research program
tags:
  - quest
  - cli
  - research
  - clean-room
summary: Defines the research-only work, evidence outputs, and activation gates that precede Quest CLI implementation.
timestamp: 2026-08-01T17:11:23.787Z
---

# Quest CLI pre-implementation research program

## Summary

This program turns the former OCLI research graph into a current QCLI campaign
without reusing implementation. It produces evidence and contracts that a later
worker can implement after Lore ships; it does not contain product code.

## Requirements

### Allowed work

- revalidate the source register and quarantine boundary;
- reconcile approved legacy Opum requirements into current Quest decisions;
- translate observable defect narratives into black-box scenarios;
- define actors, workflows, domain language, and authority;
- study Backlog migration through public user contracts and owner data;
- model Git, filesystem, identity, lease, and concurrency threats;
- maintain the Lore dependency and activation-evidence matrix; and
- synthesize reviewed, implementation-independent functional contracts and a
  dormant implementation graph.

### Prohibited work before activation

- product source, runtime dependencies, generated CLI or package scaffolding;
- package publication, release workflows that claim readiness, or public
  install instructions;
- inspection or derivation from Backlog.md source or internal tests;
- inspection or copying of quarantined unversioned/dirty artifacts;
- freezing runtime, LadybugDB, packaging, supported-platform, or integration
  choices whose required Lore evidence is unfinished; and
- remote archive/delete, PR mutation, history rewrite, or legacy cleanup.

### Required outputs

Each research task records exact sources, classifications, findings, open
questions, objective verification, and downstream consumers in Lore. The final
synthesis must cover identity and lifecycle, CLI JSON/exits, safe Git mutation,
migration fidelity, projection behavior, and versioned Lore integration.

## Design

### Dependency order

| Task | Output | Depends on |
| --- | --- | --- |
| QCLI-2.1 | Revalidated source register and contamination check | QCLI-1 |
| QCLI-2.2 | Legacy requirement disposition matrix | QCLI-2.1 |
| QCLI-2.3 | Observable black-box regression corpus | QCLI-2.1, QCLI-2.2 |
| QCLI-2.4 | Actors, glossary, and end-to-end workflows | QCLI-2.2 |
| QCLI-2.5 | Public-contract migration fidelity and gaps | QCLI-2.1, QCLI-2.4 |
| QCLI-2.6 | Git/filesystem/concurrency threat model | QCLI-2.2–QCLI-2.4 |
| QCLI-2.7 | Live Lore evidence and activation matrix | QCLI-2.1 |
| QCLI-2.8 | Reviewed contract set and dormant delivery graph | QCLI-2.2–QCLI-2.7 |

### Evidence classes

Use **allowed**, **contextual**, **superseded**, **deferred**, **excluded**, and
**quarantined** exactly as defined by the adopted source register. A class
applies to the named slice, not every file in a repository.

### Verification bar

Research documentation must pass strict Lore validation/checks and diff checks.
Any executable research probe operates only on disposable or explicitly
owner-approved data and records the public contract used.

## Open questions

- Product license and contributor provenance.
- Final npm package ownership and supported platform matrix.
- Runtime and native packaging after Lore's completed evidence is reviewed.
- Canonical ID grammar, authored-record layout, event schema, and scale target.
- Projection engine/lifecycle and the first stable Lore exchange contract.
