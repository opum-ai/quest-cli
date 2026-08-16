import { createHash } from "node:crypto";
import { readdir, realpath } from "node:fs/promises";
import { join, relative } from "node:path";

import * as yaml from "js-yaml";

import type { MigrationSourceSnapshot } from "../../../application/migration/migration.ts";
import type { MigrationSourceRecord } from "../../../domain/migration/migration.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../../domain/records.ts";

export type BacklogLifecycleFolder =
  | "active"
  | "completed"
  | "draft"
  | "archive/tasks"
  | "archive/drafts";

export interface BacklogCriterion {
  readonly index: number;
  readonly text: string;
  readonly checked: boolean;
}

export interface BacklogComment {
  readonly index: number;
  readonly body: string;
  readonly author?: string;
  readonly createdAt?: string;
}

export interface BacklogGitProvenance {
  /** The source HEAD observed during this read, if the source is a Git repository. */
  readonly commit?: string;
  /** The tracked Git blob for this exact path, if one is present in the index. */
  readonly blob?: string;
}

/**
 * The complete current-state payload. `rawMarkdown` intentionally remains part
 * of the adapter result so fields not yet modeled by Quest are not discarded.
 * This is a snapshot, not an event reconstruction.
 */
export interface BacklogImportRecord extends MigrationSourceRecord {
  readonly lifecycleFolder: BacklogLifecycleFolder;
  readonly sourcePath: string;
  readonly rawMarkdown: string;
  readonly aliases: readonly string[];
  readonly git: BacklogGitProvenance;
  readonly title: string;
  readonly status?: string;
  readonly priority?: string;
  readonly type?: string;
  readonly assignees: readonly string[];
  readonly labels: readonly string[];
  readonly ordinal?: number;
  readonly parentTaskId?: string;
  readonly dependencies: readonly string[];
  readonly milestone?: string;
  readonly acceptanceCriteria: readonly BacklogCriterion[];
  readonly definitionOfDone: readonly BacklogCriterion[];
  readonly implementationPlan?: string;
  readonly implementationNotes?: string;
  readonly finalSummary?: string;
  readonly comments: readonly BacklogComment[];
  readonly references: readonly string[];
  readonly documentation: readonly string[];
  readonly modifiedFiles: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface BacklogImportSnapshot extends MigrationSourceSnapshot {
  readonly records: readonly BacklogImportRecord[];
  /** IDs duplicated across lifecycle folders; they are reported, never resolved. */
  readonly crossFolderDuplicateIds: readonly string[];
}

const folders: readonly [BacklogLifecycleFolder, string][] = [
  ["active", "tasks"],
  ["completed", "completed"],
  ["draft", "drafts"],
  ["archive/tasks", "archive/tasks"],
  ["archive/drafts", "archive/drafts"],
];

function hash(value: Uint8Array | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function list(value: unknown): readonly string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length ? value : undefined;
}

function number(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function section(markdown: string, name: string): string | undefined {
  const match = markdown.match(
    new RegExp(
      `<!-- SECTION:${name}:BEGIN -->\\r?\\n?([\\s\\S]*?)\\r?\\n?<!-- SECTION:${name}:END -->`,
    ),
  );
  return match?.[1] || undefined;
}

function criteria(
  markdown: string,
  marker: "AC" | "DOD",
): readonly BacklogCriterion[] {
  const match = markdown.match(
    new RegExp(
      `<!-- ${marker}:BEGIN -->\\r?\\n?([\\s\\S]*?)\\r?\\n?<!-- ${marker}:END -->`,
    ),
  );
  if (!match) return [];
  return [...match[1].matchAll(/^- \[([ xX])\] #(\d+)\s+(.*)$/gm)].map(
    (item) => ({
      index: Number(item[2]),
      text: item[3] ?? "",
      checked: item[1]?.toLowerCase() === "x",
    }),
  );
}

function comments(markdown: string): readonly BacklogComment[] {
  const match = markdown.match(
    /<!-- COMMENTS:BEGIN -->\r?\n?([\s\S]*?)\r?\n?<!-- COMMENTS:END -->/,
  );
  if (!match) return [];
  const blocks = match[1]
    .replace(/\r?\n---\s*$/, "")
    .split(/\r?\n---\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks
    .filter((_, index) => index % 2 === 0)
    .map((header, index) => {
      const body = blocks[index * 2 + 1] ?? "";
      const author = header.match(/^author:\s*(.+)$/m)?.[1]?.trim();
      const createdAt = header.match(/^created:\s*(.+)$/m)?.[1]?.trim();
      return {
        index: index + 1,
        body: body.trim(),
        ...(author ? { author } : {}),
        ...(createdAt ? { createdAt } : {}),
      };
    });
}

function frontmatter(markdown: string): {
  readonly values: Record<string, unknown>;
  readonly body: string;
} {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match)
    throw new RecordValidationError("backlog_record_frontmatter_missing");
  const parsed = yaml.load(match[1] ?? "");
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new RecordValidationError("backlog_record_frontmatter_invalid");
  return { values: parsed as Record<string, unknown>, body: match[2] ?? "" };
}

async function git(
  root: string,
  sourcePath: string,
): Promise<BacklogGitProvenance> {
  const run = (directory: string, args: readonly string[]) =>
    Bun.spawn(["git", "-C", directory, ...args], {
      stdout: "pipe",
      stderr: "pipe",
    });
  const topLevel = run(root, ["rev-parse", "--show-toplevel"]);
  await topLevel.exited;
  if (topLevel.exitCode !== 0) return {};
  const repositoryRoot = (await new Response(topLevel.stdout).text()).trim();
  const commit = run(repositoryRoot, ["rev-parse", "HEAD"]);
  await commit.exited;
  if (commit.exitCode !== 0) return {};
  const commitHash = (await new Response(commit.stdout).text()).trim();
  const blob = run(repositoryRoot, [
    "ls-files",
    "-s",
    "--",
    relative(repositoryRoot, join(root, sourcePath)),
  ]);
  await blob.exited;
  const output = (await new Response(blob.stdout).text()).trim();
  const matched = output.match(/^\d+\s+([0-9a-f]+)\s+\d+\t/);
  return { commit: commitHash, ...(matched?.[1] ? { blob: matched[1] } : {}) };
}

/** A read-only Backlog.md current-state adapter; it never invokes the Backlog CLI. */
export class BacklogImporter {
  constructor(private readonly sourceRoot: string) {}

  async readSnapshot(): Promise<BacklogImportSnapshot> {
    const root = await realpath(this.sourceRoot);
    const sourceInstance = `backlog:${root}`;
    const rows: {
      lifecycleFolder: BacklogLifecycleFolder;
      sourcePath: string;
      bytes: Uint8Array;
    }[] = [];
    for (const [lifecycleFolder, directory] of folders) {
      const absolute = join(root, "backlog", directory);
      let entries: readonly string[];
      try {
        entries = (await readdir(absolute))
          .filter((entry) => entry.endsWith(".md"))
          .sort();
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      for (const entry of entries) {
        const sourcePath = relative(root, join(absolute, entry));
        rows.push({
          lifecycleFolder,
          sourcePath,
          bytes: new Uint8Array(
            await Bun.file(join(absolute, entry)).arrayBuffer(),
          ),
        });
      }
    }
    const sourceFingerprint = hash(
      rows
        .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath))
        .map((row) => `${row.sourcePath}\u0000${hash(row.bytes)}`)
        .join("\n"),
    );
    const parsed = await Promise.all(
      rows.map(async (row) => {
        const rawMarkdown = new TextDecoder("utf-8", { fatal: true }).decode(
          row.bytes,
        );
        const { values, body } = frontmatter(rawMarkdown);
        const sourceIdentifier = text(values.id);
        const title = text(values.title);
        if (!sourceIdentifier || !title)
          throw new RecordValidationError("backlog_record_identity_invalid");
        const assignees = list(values.assignee ?? values.assignees);
        return {
          sourceInstance,
          sourceFolder: row.lifecycleFolder,
          sourceIdentifier,
          lifecycleFolder: row.lifecycleFolder,
          sourcePath: row.sourcePath,
          rawMarkdown,
          contentFingerprint: hash(row.bytes),
          git: await git(root, row.sourcePath),
          title,
          status: text(values.status),
          priority: text(values.priority),
          type: text(values.type),
          assignees,
          labels: list(values.labels),
          ordinal: number(values.ordinal),
          parentTaskId: text(
            values.parent_task_id ?? values.parentTaskId ?? values.parent,
          ),
          dependencies: list(values.dependencies),
          milestone: text(values.milestone),
          acceptanceCriteria: criteria(body, "AC"),
          definitionOfDone: criteria(body, "DOD"),
          implementationPlan: section(body, "PLAN"),
          implementationNotes: section(body, "NOTES"),
          finalSummary: section(body, "FINAL_SUMMARY"),
          comments: comments(body),
          references: list(values.references),
          documentation: list(values.documentation),
          modifiedFiles: list(values.modified_files ?? values.modifiedFiles),
          createdAt: text(values.created_date ?? values.createdAt),
          updatedAt: text(values.updated_date ?? values.updatedAt),
        };
      }),
    );
    const ids = new Map<string, number>();
    for (const record of parsed)
      ids.set(
        record.sourceIdentifier,
        (ids.get(record.sourceIdentifier) ?? 0) + 1,
      );
    const crossFolderDuplicateIds = [...ids]
      .filter(([, count]) => count > 1)
      .map(([id]) => id)
      .sort();
    const records: readonly BacklogImportRecord[] = parsed
      .map((record) => ({
        ...record,
        // Always retain an unambiguous, source-instance-qualified alias.
        aliases: [
          `backlog:${record.sourceInstance.slice("backlog:".length)}:${record.sourceFolder}:${record.sourceIdentifier}`,
          ...(ids.get(record.sourceIdentifier) === 1
            ? [record.sourceIdentifier]
            : []),
        ],
      }))
      .sort(
        (left, right) =>
          [
            left.sourceFolder.localeCompare(right.sourceFolder),
            left.sourceIdentifier.localeCompare(right.sourceIdentifier),
            left.sourcePath.localeCompare(right.sourcePath),
          ].find((item) => item !== 0) ?? 0,
      );
    return {
      sourceInstance,
      fingerprint: sourceFingerprint,
      records,
      crossFolderDuplicateIds,
    };
  }
}

/** Rejects collision-bearing snapshots before a caller can claim a clean migration. */
export function assertNoBacklogCrossFolderCollisions(
  snapshot: BacklogImportSnapshot,
): void {
  if (snapshot.crossFolderDuplicateIds.length)
    throw new RecordConflictError("backlog_cross_folder_duplicate_id");
}
