import { createHash } from "node:crypto";

import type { MigrationSourceRecord } from "../../../domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../../domain/records.ts";

const unsupportedFields = [
  "attachments",
  "worklogs",
  "changelog",
  "boards",
  "sprints",
] as const;

const issueFields = [
  "summary",
  "status",
  "priority",
  "issuetype",
  "parent",
  "issuelinks",
  "fixVersions",
  "versions",
  "labels",
  "reporter",
  "assignee",
  "creator",
  "created",
  "updated",
  "resolutiondate",
  "description",
].join(",");

export type JiraDiagnosticKind =
  | "not_found"
  | "denied"
  | "validation"
  | "conflict"
  | "transport";

export class JiraImportError extends Error {
  constructor(
    readonly kind: JiraDiagnosticKind,
    message: string,
    readonly issueKey?: string,
  ) {
    super(message);
  }
}

export interface JiraCliResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

/** The only integration seam: callers provide argv, never credentials or HTTP. */
export interface JiraCliRunner {
  run(argv: readonly string[]): Promise<JiraCliResult>;
}

export interface JiraImporterOptions {
  readonly project: string;
  /** Every encountered Jira status must have an explicit target lifecycle mapping. */
  readonly statusMappings: Readonly<Record<string, string>>;
  readonly jql?: string;
  readonly profile?: string;
  readonly maxResults?: number;
}

export interface JiraPerson {
  readonly accountId?: string;
  readonly displayName?: string;
  readonly emailAddress?: string;
}

export interface JiraComment {
  readonly id: string;
  readonly author?: JiraPerson;
  readonly body: string;
  readonly created?: string;
  readonly updated?: string;
}

export interface JiraImportRecord extends MigrationSourceRecord {
  readonly issueId: string;
  readonly issueKey: string;
  readonly project: string;
  readonly summary: string;
  readonly status?: string;
  readonly mappedStatus?: string;
  readonly priority?: string;
  readonly issueType?: string;
  readonly parent?: { readonly id?: string; readonly key?: string };
  readonly links: readonly unknown[];
  readonly fixVersions: readonly unknown[];
  readonly affectsVersions: readonly unknown[];
  readonly labels: readonly string[];
  readonly reporter?: JiraPerson;
  readonly assignee?: JiraPerson;
  readonly creator?: JiraPerson;
  readonly created?: string;
  readonly updated?: string;
  readonly resolved?: string;
  /** jira-cli's normalized public text only; ADF objects are rejected. */
  readonly description?: string;
  readonly comments: readonly JiraComment[];
  readonly unsupportedFields: readonly (typeof unsupportedFields)[number][];
}

export interface JiraImportSnapshot {
  readonly sourceInstance: string;
  readonly fingerprint: string;
  readonly records: readonly JiraImportRecord[];
  readonly unsupportedFields: readonly (typeof unsupportedFields)[number][];
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

function object(value: unknown, code: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new RecordValidationError(code);
  return value as Record<string, unknown>;
}

function string(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

function list(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function person(value: unknown): JiraPerson | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;
  const source = value as Record<string, unknown>;
  const result = {
    ...(string(source.accountId)
      ? { accountId: string(source.accountId) }
      : {}),
    ...(string(source.displayName)
      ? { displayName: string(source.displayName) }
      : {}),
    ...(string(source.emailAddress)
      ? { emailAddress: string(source.emailAddress) }
      : {}),
  };
  return Object.keys(result).length ? result : undefined;
}

function normalizedText(value: unknown, code: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") throw new RecordValidationError(code);
  return value;
}

function classify(result: JiraCliResult, issueKey?: string): JiraImportError {
  const output = `${result.stderr}\n${result.stdout}`.toLowerCase();
  const kind: JiraDiagnosticKind = /not found|does not exist/.test(output)
    ? "not_found"
    : /forbidden|permission|unauthorized|denied/.test(output)
      ? "denied"
      : /invalid|validation|bad request/.test(output)
        ? "validation"
        : /conflict|changed snapshot/.test(output)
          ? "conflict"
          : "transport";
  return new JiraImportError(kind, `jira_cli_${kind}`, issueKey);
}

class BunJiraCliRunner implements JiraCliRunner {
  async run(argv: readonly string[]): Promise<JiraCliResult> {
    const process = Bun.spawn([...argv], { stdout: "pipe", stderr: "pipe" });
    await process.exited;
    return {
      exitCode: process.exitCode ?? 1,
      stdout: await new Response(process.stdout).text(),
      stderr: await new Response(process.stderr).text(),
    };
  }
}

/** Read-only Jira Cloud source adapter through jira-cli's documented JSON argv contract. */
export class JiraImporter {
  private readonly maxResults: number;
  private readonly jql: string;
  private readonly runner: JiraCliRunner;

  constructor(
    private readonly options: JiraImporterOptions,
    runner?: JiraCliRunner,
  ) {
    if (!options.project)
      throw new RecordValidationError("jira_project_invalid");
    if (!options.statusMappings)
      throw new RecordValidationError("jira_status_mappings_required");
    this.maxResults = options.maxResults ?? 50;
    if (!Number.isInteger(this.maxResults) || this.maxResults < 1)
      throw new RecordValidationError("jira_max_results_invalid");
    this.jql = options.jql ?? `project = ${options.project}`;
    this.runner = runner ?? new BunJiraCliRunner();
  }

  private argv(args: readonly string[]): readonly string[] {
    return [
      "jira",
      ...args,
      ...(this.options.profile ? ["--profile", this.options.profile] : []),
    ];
  }

  private async json(
    argv: readonly string[],
    issueKey?: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.runner.run(this.argv(argv));
    if (result.exitCode !== 0) throw classify(result, issueKey);
    try {
      const payload = object(
        JSON.parse(result.stdout),
        "jira_cli_json_invalid",
      );
      if (payload.success === false)
        throw classify({ ...result, exitCode: result.exitCode || 1 }, issueKey);
      if (payload.success === true)
        return object(payload.data, "jira_cli_data_invalid");
      throw new RecordValidationError("jira_cli_envelope_invalid");
    } catch (error) {
      if (error instanceof RecordValidationError) throw error;
      throw new JiraImportError("transport", "jira_cli_json_invalid", issueKey);
    }
  }

  private async comments(issueKey: string): Promise<readonly JiraComment[]> {
    const comments: JiraComment[] = [];
    const starts = new Set<number>();
    let startAt = 0;
    while (true) {
      if (starts.has(startAt))
        throw new RecordConflictError("jira_comment_page_repeated");
      starts.add(startAt);
      const page = await this.json(
        [
          "comment",
          "list",
          issueKey,
          "--max-results",
          String(this.maxResults),
          "--start-at",
          String(startAt),
        ],
        issueKey,
      );
      for (const row of list(page.comments)) {
        const comment = object(row, "jira_comment_invalid");
        const id = string(comment.id);
        if (!id)
          throw new RecordValidationError("jira_comment_identity_invalid");
        comments.push({
          id,
          author: person(comment.author),
          body:
            normalizedText(comment.body, "jira_comment_adf_not_normalized") ??
            "",
          created: string(comment.created),
          updated: string(comment.updated),
        });
      }
      const total = page.total;
      if (typeof total !== "number" || !Number.isFinite(total)) break;
      const next = startAt + list(page.comments).length;
      if (next >= total) break;
      if (next === startAt)
        throw new RecordConflictError("jira_comment_page_stalled");
      startAt = next;
    }
    return comments;
  }

  async readSnapshot(): Promise<JiraImportSnapshot> {
    const issues: JiraImportRecord[] = [];
    const tokens = new Set<string>();
    let token: string | undefined;
    while (true) {
      if (token) {
        if (tokens.has(token))
          throw new RecordConflictError("jira_issue_page_repeated");
        tokens.add(token);
      }
      const page = await this.json([
        "issue",
        "search",
        "--jql",
        this.jql,
        "--fields",
        issueFields,
        "--max-results",
        String(this.maxResults),
        ...(token ? ["--next-page-token", token] : []),
      ]);
      for (const row of list(page.issues)) {
        const issue = object(row, "jira_issue_invalid");
        const fields = object(issue.fields, "jira_issue_fields_invalid");
        const issueId = string(issue.id);
        const issueKey = string(issue.key);
        const summary = string(fields.summary);
        if (!issueId || !issueKey || !summary)
          throw new RecordValidationError("jira_issue_identity_invalid");
        const parentValue = fields.parent;
        const parent =
          parentValue &&
          typeof parentValue === "object" &&
          !Array.isArray(parentValue)
            ? {
                id: string((parentValue as Record<string, unknown>).id),
                key: string((parentValue as Record<string, unknown>).key),
              }
            : undefined;
        const status = string(
          (fields.status as Record<string, unknown> | undefined)?.name,
        );
        const mappedStatus = status
          ? this.options.statusMappings[status]
          : undefined;
        if (!status || !mappedStatus)
          throw new RecordValidationError("jira_status_mapping_incomplete");
        const record = {
          sourceInstance: `jira:${this.options.project}`,
          sourceFolder: this.options.project,
          sourceIdentifier: issueId,
          issueId,
          issueKey,
          project: this.options.project,
          summary,
          status,
          mappedStatus,
          priority: string(
            (fields.priority as Record<string, unknown> | undefined)?.name,
          ),
          issueType: string(
            (fields.issuetype as Record<string, unknown> | undefined)?.name,
          ),
          ...(parent ? { parent } : {}),
          links: list(fields.issuelinks),
          fixVersions: list(fields.fixVersions),
          affectsVersions: list(fields.versions),
          labels: list(fields.labels).filter(
            (item): item is string => typeof item === "string",
          ),
          reporter: person(fields.reporter),
          assignee: person(fields.assignee),
          creator: person(fields.creator),
          created: string(fields.created),
          updated: string(fields.updated),
          resolved: string(fields.resolutiondate),
          description: normalizedText(
            fields.description,
            "jira_description_adf_not_normalized",
          ),
          comments: await this.comments(issueKey),
          unsupportedFields,
        };
        issues.push({ ...record, contentFingerprint: hash(canonical(record)) });
      }
      const next = string(page.nextPageToken);
      if (!next) break;
      token = next;
    }
    const records = issues.sort((left, right) =>
      left.issueKey.localeCompare(right.issueKey),
    );
    return {
      sourceInstance: `jira:${this.options.project}`,
      fingerprint: hash(canonical(records)),
      records,
      unsupportedFields,
    };
  }
}
