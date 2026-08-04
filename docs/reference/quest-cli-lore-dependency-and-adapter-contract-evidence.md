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
summary: Tracks Lore-dependent Quest CLI choices with owning evidence and reviews the lore-cli adapter contract quest-cli must honor, per the 2026-08-04 source-admissibility split rule.
timestamp: 2026-08-04T13:11:52.627Z
---

# Quest CLI Lore dependency and adapter contract evidence

This Reference is `QCLI-2.7`'s output: the live Lore dependency and
activation-evidence matrix for Quest CLI choices (Part 1), plus the
lore-cli adapter contract review the owner folded into this task on
2026-08-04 (Part 2), because the component charter states quest-cli owns
"versioned Lore import/link/adapter behavior"
([component charter](quest-cli-component-charter.md):30) but no prior
campaign task produced the adapter-contract evidence
[`QCLI-2.8`](../../backlog/tasks/qcli-2.8%20-%20Synthesize-Quest-research-into-activation-ready-contracts.md)
would synthesize from. It is the current successor to former `OCLI-3.7`
("Lore evidence matrix") per the
[migration ledger](former-ocli-to-qcli-migration-ledger.md). This is
research only: it describes the contract and names divergences; it
implements no adapter and reserves no implementation task.

Every fact below was verified live on 2026-08-04. It stays consistent with,
and does not restate or override, the
[research source register](quest-cli-research-source-register.md) (the
per-slice admission authority — see its new "Lore-cli source admissibility
split rule" section for the citation discipline this document follows) or
the Lore-owned release gate linked in Part 1 (this document records only
Quest's consumer status and evidence pointers, per
[`quest-doc`'s own scoping of this task](https://github.com/salient-data/quest-doc/blob/dev/docs/specs/quest-clean-room-execution-graph.md#implementation-activation-dependency)).

## Details

### Part 1 — Lore dependency and activation-evidence matrix

#### The canonical Lore-wide gate (link only)

The Lore-wide integration boundary and release-gate policy is owned by
`lore-doc`:
[Quest integration and Lore release gate](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md)
(Spec, `lore-doc`, local clone `/Volumes/external/repos/lore-doc`, HEAD
`1a0aa89` re-read 2026-08-04), gated on task
[`LDOC-4`](https://github.com/salient-data/lore-doc) "Gate Quest
implementation on accepted Lore release evidence" (status **To Do** as of
2026-08-04, re-verified live via `backlog task view LDOC-4 --plain` in the
local `lore-doc` clone). This matrix links that gate as the controlling
external authority and does not reproduce its release-gate predicate,
integration-obligation list, or open questions here — those are `lore-doc`'s
to own, and they are mutable. `lore-doc`'s own remote stayed
`salient-data/lore-doc`, unlike `lore-cli` and `quest-cli`, which both
transferred to `opum-ai` on 2026-08-04 — re-verified live via `git remote -v`
in the local clone, confirming the distinction the source register already
draws.

#### Classification vocabulary for this matrix

Four terms, distinct from the research source register's six-term
Allowed/Contextual/Superseded/Deferred/Excluded/Quarantined admissibility
vocabulary (which classifies *sources*). These classify a Quest CLI
*choice's* current dependency status on Lore:

| Term | Meaning |
| --- | --- |
| Evidence-complete | Live, immutable evidence for this dependency exists and was independently re-verified today; nothing further is needed to treat the underlying fact as settled (though activation itself still needs the Part 1 handover check below) |
| Provisionally researchable | The dependency can be described and reasoned about now from currently admissible sources, but full resolution needs further Quest-side work (a later research or synthesis task) |
| Blocked on a named owner result | A specific, named, currently-open owner task gates this dependency; no amount of further reading resolves it — only that task landing does |
| Requiring owner input | The dependency terminates in a live, owner-held decision (not a task with a defined completion state) that this program cannot substitute for or predict |

#### The matrix

| Quest CLI choice | Lore dependency | Owning Lore task / spec / runbook / evidence | Classification | Evidence pointer (dated 2026-08-04) |
| --- | --- | --- | --- | --- |
| Whether *any* Quest product implementation may activate | The Lore-wide release-gate predicate must report Pass from live owner evidence | `LDOC-4` (task, `lore-doc`) + [Quest integration and Lore release gate](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md) (Spec, `lore-doc`, link only) | Requiring owner input | `LDOC-4` re-verified **To Do** via `backlog task view LDOC-4 --plain` in `/Volumes/external/repos/lore-doc`. A dated observation, not a substitute for the next live check (see Activation handover, below). |
| Which published Lore release Quest research currently targets | `lore-cli`'s package/command identity and immutable `0.1.0` release evidence | [Lore CLI release truth](https://github.com/opum-ai/lore-cli/blob/dev/docs/reference/lore-cli-release-truth.md) (Reference, `lore-cli`) + task `LCLI-296` | Evidence-complete | Re-verified live: `npm view @opum-ai/lore version` → `0.1.0`; `lore --version` → `0.1.0`; `git rev-list -n1 v0.1.0` → `e621d209be2cc8867d1c38c7c78b4b4acc96d82e`, matching the release-truth record's tag/commit and the source register's own citation. This is component-level (`lore-cli`) evidence, distinct from — and only one of four conditions feeding — the program-level gate row above; a fully evidenced component release does not by itself open `LDOC-4`. |
| Whether a *future* Lore version bump can be trusted the same way `0.1.0` was | `lore-cli`'s automated-publish control (`publish: true` dispatch) remains unprotected | Task `LCLI-278` (`lore-cli`) + [Lore CLI release truth](https://github.com/opum-ai/lore-cli/blob/dev/docs/reference/lore-cli-release-truth.md) ("Evidence required to call Lore released," condition 6) | Blocked on a named owner result | `LCLI-278` re-verified **To Do** via `backlog task view LCLI-278 --plain` in `/Volumes/external/repos/lore-cli` — GitHub's billing plan blocks required-reviewer protection on the `release` Environment; `0.1.0` itself was authorized via a one-time interactive bootstrap, which this row does not call into question. |
| The versioned Lore import/link/adapter behavior quest-cli's charter commits it to build | The concrete contract `lore-cli`'s current `BacklogAdapter` places on any task-tracker backend it invokes | `src/adapters/backlog.ts` (`lore-cli`, tag `v0.1.0`) — reviewed in full in Part 2, below | Provisionally researchable | The contract itself is fully describable now from admissible source (Part 2). Quest's compliance path is not yet decided, and several sub-requirements resolve only via a `lore-doc` boundary decision (Part 2's classification). |
| Whether Lore treats a future Quest CLI as a drop-in `backlog`-shaped target or builds it a distinct adapter | No committed answer exists on either side yet | [Quest integration and Lore release gate](https://github.com/salient-data/lore-doc/blob/dev/docs/specs/quest-integration-and-lore-release-gate.md) ("Integration obligations": "A Lore adapter for Quest is activated only through its owning component task after the public contract is accepted..."; "Open questions": "accepted jointly but implemented by the owning components") | Requiring owner input | Confirmed live 2026-08-04 by source inspection (Part 2's central finding): `lore-cli`'s only adapter type today is `BacklogAdapter`, referenced by name in 27 of its own source files; no generic pluggable interface exists to implement against. Building a second adapter is unstarted on Lore's side as of this revision. |

Runtime, native-packaging, and supported-platform choices that might take
`lore-cli`'s own distribution precedent as evidence are explicitly **not**
evaluated in this matrix — that evidence-consumption question belongs to
[`QCLI-2.9`](../../backlog/tasks/qcli-2.9%20-%20Resolve-the-%60quest%60-npm-package-allocation-and-provenance-gate.md),
concurrent this wave, per the campaign's cluster-scope split. Backlog.md's
own migration-fidelity dependencies are
[`QCLI-2.5`](../../backlog/tasks/qcli-2.5%20-%20Research-Backlog-migration-fidelity-through-public-contracts.md)'s,
not Lore dependencies, and are out of scope here.

#### Activation handover requirement

Implementation activation is not a document-review event. A future
activation session must, at minimum:

- re-run this matrix's live commands (`npm view`, `lore --version`,
  `git rev-list`, `backlog task view` against `LDOC-4` and `LCLI-278`, and
  the Part 3 drift commands) with a new date, not reuse today's captured
  output as current;
- separately obtain live confirmation, from `lore-doc`'s own owner-held
  evidence, that the release-gate predicate reports Pass — this document
  names the gate and its governing task only and does not reproduce, cache,
  or approximate that predicate; a dated snapshot recorded here is
  explicitly insufficient, exactly as it would be insufficient anywhere
  else in this program; and
- treat any classification above still reading "blocked on a named owner
  result" or "requiring owner input" as an unconditional stop, not a
  judgment call for the activation session to override.

### Part 2 — lore-cli adapter contract review

#### Pinned revision and source-currency statement

All citations in this Part are to `github.com/opum-ai/lore-cli` (private,
MIT), local clone `/Volumes/external/repos/lore-cli`, tag `v0.1.0` at commit
`e621d209be2cc8867d1c38c7c78b4b4acc96d82e`, matching the source register's
own pin. `lore-cli`'s `dev` branch has since moved to
`405606891a227a9012b87de625d909eba56fec6b` (29 commits ahead per
`git rev-list --left-right --count v0.1.0...HEAD` → `1  29`) — see Part 3
for the full drift accounting. `git diff --stat v0.1.0..HEAD --
src/adapters/backlog.ts` is **empty**: every citation below, verified
against the tag, is confirmed byte-identical on current `dev` HEAD as of
2026-08-04.

#### 1. Invocation surface Lore requires of a task CLI

`lore-cli`'s only adapter type is `BacklogAdapter`
(`src/adapters/backlog.ts:740-755`); it hardcodes one external binary
resolved from `PATH` by the literal name `backlog` (`BACKLOG_BINARY`, line
65), overridable only through `bunBacklogSpawn`'s constructor parameters
(`binary`, `cwd`, line 341), not through any documented end-user
configuration surface. The concrete invocation surface it demands of that
binary:

- `<binary> --version` → exit `0`, stdout a **bare** `major.minor.patch`
  (no `v` prefix, no program name), parsed via `^(\d+)\.(\d+)\.(\d+)`
  (`parseSemver`, lines 216-223). A missing binary (`ENOENT`) maps to
  Lore's `not_found` (exit 3); a present-but-incapable binary maps to exit
  6 — distinct failure classes.
- `<binary> task list --json [--status <s>] [--labels <comma-joined>]`
  (`listTasks`, lines 850-860) — also the capability probe's discriminator
  (item 3, below).
- `<binary> task view <id> --json` (`viewTask`, line 869).
- `<binary> search <query> --json` (`searchTasks`, line 894).
- `<binary> task create <title> [--description <d>] [--labels <c>]
  [--milestone <m>] [--doc <d>]*` — run **without** `--json` and **without**
  `--plain` (`createTask`, lines 917-934).
- `<binary> task edit <id> [--add-label <c>] [--remove-label <c>]
  [--status <s>] [--doc <d>]*` — also **without** `--json` (`editTask`,
  lines 959-976; a code comment at line 753 records this as "unsupported,
  LORE-57" specifically for `edit`).
- A direct, **non-subprocess** file read at a fixed, hardcoded relative
  path (`BACKLOG_CONFIG_REL_PATH = "backlog/config.yml"`, line 1002) for an
  ordered `statuses:` list (`readStatusFlow`, lines 1059-1063) — bypassing
  the CLI entirely for this one piece of data.
- Argv values are positional (Commander-style). Lore itself refuses,
  before ever spawning the subprocess, to send a value beginning with `-`
  (`rejectFlagLike`, lines 771-781) or a comma-joined value containing a
  literal comma (`commaJoin`, lines 803-817) — its own stated reason is
  that it has no per-call `--` terminator opportunity and no escape for an
  embedded comma in the flags it uses. This constrains what a target CLI
  must tolerate positionally; it is not a claim about how any specific
  backend's argument parser behaves.

#### 2. Structured-output envelope and schema-version expectation

Every accepted read is exactly one JSON object matching `EnvelopeSchema`
(lines 473-489), a `z.discriminatedUnion("kind", [...])` of three literal
shapes:

```text
{schemaVersion: 1, kind: "task-view",  task: <TaskSchema>}
{schemaVersion: 1, kind: "task-list", tasks: <TaskSummarySchema[]>}
{schemaVersion: 1, kind: "search",  results: <SearchHitSchema[]>}
```

- `schemaVersion` must be the JSON **number** `1` (`EXPECTED_SCHEMA_VERSION`,
  line 55; `z.literal(EXPECTED_SCHEMA_VERSION)`), not a string.
- `kind` is a **hyphenated**, per-response literal (`task-list` /
  `task-view` / `search`) — a different convention from Lore's *own*
  outbound envelope, which uses a **dotted** `command.payload` form (e.g.
  `query.results`; [cli-contract.md §2.1](https://github.com/opum-ai/lore-cli/blob/dev/docs/reference/cli-contract.md)).
- There is **no shared `data` key** on this inbound side — each `kind`
  carries its own payload key (`tasks` / `task` / `results`;
  `parseEnvelope`'s `payloadKey` parameter, lines 652-658, 692-694). This
  differs from Lore's own outbound `{schemaVersion, kind, data}` shape
  (cli-contract.md §2). cli-contract.md §2.2 states the two envelopes
  "share a shape on purpose, but are versioned independently" — the source
  is what actually proves the per-command-payload-key shape governs this
  inbound side; a reader who assumed a literal `data`-keyed clone of
  Lore's own outbound contract would be wrong. This is the single most
  citable, non-obvious divergence in this section.
- Unknown *extra* keys on payload objects are tolerated
  (`z.looseObject`, an explicit additive-only contract — source comment,
  lines 375-380); missing or mistyped *required* keys are fail-loud drift.
- Any parse failure — unparseable JSON, a non-object, a wrong
  `schemaVersion`, a wrong `kind`, or a payload failing its Zod shape — is
  `readDrift`/a typed `LoreError` (exit 6, `drift` or `validation`; lines
  640-689), never a silent degrade or partial result.

#### 3. Capability-probe and fail-loud semantics

`probeBacklog` (lines 257-318) is memoized once per adapter (`ensureProbed`,
lines 827-833) and runs before any other method:

1. `<binary> --version` exits `0` and prints a bare semver.
2. that semver compares `>=` a pinned floor, `MIN_BACKLOG_VERSION =
   "1.49.0"` (line 47) — the source's own comment (lines 30-45) warns this
   floor alone is "a sanity floor only" and does not by itself prove JSON
   capability, since "a pre-`--json` stock release can still report a
   version at or above this floor."
3. `<binary> task list --json` exits `0` and parses as a valid `task-list`
   envelope — the source's own words (lines 281-284) call this, not the
   version check, "the real discriminator."

Fail-loud is an explicit design commitment (comment, lines 242-244): the
probe "either returns the `BacklogCapability`... or throws a typed
`LoreError` — it never best-effort parses or silently degrades (there is
deliberately no `--plain` text fallback...)." Every failure mode maps to a
specific typed error and exit code.

#### 4. Write path and new-identifier capture requirement

`createTask` (lines 917-957) sends `task create <title> [flags]` with
**neither** `--json` **nor** `--plain` — an explicit code comment (lines
919-920) states "`--plain` suppresses the `Created task <ID>` line lore
captures, and create emits no JSON envelope." The new id is captured by
**regex** from default (human) stdout: `^Created (?:task|draft) (\S+)$` in
multiline mode (`CREATED_ID`, line 758). If the command exits `0` but that
line is absent, Lore fails loud while preserving the raw stdout and
attempted title in the error's `input` — its own comment (lines 947-954)
explains this is because the record was genuinely created and an orphaned,
unreferenceable record would otherwise result.

`editTask` (lines 959-989) also runs without `--json` and treats a nonzero
exit as `not_found` (stderr matches `/not found/i`) or `validation`
(anything else) — per its own comment (line 977), "the one write whose exit
code IS meaningful," a deliberate contrast with `viewTask` (item 5) and
`createTask` (whose exit code alone is not the id-recovery signal).

Patch semantics are **field-by-field, not uniform**: `--add-label` /
`--remove-label` are incremental accumulators, comma-joined into one
occurrence each (lines 962-969); `--doc` is a repeated accumulator that
**sets/replaces the entire array** on both create and edit (comment, line
726: "SET/REPLACE the whole array") — not an incremental add.

#### 5. Existence-check contract

`viewTask` (lines 867-887) is Lore's only existence-check mechanism — there
is no separate `exists`-only command. The contract is narrow and
unconditional: exit code exactly `1` means "missing," and on that exact
code stdout must additionally be empty (a `1` that printed something is
itself flagged as unexpected drift, lines 876-880); any other nonzero exit
is fail-loud drift, not "missing" (lines 883-885). The adapter's own
comment (lines 872-874) notes this is why `viewTask` "cannot share the
`read` helper's exit-code guard" every other read method uses — a bespoke
rule for exactly one command.

#### 6. Back-reference/metadata-storage constraint

Lore's Story↔Task coupling back-reference is stored as an opaque **label**
of the form `doc:<conceptId>` (comment on `BacklogTask.labels`, lines
539-540: "Includes the `doc:<conceptId>` back-reference label lore reads
for coupling"). This requires two label-shaped primitives Lore actually
calls: (a) attaching/removing arbitrary free-text labels on write
(`EditTaskPatch.addLabels`/`removeLabels`, lines 719-722; `CreateTaskInput.
labels`, line 710), and (b) an exact-match label filter on read
(`searchByLabel`, line 748, implemented as `listTasks({labels: [label]})`,
lines 889-891).

Separately, and **not interchangeably**, Lore also writes/reads a distinct
`documentation` / `--doc` refs array (`CreateTaskInput.doc`, line 713: "the
display cross-reference"; `EditTaskPatch.doc`, line 726) — a second storage
slot, with set/replace (not incremental) semantics. `BacklogTaskDetail.
documentation` (line 560) is the read-side field. Lore stores no third,
opaque metadata channel beyond these two documented mechanisms
(`CreateTaskInput`/`EditTaskPatch`, lines 707-727) — nothing here implies
Quest would need to support anything beyond a label primitive and a
separate documentation-refs array.

#### Central finding: no generic adapter abstraction exists today

`BacklogAdapter` is `lore-cli`'s **only** adapter type. `grep -rl
BacklogAdapter src/` inside the local clone returns 27 files that import
or type against it by name, including every command that touches tasks
(`sync`, `check`, `link`, `unlink`, `tasks`, `orphans`, and others). `grep
-rl "TaskAdapter\|pluggable\|task-tracker\|tracker backend" src/
docs/specs/ docs/adr/` returns **zero** hits. `docs/specs/lore-design.md`
(§2.3, "Adapters are isolated and lazy-loaded") frames `adapters/
backlog.ts` as "the **only** place a `backlog` subprocess is spawned," one
of exactly two adapters in the whole design (the other, `adapters/
confluence.ts`, is deferred to v2 and serves the docs-publish direction,
not the task-tracker direction). No generalized interface exists to
implement a second, differently-named backend against. This is why several
requirements below resolve only via a `lore-doc` boundary decision rather
than a Quest-side choice alone: the Lore-side work to consume a second,
distinctly-shaped backend has not been designed, let alone built, as of
this revision.

#### AC5 classification

Three terms, used verbatim from the task's own acceptance criterion:
**already satisfiable by Quest's chartered contract** (the
[component charter](quest-cli-component-charter.md)'s "Owns here" list
already commits Quest to deciding and building this, with no conflicting
or missing charter obligation); **requiring a Quest contract change** (no
Quest document yet pins the concrete shape, so Quest must explicitly
decide and publish it — nothing here is settled merely because the charter
gestures at the category); **requiring a lore-doc boundary decision** (the
requirement's resolution depends on work or a decision on Lore's side, or
on a cross-repository integration choice neither document has made).

| # | Requirement | Classification | Divergence, named explicitly |
| --- | --- | --- | --- |
| 1a | Command vocabulary shaped like list/view/search/create/edit, a `--json` flag, a bare-semver `--version` | Already satisfiable by Quest's chartered contract | None — squarely inside charter line 24 ("command vocabulary, deterministic JSON, human output, and exit behavior"). |
| 1b | The exact binary name Lore would invoke, and whether an operator-configurable override exists | Requiring a lore-doc boundary decision | Neither document says whether Lore will invoke a binary literally named `quest`, continue invoking `backlog` and expect Quest to answer to that name, or gain a configurable binary-name override it lacks today (`binary`/`cwd` are constructor parameters, not an end-user knob). Quest cannot resolve this unilaterally. |
| 1c | A direct, non-subprocess, fixed-path config file carrying an ordered status list | Requiring a Quest contract change | No Quest document designates an analogous path or key; Quest must decide whether to reuse `backlog/config.yml`'s exact shape (for migration-fidelity reasons already inside its own charter obligations) or define a new one. |
| 2a | Emitting some deterministic JSON envelope | Already satisfiable by Quest's chartered contract | None — charter line 24. |
| 2b | The exact envelope shape: numeric `schemaVersion`, hyphenated per-response `kind`, no shared `data` key, a per-command payload key | Requiring a Quest contract change | Not decided anywhere. Explicitly **not** "mirror Lore's own `--json` output" — item 2's divergence proves the two envelopes differ on purpose; a worker who assumed otherwise would build the wrong shape. |
| 3a | Publishing `quest --version` as a bare semver and a `--json`-flagged list-shaped command whose absence exits non-zero | Already satisfiable by Quest's chartered contract | None — charter line 24's exit-behavior commitment covers this in principle. |
| 3b | A specific `MIN_QUEST_VERSION`-equivalent floor and the exact three-step probe sequence, encoded as new Lore-side code | Requiring a lore-doc boundary decision | This is code Lore itself would write and maintain (a `probeQuest`-equivalent or a generalized probe); no document commits Lore to building it, and Quest cannot author Lore's probe. Same underlying boundary gap as 1b. |
| 4a | Create/edit-shaped write commands with a structured confirmation | Already satisfiable by Quest's chartered contract | None — inside "command vocabulary... and exit behavior." |
| 4b | The specific `Created (?:task\|draft) (\S+)` regex convention and the without-`--json`/without-`--plain` invocation for create | Requiring a Quest contract change | Undecided, and in real tension with Quest's own charter default of "deterministic JSON": if Quest instead always emits `--json` uniformly (a plausible, arguably preferable choice on Quest's own terms), the adapter as written would not consume it — `createTask` deliberately omits `--json`. |
| 4c | Whether Lore's adapter is updated to accept a `--json` create response for a `quest`-shaped backend instead | Requiring a lore-doc boundary decision | Not resolvable by Quest alone; depends on the same not-yet-built second-adapter work as the central finding above. |
| 5a | A `view <id>`-shaped read with an unambiguous not-found signal | Already satisfiable by Quest's chartered contract | None in principle. |
| 5b | The specific "exit code exactly 1, empty stdout" convention, versus a JSON-first not-found signal more consistent with Quest's own committed direction | Requiring a Quest contract change, and requiring a lore-doc boundary decision | A genuine three-way tension, not resolved by any current document: Quest's charter default favors a JSON error envelope with an `error_type` over a bare exit-code convention, but `viewTask`'s current code hardcodes the bare exit-1/empty-stdout check rather than parsing a JSON error envelope for this determination — adopting Quest's likely preference would itself require Lore-side adapter code to change. |
| 6a | A label primitive: attach/remove free-text labels, filter reads by exact label match | Already satisfiable by Quest's chartered contract | None — a generic, low-risk data-model feature already inside "task/event/workspace schemas and local configuration" (charter line 25), not Backlog-specific. |
| 6b | A second, distinct "documentation refs" field with set/replace (not incremental) semantics | Requiring a Quest contract change | Not derivable from "support labels" alone; Quest must explicitly decide whether to expose an equivalent distinct field or fold this into its label mechanism. |
| 6c | Whether the coupling convention reuses the literal `doc:<conceptId>` label string format | Requiring a lore-doc boundary decision | Cross-repository interoperability/migration-fidelity choice — would `lore link`/`unlink`/`sync` need to change at all to point at a `quest` task the way it points at a `backlog` task, or would a wholly separate convention per backend be required? Neither side has committed to an answer; assuming label-format reuse is free is itself a finding, not a given. |

### Part 3 — Drift evidence

Re-derived independently on 2026-08-04, not inherited from any prior
capsule.

| Measurement | Value | Command (run in `/Volumes/external/repos/lore-cli`) |
| --- | --- | --- |
| Published npm `@opum-ai/lore` | `0.1.0` | `npm view @opum-ai/lore version` |
| Locally installed `lore` | `0.1.0` | `lore --version` |
| Tag `v0.1.0` commit | `e621d209be2cc8867d1c38c7c78b4b4acc96d82e` | `git rev-list -n1 v0.1.0` |
| `dev` HEAD | `405606891a227a9012b87de625d909eba56fec6b` | `git rev-parse HEAD` |
| Ahead/behind | 1 commit only on the tag side, 29 only on `dev`'s side | `git rev-list --left-right --count v0.1.0...HEAD` → `1  29` |
| Is the tag an ancestor of `dev` HEAD? | No — but this is a branch-topology artifact, not content divergence | `git merge-base --is-ancestor v0.1.0 HEAD` fails; the tag's one unique commit, `e621d20`, is a "promote to main" merge whose **second parent**, `89d2138` (the actual `dev` tip at release time), **is** an ancestor of current `dev` HEAD (`git merge-base --is-ancestor 89d2138 HEAD` succeeds). `dev` was never rebased or force-pushed past the release point; it simply never merges `main` back into itself. |
| Adapter surface source drift | **None** — `src/adapters/backlog.ts` is byte-identical between the tag and `dev` HEAD | `git diff --stat v0.1.0..HEAD -- src/adapters/backlog.ts` (empty) |
| Documented CLI/adapter surface drift | **None** — `cli-surface.md`, `cli-contract.md`, `okf-projection-contract.md` are byte-unchanged | `git diff --stat v0.1.0..HEAD -- docs/reference/cli-surface.md docs/reference/cli-contract.md docs/reference/okf-projection-contract.md` (empty) |
| What the 29 commits actually touch in `src/` | Three files, none adapter-relevant: `src/cli.ts` (an internal test-only env-var toggle for indexed-retrieval qualification), `src/commands/fswrite.ts` (a one-line comment fixing a Bun engine-version number), `src/core/retrieval.ts` (2-line error-propagation change on an indexed-retrieval fallback) | `git diff --stat v0.1.0..HEAD -- src/` then `git diff v0.1.0..HEAD -- src/cli.ts src/commands/fswrite.ts src/core/retrieval.ts` |
| What the 29 commits touch in `docs/` | 9 files: `index.md`, `log.md`, `architecture.md` (already self-flagged stale, see below), a LadybugDB benchmark/scale-acceptance doc, `lore-cli-release-truth.md` and `release-publishing.md` (expected to evolve — release evidence), `tech-stack.md`, `backlog-json-patch.md` (a 2-line wording tweak in a Contextual, non-cited document), and `prepare-the-first-lore-cli-release.md` — graph-platform/release-process work, not CLI/adapter surface | `git diff --stat v0.1.0..HEAD -- docs` |
| Automated-publish control | `LCLI-278` still **To Do** — `publish: true` dispatches remain prohibited | `backlog task view LCLI-278 --plain` |

**Reclassification trigger, stated explicitly (AC6):** any future
`git diff --stat v0.1.0..<new-pin> -- docs/reference/cli-surface.md
docs/reference/cli-contract.md docs/reference/okf-projection-contract.md
src/adapters/backlog.ts` returning a non-empty diff must trigger
re-classification of every Part 2 finding it touches before further
reliance on this document; cutting a new tag at all must trigger
re-verification of `MIN_BACKLOG_VERSION`/`EXPECTED_SCHEMA_VERSION` and the
drift table above, not silent reuse of today's numbers.

**Discovered while re-verifying (out of scope to act on, recorded per the
split rule):** `docs/adr/0009-story-task-coupling-reconciliation.md`
asserts, uncited, that "Backlog.md drops unknown frontmatter keys on edit"
and that Backlog's `--doc` annotation "is not reliably queryable" — both
claims about Backlog.md's own behavior, in the same style as the already-
known-tainted `ADR-0002`/`ADR-0012` corpus, but not previously named in the
source register's Backlog-corpus slice. This document does not cite
ADR-0009 for either claim (see item 6, above, which sources the
back-reference requirement from `src/adapters/backlog.ts` directly
instead). This edit adds ADR-0009 by name to that slice and also retires
its prior closed-list framing for a standing catch-all rule (see the
Admissibility discipline section, below, and the register itself), so a
future discovery does not need a new named register entry to be treated as
Contextual, citable for nothing.

### Admissibility discipline applied in this document

Every fact in Part 2 attributed to Lore's own requirements is cited to
`lore-cli` source (`src/adapters/backlog.ts`) or `lore-cli`'s own published,
non-Backlog-derived surface (`cli-contract.md`, `okf-projection-contract.md`,
`lore-design.md` §2.3, `lore-cli-release-truth.md`,
`release-publishing.md`) — the admissible half of the 2026-08-04 split
rule recorded in the
[research source register](quest-cli-research-source-register.md#lore-cli--the-lore-command).
`docs/adr/0002-backlog-integration-json-only.md`,
`docs/adr/0009-story-task-coupling-reconciliation.md`,
`docs/adr/0012-backlog-coexistence-git-ownership.md`,
`docs/reference/backlog-cli-contract.md`,
`docs/reference/backlog-json-schema.md`, and
`docs/runbooks/backlog-json-patch.md` were read, where read at all, for
question discovery only — identifying which requirements to look for in
the admissible source — and are cited nowhere in this document. No claim
here about how Backlog.md itself behaves is sourced from Lore; Backlog.md
behavior claims are `QCLI-2.5`'s independently re-derived territory, not
this document's.

## Notes

This session read `src/adapters/backlog.ts` in full, `docs/specs/
lore-design.md`, `docs/reference/architecture.md` §3 (noting its own
"illustrative, not authoritative" banner), `docs/reference/cli-contract.md`,
`docs/reference/okf-projection-contract.md`,
`docs/reference/lore-cli-release-truth.md`,
`docs/runbooks/release-publishing.md`, `docs/adr/0001`, `docs/adr/0005`, and
— for question discovery only, per the split rule — `docs/adr/0009`, in the
local `/Volumes/external/repos/lore-cli` clone; read `docs/specs/
quest-integration-and-lore-release-gate.md` and `LDOC-4`'s live status in
`/Volumes/external/repos/lore-doc`; and read the relevant section of
`docs/specs/quest-clean-room-execution-graph.md` in
`/Volumes/external/repos/quest-doc`. It ran no command that mutates any of
those three repositories, opened no Backlog.md implementation source, and
opened nothing classified Quarantined in the source register. All git/npm/
backlog commands cited above were re-run live on 2026-08-04, not copied
from a prior capsule.
