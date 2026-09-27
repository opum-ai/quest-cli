import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  checkVersionParity,
  PEER,
  readPeerVersion,
  requireVersionParity,
} from "../scripts/qualification/version-parity.mjs";

/**
 * QCLI-386, constitution Article 3 clause 6: each CLI's release workflow
 * refuses to publish when the lore and quest version numbers differ.
 */

const repo = join(import.meta.dir, "..");
const answering = (stdout: string) => async () => ({ stdout });

test("the peer is lore-cli's package.json on main", () => {
  expect(PEER).toEqual({
    repository: "opum-ai/lore-cli",
    ref: "main",
    packageName: "@opum-ai/lore",
  });
});

test("matching versions pass and say what was compared", async () => {
  const verdict = await requireVersionParity({
    version: "0.11.0",
    read: async () => ({
      version: "0.11.0",
      source: "opum-ai/lore-cli@main:package.json",
    }),
  });
  expect(verdict.ok).toBe(true);
  if (verdict.ok) expect(verdict.message).toContain("lore 0.11.0");
});

test("a mismatch refuses and names both versions and the ref read", () => {
  const verdict = checkVersionParity({
    version: "0.11.0",
    peerRead: {
      version: "0.9.3",
      source: "opum-ai/lore-cli@main:package.json",
    },
  });
  expect(verdict.ok).toBe(false);
  if (verdict.ok) return;
  expect(verdict.problem).toContain("quest is 0.11.0");
  expect(verdict.problem).toContain("lore is 0.9.3");
  expect(verdict.problem).toContain("opum-ai/lore-cli@main");
});

test("a read failure refuses rather than passes", async () => {
  const read = await readPeerVersion({
    execFile: async () => {
      throw Object.assign(new Error("fail"), {
        stderr: "gh: Not Found (HTTP 404)",
      });
    },
  });
  expect(read.version).toBeNull();
  const verdict = checkVersionParity({ version: "0.11.0", peerRead: read });
  expect(verdict.ok).toBe(false);
  if (!verdict.ok) expect(verdict.problem).toContain("HTTP 404");
});

test("malformed JSON, another package, and a missing version all refuse", async () => {
  for (const stdout of [
    "<html>",
    JSON.stringify({ name: "@opum-ai/quest", version: "0.11.0" }),
    JSON.stringify({ name: "@opum-ai/lore" }),
  ]) {
    const read = await readPeerVersion({ execFile: answering(stdout) });
    expect(read.version).toBeNull();
    expect(checkVersionParity({ version: "0.11.0", peerRead: read }).ok).toBe(
      false,
    );
  }
});

test("a well-formed lore manifest is read", async () => {
  const read = await readPeerVersion({
    execFile: answering(
      JSON.stringify({ name: "@opum-ai/lore", version: "0.11.0" }),
    ),
  });
  expect(read).toEqual({
    version: "0.11.0",
    source: "opum-ai/lore-cli@main:package.json",
  });
});

test("the local publisher checks parity before any receipt, credential or publish", async () => {
  const source = await readFile(
    join(repo, "scripts", "publish-release.mjs"),
    "utf8",
  );
  const parity = source.indexOf("await requireVersionParity(");
  expect(parity).toBeGreaterThan(-1);
  for (const later of [
    "validateReceipt(receipt",
    "await resolveToken()",
    "await publishPlatformsThenWrapper({",
  ])
    expect(parity).toBeLessThan(source.indexOf(later));
  // Not behind the dry-run switch: a dry run answers "would this publish".
  expect(source.slice(0, parity)).not.toMatch(/if \(!dryRun\)\s*$/);
});

test("release.yml runs the parity gate before its first npm publish", async () => {
  const workflow = await readFile(
    join(repo, ".github", "workflows", "release.yml"),
    "utf8",
  );
  const gate = workflow.indexOf(
    "scripts/qualification/version-parity.mjs --require",
  );
  expect(gate).toBeGreaterThan(-1);
  expect(gate).toBeLessThan(workflow.indexOf('npm publish "'));
});
