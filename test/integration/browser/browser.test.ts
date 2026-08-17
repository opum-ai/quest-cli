import { expect, test } from "bun:test";

import {
  createBrowserHandler,
  defaultBrowserHost,
  startBrowserServer,
} from "../../../src/application/browser/browser.ts";
import {
  type PlanningRepository,
  PlanningService,
} from "../../../src/application/planning/planning.ts";
import { createTask } from "../../../src/domain/tasks/tasks.ts";

const planningRepository: PlanningRepository = {
  read: async () => ({
    revision: "1",
    milestones: [
      { id: "M-1", title: "Release", status: "open", taskIds: ["T-1"] },
    ],
    decisions: [],
  }),
  write: async () => ({ kind: "conflict" }),
};

const dependencies = {
  planning: new PlanningService(planningRepository),
  tasks: {
    readAll: async () => ({
      revision: "1",
      tasks: [createTask("T-1", { title: "Ship" })],
    }),
  },
};

test("browser server exposes deterministic read-only overview and board payloads on loopback", async () => {
  const browser = await startBrowserServer(dependencies, { port: 0 });
  try {
    expect(browser.host).toBe(defaultBrowserHost);
    expect(
      await (
        await fetch(`http://${browser.host}:${browser.port}/overview`)
      ).json(),
    ).toEqual({
      kind: "browser.overview",
      overview: {
        tasks: { total: 1, byStatus: { "To Do": 1 } },
        milestones: { open: 1, closed: 0 },
        decisions: {},
      },
    });
    expect(
      await (
        await fetch(`http://${browser.host}:${browser.port}/board`)
      ).json(),
    ).toEqual({
      kind: "browser.board",
      board: {
        columns: [{ status: "To Do", taskIds: ["T-1"] }],
        milestones: [
          { id: "M-1", title: "Release", status: "open", taskIds: ["T-1"] },
        ],
      },
    });
  } finally {
    await browser.close();
  }
});

test("browser handler rejects mutations and only exposes its defined routes", async () => {
  const browser = await startBrowserServer(dependencies);
  try {
    expect(
      (await fetch(`http://${browser.host}:${browser.port}/missing`)).status,
    ).toBe(404);
    expect(
      (
        await fetch(`http://${browser.host}:${browser.port}/overview`, {
          method: "POST",
        })
      ).status,
    ).toBe(405);
    await expect(
      startBrowserServer(dependencies, { host: "0.0.0.0" }),
    ).rejects.toThrow("browser_host_must_be_loopback");
  } finally {
    await browser.close();
  }
  expect(createBrowserHandler(dependencies)).toBeFunction();
});
