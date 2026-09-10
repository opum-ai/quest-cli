# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities privately — do **not** open a public issue.

- Preferred: GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability)
  ("Report a vulnerability" under the repository's **Security** tab).
- Or email **jeremy.newhouse@salientdata.ai**.

We will acknowledge your report and work with you on a fix and coordinated disclosure.

## Secrets & tokens

`quest` never stores or reads credentials. It has no external-service
integration, no API token, and no environment variable carrying a secret —
its only external interaction is the local `git` binary on `PATH`, invoked
for ordinary read/write operations against the current worktree.

`.quest/` — task, draft, decision, and milestone records — is committed to
Git and must contain **no secrets**, only task content and actor/accountable-
human identifiers (session ids, usernames). Those identifiers are provenance,
not credentials; do not put a token, password, or private key in a task
field, comment, or implementation note.

## Scope & supported versions

`quest` is pre-1.0; security fixes target the latest release on `main`. As
`quest` operates directly on the Git worktree it is run in (reading and
writing `.quest/`), keep it updated to a current release, and review the
[Git/filesystem and concurrency threat model](docs/reference/quest-cli-git-filesystem-and-concurrency-threat-model.md)
if you are integrating `quest` into automation that writes to a shared
repository.
