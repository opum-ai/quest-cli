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
//           `--version <v>` names the version to read: the launcher stages
//           as X-rc.N (QCLI-399), so after staging @opum-ai/quest@X does not
//           exist yet.
//
//           QCLI-555: npm records gitHead only when a publish runs from a git
//           checkout, and the tarball route (`npm publish <file>` of the
//           qualified bundle, which publish-release.mjs, promote-release.mjs
//           and release.yml all use) records none: no @opum-ai/quest from
//           0.11.0 on carries one. When the registry records NO gitHead, and
//           `--bundle <dir> --run-id <id>` name the downloaded
//           quest-candidate-bundle and the qualification run on the tag, the
//           check instead ties the registry to the commit through opum-cli-e2e's
//           receipt (DEC-251 a3): the receipt must bind the commit and the
//           launcher tarball's sha256, and npm's served dist.integrity must be
//           that tarball's sha512. The bundle's own sourceCommit is a claim,
//           never the binding. See provenance-tarball-route.mjs. A gitHead the
//           registry DOES record is still compared and still must equal the
//           commit: a contradiction is never treated as an absence.
//
// Neither mode can repair an old release. The point is that a NEW one cannot
// silently acquire a claim the repository contradicts.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { verifyTarballRoute } from "./provenance-tarball-route.mjs";
import { REGISTRY_PINS } from "./registry-visibility.mjs";

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
const versionFlag = process.argv.indexOf("--version");
const postVersion =
  versionFlag === -1 ? version : process.argv[versionFlag + 1];
// Only X itself or an rc of X: any other value would check another release.
const rcPrefix = `${version}-rc.`;
if (
  postVersion !== version &&
  !(
    String(postVersion).startsWith(rcPrefix) &&
    /^[1-9][0-9]*$/.test(String(postVersion).slice(rcPrefix.length))
  )
) {
  console.error(
    `--version must be ${version} or ${version}-rc.<N>, got ${postVersion}`,
  );
  process.exit(2);
}
const bundleFlag = process.argv.indexOf("--bundle");
const bundleDir = bundleFlag === -1 ? undefined : process.argv[bundleFlag + 1];
if (bundleFlag !== -1 && (!bundleDir || bundleDir.startsWith("--"))) {
  console.error("--bundle requires a directory");
  process.exit(2);
}
const runIdFlag = process.argv.indexOf("--run-id");
const runId = runIdFlag === -1 ? undefined : process.argv[runIdFlag + 1];
if (runIdFlag !== -1 && (!runId || runId.startsWith("--"))) {
  console.error("--run-id requires a value");
  process.exit(2);
}
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
    ["view", `${name}@${postVersion}`, "gitHead", "--silent", ...REGISTRY_PINS],
    { encoding: "utf8" },
  ).trim();
} catch (error) {
  fail(
    `Could not read gitHead for ${name}@${postVersion} from the registry: ${error instanceof Error ? error.message : String(error)}`,
  );
}

if (!published) {
  // npm omits gitHead when the publish had no git context -- every tarball
  // publish. That is not a mismatch, but it is the absence of a registry
  // gitHead, so it passes only through the bundle route below, never quietly.
  if (!bundleDir)
    fail(
      `${name}@${postVersion} was published with no gitHead, which is what a tarball publish records. Re-run with --bundle <dir> --run-id <id>, naming the downloaded quest-candidate-bundle and the qualification run on the tag, so the served tarball can be tied to ${sha} through opum-cli-e2e's receipt (QCLI-555); nothing later can add a gitHead.`,
    );
  if (!runId)
    fail(
      "--bundle needs --run-id <id>: the prepublication-qualification run on the release tag, which opum-cli-e2e's receipt must name.",
    );
  const routed = await verifyTarballRoute({
    name,
    bundleDir,
    version,
    postVersion,
    commit: sha,
    runId,
  });
  if (!routed.ok)
    fail(
      `${name}@${postVersion} records no gitHead and the served bytes cannot be tied to ${sha}:\n${routed.problems.join("\n")}`,
    );
  if (routed.override) console.log(routed.override);
  console.log(
    `Provenance post-check passed (tarball route): ${name}@${postVersion} records no gitHead; its served integrity equals the tarball ${routed.source} binds to ${sha}.`,
  );
  process.exit(0);
}

if (published !== sha)
  fail(
    `${name}@${postVersion} records gitHead ${published} but was released from ${sha}. The registry and this repository disagree about what built this version -- do not let this release stand as-is.`,
  );

console.log(
  `Provenance post-check passed: ${name}@${postVersion} gitHead == ${sha}.`,
);
