import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  changelogSection,
  type ExecFile,
  ensureGitHubRelease,
  releaseTitle,
} from "../scripts/github-release.mjs";

/**
 * QCLI-398 (opum-agent OPAG-646): GitHub Releases stopped at v0.6.0 because
 * nothing in the release flow cut one. promote-release.mjs now does, through
 * these functions, once npm `latest` is verified moved.
 */

const CHANGELOG = [
  "# Changelog",
  "",
  "## Unreleased",
  "",
  "## 0.10.0 - 2026-09-24",
  "",
  "Ten.",
  "",
  "## 0.1.10 - 2026-08-20",
  "",
  "Not a version 0.1.1 should match.",
  "",
  "## 0.1.1 - 2026-08-17",
  "",
  "One.",
  "",
  "## 0.0.9 - 2026-08-01 (tagged, never published)",
  "",
  "Never shipped.",
].join("\n");

test("extraction: a dated heading's section, up to the next heading", () => {
  expect(changelogSection(CHANGELOG, "0.10.0")).toEqual({
    heading: "## 0.10.0 - 2026-09-24",
    body: "Ten.",
  });
});

test("extraction: 0.1.1 does not match the 0.1.10 heading listed above it", () => {
  expect(changelogSection(CHANGELOG, "0.1.1")?.body).toBe("One.");
  expect(changelogSection(CHANGELOG, "0.1.10")?.body).toBe(
    "Not a version 0.1.1 should match.",
  );
});

test("extraction: an absent or empty section is null, not an empty release", () => {
  expect(changelogSection(CHANGELOG, "9.9.9")).toBeNull();
  expect(changelogSection(CHANGELOG, "Unreleased")).toBeNull();
});

test("extraction: every dated version heading in the real CHANGELOG yields notes", () => {
  const real = readFileSync(
    new URL("../CHANGELOG.md", import.meta.url),
    "utf8",
  );
  const versions = [...real.matchAll(/^## (\d+\.\d+\.\d+)/gm)].map((m) => m[1]);
  expect(versions.length).toBeGreaterThan(0);
  for (const version of versions)
    expect(changelogSection(real, version)?.body.length ?? 0).toBeGreaterThan(
      0,
    );
});

test("title: a never-published heading says so", () => {
  expect(releaseTitle("0.10.0", "## 0.10.0 - 2026-09-24")).toBe(
    "Quest CLI 0.10.0",
  );
  expect(
    releaseTitle("0.0.9", "## 0.0.9 - 2026-08-01 (tagged, never published)"),
  ).toBe("Quest CLI 0.0.9 (tagged, never published)");
});

const gh = (respond: (args: readonly string[]) => void) => {
  const calls: string[][] = [];
  const execFile: ExecFile = async (_file, args) => {
    calls.push([...args]);
    respond(args);
    return { stdout: "" };
  };
  return { calls, execFile };
};
const notFound = (args: readonly string[]) => {
  if (args[1] === "view")
    throw Object.assign(new Error("exit 1"), { stderr: "release not found\n" });
};

test("create: an absent release is created from the notes, host pinned, tag verified, marked latest", async () => {
  const { calls, execFile } = gh(notFound);
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    execFile,
  });
  expect(out).toMatchObject({ ok: true, action: "created" });
  const create = calls.find((args) => args[1] === "create");
  expect(create).toBeDefined();
  expect(create).toContain("v1.2.3");
  expect(create).toContain("--verify-tag");
  expect(create).toContain("--latest=true");
  expect(create?.slice(create.indexOf("-R"), create.indexOf("-R") + 2)).toEqual(
    ["-R", "github.com/opum-ai/quest-cli"],
  );
});

test("create: --not-latest backfill passes --latest=false", async () => {
  const { calls, execFile } = gh(notFound);
  await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    latest: false,
    execFile,
  });
  expect(calls.find((args) => args[1] === "create")).toContain(
    "--latest=false",
  );
});

test("already exists: never recreated or re-noted; marked latest when asked", async () => {
  const { calls, execFile } = gh(() => {});
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    execFile,
  });
  expect(out).toMatchObject({ ok: true, action: "marked-latest" });
  expect(calls.some((args) => args[1] === "create")).toBe(false);
  expect(calls.find((args) => args[1] === "edit")).toEqual([
    "release",
    "edit",
    "v1.2.3",
    "-R",
    "github.com/opum-ai/quest-cli",
    "--latest",
  ]);
});

test("already exists, not latest: left exactly as is", async () => {
  const { calls, execFile } = gh(() => {});
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    latest: false,
    execFile,
  });
  expect(out).toMatchObject({ ok: true, action: "exists" });
  expect(calls.map((args) => args[1])).toEqual(["view"]);
});

test("dry run: reads, never writes", async () => {
  const { calls, execFile } = gh(notFound);
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    dryRun: true,
    execFile,
  });
  expect(out).toMatchObject({ ok: true, action: "would-create" });
  expect(calls.map((args) => args[1])).toEqual(["view"]);
});

test("failure: a failed create is returned, not thrown", async () => {
  const { execFile } = gh((args) => {
    notFound(args);
    if (args[1] === "create")
      throw Object.assign(new Error("exit 1"), {
        stderr: "HTTP 403: forbidden\n",
      });
  });
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    execFile,
  });
  expect(out.ok).toBe(false);
  expect(out.detail).toContain("HTTP 403");
});

test("failure: an unreadable release state refuses rather than assuming absent", async () => {
  const { calls, execFile } = gh((args) => {
    if (args[1] === "view")
      throw Object.assign(new Error("exit 1"), {
        stderr: "error connecting to github.com\n",
      });
  });
  const out = await ensureGitHubRelease({
    version: "1.2.3",
    notes: "N",
    execFile,
  });
  expect(out.ok).toBe(false);
  expect(calls.some((args) => args[1] === "create")).toBe(false);
});
