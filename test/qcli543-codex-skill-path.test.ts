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

test("the path function: codex gets .agents, claude keeps .claude, antigravity is unchanged, and the default target is codex", () => {
  expect(codexQuestSkillPath).toBe(".agents/skills/quest/SKILL.md");
  expect(questSkillPathForTarget("codex")).toBe(codexQuestSkillPath);
  expect(questSkillPathForTarget()).toBe(codexQuestSkillPath);
  expect(questSkillPathForTarget("claude")).toBe(questSkillPath);
  expect(questSkillPathForTarget("antigravity")).toBe(questSkillPath);
  expect(questSkillPathsForTargets(["codex", "claude"])).toEqual([
    codexQuestSkillPath,
    questSkillPath,
  ]);
  // claude and antigravity share one file, written once.
  expect(questSkillPathsForTargets(["claude", "antigravity"])).toEqual([
    questSkillPath,
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

test("an antigravity workspace's .claude skill is NOT a leftover under --check --target codex", async () => {
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
  expect(await exists(join(root, ".claude/skills/quest/SKILL.md"))).toBe(true);
  const check = await run(
    root,
    "agents",
    "--check",
    "--target",
    "codex",
    "--json",
  );
  expect(JSON.parse(check.stdout)).toMatchObject({
    data: { state: "missing" },
  });
  expect(check.exitCode).toBe(0);
});

test("the leftover check is pure: only a codex target without a Claude-path target can leave one", () => {
  const present = "x";
  expect(checkLeftoverClaudeSkill(present, "codex", false)?.state).toBe(
    "drift",
  );
  expect(checkLeftoverClaudeSkill(present, "codex", true)).toBeUndefined();
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
