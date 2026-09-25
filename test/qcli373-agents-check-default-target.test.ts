import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

/**
 * QCLI-373 (opum-doc ADR "Distribute lore and quest agent skills through the
 * plugin marketplace", gap 4). A bare `quest agents --check` reads AGENTS.md,
 * the codex default, so a Claude-only project exited 0 reporting "missing"
 * about a file it does not use, and said nothing about CLAUDE.md. The default
 * stays codex, because the codex-target managed block tells CI to run the
 * check with no --target. The silent case now refuses and names the --target
 * to use, and nothing guesses which file to check.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");

async function quest(cwd: string, ...arguments_: readonly string[]) {
  const env = { ...Bun.env };
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn([process.execPath, source, ...arguments_], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env,
  });
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

let root: string;
beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "qcli373-"));
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function install(target: string) {
  const result = await quest(
    root,
    "agents",
    "--update-instructions",
    "--target",
    target,
    "--json",
  );
  expect(result.exitCode).toBe(0);
}

for (const [target, file] of [
  ["claude", "CLAUDE.md"],
  ["antigravity", "GEMINI.md"],
] as const) {
  test(`a bare --check refuses when only ${file} carries the block, naming --target ${target}`, async () => {
    await install(target);
    const bare = await quest(root, "agents", "--check", "--json");
    expect(bare.exitCode).toBe(6);
    const error = JSON.parse(bare.stderr);
    expect(error.error_type).toBe("validation");
    expect(error.message).toContain("AGENTS.md");
    expect(error.message).toContain(`${file} carries one`);
    expect(error.message).toContain(`--target ${target}`);

    const explicit = await quest(
      root,
      "agents",
      "--check",
      "--target",
      target,
      "--require-installed",
      "--json",
    );
    expect(explicit.exitCode).toBe(0);
  });
}

test("a bare --check still checks AGENTS.md when it carries the block, even beside CLAUDE.md", async () => {
  await install("codex");
  await install("claude");
  const bare = await quest(
    root,
    "agents",
    "--check",
    "--require-installed",
    "--json",
  );
  expect(bare.exitCode).toBe(0);
  expect(JSON.parse(bare.stdout).data.state).toBe("current");
});

test("a bare --check in a project with no block anywhere still reports missing and exits 0", async () => {
  const bare = await quest(root, "agents", "--check", "--json");
  expect(bare.exitCode).toBe(0);
  expect(JSON.parse(bare.stdout).data.state).toBe("missing");
});
