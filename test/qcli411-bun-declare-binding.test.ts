import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * QCLI-411 / OPAG-734. Bun 1.3.14 silently STRIPS a top-level binding named
 * `declare` in a .ts file: `function declare(v) {...}; declare('x')` prints
 * nothing and exits 0, so a test helper of that name never runs while the
 * assertions around it pass vacuously. Upstream oven-sh/bun#30006, fixed by
 * oven-sh/bun#31239, which is in 1.4.0 and later but not in 1.3.14.
 *
 * The repository pinned 1.3.14 in package.json's `packageManager` and in
 * every `oven-sh/setup-bun` step, so the exposure was the pinned runtime
 * itself. These tests hold the pin and the behaviour together: the static
 * half fails a partial revert of any one pin, and the runtime half fails a
 * downgrade that a pin edit alone would not catch. The measured exposure in
 * this repository was ZERO occurrences across 192 tracked .ts files on dev
 * 0c49b792 -- the hazard is future code, which is exactly what a pin cannot
 * protect against and a runtime check can.
 */

const REPO = new URL("..", import.meta.url).pathname;
const FLOOR = [1, 4, 0] as const;

const parse = (v: string): number[] => v.split(".").map((n) => Number(n));
const atLeastFloor = (v: string): boolean => {
  const [major = 0, minor = 0, patch = 0] = parse(v);
  const [fMajor, fMinor, fPatch] = FLOOR;
  return (
    major > fMajor ||
    (major === fMajor && minor > fMinor) ||
    (major === fMajor && minor === fMinor && patch >= fPatch)
  );
};

test("every bun pin names a bun at or above 1.4.0 (QCLI-411)", async () => {
  const pkg = (await Bun.file(join(REPO, "package.json")).json()) as {
    packageManager?: string;
  };
  const manager = pkg.packageManager ?? "";
  expect(manager.startsWith("bun@")).toBe(true);
  expect(atLeastFloor(manager.slice("bun@".length))).toBe(true);

  // Every workflow, discovered rather than listed: a new workflow with a pin
  // is exactly the case a hardcoded file list would miss. The extension is
  // filtered in JS rather than with a brace glob, which not every bun version
  // expands -- and this test has to behave the same on a bun it is about to
  // report as too old.
  const glob = new Bun.Glob(".github/workflows/*");
  const files: string[] = [];
  // `dot: true` is load-bearing, not tidiness: bun 1.3.14's Bun.Glob does NOT
  // descend into a dot-directory by default and returns 0 for `.github/...`,
  // while 1.4.2 returns 7. Measured on both. Without it this test would read
  // nothing on exactly the runtime it exists to complain about, and its
  // read-nothing guard below would fire instead of the version assertion.
  for await (const f of glob.scan({ cwd: REPO, dot: true }))
    if (/\.ya?ml$/.test(f)) files.push(f);
  expect(files.length).toBeGreaterThan(0); // a check that read nothing must not pass

  const pins: string[] = [];
  for (const f of files) {
    const text = await Bun.file(join(REPO, f)).text();
    for (const m of text.matchAll(/^\s*bun-version:\s*(\S+)\s*$/gm)) {
      pins.push(`${f}: ${m[1]}`);
      expect(atLeastFloor(m[1] ?? "")).toBe(true);
    }
  }
  // The pin must actually be found, or the loop above proves nothing.
  expect(pins.length).toBeGreaterThanOrEqual(5);
});

test("the pinned runtime actually executes a top-level `declare` binding (QCLI-411)", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli411-"));
  try {
    const marker = "DECLARE_BINDING_EXECUTED";
    const repro = join(root, "declare-binding.ts");
    await writeFile(
      repro,
      [
        "function declare(value: string): void {",
        `  console.log(${JSON.stringify(marker)} + ": " + value);`,
        "}",
        'declare("x");',
        'console.log("REPRO_COMPLETED");',
      ].join("\n"),
    );

    const child = Bun.spawnSync([process.execPath, "run", repro], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = child.stdout ? child.stdout.toString() : "";
    const stderr = child.stderr ? child.stderr.toString() : "";
    const version = Bun.version;

    // Positive control first: if the file did not run at all, the marker's
    // absence says nothing about the binding, and the two failures below must
    // not be confused for each other.
    expect(
      stdout.includes("REPRO_COMPLETED"),
      `the repro file did not run to completion under bun ${version}. stderr: ${stderr}`,
    ).toBe(true);

    expect(
      stdout.includes(marker),
      `bun ${version} silently stripped a top-level binding named \`declare\` ` +
        `(OPAG-734, fixed in bun 1.4.0 by oven-sh/bun#31239). The repro ran to ` +
        `completion without executing the call, which is the failure mode this ` +
        `check exists to catch: a test helper of that name would pass vacuously. ` +
        `Run the suite on the pinned runtime -- package.json packageManager.`,
    ).toBe(true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
