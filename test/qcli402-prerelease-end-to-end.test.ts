import { afterAll, expect, test } from "bun:test";
import {
  chmod,
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * QCLI-402 AC3, as amended by the orchestrator's ruling on the LCLI-631 AC5
 * twin (2026-09-28). Amendment 1 of opum-doc ADR
 * refuse-a-lore-quest-promotion-that-would-move-npm-latest-backwards assumed
 * a prerelease version reaches the promotion record. What must hold is the
 * PROPERTY, whichever step refuses: a fresh `--promote` of a prerelease
 * version exits nonzero, makes no registry write, and writes no record.
 *
 * In quest the version is package.json's, so this runs the real
 * promote-release.mjs from a copy of scripts/ beside a package.json at a
 * prerelease. `gh` and `npm` are stubs on PATH that log every call. The tag
 * read answers as if v<version> existed, so the refusal comes from a later
 * step (today the bundle gate, since no qualified bundle of a prerelease can
 * exist), not from a missing tag. Every other call fails.
 */

const REPO = join(import.meta.dir, "..");
const NODE = Bun.which("node");
const roots: string[] = [];

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

async function promoteAt(version: string) {
  // realpath: tmpdir() is a symlink on macOS, and the script only runs main()
  // when argv[1] matches its own resolved URL, so a symlinked path would
  // exit 0 having done nothing.
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli402-e2e-")));
  roots.push(root);
  await cp(join(REPO, "scripts"), join(root, "scripts"), { recursive: true });
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ name: "@opum-ai/quest", version }, null, 2)}\n`,
  );
  const bin = join(root, "bin");
  const log = join(root, "calls.log");
  await writeFile(log, "");
  const tagPath = `repos/opum-ai/quest-cli/git/ref/tags/v${version}`;
  const tagAnswer = JSON.stringify({
    ref: `refs/tags/v${version}`,
    object: { type: "commit", sha: "a".repeat(40) },
  });
  const stub = (name: string, answers: string) =>
    `#!/bin/bash\nprintf '%s %s\\n' ${name} "$*" >> ${JSON.stringify(log)}\n${answers}\necho "stubbed ${name}: refused" >&2\nexit 1\n`;
  await Bun.write(
    join(bin, "gh"),
    stub(
      "gh",
      `if [ "$*" = "api --hostname github.com ${tagPath}" ]; then printf '%s' '${tagAnswer}'; exit 0; fi`,
    ),
  );
  await Bun.write(join(bin, "npm"), stub("npm", ""));
  await Bun.write(join(bin, "security"), stub("security", ""));
  for (const name of ["gh", "npm", "security"])
    await chmod(join(bin, name), 0o755);

  const record = join(root, "record.json");
  const child = Bun.spawnSync(
    [
      NODE ?? "node",
      join(root, "scripts", "promote-release.mjs"),
      "--record",
      record,
      "--qualification-run",
      "123",
      "--promote",
    ],
    {
      cwd: root,
      env: {
        HOME: root,
        PATH: `${bin}:${NODE ? dirname(NODE) : "/usr/bin"}:/usr/bin:/bin`,
      },
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const calls = (await readFile(log, "utf8")).split("\n").filter(Boolean);
  const recordWritten = await stat(record).then(
    () => true,
    () => false,
  );
  return {
    exitCode: child.exitCode,
    stderr: child.stderr.toString(),
    calls,
    recordWritten,
    tagPath,
  };
}

/** A registry WRITE: moving a dist-tag or publishing. Reads do not count. */
const isRegistryWrite = (call: string) =>
  /^npm (.* )?(dist-tag (add|rm)|publish|unpublish|deprecate)\b/.test(call);

test("a fresh --promote of a prerelease exits nonzero with no registry write and no record", async () => {
  const run = await promoteAt("9.9.9-beta.1");
  // Positive control on the harness itself: the script ran and reached the
  // network, reading the tag through the gh stub. So an empty write list
  // below is a measurement, not a harness that never ran.
  expect(run.calls).toContain(`gh api --hostname github.com ${run.tagPath}`);
  expect(run.exitCode).not.toBe(0);
  expect(run.calls.filter(isRegistryWrite)).toEqual([]);
  expect(run.recordWritten).toBe(false);
});

test("build metadata is held to the same property", async () => {
  const run = await promoteAt("9.9.9+build.5");
  expect(run.calls.length).toBeGreaterThan(0);
  expect(run.exitCode).not.toBe(0);
  expect(run.calls.filter(isRegistryWrite)).toEqual([]);
  expect(run.recordWritten).toBe(false);
});

test("the write detector recognises the writes promotion would make", () => {
  // The negative assertions above rest on this matcher, so it is pinned
  // against the argv shapes promote-release.mjs actually sends.
  for (const call of [
    "npm dist-tag add @opum-ai/quest-linux-x64@9.9.9 latest --registry=x",
    "npm publish final.tgz --tag latest",
  ])
    expect(isRegistryWrite(call)).toBe(true);
  for (const call of [
    "npm view @opum-ai/quest dist-tags --json",
    "gh api repos/x",
  ])
    expect(isRegistryWrite(call)).toBe(false);
});
