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

/** Every `"npm", [ ... ]` argument list literal in scripts/, with its verb. */
async function npmCallSites() {
  const sites: { file: string; verb: string; body: string }[] = [];
  const walk = async (dir: string): Promise<string[]> =>
    (
      await Promise.all(
        (
          await readdir(dir, { withFileTypes: true })
        ).map((entry) =>
          entry.isDirectory()
            ? walk(join(dir, entry.name))
            : entry.name.endsWith(".mjs")
              ? [join(dir, entry.name)]
              : [],
        ),
      )
    ).flat();
  for (const path of await walk(join(repo, "scripts"))) {
    const source = await readFile(path, "utf8");
    for (const match of source.matchAll(/["']npm["'],\s*\[/g)) {
      let depth = 0;
      let end = match.index + match[0].length - 1;
      for (; end < source.length; end++) {
        if (source[end] === "[") depth++;
        else if (source[end] === "]" && --depth === 0) break;
      }
      const body = source.slice(match.index, end + 1);
      const verb = body.match(/\[\s*["'`]([\w-]+)["'`]/)?.[1] ?? "?";
      sites.push({ file: relative(repo, path), verb, body });
    }
  }
  return sites;
}

// Calls that never reach the registry: packing a local directory and
// installing local tarballs. Named, so a new one is a decision, not a gap.
const LOCAL_ONLY = [
  { file: "scripts/build-candidate-bundle.mjs", verb: "pack" },
  { file: "scripts/qualification/prepublish.mjs", verb: "pack" },
  { file: "scripts/qualification/prepublish.mjs", verb: "install" },
];

test("every npm argument list literal in scripts/ that reaches the registry carries the pins", async () => {
  const sites = await npmCallSites();
  // Report how much was read: a scan that finds nothing must not pass.
  expect(sites.length).toBeGreaterThanOrEqual(10);
  const unpinned = sites.filter(
    (site) =>
      !site.body.includes("...REGISTRY_PINS") &&
      !LOCAL_ONLY.some(
        (local) => local.file === site.file && local.verb === site.verb,
      ),
  );
  expect(unpinned.map(({ file, verb }) => `${file}: npm ${verb}`)).toEqual([]);
  // A local-only entry must still be local: no package spec, no registry verb.
  for (const site of sites.filter((s) => !s.body.includes("...REGISTRY_PINS")))
    expect(["pack", "install"]).toContain(site.verb);
});

test("every npm publish and view in release.yml carries both pins", async () => {
  const workflow = await readFile(
    join(repo, ".github", "workflows", "release.yml"),
    "utf8",
  );
  const calls = workflow
    .split("\n")
    .filter((line) => /^(?!\s*#).*\bnpm (publish|view|dist-tag)\b/.test(line));
  expect(calls.length).toBe(3);
  for (const line of calls)
    for (const pin of REGISTRY_PINS) expect(line).toContain(pin);
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
