import type { TrackerManifest, TrackerTask } from "./index.ts";

export const trackerConformanceFixtureVersion = 1 as const;

export const trackerManifestFixture: TrackerManifest = {
  commands: [
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
  ],
};

export const trackerTaskFixture: TrackerTask = {
  id: "T-1",
  title: "Conformance task",
  status: "To Do",
  labels: ["doc:story"],
  summary: "Public tracker record",
  description: "A public conformance fixture.",
  acceptanceCriteria: ["round-trip"],
  definitionOfDone: [],
  plan: [],
  implementationNotes: [],
  comments: [],
  documentation: ["docs/stories/example.md"],
  dependencies: [],
};

/** Public records only; consumers need no Quest implementation files to run these cases. */
export const trackerConformanceFixtures = {
  version: trackerConformanceFixtureVersion,
  versionOutput: "0.1.0\n",
  manifest: {
    schemaVersion: 1,
    kind: "manifest.registry",
    data: trackerManifestFixture,
  },
  statusFlow: {
    schemaVersion: 1,
    kind: "task.status-flow",
    data: {
      statuses: ["To Do", "In Progress", "Done"],
      terminalStatuses: ["Done"],
    },
  },
  list: { schemaVersion: 1, kind: "task.list", data: [trackerTaskFixture] },
  view: { schemaVersion: 1, kind: "task.view", data: trackerTaskFixture },
  search: { schemaVersion: 1, kind: "task.search", data: [trackerTaskFixture] },
  created: { schemaVersion: 1, kind: "task.created", data: trackerTaskFixture },
  updated: { schemaVersion: 1, kind: "task.updated", data: trackerTaskFixture },
  outcomes: ["not_found", "denied", "conflict", "validation", "drift"] as const,
} as const;
