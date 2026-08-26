import { expect, test } from "bun:test";
import { join } from "node:path";

import {
  ADAPTER_REQUIRED_MANIFEST_COMMANDS,
  QUEST_ADAPTER_PINNED_VERSION,
  TRACKER_CONTRACT_VERSION,
} from "../../../src/contract/tracker/index.ts";

const source = join(import.meta.dir, "..", "..", "..", "src", "cli", "main.ts");

async function quest(argv: readonly string[]) {
  const child = Bun.spawn(["bun", source, ...argv], {
    cwd: "/tmp",
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

test("the adapter boundary pins the exact authorized Quest package version", () => {
  expect(QUEST_ADAPTER_PINNED_VERSION).toBe("0.2.7");
});

test("the live binary reports the pinned version through public discovery", async () => {
  const version = await quest(["--version"]);
  expect(version).toMatchObject({ exitCode: 0, stderr: "" });
  expect(version.stdout).toBe(`${QUEST_ADAPTER_PINNED_VERSION}\n`);
});

test("the live manifest registry satisfies the adapter boundary descriptors", async () => {
  const manifest = await quest(["manifest", "--json"]);
  expect(manifest.exitCode).toBe(0);
  const envelope = JSON.parse(manifest.stdout);
  expect(envelope).toMatchObject({
    schemaVersion: TRACKER_CONTRACT_VERSION,
    kind: "manifest.registry",
    principal: null,
  });

  const live = new Map(
    envelope.data.commands.map((entry: Record<string, unknown>) => [
      entry.name,
      entry,
    ]),
  );
  for (const required of ADAPTER_REQUIRED_MANIFEST_COMMANDS) {
    const entry = live.get(required.name);
    expect(entry, required.name).toBeDefined();
    expect(entry).toMatchObject({
      schemaVersion: TRACKER_CONTRACT_VERSION,
      kind: required.kind,
      mutates: required.mutates,
    });
  }
});
