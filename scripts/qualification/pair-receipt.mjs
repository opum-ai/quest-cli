// The opum-cli-e2e gate on moving `latest` (QCLI-388).
//
// opum-agent ruling A on OPAG-465 (2026-09-27): `latest` moves only on a
// machine-readable verdict that opum-cli-e2e wrote after installing the
// STAGED lore/quest pair from the registry (constitution Article 3 clauses 5
// and 6) -- never on a relayed "it passed". The receipt format is
// opum-cli-e2e's, agreed with quest-cli and lore-cli on their TASK-120
// (opum-ai/opum-cli-e2e#298, receipts/README.md "Pair receipts"), and read
// here exactly as its "What a reader must do" section lists:
//
//   1. kind is opum.pair-qualification-receipt.v1
//   2. verdict is QUALIFIED, or a four-field override (printed verbatim)
//   3. pair.quest.version AND pair.lore.version are the version being
//      promoted -- Article 3.1 gives both the one number -- and
//      pair.quest.commit is what the v<version> tag peels to, and npm's
//      gitHead too when npm recorded one (QCLI-393)
//   4. pair.quest.tarballs names exactly the seven archives, and each
//      distIntegrity is what npm serves for that package right now
//   5. (QCLI-399, TASK-126) pair.quest.launcherVersion is <version>-rc.<N>,
//      and the launcher entry is keyed, read and verified at THAT version:
//      the X launcher is not on the registry until promotion publishes it
//
// Steps 6 and 7 -- the substitution re-check against the rc npm serves, and
// latest serving X afterwards -- are the promotion's, in promote-release.mjs.
//
// Also: installedFrom.quest.source must be "registry", because a verdict on
// the candidate bundle is pass 1, not this. As with pass 1, a 403, a 404, a
// network error and a malformed document all read as NO RECEIPT.

import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

import {
  evaluateVerdict,
  expectedTarballNames,
  fetchReceipt,
  isLauncherVersionOf,
  LAUNCHER,
  tarballName,
} from "./e2e-receipt.mjs";

const execFile = promisify(execFileCallback);

export const PAIR_RECEIPT_KIND = "opum.pair-qualification-receipt.v1";

export function pairReceiptPath(version) {
  return `receipts/pair/${version}.json`;
}

export { tarballName };

/** The receipt's launcherVersion when it is an rc of `version`, else null. */
export function receiptLauncherVersion(doc, version) {
  const candidate = isObject(doc) ? doc.pair?.quest?.launcherVersion : null;
  return isLauncherVersionOf(version, candidate) ? candidate : null;
}

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Pure verdict over a pair receipt and what the registry serves now.
 * `observed.integrities` is keyed by tarball name; `observed.commit` is what
 * the v<version> tag peels to, and `observed.gitHead` npm's gitHead or null.
 */
export function evaluatePairReceipt(doc, { version, observed }) {
  if (!isObject(doc))
    return {
      ok: false,
      problems: ["pair receipt is not a JSON object"],
      override: null,
    };
  const problems = [];
  if (doc.kind !== PAIR_RECEIPT_KIND)
    problems.push(
      `kind must be ${PAIR_RECEIPT_KIND}, got ${JSON.stringify(doc.kind)}`,
    );

  const quest = isObject(doc.pair?.quest) ? doc.pair.quest : {};
  const lore = isObject(doc.pair?.lore) ? doc.pair.lore : {};
  if (quest.version !== version)
    problems.push(
      `pair.quest.version is ${JSON.stringify(quest.version)}, the promotion is ${version}`,
    );
  // A receipt for a different pairing -- a same-numbered quest qualified
  // against another lore -- must not read as covering this one.
  if (lore.version !== version)
    problems.push(
      `pair.lore.version is ${JSON.stringify(lore.version)}; Article 3 pairs quest ${version} with lore ${version}`,
    );
  // Condition 3 (opum-agent ruling on QCLI-393): the receipt's commit must be
  // what the v<version> tag peels to -- an unreadable tag refuses -- and, if
  // npm recorded a gitHead, that too. Either disagreement refuses.
  if (!observed.commit || quest.commit !== observed.commit)
    problems.push(
      `pair.quest.commit is ${JSON.stringify(quest.commit)}, ${observed.commitSource ?? `v${version}`} resolves to ${JSON.stringify(observed.commit ?? null)}${observed.commitError ? ` (${observed.commitError})` : ""}`,
    );
  // Step 5: the launcher entry is verified at launcherVersion, not version.
  const launcherVersion = receiptLauncherVersion(doc, version);
  if (!launcherVersion)
    problems.push(
      `pair.quest.launcherVersion is ${JSON.stringify(quest.launcherVersion)}, not ${version}-rc.<N>`,
    );
  // observed.gitHead is read from the staged launcher, the only one on npm.
  if (observed.gitHead && quest.commit !== observed.gitHead)
    problems.push(
      `pair.quest.commit is ${JSON.stringify(quest.commit)}, npm records gitHead ${JSON.stringify(observed.gitHead)} for ${LAUNCHER}@${launcherVersion ?? quest.launcherVersion}`,
    );
  if (doc.installedFrom?.quest?.source !== "registry")
    problems.push(
      `installedFrom.quest.source is ${JSON.stringify(doc.installedFrom?.quest?.source)}, not "registry": this is not a verdict on the staged packages`,
    );

  // Set equality over the names, then each digest. Object.hasOwn, never
  // `in`, for the same reason as pass 1.
  const recorded = isObject(quest.tarballs) ? quest.tarballs : {};
  if (recorded !== quest.tarballs)
    problems.push("pair.quest.tarballs is not an object");
  // Without a valid launcherVersion the launcher entry cannot be named, so
  // only the platforms are checked and the problem above refuses.
  const expected = launcherVersion
    ? expectedTarballNames(version, launcherVersion)
    : expectedTarballNames(version, `${version}-rc.1`).slice(1);
  for (const name of expected) {
    if (!Object.hasOwn(recorded, name)) {
      problems.push(
        `${name}: not in the pair receipt, so it was never qualified`,
      );
      continue;
    }
    const recordedIntegrity = recorded[name]?.distIntegrity;
    const served = observed.integrities[name];
    if (typeof recordedIntegrity !== "string" || !recordedIntegrity)
      problems.push(`${name}: pair receipt records no distIntegrity`);
    else if (recordedIntegrity !== served)
      problems.push(
        `${name}: qualified ${recordedIntegrity}, npm serves ${served ?? "nothing"}`,
      );
  }
  for (const name of Object.keys(recorded))
    if (!expected.includes(name) && launcherVersion)
      problems.push(
        `${name}: named in the pair receipt but not part of this release`,
      );

  const verdict = evaluateVerdict(doc);
  problems.push(...verdict.problems);
  return {
    ok: problems.length === 0,
    problems,
    override: verdict.override,
  };
}

/**
 * One version's registry metadata as an object, or null (QCLI-393). Read
 * WHOLE, as lore-cli's reader does, rather than by naming fields: npm 12
 * changes the answer's shape with how many named fields exist. 0.11.0 was
 * published from tarballs, which records no gitHead, so a two-field read came
 * back as a bare `["sha512-..."]` and parsed as "npm serves nothing" for all
 * seven -- a uniform null from the reader, not the registry. A whole-version
 * view is one object, wrapped in a one-element array by npm 12.
 */
export async function viewVersion(
  name,
  version,
  { execFile: execFileFn = execFile } = {},
) {
  const { stdout } = await execFileFn(
    "npm",
    ["view", `${name}@${version}`, "--json", "--prefer-online"],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const parsed = JSON.parse(stdout);
  const view = Array.isArray(parsed)
    ? parsed.length === 1
      ? parsed[0]
      : null
    : parsed;
  return isObject(view) ? view : null;
}

/** Annotated tags can in principle point at other tags; nothing legitimate nests this deep. */
export const MAX_PEEL_DEPTH = 8;
const SHA1_HEX = /^[0-9a-f]{40}$/;
const OWN_REPOSITORY = "opum-ai/quest-cli";
const firstLine = (error) =>
  String(error?.stderr || error?.message || error)
    .trim()
    .split("\n")[0];

/**
 * The commit `v<version>` peels to on quest-cli, dereferenced EXPLICITLY
 * (opum-agent ruling on QCLI-393; the same function as lore-cli's
 * resolveTagCommit). quest's release tags are annotated: refs/tags/v0.11.0
 * names tag object 84cc917, which names commit eb1d9f4. Comparing with the
 * ref's own sha would never match. So: read the exact ref, follow
 * git/tags/<sha> while the object is a tag, up to MAX_PEEL_DEPTH, and accept
 * ONLY a commit. Fails closed, with the reason, on a missing tag, a ref that
 * is not exactly refs/tags/v<version>, a malformed answer, a peel that ends
 * on anything but a commit, or a chain too deep. No fallback to any branch.
 */
export async function resolveTagCommit(
  version,
  { execFile: execFileFn = execFile } = {},
) {
  const ref = `refs/tags/v${version}`;
  const chain = [];
  const fail = (error) => ({ commit: null, chain, error });
  const read = async (path) => {
    const { stdout } = await execFileFn("gh", [
      "api",
      "--hostname",
      "github.com",
      `repos/${OWN_REPOSITORY}/${path}`,
    ]);
    return JSON.parse(stdout);
  };
  let object;
  try {
    const answer = await read(`git/ref/tags/v${version}`);
    if (!isObject(answer) || answer.ref !== ref)
      return fail(
        `asked for ${ref}, the API answered ${JSON.stringify(isObject(answer) ? answer.ref : answer)}`,
      );
    object = answer.object;
  } catch (error) {
    return fail(`${ref} could not be read (${firstLine(error)})`);
  }
  for (let depth = 0; ; depth++) {
    if (
      !isObject(object) ||
      typeof object.type !== "string" ||
      !SHA1_HEX.test(String(object.sha))
    )
      return fail(
        `${ref} resolves to a malformed object ${JSON.stringify(object)}`,
      );
    chain.push(`${object.type} ${object.sha}`);
    if (object.type === "commit") return { commit: object.sha, chain };
    if (object.type !== "tag")
      return fail(
        `${ref} peels to a ${object.type} ${object.sha}, not a commit (chain: ${chain.join(" -> ")})`,
      );
    if (depth >= MAX_PEEL_DEPTH)
      return fail(
        `${ref} is still a tag after ${MAX_PEEL_DEPTH} dereferences (chain: ${chain.join(" -> ")})`,
      );
    try {
      const tag = await read(`git/tags/${object.sha}`);
      if (!isObject(tag) || tag.sha !== object.sha)
        return fail(
          `asked for tag object ${object.sha} under ${ref}, the API answered for ${JSON.stringify(isObject(tag) ? tag.sha : tag)}`,
        );
      object = tag.object;
    } catch (error) {
      return fail(
        `tag object ${object.sha} under ${ref} could not be read (${firstLine(error)})`,
      );
    }
  }
}

/**
 * What the registry serves for the seven packages at this version, and the
 * commit the release resolves to. A package that cannot be read is absent
 * from the result, which the verdict then reports; it is never guessed.
 */
export async function observeRegistry(
  version,
  packages,
  {
    // QCLI-399: the launcher is read at its staged rc version. Null leaves it
    // unread, which the verdict reports as not served.
    launcherVersion = null,
    execFile: execFileFn = execFile,
    resolveCommit = (v) => resolveTagCommit(v, { execFile: execFileFn }),
  } = {},
) {
  const integrities = {};
  let gitHead = null;
  for (const name of packages) {
    const atVersion = name === LAUNCHER ? launcherVersion : version;
    if (!atVersion) continue;
    try {
      const view = await viewVersion(name, atVersion, {
        execFile: execFileFn,
      });
      const integrity = isObject(view?.dist) ? view.dist.integrity : undefined;
      if (typeof integrity === "string")
        integrities[tarballName(name, atVersion)] = integrity;
      // By presence, not value: a tarball publish records no gitHead at all.
      if (
        name === LAUNCHER &&
        view &&
        Object.hasOwn(view, "gitHead") &&
        typeof view.gitHead === "string"
      )
        gitHead = view.gitHead;
    } catch {
      // Left absent on purpose: see above.
    }
  }
  const peeled = await resolveCommit(version);
  return {
    integrities,
    gitHead,
    commit: peeled.commit,
    commitSource: `${OWN_REPOSITORY} tag v${version}`,
    ...(peeled.error ? { commitError: peeled.error } : {}),
  };
}

/** The whole gate: fetch the pair receipt, read the registry, compare. */
export async function requirePairQualification({
  version,
  packages,
  fetch = (v) => fetchReceipt(v, { path: pairReceiptPath(v) }),
  observe = (v, launcherVersion) =>
    observeRegistry(v, packages, { launcherVersion }),
}) {
  const fetched = await fetch(version);
  if (!fetched.doc)
    return {
      ok: false,
      problems: [
        `no opum-cli-e2e pair receipt at ${fetched.source} (${fetched.error ?? "unreadable"})`,
      ],
      override: null,
      source: fetched.source,
    };
  const launcherVersion = receiptLauncherVersion(fetched.doc, version);
  const verdict = evaluatePairReceipt(fetched.doc, {
    version,
    observed: await observe(version, launcherVersion),
  });
  return { ...verdict, launcherVersion, source: fetched.source };
}
