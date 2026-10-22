import { beforeAll, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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
  // Round-1 review (MAJOR): an ANNOTATED tag, because `rev-parse --verify`
  // without `^{commit}` answers the tag object and reports its sha as the
  // commit. The fixture is where the peeling is measurable.
  git(work, "tag", "-a", "v-dev", "-m", "annotated dev tag", "dev");

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
    // QCLI-519 round 1 (MINOR 2): the distinguishing token is machine-readable,
    // not only prose.
    code: "task_not_found",
  });
});

test("an unresolvable ref is a DISTINCT named error, not the task one", () => {
  const result = viewAtRef("no-such-ref", "T-1");
  expect(result.exitCode).toBe(3);
  const error = JSON.parse(result.stderr) as Record<string, unknown>;
  expect(error.error_type).toBe("not_found");
  expect(String(error.message)).toContain("ref_not_resolvable");
  expect(String(error.message)).not.toContain("task_not_found");
  expect(error.input).toEqual({
    ref: "no-such-ref",
    code: "ref_not_resolvable",
  });
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

/*
 * FIX ROUND (independent review, round 1). The ref must resolve to a COMMIT,
 * not merely to an object: the release tags are annotated, and a tree-ish or
 * blob-ish spelling passed the 40-hex guard and produced a wrong sha or a
 * false "the tree is damaged". Each test below reaches the object the claim is
 * about -- a real annotated tag, a real tree, a real duplicate, a real
 * ambiguity -- rather than a mocked Git.
 */

test("an annotated tag reports the commit it peels to, never the tag object", () => {
  const tagObject = git(fixture.work, "rev-parse", "v-dev");
  const tagCommit = git(fixture.work, "rev-parse", "v-dev^{commit}");
  // The fixture's tag really is annotated: the two objects differ. Without
  // this the test could pass against a lightweight tag that never exercises
  // the defect.
  expect(tagObject).not.toBe(tagCommit);

  const body = envelope(viewAtRef("v-dev", "T-2"));
  expect(data(viewAtRef("v-dev", "T-2")).id).toBe("T-2");
  expect(body.ref).toEqual({ ref: "v-dev", sha: tagCommit });
  expect((body.ref as { readonly sha: string }).sha).not.toBe(tagObject);
});

test("an option-shaped --ref=-x is ref_not_resolvable (exit 3), never a usage error (QCLI-527)", () => {
  // One argv element, `--ref=-x`, whose VALUE starts with a dash. The parser
  // must take it as the value rather than treating it as another option --
  // the round-2 review proved this by hand only, which is exactly the shape a
  // regression would silently reopen.
  const result = quest(fixture.work, [
    "task",
    "view",
    "T-1",
    "--ref=-x",
    "--json",
  ]);
  expect(result.exitCode).toBe(3);
  const error = JSON.parse(result.stderr) as Record<string, unknown>;
  expect(error.error_type).toBe("not_found");
  expect(String(error.message)).toContain("ref_not_resolvable");
  expect(String(error.message)).not.toContain("task_not_found");
  expect(error.input).toEqual({ ref: "-x", code: "ref_not_resolvable" });
});

test("a lightweight tag resolves to the commit it points at (QCLI-527)", () => {
  // Unlike v-dev this tag has no object of its own: the spelling names a ref,
  // and the envelope still reports the commit sha it resolved to.
  git(fixture.work, "tag", "light-dev", "dev");
  expect(git(fixture.work, "rev-parse", "light-dev")).toBe(fixture.devSha);
  const result = viewAtRef("light-dev", "T-1");
  const body = envelope(result);
  expect(body.ref).toEqual({ ref: "light-dev", sha: fixture.devSha });
  // dev's T-1, not feature's: the tag really resolved to dev's commit.
  expect((body.data as { readonly status: string }).status).toBe("To Do");
});

test("an abbreviated sha resolves to the full commit sha in the envelope (QCLI-527)", () => {
  const short = fixture.devSha.slice(0, 8);
  // The spelling names a prefix; what a consumer needs is the commit.
  expect(short.length).toBeLessThan(fixture.devSha.length);
  const body = envelope(viewAtRef(short, "T-1"));
  expect(body.ref).toEqual({ ref: short, sha: fixture.devSha });
  expect((body.data as { readonly status: string }).status).toBe("To Do");
});

test("a tree-ish or blob-ish --ref is ref_not_resolvable (exit 3), not a tree read", () => {
  // `HEAD^{tree}` names a tree (before the fix it reported the tree sha as
  // the commit); `HEAD:.quest/tasks/T-1.json` names a blob (before the fix it
  // failed as ref_records_unreadable, exit 6, falsely claiming tree damage).
  // Both must now be the SAME named failure: the ref does not peel to a
  // commit.
  for (const ref of ["HEAD^{tree}", "HEAD:.quest/tasks/T-1.json"]) {
    const result = viewAtRef(ref, "T-1");
    expect({ ref, exitCode: result.exitCode }).toEqual({ ref, exitCode: 3 });
    const error = JSON.parse(result.stderr) as Record<string, unknown>;
    expect(error.error_type).toBe("not_found");
    expect(String(error.message)).toContain("ref_not_resolvable");
    expect(String(error.message)).not.toContain("task_not_found");
    expect(String(error.message)).not.toContain("ref_records_unreadable");
    expect(error.input).toEqual({ ref, code: "ref_not_resolvable" });
  }
});

test("the plain form ends with a ref footer naming the ref and its commit", () => {
  const result = quest(fixture.work, [
    "task",
    "view",
    "T-3",
    "--ref",
    "feature",
  ]);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("only on the feature branch");
  expect(result.stdout).toContain(
    `Read at feature (commit ${fixture.featureSha}).`,
  );
  // The footer is human surface only; --json carries the structured key.
  expect(result.stdout).not.toContain('"ref"');
});

test("an ambiguous reference at the ref is a conflict (exit 5), as in the working tree", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli519-ambiguous-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    questOk(root, ["init", "--name", "Ambiguous", "--task-id-prefix", "T"]);
    questOk(root, ["task", "create", "one", ...ACTOR]);
    questOk(root, ["task", "create", "two", ...ACTOR]);
    git(root, "add", "-A");
    git(root, "commit", "-qm", "T-1 and T-2");
    // Two records claiming one key is a state every quest write refuses, so
    // the record set is written directly (the F4 recipe): a copy of T-2 whose
    // alias is T-1. The resolver then matches both records for "T-1".
    const second = JSON.parse(
      await readFile(join(root, ".quest/tasks/T-2.json"), "utf8"),
    ) as Record<string, unknown>;
    await writeFile(
      join(root, ".quest/tasks/T-3.json"),
      JSON.stringify({ ...second, id: "T-3", aliases: ["T-1"] }, null, 2),
    );
    git(root, "add", "-A");
    git(root, "commit", "-qm", "T-3 claims T-1 as an alias");

    // The parity control: the working-tree read already reports this as a
    // conflict, and the ref read must not downgrade it to "not found".
    const locally = quest(root, ["task", "view", "T-1", "--json"]);
    expect(locally.exitCode).toBe(5);

    const atRef = quest(root, [
      "task",
      "view",
      "T-1",
      "--ref",
      "dev",
      "--json",
    ]);
    expect(atRef.exitCode).toBe(5);
    expect(atRef.stdout).toBe("");
    const error = JSON.parse(atRef.stderr) as Record<string, unknown>;
    expect(error.error_type).toBe("conflict");
    expect(String(error.message)).toContain("task_reference_ambiguous");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a ref whose .quest tree cannot be listed is unreadable (exit 6), not empty", async () => {
  // The F1 recipe, applied to `task view --ref`: delete the commit's root tree
  // object, leaving the commit resolvable. Before the strict listing was
  // used, a refused listing answered [] and the read said task_not_found --
  // the false green this error exists to prevent (round-1 review, MINOR 4).
  const root = await mkdtemp(join(tmpdir(), "qcli519-tree-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    questOk(root, ["init", "--name", "Tree", "--task-id-prefix", "T"]);
    questOk(root, ["task", "create", "on dev", ...ACTOR]);
    git(root, "add", "-A");
    git(root, "commit", "-qm", "T-1 on dev");
    const sha = git(root, "rev-parse", "dev");
    const tree = git(root, "rev-parse", "dev^{tree}");
    const objectPath = join(
      root,
      ".git",
      "objects",
      tree.slice(0, 2),
      tree.slice(2),
    );
    // Loose objects only: assert the object is where this test thinks it is,
    // so a packed fixture fails loudly instead of passing vacuously.
    expect(existsSync(objectPath)).toBe(true);
    await rm(objectPath);
    expect(run(root, ["git", "ls-tree", "-r", "dev"]).exitCode).not.toBe(0);

    const result = quest(root, [
      "task",
      "view",
      "T-1",
      "--ref",
      "dev",
      "--json",
    ]);
    expect(result.exitCode).toBe(6);
    expect(result.stdout).toBe("");
    const error = JSON.parse(result.stderr) as Record<string, unknown>;
    expect(error.error_type).toBe("drift");
    expect(String(error.message)).toContain("ref_records_unreadable");
    expect(error.input).toEqual({ ref: "dev", sha });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);

test("a duplicate id at the ref is ref_record_duplicate (exit 6), naming both paths", async () => {
  // The F4 recipe, applied to `task view --ref`: the half-staged relocation
  // shape, written directly because every quest write refuses it.
  const root = await mkdtemp(join(tmpdir(), "qcli519-duplicate-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    questOk(root, ["init", "--name", "Duplicate", "--task-id-prefix", "T"]);
    questOk(root, ["task", "create", "on dev", ...ACTOR]);
    git(root, "add", "-A");
    git(root, "commit", "-qm", "T-1 on dev");
    const task = await readFile(join(root, ".quest/tasks/T-1.json"), "utf8");
    await mkdir(join(root, ".quest/completed"), { recursive: true });
    await writeFile(join(root, ".quest/completed/T-1.json"), task);
    git(root, "add", "-A");
    git(root, "commit", "-qm", "duplicate T-1");
    const sha = git(root, "rev-parse", "dev");

    const result = quest(root, [
      "task",
      "view",
      "T-1",
      "--ref",
      "dev",
      "--json",
    ]);
    expect(result.exitCode).toBe(6);
    expect(result.stdout).toBe("");
    const error = JSON.parse(result.stderr) as Record<string, unknown>;
    expect(error.error_type).toBe("drift");
    expect(String(error.message)).toContain("ref_record_duplicate");
    // Both paths in `input`, so a reader can act without a second command.
    expect(error.input).toEqual({
      ref: "dev",
      sha,
      id: "T-1",
      paths: [".quest/tasks/T-1.json", ".quest/completed/T-1.json"],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
