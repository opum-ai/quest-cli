import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalPlanningRepository } from "../../../src/adapters/planning/local-planning-repository.ts";
import {
  type PlanningRepository,
  PlanningService,
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

class ConflictPlanning implements PlanningRepository {
  async read() {
    return { revision: "1", milestones: [], decisions: [] };
  }
  async write() {
    return { kind: "conflict" as const };
  }
}

test("planning records validate identity, retain decisions, and support non-document search", async () => {
  const service = new PlanningService(new MemoryPlanning());
  const createdMilestone = await service.createMilestone(
    { id: "M-1", title: "Release", status: "open", taskIds: ["T-1"] },
    "m1",
  );
  expect(createdMilestone).toEqual({
    record: { id: "M-1", title: "Release", status: "open", taskIds: ["T-1"] },
    result: { kind: "success", revision: "2" },
  });
  const createdDecision = await service.createDecision(
    {
      id: "DEC-1",
      title: "Retention",
      outcome: "Preserve archived records",
      status: "accepted",
    },
    "d1",
  );
  expect(createdDecision.record).toMatchObject({ id: "DEC-1" });
  expect((await service.search("preserve")).decisions).toHaveLength(1);
  await expect(
    service.createMilestone(
      { id: "M-1", title: "again", status: "open", taskIds: [] },
      "m2",
    ),
  ).rejects.toThrow("milestone_already_exists");
});

test("planning mutations surface stale writes as conflicts instead of record results", async () => {
  const service = new PlanningService(new ConflictPlanning());
  await expect(
    service.createMilestone(
      { id: "M-1", title: "Release", status: "open", taskIds: [] },
      "conflict",
    ),
  ).rejects.toThrow("planning_snapshot_conflict");
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

test("planning CRUD, board, doctor, and cleanup preserve explicit safety boundaries", async () => {
  const service = new PlanningService(new MemoryPlanning());
  await service.createMilestone(
    { id: "M-10", title: "Later", status: "closed", taskIds: [] },
    "create-m10",
  );
  await service.createMilestone(
    { id: "M-2", title: "Current", status: "open", taskIds: ["T-9"] },
    "create-m2",
  );
  await service.createDecision(
    {
      id: "DEC-1",
      title: "Old protocol",
      outcome: "Replaced",
      status: "superseded",
    },
    "create-dec",
  );
  expect((await service.listMilestones()).map((item) => item.id)).toEqual([
    "M-2",
    "M-10",
  ]);
  await service.updateMilestone(
    { id: "M-2", title: "Current release", status: "open", taskIds: ["T-9"] },
    "update-m2",
  );
  expect((await service.viewMilestone("M-2")).title).toBe("Current release");
  await expect(service.deleteMilestone("M-2", "delete-m2")).rejects.toThrow(
    "milestone_has_task_references",
  );
  expect(await service.deleteDecision("DEC-1", "delete-dec")).toMatchObject({
    record: { id: "DEC-1", title: "Old protocol" },
    result: { kind: "success" },
  });
  expect(
    await service.doctor({
      readAll: async () => ({ revision: "t", tasks: [] }),
    }),
  ).toEqual({
    healthy: false,
    issues: [
      { code: "milestone_task_not_found", milestoneId: "M-2", taskId: "T-9" },
    ],
  });
  expect(await service.cleanup({}, "preview")).toEqual({
    milestoneIds: ["M-10"],
    decisionIds: [],
    dryRun: true,
  });
  await expect(service.cleanup({ dryRun: false }, "unsafe")).rejects.toThrow(
    "cleanup_confirmation_required",
  );
  expect(
    await service.cleanup({ dryRun: false, confirmed: true }, "cleanup"),
  ).toEqual({
    kind: "success",
    revision: "2",
  });
  expect(
    await service.board({
      readAll: async () => ({
        revision: "t",
        tasks: [createTask("T-9", { title: "one" })],
      }),
    }),
  ).toEqual({
    columns: [{ status: "To Do", taskIds: ["T-9"] }],
    milestones: [
      { id: "M-2", title: "Current release", status: "open", taskIds: ["T-9"] },
    ],
  });
});

test("local planning repository persists validated snapshots and reports stale writers as conflicts", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-planning-"));
  try {
    const repository = new LocalPlanningRepository(root);
    const first = await repository.read();
    expect(
      await repository.write({
        expectedRevision: first.revision,
        milestones: [
          { id: "M-1", title: "Release", status: "open", taskIds: [] },
        ],
        decisions: [],
        operationId: "write-1",
      }),
    ).toMatchObject({ kind: "success" });
    expect(
      await repository.write({
        expectedRevision: first.revision,
        milestones: [],
        decisions: [],
        operationId: "stale-write",
      }),
    ).toEqual({ kind: "conflict" });
    expect(
      JSON.parse(await readFile(join(root, ".quest", "planning.json"), "utf8")),
    ).toEqual({
      milestones: [
        { id: "M-1", title: "Release", status: "open", taskIds: [] },
      ],
      decisions: [],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("milestone archive retires a milestone without destroying it (QCLI-140)", async () => {
  const service = new PlanningService(new MemoryPlanning());
  await service.createMilestone(
    { id: "M-1", title: "Shipped", status: "closed", taskIds: ["T-1", "T-2"] },
    "create-m1",
  );
  await service.createMilestone(
    { id: "M-2", title: "Current", status: "open", taskIds: [] },
    "create-m2",
  );

  // delete refuses a milestone that still carries task references; archive is
  // the retirement path precisely because it keeps them.
  await expect(service.deleteMilestone("M-1", "delete-m1")).rejects.toThrow(
    "milestone_has_task_references",
  );
  expect(await service.archiveMilestone("M-1", "archive-m1")).toMatchObject({
    record: {
      id: "M-1",
      title: "Shipped",
      status: "closed",
      taskIds: ["T-1", "T-2"],
      archived: true,
    },
    result: { kind: "success" },
  });

  // Hidden from the default listing, still retrievable two ways.
  expect((await service.listMilestones()).map((item) => item.id)).toEqual([
    "M-2",
  ]);
  expect((await service.listMilestones(true)).map((item) => item.id)).toEqual([
    "M-1",
    "M-2",
  ]);
  expect(await service.viewMilestone("M-1")).toMatchObject({
    archived: true,
    taskIds: ["T-1", "T-2"],
  });

  await expect(
    service.archiveMilestone("M-1", "archive-m1-again"),
  ).rejects.toThrow("milestone_lifecycle_already_at_destination");
  await expect(
    service.archiveMilestone("M-404", "archive-missing"),
  ).rejects.toThrow("milestone_not_found");
});

test("archiving preserves a milestone against every other writer (QCLI-140)", async () => {
  const service = new PlanningService(new MemoryPlanning());
  await service.createMilestone(
    { id: "M-1", title: "Retired", status: "closed", taskIds: [] },
    "create-m1",
  );
  await service.archiveMilestone("M-1", "archive-m1");

  // cleanup reaps closed, task-free milestones. An archived one is retired
  // deliberately, so it is not cleanup's to destroy.
  expect(await service.cleanup({ dryRun: true }, "cleanup-dry")).toMatchObject({
    milestoneIds: [],
  });
  await service.cleanup({ confirmed: true }, "cleanup-confirm");
  expect((await service.listMilestones(true)).map((item) => item.id)).toEqual([
    "M-1",
  ]);

  // A retired milestone is neither open nor closed work.
  expect(
    await service.overview({
      readAll: async () => ({ revision: "t", tasks: [] }),
    }),
  ).toMatchObject({ milestones: { open: 0, closed: 0 } });

  // Editing an archived milestone must not quietly un-archive it.
  await service.updateMilestone(
    {
      id: "M-1",
      title: "Retired, renamed",
      status: "closed",
      taskIds: [],
      archived: true,
    },
    "update-m1",
  );
  expect(await service.viewMilestone("M-1")).toMatchObject({
    title: "Retired, renamed",
    archived: true,
  });
});
