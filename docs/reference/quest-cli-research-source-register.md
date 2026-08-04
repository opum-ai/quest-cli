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
summary: Revalidates the OCLI-3.1 provenance register after the opum-cli to opum-doc rename, per source slice.
timestamp: 2026-08-04T06:31:32.887Z
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
  returns `git@github.com:salient-data/opum-doc.git`, at local HEAD `d7ca18f`.
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
  2026-08-01T02:35Z and 2026-08-01T04:14Z at commits `7b82afc` and `d42c016`;
  both commits' reachability re-verified live 2026-08-04 via `git show
  7b82afc --stat` / `git show d42c016 --stat` in the local `opum-doc`
  checkout (both succeed, both `Refs: OCLI-3.1`); file content unchanged
  since `d42c016` as of `opum-doc` HEAD `d7ca18f`.
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
- **Exact revision or retrieval date:** `opum-doc` HEAD `d7ca18f`, retrieved
  2026-08-04.
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
- **Exact revision or retrieval date:** authored 2026-07-31; reachability
  re-verified live 2026-08-04 in the local `opum-doc` checkout.
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
  scope, not performed by this register.
- **Exclusions:** no design derivation from lore-cli's own TypeScript
  implementation source beyond its documented public CLI/JSON contract; this
  register does not decide the Quest↔Lore integration boundary, which
  `lore-doc` owns; it does not perform QCLI-2.7's gate-evidence verification.
- **Reclassification triggers:** a further org/repo transfer; a version bump
  changing the documented CLI surface; `lore-doc`'s integration-boundary Spec
  changing what is consumable. Independently worth recording as its own
  trigger: a GitHub rename/transfer redirect makes a **stale org reference
  silently resolve** (`gh api repos/salient-data/lore-cli` returns
  `opum-ai/lore-cli`'s data without erroring) — any citation using an org
  name must be re-verified against the live `git remote`/`gh api` identity,
  not assumed correct merely because a lookup under the old name succeeded.

#### lore-cli Backlog.md corpus (ADRs, reference, runbooks)

- **Classification:** Contextual — first-party but source-tainted; may
  inform question discovery, may not be cited.
- **Repository or URL:** `github.com/opum-ai/lore-cli` (private, MIT), local
  clone `/Volumes/external/repos/lore-cli`, tag `v0.1.0`; specifically
  `docs/adr/0002-backlog-integration-json-only.md`,
  `docs/adr/0012-backlog-coexistence-git-ownership.md`,
  `docs/reference/backlog-cli-contract.md`,
  `docs/reference/backlog-json-schema.md`, and
  `docs/runbooks/backlog-json-patch.md`.
- **Exact revision or retrieval date:** tag `v0.1.0`, local clone read
  2026-08-04 (owner ruling date).
- **Ownership rationale:** owner ruling, 2026-08-04: this corpus is
  first-party (`lore-cli` is `opum-ai`-owned, MIT-licensed, per the slice
  above) but source-tainted. The decisive fact is that
  `docs/adr/0012-backlog-coexistence-git-ownership.md` states in its own
  Context section: "We verified the following behaviors against the
  Backlog.md source (the same codebase `lore` consumes as a `--json`-capable
  fork)." `docs/adr/0002-backlog-integration-json-only.md` documents that
  same lineage (lore forked Backlog.md, then adopted upstream PR #790 /
  `BACK-545`, merged 2026-07-16). Citing this corpus in Quest research would
  launder Backlog.md source-derived knowledge into Quest, defeating the
  strict clean-room ruling recorded above under "Backlog.md implementation
  source and internal tests."
- **Permitted use:** Quest workers may read it for question discovery only —
  which Backlog.md behaviors bite, which edge cases exist, which hazards to
  look for. They may cite nothing from it. Every fact Quest asserts about
  Backlog.md must be independently re-derived from Backlog.md's public
  surface at the pinned v1.49.3 (published documentation, `backlog --help`
  and per-command help, `--plain`/`--json` output, on-disk artifacts
  produced by running the tool) and cited to that observation, never to a
  lore-cli document.
- **Exclusions:** no citation of `docs/adr/0002-backlog-integration-json-only.md`,
  `docs/adr/0012-backlog-coexistence-git-ownership.md`,
  `docs/reference/backlog-cli-contract.md`,
  `docs/reference/backlog-json-schema.md`, or
  `docs/runbooks/backlog-json-patch.md` in any Quest research finding or
  requirement. lore-cli's non-Backlog documents are not tainted by this
  exclusion and remain separately classified — in particular
  `docs/reference/lore-cli-release-truth.md` and
  `docs/runbooks/release-publishing.md` are Lore release-gate evidence for
  `QCLI-2.7`; that verification work is not performed here, only the
  classification.
- **Reclassification triggers:** only a further explicit, separately
  recorded owner decision — mirrors the Backlog.md implementation-source
  exclusion's own reclassification rule above.

### npm package name occupancy (naming-conflict evidence only)

- **Classification:** Excluded (per the classification vocabulary's own
  Excluded example, "unrelated npm-squatted packages").
- **Repository or URL:** npmjs.org registry entries for `quest` (v0.4.0,
  `github.com/Clever/quest`), `quest-cli` (v1.0.0, no repository/description
  field published), `lore` (v0.13.0, `github.com/lore/lore`), `lore-cli`
  (v0.13.2, same `github.com/lore/lore`); `@salient-data/quest`,
  `@salient-data/quest-cli`, and `@salient-data/lore-cli` (each `404 Not
  Found`).
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
- **Permitted use:** cite existence, version, license, and claimed repository
  only, as naming-conflict evidence for `QCLI-2.9`'s package-allocation
  resolution.
- **Exclusions:** no inspection of `quest`, `quest-cli`, `lore`, or
  `lore-cli` package source or tests under any circumstance; this register
  does not resolve the naming question — that is `QCLI-2.9`'s scope.
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
- **Permitted use:** align this register's terms and boundary statements with
  `quest-doc`'s canonical clean-room provenance and migration-ledger
  sections; cite when a rule here implements a `quest-doc`-level rule.
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
  the component charter, migration ledger, and research Spec they produced.
- **Exact revision or retrieval date:** local HEAD `0cf0f34` (this branch's
  base), read live 2026-08-04.
- **Ownership rationale:** current, live `quest-cli` authority; `QCLI-1`
  established the component foundation, `QCLI-3` aligned provenance/
  documentation authority, `QCLI-4` recorded the OCLI-1 supersession.
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
