import { cp, mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { qualifyMigrationLifecycle } from "./qualification/migration-lifecycle.mjs";

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
  const packedAgents = await readFile(join(workspace, "AGENTS.md"), "utf8");
  if (
    !packedAgents.includes(
      `This project uses Quest CLI ${rootPackage.version} `,
    )
  )
    throw new Error(
      "Packed launcher wrote managed instructions with a stale release version.",
    );
  const requireInstalled = Bun.spawnSync(
    ["node", quest, "agents", "--check", "--require-installed", "--json"],
    { cwd: workspace, stderr: "pipe" },
  );
  if (requireInstalled.exitCode !== 0)
    throw new Error(
      "Packed launcher required-installed agent check failed: " +
        new TextDecoder().decode(requireInstalled.stderr),
    );
  const help = JSON.parse(
    await Bun.$`node ${quest} help task --json`.cwd(workspace).text(),
  );
  if (!help.data?.commands?.some((command) => command.name === "task create"))
    throw new Error("Packed launcher targeted help failed.");

  const migration = await qualifyMigrationLifecycle({
    command: ["node", quest],
    executablePath: quest,
    provenance: { candidate: "packed-local" },
  });
  if (migration.version !== rootPackage.version)
    throw new Error("Packed launcher migration qualification version failed.");
} finally {
  await Promise.all(tarballs.map((tarball) => rm(tarball, { force: true })));
  await rm(work, { recursive: true, force: true });
}
