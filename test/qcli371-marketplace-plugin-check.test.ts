import { afterEach, beforeEach, expect, test } from "bun:test";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * QCLI-371 (opum-doc ADR "Distribute lore and quest agent skills through the
 * plugin marketplace", rulings (a)-(c), Amendment 1 rulings 18-19,
 * Amendment 2 rulings 20-22). init and `agents --check` detect the
 * opum-quest plugin through each runtime's own `plugin list --json` and
 * report one of four states without mutating anything;
 * `agents --update-instructions` runs the update for an installed plugin and
 * never installs or enables one.
 *
 * Hermetic: fake `claude` and `codex` executables on PATH serve a scripted
 * listing and append every invocation to a log, so each case asserts what was
 * RUN as well as what was reported. The real agent CLIs are never reached.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

const claudeRow = (enabled: boolean) =>
  JSON.stringify([
    { id: "other@opum", version: "1.0.0", enabled: true },
    { id: "opum-quest@opum", version: "0.9.9", enabled, scope: "user" },
  ]);
// Shape measured from codex-cli 0.155.1 in an isolated CODEX_HOME.
const codexRow = (enabled: boolean) =>
  JSON.stringify({
    installed: [
      {
        pluginId: "opum-quest@opum",
        name: "opum-quest",
        marketplaceName: "opum",
        version: "0.9.9",
        installed: true,
        enabled,
      },
    ],
    available: [],
  });

let root: string;
let bin: string;
let log: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "qcli371-"));
  bin = join(root, ".fake-bin");
  log = join(root, ".fake-calls.log");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A fake runtime CLI: `plugin list --json` prints `listing` (or exits
 * `listExit`), every other call exits `otherExit`. All calls are logged. */
async function fake(
  runtime: "claude" | "codex",
  options: { listing?: string; listExit?: number; otherExit?: number },
) {
  const listingFile = join(bin, `${runtime}.listing`);
  await writeFile(listingFile, options.listing ?? "");
  const script = `#!/bin/sh
echo "${runtime} $*" >> "${log}"
if [ "$1 $2 $3" = "plugin list --json" ]; then
  cat "${listingFile}"
  exit ${options.listExit ?? 0}
fi
exit ${options.otherExit ?? 0}
`;
  const path = join(bin, runtime);
  await writeFile(path, script);
  await chmod(path, 0o755);
}

async function quest(...arguments_: readonly string[]) {
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
  };
  delete env.QUEST_AGENT_PLUGINS;
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn([process.execPath, source, ...arguments_], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
    env,
  });
  const result = {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
  return { ...result, json: JSON.parse(result.stdout || result.stderr) };
}

async function calls(): Promise<string[]> {
  try {
    return (await readFile(log, "utf8")).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

for (const runtime of ["claude", "codex"] as const) {
  const row = runtime === "claude" ? claudeRow : codexRow;

  test(`${runtime}: --check reports all four states and never runs anything but the list`, async () => {
    const cases = [
      { listing: row(true), expected: "installed" },
      { listing: row(false), expected: "disabled" },
      {
        listing:
          runtime === "claude" ? "[]" : '{"installed":[],"available":[]}',
        expected: "not-installed",
      },
      { listing: "not json", expected: "not-detectable" },
      { listing: "[]", listExit: 1, expected: "not-detectable" },
    ];
    for (const { expected, ...options } of cases) {
      await fake(runtime, options);
      const result = await quest(
        "agents",
        "--check",
        "--target",
        runtime,
        "--json",
      );
      expect(result.exitCode).toBe(0);
      expect(result.json.data.plugin).toMatchObject({
        runtime,
        id: "opum-quest@opum",
        state: expected,
      });
    }
    expect(
      (await calls()).every((call) => call === `${runtime} plugin list --json`),
    ).toBe(true);
    expect((await calls()).length).toBe(cases.length);
  });

  test(`${runtime}: a disabled plugin is never reported installed, and --check prints the enable remedy`, async () => {
    await fake(runtime, { listing: row(false) });
    const plugin = (
      await quest("agents", "--check", "--target", runtime, "--json")
    ).json.data.plugin;
    expect(plugin.state).toBe("disabled");
    expect(plugin.remedy).toContain(
      runtime === "claude"
        ? "claude plugin enable opum-quest@opum"
        : '[plugins."opum-quest@opum"]',
    );
  });

  test(`${runtime}: --update-instructions RUNS the update for an installed plugin`, async () => {
    await fake(runtime, { listing: row(true) });
    const result = await quest(
      "agents",
      "--update-instructions",
      "--target",
      runtime,
      "--json",
    );
    expect(result.exitCode).toBe(0);
    expect(result.json.data.plugin).toMatchObject({
      state: "installed",
      update: "ran",
      updateOk: true,
    });
    expect(await calls()).toEqual(
      runtime === "claude"
        ? [
            "claude plugin list --json",
            "claude plugin update opum-quest@opum --scope user",
          ]
        : [
            "codex plugin list --json",
            "codex plugin marketplace upgrade opum",
            "codex plugin add opum-quest@opum",
          ],
    );
  });

  test(`${runtime}: a failed update is reported with its command, and the instructions update still succeeds`, async () => {
    await fake(runtime, { listing: row(true), otherExit: 3 });
    const result = await quest(
      "agents",
      "--update-instructions",
      "--target",
      runtime,
      "--json",
    );
    expect(result.exitCode).toBe(0);
    expect(result.json.data.state).toBe("current");
    expect(result.json.data.plugin).toMatchObject({
      update: "ran",
      updateOk: false,
    });
    expect(result.json.data.plugin.remedy).toContain(
      runtime === "claude" ? "claude plugin update" : "codex plugin add",
    );
  });

  test(`${runtime}: --update-instructions never enables a disabled plugin or installs a missing one`, async () => {
    for (const [listing, state] of [
      [row(false), "disabled"],
      [runtime === "claude" ? "[]" : '{"installed":[]}', "not-installed"],
    ] as const) {
      await rm(log, { force: true });
      await fake(runtime, { listing });
      const result = await quest(
        "agents",
        "--update-instructions",
        "--target",
        runtime,
        "--json",
      );
      expect(result.exitCode).toBe(0);
      expect(result.json.data.plugin).toMatchObject({
        state,
        update: "not-run",
      });
      expect(result.json.data.plugin.remedy).toBeString();
      expect(await calls()).toEqual([`${runtime} plugin list --json`]);
    }
  });
}

test("a runtime CLI missing from PATH is not-detectable, never not-installed", async () => {
  const result = await quest(
    "agents",
    "--check",
    "--target",
    "claude",
    "--json",
  );
  expect(result.json.data.plugin).toMatchObject({
    state: "not-detectable",
    reason: "claude was not found on PATH.",
  });
});

test("init reports each selected runtime's plugin, before writing, and runs only the list", async () => {
  await fake("claude", { listing: claudeRow(false) });
  await fake("codex", { listing: codexRow(true) });
  for (const [target, expected] of [
    ["claude", { claude: { state: "disabled" } }],
    ["codex", { codex: { state: "installed" } }],
  ] as const) {
    await rm(join(root, ".quest"), { recursive: true, force: true });
    const result = await quest(
      "init",
      "--agent-instructions",
      "--target",
      target,
      "--json",
    );
    expect(result.exitCode).toBe(0);
    expect(result.json.data.plugins).toMatchObject(expected);
  }
  expect(await calls()).toEqual([
    "claude plugin list --json",
    "codex plugin list --json",
  ]);
});

test("antigravity has no marketplace plugin: no check, no runtime started", async () => {
  await fake("claude", { listing: claudeRow(true) });
  await fake("codex", { listing: codexRow(true) });
  const init = await quest(
    "init",
    "--agent-instructions",
    "--target",
    "antigravity",
    "--json",
  );
  expect(init.json.data).not.toHaveProperty("plugins");
  const check = await quest(
    "agents",
    "--check",
    "--target",
    "antigravity",
    "--json",
  );
  expect(check.json.data).not.toHaveProperty("plugin");
  expect(await calls()).toEqual([]);
});

test("QUEST_AGENT_PLUGINS=off (the suite default) starts no runtime at all", async () => {
  await fake("claude", { listing: claudeRow(true) });
  const env = { ...Bun.env, PATH: `${bin}:/usr/bin:/bin` };
  expect(Bun.env.QUEST_AGENT_PLUGINS).toBe("off");
  const child = Bun.spawn(
    [
      process.execPath,
      source,
      "agents",
      "--update-instructions",
      "--target",
      "claude",
      "--json",
    ],
    { cwd: root, stdout: "pipe", stderr: "pipe", env },
  );
  expect(await child.exited).toBe(0);
  const data = JSON.parse(await new Response(child.stdout).text()).data;
  expect(data.plugin).toMatchObject({
    state: "not-detectable",
    update: "not-run",
  });
  expect(await calls()).toEqual([]);
});

// ---- QCLI-371 review findings and ruling 25 ----

test("ruling 25: a bare --update-instructions names no runtime, so it reports and runs no plugin update", async () => {
  await fake("codex", { listing: codexRow(true) });
  const result = await quest("agents", "--update-instructions", "--json");
  expect(result.exitCode).toBe(0);
  expect(result.json.data.plugin).toMatchObject({
    runtime: "codex",
    state: "installed",
    update: "not-run",
  });
  expect(result.json.data.plugin.remedy).toContain(
    "codex plugin marketplace upgrade opum",
  );
  expect(await calls()).toEqual(["codex plugin list --json"]);
});

test("ruling 25: the Codex update says it refreshed the whole opum marketplace", async () => {
  await fake("codex", { listing: codexRow(true) });
  const result = await quest(
    "agents",
    "--update-instructions",
    "--target",
    "codex",
    "--json",
  );
  expect(result.json.data.plugin.updateDetail).toContain(
    "every opum plugin, including opum-lore",
  );
});

test("claude scope: a local row for ANOTHER project is not this project's install, and is never updated", async () => {
  await fake("claude", {
    listing: JSON.stringify([
      {
        id: "opum-quest@opum",
        scope: "local",
        enabled: true,
        projectPath: "/some/other/project",
      },
    ]),
  });
  const result = await quest(
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--json",
  );
  expect(result.json.data.plugin).toMatchObject({
    state: "not-installed",
    update: "not-run",
  });
  expect(await calls()).toEqual(["claude plugin list --json"]);
});

test("claude scope: this project's disabled local row overrides an enabled user row, in either order", async () => {
  for (const order of ["user-first", "local-first"] as const) {
    const user = { id: "opum-quest@opum", scope: "user", enabled: true };
    const local = {
      id: "opum-quest@opum",
      scope: "local",
      enabled: false,
      projectPath: root,
    };
    await fake("claude", {
      listing: JSON.stringify(
        order === "user-first" ? [user, local] : [local, user],
      ),
    });
    const plugin = (
      await quest("agents", "--check", "--target", "claude", "--json")
    ).json.data.plugin;
    expect({ order, state: plugin.state, scope: plugin.scope }).toEqual({
      order,
      state: "disabled",
      scope: "local",
    });
  }
});

test("codex: a plugin only in available[] is not installed, and a row with no enabled field reads installed (never synthesised as disabled)", async () => {
  await fake("codex", {
    listing: JSON.stringify({
      installed: [],
      available: [{ pluginId: "opum-quest@opum", enabled: true }],
    }),
  });
  expect(
    (await quest("agents", "--check", "--target", "codex", "--json")).json.data
      .plugin.state,
  ).toBe("not-installed");
  await fake("codex", {
    listing: JSON.stringify({
      installed: [{ pluginId: "opum-quest@opum", version: "1.0.0" }],
    }),
  });
  expect(
    (await quest("agents", "--check", "--target", "codex", "--json")).json.data
      .plugin.state,
  ).toBe("installed");
});

test("rows present but none readable (the list shape moved) is not-detectable, never not-installed", async () => {
  await fake("claude", { listing: JSON.stringify([{ name: "opum-quest" }]) });
  await fake("codex", {
    listing: JSON.stringify({ installed: [{ id: "opum-quest@opum" }] }),
  });
  for (const runtime of ["claude", "codex"] as const) {
    const plugin = (
      await quest("agents", "--check", "--target", runtime, "--json")
    ).json.data.plugin;
    expect({ runtime, state: plugin.state }).toEqual({
      runtime,
      state: "not-detectable",
    });
  }
});

test("codex: a non-zero list exit is not-detectable even with a well-formed listing", async () => {
  await fake("codex", { listing: codexRow(true), listExit: 2 });
  const plugin = (
    await quest("agents", "--check", "--target", "codex", "--json")
  ).json.data.plugin;
  expect(plugin.state).toBe("not-detectable");
  expect(plugin.reason).toContain("exited 2");
});
