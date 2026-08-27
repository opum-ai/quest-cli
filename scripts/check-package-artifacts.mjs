import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
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
  ["LICENSE", "bin/quest.cjs", "package.json"].join(",")
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
