import { z } from "zod";

import {
  RECORD_SCHEMA_VERSION,
  RecordValidationError,
} from "../../domain/records.ts";

const envelopeSchema = z
  .object({ schemaVersion: z.literal(RECORD_SCHEMA_VERSION) })
  .passthrough();

/** Decode authored bytes strictly: malformed UTF-8 and unsupported schemas never normalize input. */
export function decodeAuthoredRecord(
  bytes: Uint8Array,
): Readonly<Record<string, unknown>> {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new RecordValidationError("Authored record is not valid UTF-8.");
  }
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new RecordValidationError("Authored record is not valid JSON.");
  }
  const parsed = envelopeSchema.safeParse(value);
  if (!parsed.success) {
    throw new RecordValidationError(
      "Unsupported or malformed authored record schema.",
    );
  }
  return parsed.data;
}

export function encodeAuthoredRecord(
  record: Readonly<Record<string, unknown>>,
): Uint8Array {
  const parsed = envelopeSchema.safeParse(record);
  if (!parsed.success)
    throw new RecordValidationError(
      "Unsupported or malformed authored record schema.",
    );
  return new TextEncoder().encode(JSON.stringify(parsed.data));
}
