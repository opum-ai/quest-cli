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
    | "task status-flow"
    | "task list"
    | "task view"
    | "search"
    | "task create"
    | "task edit";
  readonly schemaVersion: 1;
  readonly kind: `${string}.${string}` | null;
  readonly mutates: boolean;
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
    {
      name: "task status-flow",
      schemaVersion: 1,
      kind: "task.status-flow",
      mutates: false,
    },
    { name: "task list", schemaVersion: 1, kind: "task.list", mutates: false },
    { name: "task view", schemaVersion: 1, kind: "task.view", mutates: false },
    { name: "search", schemaVersion: 1, kind: "task.search", mutates: false },
    {
      name: "task create",
      schemaVersion: 1,
      kind: "task.created",
      mutates: true,
    },
    {
      name: "task edit",
      schemaVersion: 1,
      kind: "task.updated",
      mutates: true,
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
  const names = new Set<string>();
  const kinds = new Set<string>();
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
  return true;
}
