import { afterEach, beforeEach, expect, test } from "bun:test";
import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
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
import { join } from "node:path";
import { promisify } from "node:util";

/**
 * QCLI-555. `release-provenance.mjs --post` read the registry's gitHead, which
 * npm records only when a publish runs from a git checkout. The tarball route
 * (`npm publish <file>`, which publish-release.mjs, promote-release.mjs and
 * release.yml all use) records none, so the check could never pass where it
 * runs. With `--bundle <dir>` it now ties the registry to the commit through
 * the qualified bundle when, and only when, the registry records NO gitHead.
 *
 * `npm` is replaced by a stub on PATH that answers the two reads the script
 * makes, so no test touches the registry.
 */

const execFile = promisify(execFileCallback);
const root = join(import.meta.dir, "..");
const script = join(root, "scripts", "qualification", "release-provenance.mjs");
const SHA = "0123456789abcdef0123456789abcdef01234567";
const OTHER = "fedcba9876543210fedcba9876543210fedcba98";
const TARBALL_BYTES = Buffer.from("the qualified launcher tarball");

let dir: string;
let version: string;

const integrityOf = (bytes: Buffer) =>
  `sha512-${createHash("sha512").update(bytes).digest("base64")}`;

beforeEach(async () => {
  // realpath: macOS's tmpdir is a symlink, and a path that differs from its
  // realpath is how a script guarded on its own location silently no-ops.
  dir = await mkdtemp(join(await realpath(tmpdir()), "quest-qcli555-"));
  version = JSON.parse(
    await readFile(join(root, "package.json"), "utf8"),
  ).version;
  const bin = join(dir, "bin");
  await mkdir(bin);
  await writeFile(
    join(bin, "npm"),
    [
      "#!/bin/sh",
      'case "$*" in',
      '  *gitHead*) printf "%s" "$FAKE_GITHEAD" ;;',
      '  *dist.integrity*) printf "%s" "$FAKE_INTEGRITY" ;;',
      "  *) exit 9 ;;",
      "esac",
      "",
    ].join("\n"),
  );
  await chmod(join(bin, "npm"), 0o755);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

async function bundle({
  sourceCommit = SHA,
  slot = "tarballs",
  launcher = `${version}-rc.1`,
} = {}) {
  const out = join(dir, "bundle");
  await mkdir(join(out, "evidence"), { recursive: true });
  await mkdir(join(out, slot), { recursive: true });
  await writeFile(
    join(out, "evidence", "package-metadata.json"),
    JSON.stringify({ sourceCommit }),
  );
  await writeFile(
    join(out, slot, `opum-ai-quest-${launcher}.tgz`),
    TARBALL_BYTES,
  );
  return out;
}

async function post(
  args: string[],
  { gitHead = "", integrity = integrityOf(TARBALL_BYTES) } = {},
) {
  return execFile("node", [script, "--post", ...args], {
    cwd: root,
    env: {
      ...process.env,
      PATH: `${join(dir, "bin")}:${process.env.PATH}`,
      GITHUB_SHA: SHA,
      FAKE_GITHEAD: gitHead,
      FAKE_INTEGRITY: integrity,
    },
  }).then(
    (ok) => ({ code: 0, out: ok.stdout, err: ok.stderr }),
    (error: { code: number; stdout: string; stderr: string }) => ({
      code: error.code,
      out: error.stdout,
      err: error.stderr,
    }),
  );
}

test("a registry gitHead equal to the released commit still passes, with no bundle", async () => {
  const run = await post(["--version", version], { gitHead: SHA });
  expect(run.code).toBe(0);
  expect(run.out).toContain(`gitHead == ${SHA}`);
});

test("a registry gitHead that differs fails, even when a matching bundle is supplied", async () => {
  const run = await post(
    ["--version", `${version}-rc.1`, "--bundle", await bundle()],
    { gitHead: OTHER },
  );
  expect(run.code).toBe(1);
  expect(run.err).toContain(`records gitHead ${OTHER}`);
});

test("no registry gitHead and no bundle fails, and names --bundle", async () => {
  const run = await post(["--version", `${version}-rc.1`]);
  expect(run.code).toBe(1);
  expect(run.err).toContain("--bundle");
});

test("no registry gitHead passes through the bundle when integrity and sourceCommit both bind", async () => {
  const run = await post([
    "--version",
    `${version}-rc.1`,
    "--bundle",
    await bundle(),
  ]);
  expect(run.code).toBe(0);
  expect(run.out).toContain("tarball route");
  expect(run.out).toContain(SHA);
});

test("the never-staged X launcher is found in final/", async () => {
  const run = await post([
    "--version",
    version,
    "--bundle",
    await bundle({ slot: "final", launcher: version }),
  ]);
  expect(run.code).toBe(0);
});

test("a served tarball that is not the bundle's fails", async () => {
  const run = await post(
    ["--version", `${version}-rc.1`, "--bundle", await bundle()],
    { integrity: integrityOf(Buffer.from("some other bytes")) },
  );
  expect(run.code).toBe(1);
  expect(run.err).toContain("is not the bundle's tarball");
});

test("an unreadable served integrity fails rather than passing", async () => {
  const run = await post(
    ["--version", `${version}-rc.1`, "--bundle", await bundle()],
    { integrity: "" },
  );
  expect(run.code).toBe(1);
});

test("a bundle naming another commit fails", async () => {
  const run = await post([
    "--version",
    `${version}-rc.1`,
    "--bundle",
    await bundle({ sourceCommit: OTHER }),
  ]);
  expect(run.code).toBe(1);
  expect(run.err).toContain(`sourceCommit ${OTHER}`);
});

test("a bundle without the launcher tarball fails", async () => {
  const run = await post([
    "--version",
    `${version}-rc.1`,
    "--bundle",
    await bundle({ launcher: `${version}-rc.2` }),
  ]);
  expect(run.code).toBe(1);
  expect(run.err).toContain("carries no");
});
