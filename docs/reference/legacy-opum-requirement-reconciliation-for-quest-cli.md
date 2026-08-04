---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Legacy Opum requirement reconciliation for Quest CLI
tags:
  - quest
  - cli
  - legacy
  - requirements
  - clean-room
  - reconciliation
summary: Classifies admitted legacy Opum/OCLI decisions and task narratives as reusable, adapted, superseded, deferred, or rejected Quest CLI component candidates.
timestamp: 2026-08-04T13:04:27.643Z
---

# Legacy Opum requirement reconciliation for Quest CLI

This Reference is QCLI-2.2's legacy requirement disposition matrix: it
extracts component-relevant functional intent from **admitted** legacy Opum
decisions and task narratives and classifies each candidate against
quest-cli's current component boundary. It does not restate or edit the
[Quest CLI research source register](quest-cli-research-source-register.md)
(owned this wave by `QCLI-2.7`; cited here read-only) — every admission
decision below traces to a slice that register already classifies
**Allowed**. It stays consistent with the
[component charter](quest-cli-component-charter.md) and the
[migration ledger](former-ocli-to-qcli-migration-ledger.md), which remain
normative over this document.

Per the migration ledger, `OCLI-3.2` ("Reconcile legacy Opum requirements and
supersession decisions") is this task's sole content predecessor; `OCLI-3.2`
was never executed (`opum-doc` status: To Do, all acceptance criteria
unchecked — a preserved historical scope statement, not completed evidence).
This document independently re-derives its classification from the current
charter and register; it does not treat `OCLI-3.2`'s unchecked criteria as
completed work, and it does not activate `OCLI-3.2` itself.

## Details

### Scope and admission boundary

Only source slices the register classifies **Allowed** inform a candidate
below. Slices classified Contextual, Superseded, Deferred, Excluded, or
Quarantined are named only where the register itself permits (history/risk
framing, or preserving a deferred question) and never supply a candidate's
design. No Backlog.md implementation source, no legacy Opum implementation
source, no artifact under `/Volumes/_repos/`, and no content from the
quarantined local `Backlog.md` clone was opened to produce this document.

### Source-attributed matrix (AC1)

Every admitted legacy decision, specification, guide, task narrative, and
prototype review actually used below, with its register classification and
exact revision.

| Source | Repository / path | Revision | Register classification | Used for |
| --- | --- | --- | --- | --- |
| `OCLI-3.2` task narrative | `opum-doc:backlog/tasks/ocli-3.2 - Reconcile-legacy-Opum-requirements-and-supersession-decisions.md` | `opum-doc` HEAD `d7ca18f`, read 2026-08-04 | Allowed — "Historical OCLI Story/Spec/Runbook/task records," gated by migration ledger row `OCLI-3.2 → QCLI-2.2` | Sole content predecessor; supplies the candidate-concept vocabulary (its unchecked AC3/AC4) and the names of the legacy artifacts this task attempted to locate |
| `OCLI-3` task narrative | `opum-doc:backlog/tasks/ocli-3 - Prepare-Opums-clean-room-research-foundation-before-the-Lore-release.md` | `opum-doc` HEAD `d7ca18f` | Allowed, gated by ledger row `OCLI-3 → QCLI-2 (frozen predecessor parent)` | Confirms the six-class provenance-before-requirement rule and that QCLI-2 is the sole active successor campaign |
| Historical OCLI pre-release research program (Spec) | `opum-doc:docs/specs/historical-ocli-pre-release-research-program.md` | `opum-doc` HEAD `d7ca18f` | Allowed — coupled Documentation of `OCLI-3.2`/`OCLI-3.1`, same ledger gate | Confirms `OCLI-3.2` through `OCLI-3.8` "remained unfinished and were replaced one-for-one by QCLI-2.2 through QCLI-2.8"; confirms the full former (pre-condensation) specification is not present in the working tree, only recoverable from Git history — evidence that no deeper legacy detail is currently admitted here |
| Historical OCLI clean-room research origin (Story) | `opum-doc:docs/stories/historical-ocli-clean-room-research-origin.md` | `opum-doc` HEAD `d7ca18f` | Allowed, same ledger gate | Confirms the unfinished/do-not-activate status and the current routing to `quest-cli`'s own Story |
| Historical OCLI research campaign handover (Runbook) | `opum-doc:docs/runbooks/historical-ocli-research-campaign-handover.md` | `opum-doc` HEAD `d7ca18f` | Allowed, coupled to `OCLI-3.1` | Confirms handover routing; confirms "the full pre-split cursor and its former prompt remain recoverable from Git history" only — same non-recovery-from-current-tree signal |
| Dated Opum fleet and prior-art inventory | `opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md` | commits `7b82afc`/`d42c016`, content unchanged at `opum-doc` HEAD `d7ca18f` | Allowed (explicit register example) | The **prototype review** input for AC1: records `jeremy-newhouse/opum-engine` PR heads `182421e`/`7b0ec48` (also `OCLI-3.1`'s References: `.../opum-engine/pull/1`, `pull/2`) and the 11 dated scenario seeds, both dispositioned "Prototype narrative only; no source/test reuse" / Deferred |
| Quest CLI component charter | `docs/reference/quest-cli-component-charter.md` (this repo) | this branch, based on `4dd721a` | Allowed — "Prior QCLI research records" | The current-boundary authority every classification below is measured against (Owns-here list, routing table, first-release non-goals, the actor-model/vocabulary/architecture/roadmap routing rule) |
| Former OCLI to QCLI migration ledger | `docs/reference/former-ocli-to-qcli-migration-ledger.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | The row-gating authority for which OCLI records are admitted at all, and the preservation rules (no parallel activation, cite exact record, no blanket flip) |
| Use quest-cli for the Quest package and command (ADR) | `docs/adr/use-quest-cli-for-the-quest-package-and-command.md` (this repo) | this branch, incl. the 2026-08-04 `QCLI-5` amendment | Allowed — "Prior QCLI research records" | AC4 evidence: current package/repository/command identity, and its explicit supersession of the former `opum-cli` identity |
| Quest CLI pre-implementation research program (Spec) | `docs/specs/quest-cli-pre-implementation-research-program.md` (this repo) | this branch | Allowed — "Prior QCLI research records" | Confirms QCLI-2.2's expected output ("Legacy requirement disposition matrix"), its dependency on QCLI-2.1, and the prohibited-work list this document stays inside |

Considered but explicitly **not** used to inform any candidate, named here
for completeness rather than silently omitted:

| Source | Register classification | Why not used |
| --- | --- | --- |
| Former `opum-cli`/`opum-doc` repository identity | Contextual | History/risk framing only, per the register's own rule; already covered by the ADR's and ledger's current-identity statements above |
| `use-opum-cli-as-opums-canonical-first-repository.md` / `use-opum-doc-as-the-opum-saas-portfolio-hub.md` ADRs (`opum-doc`) | Not separately listed in the register; falls under the Contextual former-repository-identity slice by subject matter | Repository/portfolio identity history, not a component functional-intent source |
| Backlog.md implementation source and internal tests | Excluded | Not opened, per the owner's strict clean-room ruling |
| Local Backlog.md clone (`/Volumes/external/repos/Backlog.md`) | Quarantined | Not opened, per its explicit quarantine slice |
| Quarantined legacy Opum artifacts (`/Volumes/_repos/opum-cli`, `/Volumes/_repos/fast-mcp-opum`) | Quarantined | Not opened; no new owner provenance decision is in effect |
| `lore-cli` Backlog.md corpus (ADR-0002, ADR-0012, backlog-cli-contract, backlog-json-schema, backlog-json-patch) | Contextual — source-tainted | Out of this task's scope (Lore/Backlog fidelity is `QCLI-2.5`'s and `QCLI-2.7`'s); not opened |
| npm package name occupancy | Excluded (naming-conflict evidence only) | `QCLI-2.9`'s scope, not a functional requirement |

### Finding: named legacy artifacts that could not be admitted

`OCLI-3.2`'s own (unexecuted) acceptance criterion #1 names five artifacts as
the intended evidence base: **ADR-042**, **SPEC-FEAT-011**, "the legacy usage
guide/research digest," and tasks **OPUM-328** and **OPUM-338 through
OPUM-342**. This task searched for them before using them, as the register
requires:

- `grep -ril` (case-insensitive) for `ADR-042`, `SPEC-FEAT-011`, `OPUM-328`,
  `OPUM-338`–`OPUM-342`, `usage guide`, and `research digest` across the
  entire `opum-doc` working tree (`opum-doc` HEAD `d7ca18f`, run
  2026-08-04) returned **zero matches** outside `OCLI-3.2`'s own task file.
- `opum-doc:backlog/tasks/` contains no `opum-*` prefixed task files (only
  `ocli-*`); `docs/adr/` and `docs/specs/` contain no `042`- or
  `feat-011`-numbered file.
- The [dated Opum fleet and prior-art inventory](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md)
  and the [source register](quest-cli-research-source-register.md) — the two
  places a legitimate admission would have to appear — name neither these
  IDs nor a "usage guide" or "research digest" artifact.

Per the register's own admission rule, "no source slice informs a QCLI
requirement unless it is listed here as Allowed." None of these five
artifacts is listed, under any name, in any classification. They are
therefore **rejected from this reconciliation for lack of an admitted,
locatable source** — a provenance gap, not a content judgment; this document
does not assert they lack merit, only that no admissible evidence of their
content exists in reach of this task. Consistent with the clean-room
boundary, this task did not search the Quarantined `/Volumes/_repos/`
artifacts, the Deferred `jeremy-newhouse/opum-engine` PR heads, or any other
unadmitted location to try to recover them — doing so would itself violate
the admission rule this finding exists to enforce.

This is reported as an out-of-scope discovery, not resolved here: `opum-doc`
task `OCLI-7` ("Decide legacy Opum evidence preservation and remote
disposition," still To Do, blocked on `QCLI-2.1`) is the owner-facing task
scoped to legacy-evidence disposition and is the natural place to decide
whether these artifacts ever existed as Backlog/Lore records, or should be
searched for elsewhere, if the owner wants that pursued.

### Component candidate classification (AC2)

Classification vocabulary used below (a disposition axis for *candidates*,
distinct from the register's source-admission classes):

| Disposition | Meaning |
| --- | --- |
| Reusable | The candidate's intent is already the current, independently-reached quest-cli decision; the legacy narrative corroborates but does not itself supply the design |
| Adapted | A plausible current candidate consistent with the charter's owned surface, but no admitted legacy source supplies a citable authored design — the concept carries forward, the design must be independently re-authored |
| Superseded | A formerly proposed legacy direction explicitly replaced by a named current decision; rationale preserved, not reactivated |
| Deferred | Plausible later scope, explicitly outside quest-cli's first release |
| Rejected | Not carried forward — incompatible with the current boundary, or (see the finding above) unlocatable under the clean-room admission rule |

No row below treats a legacy physical file layout, merge driver, package
structure, or implementation technique as automatically inherited — the
same discipline `OCLI-3.2`'s own (unexecuted) AC5 named, kept here because
no legacy implementation source was, or may be, inspected regardless.

| # | Candidate | Legacy source | Disposition | Current-boundary rationale |
| --- | --- | --- | --- | --- |
| 1 | Event-derived task/workspace state | `OCLI-3.2` AC3 | Adapted | Charter owns "task/event/workspace schemas and local configuration" directly; no admitted legacy event schema exists to port, so the concept (state derived from an authoritative event history) carries forward as a candidate for independent authorship, not a design |
| 2 | Explicit workspace enrollment/scoping | `OCLI-3.2` AC3 | Adapted | Same charter line as #1; no admitted legacy workspace design |
| 3 | Git CAS-backed claim records | `OCLI-3.2` AC3 | Adapted | Charter owns "dependency readiness, claims, leases, gates, lifecycle, and evidence" and "safe filesystem and operation-owned Git behavior"; no admitted legacy implementation may inform the mechanism (Backlog.md internals Excluded, opum-engine Deferred) |
| 4 | TTL leases | `OCLI-3.2` AC3 | Adapted | Same charter line as #3; concrete lease/heartbeat semantics are `QCLI-2.4`'s and `QCLI-2.6`'s scope, not fixed here |
| 5 | Human/plan/review gates (mechanism: block-until-satisfied, evidence recorded) | `OCLI-3.2` AC3 | Adapted | Charter owns "claims, leases, gates, lifecycle, and evidence" as a CLI mechanism; the gate *mechanism* is a quest-cli candidate — see #6 for the actor semantics this excludes |
| 6 | Accountable-human delegation / actor responsibilities (who is accountable, delegate, reviewer/approver) | `OCLI-3.2` AC3 | **Routed to quest-doc — not classified here** | The charter names "actor model" explicitly as Quest-wide; see AC3 routing below — not a quest-cli-normative candidate in this document |
| 7 | Deterministic JSON output and defined exit behavior | `OCLI-3.2` AC3 | Reusable | Charter already owns "command vocabulary, deterministic JSON, human output, and exit behavior" outright as current, independently-reached quest-cli scope; the legacy narrative corroborates the category, no legacy schema is reused |
| 8 | Read-only purity (a read-only command performs zero worktree mutation) | `OCLI-3.2` AC3 | Adapted | Charter owns "safe filesystem and operation-owned Git behavior"; concrete invariant enumeration is `QCLI-2.6`'s threat-model scope, not duplicated here — recorded only as a reconciliation disposition |
| 9 | Operation-owned commits (writes staged/committed only by their owning operation) | `OCLI-3.2` AC3 | Reusable | Matches the charter's own phrase "operation-owned Git behavior" directly |
| 10 | Canonical task identity and alias handling | `OCLI-3.2` AC3 | Adapted | Charter owns "task/event/workspace schemas" and "migration, coexistence, aliases, and reversible fidelity reports"; no admitted legacy ID-grammar design to port (the research program spec lists "canonical ID grammar" as an explicit open question) |
| 11 | Backlog-as-authority (Backlog.md as the system of record rather than an integration/migration target) | `OCLI-3.2` AC4 (explicitly named as superseded there too) | Superseded | Charter's "Sources of truth" states Git-tracked authored records are authoritative and any index is derived/disposable; the register's Backlog.md-public-surface slice frames Backlog.md as an external public contract quest-cli migrates from and coexists with, not the authority |
| 12 | Python/`opum-engine` as the product/repository home | `OCLI-3.2` AC4 | Superseded | The accepted ADR names `opum-ai/quest-cli` (npm-packaged component repository) as the canonical component home; this disposes of the former product-home/repository-identity fact only — it does not freeze a runtime choice, which the research program spec explicitly keeps open |
| 13 | The old `opum pm ...` command nesting | `OCLI-3.2` AC4 | **Rejected** | Directly answers this task's AC4: charter owns "command vocabulary" as quest-cli's own to author; the ADR fixes the executable as `quest`, not `opum`; no legacy nesting pattern carries forward |
| 14 | Hosted services, RBAC, MCP, dashboard, explorer, broad asset/workflow-platform scope | `OCLI-3.2` AC4 (already deferred by the legacy task itself) | Deferred | Near-verbatim match to the charter's own "First-release non-goals": "local MCP, hosted service, accounts, RBAC, dashboard... a separately versioned kernel package"; also matches the register's "Deferred Opum prototype surfaces" disposition |
| 15 | `jeremy-newhouse/opum-engine` prototype PR surfaces (PR heads `182421e`/`7b0ec48`) and the stdio MCP smoke-boundary gap (scenario seed 10) | Dated fleet and prior-art inventory (prototype review) | Deferred | Register classifies this Deferred with permitted use "preserve the open question... do not design or scaffold against it now"; no design was extracted from it here, consistent with that exclusion |
| 16 | ADR-042, SPEC-FEAT-011, legacy usage guide/research digest, OPUM-328, OPUM-338–342 | `OCLI-3.2` AC1 (named, not located) | Rejected (not admitted) | See the finding above — no admitted, locatable source exists to classify against a current boundary |

### Quest-wide proposals routed to quest-doc (AC3)

The component charter states plainly: "Any research result that would change
the Quest-wide vocabulary, actor model, architecture, or roadmap is a
proposal to `quest-doc`. It is not normative merely because a QCLI task
produced it." Exactly one candidate above crosses that line:

- **Candidate #6, accountable-human delegation and actor responsibilities**
  (who counts as an accountable human, a delegated agent, a reviewer or
  approver, and how those roles relate to gates) is Quest-wide **actor
  model**, not a quest-cli-local mechanism. This document does not classify
  it reusable/adapted/superseded/deferred/rejected against quest-cli's
  boundary, and does not treat it as a settled quest-cli decision. If a
  later task pursues it, the proposal belongs in `quest-doc`'s own
  repository, not authored here and not authored into `quest-doc` by this
  quest-cli task (this document has no mutation rights there and does not
  claim any).
- No other candidate above proposes a change to Quest-wide vocabulary,
  actor model, cross-repository architecture, or roadmap. Candidates #14 and
  #15 (hosted services, RBAC, MCP, dashboard, explorer, broad
  asset/workflow-platform scope, and the `opum-engine` prototype surfaces)
  touch roadmap only in the sense of staying **outside** it — this document
  preserves that deferral and does not propose bringing any of it into
  scope; a future decision to do so would itself need to go to `quest-doc`
  and/or a component-charter revision, per the charter's own reclassification
  language.
- `#12`'s disposition (Python/`opum-engine` as product home, Superseded) is
  scoped to repository/product-home identity only, not the runtime engineering
  choice; the runtime remains explicitly open per the research program spec's
  own open questions and this document does not resolve it.

### Rejected identity vs. preserved execution invariants (AC4)

**Rejected**, per the accepted ADR
[Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md)
and the register's current-identity slices:

- **Former product name** — "Opum"/`opum` as the execution product and its
  planned `opum` package/executable. The product is Quest; the executable is
  `quest`; the target npm package is the scoped `@opum-ai/quest` (confirmed
  unclaimed 2026-08-04; final allocation remains `QCLI-2.9`'s scope, not
  decided here).
- **Former repository home** — `salient-data/opum-cli` (renamed in place to
  `salient-data/opum-doc` on 2026-08-01). It is explicitly **not** the Quest
  implementation home per the register. The canonical component repository is
  `opum-ai/quest-cli`, transferred 2026-08-04 under `QCLI-5`; this worktree's
  own `origin` remote was re-verified live during this task
  (`git@github.com:opum-ai/quest-cli.git`), matching the ADR amendment and the
  register.
- **Former command namespace** — the legacy `opum pm ...` nested command
  grouping named in `OCLI-3.2` AC4 (candidate #13 above). quest-cli's command
  vocabulary is the charter's own to author; no legacy nesting carries
  forward.

**Preserved**, as candidates for independent authorship under the current
charter (not as ported legacy designs — see the Reusable/Adapted rows
above): deterministic JSON output and defined exit behavior (#7, Reusable),
operation-owned commits (#9, Reusable), the dependency-readiness/claims/
leases/gates *mechanism* excluding actor semantics (#3–#5, Adapted),
event-derived task/workspace state (#1–#2, Adapted), canonical task identity
and alias handling (#10, Adapted), and read-only-purity Git/filesystem
behavior (#8, Adapted). None of these is frozen as an exact schema, format,
or exit-code table here — the research program spec explicitly keeps runtime,
packaging, and integration choices open pending Lore evidence, and this
document only preserves the invariant *category*, consistent with `OCLI-3.2`
AC5's discipline against inheriting physical implementation.

## Notes

This task did not open, search, copy, execute, or derive design from
Backlog.md implementation source or internal tests, the local Backlog.md
clone, any Quarantined legacy Opum artifact, or the Deferred
`jeremy-newhouse/opum-engine` prototype surfaces beyond their register-cited
existence and disposition. It made no repository, package, release, or
remote mutation, and it did not edit the source register (owned this wave by
`QCLI-2.7`) or any file outside this task's own new document and its Backlog
task record.
