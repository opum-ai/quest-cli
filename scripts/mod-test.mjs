// QCLI-431. The Quest board's hooks module is exercised by Claude Code's own
// engine, not by bun: `claude plugin test <dir>` runs every `*.test.ts` and
// `*.test.tsx` under the directory it is given, and the CLI's suite under
// `test/` is not a mod suite -- pointed at the repository root, the engine
// would try to run all of it. So the files the plugin ships are staged into a
// temp directory and the engine is pointed there: the mod is then tested
// against exactly what the plugin ships, and nothing else.
//
// `claude` is required rather than optional, and a missing one fails here
// instead of skipping -- the mod's tests are the only thing that runs them.
//
// The typecheck is a second, softer step, and the script says which of the
// three states it is in rather than passing quietly: the engine writes its
// TypeScript declaration beside a mod only when a session loads that mod from
// a folder the person owns, and `claude plugin test` does not write one. So
// the module is typechecked against the repository's own laid declaration when
// one is there, then against the copy the plugin-authoring skill leaves in the
// machine's temp directory, and when neither exists the run reports that the
// module was NOT typechecked rather than implying it was.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { cp, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// What the opum-quest plugin ships. Everything here is staged; nothing the CLI
// owns is, which is the whole point of the stage.
const SHIPPED = ["hooks", "types", "tests", "skills"];
const MINIMUM_CLAUDE = [2, 1, 287];
// The tsconfig the engine's declaration carries for a hooks module, from its
// own header: `jsxFactory: h` is what a mod's JSX compiles against, and `lib`
// names no DOM because the environment has none.
const COMPILER_OPTIONS = {
  target: "es2023",
  lib: ["es2023"],
  types: [],
  module: "esnext",
  moduleResolution: "bundler",
  strict: true,
  noUncheckedIndexedAccess: true,
  noEmit: true,
  skipLibCheck: true,
  jsx: "react",
  jsxFactory: "h",
  jsxFragmentFactory: "Fragment",
};

function output(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
  if (result.error) return null;

  return { status: result.status ?? 1, stdout: (result.stdout ?? "").trim() };
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) {
    throw new Error(`${command} could not run: ${result.error.message}`);
  }

  return result.status ?? 1;
}

function versionAtLeast(text) {
  const match = /(\d+)\.(\d+)\.(\d+)/u.exec(text ?? "");
  if (!match) return false;
  const found = [Number(match[1]), Number(match[2]), Number(match[3])];
  for (let at = 0; at < MINIMUM_CLAUDE.length; at += 1) {
    if (found[at] !== MINIMUM_CLAUDE[at]) return found[at] > MINIMUM_CLAUDE[at];
  }

  return true;
}

/**
 * Every declaration the plugin-authoring skill has left behind on this machine.
 *
 * Its path is `<temp>/claude-<uid>/bundled-skills/<version>/<hash>/
 * plugin-authoring/types/claude-code.d.ts`, where the hash changes per
 * session, so it is found by walking rather than by naming. Each one's own
 * first line names the Claude Code that wrote it, which is the only thing
 * that says whether it describes the build being shipped for.
 */
function findDeclarations() {
  const roots = ["/tmp", tmpdir()];
  const found = [];
  for (const tempRoot of roots) {
    const claudeDirs = existsSync(tempRoot) ? readdirSync(tempRoot) : [];
    for (const claudeDir of claudeDirs.filter((name) => name.startsWith("claude-"))) {
      const skills = join(tempRoot, claudeDir, "bundled-skills");
      if (!existsSync(skills)) continue;
      for (const version of readdirSync(skills)) {
        const versionDir = join(skills, version);
        for (const hash of readdirSync(versionDir)) {
          const candidate = join(versionDir, hash, "plugin-authoring/types/claude-code.d.ts");
          if (!existsSync(candidate)) continue;
          const wrote = readFileSync(candidate, "utf8").split("\n")[0]?.trim() ?? "";
          found.push({ path: candidate, wrote, version });
        }
      }
    }
  }

  return found;
}

const claude = output("claude", ["--version"]);
if (!claude || claude.status !== 0) {
  console.error("The `claude` CLI is required to run the mod's tests and was not found on PATH.");
  process.exit(1);
}
if (!versionAtLeast(claude.stdout)) {
  console.error(
    `Mods need Claude Code ${MINIMUM_CLAUDE.join(".")} or later; this is ${claude.stdout}.`,
  );
  process.exit(1);
}

/**
 * The declaration that describes the build being shipped for, or the newest
 * one found when none matches -- named either way, because a typecheck against
 * a declaration from another Claude Code is a different measurement.
 */
function pickDeclaration() {
  const all = findDeclarations();
  const wanted = `Claude Code ${claude.stdout}`;
  const exact = all.find((one) => one.wrote === `// Written by ${wanted}.`);

  return exact ?? all.at(-1) ?? null;
}

const tsc = join(root, "node_modules", ".bin", "tsc");
if (!existsSync(tsc)) {
  console.error(
    "TypeScript is not installed in this checkout; run `bun install` before the mod's typecheck.",
  );
  process.exit(1);
}

// The stage is realpath'd: on macOS the temp root is a symlink (/tmp), and a
// path through it is a path the tools may treat as a different directory.
const staged = await realpath(await mkdtemp(join(tmpdir(), "quest-mod-")));
await cp(join(root, ".claude-plugin"), join(staged, ".claude-plugin"), { recursive: true });
for (const entry of SHIPPED) {
  await cp(join(root, entry), join(staged, entry), { recursive: true });
}
if (!existsSync(join(staged, "hooks", "register.tsx"))) {
  // A stage that did not copy is a run that tested nothing, and it would
  // otherwise pass.
  console.error(`The stage at ${staged} has no hooks module; nothing was tested.`);
  process.exit(1);
}

let failed = false;
const step = (name, command, args) => {
  const status = run(command, args);
  if (status !== 0) {
    failed = true;
    console.error(`\n${name} failed with exit ${status}.`);
  }

  return status === 0;
};

console.log(`Claude Code: ${claude.stdout} (mods need ${MINIMUM_CLAUDE.join(".")}+)`);
console.log(`Staged: ${staged}\n`);
step("claude plugin validate", "claude", ["plugin", "validate", staged]);
step("claude plugin test", "claude", ["plugin", "test", staged]);

const laid = join(staged, ".claude-plugin", "types", "tsconfig.json");
const bundled = existsSync(laid) ? null : pickDeclaration();
if (existsSync(laid)) {
  step(`tsc (${laid})`, tsc, ["-p", laid]);
} else if (bundled) {
  const config = join(staged, "tsconfig.check.json");
  await writeFile(
    config,
    `${JSON.stringify(
      {
        compilerOptions: COMPILER_OPTIONS,
        // The bundled declaration is a single file rather than the laid
        // folder, so it is named directly; the plugin's own three folders are
        // what the declaration's header names.
        include: [bundled.path, "hooks", "types", "tests"],
      },
      null,
      2,
    )}\n`,
  );
  console.log(`\nDeclaration: ${bundled.path}\n${bundled.wrote}`);
  step("tsc", tsc, ["-p", config]);
} else {
  console.log(
    "\nNOT TYPECHECKED: no engine declaration on this machine. Load the plugin in a session\n" +
      "(a --plugin-dir or the mods folder) to have one laid beside it, or run the\n" +
      "plugin-authoring skill once, which writes the same declaration into the temp directory.",
  );
}

if (failed) {
  console.error(`\nThe stage is kept for inspection: ${staged}`);
  process.exit(1);
}
await rm(staged, { recursive: true, force: true });
console.log("\nThe mod validates and its tests pass.");
