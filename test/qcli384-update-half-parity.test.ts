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
import { codexMarketplaceNotice } from "../src/application/agents/agent-plugins.ts";

/**
 * QCLI-384: the update half of `agents --update-instructions` matches
 * lore-cli LCLI-593 (46133fc0, opum-ai/lore-cli#297). Every not-run report
 * says why; the Codex detail is worded by how far the update got; the update
 * deadline has its own override; and the argv run and the command printed come
 * from one function. Strings are lore's with its command and its own name
 * swapped for quest's (ruled on QCLI-383).
 *
 * Hermetic: fake `claude` and `codex` on PATH; every call is logged.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

let root: string;
let bin: string;
let log: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "qcli384-")));
  bin = join(root, ".fake-bin");
  log = join(root, ".fake-calls.log");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A fake runtime CLI serving `listing` for `plugin list --json`. `steps`
 * maps a call's argument string to a shell fragment; unlisted calls exit 0. */
async function fake(
  runtime: "claude" | "codex",
  listing: unknown,
  steps: Record<string, string> = {},
) {
  const file = join(bin, `${runtime}.listing`);
  await writeFile(file, JSON.stringify(listing));
  const cases = Object.entries(steps)
    .map(([args, body]) => `  "${args}") ${body} ;;`)
    .join("\n");
  const script = `#!/bin/sh
echo "${runtime} $*" >> "${log}"
if [ "$1 $2 $3" = "plugin list --json" ]; then cat "${file}"; exit 0; fi
case "$*" in
${cases}
esac
exit 0
`;
  await writeFile(join(bin, runtime), script);
  await chmod(join(bin, runtime), 0o755);
}

async function plugin(
  arguments_: readonly string[],
  extraEnv: Record<string, string> = {},
) {
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    PATH: `${bin}:/usr/bin:/bin`,
    ...extraEnv,
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

const codexInstalled = {
  installed: [{ pluginId: "opum-quest@opum", enabled: true, version: "1" }],
  available: [],
};
const claudeRow = (enabled: boolean) => [
  { id: "opum-quest@opum", scope: "user", enabled, version: "1" },
];
const update = (target?: string) =>
  plugin(["--update-instructions", ...(target ? ["--target", target] : [])]);

// --- Every not-run report says why (lore notRunDetail at 46133fc0) ---------

test("a bare call names no runtime, and says which call would update it", async () => {
  await fake("codex", codexInstalled);
  expect(await update()).toMatchObject({
    state: "installed",
    update: "not-run",
    updateDetail:
      "this call named no runtime, so it updates none; `quest agents --update-instructions --target codex` updates this one",
  });
  expect(await calls()).toEqual(["codex plugin list --json"]);
});

test("a disabled plugin is never enabled, and the detail says so", async () => {
  await fake("claude", claudeRow(false));
  expect(await update("claude")).toMatchObject({
    state: "disabled",
    update: "not-run",
    updateDetail:
      "quest agents never enables a disabled plugin; enable it with the remedy, then update",
  });
  expect(await calls()).toEqual(["claude plugin list --json"]);
});

test("a missing plugin is never installed, and the detail says so", async () => {
  await fake("claude", []);
  expect(await update("claude")).toMatchObject({
    state: "not-installed",
    update: "not-run",
    updateDetail:
      "quest agents never installs a plugin; install it with the remedy",
  });
  expect(await calls()).toEqual(["claude plugin list --json"]);
});

test("an unreadable state runs nothing, and the detail says so", async () => {
  // No fake claude on PATH: the runtime CLI is absent.
  expect(await update("claude")).toMatchObject({
    state: "not-detectable",
    update: "not-run",
    updateDetail: "the plugin state could not be read, so nothing was run",
  });
});

// --- The Codex detail follows how far the update got -----------------------

test("Codex: both steps succeed, so the all-plugins notice is said", async () => {
  await fake("codex", codexInstalled);
  const report = await update("codex");
  expect(report).toMatchObject({ update: "ran", updateOk: true });
  expect(report.updateDetail).toBe(
    `codex plugin marketplace upgrade opum && codex plugin add opum-quest@opum; note: ${codexMarketplaceNotice}`,
  );
  expect(await calls()).toEqual([
    "codex plugin list --json",
    "codex plugin marketplace upgrade opum",
    "codex plugin add opum-quest@opum",
  ]);
});

test("Codex: the upgrade fails, so nothing is claimed refreshed and the add never runs", async () => {
  await fake("codex", codexInstalled, {
    "plugin marketplace upgrade opum": "echo upgrade-broke >&2; exit 3",
  });
  const report = await update("codex");
  expect(report).toMatchObject({ update: "ran", updateOk: false });
  expect(report.updateDetail).toBe(
    "codex plugin marketplace upgrade opum exited 3: upgrade-broke",
  );
  expect(report.updateDetail).not.toContain("note:");
  expect(await calls()).toEqual([
    "codex plugin list --json",
    "codex plugin marketplace upgrade opum",
  ]);
});

test("Codex: the upgrade succeeds and the add fails, so the refresh is said to have happened", async () => {
  await fake("codex", codexInstalled, {
    "plugin add opum-quest@opum": "echo add-broke >&2; exit 4",
  });
  const report = await update("codex");
  expect(report).toMatchObject({ update: "ran", updateOk: false });
  expect(report.updateDetail).toBe(
    "codex plugin add opum-quest@opum exited 4: add-broke; note: `codex plugin marketplace upgrade opum` had already succeeded, so every opum plugin installed in Codex (opum-lore included) was refreshed; only re-adding opum-quest@opum failed",
  );
});

test("the Codex notice is lore-cli's at 46133fc0 with the plugin names swapped", () => {
  const lore =
    "`codex plugin marketplace upgrade opum` refreshes every opum plugin installed in Codex (opum-quest included), not only opum-lore@opum";
  expect(codexMarketplaceNotice).toBe(
    lore
      .replace("(opum-quest included)", "(opum-lore included)")
      .replace("not only opum-lore@opum", "not only opum-quest@opum"),
  );
});

// --- The update deadline has its own override -------------------------------

test("QUEST_AGENT_PLUGINS_UPDATE_TIMEOUT_MS bounds each update step", async () => {
  await fake("claude", claudeRow(true), {
    "plugin update opum-quest@opum --scope user": "sleep 5",
  });
  const started = Date.now();
  const report = await plugin(["--update-instructions", "--target", "claude"], {
    QUEST_AGENT_PLUGINS_UPDATE_TIMEOUT_MS: "300",
  });
  expect(Date.now() - started).toBeLessThan(4000);
  expect(report).toMatchObject({
    update: "ran",
    updateOk: false,
    updateDetail:
      "claude plugin update opum-quest@opum --scope user did not finish within 0.3s.",
  });
});

test("the list override does not shorten the update deadline", async () => {
  await fake("claude", claudeRow(true), {
    "plugin update opum-quest@opum --scope user": "sleep 1",
  });
  const report = await plugin(["--update-instructions", "--target", "claude"], {
    QUEST_AGENT_PLUGINS_TIMEOUT_MS: "500",
  });
  expect(report).toMatchObject({ update: "ran", updateOk: true });
});

// --- One function yields both the argv run and the command printed ---------

test("a failed update prints exactly the argv it ran", async () => {
  await fake("claude", claudeRow(true), {
    "plugin update opum-quest@opum --scope user": "exit 7",
  });
  const report = await update("claude");
  expect(report).toMatchObject({ update: "ran", updateOk: false });
  const ran = (await calls()).filter((call) => !call.endsWith("list --json"));
  expect(ran).toEqual([report.remedy]);
});

test("a failed Codex update prints exactly the steps a full run would take", async () => {
  await fake("codex", codexInstalled, {
    "plugin add opum-quest@opum": "exit 4",
  });
  const report = await update("codex");
  const ran = (await calls()).filter((call) => !call.endsWith("list --json"));
  expect(report.remedy).toBe(ran.join(" && "));
});
