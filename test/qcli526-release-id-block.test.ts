import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { TASK_LOCATIONS } from "../src/domain/tasks/tasks.ts";
import {
  type IdBlockRequest,
  releaseIdBlock,
  reserveIdBlock,
} from "../src/application/tasks/id-allocation.ts";
import type { GitPort } from "../src/ports/git.ts";

/**
 * QCLI-526 (QCLI-520 round-2 N4): releaseIdBlock's own unit tests.
 *
 * The defect the release has to avoid is withdrawing an entry it did NOT
 * write: two runs that reserve the same id and family are different ledger
 * entries, and only the stamp tells them apart. Each test below writes a
 * second entry BY HAND, the way another run's reservation would land in the
 * same ledger, and asserts it survives the release.
 */

interface Fixture {
  readonly root: string;
  readonly ledgerPath: string;
  readonly request: Omit<IdBlockRequest, "count">;
  readonly cleanup: () => Promise<void>;
}

async function ledgerFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "qcli526-release-"));
  const commonDirectory = join(root, "common");
  const git = { listWorktrees: async () => [root] } as unknown as GitPort;
  return {
    root,
    ledgerPath: join(commonDirectory, "quest", "reserved-ids"),
    request: {
      git,
      worktreeRoot: root,
      commonDirectory,
      marker: "T-",
      family: "task",
      recordDirectories: TASK_LOCATIONS,
      visibleIds: [],
    },
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

/** Append one entry the way a DIFFERENT run's reservation leaves it. */
async function appendEntry(
  ledgerPath: string,
  entry: { readonly id: string; readonly at: number; readonly family: string },
): Promise<string> {
  const before = await readFile(ledgerPath, "utf8");
  const line = JSON.stringify(entry);
  await writeFile(ledgerPath, `${before}${line}\n`, "utf8");
  return line;
}

test("a release removes exactly the entries the reservation wrote, and a same-id same-family entry from another run survives (QCLI-526, N2)", async () => {
  const fixture = await ledgerFixture();
  try {
    const stamp = 1_000_000;
    const reserved = await reserveIdBlock({
      ...fixture.request,
      count: 2,
      now: () => stamp,
    });
    expect(reserved.ids).toEqual(["T-1", "T-2"]);
    expect(reserved.reservations).toEqual([
      { id: "T-1", at: stamp },
      { id: "T-2", at: stamp },
    ]);

    // Another run reserved T-1 and T-2 too -- same id, same family, written
    // a moment later. Only the stamp distinguishes it from this run's entry.
    const otherRun = { id: "T-1", at: stamp + 5, family: "task" };
    const otherLine = await appendEntry(fixture.ledgerPath, otherRun);

    const released = await releaseIdBlock(
      { ...fixture.request, now: () => stamp + 10 },
      reserved.reservations,
    );
    expect(released).toBe(true);
    const ledger = await readFile(fixture.ledgerPath, "utf8");
    // The other run's entry is intact...
    expect(ledger).toContain(otherLine);
    // ...and this run's own two are gone.
    expect(ledger).not.toContain(
      `{"id":"T-1","at":${String(stamp)},"family":"task"}`,
    );
    expect(ledger).not.toContain(
      `{"id":"T-2","at":${String(stamp)},"family":"task"}`,
    );
  } finally {
    await fixture.cleanup();
  }
});

test("a same-family entry with another id survives a release (QCLI-526, N4)", async () => {
  const fixture = await ledgerFixture();
  try {
    const stamp = 2_000_000;
    const reserved = await reserveIdBlock({
      ...fixture.request,
      count: 1,
      now: () => stamp,
    });
    const other = { id: "T-7", at: stamp + 5, family: "task" };
    const otherLine = await appendEntry(fixture.ledgerPath, other);
    expect(
      await releaseIdBlock(
        { ...fixture.request, now: () => stamp + 10 },
        reserved.reservations,
      ),
    ).toBe(true);
    expect(await readFile(fixture.ledgerPath, "utf8")).toContain(otherLine);
  } finally {
    await fixture.cleanup();
  }
});

test("another family's entry survives a release (QCLI-526, N4)", async () => {
  const fixture = await ledgerFixture();
  try {
    const stamp = 3_000_000;
    const reserved = await reserveIdBlock({
      ...fixture.request,
      count: 1,
      now: () => stamp,
    });
    // A milestone reservation can carry a task-shaped id; family is what keeps
    // the two apart in the ledger.
    const other = { id: "T-9", at: stamp + 5, family: "milestone" };
    const otherLine = await appendEntry(fixture.ledgerPath, other);
    expect(
      await releaseIdBlock(
        { ...fixture.request, now: () => stamp + 10 },
        reserved.reservations,
      ),
    ).toBe(true);
    expect(await readFile(fixture.ledgerPath, "utf8")).toContain(otherLine);
  } finally {
    await fixture.cleanup();
  }
});

test("a null common directory makes a release a false no-op (QCLI-526, N4)", async () => {
  const fixture = await ledgerFixture();
  try {
    const released = await releaseIdBlock(
      { ...fixture.request, commonDirectory: null },
      [{ id: "T-1", at: 1 }],
    );
    expect(released).toBe(false);
    // No ledger was created: there is nowhere for one to live.
    let ledgerWritten = true;
    await readFile(fixture.ledgerPath, "utf8").catch(() => {
      ledgerWritten = false;
    });
    expect(ledgerWritten).toBe(false);
  } finally {
    await fixture.cleanup();
  }
});
