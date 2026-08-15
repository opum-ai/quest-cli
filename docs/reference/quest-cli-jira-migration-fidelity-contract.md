---
# yaml-language-server: $schema=../../.lore/schemas/reference.schema.json
type: Reference
title: Quest CLI Jira migration fidelity contract
tags:
  - quest
  - jira
  - migration
  - fidelity
  - clean-room
summary: Defines Quest's one-way Jira Cloud adoption contract through jira-cli's public process and JSON surface.
timestamp: 2026-08-15T01:25:15.098Z
---

# Quest CLI Jira migration fidelity contract

Quest adopts Jira Cloud data one way through the public `@salient-ai/jira-cli`
process contract. It never reads Jira credentials, calls Jira HTTP APIs, manages
pagination transport, or parses Atlassian Document Format (ADF) itself.

## Details

### Qualified public surface

On 2026-08-15, the installed `jira --version` and npm `version`/`latest` both
reported **1.0.2** (registry modification `2026-08-06T03:01:37.597Z`). The
public help exposes `issue get <issueKey>` with field and expansion selection,
`issue search` with `--jql`, fields, bounded `--max-results`, and
`--next-page-token`, plus paged `comment list` with `--max-results`, `--start-at`,
and ordering. Projects expose versions; links and metadata expose their own public
surfaces. A later version is a requalification trigger.

Credential profiles are a jira-cli concern: Quest supplies a selected subprocess
profile only and treats all credential acquisition, storage, refresh, and HTTP
authentication as outside its trust boundary.

### Core-plus-comments mapping

| Jira public field/surface | Quest migration disposition |
| --- | --- |
| Issue id, key, project, summary | Preserve as source provenance and display metadata; allocate a separate Quest canonical ID |
| Status, priority, issue type, parent/hierarchy | Preserve as mapped lifecycle/type metadata; do not inherit Jira identifiers as Quest identity |
| Issue links, fix/affects versions, labels | Preserve as typed relationships or metadata with source identifiers retained |
| Reporter, assignee, creator, commenters | Preserve opaque source-person references and display fields; never authenticate or authorize from them |
| Created, updated, resolution timestamps | Preserve as source timestamps, never as Quest event timestamps |
| Description and comments | Delegate ADF handling to jira-cli; persist the returned normalized public representation plus source provenance |

### Explicit preview gaps

Attachments, worklogs, changelog history, boards, and sprints are preview gaps.
They must be reported per source issue and never silently approximated, copied by
unapproved API access, or represented as if they had been adopted.

### Deterministic adapter outcomes

Quest invokes jira-cli as a bounded subprocess and classifies its documented output
and exit result into `success`, `not_found`, `denied`, `validation`, `conflict`, or
`transport` diagnostics. A next-page token is replayed only through jira-cli; missing
issues, permission failures, malformed source data, changed snapshots, rate limits, and
transport failures stop or flag the preview rather than yielding partial silent adoption.
The preview remains read-only, carries `requiresApproval: true`, and records a digest
of the source snapshot and mapping before any target-side apply.

### Evidence boundary

This record was derived only from public command help, version output, and npm registry
metadata. It does not inspect a Jira site, credentials, jira-cli implementation source,
or private tests. Fixture goldens must use synthetic public-shaped JSON only.
