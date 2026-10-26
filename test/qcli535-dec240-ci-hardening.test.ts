import { expect, test } from "bun:test";
import {
  mkdtemp,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * QCLI-535, DEC-240 (opum-doc, 2026-10-25): the CI-hardening rules this
 * repository's workflows must keep. Each rule has the scan that holds the
 * workflows to it and, where a behaviour is claimed, the proof run BOTH ways:
 * the hardened form succeeds and the unhardened control does not.
 */

const REPO = join(import.meta.dir, "..");
const WORKFLOWS = join(REPO, ".github/workflows");
const reader = join(REPO, "scripts/read-declared-quest-version.mjs");

async function workflows(): Promise<{ name: string; lines: string[] }[]> {
  const names = (await readdir(WORKFLOWS)).filter((n) => n.endsWith(".yml"));
  expect(names.length).toBeGreaterThan(0);
  return Promise.all(
    names.map(async (name) => ({
      name,
      lines: (await readFile(join(WORKFLOWS, name), "utf8")).split("\n"),
    })),
  );
}

async function spawn(cmd: string[], cwd?: string) {
  const child = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { stdout, stderr, exitCode };
}

test("DEC-240 (2): every actions/checkout step sets persist-credentials: false", async () => {
  let checkouts = 0;
  for (const { name, lines } of await workflows()) {
    lines.forEach((line, index) => {
      const step = /^(\s*)- uses: actions\/checkout@/.exec(line);
      if (!step) return;
      checkouts += 1;
      // The step's own keys: every following line indented deeper than `- `,
      // up to the next step or dedent.
      const body: string[] = [];
      for (const next of lines.slice(index + 1)) {
        if (next.trim() === "") continue;
        const indent = next.length - next.trimStart().length;
        if (indent <= (step[1] ?? "").length) break;
        body.push(next.trim());
      }
      expect(
        body.includes("persist-credentials: false"),
        `${name}:${index + 1} actions/checkout must set persist-credentials: false (no job here pushes with the token)`,
      ).toBe(true);
    });
  }
  // A positive control: the scan read the checkouts it claims to cover.
  // Exactly the checkout steps there are: a new one is a deliberate edit here.
  expect(checkouts).toBe(10);
});

test("DEC-240 (4): no step output is interpolated inside a run: body", async () => {
  let outputs = 0;
  for (const { name, lines } of await workflows()) {
    lines.forEach((line, index) => {
      if (!/\$\{\{[^}]*\bsteps\./.test(line)) return;
      outputs += 1;
      // A `key: ${{ ... }}` line (env:, with:, if:) is the sanctioned form;
      // `run:` is not a key whose value may carry an expression.
      const key = /^\s*(?:- )?([A-Za-z_][\w-]*):\s/.exec(line);
      expect(
        key !== null && key[1] !== "run",
        `${name}:${index + 1} interpolates a step output into a shell body: ${line.trim()}`,
      ).toBe(true);
    });
  }
  // The scan met the env:/with:/if: uses it permits, so it read real lines.
  expect(outputs).toBeGreaterThan(0);
});

test("DEC-240 (1): every npm install of lore or quest passes --ignore-scripts", async () => {
  let installs = 0;
  for (const { name, lines } of await workflows()) {
    lines.forEach((line, index) => {
      if (!/npm install\b/.test(line) || !/@opum-ai\/(lore|quest)\b/.test(line))
        return;
      installs += 1;
      expect(
        line.includes("--ignore-scripts"),
        `${name}:${index + 1} installs lore or quest without --ignore-scripts: ${line.trim()}`,
      ).toBe(true);
    });
  }
  expect(installs).toBeGreaterThanOrEqual(1);
});

test("DEC-240 (1): every npm install a script runs passes --ignore-scripts", async () => {
  // Workflows reach installs through the scripts they invoke (QCLI-535 review
  // F1: lore-pin-staleness.mjs installs lore on a runner holding GH_TOKEN).
  // Scan every script rather than guess which ones a workflow names.
  const dirs = ["scripts", "scripts/qualification"];
  let installs = 0;
  for (const dir of dirs) {
    const entries = (await readdir(join(REPO, dir))).filter((n) =>
      /\.(mjs|ts)$/.test(n),
    );
    for (const name of entries) {
      const text = await readFile(join(REPO, dir, name), "utf8");
      for (const call of text.matchAll(/"npm",\s*\[([^\]]*)\]/g)) {
        const args = call[1] ?? "";
        if (!/"install"/.test(args)) continue;
        installs += 1;
        expect(
          args.includes('"--ignore-scripts"'),
          `${dir}/${name} runs an npm install without --ignore-scripts`,
        ).toBe(true);
      }
    }
  }
  // The scan found the installs it claims to cover: exportSchemas and the
  // candidate clean install at least.
  expect(installs).toBeGreaterThanOrEqual(2);
});

const MARKER = "DEC240_POSTINSTALL_RAN";

test("DEC-240 (1): an install with a failing postinstall dependency succeeds only with --ignore-scripts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "qcli535-npm-"));
  try {
    const dep = join(dir, "dep");
    await mkdir(dep);
    await writeFile(
      join(dep, "package.json"),
      JSON.stringify({
        name: "dec240-failing-postinstall",
        version: "1.0.0",
        scripts: { postinstall: `echo ${MARKER} >&2; exit 1` },
      }),
    );
    // A directory dependency is symlinked and never runs its own lifecycle
    // scripts, so the control would pass vacuously; a packed tarball is
    // installed as a copy, which is how a registry dependency arrives.
    const packed = await spawn(
      ["npm", "pack", "--pack-destination", dir, dep],
      dir,
    );
    expect(packed.exitCode).toBe(0);
    const tarball = join(dir, packed.stdout.trim().split("\n").pop() ?? "");
    // The same install both times; the only difference is --ignore-scripts.
    // npm 12 blocks dependency scripts by default (allowScripts) while npm 11,
    // which a runner's Node 24 ships, runs them, so BOTH arms force scripts on
    // explicitly and mean the same on either. The flag is an unknown config to
    // npm 11, which warns and carries on.
    const base = [
      "npm",
      "install",
      "--no-audit",
      "--no-fund",
      "--offline",
      "--package-lock=false",
      "--dangerously-allow-all-scripts",
    ];
    const hardened = join(dir, "hardened");
    const control = join(dir, "control");
    await mkdir(hardened);
    await mkdir(control);
    const ok = await spawn(
      [...base, "--ignore-scripts", "--prefix", hardened, tarball],
      dir,
    );
    expect(ok.exitCode).toBe(0);
    expect(`${ok.stdout}${ok.stderr}`).not.toContain(MARKER);
    // The control fails BECAUSE the postinstall ran and failed, not for some
    // unrelated reason: its output names the script's own marker.
    const bad = await spawn([...base, "--prefix", control, tarball], dir);
    expect(bad.exitCode).not.toBe(0);
    expect(`${bad.stdout}${bad.stderr}`).toContain(MARKER);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

const BEGIN = "<!-- quest:agent-instructions:begin -->";
const END = "<!-- quest:agent-instructions:end -->";

async function readVersion(inside: string, outside = "") {
  const dir = await mkdtemp(join(tmpdir(), "qcli535-ver-"));
  try {
    const file = join(dir, "CLAUDE.md");
    await writeFile(file, `${outside}\n${BEGIN}\n${inside}\n${END}\n`);
    return await spawn(["node", reader, file]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("DEC-240 (3): the Quest version is read only inside the markers, and only an exact X.Y.Z", async () => {
  const good = await readVersion(
    "This project uses Quest CLI 0.14.1 for tracker operations. A guide for the Quest CLI version lives elsewhere.",
    "Quest CLI 9.9.9 outside the block is never read.",
  );
  expect(good.exitCode).toBe(0);
  expect(good.stdout).toBe("0.14.1\n");

  for (const partial of [
    "0.14",
    "0",
    "^0.14.1",
    "~0.14.1",
    "0.14.x",
    "0.14.1-rc.1",
    "v0.14.1",
    "0.14.1.2",
  ]) {
    const result = await readVersion(
      `This project uses Quest CLI ${partial} for tracker operations.`,
    );
    expect(result.exitCode, partial).toBe(1);
    // Failed by name, printing nothing a later step could consume.
    expect(result.stdout, partial).toBe("");
    expect(result.stderr, partial).toContain("::error file=");
    expect(result.stderr, partial).toContain("is not exactly X.Y.Z");
    expect(result.stderr, partial).toContain(JSON.stringify(partial));
  }
});

test("DEC-240 (3): a version outside the markers, or two inside, or none, is refused", async () => {
  const outside = await readVersion(
    "No version line here.",
    "Quest CLI 0.14.1",
  );
  expect(outside.exitCode).toBe(1);
  expect(outside.stdout).toBe("");
  expect(outside.stderr).toContain("No 'Quest CLI <version>' line found");

  const two = await readVersion("Quest CLI 0.14.1 and Quest CLI 0.15.0");
  expect(two.exitCode).toBe(1);
  expect(two.stderr).toContain("more than one Quest CLI version");

  const dir = await mkdtemp(join(tmpdir(), "qcli535-nomark-"));
  try {
    const file = join(dir, "CLAUDE.md");
    await writeFile(file, "Quest CLI 0.14.1\n");
    const bare = await spawn(["node", reader, file]);
    expect(bare.exitCode).toBe(1);
    expect(bare.stderr).toContain("must each appear exactly once");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("DEC-240 (3): this repository's own CLAUDE.md reads, and the workflow uses the reader", async () => {
  const own = await spawn(["node", reader, join(REPO, "CLAUDE.md")]);
  expect(own.exitCode).toBe(0);
  const packaged = JSON.parse(
    await readFile(join(REPO, "package.json"), "utf8"),
  ).version;
  expect(own.stdout.trim()).toBe(packaged);
  const tracker = await readFile(
    join(WORKFLOWS, "tracker-integrity.yml"),
    "utf8",
  );
  expect(tracker).toContain("scripts/read-declared-quest-version.mjs");
  // The loose regex that accepted a prefix of a partial version is gone.
  expect(tracker).not.toContain("[0-9][0-9.]*");
});

test("DEC-240 (3): each marker must appear exactly once, in order, and CRLF files read", async () => {
  const dir = await mkdtemp(join(tmpdir(), "qcli535-marks-"));
  try {
    const run = async (body: string) => {
      const file = join(dir, "CLAUDE.md");
      await writeFile(file, body);
      return spawn(["node", reader, file]);
    };
    const line = "Quest CLI 0.14.1 for tracker operations.";
    const refused = [
      ["a repeated begin", `${BEGIN}\n${BEGIN}\n${line}\n${END}\n`],
      ["a repeated end", `${BEGIN}\n${line}\n${END}\n${END}\n`],
      [
        "two whole blocks",
        `${BEGIN}\n${line}\n${END}\n${BEGIN}\n${line}\n${END}\n`,
      ],
      ["reversed markers", `${END}\n${line}\n${BEGIN}\n`],
      ["no end marker", `${BEGIN}\n${line}\n`],
      ["no begin marker", `${line}\n${END}\n`],
    ] as const;
    for (const [name, body] of refused) {
      const result = await run(body);
      expect(result.exitCode, name).toBe(1);
      expect(result.stdout, name).toBe("");
      expect(result.stderr, name).toContain("must each appear exactly once");
    }
    // CRLF line endings read the same, and a partial version is still refused.
    const crlf = await run(`${BEGIN}\r\n${line}\r\n${END}\r\n`);
    expect(crlf.exitCode).toBe(0);
    expect(crlf.stdout).toBe("0.14.1\n");
    const crlfPartial = await run(
      `${BEGIN}\r\nQuest CLI 0.14 for x.\r\n${END}\r\n`,
    );
    expect(crlfPartial.exitCode).toBe(1);
    expect(crlfPartial.stderr).toContain("is not exactly X.Y.Z");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
