import { expect, test } from "bun:test";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import {
  launcherPublishArgs,
  readBackReadme,
} from "../scripts/promote-release.mjs";
import { publishArgs } from "../scripts/publish-release.mjs";
import { REGISTRY_PINS } from "../scripts/qualification/registry-visibility.mjs";

/**
 * QCLI-400, from lore-cli's LCLI-621 review (F6): npm prefers a configured
 * `@opum-ai:registry` over `--registry` for a scoped package, so every
 * release-script npm call that reaches the registry passes both pins, and
 * the promotion reads back the launcher's package-level readme.
 */

const execFile = promisify(execFileCallback);
const repo = join(import.meta.dir, "..");
const PUBLIC = "https://registry.npmjs.org/";

test("the pins name the public registry for both the default and the @opum-ai scope", () => {
  expect([...REGISTRY_PINS]).toEqual([
    `--registry=${PUBLIC}`,
    `--@opum-ai:registry=${PUBLIC}`,
  ]);
});

test("a project .npmrc pointing @opum-ai elsewhere is overridden by both pins, and not by --registry alone", async () => {
  // Offline: `npm config get` resolves what a call would use without making
  // one. The unpinned read is the positive control -- it proves the .npmrc
  // is read at all, so the pinned answer means something.
  const dir = await mkdtemp(join(tmpdir(), "qcli400-npmrc-"));
  try {
    await writeFile(
      join(dir, ".npmrc"),
      "@opum-ai:registry=http://127.0.0.1:9/\n",
    );
    const scope = async (...flags: string[]) =>
      (
        await execFile(
          "npm",
          ["config", "get", "@opum-ai:registry", ...flags],
          {
            cwd: dir,
          },
        )
      ).stdout.trim();
    expect(await scope()).toBe("http://127.0.0.1:9/");
    expect(await scope(`--registry=${PUBLIC}`)).toBe("http://127.0.0.1:9/");
    expect(await scope(...REGISTRY_PINS)).toBe(PUBLIC);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("both publish argument builders carry the pins", () => {
  for (const args of [
    publishArgs("x.tgz"),
    publishArgs("x.tgz", { dryRun: true, otp: "123456" }),
    launcherPublishArgs("x.tgz"),
    launcherPublishArgs("x.tgz", { otp: "123456" }),
  ])
    expect(args).toEqual(expect.arrayContaining([...REGISTRY_PINS]));
});

async function walk(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (
        await readdir(dir, { withFileTypes: true })
      ).map((entry) =>
        entry.isDirectory()
          ? walk(join(dir, entry.name))
          : entry.name.endsWith(".d.mts")
            ? []
            : [join(dir, entry.name)],
      ),
    )
  ).flat();
}

type Spawn = { site: string; form: string; body: string };

/**
 * Every place a file in scripts/ spawns npm or npx, in any of the three
 * forms the scripts use, so a spawn that is none of them is itself a
 * finding rather than invisible (QCLI-400 review, finding 1):
 *   - `<call>("npm", [ ... ])`, or `<call>("label", "npm", [ ... ])`, with the
 *     argument list literal captured to its closing bracket;
 *   - `<call>("npm", <expression>)`, the argument list built elsewhere;
 *   - Bun.$`npm ...`, a template spawn.
 * A quoted "npm" is a spawn when it opens a call's arguments, directly or
 * after one string label -- `join(root, "npm", ...)` is a path segment.
 * Blind to: npm reached through a variable command name or npm-cli.js, and
 * a `[` inside a string literal within an argument list.
 */
async function npmSpawns() {
  const spawns: Spawn[] = [];
  for (const path of await walk(join(repo, "scripts"))) {
    const file = relative(repo, path);
    const source = await readFile(path, "utf8");
    const line = (index: number) =>
      `${file}:${source.slice(0, index).split("\n").length}`;
    const quoted =
      /\(\s*(?:["'][\w-]+["']\s*,\s*)?["'](np[mx])["']\s*,\s*(\[|[^\s\]])/g;
    for (const match of source.matchAll(quoted)) {
      if (match[2] !== "[") {
        const rest = source.slice(match.index + match[0].length - 1);
        spawns.push({
          site: line(match.index),
          form: "expression",
          body: rest.slice(0, rest.search(/[,)]/)).trim(),
        });
        continue;
      }
      let depth = 0;
      let end = match.index + match[0].length - 1;
      for (; end < source.length; end++) {
        if (source[end] === "[") depth++;
        else if (source[end] === "]" && --depth === 0) break;
      }
      spawns.push({
        site: line(match.index),
        form: match[1],
        body: source.slice(match.index + match[0].length - 1, end + 1),
      });
    }
    for (const match of source.matchAll(/Bun\.\$`\s*(np[mx])\b([^`]*)`/g))
      spawns.push({
        site: line(match.index),
        form: `template ${match[1]}`,
        body: match[2].trim(),
      });
  }
  return spawns;
}

// The pins as an ELEMENT of the list, not merely text inside it: a comment
// reading "...REGISTRY_PINS" does not satisfy this (review finding 1a).
const PINNED = /[[,]\s*\.\.\.REGISTRY_PINS\s*[,\]]/;
// `npm pack` of the working directory: no package spec, every word a flag.
const LOCAL_PACK_LIST =
  /^\[\s*["']pack["']\s*(?:,\s*["']--[\w-]+["']\s*(?:,\s*[\w.]+\s*)?)*,?\s*\]$/;
const LOCAL_PACK_TEMPLATE = /^pack(?:\s+(?:--[\w-]+|\$\{\w+\}))*$/;
// Non-literal argument lists, each built by a function a test below pins.
const BUILT_ELSEWHERE = [
  { file: "scripts/publish-release.mjs", body: "args" }, // publishArgs
  { file: "scripts/promote-release.mjs", body: "launcherPublishArgs(tarball" },
];

test("every npm or npx spawn in scripts/ is pinned, provably local, or built by a pinned builder", async () => {
  const spawns = await npmSpawns();
  // How much was read: 11 literal lists, 2 built elsewhere, 5 templates.
  expect(spawns.length).toBeGreaterThanOrEqual(15);
  const bad = spawns.filter((spawn) => {
    if (spawn.form === "npm")
      return !PINNED.test(spawn.body) && !LOCAL_PACK_LIST.test(spawn.body);
    if (spawn.form === "template npm")
      return !LOCAL_PACK_TEMPLATE.test(spawn.body);
    if (spawn.form === "expression")
      return !BUILT_ELSEWHERE.some(
        (built) =>
          spawn.site.startsWith(`${built.file}:`) && spawn.body === built.body,
      );
    return true; // npx, in any form, is never expected here
  });
  expect(
    bad.map(
      (spawn) => `${spawn.site} ${spawn.form} ${spawn.body.slice(0, 60)}`,
    ),
  ).toEqual([]);
});

// Every npm subcommand, and every alias, that talks to the registry.
const REGISTRY_VERB =
  /^(?!\s*#).*\bnpm\s+(publish|unpublish|view|v|info|show|dist-tags?|pack|install|i|add|ci|access|whoami|stage|owner|deprecate|search)\b/;

test("every registry npm call in release.yml carries both pins", async () => {
  const workflow = await readFile(
    join(repo, ".github", "workflows", "release.yml"),
    "utf8",
  );
  const calls = workflow.split("\n").filter((line) => REGISTRY_VERB.test(line));
  // Upgrading npm itself is not an @opum-ai call; named, so a second
  // unpinned install is a decision rather than a gap.
  const npmSelfUpgrade = /\bnpm install --global npm@\^11\s*$/;
  expect(calls.length).toBe(6);
  for (const call of calls.filter((line) => !npmSelfUpgrade.test(line)))
    for (const pin of REGISTRY_PINS) expect(call).toContain(pin);
});

const reader = (answers: (() => string)[]) => {
  const calls: string[][] = [];
  let next = 0;
  return {
    calls,
    read: () =>
      readBackReadme({
        execFile: async (_command, args) => {
          calls.push([...args]);
          return { stdout: answers[Math.min(next++, answers.length - 1)]() };
        },
        attempts: 3,
        sleep: async () => {},
      }),
  };
};

test("readme read-back: the empty packument field npm serves today reads as 0 bytes, not as unknown", async () => {
  // Measured 2026-09-28 on 0.11.0: `readme` is a present, empty string, and
  // `npm view @opum-ai/quest readme` prints nothing with exit 0.
  const { calls, read } = reader([() => ""]);
  expect(await read()).toEqual({ bytes: 0, attempts: 3 });
  expect(calls[0]).toEqual([
    "view",
    "@opum-ai/quest",
    "readme",
    "--prefer-online",
    ...REGISTRY_PINS,
  ]);
});

test("readme read-back retries through lag and stops at the first non-empty read", async () => {
  const { calls, read } = reader([() => "", () => "# Quest\n"]);
  expect(await read()).toEqual({ bytes: 7, attempts: 2 });
  expect(calls.length).toBe(2);
});

test("readme read-back reports an unreadable registry as null, never as 0", async () => {
  const { read } = reader([
    () => {
      throw Object.assign(new Error("Command failed"), {
        stderr: "npm error code ETIMEDOUT\nnpm error network timeout\n",
      });
    },
  ]);
  expect(await read()).toEqual({
    bytes: null,
    attempts: 3,
    error: "npm error code ETIMEDOUT",
  });
});
