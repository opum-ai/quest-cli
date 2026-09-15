// Consumer-shaped registry visibility (QCLI-299).
//
// The publish path used to order its WRITES -- platform packages, then the
// wrapper -- and call that a guarantee the wrapper never advertises an
// optionalDependency that does not resolve. Write order does not produce
// visibility order. Measured on 0.7.0 (2026-09-15): all seven writes returned
// success, and the six platform packages went public over roughly nine
// minutes in an order that disagreed with the write order in four of six
// positions, while one sat non-public for twelve minutes past the wrapper.
// Because platform packages are optionalDependencies, an install inside that
// window SUCCEEDS and leaves no binary -- silently.
//
// Two properties this module exists to respect, both measured rather than
// assumed:
//
//   1. THE PUBLISHER READS EARLY. opum-cli-e2e timed 9-20 seconds between a
//      package's registry `time[0.7.0]` and its first resolution from a
//      non-publishing npm client, across five packages, bounded above by
//      their 10s poll granularity. A publisher-side gate can therefore
//      report ready while an installer still resolves the previous version.
//      So the reads here go over plain HTTPS to the public registry with NO
//      credential and NO npmrc -- a different client from the publishing one
//      -- and a settle margin covers what remains.
//
//   2. THE PUBLISHER IS BLIND TO A STAGE IT CREATED. npm 12 can accept a
//      publish into a STAGED state: non-public, awaiting a maintainer's 2FA
//      approval, and occupying the same semver unique index as a published
//      version. `npm stage list` returned `[]` for the granular release token
//      while the registry was refusing that same token's PUT over a stage it
//      had itself created. So "staged" is not always distinguishable from
//      "absent" by reading, and this module says so instead of guessing --
//      see `classifyVersion` and the `--diagnose-staged` probe in
//      `publish-release.mjs`.

import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFileDefault = promisify(execFileCallback);

export const CONSUMER_REGISTRY = "https://registry.npmjs.org";

/**
 * The settle margin, in milliseconds, applied after every platform package
 * first resolves consumer-side.
 *
 * 30s = the 20s worst case measured by opum-cli-e2e plus their 10s poll
 * granularity, which bounds the measurement from above rather than below: the
 * real lag for that package was somewhere in (10s, 20s], so 20s is a floor on
 * the worst case seen, not a ceiling on what is possible. The margin is cheap
 * -- it is paid once per release, after every package is already visible --
 * and the thing it protects against is an install that silently leaves no
 * binary, so the asymmetry favours waiting.
 */
export const PUBLISHER_EARLY_LAG_MS = 30_000;

/** `@scope/name` must arrive at the registry with its slash escaped. */
export function packumentUrl(pkgName, registry = CONSUMER_REGISTRY) {
  return `${registry}/${pkgName.replace("/", "%2f")}`;
}

/**
 * Reads the PUBLIC packument with no credential attached, which is what makes
 * this a consumer's read rather than the publisher's. Deliberately does not
 * bust the CDN cache: a consumer's npm hits the same cached document, so
 * reading past it would measure something no installer experiences.
 *
 * Returns `absent` only for a document that was actually read and did not
 * contain the version. A read that failed is `unreadable`, never `absent` --
 * conflating the two is how "I could not see it" becomes "it is not there".
 */
export async function readConsumerVersion(
  pkgName,
  version,
  { fetchImpl = fetch, registry = CONSUMER_REGISTRY } = {},
) {
  let response;
  try {
    response = await fetchImpl(packumentUrl(pkgName, registry), {
      headers: { accept: "application/json" },
    });
  } catch (error) {
    return {
      state: "unreadable",
      publishedAt: null,
      problem: `network error reading ${pkgName}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (response.status === 404)
    return { state: "absent", publishedAt: null, problem: null };
  if (!response.ok)
    return {
      state: "unreadable",
      publishedAt: null,
      problem: `registry returned ${response.status} for ${pkgName}`,
    };
  let packument;
  try {
    packument = await response.json();
  } catch (error) {
    return {
      state: "unreadable",
      publishedAt: null,
      problem: `unparseable packument for ${pkgName}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (packument?.versions?.[version])
    return {
      state: "public",
      publishedAt: packument?.time?.[version] ?? null,
      problem: null,
    };
  return { state: "absent", publishedAt: null, problem: null };
}

/**
 * Blocks until every named package resolves consumer-side AND has stayed
 * resolvable for the settle margin, or the shared wall-clock window runs out.
 *
 * One window for all of them together, not one each, following the same
 * design as `waitForPublished`. A package that resolves and then stops
 * resolving -- the CDN serving two different documents -- drops back to
 * not-yet-visible rather than counting, because an installer that hits the
 * stale edge is in exactly that state.
 */
export async function waitForConsumerVisibility(
  packageNames,
  version,
  {
    maxWaitMs = 15 * 60 * 1000,
    initialDelayMs = 5000,
    maxDelayMs = 30 * 1000,
    settleMs = PUBLISHER_EARLY_LAG_MS,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now = () => Date.now(),
    read = readConsumerVersion,
    onProgress = () => {},
    ...readOptions
  } = {},
) {
  const deadline = now() + maxWaitMs;
  const firstVisibleAt = new Map();
  const lastSeen = new Map();
  let delay = initialDelayMs;
  let attempts = 0;

  for (;;) {
    attempts += 1;
    for (const name of packageNames) {
      const result = await read(name, version, readOptions);
      lastSeen.set(name, result);
      if (result.state === "public") {
        if (!firstVisibleAt.has(name)) {
          firstVisibleAt.set(name, now());
          onProgress({
            name,
            state: "visible",
            publishedAt: result.publishedAt,
          });
        }
      } else if (firstVisibleAt.delete(name)) {
        onProgress({ name, state: "regressed", problem: result.problem });
      }
    }

    const missing = packageNames.filter((name) => !firstVisibleAt.has(name));
    if (missing.length === 0) {
      const settleUntil = Math.max(...firstVisibleAt.values()) + settleMs;
      const remaining = settleUntil - now();
      if (remaining <= 0)
        return {
          ok: true,
          timedOut: false,
          attempts,
          missing: [],
          settleMs,
          lastSeen: Object.fromEntries(lastSeen),
        };
      onProgress({ state: "settling", waitMs: remaining });
      await sleep(remaining);
      continue; // Re-read after settling: the margin only counts if it holds.
    }

    if (now() >= deadline)
      return {
        ok: false,
        timedOut: true,
        attempts,
        missing,
        settleMs,
        lastSeen: Object.fromEntries(lastSeen),
      };

    await sleep(Math.min(delay, maxDelayMs, deadline - now()));
    delay = Math.min(delay * 2, maxDelayMs);
  }
}

/**
 * Asks npm for the stages the CURRENT credential can see. Measured blind on
 * 2026-09-15 -- `[]` from the token whose own stage was blocking its PUT --
 * so an empty list is evidence of nothing and is reported as such.
 */
export async function readStageList(
  pkgName,
  { execFile = execFileDefault, env = {} } = {},
) {
  try {
    const { stdout } = await execFile(
      "npm",
      ["stage", "list", pkgName, "--json"],
      { env: { ...process.env, ...env } },
    );
    const parsed = JSON.parse(stdout || "[]");
    const entries = Array.isArray(parsed) ? parsed : (parsed?.stages ?? []);
    return { supported: true, entries, problem: null };
  } catch (error) {
    return {
      supported: false,
      entries: [],
      problem: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * The four states a version can be in from the publish path's point of view,
 * of which the old code could name two.
 *
 * `absent-or-staged` is the honest fourth: the public packument does not have
 * it and the publishing credential cannot see a stage. That is not a
 * diagnosis, it is the absence of one, and the caller must present it that
 * way -- `npm publish` returning 409 "previously staged" is the only signal
 * that separates the two, and it costs a write, so it belongs behind an
 * operator's explicit decision rather than inside a poll.
 */
export async function classifyVersion(
  pkgName,
  version,
  { read = readConsumerVersion, stageList = readStageList, ...options } = {},
) {
  const consumer = await read(pkgName, version, options);
  if (consumer.state === "public")
    return {
      state: "public",
      publishedAt: consumer.publishedAt,
      stageId: null,
      evidence: `public packument lists ${version}${consumer.publishedAt ? ` (published ${consumer.publishedAt})` : ""}`,
    };
  if (consumer.state === "unreadable")
    return {
      state: "unreadable",
      publishedAt: null,
      stageId: null,
      evidence: consumer.problem,
    };

  const stages = await stageList(pkgName, options);
  const match = stages.entries.find((entry) => entry?.version === version);
  if (match)
    return {
      state: "staged",
      publishedAt: null,
      stageId: match.id ?? match.stageId ?? null,
      evidence: `npm stage list names ${version} as staged`,
    };
  return {
    state: "absent-or-staged",
    publishedAt: null,
    stageId: null,
    evidence: stages.supported
      ? `public packument does not list ${version}, and npm stage list returned no stage for it -- which the release token also did on 2026-09-15 while a stage it had created was blocking its own PUT, so this does not rule staging out`
      : `public packument does not list ${version}, and npm stage list could not be read (${stages.problem})`,
  };
}

/**
 * Operator-facing lines for one classification. Never asserts that a release
 * is fine: the sentence this replaces ("this is registry read-after-write
 * lag, not a failed release") was true of six packages and wrong about the
 * one that decided whether the release shipped.
 */
export function describeVersionState(pkgName, version, classification) {
  const lines = [`  ${pkgName}@${version}: ${classification.state}`];
  if (classification.evidence) lines.push(`      ${classification.evidence}`);
  if (classification.state === "staged") {
    lines.push(
      "      STAGED means accepted, reserved, and non-public, awaiting a 2FA approval.",
      `      Clearing it is an operator action: npm stage approve ${classification.stageId ?? "<stage-id>"} (or reject),`,
      "      from a logged-in maintainer session or the package page on npmjs.com.",
      "      The granular release token cannot do it -- that is what staging is for.",
    );
  }
  if (classification.state === "absent-or-staged") {
    lines.push(
      "      Staged and never-landed are not distinguishable from here: a stage is invisible",
      "      to the credential that created it. Re-run with --diagnose-staged to separate them",
      "      by attempting the publish again -- 409 'previously staged' means staged, and",
      "      success means it never landed and has now been published.",
    );
  }
  if (classification.state === "unreadable")
    lines.push(
      "      The registry could not be read, which is not evidence about the version either way.",
    );
  return lines;
}

/**
 * Maps a failed `npm publish` to what it says about the version already on
 * the registry. This is the only distinguisher between staged and absent, and
 * it is why the probe is a write.
 */
export function classifyPublishError(error) {
  const text = [error?.stderr, error?.stdout, error?.message]
    .filter(Boolean)
    .join("\n");
  if (/previously staged version/i.test(text)) return "staged";
  if (
    /EPUBLISHCONFLICT|cannot publish over the previously published/i.test(text)
  )
    return "public";
  if (/E404|404 Not Found/.test(text)) return "unauthorized-or-absent";
  return "unknown";
}
