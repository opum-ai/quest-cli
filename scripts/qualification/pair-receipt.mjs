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
//      pair.quest.commit is the gitHead npm records for that version
//   4. pair.quest.tarballs names exactly the seven archives, and each
//      distIntegrity is what npm serves for that package right now
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
} from "./e2e-receipt.mjs";

const execFile = promisify(execFileCallback);

export const PAIR_RECEIPT_KIND = "opum.pair-qualification-receipt.v1";

export function pairReceiptPath(version) {
  return `receipts/pair/${version}.json`;
}

/** `@opum-ai/quest-linux-x64` -> `opum-ai-quest-linux-x64-<v>.tgz`, as npm pack names it. */
export function tarballName(pkgName, version) {
  return `${pkgName.replace("@", "").replace("/", "-")}-${version}.tgz`;
}

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

/**
 * Pure verdict over a pair receipt and what the registry serves now.
 * `observed.integrities` is keyed by tarball name; `observed.gitHead` is the
 * commit npm records for the wrapper at this version.
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
  if (!observed.gitHead || quest.commit !== observed.gitHead)
    problems.push(
      `pair.quest.commit is ${JSON.stringify(quest.commit)}, npm records gitHead ${JSON.stringify(observed.gitHead ?? null)} for ${version}`,
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
  const expected = expectedTarballNames(version);
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
    if (!expected.includes(name))
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
 * What the registry serves for the seven packages at this version, read at
 * promotion time. A package that cannot be read is simply absent from the
 * result, which the verdict then reports; it is never guessed.
 */
export async function observeRegistry(
  version,
  packages,
  { execFile: execFileFn = execFile } = {},
) {
  const integrities = {};
  let gitHead = null;
  for (const name of packages) {
    try {
      const { stdout } = await execFileFn("npm", [
        "view",
        `${name}@${version}`,
        "dist.integrity",
        "gitHead",
        "--json",
      ]);
      // npm 12 answers an exact-version view with a ONE-element array, and an
      // older npm with the bare object (measured on 0.10.0, npm 12.0.2).
      // Anything else is not one version's metadata, so it is not read.
      const parsed = JSON.parse(stdout);
      const view = Array.isArray(parsed)
        ? parsed.length === 1
          ? parsed[0]
          : {}
        : parsed;
      if (typeof view["dist.integrity"] === "string")
        integrities[tarballName(name, version)] = view["dist.integrity"];
      if (name === "@opum-ai/quest" && typeof view.gitHead === "string")
        gitHead = view.gitHead;
    } catch {
      // Left absent on purpose: see above.
    }
  }
  return { integrities, gitHead };
}

/** The whole gate: fetch the pair receipt, read the registry, compare. */
export async function requirePairQualification({
  version,
  packages,
  fetch = (v) => fetchReceipt(v, { path: pairReceiptPath(v) }),
  observe = (v) => observeRegistry(v, packages),
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
  const verdict = evaluatePairReceipt(fetched.doc, {
    version,
    observed: await observe(version),
  });
  return { ...verdict, source: fetched.source };
}
