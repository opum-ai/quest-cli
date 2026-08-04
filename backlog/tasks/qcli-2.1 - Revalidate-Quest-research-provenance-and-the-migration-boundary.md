---
id: QCLI-2.1
title: Revalidate Quest research provenance and the migration boundary
status: In Progress
assignee:
  - '@claude'
created_date: '2026-08-01 17:10'
updated_date: '2026-08-04 06:41'
labels:
  - campaign
  - research
  - provenance
  - clean-room
  - migration
  - 'doc:stories/prepare-quests-clean-room-research-foundation'
  - 'cluster:provenance'
  - wave-1
dependencies:
  - QCLI-1
documentation:
  - docs/stories/prepare-quests-clean-room-research-foundation.md
parent_task_id: QCLI-2
priority: high
type: spike
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Adopt and revalidate the completed OCLI-3.1 provenance register after the opum-cli to opum-doc identity change. Confirm which source slices remain allowed, contextual, superseded, deferred, excluded, or quarantined before any additional Quest research uses them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The current source register records repository or URL, exact revision or retrieval date, ownership rationale, permitted use, exclusions, and reclassification triggers
- [ ] #2 The former opum-cli repository is identified as opum-doc research provenance, not the Quest implementation home
- [ ] #3 quest-cli remains free of excluded or quarantined source and tests
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read the completed OCLI-3.1 register (opum-doc docs/reference/dated-opum-fleet-and-prior-art-inventory.md, recoverable in full at commits 7b82afc/d42c016) and the quest-cli migration ledger's source-provenance boundary as the baseline to revalidate, not copy verbatim.
2. Re-verify each dated claim live rather than trusting prior text: confirm the opum-cli->opum-doc rename via `git remote -v` in the local opum-doc checkout; confirm the two recovery commits are reachable; confirm quest-doc's canonical provenance ledger and clean-room spec do not conflict with what quest-cli records.
3. Verify the owner's 2026-08-04 backlog.md ruling against the locally installed tool: `backlog --version` (1.49.3), `npm view backlog.md version/license/repository` (MIT, MrLesk/Backlog.md) - record public-surface allowed, implementation/tests excluded, with the authorship-independence rationale, not a licensing one.
4. Verify the dated Lore/npm evidence supplied by the orchestrator instead of copying it: check `lore --version`, resolve the local `lore` binary's real npm package and GitHub origin, and run `npm view` against `quest`, `quest-cli`, `lore`, `lore-cli`, and the `@salient-data/*`/`@opum-ai/*` scopes plus `gh release view`/`gh repo view` for the lore-cli release tag.
5. Author a new lore-managed Reference doc under docs/reference/ (scaffolded via `lore new reference`) recording, per source slice: repository/URL, exact revision or retrieval date, ownership rationale, permitted use, exclusions, and reclassification triggers, using the allowed/contextual/superseded/deferred/excluded/quarantined vocabulary from the research Spec. Explicitly state the opum-cli->opum-doc identity (AC2) and confirm quest-cli's current file inventory holds no excluded/quarantined material (AC3).
6. Link the new Reference into docs/reference/index.md and docs/index.md navigation (via `lore sync`/manual cross-link, letting lore manage the generated index block) and note any Quest-wide-impacting finding as a proposal to quest-doc rather than normative here.
7. Run `lore sync` then `lore check` (and `lore validate --strict` if needed) and capture real output; fix only drift lore itself reports.
8. Record decisions and verification output via `backlog task edit QCLI-2.1 --append-notes`; flag anything needing owner attention via `--comment`.
9. Commit in small logical slices with `Refs: QCLI-2.1` trailers, confirm nothing lore/backlog left unstaged, and push the branch.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Revalidation complete. Authored docs/reference/quest-cli-research-source-register.md (lore-managed Reference, scaffolded via `lore new reference`) as the current per-slice admission authority, superseding the OCLI-3.1 capsule (opum-doc:docs/reference/dated-opum-fleet-and-prior-art-inventory.md) as the thing Quest research must check before citing a source.

Classification decisions (all re-verified live 2026-08-04, not copied from the prior capsule):
- opum-doc (formerly opum-cli): Contextual — confirmed via `git remote -v` in the local checkout (salient-data/opum-doc). Explicitly recorded as OCLI-provenance owner, NOT the Quest implementation home (AC2). Legacy Opum CLI implementation source/tests possibly still in its Git history remain excluded from inspection regardless of the rename.
- Dated fleet inventory + its two recovery commits (7b82afc, d42c016): Allowed — both commits confirmed reachable in opum-doc via `git show --stat`.
- Historical OCLI Story/Spec/Runbook/task records: Allowed per-record, gated by the migration ledger's row-by-row disposition (never blanket).
- Quarantined legacy artifacts (unversioned opum-cli/fast-mcp-opum fleet copies): Quarantined, not re-inspected, carried forward unchanged.
- Deferred Opum prototype surfaces (MCP, hosted UI/app): Deferred, no current QCLI task may treat as a requirement source.
- Backlog.md implementation source/internal tests: Excluded per the owner's explicit 2026-08-04 ruling — rationale is authorship independence, not licensing (MIT would legally permit reading; owner declined the offered reclassification). Verified locally installed build is v1.49.3 (`backlog --version`, `npm view backlog.md version` both 1.49.3, license MIT, repo MrLesk/Backlog.md).
- Backlog.md public surface (published docs, --help, --plain/--json output, on-disk artifacts): Allowed, pinned to v1.49.3.
- lore-cli / `lore`: Allowed (public CLI surface only). CORRECTION to the orchestrator-supplied evidence: the repository is `github.com/opum-ai/lore-cli` (private), not `salient-data/lore-cli` — verified via `git remote -v` in the local lore-cli checkout and `gh api repos/opum-ai/lore-cli` (full_name opum-ai/lore-cli). `gh api repos/salient-data/lore-cli` resolves to the same repo id (1275776424) via GitHub's rename redirect, confirming salient-data/lore-cli is a stale identity for the same repo, not a second one. Release v0.1.0 publishedAt 2026-08-04T02:44:47Z confirmed via `gh release view`. Locally installed `lore` binary symlinks to npm package @opum-ai/lore@0.1.0 (MIT) — this is the real published package; the unscoped npm names `lore`/`lore-cli` are an unrelated third party (github.com/lore/lore, a React/Redux framework), confirmed via `npm view`.
- npm name occupancy (quest v0.4.0/Clever/quest; quest-cli v1.0.0 unattributed; lore/lore-cli unrelated; @salient-data/quest, @salient-data/quest-cli, @salient-data/lore-cli all 404): Excluded as source material, recorded only as naming-conflict evidence for QCLI-2.9 — did not attempt to resolve the naming question myself.
- quest-doc and lore-doc canonical records: Allowed/Contextual respectively, cited for consistency, not restated or overridden here. No finding in this register proposes a change to Quest-wide vocabulary/architecture/roadmap.
- quest-cli's own current repository inventory: attested via `git ls-files` + `git status --porcelain=v1 --untracked-files=all` (clean, no untracked files) as AC3 evidence — no package manifest, src tree, executable scaffold, or runtime dependency present.

Verification actually run:
- `lore sync --plain` -> regenerated docs/log.md, docs/reference/index.md, docs/stories/{audit-quest-cli-documentation-authority,prepare-quests-clean-room-research-foundation}.md, committed backlog/ (1 file, this task's status). Incidentally cleared pre-existing status/managed-block drift on stories/audit-quest-cli-documentation-authority.md left over from QCLI-4 (unrelated to this task's content, fixed because `lore sync` is required before `lore check`).
- `lore check --strict --plain` -> "16 files, 0 errors, 0 warnings", exit 0 (after fixing one broken relative link this task introduced, from ../adr/ path correction).
- `lore validate --strict --plain` -> "16 files, 0 errors, 0 warnings, 6 skipped", exit 0.
- `lore orphans --plain` -> "0 orphan tasks, 0 dangling links", exit 0.
- `git status --porcelain=v1 --untracked-files=all` (quest-cli) -> clean before this task's own edits; confirms AC3's baseline.

Committed at 108eb64 (Refs: QCLI-2.1); backlog status commit auto-made by `lore sync` at bce0dec.

Orchestrator correction folded in (owner input received mid-task, 2026-08-04):

- lore-cli npm package confirmed as @opum-ai/lore (this task's own earlier verification already had this right — no change needed there).
- NEW: owner decided quest-cli itself moves to the opum-ai GitHub org and publishes as @opum-ai/quest, executable stays `quest`. Verified live: @opum-ai/quest currently 404s on npm (unclaimed) via `npm view @opum-ai/quest version`; this repo's own `git remote -v` still shows salient-data/quest-cli (transfer not yet executed). Recorded as a new Allowed source-register slice "quest-cli repository and npm package identity (owner decision, 2026-08-04)".
- Recorded that this owner decision exercises (not contradicts) ADR decision #2's owner-approved-scope fallback, and that it SUPERSEDES the ADR's decision #1 (salient-data/quest-cli as canonical) — classified as a Superseded finding in the register. Did NOT rewrite docs/adr/use-quest-cli-for-the-quest-package-and-command.md itself; that stays out of QCLI-2.1's scope per explicit orchestrator instruction, and is the orchestrator's job to surface to the owner.
- Recorded that unscoped npm `quest` (v0.4.0, occupied by an unrelated party) is now only the rationale for going scoped, not an open allocation question — final resolution stays QCLI-2.9's job, not touched further here.
- Recorded @opum-ai/lore v0.1.0 as immutable published release evidence relevant to the Lore activation gate, explicitly leaving gate-evidence verification against the owning repository to QCLI-2.7.
- Added a reclassification-trigger note that a GitHub rename/transfer redirect makes a stale org reference silently resolve (gh api repos/salient-data/lore-cli returns opum-ai/lore-cli's data without erroring) — any org-qualified citation must be re-verified against live git remote/gh api identity, not assumed correct because an old-name lookup succeeded.

Re-verified after edits: `lore sync` (1 file changed: docs/log.md), `lore check --strict` -> "16 files, 0 errors, 0 warnings" exit 0, `lore validate --strict` -> "16 files, 0 errors, 0 warnings, 6 skipped" exit 0. Committed at b25c891 (Refs: QCLI-2.1) and pushed.
<!-- SECTION:NOTES:END -->

## Comments

<!-- COMMENTS:BEGIN -->
author: @codex
created: 2026-08-01 18:16
---
Authority audit: QCLI-1 is now an explicit dependency, matching the canonical research specification. Dated OCLI source classifications remain provisional until this task revalidates them.
---

author: @claude
created: 2026-08-04 06:38
---
Two things worth reviewer attention:

1. Repository-identity correction: the orchestrator's dated evidence said "salient-data/lore-cli published GitHub release tag v0.1.0". Live verification (git remote -v, gh api repos/opum-ai/lore-cli, gh api repos/salient-data/lore-cli) shows the actual current repository is `opum-ai/lore-cli` (private) — `salient-data/lore-cli` resolves to the same repo id only via GitHub's rename redirect, i.e. it's a stale identity, not a live second location. The v0.1.0 release timestamp (2026-08-04T02:44:47Z) matches; only the owning org differs from what was supplied. Recorded in the register's lore-cli entry with the correction and the exact commands used. Flagging in case this affects how QCLI-2.7 or the component charter's Lore routing table should later phrase lore-cli's org.

2. Incidental drift fix: `lore check` failed at task start due to pre-existing reconciliation drift on docs/stories/audit-quest-cli-documentation-authority.md (status/managed block stale from QCLI-4 completing without a subsequent `lore sync`), unrelated to this task's content. Running the mandated `lore sync` before `lore check` cleared it as a side effect. No authored prose on that Story was touched — only its lore-managed status/block. Noted here in case a reviewer wants that attributed to a separate follow-up rather than folded into this task's commit.
---

author: @claude
created: 2026-08-04 06:41
---
Follow-up to comment #2, after the orchestrator's mid-task correction: the owner's 2026-08-04 decision to move quest-cli to the opum-ai GitHub org and @opum-ai/quest npm package is now recorded in the register as a classified Allowed/Superseded finding (new "quest-cli repository and npm package identity" slice). Per the orchestrator's explicit instruction I did NOT amend docs/adr/use-quest-cli-for-the-quest-package-and-command.md's decision #1 (which still names salient-data/quest-cli as canonical) — that ADR edit is intentionally left for the orchestrator/owner to action separately. Flagging here so it isn't lost: the ADR text and the register now disagree on record until that follow-up lands.
---
<!-- COMMENTS:END -->
