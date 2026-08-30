---
id: QCLI-151
title: quest instructions emits two envelope kinds the manifest never declares
status: Done
assignee:
  - '@quest-cli'
created_date: '2026-08-30 00:22'
updated_date: '2026-08-30 01:03'
labels: []
dependencies: []
references:
  - 'src/cli/main.ts:747'
  - 'src/cli/main.ts:773'
  - 'src/application/command-contract.ts:134'
priority: medium
type: bug
ordinal: 182000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
QCLI-141 added two output modes to 'quest instructions' but did not extend the manifest's kind declaration.

'quest instructions --list' emits kind agent.guides (src/cli/main.ts:747) and 'quest instructions <guide>' emits kind agent.guide (src/cli/main.ts:773). The manifest entry for instructions still declares only kind agent.instructions (src/application/command-contract.ts:134). It gained filters and fields for the new modes, but not the kinds.

This is the same contract-vs-implementation class as QCLI-133 and QCLI-137, inverted: there the manifest declared fields the CLI never emitted; here the CLI emits kinds the manifest never declares. A machine consumer that reads the registry to know which envelope to expect - which is exactly what QuestTrackerClient's handshake does for other commands - will reject or mis-branch these two.

Found by independent review of the QCLI-135 branch, out of that task's scope.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The manifest declares every envelope kind quest instructions can emit, in whatever form the contract shape supports for a command with more than one
- [x] #2 A test fails if a command emits a kind its own manifest entry does not declare, generalising past this instance the way manifest-field-coverage did for fields
- [x] #3 The tracker adapter handshake is checked against the instructions command specifically, since it is the consumer the mismatch would break
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Fixed by SPLITTING the manifest entry into three, following the existing 'search' / 'search --all' convention, rather than by adding a 'kinds' array to the contract shape. The three forms emit three envelope kinds, and a consumer reading the registry to learn which envelope to expect must be able to find the entry matching the invocation it is about to make.

The human-facing help entry deliberately stays whole: '--list' is a flag of 'quest instructions', and splitting it out of commandHelp would make 'quest help instructions' stop mentioning it. QCLI-148's guide-command test caught exactly that when I tried it - the guides say 'quest instructions --list' and the flag has to resolve against the base command. So the machine-facing split and the human-facing entry are intentionally different shapes.

AC2 guard: test/contract/manifest-kind-coverage.test.ts is the mirror of manifest-field-coverage.test.ts. That one catches a manifest declaring a field the CLI never emits; this one catches the CLI emitting a kind the manifest never declares. It asserts both that the emitted kind is declared somewhere and that it is declared by the entry a consumer would look up for that specific invocation - the second is the check that failed before this fix. Proven RED by deleting the 'instructions --list' entry.

AC3: the tracker adapter is unaffected and this was confirmed with the lore-cli session directly rather than assumed - 'instructions' is not in lore's REQUIRED_COMMANDS, so verifyManifest never asserts on these kinds. The defect was real for any agent-facing consumer reading the manifest, but it was not breaking the pair.

Verified: bun run check exits 0, 366 tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
quest instructions' three output forms are now three manifest entries, following the existing search / search --all convention, so a machine consumer can find the envelope kind for the invocation it is about to make. The human-facing help entry stays whole so quest help instructions still documents --list. Added test/contract/manifest-kind-coverage.test.ts, the mirror of the field-coverage guard: it fails if a command emits a kind its own manifest entry does not declare. Proven red by deleting an entry; bun run check exits 0 across 366 tests. Confirmed with the lore-cli session that its adapter never asserted on these kinds, so this was a real registry-vs-runtime defect but not a break in the pair.
<!-- SECTION:FINAL_SUMMARY:END -->
