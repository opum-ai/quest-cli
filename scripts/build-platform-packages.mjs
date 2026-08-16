import { createHash } from "node:crypto";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const rootPackagePath = join(root, "package.json");
const rootPackage = JSON.parse(await readFile(rootPackagePath, "utf8"));
const version = rootPackage.version;
const checksums = {};
const targetDirectory = process.env.QUEST_BUN_TARGETS_DIR;
const platforms = [
  ["darwin", "arm64"],
  ["darwin", "x64"],
  ["linux", "arm64"],
  ["linux", "x64"],
  ["win32", "arm64"],
  ["win32", "x64"],
];

for (const [os, cpu] of platforms) {
  const directory = join(root, "npm", `quest-${os}-${cpu}`);
  const executable = os === "win32" ? "quest.exe" : "quest";
  const binary = join(directory, "bin", executable);
  await rm(directory, { recursive: true, force: true });
  await mkdir(dirname(binary), { recursive: true });
  const targetArchitecture = cpu === "arm64" ? "aarch64" : cpu;
  const targetExecutable =
    targetDirectory && !(os === process.platform && cpu === process.arch)
      ? join(
          targetDirectory,
          `bun-${os === "win32" ? "windows" : os}-${targetArchitecture}`,
          os === "win32" ? "bun.exe" : "bun",
        )
      : undefined;
  const result = Bun.spawnSync(
    [
      Bun.which("bun"),
      "build",
      "--compile",
      `--target=bun-${os}-${cpu}`,
      ...(targetExecutable
        ? [`--compile-executable-path=${targetExecutable}`]
        : []),
      "src/cli/main.ts",
      `--outfile=${binary}`,
    ],
    { cwd: root, stdout: "inherit", stderr: "inherit" },
  );
  if (result.exitCode !== 0) process.exit(result.exitCode);
  if (os !== "win32") await chmod(binary, 0o755);
  const sha256 = createHash("sha256")
    .update(await readFile(binary))
    .digest("hex");
  const name = `@opum-ai/quest-${os}-${cpu}`;
  checksums[name] = sha256;
  await writeFile(
    join(directory, "package.json"),
    `${JSON.stringify(
      {
        name,
        version,
        description: `Quest CLI binary for ${os}-${cpu}.`,
        license: "MIT",
        repository: {
          type: "git",
          url: "git+https://github.com/opum-ai/quest-cli.git",
        },
        os: [os],
        cpu: [cpu],
        files: [`bin/${executable}`],
        questBinarySha256: sha256,
      },
      null,
      2,
    )}\n`,
  );
  await copyFile(join(root, "LICENSE"), join(directory, "LICENSE"));
}

rootPackage.questPlatformPackages = checksums;
await writeFile(rootPackagePath, `${JSON.stringify(rootPackage, null, 2)}\n`);
