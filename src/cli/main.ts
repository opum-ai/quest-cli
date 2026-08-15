#!/usr/bin/env bun
import { Command } from "commander";

import {
  diagnostic,
  exitCodeFor,
  manifestResult,
  selectOutputMode,
} from "../application/command-contract.ts";
import { applicationLayer } from "../application/marker.ts";

/** Creates the intentionally command-free Quest CLI scaffold. */
export function createQuestProgram(): Command {
  const program = new Command()
    .name("quest")
    .description(
      "Quest CLI development scaffold; commands are not implemented yet.",
    )
    .version("0.0.0-development")
    .addHelpText("after", `\nArchitecture boundary: ${applicationLayer}\n`);

  program
    .command("manifest")
    .option("--json", "render the result envelope as JSON")
    .option("--plain", "render plain output")
    .action((options: { json?: boolean; plain?: boolean }) => {
      const output = manifestResult();
      const mode = selectOutputMode({
        ...options,
        stdoutIsTty: process.stdout.isTTY,
      });
      if (mode === "json") {
        process.stdout.write(`${JSON.stringify(output)}\n`);
        return;
      }
      process.stdout.write(`${output.kind}\n`);
    });

  return program;
}

export interface InvocationResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

function usage(message: string): InvocationResult {
  const error = diagnostic("usage", message);
  return {
    stdout: "",
    stderr: `${JSON.stringify(error)}\n`,
    exitCode: exitCodeFor(error.error_type),
  };
}

/** Executes the small stable command surface with one result stream and one exit. */
export function runQuest(
  arguments_: readonly string[],
  stdoutIsTty: boolean,
): InvocationResult {
  try {
    if (arguments_.length === 1 && arguments_[0] === "--version") {
      return { stdout: "0.0.0-development\n", stderr: "", exitCode: 0 };
    }
    if (arguments_[0] !== "manifest") {
      return usage("Unknown or missing Quest command.");
    }
    const flags = arguments_.slice(1);
    if (flags.some((flag) => flag !== "--json" && flag !== "--plain")) {
      return usage("manifest accepts only --json and --plain.");
    }
    const mode = selectOutputMode({
      json: flags.includes("--json"),
      plain: flags.includes("--plain"),
      stdoutIsTty,
    });
    const result = manifestResult();
    return {
      stdout:
        mode === "json" ? `${JSON.stringify(result)}\n` : `${result.kind}\n`,
      stderr: "",
      exitCode: 0,
    };
  } catch {
    const error = diagnostic(
      "uncaught",
      "Quest encountered an unexpected error.",
    );
    return {
      stdout: "",
      stderr: `${JSON.stringify(error)}\n`,
      exitCode: exitCodeFor(error.error_type),
    };
  }
}

if (import.meta.main) {
  const result = runQuest(process.argv.slice(2), Boolean(process.stdout.isTTY));
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  process.exitCode = result.exitCode;
}
