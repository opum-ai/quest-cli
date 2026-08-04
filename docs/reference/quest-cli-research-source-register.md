---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI research source register
tags:
  - quest
  - cli
  - provenance
  - clean-room
  - research
  - source-register
summary: Revalidates the OCLI-3.1 register per slice; QCLI-2.7 added the lore-cli split rule and closed two evidence gaps; QCLI-2.12 closed admission-authority coherence gaps without reclassifying any source.
timestamp: 2026-08-04T13:29:14.000Z
---

# Quest CLI research source register

This Reference is QCLI-2.1's revalidation of the completed OCLI-3.1 provenance
register after the former `opum-cli` repository's rename to `opum-doc`. It
replaces the [dated Opum fleet and prior-art inventory](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md)
as the admission authority for Quest research (the inventory itself remains
Allowed for citation, see below): no source slice
informs a QCLI requirement unless it is listed here as **Allowed**, and then
only for the exact permitted use recorded against it. It stays consistent
with, and does not restate or override, `quest-doc`'s canonical
[provenance ledger](https://github.com/salient-data/quest-doc/blob/dev/docs/reference/quest-provenance-and-migration-ledger.md)
and the [former OCLI to QCLI migration ledger](former-ocli-to-qcli-migration-ledger.md),
which remains the normative task-by-task mapping. Every fact below was
re-verified live on 2026-08-04, not copied from the prior capsule.

## Details

### Classification vocabulary

Terms inherited from the [research program](../specs/quest-cli-pre-implementation-research-program.md)'s
evidence classes, restated here with a concrete example from this register so
they are usable without cross-repository lookup. A class applies only to the
named slice, never to every file in its repository.

| Class | Meaning | Example here |
| --- | --- | --- |
| Allowed | Exact owner decision, authored requirement, public contract, or attested data slice; cite the named slice and dated revision, revalidate before use | Dated fleet inventory, Backlog.md public surface, lore-cli's published CLI surface, the 2026-08-04 owner decision on quest-cli's `opum-ai` identity |
| Contextual | Owned or public material with a different product boundary; explain history or risk only | The `opum-doc` repository itself; the Lore-owned release gate |
| Superseded | Formerly accepted direction replaced by a named decision; preserve rationale, do not reactivate | Migration ledger's OCLI-1 row (backlog-handover skill port, QCLI-4, commit `287c2b8`) — recorded there, not duplicated here; the component ADR's decision #1 (`salient-data/quest-cli` as canonical), superseded by the owner's `opum-ai` identity decision — recorded as a finding in this register and amended inline in the ADR itself by QCLI-5 on 2026-08-04 |
| Deferred | Plausible later surface outside the first release; preserve the question and revisit trigger | Opum MCP/hosted-UI prototype surfaces |
| Excluded | Backlog.md implementation source/tests or unapproved source material; no inspection, copying, execution, or design derivation | Backlog.md implementation source/tests; unrelated npm-squatted packages |
| Quarantined | Dirty, unversioned, snapshot-derived, secret-adjacent, or attribution-ambiguous material; identity and previously captured metadata only | Legacy unversioned Opum fleet artifacts |

### Opum/OCLI research provenance (`opum-doc`)

#### Former `opum-cli` repository identity

- **Classification:** Contextual — owned material with a different product
  boundary (per the classification vocabulary's own Contextual example,
  "the `opum-doc` repository itself"); explains history and risk only.
- **Repository or URL:** `github.com/salient-data/opum-doc`, local worktree
  `/Volumes/external/repos/opum-doc` (formerly `salient-data/opum-cli` /
  local `opum-cli`).
- **Exact revision or retrieval date:** rename effective 2026-08-01; re-verified
  live 2026-08-04 by running `git remote -v` in the local checkout, which
  returns `git@github.com:salient-data/opum-doc.git`, pinned at `opum-doc`'s
  HEAD as observed 2026-08-04, `d7ca18f` — a moving branch reference, not
  asserted current beyond that observation (see the dated Opum fleet and
  prior-art inventory slice below, which records `d7ca18f` as already
  superseded by `bee848a`/`7b512d9` later the same day).
- **Ownership rationale:** the repository-rename decision recorded in the
  accepted ADR [Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md)
  and in `quest-doc`'s canonical provenance ledger; `opum-doc` is the owner of
  Opum SaaS/portfolio policy and retained OCLI historical records.
- **Permitted use:** cite specific admitted `opum-doc` Story/Spec/ADR/Runbook/
  Reference/task records as OCLI research provenance, one artifact at a time,
  with its own exact revision.
- **Exclusions:** `opum-doc` is **not** the Quest implementation home (AC2) —
  no product source, runtime dependency, or release artifact for `quest`/
  `quest-cli` may be sourced from it. Any legacy Opum CLI implementation
  source or test code that may remain in `opum-doc`'s Git history stays
  excluded from inspection under the clean-room boundary regardless of the
  rename.
- **Reclassification triggers:** a further rename or org transfer of the
  repository; an owner decision changing `opum-doc`'s ownership scope;
  `opum-doc` Story "Decide legacy Opum evidence disposition" (task `OCLI-7`,
  blocked on this task) resolving remote disposition.

#### Dated Opum fleet and prior-art inventory

- **Classification:** Allowed (per the classification vocabulary's own
  Allowed example, "Dated fleet inventory").
- **Repository or URL:** `opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md`
  ([link](https://github.com/salient-data/opum-doc/blob/dev/docs/reference/dated-opum-fleet-and-prior-art-inventory.md)).
- **Exact revision or retrieval date:** authored 2026-07-31, refreshed
  2026-08-01T02:35Z and 2026-08-01T04:14Z at commits `7b82afc` and `d42c016`
  — **corrected 2026-08-04 by `QCLI-2.7`, superseding this slice's prior
  claim.** The prior text asserted "file content unchanged since `d42c016`
  as of `opum-doc` HEAD `d7ca18f`," verified only by commit *reachability*
  (`git show 7b82afc --stat` / `git show d42c016 --stat` succeeding), never
  by confirming those commits actually touch the cited path. `QCLI-2.2`'s
  review falsified that claim and `QCLI-2.7` independently re-verified it
  live in the local `opum-doc` checkout: `git cat-file -e
  7b82afc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md` and
  the same at `d42c016` both report the path **absent** at that revision —
  `7b82afc`/`d42c016` authored and refreshed the file at its **former**
  path, `docs/reference/opum-fleet-and-prior-art-inventory.md` — 284 lines
  at `7b82afc`, growing to 287 lines at `d42c016`. A later commit,
  `c5ebee8` ("docs: establish Opum SaaS documentation hub," 2026-08-01),
  grew it further to 292 lines; that is its size immediately before the
  rename. `846f054^` is `3023468` ("chore(backlog): sync task changes"),
  confirmed via `git log -1 --format='%H %s' 846f054^`; `c5ebee8` is not
  `846f054`'s immediate parent but is the last commit to touch the former
  path before the rename — established via `git log -1 846f054^ --
  docs/reference/opum-fleet-and-prior-art-inventory.md`, which returns
  `c5ebee8` — and remains an ancestor of `846f054` (`git merge-base
  --is-ancestor c5ebee8 846f054` succeeds). The file is unchanged at 292
  lines from `c5ebee8` through `846f054^`/`3023468`, confirmed via `git show
  846f054^:docs/reference/opum-fleet-and-prior-art-inventory.md | wc -l`.
  Commit `846f054` (2026-08-01, unattributed as a Git rename — recorded as
  a 292-line delete plus a 120-line add, a ~59% condensation, not an
  edit-in-place) created the current path. Commit `bee848a` (2026-08-04)
  made one further, one-line edit at the current path (a stale
  `salient-data/quest-cli` link repointed to `opum-ai/quest-cli`, part of
  the org-transfer sweep) — so the file was unchanged from `846f054`
  through `d7ca18f` (consistent with, not contradicting, `QCLI-2.2`'s own
  true and properly-bounded "unchanged `846f054` → HEAD `d7ca18f`" claim),
  but `d7ca18f` was already a stale pin by 2026-08-04: `bee848a` made one
  further one-line edit after it, which is why re-verification against a
  fresher HEAD mattered. Re-verified live 2026-08-04 by
  `QCLI-2.7` against `opum-doc`'s then-current `HEAD` `7b512d9`: unchanged
  since `bee848a`, 120 lines, `git diff 846f054..HEAD -- <current path>`
  shows exactly the one-line link fix and nothing else.
- **Ownership rationale:** authored by the repository owner during OCLI-3.1;
  retained by `opum-doc` as the designated OCLI-provenance owner per the
  migration ledger.
- **Permitted use:** cite named dated facts (host observations, revisions,
  the 11 scenario seeds) with attribution to this document and date; QCLI-2.3
  may use the scenario seeds as prompts for independently authored scenarios,
  never as copied tests or algorithms.
- **Exclusions:** not proof of a current Lore release gate; not an executable
  research cursor; does not itself authorize opening any underlying
  Quarantined or Excluded artifact it names.
- **Reclassification triggers:** `opum-doc` editing or superseding this
  document; a listed artifact's own class changing; `OCLI-7`'s disposition
  decision changing retention.

#### Historical OCLI Story/Spec/Runbook/task records

- **Classification:** Allowed — per-record, gated by the migration ledger's
  row-by-row disposition; never blanket-allowed across all records.
- **Repository or URL:** `opum-doc:docs/{stories,specs,adr,runbooks}/*.md`
  and `opum-doc:backlog/tasks/ocli-*.md`.
- **Exact revision or retrieval date:** `opum-doc`, pinned at `d7ca18f` as
  observed 2026-08-04 — a moving branch reference, not asserted current
  beyond that observation (see the dated Opum fleet and prior-art inventory
  slice above, which records `d7ca18f` as already superseded the same day).
- **Ownership rationale:** `opum-doc` is the retained owner of OCLI
  historical Backlog/Lore records per the migration ledger and `quest-doc`'s
  provenance ledger.
- **Permitted use:** cite the exact OCLI task/document/commit when adopting
  evidence, per the migration ledger's preservation rules — for example
  OCLI-1's backlog-handover skill supersession (`QCLI-4`, commit `287c2b8`).
- **Exclusions:** a QCLI successor's existence is not evidence its OCLI
  predecessor completed; never activate an OCLI task and its QCLI successor
  in parallel; never rename, duplicate, or check off an OCLI ID to make the
  transfer look tidy.
- **Reclassification triggers:** any future row-scoped supersession decision
  recorded in the migration ledger; `opum-doc` archiving or closing a cited
  record.

#### Git recovery commits `7b82afc` / `d42c016`

- **Classification:** Allowed.
- **Repository or URL:** `opum-doc` @ `7b82afc03a225f292ed81f916752d318fe237da8`
  and `d42c01666bc8868c4fe2b55218edbf56e205841f`.
- **Exact revision or retrieval date:** authored 2026-07-31; **corrected
  2026-08-04 by `QCLI-2.7`'s review fix pass** — the prior text described
  this slice's own permitted-use claim (a 14-row remote register, a 24-row
  fleet register) as "reachability re-verified," which establishes only
  that the two commits exist and touch the cited path, not that they
  contain 14 and 24 data rows. Content-verified live 2026-08-04 in the
  local `opum-doc` checkout instead: `git show 7b82afc:<former path>` and
  `git show d42c016:<former path>` each show the "Normative source
  register" table with 14 data rows (one header, one separator, 14 content
  rows) and the "Four-host fleet" table with 24 data rows, at **both**
  commits — the claim is correct, only the verification method recorded
  here was overstated.
- **Ownership rationale:** authored during OCLI-3.1 by the repository owner.
- **Permitted use:** recover the full historical 14-row remote register and
  24-row fleet register text for audit and citation only.
- **Exclusions:** not a live source of current Quest requirements; facts
  originally recorded as dirty/quarantined within them stay Quarantined.
- **Reclassification triggers:** an `opum-doc` history rewrite (prohibited by
  this program's constraints in the ordinary course) or a further
  owner-approved capsule refresh.

#### Quarantined legacy Opum artifacts

- **Classification:** Quarantined (per the classification vocabulary's own
  Quarantined example, "Legacy unversioned Opum fleet artifacts").
- **Repository or URL:** `/Volumes/_repos/opum-cli` (unversioned Bun/
  TypeScript, dated 2026-03-15, no Git history), `/Volumes/_repos/fast-mcp-opum`
  (unversioned Python/FastMCP, dated 2026-02-01, secret-adjacent), and
  assorted dirty/archive/Time Machine fleet copies, all as recorded in the
  dated fleet inventory above.
- **Exact revision or retrieval date:** originally observed 2026-07-31; not
  re-inspected during this revalidation — remaining Quarantined material must
  not be opened absent a new owner decision.
- **Ownership rationale:** unversioned, dirty, secret-adjacent, or
  attribution-ambiguous per the original OCLI-3.1 audit; no Git history or
  contributor attribution establishes provenance.
- **Permitted use:** identity and previously captured metadata only (path,
  dated observation, dirty-path count), as already recorded in the inventory
  above; no re-derivation.
- **Exclusions:** no inspection, copying, execution, or design derivation,
  now or later, absent a separately accepted owner provenance decision.
- **Reclassification triggers:** only a new, separately accepted owner
  provenance decision; none is in effect as of this revalidation.

#### Deferred Opum prototype surfaces

- **Classification:** Deferred (per the classification vocabulary's own
  Deferred example, "Opum MCP/hosted-UI prototype surfaces").
- **Repository or URL:** as inventoried above — `jeremy-newhouse/opum-engine`
  PR heads, hosted/UI/application prototypes, and the stdio MCP smoke-boundary
  gap (scenario seed 10).
- **Exact revision or retrieval date:** dated 2026-07-31 per the inventory;
  not independently re-verified here because no current QCLI task depends on
  them.
- **Ownership rationale:** a plausible later surface explicitly outside
  quest-cli's first-release non-goals (component charter: local MCP, hosted
  service, accounts) and outside Opum SaaS's separate roadmap owned by
  `opum-doc`.
- **Permitted use:** preserve the open question and its revisit trigger only;
  do not design or scaffold against it now.
- **Exclusions:** no current QCLI research task may treat these as an active
  requirement source.
- **Reclassification triggers:** a future owner decision bringing local MCP
  or hosted collaboration into a Quest release scope; a component charter
  revision.

### Backlog.md

#### Backlog.md implementation source and internal tests

- **Classification:** Excluded (per the classification vocabulary's own
  Excluded example, "Backlog.md implementation source/tests").
- **Repository or URL:** `github.com/MrLesk/Backlog.md` (npm package
  `backlog.md`), including the locally installed copy under
  `~/.bun/install/global/node_modules/backlog.md`.
- **Exact revision or retrieval date:** pinned **v1.49.3** — confirmed as
  both the current npm release and the locally installed build via `backlog
  --version` (`1.49.3`) and `npm view backlog.md version` (`1.49.3`) on
  2026-08-04.
- **Ownership rationale:** explicit owner ruling dated 2026-08-04. Backlog.md
  is MIT-licensed, so source reading would be legally permissible — the
  owner was offered that reclassification and declined it. The constraint is
  **authorship independence**, not licensing.
- **Permitted use:** none.
- **Exclusions:** no inspection, copying, execution, or design derivation
  from Backlog.md's implementation source or internal test suite, at any
  revision, including the locally installed copy.
- **Reclassification triggers:** only a further explicit, separately recorded
  owner decision — mirrors the historical policy's own rule that no
  inspection is permitted "unless a later accepted provenance decision
  changes that boundary."

#### Backlog.md public surface

- **Classification:** Allowed (per the classification vocabulary's own
  Allowed example, "Backlog.md public surface").
- **Repository or URL:** `https://backlog.md` (published docs); `backlog
  --help` and per-command `--help`; `--plain`/`--json` command output; and
  on-disk artifacts produced by running the tool (e.g. `backlog/tasks/*.md`,
  `backlog/config.yml`).
- **Exact revision or retrieval date:** pinned **v1.49.3**, the current npm
  release, confirmed as the locally installed build on 2026-08-04.
- **Ownership rationale:** MIT-licensed public product surface; consuming
  published documentation and command output is ordinary user/integrator
  activity, not implementation derivation.
- **Permitted use:** cite published documentation, `--help` output, and
  on-disk artifact shape (task Markdown, YAML config) as an observable public
  contract — informs QCLI-2.5's migration-fidelity research.
- **Exclusions:** does not extend to source or internal tests (see above); a
  behavior observed only by reading source, not by running the tool, is not
  admissible.
- **Reclassification triggers:** a Backlog.md release that changes v1.49.3's
  observed public contract — re-pin and re-verify before citing a newer
  version.

#### Local Backlog.md clone (`/Volumes/external/repos/Backlog.md`)

- **Classification:** Quarantined.
- **Repository or URL:** local clone at
  `/Volumes/external/repos/Backlog.md`, sibling to but outside the
  `quest-cli` repository tree (so its presence does not affect AC3).
- **Exact revision or retrieval date:** not inspected; recorded by path only,
  2026-08-04.
- **Ownership rationale:** the owner's strict clean-room ruling (see
  "Backlog.md implementation source and internal tests" above) applies to
  Backlog.md source regardless of which local copy holds it — this clone is
  the same excluded implementation source, made local. It gets its own
  explicit slice, rather than being left implicit under that general
  exclusion, because the hazard here is proximity: a `quest-cli` worker
  operating among sibling checkouts under `/Volumes/external/repos/` can
  reach this clone with a single relative path and would not necessarily
  realize it is off-limits absent an entry naming it directly.
- **Permitted use:** none. Its presence on disk is permitted — it sits
  outside `quest-cli`, so AC3 is unaffected — but no Quest research may open,
  read, grep, or cite it.
- **Exclusions:** no inspection, copying, execution, or design derivation
  from this clone, at any revision, under any circumstance.
- **Reclassification triggers:** only a further explicit, separately
  recorded owner decision reversing the clean-room ruling above — not the
  clone being deleted, moved, updated, or re-cloned. The trigger is tied to
  the owner's ruling, not to the clone's existence on disk.

### Lore tooling

#### lore-cli / the `lore` command

- **Classification:** Allowed (per the classification vocabulary's own
  Allowed example, "lore-cli's published CLI surface").
- **Repository or URL:** `github.com/opum-ai/lore-cli` (private) — **not**
  `salient-data/lore-cli`. Re-verified live 2026-08-04: `git remote -v` in
  the local `/Volumes/external/repos/lore-cli` checkout returns
  `git@github.com:opum-ai/lore-cli.git`; `gh api repos/opum-ai/lore-cli`
  confirms `full_name: opum-ai/lore-cli`; `gh api repos/salient-data/lore-cli`
  resolves to the **same** repository id (`1275776424`) via GitHub's rename
  redirect, i.e. `salient-data/lore-cli` is a stale identity for the same
  repository, not a second one. npm package: `@opum-ai/lore` (the unscoped
  `lore` and `lore-cli` npm names are an unrelated third party, see below).
- **Exact revision or retrieval date:** GitHub release tag `v0.1.0`,
  `publishedAt` 2026-08-04T02:44:47Z (`gh release view v0.1.0 --repo
  opum-ai/lore-cli`); npm `@opum-ai/lore@0.1.0` (`npm view @opum-ai/lore
  version`); local install matches — `lore --version` reports `0.1.0`, and
  the installed binary is a symlink to
  `.../node_modules/@opum-ai/lore/bin/lore.cjs`. All confirmed live
  2026-08-04.
- **Ownership rationale:** `lore-cli` is the owning implementation of the
  Lore tool quest-cli integrates with, per the component charter's routing
  table ("Lore implementation and immutable release evidence" → owning
  `lore-*` repository); MIT-licensed (`npm view @opum-ai/lore license` =
  `MIT`). The `salient-data` → `opum-ai` org transfer is the same class of
  identity change as the `opum-cli` → `opum-doc` rename this repository's
  [migration ledger](former-ocli-to-qcli-migration-ledger.md) already
  documents: old identity redirects, current identity governs citation. The
  owner separately confirmed on 2026-08-04 (after this task's initial draft)
  that the transfer, and the derived npm naming pattern — GitHub repo
  `<name>-cli`, npm package `@opum-ai/<name>` with the `-cli` suffix dropped,
  executable `<name>` — are both correct and intentional; `@opum-ai/lore-cli`
  itself 404s on npm, confirming the dropped-suffix pattern.
- **Permitted use:** cite its published CLI surface (`lore --help`, `lore
  instructions`, command output, exit codes, `.lore/schemas/*.json`) as the
  versioned Lore import/link/adapter contract quest-cli must honor. The
  published `@opum-ai/lore@0.1.0` release is immutable published release
  evidence relevant to the Lore activation gate; citing its existence and
  version here does not itself verify the gate — matching that evidence
  against the owning repository and the gate's requirements is `QCLI-2.7`'s
  scope, not performed by this register. **Widened 2026-08-04 by
  `QCLI-2.12`** to close an asymmetry with the npm package name occupancy
  slice's own widened permitted use (below): also cite `@opum-ai/lore`'s
  ordinary registry metadata — license, claimed repository, maintainer
  identity, description text, and publish/version history, each retrieved
  via `npm view @opum-ai/lore <field>` — as package-naming-pattern and
  allocation evidence, for example `QCLI-2.9`'s [packaging
  contract](quest-cli-packaging-contract.md) citing `@opum-ai/lore`'s
  maintainer identity to confirm the observed `<name>-cli` repository /
  `@opum-ai/<name>` package / `<name>` executable sibling pattern, never as a
  Quest runtime dependency or implementation-source claim. This widening is
  registry-metadata only, the same class of data and exactly as narrow as
  the npm-occupancy slice's own equivalent widening; it does not touch
  `@opum-ai/lore`'s package source or tests, which stay governed exclusively
  by the CLI-surface / source-admissibility rules in this slice and the
  split rule below, unchanged.
- **Exclusions:** **amended 2026-08-04 by the owner's split rule** (see "The
  lore-cli source-admissibility split rule," immediately below) — design
  derivation from lore-cli's own TypeScript implementation source is now
  admissible, but only as evidence of what Lore requires of any
  task-tracker backend, never as a claim about how Backlog.md behaves. The
  prior blanket exclusion ("no design derivation... beyond its documented
  public CLI/JSON contract") is superseded to that extent; it still governs
  everything the split rule does not carve out. This register does not
  decide the Quest↔Lore integration boundary, which `lore-doc` owns; it does
  not perform QCLI-2.7's gate-evidence verification.
- **Reclassification triggers:** a further org/repo transfer; a version bump
  changing the documented CLI surface; `lore-doc`'s integration-boundary Spec
  changing what is consumable. Independently worth recording as its own
  trigger: a GitHub rename/transfer redirect makes a **stale org reference
  silently resolve** (`gh api repos/salient-data/lore-cli` returns
  `opum-ai/lore-cli`'s data without erroring) — any citation using an org
  name must be re-verified against the live `git remote`/`gh api` identity,
  not assumed correct merely because a lookup under the old name succeeded.
  This trigger is the specific, single-instance case of the [research
  program Spec](../specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references)'s
  Verification-bar moving-vs-immutable-references convention (a `git
  remote`/`gh api` identity check is a moving reference).

#### The lore-cli source-admissibility split rule (owner ruling, 2026-08-04)

- **Classification:** Allowed, narrowly — a rule governing how to read the
  Allowed "lore-cli / the `lore` command" slice above, not a new source
  slice of its own.
- **Repository or URL:** applies to `github.com/opum-ai/lore-cli` (private,
  MIT), local clone `/Volumes/external/repos/lore-cli`, tag `v0.1.0` —
  specifically `src/adapters/backlog.ts` and lore-cli's own non-Backlog-
  derived ADRs/Specs (e.g. `docs/adr/0001-runtime-build-distribution.md`,
  `docs/adr/0005-cli-contract.md`, `docs/specs/lore-design.md`).
- **Exact revision or retrieval date:** owner ruling recorded 2026-08-04
  (campaign restore #2); applied against `lore-cli` tag `v0.1.0` by
  `QCLI-2.7` the same day.
- **Ownership rationale:** the register previously excluded all design
  derivation from lore-cli TypeScript as a single blanket rule. The owner
  split that exclusion in two, because lore-cli's own source and ADRs are
  Opum-owned MIT code describing **Lore's own design** — a different thing
  from a claim about **Backlog.md's** behavior, even when both appear in
  the same file. Quest is chartered to honor Lore's own requirements
  (component charter: "versioned Lore import/link/adapter behavior"); it is
  not chartered, and remains barred, from re-deriving Backlog.md design
  knowledge through Lore's implementation.
- **Permitted use — the line, for reuse verbatim:** cite Lore for what Lore
  requires; never cite Lore for what Backlog does.
  - **Admissible:** lore-cli source and its own ADRs, as evidence of what
    Lore requires of any task-tracker backend it adapts to — the adapter
    interface shape, the structured-output envelope and schema-version
    expectation, capability-probe and fail-loud semantics, the write path,
    new-identifier capture, the existence-check contract, and the
    back-reference/metadata-storage constraint. `QCLI-2.7`'s
    [adapter contract review](quest-cli-lore-dependency-and-adapter-contract-evidence.md)
    is built entirely on this admissible half.
  - **Not admissible:** any assertion about how Backlog.md behaves, even
    when lore-cli source or a lore-cli ADR states it. Owner ruling 1
    (Backlog.md source Excluded, strict clean-room) and ruling 5 (lore-cli's
    Backlog corpus Contextual: readable, citable for nothing — see the
    slice below) are **unchanged** by this split. Every Quest assertion
    about Backlog.md must still be independently re-derived from the public
    surface at the pinned v1.49.3 and cited to that observation, never to a
    lore-cli document.
- **Exclusions:** this split does not reclassify the lore-cli Backlog.md
  corpus slice below (still Contextual, citable for nothing); it does not
  authorize reading Backlog.md's own implementation source or the local
  Backlog.md clone (both remain Excluded/Quarantined, unchanged); and it
  does not extend to any *other* lore-cli document whose findings were
  themselves verified against, or otherwise assert an uncited fact about,
  Backlog.md's behavior — see that slice's catch-all clause for how a
  document earns that taint even when not individually named there.
- **Reclassification triggers:** only a further explicit, separately
  recorded owner decision — mirrors every other source-admissibility rule
  in this register.

#### lore-cli Backlog.md corpus (ADRs, reference, runbooks)

- **Classification:** Contextual — first-party but source-tainted; may
  inform question discovery, may not be cited. **Unchanged by the
  2026-08-04 split rule** (see the slice above) — the split touches only
  what is admissible from `src/adapters/backlog.ts` and lore-cli's
  non-Backlog-derived ADRs/Specs; this corpus stays exactly as restrictive
  as it was.
- **Repository or URL:** `github.com/opum-ai/lore-cli` (private, MIT), local
  clone `/Volumes/external/repos/lore-cli`, tag `v0.1.0`; specifically
  `docs/adr/0002-backlog-integration-json-only.md`,
  `docs/adr/0009-story-task-coupling-reconciliation.md`,
  `docs/adr/0012-backlog-coexistence-git-ownership.md`,
  `docs/reference/backlog-cli-contract.md`,
  `docs/reference/backlog-json-schema.md`,
  `docs/reference/historical-upstream-backlog-json-tag-watch.md`,
  `docs/runbooks/backlog-json-patch.md`, **and, by the catch-all clause
  below, any further lore-cli document a worker discovers asserting an
  uncited claim about how Backlog.md behaves that this register has not yet
  individually read.** (This field and Exclusions, below, previously stated
  the catch-all in two materially different formulations: this field read
  "any further lore-cli document deriving from Backlog.md source" (the
  original, now-superseded wording, recorded here verbatim per this
  project's inline-supersession convention), while Exclusions used "does it
  assert a Backlog.md behavior fact without independent public-surface
  attribution?" as its test; unified 2026-08-04 by `QCLI-2.12` on the
  Exclusions formulation — the sentence above now states that formulation
  too — which is also the test the Ownership rationale and Exclusions
  fields below already apply in practice.)
- **Exact revision or retrieval date:** tag `v0.1.0`, local clone read
  2026-08-04 (owner ruling date); the two newly-named documents
  (`docs/adr/0009-story-task-coupling-reconciliation.md` and
  `docs/reference/historical-upstream-backlog-json-tag-watch.md`) were
  discovered and read by `QCLI-2.7` on 2026-08-04 while re-verifying this
  slice, not previously enumerated here.
- **Ownership rationale:** owner ruling, 2026-08-04: this corpus is
  first-party (`lore-cli` is `opum-ai`-owned, MIT-licensed, per the slice
  above) but source-tainted. The decisive fact is that
  `docs/adr/0012-backlog-coexistence-git-ownership.md` states in its own
  Context section: "We verified the following behaviors against the
  Backlog.md source (the same codebase `lore` consumes as a `--json`-capable
  fork)." `docs/adr/0002-backlog-integration-json-only.md` documents that
  same lineage (lore forked Backlog.md, then adopted upstream PR #790 /
  `BACK-545`, merged 2026-07-16). `docs/adr/0009-story-task-coupling-
  reconciliation.md` was read by `QCLI-2.7` on 2026-08-04 and found to
  assert, uncited, that "Backlog.md drops unknown frontmatter keys on
  edit" and that Backlog's `--doc` annotation "is not reliably queryable" —
  unattributed claims about Backlog.md's own behavior in the same taint
  class as ADR-0002/ADR-0012, even though it does not use ADR-0012's exact
  "verified against the Backlog.md source" phrasing. Citing any of this
  corpus in Quest research would launder Backlog.md source-derived
  knowledge into Quest, defeating the strict clean-room ruling recorded
  above under "Backlog.md implementation source and internal tests." The
  **catch-all clause** exists because this taint is a property of a
  document's own content (does it assert an uncited fact about Backlog.md's
  behavior?), not of whether this register happened to enumerate it by name
  first — `docs/adr/0009` and the historical tag-watch document both prove a
  worker can find a seventh or eighth instance the same way this
  revalidation found a sixth and seventh; the closed five/six-document list
  this slice previously carried is retired in favor of the standing rule.
- **Permitted use:** Quest workers may read it for question discovery only —
  which Backlog.md behaviors bite, which edge cases exist, which hazards to
  look for. They may cite nothing from it. Every fact Quest asserts about
  Backlog.md must be independently re-derived from Backlog.md's public
  surface at the pinned v1.49.3 (published documentation, `backlog --help`
  and per-command help, `--plain`/`--json` output, on-disk artifacts
  produced by running the tool) and cited to that observation, never to a
  lore-cli document.
- **Exclusions:** no citation of any document named above, or of any further
  lore-cli document a worker discovers asserting an uncited claim about how
  Backlog.md behaves (the catch-all), in any Quest research finding or
  requirement — apply the same "does it assert a Backlog.md behavior fact
  without independent public-surface attribution?" test that identified
  `docs/adr/0009` and the historical tag-watch document to any newly-read
  lore-cli document before treating it as citable. lore-cli's non-Backlog
  documents are not tainted by this exclusion and remain separately
  classified — in particular `docs/reference/lore-cli-release-truth.md` and
  `docs/runbooks/release-publishing.md` are Lore release-gate evidence for
  `QCLI-2.7` and now carry their own classification in the next slice,
  below (this gap — named as evidence but previously unclassified — is
  closed by this revalidation).
- **Reclassification triggers:** only a further explicit, separately
  recorded owner decision — mirrors the Backlog.md implementation-source
  exclusion's own reclassification rule above. Discovering an additional
  document the catch-all covers is not itself a reclassification event; it
  needs no new owner decision to be treated as Contextual, citable for
  nothing, the moment its content matches the standing test.

#### lore-cli release-gate evidence (`lore-cli-release-truth.md`, `release-publishing.md`)

- **Classification:** Allowed — closes a gap this register itself carried:
  these two documents were already named as `QCLI-2.7`'s evidence, inside
  the Backlog corpus slice above, but carried no class from this register's
  own six-term vocabulary until this revalidation.
- **Repository or URL:** `github.com/opum-ai/lore-cli` (private, MIT), local
  clone `/Volumes/external/repos/lore-cli`, tag `v0.1.0`; specifically
  `docs/reference/lore-cli-release-truth.md` and
  `docs/runbooks/release-publishing.md`.
- **Exact revision or retrieval date:** tag `v0.1.0`; re-read live 2026-08-04
  by `QCLI-2.7`, which found these two documents split the same way the
  lore-cli source-admissibility split rule above splits lore-cli source:
  `lore-cli-release-truth.md:63` ("Lore now requires the published
  JSON-capable Backlog.md release at or past `1.49.0`") states a Lore
  requirement and is citable. `release-publishing.md`'s "## Prerequisites"
  section (lines 133-137) is different — it states a **Backlog.md
  release-history fact** as fact, not as a Lore requirement: "Backlog.md
  `v1.49.0`, published 2026-08-02, is the first tagged release containing PR
  #790/BACK-545." That specific passage is a named carve-out from this
  slice's citability (see Exclusions, below); the two documents are not
  uniformly "non-Backlog-derived." Ordinary content evolution in these two
  files between the tag and current `dev` HEAD (release evidence is
  expected to keep accruing) is not itself adapter-surface drift.
- **Ownership rationale:** `lore-cli` is the owning implementation and
  release-evidence authority for the Lore tool quest-cli integrates with,
  per the component charter's routing table ("Lore implementation and
  immutable release evidence" → owning `lore-*` repository); these two
  documents are its own first-party release-mechanics and release-truth
  records, not derived from or verified against Backlog.md source at any
  point.
- **Permitted use:** cite as component-level (`lore-cli`) immutable release
  evidence — package/tag/workflow/registry/install facts — consumed by
  `QCLI-2.7`'s
  [dependency matrix](quest-cli-lore-dependency-and-adapter-contract-evidence.md).
  Citing this evidence establishes only that `lore-cli 0.1.0` is released;
  it does not by itself open the program-level `lore-doc`/`LDOC-4`
  implementation-activation gate, which requires further, separately-held
  conditions (see the linked gate Spec — not restated here).
- **Exclusions:** named carve-out, in effect now (not hypothetical) —
  `release-publishing.md`'s "## Prerequisites" section, specifically its
  Backlog.md-`v1.49.0` release-history bullet (lines 133-137), is excluded
  from this slice's citability: it states a Backlog.md release-history fact,
  not a Lore requirement, and any Quest assertion needing that fact must
  instead be independently re-derived from Backlog.md's public surface at
  the pinned v1.49.3, per the standing rule above. Beyond that carve-out,
  this slice does not extend to either document's own cross-links into the
  Backlog corpus slice above; nor does it authorize treating a dated read of
  these two documents as a substitute for a live re-check at activation
  time. **Precedence when a document is reachable by both slices, stated
  explicitly (closes `QCLI-2.12` AC2):** both `lore-cli-release-truth.md` and
  `release-publishing.md` are, in principle, also reachable by the lore-cli
  Backlog.md corpus slice's catch-all above — a worker could ask, of either
  document, whether it asserts an uncited Backlog.md-behavior claim. Where
  that happens, this slice's own explicit, name-scoped classification and
  carve-out govern for these two documents specifically, not the catch-all:
  the catch-all exists to sweep in a lore-cli document this register has not
  yet individually read and classified, and both documents are individually
  read, named, and classified right here. Applying that precedence: only the
  named Prerequisites bullet above is excluded from citability; the rest of
  `release-publishing.md` — including the release-mechanics and drift
  content `QCLI-2.7`'s [dependency and adapter contract
  evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md) Part
  3 drift table cites it for ("What the 29 commits touch in `docs/`",
  recording `release-publishing.md` as expected-to-evolve release evidence)
  — remains Allowed and citable under this slice, exactly as it already was
  before this clarification.
- **Reclassification triggers:** a new Lore release changing any recorded
  fact (SHA-256 values, Trusted Publisher binding, `LCLI-278`'s status); a
  further owner decision.

### npm package name occupancy (naming-conflict evidence only)

- **Classification:** Excluded (per the classification vocabulary's own
  Excluded example, "unrelated npm-squatted packages").
- **Repository or URL:** npmjs.org registry entries for `quest` (v0.4.0,
  `github.com/Clever/quest`), `quest-cli` (v1.0.0, no repository/description
  field published), `lore` (v0.13.0, `github.com/lore/lore`), `lore-cli`
  (v0.13.2, same `github.com/lore/lore`); `@salient-data/quest`,
  `@salient-data/quest-cli`, `@salient-data/lore-cli`, and `@opum-ai/quest-cli`
  (each `404 Not Found`). **Added 2026-08-04 by `QCLI-2.12`:**
  `@opum-ai/quest-cli` — `QCLI-2.9`'s [packaging
  contract](quest-cli-packaging-contract.md) cites this 404 observation (the
  un-dropped-suffix form, recorded there only to confirm the dropped-suffix
  pattern also holds for `quest`) but this slice had not yet named it.
- **Exact revision or retrieval date:** retrieved live 2026-08-04 via `npm
  view <pkg> version/repository/license/description` for each name.
- **Ownership rationale:** no `opum-ai` ownership or contribution to any of
  the occupied names — nor, prior to the owner's 2026-08-04 org-identity
  decision recorded above, `salient-data`'s; `quest`, `lore`, and `lore-cli`
  are confirmed unrelated third-party projects (a Node request library and a
  React/Redux framework, respectively — unrelated to Quest or Lore). Name
  occupancy is a registry fact, not a codebase Quest may consume. Per the
  owner's 2026-08-04 decision recorded above, unscoped `quest` being occupied
  is now only the **rationale** for `quest-cli` going scoped as
  `@opum-ai/quest`, not an open allocation question this register must
  resolve.
- **Permitted use:** cite existence, version, license, claimed repository,
  **maintainer identities, description text, and publish/version history**
  — registry metadata limited to the fields enumerated above, retrieved via
  `npm view <pkg>`, never package source or tests — as naming-conflict and
  allocation-constraint evidence for `QCLI-2.9`'s package-allocation
  resolution. This enumeration is exhaustive, not illustrative: it does not
  extend to other `npm view`-surfaced fields such as `readme` (the full
  authored README) or `dependencies` (the dependency graph), both of which
  are authored/source-adjacent package content, not registry metadata, and
  remain outside this slice's citability. **Widened 2026-08-04 by
  `QCLI-2.7`:** the register previously enumerated only existence, version,
  license, and repository; `QCLI-2.9`'s own AC1 requires "current ownership,
  maintainers, package history, [and] allocation or transfer constraints,"
  which the narrower list did not clearly cover even though maintainer
  identity and publish history are the same class of registry metadata as
  version/license/repository (retrieved the same way, via `npm view`, with
  no package source or test inspection either way). `QCLI-2.9` dates and
  cites its own maintainer/history observations independently; this entry
  only widens what this register admits, it does not itself assert those
  facts.
- **Exclusions:** no inspection of `quest`, `quest-cli`, `lore`, or
  `lore-cli` package source or tests under any circumstance, regardless of
  which registry-metadata field is cited; this register does not resolve
  the naming question — that is `QCLI-2.9`'s scope.
- **Reclassification triggers:** `QCLI-2.9`'s resolution of the npm package
  allocation and provenance gate; any of these names becoming available or
  transferring to `opum-ai` (the target org per the owner's 2026-08-04
  identity decision recorded above, superseding the historical
  `salient-data` association).

### Quest-wide and Lore-owned authorities

#### `quest-doc` canonical product records

- **Classification:** Allowed (the `quest-doc` half of "quest-doc and
  lore-doc canonical records: Allowed/Contextual respectively" — quest-doc is
  Allowed).
- **Repository or URL:** `github.com/salient-data/quest-doc`, notably
  `docs/reference/quest-provenance-and-migration-ledger.md` and
  `docs/specs/quest-clean-room-execution-graph.md`.
- **Exact revision or retrieval date:** local checkout at
  `/Volumes/external/repos/quest-doc`, re-read live 2026-08-04 (`git status`
  reports a clean tree, no local modifications).
- **Ownership rationale:** `quest-doc` owns Quest promise, roadmap,
  cross-repository architecture, and provenance policy per the component
  charter's routing table.
- **Permitted use:** **clarified 2026-08-04 by `QCLI-2.12`; corrected
  2026-08-04 in the same task's review-driven follow-up, after an
  independent reviewer found the first clarification's "Two admissible
  uses" count excluded uses this register's own dependents already relied
  on** — this slice's Allowed classification governs citation of the
  records enumerated above by *any* QCLI deliverable, not only this
  register's own text; the original wording below was phrased in this
  register's own first person and did not say so explicitly. At least the
  following four admissible uses are already relied on by merged work, none
  narrowing any other — this enumeration is a floor already exercised, not
  asserted exhaustive: (1) **this register's own use**, unchanged — align
  this register's terms and boundary statements with `quest-doc`'s
  canonical clean-room provenance and migration-ledger sections; cite when
  a rule here implements a `quest-doc`-level rule; (2)
  `docs/specs/quest-clean-room-execution-graph.md`'s "Core behavioral
  contract" vocabulary section (task, event, repository, workspace, actor,
  and related terms; that document's lines 58–74) — a different document
  section and use than (1) — as `QCLI-2.4`'s [component glossary, actors,
  and workflows](quest-cli-component-glossary-actors-and-workflows.md)
  cites it (that document's lines 86–91), to ground quest-cli's own
  component-level vocabulary against `quest-doc`'s existing canonical terms
  before proposing anything new to `quest-doc`; (3) the same execution
  graph's "Runtime authority and product boundary" section (its lines
  39–57, distinct from use (2)'s "Core behavioral contract" section) — as
  the same component glossary cites it for "Execution records... tasks,"
  "lifecycle events," the "Knowledge records... Lore" vs. "Execution
  records... Quest" distinction, and "Rebuildable local projection" (that
  document's lines 114, 128, 141, and 143 respectively); and (4)
  `quest-doc`'s [repository and authority
  map](https://github.com/salient-data/quest-doc/blob/dev/docs/reference/quest-repository-and-authority-map.md)
  Reference — cited by the same component glossary both directly (its
  "Recheck clause," lines 247–274, and Notes, lines 275–295) and as the
  document grounding that glossary's negative-existence claim that
  `quest-doc`'s own repository has no actor-model glossary, as of the
  2026-08-04 observed commit (that document's lines 54 and 250).
- **Exclusions:** this register does not restate or override `quest-doc`'s
  canonical policy. No finding in this register proposes a change to
  Quest-wide vocabulary, architecture, or roadmap; if one arose it would be a
  proposal to `quest-doc`, not normative here — none is claimed by this
  revalidation.
- **Reclassification triggers:** `quest-doc` changing its canonical
  provenance or clean-room text — re-check consistency on the next
  revalidation.

#### `lore-doc` Lore-owned release gate

- **Classification:** Contextual (per the classification vocabulary's own
  Contextual example, "the Lore-owned release gate" — also the `lore-doc`
  half of "quest-doc and lore-doc canonical records: Allowed/Contextual
  respectively").
- **Repository or URL:** `github.com/salient-data/lore-doc`,
  `docs/specs/quest-integration-and-lore-release-gate.md`.
- **Exact revision or retrieval date:** not independently re-fetched by this
  task — live gate evidence is `QCLI-2.7`'s scope per the research program's
  dependency table, not this register's.
- **Ownership rationale:** `lore-doc` owns Lore-wide policy, the integration
  boundary, and dependency-gate definition per the component charter.
- **Permitted use:** cite as the named external activation authority; do not
  copy or reproduce its checklist here.
- **Exclusions:** this register records no gate pass/fail status; `QCLI-2.7`
  is the sole owner of that evidence matrix.
- **Reclassification triggers:** `QCLI-2.7` landing live gate evidence.

### quest-cli internal state

#### quest-cli repository and npm package identity (owner decision, 2026-08-04)

- **Classification:** Allowed (per the classification vocabulary's own
  Allowed example, "the 2026-08-04 owner decision on quest-cli's `opum-ai`
  identity").
- **Repository or URL:** `github.com/opum-ai/quest-cli` — **transfer executed
  2026-08-04** at the owner's direction under `QCLI-5`. This repository's own
  `origin` remote now reads `git@github.com:opum-ai/quest-cli.git`, confirmed
  live via `git remote -v`; the former `salient-data/quest-cli` path resolves
  to the same repository through GitHub's post-transfer redirect, exactly as
  `salient-data/lore-cli` does. Target npm package `@opum-ai/quest`, still
  unpublished and unreserved.
- **Exact revision or retrieval date:** owner decision communicated
  2026-08-04; `@opum-ai/quest` confirmed unclaimed (`404 Not Found`) via
  `npm view @opum-ai/quest version` on 2026-08-04, i.e. the target scoped
  name is currently free.
- **Ownership rationale:** explicit, current owner decision, of the same
  kind and directness as the `opum-cli` → `opum-doc` rename already recorded
  in the migration ledger and the `lore-cli` org transfer recorded above:
  `quest-cli` will move to the `opum-ai` GitHub org and publish npm as
  `@opum-ai/quest`, matching lore-cli's observed `<name>-cli` repo /
  `@opum-ai/<name>` package pattern. The executable stays `quest`. This
  directly exercises — rather than contradicts — decision #2 of the accepted
  ADR [Use quest-cli for the Quest package and command](../adr/use-quest-cli-for-the-quest-package-and-command.md),
  which already names "an owner-approved scope" as "the fallback while the
  executable remains `quest`."
- **Permitted use:** cite as the current authoritative target identity when
  a later task plans or executes the actual repository/package transfer;
  informs `QCLI-2.9`'s final package-allocation resolution as a settled
  input, not an open question to re-litigate.
- **Exclusions:** `QCLI-2.1` did not amend the ADR or the component charter;
  it recorded both disagreements here as classified findings only, rewriting
  either document being out of its scope. **`QCLI-5` has since performed those
  amendments (2026-08-04):** the ADR carries an inline, dated amendment
  superseding decision #1's `salient-data/quest-cli` and recording decision
  #2's scope fallback as exercised, and the component charter now states
  `@opum-ai/quest`. This register still does not reserve, publish, or release
  the package — `@opum-ai/quest` remains unclaimed, and the final allocation
  record is `QCLI-2.9`'s.
- **Reclassification triggers:** the repository transfer completing —
  **fired 2026-08-04**, recorded above; the ADR and charter amendments —
  **fired 2026-08-04** under `QCLI-5`; `@opum-ai/quest` being published (not
  yet); `QCLI-2.9` closing package allocation on a different name.

#### Prior QCLI research records

- **Classification:** Allowed.
- **Repository or URL:** this repository — `QCLI-1`, `QCLI-3`, `QCLI-4`, and
  the component charter, migration ledger, and research Spec they produced;
  also `QCLI-2.2`'s [legacy Opum requirement reconciliation for Quest
  CLI](legacy-opum-requirement-reconciliation-for-quest-cli.md), this
  register itself (`quest-cli-research-source-register.md`), and the
  accepted ADR [Use quest-cli for the Quest package and
  command](../adr/use-quest-cli-for-the-quest-package-and-command.md)
  (created `e2b90e2`, amended under `QCLI-5` at `942da73`) — a fourth
  product of the same `QCLI-1`/`QCLI-3`/`QCLI-4` lineage. **Added
  2026-08-04 by `QCLI-2.12`:** the reconciliation doc and this register
  were already cited under this slice by `QCLI-2.3`'s [black-box acceptance
  scenarios](quest-cli-black-box-acceptance-scenarios.md) evidence table;
  **added 2026-08-04 in this same task's review-driven follow-up:** the ADR
  is already cited under this exact slice — "Allowed — 'Prior QCLI research
  records'" — by `QCLI-2.2`'s own [legacy Opum requirement
  reconciliation](legacy-opum-requirement-reconciliation-for-quest-cli.md)
  (its evidence table, row "Use quest-cli for the Quest package and command
  (ADR)", line 68). None of the three were previously named in this
  enumeration; the register's prose elsewhere (this slice's own Ownership
  rationale cross-reference, and the "quest-cli repository and npm package
  identity" slice above) already cited the ADR without enumerating it here.
  **Added 2026-08-04 by this `QCLI-2.12` follow-up (F2):** `QCLI-2.3`'s own
  [black-box acceptance
  scenarios](quest-cli-black-box-acceptance-scenarios.md) and `QCLI-2.4`'s
  [component glossary, actors, and
  workflows](quest-cli-component-glossary-actors-and-workflows.md) are
  already cited under this exact slice by `QCLI-2.6`'s [Git, filesystem,
  and concurrency threat
  model](quest-cli-git-filesystem-and-concurrency-threat-model.md) evidence
  table (the rows for each document, both reading "Allowed — 'Prior QCLI
  research records'"); `QCLI-2.7`'s [Lore dependency and adapter contract
  evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md) is
  read by `QCLI-2.5`'s [Backlog migration fidelity
  contract](quest-cli-backlog-migration-fidelity-contract.md) Notes, for
  citation-discipline consistency with prior QCLI Reference outputs rather
  than as a design source for that document's own findings — the same
  non-replacing relationship this slice's own Permitted use already states
  below. None of these three was previously named in this enumeration
  despite already being relied on, under this slice's Allowed
  classification, by merged deliverables.
- **Exact revision or retrieval date:** `QCLI-1`/`QCLI-3`/`QCLI-4`'s own
  products — the component charter, migration ledger, and research Spec —
  are pinned to local HEAD `0cf0f34` (this branch's base, their actual
  origin), read live 2026-08-04. **Corrected 2026-08-04 by this
  `QCLI-2.12` follow-up (F3):** the later-added members above do not share
  that pin — `0cf0f34` (2026-08-04 01:02:11 -0500) predates every one of
  them, confirmed via `git merge-base --is-ancestor <sha> 0cf0f34`
  returning nonzero (not-an-ancestor) for each. Each is instead pinned to
  its own merge or creation commit: `QCLI-2.2`'s reconciliation at
  `09c202d` (2026-08-04 08:56:56 -0500); the ADR's `QCLI-5` amendment at
  `942da73` (2026-08-04 07:21:12 -0500);
  `quest-cli-black-box-acceptance-scenarios.md` at `4ed6ee1` (2026-08-04
  10:27:00 -0500, `QCLI-2.3`'s merge);
  `quest-cli-component-glossary-actors-and-workflows.md` at `0d127ee`
  (2026-08-04 10:28:30 -0500, `QCLI-2.4`'s merge); and
  `quest-cli-lore-dependency-and-adapter-contract-evidence.md` at
  `2246c46` (2026-08-04 08:58:45 -0500, `QCLI-2.7`'s merge). All read live
  2026-08-04.
- **Ownership rationale:** current, live `quest-cli` authority; `QCLI-1`
  established the component foundation, `QCLI-3` aligned provenance/
  documentation authority, `QCLI-4` recorded the OCLI-1 supersession,
  `QCLI-2.2` reconciled legacy Opum requirements into current quest-cli
  decisions, the accepted ADR fixed the package/repository/command identity
  those decisions and this register both depend on, and this register is
  the per-slice admission authority every other citation in this document,
  and the rest of this list, depends on.
- **Permitted use:** this revalidation is based on their findings and must
  stay consistent with them; it does not replace them.
- **Exclusions:** none beyond ordinary Backlog/Lore edit discipline (use the
  `backlog`/`lore` CLIs, never hand-edit their managed files).
- **Reclassification triggers:** any future supersession recorded against
  these records.

#### Current repository inventory (AC3 attestation)

- **Classification:** Allowed.
- **Repository or URL:** this repository, working tree at branch
  `feat/qcli-2.1-revalidate-provenance` based on HEAD `0cf0f34`.
- **Exact revision or retrieval date:** `git ls-files` and `git status
  --porcelain=v1 --untracked-files=all` run live 2026-08-04, before this
  register's own documentation edits.
- **Ownership rationale:** self-inventory required to evidence AC3.
- **Permitted use:** cite as the dated attestation that, as of this
  revalidation, `quest-cli` holds only instructions, Backlog/Lore
  configuration, task records, and documentation — no package manifest,
  source tree, executable scaffold, or runtime dependency — and had no
  untracked or dirty file before this task's edits.
- **Exclusions:** not applicable.
- **Reclassification triggers:** any future commit introducing product
  source, a runtime dependency, or content sourced from an Excluded or
  Quarantined slice above must be treated as a contamination event and
  reported, not silently accepted.

## Notes

This session's revalidation did not open, search, copy, execute, or derive
design from Backlog.md's implementation source or internal tests, any legacy
Opum/OCLI implementation source, or any artifact classified Quarantined
above. It made no repository, package, release, or remote mutation outside
this repository's own `docs/` and `backlog/` trees. Future Quest work records
its own current attestation; it must not reuse this one as proof of a later
session.

`QCLI-2.7`'s 2026-08-04 edit — recording the owner's lore-cli
source-admissibility split rule and closing the release-gate-evidence
classification gap — read `src/adapters/backlog.ts` in full, lore-cli's
non-Backlog ADRs/Specs used in its
[adapter contract review](quest-cli-lore-dependency-and-adapter-contract-evidence.md),
and, for question discovery only, `docs/adr/0009-story-task-coupling-
reconciliation.md` (found to assert an uncited Backlog.md behavior claim
and folded into the Backlog corpus slice's catch-all rather than cited).
It did not open Backlog.md's implementation source, the local Backlog.md
clone, or any Quarantined artifact, and made no mutation inside
`/Volumes/external/repos/lore-cli`, `/Volumes/external/repos/lore-doc`, or
`/Volumes/external/repos/quest-doc` — those three were read-only sources for
this edit.

`QCLI-2.12`'s 2026-08-04 edit closed three admission-authority coherence
gaps surfaced by reading the three wave-2 merges together: unified the
lore-cli Backlog corpus slice's catch-all onto one formulation, added an
explicit precedence rule to the lore-cli release-gate-evidence slice for
`release-publishing.md` (reachable by both that slice and the Backlog corpus
catch-all), enumerated `@opum-ai/quest-cli` in the npm-occupancy slice and
widened the lore-cli slice's permitted use to cover `@opum-ai/lore` registry
metadata, added the register itself and `QCLI-2.2`'s legacy-requirement
reconciliation to the Prior QCLI research records slice's own enumeration,
and clarified the `quest-doc` canonical product records slice's permitted
use to state its cross-deliverable scope and its coverage of the execution
graph's Core behavioral contract vocabulary. It reclassified no source — no
Classification field changed value — and narrowed no permitted use a merged
deliverable relies on; every citation checked against `quest-cli-packaging-
contract.md` (`QCLI-2.9`), `quest-cli-black-box-acceptance-scenarios.md`
(`QCLI-2.3`), `quest-cli-component-glossary-actors-and-workflows.md`
(`QCLI-2.4`), and `quest-cli-lore-dependency-and-adapter-contract-
evidence.md` (`QCLI-2.7`) by reading the live files, not from memory. It
opened no Backlog.md implementation source, no Quarantined artifact, and
made no mutation outside this repository's own `docs/` tree.
