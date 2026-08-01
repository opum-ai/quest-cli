---
name: lore
description: Author and maintain this repository's OKF documentation bundle under docs/ with the Lore CLI. Use whenever Codex reads, writes, links, moves, synchronizes, validates, or checks documentation so Story/Task coupling, managed blocks, and cross-links remain coherent. Run `lore instructions` for the canonical agent loop and its topic subcommands for just-in-time details.
---

# Lore — OKF documentation CLI

Use `lore` as this repository's deterministic, CLI-first documentation engine. Treat
`lore instructions` as the source of truth; this skill is the Codex discovery bridge.

## Start

1. Run `lore instructions`.
2. Read `docs/index.md`, follow the relevant Story, and inspect its coupled task status.
3. Pull only the needed topic instructions: `linking`, `sync`, `check`, or `validation`.
4. Author prose only outside Lore-managed regions.
5. Run `lore sync`, `lore validate --strict`, `lore check --strict`, and
   `git diff --check` after documentation changes.

## Guardrails

- Use `lore new` to create typed concepts.
- Use `lore link` and `lore unlink` for Story/Task coupling.
- Use `lore rename`, `lore replace`, and `lore supersede` instead of manually
  rewriting managed references.
- Do not hand-edit Lore-managed blocks, generated indexes, or generated logs.
- Follow the repository's Backlog workflow independently.
- Prefer `--json` for machine-stable output and `--plain` for readable output.

## Command map

- Authoring: `new`, `replace`, `rename`, `supersede`
- Coupling: `link`, `unlink`, `sync`, `tasks`, `orphans`
- Verification: `validate`, `check`
- Discovery: `query`, `context`, `graph`, `instructions`
- Interchange/setup: `export`, `schema`, `scaffold`, `agents`
