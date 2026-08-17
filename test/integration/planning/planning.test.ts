import { expect, test } from "bun:test";

import {
  PlanningService,
  type PlanningRepository,
} from "../../../src/application/planning/planning.ts";
import type {
  Decision,
  Milestone,
} from "../../../src/domain/planning/planning.ts";
import { createTask } from "../../../src/domain/tasks/tasks.ts";

class MemoryPlanning implements PlanningRepository {
  private revision = "1";
  private milestones: Milestone[] = [];
  private decisions: Decision[] = [];
  async read() {
    return {
      revision: this.revision,
      milestones: this.milestones,
      decisions: this.decisions,
    };
  }
  async write(request: Parameters<PlanningRepository["write"]>[0]) {
    if (request.expectedRevision !== this.revision)
      return { kind: "conflict" as const };
    this.milestones = [...request.milestones];
    this.decisions = [...request.decisions];
    this.revision = "2";
    return { kind: "success" as const, revision: this.revision };
  }
}

test("planning records validate identity, retain decisions, and support non-document search", async () => {
  const service = new PlanningService(new MemoryPlanning());
  await service.createMilestone(
    { id: "M-1", title: "Release", status: "open", taskIds: ["T-1"] },
    "m1",
  );
  await service.createDecision(
    {
      id: "DEC-1",
      title: "Retention",
      outcome: "Preserve archived records",
      status: "accepted",
    },
    "d1",
  );
  expect((await service.search("preserve")).decisions).toHaveLength(1);
  await expect(
    service.createMilestone(
      { id: "M-1", title: "again", status: "open", taskIds: [] },
      "m2",
    ),
  ).rejects.toThrow("milestone_already_exists");
});

test("overview is read-only and groups task, milestone, and decision states deterministically", async () => {
  const service = new PlanningService(new MemoryPlanning());
  await service.createMilestone(
    { id: "M-1", title: "Release", status: "closed", taskIds: [] },
    "m1",
  );
  await service.createDecision(
    { id: "DEC-1", title: "API", outcome: "JSON", status: "proposed" },
    "d1",
  );
  const overview = await service.overview({
    readAll: async () => ({
      revision: "tasks",
      tasks: [
        createTask("T-1", { title: "one" }),
        createTask("T-2", { title: "two", status: "In Progress" }),
      ],
    }),
  });
  expect(overview).toEqual({
    tasks: { total: 2, byStatus: { "To Do": 1, "In Progress": 1 } },
    milestones: { open: 0, closed: 1 },
    decisions: { proposed: 1 },
  });
});
