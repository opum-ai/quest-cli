import type { Decision, Milestone } from "../domain/planning/planning.ts";

/** Complete planning state observed at one repository revision. */
export interface PlanningSnapshot {
  readonly revision: string;
  readonly milestones: readonly Milestone[];
  readonly decisions: readonly Decision[];
}

/** Persistence boundary required by planning application use cases. */
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
