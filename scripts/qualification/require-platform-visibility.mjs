/**
 * The gate that must pass BEFORE `@opum-ai/quest` is published in CI
 * (QCLI-300).
 *
 * QCLI-299 established the rule and fixed it in `scripts/publish-release.mjs`
 * only: the wrapper must not be published until a CONSUMER-SIDE READ confirms
 * every platform package resolves. A write returning success is not
 * visibility -- on 0.7.0 write order and visibility order disagreed in four of
 * six positions -- and a wrapper published ahead of its platform packages
 * advertises an optionalDependency that does not resolve, so an install inside
 * that window succeeds and leaves no binary.
 *
 * The CI path in `.github/workflows/release.yml` carried the identical defect:
 * a shell loop publishing six platform packages, then the wrapper on the very
 * next line. Its retry loop runs AFTER the wrapper is already on the registry,
 * which makes it a confirmation, not a gate -- the same shape QCLI-299 removed
 * from the local script.
 *
 * This is deliberately a thin runner over `registry-visibility.mjs` rather
 * than a second implementation of the read. Two implementations of "did it
 * land" would drift, and the one in CI is the one nobody runs by hand.
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyVersion,
  describeVersionState,
  waitForConsumerVisibility,
} from "./registry-visibility.mjs";

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

export const REQUIRED_PLATFORMS = [
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-x64",
];

export function platformPackageNames(platforms = REQUIRED_PLATFORMS) {
  return platforms.map((platform) => `@opum-ai/quest-${platform}`);
}

/**
 * Exported so the failure path can be exercised against an injected read
 * without touching the network -- AC 2 asks for the gate's refusal to be
 * demonstrated, not reasoned about from the YAML.
 */
export async function requirePlatformVisibility({
  version,
  names = platformPackageNames(),
  wait = waitForConsumerVisibility,
  classify = classifyVersion,
  log = console.log,
  error = console.error,
  waitOptions = {},
} = {}) {
  log(
    `Gating the @opum-ai/quest publish on all ${names.length} platform packages` +
      ` resolving for a consumer at ${version} -- not on their writes having returned success.`,
  );

  const visibility = await wait(names, version, {
    onProgress: (event) => {
      if (event.state === "visible")
        log(`  resolves for consumers: ${event.name}`);
      else if (event.state === "regressed")
        log(`  STOPPED resolving, back to waiting: ${event.name}`);
      else if (event.state === "settling")
        log(
          `  all ${names.length} resolve; holding ${Math.round(event.waitMs / 1000)}s` +
            " to cover the measured publisher-early lag, then re-reading",
        );
    },
    ...waitOptions,
  });

  if (visibility.ok) {
    log(
      `All ${names.length} platform packages resolve for a consumer after` +
        ` ${visibility.attempts} check(s). Publishing the wrapper is now safe.`,
    );
    return { ok: true, visibility };
  }

  // Read the registry again at the moment of failure rather than reporting
  // what npm said earlier in the run: the per-package state is the actionable
  // part, and "staged" and "never landed" are different fixes.
  error(
    `\nTHE WRAPPER WAS NOT PUBLISHED. ${visibility.missing.length} of ${names.length}` +
      ` platform packages did not resolve for a consumer after ${visibility.attempts}` +
      " check(s) across the full wait window.\n" +
      `@opum-ai/quest@${version} is NOT on the registry, so nothing is advertising an` +
      " optionalDependency that does not resolve.\n" +
      "That is this gate working, not a new failure. Do NOT run npm unpublish.\n\n" +
      "Per-package state, read from the public registry just now:",
  );
  for (const name of visibility.missing) {
    const classification = await classify(name, version);
    for (const line of describeVersionState(name, version, classification))
      error(line);
  }
  return { ok: false, visibility };
}

/**
 * `--max-wait-ms` and `--registry` exist so the REFUSAL can be exercised end
 * to end, exit code included, against a registry that resolves nothing. A
 * gate whose failure path has only ever been reasoned about is a gate nobody
 * has seen refuse. Neither flag is passed by release.yml, so the release path
 * keeps the module defaults.
 */
export function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--max-wait-ms") options.maxWaitMs = Number(argv[++index]);
    else if (arg === "--registry") options.registry = argv[++index];
    else positional.push(arg);
  }
  return { version: positional[0], options };
}

async function main() {
  const { version: argVersion, options } = parseArgs(process.argv.slice(2));
  const version =
    argVersion ??
    JSON.parse(await readFile(join(root, "package.json"), "utf8")).version;
  const { ok } = await requirePlatformVisibility({
    version,
    waitOptions: options,
  });
  process.exitCode = ok ? 0 : 1;
}

// Only run when invoked directly, so the module stays importable by tests.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  await main();
