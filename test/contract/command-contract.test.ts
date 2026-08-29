import { expect, test } from "bun:test";
import {
  readQuestConfiguration,
  validateQuestConfiguration,
} from "../../src/adapters/toml-configuration.ts";
import {
  commandManifest,
  diagnostic,
  exitCodeFor,
  manifestResult,
  selectOutputMode,
  success,
  validateCommandManifest,
} from "../../src/application/command-contract.ts";

test("success envelopes have the frozen Opum wire shape", () => {
  const envelope = success("query.results", { tasks: [] });
  expect(envelope).toEqual({
    schemaVersion: 1,
    kind: "query.results",
    data: { tasks: [] },
    principal: null,
  });
  expect(Object.keys(envelope).at(-1)).toBe("principal");
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
    const envelope = diagnostic(typedError, "Failure.");
    expect(envelope).toEqual({
      error_type: typedError,
      message: "Failure.",
      principal: null,
    });
    expect(Object.keys(envelope).at(-1), typedError).toBe("principal");
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
      name: "migration backlog preview",
      schemaVersion: 1,
      kind: "migration.backlog-preview",
      mutates: false,
      fields: ["digest", "mappings", "requiresApproval", "sourceFingerprint"],
    },
    {
      name: "migration backlog apply",
      schemaVersion: 1,
      kind: "migration.backlog-applied",
      mutates: true,
      fields: ["digest"],
    },
    {
      name: "migration backlog status",
      schemaVersion: 1,
      kind: "migration.backlog-status",
      mutates: false,
      fields: ["digest"],
    },
    {
      name: "migration backlog rollback",
      schemaVersion: 1,
      kind: "migration.backlog-rolled-back",
      mutates: true,
      fields: ["digest"],
    },
    {
      name: "task status-flow",
      schemaVersion: 1,
      kind: "task.status-flow",
      mutates: false,
      fields: ["statuses", "terminalStatuses"],
    },
    {
      name: "task binding",
      schemaVersion: 1,
      kind: "task.binding",
      mutates: false,
      fields: [
        "baseRef",
        "contract",
        "expiresAt",
        "holder",
        "issuedAt",
        "relationshipId",
        "relationshipKind",
        "relationshipState",
        "repositoryId",
        "requestId",
        "selectedVersion",
        "settlementRef",
        "taskId",
        "taskState",
      ],
    },
    {
      name: "task list",
      schemaVersion: 1,
      kind: "task.list",
      mutates: false,
      filters: [
        "assignee",
        "exclude-status",
        "label",
        "limit",
        "milestone",
        "parent",
        "priority",
        "ready",
        "search",
        "sort",
        "status",
        "type",
        "unassigned",
      ],
      fields: [
        "assignees",
        "createdAt",
        "id",
        "labels",
        "ordinal",
        "priority",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "task view",
      schemaVersion: 1,
      kind: "task.view",
      mutates: false,
      fields: [
        "acceptanceCriteria",
        "aliases",
        "assignees",
        "comments",
        "createdAt",
        "definitionOfDone",
        "dependencies",
        "description",
        "documentation",
        "finalSummary",
        "id",
        "implementationNotes",
        "labels",
        "milestoneId",
        "modifiedFiles",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "references",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "search",
      schemaVersion: 1,
      kind: "task.search",
      mutates: false,
      filters: ["query"],
      fields: [
        "assignees",
        "createdAt",
        "id",
        "labels",
        "ordinal",
        "priority",
        "status",
        "summary",
        "title",
        "type",
        "updatedAt",
      ],
    },
    {
      name: "search --all",
      schemaVersion: 1,
      kind: "search.results",
      mutates: false,
      filters: ["query"],
    },
    {
      name: "task create",
      schemaVersion: 1,
      kind: "task.created",
      mutates: true,
      fields: [
        "acceptanceCriteria",
        "aliases",
        "assignees",
        "comments",
        "definitionOfDone",
        "description",
        "documentation",
        "finalSummary",
        "implementationNotes",
        "labels",
        "milestoneId",
        "modifiedFiles",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "references",
        "summary",
        "title",
        "type",
      ],
    },
    {
      name: "task edit",
      schemaVersion: 1,
      kind: "task.updated",
      mutates: true,
      fields: [
        "acceptanceCriteria",
        "addAssignees",
        "addComments",
        "addDependencies",
        "addLabels",
        "addModifiedFiles",
        "addNotes",
        "addPlan",
        "addReferences",
        "checkAcceptanceCriteria",
        "checkDefinitionOfDone",
        "clearAcceptanceCriteria",
        "clearDefinitionOfDone",
        "clearMilestone",
        "clearParent",
        "comments",
        "definitionOfDone",
        "description",
        "documentation",
        "implementationNotes",
        "labels",
        "milestoneId",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "removeAcceptanceCriteria",
        "removeAssignees",
        "removeComments",
        "removeDefinitionOfDone",
        "removeDependencies",
        "removeLabels",
        "removeModifiedFiles",
        "removeNotes",
        "removePlan",
        "removeReferences",
        "status",
        "summary",
        "title",
        "type",
        "uncheckAcceptanceCriteria",
        "uncheckDefinitionOfDone",
      ],
    },
    {
      name: "task edit-batch",
      schemaVersion: 1,
      kind: "task.batch-updated",
      mutates: true,
      fields: [
        "acceptanceCriteria",
        "addAssignees",
        "addComments",
        "addDependencies",
        "addLabels",
        "addModifiedFiles",
        "addNotes",
        "addPlan",
        "addReferences",
        "checkAcceptanceCriteria",
        "checkDefinitionOfDone",
        "clearAcceptanceCriteria",
        "clearDefinitionOfDone",
        "clearMilestone",
        "clearParent",
        "comments",
        "definitionOfDone",
        "description",
        "documentation",
        "implementationNotes",
        "labels",
        "milestoneId",
        "ordinal",
        "parentId",
        "plan",
        "priority",
        "removeAcceptanceCriteria",
        "removeAssignees",
        "removeComments",
        "removeDefinitionOfDone",
        "removeDependencies",
        "removeLabels",
        "removeModifiedFiles",
        "removeNotes",
        "removePlan",
        "removeReferences",
        "status",
        "summary",
        "title",
        "type",
        "uncheckAcceptanceCriteria",
        "uncheckDefinitionOfDone",
      ],
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
      fields: ["description", "documentation", "labels", "title"],
    },
    {
      name: "draft list",
      schemaVersion: 1,
      kind: "draft.list",
      mutates: false,
      filters: ["include-archived"],
    },
    {
      name: "draft view",
      schemaVersion: 1,
      kind: "draft.view",
      mutates: false,
      fields: ["description", "documentation", "labels", "title"],
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
      name: "milestone list",
      schemaVersion: 1,
      kind: "milestone.list",
      mutates: false,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone view",
      schemaVersion: 1,
      kind: "milestone.view",
      mutates: false,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone create",
      schemaVersion: 1,
      kind: "milestone.created",
      mutates: true,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone edit",
      schemaVersion: 1,
      kind: "milestone.updated",
      mutates: true,
      fields: ["description", "status", "taskIds", "title"],
    },
    {
      name: "milestone delete",
      schemaVersion: 1,
      kind: "milestone.deleted",
      mutates: true,
    },
    {
      name: "decision list",
      schemaVersion: 1,
      kind: "decision.list",
      mutates: false,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision view",
      schemaVersion: 1,
      kind: "decision.view",
      mutates: false,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision create",
      schemaVersion: 1,
      kind: "decision.created",
      mutates: true,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision edit",
      schemaVersion: 1,
      kind: "decision.updated",
      mutates: true,
      fields: ["context", "outcome", "status", "title"],
    },
    {
      name: "decision delete",
      schemaVersion: 1,
      kind: "decision.deleted",
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
    {
      name: "browser",
      schemaVersion: 1,
      kind: "browser.started",
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

test("manifest conformance rejects unknown, missing, and drifted command entries", () => {
  const withUnknown = {
    ...commandManifest,
    commands: [
      ...commandManifest.commands,
      {
        name: "task export",
        schemaVersion: 1,
        kind: "task.exported",
        mutates: false,
      },
    ],
  };
  expect(validateCommandManifest(withUnknown)).toBe(false);
  const withoutBrowser = {
    ...commandManifest,
    commands: commandManifest.commands.filter(
      (entry) => entry.name !== "browser",
    ),
  };
  expect(validateCommandManifest(withoutBrowser)).toBe(false);
  const flippedMutates = {
    ...commandManifest,
    commands: commandManifest.commands.map((entry) =>
      entry.name === "task create" ? { ...entry, mutates: false } : entry,
    ),
  };
  expect(validateCommandManifest(flippedMutates)).toBe(false);
  const driftedKind = {
    ...commandManifest,
    commands: commandManifest.commands.map((entry) =>
      entry.name === "task edit"
        ? { ...entry, kind: "task.edited" as `${string}.${string}` }
        : entry,
    ),
  };
  expect(validateCommandManifest(driftedKind)).toBe(false);
  const badFields = {
    ...commandManifest,
    commands: commandManifest.commands.map((entry) =>
      entry.name === "task view" ? { ...entry, fields: "nope" } : entry,
    ),
  };
  expect(validateCommandManifest(badFields)).toBe(false);
  const duplicateFields = {
    ...commandManifest,
    commands: commandManifest.commands.map((entry) =>
      entry.name === "task view"
        ? { ...entry, fields: ["id", "id"] as readonly string[] }
        : entry,
    ),
  };
  expect(validateCommandManifest(duplicateFields)).toBe(false);
  const omittedFields = {
    ...commandManifest,
    commands: commandManifest.commands.map((entry) =>
      entry.name === "task view"
        ? {
            name: entry.name,
            schemaVersion: 1,
            kind: entry.kind,
            mutates: entry.mutates,
          }
        : entry,
    ),
  };
  expect(validateCommandManifest(omittedFields)).toBe(false);
});

test("migration capabilities advertise exact kinds and mutability", () => {
  const byName = new Map(commandManifest.commands.map((e) => [e.name, e]));
  expect(byName.get("migration backlog preview")).toMatchObject({
    kind: "migration.backlog-preview",
    mutates: false,
  });
  expect(byName.get("migration backlog apply")).toMatchObject({
    kind: "migration.backlog-applied",
    mutates: true,
  });
  expect(byName.get("migration backlog status")).toMatchObject({
    kind: "migration.backlog-status",
    mutates: false,
  });
  expect(byName.get("migration backlog rollback")).toMatchObject({
    kind: "migration.backlog-rolled-back",
    mutates: true,
  });
  const kinds = commandManifest.commands.flatMap((entry) =>
    entry.kind === null ? [] : [entry.kind],
  );
  for (const kind of kinds)
    expect(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(kind)).toBe(true);
  expect(new Set(kinds).size).toBe(kinds.length);
  expect(validateCommandManifest(commandManifest)).toBe(true);
});
