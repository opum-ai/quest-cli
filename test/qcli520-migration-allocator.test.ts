import { expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import { BacklogImporter } from "../src/adapters/migration/backlog/importer.ts";
import { LocalPlanningRepository } from "../src/adapters/planning/local-planning-repository.ts";
import {
  type BacklogIdAllocation,
  BacklogIdAllocationMissingError,
  BacklogImportService,
} from "../src/application/migration/backlog-public.ts";
import { releaseIdBlock } from "../src/application/tasks/id-allocation.ts";
import type {
  MigrationTransactionRepository,
  MigrationTransactionResult,
} from "../src/ports/backlog-import.ts";
import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-520: the Backlog.md migration mints its task and milestone ids through
 * the SHARED allocator (QCLI-495's common-dir lock, reservation ledger and
 * worktree scan) instead of computing them from its own worktree.
 *
 * The fixtures are REAL Git repositories with REAL worktrees, because every
 * claim here is a claim about what two checkouts of one repository can see of
 * each other: a mocked repository cannot have an uncommitted sibling.
 *
 * PROVED BOTH WAYS, which is what makes the fixture worth anything:
 *
 *  - the CONTROL computes what the pre-QCLI-520 rule (highest local id + 1)
 *    would mint in each of two fresh worktrees and shows it colliding -- so
 *    this fixture can detect the defect it exists for; and
 *  - the FIX runs `migration backlog apply` in two worktrees before either
 *    commits, and asserts the ids are disjoint (tasks AND milestones).
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "t", "--actor-kind", "human"] as const;

interface Run {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(cwd: string, argv: readonly string[]): Run {
  const env = { ...process.env, QUEST_AGENT_PLUGINS: "off" };
  delete (env as Record<string, string | undefined>).QUEST_TASK_STORE;
  return runCommand([...argv], { cwd, env });
}

function git(cwd: string, ...args: readonly string[]): string {
  const result = run(cwd, ["git", ...args]);
  if (result.exitCode !== 0)
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}

const quest = (cwd: string, args: readonly string[]): Run =>
  run(cwd, [process.execPath, MAIN, ...args]);

function questOk(cwd: string, args: readonly string[]): Run {
  const result = quest(cwd, [...args, "--json"]);
  expect({ args, exitCode: result.exitCode, stderr: result.stderr }).toEqual({
    args,
    exitCode: 0,
    stderr: "",
  });
  return result;
}

async function sourceFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "qcli520-source-"));
  const tasks = join(root, "backlog", "tasks");
  await mkdir(tasks, { recursive: true });
  for (const [id, title] of [
    ["OLD-1", "first legacy task"],
    ["OLD-2", "second legacy task"],
  ])
    await writeFile(
      join(tasks, `${id}.md`),
      `---\nid: ${id}\ntitle: ${title}\nstatus: To Do\nmilestone: Sprint One\n---\n\nSource-only fixture.\n`,
      "utf8",
    );
  return root;
}

/** The PRE-QCLI-520 rule, verbatim: highest local id in the worktree + index +
 *  1. Used only as the control -- both halves of the proof are asserted, so a
 *  fixture that could not have shown the collision says so. */
async function oldRuleIds(worktree: string, count: number): Promise<string[]> {
  const directory = join(worktree, ".quest", "tasks");
  const names = await readdir(directory).catch(() => [] as string[]);
  const highest = names
    .filter((name) => name.endsWith(".json"))
    // `names` is a bare `readdir` filename (`T-1.json`), not a path: slicing
    // the `.quest/tasks/` prefix off it shortened every id to "". The control
    // was then a constant and could not show a collision at all (QCLI-520
    // round 1, MAJOR 1).
    .map((name) => name.slice(0, -".json".length))
    .filter((id) => /^T-[1-9][0-9]*$/u.test(id))
    .reduce((maximum, id) => Math.max(maximum, Number(id.slice(2))), 0);
  return Array.from(
    { length: count },
    (_, index) => `T-${highest + index + 1}`,
  );
}

async function taskIdsIn(worktree: string): Promise<string[]> {
  const directory = join(worktree, ".quest", "tasks");
  const names = await readdir(directory).catch(() => [] as string[]);
  return names
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .sort();
}

async function milestoneIdsIn(worktree: string): Promise<string[]> {
  const planning = JSON.parse(
    await readFile(join(worktree, ".quest", "planning.json"), "utf8"),
  ) as { milestones?: readonly { id: string }[] };
  return (planning.milestones ?? []).map((entry) => entry.id).sort();
}

test("two worktrees that each migrate before either commits mint disjoint ids (and the old rule would not)", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "qcli520-"));
  const primary = join(sandbox, "primary");
  const second = join(sandbox, "second");
  const control = join(sandbox, "control");
  const source = await sourceFixture();
  try {
    git(sandbox, "init", "-q", "-b", "dev", primary);
    git(primary, "config", "user.email", "t@example.invalid");
    git(primary, "config", "user.name", "T");
    questOk(primary, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
    git(primary, "add", "-A");
    git(primary, "commit", "-qm", "workspace");
    // Two sibling worktrees of the SAME repository, each with its own
    // `.quest` and each sharing the common dir the allocator locks. Detached
    // at `dev` because Git refuses a second checkout of a branch that is
    // already checked out, and nothing here needs a branch.
    git(primary, "worktree", "add", "-q", "--detach", second, "dev");
    git(primary, "worktree", "add", "-q", "--detach", control, "dev");

    // ---- CONTROL: the pre-QCLI-520 rule, in two checkouts that have not
    // migrated yet. Both see no local records, so both mint T-1/T-2: the
    // add/add collision QCLI-495 measured for `task create` and this task
    // measured for the migration.
    const controlBefore = await oldRuleIds(control, 2);
    const secondBefore = await oldRuleIds(second, 2);
    expect(controlBefore).toEqual(["T-1", "T-2"]);
    expect(secondBefore).toEqual(controlBefore);

    // ---- FIX: the same two worktrees, migrated through the allocator.
    const firstPreview = JSON.parse(
      questOk(primary, ["migration", "backlog", "preview", "--source", source])
        .stdout,
    ) as { data: { digest: string; mappings: { targetIdentifier: string }[] } };
    expect(
      firstPreview.data.mappings.map((mapping) => mapping.targetIdentifier),
    ).toEqual(["T-1", "T-2"]);
    questOk(primary, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      firstPreview.data.digest,
      ...ACTOR,
    ]);
    // CONTROL, now with discriminating power (QCLI-520 round 1, MAJOR 1):
    // the first apply put T-1/T-2 in the primary worktree, so the old rule
    // would mint T-3/T-4 there -- while the second worktree still holds
    // nothing and would mint T-1/T-2 again. That intersection is the real
    // add/add collision, and it is invisible to a control whose ids are all
    // empty strings.
    const firstApplyIds = firstPreview.data.mappings.map(
      (mapping) => mapping.targetIdentifier,
    );
    expect(firstApplyIds).toEqual(["T-1", "T-2"]);
    expect(await oldRuleIds(primary, 2)).toEqual(["T-3", "T-4"]);
    const secondOldRuleIds = await oldRuleIds(second, 2);
    expect(secondOldRuleIds).toEqual(["T-1", "T-2"]);
    expect(secondOldRuleIds.filter((id) => firstApplyIds.includes(id))).toEqual(
      ["T-1", "T-2"],
    );

    // NOTHING is committed between the two applies: the first worktree's
    // records exist only in its working tree, which is exactly the state
    // the pre-fix code could not see.

    // The first apply's reservations are DURABLE in the shared ledger the
    // moment it returns -- that is what the second worktree reads, and it
    // is why the block it is offered starts above them.
    const ledgerAfterFirst = await readFile(
      join(primary, ".git", "quest", "reserved-ids"),
      "utf8",
    );
    for (const id of ["T-1", "T-2", "M-1"])
      expect(ledgerAfterFirst).toContain(`"${id}"`);

    const secondPreview = JSON.parse(
      questOk(second, ["migration", "backlog", "preview", "--source", source])
        .stdout,
    ) as { data: { digest: string; mappings: { targetIdentifier: string }[] } };
    // The second worktree is told a DIFFERENT block, because the allocator
    // saw the first worktree's uncommitted records and the ledger.
    expect(
      secondPreview.data.mappings.map((mapping) => mapping.targetIdentifier),
    ).toEqual(["T-3", "T-4"]);
    questOk(second, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      secondPreview.data.digest,
      ...ACTOR,
    ]);

    const primaryIds = await taskIdsIn(primary);
    const secondIds = await taskIdsIn(second);
    expect(primaryIds).toEqual(["T-1", "T-2"]);
    expect(secondIds).toEqual(["T-3", "T-4"]);
    // The assertion the defect violates: no id is minted twice.
    expect(primaryIds.filter((id) => secondIds.includes(id))).toEqual([]);

    // Milestones go through the same allocator, and are minted only at
    // apply — so the same two-writetree shape has to hold for them too.
    expect(await milestoneIdsIn(primary)).toEqual(["M-1"]);
    expect(await milestoneIdsIn(second)).toEqual(["M-2"]);

    // And the reservations are durable in the shared ledger, which is what
    // a THIRD checkout would read even before either record is committed.
    // The first worktree's entries have already been PRUNED by now -- a
    // reservation is spent once a record carrying that id is visible
    // anywhere, which is the ledger's own rule -- so this reads the second
    // block, written but not yet pruned.
    const ledger = await readFile(
      join(primary, ".git", "quest", "reserved-ids"),
      "utf8",
    ).catch(
      // A linked worktree's common dir is the PRIMARY's .git, so the file
      // lives there; the fallback names the other candidate rather than
      // silently passing.
      () => readFile(join(second, ".git", "quest", "reserved-ids"), "utf8"),
    );
    for (const id of ["T-3", "T-4", "M-2"]) expect(ledger).toContain(`"${id}"`);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 120_000);

test("a task record committed on a branch no worktree has checked out raises the migration's block (QCLI-520 round 1, MAJOR 2)", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "qcli520-refs-"));
  const primary = join(sandbox, "primary");
  const source = await sourceFixture();
  try {
    git(sandbox, "init", "-q", "-b", "dev", primary);
    git(primary, "config", "user.email", "t@example.invalid");
    git(primary, "config", "user.name", "T");
    questOk(primary, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
    git(primary, "add", "-A");
    git(primary, "commit", "-qm", "workspace");

    // T-5 exists ONLY on a sibling branch. `dev` -- what this repository's one
    // worktree has checked out -- does not carry it, so neither the working
    // tree nor the worktree scan can see it. The refs scan is the only source
    // that can, and the migration must read it exactly as `task create` does.
    git(primary, "checkout", "-q", "-b", "hidden");
    await mkdir(join(primary, ".quest", "tasks"), { recursive: true });
    await writeFile(
      join(primary, ".quest", "tasks", "T-5.json"),
      `${JSON.stringify({ id: "T-5", title: "branch-only", status: "To Do" })}\n`,
      "utf8",
    );
    git(primary, "add", "-A");
    git(primary, "commit", "-qm", "branch-only T-5");
    git(primary, "checkout", "-q", "dev");

    const preview = JSON.parse(
      questOk(primary, ["migration", "backlog", "preview", "--source", source])
        .stdout,
    ) as { data: { mappings: { targetIdentifier: string }[] } };
    // Without the refs wiring the block starts at T-1 and lands on the id
    // `hidden` already carries.
    expect(
      preview.data.mappings.map((mapping) => mapping.targetIdentifier),
    ).toEqual(["T-6", "T-7"]);
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 120_000);

/* ---- MAJOR 3: release a failed apply's reservation -----------------------
 *
 * These build the service DIRECTLY rather than through the CLI, because the
 * failure has to be injected where the CLI cannot reach it: the transaction
 * repository's own return value. The allocator is the real one, against a
 * real temporary Git repository, so the lock and ledger are the production
 * ones -- only the record write is a stub.
 */

function stubRepository(
  applyTransaction: () => Promise<MigrationTransactionResult>,
): MigrationTransactionRepository {
  return {
    readAll: async () => ({ revision: "r1", taskRecords: [] }),
    applyTransaction,
    write: async () => ({ kind: "success", revision: "r1" }),
    writeLifecycle: async () => ({ kind: "success", revision: "r1" }),
  };
}

function conflictResult(): MigrationTransactionResult {
  return {
    kind: "conflict",
    expectedRevision: "r1",
    actualRevision: "r2",
    operationId: "stub-operation",
    ownedPaths: [],
  };
}

function allocationFor(
  root: string,
  commonDirectory: string,
): BacklogIdAllocation {
  const git = new LocalGitPort();
  return {
    git,
    worktreeRoot: root,
    commonDirectory: async () => commonDirectory,
    // MAJOR 2's source is not what this fixture exercises; an empty answer
    // keeps it out of the way. The ledger and worktree sources stay real.
    idsOnOtherRefs: async () => [],
    releaseIds: (family, marker, reservations) =>
      releaseIdBlock(
        { git, worktreeRoot: root, commonDirectory, marker, family },
        reservations,
      ),
  };
}

async function releaseFixture() {
  const sandbox = await mkdtemp(join(tmpdir(), "qcli520-release-"));
  const root = join(sandbox, "workspace");
  git(sandbox, "init", "-q", "-b", "dev", root);
  git(root, "config", "user.email", "t@example.invalid");
  git(root, "config", "user.name", "T");
  return {
    sandbox,
    root,
    commonDirectory: join(root, ".git"),
    ledgerPath: join(root, ".git", "quest", "reserved-ids"),
    source: await sourceFixture(),
  };
}

test("a failed apply releases the block it reserved, so the SAME approved digest retries and mints the same ids (QCLI-520 round 1, MAJOR 3)", async () => {
  const fixture = await releaseFixture();
  try {
    const { root, commonDirectory, ledgerPath, source } = fixture;
    const allocation = allocationFor(root, commonDirectory);
    const failing = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => conflictResult()),
      new LocalPlanningRepository(root),
      "T",
      allocation,
    );
    const preview = await failing.preview();
    const failed = await failing.apply(preview.digest);
    expect(failed.state).toBe("failed");

    // (i) The run's own block -- tasks AND the milestone it got as far as --
    // is gone from the ledger, not held for the 7-day TTL.
    const ledger = await readFile(ledgerPath, "utf8");
    for (const id of ["T-1", "T-2", "M-1"])
      expect(ledger).not.toContain(`"${id}"`);

    // (ii) The same digest applies, and it mints the ids the approved plan
    // carries. A surviving reservation would make this peek start at T-3 and
    // fail as migration_approval_digest_mismatch.
    const succeeding = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => ({
        kind: "success",
        revision: "r2",
        operationId: "stub-operation",
        taskIds: [],
        removedTaskIds: [],
        milestoneIds: [],
      })),
      new LocalPlanningRepository(root),
      "T",
      allocation,
    );
    const applied = await succeeding.apply(preview.digest);
    expect(applied.state).toBe("applied");
    expect(applied.mappings.map((mapping) => mapping.targetIdentifier)).toEqual(
      ["T-1", "T-2"],
    );
  } finally {
    await rm(fixture.sandbox, { recursive: true, force: true });
  }
}, 60_000);

test("an apply that THROWS after reserving releases the block too (QCLI-520 round 1, MAJOR 3)", async () => {
  const fixture = await releaseFixture();
  try {
    const { root, commonDirectory, ledgerPath, source } = fixture;
    const throwing = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => {
        throw new Error("stub applyTransaction exploded");
      }),
      new LocalPlanningRepository(root),
      "T",
      allocationFor(root, commonDirectory),
    );
    const preview = await throwing.preview();
    await expect(throwing.apply(preview.digest)).rejects.toThrow(
      "stub applyTransaction exploded",
    );
    const ledger = await readFile(ledgerPath, "utf8").catch(() => "");
    for (const id of ["T-1", "T-2", "M-1"])
      expect(ledger).not.toContain(`"${id}"`);
  } finally {
    await rm(fixture.sandbox, { recursive: true, force: true });
  }
}, 60_000);

test("a release that throws leaves the ORIGINAL failure in place, attached as its cause (QCLI-526, N1)", async () => {
  const fixture = await releaseFixture();
  try {
    const { root, commonDirectory, source } = fixture;
    const original = new Error("stub applyTransaction exploded");
    const releaseFailure = new Error("release exploded");
    const service = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => {
        throw original;
      }),
      new LocalPlanningRepository(root),
      "T",
      {
        ...allocationFor(root, commonDirectory),
        // Inside the very path that exists to record a failure, the task
        // release now fails too. Before QCLI-526 its error REPLACED the
        // original. (The milestone release is attempted and succeeds, so the
        // cause is the one failure rather than an AggregateError.)
        releaseIds: async (family) => {
          if (family === "task") throw releaseFailure;
          return false;
        },
      },
    );
    const preview = await service.preview();
    const failure = await service.apply(preview.digest).then(
      () => null,
      (error: unknown) => error,
    );
    // Identity, not just the message: the original is what surfaces.
    expect(failure).toBe(original);
    expect((failure as Error).message).toBe("stub applyTransaction exploded");
    expect((failure as Error).cause).toBe(releaseFailure);
  } finally {
    await rm(fixture.sandbox, { recursive: true, force: true });
  }
}, 60_000);

test("a throwing task release neither throws out of the conflict path nor skips the milestone release (QCLI-526, N1)", async () => {
  const fixture = await releaseFixture();
  try {
    const { root, commonDirectory, source } = fixture;
    const attempted: string[] = [];
    const service = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => conflictResult()),
      new LocalPlanningRepository(root),
      "T",
      {
        ...allocationFor(root, commonDirectory),
        releaseIds: async (family) => {
          attempted.push(family);
          if (family === "task") throw new Error("task release exploded");
          return false;
        },
      },
    );
    const preview = await service.preview();
    const failed = await service.apply(preview.digest);
    // The conflict path RETURNS its failed receipt; a release failure does not
    // turn it into a throw.
    expect(failed.state).toBe("failed");
    // Each release has its own try, so the first one throwing cannot skip the
    // second family.
    expect(attempted).toEqual(["task", "milestone"]);
  } finally {
    await rm(fixture.sandbox, { recursive: true, force: true });
  }
}, 60_000);

test("preview and apply refuse by name when no allocator is wired (QCLI-520 round 1, MINOR 5)", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "qcli520-noalloc-"));
  const root = join(sandbox, "workspace");
  const source = await sourceFixture();
  try {
    git(sandbox, "init", "-q", "-b", "dev", root);
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    // No sixth constructor argument: the state the old code silently answered
    // with the pre-QCLI-520 arithmetic. A caller with no Git repository must
    // pass an allocation whose commonDirectory() resolves null instead.
    const service = new BacklogImportService(
      root,
      new BacklogImporter(source),
      stubRepository(async () => conflictResult()),
      new LocalPlanningRepository(root),
      "T",
    );
    await expect(service.preview()).rejects.toBeInstanceOf(
      BacklogIdAllocationMissingError,
    );
    await expect(service.apply("any-digest")).rejects.toBeInstanceOf(
      BacklogIdAllocationMissingError,
    );
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 60_000);

test("an apply that breaks a stale allocation lock says so on stderr (QCLI-520 round 1, MINOR 1)", async () => {
  const sandbox = await mkdtemp(join(tmpdir(), "qcli520-stale-"));
  const primary = join(sandbox, "primary");
  const source = await sourceFixture();
  try {
    git(sandbox, "init", "-q", "-b", "dev", primary);
    git(primary, "config", "user.email", "t@example.invalid");
    git(primary, "config", "user.name", "T");
    questOk(primary, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
    git(primary, "add", "-A");
    git(primary, "commit", "-qm", "workspace");
    // The allocator's stale rule, both halves: a pid this process reaped, and
    // a stamp past the 30-second window. A PREVIEW peeks without taking the
    // lock, so the stale file survives to the apply's reservation.
    const reaped = spawnSync(process.execPath, ["--version"]);
    if (reaped.pid === undefined) throw new Error("could not spawn a child");
    await mkdir(join(primary, ".git", "quest"), { recursive: true });
    await writeFile(
      join(primary, ".git", "quest", "alloc.lock"),
      `${reaped.pid}\n${Date.now() - 60_000}\n`,
      "utf8",
    );

    const preview = JSON.parse(
      questOk(primary, ["migration", "backlog", "preview", "--source", source])
        .stdout,
    ) as { data: { digest: string } };
    const applied = quest(primary, [
      "migration",
      "backlog",
      "apply",
      "--source",
      source,
      "--digest",
      preview.data.digest,
      ...ACTOR,
      "--json",
    ]);
    expect(applied.exitCode).toBe(0);
    expect(applied.stderr).toContain(
      "Warning: broke a stale id allocation lock at",
    );
    expect(applied.stderr).toContain("alloc.lock");
  } finally {
    await rm(sandbox, { recursive: true, force: true });
  }
}, 120_000);
