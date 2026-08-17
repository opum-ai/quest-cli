import { readdir, readFile } from "node:fs/promises";
import { extname, join, normalize, relative } from "node:path";

const sourceRoot = "src";
const compositionRoot = normalize("cli/composition.ts");
const allowedDependencies = new Map([
  ["cli", new Set(["application"])],
  ["application", new Set(["domain", "ports"])],
  ["domain", new Set()],
  ["ports", new Set(["domain"])],
  ["adapters", new Set(["domain", "ports"])],
]);

async function collectTypeScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return collectTypeScriptFiles(path);
      return extname(entry.name) === ".ts" ? [path] : [];
    }),
  );
  return files.flat();
}

function layerFor(path) {
  return normalize(path).split(/[\\/]/u)[0];
}

function relativeImportTargets(source) {
  return [...source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)].map(
    ([, target]) => target,
  );
}

const files = await collectTypeScriptFiles(sourceRoot);
const violations = [];

for (const file of files) {
  const sourcePath = normalize(relative(sourceRoot, file));
  const sourceLayer = layerFor(sourcePath);
  const source = await readFile(file, "utf8");
  for (const target of relativeImportTargets(source)) {
    const targetLayer = layerFor(
      relative(sourceRoot, join(file, "..", target)),
    );
    if (
      targetLayer !== sourceLayer &&
      !allowedDependencies.get(sourceLayer)?.has(targetLayer) &&
      !(sourcePath === compositionRoot && targetLayer === "adapters")
    ) {
      violations.push(
        `${file} (${sourceLayer}) must not import ${target} (${targetLayer})`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(`Quest layer boundary violations:\n${violations.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(
    `Layer check passed for ${files.length} TypeScript source files.`,
  );
}
