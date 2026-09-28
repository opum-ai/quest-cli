import { afterEach, beforeEach, expect, test } from "bun:test";
import { execFile as execFileCallback } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import {
  checkFinalLauncherSlot,
  checkServedLauncher,
  publishFinalLauncher,
  verifyFinalLauncher,
} from "../scripts/promote-release.mjs";

/**
 * QCLI-399, promotion half (constitution Article 3 clause 5 as amended by
 * ODOC-302, read at opum-doc f322cff; opum-cli-e2e receipts/README.md blob
 * 241ac885, pair-reader steps 6 and 7). The launcher reaches `latest` by a
 * fresh publish of the bundle's X, and only after the rc the registry serves
 * RIGHT NOW is shown to be the qualified rc with only its version changed.
 */

const execFile = promisify(execFileCallback);
const X = "9.9.9";
const RC = "9.9.9-rc.2";

let dir: string;
let qualifiedRc: string;
let finalTarball: string;

async function launcherTarball(
  name: string,
  version: string,
  readme = "# Quest\n",
) {
  const root = join(dir, `src-${name}`);
  await mkdir(join(root, "package", "bin"), { recursive: true });
  await writeFile(
    join(root, "package", "package.json"),
    `${JSON.stringify({ name: "@opum-ai/quest", version, optionalDependencies: { "@opum-ai/quest-linux-x64": X } }, null, 2)}\n`,
  );
  await writeFile(
    join(root, "package", "bin", "quest.cjs"),
    "#!/usr/bin/env node\n",
  );
  await writeFile(join(root, "package", "README.md"), readme);
  const out = join(dir, `${name}.tgz`);
  await execFile("tar", ["-czf", out, "-C", root, "package"]);
  return out;
}

/** A registry "download" that copies a chosen file, recording the spec. */
function serving(file: string, specs: string[] = []) {
  return async (spec: string, into: string) => {
    specs.push(spec);
    const target = join(into, "served.tgz");
    await copyFile(file, target);
    return target;
  };
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "quest-qcli399-promote-"));
  qualifiedRc = await launcherTarball("rc", RC);
  finalTarball = await launcherTarball("final", X);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const check = (download: (spec: string, into: string) => Promise<string>) =>
  checkServedLauncher({
    version: X,
    launcherVersion: RC,
    qualifiedRc,
    finalTarball,
    download,
  });

test("step 6: the served rc is the qualified rc, and X is it with only the version substituted", async () => {
  const specs: string[] = [];
  expect(await check(serving(qualifiedRc, specs))).toEqual({
    ok: true,
    problems: [],
  });
  // Read from the registry at the rc version, never at X.
  expect(specs).toEqual([`@opum-ai/quest@${RC}`]);
});

test("step 6: an rc npm serves with different bytes from the qualified one refuses", async () => {
  const other = await launcherTarball("other", RC, "# Quest, restaged\n");
  const result = await check(serving(other));
  expect(result.ok).toBe(false);
  // Both halves fail, each for its own reason: the digest, and the substitution.
  expect(result.problems[0]).toContain(
    `npm serves @opum-ai/quest@${RC} as sha256`,
  );
  expect(result.problems.join("\n")).toContain("package/README.md");
});

test("step 6: the substitution is checked against the SERVED rc, not the bundle's copy", async () => {
  const seen: string[] = [];
  await checkServedLauncher({
    version: X,
    launcherVersion: RC,
    qualifiedRc,
    finalTarball,
    download: serving(qualifiedRc),
    checkEquivalence: async ({ rcTarball }) => {
      seen.push(rcTarball);
      return { ok: true, problems: [] };
    },
  });
  expect(seen).toHaveLength(1);
  expect(seen[0]).not.toBe(qualifiedRc);
  expect(seen[0]?.endsWith("served.tgz")).toBe(true);
});

test("step 6: an X launcher differing by more than the version refuses", async () => {
  finalTarball = await launcherTarball(
    "final-changed",
    X,
    "# Quest 9.9.9, now with a banner\n",
  );
  const result = await check(serving(qualifiedRc));
  expect(result.ok).toBe(false);
  expect(result.problems).toEqual([
    `package/README.md: differs from the rc launcher by more than "${RC}" -> "${X}"`,
  ]);
});

test("step 6: an rc that cannot be downloaded refuses rather than passing", async () => {
  const result = await check(async () => {
    throw new Error("E404 Not Found\nmore");
  });
  expect(result).toEqual({
    ok: false,
    problems: [
      `@opum-ai/quest@${RC} could not be downloaded from the registry (E404 Not Found)`,
    ],
  });
});

function publisher({
  recheck = { ok: true, problems: [] as string[] },
  published = false,
  held = true,
  unreadable = false,
}: {
  recheck?: { ok: boolean; problems: string[] };
  published?: boolean;
  held?: boolean;
  unreadable?: boolean;
} = {}) {
  const calls: string[] = [];
  const run = () =>
    publishFinalLauncher({
      version: X,
      finalTarball: "/bundle/final/opum-ai-quest-9.9.9.tgz",
      recheck: async () => {
        calls.push("recheck");
        return recheck;
      },
      publish: async (tarball) => {
        calls.push(`publish ${tarball}`);
      },
      setTag: async (name, version, tag) => {
        calls.push(`tag ${name}@${version} ${tag}`);
      },
      alreadyPublished: async () => published,
      holds: async () => ({
        ok: held && !unreadable,
        expected: "sha512-final",
        actual: unreadable ? null : held ? "sha512-final" : "sha512-other",
      }),
    });
  return { calls, run };
}

test("the launcher publish re-runs step 6 first, then publishes the bundle's final tarball", async () => {
  const { calls, run } = publisher();
  expect(await run()).toBe("published");
  expect(calls).toEqual([
    "recheck",
    "publish /bundle/final/opum-ai-quest-9.9.9.tgz",
  ]);
});

test("a re-check that no longer holds stops before anything irreversible", async () => {
  const { calls, run } = publisher({
    recheck: { ok: false, problems: ["npm serves another rc"] },
  });
  await expect(run()).rejects.toThrow("npm serves another rc");
  expect(calls).toEqual(["recheck"]);
});

test("a rerun after X landed as the qualified bytes moves the tag instead of republishing", async () => {
  const { calls, run } = publisher({ published: true });
  expect(await run()).toContain("already published");
  expect(calls).toEqual(["recheck", "tag @opum-ai/quest@9.9.9 latest"]);
});

test("an X already on npm as other bytes refuses, and neither publishes nor tags", async () => {
  const { calls, run } = publisher({ published: true, held: false });
  await expect(run()).rejects.toThrow("not the qualified sha512-final");
  expect(calls).toEqual(["recheck"]);
});

test("an X on npm whose integrity cannot be read says retry at the same version, not bump it", async () => {
  const { calls, run } = publisher({ published: true, unreadable: true });
  await expect(run()).rejects.toThrow(
    "could not be read; re-run the promotion at the same version",
  );
  expect(calls).toEqual(["recheck"]);
});

test("the pre-flight slot check: absent and qualified pass, foreign and unreadable refuse, before any tag moves", async () => {
  const slot = (published: boolean, actual: string | null) =>
    checkFinalLauncherSlot({
      version: X,
      finalTarball: "/bundle/final/opum-ai-quest-9.9.9.tgz",
      alreadyPublished: async () => published,
      holds: async () => ({
        ok: actual === "sha512-final",
        expected: "sha512-final",
        actual,
      }),
    });
  expect(await slot(false, null)).toBe("absent");
  expect(await slot(true, "sha512-final")).toBe("qualified");
  await expect(slot(true, "sha512-other")).rejects.toThrow(
    "not the qualified sha512-final; this needs a new version",
  );
  await expect(slot(true, null)).rejects.toThrow(
    "re-run the promotion at the same version",
  );
});

test("the pre-flight slot check refuses when the registry cannot say whether X exists", async () => {
  await expect(
    checkFinalLauncherSlot({
      version: X,
      finalTarball: "/bundle/final/opum-ai-quest-9.9.9.tgz",
      alreadyPublished: async () => {
        throw new Error(
          "could not tell whether @opum-ai/quest@9.9.9 is on the registry: ETIMEDOUT",
        );
      },
    }),
  ).rejects.toThrow("ETIMEDOUT");
});

test("step 7: npm serving X as the final tarball passes; other bytes fail at once", async () => {
  const ok = await verifyFinalLauncher({
    version: X,
    finalTarball,
    holds: async () => ({ ok: true, expected: "a", actual: "a" }),
    sleep: async () => {},
  });
  expect(ok).toEqual({ ok: true, problems: [] });

  let reads = 0;
  const other = await verifyFinalLauncher({
    version: X,
    finalTarball,
    holds: async () => {
      reads += 1;
      return { ok: false, expected: "a", actual: "b" };
    },
    sleep: async () => {},
  });
  expect(reads).toBe(1);
  expect(other.problems).toEqual([
    "@opum-ai/quest@9.9.9: npm serves b, the qualified final launcher is a",
  ]);
});

test("step 7: an unreadable integrity is retried, then fails rather than passes", async () => {
  let reads = 0;
  const result = await verifyFinalLauncher({
    version: X,
    finalTarball,
    attempts: 3,
    holds: async () => {
      reads += 1;
      return { ok: false, expected: "a", actual: null };
    },
    sleep: async () => {},
  });
  expect(reads).toBe(3);
  expect(result.ok).toBe(false);
  expect(result.problems[0]).toContain("no dist.integrity");
});

// The ORDER inside main() is the agreed contract (LCLI-621, P5), and no unit
// test of the pieces can see it. Read the source layout, as qcli388 and
// qcli398 do for their gates.
const mainSource = await readFile(
  join(import.meta.dir, "..", "scripts", "promote-release.mjs"),
  "utf8",
).then((source) => source.slice(source.indexOf("async function main(")));

test("order: bundle gate, pair receipt, plan, step 6, then the dry-run exit, record and promotion", () => {
  const at = (needle: string) => {
    const index = mainSource.indexOf(needle);
    expect({ needle, found: index > -1 }).toEqual({ needle, found: true });
    return index;
  };
  const sequence = [
    "await qualifyBundle({",
    "await requirePairQualification({",
    "await planPromotion({",
    "await checkServedLauncher({",
    "Dry run only. Re-run with --promote",
    'flag: "wx"',
    "await promote({",
    "await verifyFinalLauncher({",
  ].map(at);
  expect([...sequence].sort((a, b) => a - b)).toEqual(sequence);
});

test("order: the launcher publish re-runs step 6 inside itself, after the platform tags move", () => {
  const publisher = mainSource.slice(
    mainSource.indexOf("const publishLauncher = () =>"),
    mainSource.indexOf("await promote({"),
  );
  expect(publisher).toContain("recheck: () =>");
  expect(publisher).toContain("checkServedLauncher({");
  expect(publisher).toContain("launcherPublishArgs(tarball");
});

test("order: --rollback needs no bundle and never reaches the launcher publish", () => {
  const start = mainSource.indexOf("if (rollbackPath) {");
  const branch = mainSource.slice(start, mainSource.indexOf("} else {", start));
  expect(branch).not.toContain("qualifyBundle");
  expect(branch).not.toContain("qualification-run");
});

test("release.yml stages the launcher at the bundle's recorded rc, and reads it back at that version", async () => {
  const workflow = await readFile(
    join(import.meta.dir, "..", ".github", "workflows", "release.yml"),
    "utf8",
  );
  const staged =
    "launcher=$(node -p \"require('./candidate/evidence/package-metadata.json').launcher.stagedVersion\")";
  const wrapper = workflow.slice(
    workflow.indexOf("- name: Publish the wrapper"),
    workflow.indexOf("- name: Verify the registry serves what was published"),
  );
  expect(wrapper).toContain(staged);
  expect(wrapper).toContain(
    'npm publish "candidate/tarballs/opum-ai-quest-${launcher}.tgz" --access public --tag release-candidate',
  );
  // Nothing in the workflow publishes the X launcher from final/.
  expect(workflow).not.toContain("candidate/final/opum-ai-quest");
  expect(workflow).toContain("quest@${launcher}");
  expect(workflow).toContain(
    "release-provenance.mjs --post \\\n            --version",
  );
});

test("the provenance post-check reads only X or an rc of X", async () => {
  const script = join(
    import.meta.dir,
    "..",
    "scripts",
    "qualification",
    "release-provenance.mjs",
  );
  const version = JSON.parse(
    await readFile(join(import.meta.dir, "..", "package.json"), "utf8"),
  ).version;
  for (const bad of [
    "0.0.1",
    `${version}-rc.0`,
    `${version}-beta.1`,
    `${version}-rc.1x`,
  ]) {
    const refused = await execFile(
      "node",
      [script, "--post", "--version", bad],
      {
        cwd: join(import.meta.dir, ".."),
      },
    ).then(
      () => ({ code: 0, stderr: "" }),
      (error: { code: number; stderr: string }) => error,
    );
    expect({ bad, code: refused.code }).toEqual({ bad, code: 2 });
    expect(refused.stderr).toContain(
      `--version must be ${version} or ${version}-rc.<N>`,
    );
  }
});
