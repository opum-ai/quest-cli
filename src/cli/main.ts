#!/usr/bin/env bun
import { join } from "node:path";
import { Command } from "commander";

import {
  diagnostic,
  exitCodeFor,
  manifestResult,
  selectOutputMode,
  type OutputMode,
} from "../application/command-contract.ts";
import { TaskService } from "../application/tasks/tasks.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import { dispatchTrackerTaskCommand } from "./commands/task/index.ts";

const VERSION = "0.1.0";

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

function taskService(): TaskService {
  return new TaskService(
    new LocalTaskRepository(
      join(process.env.QUEST_TASK_STORE ?? process.cwd(), ".quest", "tasks"),
    ),
  );
}

function actor(parsed: NonNullable<ReturnType<typeof flags>>) {
  const id = one(parsed, "--actor");
  const kind = one(parsed, "--actor-kind");
  if (!id || (kind !== "human" && kind !== "delegated-agent")) return undefined;
  const accountableHumanId = one(parsed, "--accountable-human");
  return {
    id,
    kind,
    ...(accountableHumanId ? { accountableHumanId } : {}),
  } as const;
}

async function nextTaskId(tasks: TaskService): Promise<string> {
  const ids = await tasks.list();
  const highest = ids.reduce((maximum, task) => {
    const numeric = Number(task.id.slice(2));
    return Number.isSafeInteger(numeric) ? Math.max(maximum, numeric) : maximum;
  }, 0);
  return `T-${highest + 1}`;
}

/** Executes the stable public tracker CLI against repository-local task storage. */
export async function runQuest(
  arguments_: readonly string[],
  stdoutIsTty: boolean,
): Promise<InvocationResult> {
  try {
    if (arguments_.length === 1 && arguments_[0] === "--version")
      return { stdout: `${VERSION}\n`, stderr: "", exitCode: 0 };
    if (arguments_[0] === "manifest") {
      const parsed = flags(arguments_.slice(1));
      if (!parsed || !only(parsed, []))
        return failure("usage", "manifest accepts only --json and --plain.");
      return output(
        manifestResult(),
        selectOutputMode({ ...parsed, stdoutIsTty }),
      );
    }
    const modeFor = (parsed: NonNullable<ReturnType<typeof flags>>) =>
      selectOutputMode({ ...parsed, stdoutIsTty });
    if (arguments_[0] === "search" && arguments_[1]) {
      const parsed = flags(arguments_.slice(2));
      if (!parsed || !only(parsed, []))
        return failure("usage", "search accepts only --json and --plain.");
      return output(
        await dispatchTrackerTaskCommand(taskService(), {
          command: "search",
          query: arguments_[1],
        }),
        modeFor(parsed),
      );
    }
    if (arguments_[0] !== "task")
      return failure("usage", "Unknown or missing Quest command.");
    const command = arguments_[1];
    const rest = arguments_.slice(2);
    if (command === "status-flow") {
      const parsed = flags(rest);
      if (!parsed || !only(parsed, []))
        return failure(
          "usage",
          "task status-flow accepts only --json and --plain.",
        );
      return output(
        await dispatchTrackerTaskCommand(taskService(), { command }),
        modeFor(parsed),
      );
    }
    if (command === "list") {
      const parsed = flags(rest);
      if (!parsed || !only(parsed, ["--status", "--label"]))
        return failure("usage", "task list received invalid arguments.");
      return output(
        await dispatchTrackerTaskCommand(taskService(), {
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
        await dispatchTrackerTaskCommand(taskService(), {
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
      const tasks = taskService();
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
        await dispatchTrackerTaskCommand(taskService(), {
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
