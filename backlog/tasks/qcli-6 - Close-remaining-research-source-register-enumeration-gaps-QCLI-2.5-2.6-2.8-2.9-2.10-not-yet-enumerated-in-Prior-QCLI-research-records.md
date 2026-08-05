---
id: QCLI-6
title: >-
  Close remaining research-source-register enumeration gaps (QCLI-2.5, 2.6, 2.8,
  2.9, 2.10 not yet enumerated in 'Prior QCLI research records')
status: To Do
assignee: []
created_date: '2026-08-05 02:29'
updated_date: '2026-08-05 02:50'
labels:
  - research
  - register
  - correction
  - no-implementation
  - clean-room
  - 'cluster:provenance'
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - campaign
dependencies:
  - QCLI-2.5
  - QCLI-2.6
  - QCLI-2.8
  - QCLI-2.9
  - QCLI-2.10
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
priority: medium
type: docs
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The register's "Prior QCLI research records" slice (docs/reference/quest-cli-research-source-register.md, around lines 787-829) enumerates 9 members. Five merged deliverables are relied upon by other campaign outputs without being enumerated as members of that slice:

- QCLI-2.5's Backlog migration fidelity contract (docs/reference/quest-cli-backlog-migration-fidelity-contract.md)
- QCLI-2.6's Git/filesystem/concurrency threat model (docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
- QCLI-2.8's component contracts and delivery graph (docs/reference/quest-cli-component-contracts-and-delivery-graph.md)
- QCLI-2.9's packaging contract (docs/reference/quest-cli-packaging-contract.md)
- QCLI-2.10's Backlog adoption and migration playbook (docs/reference/quest-cli-backlog-adoption-and-migration-playbook.md)

This is the identical gap class QCLI-2.12 closed for four other documents earlier in the campaign -- the register's own text already concedes the pattern for those: previously-cited documents were "not previously named in this enumeration despite already being relied on... by merged deliverables."

Separately, the register's "Backlog.md public surface" slice does not state whether process-level responses from running the installed tool (for example, an `mcp start` stdio JSON-RPC response, used substantively by QCLI-2.5's deliverable) are an admissible evidence class either way. This was flagged independently by two reviewers across two different waves of the QCLI-2 campaign.

Neither gap currently blocks any settled task's own acceptance criteria -- both QCLI-2.8 and QCLI-2.10 already disclose the specific instance affecting them (a caveat paragraph in each, added in their own settlement pass) rather than silently relying on unenumerated coverage. This task closes the underlying gap those disclosures point at.

Documentation only. Do not reclassify any source, and do not narrow any permitted use a merged deliverable already relies on -- the same non-negotiable constraint QCLI-2.12 operated under throughout its own register-coherence work. No product source, runtime dependency, executable scaffolding, package publication, or release.

For the durable pattern on how to pin a document that this same task's own passes might co-edit (i.e. anything this task edits together with the register in the same pass), see QCLI-2.12's task notes and PR #17: pin it to its own current state on this branch, as amended live through this same edit, rather than to an exact commit SHA -- a SHA pin of a co-edited sibling is structurally invalidated the instant a later commit in the same pass touches it again.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The register's "Prior QCLI research records" slice enumerates all five identified documents (QCLI-2.5, 2.6, 2.8, 2.9, and 2.10's outputs), each correctly pinned -- self-pinned to its own current state if co-edited by this same task's own passes, SHA-pinned to a specific commit otherwise
- [ ] #2 The "Backlog.md public surface" slice's Permitted use states explicitly whether process-level responses from running the installed tool are an admissible evidence class, with reasoning either way
- [ ] #3 No slice loses its Classification field, the slice-to-Classification count stays one-to-one, and no permitted use is narrowed below what a merged deliverable already relies on
- [ ] #4 lore check --strict, lore validate --strict, and lore orphans report zero errors, warnings, and orphans
<!-- AC:END -->
