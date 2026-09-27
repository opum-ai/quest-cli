import { expect, test } from "bun:test";
import { execFile as execFileCallback } from "node:child_process";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { resolveRcNumber } from "../scripts/build-candidate-bundle.mjs";
import {
  checkLauncherEquivalence,
  launcherRcVersion,
  nextRcNumber,
  substituteBytes,
} from "../scripts/qualification/launcher-equivalence.mjs";

/**
 * QCLI-399, constitution Article 3 clause 5 as amended by ODOC-302 (opum-doc
 * f322cff): the qualified X-rc.N launcher and the published X launcher must be
 * "identical once X-rc.N is substituted for X throughout". Each test below
 * names the clause of the comparison it exercises (the entry set, the mode,
 * the bytes, the declared versions, and failure handling), so a mutant of one
 * clause should fail only its own rows.
 */

const execFile = promisify(execFileCallback);
const X = "9.9.9";
const RC = "9.9.9-rc.1";

type Tree = Record<string, { body: string; mode?: number }>;

const launcher = (version: string): Tree => ({
  "package.json": {
    body: `${JSON.stringify({ name: "@opum-ai/quest", version, optionalDependencies: { "@opum-ai/quest-linux-x64": X } }, null, 2)}\n`,
  },
  "bin/quest.cjs": { body: "#!/usr/bin/env node\n", mode: 0o755 },
  "README.md": { body: "# Quest\n" },
});

async function tarball(dir: string, name: string, tree: Tree): Promise<string> {
  const root = join(dir, `src-${name}`);
  for (const [path, entry] of Object.entries(tree)) {
    const full = join(root, "package", path);
    await mkdir(join(full, ".."), { recursive: true });
    await writeFile(full, entry.body);
    await chmod(full, entry.mode ?? 0o644);
  }
  const out = join(dir, `${name}.tgz`);
  await execFile("tar", ["-czf", out, "-C", root, "package"]);
  return out;
}

async function compare(
  rc: Tree,
  final: Tree,
  versions = { rcVersion: RC, version: X },
) {
  const dir = await mkdtemp(join(tmpdir(), "quest-qcli399-"));
  try {
    return await checkLauncherEquivalence({
      rcTarball: await tarball(dir, "rc", rc),
      finalTarball: await tarball(dir, "final", final),
      ...versions,
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("bytes: launchers differing only by the version string are equivalent", async () => {
  expect(await compare(launcher(RC), launcher(X))).toEqual({
    ok: true,
    problems: [],
  });
});

test("bytes: any other content difference is refused, naming the file", async () => {
  const final = launcher(X);
  final["bin/quest.cjs"] = {
    body: "#!/usr/bin/env node\n// changed\n",
    mode: 0o755,
  };
  const out = await compare(launcher(RC), final);
  expect(out.ok).toBe(false);
  expect(out.problems).toEqual([
    'package/bin/quest.cjs: differs from the rc launcher by more than "9.9.9-rc.1" -> "9.9.9"',
  ]);
});

test("entry set: a file only in the final launcher is refused", async () => {
  const final = { ...launcher(X), "extra.txt": { body: "x\n" } };
  const out = await compare(launcher(RC), final);
  expect(out.ok).toBe(false);
  expect(out.problems).toEqual([
    "package/extra.txt: in the final launcher, missing from the rc one",
  ]);
});

test("entry set: a file only in the rc launcher is refused", async () => {
  const final = launcher(X);
  delete final["README.md"];
  const out = await compare(launcher(RC), final);
  expect(out.ok).toBe(false);
  expect(out.problems).toEqual([
    "package/README.md: in the rc launcher, missing from the final one",
  ]);
});

test("mode: the same bytes with a different mode are refused", async () => {
  const final = launcher(X);
  final["bin/quest.cjs"] = { body: "#!/usr/bin/env node\n", mode: 0o644 };
  const out = await compare(launcher(RC), final);
  expect(out.ok).toBe(false);
  expect(out.problems).toEqual([
    "package/bin/quest.cjs: mode 755 in the rc launcher, 644 in the final one",
  ]);
});

test("declared versions: two launchers that both say X substitute nothing and are refused", async () => {
  const out = await compare(launcher(X), launcher(X));
  expect(out.ok).toBe(false);
  expect(out.problems).toContain(
    'the rc launcher\'s package.json declares "9.9.9", expected 9.9.9-rc.1',
  );
});

test("platform pins: an rc pinning its platforms at X-rc.N is refused, though it substitutes to X", async () => {
  const pinned = (pin: string): Tree => ({
    ...launcher(RC),
    "package.json": {
      body: `${JSON.stringify({ name: "@opum-ai/quest", version: RC, optionalDependencies: { "@opum-ai/quest-linux-x64": pin } }, null, 2)}\n`,
    },
  });
  const out = await compare(pinned(RC), launcher(X));
  expect(out).toEqual({
    ok: false,
    problems: [
      'the rc launcher pins @opum-ai/quest-linux-x64 at "9.9.9-rc.1", expected exactly 9.9.9',
    ],
  });
  const none = await compare(
    {
      ...launcher(RC),
      "package.json": {
        body: `${JSON.stringify({ name: "@opum-ai/quest", version: RC }, null, 2)}\n`,
      },
    },
    {
      ...launcher(X),
      "package.json": {
        body: `${JSON.stringify({ name: "@opum-ai/quest", version: X }, null, 2)}\n`,
      },
    },
  );
  expect(none.problems).toEqual([
    "the rc launcher's package.json pins no platform packages in optionalDependencies",
  ]);
});

test("declared versions: an rc that is not an rc of X is refused before unpacking", async () => {
  const out = await compare(launcher(RC), launcher(X), {
    rcVersion: "9.9.8-rc.1",
    version: X,
  });
  expect(out).toEqual({
    ok: false,
    problems: ["9.9.8-rc.1 is not an rc of 9.9.9"],
  });
});

test("failure: an unreadable archive is returned, not thrown", async () => {
  const out = await checkLauncherEquivalence({
    rcTarball: "/nonexistent/rc.tgz",
    finalTarball: "/nonexistent/final.tgz",
    rcVersion: RC,
    version: X,
  });
  expect(out.ok).toBe(false);
  expect(out.problems[0]).toStartWith(
    "could not unpack and compare the launchers:",
  );
});

test("substitution replaces every occurrence, and only the rc string", () => {
  expect(
    substituteBytes(
      Buffer.from("a 9.9.9-rc.1 b 9.9.9-rc.1 9.9.9-rc.12"),
      RC,
      X,
    ).toString(),
  ).toBe("a 9.9.9 b 9.9.9 9.9.92");
  expect(substituteBytes(Buffer.from("none"), RC, X).toString()).toBe("none");
});

test("rc numbering: one past the highest published rc of X, or 1", () => {
  expect(nextRcNumber(X, [])).toBe(1);
  expect(nextRcNumber(X, ["9.9.8-rc.7", "9.9.9"])).toBe(1);
  expect(
    nextRcNumber(X, [
      "9.9.9-rc.1",
      "9.9.9-rc.3",
      "9.9.9-rc.10x",
      "9.9.9-rc.01",
    ]),
  ).toBe(4);
  expect(launcherRcVersion(X, 2)).toBe("9.9.9-rc.2");
  expect(() => launcherRcVersion(X, 0)).toThrow();
  expect(() => launcherRcVersion("9.9.9-rc.1", 1)).toThrow();
});

test("rc numbering: explicit wins; the registry decides otherwise; an unreadable registry refuses only on a release ref", async () => {
  const fail = async () => {
    throw new Error("E404");
  };
  expect(
    await resolveRcNumber({
      version: X,
      explicit: "3",
      releaseRef: true,
      readVersions: fail,
    }),
  ).toBe(3);
  await expect(
    resolveRcNumber({ version: X, explicit: "0", releaseRef: false }),
  ).rejects.toThrow();
  expect(
    await resolveRcNumber({
      version: X,
      releaseRef: true,
      readVersions: async () => ["9.9.9-rc.1"],
    }),
  ).toBe(2);
  expect(
    await resolveRcNumber({
      version: X,
      releaseRef: false,
      readVersions: fail,
    }),
  ).toBe(1);
  await expect(
    resolveRcNumber({ version: X, releaseRef: true, readVersions: fail }),
  ).rejects.toThrow("--launcher-rc");
});
