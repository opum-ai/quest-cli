import type { TaskReader } from "../tasks/tasks.ts";
import {
  decision,
  milestone,
  type Decision,
  type Milestone,
} from "../../domain/planning/planning.ts";
import { RecordValidationError } from "../../domain/records.ts";

export interface PlanningSnapshot {
  readonly revision: string;
  readonly milestones: readonly Milestone[];
  readonly decisions: readonly Decision[];
}

export interface PlanningRepository {
  read(): Promise<PlanningSnapshot>;
  write(request: {
    readonly expectedRevision: string;
    readonly milestones: readonly Milestone[];
    readonly decisions: readonly Decision[];
    readonly operationId: string;
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | { readonly kind: "conflict" }
  >;
}

export interface ProjectOverview {
  readonly tasks: {
    readonly total: number;
    readonly byStatus: Readonly<Record<string, number>>;
  };
  readonly milestones: { readonly open: number; readonly closed: number };
  readonly decisions: Readonly<Record<string, number>>;
}

/** Typed planning records. CLI wiring deliberately remains at the composition root. */
export class PlanningService {
  constructor(private readonly repository: PlanningRepository) {}

  async listMilestones(): Promise<readonly Milestone[]> {
    return [...(await this.repository.read()).milestones].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
  async listDecisions(): Promise<readonly Decision[]> {
    return [...(await this.repository.read()).decisions].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
  }
  async createMilestone(value: Milestone, operationId: string) {
    const snapshot = await this.repository.read();
    const record = milestone(value);
    if (snapshot.milestones.some((item) => item.id === record.id))
      throw new RecordValidationError("milestone_already_exists");
    return this.repository.write({
      expectedRevision: snapshot.revision,
      milestones: [...snapshot.milestones, record],
      decisions: snapshot.decisions,
      operationId,
    });
  }
  async createDecision(value: Decision, operationId: string) {
    const snapshot = await this.repository.read();
    const record = decision(value);
    if (snapshot.decisions.some((item) => item.id === record.id))
      throw new RecordValidationError("decision_already_exists");
    return this.repository.write({
      expectedRevision: snapshot.revision,
      milestones: snapshot.milestones,
      decisions: [...snapshot.decisions, record],
      operationId,
    });
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
      tasks: { total: taskSnapshot.tasks.length, byStatus },
      milestones: {
        open: planning.milestones.filter((item) => item.status === "open")
          .length,
        closed: planning.milestones.filter((item) => item.status === "closed")
          .length,
      },
      decisions,
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
      milestones: snapshot.milestones.filter(
        (item) =>
          matches(item.id) || matches(item.title) || matches(item.description),
      ),
      decisions: snapshot.decisions.filter(
        (item) =>
          matches(item.id) ||
          matches(item.title) ||
          matches(item.context) ||
          matches(item.outcome),
      ),
    };
  }
}
