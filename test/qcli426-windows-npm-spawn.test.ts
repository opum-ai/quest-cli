import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnTarget } from "../scripts/qualification/spawn-target.mjs";

/**
 * QCLI-426. The 0.12.0 tag-time qualification failed both Windows legs with
 * `spawn npm.cmd EINVAL`, leaving no native-execution receipt and so no way to
 * stage. The script, its gates and the Windows runner images were identical to
 * the v0.11.0 run that passed on 2026-09-27; the only variable was the pinned
 * Bun, 1.3.14 -> 1.4.2. Bun aligned with the spawn hardening that followed
 * CVE-2024-27980, which refuses a `.cmd` handed to spawn without a shell.
 *
 * The Windows branch cannot be exercised on this host, so it is asserted as a
 * value here. That is the whole point of `platform` being a parameter.
 */

const repo = join(import.meta.dir, "..");

/** What cmd.exe is left with after /s strips the first and last quote. */
const afterStrip = (argv: readonly string[]) => argv[3].slice(1, -1);

test("POSIX is untouched: the file is spawned directly, unwrapped and unquoted", () => {
  for (const platform of ["darwin", "linux"]) {
    expect(spawnTarget("npm", ["pack", "--json"], platform)).toEqual({
      executable: "npm",
      argv: ["pack", "--json"],
      verbatim: false,
    });
  }
});

test("win32 runs npm.cmd through cmd.exe as a finished command line", () => {
  const target = spawnTarget("npm", ["pack", "--json"], "win32");
  expect(target.executable).toBe(process.env.ComSpec ?? "cmd.exe");
  expect(target.verbatim).toBe(true);
  expect(target.argv.slice(0, 3)).toEqual(["/d", "/s", "/c"]);
  expect(afterStrip(target.argv)).toBe('"npm.cmd" "pack" "--json"');
});

test("a path containing a space stays ONE argument — the failure mode shell:true has", () => {
  // `shell: true` joins arguments with spaces and escapes nothing (DEP0190),
  // so this path would become two arguments and npm would take the tail as a
  // package spec. Quoting here is what makes the difference observable.
  const cache = "C:\\Users\\Some One\\AppData\\Local\\Temp\\npm-cache";
  const target = spawnTarget("npm", ["pack", "--cache", cache], "win32");
  expect(afterStrip(target.argv)).toBe(`"npm.cmd" "pack" "--cache" "${cache}"`);
  expect(afterStrip(target.argv).endsWith(`"${cache}"`)).toBe(true);
});

test("an embedded quote is doubled, so an argument cannot break out of its own quoting", () => {
  expect(afterStrip(spawnTarget("npm", ['a"b'], "win32").argv)).toBe(
    '"npm.cmd" "a""b"',
  );
});

test("win32 leaves a non-npm executable alone", () => {
  expect(spawnTarget("git", ["status"], "win32")).toEqual({
    executable: "git",
    argv: ["status"],
    verbatim: false,
  });
});

/** Comments stripped first: prose ABOUT the unsafe option is not the option. */
const executableSource = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("the fix did not take the shell-option form, which is the unsafe one", async () => {
  // That form would pass the Windows legs for any path that happens to have
  // no spaces, which is why it is worth refusing by name rather than trusting
  // review to catch it every time. It must still be refused when a comment
  // names it -- hence the strip above.
  for (const file of ["prepublish.mjs", "spawn-target.mjs"]) {
    const code = executableSource(
      await readFile(join(repo, "scripts", "qualification", file), "utf8"),
    );
    expect(`${file}: ${/shell\s*:/.test(code)}`).toBe(`${file}: false`);
  }
});
