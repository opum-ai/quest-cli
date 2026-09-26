import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { managedScopeRemedy } from "../src/application/agents/agent-plugins.ts";

/**
 * QCLI-381, ruling 28 (opum-doc ADR Amendment 6, 44326c5): Claude scopes rank
 * managed > local > project > user > synced. Managed is administrator policy
 * the user cannot override, so an applicable managed row decides over every
 * other scope, applies to every project, and is NEVER updated: no
 * `--scope managed` reaches a remedy or an argv, and the remedy is the prose
 * agreed with lore-cli (LCLI-604) under ruling (d). Measured at origin/dev
 * 2521102: a disabled local row for this project masked an enabled managed
 * row, and an installed managed row got `claude plugin update ... --scope
 * managed`.
 *
 * Hermetic: a fake `claude` on PATH serves the listing and logs every call.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

let root: string;
let bin: string;
let log: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "qcli381-")));
  bin = join(root, ".fake-bin");
  log = join(root, ".fake-calls.log");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

type Row = { scope: string; enabled: boolean; projectPath?: string };

async function listing(rows: readonly Row[]) {
  const file = join(bin, "claude.listing");
  await writeFile(
    file,
    JSON.stringify(
      rows.map((row) => ({ id: "opum-quest@opum", version: "1", ...row })),
    ),
  );
  const script = `#!/bin/sh
echo "claude $*" >> "${log}"
if [ "$1 $2 $3" = "plugin list --json" ]; then cat "${file}"; exit 0; fi
exit 0
`;
  await writeFile(join(bin, "claude"), script);
  await chmod(join(bin, "claude"), 0o755);
}

async function plugin(...arguments_: readonly string[]) {
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
  };
  delete env.QUEST_AGENT_PLUGINS;
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn(
    [process.execPath, source, "agents", ...arguments_, "--json"],
    { cwd: root, stdout: "pipe", stderr: "pipe", env },
  );
  const stdout = await new Response(child.stdout).text();
  await child.exited;
  return JSON.parse(stdout).data.plugin;
}

async function calls(): Promise<string[]> {
  try {
    return (await readFile(log, "utf8")).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

const check = () => plugin("--check", "--target", "claude");

test("the managed remedy is the string agreed with lore-cli, plugin id swapped", () => {
  // LCLI-604 implementation note at lore-cli 6f6a527c (#301), opum-lore@opum
  // there. One string for both states, and no OS path.
  expect(managedScopeRemedy).toBe(
    "managed by your Claude Code administrator: opum-quest@opum is set in the managed settings, which only an administrator can change",
  );
});

for (const order of ["managed first", "managed last"] as const) {
  const arrange = (managed: Row, other: Row) =>
    order === "managed first" ? [managed, other] : [other, managed];

  test(`an enabled managed row decides over a disabled local row for this project (${order})`, async () => {
    await listing(
      arrange(
        { scope: "managed", enabled: true },
        { scope: "local", enabled: false, projectPath: root },
      ),
    );
    expect(await check()).toMatchObject({
      state: "installed",
      scope: "managed",
      remedy: managedScopeRemedy,
    });
  });

  test(`a disabled managed row decides over an enabled local row for this project (${order})`, async () => {
    await listing(
      arrange(
        { scope: "managed", enabled: false },
        { scope: "local", enabled: true, projectPath: root },
      ),
    );
    expect(await check()).toMatchObject({
      state: "disabled",
      scope: "managed",
      remedy: managedScopeRemedy,
    });
  });

  for (const scope of ["project", "user", "synced"]) {
    test(`a disabled managed row decides over an enabled ${scope} row (${order})`, async () => {
      await listing(
        arrange(
          { scope: "managed", enabled: false },
          {
            scope,
            enabled: true,
            ...(scope === "project" ? { projectPath: root } : {}),
          },
        ),
      );
      expect(await check()).toMatchObject({
        state: "disabled",
        scope: "managed",
      });
    });
  }
}

test("a managed row applies to every project, even one carrying a foreign projectPath", async () => {
  await listing([
    { scope: "user", enabled: true },
    {
      scope: "managed",
      enabled: false,
      projectPath: join(root, "some-other-project"),
    },
  ]);
  expect(await check()).toMatchObject({ state: "disabled", scope: "managed" });
});

test("an installed managed row is never updated: only the list runs", async () => {
  await listing([
    { scope: "managed", enabled: true },
    { scope: "user", enabled: true },
  ]);
  const report = await plugin("--update-instructions", "--target", "claude");
  expect(report).toMatchObject({
    state: "installed",
    scope: "managed",
    update: "not-run",
    updateDetail:
      "the deciding row is managed by your Claude Code administrator, so it is never updated",
    remedy: managedScopeRemedy,
  });
  expect(report.updateOk).toBeUndefined();
  expect(await calls()).toEqual(["claude plugin list --json"]);
});

test("a disabled managed row is not enabled or updated: only the list runs", async () => {
  await listing([{ scope: "managed", enabled: false }]);
  const report = await plugin("--update-instructions", "--target", "claude");
  expect(report).toMatchObject({
    state: "disabled",
    scope: "managed",
    update: "not-run",
    remedy: managedScopeRemedy,
  });
  expect(await calls()).toEqual(["claude plugin list --json"]);
});

test("--scope managed reaches no remedy or argv in any state", async () => {
  for (const enabled of [true, false]) {
    await rm(log, { force: true });
    await listing([{ scope: "managed", enabled }]);
    for (const report of [
      await check(),
      await plugin("--update-instructions", "--target", "claude"),
    ])
      expect(JSON.stringify(report)).not.toContain("--scope managed");
    for (const call of await calls()) expect(call).not.toContain("managed");
  }
});

test("below managed, the order is unchanged: local decides over user", async () => {
  await listing([
    { scope: "user", enabled: true },
    { scope: "local", enabled: false, projectPath: root },
  ]);
  expect(await check()).toMatchObject({ state: "disabled", scope: "local" });
});
