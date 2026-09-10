## Summary

What does this PR change, and why? Link the Quest task (e.g. `QCLI-12`) and any
relevant `docs/` concept or ADR.

## Type of change

- [ ] feat
- [ ] fix
- [ ] docs
- [ ] refactor / chore
- [ ] test

## Checklist

- [ ] Targets the `dev` branch.
- [ ] Conventional Commit messages.
- [ ] `bun run check` passes (typecheck, lint, format, layer boundaries, full test suite).
- [ ] `lore check` passes if `docs/` changed.
- [ ] New behavior is tested and documented; CLI commands support `--plain` and `--json`,
      exit with the correct semantic exit code, and are idempotent.
- [ ] Every write path declares an explicit actor (`--actor`/`--actor-kind`, plus
      `--accountable-human` for a `delegated-agent`).
- [ ] Updated `CHANGELOG.md` under the in-progress version section.
