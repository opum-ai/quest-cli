---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI packaging contract
tags:
  - quest
  - cli
  - packaging
  - npm
  - provenance
  - registry
summary: Dated registry evidence, provenance classification, and the accepted @opum-ai/quest package identity for the quest executable.
timestamp: 2026-08-04T13:04:41.236Z
---

# Quest CLI packaging contract

This Reference is `QCLI-2.9`'s packaging-allocation deliverable. It records —
it does not decide — the npm package identity for the `quest` executable. The
owner already decided the name on 2026-08-04: `quest-cli` publishes to npm as
the scoped `@opum-ai/quest`; the executable stays `quest`. That decision is
recorded in the accepted [component ADR](../adr/use-quest-cli-for-the-quest-package-and-command.md)'s
2026-08-04 amendment (`QCLI-5`), the [component charter](quest-cli-component-charter.md),
and the [research source register](quest-cli-research-source-register.md)'s
"quest-cli repository and npm package identity" slice, all cited read-only
here — this document does not amend or restate any of them as normative, and
does not edit the register (owned this wave by `QCLI-2.7`).

This document authorizes **no** package reservation, transfer, publication,
remote-policy change, or release (AC5). Every fact below was observed live by
this task, independent of the register's own 2026-08-04 revalidation, and is
dated separately.

## Details

### Accepted identity

- **Executable:** `quest` — unchanged, per ADR decision item 2.
- **npm package:** `@opum-ai/quest` — the owner-approved scoped fallback ADR
  decision item 2 always provided for, now exercised per the 2026-08-04
  amendment. Matches the observed `@opum-ai/lore` sibling pattern: GitHub
  repository `<name>-cli`, npm package `@opum-ai/<name>` (suffix dropped),
  executable `<name>`.
- **Status:** unclaimed, unreserved, unpublished as of the dates recorded
  below. Naming a preference is not a release claim (ADR consequences).

### Dated registry evidence (AC1)

All commands below were run live by this task on **2026-08-04** between
`13:01:49Z` and `13:04:26Z` (`date -u` immediately before the sweep), from
this worktree, using `npm view <pkg> <field>` and `gh api repos/<org>/<repo>`.
This is an independent re-observation, not a copy of the register's own
2026-08-04 figures, and the two are consistent.

#### Target name: `@opum-ai/quest`

| Field | Observed |
| --- | --- |
| `npm view @opum-ai/quest version` | `E404 Not Found` — unclaimed |
| `npm view @opum-ai/quest` (full record) | `E404 Not Found` — unclaimed |

No ownership, maintainers, or package history exist for this name because it
has never been published. There is therefore nothing to classify beyond
"currently free" — see the mandatory recheck clause below, which exists
precisely because that fact is time-bound.

#### Conflicting/reference names on the public registry

| Package | Version | Repository | License | Maintainers | Description | Bin |
| --- | --- | --- | --- | --- | --- | --- |
| `quest` | `0.4.0` | `git+https://github.com/Clever/quest.git` | *(no `license` field published)* | `azylman`, `cleverdrone`, `jefff`, `jonahkagan`, `rgarcia` (5) | "simple request library for node" | — |
| `quest-cli` | `1.0.0` | *(none published)* | `ISC` | `edamghy <damriabdellah@gmail.com>` (1) | *(none published)* | — |
| `@opum-ai/quest-cli` | `E404 Not Found` — unclaimed | — | — | — | — | — |
| `@salient-data/quest` | `E404 Not Found` — unclaimed | — | — | — | — | — |
| `@salient-data/quest-cli` | `E404 Not Found` — unclaimed | — | — | — | — | — |
| `lore` | `0.13.0` | `git+https://github.com/lore/lore.git` | — | — | — | — |
| `lore-cli` | `0.13.2` | `git+https://github.com/lore/lore.git` | — | — | — | — |
| `@opum-ai/lore` | `0.1.0` | `git+https://github.com/opum-ai/lore-cli.git` | `MIT` | `jeremy-newhouse <jeremy.newhouse@salientdata.ai>` (1) | — | bin `lore` → `bin/lore.cjs` |

**Corrected 2026-08-05 by `QCLI-14`:** the `@opum-ai/lore` row's bin path
(bin `lore` → `bin/lore.cjs`) previously occupied the Description column,
the only populated cell in that column that was not a published package
description string, where every other populated row's Description cell
carries one. This table's column semantics are widened to add a dedicated
Bin column, and the bin-path value — unchanged, and still dated to the
original 2026-08-04 sweep below — is relocated there. The `@opum-ai/lore`
row's Description cell is marked `—` because no npm description was
captured for that package in the 2026-08-04 sweep; this correction does not
supply one, since doing so now would be a new, separately dated observation,
not a relocation of the existing one. No other cell in this table changed.

`quest` package history (`npm view quest time`): first published `0.0.2` on
2012-11-01, most recent `0.4.0` on 2018-09-04, `modified` (last registry
metadata touch) 2022-06-25 — 26 releases across roughly six years, then no
published activity for the eight years since, though the registry entry
itself remains live and resolvable, not deleted or deprecated.

`quest-cli` package history (`npm view quest-cli time`): single release
`1.0.0` on 2022-02-17, `modified` 2022-05-13 — one publish, no version
history, no repository or description metadata ever supplied.

#### Repository-identity verification (transfer redirect trap)

Per the register's own recorded reclassification trigger, a GitHub rename
redirect makes a stale org reference resolve silently. Re-verified live
2026-08-04, independent of the register:

- `git remote -v` in this worktree: `origin` is
  `git@github.com:opum-ai/quest-cli.git` (both fetch and push).
- `gh api repos/opum-ai/quest-cli --jq '{full_name, id, private}'` →
  `{"full_name":"opum-ai/quest-cli","id":1319427259,"private":true}`.
- `gh api repos/salient-data/quest-cli --jq '{full_name, id, private}'` →
  the **same** `{"full_name":"opum-ai/quest-cli","id":1319427259,...}` — the
  old org path resolves through GitHub's redirect to the identical
  repository id, confirming transfer, not a second repository.

#### Allocation and transfer constraints

- **`quest` (unscoped, target of ADR decision item 2's primary preference):**
  occupied by an active third-party npm identity (`Clever/quest`, 5 named
  maintainers, a 2012–2018 publish history). No `opum-ai` ownership,
  contribution, or contact exists. There is no registry-visible path to
  transfer or reuse this name without contacting the current maintainers or
  npm support, and no such contact is authorized by this task or this
  document (AC5). This occupancy is the *rationale* the owner cited for
  going scoped, per the ADR amendment — not an open question this document
  reopens.
- **`quest-cli` (unscoped, matches this repository's own name):** occupied,
  single maintainer, no repository or description metadata to establish
  intent, activity, or contactability. Same constraint and same non-action
  as above.
- **`@opum-ai/quest` (the accepted scoped fallback):** unclaimed. No registry
  record, so no ownership, maintainer, or transfer constraint applies today.
  Nothing prevents any other npm account from claiming it before this
  component actually publishes — that risk is exactly what the mandatory
  recheck clause below exists to control, not to eliminate in advance.
- **`@opum-ai/quest-cli` (the un-dropped-suffix form):** unclaimed, and not
  the target — recorded only to confirm the dropped-suffix pattern also
  holds for `quest` the way the register already confirmed it for `lore`
  (`@opum-ai/lore-cli` 404s; `@opum-ai/lore` is the real package).
- **`@salient-data/quest` / `@salient-data/quest-cli`:** both unclaimed.
  Recorded for completeness only — `opum-ai` is the current target org per
  the owner's 2026-08-04 identity decision; the `salient-data` scope is not
  pursued.

#### Owner-approved scoped fallback (AC1, AC3)

`@opum-ai/quest` is the sole scoped fallback the owner has approved, per the
ADR's 2026-08-04 amendment and the register's "quest-cli repository and npm
package identity" slice. This document names no alternative scope and
proposes none. If `@opum-ai/quest` becomes unavailable before release, a
release-time worker must return to the owner for a new decision — see the
recheck clause immediately below — not silently pick a different scope.

#### Mandatory release-time recheck clause (AC1)

**A future release task MUST re-run this evidence sweep — `npm view
@opum-ai/quest`, `npm view quest`, `npm view quest-cli`, `npm view
@opum-ai/quest-cli`, plus the `gh api repos/opum-ai/quest-cli` /
`repos/salient-data/quest-cli` identity check above — live, immediately
before any reservation or publish action, and MUST NOT treat this document's
2026-08-04 observation as current proof of availability.** An unclaimed
scoped name can be claimed by any other npm account at any time between this
observation and release; only a check performed at release time, not this
one, can support a publish decision. If the recheck finds `@opum-ai/quest` no
longer available, that is a new fact for the owner to rule on (AC5) — not
grounds for a worker to select a substitute name unilaterally.

### Provenance classification (AC2)

Classifications below are cited read-only from the [research source
register](quest-cli-research-source-register.md)'s existing "npm package name
occupancy" and `@opum-ai/lore` slices; this document does not reclassify
anything and does not edit the register.

| Slice | Classification | Basis |
| --- | --- | --- |
| `quest` npm package (`Clever/quest`) | Excluded | Register: "npm package name occupancy" — unrelated third-party Node request library; existence, version, license, claimed repository, maintainer identities, description text, and publish/version history are naming-conflict evidence only, never a codebase Quest may consume |
| `quest-cli` npm package (`edamghy`) | Excluded | Same register slice — unrelated third-party package sharing this repository's own name |
| `lore` / `lore-cli` npm packages | Excluded | Same register slice — unrelated React/Redux framework, no relation to Lore tooling |
| `@opum-ai/lore` npm package | Allowed | Register's `lore-cli` slice — cited only as the observed sibling naming *pattern* (repo `<name>-cli` → package `@opum-ai/<name>` → executable `<name>`), never as a Quest runtime dependency or implementation source |

**Ambiguous or unadmitted content is not reused (AC2).** This task inspected
only public npm registry metadata (`version`, `repository`, `license`,
`description`, `maintainers`, `time`) via `npm view`, and public GitHub repo
metadata (`full_name`, `id`, `private`) via `gh api`. No source file, test,
README body, or other content of `quest`, `quest-cli`, `lore`, or `lore-cli`
was opened, copied, executed, or derived from. No contributor of any occupied
package was contacted. When `@opum-ai/quest` is eventually authored, its
content originates solely from this component's own clean-room work — never
from any occupied name's package content, regardless of that content's
license, because the constraint recorded in the register for Backlog.md
(authorship independence, not licensing) applies with equal force here: an
MIT or ISC license on an unrelated package would make copying *legally*
permissible, not *provenance-clean*, and this program's admission authority
requires the latter.

AC1's required fields — maintainer identities, descriptions, and publish
histories for `quest` and `quest-cli` — are within the register's "npm
package name occupancy" slice's permitted use, which `QCLI-2.7` widened
2026-08-04 to enumerate existence, version, license, claimed repository,
maintainer identities, description text, and publish/version history
exhaustively; this document reads and cites that field set as ordinary
registry metadata, not package content, so clean-room is unaffected. The
permitted-use widening this paragraph once routed to `QCLI-2.7` as the
register's owner this wave is closed — see the register's "npm package name
occupancy" slice for the exhaustive enumeration.

### Recorded name (AC3)

**The accepted scoped fallback is `@opum-ai/quest`; the executable remains
`quest`.** This satisfies AC3 for this research task: the name is recorded in
this component packaging contract, consistent with the ADR's amended decision
item 2 and the component charter's "Owns here" entry ("npm package
`@opum-ai/quest` and executable `quest`"). This document is the packaging
contract AC3 refers to; no other new document makes this claim.

### Conditionality of public claims (AC4)

Per the ADR's own consequences section: *"The package name remains a
preference, not a release claim. This repository must not display a working
install command until a protected immutable package is actually published
and clean-install verification passes."* This document extends that
conditionality explicitly to every artifact AC4 names:

- **Package metadata** (a future `package.json` `name`/`repository`/`bin`
  field) may be *drafted* against `@opum-ai/quest` / `quest`, but must not be
  described anywhere as reserved, live, or installable until publication
  actually occurs under separate owner authorization (AC5).
- **Install copy** (README instructions, `npm install` snippets, website or
  documentation claims) must not present `@opum-ai/quest` as installable
  until (a) it is actually published, (b) a clean-install verification pass
  succeeds, and (c) the Lore-owned activation-evidence gate that the
  component charter routes to `lore-doc`/`lore-cli` is satisfied — verifying
  that gate is `QCLI-2.7`'s scope, not asserted or performed by this
  document.
- **Public claims** of any kind (this document included) about `@opum-ai/quest`
  being available, reserved, or shipped are false until all of the above
  hold. As of 2026-08-04, none of them hold: the name is unclaimed and
  nothing has been published, reserved, or released.

### No registry action taken (AC5)

This task performed only read-only lookups: `npm view <pkg> <field>` against
the public npm registry, and `gh api repos/<org>/<repo>` against the public
GitHub API. It did not run `npm publish`, `npm access`, `npm owner`, `npm
deprecate`, any GitHub repository-settings mutation, or any other command
capable of reserving, transferring, publishing, or changing remote policy for
any name or repository discussed here. No such action is authorized by this
document. A future task performing any of reservation, transfer, publication,
or release requires separate, explicit owner authorization and must satisfy
the mandatory recheck clause above first.

### Contradictions found

None. Every fact observed by this task's independent re-verification is
consistent with the register's 2026-08-04 revalidation and the ADR's
2026-08-04 amendment: `@opum-ai/quest` is unclaimed, the `opum-ai/quest-cli`
transfer is complete and verified, and the unscoped `quest`/`quest-cli` names
remain occupied by unrelated third parties. No evidence gathered here
supports reopening the name decision.

## Notes

This task's evidence sweep read only public npm registry metadata and public
GitHub repository metadata; it opened, searched, copied, executed, or derived
design from no package source, test, or README body, and made no repository,
package, release, or remote mutation. It did not open the register, the
charter, or the ADR for editing — only for citation. It did not open the
quarantined local Backlog.md clone or any Quarantined/Excluded slice from the
source register.
