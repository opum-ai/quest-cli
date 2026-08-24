#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { join } from "node:path";
import { Command } from "commander";
import {
  inspectQuestAgentInstructions,
  questAgentInstructions,
  updateQuestAgentInstructions,
} from "../application/agents/agent-instructions.ts";
import { startBrowserServer } from "../application/browser/browser.ts";
import {
  commandManifest,
  diagnostic,
  exitCodeFor,
  manifestResult,
  type OutputMode,
  selectOutputMode,
} from "../application/command-contract.ts";
import type { PlanningService } from "../application/planning/planning.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import { TaskService } from "../application/tasks/tasks.ts";
import { OpumAgentWorkflowBindingService } from "../application/claims/opum-agent-workflow.ts";
import { OpumAgentWorkflowError } from "../application/claims/opum-agent-workflow.ts";
import type { QuestTaskBindingV1Response } from "../application/claims/opum-agent-workflow.ts";
import {
  initializeWorkspace,
  resolveInitializedWorkspace,
} from "../application/workspaces/workspaces.ts";
import { dispatchTrackerTaskCommand } from "./commands/task/index.ts";
import {
  createAgentInstructionPort,
  createBacklogImportService,
  createPlanningService,
  createTaskBindingModel,
  createWorkspacePort,
} from "./composition.ts";
import { migrationSmokeResult } from "./migration-smoke.ts";
import { renderHumanPayload } from "./render.ts";

const VERSION = "0.2.7";

/** Retains the program identity for embedders; subprocess routing uses runQuest. */
export function createQuestProgram(): Command {
  return new Command()
    .name("quest")
    .description("Quest tracker CLI")
    .version(VERSION);
}

export interface InvocationResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

function failure(
  errorType: Parameters<typeof diagnostic>[0],
  message: string,
  options: Parameters<typeof diagnostic>[2] = {},
): InvocationResult {
  const error = diagnostic(errorType, message, options);
  return {
    stdout: "",
    stderr: `${JSON.stringify(error)}\n`,
    exitCode: exitCodeFor(error.error_type),
  };
}

function output(
  data: object | readonly unknown[],
  mode: OutputMode,
): InvocationResult {
  const success = data as {
    readonly schemaVersion: unknown;
    readonly kind: unknown;
    readonly data: unknown;
  };
  const envelope = {
    schemaVersion: success.schemaVersion,
    kind: success.kind,
    data: success.data,
    principal: null,
  };
  return {
    stdout:
      mode === "json"
        ? `${JSON.stringify(envelope)}\n`
        : renderHumanPayload(envelope.data),
    stderr: "",
    exitCode: 0,
  };
}

class FlagUsageError extends Error {}

function resolveOutputModes(argv: readonly string[]): {
  readonly arguments: readonly string[];
  readonly json: boolean;
  readonly plain: boolean;
} {
  let json = false;
  let plain = false;
  const arguments_: string[] = [];
  for (const argument of argv) {
    if (argument === "--json") {
      json = true;
      continue;
    }
    if (argument === "--plain") {
      plain = true;
      continue;
    }
    arguments_.push(argument);
  }
  return { arguments: arguments_, json, plain };
}

function flags(
  argv: readonly string[],
  repeatableValueFlags: readonly string[] = [],
):
  | {
      readonly values: Map<string, string[]>;
      readonly json: boolean;
      readonly plain: boolean;
    }
  | undefined {
  const values = new Map<string, string[]>();
  const json = argv.includes("--json");
  const plain = argv.includes("--plain");
  const repeatable = new Set(repeatableValueFlags);
  const booleanFlags = new Set([
    "--agent-instructions",
    "--check",
    "--require-installed",
    "--update-instructions",
    "--confirm",
    "--dry-run",
    "--include-archived",
    "--all",
    "--clear-parent",
    "--clear-milestone",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const equals = argument?.indexOf("=") ?? -1;
    const flag = equals === -1 ? argument : argument?.slice(0, equals);
    const inlineValue = equals === -1 ? undefined : argument?.slice(equals + 1);
    if (flag === "--json") {
      if (inlineValue !== undefined)
        throw new FlagUsageError("--json does not take a value.");
      continue;
    }
    if (flag === "--plain") {
      if (inlineValue !== undefined)
        throw new FlagUsageError("--plain does not take a value.");
      continue;
    }
    if (!flag?.startsWith("--")) return undefined;
    if (booleanFlags.has(flag)) {
      if (inlineValue !== undefined)
        throw new FlagUsageError(`${flag} does not take a value.`);
      if (values.has(flag))
        throw new FlagUsageError(`${flag} may only be provided once.`);
      values.set(flag, []);
      continue;
    }
    const value = inlineValue ?? argv[index + 1];
    if (
      value === undefined ||
      (inlineValue === undefined && value.startsWith("--"))
    )
      throw new FlagUsageError(
        `${flag} requires a value; use ${flag}=<value> if the value begins with --.`,
      );
    const entries = values.get(flag) ?? [];
    if (entries.length > 0 && !repeatable.has(flag))
      throw new FlagUsageError(`${flag} may only be provided once.`);
    entries.push(value);
    values.set(flag, entries);
    if (inlineValue === undefined) index += 1;
  }
  return { values, json, plain };
}

function one(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string | undefined {
  const values = parsed.values.get(name);
  if (!values) return undefined;
  if (values.length !== 1)
    throw new FlagUsageError(`${name} may only be provided once.`);
  return values[0];
}

function only(
  parsed: NonNullable<ReturnType<typeof flags>>,
  allowed: readonly string[],
): boolean {
  return [...parsed.values.keys()].every((flag) => allowed.includes(flag));
}

function stringValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string[] | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    if (
      !Array.isArray(parsedValue) ||
      !parsedValue.every((item) => typeof item === "string")
    )
      throw new Error("not a string array");
    return parsedValue;
  } catch {
    throw new FlagUsageError(`${name} must be a JSON array of strings.`);
  }
}

function checkListValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): (string | { index: number; text: string; checked: boolean })[] | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    const items = parsedValue as readonly unknown[];
    if (
      !Array.isArray(parsedValue) ||
      !items.every(
        (item) =>
          typeof item === "string" ||
          (!!item &&
            typeof item === "object" &&
            Number.isInteger((item as Record<string, unknown>).index) &&
            ((item as Record<string, unknown>).index as number) >= 0 &&
            typeof (item as Record<string, unknown>).text === "string" &&
            typeof (item as Record<string, unknown>).checked === "boolean"),
      )
    )
      throw new Error("not a check list");
    return items as (
      | string
      | { index: number; text: string; checked: boolean }
    )[];
  } catch {
    throw new FlagUsageError(
      `${name} must be a JSON array of strings or {index,text,checked} items.`,
    );
  }
}

function commentsValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
):
  | { id: string; authorId: string; body: string; createdAt: string }[]
  | undefined {
  const value = one(parsed, name);
  if (value === undefined) return undefined;
  try {
    const parsedValue: unknown = JSON.parse(value);
    const items = parsedValue as readonly unknown[];
    if (
      !Array.isArray(parsedValue) ||
      !items.every(
        (item) =>
          !!item &&
          typeof item === "object" &&
          typeof (item as Record<string, unknown>).id === "string" &&
          typeof (item as Record<string, unknown>).authorId === "string" &&
          typeof (item as Record<string, unknown>).body === "string" &&
          typeof (item as Record<string, unknown>).createdAt === "string",
      )
    )
      throw new Error("not a comment array");
    return items as {
      id: string;
      authorId: string;
      body: string;
      createdAt: string;
    }[];
  } catch {
    throw new FlagUsageError(
      `${name} must be a JSON array of {id,authorId,body,createdAt} comments.`,
    );
  }
}

function ordinalValue(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new FlagUsageError("--ordinal must be an integer.");
  return Number(value);
}

function updatedMilestoneTaskIds(
  current: readonly string[],
  parsed: NonNullable<ReturnType<typeof flags>>,
): readonly string[] {
  const replacement = parsed.values.get("--replace-task");
  const additions = parsed.values.get("--add-task") ?? [];
  const removals = parsed.values.get("--remove-task") ?? [];
  if (replacement && (additions.length > 0 || removals.length > 0))
    throw new FlagUsageError(
      "--replace-task cannot be combined with --add-task or --remove-task.",
    );
  const removed = new Set(removals);
  if (additions.some((taskId) => removed.has(taskId)))
    throw new FlagUsageError(
      "--add-task and --remove-task cannot name the same task.",
    );
  const result: string[] = [];
  const add = (taskId: string) => {
    if (!result.includes(taskId)) result.push(taskId);
  };
  for (const taskId of replacement ?? current) add(taskId);
  if (!replacement) {
    for (const taskId of additions) add(taskId);
    return result.filter((taskId) => !removed.has(taskId));
  }
  return result;
}

function createTaskService(root: string): TaskService {
  return new TaskService(
    new LocalTaskRepository(join(root, ".quest", "tasks")),
  );
}

function createTaskReader(root: string): LocalTaskRepository {
  return new LocalTaskRepository(join(root, ".quest", "tasks"));
}

async function taskStoreRoot(): Promise<string> {
  if (process.env.QUEST_TASK_STORE !== undefined)
    return process.env.QUEST_TASK_STORE;
  return (
    await resolveInitializedWorkspace(createWorkspacePort(), process.cwd())
  ).worktreePath;
}

function actor(parsed: NonNullable<ReturnType<typeof flags>>) {
  const id = one(parsed, "--actor");
  const kind = one(parsed, "--actor-kind");
  if (!id || (kind !== "human" && kind !== "delegated-agent")) return undefined;
  const accountableHumanId = one(parsed, "--accountable-human");
  if (kind === "delegated-agent" && !accountableHumanId) return undefined;
  return {
    id,
    kind,
    ...(accountableHumanId ? { accountableHumanId } : {}),
  } as const;
}

async function nextTaskId(tasks: TaskService): Promise<string> {
  const ids = await tasks.listIncludingRetained();
  const highest = ids.reduce((maximum, task) => {
    const numeric = Number(task.id.slice(2));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `T-${highest + 1}`;
}

async function nextDraftId(tasks: TaskService): Promise<string> {
  const drafts = await tasks.listDrafts(true);
  const highest = drafts.reduce((maximum, record) => {
    const numeric = Number(record.draft.id.slice(2));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `D-${highest + 1}`;
}

async function nextPlanningId(
  planning: PlanningService,
  prefix: "M" | "DEC",
): Promise<string> {
  const records =
    prefix === "M"
      ? await planning.listMilestones()
      : await planning.listDecisions();
  const highest = records.reduce((maximum, record) => {
    const numeric = Number(record.id.slice(prefix.length + 1));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `${prefix}-${highest + 1}`;
}

/** Executes the stable public tracker CLI against repository-local task storage. */
export async function runQuest(
  input: readonly string[],
  stdoutIsTty: boolean,
): Promise<InvocationResult> {
  try {
    const resolvedModes = resolveOutputModes(input);
    const arguments_ = resolvedModes.arguments;
    if (
      arguments_.length === 1 &&
      ["--version", "version"].includes(arguments_[0] ?? "")
    )
      return { stdout: `${VERSION}\n`, stderr: "", exitCode: 0 };
    const modeFor = (parsed?: NonNullable<ReturnType<typeof flags>>) =>
      selectOutputMode({
        json: resolvedModes.json || parsed?.json,
        plain: resolvedModes.plain || parsed?.plain,
        stdoutIsTty,
      });
    let root: Promise<string> | undefined;
    const resolvedRoot = () => (root ??= taskStoreRoot());
    const taskService = async () => createTaskService(await resolvedRoot());
    const taskReader = async () => createTaskReader(await resolvedRoot());
    const planningService = async () =>
      createPlanningService(await resolvedRoot());
    if (arguments_.length === 0) {
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands: commandManifest.commands },
        },
        modeFor(),
      );
    }
    if (
      ["--help", "-h", "help"].includes(arguments_[0] ?? "") ||
      ["--help", "-h"].includes(arguments_[1] ?? "")
    ) {
      const helpArguments = arguments_;
      if (helpArguments.length > 2)
        return failure("usage", "help accepts at most one topic.");
      const helpTarget = ["help", "--help", "-h"].includes(
        helpArguments[0] ?? "",
      )
        ? helpArguments[1]
        : ["--help", "-h"].includes(helpArguments[1] ?? "")
          ? helpArguments[0]
          : undefined;
      const parsed = flags([]);
      if (!parsed || !only(parsed, []))
        return failure("usage", "help accepts only --json and --plain.");
      const commands = helpTarget
        ? commandManifest.commands.filter(
            (entry) =>
              entry.name === helpTarget ||
              entry.name.startsWith(`${helpTarget} `),
          )
        : commandManifest.commands;
      if (helpTarget && commands.length === 0)
        return failure("not_found", `No help is available for ${helpTarget}.`);
      const details = {
        valueSyntax:
          "Use --flag=<value> to pass a value that begins with --; the value is preserved exactly after the first =.",
        ...(helpTarget === "agents"
          ? {
              usage:
                "quest agents --check [--require-installed] | --update-instructions",
              check:
                "--check reports missing without failing unless --require-installed is present; strict missing exits 6.",
              drift: "Drift or malformed managed markers exit 6.",
            }
          : {}),
      };
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands, details },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "init") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, ["--agent-instructions"]))
        return failure(
          "usage",
          "init accepts only --agent-instructions, --json, and --plain.",
        );
      const workspace = await initializeWorkspace(
        createWorkspacePort(),
        process.cwd(),
      );
      const instructions = parsed.values.has("--agent-instructions")
        ? await updateQuestAgentInstructions(
            createAgentInstructionPort(process.cwd()),
          )
        : undefined;
      return output(
        {
          schemaVersion: 1,
          kind: "workspace.initialized",
          data: { workspace, instructions },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "instructions") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "instructions accepts only --json and --plain.",
        );
      return output(
        {
          schemaVersion: 1,
          kind: "agent.instructions",
          data: { version: VERSION, content: questAgentInstructions },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "agents") {
      const parsed = flags(arguments_.slice(1));
      if (
        !parsed ||
        !only(parsed, [
          "--check",
          "--require-installed",
          "--update-instructions",
        ])
      )
        return failure(
          "usage",
          "agents requires --check or --update-instructions.",
        );
      const check = parsed.values.has("--check");
      const requireInstalled = parsed.values.has("--require-installed");
      const update = parsed.values.has("--update-instructions");
      if (check === update)
        return failure("usage", "agents requires exactly one action.");
      if (requireInstalled && !check)
        return failure("usage", "--require-installed requires --check.");
      const result = check
        ? await inspectQuestAgentInstructions(
            createAgentInstructionPort(process.cwd()),
          )
        : await updateQuestAgentInstructions(
            createAgentInstructionPort(process.cwd()),
          );
      if (check && result.state === "drift")
        return failure("drift", result.message);
      if (check && requireInstalled && result.state === "missing")
        return failure(
          "validation",
          "Quest agent instruction block is missing. Run quest agents --update-instructions.",
        );
      return output(
        { schemaVersion: 1, kind: "agent.instructions-status", data: result },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "completion" && arguments_[1] === "bash") {
      const parsed = flags(arguments_.slice(2));
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "completion bash accepts only --json and --plain.",
        );
      return output(
        {
          schemaVersion: 1,
          kind: "completion.script",
          data: {
            shell: "bash",
            script: `complete -W '${[...new Set(commandManifest.commands.flatMap((entry) => entry.name.split(" ")))].join(" ")}' quest`,
          },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "sqlite-smoke") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "sqlite-smoke accepts only --json and --plain.",
        );
      const database = new Database(":memory:");
      try {
        const row = database.query("SELECT 1 AS value").get() as {
          readonly value: number;
        };
        return output(
          {
            schemaVersion: 1,
            kind: "sqlite.smoke",
            data: { value: row.value },
          },
          modeFor(parsed),
        );
      } finally {
        database.close();
      }
    }
    if (arguments_[0] === "migration-smoke") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "migration-smoke accepts only --json and --plain.",
        );
      return output(await migrationSmokeResult(), modeFor(parsed));
    }
    if (arguments_[0] === "migration" && arguments_[1] === "backlog") {
      const action = arguments_[2];
      const parsed = flags(arguments_.slice(3));
      if (!action || !parsed)
        return failure("usage", "migration backlog requires a valid action.");
      const source = one(parsed, "--source");
      const digest = one(parsed, "--digest");
      const backlogDirectory = one(parsed, "--backlog-dir");
      const root = await resolvedRoot();
      if (
        action === "preview" &&
        source &&
        only(parsed, ["--source", "--backlog-dir"])
      )
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-preview",
            data: await createBacklogImportService(
              root,
              source,
              backlogDirectory,
            ).preview(),
          },
          modeFor(parsed),
        );
      if (
        action === "apply" &&
        source &&
        digest &&
        only(parsed, [
          "--source",
          "--digest",
          "--backlog-dir",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        if (!actor(parsed))
          return failure(
            "denied",
            "Backlog migration writes require an explicit actor declaration.",
          );
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-applied",
            data: await createBacklogImportService(
              root,
              source,
              backlogDirectory,
            ).apply(digest),
          },
          modeFor(parsed),
        );
      }
      if (action === "status" && digest && only(parsed, ["--digest"]))
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-status",
            data: await createBacklogImportService(root, "").status(digest),
          },
          modeFor(parsed),
        );
      if (
        action === "rollback" &&
        digest &&
        only(parsed, [
          "--digest",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        if (!actor(parsed))
          return failure(
            "denied",
            "Backlog migration writes require an explicit actor declaration.",
          );
        return output(
          {
            schemaVersion: 1,
            kind: "migration.backlog-rolled-back",
            data: await createBacklogImportService(root, "").rollback(digest),
          },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        "migration backlog requires preview --source, apply --source --digest, status --digest, or rollback --digest.",
      );
    }
    if (arguments_[0] === "manifest") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure("usage", "manifest accepts only --json and --plain.");
      return output(manifestResult(), modeFor(parsed));
    }
    if (["overview", "board", "doctor"].includes(arguments_[0] ?? "")) {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          `${arguments_[0]} accepts only --json and --plain.`,
        );
      const planning = await planningService();
      const data =
        arguments_[0] === "overview"
          ? await planning.overview(await taskReader())
          : arguments_[0] === "board"
            ? await planning.board(await taskReader())
            : await planning.doctor(await taskReader());
      const kind =
        arguments_[0] === "overview"
          ? "project.overview"
          : arguments_[0] === "board"
            ? "project.board"
            : "project.doctor";
      return output({ schemaVersion: 1, kind, data }, modeFor(parsed));
    }
    if (arguments_[0] === "cleanup") {
      const parsed = flags(arguments_.slice(1));
      if (
        !parsed ||
        !only(parsed, [
          "--dry-run",
          "--confirm",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      )
        return failure(
          "usage",
          "cleanup accepts --dry-run or --confirm with an actor.",
        );
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Cleanup requires an explicit actor declaration.",
        );
      const confirmed = parsed.values.has("--confirm");
      const data = await (await planningService()).cleanup(
        { dryRun: parsed.values.has("--dry-run") || !confirmed, confirmed },
        crypto.randomUUID(),
      );
      return output(
        { schemaVersion: 1, kind: "project.cleanup", data },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "browser") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, ["--port"]))
        return failure("usage", "browser accepts --port, --json, and --plain.");
      const requestedPort = one(parsed, "--port");
      const port = requestedPort === undefined ? 0 : Number(requestedPort);
      if (!Number.isInteger(port) || port < 0 || port > 65535)
        return failure(
          "usage",
          "browser --port must be an integer from 0 through 65535.",
        );
      const started = await startBrowserServer(
        {
          tasks: await taskReader(),
          planning: await planningService(),
        },
        { port },
      );
      return output(
        {
          schemaVersion: 1,
          kind: "browser.started",
          data: {
            host: started.host,
            port: started.port,
            overview: `http://${started.host}:${started.port}/overview`,
            board: `http://${started.host}:${started.port}/board`,
          },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "milestone" || arguments_[0] === "decision") {
      const group = arguments_[0];
      const action = arguments_[1];
      const rest = arguments_.slice(2);
      const isMilestone = group === "milestone";
      const parsed = flags(
        rest.slice(
          action === "create" ||
            action === "view" ||
            action === "edit" ||
            action === "delete"
            ? 1
            : 0,
        ),
        action === "create"
          ? ["--task"]
          : action === "edit" && isMilestone
            ? ["--add-task", "--remove-task", "--replace-task"]
            : [],
      );
      if (!action || !parsed)
        return failure("usage", `${group} requires a valid action.`);
      const planning = await planningService();
      if (action === "list" && only(parsed, [])) {
        const data = isMilestone
          ? await planning.listMilestones()
          : await planning.listDecisions();
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.list" : "decision.list",
            data,
          },
          modeFor(parsed),
        );
      }
      if (action === "view" && rest[0] && only(parsed, [])) {
        const data = isMilestone
          ? await planning.viewMilestone(rest[0])
          : await planning.viewDecision(rest[0]);
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.view" : "decision.view",
            data,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "create" &&
        rest[0] &&
        only(parsed, [
          "--id",
          "--status",
          "--description",
          "--context",
          "--outcome",
          "--task",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const id =
          one(parsed, "--id") ??
          (await nextPlanningId(planning, isMilestone ? "M" : "DEC"));
        const result = isMilestone
          ? await planning.createMilestone(
              {
                id: id as `M-${number}`,
                title: rest[0],
                description: one(parsed, "--description"),
                status: (one(parsed, "--status") ?? "open") as
                  | "open"
                  | "closed",
                taskIds: parsed.values.get("--task") ?? [],
              },
              crypto.randomUUID(),
            )
          : await planning.createDecision(
              {
                id: id as `DEC-${number}`,
                title: rest[0],
                context: one(parsed, "--context"),
                outcome: one(parsed, "--outcome") ?? "Undecided",
                status: (one(parsed, "--status") ?? "proposed") as
                  | "proposed"
                  | "accepted"
                  | "superseded",
              },
              crypto.randomUUID(),
            );
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.created" : "decision.created",
            data: result,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "delete" &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const data = isMilestone
          ? await planning.deleteMilestone(rest[0], crypto.randomUUID())
          : await planning.deleteDecision(rest[0], crypto.randomUUID());
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.deleted" : "decision.deleted",
            data,
          },
          modeFor(parsed),
        );
      }
      if (
        action === "edit" &&
        rest[0] &&
        only(parsed, [
          "--title",
          "--status",
          "--description",
          "--context",
          "--outcome",
          ...(isMilestone
            ? ["--add-task", "--remove-task", "--replace-task"]
            : []),
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        const existingMilestone = isMilestone
          ? await planning.viewMilestone(rest[0])
          : undefined;
        const data = existingMilestone
          ? await planning.updateMilestone(
              {
                ...existingMilestone,
                ...(one(parsed, "--title")
                  ? { title: one(parsed, "--title") }
                  : {}),
                ...(one(parsed, "--description") !== undefined
                  ? { description: one(parsed, "--description") }
                  : {}),
                ...(one(parsed, "--status")
                  ? {
                      status: one(parsed, "--status") as "open" | "closed",
                    }
                  : {}),
                taskIds: updatedMilestoneTaskIds(
                  existingMilestone.taskIds,
                  parsed,
                ),
              },
              crypto.randomUUID(),
            )
          : await planning.updateDecision(
              {
                ...(await planning.viewDecision(rest[0])),
                ...(one(parsed, "--title")
                  ? { title: one(parsed, "--title") }
                  : {}),
                ...(one(parsed, "--context") !== undefined
                  ? { context: one(parsed, "--context") }
                  : {}),
                ...(one(parsed, "--outcome")
                  ? { outcome: one(parsed, "--outcome") }
                  : {}),
                ...(one(parsed, "--status")
                  ? {
                      status: one(parsed, "--status") as
                        | "proposed"
                        | "accepted"
                        | "superseded",
                    }
                  : {}),
              },
              crypto.randomUUID(),
            );
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.updated" : "decision.updated",
            data,
          },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        `${group} action is invalid or missing required arguments.`,
      );
    }
    if (arguments_[0] === "search" && arguments_[1]) {
      const parsed = flags(arguments_.slice(2));
      if (!parsed || !only(parsed, ["--all"]))
        return failure("usage", "search accepts --all, --json, and --plain.");
      if (!parsed.values.has("--all"))
        return output(
          await dispatchTrackerTaskCommand(await taskService(), {
            command: "search",
            query: arguments_[1],
          }),
          modeFor(parsed),
        );
      const [tasks, planning] = await Promise.all([
        dispatchTrackerTaskCommand(await taskService(), {
          command: "search",
          query: arguments_[1],
        }),
        (await planningService()).search(arguments_[1]),
      ]);
      return output(
        {
          schemaVersion: 1,
          kind: "search.results",
          data: { tasks: tasks.data, ...planning },
        },
        modeFor(parsed),
      );
    }
    if (arguments_[0] === "draft") {
      const action = arguments_[1];
      const rest = arguments_.slice(2);
      const parsed = flags(
        rest.slice(
          action === "create" ||
            action === "view" ||
            action === "promote" ||
            action === "archive"
            ? 1
            : 0,
        ),
        action === "create" ? ["--label", "--doc"] : [],
      );
      if (!action || !parsed)
        return failure("usage", "draft requires a valid action.");
      const tasks = await taskService();
      if (action === "list" && only(parsed, ["--include-archived"]))
        return output(
          {
            schemaVersion: 1,
            kind: "draft.list",
            data: await tasks.listDrafts(
              parsed.values.has("--include-archived"),
            ),
          },
          modeFor(parsed),
        );
      if (action === "view" && rest[0] && only(parsed, []))
        return output(
          {
            schemaVersion: 1,
            kind: "draft.view",
            data: await tasks.viewDraft(rest[0]),
          },
          modeFor(parsed),
        );
      if (
        action === "create" &&
        rest[0] &&
        only(parsed, [
          "--id",
          "--description",
          "--label",
          "--doc",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = await tasks.createDraft(
          one(parsed, "--id") ?? (await nextDraftId(tasks)),
          {
            title: rest[0],
            description: one(parsed, "--description"),
            labels: parsed.values.get("--label"),
            documentation: parsed.values.get("--doc"),
          },
          crypto.randomUUID(),
        );
        return output(
          { schemaVersion: 1, kind: "draft.created", data },
          modeFor(parsed),
        );
      }
      if (
        action === "promote" &&
        rest[0] &&
        only(parsed, [
          "--task-id",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = await tasks.promoteDraft(
          rest[0],
          one(parsed, "--task-id") ?? (await nextTaskId(tasks)),
          crypto.randomUUID(),
        );
        return output(
          { schemaVersion: 1, kind: "draft.promoted", data },
          modeFor(parsed),
        );
      }
      if (
        action === "archive" &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            "Draft writes require an explicit actor declaration.",
          );
        const data = await tasks.archiveDraft(rest[0], crypto.randomUUID());
        return output(
          { schemaVersion: 1, kind: "draft.archived", data },
          modeFor(parsed),
        );
      }
      return failure(
        "usage",
        "draft action is invalid or missing required arguments.",
      );
    }
    if (arguments_[0] !== "task")
      return failure("usage", "Unknown or missing Quest command.");
    const command = arguments_[1];
    const rest = arguments_.slice(2);
    if (["complete", "archive", "demote"].includes(command ?? "") && rest[0]) {
      const parsed = flags(rest.slice(1));
      if (
        !parsed ||
        !only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      )
        return failure(
          "usage",
          `task ${command} requires a reference and an explicit actor.`,
        );
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      const tasks = await taskService();
      const data =
        command === "complete"
          ? await tasks.complete(rest[0], crypto.randomUUID())
          : command === "archive"
            ? await tasks.archive(rest[0], crypto.randomUUID())
            : await tasks.demote(rest[0], crypto.randomUUID());
      return output(
        { schemaVersion: 1, kind: `task.${command}d`, data },
        modeFor(parsed),
      );
    }
    if (command === "status-flow") {
      const parsed = flags(rest);
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "task status-flow accepts only --json and --plain.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), { command }),
        modeFor(parsed),
      );
    }
    if (command === "list") {
      const parsed = flags(rest, ["--label"]);
      if (!parsed || !only(parsed, ["--status", "--label"]))
        return failure("usage", "task list received invalid arguments.");
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          status: one(parsed, "--status"),
          labels: parsed.values.get("--label"),
        }),
        modeFor(parsed),
      );
    }
    if (command === "view" && rest[0]) {
      const parsed = flags(rest.slice(1));
      if (!parsed || !only(parsed, []))
        return failure("usage", "task view received invalid arguments.");
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          reference: rest[0],
        }),
        modeFor(parsed),
      );
    }
    if (command === "binding") {
      const parsed = flags(rest);
      if (
        !parsed ||
        !only(parsed, [
          "--contract",
          "--task",
          "--claim-or-correlation",
          "--holder",
          "--repository",
          "--base",
          "--settlement",
        ]) ||
        !one(parsed, "--contract") ||
        !one(parsed, "--task") ||
        !one(parsed, "--claim-or-correlation") ||
        !one(parsed, "--holder") ||
        !one(parsed, "--repository") ||
        !one(parsed, "--base") ||
        !one(parsed, "--settlement")
      )
        return failure(
          "usage",
          "task binding requires --contract, --task, --claim-or-correlation, --holder, --repository, --base, and --settlement.",
        );
      const root = await resolvedRoot();
      let subject: Awaited<ReturnType<TaskService["view"]>>;
      try {
        subject = await (await taskService()).view(one(parsed, "--task") ?? "");
      } catch {
        return failure("not_found", "No such task.", {
          input: { code: "OPUM_WORKFLOW_QUEST_ABSENT" },
        });
      }
      const bindingService = new OpumAgentWorkflowBindingService(
        await createTaskBindingModel(root),
      );
      let response: QuestTaskBindingV1Response;
      try {
        response = await bindingService.bind({
          contract: one(parsed, "--contract") ?? "",
          taskId: subject.id,
          claimOrCorrelationId: one(parsed, "--claim-or-correlation") ?? "",
          holder: one(parsed, "--holder") ?? "",
          repositoryId: one(parsed, "--repository") ?? "",
          baseRef: one(parsed, "--base") ?? "",
          settlementRef: one(parsed, "--settlement") ?? "",
          requestId: crypto.randomUUID().replaceAll("-", ""),
        });
      } catch (error) {
        if (!(error instanceof OpumAgentWorkflowError)) throw error;
        const errorType =
          error.code === "OPUM_WORKFLOW_QUEST_ABSENT"
            ? "not_found"
            : error.code === "OPUM_WORKFLOW_QUEST_INCOMPATIBLE"
              ? "drift"
              : "conflict";
        return failure(errorType, error.code, { input: { code: error.code } });
      }
      if (resolvedModes.json || parsed?.json) {
        // The public v1 surface prints the exact binding envelope on stdout.
        return {
          stdout: `${JSON.stringify(response)}\n`,
          stderr: "",
          exitCode: 0,
        };
      }
      const lines = [
        `contract ${response.contract}`,
        `selectedVersion ${response.selectedVersion}`,
        `requestId ${response.requestId}`,
        `taskId ${response.taskId}`,
        `repositoryId ${response.repositoryId}`,
        `holder ${response.holder}`,
        `taskState ${response.taskState}`,
        `relationshipKind ${response.relationshipKind}`,
        `relationshipId ${response.relationshipId}`,
        `relationshipState ${response.relationshipState}`,
        `baseRef ${response.baseRef}`,
        `settlementRef ${response.settlementRef}`,
        `issuedAt ${response.issuedAt}`,
        `expiresAt ${response.expiresAt}`,
      ];
      return {
        stdout:
          modeFor(parsed) === "plain"
            ? `${lines.join("\n")}\n`
            : `${lines.join("\n")}\n`,
        stderr: "",
        exitCode: 0,
      };
    }
    if (command === "create" && rest[0]) {
      const title = rest[0];
      const parsed = flags(rest.slice(1), [
        "--label",
        "--doc",
        "--alias",
        "--assignee",
        "--reference",
        "--modified-file",
        "--dependency",
      ]);
      if (
        !parsed ||
        !only(parsed, [
          "--id",
          "--summary",
          "--description",
          "--label",
          "--doc",
          "--priority",
          "--type",
          "--ordinal",
          "--alias",
          "--acceptance-criteria",
          "--definition-of-done",
          "--plan",
          "--implementation-notes",
          "--comments",
          "--assignee",
          "--reference",
          "--modified-file",
          "--dependency",
          "--parent",
          "--milestone",
          "--final-summary",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      )
        return failure("usage", "task create received invalid arguments.");
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      const tasks = await taskService();
      return output(
        await dispatchTrackerTaskCommand(tasks, {
          command,
          id: one(parsed, "--id") ?? (await nextTaskId(tasks)),
          operationId: crypto.randomUUID(),
          actor: writeActor,
          input: {
            title,
            summary: one(parsed, "--summary"),
            description: one(parsed, "--description"),
            labels: parsed.values.get("--label"),
            documentation: parsed.values.get("--doc"),
            priority: one(parsed, "--priority"),
            type: one(parsed, "--type"),
            ordinal: ordinalValue(one(parsed, "--ordinal")),
            aliases: parsed.values.get("--alias"),
            acceptanceCriteria: checkListValue(parsed, "--acceptance-criteria"),
            definitionOfDone: checkListValue(parsed, "--definition-of-done"),
            plan: stringValue(parsed, "--plan"),
            implementationNotes: stringValue(parsed, "--implementation-notes"),
            comments: commentsValue(parsed, "--comments"),
            assignees: parsed.values.get("--assignee"),
            references: parsed.values.get("--reference"),
            modifiedFiles: parsed.values.get("--modified-file"),
            dependencies: parsed.values.get("--dependency"),
            parentId: one(parsed, "--parent"),
            milestoneId: one(parsed, "--milestone"),
            finalSummary: one(parsed, "--final-summary"),
          },
        }),
        modeFor(parsed),
      );
    }
    if (command === "edit" && rest[0]) {
      const reference = rest[0];
      const parsed = flags(rest.slice(1), [
        "--add-label",
        "--remove-label",
        "--doc",
        "--add-plan",
        "--remove-plan",
        "--add-note",
        "--remove-note",
        "--add-comment",
        "--remove-comment",
        "--add-dependency",
        "--remove-dependency",
        "--add-assignee",
        "--remove-assignee",
        "--add-reference",
        "--remove-reference",
        "--add-modified-file",
        "--remove-modified-file",
      ]);
      if (
        !parsed ||
        !only(parsed, [
          "--status",
          "--summary",
          "--description",
          "--labels",
          "--add-label",
          "--remove-label",
          "--doc",
          "--plan",
          "--add-plan",
          "--remove-plan",
          "--notes",
          "--add-note",
          "--remove-note",
          "--comments",
          "--add-comment",
          "--remove-comment",
          "--acceptance-criteria",
          "--definition-of-done",
          "--add-dependency",
          "--remove-dependency",
          "--parent",
          "--clear-parent",
          "--milestone",
          "--clear-milestone",
          "--add-assignee",
          "--remove-assignee",
          "--add-reference",
          "--remove-reference",
          "--add-modified-file",
          "--remove-modified-file",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      )
        return failure("usage", "task edit received invalid arguments.");
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          reference,
          operationId: crypto.randomUUID(),
          actor: writeActor,
          patch: {
            status: one(parsed, "--status"),
            summary: one(parsed, "--summary"),
            description: one(parsed, "--description"),
            labels: stringValue(parsed, "--labels"),
            addLabels: parsed.values.get("--add-label"),
            removeLabels: parsed.values.get("--remove-label"),
            documentation: parsed.values.get("--doc"),
            plan: stringValue(parsed, "--plan"),
            addPlan: parsed.values.get("--add-plan"),
            removePlan: parsed.values.get("--remove-plan"),
            implementationNotes: stringValue(parsed, "--notes"),
            addNotes: parsed.values.get("--add-note"),
            removeNotes: parsed.values.get("--remove-note"),
            comments: commentsValue(parsed, "--comments"),
            addComments: commentsValue(parsed, "--add-comment"),
            removeComments: parsed.values.get("--remove-comment"),
            acceptanceCriteria: checkListValue(parsed, "--acceptance-criteria"),
            definitionOfDone: checkListValue(parsed, "--definition-of-done"),
            addDependencies: parsed.values.get("--add-dependency"),
            removeDependencies: parsed.values.get("--remove-dependency"),
            parentId: one(parsed, "--parent"),
            clearParent: parsed.values.has("--clear-parent") || undefined,
            milestoneId: one(parsed, "--milestone"),
            clearMilestone: parsed.values.has("--clear-milestone") || undefined,
            addAssignees: parsed.values.get("--add-assignee"),
            removeAssignees: parsed.values.get("--remove-assignee"),
            addReferences: parsed.values.get("--add-reference"),
            removeReferences: parsed.values.get("--remove-reference"),
            addModifiedFiles: parsed.values.get("--add-modified-file"),
            removeModifiedFiles: parsed.values.get("--remove-modified-file"),
          },
        }),
        modeFor(parsed),
      );
    }
    return failure("usage", "Unknown or missing Quest command.");
  } catch (error) {
    if (error instanceof FlagUsageError) return failure("usage", error.message);
    const message =
      error instanceof Error
        ? error.message
        : "Quest encountered an unexpected error.";
    const code =
      error && typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
    const kind =
      error && typeof error === "object" && "kind" in error
        ? (error as { kind?: unknown }).kind
        : undefined;
    if (code === "EACCES" || code === "EPERM")
      return failure(
        "denied",
        `Quest cannot access required storage: ${message}`,
        {
          hint: "Check the task-store filesystem permissions and retry.",
        },
      );
    if (
      message === "tracker_write_conflict" ||
      message === "dependency_target_ambiguous"
    )
      return failure(
        "conflict",
        "Task state changed concurrently; the operation was not applied.",
        {
          hint: "Read the latest task state and retry the operation.",
        },
      );
    if (kind === "conflict") return failure("conflict", message);
    if (message === "task_not_found") return failure("not_found", message);
    if (
      [
        "task_not_found",
        "draft_not_found",
        "milestone_not_found",
        "decision_not_found",
      ].includes(message)
    )
      return failure("not_found", message);
    return failure("validation", message);
  }
}

if (import.meta.main) {
  const result = await runQuest(
    process.argv.slice(2),
    Boolean(process.stdout.isTTY),
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
