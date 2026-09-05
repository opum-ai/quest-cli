---
type: llm
weight: 1
---

A user asked how to open a tracked task for a bug, record its repro, and
later check off acceptance criteria. This is exactly the situation the quest
skill exists for: a project that tracks work through the `quest` CLI rather
than a hand-maintained issue list or ad-hoc notes.

A successful response recommends driving this through `quest` rather than
proposing to write the bug into a markdown file, a TODO comment, or some
other hand-maintained tracker — specifically, it should point at
`quest task create` (or equivalent) to open the task and
`quest task edit --check-ac`/`quest task complete` (or equivalent) for the
later acceptance-criteria/completion step, rather than inventing its own
tracking mechanism. It's fine for the response to first check whether the
workspace is Quest-initialized, ask a clarifying question, or point at
`quest instructions overview`/`quest help` for the exact commands — what
matters is that it steers toward the quest CLI's own commands for creating
and updating a task, not a hand-maintained substitute.

Fail the response if it proposes tracking the bug in a plain file, comment,
or ad-hoc note with no mention of a `quest` command that does this.
