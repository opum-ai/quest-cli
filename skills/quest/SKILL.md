---
name: quest
description: "Drive this repo's task tracker with the quest CLI instead of editing backlog/tracker state directly. Use whenever creating, listing, viewing, editing, completing, or archiving tasks, drafts, milestones, or decisions in a Quest-initialized workspace. Run `quest instructions --list` for the workflow guides and `quest help [command]` for full usage."
---

# quest — tracker CLI

This skill is a pointer, not a manual, installed from the `opum-quest` Claude Code
plugin rather than generated into this repository. The guidance ships inside the CLI,
so it cannot drift from the release you have installed:

- `quest instructions --list` — the workflow guides, one line each.
- `quest instructions overview` — start here.
- `quest instructions` — the versioned protocol block Quest manages in this project's
  agent-instructions file (CLAUDE.md or AGENTS.md, depending on how this repository
  configured `quest agents --update-instructions`).
- `quest help [command]` — exact flags; `quest manifest --json` for the machine registry.

Drive tracker state through `quest`, never by editing `.quest/` by hand.
