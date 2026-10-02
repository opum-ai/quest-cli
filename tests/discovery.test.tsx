import { expect, mock, test } from "claude-code/testing";
import type { FsEntry } from "claude-code";

import { discoverRoot, parentOf, repoNameFromGitCommonDir, reposUnder } from "../hooks/quest";

const PANE = {
  title: "Quest board",
  isFocused: true,
  bodyColumns: 64,
  placement: "dock" as const,
  scroll: { offset: 0, bodyRows: 60 },
  view: {},
};

const ok = (stdout: string) => ({
  value: { exitCode: 0, stdout, stderr: "", isStdoutTruncated: false, isStderrTruncated: false },
});

type Entry = { name: string; kind: string };

function fakeFs(tree: Record<string, Entry[]>, workspaces: string[]) {
  return {
    list: async (path = "") => tree[path] ?? [],
    exists: async (path: string) => workspaces.includes(path),
  };
}

test("a workspace is a directory holding .quest/workspace.toml", async () => {
  const fs = fakeFs(
    {
      "/repos": [
        { name: "quest-cli", kind: "dir" },
        { name: "README.md", kind: "file" },
        { name: ".hidden", kind: "dir" },
        { name: "not-a-workspace", kind: "dir" },
      ],
    },
    ["/repos/quest-cli/.quest/workspace.toml"],
  );
  expect(await reposUnder(fs, "/repos")).toEqual(["quest-cli"]);
  expect(await reposUnder(fs, "/missing")).toEqual([]);
});

test("the fleet root is the nearest ancestor that holds workspaces", async () => {
  const fs = fakeFs(
    {
      "/repos/quest-cli/.claude/worktrees": [],
      "/repos/quest-cli/.claude": [],
      "/repos/quest-cli": [],
      "/repos": [
        { name: "quest-cli", kind: "dir" },
        { name: "opum-doc", kind: "dir" },
      ],
    },
    ["/repos/quest-cli/.quest/workspace.toml", "/repos/opum-doc/.quest/workspace.toml"],
  );
  // A session in a worktree is three levels below the root it should find.
  expect(await discoverRoot(fs, "/repos/quest-cli/.claude/worktrees/QCLI-404")).toEqual({
    root: "/repos",
    repos: ["opum-doc", "quest-cli"],
  });
  expect(await discoverRoot(fs, "/tmp/alone")).toBeNull();
});

test("git's common dir names the repository a worktree belongs to", async () => {
  expect(
    repoNameFromGitCommonDir("/repos/quest-cli/.claude/worktrees/QCLI-404", "/repos/quest-cli/.git"),
  ).toBe("quest-cli");
  expect(repoNameFromGitCommonDir("/repos/quest-cli", ".git")).toBe("quest-cli");
  expect(repoNameFromGitCommonDir("/repos/quest-cli", null)).toBe("quest-cli");
  expect(repoNameFromGitCommonDir("/repos/quest-cli/", "")).toBe("quest-cli");
  expect(parentOf("/repos/quest-cli")).toBe("/repos");
  expect(parentOf("/")).toBe("/");
});

test(
  "the repos option names the board, and the session's own repository is always on it",
  { options: { repos: "ward-cli" } },
  async ($, on) => {
    mock.clock(on, { now: Date.UTC(2026, 9, 2, 4, 30, 0) });
    mock.store(on);
    const read: string[] = [];
    const listed: FsEntry[] = [
      { name: "ward-cli", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
      { name: "opum-doc", kind: "dir", size: 0, mtimeMs: 0, isLink: false },
    ];
    on("fs.list", async () => ({ value: listed }));
    on("fs.exists", async () => ({ value: true }));
    on("session.root", async () => ({ value: "/tmp/opum-cli" }));
    on("process.run", async (_$, e) => {
      if (e.argv[0] === "git") return ok("");
      const repo = (e.init?.cwd ?? "").split("/").pop() ?? "";
      if (e.argv.includes("task")) read.push(repo);
      return ok(JSON.stringify({ kind: "task.list", data: [] }));
    });

    const ui = await $.ui.mount({
      plugin: "opum-quest",
      surface: "terminal",
      component: "Pane",
      requestId: "quest-board",
      props: PANE,
    });
    await ui.press({ key: "tab-list" });
    await ui.press({ key: "refresh" });
    expect([...new Set(read)].sort()).toEqual(["opum-cli", "ward-cli"]);
    await ui.unmount();
  },
);
