import { expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalTaskRepository } from "../src/application/tasks/local-task-repository.ts";
import { createTask } from "../src/domain/tasks/tasks.ts";

/**
 * QCLI-583 (DEC-282 (a19) item 2): `recordsAt` used to turn ANY ENOENT into an
 * empty list for the WHOLE directory, so one listed record file vanishing
 * between `readdir` and `readFile` made every record in that directory read as
 * absent, and `findTask` threw `task_not_found` for a record that exists.
 *
 * Control (recorded in QCLI-583): the sibling test below is the behavioural
 * pre-fix control: it FAILS against the pre-fix `recordsAt` (the sibling record
 * is missing from the snapshot) and passes with the fix. The retry test cannot
 * run pre-fix at all, because the `readRecordFile` seam it overrides does not
 * exist there; its control is the mutants M1 (the old whole-directory
 * behaviour) and M2 (no repeat), recorded in QCLI-583. The tests use a dangling
 * symlink and that seam, not a literal removal between `readdir` and `readFile`.
 */

async function seed(root: string, id: string, title: string) {
  await mkdir(join(root, ".quest", "tasks"), { recursive: true });
  await writeFile(
    join(root, ".quest", "tasks", `${id}.json`),
    `${JSON.stringify(createTask(id, { title }))}\n`,
  );
}

/** A listed `.json` whose read ENOENTs: readdir sees it, readFile cannot open
 *  it. The same observable as a file removed between the two calls. */
async function dangling(root: string, id: string) {
  await symlink(
    join(root, "does-not-exist.json"),
    join(root, ".quest", "tasks", `${id}.json`),
  );
}

/** Fails the FIRST read of one path with ENOENT, then reads normally: a record
 *  that was mid-move on the first pass and is present on the repeat. */
class VanishOnceRepository extends LocalTaskRepository {
  readonly reads: string[] = [];
  private spent = false;
  constructor(
    directory: string,
    private readonly victim: string,
  ) {
    super(directory);
  }
  protected override async readRecordFile(path: string): Promise<string> {
    this.reads.push(path);
    if (!this.spent && path.endsWith(this.victim)) {
      this.spent = true;
      throw Object.assign(new Error("ENOENT: simulated vanish"), {
        code: "ENOENT",
      });
    }
    return await super.readRecordFile(path);
  }
}

test("one vanished record file does not empty its siblings out of the snapshot", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-sibling-"));
  try {
    await seed(root, "T-1", "Survivor");
    await seed(root, "T-3", "Other survivor");
    await dangling(root, "T-2");
    const repo = new LocalTaskRepository(join(root, ".quest", "tasks"));
    const read = await repo.readAll();
    expect(read.tasks.map((task) => task.id)).toEqual(["T-1", "T-3"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a file that vanishes on the first pass and is present on the repeat is kept", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-retry-"));
  try {
    await seed(root, "T-1", "Mid-move");
    await seed(root, "T-2", "Sibling");
    const repo = new VanishOnceRepository(
      join(root, ".quest", "tasks"),
      "T-1.json",
    );
    const read = await repo.readAll();
    expect(read.tasks.map((task) => task.id)).toEqual(["T-1", "T-2"]);
    // the sibling is read once per pass: one pass, then exactly one repeat
    // because a file vanished
    expect(repo.reads.filter((path) => path.endsWith("T-2.json"))).toHaveLength(
      2,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the repeat is bounded at exactly one: a persistently vanished file does not loop", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-bound-"));
  try {
    await seed(root, "T-1", "Survivor");
    await seed(root, "T-3", "Other survivor");
    await dangling(root, "T-2");
    // a counting subclass that delegates unchanged, so the real ENOENT of the
    // dangling symlink fires on every pass
    const repo = new VanishOnceRepository(
      join(root, ".quest", "tasks"),
      "no-such-file.json",
    );
    const read = await repo.readAll();
    expect(read.tasks.map((task) => task.id)).toEqual(["T-1", "T-3"]);
    for (const sibling of ["T-1.json", "T-3.json"]) {
      expect(repo.reads.filter((path) => path.endsWith(sibling))).toHaveLength(
        2,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a scan with no vanished file is not repeated", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-norepeat-"));
  try {
    await seed(root, "T-1", "Steady");
    const repo = new VanishOnceRepository(
      join(root, ".quest", "tasks"),
      "no-such-file.json",
    );
    await repo.readAll();
    expect(repo.reads).toHaveLength(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a directory that does not exist is still an empty collection", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-nodir-"));
  try {
    const repo = new LocalTaskRepository(join(root, ".quest", "tasks"));
    const read = await repo.readAll();
    expect(read.tasks).toEqual([]);
    expect(read.drafts).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a read error that is not ENOENT still propagates", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-583-other-"));
  try {
    await seed(root, "T-1", "Broken");
    class Denied extends LocalTaskRepository {
      protected override async readRecordFile(): Promise<string> {
        throw Object.assign(new Error("EACCES"), { code: "EACCES" });
      }
    }
    const repo = new Denied(join(root, ".quest", "tasks"));
    await expect(repo.readAll()).rejects.toThrow("EACCES");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
