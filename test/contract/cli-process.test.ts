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
    stdout: "0.2.6\n",
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
    data: { version: "0.2.6" },
  });
});

test("every help spelling resolves output modes before its optional topic", async () => {
  for (const mode of ["--json", "--plain"] as const) {
    for (const invocation of [
      ["help"],
      ["--help"],
      ["help", "task"],
      ["task", "--help"],
    ] as const) {
      const result = await runQuest([...invocation, mode], false);
      expect(result.exitCode, `${invocation.join(" ")} ${mode}`).toBe(0);
      if (mode === "--json") {
        expect(JSON.parse(result.stdout)).toMatchObject({
          kind: "help.commands",
          principal: null,
        });
      } else {
        expect(result.stdout).toContain("commands:");
        expect(result.stdout).not.toBe("help.commands\n");
      }
    }
  }

  const unknown = await runQuest(["help", "unknown-topic", "--json"], false);
  expect(unknown.exitCode).toBe(3);
  expect(JSON.parse(unknown.stderr)).toMatchObject({
    error_type: "not_found",
    message: "No help is available for unknown-topic.",
    principal: null,
  });

  const agentsJson = await runQuest(["help", "agents", "--json"], false);
  expect(agentsJson.exitCode).toBe(0);
  expect(JSON.parse(agentsJson.stdout)).toMatchObject({
    data: {
      details: {
        usage:
          "quest agents --check [--require-installed] | --update-instructions",
        check: expect.stringContaining("strict missing exits 6"),
        drift: expect.stringContaining("exit 6"),
      },
    },
  });
  const agentsPlain = await runQuest(["agents", "--help", "--plain"], false);
  expect(agentsPlain).toMatchObject({ exitCode: 0, stderr: "" });
  expect(agentsPlain.stdout).toContain("--require-installed");
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

const valueFlagCases = [
  { flag: "--status", argv: ["task", "list"] },
  { flag: "--label", argv: ["task", "list"] },
  { flag: "--description", argv: ["task", "create", "Title"] },
  { flag: "--id", argv: ["task", "create", "Title"] },
  { flag: "--port", argv: ["browser"] },
  { flag: "--task-id", argv: ["draft", "promote", "D-1"] },
  { flag: "--actor", argv: ["cleanup"] },
  { flag: "--actor-kind", argv: ["cleanup"] },
  { flag: "--accountable-human", argv: ["cleanup"] },
  { flag: "--title", argv: ["milestone", "edit", "M-1"] },
  { flag: "--context", argv: ["decision", "edit", "DEC-1"] },
  { flag: "--outcome", argv: ["decision", "edit", "DEC-1"] },
  { flag: "--task", argv: ["milestone", "create", "Milestone"] },
  { flag: "--add-task", argv: ["milestone", "edit", "M-1"] },
  { flag: "--remove-task", argv: ["milestone", "edit", "M-1"] },
  { flag: "--replace-task", argv: ["milestone", "edit", "M-1"] },
  { flag: "--doc", argv: ["task", "create", "Title"] },
  { flag: "--add-label", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-label", argv: ["task", "edit", "T-1"] },
  {
    flag: "--source",
    argv: ["migration", "backlog", "preview"],
  },
  {
    flag: "--backlog-dir",
    argv: ["migration", "backlog", "preview"],
  },
  {
    flag: "--digest",
    argv: ["migration", "backlog", "status"],
  },
] as const;

test("every value-taking flag rejects a following mode flag as a missing value", async () => {
  for (const { flag, argv } of valueFlagCases) {
    for (const mode of ["--json", "--plain"]) {
      const result = await runQuest([...argv, flag, mode], false);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message: `${flag} requires a value.`,
      });
    }
  }
});

test("every single-value flag rejects repeats with a precise usage diagnostic", async () => {
  for (const { flag, argv } of valueFlagCases.filter(
    ({ flag }) =>
      ![
        "--label",
        "--task",
        "--doc",
        "--add-label",
        "--remove-label",
        "--add-task",
        "--remove-task",
        "--replace-task",
      ].includes(flag),
  )) {
    const result = await runQuest(
      [...argv, flag, "first", flag, "second", "--json"],
      false,
    );
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "usage",
      message: `${flag} may only be provided once.`,
    });
  }
});

test("duplicate actor and boolean flags report the offending flag as usage", async () => {
  for (const [argv, flag] of [
    [
      [
        "task",
        "create",
        "Title",
        "--actor",
        "one",
        "--actor",
        "two",
        "--actor-kind",
        "human",
        "--json",
      ],
      "--actor",
    ],
    [
      ["draft", "list", "--include-archived", "--include-archived", "--json"],
      "--include-archived",
    ],
  ] as const) {
    const result = await runQuest(argv, false);
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "usage",
      message: `${flag} may only be provided once.`,
    });
  }
});
