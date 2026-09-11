#!/usr/bin/env node
// QCLI-267. A published version's provenance must be something this
// repository can still show you.
//
// What went wrong without this: @opum-ai/quest 0.6.0 records
// gitHead=ce551cf4, the repository was deleted and recreated on 2026-09-10,
// and ce551cf4 no longer exists -- `GET /commits/ce551cf4` returns HTTP 422.
// The v0.6.0 tag meanwhile peels to the post-recreation initial commit. So
// the public record asserted a provenance the repository contradicted, and
// nothing anywhere noticed. A downstream site found it by getting a 404 on a
// link it served in production.
//
//   --pre   before publishing: the tag, the commit and package.json agree,
//           and the commit is reachable from the default branch. Cheap, and
//           catches a release cut from a ref that is not in the history.
//   --post  after publishing: the registry's gitHead for the version just
//           published is exactly the commit that was released. This is the
//           assertion that names the defect directly -- at this moment both
//           halves exist and can be compared, which is not true later.
//
// Neither mode can repair an old release. The point is that a NEW one cannot
// silently acquire a claim the repository contradicts.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const mode = process.argv[2];
if (mode !== "--pre" && mode !== "--post") {
  console.error("usage: release-provenance.mjs --pre|--post");
  process.exit(2);
}

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

const fail = (message) => {
  console.error(`::error::${message}`);
  process.exit(1);
};

const { name, version } = JSON.parse(readFileSync("package.json", "utf8"));
const sha = process.env.GITHUB_SHA ?? git("rev-parse", "HEAD");
const ref = process.env.GITHUB_REF ?? "";

if (mode === "--pre") {
  // 1. The tag names the version package.json declares. A release cut from a
  //    tag that disagrees with the manifest publishes one version under
  //    another's name.
  const tag = ref.startsWith("refs/tags/")
    ? ref.slice("refs/tags/".length)
    : "";
  if (!tag)
    fail(`Not dispatched against a tag (GITHUB_REF=${ref || "unset"}).`);
  if (tag !== `v${version}`)
    fail(`Tag ${tag} does not match package.json version ${version}.`);

  // 2. The commit exists here. Trivially true in a checkout, which is the
  //    point: it is the reachability below that this pairs with.
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], {
      stdio: "ignore",
    });
  } catch {
    fail(`Released commit ${sha} is not a commit in this repository.`);
  }

  // 3. It is reachable from the default branch. A tag pointing at an orphan
  //    or a discarded branch is exactly the shape that survives a history
  //    rewrite while meaning nothing.
  let reachable = false;
  try {
    git("fetch", "--quiet", "origin", "main");
    execFileSync("git", ["merge-base", "--is-ancestor", sha, "origin/main"], {
      stdio: "ignore",
    });
    reachable = true;
  } catch {
    reachable = false;
  }
  if (!reachable)
    fail(
      `Released commit ${sha} is not an ancestor of origin/main. A tag outside the mainline history is the shape that outlives the history it pointed into.`,
    );

  console.log(
    `Provenance pre-check passed: ${tag} -> ${sha}, reachable from origin/main.`,
  );
  process.exit(0);
}

// --post: compare the registry's own record against what was released.
let published = "";
try {
  published = execFileSync(
    "npm",
    ["view", `${name}@${version}`, "gitHead", "--silent"],
    { encoding: "utf8" },
  ).trim();
} catch (error) {
  fail(
    `Could not read gitHead for ${name}@${version} from the registry: ${error instanceof Error ? error.message : String(error)}`,
  );
}

if (!published) {
  // npm omits gitHead when the publish had no git context. That is not a
  // mismatch, but it is the absence of provenance, so say so loudly rather
  // than passing quietly.
  fail(
    `${name}@${version} was published with no gitHead. The registry now records no provenance for it, and nothing later can add one.`,
  );
}

if (published !== sha)
  fail(
    `${name}@${version} records gitHead ${published} but was released from ${sha}. The registry and this repository disagree about what built this version -- do not let this release stand as-is.`,
  );

console.log(
  `Provenance post-check passed: ${name}@${version} gitHead == ${sha}.`,
);
