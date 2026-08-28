---
id: QCLI-127
title: quest help prints the raw command manifest instead of human-readable help text
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-28 18:50'
updated_date: '2026-08-28 19:49'
labels:
  - cli
  - help
  - ux
  - docs
dependencies: []
references:
  - src/cli/main.ts
priority: medium
type: bug
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
quest help (src/cli/main.ts, kind help.commands) returns the same command-registry payload as quest manifest: a list of {kind, mutates, name, schemaVersion} per command, with no usage syntax, flag documentation, or examples. Confirmed live on 0.2.9: quest help and quest help --plain both produce the identical shape as quest manifest. A command whose only purpose is human help should print prose a person can read, not the machine registry.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 quest help (default and --plain) prints, for each command, what it does, its flags, and an example invocation, in prose rather than the raw registry fields.
- [x] #2 The machine-oriented registry stays available unchanged through quest manifest for agents and tooling.
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add src/application/command-help.ts exporting commandHelp: a
   Record<CommandManifestEntry["name"], {summary, usage, flags}> covering all
   43 manifest entries. Flags/usage harvested directly from each command's
   `only(parsed, [...])` array and existing usage-failure text in main.ts, so
   they cannot drift from the real accepted flags. Does not touch
   commandManifest/manifestResult (keeps `quest manifest` byte-identical).
2. In src/cli/main.ts's two help-output sites (bare invocation and the
   help/--help/-h branch), merge commandHelp[entry.name] into each rendered
   command entry (`{...entry, ...commandHelp[entry.name]}`) before returning.
   No renderer changes needed: renderHumanPayload already dumps object fields
   as sorted `key: value` lines, so the added summary/usage/flags fields
   become human-readable prose automatically in plain/pretty mode.
3. Add a test asserting `quest help --plain` contains a summary/usage line
   for a sample of commands (e.g. init, task create) and that `quest manifest
   --json` is unchanged (no summary/usage/flags fields leak into it).
4. Run bun test and bun run typecheck before opening the PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added src/application/command-help.ts: summary/usage/flags for all 43 commandManifest entries, harvested directly from each command's own only(parsed, [...]) array in main.ts (not re-typed by hand from memory) so the help text can't silently drift from what the CLI actually accepts. Wired into both quest help output sites (bare invocation and the help/--help/-h branch) via a withHelp() merge helper; commandManifest/manifestResult were never touched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest help (default, --plain, and --json) now prints a summary, usage synopsis, and full flag list per command instead of re-serializing the raw {kind,mutates,name,schemaVersion} registry. quest manifest is untouched and stays byte-identical (verified: manifestJson.data.commands entries have no summary/usage/flags fields). Verified with a new test in test/contract/cli-process.test.ts asserting both the plain-mode prose and the JSON shape, plus the existing help/manifest contract tests (topic filtering, agents' special details block, envelope shape) still pass unchanged. Merged via PR #162 (merge commit b154410); all 13 CI checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
