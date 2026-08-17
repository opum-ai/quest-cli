import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const rootPackage = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
);
const work = await mkdtemp(join(tmpdir(), "quest-packed-"));
const npmCache = join(work, "npm-cache");
const tarballs = [];

function packedEntry(result) {
  return Array.isArray(result) ? result[0] : Object.values(result)[0];
}

try {
  const packed = await Bun.$`npm pack --json --cache ${npmCache}`
    .cwd(root)
    .json();
  const rootTarball = join(root, packedEntry(packed).filename);
  tarballs.push(rootTarball);
  await Bun.$`tar -xzf ${rootTarball} -C ${work}`;
  const quest = join(work, "package", "bin", "quest.cjs");
  const missingPlatform = Bun.spawnSync(["node", quest, "--version"], {
    stderr: "pipe",
  });
  if (
    missingPlatform.exitCode !== 1 ||
    !new TextDecoder()
      .decode(missingPlatform.stderr)
      .includes("optional package @opum-ai/quest-")
  )
    throw new Error("Packed launcher missing-platform diagnostic failed.");
  const platformDirectory = join(
    root,
    "npm",
    `quest-${process.platform}-${process.arch}`,
  );
  const platformPacked = await Bun.$`npm pack --json --cache ${npmCache}`
    .cwd(platformDirectory)
    .json();
  const platformTarball = join(
    platformDirectory,
    packedEntry(platformPacked).filename,
  );
  tarballs.push(platformTarball);
  const platformWork = join(work, "platform");
  await mkdir(platformWork, { recursive: true });
  await Bun.$`tar -xzf ${platformTarball} -C ${platformWork}`;
  await mkdir(join(work, "package", "node_modules", "@opum-ai"), {
    recursive: true,
  });
  await cp(
    join(platformWork, "package"),
    join(
      work,
      "package",
      "node_modules",
      "@opum-ai",
      `quest-${process.platform}-${process.arch}`,
    ),
    { recursive: true },
  );
  const version = await Bun.$`node ${quest} --version`.text();
  if (version.trim() !== rootPackage.version)
    throw new Error("Packed launcher did not report its version.");
  const manifest = JSON.parse(
    await Bun.$`node ${quest} manifest --json`.text(),
  );
  if (manifest.kind !== "manifest.registry")
    throw new Error("Packed launcher manifest failed.");
  const sqlite = JSON.parse(
    await Bun.$`node ${quest} sqlite-smoke --json`.text(),
  );
  if (sqlite.kind !== "sqlite.smoke" || sqlite.data.value !== 1)
    throw new Error("Packed launcher SQLite smoke failed.");
  const workspace = join(work, "workspace");
  await mkdir(workspace);
  await Bun.$`git init -q`.cwd(workspace);
  const initialized = JSON.parse(
    await Bun.$`node ${quest} init --agent-instructions --json`
      .cwd(workspace)
      .text(),
  );
  if (initialized.kind !== "workspace.initialized")
    throw new Error("Packed launcher workspace initialization failed.");
  const agentCheck = JSON.parse(
    await Bun.$`node ${quest} agents --check --json`.cwd(workspace).text(),
  );
  if (agentCheck.data?.state !== "current")
    throw new Error("Packed launcher agent onboarding check failed.");
  const help = JSON.parse(
    await Bun.$`node ${quest} help task --json`.cwd(workspace).text(),
  );
  if (!help.data?.commands?.some((command) => command.name === "task create"))
    throw new Error("Packed launcher targeted help failed.");

  const backlogSource = join(work, "backlog-source");
  const backlogTasks = join(backlogSource, "backlog", "tasks");
  await mkdir(backlogTasks, { recursive: true });
  for (const [id, title] of [
    ["TASK-1", "Legacy task"],
    ["LCLI-315.4", "Lore dotted subtask"],
    ["TASK-2.1", "Backlog dotted subtask"],
  ]) {
    await writeFile(
      join(backlogTasks, `${id}.md`),
      `---\nid: ${id}\ntitle: ${title}\nstatus: To Do\n---\n`,
    );
  }
  const preview = JSON.parse(
    await Bun.$`node ${quest} migration backlog preview --source ${backlogSource} --json`
      .cwd(workspace)
      .text(),
  );
  if (
    preview.kind !== "migration.backlog-preview" ||
    preview.data?.mappings?.length !== 3
  )
    throw new Error("Packed launcher Backlog preview failed.");
  const migrationActor = [
    "--actor",
    "migration-owner",
    "--actor-kind",
    "human",
    "--json",
  ];
  const applied = JSON.parse(
    await Bun.$`node ${quest} migration backlog apply --source ${backlogSource} --digest ${preview.data.digest} ${migrationActor}`
      .cwd(workspace)
      .text(),
  );
  if (
    applied.kind !== "migration.backlog-applied" ||
    applied.data?.state !== "applied"
  )
    throw new Error("Packed launcher Backlog apply failed.");
  for (const reference of ["TASK-1", "LCLI-315.4", "TASK-2.1"]) {
    const viewed = JSON.parse(
      await Bun.$`node ${quest} task view ${reference} --json`
        .cwd(workspace)
        .text(),
    );
    if (
      viewed.kind !== "task.view" ||
      viewed.data?.source?.reference !== reference
    )
      throw new Error(`Packed launcher alias lookup failed for ${reference}.`);
  }
  const migrationStatus = JSON.parse(
    await Bun.$`node ${quest} migration backlog status --digest ${preview.data.digest} --json`
      .cwd(workspace)
      .text(),
  );
  if (migrationStatus.data?.state !== "applied")
    throw new Error("Packed launcher Backlog status failed.");
  const rolledBack = JSON.parse(
    await Bun.$`node ${quest} migration backlog rollback --digest ${preview.data.digest} ${migrationActor}`
      .cwd(workspace)
      .text(),
  );
  if (
    rolledBack.kind !== "migration.backlog-rolled-back" ||
    rolledBack.data?.state !== "rolled-back" ||
    rolledBack.data?.survivors?.length !== 0
  )
    throw new Error("Packed launcher Backlog rollback failed.");
} finally {
  await Promise.all(tarballs.map((tarball) => rm(tarball, { force: true })));
  await rm(work, { recursive: true, force: true });
}
