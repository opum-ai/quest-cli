// Digest-pinned candidate bundle (QCLI-135 follow-through).
//
// A candidate bundle lets downstream qualification exercise an UNPUBLISHED
// build: opum-cli-e2e binds it with `--quest-candidate`, installs Quest from
// the exact tarballs inside it, and recomputes every executable digest live
// from those bytes. Nothing reaches a registry.
//
// It exists because the alternative for exercising unreleased changes is
// publishing them, and "publish it and see" is not a qualification strategy.
//
// What binding a candidate gains and loses, stated here so nobody has to infer
// it from a passing report (opum-cli-e2e's own design note says the same):
//   GAINED  every digest is recomputed from these tarball bytes at run time,
//           and the binary that actually runs the ~400 behavioural rows is the
//           one in this bundle.
//   LOST    execution attestation for the five platforms the running host
//           cannot execute. This bundle proves a tarball containing a binary
//           of digest X exists for win32-arm64; it proves nothing ran there.
// The native-execution receipt is what covers the second, and the two are
// complementary rather than substitutes.
//
// This must run where all six platform packages exist. Bun cannot cross-compile
// bun-windows-aarch64, so that is CI after the platform matrix, never a laptop.

import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = dirname(dirname(fileURLToPath(import.meta.url)));

export const REQUIRED_PLATFORMS = Object.freeze([
  "darwin-arm64",
  "darwin-x64",
  "linux-arm64",
  "linux-x64",
  "win32-arm64",
  "win32-x64",
]);

const COMMIT_HEX = /^[0-9a-f]{40}$/;

export function executableFor(platform) {
  return platform.startsWith("win32-") ? "quest.exe" : "quest";
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** `npm pack` names the archive after the scoped package plus its version. */
function tarballName(packageName, version) {
  return `${packageName.replace("@", "").replace("/", "-")}-${version}.tgz`;
}

/**
 * Packs one package directory into the bundle and returns its recorded row.
 * The member check is not ceremony: the consumer installs from these bytes and
 * extracts that exact path, so a tarball missing it fails at qualification time
 * with a confusing error instead of here with an obvious one.
 */
async function pack(directory, into, expectedMember) {
  const { stdout } = await execFile(
    "npm",
    ["pack", "--pack-destination", into, "--json"],
    { cwd: directory, maxBuffer: 32 * 1024 * 1024 },
  );
  // `npm pack --json` returns an array on some npm versions and an object
  // keyed by package name on others. Accept both rather than pinning npm.
  const parsed = JSON.parse(stdout);
  const entry = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  const filename = entry?.filename;
  if (!filename)
    throw new Error(
      `npm pack produced no archive in ${directory}: ${stdout.slice(0, 200)}`,
    );
  const archive = join(into, filename);
  const { stdout: members } = await execFile("tar", ["tzf", archive], {
    maxBuffer: 32 * 1024 * 1024,
  });
  if (!members.split("\n").includes(expectedMember))
    throw new Error(`${filename} does not contain ${expectedMember}`);
  return { filename, digest: sha256(await readFile(archive)) };
}

export async function buildCandidateBundle({
  commit,
  out,
  releaseRef = false,
  directory = root,
} = {}) {
  if (!COMMIT_HEX.test(String(commit ?? "")))
    throw new Error(`source commit is not a 40-hex commit id: ${commit}`);

  const version = JSON.parse(
    await readFile(join(directory, "package.json"), "utf8"),
  ).version;

  // Every platform, or none. A five-platform bundle would produce a coverage
  // failure downstream that reads like a product defect rather than a build
  // that was never finished.
  const present = await readdir(join(directory, "npm"));
  const missing = REQUIRED_PLATFORMS.filter(
    (platform) => !present.includes(`quest-${platform}`),
  );
  if (missing.length)
    throw new Error(
      `cannot build a candidate bundle without every platform package; missing: ${missing.join(", ")}`,
    );

  // The root package.json advertises every platform digest. In a bundle
  // assembled from artifacts each platform job built separately, the committed
  // values describe the PREVIOUS release, so they are re-derived here from the
  // binaries actually present. Same rule as everywhere else in this pipeline:
  // re-derive, never copy — two documents agreeing prove nothing about bytes.
  const rootPackagePath = join(directory, "package.json");
  const rootPackage = JSON.parse(await readFile(rootPackagePath, "utf8"));
  const platformDigests = {};
  for (const platform of REQUIRED_PLATFORMS) {
    const packageDirectory = join(directory, "npm", `quest-${platform}`);
    const manifest = JSON.parse(
      await readFile(join(packageDirectory, "package.json"), "utf8"),
    );
    const digest = sha256(
      await readFile(join(packageDirectory, "bin", executableFor(platform))),
    );
    if (manifest.questBinarySha256 !== digest)
      throw new Error(
        `${platform}: the binary does not match its own manifest — manifest ${manifest.questBinarySha256}, binary ${digest}`,
      );
    if (manifest.version !== version)
      throw new Error(
        `${platform}: package is version ${manifest.version}, root is ${version}`,
      );
    platformDigests[manifest.name] = digest;
  }
  rootPackage.questPlatformPackages = platformDigests;
  await writeFile(rootPackagePath, `${JSON.stringify(rootPackage, null, 2)}\n`);

  // A bundle names a sourceCommit. Whether it actually CARRIES that commit's
  // bytes is a separate question, and nothing here used to ask it.
  //
  // It matters because Bun's --compile output is not byte-reproducible: a
  // rebuilt binary can never equal the committed one, so a bundle assembled
  // from fresh builds names a commit whose bytes it does not contain. A
  // consumer then qualifies an artifact nobody will ship — which happened, and
  // was caught downstream by digest comparison rather than here.
  const rebuilt = [];
  for (const platform of REQUIRED_PLATFORMS) {
    const relative = `npm/quest-${platform}/bin/${executableFor(platform)}`;
    try {
      // `git diff --quiet` rather than hashing: these binaries are 60-95MB and
      // `git hash-object` on them gets SIGKILLed under the memory this runs in.
      // The comparison is the same one, done by git without materialising the
      // content anywhere.
      await execFile("git", ["diff", "--quiet", commit, "--", relative], {
        cwd: directory,
      });
    } catch (error) {
      // Exit 1 is "differs". Anything else — an unknown commit, a path that
      // does not exist at it — is not evidence of a rebuild, so it is ignored
      // rather than reported as one.
      if (error.code === 1) rebuilt.push(platform);
    }
  }
  // On a release ref this is fatal: the artifacts published are the committed
  // ones, so a bundle of rebuilds describes something else entirely.
  if (rebuilt.length && releaseRef)
    throw new Error(
      `refusing to build a release bundle from rebuilt artifacts; these are not the bytes committed at ${commit.slice(0, 7)}: ${rebuilt.join(", ")}`,
    );
  const artifactProvenance = rebuilt.length ? "rebuilt" : "committed";

  const tarballs = join(out, "tarballs");
  await rm(out, { recursive: true, force: true });
  await mkdir(tarballs, { recursive: true });
  await mkdir(join(out, "evidence"), { recursive: true });

  const digests = [];
  const packages = [];

  const rootRow = await pack(directory, tarballs, "package/bin/quest.cjs");
  if (rootRow.filename !== tarballName("@opum-ai/quest", version))
    throw new Error(
      `root archive is ${rootRow.filename}, expected ${tarballName("@opum-ai/quest", version)}`,
    );
  digests.push(rootRow);

  for (const platform of REQUIRED_PLATFORMS) {
    const name = `@opum-ai/quest-${platform}`;
    const row = await pack(
      join(directory, "npm", `quest-${platform}`),
      tarballs,
      `package/bin/${executableFor(platform)}`,
    );
    digests.push(row);
    packages.push({ name, tarball: row.filename });
  }

  await writeFile(
    join(tarballs, "sha256.txt"),
    `${digests.map((row) => `${row.digest}  ${row.filename}`).join("\n")}\n`,
  );
  await writeFile(
    join(out, "evidence", "package-metadata.json"),
    `${JSON.stringify(
      {
        sourceCommit: commit,
        version,
        // "committed" means every binary here is byte-identical to the blob at
        // sourceCommit — the bytes that publish. "rebuilt" means they are not,
        // and a consumer must not present the run as qualifying that commit.
        artifactProvenance,
        ...(rebuilt.length ? { rebuiltPlatforms: rebuilt } : {}),
        packages,
      },
      null,
      2,
    )}\n`,
  );
  return { version, commit, out, packages, digests, artifactProvenance };
}

async function main(argv) {
  const flag = (name) => {
    const index = argv.indexOf(name);
    if (index === -1) return undefined;
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${name} requires a value`);
    return value;
  };
  const commit =
    flag("--commit") ??
    process.env.GITHUB_SHA ??
    (await execFile("git", ["rev-parse", "HEAD"], { cwd: root })).stdout.trim();
  const out = resolve(flag("--out") ?? join(root, "candidate"));
  const built = await buildCandidateBundle({
    commit,
    out,
    releaseRef: (process.env.GITHUB_REF ?? "").startsWith("refs/tags/v"),
  });
  console.log(
    `Candidate bundle for ${built.version} at ${commit.slice(0, 7)}: ${built.digests.length} archives in ${out}`,
  );
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
