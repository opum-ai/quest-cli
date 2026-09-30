// How the qualification scripts reach `npm` on Windows (QCLI-426).
//
// Deliberately its own module, with no top-level side effects: prepublish.mjs
// runs its gates at import time, so a test cannot import the helper from
// there without running a full candidate qualification. This mirrors
// registry-visibility.mjs and version-parity.mjs, which exist for the same
// reason.

import { existsSync } from "node:fs";

/** Default extension search order, matching what cmd.exe does. */
const DEFAULT_PATHEXT = ".COM;.EXE;.BAT;.CMD";

/**
 * Windows environment variables are case-insensitive, so the real name may be
 * `Path` or `PATH` depending on who set it. Reading only the uppercase spelling
 * would silently fall back to the bare name and reproduce the failure this
 * module exists to prevent, so the lookup is case-insensitive.
 */
function envValue(env, name) {
  if (env[name] !== undefined) return env[name];
  const key = Object.keys(env).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key === undefined ? undefined : env[key];
}

/**
 * The absolute path of npm's Windows shim, or the bare name when it cannot be
 * found.
 *
 * cmd.exe resolves a bare `npm.cmd` well enough to EXECUTE it, but the batch
 * file's own `%~dp0` then came out as the current directory rather than npm's
 * install directory -- measured on run 36695719909, where npm reported it could
 * not load `<cwd>\node_modules\npm\bin\npm-cli.js`. Handing cmd an absolute
 * path removes the ambiguity: `%~dp0` can only be the directory the shim is
 * actually in.
 *
 * Only npm is resolved, deliberately: this module exists for that one call, and
 * a name parameter would put a bare `"npm"` in a call position where
 * test/qcli400-registry-pins.test.ts -- which is right to treat a quoted npm
 * opening a call's arguments as a spawn -- would read it as one.
 *
 * `env` and `exists` are parameters so the search is testable off Windows.
 */
export function resolveShim(env = process.env, exists = existsSync) {
  const extensions = (envValue(env, "PATHEXT") ?? DEFAULT_PATHEXT)
    .split(";")
    .filter(Boolean);
  for (const dir of (envValue(env, "PATH") ?? "").split(";").filter(Boolean))
    for (const extension of extensions) {
      const candidate = `${dir.replace(/[\\/]+$/, "")}\\npm${extension.toLowerCase()}`;
      if (exists(candidate)) return candidate;
    }
  return "npm";
}

/**
 * On Windows `npm` is the `npm.cmd` batch shim, and handing a `.cmd` straight
 * to `execFile` now fails `EINVAL`: spawn refuses a batch file without a shell
 * since the hardening that followed CVE-2024-27980 (QCLI-426). Bun aligned
 * with it in the 1.4.x line, which is why this surfaced on the move to 1.4.2
 * and not before -- the identical script passes on 1.3.14.
 *
 * `cmd.exe` runs the shim. Every argument is quoted HERE rather than left to
 * be concatenated unquoted, which is the whole reason the shell option is the
 * wrong fix: it joins arguments with spaces and escapes nothing (DEP0190), so
 * any path containing a space silently becomes two arguments. `verbatim` turns
 * off node's own quoting pass, because the string is already a command line.
 * POSIX is untouched: `npm` is an ordinary executable there.
 *
 * `platform` defaults to the running one; it is a parameter so the win32 shape
 * can be asserted from any host, which is the only verification available
 * without a Windows runner.
 */
export function spawnTarget(
  file,
  args,
  platform = process.platform,
  env = process.env,
  exists = existsSync,
) {
  if (platform !== "win32" || file !== "npm")
    return { executable: file, argv: args, verbatim: false };
  const line = [resolveShim(env, exists), ...args]
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(" ");
  return {
    executable: envValue(env, "ComSpec") ?? "cmd.exe",
    argv: ["/d", "/s", "/c", `"${line}"`],
    verbatim: true,
  };
}
