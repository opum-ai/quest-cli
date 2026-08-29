import {
  type Decision,
  decision,
  type Milestone,
  milestone,
} from "../../domain/planning/planning.ts";
import {
  RecordConflictError,
  RecordValidationError,
} from "../../domain/records.ts";
import type { PlanningRepository } from "../../ports/planning.ts";
import type { TaskReader } from "../tasks/tasks.ts";

export type {
  PlanningRepository,
  PlanningSnapshot,
} from "../../ports/planning.ts";

export type PlanningMutationResult = Awaited<
  ReturnType<PlanningRepository["write"]>
>;

async function persistedPlanningRecord<T>(
  record: T,
  write: Promise<PlanningMutationResult>,
): Promise<{
  readonly record: T;
  readonly result: Extract<
    PlanningMutationResult,
    { readonly kind: "success" }
  >;
}> {
  const result = await write;
  if (result.kind === "conflict")
    throw new RecordConflictError("planning_snapshot_conflict");
  return { record, result };
}

export interface ProjectOverview {
  readonly tasks: {
    readonly total: number;
    readonly byStatus: Readonly<Record<string, number>>;
  };
  readonly milestones: { readonly open: number; readonly closed: number };
  readonly decisions: Readonly<Record<string, number>>;
}

export interface PlanningBoard {
  readonly columns: readonly {
    readonly status: string;
    readonly taskIds: readonly string[];
  }[];
  readonly milestones: readonly {
    readonly id: string;
    readonly title: string;
    readonly status: string;
    readonly taskIds: readonly string[];
  }[];
}

export interface PlanningDoctorReport {
  readonly healthy: boolean;
  readonly issues: readonly {
    readonly code: "milestone_task_not_found";
    readonly milestoneId: string;
    readonly taskId: string;
  }[];
}

export interface PlanningCleanupPlan {
  readonly milestoneIds: readonly string[];
  readonly decisionIds: readonly string[];
  readonly dryRun: boolean;
}

function byIdentifier<T extends { readonly id: string }>(
  left: T,
  right: T,
): number {
  const [leftPrefix, leftNumber] = left.id.split("-");
  const [rightPrefix, rightNumber] = right.id.split("-");
  return (
    leftPrefix.localeCompare(rightPrefix) ||
    Number(leftNumber).valueOf() - Number(rightNumber).valueOf()
  );
}

function sortedCounts(
  values: Readonly<Record<string, number>>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).sort(([left], [right]) => left.localeCompare(right)),
  );
}

/** Typed planning records. CLI wiring deliberately remains at the composition root. */
export class PlanningService {
  constructor(private readonly repository: PlanningRepository) {}

  async listMilestones(includeArchived = false): Promise<readonly Milestone[]> {
    return [...(await this.repository.read()).milestones]
      .filter((item) => includeArchived || item.archived !== true)
      .sort(byIdentifier);
  }
  async listDecisions(): Promise<readonly Decision[]> {
    return [...(await this.repository.read()).decisions].sort(byIdentifier);
  }
  async viewMilestone(id: string): Promise<Milestone> {
    const record = (await this.repository.read()).milestones.find(
      (item) => item.id === id,
    );
    if (!record) throw new RecordValidationError("milestone_not_found");
    return record;
  }
  async viewDecision(id: string): Promise<Decision> {
    const record = (await this.repository.read()).decisions.find(
      (item) => item.id === id,
    );
    if (!record) throw new RecordValidationError("decision_not_found");
    return record;
  }
  async createMilestone(value: Milestone, operationId: string) {
    const snapshot = await this.repository.read();
    const record = milestone(value);
    if (snapshot.milestones.some((item) => item.id === record.id))
      throw new RecordValidationError("milestone_already_exists");
    return persistedPlanningRecord(
      record,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: [...snapshot.milestones, record],
        decisions: snapshot.decisions,
        operationId,
      }),
    );
  }
  async createDecision(value: Decision, operationId: string) {
    const snapshot = await this.repository.read();
    const record = decision(value);
    if (snapshot.decisions.some((item) => item.id === record.id))
      throw new RecordValidationError("decision_already_exists");
    return persistedPlanningRecord(
      record,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones,
        decisions: [...snapshot.decisions, record],
        operationId,
      }),
    );
  }
  async updateMilestone(value: Milestone, operationId: string) {
    const snapshot = await this.repository.read();
    const record = milestone(value);
    if (!snapshot.milestones.some((item) => item.id === record.id))
      throw new RecordValidationError("milestone_not_found");
    return persistedPlanningRecord(
      record,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones.map((item) =>
          item.id === record.id ? record : item,
        ),
        decisions: snapshot.decisions,
        operationId,
      }),
    );
  }
  async updateDecision(value: Decision, operationId: string) {
    const snapshot = await this.repository.read();
    const record = decision(value);
    if (!snapshot.decisions.some((item) => item.id === record.id))
      throw new RecordValidationError("decision_not_found");
    return persistedPlanningRecord(
      record,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones,
        decisions: snapshot.decisions.map((item) =>
          item.id === record.id ? record : item,
        ),
        operationId,
      }),
    );
  }
  /**
   * Retires a milestone without destroying it. Unlike {@link deleteMilestone}
   * this deliberately accepts a milestone that still carries task references:
   * preserving them is the reason to archive rather than delete.
   */
  async archiveMilestone(id: string, operationId: string) {
    const snapshot = await this.repository.read();
    const existing = snapshot.milestones.find((item) => item.id === id);
    if (!existing) throw new RecordValidationError("milestone_not_found");
    if (existing.archived === true)
      throw new RecordValidationError(
        "milestone_lifecycle_already_at_destination",
      );
    const record = milestone({ ...existing, archived: true });
    return persistedPlanningRecord(
      record,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones.map((item) =>
          item.id === record.id ? record : item,
        ),
        decisions: snapshot.decisions,
        operationId,
      }),
    );
  }
  async deleteMilestone(id: string, operationId: string) {
    const snapshot = await this.repository.read();
    const existing = snapshot.milestones.find((item) => item.id === id);
    if (!existing) throw new RecordValidationError("milestone_not_found");
    if (existing.taskIds.length > 0)
      throw new RecordValidationError("milestone_has_task_references");
    return persistedPlanningRecord(
      existing,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones.filter((item) => item.id !== id),
        decisions: snapshot.decisions,
        operationId,
      }),
    );
  }
  async deleteDecision(id: string, operationId: string) {
    const snapshot = await this.repository.read();
    const existing = snapshot.decisions.find((item) => item.id === id);
    if (!existing) throw new RecordValidationError("decision_not_found");
    return persistedPlanningRecord(
      existing,
      this.repository.write({
        expectedRevision: snapshot.revision,
        milestones: snapshot.milestones,
        decisions: snapshot.decisions.filter((item) => item.id !== id),
        operationId,
      }),
    );
  }
  async overview(tasks: TaskReader): Promise<ProjectOverview> {
    const [planning, taskSnapshot] = await Promise.all([
      this.repository.read(),
      tasks.readAll(),
    ]);
    const byStatus: Record<string, number> = {};
    for (const task of taskSnapshot.tasks)
      byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
    const decisions: Record<string, number> = {};
    for (const item of planning.decisions)
      decisions[item.status] = (decisions[item.status] ?? 0) + 1;
    return {
      tasks: {
        total: taskSnapshot.tasks.length,
        byStatus: sortedCounts(byStatus),
      },
      milestones: {
        // Archived milestones are retired, so they count as neither.
        open: planning.milestones.filter(
          (item) => item.archived !== true && item.status === "open",
        ).length,
        closed: planning.milestones.filter(
          (item) => item.archived !== true && item.status === "closed",
        ).length,
      },
      decisions: sortedCounts(decisions),
    };
  }
  async search(query: string): Promise<{
    readonly milestones: readonly Milestone[];
    readonly decisions: readonly Decision[];
  }> {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) throw new RecordValidationError("search_query_required");
    const snapshot = await this.repository.read();
    const matches = (value: string | undefined) =>
      value?.toLocaleLowerCase().includes(needle) ?? false;
    return {
      milestones: snapshot.milestones
        .filter(
          (item) =>
            matches(item.id) ||
            matches(item.title) ||
            matches(item.description),
        )
        .sort(byIdentifier),
      decisions: snapshot.decisions
        .filter(
          (item) =>
            matches(item.id) ||
            matches(item.title) ||
            matches(item.context) ||
            matches(item.outcome),
        )
        .sort(byIdentifier),
    };
  }
  async board(tasks: TaskReader): Promise<PlanningBoard> {
    const [planning, taskSnapshot] = await Promise.all([
      this.repository.read(),
      tasks.readAll(),
    ]);
    const grouped = new Map<string, string[]>();
    for (const task of taskSnapshot.tasks) {
      const entries = grouped.get(task.status) ?? [];
      entries.push(task.id);
      grouped.set(task.status, entries);
    }
    return {
      columns: [...grouped.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([status, taskIds]) => ({
          status,
          taskIds: taskIds.sort((left, right) => left.localeCompare(right)),
        })),
      milestones: [...planning.milestones].sort(byIdentifier).map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        taskIds: [...item.taskIds].sort((left, right) =>
          left.localeCompare(right),
        ),
      })),
    };
  }
  async doctor(tasks: TaskReader): Promise<PlanningDoctorReport> {
    const [planning, taskSnapshot] = await Promise.all([
      this.repository.read(),
      tasks.readAll(),
    ]);
    const known = new Set(
      (taskSnapshot.taskRecords ?? taskSnapshot.tasks).map((record) =>
        "task" in record ? record.task.id : record.id,
      ),
    );
    const issues = planning.milestones
      .flatMap((item) =>
        item.taskIds
          .filter((taskId) => !known.has(taskId))
          .map((taskId) => ({
            code: "milestone_task_not_found" as const,
            milestoneId: item.id,
            taskId,
          })),
      )
      .sort(
        (left, right) =>
          left.milestoneId.localeCompare(right.milestoneId) ||
          left.taskId.localeCompare(right.taskId),
      );
    return { healthy: issues.length === 0, issues };
  }
  /**
   * Cleanup has an intentionally narrow, explicit target: closed milestones
   * and superseded decisions. It defaults to a non-mutating preview.
   */
  async cleanup(
    request: { readonly dryRun?: boolean; readonly confirmed?: boolean },
    operationId: string,
  ): Promise<PlanningCleanupPlan | PlanningMutationResult> {
    const snapshot = await this.repository.read();
    // Archiving exists to preserve the record, so cleanup is not its reaper:
    // an archived milestone is retired deliberately and stays retrievable.
    const milestoneIds = snapshot.milestones
      .filter(
        (item) =>
          item.archived !== true &&
          item.status === "closed" &&
          item.taskIds.length === 0,
      )
      .map((item) => item.id)
      .sort();
    const decisionIds = snapshot.decisions
      .filter((item) => item.status === "superseded")
      .map((item) => item.id)
      .sort();
    const plan: PlanningCleanupPlan = {
      milestoneIds,
      decisionIds,
      dryRun: request.dryRun ?? true,
    };
    if (plan.dryRun) return plan;
    if (!request.confirmed)
      throw new RecordValidationError("cleanup_confirmation_required");
    return this.repository.write({
      expectedRevision: snapshot.revision,
      milestones: snapshot.milestones.filter(
        (item) => !milestoneIds.includes(item.id),
      ),
      decisions: snapshot.decisions.filter(
        (item) => !decisionIds.includes(item.id),
      ),
      operationId,
    });
  }
}
