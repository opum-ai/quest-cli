#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { Command } from "commander";
import {
  type AgentInstructionCheck,
  inspectQuestAgentInstructions,
  inspectQuestSkillFile,
  questAgentInstructions,
  updateQuestAgentInstructions,
  updateQuestSkillFile,
} from "../application/agents/agent-instructions.ts";
import { startBrowserServer } from "../application/browser/browser.ts";
import type { QuestTaskBindingV1Response } from "../application/claims/opum-agent-workflow.ts";
import {
  OpumAgentWorkflowBindingService,
  OpumAgentWorkflowError,
  parseStrictJson,
  parseTaskBindingRequestV1,
} from "../application/claims/opum-agent-workflow.ts";
import {
  commandManifest,
  diagnostic,
  exitCodeFor,
  manifestResult,
  type OutputMode,
  selectOutputMode,
} from "../application/command-contract.ts";
import { commandHelp } from "../application/command-help.ts";
import type { PlanningService } from "../application/planning/planning.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import type { TaskService } from "../application/tasks/tasks.ts";
import {
  initializeWorkspace,
  isValidTaskIdPrefix,
  resolveInitializedWorkspace,
  resolveWorkspaceConfiguration,
  WorkspaceError,
} from "../application/workspaces/workspaces.ts";
import { QUEST_VERSION } from "../application/version.ts";
import { dispatchTrackerTaskCommand } from "./commands/task/index.ts";
import {
  createAgentInstructionPort,
  createBacklogImportService,
  createPlanningService,
  createTaskBindingModel,
  createTaskService,
  createWorkspacePort,
} from "./composition.ts";
import { migrationSmokeResult } from "./migration-smoke.ts";
import { renderHumanPayload } from "./render.ts";

const VERSION = QUEST_VERSION;

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

/** Merges human help content into manifest entries for `quest help` output
 * only; `commandManifest`/`quest manifest` are never touched. */
function withHelp(entries: typeof commandManifest.commands) {
  return entries.map((entry) => ({
    ...entry,
    ...commandHelp[entry.name],
  }));
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
    "--clear-ac",
    "--clear-dod",
    "--ready",
    "--unassigned",
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

/**
 * Parses repeatable 1-based checklist positions (QCLI-138). Anything that is
 * not a positive integer is a usage error here rather than a silent no-op, so
 * `--check-ac 0` or `--check-ac two` never quietly leaves the box unchecked.
 */
function indexListValue(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): number[] | undefined {
  const values = parsed.values.get(name);
  if (values === undefined) return undefined;
  return values.map((value) => {
    if (!/^[1-9][0-9]*$/.test(value))
      throw new FlagUsageError(`${name} must be a 1-based positive integer.`);
    const parsedValue = Number(value);
    if (!Number.isSafeInteger(parsedValue))
      throw new FlagUsageError(`${name} must be a 1-based positive integer.`);
    return parsedValue;
  });
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

const TASK_LIST_SORT_FIELDS = [
  "id",
  "title",
  "status",
  "priority",
  "type",
  "ordinal",
  "createdAt",
  "updatedAt",
] as const;

/**
 * Splits a repeatable selection flag that also accepts one comma-separated
 * value, matching the tracker Quest is at parity with. Blank members are
 * dropped so a trailing comma is not a filter for the empty string.
 */
function csvValues(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string[] | undefined {
  const values = parsed.values.get(name);
  if (values === undefined) return undefined;
  const members = values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (members.length === 0)
    throw new FlagUsageError(`${name} requires at least one value.`);
  return members;
}

/** Parses `--sort <field>[:asc|desc]`; default direction is ascending. */
function sortValue(
  value: string | undefined,
): { readonly field: string; readonly direction: "asc" | "desc" } | undefined {
  if (value === undefined) return undefined;
  const [field, direction, ...rest] = value.split(":");
  if (
    rest.length > 0 ||
    !field ||
    !(TASK_LIST_SORT_FIELDS as readonly string[]).includes(field) ||
    (direction !== undefined && direction !== "asc" && direction !== "desc")
  )
    throw new FlagUsageError(
      `--sort must be one of ${TASK_LIST_SORT_FIELDS.join(", ")}, optionally suffixed with :asc or :desc.`,
    );
  return { field, direction: direction === "desc" ? "desc" : "asc" };
}

function limitValue(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!/^[1-9][0-9]*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new FlagUsageError("--limit must be a positive integer.");
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

async function nextTaskId(tasks: TaskService, prefix: string): Promise<string> {
  const ids = await tasks.listIncludingRetained();
  // Only this prefix's own family can advance the counter: a foreign-prefixed
  // id (an imported record, or a workspace whose prefix changed) must never
  // perturb the sequence.
  const marker = `${prefix}-`;
  const highest = ids.reduce((maximum, task) => {
    if (!task.id.startsWith(marker)) return maximum;
    const numeric = Number(task.id.slice(marker.length));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `${prefix}-${highest + 1}`;
}

async function nextDraftId(tasks: TaskService): Promise<string> {
  const drafts = await tasks.listDrafts(true);
  const highest = drafts.reduce((maximum, record) => {
    const numeric = Number(record.draft.id.slice(2));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `D-${highest + 1}`;
}

/** Asks one question on the real terminal and returns the trimmed answer, or
 * defaultValue when the answer is empty. Swapped out in tests. */
async function readlinePrompt(
  question: string,
  defaultValue: string,
): Promise<string> {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(`${question} [${defaultValue}]: `);
    return answer.trim() || defaultValue;
  } finally {
    rl.close();
  }
}

async function readlineConfirm(
  question: string,
  defaultYes: boolean,
): Promise<boolean> {
  const { createInterface } = await import("node:readline/promises");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await rl.question(
      `${question} [${defaultYes ? "Y/n" : "y/N"}]: `,
    );
    const trimmed = answer.trim();
    if (!trimmed) return defaultYes;
    return /^y/i.test(trimmed);
  } finally {
    rl.close();
  }
}

export interface InitWizardPrompts {
  readonly text: (question: string, defaultValue: string) => Promise<string>;
  readonly confirm: (question: string, defaultYes: boolean) => Promise<boolean>;
}

export interface InitWizardAnswers {
  readonly name: string;
  readonly taskIdPrefix: string;
  readonly writeInstructions: boolean;
}

/** The interactive quest init question set, isolated from real readline/TTY
 * so it can run against a fake prompt in tests. */
export async function runInitWizard(
  defaultName: string,
  prompts: InitWizardPrompts,
): Promise<InitWizardAnswers> {
  const name = await prompts.text("Project name", defaultName);
  const taskIdPrefix =
    (await prompts.text("Task ID prefix", "T")).trim() || "T";
  const writeInstructions = await prompts.confirm(
    "Write CLAUDE.md/AGENTS.md instructions?",
    true,
  );
  return { name, taskIdPrefix, writeInstructions };
}

async function nextPlanningId(
  planning: PlanningService,
  prefix: "M" | "DEC",
): Promise<string> {
  // Archived milestones keep their ids, so allocation must see them: listing
  // only the live ones would hand out an id that already exists.
  const records =
    prefix === "M"
      ? await planning.listMilestones(true)
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
  stdinIsTty: boolean = process.stdin.isTTY === true,
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
    let taskIdPrefix: Promise<string> | undefined;
    const configuredTaskIdPrefix = () =>
      (taskIdPrefix ??= (async () => {
        if (process.env.QUEST_TASK_STORE !== undefined) return "T";
        try {
          const configuration = await resolveWorkspaceConfiguration(
            createWorkspacePort(),
            process.cwd(),
          );
          return configuration.taskIdPrefix ?? "T";
        } catch {
          return "T";
        }
      })());
    if (arguments_.length === 0) {
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands: withHelp(commandManifest.commands) },
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
      const matched = helpTarget
        ? commandManifest.commands.filter(
            (entry) =>
              entry.name === helpTarget ||
              entry.name.startsWith(`${helpTarget} `),
          )
        : commandManifest.commands;
      if (helpTarget && matched.length === 0)
        return failure("not_found", `No help is available for ${helpTarget}.`);
      const commands = withHelp(matched);
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
      if (
        !parsed ||
        !only(parsed, ["--agent-instructions", "--name", "--task-id-prefix"])
      )
        return failure(
          "usage",
          "init accepts only --name, --task-id-prefix, --agent-instructions, --json, and --plain.",
        );
      const explicitFlagsGiven =
        parsed.values.has("--agent-instructions") ||
        parsed.values.has("--name") ||
        parsed.values.has("--task-id-prefix");
      const explicitOutputMode =
        resolvedModes.json ||
        resolvedModes.plain ||
        parsed.json ||
        parsed.plain;
      const interactive =
        stdoutIsTty && stdinIsTty && !explicitOutputMode && !explicitFlagsGiven;
      let name = one(parsed, "--name");
      let taskIdPrefix = one(parsed, "--task-id-prefix");
      let writeInstructions = parsed.values.has("--agent-instructions");
      if (interactive) {
        const answers = await runInitWizard(basename(process.cwd()), {
          text: readlinePrompt,
          confirm: readlineConfirm,
        });
        name = answers.name;
        taskIdPrefix = answers.taskIdPrefix;
        writeInstructions = answers.writeInstructions;
      }
      // Fail at init rather than at the first task write, which is where an
      // unusable prefix would otherwise surface.
      if (taskIdPrefix !== undefined && !isValidTaskIdPrefix(taskIdPrefix))
        return failure(
          "usage",
          `Task ID prefix must start with a letter and contain only letters and digits: ${taskIdPrefix}`,
        );
      const workspace = await initializeWorkspace(
        createWorkspacePort(),
        process.cwd(),
        { name, taskIdPrefix },
      );
      let instructions: AgentInstructionCheck | undefined;
      let skill: AgentInstructionCheck | undefined;
      if (writeInstructions) {
        const agentInstructionPort = createAgentInstructionPort(process.cwd());
        instructions = await updateQuestAgentInstructions(agentInstructionPort);
        skill = await updateQuestSkillFile(agentInstructionPort);
      }
      return output(
        {
          schemaVersion: 1,
          kind: "workspace.initialized",
          data: {
            workspace,
            configuration: { name, taskIdPrefix },
            instructions,
            skill,
          },
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
      const agentInstructionPort = createAgentInstructionPort(process.cwd());
      const instructionsResult = check
        ? await inspectQuestAgentInstructions(agentInstructionPort)
        : await updateQuestAgentInstructions(agentInstructionPort);
      const skillResult = check
        ? await inspectQuestSkillFile(agentInstructionPort)
        : await updateQuestSkillFile(agentInstructionPort);
      if (check) {
        if (instructionsResult.state === "drift")
          return failure("drift", instructionsResult.message);
        if (skillResult.state === "drift")
          return failure("drift", skillResult.message);
        if (
          requireInstalled &&
          (instructionsResult.state === "missing" ||
            skillResult.state === "missing")
        )
          return failure(
            "validation",
            "Quest agent instruction block is missing. Run quest agents --update-instructions.",
          );
      }
      return output(
        {
          schemaVersion: 1,
          kind: "agent.instructions-status",
          data: { ...instructionsResult, skill: skillResult },
        },
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
            action === "delete" ||
            action === "archive"
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
      if (
        action === "list" &&
        only(parsed, isMilestone ? ["--include-archived"] : [])
      ) {
        const data = isMilestone
          ? await planning.listMilestones(
              parsed.values.has("--include-archived"),
            )
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
      if (
        action === "archive" &&
        isMilestone &&
        rest[0] &&
        only(parsed, ["--actor", "--actor-kind", "--accountable-human"])
      ) {
        const writeActor = actor(parsed);
        if (!writeActor)
          return failure(
            "denied",
            `${group} writes require an explicit actor declaration.`,
          );
        return output(
          {
            schemaVersion: 1,
            kind: "milestone.archived",
            data: await planning.archiveMilestone(rest[0], crypto.randomUUID()),
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
          one(parsed, "--task-id") ??
            (await nextTaskId(tasks, await configuredTaskIdPrefix())),
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
      const parsed = flags(rest, [
        "--label",
        "--exclude-status",
        "--assignee",
        "--type",
      ]);
      if (
        !parsed ||
        !only(parsed, [
          "--status",
          "--label",
          "--ready",
          "--exclude-status",
          "--assignee",
          "--unassigned",
          "--milestone",
          "--parent",
          "--priority",
          "--type",
          "--search",
          "--limit",
          "--sort",
        ])
      )
        return failure("usage", "task list received invalid arguments.");
      if (parsed.values.has("--assignee") && parsed.values.has("--unassigned"))
        return failure(
          "usage",
          "task list --assignee and --unassigned cannot be combined.",
        );
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          status: one(parsed, "--status"),
          labels: parsed.values.get("--label"),
          ready: parsed.values.has("--ready") || undefined,
          excludeStatuses: csvValues(parsed, "--exclude-status"),
          assignees: csvValues(parsed, "--assignee"),
          unassigned: parsed.values.has("--unassigned") || undefined,
          milestoneId: one(parsed, "--milestone"),
          parentId: one(parsed, "--parent"),
          priority: one(parsed, "--priority"),
          types: csvValues(parsed, "--type"),
          search: one(parsed, "--search"),
          limit: limitValue(one(parsed, "--limit")),
          sort: sortValue(one(parsed, "--sort")),
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
      const bindingFlagNames = [
        "--task",
        "--claim-or-correlation",
        "--holder",
        "--repository",
        "--base",
        "--settlement",
      ] as const;
      // Non-TTY stdin is piped input. Piped transport requires the exact
      // envelope and NO binding flag; a complete flag set over an empty or
      // closed pipe remains the legacy flag-driven form (AC byte-compat).
      const stdinIsPiped = stdinIsTty !== true;
      const suppliedBindingFlags = parsed
        ? bindingFlagNames.filter((flag) => one(parsed, flag) !== undefined)
        : [];
      let pipedBody: string | null = null;
      if (stdinIsPiped) {
        pipedBody = await Bun.stdin.text();
        if (suppliedBindingFlags.length > 0 && pipedBody.trim() !== "") {
          return failure(
            "usage",
            "task binding accepts either the piped stdin request envelope alone or the complete --task/--claim-or-correlation/--holder/--repository/--base/--settlement flag set, never both.",
          );
        }
      }
      const flagsIncomplete =
        !parsed ||
        (suppliedBindingFlags.length > 0 &&
          bindingFlagNames.some((flag) => one(parsed, flag) === undefined));
      if (
        !parsed ||
        !only(parsed, ["--contract", ...bindingFlagNames]) ||
        !one(parsed, "--contract") ||
        flagsIncomplete
      )
        return failure(
          "usage",
          "task binding requires --contract plus either the piped stdin request envelope alone or all of --task/--claim-or-correlation/--holder/--repository/--base/--settlement.",
        );
      const stdinTransport = stdinIsPiped && suppliedBindingFlags.length === 0;
      const root = await resolvedRoot();
      // No mutable pre-snapshot task read: the raw reference is resolved
      // entirely inside the immutable revision-pinned snapshot model.
      const bindingService = new OpumAgentWorkflowBindingService(
        await createTaskBindingModel(root),
      );
      let envelopeTaskId = one(parsed, "--task") ?? "";
      let envelopeRequestId = crypto.randomUUID().replaceAll("-", "");
      let deriveAssertionsFromRecord = false;
      let stdinCorrelation: string | undefined;
      if (stdinTransport) {
        // The deployed opum-agent facade writes the exact request envelope to
        // stdin; parse and validate it strictly before any resolution.
        let parsedEnvelope: unknown;
        try {
          parsedEnvelope = parseStrictJson(pipedBody ?? "");
        } catch {
          return failure("drift", "OPUM_WORKFLOW_QUEST_INCOMPATIBLE", {
            input: { code: "OPUM_WORKFLOW_QUEST_INCOMPATIBLE" },
          });
        }
        // Facade transport compatibility: the deployed opum-agent facade
        // appends its claim-or-correlation reference to the piped envelope.
        // Lift that one transport field out before the strict domain
        // validation so the normative four-key envelope is what the domain
        // contract sees; the reference feeds the relationship lookup only.
        if (
          parsedEnvelope !== null &&
          typeof parsedEnvelope === "object" &&
          !Array.isArray(parsedEnvelope) &&
          "claimOrCorrelation" in parsedEnvelope
        ) {
          const { claimOrCorrelation: correlation, ...remainder } =
            parsedEnvelope as Record<string, unknown>;
          if (typeof correlation !== "string") {
            return failure("drift", "OPUM_WORKFLOW_QUEST_INCOMPATIBLE", {
              input: { code: "OPUM_WORKFLOW_QUEST_INCOMPATIBLE" },
            });
          }
          stdinCorrelation = correlation;
          parsedEnvelope = remainder;
        }
        let checked: ReturnType<typeof parseTaskBindingRequestV1>;
        try {
          checked = parseTaskBindingRequestV1(parsedEnvelope);
        } catch (error) {
          if (!(error instanceof OpumAgentWorkflowError)) throw error;
          return failure("drift", error.code, {
            input: { code: error.code },
          });
        }
        envelopeTaskId = checked.taskId;
        envelopeRequestId = checked.requestId;
        deriveAssertionsFromRecord = true;
      }
      let response: QuestTaskBindingV1Response;
      try {
        response = await bindingService.bind({
          contract: one(parsed, "--contract") ?? "",
          taskId: envelopeTaskId,
          claimOrCorrelationId:
            stdinCorrelation ??
            one(parsed, "--claim-or-correlation") ??
            envelopeTaskId,
          holder: one(parsed, "--holder") ?? "",
          repositoryId: one(parsed, "--repository") ?? "",
          baseRef: one(parsed, "--base") ?? "",
          settlementRef: one(parsed, "--settlement") ?? "",
          requestId: envelopeRequestId,
          deriveAssertionsFromRecord,
        });
      } catch (error) {
        if (!(error instanceof OpumAgentWorkflowError)) throw error;
        const errorType =
          error.code === "OPUM_WORKFLOW_QUEST_ABSENT"
            ? "not_found"
            : error.code === "OPUM_WORKFLOW_QUEST_INCOMPATIBLE"
              ? "drift"
              : "conflict";
        return failure(errorType, error.code, {
          input: { code: error.code },
        });
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
          id:
            one(parsed, "--id") ??
            (await nextTaskId(tasks, await configuredTaskIdPrefix())),
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
    if (command === "edit-batch") {
      // QCLI-122 public batch boundary (strict JSONL per FMC 05fe52e8):
      // malformed/unknown/managed content fails at parse time or becomes a
      // documented per-item error — never a silent successful no-op.
      const parsed = flags(rest, [
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
          "--file",
          "--actor",
          "--actor-kind",
          "--accountable-human",
        ])
      )
        return failure(
          "usage",
          "task edit-batch requires exactly one --file pointing at a JSONL operations file plus --actor/--actor-kind.",
        );
      const filePath = one(parsed, "--file");
      if (!filePath)
        return failure(
          "usage",
          "task edit-batch requires --file <operations.jsonl>.",
        );
      let raw: string;
      try {
        raw = await readFile(filePath, "utf8");
      } catch {
        return failure(
          "not_found",
          `Operations file is not readable: ${filePath}`,
        );
      }
      const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
      const writeActor = actor(parsed);
      if (!writeActor)
        return failure(
          "denied",
          "Tracker writes require an explicit actor declaration.",
        );
      // Empty file is a public no-op: zero items plus the authoritative
      // revision, no lock/journal/mutation (QCLI-122 third pass #8).
      if (lines.length === 0) {
        return output(
          await dispatchTrackerTaskCommand(await taskService(), {
            command,
            actor: writeActor,
            items: [],
          }),
          modeFor(parsed),
        );
      }
      // Allowed patch keys come straight from the published manifest entry so
      // the CLI cannot drift from the public contract.
      const manifestEntry = commandManifest.commands.find(
        (entry: { name: string }) => entry.name === "task edit-batch",
      ) as { fields?: readonly string[] } | undefined;
      const allowedPatchKeys = new Set(manifestEntry?.fields ?? []);
      if (allowedPatchKeys.size === 0) allowedPatchKeys.add("__unavailable__"); // defensive: no-op semantics
      const managedKeys = new Set(["gates", "gateEvents"]);
      const seenOperationIds = new Set<string>();
      const items: unknown[] = [];
      for (const [index, line] of lines.entries()) {
        let value: unknown;
        try {
          value = JSON.parse(line);
        } catch {
          return failure(
            "usage",
            `Malformed operations JSONL at line ${index + 1}.`,
          );
        }
        const record = value as Record<string, unknown>;
        if (!record || typeof record !== "object" || Array.isArray(record))
          return failure(
            "usage",
            `Invalid operations item at line ${index + 1}: expected an object.`,
          );
        const allowedTop = new Set(["reference", "operationId", "patch"]);
        for (const key of Object.keys(record))
          if (!allowedTop.has(key))
            return failure(
              "usage",
              `Unknown field ${key} in operations item at line ${index + 1}.`,
            );
        const reference =
          typeof record.reference === "string" ? record.reference : undefined;
        if (!reference)
          return failure(
            "usage",
            `Missing reference string in operations item at line ${index + 1}.`,
          );
        const operationIdRaw = record.operationId;
        if (
          typeof operationIdRaw !== "string" ||
          operationIdRaw.trim().length === 0
        )
          return failure(
            "usage",
            `Operation id must be a non-empty string in operations item at line ${index + 1}.`,
          );
        if (seenOperationIds.has(operationIdRaw))
          return failure(
            "usage",
            `Duplicate operation id ${operationIdRaw} at line ${index + 1}.`,
          );
        seenOperationIds.add(operationIdRaw);
        const patchValue = record.patch;
        if (
          patchValue !== undefined &&
          (typeof patchValue !== "object" ||
            patchValue === null ||
            Array.isArray(patchValue))
        )
          return failure(
            "usage",
            `Patch must be an object in operations item at line ${index + 1}.`,
          );
        const patchObject = (patchValue as Record<string, unknown>) ?? {};
        for (const [patchKey, fieldValue] of Object.entries(patchObject)) {
          if (managedKeys.has(patchKey) || !allowedPatchKeys.has(patchKey))
            return failure(
              "usage",
              `${managedKeys.has(patchKey) ? "Managed" : "Unknown"} patch key ${patchKey} in operations item at line ${index + 1}.`,
            );
          // QCLI-122 third pass #6: value types must match the published
          // vocabulary — a string never silently char-iterates into a list.
          // QCLI-122 fourth pass #5: complete field grammar — scalar vs
          // list vs checklist-object vs boolean, validated atomically.
          // QCLI-138: index-addressed checklist positions are a number list,
          // so they must be classified before the add|remove string-list rule
          // that removeAcceptanceCriteria would otherwise match.
          const indexListFields = new Set([
            "checkAcceptanceCriteria",
            "uncheckAcceptanceCriteria",
            "removeAcceptanceCriteria",
            "checkDefinitionOfDone",
            "uncheckDefinitionOfDone",
            "removeDefinitionOfDone",
          ]);
          const isListField =
            (/^(add|remove)[A-Z]/.test(patchKey) &&
              !indexListFields.has(patchKey)) ||
            [
              "labels",
              "documentation",
              "plan",
              "implementationNotes",
              "assignees",
              "references",
              "modifiedFiles",
              "dependencies",
            ].includes(patchKey);
          const booleanFields = new Set([
            "clearParent",
            "clearMilestone",
            "clearAcceptanceCriteria",
            "clearDefinitionOfDone",
          ]);
          const checklistFields = new Set([
            "acceptanceCriteria",
            "definitionOfDone",
          ]);
          const commentFields = new Set(["comments", "addComments"]);
          if (booleanFields.has(patchKey)) {
            if (typeof fieldValue !== "boolean")
              return failure(
                "usage",
                `Patch key ${patchKey} must be a boolean in operations item at line ${index + 1}.`,
              );
          } else if (indexListFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some(
                (entry) =>
                  !Number.isSafeInteger(entry) || (entry as number) < 1,
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a list of 1-based positive integers in operations item at line ${index + 1}.`,
              );
          } else if (checklistFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some(
                (entry) =>
                  !(
                    typeof entry === "string" ||
                    (entry !== null &&
                      typeof entry === "object" &&
                      !Array.isArray(entry) &&
                      typeof (entry as { index?: unknown }).index ===
                        "number" &&
                      typeof (entry as { text?: unknown }).text === "string" &&
                      typeof (entry as { checked?: unknown }).checked ===
                        "boolean")
                  ),
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a string or {index,text,checked} list in operations item at line ${index + 1}.`,
              );
          } else if (commentFields.has(patchKey)) {
            if (
              !Array.isArray(fieldValue) ||
              fieldValue.some((entry) => typeof entry !== "object") ||
              fieldValue.some(
                (entry) =>
                  entry !== null &&
                  typeof entry === "object" &&
                  Array.isArray(entry),
              )
            )
              return failure(
                "usage",
                `Patch key ${patchKey} must be a comment object list in operations item at line ${index + 1}.`,
              );
          } else if (isListField) {
            if (!Array.isArray(fieldValue))
              return failure(
                "usage",
                `Invalid list value for patch key ${patchKey} in operations item at line ${index + 1}.`,
              );
            if (
              fieldValue.some(
                (entry) =>
                  entry === null ||
                  typeof entry === "object" ||
                  typeof entry === "number" ||
                  typeof entry === "boolean",
              )
            )
              return failure(
                "usage",
                `Invalid list member type for patch key ${patchKey} in operations item at line ${index + 1}.`,
              );
          } else if (patchKey === "status") {
            if (
              typeof fieldValue !== "string" ||
              !["To Do", "In Progress", "Done"].includes(fieldValue)
            )
              return failure(
                "usage",
                `Invalid status value in operations item at line ${index + 1}.`,
              );
          } else if (patchKey === "ordinal") {
            if (!Number.isFinite(fieldValue))
              return failure(
                "usage",
                `Patch key ordinal must be numeric in operations item at line ${index + 1}.`,
              );
          } else {
            // Default: plain scalar string fields from the manifest.
            if (typeof fieldValue !== "string")
              return failure(
                "usage",
                `Patch key ${patchKey} must be a string in operations item at line ${index + 1}.`,
              );
          }
        }
        items.push(record);
      }
      return output(
        await dispatchTrackerTaskCommand(await taskService(), {
          command,
          actor: writeActor,
          items: items as {
            reference: string;
            operationId?: string;
            patch?: Record<string, unknown>;
          }[],
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
        "--check-ac",
        "--uncheck-ac",
        "--remove-ac",
        "--check-dod",
        "--uncheck-dod",
        "--remove-dod",
      ]);
      if (
        !parsed ||
        !only(parsed, [
          "--status",
          "--title",
          "--priority",
          "--type",
          "--ordinal",
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
          "--check-ac",
          "--uncheck-ac",
          "--remove-ac",
          "--clear-ac",
          "--check-dod",
          "--uncheck-dod",
          "--remove-dod",
          "--clear-dod",
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
            title: one(parsed, "--title"),
            priority: one(parsed, "--priority"),
            type: one(parsed, "--type"),
            // Same parser create uses, so the two paths cannot diverge.
            ordinal: ordinalValue(one(parsed, "--ordinal")),
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
            checkAcceptanceCriteria: indexListValue(parsed, "--check-ac"),
            uncheckAcceptanceCriteria: indexListValue(parsed, "--uncheck-ac"),
            removeAcceptanceCriteria: indexListValue(parsed, "--remove-ac"),
            clearAcceptanceCriteria:
              parsed.values.has("--clear-ac") || undefined,
            checkDefinitionOfDone: indexListValue(parsed, "--check-dod"),
            uncheckDefinitionOfDone: indexListValue(parsed, "--uncheck-dod"),
            removeDefinitionOfDone: indexListValue(parsed, "--remove-dod"),
            clearDefinitionOfDone:
              parsed.values.has("--clear-dod") || undefined,
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
    if (error instanceof WorkspaceError && error.code === "not_git_worktree")
      return failure(
        "validation",
        "No Git repository was found here. Run `git init` to create one, then re-run `quest init`.",
        {
          hint: "Quest requires an existing Git worktree; it does not create one for you.",
        },
      );
    // Decidable from argv alone, so they belong with the other flag-combination
    // usage errors rather than the post-read validation failures. The fold
    // still owns the rule, so `task edit-batch` reports it per item.
    if (message === "check_operation_conflict")
      return failure(
        "usage",
        "Checklist replacement, --clear-ac/--clear-dod, and the index-addressed operations cannot be combined.",
        {
          hint: "Use --clear-ac or --clear-dod on its own, and keep --acceptance-criteria/--definition-of-done in a separate edit from --check-*/--uncheck-*/--remove-*.",
        },
      );
    if (message === "check_index_conflict")
      return failure(
        "usage",
        "One checklist position was given contradictory operations.",
        {
          hint: "Address each position once: do not check and uncheck it, or remove and check it, in the same edit.",
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
