---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Lore dependency and adapter contract evidence
tags:
  - quest
  - cli
  - lore
  - dependency
  - adapter
  - evidence
  - activation-gate
summary: Live evidence, re-derived 2026-09-07, for QCLI-207's three remaining acceptance criteria against lore-cli's current Quest tracker adapter.
timestamp: 2026-09-07T14:12:00.000Z
---

# Quest CLI Lore dependency and adapter contract evidence

## Supersession notice

This replaces the 2026-08-04 revision of this document in full. That
revision's Part 2 (the adapter contract review) and its AC5 classification
table described `lore-cli` at tag `v0.1.0`/`v0.1.1` — an era with **no**
Quest adapter at all: `BacklogAdapter` was `lore-cli`'s only adapter type,
and every row in that table concluded some piece of the Quest-Lore contract
was "not yet built" or "requiring a lore-doc boundary decision." None of
that is still true. `lore-cli` has since shipped a dedicated,
extensively-documented `quest` tracker adapter (`src/adapters/quest.ts`,
`src/tracker-selection.ts`, `src/adapters/tracker-environment.ts`), an
Accepted ADR governing its versioning policy, and live cross-product
conformance tests that exercise it end to end. The old revision's content is
preserved in this file's git history (`git log -- docs/reference/quest-cli-lore-dependency-and-adapter-contract-evidence.md`),
not reproduced here.

**Scope of this revision**: QCLI-207's three remaining acceptance criteria
(AC1, AC2, AC4 — AC3 already closed, see its own task notes). This is not a
full re-audit of every historical fact the prior revision recorded; those
outside QCLI-207's scope (the Lore-wide release-gate predicate, Backlog CLI
dependency history) were not re-verified in this pass and should not be
read as reconfirmed.

## Sources read

All citations below were read live on 2026-09-07, via `git show
origin/<ref>:<path>` and `git ls-tree` against local clones — never a
checkout of the sibling repository's working tree, per this fleet's
sibling-repo rule — plus direct execution against currently-published
packages in an isolated scratch workspace:

- `/Volumes/external/repos/lore-cli`, `origin/dev` at `e98e217` ("chore(LCLI-456): cut lore 0.4.6 (#604)"): `src/adapters/quest.ts`, `src/tracker-selection.ts`, `src/adapters/tracker-environment.ts`, `docs/adr/0020-tracker-version-gates-are-minimum-floors.md`.
- `/Volumes/external/repos/opum-doc`, `origin/dev` at `0f79a54`: `docs/lore/specs/quest-integration-and-lore-release-gate.md`, `docs/lore/specs/service-to-service-contracts.md`, `docs/quest/*`.
- `/Volumes/external/repos/opum-cli-e2e`, `origin/dev` at `aeb2738`: `suites/40-cross-product.mjs` (the live cross-product conformance suite, several rows tagged `QCLI-97.5 AC#2`/`AC#3`/`AC#4` verbatim — `QCLI-97.5` is this task's own pre-migration alias).
- Direct execution: `quest --version` → `0.3.4` (published), `lore --version` → `0.4.4` (installed; registry `latest` is `0.4.5` as of this write — `0.4.6`, containing the LCLI-455 paused-status fix, had not yet published).

## AC1 — a versioned, owner-approved Lore-to-Quest tracker adapter contract

**Met.** Not as one consolidated prose document — `opum-doc`'s own hub-level
spec (`docs/lore/specs/service-to-service-contracts.md`) explicitly assigns
that role to the component repositories ("Component repositories own
concrete endpoints, schemas, credentials, and deployment evidence... current
machine-readable contracts remain with their owners"), so a distributed,
versioned, reviewed contract is the intended shape here, not a gap against
it. The contract is real and current:

- **Versioned.** `lore-cli`'s `MIN_QUEST_VERSION = "0.2.7"` is a minimum
  floor, not a bounded allowlist — a deliberate, owner-approved reversal of
  an earlier exact-match design (`docs/adr/0020...md`, Status: Accepted,
  2026-08-28: "Reverses the bounded-set choice made in LCLI-353... Every
  backend patch release requires a Lore release before the pair works" was
  the cost the floor design fixed). Quest's own side carries
  `TRACKER_CONTRACT_VERSION = 1` and `QUEST_ADAPTER_PINNED_VERSION`
  (`src/contract/tracker/index.ts`, this repository).
- **Owner-approved.** ADR-0020's Status line and its explicit "product-owner
  decision" framing; `lore-cli`'s adapter source itself documents multiple
  named, dated design reversals with their reasons (e.g. `QUEST_WORKSPACE_NOT_INITIALIZED_CODE`'s
  LCLI-376 history, below).
- **Backend selection**: `src/tracker-selection.ts`'s `resolveTrackerSelection()` (see AC2).
- **Binary discovery**: `bunQuestSpawn(root, binary = "quest")` spawns via `PATH`
  with a bounded, argv-only transport ("caller data is never interpolated
  into a shell command" — source comment); `adapters/tracker-environment.ts`'s
  `detectTrackerEnvironment()` reports whether the `quest` binary is
  installed, independent of workspace state.
- **Read/write result envelopes**: every Quest response is validated
  structurally — `schemaVersion === QUEST_SCHEMA_VERSION`, the exact `kind`,
  `data`'s presence, and the full `REQUIRED_COMMANDS` set checked against
  the live manifest — so a Quest that broke the contract fails with a typed
  `drift` diagnostic naming what changed, independent of its version string
  (this is ADR-0020's own stated reasoning for why a floor is sufficient).
- **Actor declarations**: every write carries `ACTOR_FLAGS = ["--actor", "lore", "--actor-kind", "human"]`.
- **Failure behavior**: typed, discriminable error codes with actionable
  hints — `QUEST_VERSION_FLOOR_CODE` (a below-floor Quest is fatal at
  selection time, "an installed backend below the floor is a pairing that
  cannot work at all, and nothing the operator does inside the repository
  fixes it"), `QUEST_WORKSPACE_NOT_INITIALIZED_CODE` (deliberately fatal
  rather than advisory since LCLI-376, because the advisory version "produced
  a SILENT broken state (`backend = "quest"` persisted, `lore check` staying
  green) rather than the loud, later failure... implied").

## AC2 — Lore explicitly selects an initialized Quest workspace, never guessing or mutating an unrelated Backlog.md project

**Met**, verified both by reading the current source and by direct live
execution today.

Source (`src/tracker-selection.ts`, `src/adapters/tracker-environment.ts`):
`resolveTrackerSelection()` gives an explicit `[tracker].backend` (including
TOML's dotted `tracker.backend` spelling) unconditional priority — never
inferred from a task identifier. Absent that, a **real** Backlog.md project
(`hasBacklogProject()`: the `backlog/` directory must exist, not be a
symlink, and contain `backlog/config.yml` — the exact marker `backlog init`
writes) preserves the legacy backend; a bare directory sharing that name is
explicitly *not* evidence ("LCLI-358.5... any repository with a directory by
that name was interpreted as a legacy Backlog bundle... over a directory that
might hold no tasks at all"), which is precisely the "without... mutating an
unrelated Backlog.md project" guarantee this AC asks for. A repository with
neither signal defaults to Quest. `detectTrackerEnvironment()` checks Quest's
own durable marker (`.quest/workspace.toml`) before `lore init` ever offers
the choice.

Live execution, 2026-09-07, isolated scratch workspace, published `quest`
0.3.4 and installed `lore` 0.4.4:

```text
$ quest init --json
{"kind":"workspace.initialized", ...}

$ lore init --yes --tracker quest --json
{"kind":"init.result","data":{
  "trackerEnvironment":[
    {"backend":"quest","installed":true,"initialized":true},
    {"backend":"backlog","installed":true,"initialized":false},
    ...],
  "trackerCheck":{"checked":true,"backend":"quest","capable":true,"version":"0.3.4"},
  "tracker":"quest"}}
```

Exit 0, explicit selection, bound to the already-initialized Quest
workspace, correctly reporting Backlog as not initialized in the same
repository. This is also `opum-cli-e2e`'s own live conformance row,
`suites/40-cross-product.mjs`, tagged `"lore explicitly selects an
initialized Quest workspace as its tracker backend (QCLI-97.5 AC#2)"` —
this task's own pre-migration id, run continuously as part of that harness's
cross-product suite.

## AC4 — the integration preserves Lore-managed regions and Quest-owned records, with no direct private-storage coupling

**Met**, verified both by reading the adapter source and by direct live
execution today.

Source: a full read of `lore-cli`'s `src/adapters/quest.ts` (648 lines) finds
exactly **one** direct filesystem touch of `.quest/` — a read-only
`existsSync(join(root, ".quest", "workspace.toml"))` existence check
(`QuestWorkspaceInitialized`). Every other interaction is a JSON envelope
over a `quest` CLI subprocess spawn. Quest itself (this repository) carries
no code that reads or writes any Lore-owned path (`docs/`, `.lore/`,
`CLAUDE.md`).

Live execution, 2026-09-07, same scratch workspace as AC2 (Quest 0.3.4,
Lore 0.4.4, `lore` already initialized with a Story):

- Snapshotted every file under `docs/`, `.lore/`, `CLAUDE.md` (SHA-1 per
  file), then ran Quest's full write surface (`task create`, `draft
  create`, `milestone create`, `decision create`). Re-snapshotted: **zero
  files added, changed, or removed** — byte-identical.
- Snapshotted every file under `.quest/`, then ran Lore's write surface
  (`lore new adr`, `lore sync`, `lore check`, all exit 0). Re-snapshotted:
  **zero files added, changed, or removed** — byte-identical.

This mirrors `opum-cli-e2e`'s own live conformance rows in
`suites/40-cross-product.mjs` — `"quest init and the full quest write
surface leave Lore-owned state untouched"` and `"lore's write surface
leaves Quest-owned records untouched"` — whose own comment names them "the
isolation half of QCLI-97.5 AC#4."

## Conclusion

All three of QCLI-207's remaining acceptance criteria are met by what
currently ships (`@opum-ai/quest@0.3.4`, published; `0.4.0` tagged, publish
pending lore 0.4.6 per a separate, unrelated hold — see QCLI-241) paired
with `lore-cli`'s current adapter (`dev` at `e98e217`, cutting lore 0.4.6).
None required a Quest-side contract change to close; the work was already
done, primarily on `lore-cli`'s side, since the 2026-08-04 revision of this
document was written against a nine-minor-version-old `lore-cli` that had
not yet built a Quest adapter at all.
