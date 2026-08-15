/**
 * Public, dependency-free subprocess contract for a tracker consumer.
 *
 * This module deliberately contains only records a consumer can obtain from
 * Quest's stdout/stderr.  It neither imports nor exposes Quest task internals.
 */
export const TRACKER_CONTRACT_VERSION = 1 as const;
export const MIN_QUEST_VERSION = "0.1.0";
export const DEFAULT_TIMEOUT_MS = 5_000;

export type TrackerOutcome =
  | "not_found"
  | "denied"
  | "conflict"
  | "validation"
  | "drift";

export interface TrackerDiagnostic {
  readonly error_type: TrackerOutcome;
  readonly message: string;
  readonly input?: unknown;
}

export interface TrackerProcessResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut?: boolean;
}

/** A runner receives argv, never a shell command string. */
export interface TrackerProcessRunner {
  run(
    argv: readonly string[],
    options: { readonly timeoutMs: number },
  ): Promise<TrackerProcessResult>;
}

export interface TrackerManifestEntry {
  readonly name: string;
  readonly schemaVersion: number;
  readonly kind: string | null;
  readonly mutates: boolean;
}
export interface TrackerManifest {
  readonly commands: readonly TrackerManifestEntry[];
}

export interface TrackerSummary {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly labels: readonly string[];
  readonly summary?: string;
  readonly priority?: string;
  readonly type?: string;
}
export interface TrackerTask extends TrackerSummary {
  readonly description?: string;
  readonly acceptanceCriteria: readonly string[];
  readonly definitionOfDone: readonly string[];
  readonly plan: readonly string[];
  readonly implementationNotes: readonly string[];
  readonly comments: readonly unknown[];
  readonly documentation: readonly string[];
  readonly dependencies: readonly string[];
  readonly parentId?: string;
}
export interface TrackerStatusFlow {
  readonly statuses: readonly string[];
  readonly terminalStatuses: readonly string[];
}
export interface TrackerCreateInput {
  readonly title: string;
  readonly description?: string;
  readonly labels?: readonly string[];
  readonly documentation?: readonly string[];
}
/** Undefined preserves a field; arrays replace their corresponding full field. */
export interface TrackerEditPatch {
  readonly status?: string;
  readonly description?: string;
  readonly addLabels?: readonly string[];
  readonly removeLabels?: readonly string[];
  readonly documentation?: readonly string[];
}
export interface TrackerWriteActor {
  readonly id: string;
  readonly kind: "human" | "delegated-agent";
  readonly accountableHumanId?: string;
}

interface ResultEnvelope {
  readonly schemaVersion: number;
  readonly kind: string;
  readonly data: unknown;
}

function parseSemver(
  value: string,
): readonly [number, number, number] | undefined {
  const match = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\n?$/.exec(
    value,
  );
  return match
    ? [Number(match[1]), Number(match[2]), Number(match[3])]
    : undefined;
}

function semverAtLeast(actual: string, floor: string): boolean {
  const left = parseSemver(actual);
  const right = parseSemver(floor);
  if (!left || !right) return false;
  for (let index = 0; index < left.length; index += 1) {
    const actualPart = left[index];
    const floorPart = right[index];
    if (actualPart === undefined || floorPart === undefined) return false;
    if (actualPart !== floorPart) return actualPart > floorPart;
  }
  return true;
}

function trackerError(
  error_type: TrackerOutcome,
  message: string,
): TrackerDiagnostic {
  return { error_type, message };
}

function parseDiagnostic(stderr: string): TrackerDiagnostic | undefined {
  try {
    const parsed: unknown = JSON.parse(stderr);
    if (!parsed || typeof parsed !== "object") return undefined;
    const value = parsed as Partial<TrackerDiagnostic>;
    return typeof value.error_type === "string" &&
      typeof value.message === "string"
      ? (value as TrackerDiagnostic)
      : undefined;
  } catch {
    return undefined;
  }
}

function parseEnvelope(
  result: TrackerProcessResult,
  expectedKind: string,
): ResultEnvelope {
  if (result.timedOut)
    throw trackerError("drift", "Quest subprocess timed out.");
  if (result.exitCode !== 0) {
    throw (
      parseDiagnostic(result.stderr) ??
      trackerError(
        "drift",
        "Quest subprocess failed without a valid diagnostic.",
      )
    );
  }
  try {
    const parsed: unknown = JSON.parse(result.stdout);
    if (!parsed || typeof parsed !== "object") throw new Error();
    const envelope = parsed as Partial<ResultEnvelope>;
    if (
      envelope.schemaVersion !== TRACKER_CONTRACT_VERSION ||
      envelope.kind !== expectedKind ||
      !("data" in envelope)
    )
      throw new Error();
    return envelope as ResultEnvelope;
  } catch {
    throw trackerError(
      "drift",
      `Quest returned an invalid ${expectedKind} envelope.`,
    );
  }
}

function requireActor(actor: TrackerWriteActor | undefined): TrackerWriteActor {
  if (
    !actor?.id ||
    (actor.kind !== "human" && actor.kind !== "delegated-agent")
  ) {
    throw trackerError(
      "denied",
      "Tracker writes require an explicit actor declaration.",
    );
  }
  if (actor.kind === "delegated-agent" && !actor.accountableHumanId) {
    throw trackerError(
      "denied",
      "Delegated tracker writes require an accountable human.",
    );
  }
  return actor;
}

function actorArguments(actor: TrackerWriteActor): readonly string[] {
  return actor.kind === "human"
    ? ["--actor", actor.id, "--actor-kind", "human"]
    : [
        "--actor",
        actor.id,
        "--actor-kind",
        "delegated-agent",
        "--accountable-human",
        actor.accountableHumanId ?? "",
      ];
}

function appendRepeated(
  argv: string[],
  flag: string,
  values: readonly string[] | undefined,
): void {
  for (const value of values ?? []) argv.push(flag, value);
}

/**
 * Bounded, argv-safe adapter suitable for lore-cli or another external
 * consumer. Reads have no actor; every write carries an explicit actor.
 */
export class QuestTrackerClient {
  constructor(
    private readonly runner: TrackerProcessRunner,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  private run(argv: readonly string[]) {
    return this.runner.run(argv, { timeoutMs: this.timeoutMs });
  }

  async probe(): Promise<{
    readonly version: string;
    readonly manifest: TrackerManifest;
  }> {
    const versionResult = await this.run(["--version"]);
    if (
      versionResult.timedOut ||
      versionResult.exitCode !== 0 ||
      !parseSemver(versionResult.stdout)
    ) {
      throw trackerError(
        "drift",
        "Quest did not return a bare semver version.",
      );
    }
    if (!semverAtLeast(versionResult.stdout, MIN_QUEST_VERSION)) {
      throw trackerError(
        "drift",
        `Quest ${versionResult.stdout.trim()} is older than ${MIN_QUEST_VERSION}.`,
      );
    }
    const envelope = parseEnvelope(
      await this.run(["manifest", "--json"]),
      "manifest.registry",
    );
    const manifest = envelope.data as Partial<TrackerManifest>;
    const commands = manifest.commands;
    const required = [
      ["task status-flow", "task.status-flow", false],
      ["task list", "task.list", false],
      ["task view", "task.view", false],
      ["search", "task.search", false],
      ["task create", "task.created", true],
      ["task edit", "task.updated", true],
    ] as const;
    if (
      !Array.isArray(commands) ||
      required.some(
        ([name, kind, mutates]) =>
          !commands.some(
            (command) =>
              command?.name === name &&
              command.schemaVersion === TRACKER_CONTRACT_VERSION &&
              command.kind === kind &&
              command.mutates === mutates,
          ),
      )
    ) {
      throw trackerError(
        "drift",
        "Quest manifest does not advertise the tracker contract.",
      );
    }
    return {
      version: versionResult.stdout.trim(),
      manifest: manifest as TrackerManifest,
    };
  }

  async statusFlow(): Promise<TrackerStatusFlow> {
    return parseEnvelope(
      await this.run(["task", "status-flow", "--json"]),
      "task.status-flow",
    ).data as TrackerStatusFlow;
  }
  async list(
    options: {
      readonly status?: string;
      readonly labels?: readonly string[];
    } = {},
  ): Promise<readonly TrackerSummary[]> {
    const argv = ["task", "list", "--json"];
    if (options.status) argv.push("--status", options.status);
    appendRepeated(argv, "--label", options.labels);
    return parseEnvelope(await this.run(argv), "task.list")
      .data as readonly TrackerSummary[];
  }
  async view(id: string): Promise<TrackerTask> {
    return parseEnvelope(
      await this.run(["task", "view", id, "--json"]),
      "task.view",
    ).data as TrackerTask;
  }
  async search(query: string): Promise<readonly TrackerSummary[]> {
    return parseEnvelope(
      await this.run(["search", query, "--json"]),
      "task.search",
    ).data as readonly TrackerSummary[];
  }
  async create(
    input: TrackerCreateInput,
    actor?: TrackerWriteActor,
  ): Promise<TrackerTask> {
    const declared = requireActor(actor);
    const argv = [
      "task",
      "create",
      input.title,
      "--json",
      ...actorArguments(declared),
    ];
    if (input.description !== undefined)
      argv.push("--description", input.description);
    appendRepeated(argv, "--label", input.labels);
    appendRepeated(argv, "--doc", input.documentation);
    return parseEnvelope(await this.run(argv), "task.created")
      .data as TrackerTask;
  }
  async edit(
    id: string,
    patch: TrackerEditPatch,
    actor?: TrackerWriteActor,
  ): Promise<TrackerTask> {
    const declared = requireActor(actor);
    const argv = ["task", "edit", id, "--json", ...actorArguments(declared)];
    if (patch.status !== undefined) argv.push("--status", patch.status);
    if (patch.description !== undefined)
      argv.push("--description", patch.description);
    appendRepeated(argv, "--add-label", patch.addLabels);
    appendRepeated(argv, "--remove-label", patch.removeLabels);
    appendRepeated(argv, "--doc", patch.documentation);
    return parseEnvelope(await this.run(argv), "task.updated")
      .data as TrackerTask;
  }
}
