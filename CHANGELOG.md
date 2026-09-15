# Changelog

Records start here, at 0.5.0. Earlier releases are documented in
`docs/reference/quest-cli-release-truth.md` and in each release's own PR
history; this file is the forward-looking record.

## Unreleased

### Fixed

- The release publish no longer puts `@opum-ai/quest` on the registry until a
  read confirms all six platform packages actually **resolve for a consumer**.
  It previously ordered its writes and treated that as the guarantee; write
  order does not produce visibility order, and during the 0.7.0 publish the
  two disagreed in four of six positions while one package sat non-public for
  twelve minutes past the wrapper. Because platform packages are
  `optionalDependencies`, an install inside that window SUCCEEDS and leaves no
  binary -- so the failure was silent from the consumer's side and reported as
  success from the publisher's (QCLI-299).

  Nothing about an installed release changes; this is release tooling. The
  gate reads over plain HTTPS with no credential, which is a different client
  from the publishing one, and holds a 30s settle margin over the 9-20s
  publisher-early lag measured by opum-cli-e2e.

- A timed-out publish verification no longer asserts "this is registry
  read-after-write lag, not a failed release". That sentence was true of six
  packages and wrong about the one that decided whether 0.7.0 shipped, and it
  told the operator to stop investigating at the moment investigating was the
  whole job. It now reports each package's state read from the registry --
  public, staged, or undetermined -- and names the operator action for a
  staged one, including that the release token cannot clear it. The
  `npm unpublish` warning stays: that half was protecting against a genuinely
  destructive action (QCLI-299).

### Added

- `.github/workflows/lore-check.yml`: CI now runs `lore check` on every pull
  request into `dev` (and on push to `dev` and `main`, so the context can later
  become a required check without deadlocking the fast-forward promotion). The
  operating block has made a green `lore check` the definition of done for a
  docs change all along; nothing here enforced it. Unlike the fleet reference
  job, this one installs no published `@opum-ai/quest`: lore's quest adapter
  shells out to whatever `quest` is on PATH, and this repository authors quest,
  so the job runs lore against a shim over `bun run src/cli/main.ts` from the
  same checkout and asserts that is what PATH resolved to (QCLI-301).

## 0.7.0

Version frozen 2026-09-15, in lockstep with `@opum-ai/lore` 0.7.0 -- the
pairing convention every release has held since 0.5.0, resumed after 0.6.2
broke it once deliberately. **The date above is when this version was frozen
and the bump landed, not when it reached npm**; publication is a separate,
manually authorized step, and nothing in this file should be read as evidence
that it happened.

Minor, not patch, and one entry below deserves reading before you upgrade
rather than after. `quest task pause` now parks a task at `"Paused"` instead
of `"Blocked"`, so **anything matching on the literal string `"Blocked"` to
find paused work will stop matching.** No transition, flag or envelope shape
changed to make that true -- the configured value did. Everything else here
is additive: a new envelope field and two new optional flags, each inert when
not asked for.

*Observed after release, 2026-09-15, reported by opum-cli-e2e from their
0.7.0 qualification matrix (their PR #154):* that warning was published and
the best-placed consumer still missed it. Their `60-project-lifecycle` suite
pinned the literal `"Blocked"` and six rows failed against a conformant quest,
while their `40-cross-product` suite read the value live and absorbed the
same release without moving a row. Their fix binds the suite to what
`task status-flow` declares. A changelog warning is not a gate; a consumer
that binds to the CLI's own declaration does not need one.

### Added

- Every success envelope now carries `contractVersion: 1`, a new field
  distinct from `schemaVersion` (which stays the outer envelope-wrapper
  version). `contractVersion` is a single global counter, not a per-command
  one: it moves whenever any command's `data` payload shape changes in a way
  an existing decoder would misread, so a consumer has one field to check
  rather than needing to track ~30 commands independently (QCLI-289).

  This exists because 0.6.2's `QCLI-264`/`QCLI-265` envelope-shape unification
  (`data.task` becoming bare `data`, among others) shipped with `schemaVersion`
  unchanged at `1` on both sides of the break -- reported downstream by host
  mbpm2, whose own integration suite passed 0.6.2 validation and then broke
  anyway, because nothing distinguished the old shape from the new one.
  **That break predates this field and stays undetectable by it**:
  `contractVersion` starts at `1` in the release that introduces it rather
  than being backdated to claim a transition that had no signal at the time.
  Anything relying on the pre-`contractVersion` shape needs to keep doing
  what it already does today (a defensive read of either shape); this field
  only protects against the *next* shape change, not the last one.

  **What `contractVersion` does NOT cover.** Stated here because a field that
  says what it covers and not what it omits has the same defect it was added
  to fix -- and because 0.7.0 itself contains two changes it does not signal.
  Verified by probing every envelope family the 0.7.0 binary emits, not read
  off the source:

  - **Error envelopes carry no `contractVersion`, by design.** An error
    envelope is `{error_type, message, hint?, input?, principal}` and carries
    no envelope metadata at all -- no `schemaVersion` and no `kind` either --
    so its absence here is the existing design, not an oversight. Do **not**
    infer "`contractVersion` absent ⇒ pre-0.7.0 shape" from an error envelope;
    that rule holds only for success envelopes. Errors are discriminated by
    the frozen exit-code taxonomy (§3) instead, which is stable and needs no
    version field. This is deliberate and will not be revisited quietly: the
    error envelope is specified as a closed key set, so adding a key to it is
    a breaking change for any consumer validating it strictly -- and at least
    one does, which is precisely why the field was added to success envelopes
    only.
  - **Configured-value changes are not payload-shape changes.** The counter
    moves when a `data` payload's *shape* changes in a way an existing decoder
    would misread. It does not move when a value inside an unchanged shape
    changes. **0.7.0 contains exactly such a change**: `quest task pause` now
    parks a task at `"Paused"` instead of `"Blocked"`, so a consumer matching
    the literal string `"Blocked"` stops matching while `contractVersion`
    correctly stays `1`. Read `contractVersion` as "can my decoder still parse
    this?", never as "did anything I depend on change?" -- the second question
    is what a changelog is for, and this entry is the answer for this release.

- `quest task view <id> --max-notes N` caps `implementationNotes` to the most
  recent `N` entries, adding a `notesOmitted` count (present whenever
  `--max-notes` is supplied, including `0`, never otherwise). Additive and
  opt-in -- omitted, `task view` is byte-for-byte unchanged (QCLI-276, one
  piece of DEC-3, a shape agreed jointly with `@opum-ai/lore`'s own
  `lore context` budget work). The rest of DEC-3's originally-scoped surface
  (a general `--fields` selector, `--since`/cursor note selection, retrieving
  one note by a stable id, field-level omission metadata) is deliberately
  deferred, not dropped -- tracked as QCLI-291.

- `quest task edit <id> --if-revision <rev>` (and a per-item `ifRevision` on
  `task edit-batch`) lets a caller supply the revision it read earlier and
  have the edit refused, before any state change, if the record has since
  moved -- the same exit-5 conflict a concurrent write race already produces.
  `quest task view <id> --json` now returns that revision (additive field) so
  a caller has something to capture. Omitted, `task edit` is unaffected
  (QCLI-277).

### Fixed

- A write conflict's `actualRevision` -- the one piece of data a caller needs
  to retry without a second read -- was silently discarded for *every* task
  write conflict, not only the new `--if-revision` case above: the internal
  helper that unwraps a mutation result threw a bare error with no payload.
  The documented retry protocol ("re-read the latest state and perform your
  own bounded retry") was correct advice that the CLI's own diagnostic didn't
  carry the means to follow. Now named in the diagnostic's `input` on every
  conflict, same exit code and message (QCLI-277).

- `quest agents --check --require-installed` exited `0` for a managed
  instruction block whose *content* is current but whose embedded Quest CLI
  version string is stale (`state: version-only`) -- correct, deliberate
  behavior since QCLI-228, and already documented that way in this CLI's own
  guide and help text. The one place that still lied about it: the
  block's own embedded CI-hint sentence, written into every consumer's
  CLAUDE.md/AGENTS.md, which said only "current instructions exit 0, ...
  missing, drifted, or malformed managed instructions exit 6" with no mention
  of the version-only case -- so a reader (lore-cli, concretely, whose
  CLAUDE.md said Quest CLI 0.4.0 against an installed 0.6.0 for two minor
  versions) reasonably concluded CI caught version drift when it deliberately
  does not. The sentence now names the exemption explicitly; the exit code
  itself was never the defect (QCLI-284, DEC-4).

- `quest task pause <id>` parked a task at status `"Blocked"` by default --
  a false signal read fleet-wide as "needs intervention," even when nothing
  was blocking the task. The default paused status is now `"Paused"`,
  structurally unchanged (still separate from the `To Do`/`In Progress`/`Done`
  ladder, still reachable only via `pause`/`start`) -- a naming fix, not a
  new transition (QCLI-287).

## 0.6.2

Breaks lockstep with `@opum-ai/lore`, once, deliberately -- the pairing
convention every release has held since 0.5.0 otherwise. `v0.6.1` was
tagged but never published: every publish attempt failed a registry E404
before writing anything (`actions/setup-node` exporting a placeholder
`NODE_AUTH_TOKEN` that defeated OIDC trusted publishing), a CI-only defect
with no content change of its own. Rather than move an already-pushed tag
(a cross-repo tag-stability concern for `quest-web`'s own CI), this release
carries the same content 0.6.1 would have under the next unclaimed version
number. Unlike 0.6.0's "minor, not patch" note, this is **not** a claim
that the release is safe to take without reading further: the
`### Changed (breaking)` entries below are real envelope-shape breaks
(QCLI-264, QCLI-265). Lore's own 0.6.1 is an uncomplicated patch; quest's
content is not, and normally would have shared the number anyway so the
pair stays coordinated -- this release is the one exception. Read the
breaking section before upgrading.

### Changed

- The root `@opum-ai/quest` package's published tarball now includes
  `README.md` alongside `bin/quest.cjs` and `LICENSE`, so the npm registry
  page renders it. It entered `package.json`'s `files` list as part of the
  2026-09-10 repository recreation (OPAG-70) without a specific review of
  its own; ratified here as a deliberate, ordinary choice for a published
  CLI package rather than reverted to match the pre-recreation three-file
  shape. Confirmed by opum-cli-e2e's pair-qualification suite against both
  a local pack and the live registry tarball; its expected-file-list
  baseline (`baselines/v0.6.2-pair`) now reflects this shape as current,
  not as a regression.

### Changed (breaking)

- Every **single-record** mutating command now carries the written record
  directly in the envelope's `data`, the shape `task create` and `task edit`
  already used. `task complete`, `task archive`, `task pause`, `task start`,
  `task demote`, `draft create`, `draft promote` and `draft archive`
  previously nested it under `data.task`/`data.draft`, alongside the
  repository `revision` hash and a second `kind: "success"` that shadowed the
  envelope's own semantic kind. A caller reading one group could not read the
  other: a `^status:` match over `--plain` matched an edit and silently missed
  a complete. Read the record at `data` on those commands; drop any
  `.data.task`/`.data.draft` hop (QCLI-264).

  "Single-record" is the whole claim, and the qualifier is load-bearing rather
  than pedantic: `task edit-batch` is a batch **report**, not a record, and is
  unchanged. Its records stay at `data.items[].task` and it keeps its declared
  `data.revision`: it is the workspace revision the batch committed at, which
  is what a caller needs to do its own bounded retry after a conflict, and
  `test/qcli122-third-pass.test.ts` has pinned it since QCLI-122. It is kept
  on that reasoning alone -- no external consumer reads it for control flow.
  It is the one payload in the CLI that is not a record, and it is meant to
  stay that way.

- Planning mutations and draft reads now carry the record in `data` too, so
  "where is the record" has one answer across the whole CLI.
  `milestone create|edit|archive|delete` and `decision create|edit|delete`
  returned `{record, result}`, where `result` was the same write receipt
  QCLI-264 unwrapped elsewhere; they now return the record. `draft view` and
  `draft list` returned the repository's `{draft, location}` pair -- the only
  reads in the CLI where the record was not the payload -- and now carry the
  draft's own fields with `location` inline, exactly as `task view` and
  `task list` already carried `path`. Read `data.id`, not `data.record.id` or
  `data.draft.id`; `location` keeps its name and its values (`drafts`,
  `archive/drafts`), so `--include-archived` callers filter on it as before
  (QCLI-265).

- `quest help <command>` prints `summary` and `usage` above the fields and
  flags lists instead of below them, and each flag now carries its value
  shape: `--label <string, repeatable>`, `--acceptance-criteria <json-array>`,
  `--comments <json-objects>`, and a boolean flag claims no value at all.
  Repeatability is per command, so `--type` reads as one scalar on
  `task create` and as a repeatable filter on `task list`.

  `usage` already documented the positional form before this change -- on line
  54 of 56, under ~50 lines of alphabetized names, so a pager, a `head`, or a
  context-budgeted agent never reached it. The fix is placement (QCLI-266).

- `quest manifest --json` gains `parameters` per command: `positional`
  (name, required, value) and `flags` (value kind, and whether the flag is
  repeated per item). `fields` lists domain field names and cannot say that
  `title` is positional rather than `--title`, so a caller generating a
  command line from the manifest -- which is what a manifest is for -- wrote
  `--title` and got a usage error. Additive: every existing key, `fields`
  included, is unchanged (QCLI-266).

  Both surfaces and the argv parser now read one table, so what help reports,
  what the manifest declares, and what the CLI accepts cannot drift apart.

### Fixed

- A write conflict on `task complete`/`archive`/`pause`/`start`/`demote` and
  the `draft` mutations is now the documented `conflict` failure (exit 5)
  rather than a success envelope, exit 0, carrying `kind: "conflict"` inside
  `data`. Only the unwrapped commands ever had this; `task create`/`edit`
  already classified it (QCLI-264).
- `quest init --plain` no longer prints the literal word `undefined` for a
  field it never selected (`agentSkillSource`, `instructionsByTarget`).
  Display-only: the identical `--json` invocation always omitted both keys
  correctly, and the underlying writes were correct. `src/cli/render.ts`'s
  object renderer kept a key whose value is JS `undefined` -- unlike
  `JSON.stringify`, which drops it -- and rendered it as the literal string.
  Fixed at the shared renderer, which protects every command that assigns an
  optional field straight into a data object, not just `quest init` (QCLI-272).
- `--check-ac`/`--uncheck-ac`/`--remove-ac` (and the `--*-dod` equivalents)
  addressed the wrong checklist item: every display surface numbers
  acceptance criteria and definition-of-done items starting at 1, but these
  flags read that same number as the 0-based `index` -- `--check-ac 3` on an
  item printed as position 3 silently checked the fourth item instead. Every
  envelope now carries an additive, presentation-matching 1-based `position`
  alongside the unchanged 0-based `index`; the flags take the printed
  `position` verbatim, and help/agent-guide text no longer describes a
  numbered list that did not exist (QCLI-269).
- The shared usage-error path (`only()` in `src/cli/main.ts`, 37 call sites)
  discarded which flag was rejected, so a caller who supplied every required
  flag correctly plus one unrecognized one was still told a reference or
  actor was missing -- `task complete --final-summary ...` was the reported
  case, since `--final-summary` was not yet an accepted flag on `task
  complete` at all. Both are fixed: `task complete` now accepts
  `--final-summary`, applied in the same write as the terminal transition,
  and 21 of the 37 call sites now name the actual unrecognized flag instead
  of a generic reference/actor sentence. The remaining 15 (the `migration
  backlog`, `milestone`/`decision`, and `draft` action dispatchers) use a
  positive-gate-per-action shape that cannot take this fix without a larger
  restructure and still report the old generic message -- tracked separately
  rather than left silently inconsistent (QCLI-270; the remaining 15 sites
  are QCLI-282).
- A task or draft record present under more than one `.quest/` storage
  location -- the shape a partial `git add` produces -- took down every
  `quest task` command with a bare, unactionable error. The error now names
  every colliding id and its exact file paths, plus sanctioned `rm`/`git rm`
  recovery guidance, instead of a message with nothing to act on (QCLI-261).
- `migration backlog status`/`rollback` reported a not-yet-previewed digest
  as `error_type: "validation"` (exit 6), not `"not_found"` (exit 3),
  contrary to the Opum result contract's not-found convention -- a caller
  branching on `error_type` to distinguish "malformed input" from "no such
  record" could not do so reliably. Reclassified to `not_found`; a
  differently-shaped digest-mismatch case on `apply()` stays `validation`
  deliberately, recorded as DEC-2 (QCLI-257).
- `release.yml`'s post-publish registry-verification step hard-failed the
  whole release if any of the seven npm packages was not yet visible within
  a flat 5-minute window -- and had already false-failed a successful
  publish twice (0.4.0, 0.5.0), both times on `quest-win32-arm64` alone
  propagating slower than the other six platforms. Widened to 12 attempts
  with exponential backoff (15s/30s/60s, capped), about 2.75-3x the old
  window, while the common fast case is unchanged; the step's output now
  also names which of two failure classes occurred (QCLI-247).

### Known limitations

- **0.6.2 ships without a provenance attestation, because provenance
  requires the CI OIDC path, which is currently dead.** GitHub's org-wide
  immutable-subject-claim policy rejects the subject-claim shape npm Trusted
  Publishing expects (unrelated to the 2026-09-10 repository recreation
  below), so 0.6.2 was published manually instead; a manual publish cannot
  produce an attestation. Expected, not evidence of tampering.
- **Versions published before 2026-09-10 carry permanently dangling
  provenance links** (the repository recreation destroyed the commits/build
  runs they point to) **and cannot be repaired -- npm forbids republishing a
  version.** Affects 0.3.0 through 0.6.0 and the never-published `v0.6.1`
  tag. See `docs/runbooks/quest-cli-package-and-release.md`.

## 0.6.0

Lockstep with `@opum-ai/lore` 0.6.0, same pairing convention as every release
since 0.5.0. Minor, not patch: new instruction-file targets and a changed
interactive default are user-visible capability, not a breaking change to any
existing flag, envelope shape, or manifest entry -- every scripted
`--target`/`--agent-instructions` path stays byte-identical to 0.5.0,
verified by the existing test suite needing zero edits across all of it.

### Fixed

- `task list --ready` no longer throws `dependency_target_not_found` for the
  whole workspace when a task's `parentId` or dependency points at an
  archived task. `TasksService.listFilteredLocated`'s readiness computation,
  and the standalone `TasksService.ready()`, now resolve the dependency
  graph across every task location (including `archive/tasks`) while still
  respecting the existing archive exclusion for what `--ready` actually
  returns (QCLI-249).
- `task create`'s `--label`/`--doc`/`--alias`/`--assignee`/`--reference`/
  `--modified-file`/`--dependency`, and their `--add-*`/`--remove-*`
  counterparts on `task edit` (plus `--remove-comment`), now reject a
  JSON-array-shaped value as a usage error instead of silently storing the
  whole array string as one malformed entry (QCLI-250).
- `quest init`'s interactive path now presents a multi-select listing every
  supported instruction file -- CLAUDE.md for Claude Code, AGENTS.md for
  Codex/OpenCode/pi/etc., GEMINI.md for Google Antigravity/Gemini CLI --
  instead of hardcoding AGENTS.md with no way to discover `--target claude`.
  A caller can tick zero, one, or more, with nothing pre-checked -- a bare
  Enter writes nothing (QCLI-254 added the initial claude/codex prompt;
  QCLI-255 replaced it with a multi-select per direct user request and
  reversed the initial pre-check-claude default to nothing pre-checked once
  the multi-select removed the forcing function that default was reasoned
  from; QCLI-159 widened the target set to three, confirming against each
  tool's own docs that pi and OpenCode need no dedicated file while
  Antigravity's GEMINI.md genuinely does). `--skill-source plugin` given on
  the same command line as `--agent-instructions` now skips the skill-file
  write, rather than being silently overridden by it; `--target`'s own
  unset default for scripted callers stays `codex`, unchanged, and the
  non-interactive `--target claude|codex|antigravity` flag path is
  untouched by any of this (QCLI-254, QCLI-255, QCLI-159).
- `quest instructions` and `quest agents --update-instructions` deliberately
  stay single-target, recorded rather than left as an unstated gap: `init`
  is the interactive onboarding path; these are maintenance commands driven
  by scripts and CI that already know their target via `--target` (QCLI-159).
- `migration backlog preview`/`apply`'s id-collision error now names both
  causes it can mean -- a positional-renumbering shift (a dotted subtask's
  flattening landing a fresh id on an unrelated sibling's), where
  `--preserve-source-ids --source-family <PREFIX>` genuinely resolves it,
  and a genuine dual claim (the destination workspace already holds the
  exact id an incoming record also claims), where that flag cannot help --
  and says so directly instead of repeating advice that already failed
  (QCLI-256).

## 0.5.0

**The jump from 0.4.x to 0.5.0 is a lockstep version sync with `@opum-ai/lore`
0.5.0, not a breaking change.** From this release on, Quest and Lore move
together at every stacked release: one version number naming the pair. Nothing
in Quest's public contract (envelope shape, manifest, command surface) changed
in a way that would otherwise call for a minor bump on its own.

### Fixed

- `task edit-batch` now reaches completed and archived records instead of
  reporting the misleading `task_not_found` (QCLI-243), closing the same gap
  QCLI-219 fixed for the single-item `task edit` path.
- `task edit` reaches completed and archived records instead of
  `task_not_found` (QCLI-219).
- `quest agents --check` no longer fails CI on a version skew alone: a block
  that differs from the installed CLI only in its embedded version number now
  reports `"version-only"` and exits 0 rather than failing closed on a routine
  patch/minor bump (QCLI-228).
- `quest agents --update-instructions` now removes a leftover Backlog.md
  guidelines block instead of leaving it alongside the current Quest block
  (QCLI-215).

### Added

- Isolated `renumbered` field on `migration backlog preview`'s output
  (`--preserve-source-ids` mode): exactly the mappings a dotted-subtask
  translation actually changed, so a caller no longer has to diff the full
  `mappings` list by hand to see what a migration is about to do (QCLI-168).
- `.github/workflows/promotion-guardrails.yml`: `promotion-is-manual` and
  `main-is-fast-forward-of-dev` back this repository's fast-forward-only
  `dev` → `main` promotion procedure with active CI detection (QCLI-244).

### Documented

- Status and on-disk location are independent by design: `task edit --status
  <terminal>` does not relocate a record, only `task complete`/`task
  archive`/`task demote` do (QCLI-221).
- `task create`'s forward-dependency validation (`dependency_target_not_found`)
  is documented as deliberate, fail-closed behavior (QCLI-62), with a
  two-pass create-then-`--add-dependency` workaround now shown in the
  task-creation guide and hinted at from the CLI error itself (QCLI-163).
- `quest help task edit` now explains 1-based CLI checklist positions versus
  the JSON envelope's 0-based `index`, that removal renumbers everything
  after it, and the exact JSON shapes `--comments`/`--add-comment` and `task
  edit-batch` expect (QCLI-226).
- Closed out the Backlog.md tracker-surface parity triage register: all
  decided gaps re-verified against current source with no drift, and the
  `doc`/`config`/`mcp` exclusion policy now has a citable source (QCLI-134).
