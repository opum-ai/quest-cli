---
id: QCLI-2.9
title: Resolve the `quest` npm package allocation and provenance gate
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 23:48'
updated_date: '2026-08-04 13:07'
labels:
  - research
  - packaging
  - npm
  - provenance
  - registry
  - follow-up
  - no-publication
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - campaign
  - 'cluster:packaging'
  - wave-2
  - merge-pending
dependencies:
  - QCLI-2.1
references:
  - ../opum-doc/docs/reference/cross-product-documentation-authority-audit.md
documentation:
  - docs/adr/use-quest-cli-for-the-quest-package-and-command.md
  - docs/reference/quest-cli-component-charter.md
  - docs/specs/quest-cli-pre-implementation-research-program.md
  - docs/stories/prepare-quests-clean-room-research-foundation.md
  - docs/reference/quest-cli-packaging-contract.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Resolve the component-owned naming uncertainty before Quest package metadata or install copy is frozen. Recheck the npm registry and relevant provenance after QCLI-2.1, classify any existing package or ownership constraints, and record an owner-approved unscoped name or scoped fallback while keeping the executable quest. This research task authorizes no reservation, transfer, publication, or release.

Owner direction, 2026-08-04 (restore #2) — THE NAME DECISION IS ALREADY MADE. Do not reopen it. The owner decided on 2026-08-04 that quest-cli publishes as the scoped @opum-ai/quest with the executable still quest, and QCLI-5 already amended the component charter, the component ADR, the source register, and the migration ledger to that identity. The repository transfer to opum-ai/quest-cli is executed and verified.

This task therefore shifts from DECIDING the name to EVIDENCING and RECORDING it. All five acceptance criteria remain satisfiable as written; read AC3 "scoped fallback" as the already-accepted @opum-ai/quest. Concretely: produce the dated registry evidence AC1 requires (ownership, maintainers, package history, allocation/transfer constraints, and the mandatory release-time recheck), classify provenance per AC2, record the accepted name in a component packaging contract per AC3, keep every public claim conditional on immutable release evidence per AC4, and take no registry action whatsoever per AC5.

If the evidence you gather contradicts the decision, do not act on it and do not reverse it. Record the contradiction in task notes and report it — the owner decides.

Scope boundary for wave 2: QCLI-2.7 owns all edits to docs/reference/quest-cli-research-source-register.md this wave. Cite the register read-only; do not edit it. Your deliverable is a new packaging-contract document.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Dated registry evidence records current ownership, maintainers, package history, allocation or transfer constraints, owner-approved scoped fallbacks, and a mandatory release-time recheck for the preferred quest package name
- [ ] #2 Licensing, contributor, and artifact provenance for any existing package or content is classified, and ambiguous or unadmitted content is not reused
- [ ] #3 The accepted unscoped name or scoped fallback is recorded in the component packaging contract while the executable remains quest
- [ ] #4 Package metadata, install copy, and public claims remain conditional on immutable protected release evidence
- [ ] #5 No package reservation, transfer, publication, remote-policy change, or release occurs without separate explicit owner authorization
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the source register, component charter, and ADR (owner already decided @opum-ai/quest on 2026-08-04 per QCLI-5) — cite read-only, do not edit the register (QCLI-2.7 owns it this wave).
2. Independently re-run live npm view / gh api registry evidence (quest, quest-cli, @opum-ai/quest, @opum-ai/quest-cli, @salient-data/quest[-cli], lore, lore-cli, @opum-ai/lore) and verify the opum-ai/quest-cli transfer identity (git remote -v, gh api against both org paths, checking for the stale-redirect trap) — date and command every observation.
3. Author a new Reference doc docs/reference/quest-cli-packaging-contract.md via 'lore new reference' covering: AC1 dated evidence + mandatory release-time recheck clause, AC2 provenance classification (citing the register's existing Excluded/Allowed calls, no source reuse), AC3 recorded @opum-ai/quest identity with executable quest, AC4 conditional public-claim language tied to the ADR's protected-immutable-release consequence, AC5 explicit no-registry-action statement.
4. Run lore sync then lore check --strict / lore validate --strict / lore orphans and capture real output.
5. Record dated evidence and gate output in task notes; report any contradictions (none expected) without acting on them.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Deliverable: docs/reference/quest-cli-packaging-contract.md (new Reference, scaffolded via 'lore new reference'). Does not edit the source register (QCLI-2.7 owns it this wave) or the campaign doc; cites both read-only.

Decision status: the name decision was already made by the owner on 2026-08-04 (@opum-ai/quest, executable quest, per QCLI-5's amendments to the ADR/charter/register). This task did not reopen it; it independently re-verified and recorded the evidence AC1-AC5 require.

Dated registry evidence observed live 2026-08-04 13:01:49Z-13:04:26Z UTC (date -u; npm view <pkg> <field>; gh api repos/<org>/<repo>), independent of the register's own same-day figures:
- @opum-ai/quest: npm view -> E404 Not Found (unclaimed). No ownership/maintainers/history exist because it has never been published.
- quest: v0.4.0, repo github.com/Clever/quest, no license field published, 5 maintainers (azylman, cleverdrone, jefff, jonahkagan, rgarcia), desc 'simple request library for node'; npm view quest time -> first publish 0.0.2 2012-11-01, last 0.4.0 2018-09-04, modified 2022-06-25 (29 releases, then 8 years dormant, entry still live).
- quest-cli: v1.0.0, no repository/description field published, ISC, 1 maintainer (edamghy); npm view quest-cli time -> single publish 2022-02-17, modified 2022-05-13.
- @opum-ai/quest-cli, @salient-data/quest, @salient-data/quest-cli: all E404 (unclaimed), recorded only to confirm the dropped-suffix scoping pattern and rule out the superseded org.
- lore v0.13.0 / lore-cli v0.13.2: both repo github.com/lore/lore (unrelated third party, confirmed unrelated to Lore tooling).
- @opum-ai/lore: v0.1.0, MIT, repo github.com/opum-ai/lore-cli.git, maintainer jeremy-newhouse, bin lore -> bin/lore.cjs -- the sibling naming-pattern precedent (repo <name>-cli, package @opum-ai/<name>, executable <name>).
- Repository-identity/transfer-redirect check: local 'git remote -v' -> origin git@github.com:opum-ai/quest-cli.git; 'gh api repos/opum-ai/quest-cli' -> {full_name: opum-ai/quest-cli, id: 1319427259, private: true}; 'gh api repos/salient-data/quest-cli' -> the SAME id/full_name (stale org path redirects silently to the current identity, exactly the trap the register flags for lore-cli) -- transfer confirmed, not assumed.

Mandatory release-time recheck clause is written into the contract (AC1): a future release task MUST re-run this full sweep live immediately before any reservation/publish action and must not treat this 2026-08-04 snapshot as current proof of availability; if @opum-ai/quest is no longer free at that point, that is a new fact for the owner to rule on, not grounds for a worker to pick a substitute name.

AC2: classified quest/quest-cli/lore/lore-cli npm packages as Excluded and @opum-ai/lore as Allowed (naming-pattern precedent only), all cited read-only from the register's existing 'npm package name occupancy' and lore-cli slices -- no reclassification performed. Confirmed no source/test/README content of any occupied package was opened, copied, executed, or contacted; only public npm/gh metadata fields were read.

AC3: @opum-ai/quest recorded as the accepted scoped fallback, executable quest unchanged, in the new packaging contract.

AC4: contract text ties every public-claim category (package metadata, install copy, public claims) to the ADR's own 'protected immutable package... published and clean-install verification passes' consequence, plus explicitly routes Lore activation-gate verification to QCLI-2.7's scope (not asserted here).

AC5: only read-only npm view / gh api lookups performed; no npm publish/access/owner/deprecate or GitHub settings mutation of any kind; contract states future reservation/transfer/publication/release each require separate explicit owner authorization.

Contradictions found: none. Every fact independently re-observed here is consistent with the register's 2026-08-04 revalidation and the ADR's 2026-08-04 amendment.

Gates run from this worktree after 'lore sync' (which also auto-committed backlog/tasks/qcli-2.9 with the --plan/--doc edits, and reconciled unrelated drift on docs/stories/audit-quest-cli-documentation-authority.md's QCLI-5 status to Done):
- 'lore check --strict --plain' -> '17 files, 0 errors, 0 warnings' (exit 0)
- 'lore validate --strict --plain' -> '17 files, 0 errors, 0 warnings, 6 skipped' (exit 0)
- 'lore orphans --plain' -> '0 orphan tasks, 0 dangling links' (exit 0)

Out of scope, not touched: docs/index.md's hand-authored 'Start here' list was left unedited (the new doc is already reachable via docs/reference/index.md's managed block, auto-added by 'lore sync') to avoid a shared-file edit against concurrent QCLI-2.2/QCLI-2.7 work this wave.
<!-- SECTION:NOTES:END -->
