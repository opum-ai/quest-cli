import { describe, expect, test } from "bun:test";

import { QuestTrackerClient } from "../../../src/contract/tracker/index.ts";
import {
  OPUM_AGENT_WORKFLOW_SCHEMA,
  OpumAgentWorkflowAdapter,
  OpumAgentWorkflowError,
  canonicalTaskJson,
  taskBindingDigest,
} from "../../../src/contract/tracker/opum-agent-workflow.ts";
import {
  trackerConformanceFixtures,
  trackerTaskFixture,
} from "../../../src/contract/tracker/fixtures.ts";
import type { TrackerProcessRunner } from "../../../src/contract/tracker/index.ts";

function fixtureClient(): {
  readonly adapter: OpumAgentWorkflowAdapter;
  readonly argv: string[][];
} {
  const argv: string[][] = [];
  const runner: TrackerProcessRunner = {
    async run(call) {
      argv.push([...call]);
      const key = call.slice(0, 2).join(" ");
      const records: Record<string, unknown> = {
        "task view": trackerConformanceFixtures.view,
      };
      return {
        exitCode: 0,
        stdout: JSON.stringify(records[key]),
        stderr: "",
      };
    },
  };
  return {
    adapter: new OpumAgentWorkflowAdapter(new QuestTrackerClient(runner)),
    argv,
  };
}

describe("opum-agent-workflow/v1", () => {
  test("binds a task by id plus claim-or-correlation identity over public reads only", async () => {
    const { adapter, argv } = fixtureClient();
    const evidence = await adapter.bind({
      taskId: "T-1",
      claimOrCorrelationId: "f54125ae12e541f4b7ba83abb8ba8a35",
      now: new Date("2026-08-24T00:00:00Z"),
    });
    expect(evidence.schemaVersion).toBe(OPUM_AGENT_WORKFLOW_SCHEMA);
    expect(evidence.identity).toEqual({
      taskId: "T-1",
      claimOrCorrelationId: "f54125ae12e541f4b7ba83abb8ba8a35",
    });
    expect(evidence.task).toEqual(trackerTaskFixture);
    // Read-only surface: only the task view command is ever invoked.
    expect(argv).toEqual([["task", "view", "T-1", "--json"]]);
  });

  test("rejects empty identity inputs with typed validation diagnostics", async () => {
    const { adapter } = fixtureClient();
    await expect(
      adapter.bind({ taskId: "", claimOrCorrelationId: "c" }),
    ).rejects.toMatchObject({ error_type: "validation" });
    await expect(
      adapter.bind({ taskId: "T-1", claimOrCorrelationId: "" }),
    ).rejects.toBeInstanceOf(OpumAgentWorkflowError);
  });

  test("reports freshness against updatedAt and an explicit maximum age", async () => {
    const { adapter } = fixtureClient();
    const fresh = await adapter.bind({
      taskId: "T-1",
      claimOrCorrelationId: "c",
      maxAgeMs: 86_400_000,
      now: new Date("2026-08-22T00:00:00Z"),
    });
    expect(fresh.revision.updatedAt).toBe("2026-08-21T00:00:00Z");
    expect(fresh.revision.fresh).toBe(true);
    const stale = await adapter.bind({
      taskId: "T-1",
      claimOrCorrelationId: "c",
      maxAgeMs: 86_400_000,
      now: new Date("2026-08-25T00:00:00Z"),
    });
    expect(stale.revision.fresh).toBe(false);
  });

  test("produces a deterministic digest independent of field order", async () => {
    const first = taskBindingDigest(trackerTaskFixture);
    const second = taskBindingDigest(trackerTaskFixture);
    const reordered = taskBindingDigest({
      ...trackerTaskFixture,
      labels: [...trackerTaskFixture.labels],
    });
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(reordered).toBe(first);
    expect(canonicalTaskJson(trackerTaskFixture)).not.toContain(":undefined");
  });

  test("maps a mismatched returned identifier to a conflict diagnostic", async () => {
    const runner: TrackerProcessRunner = {
      async run() {
        return {
          exitCode: 0,
          stdout: JSON.stringify({
            schemaVersion: 1,
            kind: "task.view",
            data: { ...trackerTaskFixture, id: "OTHER" },
          }),
          stderr: "",
        };
      },
    };
    const adapter = new OpumAgentWorkflowAdapter(
      new QuestTrackerClient(runner),
    );
    await expect(
      adapter.bind({ taskId: "T-1", claimOrCorrelationId: "c" }),
    ).rejects.toMatchObject({ error_type: "conflict" });
  });

  test("maps contract-invalid subprocess output to a drift diagnostic", async () => {
    const runner: TrackerProcessRunner = {
      async run() {
        return { exitCode: 0, stdout: "not json", stderr: "" };
      },
    };
    const adapter = new OpumAgentWorkflowAdapter(
      new QuestTrackerClient(runner),
    );
    await expect(
      adapter.bind({ taskId: "T-1", claimOrCorrelationId: "c" }),
    ).rejects.toMatchObject({ error_type: "drift" });
  });
});
