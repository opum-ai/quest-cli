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
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

/**
 * `"2.1.287 (Claude Code)"` -> `"2.1.287"`, or null when no version is printed.
 *
 * The bare number is what the rest of this file compares on, because the
 * declaration's own first line carries it bare too. Splitting the two is not
 * cosmetic: matching a declaration by interpolating the WHOLE of `--version`
 * into `// Written by Claude Code <x>.` builds the string
 * `// Written by Claude Code 2.1.287 (Claude Code).`, which no declaration
 * ever contains, so the match never fires and the run silently typechecks
 * against whatever the fallback happened to pick.
 */
function versionIn(text) {
  const match = /(\d+\.\d+\.\d+)/u.exec(text ?? "");
  if (!match) return null;

  return match[0] ?? null;
}

/** Whether a dotted version is at least MINIMUM_CLAUDE; anything else is not. */
function versionAtLeast(version) {
  const found = (version ?? "").split(".").map(Number);
  if (found.length !== MINIMUM_CLAUDE.length || found.some(Number.isNaN)) {
    return false;
  }
  for (let at = 0; at < MINIMUM_CLAUDE.length; at += 1) {
    const mine = MINIMUM_CLAUDE[at] ?? 0;
    const theirs = found[at] ?? 0;
    if (theirs !== mine) return theirs > mine;
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
 * that says whether it describes the build being shipped for; the
 * modification time is carried along so that when several name the same
 * build, the freshest is the one picked.
 *
 * The two roots are deduplicated rather than trusted to differ. On macOS they
 * do (`/tmp` is a symlink under `/private`, `tmpdir()` is under
 * `/var/folders`), but on Linux they are the same directory and every
 * declaration would be collected twice.
 */
function findDeclarations() {
  const roots = ["/tmp", tmpdir()];
  const found = [];
  const seen = new Set();
  for (const tempRoot of roots) {
    const claudeDirs = existsSync(tempRoot) ? readdirSync(tempRoot) : [];
    for (const claudeDir of claudeDirs.filter((name) =>
      name.startsWith("claude-"),
    )) {
      const skills = join(tempRoot, claudeDir, "bundled-skills");
      if (!existsSync(skills)) continue;
      for (const version of readdirSync(skills)) {
        const versionDir = join(skills, version);
        for (const hash of readdirSync(versionDir)) {
          const candidate = join(
            versionDir,
            hash,
            "plugin-authoring/types/claude-code.d.ts",
          );
          if (!existsSync(candidate) || seen.has(candidate)) continue;
          seen.add(candidate);
          const wrote =
            readFileSync(candidate, "utf8").split("\n")[0]?.trim() ?? "";
          found.push({
            path: candidate,
            wrote,
            version,
            mtimeMs: statSync(candidate).mtimeMs,
          });
        }
      }
    }
  }

  return found;
}

const claude = output("claude", ["--version"]);
if (claude?.status !== 0) {
  console.error(
    "The `claude` CLI is required to run the mod's tests and was not found on PATH.",
  );
  process.exit(1);
}
const claudeVersion = versionIn(claude.stdout);
if (claudeVersion === null || !versionAtLeast(claudeVersion)) {
  console.error(
    `Mods need Claude Code ${MINIMUM_CLAUDE.join(".")} or later; this is ${claude.stdout}.`,
  );
  process.exit(1);
}

/**
 * The declaration that names the RUNNING Claude Code, and every declaration
 * found beside it. The rejected ones are returned rather than dropped, so a
 * run that reaches the typecheck with nothing to check against can name what
 * it saw instead of reading as an empty machine.
 *
 * There is no fallback to another version's declaration on purpose. A
 * typecheck against a declaration from a different Claude Code is a different
 * measurement wearing this one's name, and the whole point of naming the
 * declaration in the result is that the two are told apart.
 */
function pickDeclaration(version) {
  const all = findDeclarations();
  const matching = all.filter(
    (one) => one.wrote === `// Written by Claude Code ${version}.`,
  );
  matching.sort((left, right) => right.mtimeMs - left.mtimeMs);

  return { picked: matching[0] ?? null, all };
}

const tsc = join(root, "node_modules", ".bin", "tsc");
if (!existsSync(tsc)) {
  console.error(
    "TypeScript is not installed in this checkout; run `bun install` before the mod's typecheck.",
  );
  process.exit(1);
}

// A missing shipped entry would make the stage a partial copy, and `cp` would
// throw a bare ENOENT before the guard below could run -- so the entries are
// named here instead. A run that could not stage is a run that tested nothing,
// and it must say that rather than end in a stack trace.
const absent = SHIPPED.filter((entry) => !existsSync(join(root, entry)));
if (absent.length > 0) {
  console.error(
    `Shipped directories are absent from the checkout (${absent.join(", ")}); nothing was tested.`,
  );
  process.exit(1);
}

// The stage is realpath'd: on macOS the temp root is a symlink (/tmp), and a
// path through it is a path the tools may treat as a different directory.
const staged = await realpath(await mkdtemp(join(tmpdir(), "quest-mod-")));
await cp(join(root, ".claude-plugin"), join(staged, ".claude-plugin"), {
  recursive: true,
});
for (const entry of SHIPPED) {
  await cp(join(root, entry), join(staged, entry), { recursive: true });
}
if (!existsSync(join(staged, "hooks", "register.tsx"))) {
  // A stage that did not copy is a run that tested nothing, and it would
  // otherwise pass.
  console.error(
    `The stage at ${staged} has no hooks module; nothing was tested.`,
  );
  process.exit(1);
}

let failed = false;
// Named in the closing line, so a run that skipped the typecheck cannot be read
// as one that passed it -- the difference between the two is invisible in an
// exit code, and an exit code is what CI reads.
let typecheck = "NOT RUN";
const step = (name, command, args) => {
  const status = run(command, args);
  if (status !== 0) {
    failed = true;
    console.error(`\n${name} failed with exit ${status}.`);
  }

  return status === 0;
};

console.log(
  `Claude Code: ${claude.stdout} (mods need ${MINIMUM_CLAUDE.join(".")}+)`,
);
console.log(`Staged: ${staged}\n`);
// --strict is the CI arm of the validator: it fails on the unrecognized fields
// and missing metadata the runtime merely tolerates.
step("claude plugin validate --strict", "claude", [
  "plugin",
  "validate",
  "--strict",
  staged,
]);
step("claude plugin test", "claude", ["plugin", "test", staged]);

const laid = join(staged, ".claude-plugin", "types", "tsconfig.json");
const { picked: bundled, all } = existsSync(laid)
  ? { picked: null, all: [] }
  : pickDeclaration(claudeVersion);
if (existsSync(laid)) {
  if (step(`tsc (${laid})`, tsc, ["-p", laid])) {
    typecheck = `clean, against the declaration the engine laid at ${laid}`;
  }
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
  if (step("tsc", tsc, ["-p", config])) {
    typecheck = `clean, against the plugin-authoring skill's ${bundled.version} declaration at ${bundled.path}`;
  }
} else {
  typecheck = `NOT TYPECHECKED -- no declaration for Claude Code ${claudeVersion} on this machine`;
  // What was seen, not just what was missing: an empty machine and a machine
  // carrying three other versions' declarations are different states, and
  // "none found" reads as the first whichever one it is.
  const saw =
    all.length === 0
      ? "no engine declaration at all"
      : `no declaration for Claude Code ${claudeVersion}; saw ${all
          .map((one) =>
            one.wrote
              .replace("// Written by Claude Code ", "")
              .replace(/\.$/u, ""),
          )
          .join(", ")}`;
  console.log(
    `\nNOT TYPECHECKED: ${saw}. Load the plugin in a session (a --plugin-dir or the\n` +
      "mods folder) to have a declaration laid beside it, or run the plugin-authoring\n" +
      "skill once, which writes the same declaration into the temp directory.",
  );
}

if (failed) {
  console.error(`\nThe stage is kept for inspection: ${staged}`);
  process.exit(1);
}
await rm(staged, { recursive: true, force: true });
console.log(`\nThe mod validates and its tests pass. Typecheck: ${typecheck}.`);
