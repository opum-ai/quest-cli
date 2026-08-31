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
| `OCLI-3.2` task narrative | `opum-doc:backlog/tasks/ocli-3.2 - Reconcile-legacy-Opum-requirements-and-supersession-decisions.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed — "Historical OCLI Story/Spec/Runbook/task records," gated by migration ledger row `OCLI-3.2 → QCLI-2.2` | Sole content predecessor; supplies the candidate-concept vocabulary (its unchecked AC3/AC4) and the names of the legacy artifacts this task attempted to locate |
| `OCLI-3` task narrative | `opum-doc:backlog/tasks/ocli-3 - Prepare-Opums-clean-room-research-foundation-before-the-Lore-release.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed, gated by ledger row `OCLI-3 → QCLI-2 (frozen predecessor parent)` | Confirms the six-class provenance-before-requirement rule and that QCLI-2 is the sole active successor campaign |
| Historical OCLI pre-release research program (Spec) | `opum-doc:docs/specs/historical-ocli-pre-release-research-program.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed — coupled Documentation of `OCLI-3.2`/`OCLI-3.1`, same ledger gate | Confirms `OCLI-3.2` through `OCLI-3.8` "remained unfinished and were replaced one-for-one by QCLI-2.2 through QCLI-2.8"; confirms the full former (pre-condensation) specification is not present in the working tree, only recoverable from Git history — evidence that no deeper legacy detail is currently admitted here |
| Historical OCLI clean-room research origin (Story) | `opum-doc:docs/stories/historical-ocli-clean-room-research-origin.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed, same ledger gate | Confirms the unfinished/do-not-activate status and the current routing to `quest-cli`'s own Story |
| Historical OCLI research campaign handover (Runbook) | `opum-doc:docs/runbooks/historical-ocli-research-campaign-handover.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed, coupled to `OCLI-3.1` | Confirms handover routing; confirms "the full pre-split cursor and its former prompt remain recoverable from Git history" only — same non-recovery-from-current-tree signal |
| Dated Opum fleet and prior-art inventory | `opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md` | commits `7b82afc`/`d42c016` authored/refreshed the content at the former path `docs/reference/opum-fleet-and-prior-art-inventory.md` (287 lines at `d42c016`); condensed into the current path at commit `846f054` (120 lines); unchanged `846f054`→`opum-doc`'s HEAD as observed 2026-08-04, `d7ca18f` (independently re-verified via `git cat-file`/`git diff`, not copied from the register) | Allowed (explicit register example) | The **prototype review** input for AC1: records `jeremy-newhouse/opum-engine` PR heads `182421e`/`7b0ec48` (also `OCLI-3.1`'s References: `.../opum-engine/pull/1`, `pull/2`) and the 11 dated scenario seeds, both dispositioned "Prototype narrative only; no source/test reuse" / Deferred |
| Git recovery commits `7b82afc`/`d42c016` (former path `docs/reference/opum-fleet-and-prior-art-inventory.md`, before its `846f054` condensation) | `opum-doc` @ `7b82afc03a225f292ed81f916752d318fe237da8` / `d42c01666bc8868c4fe2b55218edbf56e205841f` | authored 2026-07-31; content-verified live 2026-08-04, consistent with the register's own corrected "Git recovery commits `7b82afc`/`d42c016`" slice — `git show d42c016:docs/reference/opum-fleet-and-prior-art-inventory.md` recovers the "Authoritative owned requirement sources" table (see the finding below); `git show 7b82afc:docs/reference/opum-fleet-and-prior-art-inventory.md` shows the same section present at that earlier commit too | Allowed — register's dedicated "Git recovery commits `7b82afc`/`d42c016`" slice, permitted use "recover the full historical 14-row remote register and 24-row fleet register text for audit and citation only" | Recovers the "Authoritative owned requirement sources" table (at `d42c016`, ~line 202) naming `ADR-042`, `SPEC-FEAT-011`, the legacy usage guide/research digest, and Tasks `OPUM-328`/`OPUM-338`–`OPUM-342` as `OCLI-3.1`-registered owned requirement sources — cited for audit/citation only per that slice's exclusion ("not a live source of current Quest requirements"), not as a design source; see the corrected finding below |
| `OCLI-7` task narrative | `opum-doc:backlog/tasks/ocli-7 - Decide-legacy-Opum-evidence-preservation-and-remote-disposition.md` | `opum-doc`, pinned at `d7ca18f` as observed 2026-08-04 | Allowed, gated by "Historical OCLI Story/Spec/Runbook/task records" | Confirms `OCLI-7`'s own AC2 scopes it to a **retention and remote-disposition** decision ("every in-scope legacy repository and pull request receives one owner-approved preserve, archive, close, remove, or no-change disposition") over already-registered legacy sources — not an open question about whether those sources existed |
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

### Finding: named legacy artifacts are located, but not admissible as a live source

`OCLI-3.2`'s own (unexecuted) acceptance criterion #1 names five artifacts as
the intended evidence base: **ADR-042**, **SPEC-FEAT-011**, "the legacy usage
guide/research digest," and tasks **OPUM-328** and **OPUM-338 through
OPUM-342**. This task searched for them before using them, as the register
requires.

A first pass scoped to the `opum-doc` **working tree** did not find them:

- `grep -ril` (case-insensitive) for `ADR-042`, `SPEC-FEAT-011`, `OPUM-328`,
  `OPUM-338`–`OPUM-342`, `usage guide`, and `research digest` across the
  entire `opum-doc` working tree (`opum-doc`, pinned at `d7ca18f` as
  observed 2026-08-04) returned **zero matches** outside `OCLI-3.2`'s own task file.
- `opum-doc:backlog/tasks/` contains no `opum-*` prefixed task files (only
  `ocli-*`); `docs/adr/` and `docs/specs/` contain no `042`- or
  `feat-011`-numbered file.
- The current dated fleet inventory and the source register name neither
  these IDs nor a "usage guide" or "research digest" artifact.

That working-tree-only search was incomplete: it did not reach an already
admitted source. The register's own "Git recovery commits `7b82afc`/
`d42c016`" slice (Allowed; permitted use "recover the full historical
14-row remote register and 24-row fleet register text for audit and
citation only") is itself Allowed and had not yet been read. Reading it
recovers the artifacts: `git show
d42c016:docs/reference/opum-fleet-and-prior-art-inventory.md` (the former,
pre-`846f054`-condensation path) contains, at ~line 202, a section titled
"Authoritative owned requirement sources" whose table names all five, with
candidate value and caution, for example:

- `ADR-042: Git-Native Event Ledger for Multi-Team Task Coordination` —
  "Workspaces, Git CAS claims, leases, accountable delegation,
  event-derived state"; caution: "Physical ledger/merge details are not
  automatically inherited."
- `SPEC-FEAT-011: Agentic Project Management` v0.3.7 — "Functional
  workflows, gates, JSON behavior, coordination language"; caution:
  "Backlog substrate, Python home, `opum pm`, dashboard, and MCP scope
  require supersession/deferment."
- Legacy research digest and usage guide — "Actual product vocabulary and
  observable prototype commands"; caution: "Descriptive prototype evidence,
  not the new command contract."
- Tasks `OPUM-328`, `OPUM-338`–`OPUM-342` — "Review findings, races,
  canonical IDs, commit isolation, joint Lore/ECK questions"; caution:
  "Read task narratives only; old implementation plans/adapters do not
  become current work."

The same recovered table also names a further contextual set this document
had not previously mentioned — legacy ADR-003 (three-way synchronization),
ADR-004 (offline queueing), ADR-014 (RBAC), ADR-027 (Git/docs authority),
SPEC-TYPE-014 (task), and SPEC-FEAT-007 (Context Manager) — recorded there
as contextual, their hosted architecture, platform task model,
embeddings/MCP, and physical sync mechanisms explicitly not current
decisions.

So the five artifacts **are located**, in a slice the register classifies
Allowed — not unlocatable. This document's earlier claim that "no
admissible evidence of their content exists in reach of this task" was
false. What still holds is the disposition, on a corrected ground: the same
Git-recovery-commits slice's own exclusion states it is "not a live source
of current Quest requirements," and its permitted use is "audit and
citation only." Reading the recovered table for citation (as this finding
does) is exactly what that permitted use allows; treating it as a
normative source for a Quest CLI requirement is exactly what its exclusion
bars. The five artifacts are therefore still **rejected from informing a
component-candidate design** here — not for lack of a locatable source, but
because the only admitted source that names them permits citation only, not
requirement derivation (see row #16).

This corrects, rather than resolves, the open question for the owner:
`opum-doc` task `OCLI-7` ("Decide legacy Opum evidence preservation and
remote disposition," still To Do, blocked on `QCLI-2.1`) is scoped, per its
own AC2, to a **retention and remote-disposition** decision — "every
in-scope legacy repository and pull request receives one owner-approved
preserve, archive, close, remove, or no-change disposition" — over
repositories and pull requests the register already registers as owned
requirement sources from `OCLI-3.1`. It is not, and this document no longer
asks it to be, the place to decide **whether** the five artifacts ever
existed as Backlog/Lore records: they demonstrably did, registered in the
`d42c016` table above during `OCLI-3.1`. `OCLI-7` may still decide what
happens to that Git-recovered evidence going forward (retention, remote
visibility, closure); it does not decide the artifacts' historical
existence, because that is no longer in question.

For accuracy, not disposition: the recovered table corroborates, rather
than contradicts, this document's independently-reached candidate
classifications below — `ADR-042`'s listed candidate value maps onto
candidates #1–#6, and `SPEC-FEAT-011`'s onto #5, #7, and #11–#14;
`SPEC-FEAT-011`'s own caution independently lists "Python home" among the
items requiring supersession/deferment, which corroborates (does not newly
establish) candidate #12's Superseded disposition. None of this
corroboration is used as a design source — the classification below cites
the current charter, not this recovered table, as authority.

### Component candidate classification (AC2)

Classification vocabulary used below (a disposition axis for *candidates*,
distinct from the register's source-admission classes):

| Disposition | Meaning |
| --- | --- |
| Reusable | The candidate's intent is already the current, independently-reached quest-cli decision; the legacy narrative corroborates but does not itself supply the design |
| Adapted | A plausible current candidate consistent with the charter's owned surface, but no admitted legacy source supplies a citable authored design — the concept carries forward, the design must be independently re-authored |
| Superseded | A formerly proposed legacy direction explicitly replaced by a named current decision; rationale preserved, not reactivated |
| Deferred | Plausible later scope, explicitly outside quest-cli's first release |
| Rejected | Not carried forward — incompatible with the current boundary, or (see the finding above) located only in a slice whose permitted use is audit/citation only and whose exclusion bars it as a live requirements source |

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
| 6 | Accountable-human delegation / actor responsibilities (who is accountable, delegate, reviewer/approver) | `OCLI-3.2` AC3 | **Routed to opum-doc — not classified here** | The charter names the **product-wide** actor model explicitly as Quest-wide; see AC3 routing below — not a quest-cli-normative candidate in *this* document. This does not foreclose the **component-level** actor-responsibility mapping `QCLI-2.4`'s own AC2 owns as quest-cli's to make |
| 7 | Deterministic JSON output and defined exit behavior | `OCLI-3.2` AC3 | Reusable | Charter already owns "command vocabulary, deterministic JSON, human output, and exit behavior" outright as current, independently-reached quest-cli scope; the legacy narrative corroborates the category, no legacy schema is reused |
| 8 | Read-only purity (a read-only command performs zero worktree mutation) | `OCLI-3.2` AC3 | Adapted | Charter owns "safe filesystem and operation-owned Git behavior"; concrete invariant enumeration is `QCLI-2.6`'s threat-model scope, not duplicated here — recorded only as a reconciliation disposition |
| 9 | Operation-owned commits (writes staged/committed only by their owning operation) | `OCLI-3.2` AC3 | Reusable | Matches the charter's own phrase "operation-owned Git behavior" directly |
| 10 | Canonical task identity and alias handling | `OCLI-3.2` AC3 | Adapted | Charter owns "task/event/workspace schemas" and "migration, coexistence, aliases, and reversible fidelity reports"; no admitted legacy ID-grammar design to port (the research program spec lists "canonical ID grammar" as an explicit open question) |
| 11 | Backlog-as-authority (Backlog.md as the system of record rather than an integration/migration target) | `OCLI-3.2` AC4 (explicitly named as superseded there too) | Superseded | Charter's "Sources of truth" states Git-tracked authored records are authoritative and any index is derived/disposable; the register's Backlog.md-public-surface slice frames Backlog.md as an external public contract quest-cli migrates from and coexists with, not the authority |
| 12 | Python/`opum-engine` as the product/repository home | `OCLI-3.2` AC4 | Superseded | The accepted ADR names `opum-ai/quest-cli` (npm-packaged component repository) as the canonical component home; this disposes of the former product-home/repository-identity fact only — it does not freeze a runtime choice, which the research program spec explicitly keeps open |
| 13 | The old `opum pm ...` command nesting | `OCLI-3.2` AC4 | **Rejected** | Directly answers this task's AC4: charter owns "command vocabulary" as quest-cli's own to author; the ADR fixes the executable as `quest`, not `opum`; no legacy nesting pattern carries forward |
| 14 | Hosted services, RBAC, MCP, dashboard, explorer, broad asset/workflow-platform scope | `OCLI-3.2` AC4 (already deferred by the legacy task itself) | Deferred | Near-verbatim match to the charter's own "First-release non-goals": "local MCP, hosted service, accounts, RBAC, dashboard... a separately versioned kernel package"; also matches the register's "Deferred Opum prototype surfaces" disposition |
| 15 | `jeremy-newhouse/opum-engine` prototype PR surfaces (PR heads `182421e`/`7b0ec48`) and the stdio MCP smoke-boundary gap (scenario seed 10) | Dated fleet and prior-art inventory (prototype review) | Deferred | Register classifies this Deferred with permitted use "preserve the open question... do not design or scaffold against it now"; no design was extracted from it here, consistent with that exclusion |
| 16 | ADR-042, SPEC-FEAT-011, legacy usage guide/research digest, OPUM-328, OPUM-338–342 | `OCLI-3.2` AC1; located via the register's Git recovery commits `7b82afc`/`d42c016` slice (Allowed) | Rejected (not admitted as a requirements source) | See the finding above — the artifacts are located, but the only admitted source naming them permits "audit and citation only," and that same slice's exclusion bars it as "a live source of current Quest requirements"; the recovered table corroborates candidates #1–#6, #7, and #11–#14 without supplying design for any of them |

### Quest-wide proposals routed to opum-doc (AC3)

The component charter states plainly: "Any research result that would change
the Quest-wide vocabulary, actor model, architecture, or roadmap is a
proposal to the consolidated Quest namespace. It is not normative merely
because a QCLI task produced it." Exactly one candidate above crosses that
line:

- **Candidate #6, accountable-human delegation and actor responsibilities**
  (who counts as an accountable human, a delegated agent, a reviewer or
  approver, and how those roles relate to gates) is Quest-wide **actor
  model**, not a quest-cli-local mechanism. This document does not classify
  it reusable/adapted/superseded/deferred/rejected against quest-cli's
  boundary, and does not treat it as a settled quest-cli decision. If a
  later task pursues it, the proposal belongs in `opum-doc`'s consolidated
  Quest namespace, not authored here and not authored into it by this
  quest-cli task (this document has no mutation rights there and does not
  claim any). This routing is scoped to the **product-wide** actor model
  only; it is distinct from the **component-level** actor-responsibility
  mapping `QCLI-2.4`'s own AC2 owns as quest-cli's to make (distinguishing
  accountable humans, delegated agents, reviewers, maintainers, Lore, Git,
  and derived local projections as they act within this component) —
  nothing here forecloses that.
- No other candidate above proposes a change to Quest-wide vocabulary,
  actor model, cross-repository architecture, or roadmap. Candidates #14 and
  #15 (hosted services, RBAC, MCP, dashboard, explorer, broad
  asset/workflow-platform scope, and the `opum-engine` prototype surfaces)
  touch roadmap only in the sense of staying **outside** it — this document
  preserves that deferral and does not propose bringing any of it into
  scope; a future decision to do so would itself need to go to `opum-doc`'s
  consolidated Quest namespace and/or a component-charter revision, per the
  charter's own reclassification language.
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

**2026-08-31 correction pass:** retargeted this document's "routed to
quest-doc" language at `opum-doc`'s consolidated Quest namespace, this
repository's current routing authority per `CLAUDE.md`'s "Consolidated
authority routing." The standalone `quest-doc` repository this document
named is no longer live; `opum-doc` has since frozen it as historical
provenance (see the [component glossary](quest-cli-component-glossary-actors-and-workflows.md)'s
"Recheck clause for the Quest-wide vocabulary citation" and the
[research source register](quest-cli-research-source-register.md#opum-doc-consolidated-quest-namespace)'s
matching correction, both fixed the same pass). Also fixed this document's
own quote of the component charter, which had drifted from the charter's
current "Sources of truth" wording ("the consolidated Quest namespace," not
`quest-doc`) — the glossary had independently copied this document's stale
quote, misattributed to the charter; that is fixed there too. Candidate #6's
disposition (Routed, not classified) is unchanged in substance — only the
routing target's name changed.
