import { afterAll, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import {
  checkLeftoverClaudeSkill,
  codexQuestSkillPath,
  questSkillPath,
  questSkillPathForTarget,
  questSkillPathsForTargets,
} from "../src/application/agents/agent-instructions.ts";
import { createAgentInstructionPort } from "../src/cli/composition.ts";
import { initGate, nonInteractiveInitNotice } from "../src/cli/init-gate.ts";
import { writeInitInstructions } from "../src/cli/main.ts";

/**
 * QCLI-543 / ODOC-556. A Codex target must write its skill where Codex reads
 * repository skills (.agents/skills, learn.chatgpt.com/docs/build-skills), a
 * claude target keeps .claude/skills, a codex+claude workspace gets both, a
 * leftover at the old path reports as drift and is never deleted, and a bare
 * init that cannot run its wizard says so. These run on a Windows runner too:
 * paths are compared with forward slashes and nothing assumes a TTY.
 */

const MAIN = resolve(import.meta.dir, "../src/cli/main.ts");
const roots: string[] = [];

afterAll(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

async function run(cwd: string, ...args: readonly string[]) {
  const env: Record<string, string | undefined> = {
    ...Bun.env,
    QUEST_AGENT_PLUGINS: "off",
  };
  delete env.QUEST_TASK_STORE;
  const child = Bun.spawn([process.execPath, MAIN, ...args], {
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

// realpath'd because macOS tmpdir() sits behind the /var symlink (QCLI-404).
async function repository(): Promise<string> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "qcli543-")));
  roots.push(root);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
  return root;
}

/** Every file under root (excluding .git), root-relative with forward slashes. */
async function files(root: string, dir = root): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await files(root, path)));
    else found.push(relative(root, path).split(sep).join("/"));
  }
  return found.sort();
}

const exists = (path: string) =>
  stat(path).then(
    () => true,
    () => false,
  );

test("the path function: codex and antigravity get .agents, claude keeps .claude, and the default target is codex", () => {
  expect(codexQuestSkillPath).toBe(".agents/skills/quest/SKILL.md");
  expect(questSkillPathForTarget("codex")).toBe(codexQuestSkillPath);
  expect(questSkillPathForTarget()).toBe(codexQuestSkillPath);
  expect(questSkillPathForTarget("claude")).toBe(questSkillPath);
  expect(questSkillPathForTarget("antigravity")).toBe(codexQuestSkillPath);
  expect(questSkillPathsForTargets(["codex", "claude"])).toEqual([
    codexQuestSkillPath,
    questSkillPath,
  ]);
  // codex and antigravity share one file, written once (QCLI-548).
  expect(questSkillPathsForTargets(["codex", "antigravity"])).toEqual([
    codexQuestSkillPath,
  ]);
  expect(questSkillPathsForTargets(["claude", "antigravity"])).toEqual([
    questSkillPath,
    codexQuestSkillPath,
  ]);
});

test("a Codex-only init writes the skill at .agents/skills and nothing under .claude/ or in a SKILL.md under .quest/ -- the exact file set", async () => {
  const root = await repository();
  const init = await run(
    root,
    "init",
    "--agent-instructions",
    "--target",
    "codex",
    "--json",
  );
  expect(init.exitCode).toBe(0);
  const listed = await files(root);
  // Positive control: the skill the whole test is about really exists.
  expect(listed).toContain(".agents/skills/quest/SKILL.md");
  expect(listed).toContain("AGENTS.md");
  expect(listed.filter((path) => path.startsWith(".claude/"))).toEqual([]);
  expect(
    listed.filter(
      (path) => path.startsWith(".quest/") && /SKILL\.md$/.test(path),
    ),
  ).toEqual([]);
  // The exact set, so a stray file anywhere else also fails.
  expect(listed.filter((path) => !path.startsWith(".quest/"))).toEqual([
    ".agents/skills/quest/SKILL.md",
    "AGENTS.md",
  ]);
  expect(
    await readFile(join(root, ".agents/skills/quest/SKILL.md"), "utf8"),
  ).toContain("name: quest");
});

test("a claude-target init keeps .claude/skills and writes no .agents/", async () => {
  const root = await repository();
  expect(
    (
      await run(
        root,
        "init",
        "--agent-instructions",
        "--target",
        "claude",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  const listed = await files(root);
  expect(listed).toContain(".claude/skills/quest/SKILL.md");
  expect(listed.filter((path) => path.startsWith(".agents/"))).toEqual([]);
});

test("a codex+claude workspace gets BOTH skill files, and --check is green under either target", async () => {
  const root = await repository();
  expect(
    (
      await run(
        root,
        "init",
        "--agent-instructions",
        "--target",
        "codex",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  expect(
    (
      await run(
        root,
        "agents",
        "--update-instructions",
        "--target",
        "claude",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  const listed = await files(root);
  expect(listed).toContain(".agents/skills/quest/SKILL.md");
  expect(listed).toContain(".claude/skills/quest/SKILL.md");
  for (const target of ["codex", "claude"]) {
    const check = await run(
      root,
      "agents",
      "--check",
      "--require-installed",
      "--target",
      target,
      "--json",
    );
    expect(check).toMatchObject({ exitCode: 0 });
  }
});

test("a leftover .claude skill in a Codex-only workspace reports as drift and is NEVER deleted, force or not", async () => {
  const root = await repository();
  expect(
    (
      await run(
        root,
        "init",
        "--agent-instructions",
        "--target",
        "codex",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  // Control: green before the leftover exists.
  expect(
    (await run(root, "agents", "--check", "--target", "codex", "--json"))
      .exitCode,
  ).toBe(0);
  const leftover = join(root, ".claude/skills/quest/SKILL.md");
  await mkdir(join(root, ".claude/skills/quest"), { recursive: true });
  await writeFile(leftover, "an old copy a person may care about\n");

  const check = await run(
    root,
    "agents",
    "--check",
    "--target",
    "codex",
    "--json",
  );
  expect(check.exitCode).toBe(6);
  const body = JSON.parse(check.stderr) as {
    error_type: string;
    message: string;
  };
  expect(body.error_type).toBe("drift");
  expect(body.message).toBe(
    `${questSkillPath} is a leftover: quest now writes its Codex skill to ${codexQuestSkillPath}. Move or delete it by hand; quest never deletes it.`,
  );
  for (const args of [
    [
      "agents",
      "--update-instructions",
      "--target",
      "codex",
      "--force",
      "--json",
    ],
    ["agents", "--check", "--target", "codex", "--json"],
  ])
    await run(root, ...args);
  expect(await readFile(leftover, "utf8")).toBe(
    "an old copy a person may care about\n",
  );
});

test("an Antigravity-only init writes .agents/skills and GEMINI.md, and nothing under .claude/ (QCLI-548)", async () => {
  const root = await repository();
  expect(
    (
      await run(
        root,
        "init",
        "--agent-instructions",
        "--target",
        "antigravity",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  expect(await files(root)).toEqual([
    ".agents/skills/quest/SKILL.md",
    ".quest/workspace.toml",
    "GEMINI.md",
  ]);
  const check = await run(
    root,
    "agents",
    "--check",
    "--target",
    "antigravity",
    "--json",
  );
  expect(check.exitCode).toBe(0);
});

test("the leftover check is pure: a codex or antigravity target without a Claude target can leave one", () => {
  const present = "x";
  expect(checkLeftoverClaudeSkill(present, "codex", false)?.state).toBe(
    "drift",
  );
  expect(checkLeftoverClaudeSkill(present, "antigravity", false)?.state).toBe(
    "drift",
  );
  expect(checkLeftoverClaudeSkill(present, "codex", true)).toBeUndefined();
  expect(
    checkLeftoverClaudeSkill(present, "antigravity", true),
  ).toBeUndefined();
  expect(checkLeftoverClaudeSkill(present, "claude", false)).toBeUndefined();
  expect(checkLeftoverClaudeSkill(undefined, "codex", false)).toBeUndefined();
});

test("writeInitInstructions: codex+claude writes both files under the additive skillsByPath; one file keeps the single-object shape", async () => {
  const root = await repository();
  const port = createAgentInstructionPort(root);
  const both = await writeInitInstructions(
    port,
    ["codex", "claude"],
    undefined,
    undefined,
  );
  expect(Object.keys(both.skillsByPath ?? {})).toEqual([
    codexQuestSkillPath,
    questSkillPath,
  ]);
  expect(both.skill).toMatchObject({ state: "current" });

  const one = await repository();
  const single = await writeInitInstructions(
    createAgentInstructionPort(one),
    undefined,
    "codex",
    undefined,
  );
  expect(single.skillsByPath).toBeUndefined();
  expect(single.skill).toMatchObject({ state: "current" });
  expect(await exists(join(one, ".claude"))).toBe(false);
});

// ---- the wizard gate, with Windows-shaped stream properties -----------------

const WINDOWS_STREAMS = [
  // Windows Terminal / PowerShell / cmd: both are consoles.
  {
    name: "a real Windows console",
    stdin: true,
    stdout: true,
    interactive: true,
  },
  // Git Bash (mintty) and many IDE terminals hand Bun pipes.
  {
    name: "mintty/Git Bash pipes",
    stdin: false,
    stdout: false,
    interactive: false,
  },
  { name: "stdout piped", stdin: true, stdout: false, interactive: false },
  { name: "stdin piped", stdin: false, stdout: true, interactive: false },
] as const;

for (const streams of WINDOWS_STREAMS) {
  test(`initGate, bare init on ${streams.name}: wizard ${streams.interactive ? "runs" : "does not run, and the notice fires"}`, () => {
    const gate = initGate({
      reconfigure: false,
      stdinIsTty: streams.stdin,
      stdoutIsTty: streams.stdout,
      explicitOutputMode: false,
      explicitFlagsGiven: false,
    });
    expect(gate).toEqual({
      interactive: streams.interactive,
      notice: !streams.interactive,
    });
  });
}

test("initGate: a deliberate scripted call never gets the notice, whatever the streams", () => {
  for (const variant of [
    { explicitOutputMode: true, explicitFlagsGiven: false, reconfigure: false },
    { explicitOutputMode: false, explicitFlagsGiven: true, reconfigure: false },
    { explicitOutputMode: false, explicitFlagsGiven: false, reconfigure: true },
  ])
    expect(
      initGate({ ...variant, stdinIsTty: false, stdoutIsTty: false }),
    ).toEqual({ interactive: false, notice: false });
});

test("the notice names the flags and the stream facts it measured", () => {
  const notice = nonInteractiveInitNotice({
    stdinIsTty: false,
    stdoutIsTty: true,
  });
  expect(notice).toContain("stdin is a TTY: false");
  expect(notice).toContain("stdout is a TTY: true");
  expect(notice).toContain("--agent-instructions --target");
  expect(notice).toContain("--skill-source");
  expect(notice.endsWith("\n")).toBe(true);
});

test("a bare init under the test harness (no TTY) prints the notice on stderr, exits 0, writes the workspace and NO bridge; with --json stderr stays clean", async () => {
  const bare = await repository();
  const result = await run(bare, "init");
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toContain("no interactive terminal was detected");
  // Evidence line for the Windows legs (QCLI-543): the runner's own streams and
  // what the child reported, so a run shows which terminals it measured.
  console.log(
    `QCLI-543 isTTY ${process.platform}/${process.arch}: runner stdin=${process.stdin.isTTY} stdout=${process.stdout.isTTY}; child notice: ${result.stderr.split("\n")[0]}`,
  );
  expect(result.stderr).toContain("--agent-instructions --target");
  expect(await exists(join(bare, ".quest/workspace.toml"))).toBe(true);
  expect(await exists(join(bare, "AGENTS.md"))).toBe(false);
  expect(await exists(join(bare, ".agents"))).toBe(false);
  expect(await exists(join(bare, ".claude"))).toBe(false);

  const scripted = await repository();
  const json = await run(scripted, "init", "--json");
  expect(json).toMatchObject({ exitCode: 0, stderr: "" });
});

// QCLI-545 / ODOC-556 R1: a codex target never removes the old Claude skill
// path in any skill-source mode, byte-exact generated content and --force
// included. Each mode starts from the exact generated bytes at .claude.
for (const mode of ["plugin", "none"] as const) {
  test(`skill_source=${mode}: a codex target's --force never removes a byte-exact generated .claude skill, and --check names the path`, async () => {
    const root = await repository();
    expect(
      (
        await run(
          root,
          "init",
          "--agent-instructions",
          "--target",
          "codex",
          "--json",
        )
      ).exitCode,
    ).toBe(0);
    const generated = await readFile(
      join(root, ".agents/skills/quest/SKILL.md"),
      "utf8",
    );
    const leftover = join(root, ".claude/skills/quest/SKILL.md");
    await mkdir(join(root, ".claude/skills/quest"), { recursive: true });
    await writeFile(leftover, generated);
    await rm(join(root, ".agents/skills/quest/SKILL.md"));
    expect(
      (
        await run(
          root,
          "init",
          "--reconfigure",
          "--skill-source",
          mode,
          "--json",
        )
      ).exitCode,
    ).toBe(0);

    const update = await run(
      root,
      "agents",
      "--update-instructions",
      "--target",
      "codex",
      "--force",
      "--json",
    );
    expect(update.exitCode).toBe(0);
    expect(await readFile(leftover, "utf8")).toBe(generated);

    const check = await run(
      root,
      "agents",
      "--check",
      "--target",
      "codex",
      "--json",
    );
    expect(check.exitCode).toBe(6);
    const body = JSON.parse(check.stderr) as {
      error_type: string;
      message: string;
    };
    expect(body.error_type).toBe("drift");
    expect(body.message).toBe(
      `${questSkillPath} is a leftover: a codex target reads its skill from ${codexQuestSkillPath} and this workspace generates none. Move or delete it by hand; quest never deletes it, --force included.`,
    );
    expect(await readFile(leftover, "utf8")).toBe(generated);
  });
}

test("skill_source=none: a claude target still removes its own byte-exact orphan with --force (QCLI-309 unchanged for it)", async () => {
  const root = await repository();
  await run(
    root,
    "init",
    "--agent-instructions",
    "--target",
    "claude",
    "--json",
  );
  const leftover = join(root, ".claude/skills/quest/SKILL.md");
  expect(await exists(leftover)).toBe(true);
  await run(root, "init", "--reconfigure", "--skill-source", "none", "--json");
  const update = await run(
    root,
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--force",
    "--json",
  );
  expect(update.exitCode).toBe(0);
  expect(await exists(leftover)).toBe(false);
});

// Review of #699 blocking 1: the in-use exemption is repo mode's. Under plugin
// or none no target keeps a per-repository skill at the Claude path, so a
// CLAUDE.md Quest block must not silence the leftover.
for (const mode of ["plugin", "none"] as const) {
  test(`skill_source=${mode} with a CLAUDE.md Quest block: --check --target codex still exits 6 naming the .claude skill`, async () => {
    const root = await repository();
    await run(
      root,
      "init",
      "--agent-instructions",
      "--target",
      "codex",
      "--json",
    );
    await run(
      root,
      "agents",
      "--update-instructions",
      "--target",
      "claude",
      "--json",
    );
    expect(await exists(join(root, "CLAUDE.md"))).toBe(true);
    const generated = await readFile(
      join(root, ".agents/skills/quest/SKILL.md"),
      "utf8",
    );
    const leftover = join(root, ".claude/skills/quest/SKILL.md");
    await mkdir(join(root, ".claude/skills/quest"), { recursive: true });
    await writeFile(leftover, generated);
    await rm(join(root, ".agents/skills/quest/SKILL.md"));
    await rm(join(root, ".claude/skills/quest/SKILL.md"));
    await writeFile(leftover, generated);
    expect(
      (
        await run(
          root,
          "init",
          "--reconfigure",
          "--skill-source",
          mode,
          "--json",
        )
      ).exitCode,
    ).toBe(0);
    const check = await run(
      root,
      "agents",
      "--check",
      "--target",
      "codex",
      "--json",
    );
    expect(check.exitCode).toBe(6);
    expect((JSON.parse(check.stderr) as { message: string }).message).toBe(
      `${questSkillPath} is a leftover: a codex target reads its skill from ${codexQuestSkillPath} and this workspace generates none. Move or delete it by hand; quest never deletes it, --force included.`,
    );
    expect(await readFile(leftover, "utf8")).toBe(generated);
  });
}

// ---- QCLI-548 / ODOC-556 ruling 28b8ed5: Antigravity writes the .agents file --

test("writeInitInstructions: codex+antigravity share ONE skill file; claude+antigravity get both locations (QCLI-548)", async () => {
  const shared = await repository();
  const sharedResult = await writeInitInstructions(
    createAgentInstructionPort(shared),
    ["codex", "antigravity"],
    undefined,
    undefined,
  );
  expect(sharedResult.skillsByPath).toBeUndefined();
  expect(sharedResult.skill).toMatchObject({ state: "current" });
  expect(await exists(join(shared, codexQuestSkillPath))).toBe(true);
  expect(await exists(join(shared, ".claude"))).toBe(false);

  const split = await repository();
  const splitResult = await writeInitInstructions(
    createAgentInstructionPort(split),
    ["claude", "antigravity"],
    undefined,
    undefined,
  );
  expect(Object.keys(splitResult.skillsByPath ?? {})).toEqual([
    questSkillPath,
    codexQuestSkillPath,
  ]);
  expect(await exists(join(split, questSkillPath))).toBe(true);
  expect(await exists(join(split, codexQuestSkillPath))).toBe(true);
});

const ANTIGRAVITY_REPO_LEFTOVER = `${questSkillPath} is a leftover: quest now writes its Antigravity skill to ${codexQuestSkillPath}. Move or delete it by hand; quest never deletes it.`;

async function antigravityWorkspaceWithClaudeLeftover(): Promise<{
  root: string;
  leftover: string;
  generated: string;
}> {
  const root = await repository();
  expect(
    (
      await run(
        root,
        "init",
        "--agent-instructions",
        "--target",
        "antigravity",
        "--json",
      )
    ).exitCode,
  ).toBe(0);
  const generated = await readFile(join(root, codexQuestSkillPath), "utf8");
  const leftover = join(root, questSkillPath);
  await mkdir(join(root, ".claude/skills/quest"), { recursive: true });
  await writeFile(leftover, generated);
  return { root, leftover, generated };
}

test("repo mode: a .claude skill only an Antigravity target accounts for is drift (GEMINI.md alone does not exempt it) and --force never removes it", async () => {
  const root = await repository();
  await run(
    root,
    "init",
    "--agent-instructions",
    "--target",
    "antigravity",
    "--json",
  );
  // Control: green before the leftover exists.
  expect(
    (await run(root, "agents", "--check", "--target", "antigravity", "--json"))
      .exitCode,
  ).toBe(0);
  const generated = await readFile(join(root, codexQuestSkillPath), "utf8");
  const leftover = join(root, questSkillPath);
  await mkdir(join(root, ".claude/skills/quest"), { recursive: true });
  await writeFile(leftover, generated);

  const check = await run(
    root,
    "agents",
    "--check",
    "--target",
    "antigravity",
    "--json",
  );
  expect(check.exitCode).toBe(6);
  expect((JSON.parse(check.stderr) as { message: string }).message).toBe(
    ANTIGRAVITY_REPO_LEFTOVER,
  );
  await run(
    root,
    "agents",
    "--update-instructions",
    "--target",
    "antigravity",
    "--force",
    "--json",
  );
  expect(await readFile(leftover, "utf8")).toBe(generated);
});

test("repo mode: a CLAUDE.md Quest block (a Claude target) does exempt the .claude skill for an Antigravity target", async () => {
  const w = await antigravityWorkspaceWithClaudeLeftover();
  expect(await exists(join(w.root, codexQuestSkillPath))).toBe(true);
  await run(
    w.root,
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--json",
  );
  expect(await exists(join(w.root, "CLAUDE.md"))).toBe(true);
  const check = await run(
    w.root,
    "agents",
    "--check",
    "--target",
    "antigravity",
    "--json",
  );
  expect(check.exitCode).toBe(0);
});

for (const mode of ["plugin", "none"] as const) {
  test(`skill_source=${mode}: an Antigravity target's byte-exact generated .claude skill survives --force and --check names it (QCLI-548)`, async () => {
    const w = await antigravityWorkspaceWithClaudeLeftover();
    await rm(join(w.root, codexQuestSkillPath));
    expect(
      (
        await run(
          w.root,
          "init",
          "--reconfigure",
          "--skill-source",
          mode,
          "--json",
        )
      ).exitCode,
    ).toBe(0);
    const update = await run(
      w.root,
      "agents",
      "--update-instructions",
      "--target",
      "antigravity",
      "--force",
      "--json",
    );
    expect(update.exitCode).toBe(0);
    expect(await readFile(w.leftover, "utf8")).toBe(w.generated);
    const check = await run(
      w.root,
      "agents",
      "--check",
      "--target",
      "antigravity",
      "--json",
    );
    expect(check.exitCode).toBe(6);
    expect((JSON.parse(check.stderr) as { message: string }).message).toBe(
      `${questSkillPath} is a leftover: an antigravity target reads its skill from ${codexQuestSkillPath} and this workspace generates none. Move or delete it by hand; quest never deletes it, --force included.`,
    );
    expect(await readFile(w.leftover, "utf8")).toBe(w.generated);
  });
}
