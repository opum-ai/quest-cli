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
import { validateQuestConfiguration } from "../../src/adapters/toml-configuration.ts";

test("success envelopes have the frozen Opum wire shape", () => {
  expect(success("query.results", { tasks: [] })).toEqual({
    schemaVersion: 1,
    kind: "query.results",
    data: { tasks: [] },
    principal: null,
  });
});

test("diagnostics classify every non-success exit and retain principal", () => {
  expect(diagnostic("not_found", "Missing.")).toEqual({
    error_type: "not_found",
    message: "Missing.",
    principal: null,
  });
  expect(exitCodeFor("not_found")).toBe(3);
  expect(exitCodeFor("drift")).toBe(6);
  expect(exitCodeFor("uncaught")).toBe(1);
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
