#!/usr/bin/env bun
import { readFile } from "node:fs/promises";
const fixture = JSON.parse(
  await readFile(new URL("./conformance.json", import.meta.url), "utf8"),
);
const executable = process.env.QUEST_EXECUTABLE ?? "quest";
const executableArgs = JSON.parse(process.env.QUEST_EXECUTABLE_ARGS ?? "[]");

async function run(argv) {
  const child = Bun.spawn([executable, ...executableArgs, ...argv], {
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });
  const result = {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
  if (result.exitCode !== 0)
    throw new Error(`Quest command failed: ${argv.join(" ")}\n${result.stderr}`);
  return result;
}

function envelope(result, kind) {
  const parsed = JSON.parse(result.stdout);
  if (parsed.schemaVersion !== fixture.contractVersion || parsed.kind !== kind)
    throw new Error(`Expected ${kind} envelope.`);
  return parsed.data;
}

if ((await run(["--version"])).stdout.trim() !== fixture.questVersion)
  throw new Error("Quest version does not match fixture.");
const manifest = envelope(await run(["manifest", "--json"]), "manifest.registry");
for (const command of fixture.manifest.data.commands) {
  if (!manifest.commands.some((actual) => actual.name === command.name && actual.kind === command.kind && actual.schemaVersion === command.schemaVersion && actual.mutates === command.mutates))
    throw new Error(`Manifest does not advertise ${command.name}.`);
}
const created = envelope(
  await run(["task", "create", fixture.task.title, "--actor", "fixture-human", "--actor-kind", "human", "--json"]),
  "task.created",
);
if (!/^T-[1-9][0-9]*$/.test(created.id)) throw new Error("Created task has no canonical id.");
const viewed = envelope(await run(["task", "view", created.id, "--json"]), "task.view");
if (viewed.title !== fixture.task.title) throw new Error("Task view is lossy.");
envelope(await run(["task", "list", "--json"]), "task.list");
envelope(await run(["search", fixture.task.title, "--json"]), "task.search");
envelope(await run(["task", "status-flow", "--json"]), "task.status-flow");
envelope(await run(["task", "edit", created.id, "--add-label", "fixture", "--actor", "fixture-human", "--actor-kind", "human", "--json"]), "task.updated");

process.stdout.write(`Tracker conformance fixture v${fixture.fixtureVersion} passed.\n`);
