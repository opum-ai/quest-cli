import { afterAll, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative } from "node:path";

/**
 * QCLI-404. An entry-point guard of the form
 *
 *   resolve(process.argv[1]) === fileURLToPath(import.meta.url)
 *
 * is false when the script is invoked through a symlinked path: `resolve`
 * keeps the symlink in argv[1], while `import.meta.url` is the realpath node
 * loaded the module from. The script then exits 0 having done nothing, and
 * for a release gate a silent exit 0 reads as success. macOS's tmpdir
 * (/var -> /private/var) is one everyday source of the symlink; an explicit
 * one is used here so the probe is real on every platform.
 *
 * These tests invoke each guard-carrying script through a symlink and
 * require behaviour identical to the real path, plus an explicit
 * "not a silent exit 0" property.
 */

const REPO = join(import.meta.dir, "..");
const NODE = Bun.which("node");
const temps: { realRoot: string; linkRoot: string }[] = [];

afterAll(async () => {
  for (const { realRoot, linkRoot } of temps) {
    await unlink(linkRoot).catch(() => {});
    await rm(realRoot, { recursive: true, force: true });
  }
});

/**
 * A temp root plus an explicit symlink to it, with the symlink asserted to
 * be a symlink to the real root — otherwise a platform that resolves the
 * link early would make every probe below pass vacuously.
 */
async function probeRoot(label: string) {
  const tmp = await mkdtemp(join(tmpdir(), `qcli404-${label}-`));
  const realRoot = await realpath(tmp);
  const linkRoot = join(dirname(realRoot), `${basename(realRoot)}-link`);
  await symlink(realRoot, linkRoot, "dir");
  expect(await realpath(linkRoot)).toBe(realRoot);
  expect(linkRoot).not.toBe(realRoot);
  temps.push({ realRoot, linkRoot });
  return { realRoot, linkRoot };
}

type Run = {
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
};

function runScript(
  file: string,
  cwd: string,
  env: Record<string, string> = { PATH: process.env.PATH ?? "/usr/bin:/bin" },
): Run {
  const child = spawnSync(NODE ?? "node", [file], {
    cwd,
    env: { HOME: cwd, ...env },
    timeout: 30_000,
    encoding: "utf8",
  });
  return {
    exitCode: child.status,
    signal: child.signal,
    stdout: String(child.stdout ?? ""),
    stderr: String(child.stderr ?? ""),
  };
}

/**
 * Every script carrying an entry-point guard. `process.argv[1]` is read
 * nowhere else in scripts/, so its presence is the enumeration.
 */
async function guardScripts(): Promise<string[]> {
  const found: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(path);
      } else if (entry.name.endsWith(".mjs")) {
        const source = await readFile(path, "utf8");
        if (source.includes("process.argv[1]")) {
          found.push(relative(REPO, path));
        }
      }
    }
  };
  await walk(join(REPO, "scripts"));
  return found.sort();
}

test("every entry-point guard runs main() when invoked through a symlinked path", async () => {
  const files = await guardScripts();
  // Positive control on the enumeration itself: a walk that found nothing
  // would make the loop below trivially green.
  expect(files.length).toBeGreaterThanOrEqual(12);
  for (const known of [
    "scripts/promote-release.mjs",
    "scripts/publish-release.mjs",
    "scripts/github-release.mjs",
    "scripts/qualification/native-execution-receipt.mjs",
    "scripts/qualification/e2e-receipt.mjs",
    "scripts/qualification/bundle-integrity.mjs",
    "scripts/qualification/version-parity.mjs",
    "scripts/qualification/require-platform-visibility.mjs",
  ]) {
    expect(files).toContain(known);
  }

  const { realRoot, linkRoot } = await probeRoot("guards");
  await cp(join(REPO, "scripts"), join(realRoot, "scripts"), {
    recursive: true,
  });

  for (const file of files) {
    const real = runScript(join(realRoot, file), realRoot);
    const link = runScript(join(linkRoot, file), realRoot);
    // Positive control for THIS file: the real-path run exited nonzero or
    // said something, so this file's equality below cannot hold vacuously.
    // It is NOT proof the run reached main() — a crash before the guard
    // satisfies it too, identically on both paths.
    expect(
      real.exitCode === 0 && real.stdout === "" && real.stderr === "",
      `${file}: the real-path probe exited 0 silently, so the equality below proves nothing`,
    ).toBe(false);
    expect(link.signal, `${file}: symlinked run timed out`).toBe(null);
    expect(link.exitCode, `${file}: symlinked exit code`).toBe(real.exitCode);
    expect(link.stdout, `${file}: symlinked stdout`).toBe(real.stdout);
    expect(link.stderr, `${file}: symlinked stderr`).toBe(real.stderr);
  }
}, 120_000);

/** The promote-release.mjs harness from qcli402, staged in a probe root. */
async function stagePromoteRoot(root: string, version: string) {
  await cp(join(REPO, "scripts"), join(root, "scripts"), { recursive: true });
  await writeFile(
    join(root, "package.json"),
    `${JSON.stringify({ name: "@opum-ai/quest", version }, null, 2)}\n`,
  );
  const bin = join(root, "bin");
  await mkdir(bin, { recursive: true });
  const log = join(root, "calls.log");
  await writeFile(log, "");
  const tagPath = `repos/opum-ai/quest-cli/git/ref/tags/v${version}`;
  const tagAnswer = JSON.stringify({
    ref: `refs/tags/v${version}`,
    object: { type: "commit", sha: "a".repeat(40) },
  });
  const stub = (name: string, answers: string) =>
    `#!/bin/bash\nprintf '%s %s\\n' ${name} "$*" >> ${JSON.stringify(log)}\n${answers}\necho "stubbed ${name}: refused" >&2\nexit 1\n`;
  await writeFile(
    join(bin, "gh"),
    stub(
      "gh",
      `if [ "$*" = "api --hostname github.com ${tagPath}" ]; then printf '%s' '${tagAnswer}'; exit 0; fi`,
    ),
  );
  await writeFile(join(bin, "npm"), stub("npm", ""));
  await writeFile(join(bin, "security"), stub("security", ""));
  for (const name of ["gh", "npm", "security"]) {
    await chmod(join(bin, name), 0o755);
  }
  return { bin, log, tagPath };
}

/** A registry WRITE: moving a dist-tag or publishing. Reads do not count. */
const isRegistryWrite = (call: string) =>
  /^npm (.* )?(dist-tag (add|rm)|publish|unpublish|deprecate)\b/.test(call);

async function promoteOnce(
  scriptPath: string,
  label: string,
  root: string,
  setup: { bin: string; log: string; tagPath: string },
) {
  await writeFile(setup.log, "");
  const record = join(root, `record-${label}.json`);
  const child = spawnSync(
    NODE ?? "node",
    [scriptPath, "--record", record, "--qualification-run", "123", "--promote"],
    {
      cwd: root,
      env: {
        HOME: root,
        PATH: `${setup.bin}:${NODE ? dirname(NODE) : "/usr/bin"}:/usr/bin:/bin`,
      },
      timeout: 60_000,
      encoding: "utf8",
    },
  );
  return {
    exitCode: child.status,
    stderr: String(child.stderr ?? ""),
    calls: (await readFile(setup.log, "utf8")).split("\n").filter(Boolean),
    recordWritten: await stat(record).then(
      () => true,
      () => false,
    ),
    tagPath: setup.tagPath,
  };
}

test("promote-release.mjs refuses through a symlink exactly as through its real path", async () => {
  const version = "9.9.9-beta.1";
  const { realRoot, linkRoot } = await probeRoot("promote");
  const setup = await stagePromoteRoot(realRoot, version);

  const real = await promoteOnce(
    join(realRoot, "scripts", "promote-release.mjs"),
    "real",
    realRoot,
    setup,
  );
  const link = await promoteOnce(
    join(linkRoot, "scripts", "promote-release.mjs"),
    "link",
    realRoot,
    setup,
  );

  // Positive control: the real-path run reached the network read through the
  // gh stub. An empty call list below is then a measurement, not a harness
  // that never ran.
  expect(real.calls).toContain(`gh api --hostname github.com ${real.tagPath}`);
  expect(real.exitCode).not.toBe(0);
  expect(real.calls.filter(isRegistryWrite)).toEqual([]);
  expect(real.recordWritten).toBe(false);

  // The property: the symlinked invocation refuses the same way, and is
  // never a silent exit 0 having done nothing.
  expect(link.exitCode).toBe(real.exitCode);
  expect(link.calls).toEqual(real.calls);
  expect(link.recordWritten).toBe(false);
}, 120_000);
