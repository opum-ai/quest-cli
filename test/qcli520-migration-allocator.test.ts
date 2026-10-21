import { expect, test } from "bun:test";
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
    .map((name) => name.slice(".quest/tasks/".length, -".json".length))
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
