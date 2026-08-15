import { expect, test } from "bun:test";

import { GateService } from "../../../src/application/gates/gates.ts";
import {
  replayGateHistory,
  snapshotEvidenceActor,
} from "../../../src/domain/gates/gates.ts";
import { createTask } from "../../../src/domain/tasks/tasks.ts";
import {
  TaskService,
  type TaskRepository,
} from "../../../src/application/tasks/tasks.ts";
import type { Actor } from "../../../src/domain/records.ts";

const author: Actor = { id: "author", kind: "human", roles: [] };
const reviewer: Actor = { id: "reviewer", kind: "human", roles: ["reviewer"] };
const agent: Actor = {
  id: "agent",
  kind: "delegated-agent",
  accountableHumanId: "reviewer",
  roles: ["reviewer"],
};

class MemoryTasks implements TaskRepository {
  writes = 0;
  private revision = "r-1";
  constructor(
    private tasks = [
      createTask("T-1", { title: "Gate task", aliases: ["gate"] }),
    ],
  ) {}
  async readAll() {
    return { revision: this.revision, tasks: this.tasks };
  }
  async write(request: Parameters<TaskRepository["write"]>[0]) {
    if (request.expectedRevision !== this.revision)
      return {
        kind: "conflict" as const,
        expectedRevision: request.expectedRevision,
        actualRevision: this.revision,
        operationId: request.operationId,
        ownedPaths: request.ownedPaths,
      };
    this.writes += 1;
    this.tasks = this.tasks.map((task) =>
      task.id === request.task.id ? request.task : task,
    );
    this.revision = `r-${this.writes + 1}`;
    return { kind: "success" as const, revision: this.revision };
  }
}

test("authored gate and evidence events derive state, and block terminal transitions without mutation", async () => {
  const store = new MemoryTasks();
  const gates = new GateService(store, [author, reviewer, agent]);
  await gates.define({
    reference: "GATE",
    definition: {
      id: "review",
      title: "Independent review",
      blocking: true,
      separatedFromActorId: "author",
      requiresHumanJudgement: true,
      requiredRole: "reviewer",
    },
    eventId: "g-1",
    operationId: "define",
  });
  const tasks = new TaskService(store);
  await tasks.transition("T-1", "In Progress", "start");
  const writesBefore = store.writes;
  await expect(tasks.transition("T-1", "Done", "finish")).rejects.toThrow(
    "task_terminal_transition_gate_blocked",
  );
  expect(store.writes).toBe(writesBefore);
  expect((await tasks.view("gate")).status).toBe("In Progress");
});

test("self evidence and delegated-agent judgement stay pending; a distinct human reviewer satisfies", async () => {
  const store = new MemoryTasks();
  const gates = new GateService(store, [author, reviewer, agent]);
  await gates.define({
    reference: "gate",
    definition: {
      id: "review",
      title: "Review",
      blocking: true,
      separatedFromActorId: "author",
      requiresHumanJudgement: true,
      requiredRole: "reviewer",
    },
    eventId: "g-1",
    operationId: "define",
  });
  await gates.submitEvidence({
    reference: "T-1",
    gateId: "review",
    evidenceId: "e-self",
    evidenceReference: "self",
    actorId: "author",
    submittedAt: new Date("2026-01-01T00:00:00Z"),
    eventId: "g-2",
    operationId: "self",
  });
  await gates.submitEvidence({
    reference: "T-1",
    gateId: "review",
    evidenceId: "e-agent",
    evidenceReference: "agent",
    actorId: "agent",
    submittedAt: new Date("2026-01-01T00:01:00Z"),
    eventId: "g-3",
    operationId: "agent",
  });
  expect((await new TaskService(store).view("gate")).gates[0]).toMatchObject({
    state: "pending",
    evidence: ["self", "agent"],
  });
  await gates.submitEvidence({
    reference: "gate",
    gateId: "review",
    evidenceId: "e-human",
    evidenceReference: "human",
    actorId: "reviewer",
    submittedAt: new Date("2026-01-01T00:02:00Z"),
    eventId: "g-4",
    operationId: "human",
  });
  expect((await new TaskService(store).view("T-1")).gates[0]).toMatchObject({
    state: "satisfied",
    satisfiedBy: "reviewer",
  });
});

test("evidence eligibility is frozen in its event despite later actor declaration changes", () => {
  const history = replayGateHistory([
    {
      eventId: "g-1",
      operationId: "define",
      taskId: "T-1",
      kind: "gate-defined",
      definition: {
        id: "review",
        title: "Review",
        blocking: true,
        requiresHumanJudgement: true,
        requiredRole: "reviewer",
      },
    },
    {
      eventId: "g-2",
      operationId: "evidence",
      taskId: "T-1",
      kind: "evidence-submitted",
      gateId: "review",
      evidence: {
        id: "e-1",
        reference: "proof",
        actor: snapshotEvidenceActor(reviewer),
        submittedAt: "2026-01-01T00:00:00Z",
      },
    },
  ]);
  const laterActorRecord: Actor = { ...reviewer, roles: [] };
  expect(laterActorRecord.roles).toEqual([]);
  expect(history.gates[0]).toMatchObject({
    state: "satisfied",
    satisfiedBy: "reviewer",
  });
});
