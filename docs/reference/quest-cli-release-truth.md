---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI release truth
tags:
  - quest
  - cli
  - release
  - publication
summary: Immutable publication and public-registry verification evidence for Quest CLI 0.1.0.
timestamp: 2026-08-17T05:49:03.883Z
---

# Quest CLI release truth

`@opum-ai/quest` 0.1.0 is publicly published on npm. This is the immutable
release record for the root launcher and its six platform packages; it does
not claim that a later source tree or a locally rebuilt artifact is released.
Each dated section below is an immutable record of that publication event;
later sections record later, additional publications rather than replacing
earlier ones.

## Current publication state (2026-09-05, updated for 0.3.4)

- npm dist-tag `latest` = `0.3.4` on the root package and all six platform
  packages (verified live via `npm view @opum-ai/quest version` and
  `npm view <platform-package> version` for all six, immediately after
  publication).
- Published via `release.yml` `workflow_dispatch` `publish=true` against tag
  `v0.3.4` (run
  https://github.com/opum-ai/quest-cli/actions/runs/33987103879), gated on a
  native-execution receipt fetched by that same workflow for commit
  `a50da3c`. Unlike 0.3.3, `dev` was promoted to `main` (fast-forward,
  `git push origin dev:main`) *before* this publish, not after -- the lesson
  from 0.3.3's post-publish `bun.lock` fix.
- Publication authority: the package owner explicitly authorized this release
  in-session (2026-09-05) to carry QCLI-235 (the `opum-quest` Claude Code
  plugin scaffold) and QCLI-236 (the `skill_source=plugin` opt-out) to a
  release tag.
- See "0.3.4 release" below for the qualification, receipt, and
  post-publish-smoke evidence for this specific version. The
  2026-08-28-dated section further below remains the last full record before
  0.3.3/0.3.4 and predates them; no section exists here for 0.3.0-0.3.2
  either, a pre-existing documentation gap not backfilled by either release.

## 0.3.4 release

Carries QCLI-235 (`.claude-plugin/plugin.json`, `skills/quest/SKILL.md`,
`evals/` for the `opum-quest` Claude Code plugin) and QCLI-236 (a persisted
`agents.skillSource` opt-out in `.quest/workspace.toml`, gated by a new
`--force` flag that only ever removes a byte-exact leftover
`.claude/skills/quest/SKILL.md`, never a hand-edited one).

Source commit `a50da3c` (PR #273 merge to `dev`, then promoted to `main`
before publish via PR #274 + `git push origin dev:main` -- a deliberate
change from 0.3.3's order). Prepublication qualification run
https://github.com/opum-ai/quest-cli/actions/runs/33985711996 (explicit
`workflow_dispatch` against the `v0.3.4` tag) passed all six platform jobs
plus `source-gates` (including `bun install --frozen-lockfile`, confirming
the lockfile fix applied proactively this time) and the operating-block
digest check.

The native-execution receipt binds `0.3.4` at `a50da3c` across all six
platforms (`bun run receipt:require` confirmed this locally before publish).

npm `dist.shasum`/`dist.integrity` observed live immediately after
publication, for the root package and all six platform packages:

| Package | npm shasum | npm integrity |
| --- | --- | --- |
| `@opum-ai/quest@0.3.4` | `c750b2b971e23009491ad198b5a55b339a5341a4` | `sha512-JGmsOeC5+ZTGGtbqSS3imRmjf/OmyCBUDID50pb/ZEIuV7GOMgaJ9ewH3VzIZYLb5vKdW8OBOwyPM3bFUjMH7w==` |
| `@opum-ai/quest-darwin-arm64@0.3.4` | `099056a73bce5b4674a79cfd976e454f6493c070` | `sha512-cLtAGDk5QESQOss+sBe/VR/XiBpbUd9lwFkkB0xVB411qsoIfodaAp4sukAn4LM605ZLEWKqSz+rafM0Anvapw==` |
| `@opum-ai/quest-darwin-x64@0.3.4` | `dce1455579563068fc5bf907acfd2a9f91f9dffd` | `sha512-sTPZyVg1INP+nUgk4JJ+gtE9Q8ySCqZBy/ExXI87xtzX2G42xQ+DksDNrVOrlfiQjuuxt7VopNbNoY3DL7HHpQ==` |
| `@opum-ai/quest-linux-arm64@0.3.4` | `b52d005002c0e7af151801613f7721df108ece99` | `sha512-hvSVSTiRaDvIfxK1tmMgXYuZD8EBdn7UovYK7vvmx8pk8nYf8AvJQy+ipDhVkQRGWZ+eFwHGYdtzTjj/j/XGbQ==` |
| `@opum-ai/quest-linux-x64@0.3.4` | `343b36a9fdb486dcef13ef9e0191cc55b3152a84` | `sha512-Ro+t8ZPrqnxMfilmPQtnUiib92ejZ2aFHBFWQu4wHMMru+tMEieFO8ia1JNAqbz8i+YXlpZ0YVgGOL/lfPfuKg==` |
| `@opum-ai/quest-win32-arm64@0.3.4` | `5878c72d30d70a284033d3833a8fc42e51344f51` | `sha512-Arli5vy4deeRTSma4uXecG8EUp7h+xZ14BHLiI5W8qcqO3dbCpxDP4qgePwZujftLEPoRhovoAaYW2+YHcKotA==` |
| `@opum-ai/quest-win32-x64@0.3.4` | `15c9582bbcd73fbdd21bb35823453109255bac10` | `sha512-3gzo6RYx0Tqe7CEKcO0BVf0IDcdhRxBptBaPQE91Dw5VS9i1YFPGLsiVqae61pT2aZC9ROUVnnopB0tr48dFsw==` |

`bun run receipt:verify-published -- 0.3.4` confirmed the receipt matches
every published platform package. Post-publish clean-install smoke (a fresh
`npm install @opum-ai/quest@0.3.4`, isolated from any local checkout) proved
the full `--skill-source plugin` / `--force` opt-out flow end to end against
the published bytes: `quest init --agent-instructions --target claude
--skill-source plugin` persists the config and writes the skill once; a bare
`quest agents --update-instructions` then reports it `orphaned` rather than
leaving it alone; `quest agents --check` exits 6; `quest agents
--update-instructions --force` removes the byte-exact file; `quest agents
--check --require-installed --target claude` then exits 0. Also confirmed:
the per-repo skill's own text no longer hardcodes "managed in AGENTS.md"
(QCLI-236's fix, found independently by quest-web against the pre-fix 0.3.3
and already resolved here).
- Published via `release.yml` `workflow_dispatch` `publish=true` against tag
  `v0.3.3` (run
  https://github.com/opum-ai/quest-cli/actions/runs/33955399180), gated on a
  native-execution receipt fetched by that same workflow for commit
  `a700775dd2ef789e94e0db6873b2b86615eeb9f0` — see "0.3.3 release" below.
- Publication authority: the package owner explicitly authorized this release
  in-session (2026-09-05) to unblock `opum-agent` and `opum-doc`'s
  `agents --check --require-installed` CI, which stays broken until they can
  run `--target claude` against an installed release carrying it (QCLI-227).
- This doc's "Current publication state" was not updated across 0.3.0, 0.3.1,
  or 0.3.2 (no section exists for any of them here, though those releases are
  real and recorded on their own Quest tasks — QCLI-166 for 0.3.1, QCLI-224
  for 0.3.2). That gap predates this entry and is not backfilled here; treat
  the absence of a 0.3.0–0.3.2 section as a documentation gap, not evidence
  those versions were unpublished.

## 0.3.3 release

Quest 0.3.3 adds `--target claude|codex` to `quest agents` and
`quest init --agent-instructions` (QCLI-227), letting the managed
`quest:agent-instructions` block target `CLAUDE.md` instead of only
`AGENTS.md`; omitting the flag keeps the pre-0.3.3 default (`AGENTS.md`)
byte-identical for existing callers. Same release also fixes the
`--target claude` block's own CI hint, which briefly told its reader to run
the codex-target check instead of `--target claude` (QCLI-231).

Source commit `a700775dd2ef789e94e0db6873b2b86615eeb9f0` (PR #268 merge to
`dev`; `dev` was not yet promoted to `main` at time of publication — the tag
and the published bytes are independent of that promotion, which is tracked
separately). Prepublication qualification run
https://github.com/opum-ai/quest-cli/actions/runs/33950259801 (explicit
`workflow_dispatch` against the `v0.3.3` tag, not the automatic push-triggered
run) passed all six platform jobs plus `source-gates` and the operating-block
digest check.

The native-execution receipt binds `0.3.3` at `a700775` across all six
platforms (`bun run receipt:require` confirmed this locally before publish).
Executable SHA-256 values from that receipt:

| Package | Executable SHA-256 |
| --- | --- |
| `@opum-ai/quest-darwin-arm64@0.3.3` | `d01d5cf835e0e669ff95d9fd11abddf7afbc86f8dd33560c3ccc6ad683e6877d` |
| `@opum-ai/quest-darwin-x64@0.3.3` | `7b77de3e441f3c51e569be665f224ce63396598b468af7d28ef388b740d864e5` |
| `@opum-ai/quest-linux-arm64@0.3.3` | `efdff43144ceb9f3e965e9fd15678fc0fce2385a689e639d1b596acf77472429` |
| `@opum-ai/quest-linux-x64@0.3.3` | `018134f169cfe8adb9d05ffed530aaefbe909d681a54e529a1d36b2d9eda6bb7` |
| `@opum-ai/quest-win32-arm64@0.3.3` | `58966f8c3a5552eeef4712f0304180e3592a2f82c991eb2d44e3417a29d17927` |
| `@opum-ai/quest-win32-x64@0.3.3` | `b6c165816a20ab1b3fcf7eda4e91e9cdffa4dcfa9c1a1b04059a73aca604fdc5` |

npm `dist.shasum`/`dist.integrity` observed live immediately after
publication, for the root package and all six platform packages:

| Package | npm shasum | npm integrity |
| --- | --- | --- |
| `@opum-ai/quest@0.3.3` | `41052e88185b35e7f2202f08f178df517fc5dc57` | `sha512-jJR+G6JkUJ/6Y5O06SrIEzRvSaoZ8D7YdEd2ddWFxoq1luQIfvDzRyIAHb892Cme5kE1GDtKRWF9bONmQ4D87A==` |
| `@opum-ai/quest-darwin-arm64@0.3.3` | `e60ca0711ef1ebf3b5b9565cc2344d0e4ed464cc` | `sha512-jqoyENa+n8P4FjiT+GinGeOZl4bwhP8DTZj1/whB6N2mXoXe2ldq1srYe5i1dQfYQG7e2Xps0toWXcLYbsDGaw==` |
| `@opum-ai/quest-darwin-x64@0.3.3` | `810a58643a4cfc97c2339cfa2d48f0a97fcb4f41` | `sha512-d7nqGWXn8zCs6QelD9iBvlwWabKyIrvSKfqXa734LGKJR2L1Ik7e+/WoLuNXD+QfvpKH6TwfIDPxEfeMrCYu5Q==` |
| `@opum-ai/quest-linux-arm64@0.3.3` | `bd4ae8838a9fb67b2e115ef1255bbe1bf6f89b76` | `sha512-bmrfrQNR9osYk30Vwzj4WUaMZlMHsrbPXHHYVV5kL3Ava3GEl1iJttIq77+P2SnoTAJEvuTEz8WZoLLJc0dBeA==` |
| `@opum-ai/quest-linux-x64@0.3.3` | `99ca33e2399227af222330fd08d03e19d2ac1552` | `sha512-vzF4fBCPr8rIDhG5UtsH0LwSrDYjdgGm7SBQcep8HddIY7r4sh7ukvDZZxxxTj7goCjA6wD2tQKFk7fEO1tCEQ==` |
| `@opum-ai/quest-win32-arm64@0.3.3` | `f1dcdac35eb0dbc19bd9d7dd699733b7a8a0211f` | `sha512-PqZ7LaNo/7NqM61W+iQ7HJ3VpdWZIwOxtTi1BRvjNAIeywMh0IXc9H3Gb/Hr4XLDC4oeN4IKM5iS6hiev8a/Uw==` |
| `@opum-ai/quest-win32-x64@0.3.3` | `b357adad91d3cc51a57bea919d865f94dec215d9` | `sha512-1hZa7iPnnfxSOEQZcfI2DFjrZF5l10CStBVpWB17Nhp4oMZRH79vCuse30SE3zR6cskAwMEmlOGyAr5DACUeTQ==` |

`bun run receipt:verify-published -- 0.3.3` confirmed the receipt matches
every published platform package. Post-publish clean-install smoke (a fresh
`npm install @opum-ai/quest@0.3.3`, isolated from any local checkout) proved:
`quest --version` reports `0.3.3`; `quest manifest --json` lists 48 commands;
`quest init --agent-instructions --target claude` writes the managed block
into `CLAUDE.md` with no `AGENTS.md` ever created; `quest agents --check
--require-installed --target claude` exits 0; the block's own CI-hint prose
reads `quest agents --check --require-installed --target claude` (not the
codex-target command); and `task create`/`task list` round-trip normally.

## Current publication state (2026-08-28)

- npm dist-tag `latest` = `0.2.9` on the root package and all six platform
  packages (verified live via `npm view <package> dist-tags`; root and
  platform packages spot-checked directly, remainder per Worker evidence
  below). `release-candidate` is also `0.2.9`.
- GitHub Release `v0.2.9` ("Quest CLI 0.2.9") is published: non-draft,
  non-prerelease, published 2026-08-28T18:17:34Z, at
  https://github.com/opum-ai/quest-cli/releases/tag/v0.2.9. Annotated tag
  object `cb33551adaa72fbc6ebbca289045cecc8e9d21ca` dereferences to commit
  `75c214de8f6055e27b30ae43b5a30e3abc2556b1` (PR #158 merge to `dev`), which
  is an ancestor of `origin/main` at `672e8d07bd5e43ba265bba1278c7d41d3d58c7f2`
  (PR #160). Tagged by the package owner.
- The published 0.2.9 artifacts are the same candidate qualified below under
  "0.2.9 corrective release": same source commit and tarball SHA-256/npm
  integrity values. That section's superseded "unpublished" framing is kept
  as a historical qualification record; the current publication facts are
  recorded here and at the start of that section.
- `@opum-ai/quest@0.2.8` was also published to npm on 2026-08-28, ahead of
  0.2.9; it carries the managed-instructions packaging defect described in
  the 0.2.9 section below (a fresh install wrote `This project uses Quest
  CLI 0.2.7`) and was superseded within the same day when 0.2.9 became
  `latest`. No git tag or GitHub Release exists for 0.2.8.
- Publication authority: the package owner ran the npm one-time-password
  publish/promotion steps directly; the Worker performed no registry write.

## Release identity

- npm package: `@opum-ai/quest@0.1.0` was the initial publication, with
  dist-tag `latest` = `0.1.0` at that time. `latest` has since moved to
  `0.2.9` — see "Current publication state" above.
- Repository: `https://github.com/opum-ai/quest-cli.git`.
- Reviewed source commit: `f89ad168515b9ae811d2bf0d6a54c2a5a7f58d37`
  (PR #104 merge to `dev`).
- Qualification: GitHub Actions prepublication run `31977086471` passed its
  source gates and every immutable native candidate: darwin, linux, and
  win32 on arm64 and x64.
- Publication authority: the owner explicitly authorized QCLI-95 on
  2026-08-17. The package was published only after a fresh registry-name,
  repository-identity, Lore release, metadata, and checksum recheck.

## Immutable artifacts

The following SHA-256 values identify the tarballs supplied to npm. The npm
`dist.shasum` and `dist.integrity` observations matched the values generated
for those tarballs at publication.

| Package | Tarball SHA-256 | npm integrity |
| --- | --- | --- |
| `@opum-ai/quest@0.1.0` | `4207136eea13f9c9813a524e46f3636b6cee4515c72c0593433cdb9841e4fb82` | `sha512-146jnw6PPsuB/P3iZesuDH1CKrZB3aow3WjYWxU3Y7IVP2zI19xd6fWBKyF96gbC52T86NWQdDeftxvsurU4sQ==` |
| `@opum-ai/quest-darwin-arm64@0.1.0` | `6c0ada5be7a5dde52f051778d244fcefe70e421a87981c002b48be4824052af3` | `sha512-2l3oMriTyXl7N4RZeoXkuQ0DY6r7/mAf3DNcvcYvNLrLo/L2z54vA+fb8g7G4cRqeu5bEIidI72mYTB0joCOrg==` |
| `@opum-ai/quest-darwin-x64@0.1.0` | `89039629c950a4183bf69a979de77bccebade7c2b8b4259100511821e9534bd9` | `sha512-v40hRHzGPDL7laW7fcYhJGQAWCBGr+gGV2Wwze7tzFK1UJuRxEF+1ZA0S3AJhzIPilvusTewg+g9ATtsL0WW8w==` |
| `@opum-ai/quest-linux-arm64@0.1.0` | `b77707dfd5cd0e7371e3849c730efb7320742426db2536c68843380c88e6ae00` | `sha512-mFMiLe0m94k3tAmpFj7ETBSBLx9mmr3nNT7rYxFgZ4wwpNbRb2AJQgNCzJJ4WGyi9G6roL6Ow9J2ZGardJVxZA==` |
| `@opum-ai/quest-linux-x64@0.1.0` | `905eba2b2e47314f8c5fa025b74b930da61bda8f181512ae3fb373e8dbb24a8a` | `sha512-T+29LB0EdRoUk0uZzCyH/bMA15QbymyFW3R6vySkjX3fPErCNbdnVtn2BS42qJO4GrSQgaLiGQKlOHvmOFEo5Q==` |
| `@opum-ai/quest-win32-arm64@0.1.0` | `683dce29320475c67907938748e6646b0126eef21a56d52751e0bac115f0d1b0` | `sha512-0wkzENRukZwp1r1lrZBucEA7hVl3nUaliySLshw/G4sZk3+PcD83LpwtmCImx78WeidUIvVTl3JEE5FQEeyc2Q==` |
| `@opum-ai/quest-win32-x64@0.1.0` | `491008a2938feb107ba2bb9fdcd735863daf3d3814d7a52d37fca2ac5b07c531` | `sha512-YquRERVf3tRzzR5BzdUN0L8ZAkm27z+dq0Z3Anh8d4f3/Z76ufZ4uRJhfC8O+zFuI7pKM45XQZqLp+BrNRbXdA==` |

The published platform binary SHA-256 values match the root launcher's pinned
platform map: darwin-arm64 `62af021a1efcdab9600e4e066f3593fd35f8c1aa19d0a003d388d1f8d93e4e2c`,
darwin-x64 `f1cfbede30b2ec1a4588c7b5150d6741e6f0fd5aab8bf15df69250f4a26baa93`,
linux-arm64 `4ca3d2902029271d5d1ed209e77c358b4f01014ec8ed759e8c3ddf94c908008c`,
linux-x64 `17fbbda05cf8fcf7652cb19c37aee90630b9c048a8fff332a5c37cc706c7f847`,
win32-arm64 `8a9b0a21921b02dbb60fb5abb214d69ee1c67ab152a1c4ef6081231292c9609d`,
and win32-x64 `50d84e1b1d43469fbcc2564e62cb00b7bc14e87594acf0df0b938b3ce689d3f4`.

## Registry verification

A clean temporary install of `@opum-ai/quest@0.1.0` fetched the published
darwin-arm64 package; its installed native binary matched the pinned SHA-256.
The installed launcher then passed `--version`, `manifest --json`, an
actor-declared `task create` plus `task list`, `sqlite-smoke --json`, and
`migration-smoke --json`. The latter reported `removed: 1`. The other five
registry platform tarballs have the same integrity values as the six candidate
artifacts that passed the cross-platform qualification run above.

## Install

Install the public launcher with:

```sh
npm install --global @opum-ai/quest@0.1.0
quest --version
```

If a platform package cannot be selected for the current OS/CPU, Quest reports
the missing optional package rather than substituting a different native
artifact.

## Unpublished 0.2.7 qualification candidate

Quest 0.2.7 is a local qualification candidate, not an npm release. Registry
publication remains unauthorized. Source and lifecycle qualification are in
commit `5f94475`, and commit `436f4f6` contains the checksum-coupled root
manifest plus all six rebuilt Bun 1.3.14 platform artifacts.

The seven locally packed tarballs have these SHA-256 values:

| Package | Local tarball SHA-256 |
| --- | --- |
| `@opum-ai/quest@0.2.7` | `f189a51af13a9ee2f45fc01b2f9de312c6aa36fdb3d6820889a51abbabffb50d` |
| `@opum-ai/quest-darwin-arm64@0.2.7` | `4d95674989908f4248811544b1c8f53d45ee2053bbfc2c550d7f876b6b9d20ce` |
| `@opum-ai/quest-darwin-x64@0.2.7` | `3fd1e830af495da569d7b5eb59af2dcea6ea245e7ca03123821a39a50ec4b666` |
| `@opum-ai/quest-linux-arm64@0.2.7` | `f61d0ddbdf51934e55d4dea2b20e3aec988ecd60e3a75c05aab16fd669742bf3` |
| `@opum-ai/quest-linux-x64@0.2.7` | `782f355a53bc0ccecd7615689466da272d53c44848e50a869ac7cd16fe436def` |
| `@opum-ai/quest-win32-arm64@0.2.7` | `29f820e83fa070132117841d09ab86045a7600cca6329686b86a2d5908d95097` |
| `@opum-ai/quest-win32-x64@0.2.7` | `12670156d3c20793c3e0292d93c1d7290e24e9d9e97a7ab937cca35fde496ed7` |

The corresponding native binary SHA-256 values pinned by the root launcher
are darwin-arm64 `76e86cf02c6aa19ac1da9df4452f24f47bc78c1f397bf68e8e9a9722273e697c`,
darwin-x64 `63d7300f36bd019008cd4cb9ab0fbf672a24f7cb8266745ea29dd4cc2aeab563`,
linux-arm64 `358e025526db1752d602e55d48a91ee4657b13eea4784ddfb048f536af9bc298`,
linux-x64 `8e19e4d805c1d6361d94254c3e35b2a8400d913e1da73b1d3545af469a7d9c18`,
win32-arm64 `852686918ff213a83ff998c1ca878b093ac724e765bcbcea92fc868552ea39ff`,
and win32-x64 `00d3af956e1a54154d85fb680e06ad2ba7c8ebb52c51686ffc5e7295dc9578b1`.

A clean install from the root and darwin-arm64 tarballs passed the shared
black-box migration qualification. It proved `quest --version` reports 0.2.7;
the schema-1 manifest exposes preview, apply, status, and rollback with their
exact kinds and mutability; actor-free apply and rollback both return denied
exit 4; and preview, apply, dotted legacy aliases including `LCLI-315.4`,
status, and rollback complete successfully.

The same root and darwin-arm64 tarballs were then installed under the user npm
prefix. After removal of the two stale NVM Quest symlinks,
`command -v quest` resolved `/Users/jdnewhouse/.local/bin/quest`; its launcher
and native binary realpaths both remained under
`/Users/jdnewhouse/.local/lib/node_modules/@opum-ai/`, and `quest --version`
reported 0.2.7. The active-path shared qualification repeated the exact
manifest, actor-denial, alias, preview, apply, status, and rollback proof with
the source commit, artifact commit, tarball hashes, and installed realpaths in
its evidence. This is installed local-artifact qualification only and does not
represent npm publication.

## 0.2.9 corrective release

Quest 0.2.9 was qualified as a local corrective candidate and is now
published on npm as of 2026-08-28 — see "Current publication state" above
for dist-tag, GitHub Release, and authorization evidence. It corrects the
shipped 0.2.8 packaging
defect in which the committed platform bundles carried a hand-synced managed
instructions template (a fresh registry install of 0.2.8 wrote `This project
uses Quest CLI 0.2.7`); the managed-instructions template and drift message
now derive from the single `QUEST_VERSION` constant consumed by the CLI and
cannot drift from the release version. Source is PR #158 (merge commit
`75c214d`), tree `fb25b6cca31f5cb3dc0aeae9eb2127cb35b6bfba`; all thirteen
required GitHub checks passed, including the per-platform qualification
matrix and the packed-seam assertions that installed tarballs must write the
package version via `agents --update-instructions` and pass
`agents --check --require-installed`.

The seven locally packed tarballs have these SHA-256 values:

| Package | Local tarball SHA-256 |
| --- | --- |
| `@opum-ai/quest@0.2.9` | `48cc78674b0eb4b6fd9f3ba5a877b6523d86843255ad524b43cc723a3e195039` |
| `@opum-ai/quest-darwin-arm64@0.2.9` | `00e4f490b00476fb69ff3e714311b05690344dd5dd5d9d665673e0ac089ea982` |
| `@opum-ai/quest-darwin-x64@0.2.9` | `5e6aa19198cf97dea95e1b9e8d53788effe43f005bed64ad4a83231d1ca0aaef` |
| `@opum-ai/quest-linux-arm64@0.2.9` | `3185eac7251660b13d31473b5e87b70949d79cb6121b4665ec9d43f159273b36` |
| `@opum-ai/quest-linux-x64@0.2.9` | `ffe924e2c08a295536358dcea38fe85813284eb13d1c6ad809bb944965cffbef` |
| `@opum-ai/quest-win32-arm64@0.2.9` | `73cb516faad241189633f3848e38b5cb16855edd45fedf26b718697f7d3276f8` |
| `@opum-ai/quest-win32-x64@0.2.9` | `1e900e13014a395cd7cfd32c6995dc2f57fd363dca0095a37fcca178ed34cee5` |

npm shasum and SRI integrity for every tarball are recorded beside these
values in the candidate evidence metadata. A clean isolated install of the
root and darwin-arm64 tarballs proved the root launcher, the node launcher,
and the native binary all report 0.2.9; `agents --update-instructions`
writes `This project uses Quest CLI 0.2.9`;
`agents --check --require-installed` exits 0; `instructions --json` reports
version 0.2.9; and the launcher's missing-platform diagnostic is intact.
This was local-artifact qualification evidence gathered before publication;
the same artifacts are now the published 0.2.9 packages — see "Current
publication state" above.
