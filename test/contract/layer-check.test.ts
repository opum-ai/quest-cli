import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const roots: string[] = [];
const checker = resolve(import.meta.dir, "../../scripts/check-layers.mjs");

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});

async function runLayerCheck(root: string) {
  const process = Bun.spawn(["bun", checker], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    process.exited,
    new Response(process.stdout).text(),
    new Response(process.stderr).text(),
  ]);
  return { exitCode, stdout, stderr };
}

test("only the explicit CLI composition root may import concrete adapters", async () => {
  const root = await mkdtemp(join(tmpdir(), "quest-layer-check-"));
  roots.push(root);
  await mkdir(join(root, "src", "cli"), { recursive: true });
  await mkdir(join(root, "src", "adapters"), { recursive: true });
  await writeFile(join(root, "src", "adapters", "example.ts"), "export {};\n");
  await writeFile(
    join(root, "src", "cli", "composition.ts"),
    'import "../adapters/example.ts";\n',
  );

  expect(await runLayerCheck(root)).toMatchObject({ exitCode: 0 });

  await writeFile(
    join(root, "src", "cli", "ordinary.ts"),
    'import "../adapters/example.ts";\n',
  );
  const rejected = await runLayerCheck(root);
  expect(rejected.exitCode).toBe(1);
  expect(rejected.stderr).toContain(
    "src/cli/ordinary.ts (cli) must not import ../adapters/example.ts (adapters)",
  );
});
