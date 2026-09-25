# Changelog

Records start here, at 0.5.0. Earlier releases are documented in
`docs/reference/quest-cli-release-truth.md` and in each release's own PR
history; this file is the forward-looking record.

## Unreleased

### Fixed

- **`scripts/publish-release.mjs` no longer reports a locked Keychain entry as
  a missing token** (QCLI-349). It used to treat every `security` failure the
  same way and print "no stored token found", which points at the wrong fix. A
  non-interactive read that fails with exit 36 (`errSecInteractionNotAllowed`)
  now says the entry exists and names `security unlock-keychain`. Exit 44 still
  says to create and store a token. Any other failure is reported as "could not
  be checked". A real publish with the entry locked and no `--otp` refuses with
  the unlock remedy. This is release tooling only; no command, flag, envelope
  or exit code of `quest` changed.

## 0.10.0

This release is minor rather than patch for one reason: the managed-block
change below makes `quest agents --check` report `drift` (exit 6) against every
existing block until `quest agents --update-instructions` rewrites it. No command,
flag, envelope or exit code changed. Apart from the two version constants, the
only source file changed since 0.9.0 is `src/application/agents/agent-instructions.ts`
(QCLI-365).

### Changed

- **The managed agent-instructions block now routes a reader to the guides
  instead of back to itself** (QCLI-362, from opum-agent's OPAG-378 audit).
  It used to call `quest instructions --json` "the current versioned
  protocol", but that command returns this same block. The block now names
  `quest instructions --list` and when to read each guide (`overview`,
  `task-creation`, `task-execution`, `task-finalization`, `workspace`), along
  with `quest search` and `quest help <command>`. It spells out the actor
  flags for a person and for a delegated agent (`--actor`, `--actor-kind`,
  `--accountable-human`), where it used to say only that a declaration is
  required. The Backlog.md cutover recipe is gone from the block; the
  `workspace` guide still carries it. `quest agents --check` reports every
  existing block as `drift` (exit 6) until it is regenerated with
  `quest agents --update-instructions`. That is a real content change, not a
  version-only difference, so it is not exempt.

## 0.9.0

Ships the 0.8.0 section below along with everything here: 0.8.0 was frozen and
tagged but never published, so its content reaches consumers for the first
time under this number.

**Why the published number skips 0.8.0.** 0.8.0 was frozen, tagged at
`9d91fc35` and never published; 15 further commits then landed on `dev`,
including the `Added` entry below and four fixes. Re-pointing the tag was
refused rather than weighed: `quest-web` runs a live link gate against this
repository's tags, and `opum-marketplace` re-resolves tag to commit to tree
against a recorded baseline, so a moved tag falsifies every record citing it.
The precedent for a tagged-but-unpublished version is 0.6.1 to 0.6.2 -- ship
the content under the next unclaimed number. This is breaking-plus-feature
relative to **published** 0.7.1, so the next unclaimed number is a minor one.

**This section exists because QCLI-286 came true.** That task -- open, and
filed as a warning -- predicted that a rolled-forward version section can
silently swallow later fixes. It did: five consumer-observable changes sat on
`dev` with an empty `Unreleased` heading above a frozen `## 0.8.0`, and
nothing caught it. It was found by walking `git log v0.8.0..dev` during
release preparation, which is exactly the manual step QCLI-286 asks to be
replaced by a check.

### Added

- **`unresolvedAtCompletion` is persisted on the task record and queryable
  across completed tasks** (QCLI-336). QCLI-252 made it a response-only
  signal, so the fact that a task closed with unchecked acceptance criteria
  survived only in the output of the command that closed it. `task complete`
  now computes it in the domain and writes it into the record, the zod schema
  validates it, and `task view`/`task list --json` surface it. `TaskInput`
  excludes it from creation: it is a fact a completion establishes, never one
  a caller asserts.

### Fixed

- **`overview` counted only `.quest/tasks/`, so completing a task removed it
  from the totals instead of moving it** (QCLI-339). It now counts every
  retention location, and carries an additive `byLocation` naming how the
  total divides, so a total that looks wrong can be read rather than guessed
  at.
- **`overview` milestone counts silently excluded archived milestones**
  (QCLI-340), the same unlisted-population shape as the entry above. Archived
  is now reported alongside open and closed. QCLI-140 is preserved rather than
  reopened: a retired milestone still counts as neither open nor closed work,
  but the population it belongs to is now visible in the output instead of
  only in a code comment.
- **The `overview` guide documented an envelope the CLI does not emit**
  (QCLI-342). It described `{schemaVersion, kind, data, principal}`, omitting
  `contractVersion` -- the key at index 1 -- and did not say that the record
  lives under `data`. An agent following it and projecting top-level fields
  got all-null with exit 0 and empty stderr. The guide now names the envelope
  exactly as emitted, separates success from error, states the additive-key
  rule, and is pinned by a test that compares it against real CLI output
  rather than against a copy of the prose.
- **`task create --id <taken>` reported a write conflict and told the caller
  to retry, against a condition no retry can resolve** (QCLI-346). The id was
  held by an existing record -- in the reported case an ARCHIVED one, which
  `task list` does not show and which left `doctor` reporting healthy, so
  every signal a caller could reach said the workspace was fine. It is now
  `validation` on exit 6, names the id, and names the path holding it.

  `task_already_exists` covers two cases with opposite remedies and both were
  mapped to the retryable one. An **auto-allocated** id losing a race to a
  concurrent writer is a genuine conflict and retrying recomputes a fresh id;
  an id supplied with `--id` is fixed, so the same retry loops forever. Only
  the explicit case changed -- the auto-allocated path keeps `conflict` and
  its retry hint. Reported by opum-cli-e2e, who followed the old hint three
  times before finding the cause by listing `.quest/archive/` on a hunch.

- **`task edit` rejected `--implementation-notes`, the name `task create`
  uses for the same field** (QCLI-344). It is now accepted as an alias of
  `--notes`. Passing both is a usage error rather than a silent preference for
  one, and a rejected flag now states that the rest of the command was not
  applied -- previously a caller could not tell from the message whether a
  multi-flag edit had partially landed.

## 0.8.0

Version frozen 2026-09-17, **tagged and never published**. Its content ships
under 0.9.0 instead, together with the work that landed after the freeze; see
that entry for why the number moved. The `v0.8.0` tag is left pointing at
`9d91fc35` and is not re-pointed.

Breaks lockstep with `@opum-ai/lore`, forced by QCLI-328's rule that a
breaking `Changed` entry needs at least a minor bump, and the entry directly
below is exactly that.

**Corrected 2026-09-18 (QCLI-345).** This paragraph originally read
"lore-cli's `dev` remains at 0.7.0 and nothing in lore changes". That was
false when it was written, and it is corrected here rather than quietly
dropped because it was the stated justification for shipping quest-only.
Asked to measure their own range, lore-cli reported `dev` at 64 commits past
tag `v0.7.0`, carrying a new `lore types` command, a new `profile.strict_types`
config key, and committed-schema drift detection inside `lore check`.

How it got in is worth more than the correction: the claim came from reading
lore's `dev` package.json (0.7.0) as though it were a running version. It is
not, and the conventions are opposite in the two repositories -- **lore bumps
at release time, so that field names the LAST shipped version; quest bumps at
freeze time, so ours names the NEXT, unpublished one.** Reading a sibling's
field with this repository's convention in mind produces a confident wrong
answer. A version field's meaning is a per-repo convention; the commit range
is the only probe that means the same thing in both.

**The date above is when this version was frozen and the bump landed, not
when it reached npm**; publication is a separate, manually authorized step,
and nothing in this file should be read as evidence that it happened.

### Changed (breaking)

- **A removal that matches nothing now fails loud (exit 6) instead of
  returning `task.updated`/`milestone.updated` with an unchanged list.** Nine
  flags across two commands: `task edit`'s `--remove-label`, `--remove-plan`,
  `--remove-note`, `--remove-comment`, `--remove-assignee`,
  `--remove-reference`, `--remove-modified-file` and `--remove-dependency`,
  plus `milestone edit --remove-task`. The error names the record id and
  echoes every unmatched value JSON-delimited, and NOTHING is removed -- not
  even the values in the same flag that did match.

  Quest shipped two removal vocabularies with opposite miss behaviour in the
  same command. `--remove-ac 9` on a two-item list exits 6; `--remove-note 1`
  exited 0 and removed nothing, because removal matches on exact TEXT. An
  agent that had learned the loud one reasonably tried the same shape on the
  quiet one and was told its edit succeeded. Reported by opum-cli-e2e via
  opum-agent as one flag; reproducing it found eight, then nine across two
  commands, because `milestone edit --remove-task` has its own merge and never
  touches the shared helper.

  **The payload could not have carried this instead, and that is the argument
  that decided the shape.** The natural defensive check on the returned record
  -- "is the value I asked to remove absent from it?" -- returns TRUE on the
  whitespace case, because a value differing by a trailing space was never in
  the list under any outcome. It confirms the failure AS a success. A defect
  that defeats the diligent caller and the careless one identically is worse
  than one that only catches the careless, so an additive `unmatched` count
  would have left the hard case exactly as silent for everyone not reading a
  field they have no reason to expect. Hence the JSON delimiters: a trailing
  space sits inside the quotes and a tab renders as `\t`.

  Both downstream consumers chose loud independently, and lore-cli did so
  against its own convenience: a silent no-op on the only path they reach (a
  read-then-remove race) is worse for them, because lore would then report
  "removed" for an edit that removed nothing, propagating the defect into
  their report rather than stopping at Quest's boundary. They asked for the
  record id in the message for the same reason -- their per-task error field
  carries one line into a multi-task report.

  The ordinal-addressed family (`--remove-ac`/`--check-ac`/`--uncheck-ac` and
  the `--*-dod` equivalents) is unchanged and keeps its own message. Accepting
  an ordinal on the by-value flags was considered and DROPPED, not deferred: a
  value that is both a valid ordinal and valid item text would have two
  meanings, so a note whose text is literally `"1"` would get a removal that
  silently addressed a different item -- a wrong object returning success,
  strictly worse than the no-op it replaced.

  **Who this can break, stated with its bound rather than as a clean bill of
  health.** A caller that passes removal values speculatively -- a
  remove-if-present idiom, or an idempotent retry that re-sends an edit whose
  removal already applied -- now gets exit 6 where it got exit 0. A consumer
  sweep across the fleet checkouts on this machine found exactly one
  cross-repo caller, lore-cli's `src/adapters/quest.ts` emitting
  `--remove-label`, and both of its call sites compute the removal from a
  fresh read and short-circuit when the label is already absent, so neither is
  speculative; lore-cli confirmed from their own side that no third producer
  and no retry path exists. **That finding is bounded to the fleet checkouts
  on this machine and is NOT a claim about consumers generally.** It cannot
  see removals assembled into a `task edit-batch` ops file outside those
  repositories, and it cannot see any consumer outside them -- the mbpm2
  project included, who are a real integration consumer of the published CLIs
  and have not been asked (QCLI-297).

  **What the short-circuit does NOT cover, volunteered by lore-cli against
  their own interest.** Both of those guarded call sites are a
  read-modify-write with no `--if-revision`, which is their open LCLI-522. If
  the label disappears between lore's read and lore's write, quest previously
  returned `task.updated` with an unchanged list and the race stayed silent;
  under this release it becomes exit 6. **So this change converts a silent
  lore race into a loud failure** -- an improvement, and neither side asked to
  hold the release for it, but it means lore 0.7.0 paired with this version
  has a failure mode that neither lore 0.7.0 + quest 0.7.1 nor a matched newer
  pair will necessarily show, because **it needs concurrency to surface**. A
  serial qualification run cannot see it; opum-cli-e2e has been asked to
  exercise that path concurrently. The pair being qualified matters here, not
  just the two version numbers.

### Added

- Every `task.list` envelope carries an additive top-level `scope`
  (`{branch, otherRefsRead, unseenTaskIds?}`), so a listing names the object
  it answered about instead of leaving the reader to assume it covered the
  repository. `quest task list` reads the checked-out ref's `.quest/` and
  nothing else, while the rule that sends a session to it -- confirm nothing
  is still open before reporting clear -- asks about the repository. The two
  diverge for exactly the tasks most likely to be forgotten, the ones still on
  an unmerged branch, and the failure direction is the bad one: an empty list
  reads as the check PASSING rather than as the check NOT RUNNING. Reported by
  opum-doc after an empty In Progress listing on `dev` missed a task that was
  In Progress with an open pull request; they caught it only because an
  independent source disagreed with the empty list, and neither the exit code
  nor the output would ever have shown it.

  `branch` is named on every listing. The cross-ref set difference that fills
  `unseenTaskIds` runs only when the listing came back empty -- the only case
  where naming what was not read changes the reader's conclusion -- and
  `otherRefsRead` says whether it ran. Three limits, all deliberate: it
  reports EXISTENCE only and never status, so a named id may already be Done
  on the ref that carries it (DEC-6); it reads `refs/heads` and
  `refs/remotes` and never fetches, so run `git fetch --prune` first if local
  refs may be stale; and it is a local-git detector, which means it shares a
  blind spot with any other local-ref sweep and does not replace asking
  GitHub (QCLI-316).

  **Detect it by key presence, not by version, and keep doing so after the
  next release.** The success envelope is an open key set, so `scope` is
  exactly the additive change a consumer is required to tolerate, and
  `"scope" in envelope` is the semantically correct probe rather than a
  fallback. A version gate cannot work here in any case: `dev` declares 0.7.1
  and so does the published build that lacks the key (QCLI-296).

- `agents.skill_source` accepts a third value, `"none"`, meaning this
  workspace generates no quest skill file and none ships from anywhere else.
  Set it with `quest init --skill-source none`, or on an existing workspace
  with `quest init --reconfigure --skill-source none`. It behaves identically
  to `"plugin"` on every file operation -- absence is the healthy state, a
  leftover `.claude/skills/quest/SKILL.md` reports as drift, and `--force`
  removes it only when byte-exact -- and differs only in what it asserts.

  That difference is the entire point. Reported by the mbpm2 project, a
  Codex-only consumer, as an integration blocker: `quest agents
  --update-instructions --target codex` writes AGENTS.md **and** the
  Claude-provider skill file, because the skill file is target-independent by
  design and governed by `agents.skill_source`. The only way to stop it was
  `--skill-source plugin`, which asserts the opum-quest **Claude Code** plugin
  ships the skill -- a plugin they do not have and are not using. The opt-out
  required declaring something false. `"none"` says only that no skill file is
  generated, and its drift message names no plugin.

  The `--target codex` path is unchanged and is not deprecated: Codex is
  retired as a runtime this fleet builds on, not as product surface, and this
  is an external user invoking a published flag.

  Two things a reader should not over-read here. First, the file-writing
  behaviour under `"repo"` -- the default, and what every existing workspace
  has -- is byte-identical to before; nothing changes for a consumer who does
  not set the new value. Second, a workspace that had already worked around
  this with `"plugin"` is still correct and needs no migration; `"none"` is a
  more accurate declaration of the same intent, not a replacement for a broken
  one (QCLI-309).

- `quest help init` now states that `--reconfigure` accepts `--skill-source`,
  and both `init` usage lines name all three values. The omission was the
  cheaper half of the report above: `--reconfigure` has accepted and persisted
  `--skill-source` since QCLI-236, but the `init` summary described it as
  being for "name/task-id-prefix on an existing workspace", so a documentation
  gap turned a one-command fix into a blocker. The reporter could not
  reasonably have derived it (QCLI-309).

### Fixed

- **Draft, milestone and decision ids are now allocated refs-aware, like task
  ids have been since QCLI-279.** `quest draft create`, `quest milestone
  create` and `quest decision create` used to compute "next available" from
  the checked-out tree's `.quest/` alone, so an unmerged sibling branch or a
  detached checkout behind a moved branch could mint an id that already
  existed elsewhere. QCLI-279 fixed exactly one of the three allocators and
  deliberately left these two pending a real reproduction; that reproduction
  arrived on 2026-09-14, when two sessions independently minted `DEC-3` from
  branches neither of which carried the other's record. Recovered by hand, no
  data lost, and it would not have been caught by a less careful actor.

  **The obvious fix -- point QCLI-279's existing helper at the other
  subdirectories -- is right for drafts and silently wrong for milestones and
  decisions**, which is the only interesting thing about this change. That
  helper finds ids by reading FILE NAMES, which works because tasks and drafts
  are stored one record per file. Milestones and decisions share a single
  `.quest/planning.json`; a filename scan over that path matches one file
  called `planning.json`, matches no id marker, and returns 0 -- and 0 is
  indistinguishable from "no other ref carries a higher id". So the planning
  half reads blob CONTENT per ref instead, via the revision-pinned read the
  Git port already exposed.

  That is measured, not argued: a mutant implementing the obvious fix produces
  a verdict set byte-identical to a mutant with no fix at all -- five of nine
  tests red, the same five. The wrong mechanism and the absent one are the
  same observation.

  Unchanged in every other respect. Allocation still consults only refs that
  already exist locally and never fetches; only a prefix's own family can
  advance its counter, so a decision cannot advance the milestone counter
  though both live in one document; and a `.quest` directory with no Git
  repository behind it still allocates from the working tree alone. An
  unreadable or unparseable planning document on some unrelated branch is
  skipped while the remaining refs are still consulted -- a coarser guard
  would fall back to the local-only view, which is the un-fixed behaviour
  wearing a passing test. Ids minted before this change are not repaired by
  upgrading.

- `quest task edit --acceptance-criteria` (and `--definition-of-done`) given a
  JSON array of bare strings silently unticked every checked box: exit 0,
  empty stderr, `kind=task.updated`. The lossless `{index, text, checked}`
  element form already existed, but appeared nowhere in the CLI's output
  except the usage error for an object array missing `index`, and
  `quest manifest --json` advertised only `json-array` -- so the discoverable
  path was the destructive one. Three independent agent callers reached for
  the string form within hours on 2026-09-15, none knowing the object form
  existed, all three having read the manifest; one caller reaching for the
  destructive path is a caller mistake, three is the shape of the surface.

  The replacement is now refused with exit 6 (validation, not usage: the two
  neighbouring conflicts are decided by the flag combination alone, this one
  by the record's state) if and only if a currently-checked position is
  replaced by a BARE STRING. The test is on what the replacement carries, not
  on the outcome -- an entry saying `checked: false` has stated its intent and
  is honoured, a bare string has said nothing -- so a deliberate reset is
  still expressible and this needed no `--force` flag. The refusal names that
  spelling at the one moment the caller is certainly reading. `manifest` now
  advertises the element shapes (`string | {index,text,checked}`) additively,
  with `value` still `json-array` so a consumer switching on it is unaffected
  (QCLI-313).

- `quest instructions task-execution` said checkbox edits are
  "index-addressed". The flags take the 1-based `position`, and
  `quest help task edit` already said so at length, including "`index` is not
  what these flags take" -- so two documentation surfaces of the same CLI
  contradicted each other, and the wrong one is the surface the agent protocol
  sends a caller to first. Reported by opum-doc, who hit it as four silent
  successes: a loop over `0..4` gets one error on `i=0` and checks positions
  1-4, leaving the LAST criterion unchecked under a final summary claiming all
  of them met. They caught it by counting `checked: true` against the criterion
  count, not from any exit code (QCLI-315).

- `README.md` no longer states a version of its own, and a pack-time gate
  keeps it that way. It ships inside the tarball, and this repository's
  release path never read it -- `git log -- README.md` returned one commit,
  ever -- so `@opum-ai/quest@0.7.0` and `@0.7.1` both advertise 0.6.0 on their
  npm pages, permanently, because version pages are immutable. The gate reads
  `README.md` back out of a real `npm pack` tarball rather than the
  working-tree copy: a check on the repo file passes while the packed one is
  stale, and the packed one is what the registry serves. Implements the
  shipped-README contract accepted into opum-doc as
  `docs/reference/shipped-readme-version-assertions.md` (ODOC-201), taking its
  "absent" arm, and in a stronger form than the shared clause -- no
  version-shaped token anywhere in the packed README, because the worst site
  here (`**Status: 0.6.0 released.**`) carries no package name on its line and
  the shared clause would have missed the defect it exists for (QCLI-307).

## 0.7.1

Version frozen 2026-09-15. **Breaks lockstep with `@opum-ai/lore`, once and
deliberately, as 0.6.2 did:** lore stays at 0.7.0 and nothing in lore
changes. This is a hotfix for a defect every fleet workspace that paused a
task before 0.7.0 is exposed to, ruled ahead of everything else the same day
it was reported, and holding it for the next paired release would have left
those records unreachable for no reason a consumer benefits from. The one
entry below is additive on the read side (`doctor` gains an issue code) and
restores a transition on the write side (`task start` from the retired
literal); nothing else moves. **The date above is when this version was
frozen and the bump landed, not when it reached npm**; publication is a
separate, manually authorized step, and nothing in this file should be read
as evidence that it happened.

### Fixed

- A record parked at the pre-0.7.0 default paused status `"Blocked"` could
  not leave it by any command after upgrading: `task start` and `task pause`
  refused the transition, `task edit --status` and `task complete` reported
  an unconfigured status, `task demote` had nowhere to go, and `quest doctor`
  reported the workspace healthy. QCLI-287 renamed the default to `"Paused"`
  and every lifecycle check compares the record's status to the configured
  value by exact string, so an already-parked record became an off-flow
  status on upgrade; 0.7.0's changelog warned about the literal and the
  best-placed consumer still missed it, so a warning was not the fix.

  `quest task start <id>` is now the sanctioned exit from the retired
  literal, exactly as it was in 0.6.x, when and only when the workspace does
  not configure `"Blocked"` itself (on its ladder or as its paused status);
  `task pause` then parks the record at `"Paused"`. Nothing is migrated
  silently. `quest doctor` gains a `task_status_off_flow` issue naming every
  active task whose status is on neither the ladder nor the paused slot, with
  the repair command in its `hint`, so a stranded record is a red doctor
  rather than a healthy one. Reported by lore-web (LWEB-80), also hit by
  lore-cli (LCLI-333) (QCLI-302).

  For a stranded workspace, the repair is:

  ```sh
  quest doctor --json                      # names the task id and status
  quest task start <id> --actor <name> --actor-kind human --json
  ```

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
