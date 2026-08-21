import {
  exitCodes,
  type DiagnosticEnvelope,
  type ExitCode,
  type ResultEnvelope,
} from "../domain/command-contract.ts";

export type OutputMode = "json" | "plain" | "pretty";

export interface OutputFlags {
  readonly json?: boolean;
  readonly plain?: boolean;
  readonly stdoutIsTty: boolean;
}

export function selectOutputMode(flags: OutputFlags): OutputMode {
  if (flags.json) return "json";
  if (flags.plain || !flags.stdoutIsTty) return "plain";
  return "pretty";
}

export function success<TData extends object | readonly unknown[]>(
  kind: `${string}.${string}`,
  data: TData,
): ResultEnvelope<TData> {
  return { schemaVersion: 1, kind, data, principal: null };
}

export function diagnostic(
  errorType: DiagnosticEnvelope["error_type"],
  message: string,
  options: Pick<DiagnosticEnvelope, "hint" | "input"> = {},
): DiagnosticEnvelope {
  return { error_type: errorType, message, ...options, principal: null };
}

export function exitCodeFor(
  errorType: DiagnosticEnvelope["error_type"],
): ExitCode {
  switch (errorType) {
    case "uncaught":
      return exitCodes.uncaught;
    case "usage":
      return exitCodes.usage;
    case "not_found":
      return exitCodes.notFound;
    case "denied":
      return exitCodes.denied;
    case "conflict":
      return exitCodes.conflict;
    case "validation":
    case "drift":
      return exitCodes.validationOrDrift;
  }
}

export interface CommandManifestEntry {
  readonly name:
    | "manifest"
    | "version"
    | "help"
    | "init"
    | "instructions"
    | "agents"
    | "completion"
    | "migration backlog preview"
    | "migration backlog apply"
    | "migration backlog status"
    | "migration backlog rollback"
    | "task status-flow"
    | "task list"
    | "task view"
    | "search"
    | "search --all"
    | "task create"
    | "task edit"
    | "task complete"
    | "task archive"
    | "task demote"
    | "draft create"
    | "draft list"
    | "draft view"
    | "draft promote"
    | "draft archive"
    | "milestone list"
    | "milestone view"
    | "milestone create"
    | "milestone edit"
    | "milestone delete"
    | "decision list"
    | "decision view"
    | "decision create"
    | "decision edit"
    | "decision delete"
    | "overview"
    | "board"
    | "doctor"
    | "cleanup"
    | "browser";
  readonly schemaVersion: 1;
  readonly kind: `${string}.${string}` | null;
  readonly mutates: boolean;
  readonly fields?: readonly string[];
  readonly filters?: readonly string[];
}

export const commandManifest = {
  commands: [
    {
      name: "manifest",
      schemaVersion: 1,
      kind: "manifest.registry",
      mutates: false,
    },
    {
      name: "version",
      schemaVersion: 1,
      kind: null,
      mutates: false,
    },
    { name: "help", schemaVersion: 1, kind: "help.commands", mutates: false },
    {
      name: "init",
      schemaVersion: 1,
      kind: "workspace.initialized",
      mutates: true,
    },
    {
      name: "instructions",
      schemaVersion: 1,
      kind: "agent.instructions",
      mutates: false,
    },
    {
      name: "agents",
      schemaVersion: 1,
      kind: "agent.instructions-status",
      mutates: true,
    },
    {
      name: "completion",
      schemaVersion: 1,
      kind: "completion.script",
      mutates: false,
    },
    {
      name: "migration backlog preview",
      schemaVersion: 1,
      kind: "migration.backlog-preview",
      mutates: false,
      fields: ["digest", "mappings", "requiresApproval", "sourceFingerprint"],
    },
    {
      name: "migration backlog apply",
      schemaVersion: 1,
      kind: "migration.backlog-applied",
      mutates: true,
      fields: ["digest"],
    },
    {
      name: "migration backlog status",
      schemaVersion: 1,
      kind: "migration.backlog-status",
      mutates: false,
      fields: ["digest"],
    },
    {
      name: "migration backlog rollback",
      schemaVersion: 1,
      kind: "migration.backlog-rolled-back",
      mutates: true,
      fields: ["digest"],
    },
    {
      name: "task status-flow",
      schemaVersion: 1,
      kind: "task.status-flow",
      mutates: false,
      fields: ["statuses", "terminalStatuses"],
    },
    {
      name: "task list",
      schemaVersion: 1,
      kind: "task.list",
      mutates: false,
      filters: ["label", "status"],
      fields: [
        "assignees",
        "createdAt",
        "id",
        "labels",
        "ordinal",
        "priority",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "task view",
      schemaVersion: 1,
      kind: "task.view",
      mutates: false,
      fields: [
        "acceptanceCriteria",
        "aliases",
        "assignees",
        "comments",
        "createdAt",
        "definitionOfDone",
        "dependencies",
        "description",
        "documentation",
        "finalSummary",
        "id",
        "implementationNotes",
        "labels",
        "milestoneId",
        "modifiedFiles",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "references",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "search",
      schemaVersion: 1,
      kind: "task.search",
      mutates: false,
      filters: ["query"],
      fields: [
        "assignees",
        "createdAt",
        "id",
        "labels",
        "ordinal",
        "priority",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "search --all",
      schemaVersion: 1,
      kind: "search.results",
      mutates: false,
      filters: ["query"],
    },
    {
      name: "task create",
      schemaVersion: 1,
      kind: "task.created",
      mutates: true,
      fields: [
        "acceptanceCriteria",
        "aliases",
        "assignees",
        "definitionOfDone",
        "description",
        "documentation",
        "finalSummary",
        "implementationNotes",
        "labels",
        "milestoneId",
        "modifiedFiles",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "references",
        "title",
        "type",
      ],
    },
    {
      name: "task edit",
      schemaVersion: 1,
      kind: "task.updated",
      mutates: true,
      fields: [
        "acceptanceCriteria",
        "addAssignees",
        "addDependencies",
        "addLabels",
        "addModifiedFiles",
        "addNotes",
        "addPlan",
        "addReferences",
        "clearMilestone",
        "clearParent",
        "definitionOfDone",
        "description",
        "documentation",
        "implementationNotes",
        "milestoneId",
        "parentId",
        "plan",
        "removeAssignees",
        "removeDependencies",
        "removeLabels",
        "removeModifiedFiles",
        "removeNotes",
        "removePlan",
        "removeReferences",
        "status",
      ],
    },
    {
      name: "task complete",
      schemaVersion: 1,
      kind: "task.completed",
      mutates: true,
    },
    {
      name: "task archive",
      schemaVersion: 1,
      kind: "task.archived",
      mutates: true,
    },
    {
      name: "task demote",
      schemaVersion: 1,
      kind: "task.demoted",
      mutates: true,
    },
    {
      name: "draft create",
      schemaVersion: 1,
      kind: "draft.created",
      mutates: true,
      fields: ["description", "documentation", "labels", "title"],
    },
    {
      name: "draft list",
      schemaVersion: 1,
      kind: "draft.list",
      mutates: false,
      filters: ["include-archived"],
    },
    {
      name: "draft view",
      schemaVersion: 1,
      kind: "draft.view",
      mutates: false,
      fields: ["description", "documentation", "labels", "title"],
    },
    {
      name: "draft promote",
      schemaVersion: 1,
      kind: "draft.promoted",
      mutates: true,
    },
    {
      name: "draft archive",
      schemaVersion: 1,
      kind: "draft.archived",
      mutates: true,
    },
    {
      name: "milestone list",
      schemaVersion: 1,
      kind: "milestone.list",
      mutates: false,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone view",
      schemaVersion: 1,
      kind: "milestone.view",
      mutates: false,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone create",
      schemaVersion: 1,
      kind: "milestone.created",
      mutates: true,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone edit",
      schemaVersion: 1,
      kind: "milestone.updated",
      mutates: true,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone delete",
      schemaVersion: 1,
      kind: "milestone.deleted",
      mutates: true,
    },
    {
      name: "decision list",
      schemaVersion: 1,
      kind: "decision.list",
      mutates: false,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision view",
      schemaVersion: 1,
      kind: "decision.view",
      mutates: false,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision create",
      schemaVersion: 1,
      kind: "decision.created",
      mutates: true,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision edit",
      schemaVersion: 1,
      kind: "decision.updated",
      mutates: true,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision delete",
      schemaVersion: 1,
      kind: "decision.deleted",
      mutates: true,
    },
    {
      name: "overview",
      schemaVersion: 1,
      kind: "project.overview",
      mutates: false,
    },
    { name: "board", schemaVersion: 1, kind: "project.board", mutates: false },
    {
      name: "doctor",
      schemaVersion: 1,
      kind: "project.doctor",
      mutates: false,
    },
    {
      name: "cleanup",
      schemaVersion: 1,
      kind: "project.cleanup",
      mutates: true,
    },
    {
      name: "browser",
      schemaVersion: 1,
      kind: "browser.started",
      mutates: false,
    },
  ] satisfies readonly CommandManifestEntry[],
  exitCodes,
} as const;

export function manifestResult() {
  return success("manifest.registry", commandManifest);
}

export function validateCommandManifest(manifest: unknown): boolean {
  if (!manifest || typeof manifest !== "object") return false;
  const candidate = manifest as {
    commands?: unknown;
    exitCodes?: unknown;
  };
  if (!Array.isArray(candidate.commands) || candidate.commands.length === 0)
    return false;
  if (JSON.stringify(candidate.exitCodes) !== JSON.stringify(exitCodes)) {
    return false;
  }
  const canonical = new Map<string, CommandManifestEntry>();
  for (const entry of commandManifest.commands)
    canonical.set(entry.name, entry);
  const names = new Set<string>();
  const kinds = new Set<string>();
  // Non-empty unique string lists; the live manifest never advertises an
  // empty list, and order is part of the closed-set contract (exact
  // JSON.stringify equality below is deliberately order-sensitive).
  const isStringList = (value: unknown): boolean =>
    value === undefined ||
    (Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === "string") &&
      new Set(value).size === value.length);
  for (const command of candidate.commands) {
    if (!command || typeof command !== "object") return false;
    const entry = command as Record<string, unknown>;
    if (
      typeof entry.name !== "string" ||
      entry.schemaVersion !== 1 ||
      typeof entry.mutates !== "boolean" ||
      names.has(entry.name)
    ) {
      return false;
    }
    if (!canonical.has(entry.name)) return false;
    if (!isStringList(entry.fields) || !isStringList(entry.filters))
      return false;
    const expected = canonical.get(entry.name);
    if (
      !expected ||
      entry.kind !== expected.kind ||
      entry.mutates !== expected.mutates ||
      JSON.stringify(entry.fields ?? []) !==
        JSON.stringify(expected.fields ?? []) ||
      JSON.stringify(entry.filters ?? []) !==
        JSON.stringify(expected.filters ?? [])
    ) {
      return false;
    }
    names.add(entry.name);
    if (entry.kind !== null) {
      if (
        typeof entry.kind !== "string" ||
        !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(entry.kind) ||
        kinds.has(entry.kind)
      ) {
        return false;
      }
      kinds.add(entry.kind);
    }
  }
  for (const entry of commandManifest.commands)
    if (!names.has(entry.name)) return false;
  return true;
}
