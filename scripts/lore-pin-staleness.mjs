// Reports when the lore pinned by the `lore check` gate falls behind the
// newest published lore (QCLI-358). Ruled in opum-doc
// docs/adr/detect-a-stale-lore-pin-without-touching-a-required-ci-context.md.
//
// WHY THE GATE CANNOT SEE THIS ITSELF. `lore check` runs AT the pinned
// version and compares the committed schemas against what THAT version
// generates, so it is self-consistent by construction and stays green as the
// pin falls behind. Nothing inside the run can know a newer lore exists. The
// pin sat at lore 0.7.0, which had no schema-drift detection at all, while a
// REQUIRED context reported success on a class it could not represent. The
// same closed loop is recorded on lore-cli as LCLI-504/LCLI-508. If you are
// about to delete this detector: it is not a redundant check. It is the only
// thing that can tell "both green" apart from "one of them has no opinion".
//
// WHY IT IS NOT IN THE GATE. It reads npm. A network read in a required
// context gating promotion makes that context flaky, and a flaky required
// check teaches people to re-run until green, which destroys the signal. So
// this runs from its own scheduled, non-required workflow
// (.github/workflows/lore-pin-staleness.yml), and it opens or updates ONE
// issue rather than failing anything.
//
// WHAT IT DISTINGUISHES. A pin that is merely behind, and one that is behind
// AND would change schema generation. It exports the schemas under both
// versions to tell them apart. Only the second needs the two-step bump that
// lore-check.yml's header documents: regenerate the schemas with the new lore,
// THEN move the pin.
//
//   node scripts/lore-pin-staleness.mjs                  # report to stdout only
//   node scripts/lore-pin-staleness.mjs --issue          # also open/update/close the issue
//   node scripts/lore-pin-staleness.mjs --newest 0.9.3   # skip the npm read (proofs)
//   node scripts/lore-pin-staleness.mjs --pin 0.9.2      # override the pin read (proofs)

import { execFile as execFileCallback } from "node:child_process";
import { realpathSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { REGISTRY_PINS } from "./qualification/registry-visibility.mjs";

const execFile = promisify(execFileCallback);
const root = fileURLToPath(new URL("..", import.meta.url));

export const LORE_PACKAGE = "@opum-ai/lore";
export const GATE_WORKFLOW = ".github/workflows/lore-check.yml";
export const ISSUE_LABEL = "lore-pin-stale";
const RELEASE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

const defaultRun = (command, args, options = {}) =>
  execFile(command, args, { maxBuffer: 64 * 1024 * 1024, ...options });

/** The one pinned lore version in the gate workflow. Refuses zero or several. */
export function readPin(workflowText) {
  const pins = [
    ...workflowText.matchAll(
      /npm install -g @opum-ai\/lore@([0-9A-Za-z.+-]+)\b/g,
    ),
  ].map((match) => match[1]);
  if (pins.length !== 1)
    throw new Error(
      `${GATE_WORKFLOW} must install exactly one pinned lore, found ${pins.length}: ${JSON.stringify(pins)}`,
    );
  if (!RELEASE.test(pins[0]))
    throw new Error(`the pinned lore ${JSON.stringify(pins[0])} is not X.Y.Z`);
  return pins[0];
}

/** Negative, zero or positive as `a` is older than, equal to or newer than `b`. */
export function compareVersions(a, b) {
  const [left, right] = [a.split("."), b.split(".")];
  for (let i = 0; i < 3; i++) {
    const [l, r] = [left[i] ?? "", right[i] ?? ""];
    if (l.length !== r.length) return l.length - r.length;
    if (l !== r) return l < r ? -1 : 1;
  }
  return 0;
}

/** npm's `latest` for lore, read anonymously from the public registry. */
export async function readNewest({ run = defaultRun } = {}) {
  const { stdout } = await run("npm", [
    "view",
    `${LORE_PACKAGE}@latest`,
    "version",
    ...REGISTRY_PINS,
  ]);
  const version = stdout.trim();
  if (!RELEASE.test(version))
    throw new Error(
      `npm answered ${JSON.stringify(version)} for ${LORE_PACKAGE}@latest`,
    );
  return version;
}

/**
 * The schemas `lore schema export` writes at `version`, from a bare copy of
 * this commit's .lore/ and docs/ (the export needs no tracker). Keyed by
 * file name.
 */
export async function exportSchemas(version, { run = defaultRun } = {}) {
  const scratch = await mkdtemp(join(tmpdir(), "lore-pin-staleness-"));
  // The copy lore exports from, and the lore that exports it, side by side
  // so the installed tool is never inside the tree being exported.
  const [work, tool] = [join(scratch, "repo"), join(scratch, "tool")];
  try {
    await run("bash", [
      "-c",
      'set -o pipefail; mkdir -p "$1" && git -C "$0" archive HEAD .lore docs | tar -x -C "$1" && rm -rf "$1/.lore/schemas" && git -C "$1" init -q',
      root,
      work,
    ]);
    // Installed into its own prefix rather than run through npx, so the
    // fetch carries both registry pins like every other release-script npm
    // call (QCLI-400), and the version exported is exactly the one named.
    await run("npm", [
      "install",
      "--prefix",
      tool,
      "--no-save",
      "--no-audit",
      "--no-fund",
      ...REGISTRY_PINS,
      `${LORE_PACKAGE}@${version}`,
    ]);
    await run(
      join(tool, "node_modules", ".bin", "lore"),
      ["schema", "export"],
      {
        cwd: work,
      },
    );
    const dir = join(work, ".lore", "schemas");
    const names = (await readdir(dir)).filter((name) => name.endsWith(".json"));
    if (names.length === 0)
      throw new Error(`lore ${version} exported no schemas`);
    const schemas = new Map();
    for (const name of names.sort())
      schemas.set(name, await readFile(join(dir, name), "utf8"));
    return schemas;
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}

/** File names that differ between two exports: changed, added or removed. */
export function schemaDifferences(a, b) {
  const names = [...new Set([...a.keys(), ...b.keys()])].sort();
  return names.filter((name) => a.get(name) !== b.get(name));
}

/**
 * The verdict. `current` when the pin is the newest (or newer, which a pin
 * ahead of npm's latest can legitimately be mid-release). Otherwise `behind`,
 * and `schemaChanging` says whether the two-step bump is needed.
 */
export async function evaluate({ pin, newest, schemasAt }) {
  if (compareVersions(pin, newest) >= 0)
    return { state: "current", pin, newest };
  const [pinned, latest] = [await schemasAt(pin), await schemasAt(newest)];
  const differences = schemaDifferences(pinned, latest);
  return {
    state: "behind",
    pin,
    newest,
    schemaChanging: differences.length > 0,
    differences,
    schemasRead: { [pin]: pinned.size, [newest]: latest.size },
  };
}

export function issueTitle(verdict) {
  return `lore pin is behind: ${verdict.pin} -> ${verdict.newest}${verdict.schemaChanging ? " (schema-changing)" : ""}`;
}

export function issueBody(verdict) {
  const steps = verdict.schemaChanging
    ? [
        `lore ${verdict.newest} generates different schemas from ${verdict.pin} (${verdict.differences.join(", ")}), so this needs the two-step bump in ${GATE_WORKFLOW}'s header:`,
        "",
        `1. Regenerate the schemas with the new lore: \`npx --yes ${LORE_PACKAGE}@${verdict.newest} schema export\`, and commit them.`,
        `2. Then move the pin in ${GATE_WORKFLOW} to ${verdict.newest}.`,
        "",
        "A pin-only change reds the gate, which reads as a broken pin rather than stale schemas.",
      ]
    : [
        `lore ${verdict.newest} generates the same schemas as ${verdict.pin} (${Object.values(verdict.schemasRead).join(" and ")} files compared), so moving the pin in ${GATE_WORKFLOW} is a one-line change.`,
      ];
  return [
    `The \`lore check\` gate installs lore ${verdict.pin}. npm's latest is ${verdict.newest}.`,
    "",
    ...steps,
    "",
    "Opened by `scripts/lore-pin-staleness.mjs` (QCLI-358), from the scheduled, non-required `lore-pin-staleness` workflow. The gate cannot report this itself, because it runs at the pinned version. This issue closes itself on the first run that finds the pin current.",
  ].join("\n");
}

/**
 * Keeps exactly one open issue carrying ISSUE_LABEL in step with the verdict:
 * open or update it while behind, close it once current. Returns what it did.
 */
export async function syncIssue(verdict, { run = defaultRun } = {}) {
  const gh = (args) => run("gh", args);
  const { stdout } = await gh([
    "issue",
    "list",
    "--label",
    ISSUE_LABEL,
    "--state",
    "open",
    "--json",
    "number,title",
  ]);
  const open = JSON.parse(stdout);
  if (!Array.isArray(open))
    throw new Error(`gh issue list answered ${stdout.trim()}`);
  if (verdict.state === "current") {
    for (const issue of open)
      await gh([
        "issue",
        "close",
        String(issue.number),
        "--comment",
        `The pin is current: lore ${verdict.pin}, npm latest ${verdict.newest}.`,
      ]);
    return open.length
      ? `closed ${open.map((i) => `#${i.number}`).join(", ")}`
      : "nothing open, nothing to do";
  }
  const [title, body] = [issueTitle(verdict), issueBody(verdict)];
  if (open.length === 0) {
    await gh([
      "label",
      "create",
      ISSUE_LABEL,
      "--force",
      "--color",
      "d93f0b",
      "--description",
      "The lore check gate's pinned lore is behind npm latest (QCLI-358)",
    ]);
    await gh([
      "issue",
      "create",
      "--title",
      title,
      "--body",
      body,
      "--label",
      ISSUE_LABEL,
    ]);
    return "opened a new issue";
  }
  const [keep, ...extra] = open;
  if (keep.title !== title)
    await gh([
      "issue",
      "comment",
      String(keep.number),
      "--body",
      `Now: ${title}.`,
    ]);
  await gh([
    "issue",
    "edit",
    String(keep.number),
    "--title",
    title,
    "--body",
    body,
  ]);
  for (const issue of extra)
    await gh([
      "issue",
      "close",
      String(issue.number),
      "--comment",
      `Duplicate of #${keep.number}.`,
    ]);
  return `updated #${keep.number}${extra.length ? `, closed ${extra.length} duplicate(s)` : ""}`;
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${name} requires a value`);
    return value;
  };
  const pin =
    flag("--pin") ?? readPin(await readFile(join(root, GATE_WORKFLOW), "utf8"));
  const newest = flag("--newest") ?? (await readNewest());
  const verdict = await evaluate({
    pin,
    newest,
    schemasAt: (version) => exportSchemas(version),
  });
  console.log(JSON.stringify(verdict, null, 2));
  if (argv.includes("--issue"))
    console.log(`issue: ${await syncIssue(verdict)}`);
}

// Compared by real path on both sides, so a symlinked invocation still runs
// main() instead of exiting 0 having done nothing (QCLI-404).
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
)
  main(process.argv.slice(2)).catch((error) => {
    console.error(`lore-pin-staleness: ${error.message}`);
    process.exit(1);
  });
