import { expect, mock, test } from "claude-code/testing";
import type { Engine } from "claude-code/testing";
import type { FsEntry, On } from "claude-code";

import {
  SIZE_HELD_HINT,
  alertToasts,
  batchLine,
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
import type { AlertChanges, AlertTask } from "../hooks/quest";

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

// --- The dashboard tool (QCLI-441) -----------------------------------------
//
// The board's way in since the slash command's removal: the mod registers
// `mcp__opum-quest__dashboard` at `session.start` and serves it from a
// `tool.call` hook. The pane id and the `ui.render` requestId stay
// `quest-board`; only the command is gone.

const TOOL = "mcp__opum-quest__dashboard";

type Open = {
  id?: string;
  columns?: number;
  rows?: number;
  focus?: boolean;
};

/**
 * One pane as `$.ui.panes()` reports it, and as `boardIsShown` reads it.
 *
 * The engine's own record, not this mod's: placed is whether the surface seated
 * it, shown whether it is the pane the surface draws -- a pane open and drawn
 * behind another of the plugin's own is placed and not shown.
 */
type PaneRecord = {
  id: string;
  title: string;
  isShown: boolean;
  isFocused: boolean;
  isPlaced: boolean;
};

/** The board's pane as it reads once the surface has drawn it. */
const BOARD_PANE: PaneRecord = {
  id: "quest-board",
  title: "Quest board",
  isShown: true,
  isFocused: false,
  isPlaced: true,
};

/**
 * The engine's own answer for an unasked open below its floor, as measured on
 * Claude Code 2.1.288 (QCLI-444's live probe at 100 columns): the `reason`
 * a `$.ui.open` returns beside `{ isPlaced: false }`, and the text the tool's
 * waiting line quotes verbatim.
 */
const UNPLACED_REASON =
  "unasked below 144 columns (100 now): placed when the person opens it, or when the terminal is widened to 144 columns";

/**
 * The engine mocks the tool tests need: the clock, an empty store, the fleet
 * discovery, a `quest` answering the fixtures above, and every `ui.open`
 * recorded so the size, the id and the focus it asked for can be asserted.
 *
 * `NOPE-1` is not found in any workspace, which is what the unknown-task test
 * needs; every other id resolves.
 *
 * `panes` is the record `$.ui.panes()` answers, defaulting to the placed pane
 * `ui.open` above says it drew. A test mutating it drives the record the tool
 * result is read from: an entry with `isPlaced` false is the pane waiting
 * undrawn below the floor an unasked pane is placed from.
 */
function mockBoard(
  on: On,
  opens: Open[],
  asked?: string[][],
  panes: PaneRecord[] = [{ ...BOARD_PANE }],
): { name: string; description: string; inputSchema?: unknown }[] {
  const registers: {
    name: string;
    description: string;
    inputSchema?: unknown;
  }[] = [];
  mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
  mock.store(on);
  mockFleet(on);
  on("session.root", async () => ({ value: "/repos/opum-cli" }));
  // `session.start` and `tool.register` are the engine's to answer: nothing
  // sits beneath a test's hooks, so a plugin's call on one rejects unless the
  // test answers it. What the mod asked to register is recorded, which is the
  // shape of the assertion the kit allows.
  on("session.start", async (_$, e) => ({ cwd: e.cwd }));
  on("tool.register", async (_$, e) => {
    registers.push(e);

    return { value: { tool: `mcp__opum-quest__${e.name}` } };
  });
  on("process.run", async (_$, e) => {
    asked?.push([e.init?.cwd ?? "", ...e.argv]);
    if (e.argv[0] === "git") return ok("");
    if (e.argv.includes("view")) {
      const id = e.argv[e.argv.indexOf("view") + 1];
      if (id === "NOPE-1") {
        return {
          value: {
            exitCode: 3,
            stdout: "",
            stderr: "task_not_found",
            isStdoutTruncated: false,
            isStderrTruncated: false,
          },
        };
      }

      return ok(VIEW);
    }

    return ok(LISTING);
  });
  on("ui.open", async (_$, e) => {
    opens.push({
      id: e.id,
      columns: e.columns,
      rows: e.rows,
      focus: e.focus,
    });

    // The engine's answer as the fixture record stands: an unplaced pane's
    // open comes back with the reason the waiting line quotes, and a placed
    // one -- or a record listing no pane -- comes back placed, with none.
    const pane = panes.find((one) => one.id === e.id);

    return {
      value:
        pane !== undefined && !pane.isPlaced
          ? { isPlaced: false, reason: UNPLACED_REASON }
          : { isPlaced: true },
    };
  });
  on("ui.close", async () => ({ value: undefined }));
  on("ui.panes", async () => ({ value: panes }));

  return registers;
}

const START = {
  cwd: "/repos/opum-cli",
  surface: "terminal",
  isInteractive: true,
} as const;

test("the dashboard tool registers at session start and opens without focus", async ($, on) => {
  const opens: Open[] = [];
  const registers = mockBoard(on, opens);

  await $.session.start({ ...START });
  // The engine builds the listed name from the plugin's and the short name --
  // `mcp__opum-quest__dashboard` -- so what this asserts is the registration
  // the mod made, read back from the recorded call: the kit's `$` carries no
  // `tool.list` to read a registry from.
  expect(registers).toHaveLength(1);
  expect(registers[0]?.name).toBe("dashboard");
  expect(registers[0]?.description).toMatch(/Quest board/);
  // One or two sentences: the tool is listed to Claude in every session that
  // loads the mod, so the description stays short.
  expect(
    (registers[0]?.description.match(/\./gu) ?? []).length,
  ).toBeLessThanOrEqual(2);
  expect(
    Object.keys(
      (registers[0]?.inputSchema as { properties?: object } | undefined)
        ?.properties ?? {},
    ),
  ).toEqual(["scope", "full", "task"]);

  for (const surface of ["terminal", "desktop"] as const) {
    opens.length = 0;
    const answer = await $.tool.call({ tool: TOOL });
    // Exactly one open, the board's pane id, and NO focus: Claude may have
    // called this unasked while the person was typing.
    expect(opens).toEqual([
      { id: "quest-board", columns: 64, rows: undefined, focus: undefined },
    ]);
    expect(answer).toEqual({ result: "Opened the Quest board." });
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    expect(await ui.find({ key: "full" })).toBeDefined();
    await ui.unmount();
  }
});

test("the scope input lands in the view the tool opens", async ($, on) => {
  const opens: Open[] = [];
  mockBoard(on, opens);
  await $.session.start({ ...START });

  for (const surface of ["terminal", "desktop"] as const) {
    const drawn = async () => {
      const ui = await $.ui.mount({
        plugin: "opum-quest",
        surface,
        component: "Pane",
        requestId: "quest-board",
        props: PANE,
      });

      return ui;
    };

    await $.tool.call({ tool: TOOL, scope: "fleet" });
    const fleet = await drawn();
    expect((await fleet.find({ key: "fleet" }))?.props.variant).toBe("primary");
    expect((await fleet.find({ key: "local" }))?.props.variant).toBeUndefined();
    await fleet.unmount();

    const answer = await $.tool.call({ tool: TOOL, scope: "local" });
    const local = await drawn();
    expect((await local.find({ key: "local" }))?.props.variant).toBe("primary");
    expect((await local.find({ key: "fleet" }))?.props.variant).toBeUndefined();
    await local.unmount();
    expect(answer).toEqual({
      result: "Opened the Quest board, local scope.",
    });
  }
});

test("the full input lands in the size the tool opens", async ($, on) => {
  const opens: Open[] = [];
  mockBoard(on, opens);
  await $.session.start({ ...START });

  for (const surface of ["terminal", "desktop"] as const) {
    // A draw is what measures the surface, so the size the tool asks for is
    // asserted after one: 200x60 less the margins full mode keeps.
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
      viewport: { columns: 200, rows: 60, isFullscreen: true },
    });
    opens.length = 0;
    const answer = await $.tool.call({ tool: TOOL, full: true });
    expect(opens.at(-1)).toEqual({
      id: "quest-board",
      columns: 180,
      rows: 54,
      focus: undefined,
    });
    expect(
      await ui.find({ type: "Button", text: "Normal size" }),
    ).toBeDefined();
    expect(answer).toEqual({
      result: "Opened the Quest board, full screen.",
    });
    await ui.unmount();
  }
});

test("the task input opens that task in the detail view", async ($, on) => {
  const opens: Open[] = [];
  const asked: string[][] = [];
  mockBoard(on, opens, asked);
  await $.session.start({ ...START });

  for (const surface of ["terminal", "desktop"] as const) {
    const answer = await $.tool.call({ tool: TOOL, task: "OCLI-8" });
    expect(answer).toEqual({
      result: "Opened the Quest board, OCLI-8 selected.",
    });
    // The id is resolved by asking the workspaces themselves, not read off the
    // board's current view: a task that is Done, or outside the scope, is
    // still found.
    expect(
      asked.filter((argv) => argv.includes("view") && argv.includes("OCLI-8"))
        .length,
    ).toBeGreaterThan(0);
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    expect(
      await ui.find({ type: "Text", text: /OCLI-8 Failure probes/ }),
    ).toBeDefined();
    expect(
      await ui.find({
        type: "Text",
        text: /Acceptance criteria, 1 of 2 checked/,
      }),
    ).toBeDefined();
    await ui.unmount();
  }
});

test("an unknown task id comes back an error and opens nothing", async ($, on) => {
  const opens: Open[] = [];
  mockBoard(on, opens);
  await $.session.start({ ...START });

  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface,
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    const before = await ui.find({ type: "Text", text: /Acceptance criteria/ });
    opens.length = 0;

    const answer = await $.tool.call({ tool: TOOL, task: "NOPE-1" });
    // Nothing is opened at all -- not the board, and not some other task in
    // the named one's place -- and the error names the id it could not find.
    expect(opens).toEqual([]);
    expect(answer).toEqual({
      deny: expect.stringContaining("NOPE-1"),
    });
    const after = await ui.find({ type: "Text", text: /Acceptance criteria/ });
    expect(after === undefined).toBe(before === undefined);
    await ui.unmount();
  }
});

test("the tool's result reports the engine's record, not what its open asked for", async ($, on) => {
  const opens: Open[] = [];
  const panes: PaneRecord[] = [{ ...BOARD_PANE }];
  mockBoard(on, opens, undefined, panes);
  await $.session.start({ ...START });

  // The record says the surface drew the pane, so the result says so too.
  const opened = await $.tool.call({ tool: TOOL });
  expect(opened).toEqual({ result: "Opened the Quest board." });

  // The open returned and the pane is waiting undrawn: the engine places an
  // unasked pane only from its floor (144 columns, or 110 once the person has
  // opened it before), and below that nobody can see a board the result just
  // claimed. The result says what is true instead -- quoting the engine's own
  // `reason` for the open, so the floor it names is the engine's number.
  panes[0] = { ...BOARD_PANE, isPlaced: false, isShown: false };
  const waiting = await $.tool.call({ tool: TOOL });
  expect(waiting).toEqual({
    result: expect.stringContaining(UNPLACED_REASON),
  });
  expect(waiting).not.toEqual({
    result: expect.stringContaining("Opened the Quest board"),
  });

  // Placed and shown are two facts. A pane seated behind another of the
  // plugin's own is open and not the one the person is looking at, and the
  // result may not name it as a board they can see.
  panes[0] = { ...BOARD_PANE, isPlaced: true, isShown: false };
  const behind = await $.tool.call({ tool: TOOL });
  // The open came back placed, so there is no reason to quote: the line says
  // only what the record shows.
  expect(behind).toEqual({ result: expect.stringContaining("not shown") });
  expect(behind).not.toEqual({
    result: expect.stringContaining("Opened the Quest board"),
  });

  // And a pane the record does not list at all -- an open the engine refused
  // outright -- is not an opened board either.
  panes.length = 0;
  const refused = await $.tool.call({ tool: TOOL });
  expect(refused).toEqual({ result: expect.stringContaining("not shown") });

  // Four calls in a row, each of which left a refresh running unawaited: the
  // drawing below is where that work settles, and the test ends as its
  // siblings do rather than mid-refresh.
  const ui = await $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "Pane",
    requestId: "quest-board",
    props: PANE,
  });
  expect(await ui.find({ key: "tab-list" })).toBeDefined();
  await ui.unmount();
});

/**
 * The props the engine hands a `ui.render` hook for `AbovePrompt`. The band's
 * own hook reads none of them, but a mount carries them all.
 */
const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 20,
  bodyColumns: 100,
  scroll: { offset: 0, bodyRows: 20 },
  view: {},
};

test("a waiting pane is offered by a band, and its Open press is the person's ask", async ($, on) => {
  const opens: Open[] = [];
  const panes: PaneRecord[] = [
    { ...BOARD_PANE, isPlaced: false, isShown: false },
  ];
  const invalidates: string[] = [];
  mockBoard(on, opens, undefined, panes);
  on("ui.invalidate", async (_$, e) => {
    invalidates.push(e.event);

    return { value: undefined };
  });
  // The engine's own band, beneath the mod's: the mod draws its own only while
  // the pane waits undrawn and passes the drawing down once it is placed.
  on("ui.render", { component: "AbovePrompt" }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e);

    return h(Box, null, h(Text, null, "engine band"));
  });
  await $.session.start({ ...START });

  const ui = await $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "AbovePrompt",
    props: BAND,
  });
  // One line, offering the board -- which is the only way in on a terminal too
  // narrow to seat a pane nobody asked for -- and naming the focus step the
  // letter hotkey needs: ctrl+x tab before `o`, while a click needs none
  // (seq 213).
  expect(
    await ui.find({ type: "Text", text: /Quest board ready/ }),
  ).toBeDefined();
  expect(
    await ui.find({ type: "Text", text: /\(ctrl\+x tab, o\)/ }),
  ).toBeDefined();
  const open = await ui.find({ type: "Button", text: "Open" });
  expect(open).toBeDefined();
  expect(open?.props.hotkey).toBe("o");

  opens.length = 0;
  await ui.press({ key: "open-board" });
  // A press is the person asking, and the engine places an asked pane at any
  // width. `focus` is the difference the mod's open carries here and the
  // unasked open at `session.start` does not.
  expect(opens).toEqual([
    { id: "quest-board", columns: 64, rows: undefined, focus: true },
  ]);
  // The press is also what raises the redraw that takes the band down: nothing
  // else would re-run the hook, and the band would stand beneath a board it
  // just seated.
  expect(invalidates).toEqual(["ui.render"]);

  // Nothing has redrawn yet: the invalidate is answered by the test, so what
  // the band is drawn from is still the record and the band is still up. What
  // takes it down is that record saying the pane is placed, on the redraw the
  // engine would have raised -- not the press by itself.
  expect(
    await ui.find({ type: "Text", text: /Quest board ready/ }),
  ).toBeDefined();
  panes[0] = { ...BOARD_PANE };
  await ui.redraw();
  expect(
    await ui.find({ type: "Text", text: /Quest board ready/ }),
  ).toBeUndefined();
  expect(await ui.find({ type: "Text", text: "engine band" })).toBeDefined();
  await ui.unmount();
});

test("no band is drawn once the pane is placed", async ($, on) => {
  const opens: Open[] = [];
  mockBoard(on, opens);
  on("ui.render", { component: "AbovePrompt" }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e);

    return h(Box, null, h(Text, null, "engine band"));
  });
  await $.session.start({ ...START });

  const ui = await $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "AbovePrompt",
    props: BAND,
  });
  // The pane is up, so the band has nothing to offer and the drawing is the
  // engine's alone -- not a band with the text left out.
  expect(
    await ui.find({ type: "Text", text: /Quest board ready/ }),
  ).toBeUndefined();
  expect(await ui.find({ type: "Button", text: "Open" })).toBeUndefined();
  expect(await ui.find({ type: "Text", text: "engine band" })).toBeDefined();
  await ui.unmount();
});

// ------------------------------------------------------------- the alerts ---
//
// The alerts check is driven by a clock of its own, not by a press, so its
// tests mount the pane once -- which is where the check starts, since the kit
// never fires `session.start` -- change what the canned `quest` answers, and
// move the mocked clock on. They run on one surface: nothing here is drawn,
// and the pane's own surface-independence is covered above.

/** Must match ALERTS_MS in hooks/register.tsx. */
const ALERTS_MS = 120_000;

/** The store key the check keeps its last state under, as register.tsx spells it. */
const ALERTS_KEY = "opum-quest.board.alerts";

const ALERTS_NOW = Date.UTC(2026, 10, 3, 9, 0, 0);

const ALERTS_ROOT = "/repos";

const ALERT_FLEET: FsEntry[] = [
  { name: "quest-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
  { name: "lore-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
];

type CannedDecision = { id: string; title: string; status: string };
type CannedTask = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  resolution?: { kind: string };
};

type Canned = {
  /** Repository -> the decisions its tracker holds. */
  decisions: Record<string, CannedDecision[]>;
  /** Repository -> its open tasks, which is all the check's list read sees. */
  open: Record<string, CannedTask[]>;
  /** Task id -> what one `task view` answers for it. */
  views: Record<string, CannedTask>;
  /** Repositories whose every quest read fails, as an unreadable one does. */
  unreadable?: string[];
};

const noTracker = {
  value: {
    exitCode: 3,
    stdout: "",
    stderr: "no tracker here",
    isStdoutTruncated: false,
    isStderrTruncated: false,
  },
};

/** The fleet, the canned reads, and what the check said: toasts and statuses. */
function mockAlerts(on: On, canned: Canned, calls: string[][] = []) {
  const toasts: { text: string; timeoutMs?: number }[] = [];
  const statuses: (string | undefined)[] = [];
  on("fs.list", async (_$, e) => ({
    value: e.path === ALERTS_ROOT ? ALERT_FLEET : [],
  }));
  on("fs.exists", async (_$, e) => ({
    value: e.path.endsWith("/.quest/workspace.toml"),
  }));
  on("session.root", async () => ({ value: `${ALERTS_ROOT}/quest-cli` }));
  on("process.run", async (_$, e) => {
    calls.push([...e.argv]);
    if (e.argv[0] === "git") return ok("");
    const repo = (e.init?.cwd ?? "").split("/").pop() ?? "";
    if ((canned.unreadable ?? []).includes(repo)) return noTracker;
    if (e.argv[1] === "decision") {
      return ok(
        JSON.stringify({
          kind: "decision.list",
          data: canned.decisions[repo] ?? [],
        }),
      );
    }
    if (e.argv[1] === "task" && e.argv[2] === "view") {
      return ok(
        JSON.stringify({
          kind: "task.view",
          data: {
            priority: "medium",
            ...canned.views[String(e.argv[3] ?? "")],
          },
        }),
      );
    }

    return ok(
      JSON.stringify({ kind: "task.list", data: canned.open[repo] ?? [] }),
    );
  });
  on("ui.open", async () => ({ value: { isPlaced: true } }));
  on("ui.close", async () => ({ value: undefined }));
  on("ui.panes", async () => ({ value: [] }));
  on("ui.toast", async (_$, e) => {
    toasts.push({ text: e.text, timeoutMs: e.timeoutMs });

    return { value: undefined };
  });
  on("ui.status", async (_$, e) => {
    statuses.push(e.text);

    return { value: undefined };
  });

  return { toasts, statuses };
}

function mountAlertPane($: Engine) {
  return $.ui.mount({
    plugin: "opum-quest",
    surface: "terminal",
    component: "Pane",
    requestId: "quest-board",
    props: PANE,
  });
}

test("a waiting decision toasts once with the count, and resolving it toasts the count away", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Open work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts, statuses } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  expect(toasts).toEqual([]);
  expect(statuses).toEqual([]);

  canned.decisions["quest-cli"] = [
    { id: "DEC-140", title: "Ship the alerts", status: "proposed" },
  ];
  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([
    {
      text: "quest-cli DEC-140 needs a decision: Ship the alerts",
      timeoutMs: 10_000,
    },
  ]);
  expect(statuses.at(-1)).toBe("Quest: 1 decision waiting");

  // The same state is not shown a second time: the check compares against what
  // it recorded, not against the last time the person looked at the pane.
  await clock.advance(ALERTS_MS);
  expect(toasts).toHaveLength(1);

  toasts.length = 0;
  canned.decisions["quest-cli"] = [
    { id: "DEC-140", title: "Ship the alerts", status: "accepted" },
  ];
  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([
    { text: "quest-cli DEC-140 decided: accepted", timeoutMs: 6_000 },
  ]);
  expect(statuses).toEqual(["Quest: 1 decision waiting", undefined]);
  await ui.unmount();
});

test("the same decision id in two workspaces is two decisions in two toasts", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Open work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  canned.decisions["quest-cli"] = [
    { id: "DEC-3", title: "Ship the pair", status: "proposed" },
  ];
  canned.decisions["lore-cli"] = [
    { id: "DEC-3", title: "Ship the pair", status: "proposed" },
  ];
  await clock.advance(ALERTS_MS);
  // `DEC-3` is minted per workspace -- `highestSequence` reads that tracker's
  // own `planning.json` -- so these are two decisions, and the id alone cannot
  // tell the person which of them a toast is about. The order the fleet is
  // read in is not what this asserts, so the lines are compared as a set.
  expect(toasts.map((toast) => toast.text).sort()).toEqual([
    "lore-cli DEC-3 needs a decision: Ship the pair",
    "quest-cli DEC-3 needs a decision: Ship the pair",
  ]);
  expect(toasts).toHaveLength(2);
  await ui.unmount();
});

test("a pause, a close and a high-priority completion toast; a normal completion does not", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Parked work", status: "In Progress" },
        { id: "QCLI-2", title: "Retired work", status: "In Progress" },
        { id: "QCLI-3", title: "Landed work", status: "In Progress" },
        { id: "QCLI-4", title: "Ordinary work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  canned.open["quest-cli"] = [
    { id: "QCLI-1", title: "Parked work", status: "Paused" },
  ];
  canned.views["QCLI-2"] = {
    id: "QCLI-2",
    title: "Retired work",
    status: "Closed",
    resolution: { kind: "wont-do" },
  };
  canned.views["QCLI-3"] = {
    id: "QCLI-3",
    title: "Landed work",
    status: "Done",
    priority: "high",
  };
  canned.views["QCLI-4"] = {
    id: "QCLI-4",
    title: "Ordinary work",
    status: "Done",
  };
  await clock.advance(ALERTS_MS);
  // Three changes, so each is its own toast -- and the medium-priority
  // completion, which the pane draws like any other, says nothing.
  expect(toasts).toEqual([
    { text: "QCLI-1 paused in quest-cli: Parked work", timeoutMs: 8_000 },
    { text: "QCLI-2 closed (won't do) in quest-cli", timeoutMs: 6_000 },
    { text: "QCLI-3 done: Landed work", timeoutMs: 6_000 },
  ]);
  await ui.unmount();
});

test("more than three changes arrive as one batched toast, with the decisions left out of it", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Parked work", status: "In Progress" },
        { id: "QCLI-2", title: "Also parked", status: "In Progress" },
        { id: "QCLI-3", title: "Retired work", status: "In Progress" },
        { id: "QCLI-4", title: "Landed work", status: "In Progress" },
        { id: "QCLI-5", title: "More landed work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  canned.open["quest-cli"] = [
    { id: "QCLI-1", title: "Parked work", status: "Paused" },
    { id: "QCLI-2", title: "Also parked", status: "Paused" },
  ];
  canned.views["QCLI-3"] = {
    id: "QCLI-3",
    title: "Retired work",
    status: "Closed",
    resolution: { kind: "duplicate" },
  };
  canned.views["QCLI-4"] = {
    id: "QCLI-4",
    title: "Landed work",
    status: "Done",
    priority: "high",
  };
  canned.views["QCLI-5"] = {
    id: "QCLI-5",
    title: "More landed work",
    status: "Done",
    priority: "high",
  };
  canned.decisions["quest-cli"] = [
    { id: "DEC-141", title: "Answer me", status: "proposed" },
  ];
  await clock.advance(ALERTS_MS);
  // Five changes, so one line instead of five -- and the decision that became
  // proposed in the same check keeps its own toast rather than being counted
  // into that line.
  expect(toasts).toEqual([
    {
      text: "quest-cli DEC-141 needs a decision: Answer me",
      timeoutMs: 10_000,
    },
    {
      text: "5 updates: 2 done, 2 paused, 1 closed. Open the board: /quest dashboard",
      timeoutMs: 8_000,
    },
  ]);
  await ui.unmount();
});

test("the first check records a baseline and shows nothing", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {
      "quest-cli": [
        { id: "DEC-9", title: "Already waiting", status: "proposed" },
      ],
    },
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Open work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts, statuses } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  // Nothing is a change from a state the check has never seen. The count is
  // not a change notification -- it stands while a decision waits, whether or
  // not this session watched it arrive -- so it is pinned from the baseline.
  expect(toasts).toEqual([]);
  expect(statuses).toEqual(["Quest: 1 decision waiting"]);

  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([]);
  await ui.unmount();
});

test("a stored state suppresses repeats after a reload", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on, {
    [ALERTS_KEY]: {
      decisions: { "quest-cli:DEC-9": "proposed" },
      tasks: { "quest-cli": { "QCLI-1": "In Progress" } },
    },
  });
  const canned: Canned = {
    decisions: {
      "quest-cli": [
        { id: "DEC-9", title: "Already waiting", status: "proposed" },
      ],
    },
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Open work", status: "In Progress" },
      ],
    },
    views: {},
  };
  const { toasts } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  expect(toasts).toEqual([]);
  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([]);
  await ui.unmount();
});

test("what moved while no session was running arrives as one summary", async ($, on) => {
  // The clock is answered, never moved: everything this test asserts happens on
  // the first check of the session, which is the one the restart itself runs.
  mock.clock(on, { now: ALERTS_NOW });
  mock.store(on, {
    [ALERTS_KEY]: {
      decisions: { "quest-cli:DEC-9": "accepted" },
      tasks: {
        "quest-cli": {
          "QCLI-1": "In Progress",
          "QCLI-2": "In Progress",
          "QCLI-3": "In Progress",
          "QCLI-4": "In Progress",
        },
      },
    },
  });
  const canned: Canned = {
    decisions: {
      "quest-cli": [{ id: "DEC-9", title: "Now waiting", status: "proposed" }],
    },
    open: {
      "quest-cli": [{ id: "QCLI-1", title: "Parked work", status: "Paused" }],
    },
    views: {
      "QCLI-2": {
        id: "QCLI-2",
        title: "Retired work",
        status: "Closed",
        resolution: { kind: "superseded" },
      },
      "QCLI-3": {
        id: "QCLI-3",
        title: "Landed work",
        status: "Done",
        priority: "high",
      },
      "QCLI-4": {
        id: "QCLI-4",
        title: "More landed work",
        status: "Done",
        priority: "high",
      },
    },
  };
  const { toasts, statuses } = mockAlerts(on, canned);

  const ui = await mountAlertPane($);
  // The first check of the session compares against what the last session
  // stored, and four updates plus a waiting decision are one line rather than
  // five toasts.
  expect(toasts).toEqual([
    {
      text: "While you were away: 1 decision waiting, 4 updates",
      timeoutMs: 8_000,
    },
  ]);
  expect(statuses).toEqual(["Quest: 1 decision waiting"]);
  await ui.unmount();
});

test(
  "the alerts option off shows nothing",
  { options: { alerts: "off" } },
  async ($, on) => {
    const clock = mock.clock(on, { now: ALERTS_NOW });
    mock.store(on, {
      [ALERTS_KEY]: {
        decisions: { "quest-cli:DEC-9": "accepted" },
        tasks: { "quest-cli": { "QCLI-1": "In Progress" } },
      },
    });
    const canned: Canned = {
      decisions: {
        "quest-cli": [
          { id: "DEC-9", title: "Now waiting", status: "proposed" },
        ],
      },
      open: {
        "quest-cli": [{ id: "QCLI-1", title: "Parked work", status: "Paused" }],
      },
      views: {},
    };
    const { toasts, statuses } = mockAlerts(on, canned);

    const ui = await mountAlertPane($);
    expect(toasts).toEqual([]);
    expect(statuses).toEqual([]);
    await clock.advance(ALERTS_MS);
    expect(toasts).toEqual([]);
    expect(statuses).toEqual([]);
    await ui.unmount();
  },
);

test("the check runs every two minutes with the pane closed, looking a departed task up once", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Landed work", status: "In Progress" },
      ],
    },
    views: {
      "QCLI-1": {
        id: "QCLI-1",
        title: "Landed work",
        status: "Done",
        priority: "high",
      },
    },
  };
  const calls: string[][] = [];
  const { toasts } = mockAlerts(on, canned, calls);

  const ui = await mountAlertPane($);
  expect(toasts).toEqual([]);
  // The pane goes first: an alert matters most when nobody is looking at it.
  await ui.unmount();
  canned.open["quest-cli"] = [];
  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([
    { text: "QCLI-1 done: Landed work", timeoutMs: 6_000 },
  ]);
  // Done from Closed is one `task view`, and exactly one.
  expect(calls.filter((argv) => argv[2] === "view")).toHaveLength(1);
});

test("a repository that cannot be read is skipped quietly", async ($, on) => {
  const clock = mock.clock(on, { now: ALERTS_NOW });
  mock.store(on);
  const canned: Canned = {
    decisions: {},
    open: {
      "quest-cli": [
        { id: "QCLI-1", title: "Open work", status: "In Progress" },
      ],
      "lore-cli": [
        { id: "LCLI-1", title: "Retired work", status: "In Progress" },
      ],
    },
    views: {
      "LCLI-1": { id: "LCLI-1", title: "Retired work", status: "Closed" },
    },
  };
  const calls: string[][] = [];
  const { toasts } = mockAlerts(on, canned, calls);

  const ui = await mountAlertPane($);
  // lore-cli's tracker cannot be read this check, and the task it held leaves
  // the open set for that reason alone. Nothing is said about it, about the
  // task, or about the read: the repository is skipped whole.
  canned.unreadable = ["lore-cli"];
  canned.open["lore-cli"] = [];
  calls.length = 0;
  await clock.advance(ALERTS_MS);
  expect(toasts).toEqual([]);
  expect(calls.filter((argv) => argv[2] === "view")).toHaveLength(0);
  expect(calls.some((argv) => argv.includes("lore-cli"))).toBe(false);
  await ui.unmount();
});

// ------------------------------------------------------------ the wording ---
//
// The two lines QCLI-444 changed are read in a toast and in a tool result, so
// they are asserted here as strings as well as through the check that shows
// them: those tests would pass on any line the check happened to agree with.

/** An open task as the check reads, for the line tests below. */
function alertTask(id: string, status: string): AlertTask {
  return {
    repo: "quest-cli",
    id,
    title: `${id} title`,
    status,
    priority: null,
    resolution: null,
  };
}

test("the batched line points at the dashboard tool, not a retired command", () => {
  const line = batchLine({
    waiting: [],
    decided: [],
    paused: [alertTask("QCLI-1", "Paused")],
    closed: [alertTask("QCLI-2", "Closed")],
    done: [alertTask("QCLI-3", "Done")],
  });

  expect(line).toBe(
    "3 updates: 1 done, 1 paused, 1 closed. Open the board: /quest dashboard",
  );
  // The board's slash command was retired in QCLI-440, so a bare `/quest` names
  // a command the engine refuses; the tool is pointed at by the words that
  // reach it.
  expect(line.endsWith("Open the board: /quest dashboard")).toBe(true);
  expect(line).not.toMatch(/\/quest(?! dashboard)/u);
});

test("a decision toast names the repository, because the id does not", () => {
  const changes: AlertChanges = {
    waiting: [
      { repo: "quest-cli", id: "DEC-3", title: "Ship the pair" },
      { repo: "lore-cli", id: "DEC-3", title: "Ship the pair" },
    ],
    decided: [{ repo: "quest-cli", id: "DEC-4", status: "accepted" }],
    paused: [],
    closed: [],
    done: [],
  };

  const toasts = alertToasts(changes);
  expect(toasts).toEqual([
    {
      text: "quest-cli DEC-3 needs a decision: Ship the pair",
      timeoutMs: 10_000,
    },
    {
      text: "lore-cli DEC-3 needs a decision: Ship the pair",
      timeoutMs: 10_000,
    },
    { text: "quest-cli DEC-4 decided: accepted", timeoutMs: 6_000 },
  ]);
  // One id, two workspaces: the fixture is the same `DEC-3` twice, so without
  // the repository the first two lines would be the same string, and neither
  // would say which decision it is about.
  expect(changes.waiting.map((one) => one.id)).toEqual(["DEC-3", "DEC-3"]);
  expect(toasts[0]?.text).not.toBe(toasts[1]?.text);
});
