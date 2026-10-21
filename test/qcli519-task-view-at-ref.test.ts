import { beforeAll, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCommand } from "./helpers/spawn.ts";

/**
 * QCLI-519 / DEC-206 (c3): `quest task view <id> --ref <ref>`.
 *
 * The fixtures are REAL Git repositories, because every claim this command
 * makes is a claim about the commit graph: the record must come from the tree
 * at the ref, the envelope must name the commit the ref resolved to, and a
 * read that quietly fell back to the working tree would satisfy a mocked
 * fixture just as well as a correct one. That last failure is exactly what
 * this suite is built to catch, so the SAME id exists at both the ref and the
 * working tree carrying DIFFERENT statuses, and the discriminating cases
 * assert which one came back.
 *
 * Both halves of the detection are pinned:
 *
 *  - a task present ONLY at the ref resolves there and is absent in the
 *    working tree (so the read cannot be reading the local tree);
 *  - an id absent at the ref fails with `task_not_found`, and a ref that does
 *    not resolve fails with a DIFFERENT named error (`ref_not_resolvable`) --
 *    two "not found"s that a caller must be able to tell apart.
 *
 * The mutation control recorded on the task: replacing the ref's resolved sha
 * with `HEAD` in `readTaskAtRef` turns the ref-only case red (measured, see
 * the task's implementation notes). Nothing here mocks Git.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "t", "--actor-kind", "human"] as const;

interface Run {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(cwd: string, argv: readonly string[]): Run {
  return runCommand([...argv], {
    cwd,
    env: { ...process.env, QUEST_AGENT_PLUGINS: "off" },
  });
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

interface Fixture {
  readonly work: string;
  readonly devSha: string;
  readonly featureSha: string;
}

/**
 * `dev` carries T-1 (To Do) and T-2. The unmerged `feature` branch moves T-1
 * to In Progress and adds T-3, which exists nowhere else. So one id is present
 * at both with different content, and one is present only at the ref.
 */
async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "qcli519-"));
  const work = join(root, "work");
  git(root, "init", "-q", "-b", "dev", work);
  git(work, "config", "user.email", "t@example.invalid");
  git(work, "config", "user.name", "T");
  questOk(work, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
  questOk(work, ["task", "create", "on dev", ...ACTOR]);
  questOk(work, ["task", "create", "also on dev", ...ACTOR]);
  git(work, "add", "-A");
  git(work, "commit", "-qm", "T-1 and T-2 on dev");
  const devSha = git(work, "rev-parse", "dev");

  git(work, "checkout", "-q", "-b", "feature");
  questOk(work, ["task", "edit", "T-1", "--status", "In Progress", ...ACTOR]);
  questOk(work, ["task", "create", "only on the feature branch", ...ACTOR]);
  questOk(work, [
    "task",
    "edit",
    "T-3",
    "--add-note",
    "first note on the branch",
    ...ACTOR,
  ]);
  git(work, "add", "-A");
  git(work, "commit", "-qm", "T-3, and T-1 In Progress");
  const featureSha = git(work, "rev-parse", "feature");
  git(work, "checkout", "-q", "dev");
  return { work, devSha, featureSha };
}

let fixture: Fixture;

beforeAll(async () => {
  fixture = await createFixture();
});

function viewAtRef(ref: string, id: string, extra: readonly string[] = []) {
  return quest(fixture.work, [
    "task",
    "view",
    id,
    "--ref",
    ref,
    ...extra,
    "--json",
  ]);
}

function envelope(result: Run): Record<string, unknown> {
  expect(result.exitCode).toBe(0);
  expect(result.stderr).toBe("");
  return JSON.parse(result.stdout) as Record<string, unknown>;
}

function data(result: Run): Record<string, unknown> {
  return envelope(result).data as Record<string, unknown>;
}

test("a task present only at the ref resolves there, and is absent in the working tree", () => {
  // The control: the same id read WITHOUT --ref is not there at all.
  const locally = quest(fixture.work, ["task", "view", "T-3", "--json"]);
  expect(locally.exitCode).toBe(3);

  const result = viewAtRef("feature", "T-3");
  const record = data(result);
  expect(record.id).toBe("T-3");
  expect(record.title).toBe("only on the feature branch");
  expect(record.path).toBe(".quest/tasks/T-3.json");
});

test("the envelope carries the same shape plus ref provenance, with principal last", () => {
  const result = viewAtRef("feature", "T-3");
  const body = envelope(result);
  expect(Object.keys(body)).toEqual([
    "schemaVersion",
    "contractVersion",
    "kind",
    "data",
    "ref",
    "principal",
  ]);
  expect(body.kind).toBe("task.view");
  expect(body.ref).toEqual({ ref: "feature", sha: fixture.featureSha });
  // The record's own shape is untouched: the same keys a plain view returns.
  const plain = data(quest(fixture.work, ["task", "view", "T-1", "--json"]));
  const atRef = data(viewAtRef("feature", "T-1"));
  expect(Object.keys(atRef).sort()).toEqual(Object.keys(plain).sort());
  expect(atRef.revision).toBeString();
});

test("the record comes from the ref, not the working tree, when both carry the id", () => {
  const onDev = data(quest(fixture.work, ["task", "view", "T-1", "--json"]));
  const onFeature = data(viewAtRef("feature", "T-1"));
  expect(onDev.status).toBe("To Do");
  expect(onFeature.status).toBe("In Progress");
  // And reading dev's own commit through --ref answers what the working tree
  // holds, so the flag is not simply "read the other branch".
  const atDev = data(viewAtRef(fixture.devSha, "T-1"));
  expect(atDev.status).toBe("To Do");
  expect(atDev.id).toBe("T-1");
});

test("an alias-or-id match is case-insensitive, the same resolver task view uses", () => {
  const record = data(viewAtRef("feature", "t-3"));
  expect(record.id).toBe("T-3");
});

test("an id absent at the ref is a named not_found naming the ref and its sha", () => {
  const result = viewAtRef("feature", "T-99");
  expect(result.exitCode).toBe(3);
  const error = JSON.parse(result.stderr) as Record<string, unknown>;
  expect(error.error_type).toBe("not_found");
  expect(String(error.message)).toContain("task_not_found");
  expect(String(error.message)).toContain(fixture.featureSha);
  expect(error.input).toEqual({
    reference: "T-99",
    ref: "feature",
    sha: fixture.featureSha,
  });
});

test("an unresolvable ref is a DISTINCT named error, not the task one", () => {
  const result = viewAtRef("no-such-ref", "T-1");
  expect(result.exitCode).toBe(3);
  const error = JSON.parse(result.stderr) as Record<string, unknown>;
  expect(error.error_type).toBe("not_found");
  expect(String(error.message)).toContain("ref_not_resolvable");
  expect(String(error.message)).not.toContain("task_not_found");
  expect(error.input).toEqual({ ref: "no-such-ref" });
});

test("it writes nothing and moves nothing", () => {
  const before = git(fixture.work, "rev-parse", "HEAD");
  const statusBefore = git(fixture.work, "status", "--porcelain");
  viewAtRef("feature", "T-3");
  viewAtRef("feature", "T-1");
  viewAtRef("feature", "T-99");
  viewAtRef("no-such-ref", "T-1");
  expect(git(fixture.work, "rev-parse", "HEAD")).toBe(before);
  expect(git(fixture.work, "status", "--porcelain")).toBe(statusBefore);
  expect(statusBefore).toBe("");
});

test("it takes no revision precondition", () => {
  const result = viewAtRef("feature", "T-1", ["--if-revision", "abc"]);
  expect(result.exitCode).toBe(2);
});

test("--max-notes and --fields compose with --ref", () => {
  const capped = data(viewAtRef("feature", "T-3", ["--max-notes", "0"]));
  expect(capped.implementationNotes).toEqual([]);
  expect(capped.notesOmitted).toBe(1);

  const projected = data(
    viewAtRef("feature", "T-3", ["--fields", "id,status,revision"]),
  );
  expect(Object.keys(projected)).toEqual(["id", "status", "revision"]);
  expect(projected.id).toBe("T-3");
  // The projection narrows `data` only; the ref provenance still rides beside
  // it, so a projected read is still reproducible.
  const body = envelope(
    viewAtRef("feature", "T-3", ["--fields", "id,status,revision"]),
  );
  expect(body.ref).toEqual({ ref: "feature", sha: fixture.featureSha });
});
