import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { expectedTarballNames } from "../scripts/qualification/e2e-receipt.mjs";
import {
  evaluatePairReceipt,
  observeRegistry,
  resolveTagCommit,
  PAIR_RECEIPT_KIND,
  pairReceiptPath,
  requirePairQualification,
} from "../scripts/qualification/pair-receipt.mjs";

/**
 * QCLI-388, opum-agent ruling A on OPAG-465: `latest` moves only on
 * opum-cli-e2e's machine-readable verdict on the STAGED pair, installed from
 * the registry. Schema: opum-ai/opum-cli-e2e#298 (head 36a6862),
 * receipts/README.md "Pair receipts" and "What a reader must do" 1-4.
 */

const V = "9.9.9";
const HEAD = "a".repeat(40);
const names = expectedTarballNames(V);
const integrity = (name: string) => `sha512-${name}`;
const observed = {
  gitHead: null,
  commit: HEAD,
  commitSource: "opum-ai/quest-cli tag v9.9.9",
  integrities: Object.fromEntries(names.map((name) => [name, integrity(name)])),
};

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    kind: PAIR_RECEIPT_KIND,
    pair: {
      lore: { version: V, commit: "b".repeat(40), tarballs: {} },
      quest: {
        version: V,
        commit: HEAD,
        tarballs: Object.fromEntries(
          names.map((name) => [
            name,
            { sha256: "c".repeat(64), distIntegrity: integrity(name) },
          ]),
        ),
      },
    },
    installedFrom: {
      lore: { source: "registry", distTags: ["release-candidate"] },
      quest: { source: "registry", distTags: ["release-candidate"] },
    },
    verdict: "QUALIFIED",
    ...overrides,
  };
}

const verdictOf = (doc: unknown) =>
  evaluatePairReceipt(doc, { version: V, observed });

test("the receipt lives at receipts/pair/<version>.json", () => {
  expect(pairReceiptPath("0.11.0")).toBe("receipts/pair/0.11.0.json");
});

test("a QUALIFIED receipt for this exact pair, matching npm, passes", () => {
  const result = verdictOf(receipt());
  expect(result.problems).toEqual([]);
  expect(result.ok).toBe(true);
  expect(result.override).toBeNull();
});

test("a FAIL verdict refuses", () => {
  const result = verdictOf(receipt({ verdict: "NOT QUALIFIED" }));
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain('not "QUALIFIED"');
});

test("a four-field override passes and is returned for printing; a partial one refuses", () => {
  const full = { by: "op", reason: "r", task: "TASK-1", adr: "x.md@abc" };
  const waived = verdictOf(
    receipt({ verdict: "NOT QUALIFIED", override: full }),
  );
  expect(waived.ok).toBe(true);
  expect(waived.override).toEqual(full);
  const partial = verdictOf(
    receipt({ verdict: "NOT QUALIFIED", override: { by: "op" } }),
  );
  expect(partial.ok).toBe(false);
});

test("a receipt for a different pairing refuses: lore at another version", () => {
  const doc = receipt();
  doc.pair.lore.version = "9.9.8";
  const result = verdictOf(doc);
  expect(result.ok).toBe(false);
  expect(result.problems).toHaveLength(1);
  expect(result.problems[0]).toContain("pair.lore.version");
});

test("a receipt for another quest version refuses", () => {
  const doc = receipt();
  doc.pair.quest.version = "9.9.8";
  expect(verdictOf(doc).ok).toBe(false);
});

test("an unrecognized kind refuses rather than being guessed at", () => {
  expect(verdictOf(receipt({ kind: "opum.qualification-receipt.v1" })).ok).toBe(
    false,
  );
});

test("a commit that is not npm's gitHead refuses, and so does an unreadable gitHead", () => {
  const doc = receipt();
  doc.pair.quest.commit = "d".repeat(40);
  expect(verdictOf(doc).ok).toBe(false);
  const blind = evaluatePairReceipt(receipt(), {
    version: V,
    observed: { ...observed, commit: null },
  });
  expect(blind.ok).toBe(false);
});

test("a verdict not taken from registry installs refuses", () => {
  const doc = receipt();
  doc.installedFrom.quest.source = "candidate-bundle";
  expect(verdictOf(doc).ok).toBe(false);
});

test("a missing archive, an extra archive and a changed digest each refuse", () => {
  const missing = receipt();
  delete (missing.pair.quest.tarballs as Record<string, unknown>)[
    names[0] as string
  ];
  expect(verdictOf(missing).ok).toBe(false);

  const extra = receipt();
  (extra.pair.quest.tarballs as Record<string, unknown>)[
    "opum-ai-quest-extra-9.9.9.tgz"
  ] = {
    distIntegrity: "sha512-x",
  };
  expect(verdictOf(extra).ok).toBe(false);

  // Something else staged under the same version after qualification.
  const moved = evaluatePairReceipt(receipt(), {
    version: V,
    observed: {
      ...observed,
      integrities: {
        ...observed.integrities,
        [names[3] as string]: "sha512-other",
      },
    },
  });
  expect(moved.ok).toBe(false);
  expect(moved.problems).toHaveLength(1);

  // npm serving nothing for one package is not a match.
  const { [names[5] as string]: _dropped, ...partial } = observed.integrities;
  expect(
    evaluatePairReceipt(receipt(), {
      version: V,
      observed: { ...observed, integrities: partial },
    }).ok,
  ).toBe(false);
});

test("a document that is not an object refuses", () => {
  expect(verdictOf(null).ok).toBe(false);
  expect(verdictOf([]).ok).toBe(false);
});

test("no receipt (404, 403, network) refuses and names where it looked", async () => {
  const result = await requirePairQualification({
    version: V,
    packages: [],
    fetch: async () => ({
      doc: null,
      source: "opum-ai/opum-cli-e2e@main:receipts/pair/9.9.9.json",
      error: "HTTP 404",
    }),
    observe: async () => observed,
  });
  expect(result.ok).toBe(false);
  expect(result.problems[0]).toContain("receipts/pair/9.9.9.json");
  expect(result.problems[0]).toContain("HTTP 404");
});

// QCLI-393. The exact shapes the live registry and GitHub API returned for
// quest 0.11.0 on 2026-09-27 (npm 12.0.2; opum-agent re-read on npm 12.1.0):
// a whole-version view is a ONE-element array of one object with NO gitHead
// key (a tarball publish records none), and v0.11.0 is an annotated tag,
// ref -> tag object 84cc917 -> commit eb1d9f4.
const TAG_OBJECT = "84cc917d52b8c60a66b19b07b34e1bfc5875ebc2";
const RELEASE = "eb1d9f466db49f03c763f94c06347e78b969eab5";
const QUEST_PACKAGES = [
  "@opum-ai/quest-darwin-arm64",
  "@opum-ai/quest-darwin-x64",
  "@opum-ai/quest-linux-arm64",
  "@opum-ai/quest-linux-x64",
  "@opum-ai/quest-win32-arm64",
  "@opum-ai/quest-win32-x64",
  "@opum-ai/quest",
];
const integrityOf = (name: string) => `sha512-${name}`;

function liveShapes({
  gitHead,
  peelTo = RELEASE,
  tagMissing = false,
}: {
  gitHead?: string;
  peelTo?: string;
  tagMissing?: boolean;
} = {}) {
  return async (command: string, args: readonly string[]) => {
    if (command === "npm") {
      const name = String(args[1]).replace(/@9\.9\.9$/, "");
      const meta: Record<string, unknown> = {
        name,
        version: V,
        dist: { integrity: integrityOf(name) },
      };
      if (gitHead) meta.gitHead = gitHead;
      return { stdout: JSON.stringify([meta]) };
    }
    const path = String(args.at(-1));
    if (path.endsWith("git/ref/tags/v9.9.9")) {
      if (tagMissing)
        throw Object.assign(new Error("x"), {
          stderr: "gh: Not Found (HTTP 404)",
        });
      return {
        stdout: JSON.stringify({
          ref: "refs/tags/v9.9.9",
          object: { type: "tag", sha: TAG_OBJECT },
        }),
      };
    }
    if (path.endsWith(`git/tags/${TAG_OBJECT}`))
      return {
        stdout: JSON.stringify({
          sha: TAG_OBJECT,
          object: { type: "commit", sha: peelTo },
        }),
      };
    throw new Error(`unexpected ${command} ${args.join(" ")}`);
  };
}

function pairReceiptFor(commit: string) {
  const doc = receipt();
  doc.pair.quest.commit = commit;
  doc.pair.quest.tarballs = Object.fromEntries(
    QUEST_PACKAGES.map((name) => [
      `${name.replace("@", "").replace("/", "-")}-${V}.tgz`,
      { sha256: "c".repeat(64), distIntegrity: integrityOf(name) },
    ]),
  );
  return doc;
}

async function gate(execFile: ReturnType<typeof liveShapes>, commit = RELEASE) {
  return requirePairQualification({
    version: V,
    packages: QUEST_PACKAGES,
    fetch: async () => ({ doc: pairReceiptFor(commit), source: "fixture" }),
    observe: (v) => observeRegistry(v, QUEST_PACKAGES, { execFile }),
  });
}

test("QCLI-393: the tarball-published shape (no gitHead, annotated tag) reads all seven and passes", async () => {
  const observed = await observeRegistry(V, QUEST_PACKAGES, {
    execFile: liveShapes(),
  });
  expect(Object.keys(observed.integrities)).toHaveLength(7);
  expect(observed.gitHead).toBeNull();
  expect(observed.commit).toBe(RELEASE);
  const result = await gate(liveShapes());
  expect(result.problems).toEqual([]);
  expect(result.ok).toBe(true);
});

test("QCLI-393: a tag that peels to another commit refuses", async () => {
  const result = await gate(liveShapes({ peelTo: "d".repeat(40) }));
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("tag v9.9.9 resolves to");
});

test("QCLI-393: a missing or unreadable tag refuses; it is never a match", async () => {
  const result = await gate(liveShapes({ tagMissing: true }));
  expect(result.ok).toBe(false);
  expect(result.problems.join("\n")).toContain("HTTP 404");
});

test("QCLI-393: a recorded gitHead that agrees passes; one that disagrees with the tag refuses", async () => {
  expect((await gate(liveShapes({ gitHead: RELEASE }))).ok).toBe(true);
  const disagree = await gate(liveShapes({ gitHead: "e".repeat(40) }));
  expect(disagree.ok).toBe(false);
  expect(disagree.problems.join("\n")).toContain("npm records gitHead");
});

test("QCLI-393: the peel goes through the tag object, never stops at the ref's own sha", async () => {
  const peeled = await resolveTagCommit(V, { execFile: liveShapes() });
  expect(peeled.commit).toBe(RELEASE);
  expect(peeled.chain).toEqual([`tag ${TAG_OBJECT}`, `commit ${RELEASE}`]);
  // A receipt naming the tag object's sha instead of the commit refuses.
  expect((await gate(liveShapes(), TAG_OBJECT)).ok).toBe(false);
});

test("QCLI-393: a peel that never reaches a commit fails closed", async () => {
  const cyclic = async (_command: string, args: readonly string[]) => {
    const path = String(args.at(-1));
    return {
      stdout: JSON.stringify(
        path.endsWith("git/ref/tags/v9.9.9")
          ? {
              ref: "refs/tags/v9.9.9",
              object: { type: "tag", sha: TAG_OBJECT },
            }
          : { sha: TAG_OBJECT, object: { type: "tag", sha: TAG_OBJECT } },
      ),
    };
  };
  const peeled = await resolveTagCommit(V, { execFile: cyclic });
  expect(peeled.commit).toBeNull();
  expect(peeled.error).toContain("still a tag");
});

test("the gate sits on the promote path only: --rollback never reaches it", async () => {
  const source = await readFile(
    join(import.meta.dir, "..", "scripts", "promote-release.mjs"),
    "utf8",
  );
  const calls = source.match(/requirePairQualification\(/g) ?? [];
  expect(calls).toHaveLength(1);
  const rollbackBranch = source.slice(
    source.indexOf("if (rollbackPath) {"),
    source.indexOf("} else {", source.indexOf("if (rollbackPath) {")),
  );
  expect(rollbackBranch).toContain("validateRecord(record)");
  expect(rollbackBranch).not.toContain("requirePairQualification");
  // And it runs before the dry-run exit, so a dry run answers "would this promote".
  expect(source.indexOf("requirePairQualification(")).toBeLessThan(
    source.indexOf("Dry run only. Re-run with --promote"),
  );
});
