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

import { registryHoldsTarball } from "../scripts/qualification/bundle-integrity.mjs";
import { verifyTarballRoute } from "../scripts/qualification/provenance-tarball-route.mjs";

/**
 * QCLI-555 (DEC-251 a3). `release-provenance.mjs --post` read the registry's
 * gitHead, which npm records only when a publish runs from a git checkout. The
 * tarball route records none. With `--bundle <dir> --run-id <id>` it now ties
 * the served launcher to the commit through opum-cli-e2e's receipt, when and
 * only when the registry records NO gitHead. The bundle's own sourceCommit is
 * a claim, never the binding.
 *
 * The CLI cases replace `npm` and `gh` with stubs on PATH, so nothing touches
 * the registry or GitHub. The module cases inject the receipt gate and the
 * registry read.
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
  // realpath: macOS's tmpdir is a symlink.
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
  // No receipt is readable: opum-cli-e2e's main answers a 404.
  await writeFile(join(bin, "gh"), "#!/bin/sh\necho 'HTTP 404' >&2\nexit 1\n");
  await chmod(join(bin, "npm"), 0o755);
  await chmod(join(bin, "gh"), 0o755);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

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

/** What the old check accepted: the served tarball plus a self-written claim. */
async function handWrittenBundle() {
  const out = join(dir, "bundle");
  await mkdir(join(out, "evidence"), { recursive: true });
  await mkdir(join(out, "tarballs"), { recursive: true });
  await writeFile(
    join(out, "evidence", "package-metadata.json"),
    JSON.stringify({ sourceCommit: SHA }),
  );
  await writeFile(
    join(out, "tarballs", `opum-ai-quest-${version}-rc.1.tgz`),
    TARBALL_BYTES,
  );
  return out;
}

test("a registry gitHead equal to the released commit still passes, with no bundle", async () => {
  const run = await post(["--version", version], { gitHead: SHA });
  expect(run.code).toBe(0);
  expect(run.out).toContain(`gitHead == ${SHA}`);
});

test("a registry gitHead that differs fails, even with a bundle and run id", async () => {
  const run = await post(
    [
      "--version",
      `${version}-rc.1`,
      "--bundle",
      await handWrittenBundle(),
      "--run-id",
      "1",
    ],
    { gitHead: OTHER },
  );
  expect(run.code).toBe(1);
  expect(run.err).toContain(`records gitHead ${OTHER}`);
});

test("no registry gitHead and no bundle fails, and names --bundle and --run-id", async () => {
  const run = await post(["--version", `${version}-rc.1`]);
  expect(run.code).toBe(1);
  expect(run.err).toContain("--bundle <dir> --run-id <id>");
});

test("--bundle without --run-id fails and names --run-id", async () => {
  const run = await post([
    "--version",
    `${version}-rc.1`,
    "--bundle",
    await handWrittenBundle(),
  ]);
  expect(run.code).toBe(1);
  expect(run.err).toContain("--bundle needs --run-id");
});

test("the served tarball plus a hand-written sourceCommit is refused: no receipt binds it", async () => {
  const run = await post([
    "--version",
    `${version}-rc.1`,
    "--bundle",
    await handWrittenBundle(),
    "--run-id",
    "41367823211",
  ]);
  expect(run.code).toBe(1);
  expect(run.err).toContain("cannot be tied");
  expect(run.out).not.toContain("passed");
});

// ---- the module, with the receipt gate and the registry read injected ----

const launcher = {
  stagedVersion: "0.0.0-rc.1",
  stagedTarball: "/bundle/tarballs/opum-ai-quest-0.0.0-rc.1.tgz",
  final: { path: "/bundle/final/opum-ai-quest-0.0.0.tgz" },
};

function route(
  overrides: Record<string, unknown> = {},
  seen: string[] = [],
  receipt: Record<string, unknown> = {},
) {
  return verifyTarballRoute({
    name: "@opum-ai/quest",
    bundleDir: "/bundle",
    version: "0.0.0",
    postVersion: "0.0.0-rc.1",
    commit: SHA,
    runId: "7",
    requireReceipt: async () => ({
      ok: true,
      problems: [],
      override: null,
      source: "opum-ai/opum-cli-e2e@main:receipts/quest/0.0.0.json",
      launcher,
      ...receipt,
    }),
    registryHolds: async (_name: string, _version: string, tarball: string) => {
      seen.push(tarball);
      return { ok: true, expected: "sha512-x", actual: "sha512-x" };
    },
    ...overrides,
  });
}

test("the module passes when the receipt gate and the registry both agree", async () => {
  const result = await route();
  expect(result.ok).toBe(true);
  expect(result.source).toContain("receipts/quest/0.0.0.json");
});

test("a receipt gate that refuses fails, the registry is never read, and the reasons are shown", async () => {
  const seen: string[] = [];
  const result = await route({}, seen, {
    ok: false,
    problems: ["receipt.commit is not this commit"],
  });
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain(
    "receipt.commit is not this commit",
  );
  expect(seen).toEqual([]);
});

test("a bundle that cannot be read fails rather than throwing", async () => {
  const result = await route({
    requireReceipt: async () => {
      throw new Error("ENOENT: no such file");
    },
  });
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("ENOENT");
});

test("the rc reads the staged tarball and X reads the final one, never a search over both", async () => {
  const rc: string[] = [];
  await route({}, rc);
  expect(rc).toEqual([launcher.stagedTarball]);
  const x: string[] = [];
  const result = await route({ postVersion: "0.0.0" }, x);
  expect(result.ok).toBe(true);
  expect(x).toEqual([launcher.final.path]);
});

test("an rc the bundle did not stage fails", async () => {
  const result = await route({ postVersion: "0.0.0-rc.2" });
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("0.0.0-rc.1");
});

test("a served tarball that is not the receipt-bound one fails, naming what is served", async () => {
  const result = await route({
    registryHolds: async () => ({
      ok: false,
      expected: "sha512-bundle",
      actual: "sha512-served",
    }),
  });
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("serves sha512-served");
});

test("an empty served integrity reads as unreadable, not as 'serves ,'", async () => {
  const file = join(dir, "t.tgz");
  await writeFile(file, TARBALL_BYTES);
  const result = await route({
    registryHolds: (name: string, v: string) =>
      registryHoldsTarball(name, v, file, {
        execFile: async () => ({ stdout: "\n", stderr: "" }),
      }),
  });
  expect(result.ok).toBe(false);
  const text = result.problems.join("\n");
  expect(text).toContain("serves (unreadable)");
  expect(text).not.toContain("serves ,");
});

test("a registry read that exits non-zero fails as unreadable", async () => {
  const file = join(dir, "t.tgz");
  await writeFile(file, TARBALL_BYTES);
  const result = await route({
    registryHolds: (name: string, v: string) =>
      registryHoldsTarball(name, v, file, {
        execFile: async () => {
          throw Object.assign(new Error("npm view failed"), { code: 1 });
        },
      }),
  });
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("serves (unreadable)");
});

test("an override in the receipt is carried out verbatim, not swallowed", async () => {
  const result = await route({}, [], {
    override: { by: "someone", reason: "waived" },
  });
  expect(result.ok).toBe(true);
  expect(result.override).toContain("QUALIFICATION OVERRIDE IN USE");
  expect(result.override).toContain("waived");
});
