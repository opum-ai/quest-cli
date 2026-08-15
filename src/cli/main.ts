#!/usr/bin/env bun
import { Command } from "commander";

import { applicationLayer } from "../application/marker.ts";

/** Creates the intentionally command-free Quest CLI scaffold. */
export function createQuestProgram(): Command {
  return new Command()
    .name("quest")
    .description(
      "Quest CLI development scaffold; commands are not implemented yet.",
    )
    .version("0.0.0-development")
    .addHelpText("after", `\nArchitecture boundary: ${applicationLayer}\n`);
}

if (import.meta.main) {
  await createQuestProgram().parseAsync(process.argv);
}
