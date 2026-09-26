import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  plainScope,
  printable,
  unicodeFormatForgery,
} from "../src/domain/agent-plugins.ts";
import { unnamableScopeRemedy } from "../src/application/agents/agent-plugins.ts";

/**
 * QCLI-382, opum-agent OPAG-453, one paired change with lore-cli (LCLI-607,
 * opum-ai/lore-cli#307 at f2d3223c, merged 53d8912d) under ADR ruling (d).
 *
 * F4: a dash-led scope such as `--scope` passed the old token regex, so it
 * reached a remedy and the update argv as `--scope --scope`. The token must
 * now start with a letter or digit (lore-cli 46133fc0, LCLI-593).
 *
 * F5: printable passed Unicode format characters. It now strips exactly
 * U+202A-202E, U+2066-2069, U+200B, U+2060 and U+FEFF, and keeps U+200C,
 * U+200D, U+200E, U+200F and U+061C (the narrowed ruling).
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

let root: string;
let bin: string;
let log: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "qcli382-")));
  bin = join(root, ".fake-bin");
  log = join(root, ".fake-calls.log");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function claudeWithScope(scope: string, enabled: boolean) {
  const file = join(bin, "claude.listing");
  await writeFile(
    file,
    JSON.stringify([{ id: "opum-quest@opum", scope, enabled, version: "1" }]),
  );
  await writeFile(
    join(bin, "claude"),
    `#!/bin/sh
echo "claude $*" >> "${log}"
if [ "$1 $2 $3" = "plugin list --json" ]; then cat "${file}"; exit 0; fi
exit 0
`,
  );
  await chmod(join(bin, "claude"), 0o755);
}

async function plugin(...arguments_: readonly string[]) {
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
  };
  delete env.QUEST_AGENT_PLUGINS;
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn(
    [process.execPath, source, "agents", ...arguments_, "--json"],
    { cwd: root, stdout: "pipe", stderr: "pipe", env },
  );
  const stdout = await new Response(child.stdout).text();
  await child.exited;
  return JSON.parse(stdout).data.plugin;
}

async function calls(): Promise<string[]> {
  try {
    return (await readFile(log, "utf8")).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// --- F4 ---------------------------------------------------------------------

for (const scope of ["--scope", "-x"]) {
  test(`F4: a dash-led scope ${scope} reaches no remedy and no update argv`, async () => {
    await claudeWithScope(scope, true);
    const report = await plugin("--update-instructions", "--target", "claude");
    expect(report).toMatchObject({
      state: "installed",
      update: "not-run",
      remedy: unnamableScopeRemedy,
    });
    expect(await calls()).toEqual(["claude plugin list --json"]);

    await rm(log, { force: true });
    await claudeWithScope(scope, false);
    const disabled = await plugin("--check", "--target", "claude");
    expect(disabled.remedy).toBe(unnamableScopeRemedy);
    expect(disabled.remedy).not.toContain(`--scope ${scope}`);
  });
}

test("F4: the token must start with a letter or digit, and every real Claude scope still passes", () => {
  for (const scope of ["local", "project", "user", "managed", "synced", "1a"])
    expect(plainScope(scope)).toBe(scope);
  for (const scope of ["--scope", "-x", "_x", "", "a b", "a;b"])
    expect(plainScope(scope)).toBeUndefined();
});

// --- F5 ---------------------------------------------------------------------

const stripped = [
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069,
  0x200b, 0x2060, 0xfeff,
];

test("F5: the sanitiser removes exactly the 12 agreed code points across the swept blocks", () => {
  // lore-cli's own proof for LCLI-607: sweep U+0600-06FF, U+2000-206F and
  // U+FE00-FEFF and assert the removed set is exactly these 12.
  const removed: number[] = [];
  for (const [from, to] of [
    [0x0600, 0x06ff],
    [0x2000, 0x206f],
    [0xfe00, 0xfeff],
  ] as const)
    for (let cp = from; cp <= to; cp += 1) {
      const text = `a${String.fromCodePoint(cp)}b`;
      if (text.replace(unicodeFormatForgery, "") === "ab") removed.push(cp);
    }
  expect(removed).toEqual([...stripped].sort((a, b) => a - b));
});

test("F5: printable joins the text around every stripped character except U+FEFF", () => {
  for (const cp of stripped.filter((cp) => cp !== 0xfeff))
    expect(printable(`remedy${String.fromCodePoint(cp)}line`)).toBe(
      "remedyline",
    );
});

test("F5: on printable, U+FEFF is collapsed to a space first, as lore-cli does", () => {
  // JS \s matches U+FEFF, and printable collapses whitespace before it
  // sanitises, in both CLIs. The character still never reaches the output.
  const out = printable("remedy﻿line");
  expect(out).toBe("remedy line");
  expect(out.includes("﻿")).toBe(false);
});

test("F5: an RLO cannot reorder a printed remedy line", () => {
  expect(printable("claude plugin ‮enable‬ opum-quest@opum")).toBe(
    "claude plugin enable opum-quest@opum",
  );
});

test("F5: ZWNJ, ZWJ, LRM, RLM and ALM are kept, including a ZWJ emoji sequence", () => {
  for (const kept of ["‌", "‍", "‎", "‏", "؜"])
    expect(printable(`a${kept}b`)).toBe(`a${kept}b`);
  const family = "\u{1F468}‍\u{1F469}‍\u{1F467}";
  expect(printable(`team ${family} ok`)).toBe(`team ${family} ok`);
  expect(printable("می‌خواهم")).toBe("می‌خواهم");
});

test("F5: a version or scope from the runtime is printed without format characters", async () => {
  await claudeWithScope("user", true);
  const file = join(bin, "claude.listing");
  await writeFile(
    file,
    JSON.stringify([
      {
        id: "opum-quest@opum",
        scope: "user",
        enabled: true,
        version: "1.2‮3​",
      },
    ]),
  );
  const report = await plugin("--check", "--target", "claude");
  expect(report.version).toBe("1.23");
});
