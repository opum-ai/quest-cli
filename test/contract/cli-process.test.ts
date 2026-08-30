import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { commandHelp } from "../../src/application/command-help.ts";
import { runQuest } from "../../src/cli/main.ts";
import { QUEST_VERSION } from "../../src/application/version.ts";

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
  const expected = {
    stdout: `${QUEST_VERSION}\n`,
    stderr: "",
    exitCode: 0,
  };
  expect(await runQuest(["--version"], false)).toEqual(expected);
  expect(await runQuest(["version"], false)).toEqual(expected);
  expect(
    (await runQuest(["manifest", "--json", "--plain"], true)).stdout,
  ).toContain('"schemaVersion":1');
});

test("output modes are resolved before grouped and single-word command dispatch", async () => {
  for (const mode of ["--json", "--plain"] as const) {
    const grouped = await runQuest(["completion", "bash", mode], false);
    for (const invocation of [
      [mode, "completion", "bash"],
      ["completion", mode, "bash"],
      ["completion", "bash", mode],
    ]) {
      expect(await runQuest(invocation, false)).toEqual(grouped);
    }

    const singleWord = await runQuest(["manifest", mode], false);
    for (const invocation of [
      [mode, "manifest"],
      ["manifest", mode],
    ]) {
      expect(await runQuest(invocation, false)).toEqual(singleWord);
    }
  }
});

test("globally separated mixed output modes retain JSON precedence", async () => {
  const expected = await runQuest(
    ["completion", "bash", "--plain", "--json"],
    true,
  );
  expect(
    await runQuest(["--plain", "completion", "--json", "bash"], true),
  ).toEqual(expected);
  expect(JSON.parse(expected.stdout)).toMatchObject({
    kind: "completion.script",
  });
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
    data: { version: QUEST_VERSION },
  });
});

test("every help spelling resolves output modes before its optional topic", async () => {
  for (const mode of ["--json", "--plain"] as const) {
    for (const invocation of [
      ["help"],
      ["--help"],
      ["-h"],
      ["help", "task"],
      ["task", "--help"],
      ["task", "-h"],
      ["help", "task edit"],
      ["task", "edit", "--help"],
      ["task", "edit", "-h"],
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

  // A two-word subcommand's --help/-h must resolve that exact command, not
  // fall through to executing it (the flag lands past the argv positions the
  // detector used to check).
  for (const invocation of [
    ["task", "edit", "--help", "--json"],
    ["task", "edit", "-h", "--json"],
    ["help", "task edit", "--json"],
  ] as const) {
    const result = await runQuest(invocation, false);
    expect(result.exitCode, invocation.join(" ")).toBe(0);
    expect(JSON.parse(result.stdout).data.commands).toEqual([
      expect.objectContaining({ name: "task edit" }),
    ]);
  }

  const agentsJson = await runQuest(["help", "agents", "--json"], false);
  expect(agentsJson.exitCode).toBe(0);
  expect(JSON.parse(agentsJson.stdout)).toMatchObject({
    data: {
      details: {
        valueSyntax: expect.stringContaining("--flag=<value>"),
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
  expect(agentsPlain.stdout).toContain("--flag=<value>");
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

test("quest help prints human-readable summary and usage prose, and manifest stays unchanged", async () => {
  const helpPlain = await runQuest(["help", "--plain"], false);
  expect(helpPlain.stdout).toContain(
    "summary: Initialize a Quest workspace in the current Git worktree.",
  );
  expect(helpPlain.stdout).toContain(
    'usage: quest init [--name "My Project"] [--task-id-prefix ABC] [--agent-instructions]',
  );
  expect(helpPlain.stdout).toContain("summary: Create a task.");

  const helpJson = JSON.parse(
    (await runQuest(["help", "init", "--json"], false)).stdout,
  );
  expect(helpJson.data.commands).toEqual([
    expect.objectContaining({
      name: "init",
      kind: "workspace.initialized",
      mutates: true,
      usage:
        'quest init [--name "My Project"] [--task-id-prefix ABC] [--agent-instructions]',
      flags: ["--name", "--task-id-prefix", "--agent-instructions"],
    }),
  ]);

  const manifestJson = JSON.parse(
    (await runQuest(["manifest", "--json"], false)).stdout,
  );
  const manifestInit = manifestJson.data.commands.find(
    (entry: { name: string }) => entry.name === "init",
  );
  expect(manifestInit).toEqual({
    name: "init",
    schemaVersion: 1,
    kind: "workspace.initialized",
    mutates: true,
  });
  expect(manifestInit.summary).toBeUndefined();
  expect(manifestInit.usage).toBeUndefined();
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

test("an unrecognized --actor-kind value names itself, not a missing flag", async () => {
  const result = await runQuest(
    [
      "task",
      "create",
      "Title",
      "--actor",
      "a1",
      "--actor-kind",
      "agent",
      "--json",
    ],
    false,
  );
  expect(result.exitCode).toBe(2);
  expect(JSON.parse(result.stderr)).toMatchObject({
    error_type: "usage",
    message:
      '--actor-kind "agent" is not a valid actor kind. Use "human" or "delegated-agent".',
    principal: null,
  });
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
  { flag: "--summary", argv: ["task", "create", "Title"] },
  { flag: "--comments", argv: ["task", "create", "Title"] },
  { flag: "--labels", argv: ["task", "edit", "T-1"] },
  { flag: "--add-comment", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-comment", argv: ["task", "edit", "T-1"] },
  { flag: "--add-label", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-label", argv: ["task", "edit", "T-1"] },
  { flag: "--priority", argv: ["task", "create", "Title"] },
  { flag: "--type", argv: ["task", "create", "Title"] },
  { flag: "--ordinal", argv: ["task", "create", "Title"] },
  { flag: "--alias", argv: ["task", "create", "Title"] },
  { flag: "--acceptance-criteria", argv: ["task", "create", "Title"] },
  { flag: "--definition-of-done", argv: ["task", "create", "Title"] },
  { flag: "--plan", argv: ["task", "create", "Title"] },
  { flag: "--implementation-notes", argv: ["task", "create", "Title"] },
  { flag: "--assignee", argv: ["task", "create", "Title"] },
  { flag: "--reference", argv: ["task", "create", "Title"] },
  { flag: "--modified-file", argv: ["task", "create", "Title"] },
  { flag: "--dependency", argv: ["task", "create", "Title"] },
  { flag: "--parent", argv: ["task", "create", "Title"] },
  { flag: "--milestone", argv: ["task", "create", "Title"] },
  { flag: "--final-summary", argv: ["task", "create", "Title"] },
  { flag: "--notes", argv: ["task", "edit", "T-1"] },
  { flag: "--add-plan", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-plan", argv: ["task", "edit", "T-1"] },
  { flag: "--add-note", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-note", argv: ["task", "edit", "T-1"] },
  { flag: "--comments", argv: ["task", "edit", "T-1"] },
  { flag: "--add-dependency", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-dependency", argv: ["task", "edit", "T-1"] },
  { flag: "--add-assignee", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-assignee", argv: ["task", "edit", "T-1"] },
  { flag: "--add-reference", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-reference", argv: ["task", "edit", "T-1"] },
  { flag: "--add-modified-file", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-modified-file", argv: ["task", "edit", "T-1"] },
  { flag: "--check-ac", argv: ["task", "edit", "T-1"] },
  { flag: "--uncheck-ac", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-ac", argv: ["task", "edit", "T-1"] },
  { flag: "--check-dod", argv: ["task", "edit", "T-1"] },
  { flag: "--uncheck-dod", argv: ["task", "edit", "T-1"] },
  { flag: "--remove-dod", argv: ["task", "edit", "T-1"] },
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

const freeTextSingleValueFlags = [
  { flag: "--description", argv: ["task", "create", "Title"] },
  { flag: "--title", argv: ["milestone", "edit", "M-1"] },
  { flag: "--context", argv: ["decision", "edit", "DEC-1"] },
  { flag: "--outcome", argv: ["decision", "edit", "DEC-1"] },
] as const;

function missingValueMessage(flag: string): string {
  return `${flag} requires a value; use ${flag}=<value> if the value begins with --.`;
}

test("every value-taking flag rejects a following mode flag as a missing value", async () => {
  for (const { flag, argv } of valueFlagCases) {
    for (const mode of ["--json", "--plain"]) {
      const result = await runQuest([...argv, flag, mode], false);
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message: missingValueMessage(flag),
      });
    }
  }
});

test("free-text flags retain the first-equals inline value form before duplicate validation", async () => {
  for (const { flag, argv } of freeTextSingleValueFlags) {
    const result = await runQuest(
      [...argv, `${flag}=--literal=preserved`, flag, "second"],
      false,
    );
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "usage",
      message: `${flag} may only be provided once.`,
    });
  }
});

test("free-text flags keep raw missing and flag-shaped values invalid", async () => {
  for (const { flag, argv } of freeTextSingleValueFlags) {
    for (const value of [undefined, "--not-a-value"]) {
      const result = await runQuest(
        value === undefined ? [...argv, flag] : [...argv, flag, value],
        false,
      );
      expect(result).toMatchObject({ exitCode: 2, stdout: "" });
      expect(JSON.parse(result.stderr)).toMatchObject({
        error_type: "usage",
        message: missingValueMessage(flag),
      });
    }
  }
});

test("output modes and boolean flags reject attached values", async () => {
  for (const [argv, flag] of [
    [["manifest", "--json=unexpected"], "--json"],
    [["manifest", "--plain=unexpected"], "--plain"],
    [["cleanup", "--dry-run=unexpected"], "--dry-run"],
  ] as const) {
    const result = await runQuest(argv, false);
    expect(result).toMatchObject({ exitCode: 2, stdout: "" });
    expect(JSON.parse(result.stderr)).toMatchObject({
      error_type: "usage",
      message: `${flag} does not take a value.`,
    });
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
        "--alias",
        "--assignee",
        "--reference",
        "--modified-file",
        "--dependency",
        "--add-plan",
        "--remove-plan",
        "--add-note",
        "--remove-note",
        "--add-comment",
        "--remove-comment",
        "--add-dependency",
        "--remove-dependency",
        "--add-assignee",
        "--remove-assignee",
        "--add-reference",
        "--remove-reference",
        "--add-modified-file",
        "--remove-modified-file",
        "--check-ac",
        "--uncheck-ac",
        "--remove-ac",
        "--check-dod",
        "--uncheck-dod",
        "--remove-dod",
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

test("every flag `task edit` documents is a flag `task edit` accepts", async () => {
  // The published help list and the parser's allowlist are hand-synced. This
  // binds them: a flag documented but not allowed (or renamed on one side
  // only) is rejected here as an invalid argument.
  // Derived, not copied. A hand-kept list here goes stale silently: a boolean
  // flag missing from it gets probed as `--flag=1`, which the parser rejects
  // for taking a value before `only()` is ever consulted, so the guard passes
  // without testing anything.
  const source = readFileSync(
    new URL("../../src/cli/main.ts", import.meta.url),
    "utf8",
  );
  const declaration = source.slice(
    source.indexOf("const booleanFlags = new Set(["),
  );
  const booleanFlags = new Set(
    [
      ...declaration
        .slice(0, declaration.indexOf("]"))
        .matchAll(/"(--[a-z-]+)"/g),
    ].map((match) => match[1]),
  );
  expect(booleanFlags.size).toBeGreaterThan(5);
  const rejected = "task edit received invalid arguments.";
  for (const flag of commandHelp["task edit"]?.flags ?? []) {
    const argv = booleanFlags.has(flag) ? [flag] : [`${flag}=1`];
    const result = await runQuest(["task", "edit", "T-1", ...argv], false);
    expect({
      flag,
      message: (JSON.parse(result.stderr) as { message?: string }).message,
    }).not.toEqual({ flag, message: rejected });
  }

  const unknown = await runQuest(
    ["task", "edit", "T-1", "--not-a-flag=1"],
    false,
  );
  expect(JSON.parse(unknown.stderr)).toMatchObject({
    error_type: "usage",
    message: rejected,
  });
});
