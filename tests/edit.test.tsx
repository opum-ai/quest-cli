import { expect, mock, test } from "claude-code/testing";
import type { FsEntry, On } from "claude-code";

import { actorArgs, commentArg } from "../hooks/quest";

const PANE = {
  title: "Quest board",
  isFocused: true,
  bodyColumns: 64,
  placement: "dock" as const,
  scroll: { offset: 0, bodyRows: 80 },
  view: {},
};

const ok = (stdout: string, exitCode = 0) => ({
  value: {
    exitCode,
    stdout,
    stderr: "",
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
});

const list = (status: string) =>
  JSON.stringify({
    kind: "task.list",
    data: [
      { id: "OCLI-8", title: "Probes", status, priority: "high", labels: [] },
    ],
  });

const viewOf = (status: string) =>
  JSON.stringify({
    kind: "task.view",
    data: {
      id: "OCLI-8",
      title: "Probes",
      status,
      priority: "high",
      revision: "rev1",
      acceptanceCriteria: [
        { index: 0, position: 1, text: "Each probe passes", checked: false },
      ],
      comments: [
        {
          id: "c-1",
          authorId: "jdnewhouse",
          body: "Looks right",
          createdAt: "2026-10-02T14:00:00.000Z",
        },
      ],
    },
  });

const FLEET: FsEntry[] = [
  { name: "opum-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
  { name: "opum-doc", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
];

function mockFleet(on: On) {
  on("fs.list", async () => ({ value: FLEET }));
  on("fs.exists", async () => ({ value: true }));
}

test("commentArg and actorArgs match what quest takes", async () => {
  expect(actorArgs("jdnewhouse")).toEqual([
    "--actor",
    "jdnewhouse",
    "--actor-kind",
    "human",
  ]);
  expect(
    JSON.parse(commentArg("jdnewhouse", "hi", Date.UTC(2026, 9, 2))),
  ).toEqual([
    {
      id: `c-${Date.UTC(2026, 9, 2)}`,
      authorId: "jdnewhouse",
      body: "hi",
      createdAt: "2026-10-02T00:00:00.000Z",
    },
  ]);
});

test("edits in this repo call quest with the actor and the revision guard", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 14, 30) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/tmp/opum-cli" }));
  const calls: string[][] = [];
  on("process.run", async (_$, e) => {
    calls.push([...e.argv]);
    if (e.argv[0] === "git" && e.argv.includes("--git-common-dir"))
      return ok("/tmp/opum-cli/.git\n");
    if (e.argv[0] === "git")
      return ok(" M .quest/tasks/OCLI-8.json\n M .quest/tasks/OCLI-9.json\n");
    if (e.argv.includes("view")) return ok(viewOf("In Progress"));
    if (e.argv.includes("list")) {
      return ok(
        e.init?.cwd === "/tmp/opum-cli"
          ? list("In Progress")
          : JSON.stringify({ kind: "task.list", data: [] }),
      );
    }
    return ok(JSON.stringify({ kind: "task.edit", data: { id: "OCLI-8" } }));
  });

  for (const surface of ["terminal", "desktop"] as const) {
    calls.length = 0;
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    await ui.press({ key: "tab-list" });
    await ui.press({ key: "local" });
    await ui.press({ key: "row:opum-cli:OCLI-8" });
    expect(
      await ui.find({
        type: "Text",
        text: /jdnewhouse, 2026-10-02 14:00: Looks right/,
      }),
    ).toBeDefined();

    await ui.press({ key: "pause" });
    expect(calls).toContainEqual([
      "quest",
      "task",
      "pause",
      "OCLI-8",
      "--actor",
      "jdnewhouse",
      "--actor-kind",
      "human",
      "--json",
    ]);

    await ui.input({ key: "comment", text: "Ship it" });
    const comment = calls.find((argv) => argv.includes("--add-comment"));
    expect(comment?.slice(0, 4)).toEqual(["quest", "task", "edit", "OCLI-8"]);
    expect(comment).toContain("--if-revision");
    expect(comment?.[comment.indexOf("--if-revision") + 1]).toBe("rev1");

    await ui.press({ key: "ac:1" });
    expect(
      calls.some((argv) => argv.includes("--check-ac") && argv.includes("1")),
    ).toBe(true);

    expect(
      await ui.find({
        type: "Text",
        text: /2 tracker changes in opum-cli not committed yet/,
      }),
    ).toBeDefined();
    await ui.unmount();
  }
});

test("a task from another repo is read-only", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 14, 30) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/tmp/opum-doc" }));
  on("process.run", async (_$, e) => {
    if (e.argv[0] === "git" && e.argv.includes("--git-common-dir"))
      return ok("/tmp/opum-doc/.git\n");
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(viewOf("In Progress"));
    const repo = (e.init?.cwd ?? "").split("/").pop();
    return ok(
      repo === "opum-cli"
        ? list("In Progress")
        : JSON.stringify({ kind: "task.list", data: [] }),
    );
  });
  const ui = await $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "Pane",
    requestId: "quest-board",
    props: PANE,
  });
  await ui.press({ key: "tab-list" });
  await ui.press({ key: "fleet" });
  await ui.press({ key: "row:opum-cli:OCLI-8" });
  expect(
    await ui.find({
      type: "Text",
      text: /Read-only here. opum-cli is edited from its own session./,
    }),
  ).toBeDefined();
  expect(await ui.find({ key: "pause" })).toBeUndefined();
  expect(await ui.find({ key: "comment" })).toBeUndefined();
});

test(
  "the actor option decides what a write is recorded as",
  { options: { actor: "someone-else" } },
  async ($, on) => {
    mock.clock(on, { now: Date.UTC(2026, 9, 2, 14, 30) });
    mock.store(on);
    mockFleet(on);
    on("session.root", async () => ({ value: "/tmp/opum-cli" }));
    const calls: string[][] = [];
    on("process.run", async (_$, e) => {
      calls.push([...e.argv]);
      if (e.argv[0] === "git") return ok("");
      if (e.argv.includes("view")) return ok(viewOf("In Progress"));
      if (e.argv.includes("list")) return ok(list("In Progress"));
      return ok(JSON.stringify({ kind: "task.edit", data: { id: "OCLI-8" } }));
    });

    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface: "terminal",
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    await ui.press({ key: "tab-list" });
    await ui.press({ key: "local" });
    await ui.press({ key: "row:opum-cli:OCLI-8" });
    await ui.press({ key: "pause" });
    expect(calls).toContainEqual([
      "quest",
      "task",
      "pause",
      "OCLI-8",
      "--actor",
      "someone-else",
      "--actor-kind",
      "human",
      "--json",
    ]);
  },
);
