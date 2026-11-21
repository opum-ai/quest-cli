import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  AcrossRefsOutcome,
  AcrossRefsRequest,
} from "../src/application/refs/across-refs.ts";
import {
  AcrossRefsLockedService,
  type AcrossRefsView,
  DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS,
} from "../src/application/refs/across-refs-locked.ts";
import {
  acquireCommonDirLock,
  CommonDirLockTimeoutError,
  DEFAULT_STALE_AFTER_MS,
  resolveCommonDirLockPath,
} from "../src/application/refs/common-dir-lock.ts";

/**
 * QCLI-568 (wiring half). The wrapper serialises `task list --across-refs` runs
 * from different worktrees of one clone. These tests use a real temp directory
 * as the common git dir and inject the resolver, so no git is needed. DEC-282
 * (a8): both unlocked paths (broken mechanism, pathological expiry) PROCEED but
 * are never silent -- each writes exactly one stderr line naming the cause and
 * saying the command ran unlocked; the envelope is the inner view's own object.
 */

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function tempCommonDir(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "qcli568-locked-"));
  roots.push(root);
  return root;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as { readonly code?: string }).code === "ENOENT") return false;
    throw error;
  }
}

/** A fixed outcome object; tests assert identity to prove stdout is untouched. */
const OUTCOME: AcrossRefsOutcome = {
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

const REQUEST: AcrossRefsRequest = {
  repositoryPath: "/does/not/matter",
  allowPartial: false,
};

function noteCollector(): {
  notes: string[];
  writeNote: (line: string) => void;
} {
  const notes: string[] = [];
  return { notes, writeNote: (line) => notes.push(line) };
}

function timeoutError(commonDir: string): CommonDirLockTimeoutError {
  const lockPath = resolveCommonDirLockPath(commonDir);
  return new CommonDirLockTimeoutError({
    lockPath,
    waitedMs: DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS,
    holder: null,
    lockAgeMs: null,
    breakPath: `${lockPath}.break`,
    breakFilePresent: false,
    breakHolderPid: null,
    breakHolderAlive: false,
    breakFileAgeMs: null,
    breakReadError: null,
    staleAfterMs: DEFAULT_STALE_AFTER_MS,
    pidGoneFloorMs: 30_000,
    breakStaleAfterMs: 10_000,
  });
}

test("the wait is the lock's staleAfterMs plus a margin", () => {
  expect(DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS).toBe(
    DEFAULT_STALE_AFTER_MS + 60_000,
  );
  expect(DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS).toBeGreaterThan(
    DEFAULT_STALE_AFTER_MS,
  );
});

test("two concurrent wrapped runs serialise, and the locked path is silent", async () => {
  const commonDir = await tempCommonDir();
  let inside = 0;
  let overlapped = false;
  const view: AcrossRefsView = {
    async view(): Promise<AcrossRefsOutcome> {
      inside += 1;
      if (inside > 1) overlapped = true;
      // Yield long enough that a second, unserialised run would enter.
      await new Promise((resolve) => setTimeout(resolve, 25));
      inside -= 1;
      return OUTCOME;
    },
  };
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(view, async () => commonDir, {
    pollMs: 5,
    writeNote,
  });

  const [first, second] = await Promise.all([
    service.view(REQUEST),
    service.view(REQUEST),
  ]);

  expect(overlapped).toBe(false);
  expect(first).toBe(OUTCOME);
  expect(second).toBe(OUTCOME);
  // The normal locked path writes nothing to stderr.
  expect(notes).toHaveLength(0);
});

test("passes the sized wait to the lock", async () => {
  const commonDir = await tempCommonDir();
  let seen: { waitTimeoutMs?: number } | undefined;
  const service = new AcrossRefsLockedService(
    { view: async () => OUTCOME },
    async () => commonDir,
    {
      acquire: async (_dir, options) => {
        seen = options;
        return { release: async () => undefined };
      },
      writeNote: () => undefined,
    },
  );

  await service.view(REQUEST);

  expect(seen?.waitTimeoutMs).toBe(DEFAULT_ACROSS_REFS_WAIT_TIMEOUT_MS);
});

test("a broken lock mechanism proceeds unlocked with exactly one stderr line", async () => {
  const commonDir = await tempCommonDir();
  const boom = Object.assign(new Error("EACCES: permission denied"), {
    code: "EACCES",
  });
  let runs = 0;
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        runs += 1;
        return OUTCOME;
      },
    },
    async () => commonDir,
    {
      acquire: async () => {
        throw boom;
      },
      writeNote,
    },
  );

  const outcome = await service.view(REQUEST);

  expect(outcome).toBe(OUTCOME);
  expect(runs).toBe(1);
  expect(service.lastLockError).toBe(boom);
  expect(notes).toHaveLength(1);
  // Exactly one newline-terminated line.
  expect(notes[0]?.endsWith("\n")).toBe(true);
  expect(notes[0]?.split("\n").filter((part) => part.length > 0)).toHaveLength(
    1,
  );
  expect(notes[0]).toMatch(/^note: /u);
  expect(notes[0]).toContain("ran unlocked");
  expect(notes[0]).toContain("EACCES");
});

test("an absent common directory proceeds unlocked and is not created", async () => {
  const root = await tempCommonDir();
  const absent = join(root, "missing-common-dir");
  let runs = 0;
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        runs += 1;
        return OUTCOME;
      },
    },
    async () => absent,
    { writeNote },
  );

  const outcome = await service.view(REQUEST);

  expect(outcome).toBe(OUTCOME);
  expect(runs).toBe(1);
  expect(service.lastLockError).toBeTruthy();
  expect(notes).toHaveLength(1);
  expect(notes[0]).toMatch(/^note: /u);
  expect(notes[0]).toContain("ran unlocked");
  // F9: the lock's mkdir is non-recursive, so a wrong root fails loudly rather
  // than silently creating a stray `<root>/quest`.
  expect(await pathExists(absent)).toBe(false);
});

test("an unresolvable common directory proceeds unlocked with one stderr line", async () => {
  let runs = 0;
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        runs += 1;
        return OUTCOME;
      },
    },
    async () => {
      throw new Error("fatal: not a git repository");
    },
    { writeNote },
  );

  const outcome = await service.view(REQUEST);

  expect(outcome).toBe(OUTCOME);
  expect(runs).toBe(1);
  expect(service.lastLockError).toBeInstanceOf(Error);
  expect(notes).toHaveLength(1);
  expect(notes[0]).toMatch(/^note: /u);
  expect(notes[0]).toContain("ran unlocked");
  expect(notes[0]).toContain("not a git repository");
});

test("a pathological expiry proceeds unlocked by default with one stderr line", async () => {
  const commonDir = await tempCommonDir();
  const timeout = timeoutError(commonDir);
  let runs = 0;
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        runs += 1;
        return OUTCOME;
      },
    },
    async () => commonDir,
    {
      acquire: async () => {
        throw timeout;
      },
      writeNote,
    },
  );

  const outcome = await service.view(REQUEST);

  expect(outcome).toBe(OUTCOME);
  expect(runs).toBe(1);
  expect(notes).toHaveLength(1);
  // The note is authored across lines for readability; exactly one line must
  // reach the sink (R6 -- removing oneLine from the note path reds this).
  expect(notes[0]?.split("\n").filter((part) => part.length > 0)).toHaveLength(
    1,
  );
  expect(notes[0]).toMatch(/^note: /u);
  expect(notes[0]).toContain("ran unlocked");
  expect(notes[0]).toContain("timed out");
  // A timeout is the expiry path, not recorded as a broken mechanism.
  expect(service.lastLockError).toBeNull();
});

test("the onTimeout seam can choose a different policy", async () => {
  const commonDir = await tempCommonDir();
  const timeout = timeoutError(commonDir);
  let runs = 0;
  const { notes, writeNote } = noteCollector();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        runs += 1;
        return OUTCOME;
      },
    },
    async () => commonDir,
    {
      acquire: async () => {
        throw timeout;
      },
      // Fail closed: the opposite of the shipped default.
      onTimeout: async (error) => {
        throw error;
      },
      writeNote,
    },
  );

  await expect(service.view(REQUEST)).rejects.toBe(timeout);
  expect(runs).toBe(0);
  expect(notes).toHaveLength(0);
});

test("releases the lock when the inner view throws", async () => {
  const commonDir = await tempCommonDir();
  const service = new AcrossRefsLockedService(
    {
      view: async () => {
        throw new Error("boom");
      },
    },
    async () => commonDir,
    { pollMs: 5, writeNote: () => undefined },
  );

  await expect(service.view(REQUEST)).rejects.toThrow("boom");

  // If the throw stranded the lock, this acquisition would time out.
  const lock = await acquireCommonDirLock(commonDir, {
    pollMs: 5,
    waitTimeoutMs: 500,
  });
  await lock.release();
  expect(await pathExists(resolveCommonDirLockPath(commonDir))).toBe(false);
});

test("the default note sink writes exactly one line to process.stderr", async () => {
  const commonDir = await tempCommonDir();
  const boom = new Error("EACCES: permission denied");
  const writes: string[] = [];
  const original = process.stderr.write;
  // No writeNote option: exercise the wrapper's own default sink, which is what
  // a non-CLI construction falls back to (and what mutant (c) removes).
  process.stderr.write = ((chunk: unknown) => {
    writes.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;
  try {
    const service = new AcrossRefsLockedService(
      { view: async () => OUTCOME },
      async () => commonDir,
      {
        acquire: async () => {
          throw boom;
        },
      },
    );
    const outcome = await service.view(REQUEST);
    expect(outcome).toBe(OUTCOME);
  } finally {
    process.stderr.write = original;
  }

  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatch(/^note: .*ran unlocked/u);
  expect(writes[0]?.endsWith("\n")).toBe(true);
});
