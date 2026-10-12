import { expect, test } from "bun:test";
import { join } from "node:path";

/**
 * QCLI-471. `bun run check` must run every nested command under the bun that
 * started the run, not under whatever `bun` resolves to on PATH.
 *
 * The defect: launched by an absolute-path bun -- the declared packageManager,
 * e.g. /opt/homebrew/Cellar/bun/1.4.2/bin/bun -- `bun run check` still ran its
 * nested `bun test` under PATH's bun, 1.3.14 on the workstation this was found
 * on. test/qcli411-bun-declare-binding.test.ts then failed and a clean tree
 * exited 1: a command meant to assert the declared runtime reddened because of
 * an undeclared ambient one.
 *
 * The fix names the runner as "$npm_execpath" rather than a bare `bun`. Bun
 * sets that variable to the executing binary's absolute path and re-exports it
 * to every nested script, so the whole chain stays on the declaring bun. These
 * tests hold that rule, so the nested runner cannot silently fall back to
 * PATH's bun again.
 */

const REPO = new URL("..", import.meta.url).pathname;

// A bare `bun` token: at the start of a script, or after a shell separator,
// and ended by whitespace or the end of the string. That shape is exactly a
// PATH lookup. `"$npm_execpath"` carries no `bun` token; a `${npm_execpath:-bun}`
// fallback would reintroduce one and is deliberately not written anywhere.
const BARE_BUN = /(?:^|[\s&|;(])bun(?:\s|$)/;

const readScripts = async (): Promise<Record<string, string>> => {
  const pkg = (await Bun.file(join(REPO, "package.json")).json()) as {
    scripts?: Record<string, string>;
  };
  return pkg.scripts ?? {};
};

test("no package script invokes a bare `bun` (QCLI-471)", async () => {
  const scripts = await readScripts();
  const names = Object.keys(scripts).sort();
  // A check that read nothing must not pass.
  expect(names.length).toBeGreaterThan(0);

  const offenders = names.filter((name) => BARE_BUN.test(scripts[name] ?? ""));
  expect(offenders).toEqual([]);
});

test("the nested test runner in `bun run check` uses the declared bun (QCLI-471)", async () => {
  const scripts = await readScripts();
  const check = scripts.check ?? "";
  const runTest = scripts.test ?? "";

  // The chain that carried the defect: `check` -> `test` -> the runner.
  expect(check).toContain("run test");
  expect(check).toContain("$npm_execpath");
  expect(BARE_BUN.test(check)).toBe(false);

  // The final command of `test` is the runner that reddened under PATH's bun.
  expect(runTest).toMatch(/npm_execpath"?\s+test\s/);
  expect(runTest).toContain("--path-ignore-patterns='tests/**'");
  expect(BARE_BUN.test(runTest)).toBe(false);
});
