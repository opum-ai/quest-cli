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
- reconcile admitted legacy Opum requirements into Quest CLI component
  candidates and route product-wide proposals to `quest-doc`;
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
| QCLI-2.9 | Npm package allocation and provenance evidence (packaging contract); scope is allocation and provenance only — it does not cover runtime, native-packaging, or supported-platform choices | QCLI-2.1 |
| QCLI-2.10 | Backlog-to-Quest adoption and migration playbook | QCLI-2.5 |

QCLI-2.9 and QCLI-2.10 sit outside the synthesis chain that QCLI-2.8
draws on: neither is a QCLI-2.8 input, and neither resolves
the "Runtime and native packaging..." or "Final npm package ownership and
supported platform matrix" entries under Open questions, below — those
stay open and unowned by any current task.

### Evidence classes

Use **allowed**, **contextual**, **superseded**, **deferred**, **excluded**, and
**quarantined** as provisional terms from the dated
[Opum fleet and prior-art inventory](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md).
That OCLI register is historical input, not an adopted current Quest source
register. A class applies only to the named slice, not every file in a
repository, and no slice may inform a current requirement until QCLI-2.1
revalidates and admits it.

### External activation authority

The maintained Lore integration boundary and release-gate policy is
[owned by lore-doc](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md).
This program records only component dependency status and evidence
consumption. It does not redefine Lore's gate or assert that Lore, Quest, or a
Quest package has been released.

### Verification bar

Research documentation must pass strict Lore validation/checks and diff checks.
Any executable research probe operates only on disposable or explicitly
owner-approved data and records the public contract used.

#### Moving vs. immutable references

A recurring failure mode in this program: a worker runs a real command, gets a
real answer, and writes it down using a word ("HEAD", "current") that silently
converts a dated observation into a standing claim. This subsection generalizes
the fix rather than repairing sites one at a time.

- **Moving reference** — a fact that can change on the next observation without
  any document edit: branch HEAD, working-tree state, `npm view` availability,
  Backlog task status, an ahead/behind count, and anything else that is a
  re-runnable query result rather than a fixed record. A moving reference is
  recorded as:

  ```text
  <value> (observed <date>; moving reference, re-verify before relying)
  ```

- **Immutable anchor** — a fact that re-observation cannot change: a Git tag, a
  commit SHA, a published package version, a release timestamp. An immutable
  anchor may be stated flat, with no qualifying phrase, because there is
  nothing for a later re-check to overturn.

#### Recheck clause requirement

Any document whose conclusion depends on a moving reference must carry a
recheck clause naming the exact commands to re-run and what a changed result
obligates. Two implementations already in the corpus are the reference model
for this shape, independently invented before this rule was generalized:

- `QCLI-2.9`'s mandatory release-time recheck clause in the
  [Quest CLI packaging contract](../reference/quest-cli-packaging-contract.md)
  ("Mandatory release-time recheck clause (AC1)") — names the exact `npm view`
  and `gh api` commands a release-time worker must re-run, and states that a
  changed result is a new fact for the owner to rule on, not grounds for a
  worker to substitute a name unilaterally.
- `QCLI-2.7`'s AC6 reclassification trigger in
  [Quest CLI Lore dependency and adapter contract evidence](../reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md)
  ("Reclassification trigger, stated explicitly (AC6)") — names the exact
  `git diff --stat` command whose non-empty result must trigger
  re-classification of every finding it touches before further reliance.

A recheck clause is incomplete if it states only that re-verification is
needed; it must name the literal command(s) to re-run and the disposition of a
changed result (who rules on it, and what a worker may not do unilaterally).

#### Scope of the convention

This convention binds new and amended documents. It requires no retroactive
rewrite of existing documents — sites already flagged in the current corpus are
brought into compliance as a side effect of the tasks already doing that work,
not by this Spec reaching back into documents it does not own.

#### Relationship to the source register

This is the general case of a rule the
[research source register](../reference/quest-cli-research-source-register.md)
already states for one instance: the "lore-cli / the `lore` command" slice's
Reclassification triggers bullet, which independently records that a GitHub
rename/transfer redirect makes a stale org reference resolve silently, so any
citation using an org name must be re-verified against the live
`git remote`/`gh api` identity rather than assumed correct because a lookup
under the old name succeeded. That trigger is the specific, single-instance
form of the moving-vs-immutable distinction above (a `git remote`/`gh api`
identity check is a moving reference); this subsection is the general rule it
is an instance of.

## Open questions

- Product license and contributor provenance.
- Final npm package ownership and supported platform matrix.
- Runtime and native packaging after Lore's completed evidence is reviewed.
- Canonical ID grammar, authored-record layout, event schema, and scale target.
- Projection engine/lifecycle and the first stable Lore exchange contract.
