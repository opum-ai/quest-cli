import { expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * QCLI-314. `promotion-guardrails.yml`'s `main-is-fast-forward-of-dev` job
 * asserted only `git merge-base --is-ancestor HEAD origin/dev` -- that
 * main's new HEAD is a commit dev already held -- and then reported "main's
 * new HEAD is a fast-forward of dev", which is strictly stronger. It never
 * read where main WAS, so a force-push rewinding main to an older commit
 * still on dev printed the affirmative while commits came off main.
 *
 * The defect is the gap between what the verdict CLAIMED and what the
 * assertion MEASURED, so these tests assert the EMITTED VERDICT and not only
 * the exit code. An exit code alone would have passed against the old job on
 * every case below except the rewind, which is exactly how it survived.
 *
 * Every case builds a real repository with a real `origin`, because the
 * thing under test is git's own ancestry answers. The rewind case is the
 * regression: it MUST be red, and it is the one the old job got wrong.
 *
 * Reported by opum-marketplace (OMARK-58) with a bash reference
 * implementation; assertion 3 and the do-not-simplify note on the FORCED
 * branch came from their follow-up and from lore-web. Rewritten in this
 * repository's own idiom -- every other CI assertion here is a `.mjs` under
 * `scripts/`, and there is no shell script in the tree to be consistent with.
 */

const SCRIPT = new URL(
  "../scripts/qualification/promotion-fast-forward.mjs",
  import.meta.url,
).pathname;

const ZERO = "0".repeat(40);

function git(cwd: string, ...args: readonly string[]) {
  const child = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (child.exitCode !== 0)
    throw new Error(`git ${args.join(" ")} failed: ${child.stderr.toString()}`);
  return child.stdout.toString().trim();
}

function commit(cwd: string, message: string) {
  git(cwd, "commit", "--allow-empty", "-q", "-m", message);
  return git(cwd, "rev-parse", "HEAD");
}

/**
 * A clone whose HEAD sits where main was just pushed, with `origin/dev`
 * resolvable -- the shape the workflow's `actions/checkout` produces on a
 * push to main. Returns the SHAs so a test can name the previous position
 * rather than recompute it.
 */
async function scratch() {
  const root = await mkdtemp(join(tmpdir(), "quest-promotion-"));
  const origin = join(root, "origin.git");
  const work = join(root, "work");
  git(root, "init", "--bare", "-q", "--initial-branch=dev", origin);
  git(root, "init", "-q", "--initial-branch=dev", work);
  git(work, "config", "user.email", "test@example.com");
  git(work, "config", "user.name", "Test");
  git(work, "remote", "add", "origin", origin);
  const c1 = commit(work, "c1");
  const c2 = commit(work, "c2");
  const c3 = commit(work, "c3");
  const c4 = commit(work, "c4");
  git(work, "push", "-q", "origin", "dev");
  // `main` exists on the remote because the shallow fixture must be cut the
  // way a push to main is: `--depth 1 --branch main`. See that test.
  git(work, "push", "-q", "origin", "HEAD:main");
  git(work, "fetch", "-q", "origin");
  return { root, origin, work, c1, c2, c3, c4 };
}

function run(cwd: string, env: Record<string, string>) {
  const child = Bun.spawnSync(["node", SCRIPT], {
    cwd,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: child.exitCode,
    stdout: child.stdout.toString(),
    stderr: child.stderr.toString(),
  };
}

test("a genuine promotion is accepted, and says what it measured rather than 'fast-forward'", async () => {
  const { root, work, c3, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: c3 });
    expect(result.exitCode).toBe(0);
    // The verdict names BOTH measured properties. The old job's verdict named
    // a property it had not measured, which is the whole defect.
    expect(result.stdout).toContain(`moved forward ${c3} -> ${c4}`);
    expect(result.stdout).toContain("is a commit dev holds");
    expect(result.stdout).toContain(
      "dev's tip exactly, with nothing left behind",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a REWIND to an older commit still on dev is rejected -- the case the old job passed", async () => {
  const { root, work, c1, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c1);
    const result = run(work, { BEFORE_SHA: c4 });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("REWOUND or diverged");
    // Naming why containment alone was insufficient is part of the message's
    // job: the next reader has to know the passing check was not enough.
    expect(result.stderr).toContain("passes an is-ancestor-of-dev check");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("containment still catches a commit dev never held", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const foreign = commit(work, "a commit that only ever existed on main");
    const result = run(work, { BEFORE_SHA: c4 });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("not a commit dev ever held");
    expect(result.stderr).toContain(foreign);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a forced push is named distinctly, even when the ancestry tests would pass", async () => {
  const { root, work, c3, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: c3, FORCED: "true" });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("FORCE-PUSHED");
    // Distinct from the rewind message: this push WAS a forward move, and an
    // operator told only "rewound" would go looking for the wrong thing.
    expect(result.stderr).not.toContain("REWOUND");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("branch creation is accepted without claiming forward movement", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: ZERO });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("created at");
    expect(result.stdout).not.toContain("moved forward");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an unchanged re-push is accepted and says so", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: c4 });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`unchanged at ${c4}`);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a partial promotion warns, names what was left behind, and does NOT fail", async () => {
  const { root, work, c2, c3, c4 } = await scratch();
  try {
    // main moved c2 -> c3 while dev is at c4: the ODOC-193 shape, a stale
    // local dev pushed instead of the remote-tracking ref. Both hard
    // assertions are satisfied, and less was delivered than intended.
    git(work, "checkout", "-q", c3);
    const result = run(work, { BEFORE_SHA: c2 });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(
      "::warning::main is 1 commit(s) BEHIND dev",
    );
    expect(result.stdout).toContain("ODOC-193");
    expect(result.stdout).toContain(c4.slice(0, 7));
    expect(result.stdout).toContain("but is 1 commit(s) behind dev");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * The next two are a MATCHED PAIR: the same missing object, opposite
 * diagnoses. Each asserts the ABSENCE of the other's wording, because a
 * single over-broad message satisfies a presence-only assertion in both
 * directions and would look like two passing tests (opum-web, relayed by
 * opum-marketplace). Reporting a missing `fetch-depth: 0` as a damaged main,
 * on the one event everyone watches, is its own defect.
 */
test("an unresolvable previous HEAD in a FULL clone is an anomaly, never a pass", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: "d".repeat(40) });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("cannot be resolved in this clone");
    expect(result.stderr).toContain("CANNOT be proven");
    expect(result.stderr).toContain("NOT shallow");
    // Not `"fetch-depth: 0'"` with the trailing quote: that spelling was the
    // first draft's, and a combined-message mutant that wrote `fetch-depth:
    // 0.` slipped past it. The absence assertion has to name the token, not
    // the token as it happens to be punctuated in the message it came from.
    expect(result.stderr).not.toContain("fetch-depth: 0");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("the same missing object in a SHALLOW clone blames the workflow, not main", async () => {
  const { root, origin, c2 } = await scratch();
  try {
    // Two things about this clone are load-bearing, and BOTH were wrong in
    // an earlier draft:
    //
    // `file://` -- git silently ignores --depth on a local-path clone and
    // produces a full one, so the case under test would not be the case
    // exercised. The first draft reported is-shallow false.
    //
    // `--branch main` -- this is the PRODUCTION shape. A push to main checks
    // out main, and --depth implies --single-branch, so remote.origin.fetch
    // covers only main and `origin/dev` does not exist. Cloning --branch dev
    // creates origin/dev for free and makes the shallow branch reachable
    // whatever the script's fetch does, which is a fixture that cannot fail.
    // Caught by lore-web via opum-marketplace, who had verified the shallow
    // branch's PRECONDITIONS (is-shallow true, previous HEAD unresolvable --
    // both correct) without its REACHABILITY; the failure sits between them.
    const shallow = join(root, "shallow");
    git(
      root,
      "clone",
      "-q",
      "--depth",
      "1",
      "--branch",
      "main",
      `file://${origin}`,
      shallow,
    );
    // c2 is deliberately NOT dev's tip: a --depth 1 clone holds the tip, so
    // naming it would resolve and exercise the wrong branch entirely. The
    // first draft of this test did exactly that and passed with exit 0.
    const result = run(shallow, { BEFORE_SHA: c2 });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("THIS CHECKOUT IS SHALLOW");
    expect(result.stderr).toContain("fetch-depth: 0");
    expect(result.stderr).toContain("main is very probably fine");
    // The exit code is deliberately unchanged between the two branches: an
    // unmeasured previous position is not a pass just because the likely
    // cause is boring.
    expect(result.stderr).not.toContain("a rewrite orphaned");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * A second matched pair, at the `origin/dev` site rather than the
 * previous-HEAD one. This branch executes BEFORE the shallow diagnosis
 * further down, so that diagnosis cannot cover it -- found by mutating the
 * fetch refspec away and READING the failure rather than noting that a test
 * had gone red. The message it emitted was accurate and blamed the wrong
 * thing: "nothing to compare main against" reads as a repository problem
 * when the cause is a single-branch checkout.
 */
test("a missing origin/dev in a SHALLOW clone blames the workflow, not the remote", async () => {
  const { root, origin } = await scratch();
  try {
    const shallow = join(root, "no-dev");
    git(
      root,
      "clone",
      "-q",
      "--depth",
      "1",
      "--branch",
      "main",
      `file://${origin}`,
      shallow,
    );
    // Removing the remote reproduces the no-refspec outcome without mutating
    // the script: nothing fetches, so origin/dev never comes into existence.
    git(shallow, "remote", "remove", "origin");
    const result = run(shallow, { BEFORE_SHA: ZERO });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not resolve in this clone");
    expect(result.stderr).toContain("THIS CHECKOUT IS SHALLOW");
    expect(result.stderr).toContain("fetch-depth: 0");
    expect(result.stderr).not.toContain("real anomaly");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * THE ACCEPT DIRECTION FOR THE FETCH REFSPEC -- the one property none of the
 * three tests above can reach, and the reason they all still went red when
 * the refspec was mutated away, which is what made the gap easy to miss.
 *
 * Routed by opum-agent 2026-09-15 (QCLI-317): opum-doc measured that in the
 * reference SHELL implementation the drop-refspec mutant SURVIVES, because
 * the missing-ref split emits exactly the diagnosis and exit code the
 * shallow row already asserts. lore-cli found the equivalent in its own
 * `.mjs`. Here both mutants -- `"dev"` for the refspec, and dropping it
 * entirely -- did turn the suite red, so the first reading was that this
 * repository was already covered. It is not. Both killed the SAME single
 * test, `a remote with no dev blames the REMOTE`, which is about diagnosis
 * ATTRIBUTION, and each killed it incidentally: the bare form only because
 * git's own message quotes back the refspec that was passed to it, and the
 * dropped form only because a bare `git fetch origin` SUCCEEDS against a
 * remote with no `dev`, so the REMOTE-blaming branch never runs at all.
 * Selectively red is not the same as asserted.
 *
 * `a missing origin/dev in a SHALLOW clone` cannot cover this by
 * construction: it REMOVES the remote, so the fetch never executes and no
 * mutation of the fetch line can change its result.
 *
 * What the refspec actually does is make `origin/dev` come into existence
 * as a consequence of THIS SCRIPT rather than of a clone configuration the
 * workflow does not control -- so the assertion has to be that the run
 * SUCCEEDS where it otherwise could not. Measured against the production
 * shape: original exit 0 with the ref created, both mutants exit 1 with
 * byte-identical shallow diagnoses. The thing that separates them is not a
 * better error, it is the accept.
 */
test("the script's own fetch creates origin/dev in a single-branch shallow clone, and the run is ACCEPTED", async () => {
  const { root, origin, c4 } = await scratch();
  try {
    const accept = join(root, "accept");
    git(
      root,
      "clone",
      "-q",
      "--depth",
      "1",
      "--branch",
      "main",
      `file://${origin}`,
      accept,
    );

    // PRECONDITIONS, asserted rather than assumed. This fixture is only
    // meaningful while it is genuinely the production shape: if a change to
    // `scratch()` or to git's defaults ever made `origin/dev` exist here for
    // free, the accept below would pass with the refspec doing nothing --
    // the same "fixture that cannot fail" the shallow test above was already
    // caught by once, which is why these are three assertions and not a
    // comment.
    expect(git(accept, "rev-parse", "--is-shallow-repository")).toBe("true");
    expect(git(accept, "config", "--get", "remote.origin.fetch")).toBe(
      "+refs/heads/main:refs/remotes/origin/main",
    );
    expect(
      git(accept, "for-each-ref", "--format=%(refname)", "refs/remotes/"),
    ).not.toContain("refs/remotes/origin/dev");

    // Branch creation is the only accept path a --depth 1 clone can reach:
    // any real previous HEAD is unfetchable there, which is precisely what
    // the shallow test above asserts. The property under test is the FETCH,
    // so assertion 2 is deliberately taken out of the picture rather than
    // worked around by deepening the clone.
    const result = run(accept, { BEFORE_SHA: ZERO });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain(`created at ${c4}`);
    expect(result.stdout).toContain("is a commit dev holds");
    expect(result.stdout).toContain("dev's tip exactly");
    // No diagnosis of any kind: a run that emitted the shallow annotation
    // AND exited 0 would be a different defect, and exit code alone is what
    // this file exists not to trust.
    expect(result.stderr).not.toContain("::error::");

    // The ref is the point. It provably did not exist before the run, and
    // the script's own fetch is the only thing that could have created it.
    expect(
      git(accept, "rev-parse", "--verify", "refs/remotes/origin/dev^{commit}"),
    ).toBe(c4);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a missing origin/dev in a FULL clone is a real anomaly, not a fetch-depth problem", async () => {
  const { root, work } = await scratch();
  try {
    git(work, "remote", "remove", "origin");
    git(work, "update-ref", "-d", "refs/remotes/origin/dev");
    const result = run(work, { BEFORE_SHA: ZERO });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("does not resolve in this clone");
    expect(result.stderr).toContain("NOT shallow");
    expect(result.stderr).toContain("real anomaly");
    expect(result.stderr).not.toContain("fetch-depth: 0");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * The fetch site, one step earlier again. opum-marketplace measured a bare
 * `git fetch origin dev` against a remote with no `dev` dying at exit 128
 * with ZERO annotations -- their implementation's version of the second-site
 * defect, found after this repository described the general form. This
 * script already annotated here, but with a paraphrase: git's own
 * `fatal: couldn't find remote ref refs/heads/dev` was discarded by
 * `stdio: "ignore"`, leaving the operator the least specific version of the
 * most specific fact available.
 */
test("a remote with no dev blames the REMOTE and quotes git's own error", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-promotion-nodev-"));
  try {
    const origin = join(root, "origin.git");
    const work = join(root, "work");
    git(root, "init", "--bare", "-q", "--initial-branch=main", origin);
    git(root, "init", "-q", "--initial-branch=main", work);
    git(work, "config", "user.email", "test@example.com");
    git(work, "config", "user.name", "Test");
    git(work, "remote", "add", "origin", origin);
    commit(work, "c1");
    const head = commit(work, "c2");
    git(work, "push", "-q", "origin", "main");
    const clone = join(root, "clone");
    git(root, "clone", "-q", `file://${origin}`, clone);

    const result = run(clone, { BEFORE_SHA: head });
    expect(result.exitCode).toBe(1);
    // Liveness: a negative assertion is satisfied by a run that emits
    // nothing, so the annotation's presence is asserted before its absences.
    expect(result.stderr).toContain("::error::");
    expect(result.stderr).toContain("blames the REMOTE, not main");
    expect(result.stderr).toContain("main itself is untouched");
    // git's own message, not this script's paraphrase of it.
    expect(result.stderr).toContain("couldn't find remote ref refs/heads/dev");
    expect(result.stderr).not.toContain("git said: (nothing)");
    // This is not the fetch-depth story: the clone is full and dev is simply
    // not there.
    expect(result.stderr).not.toContain("fetch-depth: 0");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an unset BEFORE_SHA refuses to report at all rather than skipping assertion 2", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: "" });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("unmeasured previous position");
    // Silence would be the defect this file exists to fix, in a new costume.
    expect(result.stdout).toBe("");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

/**
 * The assertion above this line all test the script. This one tests that the
 * workflow actually RUNS it. Mutation proves the suite's logic goes red; that
 * a non-zero exit reddens the CI check is WIRING, a separate object, and the
 * guard job only fires on push-to-main so no PR can prove it end to end
 * (opum-marketplace, after nearly closing its own equivalent on mutation
 * alone). This buys the cheap half: the call exists and is a `run:` line
 * rather than a mention in a comment, which a path grep alone would accept.
 */
test("the workflow invokes the script from a run: line, not merely a comment", async () => {
  const workflow = await Bun.file(
    new URL("../.github/workflows/promotion-guardrails.yml", import.meta.url)
      .pathname,
  ).text();
  const invocations = workflow
    .split("\n")
    .filter((line) =>
      /^\s*run:\s*node\s+scripts\/qualification\/promotion-fast-forward\.mjs\s*$/.test(
        line,
      ),
    );
  expect(invocations).toHaveLength(1);
  // The inputs assertion 2 cannot be made without. A job that calls the
  // script but passes neither gets a usage refusal rather than a verdict.
  expect(workflow).toContain("BEFORE_SHA: ${{ github.event.before }}");
  expect(workflow).toContain("FORCED: ${{ github.event.forced }}");
  // fetch-depth: 0 is what keeps the previous HEAD resolvable at all.
  expect(workflow).toContain("fetch-depth: 0");
});
