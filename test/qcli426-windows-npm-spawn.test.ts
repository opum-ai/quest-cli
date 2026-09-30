import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  resolveShim,
  spawnTarget,
} from "../scripts/qualification/spawn-target.mjs";

/**
 * QCLI-426. The 0.12.0 tag-time qualification failed both Windows legs with
 * `spawn npm.cmd EINVAL`, leaving no native-execution receipt and so no way to
 * stage. The npm spawn path and the Windows runner images are unchanged since
 * the v0.11.0 run that passed on 2026-09-27, so the only variable between the
 * two runs is the pinned Bun, 1.3.14 -> 1.4.2. Bun aligned with the spawn
 * hardening that followed CVE-2024-27980, which refuses a `.cmd` handed to
 * spawn without a shell. (An earlier revision said the script and gates were
 * byte-identical; that is false -- prepublish.mjs gained a REGISTRY_PINS
 * import and a breaking_bump gate after v0.11.0, neither on the spawn path.)
 *
 * The first attempt at this fix ran npm.cmd successfully but under the wrong
 * `%~dp0`: run 36695719909 reported it could not load
 * `<cwd>\node_modules\npm\bin\npm-cli.js`, i.e. the batch file's own directory
 * came out as the current directory. Hence the absolute-path resolution below,
 * which is what the second and third tests pin.
 *
 * The Windows branch cannot be exercised on this host, so it is asserted as a
 * value here. That is the whole point of `platform` being a parameter.
 */

const repo = join(import.meta.dir, "..");
const NPM_SHIM = "C:\\Program Files\\nodejs\\npm.cmd";
const ENV = {
  PATH: "C:\\Windows\\system32;C:\\Program Files\\nodejs",
  PATHEXT: ".COM;.EXE;.BAT;.CMD",
  ComSpec: "C:\\Windows\\system32\\cmd.exe",
};
const found = (path: string) => path === NPM_SHIM;

/**
 * What cmd.exe is left with after /s strips the first and last quote.
 *
 * LIMIT, review finding 3a: this encodes the same `/s` model the
 * implementation assumes, so it cannot catch a shared model error -- both
 * sides would agree and stay green. The model was checked independently
 * against Microsoft's `cmd` reference (which documents /s as stripping the
 * first and last quote around the string and leaving the rest unchanged), not
 * against this implementation. It is a limit, not a defect.
 */
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

test("win32 hands cmd.exe the ABSOLUTE shim path, not a bare name", () => {
  // The measured failure: a bare `npm.cmd` left the batch file's own %~dp0 as
  // the current directory, so npm looked for its CLI under the repository.
  const target = spawnTarget("npm", ["pack", "--json"], "win32", ENV, found);
  // A literal, not `process.env.ComSpec ?? "cmd.exe"`: that expression is the
  // implementation's own, so on a host without ComSpec -- this one -- it could
  // not tell the fallback from the literal, and read as asserting more than it
  // did. ENV sets ComSpec, so this also pins that the value is used.
  expect(target.executable).toBe("C:\\Windows\\system32\\cmd.exe");
  expect(target.verbatim).toBe(true);
  expect(target.argv.slice(0, 3)).toEqual(["/d", "/s", "/c"]);
  expect(afterStrip(target.argv)).toBe(`"${NPM_SHIM}" "pack" "--json"`);
});

test("win32 falls back to the bare name when no shim is on PATH", () => {
  const target = spawnTarget("npm", ["pack"], "win32", ENV, () => false);
  expect(afterStrip(target.argv)).toBe('"npm" "pack"');
});

test("resolveShim searches PATHEXT in order and tolerates a trailing separator", () => {
  const seen: string[] = [];
  const path = resolveShim(
    { PATH: "C:\\a\\;C:\\b", PATHEXT: ".EXE;.CMD" },
    (candidate) => {
      seen.push(candidate);
      return candidate === "C:\\b\\npm.cmd";
    },
  );
  expect(path).toBe("C:\\b\\npm.cmd");
  // Probed in order, and only until the hit -- EXE before CMD, directory order
  // preserved.
  expect(seen).toEqual([
    "C:\\a\\npm.exe",
    "C:\\a\\npm.cmd",
    "C:\\b\\npm.exe",
    "C:\\b\\npm.cmd",
  ]);
});

test("a lowercase env spelling still resolves — Windows names are case-insensitive", () => {
  // Reading only the uppercase spelling would silently fall back to the bare
  // name, reproducing exactly the failure this resolution exists to prevent.
  const target = spawnTarget(
    "npm",
    ["pack"],
    "win32",
    { Path: "C:\\Program Files\\nodejs", PathExt: ".CMD" },
    found,
  );
  expect(afterStrip(target.argv)).toBe(`"${NPM_SHIM}" "pack"`);
});

test("a path containing a space stays ONE argument — the failure mode the shell option has", () => {
  // The shell option joins arguments with spaces and escapes nothing (DEP0190),
  // so this path would become two arguments and npm would take the tail as a
  // package spec. Quoting here is what makes the difference observable.
  const cache = "C:\\Users\\Some One\\AppData\\Local\\Temp\\npm-cache";
  const target = spawnTarget(
    "npm",
    ["pack", "--cache", cache],
    "win32",
    ENV,
    found,
  );
  expect(afterStrip(target.argv)).toBe(
    `"${NPM_SHIM}" "pack" "--cache" "${cache}"`,
  );
});

test("an embedded quote is doubled, so an argument cannot break out of its own quoting", () => {
  const target = spawnTarget("npm", ['a"b'], "win32", ENV, found);
  expect(afterStrip(target.argv)).toBe(`"${NPM_SHIM}" "a""b"`);
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
    // `\b` before the key and optional quotes around it, so a quoted key
    // ("shell": true) is caught and `nutshell:` is not.
    expect(`${file}: ${/\bshell["']?\s*:/.test(code)}`).toBe(`${file}: false`);
  }
});
