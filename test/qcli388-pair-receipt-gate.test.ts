import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { expectedTarballNames } from "../scripts/qualification/e2e-receipt.mjs";
import {
  evaluatePairReceipt,
  observeRegistry,
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
  gitHead: HEAD,
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
    observed: { ...observed, gitHead: null },
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

test("observeRegistry reads npm 12's one-element array and the bare object, and nothing else", async () => {
  const answers: Record<string, unknown> = {
    "@opum-ai/quest@9.9.9": [{ "dist.integrity": "sha512-w", gitHead: HEAD }],
    "@opum-ai/quest-linux-x64@9.9.9": { "dist.integrity": "sha512-l" },
    "@opum-ai/quest-darwin-x64@9.9.9": [
      { "dist.integrity": "sha512-1" },
      { "dist.integrity": "sha512-2" },
    ],
  };
  const result = await observeRegistry(
    V,
    [
      "@opum-ai/quest-linux-x64",
      "@opum-ai/quest-darwin-x64",
      "@opum-ai/quest-win32-x64",
      "@opum-ai/quest",
    ],
    {
      execFile: async (_command, args) => {
        const answer = answers[args[1] as string];
        if (answer === undefined) throw new Error("E404");
        return { stdout: JSON.stringify(answer) };
      },
    },
  );
  expect(result.gitHead).toBe(HEAD);
  expect(result.integrities).toEqual({
    "opum-ai-quest-9.9.9.tgz": "sha512-w",
    "opum-ai-quest-linux-x64-9.9.9.tgz": "sha512-l",
  });
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
