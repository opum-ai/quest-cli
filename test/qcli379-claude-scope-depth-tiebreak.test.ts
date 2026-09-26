import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * QCLI-379 (ruling 29): between two applicable Claude rows of the SAME scope,
 * the deeper projectPath decides, whatever order `claude plugin list --json`
 * lists them in. Measured at origin/dev f21783a: an enabled local row for
 * <outer> listed before a disabled one for <outer>/inner read `installed` at
 * <outer>/inner; the reverse order read `disabled`. lore-cli fixed the same
 * tie in dc09ca98 (opum-ai/lore-cli#291).
 *
 * Hermetic: a fake `claude` on PATH serves the listing.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

let base: string;
let outer: string;
let inner: string;
let bin: string;

beforeEach(async () => {
  base = await realpath(await mkdtemp(join(tmpdir(), "qcli379-")));
  outer = join(base, "outer");
  inner = join(outer, "inner");
  bin = join(base, ".fake-bin");
  await mkdir(inner, { recursive: true });
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: inner });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(base, { recursive: true, force: true });
});

type Row = { scope: string; enabled: boolean; projectPath?: string };

async function stateAt(cwd: string, rows: readonly Row[]) {
  const listing = join(bin, "claude.listing");
  await writeFile(
    listing,
    JSON.stringify(
      rows.map((row) => ({ id: "opum-quest@opum", version: "1", ...row })),
    ),
  );
  const script = `#!/bin/sh
if [ "$1 $2 $3" = "plugin list --json" ]; then cat "${listing}"; exit 0; fi
exit 0
`;
  await writeFile(join(bin, "claude"), script);
  await chmod(join(bin, "claude"), 0o755);
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
  };
  delete env.QUEST_AGENT_PLUGINS;
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn(
    [
      process.execPath,
      source,
      "agents",
      "--check",
      "--target",
      "claude",
      "--json",
    ],
    { cwd, stdout: "pipe", stderr: "pipe", env },
  );
  const stdout = await new Response(child.stdout).text();
  expect(await child.exited).toBe(0);
  const plugin = JSON.parse(stdout).data.plugin;
  return { state: plugin.state, scope: plugin.scope };
}

/** Both list orders must give the same answer. */
async function bothOrders(cwd: string, a: Row, b: Row) {
  return {
    ab: await stateAt(cwd, [a, b]),
    ba: await stateAt(cwd, [b, a]),
  };
}

test("an enabled ancestor local row does not mask a disabled deeper one, in either order", async () => {
  const result = await bothOrders(
    inner,
    { scope: "local", enabled: true, projectPath: outer },
    { scope: "local", enabled: false, projectPath: inner },
  );
  expect(result).toEqual({
    ab: { state: "disabled", scope: "local" },
    ba: { state: "disabled", scope: "local" },
  });
});

test("a disabled ancestor local row does not mask an enabled deeper one, in either order", async () => {
  // The mirror case: depth decides, not "disabled wins".
  const result = await bothOrders(
    inner,
    { scope: "local", enabled: false, projectPath: outer },
    { scope: "local", enabled: true, projectPath: inner },
  );
  expect(result).toEqual({
    ab: { state: "installed", scope: "local" },
    ba: { state: "installed", scope: "local" },
  });
});

test("a same-scope row with no projectPath is the least specific, in either order", async () => {
  const result = await bothOrders(
    inner,
    { scope: "project", enabled: true },
    { scope: "project", enabled: false, projectPath: inner },
  );
  expect(result).toEqual({
    ab: { state: "disabled", scope: "project" },
    ba: { state: "disabled", scope: "project" },
  });
});

test("depth breaks ties only within a scope: a local row still beats a deeper project row", async () => {
  const result = await bothOrders(
    inner,
    { scope: "local", enabled: true, projectPath: outer },
    { scope: "project", enabled: false, projectPath: inner },
  );
  expect(result).toEqual({
    ab: { state: "installed", scope: "local" },
    ba: { state: "installed", scope: "local" },
  });
});
