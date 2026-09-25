import { afterEach, beforeEach, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CliAgentPluginPort } from "../src/adapters/agents/cli-agent-plugins.ts";

/**
 * QCLI-371 review, finding 4: Bun's own spawn timeout sends one SIGTERM and
 * then waits for the output pipes, so a runtime whose grandchild holds
 * stdout, or which ignores TERM, hung init and --check far past the bound.
 * The adapter's deadline must return on time regardless. Finding 5: a spawn
 * failure is reported by its own cause; see the non-executable case below.
 */
let bin: string;
beforeEach(async () => {
  bin = await mkdtemp(join(tmpdir(), "qcli371-adapter-"));
  await mkdir(join(bin, "bin"));
});
afterEach(async () => {
  await rm(bin, { recursive: true, force: true });
});

async function script(name: string, body: string, mode = 0o755) {
  const path = join(bin, "bin", name);
  await writeFile(path, `#!/bin/sh\n${body}\n`);
  await chmod(path, mode);
}

function port(listTimeoutMs = 500) {
  return new CliAgentPluginPort(bin, {
    env: { PATH: `${join(bin, "bin")}:/usr/bin:/bin` },
    listTimeoutMs,
  });
}

test("a runtime whose grandchild holds stdout and which ignores TERM returns at the deadline", async () => {
  await script("claude", `trap '' TERM\nsleep 30 &\nsleep 30`);
  const started = Date.now();
  const listing = await port(500).list("claude");
  const elapsed = Date.now() - started;
  expect(listing).toMatchObject({ kind: "unavailable" });
  expect((listing as { reason: string }).reason).toContain(
    "did not finish within 0.5s",
  );
  expect(elapsed).toBeLessThan(3000);
});

test("a non-executable file on PATH is not an executable on PATH: Bun's lookup skips it (ENOENT), so the missing-binary reason is accurate", async () => {
  // Measured on Bun 1.3.14: spawning a bare name whose only PATH match is
  // mode 0644 throws ENOENT "Executable not found in $PATH"; EACCES arises
  // only for an absolute path, which this adapter never spawns.
  await script("claude", "echo []", 0o644);
  const listing = await port().list("claude");
  expect(listing).toEqual({
    kind: "unavailable",
    reason: "claude was not found on PATH.",
  });
});

test("a missing runtime is reported as missing from PATH", async () => {
  const listing = await port().list("codex");
  expect(listing).toEqual({
    kind: "unavailable",
    reason: "codex was not found on PATH.",
  });
});
