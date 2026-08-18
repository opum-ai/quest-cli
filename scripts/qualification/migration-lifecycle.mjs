import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const manifestEntries = [
  ["migration backlog preview", "migration.backlog-preview", false],
  ["migration backlog apply", "migration.backlog-applied", true],
  ["migration backlog status", "migration.backlog-status", false],
  ["migration backlog rollback", "migration.backlog-rolled-back", true],
];

async function invoke(command, argv, cwd, env) {
  const child = Bun.spawn([...command, ...argv], {
    cwd,
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    argv,
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

function requireSuccess(result, name) {
  if (result.exitCode !== 0)
    throw new Error(`${name} exited ${result.exitCode}: ${result.stderr}`);
  return result;
}

function envelope(result, kind, name) {
  const parsed = JSON.parse(requireSuccess(result, name).stdout);
  if (parsed.kind !== kind) throw new Error(`${name} returned ${parsed.kind}.`);
  return parsed;
}

function evidenceProvenance(provenance = {}) {
  return Object.fromEntries(
    Object.entries(provenance).filter(([, value]) => value !== undefined),
  );
}

export async function qualifyMigrationLifecycle({
  command,
  executablePath,
  provenance,
}) {
  const work = await mkdtemp(join(tmpdir(), "quest-migration-artifact-"));
  const workspace = join(work, "workspace");
  const source = join(work, "backlog-source");
  const env = { ...Bun.env, QUEST_TASK_STORE: workspace };
  try {
    await mkdir(workspace);
    requireSuccess(
      await invoke(["git"], ["init", "-q"], workspace, env),
      "workspace git init",
    );
    envelope(
      await invoke(command, ["init", "--json"], workspace, env),
      "workspace.initialized",
      "workspace initialization",
    );
    const version = requireSuccess(
      await invoke(command, ["--version"], workspace, env),
      "version",
    ).stdout.trim();
    if (!/^\d+\.\d+\.\d+$/.test(version))
      throw new Error("version is not bare semver.");
    const manifest = envelope(
      await invoke(command, ["manifest", "--json"], workspace, env),
      "manifest.registry",
      "manifest",
    );
    const tuples = manifestEntries.map(([name, kind, mutates]) => {
      const actual = manifest.data?.commands?.find(
        (entry) => entry?.name === name,
      );
      if (
        actual?.schemaVersion !== 1 ||
        actual.kind !== kind ||
        actual.mutates !== mutates
      )
        throw new Error(`manifest tuple for ${name} is invalid.`);
      return { name, kind, mutates };
    });
    const tasks = join(source, "backlog", "tasks");
    await mkdir(tasks, { recursive: true });
    for (const [id, title] of [
      ["TASK-1", "Legacy task"],
      ["LCLI-315.4", "Lore dotted subtask"],
      ["TASK-2.1", "Backlog dotted subtask"],
    ])
      await writeFile(
        join(tasks, `${id}.md`),
        `---\nid: ${id}\ntitle: ${title}\nstatus: To Do\n---\n`,
      );
    const preview = envelope(
      await invoke(
        command,
        ["migration", "backlog", "preview", "--source", source, "--json"],
        workspace,
        env,
      ),
      "migration.backlog-preview",
      "migration preview",
    );
    if (preview.data?.mappings?.length !== 3)
      throw new Error("migration preview mappings are incomplete.");
    const digest = preview.data.digest;
    const denied = [];
    for (const action of ["apply", "rollback"]) {
      const result = await invoke(
        command,
        [
          "migration",
          "backlog",
          action,
          ...(action === "apply" ? ["--source", source] : []),
          "--digest",
          digest,
          "--json",
        ],
        workspace,
        env,
      );
      const diagnostic = JSON.parse(result.stderr);
      if (result.exitCode !== 4 || diagnostic.error_type !== "denied")
        throw new Error(`actor-free migration ${action} was not denied.`);
      denied.push({
        action,
        freshDigest: true,
        exitCode: result.exitCode,
        errorType: diagnostic.error_type,
      });
    }
    const actor = ["--actor", "migration-owner", "--actor-kind", "human"];
    const applied = envelope(
      await invoke(
        command,
        [
          "migration",
          "backlog",
          "apply",
          "--source",
          source,
          "--digest",
          digest,
          ...actor,
          "--json",
        ],
        workspace,
        env,
      ),
      "migration.backlog-applied",
      "migration apply",
    );
    if (applied.data?.state !== "applied")
      throw new Error("migration apply did not report applied.");
    const aliases = [];
    for (const reference of ["TASK-1", "LCLI-315.4", "TASK-2.1"]) {
      const viewed = envelope(
        await invoke(
          command,
          ["task", "view", reference, "--json"],
          workspace,
          env,
        ),
        "task.view",
        `alias ${reference}`,
      );
      if (viewed.data?.source?.reference !== reference)
        throw new Error(`alias ${reference} was not preserved.`);
      aliases.push(reference);
    }
    const status = envelope(
      await invoke(
        command,
        ["migration", "backlog", "status", "--digest", digest, "--json"],
        workspace,
        env,
      ),
      "migration.backlog-status",
      "migration status",
    );
    if (status.data?.state !== "applied")
      throw new Error("migration status did not report applied.");
    const rolledBack = envelope(
      await invoke(
        command,
        [
          "migration",
          "backlog",
          "rollback",
          "--digest",
          digest,
          ...actor,
          "--json",
        ],
        workspace,
        env,
      ),
      "migration.backlog-rolled-back",
      "migration rollback",
    );
    if (
      rolledBack.data?.state !== "rolled-back" ||
      rolledBack.data?.survivors?.length !== 0
    )
      throw new Error("migration rollback was incomplete.");
    return {
      executablePath,
      version,
      manifest: tuples,
      lifecycle: {
        preview: "previewed",
        denied,
        apply: applied.data.state,
        aliases,
        status: status.data.state,
        rollback: rolledBack.data.state,
      },
      provenance: evidenceProvenance(provenance),
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  const values = new Map();
  for (let index = 0; index < Bun.argv.length; index += 1) {
    const argument = Bun.argv[index];
    if (!argument.startsWith("--")) continue;
    const value = Bun.argv[index + 1];
    if (value === undefined) throw new Error(`${argument} requires a value.`);
    const entries = values.get(argument) ?? [];
    entries.push(value);
    values.set(argument, entries);
    index += 1;
  }
  const executable = values.get("--executable")?.[0];
  if (!executable) throw new Error("--executable requires a value.");
  try {
    const genericProvenance = values.get("--provenance")?.[0];
    const parsedProvenance = genericProvenance
      ? JSON.parse(genericProvenance)
      : {};
    if (
      !parsedProvenance ||
      typeof parsedProvenance !== "object" ||
      Array.isArray(parsedProvenance)
    )
      throw new Error("--provenance must be a JSON object.");
    const evidence = await qualifyMigrationLifecycle({
      command: [executable, ...(values.get("--executable-arg") ?? [])],
      executablePath: executable,
      provenance: {
        ...parsedProvenance,
        sourceCommit: values.get("--source-commit")?.[0],
        rootTarballSha256: values.get("--root-tarball-sha256")?.[0],
        platformTarballSha256: values.get("--platform-tarball-sha256")?.[0],
        installedRootRealpath: values.get("--installed-root-realpath")?.[0],
        installedNativeRealpath: values.get("--installed-native-realpath")?.[0],
        reinstallVerification: values.get("--reinstall-verification")?.[0],
      },
    });
    process.stdout.write(
      `${JSON.stringify({ kind: "quest.migration-artifact-qualification", status: "passed", evidence })}\n`,
    );
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({ kind: "quest.migration-artifact-qualification", status: "failed", message: error instanceof Error ? error.message : "qualification failed" })}\n`,
    );
    process.exitCode = 1;
  }
}
