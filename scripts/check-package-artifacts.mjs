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
//      PROVEN AGAINST BOTH SHAPES SEPARATELY, which is the part that matters
//      and does not follow from the run count: one defect run reintroduces a
//      package-name-adjacent site (`@opum-ai/quest@0.6.0`) and the other a
//      `Status:`-style site whose nearest package name is on the NEXT line.
//      A gate proved twice against the same shape shows that it runs, not
//      that it catches; only the second shape distinguishes this rule from
//      the contract's scoped clause.
//
//      THIS RULE IS FREE ONLY WHILE THE README HAS ZERO VERSION TOKENS, and
//      that is a fact about today, not a property of the rule. The first
//      honest historical sentence -- "0.6.2 was published with ..." is a
//      true statement lore's README actually carries -- makes this rule
//      condemn something correct. WHEN THAT HAPPENS, MARK THE REGION. Do not
//      loosen `versionToken` or add an exemption: two implementations
//      loosening their own matchers independently is the exact drift the
//      contract's marked-region clause exists to bound, and the region below
//      is the intended escape hatch.
//   A4 NOT ENFORCED HERE, and cannot be. The post-publish read-back is a
//      confirmation, not a gate -- published version pages are immutable, so
//      it can only ever observe the defect. It belongs to the release
//      procedure and is tracked on QCLI-307, not to this script.
//   A3 CLAUSE 2 (byte-equality of a generated region) is VACUOUS HERE BY
//      CONSTRUCTION, which is not the same state as unenforced and should
//      not be read as a gap. Taking A2's "absent" arm means there is no
//      generator, so there is nothing for byte-equality to guard. lore-cli
//      takes the "generated" arm and is the only side enforcing that clause;
//      the two implementations therefore exercise disjoint parts of the
//      contract, and neither alone is evidence that it works. This is not
//      quest's inference: the contract itself says so. Read first-hand at
//      opum-doc main@b596ca5, docs/reference/shipped-readme-version-
//      assertions.md -- its table marks lore "yes -- the only side that
//      does" and quest "no -- vacuous by construction", and it requires a
//      vacuous clause to carry its REASON, because "vacuous because there is
//      no generator to break" and "vacuous because nobody implemented it"
//      are the same word for opposite situations.
//
// WHAT LORE ENFORCES, the other half of A5, so this side's entry is not half
// a picture.
//
// STATUS: DECIDED AND LOCALLY MEASURED. NOT proven in CI, and NOT to be
// cited as proven until lore-cli sends a green run. A previous revision of
// this block (07dcacb) claimed PROVEN and cited lore-cli PR #118, CI run
// 35016083790 on a390713c. THAT CITATION IS WITHDRAWN: the run completed as
// `failure` -- verified here at repos/opum-ai/lore-cli/actions/runs/
// 35016083790, conclusion=failure, one failing job
// `lint · typecheck · test (windows-latest)`, GNU tar on the Windows runner
// reading `C:\...` as a host:path remote spec. lore-cli sent the id while
// the run was still in_progress; it was the ADDRESS of a proof, not a proof.
// A record citing a failing run as evidence is worse than one citing
// nothing, because the id makes it look checked.
//
// The failure is quest's as much as lore's. The same commit that added this
// citation also re-resolved ODOC-203 first-hand specifically to avoid
// carrying a relay -- and then recorded a CI run id, in the adjacent
// paragraph, without opening it. The rule was applied to one citation and
// not the other in the same edit. An id is not a measurement; resolving it
// costs one API call.
//
// Their LOCAL measurements stand and are what the lines below record: two A1
// halves on real tarballs (a clean 0.7.0 pack exits 0; a 0.7.1 pack with the
// README left as post-tag bookkeeping exits 1 naming both regions -- the
// defect at the exact moment a 0.7.1 release would have shipped it), four
// planted clause-3 shapes each named by the wrong implementation it passes
// under, and a mutation matrix. Two matrix figures have already moved and
// are recorded as superseded rather than repeated: the suite is 23 tests,
// not 20, and gains a row for an inline-marker rendering check. Do not copy
// the old numbers forward.
//   A1 exercised -- read out of the real `npm pack` tarball, as here.
//   A2 GENERATED arm, in TWO marked regions, generated from `package.json`.
//      Two rather than one because lore's stale sites are not contiguous and
//      a single spanning region would swallow a paragraph of legitimate
//      historical version citations that no generator could reproduce from
//      `package.json` without fabricating them.
//   A3 clause 1 exercised per region; clause 2 exercised, and lore is the
//      only side that ever will exercise it, for the reason above.
//   A3 clause 3 exercised as BLOCK-scoped name-plus-version adjacency: a
//      block is a maximal run of lines delimited by a blank line or a bare
//      `>`, region lines are excised before evaluation, and the clause fails
//      when one block holds both the package's own npm name and a semver
//      token. Strictly stronger than the landed floor and strictly weaker
//      than quest's no-token rule -- necessarily so, since nine of lore's
//      README tokens are legitimate.
//   A4 exercised, naming package and version.
//
// One divergence that is a CODE fact here, not a policy one: the region
// support below handles exactly ONE marker pair. lore needs two. If quest
// ever needs a second region, that is a change to this file rather than a
// change to the README.
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

  const occurrences = (marker) => packedReadme.split(marker).length - 1;
  const starts = occurrences(versionClaimStart);
  const ends = occurrences(versionClaimEnd);
  // Ported from lore-cli's `locateRegions` (LCLI-510), which refuses an
  // ambiguous extent rather than resolving it. Without this, a second marker
  // pair here still fails -- the second region falls OUTSIDE the first and
  // trips the stray-version check below -- but it fails with the wrong
  // diagnosis, reporting a version "outside a version-claim region" when the
  // version is in fact inside the second one. A correct refusal with a
  // misleading message is the expensive kind to debug.
  if (starts > 1 || ends > 1)
    throw new Error(
      `The packed README has ${starts} opening and ${ends} closing version-claim ` +
        "markers. This check supports exactly one region and cannot tell which " +
        "extent you meant. Use one region, or extend this check to handle several.",
    );
  // A marker whose line CONTENT begins with `<!--` opens a CommonMark HTML
  // block, which swallows the rest of that line as raw text: a marker written
  // as `- <!-- ... -->` or `> <!-- ... -->` renders the surrounding prose
  // literally, asterisks and all, on the npm page. Found by lore-cli
  // (2026-09-15) with GitHub's own POST /markdown, on a README where every
  // A3 clause passed while the served page showed `**Status: ... released.**`
  // verbatim. No version assertion can see it, because the bytes are correct
  // and only the rendering is wrong.
  //
  // This repository has no markers today, so it cannot currently be hit --
  // but the docblock above instructs a future editor to add one, and a
  // list item or blockquote is exactly where a version claim tends to live.
  // Refusing here turns that trap into an error at the moment it is
  // introduced, rather than a literal-asterisks npm page nobody can correct
  // afterwards. Anchor the marker AFTER hand-written text on its line.
  for (const line of packedReadme.split("\n")) {
    const content = line.replace(/^\s*(?:[>\-*+]\s*|\d+\.\s+)+/, "");
    if (
      content.startsWith(versionClaimStart) ||
      content.startsWith(versionClaimEnd)
    ) {
      if (content !== line)
        throw new Error(
          `The packed README has a version-claim marker opening the content of a ` +
            `list or blockquote line: ${JSON.stringify(line.trim().slice(0, 60))}. ` +
            "That starts a CommonMark HTML block and the rest of the line renders " +
            "as raw text on the npm page, while every version assertion still " +
            "passes. Put the marker after the line's hand-written text instead.",
        );
    }
  }

  const start = packedReadme.indexOf(versionClaimStart);
  const end = packedReadme.indexOf(versionClaimEnd);
  if ((start === -1) !== (end === -1))
    throw new Error(
      "The packed README has one version-claim marker without the other.",
    );
  if (start !== -1 && end < start)
    throw new Error(
      "The packed README's version-claim markers are in the wrong order.",
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
