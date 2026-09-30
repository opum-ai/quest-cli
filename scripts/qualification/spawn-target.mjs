// How the qualification scripts reach `npm` on Windows (QCLI-426).
//
// Deliberately its own module, with no top-level side effects: prepublish.mjs
// runs its gates at import time, so a test cannot import the helper from
// there without running a full candidate qualification. This mirrors
// registry-visibility.mjs and version-parity.mjs, which exist for the same
// reason.

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
export function spawnTarget(file, args, platform = process.platform) {
  if (platform !== "win32" || file !== "npm")
    return { executable: file, argv: args, verbatim: false };
  const line = ["npm.cmd", ...args]
    .map((value) => `"${String(value).replaceAll('"', '""')}"`)
    .join(" ");
  return {
    executable: process.env.ComSpec ?? "cmd.exe",
    argv: ["/d", "/s", "/c", `"${line}"`],
    verbatim: true,
  };
}
