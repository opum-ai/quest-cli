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
import {
  initializeWorkspace,
  resolveInitializedWorkspace,
} from "../application/workspaces/workspaces.ts";
import { dispatchTrackerTaskCommand } from "./commands/task/index.ts";
import {
  createAgentInstructionPort,
  createPlanningService,
  createWorkspacePort,
} from "./composition.ts";
import { migrationSmokeResult } from "./migration-smoke.ts";

const VERSION = "0.2.1";

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
): InvocationResult {
  const error = diagnostic(errorType, message);
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
  return {
    stdout:
      mode === "json"
        ? `${JSON.stringify(data)}\n`
        : `${(data as { kind: string }).kind}\n`,
    stderr: "",
    exitCode: 0,
  };
}

function flags(argv: readonly string[]):
  | {
      readonly values: Map<string, string[]>;
      readonly json: boolean;
      readonly plain: boolean;
    }
  | undefined {
  const values = new Map<string, string[]>();
  let json = false;
  let plain = false;
  const booleanFlags = new Set([
    "--agent-instructions",
    "--check",
    "--update-instructions",
    "--confirm",
    "--dry-run",
    "--include-archived",
    "--all",
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === "--json") {
      json = true;
      continue;
    }
    if (flag === "--plain") {
      plain = true;
      continue;
    }
    if (!flag?.startsWith("--")) return undefined;
    if (booleanFlags.has(flag)) {
      if (values.has(flag)) return undefined;
      values.set(flag, []);
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined) return undefined;
    const entries = values.get(flag) ?? [];
    entries.push(value);
    values.set(flag, entries);
    index += 1;
  }
  return { values, json, plain };
}

function one(
  parsed: NonNullable<ReturnType<typeof flags>>,
  name: string,
): string | undefined {
  const values = parsed.values.get(name);
  return values?.length === 1 ? values[0] : undefined;
}

function only(
  parsed: NonNullable<ReturnType<typeof flags>>,
  allowed: readonly string[],
): boolean {
  return [...parsed.values.keys()].every((flag) => allowed.includes(flag));
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
  arguments_: readonly string[],
  stdoutIsTty: boolean,
): Promise<InvocationResult> {
  try {
    if (arguments_.length === 1 && arguments_[0] === "--version")
      return { stdout: `${VERSION}\n`, stderr: "", exitCode: 0 };
    const modeFor = (parsed: NonNullable<ReturnType<typeof flags>>) =>
      selectOutputMode({ ...parsed, stdoutIsTty });
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
        stdoutIsTty ? "pretty" : "plain",
      );
    }
    if (
      ["--help", "help"].includes(arguments_[0] ?? "") ||
      arguments_[1] === "--help"
    ) {
      const helpTarget =
        arguments_[0] === "help"
          ? arguments_[1]
          : arguments_[1] === "--help"
            ? arguments_[0]
            : undefined;
      const parsed = flags(
        arguments_[0] === "help"
          ? arguments_.slice(helpTarget ? 2 : 1)
          : arguments_[1] === "--help"
            ? arguments_.slice(2)
            : arguments_.slice(1),
      );
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
      return output(
        {
          schemaVersion: 1,
          kind: "help.commands",
          data: { commands },
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
      if (!parsed || !only(parsed, ["--check", "--update-instructions"]))
        return failure(
          "usage",
          "agents requires --check or --update-instructions.",
        );
      const check = parsed.values.has("--check");
      const update = parsed.values.has("--update-instructions");
      if (check === update)
        return failure("usage", "agents requires exactly one action.");
      const result = check
        ? await inspectQuestAgentInstructions(
            createAgentInstructionPort(process.cwd()),
          )
        : await updateQuestAgentInstructions(
            createAgentInstructionPort(process.cwd()),
          );
      if (check && result.state === "drift")
        return failure("drift", result.message);
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
          selectOutputMode({ ...parsed, stdoutIsTty }),
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
      return output(
        await migrationSmokeResult(),
        selectOutputMode({ ...parsed, stdoutIsTty }),
      );
    }
    if (arguments_[0] === "manifest") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure("usage", "manifest accepts only --json and --plain.");
      return output(
        manifestResult(),
        selectOutputMode({ ...parsed, stdoutIsTty }),
      );
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
      const parsed = flags(
        rest.slice(
          action === "create" ||
            action === "view" ||
            action === "edit" ||
            action === "delete"
            ? 1
            : 0,
        ),
      );
      if (!action || !parsed)
        return failure("usage", `${group} requires a valid action.`);
      const planning = await planningService();
      const isMilestone = group === "milestone";
      if (action === "list" && only(parsed, [])) {
        const data = isMilestone
          ? await planning.listMilestones()
          : await planning.listDecisions();
        return output(
          {
            schemaVersion: 1,
            kind: isMilestone ? "milestone.records" : "decision.records",
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
            kind: isMilestone ? "milestone.records" : "decision.records",
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
            kind: isMilestone ? "milestone.records" : "decision.records",
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
            kind: isMilestone ? "milestone.records" : "decision.records",
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
        const data = isMilestone
          ? await planning.updateMilestone(
              {
                ...(await planning.viewMilestone(rest[0])),
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
                ...(parsed.values.has("--task")
                  ? { taskIds: parsed.values.get("--task") ?? [] }
                  : {}),
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
            kind: isMilestone ? "milestone.records" : "decision.records",
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
      const parsed = flags(rest);
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
    if (command === "create" && rest[0]) {
      const title = rest[0];
      const parsed = flags(rest.slice(1));
      if (
        !parsed ||
        !only(parsed, [
          "--id",
          "--description",
          "--label",
          "--doc",
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
            description: one(parsed, "--description"),
            labels: parsed.values.get("--label"),
            documentation: parsed.values.get("--doc"),
          },
        }),
        modeFor(parsed),
      );
    }
    if (command === "edit" && rest[0]) {
      const reference = rest[0];
      const parsed = flags(rest.slice(1));
      if (
        !parsed ||
        !only(parsed, [
          "--status",
          "--description",
          "--add-label",
          "--remove-label",
          "--doc",
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
            description: one(parsed, "--description"),
            addLabels: parsed.values.get("--add-label"),
            removeLabels: parsed.values.get("--remove-label"),
            documentation: parsed.values.get("--doc"),
          },
        }),
        modeFor(parsed),
      );
    }
    return failure("usage", "Unknown or missing Quest command.");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Quest encountered an unexpected error.";
    const kind =
      error && typeof error === "object" && "kind" in error
        ? (error as { kind?: unknown }).kind
        : undefined;
    if (message === "tracker_write_conflict")
      return failure(
        "conflict",
        "Task write conflicted with a newer revision.",
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
