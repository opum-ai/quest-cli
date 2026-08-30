import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { commandManifest } from "../../src/application/command-contract.ts";
import { runQuest } from "../../src/cli/main.ts";

/**
 * QCLI-151, generalized past its own defect.
 *
 * The manifest is how a machine consumer learns which envelope to expect — it
 * is exactly what `QuestTrackerClient`'s handshake reads. QCLI-141 added two
 * output modes to `quest instructions` and gave them new envelope kinds
 * (`agent.guides`, `agent.guide`) without declaring either, so the registry
 * described one envelope while the CLI emitted three.
 *
 * This is the mirror of `manifest-field-coverage.test.ts`: that one catches a
 * manifest declaring a field the CLI never emits, this one catches the CLI
 * emitting a kind the manifest never declares. Both failures are invisible
 * until a consumer trips over them.
 */

const DECLARED_KINDS = new Set<string>(
  commandManifest.commands
    .map((command) => command.kind)
    .filter((kind) => typeof kind === "string"),
);

function declaredKindFor(name: string): string {
  const entry = commandManifest.commands.find(
    (command) => command.name === name,
  );
  if (!entry?.kind) throw new Error(`manifest has no kind for ${name}`);
  return entry.kind;
}

async function withStore(
  body: (
    run: (argv: readonly string[]) => Promise<{
      exitCode: number;
      stdout: string;
      stderr: string;
    }>,
  ) => Promise<void>,
): Promise<void> {
  const store = await mkdtemp(join(tmpdir(), "quest-manifest-kinds-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  try {
    await body((argv) => runQuest(argv, false));
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
}

/**
 * One row per manifest entry that names an invocation shape rather than a bare
 * command. This table is the extension point: a new output mode that emits a
 * new kind must be declared in the manifest and listed here, or one of the two
 * assertions below fails.
 */
const INVOCATIONS: readonly (readonly [string, readonly string[]])[] = [
  ["instructions", ["instructions", "--json"]],
  ["instructions --list", ["instructions", "--list", "--json"]],
  ["instructions <guide>", ["instructions", "overview", "--json"]],
];

test("every kind the instructions family emits is declared by its own manifest entry (QCLI-151)", async () => {
  await withStore(async (run) => {
    for (const [name, argv] of INVOCATIONS) {
      const result = await run(argv);
      expect(result.exitCode, name).toBe(0);
      const emitted = (JSON.parse(result.stdout) as { kind: string }).kind;
      // Declared somewhere at all — the weak check a consumer scanning the
      // whole registry would survive.
      expect({
        name,
        emitted,
        declared: DECLARED_KINDS.has(emitted),
      }).toEqual({
        name,
        emitted,
        declared: true,
      });
      // Declared by the entry a consumer would actually look up for THIS
      // invocation, which is the check that failed before QCLI-151.
      expect({ name, emitted }).toEqual({
        name,
        emitted: declaredKindFor(name),
      });
    }
  });
});

test("the manifest declares no two entries with the same name", () => {
  // The three instructions entries are distinguished only by name, so a
  // duplicate would make declaredKindFor above silently resolve the wrong one.
  const names: readonly string[] = commandManifest.commands.map(
    (command) => command.name,
  );
  expect(names.length).toBe(new Set<string>(names).size);
});
