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
import { printable } from "../src/application/agents/agent-plugins.ts";

/**
 * QCLI-380: text a runtime supplies (list stderr, version, scope, update
 * output) is foreign bytes on its way to --plain stdout and to a remedy a
 * user may paste into a shell. Each case below is one input measured to leak
 * at origin/dev f21783a. lore-cli fixed the same defects in dc09ca98
 * (opum-ai/lore-cli#291).
 *
 * Hermetic: fake `claude` and `codex` on PATH; every call is logged.
 */
const source = resolve(import.meta.dir, "../src/cli/main.ts");
const ESC = "\u001b";
const BEL = "\u0007";

let root: string;
let bin: string;
let log: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "qcli380-"));
  bin = join(root, ".fake-bin");
  log = join(root, ".fake-calls.log");
  await mkdir(bin);
  const git = Bun.spawn(["git", "init", "-q"], { cwd: root });
  expect(await git.exited).toBe(0);
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

/** A fake runtime CLI: `plugin list --json` runs `list`, every other call
 * runs `other`. Both are shell fragments; all calls are logged. */
async function fake(
  runtime: "claude" | "codex",
  options: { list: string; other?: string },
) {
  const script = `#!/bin/sh
echo "${runtime} $*" >> "${log}"
if [ "$1 $2 $3" = "plugin list --json" ]; then
${options.list}
exit $?
fi
${options.other ?? "exit 0"}
`;
  const path = join(bin, runtime);
  await writeFile(path, script);
  await chmod(path, 0o755);
}

/** A shell fragment that prints `listing` verbatim, from a file, so no shell
 * quoting can reinterpret its escapes. */
async function listingFrom(runtime: string, listing: string) {
  const file = join(bin, `${runtime}.listing`);
  await writeFile(file, listing);
  return `cat "${file}"`;
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
  return {
    exitCode: await child.exited,
    stdout: await new Response(child.stdout).text(),
    stderr: await new Response(child.stderr).text(),
  };
}

async function calls(): Promise<string[]> {
  try {
    return (await readFile(log, "utf8")).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function expectNoControls(text: string) {
  expect(text.includes(ESC)).toBe(false);
  expect(text.includes(BEL)).toBe(false);
}

test("a failing list's stderr reaches neither --plain nor --json with a line break, ANSI or a control byte", async () => {
  await fake("claude", {
    list: `printf 'boom\\n\\033[31mforged-record x\\033[0m\\007' >&2\nexit 1`,
  });
  const plain = await quest(
    "agents",
    "--check",
    "--target",
    "claude",
    "--plain",
  );
  expectNoControls(plain.stdout);
  // The runtime's second stderr line must not become a record of its own.
  expect(plain.stdout).not.toMatch(/^forged-record/m);
  const json = JSON.parse(
    (await quest("agents", "--check", "--target", "claude", "--json")).stdout,
  );
  expect(json.data.plugin).toMatchObject({ state: "not-detectable" });
  expect(json.data.plugin.reason).toBe(
    "claude plugin list exited 1: boom forged-record x",
  );
});

test("a version carrying a line break and an escape sequence is printed as one clean line", async () => {
  await fake("codex", {
    list: await listingFrom(
      "codex",
      JSON.stringify({
        installed: [
          {
            pluginId: "opum-quest@opum",
            enabled: true,
            version: `0.1\n${ESC}[2Jforged`,
          },
        ],
        available: [],
      }),
    ),
  });
  const plain = await quest(
    "agents",
    "--check",
    "--target",
    "codex",
    "--plain",
  );
  expectNoControls(plain.stdout);
  expect(plain.stdout).not.toMatch(/^.*\[2J/m);
  const json = JSON.parse(
    (await quest("agents", "--check", "--target", "codex", "--json")).stdout,
  );
  expect(json.data.plugin).toMatchObject({
    state: "installed",
    version: "0.1 forged",
  });
});

test("a scope that is not a plain token never reaches a printed remedy", async () => {
  await fake("claude", {
    list: await listingFrom(
      "claude",
      JSON.stringify([
        {
          id: "opum-quest@opum",
          scope: "user; touch /tmp/pwned",
          enabled: false,
          version: "1",
        },
      ]),
    ),
  });
  const json = JSON.parse(
    (await quest("agents", "--check", "--target", "claude", "--json")).stdout,
  );
  expect(json.data.plugin).toMatchObject({
    state: "disabled",
    remedy: "claude plugin enable opum-quest@opum",
  });
});

test("a scope that is not a plain token never reaches the update's argv", async () => {
  await fake("claude", {
    list: await listingFrom(
      "claude",
      JSON.stringify([
        {
          id: "opum-quest@opum",
          scope: "user --dangerous",
          enabled: true,
          version: "1",
        },
      ]),
    ),
  });
  const json = JSON.parse(
    (
      await quest(
        "agents",
        "--update-instructions",
        "--target",
        "claude",
        "--json",
      )
    ).stdout,
  );
  expect(json.data.plugin).toMatchObject({ update: "ran", updateOk: true });
  expect(await calls()).toEqual([
    "claude plugin list --json",
    "claude plugin update opum-quest@opum",
  ]);
});

test("a plain-token scope still reaches the remedy and the update", async () => {
  await fake("claude", {
    list: await listingFrom(
      "claude",
      JSON.stringify([
        { id: "opum-quest@opum", scope: "user", enabled: true, version: "1" },
      ]),
    ),
  });
  await quest(
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--json",
  );
  expect(await calls()).toEqual([
    "claude plugin list --json",
    "claude plugin update opum-quest@opum --scope user",
  ]);
});

test("a listing past 1 MiB is not read further and is not-detectable", async () => {
  await fake("claude", {
    list: `head -c 2097152 /dev/zero | tr '\\000' ' '\necho '[]'`,
  });
  const json = JSON.parse(
    (await quest("agents", "--check", "--target", "claude", "--json")).stdout,
  );
  expect(json.data.plugin).toMatchObject({
    state: "not-detectable",
    reason: "claude plugin list --json printed more than 1048576 bytes.",
  });
});

test("an update printing past 1 MiB is a failed update, and its detail is one clean line", async () => {
  await fake("claude", {
    list: await listingFrom(
      "claude",
      JSON.stringify([
        { id: "opum-quest@opum", scope: "user", enabled: true, version: "1" },
      ]),
    ),
    other: `head -c 2097152 /dev/zero | tr '\\000' 'x'`,
  });
  const result = await quest(
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--json",
  );
  expect(result.exitCode).toBe(0);
  expect(JSON.parse(result.stdout).data.plugin).toMatchObject({
    update: "ran",
    updateOk: false,
    updateDetail:
      "claude plugin update opum-quest@opum --scope user printed more than 1048576 bytes.",
  });
});

test("a failed update's runtime output is one clean line in updateDetail", async () => {
  await fake("claude", {
    list: await listingFrom(
      "claude",
      JSON.stringify([
        { id: "opum-quest@opum", scope: "user", enabled: true, version: "1" },
      ]),
    ),
    other: `printf 'nope\\n\\033]0;title\\007\\033[1mbold\\033[0m' >&2\nexit 3`,
  });
  const plain = await quest(
    "agents",
    "--update-instructions",
    "--target",
    "claude",
    "--plain",
  );
  expectNoControls(plain.stdout);
  const json = JSON.parse(
    (
      await quest(
        "agents",
        "--update-instructions",
        "--target",
        "claude",
        "--json",
      )
    ).stdout,
  );
  expect(json.data.plugin.updateDetail).toBe(
    "claude plugin update opum-quest@opum --scope user exited 3: nope bold",
  );
});

test("printable: CSI, OSC and two-byte escapes, C0 and C1 controls, and line separators", () => {
  expect(printable(`a${ESC}[1;31mb${ESC}[0m`)).toBe("ab");
  expect(printable(`a${ESC}]0;title${BEL}b`)).toBe("ab");
  expect(printable(`a${ESC}]8;;http://x${ESC}\\b`)).toBe("ab");
  expect(printable(`a${ESC}Mb`)).toBe("ab");
  expect(printable("a\u0000\u0008\u007f\u009bb")).toBe("ab");
  expect(printable("a\r\n\tb c")).toBe("a b c");
  expect(printable("  plain text  ")).toBe("plain text");
});
