import { expect, mock, test } from "claude-code/testing";
import type { FsEntry, On } from "claude-code";

import {
  SIZE_HELD_HINT,
  filterRows,
  fullPaneSize,
  isStoredView,
  isWideLayout,
  listArgs,
  paneSize,
  parseAcrossRefs,
  parseTaskList,
  parseTaskView,
  pickState,
  sizeHeldHint,
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

test("full mode asks for the largest pane the surface allows", () => {
  // Docked the pane is sized across and inline it is sized down, and both are
  // asked for in one call: each is ignored where it does not apply, so asking
  // both is right whichever shape the surface seats the pane in.
  expect(fullPaneSize({ columns: 200, rows: 60 })).toEqual({
    columns: 180,
    rows: 54,
  });
  // Either axis alone is enough: `command.run` knows the terminal's width and
  // not its height, and a pane sized before that draws is still sized across.
  expect(fullPaneSize({ columns: 200 })).toEqual({ columns: 180 });

  // Nothing is asked for before any draw, so the surface's own default stands
  // rather than a guess at a size nobody measured.
  expect(paneSize({ isCollapsed: false, isFull: true }, null)).toEqual({});
  // The rail wins over full, so `c` from full mode lands on the rail and the
  // state it came from is still there when the pane expands again.
  expect(
    paneSize({ isCollapsed: true, isFull: true }, { columns: 200, rows: 60 }),
  ).toEqual({ columns: 22 });
  expect(
    paneSize({ isCollapsed: false, isFull: false }, { columns: 200, rows: 60 }),
  ).toEqual({ columns: 64 });
});

test("the board turns side by side at 120 body columns", () => {
  expect(isWideLayout(120)).toBe(true);
  expect(isWideLayout(119)).toBe(false);
});

test("a size the surface kept rather than granted is said out loud", () => {
  const full = { isCollapsed: false, isFull: true };
  const viewport = { columns: 200, rows: 60 };

  // A granted request still reads a couple of cells under it -- the body is
  // measured inside the frame -- so that alone is not the person's own size.
  expect(sizeHeldHint(full, "dock", viewport, 178)).toBeNull();
  expect(sizeHeldHint(full, "dock", viewport, 120)).toBe(SIZE_HELD_HINT);
  // Inline the pane is sized down, so the comparison is on rows, not across.
  expect(sizeHeldHint(full, "inline", viewport, 54)).toBeNull();
  expect(sizeHeldHint(full, "inline", viewport, 20)).toBe(SIZE_HELD_HINT);
  // Only full mode can be held: the dock and the rail ask for a fixed size.
  expect(
    sizeHeldHint({ isCollapsed: false, isFull: false }, "dock", viewport, 40),
  ).toBeNull();
  expect(
    sizeHeldHint({ isCollapsed: true, isFull: true }, "dock", viewport, 22),
  ).toBeNull();
  // And there is nothing to compare against before a viewport is known.
  expect(sizeHeldHint(full, "dock", null, 20)).toBeNull();
});

test("a stored view survives the reload, full mode included", () => {
  const stored = {
    tab: "list",
    scope: "fleet",
    status: "In Progress",
    isCollapsed: false,
    isFull: true,
    readRefs: false,
  };
  expect(isStoredView(stored)).toBe(true);
  // A view stored before full mode existed still loads rather than being
  // thrown away, and the pane reads it as the normal size.
  expect(
    isStoredView({
      tab: "list",
      scope: "fleet",
      status: "In Progress",
      isCollapsed: true,
    }),
  ).toBe(true);
  // A field this board cannot draw from at all is not one it stored.
  expect(isStoredView({ ...stored, isFull: "yes" })).toBe(false);
  expect(isStoredView({ ...stored, tab: "grid" })).toBe(false);
  expect(isStoredView(null)).toBe(false);
});

test("the z hotkey switches to the full size and remembers it", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  // The store is answered here rather than by `mock.store` so the test can read
  // back what the pane wrote: `savePrefs` is the writer and `isStoredView` the
  // reader the next session opens with, and the assertion is the pair of them.
  const entries = new Map<string, unknown>();
  on("store.get", async (_$, e) => ({ value: entries.get(e.key) }));
  on("store.set", async (_$, e) => {
    entries.set(e.key, e.value);

    return { value: undefined };
  });
  on("store.delete", async (_$, e) => {
    entries.delete(e.key);

    return { value: undefined };
  });
  on("store.keys", async () => ({ value: [...entries.keys()] }));
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  on("process.run", async (_$, e) => {
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    return ok(LISTING);
  });
  const opens: { columns?: number; rows?: number; focus?: boolean }[] = [];
  // The pane is answered here rather than left to the surface: what is under
  // test is the size the board ASKS for, and a surface would record a placed
  // pane either way.
  on("ui.open", async (_$, e) => {
    opens.push({ columns: e.columns, rows: e.rows, focus: e.focus });

    return { value: { isPlaced: true } };
  });
  on("ui.close", async () => ({ value: undefined }));
  on("ui.panes", async () => ({ value: [] }));
  const storedView = () => entries.get("opum-quest.board.view");

  for (const surface of ["terminal", "desktop"] as const) {
    opens.length = 0;
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
      viewport: { columns: 200, rows: 60, isFullscreen: true },
    });

    await ui.press({ key: "full" });
    // 200 columns less the transcript margin the design keeps visible, and 60
    // rows less the prompt area: the largest pane this surface allows. It is
    // focused, so the keys are on the pane the person just asked for.
    expect(opens.at(-1)).toEqual({ columns: 180, rows: 54, focus: true });
    // The choice is stored with the pane's other settings, which is what the
    // next session reads back through isStoredView.
    expect(isStoredView(storedView())).toBe(true);
    expect((storedView() as { isFull: boolean }).isFull).toBe(true);

    await ui.press({ key: "full" });
    expect(opens.at(-1)).toEqual({
      columns: 64,
      rows: undefined,
      focus: true,
    });
    expect((storedView() as { isFull: boolean }).isFull).toBe(false);
    await ui.unmount();
  }
});

test("a full size the board re-asks for itself does not take the keyboard", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  on("process.run", async (_$, e) => {
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    return ok(LISTING);
  });
  const opens: { columns?: number; rows?: number; focus?: boolean }[] = [];
  on("ui.open", async (_$, e) => {
    opens.push({ columns: e.columns, rows: e.rows, focus: e.focus });

    return { value: { isPlaced: true } };
  });
  on("ui.close", async () => ({ value: undefined }));
  on("ui.panes", async () => ({ value: [] }));

  const mount = (
    surface: "terminal" | "desktop",
    columns: number,
    rows: number,
  ) =>
    $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
      viewport: { columns, rows, isFullscreen: true },
    });

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await mount(surface, 200, 60);
    // The pane's own mode outlives a mount and the file shares one copy of the
    // module, so the starting mode is READ off the toggle's own label rather
    // than assumed: the button says where pressing it goes.
    const isFull = async () =>
      (await ui.find({ type: "Button", text: "Normal size" })) !== undefined;
    if (await isFull()) {
      await ui.press({ key: "full" });
    }
    // A toggle the PERSON starts, so the pane is handed the keyboard.
    opens.length = 0;
    await ui.press({ key: "full" });
    expect(opens.at(-1)).toEqual({ columns: 180, rows: 54, focus: true });
    await ui.unmount();

    // The surface now reports a different size, so the board asks again for the
    // full size on its own account. Nobody asked for the pane here, so the
    // keyboard stays where it is: exactly one open, and it is not focused.
    opens.length = 0;
    const again = await mount(surface, 160, 50);
    expect(opens).toEqual([{ columns: 140, rows: 44, focus: undefined }]);
    await again.unmount();
  }
});

test("the detail draws beside the list from 120 body columns", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  on("process.run", async (_$, e) => {
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    return ok(LISTING);
  });

  for (const surface of ["terminal", "desktop"] as const) {
    for (const [bodyColumns, flexDirection] of [
      [130, "row"],
      [119, "column"],
    ] as const) {
      const ui = await $.ui.mount({
        plugin: "opum-quest",
        surface,
        component: "Pane",
        requestId: "quest-board",
        props: { ...PANE, bodyColumns },
      });
      await ui.press({ key: "tab-list" });
      // With no task open there is nothing to draw beside the list, so the
      // board is one column at every width.
      expect((await ui.find({ key: "layout" }))?.props.flexDirection).toBe(
        "column",
      );
      await ui.press({ key: "row:opum-cli:OCLI-8" });
      expect((await ui.find({ key: "layout" }))?.props.flexDirection).toBe(
        flexDirection,
      );
      expect(
        await ui.find({ type: "Text", text: /Acceptance criteria/ }),
      ).toBeDefined();
      await ui.unmount();
    }
  }
});

test("the pane says so when the surface kept the person's size", async ($, on) => {
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  const entries = new Map<string, unknown>();
  on("store.get", async (_$, e) => ({ value: entries.get(e.key) }));
  on("store.set", async (_$, e) => {
    entries.set(e.key, e.value);

    return { value: undefined };
  });
  on("store.delete", async (_$, e) => {
    entries.delete(e.key);

    return { value: undefined };
  });
  on("store.keys", async () => ({ value: [...entries.keys()] }));
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  on("process.run", async (_$, e) => {
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) return ok(VIEW);
    return ok(LISTING);
  });
  on("ui.open", async () => ({ value: { isPlaced: true } }));
  on("ui.close", async () => ({ value: undefined }));
  on("ui.panes", async () => ({ value: [] }));

  for (const surface of ["terminal", "desktop"] as const) {
    // A pane the person has dragged: it was granted 60 columns where full mode
    // asks for 180, and the board says so rather than claiming the size.
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: { ...PANE, bodyColumns: 60 },
      viewport: { columns: 200, rows: 60, isFullscreen: true },
    });
    // The pane's own state outlives a mount, so which of the two modes reads
    // as held is asserted by the toggle flipping it rather than by assuming
    // which one the test was handed.
    const before = await ui.find({ type: "Text", text: SIZE_HELD_HINT });
    await ui.press({ key: "full" });
    const after = await ui.find({ type: "Text", text: SIZE_HELD_HINT });
    // Exactly one of the two: at 60 granted columns full mode is short of the
    // 180 it asked for and says so, and the normal size claims nothing.
    expect([before, after].filter(Boolean)).toHaveLength(1);
    await ui.press({ key: "full" });
    await ui.unmount();
  }
});
