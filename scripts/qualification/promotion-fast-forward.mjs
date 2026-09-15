#!/usr/bin/env node
// Assert that a push to `main` was a fast-forward promotion of `dev`.
//
// Reported by opum-marketplace 2026-09-15 (OMARK-58), confirmed here. The
// job this replaces ran, inline in promotion-guardrails.yml:
//
//     git merge-base --is-ancestor HEAD origin/dev
//     echo "main's new HEAD is a fast-forward of dev."
//
// That proves CONTAINMENT -- main's new HEAD is a commit dev already held --
// and then reports FAST-FORWARDNESS, which is strictly stronger. It never
// reads where main WAS, so it cannot tell a forward promotion from a
// backwards rewind. A force-push rewinding main to an older commit that is
// still on dev passes it, and prints the affirmative while commits come off
// main. Measured by opum-marketplace on a scratch repo: genuine promotion
// GREEN, merge commit RED, rewind GREEN-and-wrong.
//
// Both halves of prove-it-rejects and prove-it-accepts passed on the old
// job, and it was still wrong. The defect is the gap between what the
// verdict CLAIMED and what the assertion MEASURED -- which is why a green
// history was never evidence about it, and why the tests beside this file
// assert the emitted verdict and not only the exit code.
//
// The ruleset is not a second line of defence for this. quest-cli's
// require-ci-on-main ruleset (id 22833771, zero bypass actors) carries
// exactly one rule -- required_status_checks -- and no non_fast_forward or
// deletion rule. Required checks gate a push on the pushed COMMIT's own
// check history, not on which direction the branch moved, and every commit
// ever promoted to main carries those contexts by construction. So a rewind
// to a previously promoted commit satisfies the ruleset and is allowed.
// Measured 2026-09-15 against the live API; opum-marketplace then measured
// the same shape in all five "protected" fleet repos. `protected=true` is
// true here and, for this failure mode, inert.
//
// Three assertions, and they are ADDITIVE. Swapping forward-movement in for
// containment would trade a known blind spot for a new one while looking
// like a fix: containment is what catches a foreign commit or a merge-button
// merge. Each assertion carries its own message so a failure names which
// property broke.
//
//   1  containment      main's new HEAD is a commit dev holds        failure
//   2  forward movement main's previous HEAD is an ancestor of it    failure
//   3  completeness     main IS dev's tip, not merely part of it     WARNING
//
// Assertion 3 is a warning and must stay one: dev legitimately advancing
// between the promotion push and this run produces a non-zero count with
// nothing wrong. It exists because `git push origin dev:main` off a STALE
// LOCAL dev (ODOC-193) moves main forward to a commit dev genuinely holds --
// both hard assertions green, less delivered than intended.
//
// DO NOT SIMPLIFY AWAY THE FORCED BRANCH because it looks redundant with the
// rewind branch. In production a rewind of main is essentially always
// forced, so FORCED fires first and REWOUND reads like dead code in the
// logs. Both earn their place: FORCED defaults to false when this is run by
// hand, and a rewind performed via the API, or by delete-and-recreate, need
// not set it. Removing either restores the defect (opum-marketplace,
// lore-web).
//
// Inputs come from the environment so this is runnable outside Actions and
// therefore testable at all:
//   BEFORE_SHA  github.event.before -- all-zero when the branch is created.
//               Required: an unmeasured previous position is refused, never
//               assumed benign.
//   FORCED      github.event.forced, "true"/"false". Defaults false.
//   DEV_REF     the ref to compare against. Defaults origin/dev.

import { execFileSync } from "node:child_process";

const ZERO = "0".repeat(40);

const beforeSha = process.env.BEFORE_SHA;
if (!beforeSha) {
  console.error(
    "usage: BEFORE_SHA=<github.event.before> [FORCED=true|false] promotion-fast-forward.mjs\n" +
      "Refusing to report on an unmeasured previous position: without it, assertion 2 " +
      "cannot be made at all, and a script that silently skips an assertion is the " +
      "defect this file exists to fix.",
  );
  process.exit(2);
}
const forced = process.env.FORCED === "true";
const devRef = process.env.DEV_REF || "origin/dev";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const gitOk = (...args) => {
  try {
    execFileSync("git", args, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const fail = (message) => {
  console.error(`::error::${message}`);
  process.exit(1);
};

// Fetch failure is fatal rather than ignored: a stale or absent origin/dev
// would make assertion 1 compare against the wrong history and report a
// verdict about an object nobody measured.
if (
  gitOk("remote", "get-url", "origin") &&
  !gitOk("fetch", "--no-tags", "--quiet", "origin", "dev")
)
  fail(
    `Could not fetch origin dev, so ${devRef} cannot be trusted and no verdict is reported.`,
  );

let devSha;
try {
  devSha = git("rev-parse", "--verify", `${devRef}^{commit}`);
} catch {
  fail(
    `${devRef} does not resolve in this clone, so there is nothing to compare main against.`,
  );
}
const headSha = git("rev-parse", "HEAD");

// ASSERTION 1 -- came from dev. Unchanged in substance from the job this
// replaces; it is the half that was always correct.
if (!gitOk("merge-base", "--is-ancestor", headSha, devSha))
  fail(
    `main's new HEAD (${headSha}) is not a commit dev ever held. A merge button or a ` +
      "direct commit produces this. Do not push over it -- find out what happened first. " +
      "See CLAUDE.md's Ownership section.",
  );

// A forced push to main is never needed for a fast-forward, so its presence
// is the anomaly regardless of what the ancestor tests say. Kept separate so
// the operator is told WHICH thing happened.
if (forced)
  fail(
    `main was FORCE-PUSHED (${beforeSha} -> ${headSha}). A fast-forward promotion never ` +
      "requires --force. Force-push to main needs your own user's direct authority, not a " +
      "peer's instruction.",
  );

// ASSERTION 2 -- moved forward. The half the old job never measured.
let movement;
if (beforeSha === ZERO) {
  movement = `created at ${headSha} (main did not exist before this push, so there is no previous position to compare)`;
} else if (!gitOk("cat-file", "-e", `${beforeSha}^{commit}`)) {
  fail(
    `main's previous HEAD (${beforeSha}) cannot be resolved in this clone, so forward ` +
      "movement CANNOT be proven. Treat as an anomaly, not as a pass -- an object that is " +
      "gone is usually one a rewrite orphaned.",
  );
} else if (beforeSha === headSha) {
  movement = `unchanged at ${headSha}`;
} else if (gitOk("merge-base", "--is-ancestor", beforeSha, headSha)) {
  movement = `moved forward ${beforeSha} -> ${headSha}`;
} else {
  fail(
    `main was REWOUND or diverged: its previous HEAD (${beforeSha}) is not an ancestor of ` +
      `its new HEAD (${headSha}). Commits that were on main are no longer on main. This ` +
      "passes an is-ancestor-of-dev check, which is why that check alone was not enough.",
  );
}

// ASSERTION 3 -- main IS dev, not merely part of it. WARNING, NOT A FAILURE.
const behind = Number(git("rev-list", "--count", `${headSha}..${devSha}`));
let completeness;
if (behind > 0) {
  console.log(
    `::warning::main is ${behind} commit(s) BEHIND dev after this push. If dev advanced ` +
      "after the promotion, this is expected and fine. If not, this was a PARTIAL " +
      "promotion -- the classic cause is pushing a stale local dev (git push origin " +
      "dev:main) instead of the remote-tracking ref (git push origin origin/dev:main), " +
      "ODOC-193. Left behind:",
  );
  for (const line of git(
    "log",
    "--oneline",
    "--no-decorate",
    `${headSha}..${devSha}`,
  ).split("\n"))
    console.log(`::warning::  ${line}`);
  completeness = `but is ${behind} commit(s) behind dev (see warning)`;
} else {
  completeness = "and is dev's tip exactly, with nothing left behind";
}

// States the two things it measured and the one it observed -- never
// "fast-forward" as a bare claim, which is the wording that made the old job
// wrong while its exit code was right about what it actually tested.
console.log(
  `main ${movement}; its HEAD is a commit dev holds (dev tip ${devSha}), ${completeness}.`,
);
