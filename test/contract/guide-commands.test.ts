import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { questGuides } from "../../src/application/agents/guides.ts";
import { commandManifest } from "../../src/application/command-contract.ts";
import { runQuest } from "../../src/cli/main.ts";

/**
 * Every `quest` command a guide shows must actually run (QCLI-148).
 *
 * QCLI-141 shipped a task-finalization recipe using `task edit
 * --final-summary` before that flag existed, so the guide exited 2 at the last
 * step of every task. A reviewer caught it by executing the guide by hand.
 * This is that check, automated.
 */

// No fenced recipe currently needs skipping: every one runs in a shared,
// already-initialized store. `init`, `agents`, `browser` and `migration
// backlog` appear only as inline references, which the second test covers. If
// a guide ever shows one of those as a runnable recipe, this test will fail --
// correctly, because that recipe cannot be pasted into a working store either.

/**
 * Placeholder values. An unrecognized placeholder throws rather than being
 * passed through, so a new one cannot silently become a literal argument.
 */
const PLACEHOLDERS: Readonly<Record<string, string>> = {
  "<id>": "T-1",
  "<title>": "A created task",
  "<label>": "seeded",
  "<why this exists>": "because the guide says so",
  "<observable outcome>": "the outcome is observable",
  "<what changed and why>": "changed the thing, and why",
  "<what changed, why, how it was verified>": "changed it; tests verify it",
};

/**
 * A fenced block is a recipe: a complete invocation an agent will paste, so it
 * has to run. An inline backticked span is a reference -- "see `quest doctor`"
 * -- and is often deliberately incomplete, so the obligation there is only
 * that the command it names is real.
 */
function recipesIn(content: string): readonly string[] {
  const found: string[] = [];
  for (const block of content.matchAll(/```\n([\s\S]*?)```/g)) {
    const joined = (block[1] ?? "").replace(/\\\n\s*/g, " ");
    for (const line of joined.split("\n"))
      if (line.trim().startsWith("quest ")) found.push(line.trim());
  }
  return found;
}

function mentionsIn(content: string): readonly string[] {
  return [...content.matchAll(/`(quest [^`]+)`/g)].map((span) =>
    (span[1] ?? "").trim(),
  );
}

/** The manifest command a mention names, or undefined if it names none. */
function namedCommand(mention: string): string | undefined {
  const words = mention
    .slice("quest ".length)
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 0 &&
        !word.startsWith("-") &&
        !word.startsWith("<") &&
        !word.startsWith("[") &&
        !word.startsWith('"') &&
        !word.startsWith("'"),
    );
  const names = new Set(
    commandManifest.commands.map((entry: { name: string }) => entry.name),
  );
  for (let length = words.length; length > 0; length -= 1) {
    const candidate = words.slice(0, length).join(" ");
    if (names.has(candidate)) return candidate;
  }
  return undefined;
}

/**
 * Splits a shown command into argv. Placeholder values are substituted after
 * tokenizing so a value containing spaces stays one argument.
 */
function argvFor(command: string): readonly string[] {
  const tokens = command.match(/(?:[^\s'"]|'[^']*'|"[^"]*")+/g) ?? [];
  return tokens.slice(1).map((token) => {
    const bare = token.replace(/^["']|["']$/g, "");
    if (!bare.startsWith("<")) return bare;
    const value = PLACEHOLDERS[bare];
    if (value === undefined)
      throw new Error(
        `guide command uses an unmapped placeholder ${bare}: ${command}`,
      );
    return value;
  });
}

test("every quest command the guides show actually runs (QCLI-148)", async () => {
  const store = await mkdtemp(join(tmpdir(), "quest-guide-commands-"));
  const previous = process.env.QUEST_TASK_STORE;
  process.env.QUEST_TASK_STORE = store;
  const actor = ["--actor", "guide", "--actor-kind", "human"];
  try {
    // T-1 carries two acceptance criteria because the finalization guide
    // checks positions 1 and 2.
    await runQuest(
      [
        "task",
        "create",
        "Seeded",
        "--acceptance-criteria",
        '["first","second"]',
        "--label",
        "seeded",
        ...actor,
        "--json",
      ],
      false,
    );
    await runQuest(
      ["draft", "create", "Seeded draft", ...actor, "--json"],
      false,
    );

    let ran = 0;
    const usedPlaceholders = new Set<string>();
    // Guide order is load-bearing, not incidental: task-finalization runs
    // `task complete`, and To Do -> Done is an illegal transition, so that
    // recipe is correct only because task-execution has already set the task
    // to In Progress. A per-guide store would report a false failure.
    for (const guide of questGuides) {
      for (const command of recipesIn(guide.content)) {
        for (const placeholder of command.matchAll(/<[^>]+>/g))
          usedPlaceholders.add(placeholder[0]);
        const result = await runQuest([...argvFor(command)], false);
        expect({
          guide: guide.name,
          command,
          exitCode: result.exitCode,
        }).toEqual({ guide: guide.name, command, exitCode: 0 });
        ran += 1;
      }
    }
    expect(ran).toBeGreaterThan(5);
    // The placeholder map stays honest in both directions: an unmapped one
    // throws above, and a mapped one no recipe uses is dead weight here.
    expect([...usedPlaceholders].sort()).toEqual(
      Object.keys(PLACEHOLDERS).sort(),
    );
  } finally {
    if (previous === undefined) delete process.env.QUEST_TASK_STORE;
    else process.env.QUEST_TASK_STORE = previous;
    await rm(store, { recursive: true, force: true });
  }
});

test("every quest command the guides mention is a real command (QCLI-148)", () => {
  // The reference half. A guide naming a command that does not exist is the
  // same defect as a recipe that does not run, and `overview` and `workspace`
  // are almost entirely references, so without this they carry no coverage.
  for (const guide of questGuides) {
    const unknown = mentionsIn(guide.content).filter(
      (mention) => namedCommand(mention) === undefined,
    );
    expect({ guide: guide.name, unknown }).toEqual({
      guide: guide.name,
      unknown: [],
    });
  }
});
