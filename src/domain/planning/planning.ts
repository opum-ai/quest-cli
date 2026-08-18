import { z } from "zod";

import { RecordValidationError } from "../records.ts";

export type MilestoneId = `M-${number}`;
export type DecisionId = `DEC-${number}`;
export type MilestoneStatus = "open" | "closed";
export type DecisionStatus = "proposed" | "accepted" | "superseded";

export interface Milestone {
  readonly id: MilestoneId;
  readonly title: string;
  readonly description?: string;
  readonly status: MilestoneStatus;
  readonly taskIds: readonly string[];
}

export interface Decision {
  readonly id: DecisionId;
  readonly title: string;
  readonly context?: string;
  readonly outcome: string;
  readonly status: DecisionStatus;
}

const milestoneSchema = z.object({
  id: z.string().regex(/^M-[1-9][0-9]*$/),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["open", "closed"]),
  taskIds: z.array(z.string().min(1)),
});
const decisionSchema = z.object({
  id: z.string().regex(/^DEC-[1-9][0-9]*$/),
  title: z.string().min(1),
  context: z.string().optional(),
  outcome: z.string().min(1),
  status: z.enum(["proposed", "accepted", "superseded"]),
});

function unique(values: readonly string[], name: string): void {
  if (new Set(values).size !== values.length)
    throw new RecordValidationError(`${name} cannot contain duplicates.`);
}

export function milestone(value: Milestone): Milestone {
  const parsed = milestoneSchema.safeParse(value);
  if (!parsed.success) throw new RecordValidationError("Invalid milestone.");
  const result = parsed.data as Milestone;
  unique(result.taskIds, "Milestone task ids");
  return result;
}

export function decision(value: Decision): Decision {
  const parsed = decisionSchema.safeParse(value);
  if (!parsed.success) throw new RecordValidationError("Invalid decision.");
  return parsed.data as Decision;
}

export function milestoneId(value: string): MilestoneId {
  if (!/^M-[1-9][0-9]*$/.test(value))
    throw new RecordValidationError(`Invalid milestone id: ${value}`);
  return value as MilestoneId;
}

export function decisionId(value: string): DecisionId {
  if (!/^DEC-[1-9][0-9]*$/.test(value))
    throw new RecordValidationError(`Invalid decision id: ${value}`);
  return value as DecisionId;
}
