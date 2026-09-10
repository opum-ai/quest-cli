# Contributing to quest

Thanks for your interest in `quest` — a deterministic, LLM-free task tracker
CLI that other tools (`lore` included) couple to over JSON, and that coding
agents and humans write to directly.

## Ground rules

- **`quest`'s core is deterministic.** No LLM dependency, no server, no
  database — every command is reproducible, idempotent, and CI/agent-safe.
  New features should preserve that.
- **Every write declares an actor.** `--actor <id> --actor-kind
  human|delegated-agent` (plus `--accountable-human <id>` for a
  `delegated-agent`) is not optional plumbing — it is the provenance contract
  the rest of the system depends on. Do not add a write path that bypasses it.
- **The CLI is the primary interface** for both humans and agents. Every
  command must be non-interactive by default (the guided `quest init` wizard
  is the one deliberate, TTY-gated exception), support `--plain` and
  `--json`, exit with the correct semantic exit code, and be idempotent.
- **`.quest/` is the tracker of record.** Never edit its JSON files directly
  in a fix, a script, or a migration — route every change through the `quest`
  CLI so metadata, relationships, and history stay consistent.

## Development setup

`quest` targets **[Bun](https://bun.sh)** (pinned version — see
`package.json`'s `packageManager` field).

```sh
bun install
bun run check       # typecheck, lint, format:check, layer:check, test
bun test             # test suite alone
bun run typecheck
bun run lint
```

Tasks are tracked with `quest` itself, dogfooded on this repository. Run
`quest instructions overview` and `quest task list --json` before starting —
see [`.claude/skills/quest/SKILL.md`](.claude/skills/quest/SKILL.md) for the
full loop.

## Branching & commits

- Branch from and open pull requests against **`dev`** (the default branch).
  `main` is the release branch, updated only by a fast-forward of a reviewed
  `dev` — never by merging a PR directly into it.
- Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`,
  `fix:`, `docs:`, `chore:`, `refactor:`, `test:` …).
- Keep PRs focused and reference the Quest task id in the branch name
  (`<type>/<TASK-ID>-<short-slug>`, e.g. `fix/QCLI-249-ready-archived-parent`).
  Include tests and update the relevant `docs/` reference (via `lore`, not a
  plain editor) when behavior changes.

## Before you open a PR

- [ ] `bun run check` passes (typecheck, lint, format, layer boundaries,
      full test suite).
- [ ] `lore check` passes if you touched `docs/`.
- [ ] New behavior is covered by tests and, where it changes the command
      surface or contract, documented.
- [ ] Commits follow Conventional Commits and target `dev`.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
