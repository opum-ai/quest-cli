import { beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import {
  type AcrossRefsCachePort,
  type AcrossRefsCachedLocations,
  AcrossRefsCache,
  type CacheIo,
  acrossRefsRefKey,
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
 * QCLI-563: `quest task list --across-refs` caches each ref's RAW record files
 * under the clone's git common dir, keyed by that ref's `.quest` tree hash
 * (`git rev-parse <sha>:.quest`), and re-runs the dot-file filter, `JSON.parse`,
 * `taskState` and the duplicate-id check on every read.
 *
 * Pinned here:
 *   - a second call with unchanged refs reads NO record (AC4), counted through
 *     the injected port, never by timing;
 *   - a changed ref re-reads ONLY that ref;
 *   - two refs whose commits differ but whose `.quest` tree is identical share
 *     one read, which is what makes the key the TREE and not the ref or sha;
 *   - a corrupt, truncated or no-longer-valid entry falls back to a fresh read;
 *   - an UNREADABLE ref is never cached, and a no-`.quest` ref is cached as its
 *     own `root-<sha>` state;
 *   - the cache is bounded (newest N by mtime), a hit touches, and a failed
 *     write leaves no temp file.
 *
 * Fixtures are real Git repos because the key only exists if the graph is real;
 * the forge seam is injected so nothing touches the network.
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

/** A minimal but schema-valid task record. */
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

/**
 * A REALISTIC record (F6): a created stamp, a non-empty acceptance criterion,
 * and a gate with its authored `gate-defined` event -- exactly the shape whose
 * replay `taskState` performs on every read.
 */
function gateRecord(id: string, title: string): string {
  return JSON.stringify({
    id,
    aliases: [id],
    title,
    status: "In Progress",
    acceptanceCriteria: [{ index: 0, text: "a criterion", checked: false }],
    definitionOfDone: [],
    plan: [],
    implementationNotes: [],
    comments: [],
    labels: [],
    documentation: [],
    dependencies: [],
    createdAt: "2026-01-02T03:04:05.000Z",
    blockers: [],
    gates: [
      {
        id: "G-1",
        title: "review",
        blocking: true,
        state: "pending",
        evidence: [],
      },
    ],
    gateEvents: [
      {
        eventId: "E-1",
        operationId: "op-1",
        taskId: id,
        kind: "gate-defined",
        definition: {
          id: "G-1",
          title: "review",
          blocking: true,
          requiresHumanJudgement: false,
        },
      },
    ],
  });
}

interface Fixture {
  readonly root: string;
  readonly devSha: string;
  readonly copySha: string;
  readonly featureSha: string;
  readonly brokenSha: string;
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
  await writeFile(
    join(root, ".quest", "tasks", "T-10.json"),
    gateRecord("T-10", "a gated task"),
  );
  git(root, "add", "-A");
  git(root, "commit", "-qm", "dev records");
  const devSha = git(root, "rev-parse", "refs/heads/dev");

  // Distinct commit, identical `.quest` tree.
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

  git(root, "checkout", "-q", "-b", "noquest", "dev");
  git(root, "rm", "-rq", ".quest");
  git(root, "commit", "-qm", "no .quest at all");
  const noQuestSha = git(root, "rev-parse", "refs/heads/noquest");
  git(root, "checkout", "-q", "dev");

  return { root, devSha, copySha, featureSha, brokenSha, noQuestSha };
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
 * and `readBlob`). Counting these two is the no-read proof; metadata probes
 * (`hasRevision`, `treeHash`, `batchCheck`, `readRevision`) are not records.
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

let lastCalls: string[] = [];

async function viewWith(
  root: string,
  refs: readonly string[],
): Promise<{
  entries: readonly AcrossRefsEntry[];
  coverage: AcrossRefsCoverage;
}> {
  const calls: string[] = [];
  const port = instrumented(new LocalGitPort(), calls);
  const outcome: AcrossRefsOutcome = await new AcrossRefsViewService(
    port,
    discovery,
  ).view({ repositoryPath: root, refs, allowPartial: false });
  if (outcome.kind !== "view")
    throw new Error(`expected a view, got absent(${outcome.detail})`);
  lastCalls = calls;
  return { entries: outcome.entries, coverage: outcome.coverage };
}

function cacheDirectory(root: string): string {
  return join(
    root,
    git(root, "rev-parse", "--git-common-dir"),
    "quest",
    "across-refs-cache",
  );
}

async function clearCache(root: string): Promise<void> {
  await rm(cacheDirectory(root), { recursive: true, force: true });
}

async function writeCacheDocument(
  root: string,
  key: string,
  locations: AcrossRefsCachedLocations,
): Promise<void> {
  const directory = cacheDirectory(root);
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, `${key}.json`),
    JSON.stringify({ kind: "records", version: 1, key, locations }),
  );
}

const entriesById = (entries: readonly AcrossRefsEntry[]) =>
  new Map(entries.map((entry) => [entry.id, entry]));

let fixture: Fixture;

beforeAll(async () => {
  fixture = await createFixture();
}, 120_000);

test("a second call with unchanged refs reads NO record (AC4)", async () => {
  await clearCache(fixture.root);
  const refs = ["refs/heads/dev", "refs/heads/copy"];
  const first = await viewWith(fixture.root, refs);
  expect(lastCalls.length).toBeGreaterThan(0);

  // A FRESH service, so this cannot be the in-process map.
  const second = await viewWith(fixture.root, refs);
  expect(lastCalls).toEqual([]);
  expect(JSON.stringify(second.entries)).toBe(JSON.stringify(first.entries));
  expect(second.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/dev",
    "refs/heads/copy",
  ]);
});

test("the cache key is the .quest TREE, not the ref or its sha", async () => {
  await clearCache(fixture.root);
  expect(fixture.devSha).not.toBe(fixture.copySha);
  expect(git(fixture.root, "rev-parse", "refs/heads/dev:.quest")).toBe(
    git(fixture.root, "rev-parse", "refs/heads/copy:.quest"),
  );
  const { entries } = await viewWith(fixture.root, [
    "refs/heads/dev",
    "refs/heads/copy",
  ]);
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(lastCalls.every((call) => call.includes(fixture.devSha))).toBe(true);
  expect(lastCalls.some((call) => call.includes(fixture.copySha))).toBe(false);
  expect(entriesById(entries).has("T-1")).toBe(true);
});

test("a changed ref re-reads ONLY that ref, and shows the edit (F7/F8)", async () => {
  // Its OWN repository, so mutating `dev` here cannot affect other tests.
  const root = await mkdtemp(join(tmpdir(), "qcli563-moved-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    await mkdir(join(root, ".quest", "tasks"), { recursive: true });
    await writeFile(
      join(root, ".quest", "tasks", "T-1.json"),
      taskRecord("T-1", "original title"),
    );
    git(root, "add", "-A");
    git(root, "commit", "-qm", "dev");
    git(root, "checkout", "-q", "-b", "feature", "dev");
    await writeFile(
      join(root, ".quest", "tasks", "T-2.json"),
      taskRecord("T-2", "on feature"),
    );
    git(root, "add", "-A");
    git(root, "commit", "-qm", "feature");
    const featureSha = git(root, "rev-parse", "refs/heads/feature");
    git(root, "checkout", "-q", "dev");

    await viewWith(root, ["refs/heads/dev", "refs/heads/feature"]);

    await writeFile(
      join(root, ".quest", "tasks", "T-1.json"),
      taskRecord("T-1", "edited on dev"),
    );
    git(root, "add", "-A");
    git(root, "commit", "-qm", "edit T-1 on dev");
    const movedDev = git(root, "rev-parse", "refs/heads/dev");

    const second = await viewWith(root, [
      "refs/heads/dev",
      "refs/heads/feature",
    ]);
    expect(lastCalls.length).toBeGreaterThan(0);
    expect(lastCalls.every((call) => call.includes(movedDev))).toBe(true);
    expect(lastCalls.some((call) => call.includes(featureSha))).toBe(false);
    // The edit is actually reflected, which a stale cache answer would miss.
    expect(entriesById(second.entries).get("T-1")?.title).toBe("edited on dev");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a realistic gated record survives warm == cold, identity included (F6/R2-7)", async () => {
  await clearCache(fixture.root);
  // dev AND feature, so identity is non-trivial: T-10 is one task read from both
  // refs (shared createdAt -> `task`), while T-1 is on both with no createdAt
  // (two states that cannot be compared -> `unresolved`).
  const refs = ["refs/heads/dev", "refs/heads/feature"];
  const cold = await viewWith(fixture.root, refs);
  expect(lastCalls.length).toBeGreaterThan(0);
  const coldById = entriesById(cold.entries);
  expect(coldById.get("T-10")?.identity).toBe("task");
  expect(coldById.get("T-10")?.title).toBe("a gated task");
  expect(coldById.get("T-1")?.identity).toBe("unresolved");

  const warm = await viewWith(fixture.root, refs);
  expect(lastCalls).toEqual([]);
  expect(warm.entries).toEqual(cold.entries);
  expect(warm.entries.map((entry) => [entry.id, entry.identity])).toEqual(
    cold.entries.map((entry) => [entry.id, entry.identity]),
  );

  // The cache holds RAW text (with the gate event stream), not parsed records.
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  const document = JSON.parse(
    await readFile(join(cacheDirectory(fixture.root), `${key}.json`), "utf8"),
  ) as {
    locations: Record<string, { path: string; text: string | null }[]>;
  };
  expect(
    document.locations.tasks?.some((file) => file.text?.includes("gateEvents")),
  ).toBe(true);
});

test("a corrupt cache entry falls back to a normal read, never fails", async () => {
  await clearCache(fixture.root);
  const refs = ["refs/heads/feature"];
  const first = await viewWith(fixture.root, refs);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  const entryPath = join(cacheDirectory(fixture.root), `${key}.json`);
  expect(existsSync(entryPath)).toBe(true);
  await writeFile(entryPath, "{ this is not the cache document }");

  const second = await viewWith(fixture.root, refs);
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(lastCalls.every((call) => call.includes(fixture.featureSha))).toBe(
    true,
  );
  expect(JSON.stringify(second.entries)).toBe(JSON.stringify(first.entries));
  const repaired = JSON.parse(await readFile(entryPath, "utf8")) as {
    kind: string;
    key: string;
  };
  expect(repaired.kind).toBe("records");
  expect(repaired.key).toBe(key);
});

test("a well-formed document whose record fails taskState reads fresh (F9)", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  await writeCacheDocument(fixture.root, key, {
    tasks: [
      {
        path: ".quest/tasks/T-3.json",
        // Valid JSON, but not a task record: taskState must reject it.
        text: JSON.stringify({ id: "T-3" }),
      },
    ],
    completed: [],
    "archive/tasks": [],
  });

  const { entries } = await viewWith(fixture.root, ["refs/heads/feature"]);
  // It did NOT trust the invalid cached record; it read the real ref.
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(entriesById(entries).get("T-3")?.title).toBe("only on feature");
});

test("a document missing a location is a cache miss", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  // Only `tasks` present: `completed` and `archive/tasks` are absent.
  await writeCacheDocument(fixture.root, key, {
    tasks: [
      {
        path: ".quest/tasks/T-3.json",
        text: taskRecord("T-3", "from a truncated cache"),
      },
    ],
  });
  const { entries } = await viewWith(fixture.root, ["refs/heads/feature"]);
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(entriesById(entries).get("T-3")?.title).toBe("only on feature");
});

test("a cached path the writer did not read is a MISS for a wider filter (R2-2)", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  // The entry lists the path but stores `text: null`: the writing build's filter
  // did not read it. A reader that selects it must re-read, never be served a
  // shorter record set.
  await writeCacheDocument(fixture.root, key, {
    tasks: [{ path: ".quest/tasks/T-3.json", text: null }],
    completed: [],
    "archive/tasks": [],
  });
  const { entries } = await viewWith(fixture.root, ["refs/heads/feature"]);
  expect(lastCalls.length).toBeGreaterThan(0);
  expect(entriesById(entries).get("T-3")?.title).toBe("only on feature");
});

test("the dot-file filter is re-run on every read (a cached journal is ignored)", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  await writeCacheDocument(fixture.root, key, {
    tasks: [
      {
        path: ".quest/tasks/T-3.json",
        text: taskRecord("T-3", "from cache"),
      },
      // Operational metadata beside the records: a writer stores it with
      // `text: null`; the reader's filter must skip it, whatever it holds.
      { path: ".quest/tasks/.journal", text: null },
    ],
    completed: [],
    "archive/tasks": [],
  });
  const { entries } = await viewWith(fixture.root, ["refs/heads/feature"]);
  // Served from the cache (no fresh read), the dot-file skipped, the record kept.
  expect(lastCalls).toEqual([]);
  expect(entriesById(entries).get("T-3")?.title).toBe("from cache");
});

test("an UNREADABLE ref is never cached as empty, and stays unreadable", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/broken:.quest");
  const entryPath = join(cacheDirectory(fixture.root), `${key}.json`);

  const first = await new AcrossRefsViewService(
    new LocalGitPort(),
    discovery,
  ).view({
    repositoryPath: fixture.root,
    refs: ["refs/heads/broken"],
    allowPartial: true,
  });
  if (first.kind !== "view") throw new Error("expected a view");
  expect(first.coverage.refsRead).toEqual([]);
  expect(first.coverage.refsUnreadable.map((entry) => entry.ref)).toEqual([
    "refs/heads/broken",
  ]);
  expect(existsSync(entryPath)).toBe(false);

  const calls: string[] = [];
  const second = await new AcrossRefsViewService(
    instrumented(new LocalGitPort(), calls),
    discovery,
  ).view({
    repositoryPath: fixture.root,
    refs: ["refs/heads/broken"],
    allowPartial: true,
  });
  if (second.kind !== "view") throw new Error("expected a view");
  expect(calls.length).toBeGreaterThan(0);
  expect(second.coverage.refsUnreadable.map((entry) => entry.ref)).toEqual([
    "refs/heads/broken",
  ]);
});

test("a ref with NO .quest tree is cached as its own distinct state", async () => {
  await clearCache(fixture.root);
  const key = await acrossRefsRefKey(
    new LocalGitPort(),
    fixture.root,
    fixture.noQuestSha,
  );
  expect(key).toMatch(/^root-[0-9a-f]{40}$/u);

  const first = await viewWith(fixture.root, ["refs/heads/noquest"]);
  expect(first.entries).toEqual([]);
  expect(first.coverage.complete).toBe(true);
  expect(existsSync(join(cacheDirectory(fixture.root), `${key}.json`))).toBe(
    true,
  );

  const second = await viewWith(fixture.root, ["refs/heads/noquest"]);
  expect(lastCalls).toEqual([]);
  expect(second.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/noquest",
  ]);
});

test("a sha that became present is not fetched twice (R2-4)", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli563-shared-head-"));
  try {
    const work = join(root, "work");
    const origin = join(root, "origin.git");
    const outsider = join(root, "outsider");
    git(root, "init", "-q", "-b", "dev", work);
    git(work, "config", "user.email", "t@example.invalid");
    git(work, "config", "user.name", "T");
    await mkdir(join(work, ".quest", "tasks"), { recursive: true });
    await writeFile(
      join(work, ".quest", "tasks", "T-1.json"),
      taskRecord("T-1", "on dev"),
    );
    git(work, "add", "-A");
    git(work, "commit", "-qm", "dev");
    git(root, "clone", "-q", "--bare", work, origin);

    // A commit whose objects exist ONLY in the origin.
    git(root, "clone", "-q", origin, outsider);
    git(outsider, "config", "user.email", "t@example.invalid");
    git(outsider, "config", "user.name", "T");
    await mkdir(join(outsider, ".quest", "tasks"), { recursive: true });
    await writeFile(
      join(outsider, ".quest", "tasks", "T-2.json"),
      taskRecord("T-2", "on the shared head"),
    );
    git(outsider, "add", "-A");
    git(outsider, "commit", "-qm", "shared head");
    const shared = git(outsider, "rev-parse", "HEAD");
    git(origin, "fetch", "-q", outsider, "refs/heads/dev");
    // Both PR refs name the SAME head sha.
    git(origin, "update-ref", "refs/pull/1/head", shared);
    git(origin, "update-ref", "refs/pull/2/head", shared);

    // A fixture writes `origin` by editing .git/config, never `git remote add`.
    const configPath = join(work, ".git", "config");
    const original = await readFile(configPath, "utf8");
    await writeFile(
      configPath,
      `${original.trimEnd()}\n[remote "origin"]\n\turl = ${origin}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n`,
    );
    expect(
      run(work, ["git", "cat-file", "-e", `${shared}^{commit}`]).exitCode,
    ).not.toBe(0);

    let fetches = 0;
    const port = new LocalGitPort();
    const fetch = port.fetchRef.bind(port);
    port.fetchRef = async (repositoryPath, remote, ref) => {
      fetches += 1;
      return fetch(repositoryPath, remote, ref);
    };
    const outcome = await new AcrossRefsViewService(port, discovery).view({
      repositoryPath: work,
      pullRequests: [1, 2],
      allowPartial: false,
    });
    if (outcome.kind !== "view") throw new Error("expected a view");
    // The pre-loop probe said both were absent; the first fetch made the sha
    // present, so the second ref must NOT fetch it again.
    expect(fetches).toBe(1);
    expect(outcome.coverage.refsRead.map((read) => read.ref)).toEqual([
      "refs/pull/1/head",
      "refs/pull/2/head",
    ]);
    expect(outcome.entries.map((entry) => entry.id)).toContain("T-2");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the injected cache is consulted by tree hash and re-materialized", async () => {
  await clearCache(fixture.root);
  const key = git(fixture.root, "rev-parse", "refs/heads/feature:.quest");
  const touched: string[] = [];
  const locations: AcrossRefsCachedLocations = {
    tasks: [
      {
        path: ".quest/tasks/T-77.json",
        text: taskRecord("T-77", "from the injected cache"),
      },
    ],
    completed: [],
    "archive/tasks": [],
  };
  const cache: AcrossRefsCachePort = {
    async read(asked) {
      return asked === key ? locations : null;
    },
    async write() {},
    async touch(asked) {
      touched.push(asked);
    },
    async prune() {},
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
  expect(touched).toEqual([key]);
  expect(outcome.entries.map((entry) => entry.id)).toContain("T-77");
});

test("AcrossRefsCache ignores a document written for a different key (R2-5)", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli563-cache-"));
  try {
    const cache = AcrossRefsCache.underCommonDirectory(directory);
    const wrong = "0".repeat(40);
    await cache.write("a".repeat(40), {
      tasks: [],
      completed: [],
      "archive/tasks": [],
    });
    // A file in the right place whose DOCUMENT names another key is a miss.
    await writeFile(
      join(directory, "quest", "across-refs-cache", `${wrong}.json`),
      JSON.stringify({
        kind: "records",
        version: 1,
        key: "b".repeat(40),
        locations: { tasks: [], completed: [], "archive/tasks": [] },
      }),
    );
    expect(await cache.read(wrong)).toBeNull();
    expect(await cache.read("c".repeat(40))).toBeNull();
    // A key that is not a tree hash and not a root-tree key can never be used
    // as a path.
    expect(await cache.read("../../escape")).toBeNull();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the CLI writes the shared cache under the git common dir (composition, R2-5)", async () => {
  await clearCache(fixture.root);
  const cacheDir = cacheDirectory(fixture.root);
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
  // design, so the data is what must be identical across the runs.
  const firstData = (JSON.parse(first.stdout) as { data: unknown }).data;
  const secondData = (JSON.parse(second.stdout) as { data: unknown }).data;
  expect(secondData).toEqual(firstData);
});

test("batchCheck answers present/absent and refuses a poisoned spec (R2-3/R2-6)", async () => {
  const port = new LocalGitPort();
  const present = `${fixture.devSha}^{commit}`;
  const tree = `${fixture.devSha}:.quest`;
  const absent = `${"0".repeat(40)}^{commit}`;
  const answers = await port.batchCheck(fixture.root, [present, tree, absent]);
  expect(answers.get(present)).toBe(fixture.devSha);
  expect(answers.get(tree)).toMatch(/^[0-9a-f]{40}$/u);
  // An exact "<spec> missing" line is the ONLY absent answer.
  expect(answers.get(absent)).toBeNull();
  // A spec carrying a newline is refused wholesale, not misparsed.
  expect((await port.batchCheck(fixture.root, ["HEAD\nmain"])).size).toBe(0);
});

// ---- F2: the cache is bounded, touches on hit, and cleans a failed write ----

interface MemoryIo {
  readonly io: CacheIo;
  readonly files: Map<string, string>;
  readonly mtimes: Map<string, number>;
  readonly unlinked: string[];
  setMtime(path: string, ms: number): void;
}

/** An in-memory filesystem whose `rename` stamps a fresh mtime, so pruning and
 *  touching are deterministic and need no real clock. */
function memoryIo(seed: Record<string, number> = {}): MemoryIo {
  let clock = Math.max(0, ...Object.values(seed));
  const files = new Map<string, string>();
  const mtimes = new Map<string, number>();
  const unlinked: string[] = [];
  for (const [path, ms] of Object.entries(seed)) {
    files.set(path, "{}");
    mtimes.set(path, ms);
  }
  const io: CacheIo = {
    async readFile(path) {
      const value = files.get(path);
      if (value === undefined) throw new Error("ENOENT");
      return value;
    },
    async writeFile(path, data) {
      files.set(path, data);
    },
    async rename(from, to) {
      const value = files.get(from);
      if (value === undefined) throw new Error("ENOENT");
      files.delete(from);
      files.set(to, value);
      mtimes.set(to, ++clock);
    },
    async unlink(path) {
      files.delete(path);
      unlinked.push(path);
    },
    async mkdir() {},
    async readdir() {
      return [...files.keys()].map((path) =>
        path.slice(path.lastIndexOf("/") + 1),
      );
    },
    async utimes(path, _atime, mtime) {
      mtimes.set(path, mtime.getTime());
    },
    async stat(path) {
      if (!files.has(path)) throw new Error("ENOENT");
      return { mtimeMs: mtimes.get(path) ?? 0 };
    },
  };
  return {
    io,
    files,
    mtimes,
    unlinked,
    setMtime: (path, ms) => mtimes.set(path, ms),
  };
}

const keyFor = (n: number) => `${n}`.repeat(40);

test("prune keeps the newest N entries by mtime (F2/R2-8)", async () => {
  const directory = "/cache";
  const seed: Record<string, number> = {};
  for (let n = 1; n <= 6; n++) seed[`${directory}/${keyFor(n)}.json`] = n;
  const memory = memoryIo(seed);
  const cache = new AcrossRefsCache(directory, {
    maxEntries: 3,
    io: memory.io,
  });

  await cache.prune(new Set());

  const remaining = [...memory.files.keys()].sort();
  expect(remaining).toEqual([
    `${directory}/${keyFor(4)}.json`,
    `${directory}/${keyFor(5)}.json`,
    `${directory}/${keyFor(6)}.json`,
  ]);
  expect(memory.unlinked.sort()).toEqual([
    `${directory}/${keyFor(1)}.json`,
    `${directory}/${keyFor(2)}.json`,
    `${directory}/${keyFor(3)}.json`,
  ]);
});

test("prune protects this run's keys even when it uses more than the bound (R2-8)", async () => {
  const directory = "/cache";
  const seed: Record<string, number> = {};
  for (let n = 1; n <= 6; n++) seed[`${directory}/${keyFor(n)}.json`] = n;
  const memory = memoryIo(seed);
  const cache = new AcrossRefsCache(directory, {
    maxEntries: 3,
    io: memory.io,
  });

  // The run used the OLDEST key; it must survive, and the remaining budget
  // (3 - 1 = 2) goes to the newest of the rest.
  await cache.prune(new Set([keyFor(1)]));

  const remaining = [...memory.files.keys()].sort();
  expect(remaining).toEqual([
    `${directory}/${keyFor(1)}.json`,
    `${directory}/${keyFor(5)}.json`,
    `${directory}/${keyFor(6)}.json`,
  ]);
});

test("a cache hit touches the entry so it is kept (F2)", async () => {
  const directory = "/cache";
  const memory = memoryIo();
  const cache = new AcrossRefsCache(directory, { io: memory.io });
  const key = keyFor(7);
  await cache.write(key, { tasks: [], completed: [], "archive/tasks": [] });
  const before = memory.mtimes.get(`${directory}/${key}.json`) ?? 0;

  await cache.touch(key);
  expect(memory.mtimes.get(`${directory}/${key}.json`) ?? 0).toBeGreaterThan(
    before,
  );
});

test("a failed write unlinks its temp file and leaves no residue (F2)", async () => {
  const directory = "/cache";
  let temporary = "";
  const memory = memoryIo();
  const io: CacheIo = {
    ...memory.io,
    async writeFile(path) {
      temporary = path;
      throw new Error("disk full");
    },
  };
  const cache = new AcrossRefsCache(directory, { io });
  await cache.write(keyFor(8), {
    tasks: [],
    completed: [],
    "archive/tasks": [],
  });

  expect(temporary).toMatch(/\.tmp$/u);
  expect(memory.unlinked).toContain(temporary);
  expect([...memory.files.keys()].some((path) => path.endsWith(".tmp"))).toBe(
    false,
  );
  expect(memory.files.has(`${directory}/${keyFor(8)}.json`)).toBe(false);
});

test("a write whose RENAME fails after the write still leaves no temp (R2-9)", async () => {
  const directory = "/cache";
  let temporary = "";
  const memory = memoryIo();
  const io: CacheIo = {
    ...memory.io,
    async writeFile(path, data) {
      temporary = path;
      // The temp file is really created...
      await memory.io.writeFile(path, data);
    },
    async rename() {
      // ...and the rename is what fails.
      throw new Error("rename failed");
    },
  };
  const cache = new AcrossRefsCache(directory, { io });
  await cache.write(keyFor(9), {
    tasks: [],
    completed: [],
    "archive/tasks": [],
  });

  expect(temporary).toMatch(/\.tmp$/u);
  expect(memory.unlinked).toContain(temporary);
  expect([...memory.files.keys()].some((path) => path.endsWith(".tmp"))).toBe(
    false,
  );
  expect(memory.files.has(`${directory}/${keyFor(9)}.json`)).toBe(false);
});

test("prune unlinks only STALE temp files (R2-9)", async () => {
  const directory = "/cache";
  const now = Date.now();
  const oldTemp = `${directory}/old.tmp`;
  const freshTemp = `${directory}/fresh.tmp`;
  const memory = memoryIo({
    [oldTemp]: now - 2 * 60 * 60 * 1000,
    [freshTemp]: now,
  });
  const cache = new AcrossRefsCache(directory, { io: memory.io });

  await cache.prune(new Set());

  expect(memory.files.has(oldTemp)).toBe(false);
  expect(memory.files.has(freshTemp)).toBe(true);
  expect(memory.unlinked).toContain(oldTemp);
  expect(memory.unlinked).not.toContain(freshTemp);
});
