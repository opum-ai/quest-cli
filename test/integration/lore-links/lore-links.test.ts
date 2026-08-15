import { expect, test } from "bun:test";

import {
  type LoreConceptIdentity,
  type LoreLinkStore,
  type LoreProjection,
  linkLoreConcept,
} from "../../../src/application/lore-links/lore-links.ts";
import { createTask } from "../../../src/domain/tasks/tasks.ts";

const concept: LoreConceptIdentity = {
  conceptId: "adr/optional-lore",
  sourceRepository: "sha256:repository",
  revision: "a".repeat(40),
  path: "docs/adr/optional-lore.md",
  schemaVersion: "1.0",
  contentProvenance: "sha256:content",
};

function projection(overrides: Partial<LoreProjection> = {}): LoreProjection {
  return {
    schemaVersion: 1,
    kind: "projection.export",
    data: {
      projectionSchemaVersion: "1.0",
      records: [
        {
          record: "manifest",
          schemaVersion: "1.0",
          bundle: { id: concept.sourceRepository, gitCommit: concept.revision },
        },
        {
          record: "concept",
          id: concept.conceptId,
          path: concept.path,
          contentHash: concept.contentProvenance,
        },
      ],
    },
    ...overrides,
  };
}

class MemoryStore implements LoreLinkStore {
  writes = 0;
  events: unknown[] = [];
  task = createTask("T-1", { title: "Link Lore" });
  async read() {
    return { revision: "r-1", task: this.task };
  }
  async commit(request: Parameters<LoreLinkStore["commit"]>[0]) {
    this.writes += 1;
    this.task = request.task;
    this.events.push(request.event);
    return { kind: "success" as const, revision: "r-2" };
  }
}

test("a validated public Lore concept commits a stable documentation reference and event", async () => {
  const store = new MemoryStore();
  const result = await linkLoreConcept(
    { exportProjection: async () => projection() },
    store,
    { taskReference: "T-1", operationId: "link-1", concept },
  );
  expect(result).toMatchObject({
    kind: "success",
    event: {
      kind: "lore.concept-linked",
      taskId: "T-1",
      concept,
    },
  });
  expect(store.task.documentation).toEqual([
    "lore://sha256%3Arepository/concept/adr%2Foptional-lore?revision=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa&path=docs%2Fadr%2Foptional-lore.md&schema=1.0&content=sha256%3Acontent",
  ]);
  expect(store.events).toHaveLength(1);
});

test("unreachable Lore leaves the authoritative task bytes identical", async () => {
  const store = new MemoryStore();
  const before = JSON.stringify(store.task);
  await expect(
    linkLoreConcept(
      {
        exportProjection: async () => Promise.reject(new Error("unreachable")),
      },
      store,
      { taskReference: "T-1", operationId: "link-1", concept },
    ),
  ).rejects.toThrow("unreachable");
  expect(JSON.stringify(store.task)).toBe(before);
  expect(store.writes).toBe(0);
});

for (const [name, altered] of [
  ["incompatible schema", () => projection({ schemaVersion: 2 as 1 })],
  [
    "stale export",
    () => {
      const exported = projection();
      return {
        ...exported,
        data: {
          ...exported.data,
          records: exported.data.records.map((record) =>
            record.record === "manifest"
              ? {
                  ...record,
                  bundle: {
                    id: concept.sourceRepository,
                    gitCommit: "b".repeat(40),
                  },
                }
              : record,
          ),
        },
      };
    },
  ],
  [
    "missing concept",
    () => {
      const exported = projection();
      return {
        ...exported,
        data: {
          ...exported.data,
          records: exported.data.records.filter(
            (record) => record.record !== "concept",
          ),
        },
      };
    },
  ],
] as const) {
  test(`${name} fails loud and leaves authoritative task bytes identical`, async () => {
    const store = new MemoryStore();
    const before = JSON.stringify(store.task);
    await expect(
      linkLoreConcept(
        { exportProjection: async () => altered() as LoreProjection },
        store,
        { taskReference: "T-1", operationId: "link-1", concept },
      ),
    ).rejects.toThrow();
    expect(JSON.stringify(store.task)).toBe(before);
    expect(store.writes).toBe(0);
  });
}
