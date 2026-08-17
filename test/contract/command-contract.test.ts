import { expect, test } from "bun:test";

import {
  commandManifest,
  diagnostic,
  exitCodeFor,
  manifestResult,
  selectOutputMode,
  success,
  validateCommandManifest,
} from "../../src/application/command-contract.ts";
import {
  readQuestConfiguration,
  validateQuestConfiguration,
} from "../../src/adapters/toml-configuration.ts";

test("success envelopes have the frozen Opum wire shape", () => {
  expect(success("query.results", { tasks: [] })).toEqual({
    schemaVersion: 1,
    kind: "query.results",
    data: { tasks: [] },
    principal: null,
  });
});

test("diagnostics classify every non-success exit and retain principal", () => {
  const expectedExits = {
    uncaught: 1,
    usage: 2,
    not_found: 3,
    denied: 4,
    conflict: 5,
    validation: 6,
    drift: 6,
  } as const;
  for (const [errorType, exitCode] of Object.entries(expectedExits)) {
    const typedError = errorType as keyof typeof expectedExits;
    expect(diagnostic(typedError, "Failure.")).toEqual({
      error_type: typedError,
      message: "Failure.",
      principal: null,
    });
    expect(exitCodeFor(typedError)).toBe(exitCode);
  }
});

test("JSON wins over plain, and non-TTY output is plain", () => {
  expect(selectOutputMode({ json: true, plain: true, stdoutIsTty: true })).toBe(
    "json",
  );
  expect(selectOutputMode({ plain: true, stdoutIsTty: true })).toBe("plain");
  expect(selectOutputMode({ stdoutIsTty: false })).toBe("plain");
  expect(selectOutputMode({ stdoutIsTty: true })).toBe("pretty");
});

test("configuration is additive and rejects unsupported schemas without mutation", () => {
  expect(
    validateQuestConfiguration('schemaVersion = 1\nextra = "allowed"'),
  ).toMatchObject({
    ok: true,
    configuration: { extra: "allowed" },
  });
  expect(validateQuestConfiguration("schemaVersion = 2")).toEqual({
    ok: false,
    errorType: "drift",
    message: "Unsupported Quest configuration schema 2; expected 1.",
  });
  expect(validateQuestConfiguration('schemaVersion = "one"')).toMatchObject({
    ok: false,
    errorType: "validation",
  });
  expect(validateQuestConfiguration("not valid TOML =")).toMatchObject({
    ok: false,
    errorType: "validation",
  });
});

test("configuration reads through its read-only port without normalizing input", async () => {
  const original = 'schemaVersion = 1\nextra = "allowed"';
  let reads = 0;
  const result = await readQuestConfiguration({
    async read() {
      reads += 1;
      return original;
    },
  });
  expect(reads).toBe(1);
  expect(result).toMatchObject({
    ok: true,
    configuration: { extra: "allowed" },
  });
  expect(original).toBe('schemaVersion = 1\nextra = "allowed"');
  expect(
    await readQuestConfiguration({
      async read() {
        return undefined;
      },
    }),
  ).toBe(undefined);
});

test("the live manifest is non-empty and matches its result golden", () => {
  expect(commandManifest.commands).toEqual([
    {
      name: "manifest",
      schemaVersion: 1,
      kind: "manifest.registry",
      mutates: false,
    },
    {
      name: "version",
      schemaVersion: 1,
      kind: null,
      mutates: false,
    },
    { name: "help", schemaVersion: 1, kind: "help.commands", mutates: false },
    {
      name: "init",
      schemaVersion: 1,
      kind: "workspace.initialized",
      mutates: true,
    },
    {
      name: "instructions",
      schemaVersion: 1,
      kind: "agent.instructions",
      mutates: false,
    },
    {
      name: "agents",
      schemaVersion: 1,
      kind: "agent.instructions-status",
      mutates: true,
    },
    {
      name: "completion",
      schemaVersion: 1,
      kind: "completion.script",
      mutates: false,
    },
    {
      name: "task status-flow",
      schemaVersion: 1,
      kind: "task.status-flow",
      mutates: false,
    },
    { name: "task list", schemaVersion: 1, kind: "task.list", mutates: false },
    { name: "task view", schemaVersion: 1, kind: "task.view", mutates: false },
    { name: "search", schemaVersion: 1, kind: "task.search", mutates: false },
    {
      name: "task create",
      schemaVersion: 1,
      kind: "task.created",
      mutates: true,
    },
    {
      name: "task edit",
      schemaVersion: 1,
      kind: "task.updated",
      mutates: true,
    },
    {
      name: "task complete",
      schemaVersion: 1,
      kind: "task.completed",
      mutates: true,
    },
    {
      name: "task archive",
      schemaVersion: 1,
      kind: "task.archived",
      mutates: true,
    },
    {
      name: "task demote",
      schemaVersion: 1,
      kind: "task.demoted",
      mutates: true,
    },
    {
      name: "draft create",
      schemaVersion: 1,
      kind: "draft.created",
      mutates: true,
    },
    {
      name: "draft list",
      schemaVersion: 1,
      kind: "draft.list",
      mutates: false,
    },
    {
      name: "draft view",
      schemaVersion: 1,
      kind: "draft.view",
      mutates: false,
    },
    {
      name: "draft promote",
      schemaVersion: 1,
      kind: "draft.promoted",
      mutates: true,
    },
    {
      name: "draft archive",
      schemaVersion: 1,
      kind: "draft.archived",
      mutates: true,
    },
    {
      name: "milestone",
      schemaVersion: 1,
      kind: "milestone.records",
      mutates: true,
    },
    {
      name: "decision",
      schemaVersion: 1,
      kind: "decision.records",
      mutates: true,
    },
    {
      name: "overview",
      schemaVersion: 1,
      kind: "project.overview",
      mutates: false,
    },
    { name: "board", schemaVersion: 1, kind: "project.board", mutates: false },
    {
      name: "doctor",
      schemaVersion: 1,
      kind: "project.doctor",
      mutates: false,
    },
    {
      name: "cleanup",
      schemaVersion: 1,
      kind: "project.cleanup",
      mutates: true,
    },
  ]);
  expect(manifestResult()).toMatchObject({
    schemaVersion: 1,
    kind: "manifest.registry",
    principal: null,
  });
  expect(validateCommandManifest(commandManifest)).toBe(true);
  expect(validateCommandManifest({ ...commandManifest, commands: [] })).toBe(
    false,
  );
  expect(
    validateCommandManifest({
      ...commandManifest,
      commands: [commandManifest.commands[0], commandManifest.commands[0]],
    }),
  ).toBe(false);
  expect(
    validateCommandManifest({
      ...commandManifest,
      exitCodes: { ...commandManifest.exitCodes, conflict: 99 },
    }),
  ).toBe(false);
  expect(
    validateCommandManifest({
      ...commandManifest,
      commands: [{ ...commandManifest.commands[0], kind: "out-of-band" }],
    }),
  ).toBe(false);
  expect(
    validateCommandManifest({
      ...commandManifest,
      commands: [{ ...commandManifest.commands[0], mutates: undefined }],
    }),
  ).toBe(false);
});
