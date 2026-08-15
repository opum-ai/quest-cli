import { expect, test } from "bun:test";

import { runQuest } from "../../src/cli/main.ts";

test("the executable keeps successful JSON on stdout and diagnostics on stderr", () => {
  const success = runQuest(["manifest", "--json"], false);
  expect(success.exitCode).toBe(0);
  expect(JSON.parse(success.stdout)).toMatchObject({
    schemaVersion: 1,
    kind: "manifest.registry",
    principal: null,
  });
  expect(success.stderr).toBe("");

  const failure = runQuest(["unknown"], false);
  expect(failure.exitCode).toBe(2);
  expect(failure.stdout).toBe("");
  expect(JSON.parse(failure.stderr)).toEqual({
    error_type: "usage",
    message: "Unknown or missing Quest command.",
    principal: null,
  });
});

test("version is bare semver and JSON takes precedence over plain", () => {
  expect(runQuest(["--version"], false)).toEqual({
    stdout: "0.0.0-development\n",
    stderr: "",
    exitCode: 0,
  });
  expect(runQuest(["manifest", "--json", "--plain"], true).stdout).toContain(
    '"schemaVersion":1',
  );
});
