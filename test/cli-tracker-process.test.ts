import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

const source = join(import.meta.dir, "..", "src", "cli", "main.ts");
const conformance = join(
  import.meta.dir,
  "..",
  "fixtures",
  "tracker",
  "v1",
  "conformance.mjs",
);

async function quest(store: string, argv: readonly string[]) {
  const child = Bun.spawn(["bun", source, ...argv], {
    cwd: store,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...Bun.env, QUEST_TASK_STORE: store },
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

test("the installed executable routes persistent tracker reads and writes as JSON subprocess records", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-tracker-"));
  try {
    expect(await quest(store, ["--version"])).toMatchObject({
      exitCode: 0,
      stdout: "0.1.0\n",
      stderr: "",
    });
    const manifest = await quest(store, ["manifest", "--json"]);
    expect(JSON.parse(manifest.stdout).data.commands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "task create", mutates: true }),
      ]),
    );
    const created = await quest(store, [
      "task",
      "create",
      "argv; safe",
      "--label",
      "one",
      "--doc",
      "docs/example.md",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(created.exitCode).toBe(0);
    const createdTask = JSON.parse(created.stdout).data;
    expect(createdTask).toMatchObject({
      title: "argv; safe",
      labels: ["one"],
    });
    expect(createdTask.id).toMatch(/^T-[1-9][0-9]*$/);
    const listed = await quest(store, [
      "task",
      "list",
      "--label",
      "one",
      "--json",
    ]);
    expect(JSON.parse(listed.stdout)).toMatchObject({
      kind: "task.list",
      data: [{ id: createdTask.id }],
    });
    const edited = await quest(store, [
      "task",
      "edit",
      createdTask.id,
      "--add-label",
      "two",
      "--actor",
      "agent-1",
      "--actor-kind",
      "delegated-agent",
      "--accountable-human",
      "person-1",
      "--json",
    ]);
    expect(JSON.parse(edited.stdout)).toMatchObject({
      kind: "task.updated",
      data: { labels: ["one", "two"] },
    });
    const dashValue = await quest(store, [
      "task",
      "create",
      "dash value",
      "--description",
      "--starts-with-dashes",
      "--actor",
      "person-1",
      "--actor-kind",
      "human",
      "--json",
    ]);
    expect(JSON.parse(dashValue.stdout)).toMatchObject({
      kind: "task.created",
      data: { description: "--starts-with-dashes" },
    });
    const denied = await quest(store, ["task", "create", "no actor", "--json"]);
    expect(denied.exitCode).toBe(4);
    expect(JSON.parse(denied.stderr)).toMatchObject({ error_type: "denied" });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});

test("the versioned fixture runs without importing Quest source", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-conformance-"));
  try {
    const child = Bun.spawn(["bun", conformance], {
      cwd: store,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...Bun.env,
        QUEST_TASK_STORE: store,
        QUEST_EXECUTABLE: "bun",
        QUEST_EXECUTABLE_ARGS: JSON.stringify([source]),
      },
    });
    expect(await child.exited).toBe(0);
    expect(await new Response(child.stdout).text()).toContain(
      "Tracker conformance fixture v1 passed.",
    );
    expect(await new Response(child.stderr).text()).toBe("");
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});
