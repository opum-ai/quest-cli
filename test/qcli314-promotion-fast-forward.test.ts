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
  git(work, "fetch", "-q", "origin");
  return { root, work, c1, c2, c3, c4 };
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

test("an unresolvable previous HEAD is an anomaly, never a pass", async () => {
  const { root, work, c4 } = await scratch();
  try {
    git(work, "checkout", "-q", c4);
    const result = run(work, { BEFORE_SHA: "d".repeat(40) });
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("cannot be resolved in this clone");
    expect(result.stderr).toContain("CANNOT be proven");
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
