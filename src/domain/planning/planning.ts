import { z } from "zod";

import { RecordValidationError } from "../records.ts";

export type MilestoneId = `M-${number}`;
export type DecisionId = `DEC-${number}`;
export type MilestoneStatus = "open" | "closed";
/**
 * QCLI-447 / opum-doc seq 179(c). The design's full decision set is
 * `proposed` -> `accepted`, `rejected`, `withdrawn` or `superseded`
 * (`questions-decisions-and-adrs.md`). Before this, a proposal withdrawn
 * without an answer had to be stored as `superseded` (DEC-139); `withdrawn`
 * is the status that now says what actually happened.
 */
export type DecisionStatus =
  | "proposed"
  | "accepted"
  | "superseded"
  | "rejected"
  | "withdrawn";
/** Who made the ruling: the operator, or `opum-doc` on the operator's behalf. */
export type DecisionDecidedBy = "operator" | "opum-doc";
/** What a ruling binds: everything (`cross-repo`) or one component. */
export type DecisionScope = "cross-repo" | `component:${string}`;

export interface Milestone {
  readonly id: MilestoneId;
  readonly title: string;
  readonly description?: string;
  readonly status: MilestoneStatus;
  readonly taskIds: readonly string[];
  /**
   * Retirement, deliberately orthogonal to {@link MilestoneStatus}: a
   * milestone is archived whether it closed or was abandoned, and archiving
   * preserves the record and its task references where deleting destroys them.
   */
  readonly archived?: boolean;
}

export interface Decision {
  readonly id: DecisionId;
  readonly title: string;
  readonly context?: string;
  readonly outcome: string;
  readonly status: DecisionStatus;
  /**
   * QCLI-447 / opum-doc seq 179(c): what produced this ruling -- a question id,
   * a request id (a Quest task of type `request`), or the literal `delegated`
   * when `opum-doc` decided on the operator's behalf. Optional so a record
   * written before this field existed still validates and reads unchanged.
   */
  readonly source?: string;
  readonly decidedBy?: DecisionDecidedBy;
  readonly scope?: DecisionScope;
  /** ADR ids in the owning repository's Lore docs, linked both ways. */
  readonly adrs?: readonly string[];
  /** Decision ids this ruling supersedes. */
  readonly supersedes?: readonly string[];
}

const decisionScopeSchema = z.string().regex(/^(?:cross-repo|component:.+)$/);

const milestoneSchema = z.object({
  id: z.string().regex(/^M-[1-9][0-9]*$/),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["open", "closed"]),
  taskIds: z.array(z.string().min(1)),
  archived: z.boolean().optional(),
});
const decisionSchema = z.object({
  id: z.string().regex(/^DEC-[1-9][0-9]*$/),
  title: z.string().min(1),
  context: z.string().optional(),
  outcome: z.string().min(1),
  status: z.enum([
    "proposed",
    "accepted",
    "superseded",
    "rejected",
    "withdrawn",
  ]),
  source: z.string().min(1).optional(),
  decidedBy: z.enum(["operator", "opum-doc"]).optional(),
  scope: decisionScopeSchema.optional(),
  adrs: z.array(z.string().min(1)).optional(),
  supersedes: z.array(z.string().min(1)).optional(),
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
  const result = parsed.data as Decision;
  unique(result.adrs ?? [], "Decision adr ids");
  unique(result.supersedes ?? [], "Decision supersedes ids");
  return result;
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
