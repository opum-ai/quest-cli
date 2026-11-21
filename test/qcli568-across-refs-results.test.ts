import { afterAll, expect, test } from "bun:test";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  realpath,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import type {
  DiscoveredPullRequest,
  OriginRemote,
  RefDiscoveryPort,
} from "../src/ports/ref-discovery.ts";
import {
  type AcrossRefsOutcome,
  type AcrossRefsPlan,
  type AcrossRefsRequest,
  AcrossRefsViewService,
  acrossRefsPlanIdentity,
  acrossRefsRequestFingerprint,
} from "../src/application/refs/across-refs.ts";
import {
  AcrossRefsLockedService,
  type AcrossRefsLockAcquire,
  type AcrossRefsView,
} from "../src/application/refs/across-refs-locked.ts";
import { acquireCommonDirLock } from "../src/application/refs/common-dir-lock.ts";
import {
  AcrossRefsResults,
  type AcrossRefsResultRecord,
  type AcrossRefsResultsPort,
  acrossRefsResultsDirectory,
} from "../src/application/refs/across-refs-results.ts";

/**
 * QCLI-568 Q568-INT (B), DEC-282 (a7) item 1, (a9) item 1, (a13) item 3(a),
 * QCLI-568 AC2: the whole-result record and the waiter that replays it.
 *
 * These tests use a REAL Git repository and a REAL temp common directory, so
 * the advisory lock genuinely serialises the runs. The "computation" count is a
 * seam on `AcrossRefsViewService.execute` -- the read path -- never a timer.
 * The gate in the concurrency rows holds the holder inside `execute` until
 * every waiter has entered `acquire`, so the ordering is a barrier rather than
 * a sleep.
 */

const roots: string[] = [];

afterAll(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

function run(cwd: string, argv: readonly string[]): string {
  const child = Bun.spawnSync([...argv], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, QUEST_AGENT_PLUGINS: "off" },
  });
  if ((child.exitCode ?? 1) !== 0)
    throw new Error(`${argv.join(" ")}: ${child.stderr.toString()}`);
  return child.stdout.toString().trim();
}

function taskRecord(id: string, title: string): string {
  return JSON.stringify({
    id,
    aliases: [id],
    title,
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
  });
}

interface Fixture {
  readonly root: string;
  readonly commonDir: string;
}

async function createFixture(): Promise<Fixture> {
  // realpath: the common dir compared below must be one canonical spelling.
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "qcli568-results-")),
  );
  roots.push(root);
  run(root, ["git", "init", "-q", "-b", "dev"]);
  run(root, ["git", "config", "user.email", "t@example.invalid"]);
  run(root, ["git", "config", "user.name", "T"]);
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  await writeFile(
    join(root, ".quest", "tasks", "T-1.json"),
    taskRecord("T-1", "on dev"),
  );
  await writeFile(
    join(root, ".quest", "tasks", "T-2.json"),
    taskRecord("T-2", "also on dev"),
  );
  run(root, ["git", "add", "-A"]);
  run(root, ["git", "commit", "-qm", "dev records"]);

  run(root, ["git", "checkout", "-q", "-b", "feature", "dev"]);
  await writeFile(
    join(root, ".quest", "tasks", "T-3.json"),
    taskRecord("T-3", "only on feature"),
  );
  run(root, ["git", "add", "-A"]);
  run(root, ["git", "commit", "-qm", "T-3 on feature"]);
  run(root, ["git", "checkout", "-q", "dev"]);

  return { root, commonDir: await realpath(join(root, ".git")) };
}

/** The forge seam: explicit refs need no discovery, and no network is touched. */
const discovery: RefDiscoveryPort = {
  async origin(): Promise<OriginRemote> {
    return { kind: "github", slug: "opum-ai/fixture" };
  },
  async listOpenPullRequests(): Promise<readonly DiscoveredPullRequest[]> {
    return [];
  },
};

/** A view that counts PLANS and READS (executes), with an optional gate that
 *  holds the first execute until the test opens it. */
class CountingView implements AcrossRefsView {
  planCount = 0;
  executeCount = 0;

  constructor(
    private readonly inner: AcrossRefsViewService,
    private readonly gate?: () => Promise<void>,
  ) {}

  view(request: AcrossRefsRequest): Promise<AcrossRefsOutcome> {
    return this.inner.view(request);
  }

  plan(request: AcrossRefsRequest): Promise<AcrossRefsPlan> {
    this.planCount += 1;
    return this.inner.plan(request);
  }

  async execute(
    request: AcrossRefsRequest,
    plan: AcrossRefsPlan,
  ): Promise<AcrossRefsOutcome> {
    this.executeCount += 1;
    if (this.gate !== undefined) await this.gate();
    return this.inner.execute(request, plan);
  }

  takeNotes(): readonly string[] {
    return this.inner.takeNotes();
  }
}

function noteCollector() {
  const notes: string[] = [];
  return { notes, writeNote: (line: string) => notes.push(line) };
}

function viewFor(): AcrossRefsViewService {
  return new AcrossRefsViewService(new LocalGitPort(), discovery);
}

const request = (
  fixture: Fixture,
  refs: readonly string[],
): AcrossRefsRequest => ({
  repositoryPath: fixture.root,
  refs,
  allowPartial: false,
});

// ---- (a) concurrent identical views: one computation, every waiter replays ----

test("two or three concurrent identical views compute ONCE and every waiter returns the holder's outcome", async () => {
  const fixture = await createFixture();
  const { notes, writeNote } = noteCollector();
  let openGate: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    openGate = resolve;
  });
  const counting = new CountingView(viewFor(), () => gate);
  let acquires = 0;
  const acquire: AcrossRefsLockAcquire = async (dir, options) => {
    acquires += 1;
    // The holder has acquired (and is inside execute); once every run has
    // entered acquire, the holder may finish. This is the barrier, not a sleep.
    if (acquires >= 3) openGate();
    return acquireCommonDirLock(dir, options);
  };
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    {
      pollMs: 2,
      acquire,
      writeNote,
      onReplayNote: writeNote,
      onRecordFailure: writeNote,
    },
  );
  const req = request(fixture, ["refs/heads/dev"]);

  const results = Promise.all([
    service.view(req),
    service.view(req),
    service.view(req),
  ]);
  const [first, second, third] = await results;

  // AC2 + (a13) 3(a): the read ran exactly once. Without replay this is 3.
  expect(counting.executeCount).toBe(1);
  // Every waiter returns the holder's outcome, byte for byte.
  const holder = JSON.stringify(first);
  expect(JSON.stringify(second)).toBe(holder);
  expect(JSON.stringify(third)).toBe(holder);
  for (const outcome of [first, second, third]) {
    expect(outcome.kind).toBe("view");
    if (outcome.kind !== "view") throw new Error("unreachable");
    expect(outcome.entries.map((entry) => entry.id)).toEqual(["T-1", "T-2"]);
    // The coverage instant is the HOLDER's: a replay is not a new discovery.
    expect(outcome.coverage.discoveredAt).toBe(
      first.kind === "view" ? first.coverage.discoveredAt : "",
    );
  }
  // The normal locked/replayed path is silent.
  expect(notes).toHaveLength(0);
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

// ---- (b) different inputs do not replay: each computes ----

test("different inputs serialise and each recomputes (fingerprint)", async () => {
  const fixture = await createFixture();
  const counting = new CountingView(viewFor());
  // A FIXED clock keeps each record replay-ELIGIBLE, so the REQUEST
  // FINGERPRINT is the discriminator. The second row differs only in its
  // FILTER -- same refs, same plan identity -- so a fingerprint that ignored
  // the filter would replay the unfiltered answer (mutant: red).
  const clock = 4_000_000;
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    { pollMs: 2, now: () => clock, writeNote: () => undefined },
  );

  // Two different refs, run CONCURRENTLY: one holds, the other waits and then
  // computes its own answer -- it does not replay the first (2 computations).
  const [dev, feature] = await Promise.all([
    service.view(request(fixture, ["refs/heads/dev"])),
    service.view(request(fixture, ["refs/heads/feature"])),
  ]);
  expect(counting.executeCount).toBe(2);
  if (dev.kind !== "view" || feature.kind !== "view") throw new Error("view");
  expect(dev.entries.map((entry) => entry.id)).toEqual(["T-1", "T-2"]);
  expect(feature.entries.map((entry) => entry.id)).toEqual([
    "T-1",
    "T-2",
    "T-3",
  ]);

  // Same ref, a FILTER that changes the answer: a third computation, and the
  // filtered answer, never the recorded unfiltered one.
  const filtered = await service.view({
    ...request(fixture, ["refs/heads/dev"]),
    filter: { status: "In Progress" },
  });
  expect(counting.executeCount).toBe(3);
  if (filtered.kind !== "view") throw new Error("view");
  expect(filtered.entries).toEqual([]);
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

// ---- (c) a moved ref sha is a different plan identity: NO replay ----

test("a ref sha that moved after the record was made is not replayed", async () => {
  const fixture = await createFixture();
  const counting = new CountingView(viewFor());
  // A FIXED clock makes the record look "finished while we waited" on the
  // second run too, so the ONLY discriminator left is the plan identity:
  // dropping that check would replay the stale answer (mutant: red).
  const clock = 1_000_000;
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    { pollMs: 2, now: () => clock, writeNote: () => undefined },
  );
  const req = request(fixture, ["refs/heads/dev"]);

  const before = await service.view(req);
  expect(counting.executeCount).toBe(1);

  // Move dev by adding a record on a new commit.
  await writeFile(
    join(fixture.root, ".quest", "tasks", "T-4.json"),
    taskRecord("T-4", "added after the record"),
  );
  run(fixture.root, ["git", "add", "-A"]);
  run(fixture.root, ["git", "commit", "-qm", "T-4"]);

  const after = await service.view(req);
  expect(counting.executeCount).toBe(2);
  if (before.kind !== "view" || after.kind !== "view") throw new Error("view");
  expect(after.entries.map((entry) => entry.id)).toEqual(["T-1", "T-2", "T-4"]);
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

// ---- (d) a record older than the waiter's wait start is not replayed ----

test("a record finished BEFORE this run started waiting is not replayed", async () => {
  const fixture = await createFixture();
  const counting = new CountingView(viewFor());
  let clock = 2_000_000;
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    { pollMs: 2, now: () => clock, writeNote: () => undefined },
  );
  const req = request(fixture, ["refs/heads/dev"]);

  await service.view(req);
  expect(counting.executeCount).toBe(1);
  // The record is now older than the next run's wait start by construction.
  clock += 10_000;
  const second = await service.view(req);

  expect(counting.executeCount).toBe(2);
  expect(second.kind).toBe("view");
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

// ---- (e) corrupt/unwritable records never fail the command ----

test("a corrupt record is a MISS: the run recomputes and never fails", async () => {
  const fixture = await createFixture();
  const counting = new CountingView(viewFor());
  // A FIXED clock keeps the record replay-ELIGIBLE, so corruption itself is
  // the discriminator: a reader that ignored a bad record would replay it.
  const clock = 3_000_000;
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    { pollMs: 2, now: () => clock, writeNote: () => undefined },
  );
  const req = request(fixture, ["refs/heads/dev"]);
  await service.view(req);
  expect(counting.executeCount).toBe(1);

  const fingerprint = acrossRefsRequestFingerprint(req);
  await writeFile(
    join(acrossRefsResultsDirectory(fixture.commonDir), `${fingerprint}.json`),
    "{ this is not a result record",
    "utf8",
  );
  const corrupt = await service.view(req);
  expect(counting.executeCount).toBe(2);
  expect(corrupt.kind).toBe("view");
  // The record was repaired by the recompute.
  const names = await readdir(
    join(acrossRefsResultsDirectory(fixture.commonDir)),
  );
  expect(names).toContain(`${fingerprint}.json`);
  expect(
    JSON.parse(
      await readFile(
        join(
          acrossRefsResultsDirectory(fixture.commonDir),
          `${fingerprint}.json`,
        ),
        "utf8",
      ),
    ).kind,
  ).toBe("across-refs-result");
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

test("a failure to RECORD is one note and never the command's failure", async () => {
  const fixture = await createFixture();
  const counting = new CountingView(viewFor());
  const { notes, writeNote } = noteCollector();
  const failing: AcrossRefsResultsPort = {
    async read(): Promise<AcrossRefsResultRecord | null> {
      return null;
    },
    async write(): Promise<string> {
      return "ENOSPC: no space left on device, write";
    },
    async touch(): Promise<void> {},
    async prune(): Promise<void> {},
  };
  const service = new AcrossRefsLockedService(
    counting,
    async () => fixture.commonDir,
    {
      pollMs: 2,
      writeNote,
      onRecordFailure: writeNote,
      resultsFor: () => failing,
    },
  );

  const outcome = await service.view(request(fixture, ["refs/heads/dev"]));

  expect(outcome.kind).toBe("view");
  expect(counting.executeCount).toBe(1);
  expect(notes).toHaveLength(1);
  expect(notes[0]).toMatch(
    /^note: the across-refs result record is unavailable/u,
  );
  expect(notes[0]).toContain("ENOSPC");
  await rm(fixture.root, { recursive: true, force: true });
}, 120_000);

test("a replay reproduces the holder's notes byte for byte", async () => {
  const commonDir = await realpath(
    await mkdtemp(join(tmpdir(), "qcli568-notes-")),
  );
  roots.push(commonDir);
  // A recordable view with no git behind it: the point is the RECORD and its
  // notes, not the read. The holder delivers the note to its sink; the waiter
  // replays it through `onReplayNote` as the same raw string.
  const NOTE =
    "note: the across-refs read cache is unavailable (ENOSPC: no space left on device); the read ran uncached.";
  const outcome: AcrossRefsOutcome = {
    kind: "view",
    entries: [],
    coverage: {
      complete: true,
      population: "explicit",
      discoveredAt: new Date(0).toISOString(),
      refsRead: [],
      refsUnreadable: [],
    },
  };
  const plan: AcrossRefsPlan = {
    kind: "planned",
    population: "explicit",
    refs: [{ ref: "refs/heads/dev", pullRequest: null, sha: "a".repeat(40) }],
    unreadable: [],
    discoveredAt: "t0",
  };
  const delivered: string[] = [];
  let computes = 0;
  let openGate: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => {
    openGate = resolve;
  });
  let acquires = 0;
  const inner: AcrossRefsView = {
    view: async () => outcome,
    plan: async () => plan,
    async execute(): Promise<AcrossRefsOutcome> {
      computes += 1;
      delivered.push(NOTE);
      if (computes === 1) await gate;
      return outcome;
    },
    takeNotes: () => [NOTE],
  };
  const service = new AcrossRefsLockedService(inner, async () => commonDir, {
    pollMs: 2,
    acquire: async (dir, options) => {
      acquires += 1;
      if (acquires >= 2) openGate();
      return acquireCommonDirLock(dir, options);
    },
    writeNote: (line) => delivered.push(`lock:${line}`),
    onReplayNote: (line) => delivered.push(line),
    onRecordFailure: (line) => delivered.push(line),
  });
  const req: AcrossRefsRequest = {
    repositoryPath: "/does/not/matter",
    refs: ["refs/heads/dev"],
    allowPartial: false,
  };

  const [holder, waiter] = await Promise.all([
    service.view(req),
    service.view(req),
  ]);

  expect(computes).toBe(1);
  // The holder's note, then the waiter's REPLAY of it: identical bytes, with no
  // newline added by the replay path.
  expect(delivered).toEqual([NOTE, NOTE]);
  expect(JSON.stringify(waiter)).toBe(JSON.stringify(holder));
});

// ---- key construction: fingerprint and plan identity ----

test("the fingerprint ignores repositoryPath but not refs, order, or filters", () => {
  const base: AcrossRefsRequest = {
    repositoryPath: "/one",
    refs: ["a", "b"],
    allowPartial: false,
  };
  expect(
    acrossRefsRequestFingerprint({ ...base, repositoryPath: "/two" }),
  ).toBe(acrossRefsRequestFingerprint(base));
  // Ref ORDER changes the answer (refsRead and state order), so it is kept.
  expect(acrossRefsRequestFingerprint({ ...base, refs: ["b", "a"] })).not.toBe(
    acrossRefsRequestFingerprint(base),
  );
  // Set-like filters are normalised.
  const filtered: AcrossRefsRequest = {
    ...base,
    filter: { labels: ["x", "y"], types: ["bug"] },
  };
  expect(
    acrossRefsRequestFingerprint({
      ...filtered,
      filter: { labels: ["y", "x"], types: ["bug"] },
    }),
  ).toBe(acrossRefsRequestFingerprint(filtered));
  expect(
    acrossRefsRequestFingerprint({
      ...filtered,
      allowPartial: true,
    }),
  ).not.toBe(acrossRefsRequestFingerprint(filtered));
  expect(
    acrossRefsRequestFingerprint({
      ...filtered,
      filter: { labels: ["x", "y"], types: ["bug"], includeArchived: true },
    }),
  ).not.toBe(acrossRefsRequestFingerprint(filtered));
});

test("the plan identity follows a ref's sha and ignores discoveredAt", () => {
  const plan = (sha: string, discoveredAt: string): AcrossRefsPlan => ({
    kind: "planned",
    population: "explicit",
    refs: [{ ref: "refs/heads/dev", pullRequest: null, sha }],
    unreadable: [],
    discoveredAt,
  });
  expect(acrossRefsPlanIdentity(plan("a".repeat(40), "t1"))).not.toBe(
    acrossRefsPlanIdentity(plan("b".repeat(40), "t1")),
  );
  expect(acrossRefsPlanIdentity(plan("a".repeat(40), "t1"))).toBe(
    acrossRefsPlanIdentity(plan("a".repeat(40), "t2")),
  );
  expect(
    acrossRefsPlanIdentity({ kind: "absent", detail: "dev", message: "x" }),
  ).toBe("absent:dev");
});

// ---- the store itself: bounded, atomic, strictly keyed ----

function sampleRecord(finishedAt: number): AcrossRefsResultRecord {
  return {
    planIdentity: "identity",
    finishedAt,
    outcome: {
      kind: "view",
      entries: [],
      coverage: {
        complete: true,
        population: "explicit",
        discoveredAt: "t",
        refsRead: [],
        refsUnreadable: [],
      },
    },
    notes: [],
    holderToken: "token",
  };
}

test("the results store is bounded: prune keeps the newest records (plus protected)", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli568-results-prune-"));
  roots.push(directory);
  const store = new AcrossRefsResults(directory, { maxRecords: 2 });
  const [a, b, c] = ["a", "b", "c"].map((char) => char.repeat(64));
  for (const [fingerprint, mtime] of [
    [a, 1_000],
    [b, 2_000],
    [c, 3_000],
  ] as const) {
    expect(await store.write(fingerprint, sampleRecord(mtime))).toBeNull();
    const at = new Date(mtime);
    await utimes(join(directory, `${fingerprint}.json`), at, at);
  }

  await store.prune(new Set());

  const remaining = (await readdir(directory)).sort();
  expect(remaining).toEqual([`${b}.json`, `${c}.json`]);
  expect(await store.read(a)).toBeNull();
  expect((await store.read(c))?.finishedAt).toBe(3_000);

  // A protected key survives even past the bound, exactly like the cache's.
  expect(await store.write(a, sampleRecord(500))).toBeNull();
  await store.prune(new Set([a]));
  expect((await readdir(directory)).sort()).toEqual([`${a}.json`, `${c}.json`]);
});

test("the results store writes atomically and only under a strict key", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qcli568-results-io-"));
  roots.push(directory);
  const store = new AcrossRefsResults(directory);
  const key = "d".repeat(64);

  // A key that is not a sha256 hex digest is never a filename.
  expect(await store.write("not-a-fingerprint", sampleRecord(1))).toBeNull();
  expect(await store.read("not-a-fingerprint")).toBeNull();
  // A real write round-trips, leaves no temp residue, and validates its own
  // document (a re-read of a tampered file is a MISS, not a throw).
  expect(await store.write(key, sampleRecord(7))).toBeNull();
  expect(await readdir(directory)).toEqual([`${key}.json`]);
  expect((await store.read(key))?.finishedAt).toBe(7);
  await writeFile(join(directory, `${key}.json`), "{}", "utf8");
  expect(await store.read(key)).toBeNull();
});
