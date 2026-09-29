import { beforeAll, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { LocalGitPort } from "../src/adapters/git/local-git.ts";
import { GhRefDiscovery } from "../src/adapters/refs/gh-ref-discovery.ts";
import {
  type AcrossRefsCoverage,
  type AcrossRefsEntry,
  type AcrossRefsFilter,
  type AcrossRefsOutcome,
  AcrossRefsViewService,
} from "../src/application/refs/across-refs.ts";
import type {
  DiscoveredPullRequest,
  OriginRemote,
  RefDiscoveryPort,
} from "../src/ports/ref-discovery.ts";

/**
 * QCLI-417 / DEC-40 (operator-accepted 2026-09-29, ODOC-330): the read-only,
 * repository-true view over `origin/dev` plus the head of every open PR into
 * `dev` -- `quest task list --across-refs`.
 *
 * The fixtures are REAL Git repositories, because every claim this command
 * makes is a claim about the commit graph: `origin/dev` is read at the SHA the
 * REMOTE advertises (never the possibly stale local ref), a PR head at the SHA
 * discovery returned, and objects are fetched only when they are absent. A
 * mocked graph would not exercise the part that can be wrong. The one thing
 * that cannot be real here is the forge -- `gh pr list` is behind an
 * injectable seam, so these tests inject discovery and never touch the
 * network. The CLI-level cases use the REAL adapter on an origin that is not
 * GitHub, which is how the discovery-failure path is reached without depending
 * on whether `gh` happens to be installed on the machine running the suite.
 *
 * BOTH HALVES OF EVERY DETECTION ARE PINNED. A view that always answered
 * `complete: true` and one that always answered `conflict: true` would each
 * satisfy the happy path, so the complete case, the incomplete case, the
 * agreeing pair and the conflicting pair are all asserted -- and a run that
 * read ZERO refs fails rather than passing, which is the positive control that
 * makes the coverage report something other than a promise.
 */

const MAIN = new URL("../src/cli/main.ts", import.meta.url).pathname;
const ACTOR = ["--actor", "t", "--actor-kind", "human"] as const;

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
    // The suite's own harness runs with plugins off; doing it here keeps the
    // fixture's stderr deterministic when a single file is run directly.
    env: { ...process.env, QUEST_AGENT_PLUGINS: "off" },
  });
  return {
    exitCode: child.exitCode ?? 0,
    stdout: child.stdout ? child.stdout.toString() : "",
    stderr: child.stderr ? child.stderr.toString() : "",
  };
}

function git(cwd: string, ...args: readonly string[]): string {
  const result = run(cwd, ["git", ...args]);
  if (result.exitCode !== 0)
    throw new Error(`git ${args.join(" ")}: ${result.stderr}`);
  return result.stdout.trim();
}

const quest = (cwd: string, args: readonly string[]): Run =>
  run(cwd, ["bun", MAIN, ...args]);

/** Runs a command that must succeed, so a broken fixture says so where it
 *  broke rather than three assertions later. */
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
  /** The working checkout: `dev` plus an unmerged `feature` branch. */
  readonly work: string;
  /** The bare repository `origin` points at. */
  readonly origin: string;
  readonly devSha: string;
  readonly prSha: string;
  readonly devT1Blob: string;
  readonly prT1Blob: string;
}

/**
 * `dev` carries T-1 (To Do) and T-2 (To Do). The unmerged `feature` branch
 * carries T-1 as In Progress and adds T-3, which exists nowhere else. So the
 * same view holds one conflicting id (T-1), one agreeing id (T-2, carried
 * identically by both refs) and one PR-only id (T-3).
 */
async function createFixture(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), "qcli417-"));
  const work = join(root, "work");
  git(root, "init", "-q", "-b", "dev", work);
  git(work, "config", "user.email", "t@example.invalid");
  git(work, "config", "user.name", "T");
  questOk(work, ["init", "--name", "Probe", "--task-id-prefix", "T"]);
  questOk(work, ["task", "create", "on dev", "--label", "tracker", ...ACTOR]);
  questOk(work, ["task", "create", "agreeing across refs", ...ACTOR]);
  git(work, "add", "-A");
  git(work, "commit", "-qm", "T-1 and T-2 on dev");
  const devSha = git(work, "rev-parse", "dev");
  const devT1Blob = git(work, "rev-parse", "dev:.quest/tasks/T-1.json");

  git(work, "checkout", "-q", "-b", "feature");
  questOk(work, ["task", "create", "only on the pr head", ...ACTOR]);
  questOk(work, ["task", "edit", "T-1", "--status", "In Progress", ...ACTOR]);
  git(work, "add", "-A");
  git(work, "commit", "-qm", "T-3, and T-1 In Progress");
  const prSha = git(work, "rev-parse", "feature");
  const prT1Blob = git(work, "rev-parse", "feature:.quest/tasks/T-1.json");
  git(work, "checkout", "-q", "dev");

  // `origin` is a real remote (a local bare repository), so `git remote
  // get-url`, `git ls-remote` and a fetch of a missing object are all
  // exercised for real and offline. The PR ref is deliberately NOT created
  // locally: that is what forces the view through "objects are fetched only
  // when absent".
  const origin = join(root, "origin.git");
  git(root, "clone", "-q", "--bare", work, origin);
  git(origin, "update-ref", "refs/heads/dev", devSha);
  git(origin, "update-ref", "refs/pull/1/head", prSha);
  git(work, "remote", "add", "origin", origin);
  expect(
    run(work, ["git", "rev-parse", "--verify", "refs/pull/1/head"]).exitCode,
  ).not.toBe(0);
  return { work, origin, devSha, prSha, devT1Blob, prT1Blob };
}

let fixture: Fixture;

beforeAll(async () => {
  fixture = await createFixture();
}, 120_000);

/** The forge seam: production shells out to `gh`; these tests inject. */
function discovery(options: {
  readonly origin?: OriginRemote;
  readonly pullRequests?: readonly DiscoveredPullRequest[];
  readonly failure?: string;
}): RefDiscoveryPort {
  return {
    async origin(): Promise<OriginRemote> {
      return options.origin ?? { kind: "github", slug: "opum-ai/quest-cli" };
    },
    async listOpenPullRequests() {
      if (options.failure !== undefined) throw new Error(options.failure);
      return options.pullRequests ?? [];
    },
  };
}

function prOne(f: Fixture): DiscoveredPullRequest {
  return {
    number: 1,
    headRefName: "feature",
    headRefOid: f.prSha,
    url: "https://github.com/opum-ai/quest-cli/pull/1",
  };
}

/** The production wiring, minus the forge: the same real Git port the CLI
 *  composes, with discovery replaced by an injected seam. */
function service(f: Fixture, port: RefDiscoveryPort): AcrossRefsViewService {
  void f;
  return new AcrossRefsViewService(new LocalGitPort(), port);
}

async function view(
  f: Fixture,
  port: RefDiscoveryPort,
  request: {
    readonly allowPartial?: boolean;
    readonly refs?: readonly string[];
    readonly pullRequests?: readonly number[];
    readonly filter?: AcrossRefsFilter;
  } = {},
): Promise<{
  entries: readonly AcrossRefsEntry[];
  coverage: AcrossRefsCoverage;
}> {
  const outcome: AcrossRefsOutcome = await service(f, port).view({
    repositoryPath: f.work,
    allowPartial: request.allowPartial ?? false,
    ...(request.refs === undefined ? {} : { refs: request.refs }),
    ...(request.pullRequests === undefined
      ? {}
      : { pullRequests: request.pullRequests }),
    ...(request.filter === undefined ? {} : { filter: request.filter }),
  });
  if (outcome.kind !== "view")
    throw new Error(`expected a view, got absent(${outcome.detail})`);
  return { entries: outcome.entries, coverage: outcome.coverage };
}

function entry(
  entries: readonly AcrossRefsEntry[],
  id: string,
): AcrossRefsEntry {
  const found = entries.find((candidate) => candidate.id === id);
  if (found === undefined)
    throw new Error(`no entry for ${id} in [${entries.map((e) => e.id)}]`);
  return found;
}

const openPr = (f: Fixture) => discovery({ pullRequests: [prOne(f)] });

test("a complete view reads origin/dev and every open PR head, and a dev state carries pullRequest null (QCLI-417 AC2)", async () => {
  const result = await view(fixture, openPr(fixture));
  expect({
    complete: result.coverage.complete,
    population: result.coverage.population,
  }).toEqual({ complete: true, population: "open-prs" });
  // discoveredAt is the instant the population read was attempted.
  expect(result.coverage.discoveredAt).toMatch(/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/u);
  expect(result.coverage.refsUnreadable).toEqual([]);
  // refsRead is the refProvenance inner object verbatim, in planned order.
  expect(result.coverage.refsRead).toEqual([
    { ref: "origin/dev", pullRequest: null, sha: fixture.devSha },
    {
      ref: "refs/pull/1/head",
      pullRequest: "opum-ai/quest-cli#1",
      sha: fixture.prSha,
    },
  ]);

  // The dev half of a conflicting id: pullRequest is PRESENT and null, never
  // omitted, and the sha is the one the remote advertised.
  const conflict = entry(result.entries, "T-1");
  expect(conflict.states).toEqual([
    {
      status: "To Do",
      refProvenance: {
        ref: "origin/dev",
        pullRequest: null,
        sha: fixture.devSha,
      },
    },
    {
      status: "In Progress",
      refProvenance: {
        ref: "refs/pull/1/head",
        pullRequest: "opum-ai/quest-cli#1",
        sha: fixture.prSha,
      },
    },
  ]);
  // The two states really were read from two different commits' bytes; the
  // status difference is not this view inventing one.
  expect(fixture.devT1Blob).not.toBe(fixture.prT1Blob);
  // The title comes from the existence ref, dev.
  expect(conflict.title).toBe("on dev");
});

test("a record that exists only on a PR head is proposed by that PR (QCLI-417 AC2)", async () => {
  const result = await view(fixture, openPr(fixture));
  const proposed = entry(result.entries, "T-3");
  expect(proposed.proposedBy).toBe("opum-ai/quest-cli#1");
  expect(proposed.title).toBe("only on the pr head");
  expect(proposed.states).toEqual([
    {
      status: "To Do",
      refProvenance: {
        ref: "refs/pull/1/head",
        pullRequest: "opum-ai/quest-cli#1",
        sha: fixture.prSha,
      },
    },
  ]);
  // The negative half: an id dev carries as well is never attributed to a PR.
  expect(entry(result.entries, "T-1").proposedBy).toBeNull();
});

test("two refs disagreeing about a status list every state with its provenance and pick no winner (QCLI-417 AC3)", async () => {
  const result = await view(fixture, openPr(fixture));
  const conflict = entry(result.entries, "T-1");
  expect(conflict.conflict).toBe(true);
  expect(conflict.states.map((state) => state.status)).toEqual([
    "To Do",
    "In Progress",
  ]);
  // No winner: the entry carries no resolved `status` field at all.
  expect(Object.keys(conflict).sort()).toEqual([
    "conflict",
    "id",
    "proposedBy",
    "states",
    "title",
  ]);
});

test("an id both refs carry identically is NOT marked as a conflict (negative control for AC3)", async () => {
  const result = await view(fixture, openPr(fixture));
  const agreeing = entry(result.entries, "T-2");
  // Two states, one status: a `conflict` that fired on "more than one state"
  // would be true here, and this is the case that says it does not.
  expect(agreeing.states).toHaveLength(2);
  expect(new Set(agreeing.states.map((state) => state.status)).size).toBe(1);
  expect(agreeing.conflict).toBe(false);
});

test("a status conflict is DATA: the CLI exits 0, never 5 (QCLI-417 exit codes)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--pr",
    "1",
    "--json",
  ]);
  expect(result.stderr).toBe("");
  expect(result.exitCode).toBe(0);
  const envelope = JSON.parse(result.stdout) as {
    data: readonly AcrossRefsEntry[];
    coverage: AcrossRefsCoverage;
  };
  expect(entry(envelope.data, "T-1").conflict).toBe(true);
  expect(envelope.coverage.complete).toBe(true);
});

test("an injected discovery failure is one unreadable ref and never an uncaught error (QCLI-417)", async () => {
  const result = await view(
    fixture,
    discovery({ failure: "gh was not found on PATH" }),
  );
  expect(result.coverage.complete).toBe(false);
  // Without --allow-partial the population stays the one that was planned:
  // the caller never agreed to a narrower question.
  expect(result.coverage.population).toBe("open-prs");
  expect(result.coverage.refsUnreadable).toEqual([
    { ref: null, pullRequest: null, reason: "gh was not found on PATH" },
  ]);
  // The dev ref was still read, and is still reported.
  expect(result.coverage.refsRead).toEqual([
    { ref: "origin/dev", pullRequest: null, sha: fixture.devSha },
  ]);
});

test("--allow-partial degrades to dev-only with complete false, and never complete true (QCLI-417 AC5)", async () => {
  const result = await view(
    fixture,
    discovery({ failure: "gh was not found on PATH" }),
    { allowPartial: true },
  );
  expect(result.coverage.complete).toBe(false);
  expect(result.coverage.population).toBe("dev-only");
  expect(result.coverage.refsUnreadable).toHaveLength(1);
  // The dev half is a real read, at remote truth.
  expect(entry(result.entries, "T-1").states[0]?.refProvenance.sha).toBe(
    fixture.devSha,
  );
});

test("a run that read zero refs is not complete even with --allow-partial (QCLI-417 AC4, positive control)", async () => {
  const outcome = await service(
    fixture,
    discovery({ failure: "gh was not found on PATH" }),
  ).view({
    repositoryPath: fixture.work,
    allowPartial: true,
    // An explicit ref that resolves nowhere reads zero refs.
    refs: ["refs/heads/no-such-branch"],
  });
  if (outcome.kind !== "view") throw new Error("expected a view");
  expect(outcome.coverage.refsRead).toEqual([]);
  expect(outcome.coverage.complete).toBe(false);
});

test("zero refs is a CLI failure, not a pass, with and without --allow-partial (QCLI-417 AC4)", async () => {
  for (const allowPartial of [false, true]) {
    const result = quest(fixture.work, [
      "task",
      "list",
      "--across-refs",
      "--pr",
      "99",
      ...(allowPartial ? ["--allow-partial"] : []),
      "--json",
    ]);
    expect(result.exitCode).toBe(6);
    expect(result.stdout).toBe("");
    const diagnostic = JSON.parse(result.stderr) as {
      error_type: string;
      message: string;
      input: { coverage: AcrossRefsCoverage };
      principal: null;
    };
    expect(diagnostic.error_type).toBe("drift");
    expect(diagnostic.message).toContain("read 0 refs");
    expect(diagnostic.input.coverage.refsRead).toEqual([]);
    expect(diagnostic.input.coverage.complete).toBe(false);
    // The error envelope is the only output, on stderr, and still well formed.
    expect(Object.keys(diagnostic)).toEqual([
      "error_type",
      "message",
      "input",
      "hint",
      "principal",
    ]);
  }
});

test("an unreadable ref exits 6 with the ref named in the message and in input, 0 bytes on stdout (QCLI-417 AC4)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--ref",
    "refs/heads/no-such-branch",
    "--json",
  ]);
  expect(result.exitCode).toBe(6);
  expect(result.stdout).toBe("");
  const diagnostic = JSON.parse(result.stderr) as {
    error_type: string;
    message: string;
    input: { coverage: AcrossRefsCoverage };
  };
  expect(diagnostic.error_type).toBe("drift");
  expect(diagnostic.message).toContain("refs/heads/no-such-branch");
  expect(diagnostic.input.coverage.refsUnreadable).toEqual([
    {
      ref: "refs/heads/no-such-branch",
      pullRequest: null,
      reason: expect.stringContaining("does not resolve"),
    },
  ]);
  // The ref that WAS read is reported too, so a reader can see how far the
  // answer got before it stopped.
  expect(diagnostic.input.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/dev",
  ]);
});

test("--allow-partial turns incomplete coverage into exit 0 with the refs still named (QCLI-417 AC5)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--allow-partial",
    "--ref",
    "refs/heads/dev",
    "--ref",
    "refs/heads/no-such-branch",
    "--json",
  ]);
  expect(result.stderr).toBe("");
  expect(result.exitCode).toBe(0);
  const envelope = JSON.parse(result.stdout) as {
    coverage: AcrossRefsCoverage;
  };
  expect(envelope.coverage.complete).toBe(false);
  expect(envelope.coverage.refsUnreadable).toHaveLength(1);
  expect(envelope.coverage.refsUnreadable[0]?.ref).toBe(
    "refs/heads/no-such-branch",
  );
});

test("an empty answer with complete coverage exits 0 (QCLI-417 AC4)", async () => {
  // The other half of the coverage contract: an EMPTY list is a legitimate
  // answer when every planned ref was read, and the exit code has to say so --
  // otherwise "nothing matched" and "nothing could be read" are the same
  // signal, which is the failure this command exists to remove.
  const result = questOk(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--status",
    "Done",
  ]);
  const envelope = JSON.parse(result.stdout) as {
    data: readonly AcrossRefsEntry[];
    coverage: AcrossRefsCoverage;
  };
  expect(envelope.data).toEqual([]);
  expect(envelope.coverage.complete).toBe(true);
  expect(envelope.coverage.refsRead).toHaveLength(1);
});

test("the plain output says a nothing-open answer does not hold when coverage is incomplete (QCLI-417 AC5)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--allow-partial",
    "--ref",
    "refs/heads/dev",
    "--ref",
    "refs/heads/no-such-branch",
    "--plain",
  ]);
  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain("INCOMPLETE");
  expect(result.stdout).toContain("does NOT hold for the repository");
  expect(result.stdout).toContain("refs/heads/no-such-branch");

  const complete = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--plain",
  ]);
  expect(complete.exitCode).toBe(0);
  expect(complete.stdout).toContain("holds for the repository");
  expect(complete.stdout).not.toContain("INCOMPLETE");
});

test("the envelope keeps contractVersion at index 1, coverage after data, and principal last (QCLI-417)", async () => {
  const result = questOk(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--pr",
    "1",
  ]);
  const envelope = JSON.parse(result.stdout) as {
    kind: string;
    data: readonly AcrossRefsEntry[];
    coverage: AcrossRefsCoverage;
  };
  expect(Object.keys(envelope)).toEqual([
    "schemaVersion",
    "contractVersion",
    "kind",
    "data",
    "coverage",
    "principal",
  ]);
  expect(Object.keys(envelope).indexOf("contractVersion")).toBe(1);
  expect(envelope.kind).toBe("task.list-across-refs");
  // `scope` is superseded, not also emitted.
  expect(Object.keys(envelope)).not.toContain("scope");
});

test("--ref and --pr replace discovery with an explicit population, and --pr resolves by Git alone (QCLI-417)", async () => {
  const result = questOk(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--pr",
    "1",
  ]);
  const envelope = JSON.parse(result.stdout) as {
    data: readonly AcrossRefsEntry[];
    coverage: AcrossRefsCoverage;
  };
  expect(envelope.coverage.population).toBe("explicit");
  expect(envelope.coverage.complete).toBe(true);
  // refs/pull/1/head exists only in the bare origin, so this is also the
  // fetch-when-absent path -- and the fetch must NOT have created the ref.
  expect(envelope.coverage.refsRead.map((read) => read.ref)).toEqual([
    "refs/heads/dev",
    "refs/pull/1/head",
  ]);
  expect(
    run(fixture.work, ["git", "rev-parse", "--verify", "refs/pull/1/head"])
      .exitCode,
  ).not.toBe(0);
  // The explicit population needs no forge: neither entry claims a PR.
  expect(entry(envelope.data, "T-1").states[1]?.refProvenance.pullRequest).toBe(
    null,
  );
});

test("filters compose: an entry matches when any state matches, and keeps all its states (QCLI-417)", async () => {
  // T-1 is In Progress on the PR head only; T-2 is To Do everywhere; T-3 is
  // To Do on the PR head only.
  const byStatus = await view(fixture, openPr(fixture), {
    filter: { status: "In Progress" },
  });
  expect(byStatus.entries.map((row) => row.id)).toEqual(["T-1"]);
  expect(entry(byStatus.entries, "T-1").states).toHaveLength(2);

  const none = await view(fixture, openPr(fixture), {
    filter: { status: "Done" },
  });
  expect(none.entries).toEqual([]);

  const byLabel = await view(fixture, openPr(fixture), {
    filter: { labels: ["tracker"] },
  });
  expect(byLabel.entries.map((row) => row.id)).toEqual(["T-1"]);

  const bySearch = await view(fixture, openPr(fixture), {
    filter: { search: "PR HEAD" },
  });
  expect(bySearch.entries.map((row) => row.id)).toEqual(["T-3"]);

  const limited = await view(fixture, openPr(fixture), {
    filter: { sort: { field: "id", direction: "desc" }, limit: 1 },
  });
  expect(limited.entries.map((row) => row.id)).toEqual(["T-3"]);

  // Two filters over the same entry compose rather than replacing each other.
  const composed = await view(fixture, openPr(fixture), {
    filter: { search: "only on the pr head", excludeStatuses: ["Done"] },
  });
  expect(composed.entries.map((row) => row.id)).toEqual(["T-3"]);

  // --exclude-status matches on the same ANY-state rule, which for a
  // conflicting entry means it is selected by its surviving state: T-1 is In
  // Progress on the PR head and To Do on dev, so it is NOT excluded. That is
  // the semantics the accepted shape states, and it is the safe direction --
  // the alternative would let one ref's status hide an id another ref carries.
  const excluded = await view(fixture, openPr(fixture), {
    filter: { excludeStatuses: ["In Progress"] },
  });
  expect(excluded.entries.map((row) => row.id)).toEqual(["T-1", "T-2", "T-3"]);
});

test("an unknown --status is refused rather than answering an empty list (QCLI-417)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
    "--status",
    "No Such Status",
    "--json",
  ]);
  expect(result.exitCode).toBe(6);
  expect(JSON.parse(result.stderr).message).toContain(
    "Task status is not configured",
  );
});

test("--ready is refused rather than approximated (QCLI-417)", async () => {
  const result = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ready",
    "--json",
  ]);
  expect(result.exitCode).toBe(2);
  expect(JSON.parse(result.stderr).message).toContain("--ready");
});

test("the view is read-only: no record, ref or branch is written (QCLI-417 AC6)", async () => {
  const before = {
    refs: git(
      fixture.work,
      "for-each-ref",
      "--format=%(refname) %(objectname)",
    ),
    head: git(fixture.work, "rev-parse", "HEAD"),
    status: git(fixture.work, "status", "--porcelain"),
    record: await readFile(join(fixture.work, ".quest/tasks/T-1.json"), "utf8"),
    tracked: git(fixture.work, "ls-files", ".quest/"),
  };
  questOk(fixture.work, ["task", "list", "--across-refs", "--pr", "1"]);
  expect(
    git(fixture.work, "for-each-ref", "--format=%(refname) %(objectname)"),
  ).toBe(before.refs);
  expect(git(fixture.work, "rev-parse", "HEAD")).toBe(before.head);
  expect(git(fixture.work, "status", "--porcelain")).toBe(before.status);
  expect(
    await readFile(join(fixture.work, ".quest/tasks/T-1.json"), "utf8"),
  ).toBe(before.record);
  expect(git(fixture.work, "ls-files", ".quest/")).toBe(before.tracked);
});

test("the working tree is not the view: a record that exists only uncommitted is absent (QCLI-417)", async () => {
  const created = questOk(fixture.work, [
    "task",
    "create",
    "only uncommitted",
    ...ACTOR,
  ]);
  const id = (JSON.parse(created.stdout) as { data: { id: string } }).data.id;
  const local = JSON.parse(
    quest(fixture.work, ["task", "list", "--json"]).stdout,
  ) as { data: readonly { id: string }[] };
  expect(local.data.map((row) => row.id)).toContain(id);
  const across = questOk(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--ref",
    "refs/heads/dev",
  ]);
  const envelope = JSON.parse(across.stdout) as {
    data: readonly { id: string }[];
  };
  expect(envelope.data.map((row) => row.id)).not.toContain(id);
  // Leave the shared fixture as it was found.
  await rm(join(fixture.work, `.quest/tasks/${id}.json`), { force: true });
});

test("an origin that is not GitHub is a named coverage failure through the REAL adapter (QCLI-417)", async () => {
  // No injection here: this is the production path, and a local-path origin is
  // exactly what a caller in a fixture, a mirror or a sandbox hits. The failure
  // must be a coverage entry -- never an uncaught error, never a silent empty
  // list -- and its reason must survive the JSON boundary without naming a
  // local path.
  const failing = quest(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--json",
  ]);
  expect(failing.exitCode).toBe(6);
  expect(failing.stdout).toBe("");
  const diagnostic = JSON.parse(failing.stderr) as {
    error_type: string;
    message: string;
    input: { coverage: AcrossRefsCoverage };
  };
  expect(diagnostic.error_type).toBe("drift");
  expect(diagnostic.message).toContain("the open-pull-request list");
  const [unreadable] = diagnostic.input.coverage.refsUnreadable;
  expect(unreadable?.ref).toBeNull();
  expect(unreadable?.pullRequest).toBeNull();
  expect(unreadable?.reason).toContain("not a GitHub remote");
  expect(unreadable?.reason).not.toContain(fixture.origin);
  expect(unreadable?.reason.split("\n")).toHaveLength(1);

  // ...and --allow-partial keeps it usable as a dev-only answer.
  const partial = questOk(fixture.work, [
    "task",
    "list",
    "--across-refs",
    "--allow-partial",
  ]);
  const envelope = JSON.parse(partial.stdout) as {
    coverage: AcrossRefsCoverage;
    data: readonly AcrossRefsEntry[];
  };
  expect(envelope.coverage.population).toBe("dev-only");
  expect(envelope.coverage.complete).toBe(false);
  expect(envelope.coverage.refsUnreadable).toHaveLength(1);
  // A dev-only answer still answers about dev: T-1 and T-2 are here, and the
  // PR-only record is honestly absent rather than guessed at.
  expect(envelope.data.map((row) => row.id)).toEqual(["T-1", "T-2"]);
});

test("a repository with no origin is a not-found, not a coverage failure (QCLI-417 exit 3)", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli417-noorigin-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    questOk(root, ["init", "--name", "NoOrigin", "--task-id-prefix", "T"]);
    const result = quest(root, ["task", "list", "--across-refs", "--json"]);
    expect(result.exitCode).toBe(3);
    expect(result.stdout).toBe("");
    expect(JSON.parse(result.stderr).error_type).toBe("not_found");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an origin with no dev branch is a not-found (QCLI-417 exit 3)", async () => {
  const root = await mkdtemp(join(tmpdir(), "qcli417-nodev-"));
  try {
    git(root, "init", "-q", "-b", "trunk", ".");
    git(root, "config", "user.email", "t@example.invalid");
    git(root, "config", "user.name", "T");
    questOk(root, ["init", "--name", "NoDev", "--task-id-prefix", "T"]);
    git(root, "add", "-A");
    git(root, "commit", "-qm", "init");
    const origin = join(root, "origin.git");
    git(root, "clone", "-q", "--bare", ".", origin);
    git(root, "remote", "add", "origin", origin);
    const result = quest(root, ["task", "list", "--across-refs", "--json"]);
    expect(result.exitCode).toBe(3);
    expect(JSON.parse(result.stderr).error_type).toBe("not_found");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the real discovery adapter classifies GitHub and non-GitHub remotes (QCLI-417)", async () => {
  const port = new GhRefDiscovery(new LocalGitPort());
  expect(await port.origin(fixture.work)).toEqual({
    kind: "unsupported",
    url: fixture.origin,
  });
  const root = await mkdtemp(join(tmpdir(), "qcli417-remotes-"));
  try {
    git(root, "init", "-q", "-b", "dev", ".");
    for (const [url, expected] of [
      [
        "git@github.com:opum-ai/quest-cli.git",
        { kind: "github", slug: "opum-ai/quest-cli" },
      ],
      [
        "https://github.com/opum-ai/quest-cli.git",
        { kind: "github", slug: "opum-ai/quest-cli" },
      ],
      [
        "ssh://git@github.com/opum-ai/quest-cli.git",
        { kind: "github", slug: "opum-ai/quest-cli" },
      ],
      [
        "/tmp/somewhere/else.git",
        { kind: "unsupported", url: "/tmp/somewhere/else.git" },
      ],
    ] as const) {
      git(root, "remote", "add", "origin", url);
      expect({ url, origin: await port.origin(root) }).toEqual({
        url,
        origin: expected,
      });
      git(root, "remote", "remove", "origin");
    }
    expect(await port.origin(root)).toEqual({ kind: "absent" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
