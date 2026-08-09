---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI D2 runtime proposal
tags:
  - quest
  - cli
  - runtime
  - decisions
  - proposal
  - phase-1
summary: Assembles a decision-ready comparison of candidate runtimes for the owner's D2 ruling; proposes nothing as decided and leaves D2 owned-not-closed.
timestamp: 2026-08-09T02:11:05.867Z
---

# Quest CLI D2 runtime proposal

This Reference is `QCLI-58`'s deliverable: a decision-ready comparison of candidate
runtimes for register entry [D2](quest-cli-open-component-decisions.md) — "Runtime and
native packaging," recorded **Blocked**, ownership claimed as quest-cli-owned by the
[license, platform, and runtime ownership record](quest-cli-license-platform-and-runtime-ownership-record.md)
(`QCLI-27`), the runtime choice itself left deferred to post-activation. D2 is the Phase 1
decision the [delivery roadmap](../specs/quest-cli-delivery-roadmap.md#phase-1--component-decisions)
records as "**Owned, not closed**" — the only one of the nine Phase 1 rows still in that
state once envelope shape, exit-code table, the not-found convention (Quest's own side),
identifier grammar, license, platform ownership, scale target, and where an anomaly sits
in the outcome taxonomy all closed.

**This document proposes a comparison; it does not decide.** No ADR is created here, no
runtime is frozen, and the [open component decisions register](quest-cli-open-component-decisions.md)'s
D2 entry is touched only to point at this document — its status stays **Blocked**, exactly
as recorded (a separate action, not performed by the comparison work itself). Nothing here
authorizes a runtime dependency, package metadata, or executable scaffolding; none is added
by this task (`QCLI-58`'s own acceptance criteria prohibit it, mirroring the [research
programme Spec](../specs/quest-cli-pre-implementation-research-program.md)'s "Prohibited
work before activation" list).

**Why assembling this comparison is allowed work now.** The research programme Spec
prohibits "freezing runtime... choices whose required Lore evidence is unfinished" — that
gate, not a general prohibition on discussing runtime, is what has held D2 blocked since
2026-08-04. The [activation-gate evidence record](quest-cli-activation-gate-evidence-record.md)'s
2026-08-08 recheck capsule (`QCLI-56`) reports `lore-doc`'s own gate Spec and task `LDOC-4`
both stating the Lore-owned gate result as **open**, accepted 2026-08-06 on the published
`@opum-ai/lore@0.1.1` release boundary — quoted there, not recomputed here. An open Lore
gate clears the Lore-evidence precondition this document's existence depends on; it is not
Quest activation, and it does not by itself unblock D2 — only the owner's ruling on the
comparison below can do that.

## Details

### Method

Four candidates are compared against three inputs the task description names as required:
the recorded platform matrix, the packaging contract's own constraints, and Lore's shipped
runtime as argued context. A fourth input — the architecture Spec's runtime-neutrality — is
addressed separately, below, because it is not a per-candidate axis: it asks which
*boundaries* a runtime choice touches at all, independent of which candidate is chosen. No
candidate is scored, ranked, or recommended; each subsection states what is true of that
candidate against each input and leaves the weighing to the owner.

### Candidate runtimes

- **Node.js** — the incumbent JavaScript/TypeScript runtime; broadest npm ecosystem and
  tooling maturity.
- **Bun** — the runtime `@opum-ai/lore` itself ships on (see "Lore's shipped runtime,"
  below); a faster-moving, npm-compatible alternative with an integrated bundler/test
  runner/package manager.
- **Deno** — a secure-by-default JavaScript/TypeScript runtime with first-class
  cross-compilation tooling and partial npm compatibility via `npm:` specifiers.
- **A compiled systems binary (e.g. Go or Rust), distributed through npm's per-platform
  `optionalDependencies` shim pattern** — no JavaScript runtime at all; the published
  `@opum-ai/quest` package would carry a thin JS/shell shim that resolves and executes a
  platform-specific native binary published as separate scoped packages (the pattern
  `esbuild`, `swc`, and `ripgrep`'s npm wrapper use). Included because D2 explicitly bundles
  "native packaging" with "runtime" in the register's own framing
  ([open component decisions register](quest-cli-open-component-decisions.md), D2 row),
  and because the packaging contract's own accepted identity — npm package
  `@opum-ai/quest`, executable `quest` — does not by itself imply a JavaScript runtime
  under the hood; it only commits to an npm-distributed package and a `quest`-named
  executable ([packaging contract](quest-cli-packaging-contract.md), "Accepted identity").

None of the four is excluded by anything admitted in this corpus; the research programme
Spec's open questions name "runtime and native packaging" as a single unresolved pair
without narrowing the field, and no research task claims to have done so.

#### Platform-matrix fit (macOS, Linux, Windows)

The platform matrix itself is [QCLI-27](quest-cli-license-platform-and-runtime-ownership-record.md)'s
— macOS, Linux, and Windows, closed 2026-08-05, cited here and not restated as a ruling.
What follows is each candidate's fit against that matrix, as of the live check recorded in
"Evidence and recheck clause," below — platform-support characteristics of external
runtimes are themselves moving references, not settled facts this document can freeze.

| Candidate | Fit against macOS/Linux/Windows |
| --- | --- |
| Node.js | Longest-standing first-class support for all three; the incumbent baseline every other candidate is compared against. Windows support predates the other three candidates' by years. |
| Bun | Now ships native builds for Linux (x64/arm64), macOS (x64/Apple Silicon), and Windows (x64/arm64) — Windows arm64 is the most recently added of the three platforms, and Bun's own Windows support post-dates Node's and Deno's by a substantial margin (native Windows landed in Bun 1.1; this repository's own `@opum-ai/lore` dependency, see below, pins `bun >=1.3.14`, a floor already well past that initial Windows support). |
| Deno | First-class, actively maintained support for all three, including cross-compilation from a single host to every named target (see "Phase 6 packaging," below) without a Windows-specific caveat comparable to Node's SEA cross-arch limitation. |
| Compiled systems binary (Go/Rust) | Platform support is a property of the *language toolchain's* cross-compilation targets, not a JavaScript-runtime property at all — both Go and Rust have mature, long-standing macOS/Linux/Windows cross-compilation support, arguably the most mature of the four candidates precisely because it predates and is independent of any JavaScript runtime's own platform work. |

No candidate fails the matrix outright. The distinguishing fact is *how recently* and *how
completely* each candidate's Windows story matured, which is a genuine, citable difference
this document surfaces rather than discounts — not a disqualification for any candidate.

#### Phase 6 packaging and clean-install verification

The [delivery roadmap](../specs/quest-cli-delivery-roadmap.md#phase-6--packaging-and-release)'s
Phase 6 entry is explicit: "Phase 0 passed; D2 runtime and D3 platform decided." Its exit
is "Clean-install verification passes; `@opum-ai/quest` is published through a protected
path; component release and rollback runbooks exist." The
[packaging contract](quest-cli-packaging-contract.md) already commits Quest to
an npm-distributed `@opum-ai/quest` package with executable `quest`
([packaging contract](quest-cli-packaging-contract.md), "Recorded name (AC3)") and — load-
bearing for every candidate equally — a **mandatory release-time recheck clause**: "a future
release task MUST re-run this evidence sweep... live, immediately before any reservation or
publish action" ([packaging contract](quest-cli-packaging-contract.md), "Mandatory
release-time recheck clause (AC1)"), plus the conditionality that "this repository must not
display a working install command until a protected immutable package is actually published
and clean-install verification passes" ([packaging contract](quest-cli-packaging-contract.md),
"Conditionality of public claims (AC4)"). Every candidate below inherits both obligations
unchanged; neither is a per-candidate variable.

| Candidate | Phase 6 packaging shape | Clean-install verification implication |
| --- | --- | --- |
| Node.js | Either a plain npm package (source + `node_modules`, requiring the installer to already have a compatible Node on `PATH`) or a Node SEA-built single-file binary per platform, injected via `postject` into a copy of the Node binary itself. Cross-platform SEA generation from one host needs the target-platform Node binary and, per Node's own SEA documentation, `useCodeCache`/`useSnapshot` disabled to avoid a cross-arch-incompatible artifact — cross-compiling all three targets from one CI runner is possible but not as uniform as Deno's `--target` flow. | Clean-install verification must additionally prove a compatible Node is present (plain-package path) or that the injected SEA binary starts correctly per platform (SEA path); either way, the packaging contract's recheck clause and conditionality-of-public-claims section apply exactly as written. |
| Bun | A plain npm package invoked via a `bun`-shebang or Node-compatible entry (Bun executes most Node-targeted npm packages), or a `bun build --compile` single-file executable per platform via `--target bun-{darwin,linux,windows}-{x64,arm64}` — cross-compiled from one host without a target machine, mirroring the pattern `@opum-ai/lore` itself already ships (single `bin/lore.cjs`, no dependencies). | If the plain-package path is chosen, clean-install verification must prove a compatible Bun (or Node, if the entry is written to run under either) is present on the installing machine — Bun is materially less likely than Node to already be installed on an arbitrary developer or CI machine, which is a real clean-install risk this document surfaces without resolving. If the compiled-executable path is chosen, this risk disappears at the cost of a per-platform binary artifact matrix to publish and verify. |
| Deno | A `deno compile --target <triple>` single-file executable per platform, explicitly supporting cross-compilation to `x86_64-pc-windows-msvc`, `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-unknown-linux-gnu`, and `aarch64-unknown-linux-gnu` from a single host — the most uniform cross-compile story of the three JavaScript-family candidates, per Deno's own documented target list. | Because the artifact is a self-contained binary, clean-install verification reduces to "does the binary run on a clean machine of each target platform" — no runtime-presence check is needed at all, unlike the plain-package paths above. That check does not extend to npm-package interop, though: Deno's npm compatibility is partial, reached via `npm:` specifiers rather than native `node_modules` resolution (see "Candidate runtimes," above), so any dependency the codebase takes on an npm package would need its own compatibility verification, independent of this clean-install check. |
| Compiled systems binary (Go/Rust) | Per-platform binaries published as scoped npm packages (e.g. `@opum-ai/quest-darwin-arm64`) with a thin `optionalDependencies`-resolving shim as the main `@opum-ai/quest` package — the pattern already proven at npm scale by `esbuild` and `swc`. | Clean-install verification must prove `optionalDependencies` resolution actually selects and installs the correct platform package on each of the three target platforms — a real, distinct failure mode (a missed platform triple, an npm client that mishandles `optionalDependencies`) that the JavaScript-runtime candidates above do not share, in exchange for no runtime-presence dependency at all once installed. |

Nothing above changes the packaging contract's own scope or its recheck clause; every cell
inherits it unmodified. The [component contracts and delivery graph](quest-cli-component-contracts-and-delivery-graph.md)'s
"Explicitly open" packaging item and the register's own D2 row remain the authorities this
table does not restate.

### Lore's shipped runtime — context, its relevance argued, not assumed

Live evidence, captured `2026-08-09T02:12:37Z`–`02:12:40Z` UTC (moving reference, re-verify
before relying):

```text
npm view @opum-ai/lore version   # 0.1.1
npm view @opum-ai/lore engines   # { bun: '>=1.3.14' }
npm view @opum-ai/lore bin       # lore -> bin/lore.cjs
npm view @opum-ai/lore dependencies   # (empty — none)
```

`@opum-ai/lore` declares `engines.bun >= 1.3.14` and no `engines.node` entry at all. Its
single artifact is `bin/lore.cjs` — a CommonJS-format file, which is a module-format fact,
not a runtime-compatibility claim; the `engines` field is the only compatibility commitment
`lore-cli` actually publishes, and it names Bun exclusively. This task did not execute
`bin/lore.cjs` under any runtime to test whether it happens to also run under Node — doing
so would test an unpublished claim `lore-cli` itself does not make, and this document
reports only what is declared, not what might incidentally work.

**The task description requires this fact's relevance to Quest's own choice to be argued,
not assumed by precedent — "Lore did X" is an input, not a reason.** Two independent
findings already in this corpus bound how much weight that input can carry:

1. **The integration boundary between Quest and Lore is a subprocess-and-JSON boundary,
   already deliberately runtime-neutral, in both directions this corpus has designed.**
   Quest's own [architecture Spec](../specs/quest-cli-architecture.md) places Lore behind a
   port whose vocabulary is "Resolve a concept identifier, exchange versioned records," and
   states the reason plainly: "Lore is optional and externally versioned; the adapter must
   be absent-by-default" (architecture Spec, "Ports" table). Running in the other direction
   — a future Lore adapter treating `quest` as a tracker backend, the way `lore-cli`'s
   `BacklogAdapter` treats `backlog` today — the [Lore dependency and adapter contract
   evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md) documents that
   existing adapter as one hardcoded external binary resolved from `PATH`, invoked as a
   subprocess, communicating over parsed stdout and a versioned JSON envelope (`QCLI-2.7`,
   "Invocation surface Lore requires of a task CLI"). That same cited section also records
   one non-subprocess element of that existing adapter — a direct, hardcoded, fixed-path
   file read of `backlog/config.yml` for an ordered `statuses:` list, bypassing the CLI
   entirely (Lore dependency and adapter contract evidence, "Invocation surface Lore
   requires of a task CLI"; its requirements table separately flags the Quest-side analogue
   as "Requiring a Quest contract change," item 1c). Neither direction — nor this fixed-path
   read — shares an in-process runtime, a memory space, or a build toolchain with Quest: a
   subprocess boundary and a fixed-path file read are both exactly the substitutability
   point ports-and-adapters architecture is designed to make runtime-irrelevant across.
   Choosing the same runtime as Lore would not simplify, deepen, or ease
   either integration direction, because neither direction was designed to depend on that
   sameness in the first place.
2. **Lore's own contract documentation records that its inbound and outbound envelope
   shapes diverge from each other on purpose** ("building Quest by mirroring Lore's
   documented `--json` output would produce the wrong shape" — [open component decisions
   register](quest-cli-open-component-decisions.md), "Contract-level open items"). A
   corpus that already rejects inheriting Lore's *output shape*
   by precedent has no standing basis to inherit Lore's *runtime* by precedent either; the
   same discipline applies to both.

What Lore's runtime choice **does** legitimately supply, short of a technical requirement:
**feasibility precedent for the packaging shape**, not the runtime itself. `@opum-ai/lore`
demonstrates, as a live, dated fact, that this same org (`opum-ai`) has already shipped a
Bun-only CLI through the exact npm-scoped-package-plus-`bin`-executable pattern the
packaging contract commits Quest to (`<name>-cli` repository, `@opum-ai/<name>` package,
`<name>` executable — [packaging contract](quest-cli-packaging-contract.md), "Accepted
identity," itself citing the observed `@opum-ai/lore` sibling pattern). That is evidence
that a Bun-only distribution is *operationally viable* at this org's actual publishing
scale, dependency-free (`deps: none`, above), and un-blocked by anything Quest's own D3
platform matrix requires — not evidence that Quest's own choice should match it, and not
evidence about developer-machine or CI-runner Bun availability generally, which Quest's own
clean-install verification (Phase 6, above) would still have to establish independently of
what any one sibling package assumes.

### Which architecture-Spec boundaries a runtime choice would actually constrain

The [architecture Spec](../specs/quest-cli-architecture.md) states its own runtime-
neutrality as a deliberate, load-bearing property: "nothing here names a language, a build
system, a library, or a storage engine... the architecture the research supports is a
ports-and-adapters one, and ports-and-adapters is exactly the shape that survives having its
runtime chosen later." That claim is largely accurate, but not uniformly — the Spec itself
names one exception directly, and the [delivery roadmap](../specs/quest-cli-delivery-roadmap.md)
names a second. This section separates the two classes on the corpus's own evidence, not on
inference about any specific candidate above.

**Genuinely runtime-neutral, on the Spec's own terms** (a runtime choice does not narrow or
reshape these):

- **Layering and dependency direction** (CLI → application → domain → ports, inward-only)
  and the **ports-and-adapters shape itself** — the Spec's own framing claim, and nothing in
  the layer descriptions names a runtime primitive.
- **Domain purity** — "no I/O, no clock, no environment" is a design constraint on where
  logic may live, not a statement about what language or runtime hosts that logic.
- **The Git trust model** — "Git's conditional ref update is the only ordering authority"
  is a property of Git itself, invoked through whatever the Git port's adapter turns out to
  be; the trust model does not change shape based on what calls Git.
- **Durability tiers** and the **error taxonomy / three-outcome classification** — both are
  conceptual classifications the [result contract ADR](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md)
  (`QCLI-24`) already settled at the envelope/exit-code level, independent of implementation
  language.
- **Operation shape** (read basis → decide → compute owned paths → write → commit → report)
  — an algorithmic sequencing constraint, not a runtime-API constraint.

**Concretely constrained by the runtime choice**, on the corpus's own words:

- **The layering-enforcement mechanism.** The Spec's own open question: "What enforces the
  layering? ...requires a mechanism — an import-graph check, a build constraint, a review
  gate. No mechanism is chosen, and **one that depends on the runtime cannot be chosen until
  D2 is settled**" (architecture Spec, "Open questions"). This is the single most direct,
  self-identified instance of a boundary the Spec names as runtime-dependent.
- **Native packaging and distribution shape (Phase 6).** Addressed in full above — the
  actual artifact shape (plain package, SEA binary, compiled executable, per-platform npm
  shim) is entirely a function of which candidate is chosen, and the roadmap gates Phase 6's
  entry on D2 explicitly ([delivery roadmap](../specs/quest-cli-delivery-roadmap.md#phase-6--packaging-and-release),
  "Entry. Phase 0 passed; D2 runtime and D3 platform decided.").
- **The executable test harness.** The roadmap's own "Deliverables the research does not yet
  name as phase work" section states the black-box (`BB`) and threat-model (`TM`) scenarios
  "were authored before any runtime was chosen, so neither is expressible as an executable
  test until D2 is settled" — the scenarios themselves are runtime-neutral prose, but
  turning them into a running suite is not.
- **Port *adapter* implementations, though not port *vocabulary*.** The Filesystem, Clock,
  and Git ports are declared in runtime-neutral vocabulary ("read, write, enumerate,
  byte-preserving"; "supply the current instant"; "conditional ref update, read at revision,
  commit an owned path set" — architecture Spec, "Ports" table), and that vocabulary does
  not change with D2. The *code* implementing each adapter — which filesystem API, which
  clock primitive, whether Git is shelled out to or bound as a native library — is exactly
  the substitutable, runtime-specific detail ports-and-adapters is designed to isolate. This
  is not a defect in the Spec's runtime-neutrality claim; it is what "substitutable in
  tests" (architecture Spec, "Ports" requirements) already presupposes.

The practical reading: D2 does not reopen the architecture itself — the boundaries above are
the load-bearing ones a runtime choice reaches, and everything else the Spec describes was
already designed to survive the choice being made later, exactly as its own summary claims.

### Explicit non-decision (restated)

**This document decides no runtime.** It enumerates four candidates, states each one's fit
against the recorded platform matrix and the packaging contract's Phase 6 obligations,
reports Lore's own shipped runtime as argued context rather than assumed precedent, and
separates the architecture-Spec boundaries a runtime choice actually reaches from the ones
that survive it unchanged. **D2 remains owned-not-closed.** The [open component decisions
register](quest-cli-open-component-decisions.md)'s D2 entry is updated by this task to point
at this document; its Status cell and every prior sentence in its D2 detail bullet are left
exactly as recorded — this document adds a pointer, not a ruling. No package.json, `bin`
entry, runtime dependency, lockfile, or executable scaffolding accompanies this document or
any other change this task makes.

### Summary for owner ruling

| Candidate | Platform-matrix fit | Phase 6 packaging shape | Runtime-presence risk at clean-install | Relationship to Lore's own choice |
| --- | --- | --- | --- | --- |
| Node.js | Longest-mature on all three platforms | Plain package or SEA binary; cross-arch SEA needs target-platform Node and disabled code-cache/snapshot | Node is the most likely runtime already present on an arbitrary machine, if the plain-package path is chosen | Diverges from Lore's own choice; no technical cost shown for diverging (see "Lore's shipped runtime," above) |
| Bun | Full three-platform support, Windows most recently matured of the JS-family candidates | Plain package or `bun build --compile` single-file binary, cross-compiled from one host | If plain-package path chosen, Bun is materially less likely than Node to be pre-installed on an arbitrary machine | Matches Lore's own choice; matching does not by itself simplify integration (see above) — the argued benefit, if any, is packaging-pattern precedent within this org, not a technical coupling |
| Deno | Full three-platform support; most uniform documented cross-compile flow of the three JS-family candidates | Single-file `deno compile --target` binary per platform; no runtime-presence dependency once installed | None as a runtime-presence risk, but npm-package interop is via `npm:` specifiers with documented gaps rather than native `node_modules` resolution (see "Candidate runtimes," above) — any adapter code depending on npm packages would need to verify compatibility independently of this risk axis | Diverges from Lore's own choice; no technical cost shown for diverging |
| Compiled systems binary (Go/Rust) | Longest-mature cross-compilation story of any candidate, independent of any JS runtime | Per-platform npm packages plus an `optionalDependencies`-resolving shim (the `esbuild`/`swc` pattern) | None once installed, but `optionalDependencies` resolution correctness becomes its own distinct failure mode to verify per platform | Diverges most from Lore's own choice; also diverges from the corpus's JS/TypeScript-implied vocabulary elsewhere (e.g. the architecture Spec's own examples), which this document notes without treating as dispositive since the Spec itself claims language-neutrality |

None of these figures or comparisons is accepted by this document. Each is offered for the
owner to weigh against the four inputs the task that produced this document named as
required; the ruling itself, and the register update recording it, are separate acts this
task does not perform.

### Recheck clause

The npm-registry facts about `@opum-ai/lore` above (version, `engines`, `bin`, dependency
count) are moving references — re-run the four `npm view @opum-ai/lore <field>` commands
quoted above before relying on them at any later boundary, per this corpus's standing
moving-vs-immutable-reference convention
([research programme Spec](../specs/quest-cli-pre-implementation-research-program.md#moving-vs-immutable-references)).
The platform-support and cross-compilation characteristics described for Node.js, Bun, and
Deno are drawn from each project's own current public documentation as of this task's
research pass and are equally moving references, not immutable facts this document can
freeze — Bun's Windows support in particular is the youngest of the three JavaScript-family
candidates' platform stories and the most likely of the three to have changed materially by
the time an owner ruling is made. A changed result in any of these is a new fact for the
owner ruling on D2 to weigh, never grounds for a future worker to treat this document's
comparison as current without re-checking it.

## Notes

This task read, read-only: the [open component decisions register](quest-cli-open-component-decisions.md)
(D2 row and detail bullet), the [license, platform, and runtime ownership record](quest-cli-license-platform-and-runtime-ownership-record.md)
(`QCLI-27`), the [packaging contract](quest-cli-packaging-contract.md), the [architecture
Spec](../specs/quest-cli-architecture.md), the [delivery roadmap](../specs/quest-cli-delivery-roadmap.md),
the [Lore dependency and adapter contract evidence](quest-cli-lore-dependency-and-adapter-contract-evidence.md),
the [activation-gate evidence record](quest-cli-activation-gate-evidence-record.md), the
[result contract ADR](../adr/ratify-the-quest-cli-result-contract-envelope-exit-codes-not-found-and-anomaly.md),
and the [research programme Spec](../specs/quest-cli-pre-implementation-research-program.md).
It edited none of them directly; a separate, minimal edit to the open component decisions
register's D2 entry, adding only a pointer to this document, is recorded as its own change
in this task's Backlog notes. It ran `npm view @opum-ai/lore <field>` (version, `engines`,
`bin`, `dependencies`) live against the public npm registry, and read (did not execute)
public documentation for Node.js single-executable applications, `bun build --compile`, and
`deno compile` to ground the platform-support comparisons above. It created no ADR, recorded
no decision as accepted, added no `package.json`, `bin/` entry, runtime dependency,
lockfile, or executable scaffolding, and ran no `npm install`, `npm publish`, or other
registry-mutating command.
