import { z } from "zod";

import type { ConfigurationSource } from "../ports/configuration.ts";

const supportedSchemaVersion = 1;
const configurationSchema = z
  .object({
    schemaVersion: z.number().int(),
  })
  .passthrough();

export type QuestConfiguration = z.infer<typeof configurationSchema>;

export type ConfigurationValidation =
  | { readonly ok: true; readonly configuration: QuestConfiguration }
  | {
      readonly ok: false;
      readonly errorType: "validation" | "drift";
      readonly message: string;
    };

/** Parses only the local TOML input; it never writes, creates, or normalizes it. */
export function validateQuestConfiguration(
  source: string,
): ConfigurationValidation {
  let parsed: unknown;
  try {
    parsed = Bun.TOML.parse(source);
  } catch {
    return {
      ok: false,
      errorType: "validation",
      message: "Quest configuration is not valid TOML.",
    };
  }

  const result = configurationSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      errorType: "validation",
      message: "Quest configuration must declare an integer schemaVersion.",
    };
  }
  if (result.data.schemaVersion !== supportedSchemaVersion) {
    return {
      ok: false,
      errorType: "drift",
      message: `Unsupported Quest configuration schema ${result.data.schemaVersion}; expected ${supportedSchemaVersion}.`,
    };
  }
  return { ok: true, configuration: result.data };
}

/** Reads and validates a configuration without mutating the supplied port. */
export async function readQuestConfiguration(
  source: ConfigurationSource,
): Promise<ConfigurationValidation | undefined> {
  const content = await source.read();
  return content === undefined
    ? undefined
    : validateQuestConfiguration(content);
}
