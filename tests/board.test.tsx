import { expect, mock, test } from "claude-code/testing";
import type { FsEntry, On } from "claude-code";

import {
  filterRows,
  listArgs,
  parseAcrossRefs,
  parseTaskList,
  parseTaskView,
  pickState,
} from "../hooks/quest";

const PANE = {
  title: "Quest board",
  isFocused: true,
  bodyColumns: 64,
  placement: "dock" as const,
  scroll: { offset: 0, bodyRows: 60 },
  view: {},
};

const ROOT = "/repos";

const ok = (stdout: string) => ({
  value: {
    exitCode: 0,
    stdout,
    stderr: "",
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
});

// The workspaces a fleet root holds, as `$.fs` would answer for them.
const FLEET: FsEntry[] = [
  { name: "opum-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
  { name: "ward-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
  { name: "not-a-workspace", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
  { name: "README.md", kind: "file", size: 0, mtimeMs: 0, isLink: false },
];

function mockFleet(on: On) {
  on("fs.list", async (_$, e) => ({ value: e.path === ROOT ? FLEET : [] }));
  on("fs.exists", async (_$, e) => ({
    value:
      e.path.endsWith("/.quest/workspace.toml") &&
      !e.path.includes("not-a-workspace"),
  }));
}

const LISTING = JSON.stringify({
  kind: "task.list",
  data: [
    {
      id: "OCLI-8",
      title: "Failure probes",
      status: "In Progress",
      priority: "high",
      labels: ["c5"],
    },
  ],
});

const VIEW = JSON.stringify({
  kind: "task.view",
  data: {
    id: "OCLI-8",
    title: "Failure probes",
    status: "In Progress",
    priority: "high",
    type: "feature",
    labels: ["c5"],
    description: "Run the **probes**.",
    acceptanceCriteria: [
      { index: 0, text: "Each probe passes", checked: true },
      { index: 1, text: "Rollback exercised", checked: false },
    ],
    dependencies: ["OCLI-7"],
    implementationNotes: ["first", "latest note here"],
    updatedAt: "2026-10-02T04:40:00Z",
  },
});

const ACROSS = JSON.stringify({
  kind: "task.list-across-refs",
  data: [
    {
      id: "OCLI-8",
      title: "Failure probes",
      proposedBy: null,
      conflict: false,
      states: [
        {
          status: "In Progress",
          refProvenance: { ref: "origin/dev", pullRequest: null, sha: "a" },
        },
      ],
    },
    {
      id: "OCLI-9",
      title: "Two refs disagree",
      proposedBy: "opum-ai/opum-cli#4",
      conflict: true,
      states: [
        {
          status: "To Do",
          refProvenance: { ref: "origin/dev", pullRequest: null, sha: "a" },
        },
        {
          status: "In Progress",
          refProvenance: {
            ref: "refs/pull/4/head",
            pullRequest: "opum-ai/opum-cli#4",
            sha: "b",
          },
        },
      ],
    },
    {
      id: "OCLI-10",
      title: "Only on a pull request",
      proposedBy: "opum-ai/opum-cli#4",
      conflict: false,
      states: [
        {
          status: "To Do",
          refProvenance: {
            ref: "refs/pull/4/head",
            pullRequest: "opum-ai/opum-cli#4",
            sha: "b",
          },
        },
      ],
    },
  ],
  coverage: {
    complete: false,
    population: "dev-only",
    discoveredAt: "2026-10-02T00:00:00.000Z",
    refsRead: [{ ref: "origin/dev", pullRequest: null, sha: "a" }],
    refsUnreadable: ["refs/pull/9/head"],
  },
});

test("parsers keep the drawn fields", async () => {
  expect(parseTaskList(LISTING)[0]).toEqual({
    id: "OCLI-8",
    title: "Failure probes",
    status: "In Progress",
    priority: "high",
    labels: ["c5"],
    proposedBy: null,
    conflict: false,
  });
  const task = parseTaskView(VIEW);
  expect(task.criteria).toEqual([
    { text: "Each probe passes", isChecked: true, position: 1 },
    { text: "Rollback exercised", isChecked: false, position: 2 },
  ]);
  expect(task.latestNote).toBe("latest note here");
  expect(() => parseTaskList('{"kind":"error"}')).toThrow();
});

test("filters match id, title or label and narrow by repo", async () => {
  const rows = [
    { repo: "a", error: null, coverage: null, tasks: parseTaskList(LISTING) },
    {
      repo: "b",
      error: null,
      coverage: null,
      tasks: [
        {
          id: "B-1",
          title: "Other",
          status: "To Do",
          priority: null,
          labels: [],
          proposedBy: null,
          conflict: false,
        },
      ],
    },
  ];
  expect(filterRows(rows, "probe", "all").map((r) => r.tasks.length)).toEqual([
    1, 0,
  ]);
  expect(filterRows(rows, "C5", "all").map((r) => r.tasks.length)).toEqual([
    1, 0,
  ]);
  expect(filterRows(rows, "", "b").map((r) => r.repo)).toEqual(["b"]);
  expect(listArgs("open", false)).toEqual([
    "--exclude-status",
    "Done",
    "--exclude-status",
    "Closed",
    "--limit",
    "200",
  ]);
  expect(listArgs("Done", false)).toEqual([
    "--status",
    "Done",
    "--limit",
    "50",
  ]);
  // The refs read is the same filters over a different population, and it is
  // read-only: it never refuses over a ref it could not read.
  expect(listArgs("In Progress", true)).toEqual([
    "--across-refs",
    "--allow-partial",
    "--status",
    "In Progress",
    "--limit",
    "200",
  ]);
});

test("the across-refs read keeps the landed state and reports coverage", async () => {
  const { tasks, coverage } = parseAcrossRefs(ACROSS);
  expect(tasks[0]).toMatchObject({
    id: "OCLI-8",
    status: "In Progress",
    conflict: false,
  });
  // origin/dev wins over the state a pull request head carries.
  expect(tasks[1]).toMatchObject({
    id: "OCLI-9",
    status: "To Do",
    conflict: true,
    proposedBy: "opum-ai/opum-cli#4",
  });
  // A record only a pull request has is drawn from that state, and named.
  expect(tasks[2]).toMatchObject({
    id: "OCLI-10",
    status: "To Do",
    proposedBy: "opum-ai/opum-cli#4",
  });
  expect(coverage).toEqual({
    complete: false,
    refsRead: 1,
    refsUnreadable: ["refs/pull/9/head"],
  });
  expect(pickState([])).toBe("");
});

test("list, detail, errors and kanban draw on terminal and desktop", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  on("process.run", async (_$, e) => {
    const repo = (e.init?.cwd ?? "").split("/").pop();
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    if (repo === "opum-cli") return ok(LISTING);
    if (repo === "ward-cli") {
      return {
        value: {
          exitCode: 3,
          stdout: "",
          stderr: "no tracker here",
          isStdoutTruncated: false,
          isStderrTruncated: false,
        },
      };
    }
    return ok(JSON.stringify({ kind: "task.list", data: [] }));
  });

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    await ui.press({ key: "tab-list" });
    await ui.press({ key: "refresh" });
    expect(
      await ui.find({
        type: "Text",
        text: /1 in progress task in 1 repo, checked 04:30/,
      }),
    ).toBeDefined();
    expect(
      await ui.find({ type: "Text", text: /ward-cli: no tracker here/ }),
    ).toBeDefined();
    // The fleet is discovered from the directories under the session's parent,
    // so a workspace that answers, one that refuses and one that is not a
    // workspace at all are all accounted for.
    expect(await ui.find({ key: "repo" })).toBeDefined();
    expect(
      await ui.find({ type: "Text", text: /not-a-workspace/ }),
    ).toBeUndefined();

    await ui.press({ key: "row:opum-cli:OCLI-8" });
    expect(
      await ui.find({
        type: "Text",
        text: /Acceptance criteria, 1 of 2 checked/,
      }),
    ).toBeDefined();
    expect(
      await ui.find({ type: "Text", text: /Depends on OCLI-7/ }),
    ).toBeDefined();
    await ui.press({ key: "close-detail" });
    expect(
      await ui.find({ type: "Text", text: /Acceptance criteria/ }),
    ).toBeUndefined();

    await ui.press({ key: "tab-kanban" });
    expect(
      await ui.find({ type: "Text", text: /In Progress \(1\)/ }),
    ).toBeDefined();
    expect(await ui.find({ type: "Text", text: /To Do \(0\)/ })).toBeDefined();
    await ui.unmount();
  }
});

test("the refs toggle reads across refs and the pane says what was not read", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  const calls: string[][] = [];
  on("process.run", async (_$, e) => {
    calls.push([...e.argv]);
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    if (e.argv.includes("--across-refs")) return ok(ACROSS);
    return ok(LISTING);
  });

  const ui = await $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "Pane",
    requestId: "quest-board",
    props: PANE,
  });
  await ui.press({ key: "tab-list" });
  expect(calls.some((argv) => argv.includes("--across-refs"))).toBe(false);

  await ui.press({ key: "refs" });
  expect(
    calls.some(
      (argv) =>
        argv.includes("task") &&
        argv.includes("--across-refs") &&
        argv.includes("--allow-partial"),
    ),
  ).toBe(true);
  // An incomplete read is drawn as incomplete rather than as an empty board,
  // and a conflict is marked on the row rather than silently resolved.
  expect(
    await ui.find({
      type: "Text",
      text: /refs read, complete|read, INCOMPLETE/,
    }),
  ).toBeDefined();
  expect(
    await ui.find({ type: "Text", text: /INCOMPLETE in opum-cli/ }),
  ).toBeDefined();
  expect(
    await ui.find({
      type: "Text",
      text: /\* marks a task whose refs disagree/,
    }),
  ).toBeDefined();
  await ui.unmount();
});
