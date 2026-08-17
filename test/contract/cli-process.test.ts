import { expect, test } from "bun:test";

import { runQuest } from "../../src/cli/main.ts";

test("the executable keeps successful JSON on stdout and diagnostics on stderr", async () => {
  const success = await runQuest(["manifest", "--json"], false);
  expect(success.exitCode).toBe(0);
  expect(JSON.parse(success.stdout)).toMatchObject({
    schemaVersion: 1,
    kind: "manifest.registry",
    principal: null,
  });
  expect(success.stderr).toBe("");

  const failure = await runQuest(["unknown"], false);
  expect(failure.exitCode).toBe(2);
  expect(failure.stdout).toBe("");
  expect(JSON.parse(failure.stderr)).toEqual({
    error_type: "usage",
    message: "Unknown or missing Quest command.",
    principal: null,
  });
});

test("version is bare semver and JSON takes precedence over plain", async () => {
  expect(await runQuest(["--version"], false)).toEqual({
    stdout: "0.2.1\n",
    stderr: "",
    exitCode: 0,
  });
  expect(
    (await runQuest(["manifest", "--json", "--plain"], true)).stdout,
  ).toContain('"schemaVersion":1');
});

test("help, instructions, and completion expose the versioned public discovery surface", async () => {
  for (const command of [
    ["--help", "--json"],
    ["instructions", "--json"],
    ["completion", "bash", "--json"],
  ]) {
    const result = await runQuest(command, false);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ schemaVersion: 1 });
  }
  expect(
    JSON.parse((await runQuest(["instructions", "--json"], false)).stdout),
  ).toMatchObject({
    kind: "agent.instructions",
    data: { version: "0.2.1" },
  });
});

test("human output renders payload fields while JSON remains byte-identical", async () => {
  const json = await runQuest(["manifest", "--json"], false);
  expect(json.stdout).toBe(`${JSON.stringify(JSON.parse(json.stdout))}\n`);

  const plain = await runQuest(["manifest", "--plain"], false);
  expect(plain.stdout).toContain("commands:");
  expect(plain.stdout).not.toBe("manifest.registry\n");

  for (const invocation of [[], ["help"]] as const) {
    const result = await runQuest(invocation, false);
    expect(result.stdout).toContain("commands:");
    expect(result.stdout).toContain("name: help");
  }
});

test("pretty output is readable without ANSI escapes when color is disabled", async () => {
  const result = await runQuest(["manifest"], true);
  expect(result.stdout).toContain("commands:");
  expect(result.stdout.includes(String.fromCharCode(27))).toBe(false);
});

test("migration smoke exercises the compiled migration path and rejects flags", async () => {
  const success = await runQuest(["migration-smoke", "--json"], false);
  expect(success.exitCode).toBe(0);
  expect(JSON.parse(success.stdout)).toMatchObject({
    schemaVersion: 1,
    kind: "migration.smoke",
    data: { removed: 1 },
  });
  const failure = await runQuest(["migration-smoke", "--unexpected"], false);
  expect(failure.exitCode).toBe(2);
  expect(JSON.parse(failure.stderr)).toMatchObject({ error_type: "usage" });
});
