import { beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import type {
  AcrossRefsCachePort,
  AcrossRefsCacheResult,
  AcrossRefsCachedRecord,
} from "../src/application/refs/across-refs-cache.ts";
import {
  AcrossRefsCache,
  acrossRefsRefKey,
  readAcrossRefsCache,
  writeAcrossRefsCache,
} from "../src/application/refs/across-refs-cache.ts";
import {
  type AcrossRefsCoverage,
  type AcrossRefsEntry,
  type AcrossRefsOutcome,
  AcrossRefsViewService,
} from "../src/application/refs/across-refs.ts";
import type {
  DiscoveredPullRequest,
  OriginRemote,
  RefDiscoveryPort,
} from "../src/ports/ref-discovery.ts";

/**
 * QCLI-563: `quest task list --across-refs` caches each ref's parsed records,
 * keyed by that ref's `.quest` TREE HASH (`git rev-parse <sha>:.quest`), under
 * the clone's git common dir. This suite pins the properties the cache has to
 * hold:
 *
 *   - a second call with unchanged refs reads NO record (AC4) -- proven by
 *     counting `listFilesRequired`/`readBlob` calls through the injected port,
 *     never by timing;
 *   - a changed ref re-reads ONLY that ref, because its tree hash changed;
 *   - two refs whose commits differ but whose `.quest` tree is identical share
 *     one read, which is what makes the key the TREE and not the ref or sha;
 *   - a corrupt cache entry falls back to a normal read instead of failing;
 *   - an UNREADABLE ref is never cached as empty, so coverage stays honest.
 *
 * The fixtures are real Git repositories with real commits and trees: the hash
 * this cache keys on only exists if the commit graph is real. The forge seam is
 * injected, as in the QCLI-417 suite, so nothing here touches the network.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;

interface Run {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(cwd: string, argv: readonly string[]): Run {
  const child = Bun.spawnSync([...argv], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, QUEST_AGENT_PLUGINS: "off" },
  });
  return {
    exitCode: child.exitCode ?? 1,
    stdout: child.stdout.toString(),
    stderr: child.stderr.toString(),
  };
}

function git(cwd: string, ...args: readonly string[]): string {
  const result = run(cwd, ["git", ...args]);
  if (result.exitCode !== 0)
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}

const quest = (cwd: string, args: readonly string[]): Run =>
  run(cwd, [process.execPath, MAIN, ...args]);

/**
 * A minimal but schema-valid task record. Written directly rather than through
 * `task create` because the point of the fixture is its Git TREE, and one file
 * per record is exactly what a ref read lists and parses.
 */
function taskRecord(id: string, title: string, status = "To Do"): string {
  return JSON.stringify({
    id,
    aliases: [id],
    title,
    status,
    acceptanceCriteria: [],
    definitionOfDone: [],
    plan: [],
    implementationNotes: [],
    comments: [],
    labels: [],
    documentation: [],
    dependencies: [],
    blockers: [],
    gates: [],
    gateEvents: [],
  });
}

interface Fixture {
  readonly root: string;
  /** dev carries T-1 and T-2. */
  readonly devSha: string;
  /** A branch off dev that changes a file OUTSIDE `.quest`, so its `.quest`
   *  tree -- and therefore its cache key -- is identical to dev's. */
  readonly copySha: string;
  /** A branch off dev that adds T-3, so it has a `.quest` tree of its own. */
  readonly featureSha: string;
  /** A branch off dev carrying a MALFORMED record, so a read of it fails. */
  readonly brokenSha: string;
  /** A branch off dev with `.quest` REMOVED, so it has no `.quest` tree at all. */
  readonly noQuestSha: string;
}

async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "qcli563-"));
  git(root, "init", "-q", "-b", "dev", ".");
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  expect(
    quest(root, ["init", "--name", "Q563", "--task-id-prefix", "T", "--json"])
      .exitCode,
  ).toBe(0);
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  await writeFile(
    join(root, ".quest", "tasks", "T-1.json"),
    taskRecord("T-1", "on dev"),
  );
  await writeFile(
    join(root, ".quest", "tasks", "T-2.json"),
    taskRecord("T-2", "also on dev", "In Progress"),
  );
  git(root, "add", "-A");
  git(root, "commit", "-qm", "T-1 and T-2 on dev");
  const devSha = git(root, "rev-parse", "refs/heads/dev");

  // Distinct commit, identical `.quest` tree: the tree hash must collapse them.
  git(root, "checkout", "-q", "-b", "copy", "dev");
  await writeFile(join(root, "outside.txt"), "a change outside .quest\n");
  git(root, "add", "outside.txt");
  git(root, "commit", "-qm", "outside .quest only");
  const copySha = git(root, "rev-parse", "refs/heads/copy");
  git(root, "checkout", "-q", "dev");

  git(root, "checkout", "-q", "-b", "feature", "dev");
  await writeFile(
    join(root, ".quest", "tasks", "T-3.json"),
    taskRecord("T-3", "only on feature"),
  );
  git(root, "add", "-A");
  git(root, "commit", "-qm", "T-3 on feature");
  const featureSha = git(root, "rev-parse", "refs/heads/feature");
  git(root, "checkout", "-q", "dev");

  git(root, "checkout", "-q", "-b", "broken", "dev");
  await writeFile(
    join(root, ".quest", "tasks", "T-4.json"),
    "{ not valid json",
  );
  git(root, "add", "-A");
  git(root, "commit", "-qm", "a malformed T-4");
  const brokenSha = git(root, "rev-parse", "refs/heads/broken");
  git(root, "checkout", "-q", "dev");

  // A ref with NO `.quest` tree at all: distinct from both a ref that reads as
  // empty and one that is unreadable.
  git(root, "checkout", "-q", "-b", "noquest", "dev");
  git(root, "rm", "-rq", ".quest");
  git(root, "commit", "-qm", "no .quest at all");
  const noQuestSha = git(root, "rev-parse", "refs/heads/noquest");
  git(root, "checkout", "-q", "dev");

  return {
    root,
    devSha,
    copySha,
    featureSha,
    brokenSha,
    noQuestSha,
  };
}

const discovery: RefDiscoveryPort = {
  async origin(): Promise<OriginRemote> {
    return { kind: "github", slug: "opum-ai/fixture" };
  },
  async listOpenPullRequests(): Promise<readonly DiscoveredPullRequest[]> {
    return [];
  },
};

/**
 * Wraps the REAL Git port and records every RECORD read (`listFilesRequired`
 * and `readBlob`) with the revision it read. Counting these two -- and not
 * `readRevision`, `hasRevision` or `treeHash` -- is the no-read proof: those
 * three are metadata probes the cache key itself depends on, and the claim is
 * that the RECORDS are not re-read.
 */
function instrumented(port: LocalGitPort, calls: string[]): LocalGitPort {
  const list = port.listFilesRequired.bind(port);
  port.listFilesRequired = async (repositoryPath, revision, prefix) => {
    calls.push(`list ${revision}`);
    return list(repositoryPath, revision, prefix);
  };
  const blob = port.readBlob.bind(port);
  port.readBlob = async (repositoryPath, revision, path) => {
    calls.push(`blob ${revision} ${path}`);
    return blob(repositoryPath, revision, path);
  };
  return port;
}

async function viewWith(
  root: string,
  refs: readonly string[],
): Promise<{
  entries: readonly AcrossRefsEntry[];
  coverage: AcrossRefsCoverage;
}> {
  const port = instrumentedCalls(root);
  const outcome: AcrossRefsOutcome = await new AcrossRefsViewService(
    port.port,
    discovery,
  ).view({ repositoryPath: root, refs, allowPartial: false });
  if (outcome.kind !== "view")
    throw new Error(`expected a view, got absent(${outcome.detail})`);
  lastCalls = port.calls;
  return { entries: outcome.entries, coverage: outcome.coverage };
}

// Per-call read recording, kept simple because the service is sequential.
let lastCalls: string[] = [];
function instrumentedCalls(root: string): {
  port: LocalGitPort;
  calls: string[];
} {
  void root;
  const calls: string[] = [];
  return { port: instrumented(new LocalGitPort(), calls), calls };
}

let fixture: Fixture;

beforeAll(async () => {
  fixture = await createFixture();
}, 120_000);

const entriesById = (entries: readonly AcrossRefsEntry[]) =>
  new Map(entries.map((entry) => [entry.id, entry]));

/** The shared cache directory for the fixture's clone. */
function cacheDirectory(root: string): string {
  return join(
    root,
    git(root, "rev-parse", "--git-common-dir"),
    "quest",
    "across-refs-cache",
  );
}

/** Several tests need a COLD cache to observe a first read; the fixture is
 *  shared, so each such test clears it rather than depending on file order. */
async function clearCache(root: string): Promise<void> {
  await rm(cacheDirectory(root), { recursive: true, force: true });
}

test("a second call with unchanged refs reads NO record (AC4)", async () => {
  await clearCache(fixture.root);
  const refs = ["refs/heads/dev", "refs/heads/copy"];
  const first = await viewWith(fixture.root, refs);
  expect(lastCalls.length).toBeGreaterThan(0);

  // A FRESH service, so this cannot be the in-process map: the answer must come
  // from the on-disk cache under the git common dir.
  const second = await viewWith(fixture.root, refs);
  expect(lastCalls).toEqual([]);
  expect(JSON.stringify(second.entries)).toBe(JSON.stringify(first.entries));
  expect(second.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/dev",
    "refs/heads/copy",
  ]);
});

test("the cache key is the .quest TREE, not the ref or its sha (two shas, one read)", async () => {
  await clearCache(fixture.root);
  expect(fixture.devSha).not.toBe(fixture.copySha);
  expect(git(fixture.root, "rev-parse", "refs/heads/dev:.quest")).toBe(
    git(fixture.root, "rev-parse", "refs/heads/copy:.quest"),
  );
  const { entries } = await viewWith(fixture.root, [
    "refs/heads/dev",
    "refs/heads/copy",
  ]);
  // Only the FIRST planned ref's sha was read; the second, whose commit differs
  // but whose tree is the same, was answered from the cache.
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(lastCalls.every((call) => call.includes(fixture.devSha))).toBe(true);
  expect(lastCalls.some((call) => call.includes(fixture.copySha))).toBe(false);
  expect(entriesById(entries).has("T-1")).toBe(true);
});

test("a changed ref re-reads ONLY that ref", async () => {
  await clearCache(fixture.root);
  const refs = ["refs/heads/dev", "refs/heads/feature"];
  await viewWith(fixture.root, refs);

  // Move dev's `.quest` tree; feature is untouched.
  git(fixture.root, "checkout", "-q", "dev");
  await writeFile(
    join(fixture.root, ".quest", "tasks", "T-1.json"),
    taskRecord("T-1", "edited on dev"),
  );
  git(fixture.root, "add", "-A");
  git(fixture.root, "commit", "-qm", "edit T-1 on dev");
  const movedDev = git(fixture.root, "rev-parse", "refs/heads/dev");
  expect(movedDev).not.toBe(fixture.devSha);
  git(fixture.root, "checkout", "-q", "dev");

  await viewWith(fixture.root, ["refs/heads/dev", "refs/heads/feature"]);
  expect(lastCalls.length).toBeGreaterThan(0);
  // Every record read is the MOVED dev; the unchanged feature served from cache.
  expect(lastCalls.every((call) => call.includes(movedDev))).toBe(true);
  expect(lastCalls.some((call) => call.includes(fixture.featureSha))).toBe(
    false,
  );
});

test("a corrupt cache entry falls back to a normal read, never fails", async () => {
  await clearCache(fixture.root);
  const refs = ["refs/heads/feature"];
  const first = await viewWith(fixture.root, refs);
  const treeHash = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  const entryPath = join(
    fixture.root,
    ".git",
    "quest",
    "across-refs-cache",
    `${treeHash}.json`,
  );
  expect(existsSync(entryPath)).toBe(true);
  await writeFile(entryPath, "{ this is not the cache document }");

  const second = await viewWith(fixture.root, refs);
  // It re-read rather than trusting the corrupt file, and the answer is right.
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(lastCalls.every((call) => call.includes(fixture.featureSha))).toBe(
    true,
  );
  expect(JSON.stringify(second.entries)).toBe(JSON.stringify(first.entries));
  // The good read repaired the entry.
  const repaired = JSON.parse(await readFile(entryPath, "utf8")) as {
    key: string;
  };
  expect(repaired.key).toBe(treeHash);
});

test("an UNREADABLE ref is never cached as empty, and stays unreadable", async () => {
  const treeHash = git(fixture.root, "rev-parse", "refs/heads/broken:.quest");
  const entryPath = join(
    fixture.root,
    ".git",
    "quest",
    "across-refs-cache",
    `${treeHash}.json`,
  );
  await rm(entryPath, { force: true });

  const firstCalls: string[] = [];
  const firstPort = instrumented(new LocalGitPort(), firstCalls);
  const first = await new AcrossRefsViewService(firstPort, discovery).view({
    repositoryPath: fixture.root,
    refs: ["refs/heads/broken"],
    allowPartial: true,
  });
  if (first.kind !== "view") throw new Error("expected a view");
  expect(first.coverage.refsRead).toEqual([]);
  expect(first.coverage.refsUnreadable.map((entry) => entry.ref)).toEqual([
    "refs/heads/broken",
  ]);
  // A failed read wrote nothing, so the empty view cannot be served next time.
  expect(existsSync(entryPath)).toBe(false);

  // A second call still reports it unreadable, i.e. it really was re-read.
  const secondCalls: string[] = [];
  const secondPort = instrumented(new LocalGitPort(), secondCalls);
  const second = await new AcrossRefsViewService(secondPort, discovery).view({
    repositoryPath: fixture.root,
    refs: ["refs/heads/broken"],
    allowPartial: true,
  });
  if (second.kind !== "view") throw new Error("expected a view");
  expect(secondCalls.length).toBeGreaterThan(0);
  expect(second.coverage.refsUnreadable.map((entry) => entry.ref)).toEqual([
    "refs/heads/broken",
  ]);
});

test("the cache is content-addressed: an injected cache is read by tree hash", async () => {
  // A portable seam proof: the service asks for EXACTLY the tree hash it
  // computed, and answers from whatever the port returns for it.
  const asked: string[] = [];
  const cache: AcrossRefsCachePort = {
    async read(treeHash: string): Promise<readonly AcrossRefsCachedRecord[]> {
      asked.push(treeHash);
      return [
        {
          task: {
            id: "T-99",
            aliases: ["T-99"],
            title: "from the injected cache",
            status: "To Do",
            acceptanceCriteria: [],
            definitionOfDone: [],
            plan: [],
            implementationNotes: [],
            comments: [],
            labels: [],
            documentation: [],
            dependencies: [],
            blockers: [],
            gates: [],
            gateEvents: [],
          },
          archived: false,
        },
      ];
    },
    async write(): Promise<void> {},
  };
  const outcome = await new AcrossRefsViewService(
    new LocalGitPort(),
    discovery,
    undefined,
    undefined,
    cache,
  ).view({
    repositoryPath: fixture.root,
    refs: ["refs/heads/feature"],
    allowPartial: false,
  });
  if (outcome.kind !== "view") throw new Error("expected a view");
  expect(asked).toEqual([
    git(fixture.root, "rev-parse", "refs/heads/feature:.quest"),
  ]);
  expect(outcome.entries.map((entry) => entry.id)).toContain("T-99");
});

test("the CLI writes the shared cache under the git common dir (composition wiring)", async () => {
  const commonDir = git(fixture.root, "rev-parse", "--git-common-dir");
  const cacheDir = join(fixture.root, commonDir, "quest", "across-refs-cache");
  await rm(cacheDir, { recursive: true, force: true });

  const first = quest(fixture.root, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/feature",
    "--json",
  ]);
  expect({ exit: first.exitCode, stderr: first.stderr }).toEqual({
    exit: 0,
    stderr: "",
  });
  expect(existsSync(cacheDir)).toBe(true);

  const second = quest(fixture.root, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/feature",
    "--json",
  ]);
  expect(second.exitCode).toBe(0);
  // `coverage.discoveredAt` is the instant of THIS population read and moves by
  // design, so the data is what must be identical across the two runs.
  const firstData = (JSON.parse(first.stdout) as { data: unknown }).data;
  const secondData = (JSON.parse(second.stdout) as { data: unknown }).data;
  expect(secondData).toEqual(firstData);
});

test("a ref with NO .quest tree is its own distinct, cacheable state", async () => {
  await clearCache(fixture.root);
  const key = await acrossRefsRefKey(
    new LocalGitPort(),
    fixture.root,
    fixture.noQuestSha,
  );
  // Keyed by its ROOT tree, never by a `.quest` hash it does not have, and
  // never by the tree of a ref that does.
  expect(key).toMatch(/^root-[0-9a-f]{40}$/u);
  expect(key).not.toBe(
    await acrossRefsRefKey(new LocalGitPort(), fixture.root, fixture.devSha),
  );

  const first = await viewWith(fixture.root, ["refs/heads/noquest"]);
  expect(first.entries).toEqual([]);
  expect(first.coverage.complete).toBe(true);
  expect(existsSync(join(cacheDirectory(fixture.root), `${key}.json`))).toBe(
    true,
  );

  // The empty state was cached, so a repeat call reads no record at all.
  const second = await viewWith(fixture.root, ["refs/heads/noquest"]);
  expect(lastCalls).toEqual([]);
  expect(second.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/noquest",
  ]);
});

test("AcrossRefsCache ignores a document written for a different key", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli563-cache-"));
  try {
    const cache = AcrossRefsCache.underCommonDirectory(directory);
    const wrong = "0".repeat(40);
    await cache.write("a".repeat(40), []);
    // Corrupt-by-identity: a file for the right name whose document names
    // another key must be treated as a miss, not trusted.
    await writeFile(
      join(directory, "quest", "across-refs-cache", `${wrong}.json`),
      JSON.stringify({
        kind: "records",
        version: 1,
        key: "b".repeat(40),
        records: [],
      }),
    );
    expect(await cache.read(wrong)).toBeNull();
    expect(await cache.read("c".repeat(40))).toBeNull();
    // A key that is not a tree hash and not a root-tree key is a miss, so it
    // can never be used as a path.
    expect(await cache.read("../../escape")).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("readAcrossRefsCache / writeAcrossRefsCache round-trip keyed by the ref set", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli563-result-"));
  try {
    const refHashes = new Map<string, string>([
      ["refs/heads/dev", "a".repeat(40)],
      ["refs/heads/feature", "b".repeat(40)],
    ]);
    expect(await readAcrossRefsCache(directory, refHashes)).toBeNull();

    const result = (await viewWith(fixture.root, ["refs/heads/dev"])) as {
      entries: readonly AcrossRefsEntry[];
      coverage: AcrossRefsCoverage;
    };
    const cache: AcrossRefsCacheResult = {
      entries: result.entries,
      coverage: result.coverage,
    };
    await writeAcrossRefsCache(directory, refHashes, cache);
    expect(await readAcrossRefsCache(directory, refHashes)).toEqual(cache);

    // Reordering the map cannot change the key.
    const reordered = new Map<string, string>([
      ["refs/heads/feature", "b".repeat(40)],
      ["refs/heads/dev", "a".repeat(40)],
    ]);
    expect(await readAcrossRefsCache(directory, reordered)).toEqual(cache);

    // A different ref set is a miss.
    expect(
      await readAcrossRefsCache(
        directory,
        new Map([["refs/heads/dev", "c".repeat(40)]]),
      ),
    ).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("writeAcrossRefsCache refuses to cache an unreadable result", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli563-refuse-"));
  try {
    const refHashes = new Map([["refs/heads/broken", "a".repeat(40)]]);
    const unreadable: AcrossRefsCacheResult = {
      entries: [],
      coverage: {
        complete: false,
        population: "explicit",
        discoveredAt: "2026-01-01T00:00:00.000Z",
        refsRead: [],
        refsUnreadable: [
          { ref: "refs/heads/broken", pullRequest: null, reason: "unreadable" },
        ],
      },
    };
    await writeAcrossRefsCache(directory, refHashes, unreadable);
    expect(await readAcrossRefsCache(directory, refHashes)).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
