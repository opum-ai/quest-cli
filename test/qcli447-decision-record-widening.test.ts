import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-447 / opum-doc seq 179(c). The decision record is widened to the design
 * in `questions-decisions-and-adrs.md`:
 *
 *   source     a question id, a request id, or `delegated`
 *   decidedBy  `operator` or `opum-doc`
 *   scope      `cross-repo` or `component:<repo>`
 *   adrs       the linked ADR ids
 *   supersedes the decision ids this ruling replaces
 *   status     adds `rejected` and `withdrawn`
 *
 * The load-bearing half is BACK-COMPAT: a record written before these fields
 * existed must still read, and a write that does not name them must not invent
 * them. Both are asserted here, not assumed.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const HUMAN = ["--actor", "person-1", "--actor-kind", "human"] as const;

function quest(workspace: string, args: readonly string[]) {
  return runCommand([process.execPath, MAIN, ...args], { cwd: workspace });
}

function envelope(workspace: string, args: readonly string[]) {
  const run = quest(workspace, [...args, "--json"]);
  expect({ args: args.join(" "), exitCode: run.exitCode }).toEqual({
    args: args.join(" "),
    exitCode: 0,
  });
  return JSON.parse(run.stdout) as { kind: string; data: unknown };
}

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), "qcli447-"));
  await Bun.spawn(["git", "init", "-q"], { cwd: root }).exited;
  quest(root, ["init"]);
  return root;
}

test("AC1: decision create and edit set source, decidedBy, scope, adrs and supersedes, and view reads them back (QCLI-447)", async () => {
  const root = await workspace();
  try {
    const created = envelope(root, [
      "decision",
      "create",
      "Adopt the model",
      "--source",
      "Q-4",
      "--decided-by",
      "opum-doc",
      "--scope",
      "cross-repo",
      "--adr",
      "questions-decisions-and-adrs",
      "--adr",
      "keep-lore-optional",
      "--supersedes",
      "DEC-2",
      ...HUMAN,
    ]);
    expect(created.kind).toBe("decision.created");
    expect(created.data).toMatchObject({
      id: "DEC-1",
      title: "Adopt the model",
      source: "Q-4",
      decidedBy: "opum-doc",
      scope: "cross-repo",
      adrs: ["questions-decisions-and-adrs", "keep-lore-optional"],
      supersedes: ["DEC-2"],
    });

    // The read surface reports the same record, so the fields are persisted
    // rather than echoed from the write.
    const viewed = envelope(root, ["decision", "view", "DEC-1"]);
    expect(viewed.kind).toBe("decision.view");
    expect(viewed.data).toMatchObject({
      source: "Q-4",
      decidedBy: "opum-doc",
      scope: "cross-repo",
      adrs: ["questions-decisions-and-adrs", "keep-lore-optional"],
      supersedes: ["DEC-2"],
    });
    expect(
      (envelope(root, ["decision", "list"]).data as unknown[]).length,
    ).toBe(1);

    // Edit replaces a supplied list and updates every scalar, and the change
    // survives a fresh read.
    const edited = envelope(root, [
      "decision",
      "edit",
      "DEC-1",
      "--source",
      "delegated",
      "--decided-by",
      "operator",
      "--scope",
      "component:quest-cli",
      "--adr",
      "decision-record-adr",
      "--supersedes",
      "DEC-9",
      ...HUMAN,
    ]);
    expect(edited.data).toMatchObject({
      source: "delegated",
      decidedBy: "operator",
      scope: "component:quest-cli",
      adrs: ["decision-record-adr"],
      supersedes: ["DEC-9"],
    });
    expect(envelope(root, ["decision", "view", "DEC-1"]).data).toMatchObject({
      source: "delegated",
      decidedBy: "operator",
      scope: "component:quest-cli",
      adrs: ["decision-record-adr"],
      supersedes: ["DEC-9"],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("AC2: rejected and withdrawn are reachable decision statuses, through create and edit, and are counted (QCLI-447)", async () => {
  const root = await workspace();
  try {
    const rejected = envelope(root, [
      "decision",
      "create",
      "Declined option",
      "--status",
      "rejected",
      ...HUMAN,
    ]);
    expect(rejected.data).toMatchObject({ status: "rejected" });

    const withdrawn = envelope(root, [
      "decision",
      "create",
      "Withdrawn proposal",
      "--status",
      "withdrawn",
      ...HUMAN,
    ]);
    expect(withdrawn.data).toMatchObject({ status: "withdrawn" });

    // `edit` reaches both too, not only `create`.
    expect(
      envelope(root, [
        "decision",
        "edit",
        "DEC-1",
        "--status",
        "withdrawn",
        ...HUMAN,
      ]).data,
    ).toMatchObject({ status: "withdrawn" });

    // The statuses are real counted states, not merely accepted input: the
    // overview groups by whatever status a decision carries.
    const overview = envelope(root, ["overview"]);
    expect(
      (overview.data as { decisions: Record<string, number> }).decisions,
    ).toMatchObject({ withdrawn: 2 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("AC3: a decision written before the widened fields existed still reads, and a write does not invent them (QCLI-447)", async () => {
  const root = await workspace();
  try {
    // Exactly the pre-QCLI-447 shape: no source, decidedBy, scope, adrs or
    // supersedes. Written straight to the store, the way an older release
    // would have left it.
    await mkdir(join(root, ".quest"), { recursive: true });
    await writeFile(
      join(root, ".quest", "planning.json"),
      `${JSON.stringify({
        milestones: [],
        decisions: [
          {
            id: "DEC-1",
            title: "Legacy ruling",
            context: "old context",
            outcome: "old outcome",
            status: "accepted",
          },
        ],
      })}\n`,
      "utf8",
    );

    const viewed = envelope(root, ["decision", "view", "DEC-1"]);
    expect(viewed.data).toMatchObject({
      id: "DEC-1",
      title: "Legacy ruling",
      context: "old context",
      outcome: "old outcome",
      status: "accepted",
    });
    // No widened field is fabricated on read: the key set is exactly the old
    // one. A uniform `undefined`/null for the new keys would be the wrong
    // answer -- an absent field is absent.
    expect(Object.keys(viewed.data as Record<string, unknown>).sort()).toEqual([
      "context",
      "id",
      "outcome",
      "status",
      "title",
    ]);

    expect(
      (envelope(root, ["decision", "list"]).data as { id: string }[]).map(
        (row) => row.id,
      ),
    ).toEqual(["DEC-1"]);

    // Editing a legacy record still works and still adds no widened field.
    envelope(root, [
      "decision",
      "edit",
      "DEC-1",
      "--outcome",
      "new outcome",
      ...HUMAN,
    ]);
    const reread = envelope(root, ["decision", "view", "DEC-1"]);
    expect(reread.data).toMatchObject({ outcome: "new outcome" });
    expect(Object.keys(reread.data as Record<string, unknown>).sort()).toEqual([
      "context",
      "id",
      "outcome",
      "status",
      "title",
    ]);

    // And a NEW record created without the widened inputs carries only the
    // old key set plus the empty `id`/`title`/`outcome`/`status` shape -- no
    // absent field rendered as an empty one.
    const plain = envelope(root, [
      "decision",
      "create",
      "Plain decision",
      ...HUMAN,
    ]);
    expect(Object.keys(plain.data as Record<string, unknown>).sort()).toEqual([
      "id",
      "outcome",
      "status",
      "title",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("AC4: the widened fields appear in the machine contract and the human rendering (QCLI-447)", async () => {
  const root = await workspace();
  try {
    envelope(root, [
      "decision",
      "create",
      "Rendered ruling",
      "--source",
      "Q-4",
      "--decided-by",
      "operator",
      "--scope",
      "cross-repo",
      "--adr",
      "adr-one",
      "--adr",
      "adr-two",
      "--supersedes",
      "DEC-2",
      ...HUMAN,
    ]);

    // Machine contract: every decision entry advertises the new keys, and the
    // two list-valued flags are advertised as repeatable scalars.
    const manifest = JSON.parse(quest(root, ["manifest", "--json"]).stdout) as {
      data: {
        commands: {
          name: string;
          fields: string[];
          parameters?: {
            flags: Record<string, { value: string; repeatable?: true }>;
          };
        }[];
      };
    };
    const widened = ["source", "decidedBy", "scope", "adrs", "supersedes"];
    for (const name of [
      "decision list",
      "decision view",
      "decision create",
      "decision edit",
    ]) {
      const entry = manifest.data.commands.find((item) => item.name === name);
      expect({ name, entry: entry !== undefined }).toEqual({
        name,
        entry: true,
      });
      expect({
        name,
        missing: widened.filter((field) => !entry?.fields.includes(field)),
      }).toEqual({ name, missing: [] });
    }
    for (const name of ["decision create", "decision edit"]) {
      const entry = manifest.data.commands.find((item) => item.name === name);
      expect(entry?.parameters?.flags["--adr"]).toEqual({
        value: "string",
        repeatable: true,
      });
      expect(entry?.parameters?.flags["--supersedes"]).toEqual({
        value: "string",
        repeatable: true,
      });
    }

    // Human rendering: `--plain` prints each field and the list values.
    const human = quest(root, ["decision", "view", "DEC-1", "--plain"]);
    expect(human.exitCode).toBe(0);
    for (const line of [
      "source: Q-4",
      "decidedBy: operator",
      "scope: cross-repo",
      "adrs:",
      "- adr-one",
      "- adr-two",
      "supersedes:",
      "- DEC-2",
    ])
      expect({ line, present: human.stdout.includes(line) }).toEqual({
        line,
        present: true,
      });

    // The human flag list names the inputs with their arity, so a caller can
    // build the command from `quest help decision create` alone.
    const help = quest(root, ["help", "decision", "create"]).stdout;
    expect(help).toContain("- --adr <string, repeatable>");
    expect(help).toContain("- --supersedes <string, repeatable>");
    expect(help).toContain("- --decided-by <string>");
    expect(help).toContain("- --scope <string>");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("the design's bounded vocabularies are enforced (QCLI-447)", async () => {
  const root = await workspace();
  try {
    for (const args of [
      ["decision", "create", "D", "--status", "maybe", ...HUMAN],
      ["decision", "create", "D", "--decided-by", "someone", ...HUMAN],
      ["decision", "create", "D", "--scope", "everything", ...HUMAN],
    ]) {
      const run = quest(root, [...args, "--json"]);
      expect({ args: args.join(" "), exitCode: run.exitCode }).toEqual({
        args: args.join(" "),
        exitCode: 6,
      });
      expect(JSON.parse(run.stderr)).toMatchObject({
        error_type: "validation",
      });
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
