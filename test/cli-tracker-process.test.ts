import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { expect, test } from "bun:test";

const source = join(import.meta.dir, "..", "src", "cli", "main.ts");

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
      "--id",
      "T-1",
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
    expect(JSON.parse(created.stdout)).toMatchObject({
      kind: "task.created",
      data: { id: "T-1", title: "argv; safe", labels: ["one"] },
    });
    const listed = await quest(store, [
      "task",
      "list",
      "--label",
      "one",
      "--json",
    ]);
    expect(JSON.parse(listed.stdout)).toMatchObject({
      kind: "task.list",
      data: [{ id: "T-1" }],
    });
    const edited = await quest(store, [
      "task",
      "edit",
      "T-1",
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
    const denied = await quest(store, ["task", "create", "no actor", "--json"]);
    expect(denied.exitCode).toBe(4);
    expect(JSON.parse(denied.stderr)).toMatchObject({ error_type: "denied" });
  } finally {
    await rm(store, { recursive: true, force: true });
  }
});
