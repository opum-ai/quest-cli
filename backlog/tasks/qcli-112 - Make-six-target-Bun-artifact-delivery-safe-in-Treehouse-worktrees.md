---
id: QCLI-112
title: Make six-target Bun artifact delivery safe in Treehouse worktrees
status: Done
assignee:
  - '@codex'
created_date: '2026-08-17 21:25'
updated_date: '2026-08-19 00:25'
labels:
  - quest-0.2
  - bun
  - packaging
  - treehouse
  - 'doc:stories/harden-and-qualify-quest-cli-0-2-x'
dependencies: []
references:
  - scripts/build-platform-packages.mjs
  - scripts/check-package-artifacts.mjs
  - .codex/skills/treehouse-worktrees/SKILL.md
  - scripts/deliver-package-artifacts.mjs
  - scripts/test-package-artifact-delivery.mjs
  - .github/workflows/prepublication-qualification.yml
  - scripts/qualification/prepublish.mjs
  - 'https://github.com/opum-ai/quest-cli/pull/114'
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32081140427'
  - 'https://github.com/opum-ai/quest-cli/actions/runs/32081140380'
documentation:
  - docs/stories/harden-and-qualify-quest-cli-0-2-x.md
modified_files:
  - scripts/deliver-package-artifacts.mjs
  - scripts/test-package-artifact-delivery.mjs
  - scripts/check-package-artifacts.mjs
  - scripts/test-packed-packages.mjs
  - scripts/qualification/prepublish.mjs
  - package.json
  - .github/workflows/prepublication-qualification.yml
  - .codex/skills/treehouse-worktrees/SKILL.md
priority: medium
type: chore
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rebuilding Quest's six Bun-compiled native packages produces roughly 64–99 MB binaries. In the constrained campaign worktrees, ordinary Git add, commit, status, and diff refreshes have been killed with exit 137, forcing manual loose-object/index construction and persistent assume-unchanged hints. Provide a supported, observable repository workflow that preserves artifact integrity without hidden index state or Git plumbing surgery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A documented repository command can build, inspect, stage, and commit all six native artifacts in a Treehouse worktree without manual Git object creation or update-index cacheinfo operations
- [x] #2 The workflow leaves no persistent assume-unchanged or skip-worktree bits and permits normal status and diff inspection plus safe Treehouse lease return
- [x] #3 Constrained-environment qualification detects staging or memory failure explicitly instead of silently omitting changed binaries
- [x] #4 All six platform versions, package metadata, checksums, and packed-package gates remain mechanically verified
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a repository-owned deliver:packages command that builds all six Bun targets sequentially, emits structured step/timing results, and uses only ordinary Git porcelain with per-invocation maintenance and pack-memory bounds.
2. Preflight an empty index, no conflicts, and no assume-unchanged or skip-worktree bits in the delivery scope while preserving unrelated unstaged files outside that scope.
3. Stage only root/package artifact paths in small observable steps, require every platform manifest and binary in the staged set, reject missing or unexpected staged paths, rerun metadata/checksum/pack gates, then commit and verify the committed paths and clean artifact scope.
4. Classify SIGKILL or exit 137 as an explicit memory_or_staging_failure and leave any partial ordinary staging visible for diagnosis instead of mutating index flags or constructing Git objects manually.
5. Add small temporary-repository qualification for successful exact-scope delivery, unrelated-file preservation, pre-staged/hidden-flag rejection, and injected staging failure; wire it into repository checks.
6. Tighten six-package OS/CPU mapping checks, derive packed-test version metadata from the root package, document the Treehouse invocation and identity-fenced return proof, then run focused, full, package, Lore, and independent review gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research at merged dev 70a6283 found six tracked native binaries totaling roughly 495 MiB with matching package/root SHA-256 metadata and normal Git index flags. Existing build:packages, check:packages, and test:packages verify compilation, six package manifests/checksums/dry-run contents, and a current-host packed smoke test, but no supported stage/commit command exists. Exit 137 is consistent with constrained-host SIGKILL during large-blob hashing or optional maintenance; the design therefore isolates sequential adds, disables auto-maintenance only for the commit invocation, limits pack threads/window memory, and reports partial staging rather than hiding it.

Implementation completed on merged dev base 70a6283. `deliver:packages` builds the six targets serially, emits JSON step/timing and staged-set evidence, uses path-scoped ordinary `git add`, rejects pre-staged/conflicted/hidden-index states, runs cached diff/package/packed gates, commits with per-invocation maintenance and pack-memory bounds, and verifies the committed set and clean artifact scope. A temporary-repository fixture proves the exact documented alias, 19-path commit, unrelated-file preservation, assume-unchanged and skip-worktree rejection, and portable exit-137 classification with visible ordinary staging. Source qualification now runs the fixture. Independent review accepted after the Windows portability and qualification gaps were corrected. Verification: `bun run check` (160 tests, 1,400 expectations), `bun run check:packages`, `bun run test:packages`, strict Lore validate/check (62 files, 0 errors/warnings), and `git diff --check` all passed.

Delivery completed through PR 114. Exact head 52e4cc2 / tree 48ebe720 passed source qualification plus all six immutable candidates in run 32081140427 and all six projection lanes in run 32081140380; Windows ARM64 passed 10/10 after the independently reviewed QCLI-111 statement-lifecycle follow-up. PR 114 merged to dev at 6f247cc with a merge tree byte-identical to the candidate. Remote/local campaign branches were deleted and lease 91574eeb256a6f0ab89017c343321ffb was returned with identity fencing.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a supported six-target artifact delivery workflow for Treehouse worktrees. The repository command builds serially, inspects and stages an exact artifact set with ordinary Git porcelain, mechanically checks versions/metadata/checksums/packed contents, commits under bounded Git maintenance settings, and leaves no hidden index state. Structured failure evidence makes exit 137/SIGKILL and partial staging explicit. Portable fixture and source qualification coverage protect the workflow, and Treehouse guidance documents invocation and identity-fenced return checks.

PR 114 merged to dev at 6f247cc after source, six immutable package, and six projection checks passed; the merge tree exactly matched the finalized candidate.
<!-- SECTION:FINAL_SUMMARY:END -->
