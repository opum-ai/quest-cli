import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const npmCache = join(tmpdir(), "quest-npm-cache");

function packedEntry(result) {
  return Array.isArray(result) ? result[0] : Object.values(result)[0];
}

const rootPackage = JSON.parse(
  await readFile(join(root, "package.json"), "utf8"),
);
const packages = await readdir(join(root, "npm"));
const names = Object.keys(rootPackage.optionalDependencies ?? {}).sort();
if (packages.length !== 6 || names.length !== 6)
  throw new Error(
    "Quest must declare and build exactly six platform packages.",
  );

for (const directory of packages.sort()) {
  const manifest = JSON.parse(
    await readFile(join(root, "npm", directory, "package.json"), "utf8"),
  );
  const expected = `@opum-ai/${directory}`;
  if (
    manifest.name !== expected ||
    rootPackage.optionalDependencies[expected] !== rootPackage.version
  )
    throw new Error(
      `Version or optional-dependency mismatch for ${directory}.`,
    );
  if (
    manifest.version !== rootPackage.version ||
    manifest.license !== rootPackage.license ||
    manifest.repository?.url !== rootPackage.repository?.url
  )
    throw new Error(`Package metadata mismatch for ${directory}.`);
  if (
    !Array.isArray(manifest.os) ||
    !Array.isArray(manifest.cpu) ||
    manifest.os.length !== 1 ||
    manifest.cpu.length !== 1
  )
    throw new Error(`Platform constraints are incomplete for ${directory}.`);
  const suffix = directory.replace(/^quest-/, "");
  if (`${manifest.os[0]}-${manifest.cpu[0]}` !== suffix)
    throw new Error(
      `Platform constraints do not match package suffix for ${directory}.`,
    );
  const executable = manifest.os[0] === "win32" ? "quest.exe" : "quest";
  const binary = join(root, "npm", directory, "bin", executable);
  if (!(await stat(binary)).isFile())
    throw new Error(`Missing binary for ${directory}.`);
  const digest = createHash("sha256")
    .update(await readFile(binary))
    .digest("hex");
  if (
    manifest.questBinarySha256 !== digest ||
    rootPackage.questPlatformPackages?.[manifest.name] !== digest
  )
    throw new Error(`Checksum failed for ${directory}.`);
  const packed = await Bun.$`npm pack --dry-run --json --cache ${npmCache}`
    .cwd(join(root, "npm", directory))
    .json();
  const files = packedEntry(packed)
    ?.files?.map((file) => file.path)
    .sort();
  if (
    files?.join(",") !==
    ["LICENSE", `bin/${executable}`, "package.json"].join(",")
  )
    throw new Error(
      `Unexpected published files in ${directory}: ${files?.join(",")}`,
    );
}
const rootPacked = await Bun.$`npm pack --dry-run --json --cache ${npmCache}`
  .cwd(root)
  .json();
const rootFiles = packedEntry(rootPacked)
  ?.files?.map((file) => file.path)
  .sort();
if (
  rootFiles?.join(",") !==
  ["LICENSE", "README.md", "bin/quest.cjs", "package.json"].join(",")
)
  throw new Error(`Unexpected root package files: ${rootFiles?.join(",")}`);

if (
  rootPackage.private ||
  rootPackage.bin?.quest !== "./bin/quest.cjs" ||
  rootPackage.engines?.node === undefined ||
  rootPackage.engines?.bun !== undefined
)
  throw new Error(
    "Root package must be a Node launcher without a Bun runtime dependency.",
  );

// ---------------------------------------------------------------------------
// Shipped-README version assertions.
//
// Contract: opum-doc `docs/reference/shipped-readme-version-assertions.md`
// (ODOC-201), agreed between quest-cli and lore-cli 2026-09-15. A5 of that
// contract requires each implementation to record which assertions it
// enforces and where; this block is quest's record.
//
//   A1 ENFORCED HERE. The subject is README.md as it exists inside the
//      publishable tarball, read back out of a real `npm pack`, never the
//      working-tree file -- a check on the repo copy passes while the packed
//      one is stale, and the packed one is what the registry serves. The set
//      of subjects is declared, not discovered: `files` on the root package
//      is a closed list, the six platform packages declare
//      `files: ["bin/<executable>"]` and ship no README, and the assertion
//      just above this one fails if either list changes.
//   A2 ENFORCED HERE, by the "absent" arm rather than the generated one. The
//      README states no version of its own; the number lives in
//      package.json, in the tags and on the npm page, all of which are
//      maintained already.
//   A3 ENFORCED HERE, in a STRONGER form than the contract requires, and the
//      difference is deliberate. The contract scopes clause 3 to "the
//      package's own name adjacent to a version". That is too weak for this
//      README: the stale claim it was written to catch spanned three lines,
//      and its worst site -- `**Status: 0.6.0 released.**` -- carried the
//      version on a line with no package name on it at all. So quest forbids
//      a version-shaped token ANYWHERE in the packed README, outside an
//      optional marked region. Measured before choosing it: after this
//      change the packed README contains zero version-shaped tokens, so the
//      stronger rule costs nothing today. Should a legitimate one ever be
//      needed -- a Node floor, a historical citation -- it goes inside the
//      marked region, which is a deliberate act rather than a silent
//      loosening of the matcher. lore-cli cannot use this form (nine
//      legitimate version tokens in its README) and implements the
//      contract's scoped clause instead; that divergence is expected and is
//      why A5 exists.
//   A4 NOT ENFORCED HERE, and cannot be. The post-publish read-back is a
//      confirmation, not a gate -- published version pages are immutable, so
//      it can only ever observe the defect. It belongs to the release
//      procedure and is tracked on QCLI-307, not to this script.
//
// The markers are honoured if present so that adding a legitimate version is
// a one-line, visible decision. They are absent today by design.
const versionClaimStart = "<!-- quest:version-claims -->";
const versionClaimEnd = "<!-- /quest:version-claims -->";
const versionToken = /\d+\.\d+\.\d+/;

const packDirectory = await mkdtemp(join(tmpdir(), "quest-readme-pack-"));
try {
  const tarball = packedEntry(
    await Bun.$`npm pack --json --pack-destination ${packDirectory} --cache ${npmCache}`
      .cwd(root)
      .json(),
  )?.filename;
  if (!tarball) throw new Error("npm pack produced no tarball to inspect.");
  const packedReadme =
    await Bun.$`tar -xzOf ${join(packDirectory, tarball)} package/README.md`.text();

  const start = packedReadme.indexOf(versionClaimStart);
  const end = packedReadme.indexOf(versionClaimEnd);
  if ((start === -1) !== (end === -1))
    throw new Error(
      "The packed README has one version-claim marker without the other.",
    );

  if (start !== -1) {
    // A3 clauses 1 and 2: the region is present and states this version.
    const region = packedReadme.slice(start + versionClaimStart.length, end);
    if (!region.includes(rootPackage.version))
      throw new Error(
        `The packed README's version-claim region does not state ${rootPackage.version}.`,
      );
  }

  // A3 clause 3: nothing version-shaped survives outside the region. This is
  // the clause that catches the site you did not think to mark.
  const outside =
    start === -1
      ? packedReadme
      : packedReadme.slice(0, start) +
        packedReadme.slice(end + versionClaimEnd.length);
  const stray = outside.match(versionToken);
  if (stray)
    throw new Error(
      `The packed README states a version (${stray[0]}) outside a version-claim region. ` +
        "README.md ships in the tarball, so this is what the npm page will advertise for " +
        "this version forever -- registry version pages are immutable and cannot be " +
        "corrected by republishing. Remove it, or move it inside " +
        `${versionClaimStart} ... ${versionClaimEnd}.`,
    );
} finally {
  await rm(packDirectory, { recursive: true, force: true });
}
