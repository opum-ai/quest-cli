import { expect, test } from "bun:test";
import { join } from "node:path";

/**
 * QCLI-492. Nothing `bun run check` reaches may resolve a `bun` from PATH.
 *
 * QCLI-471 pinned package.json's scripts to "$npm_execpath", which covers the
 * shell strings. Two pieces of the SAME bare-PATH-lookup class were left open,
 * because they are not in package.json:
 *
 * 1. the nested `bun` spawns inside the scripts the check chain itself runs --
 *    the three named below;
 * 2. `bunx`, which QCLI-471's guard deliberately exempted even though it is a
 *    PATH-resolved executable like any other.
 *
 * The offender is a QUOTED executable name -- `spawn("bun", ...)`. A file that
 * names the declaring runtime carries no such literal, so the two assertions
 * below are complements: no bare literal, and the declaring runtime is named.
 */

const REPO = new URL("..", import.meta.url).pathname;

// Every script reachable from `bun run check` that spawns a nested `bun`.
const CHECK_CHAIN_SCRIPTS = [
  "scripts/test-repository-check-scope.mjs",
  "scripts/qualification/prepublish.mjs",
  "scripts/deliver-package-artifacts.mjs",
] as const;

test("no check-chain script spawns a bare `bun`/`bunx` (QCLI-492)", async () => {
  // A check that read nothing must not pass.
  expect(CHECK_CHAIN_SCRIPTS.length).toBeGreaterThan(0);

  for (const file of CHECK_CHAIN_SCRIPTS) {
    const source = await Bun.file(join(REPO, file)).text();
    // A quoted `bun`/`bunx` -- `spawn("bun", ...)`, `run('bunx', ...)` -- is the
    // PATH lookup this task removes. Only quote characters are considered, so
    // prose in a comment that names the literal (in backticks, say) is not a
    // false positive.
    const barePathLookup = /(["'])bunx?\1/.test(source);
    const namesDeclaringRuntime = /npm_execpath|execPath/.test(source);
    expect(
      { file, barePathLookup, namesDeclaringRuntime },
      `${file}: must spawn the declaring runtime, never a quoted "bun"/"bunx"`,
    ).toEqual({ file, barePathLookup: false, namesDeclaringRuntime: true });
  }
});
