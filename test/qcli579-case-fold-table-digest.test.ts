import { createHash } from "node:crypto";
import { expect, test } from "bun:test";
import { lookupFolding } from "unicode-case-folding";

/**
 * QCLI-579 / DEC-282 (a12). The lore/quest pair shares ONE case-fold table, and
 * a change to it is a pair change made in both halves together, with a digest
 * test failing in whichever half lags. lore pins its generated table; this pins
 * the fold data quest actually uses: `caseFold` in src/domain/records.ts, from
 * `unicode-case-folding` (package.json ^1.1.1, so a lockfile regeneration that
 * resolves a newer release would otherwise silently diverge from lore).
 *
 * WHAT IS HASHED (quest's own representation, not lore's generated file): for
 * every code point 0..0x10FFFF, surrogates excluded, `lookupFolding(cp)` when it
 * returns a mapping, one line per entry, in code point order:
 *
 *   `<cp as lowercase hex>:<mapped code points as lowercase hex, comma-separated>\n`
 *
 * The sha256 of that text is the pin, alongside the entry count (1585 at 1.1.1).
 * Changing the pin means changing the table in lockstep with lore-cli.
 */

const EXPECTED_ENTRIES = 1585;
const EXPECTED_DIGEST =
  "bea3c0c981538aad99a7574d13b233eade11e092ebd8f75121a0e4ecb56f47c1";

function foldTable(): {
  readonly lines: readonly string[];
  readonly text: string;
} {
  const lines: string[] = [];
  for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;
    const mapped = lookupFolding(codePoint);
    if (mapped === undefined) continue;
    lines.push(
      `${codePoint.toString(16)}:${mapped.map((part) => part.toString(16)).join(",")}`,
    );
  }
  return { lines, text: `${lines.join("\n")}\n` };
}

const digestOf = (text: string): string =>
  createHash("sha256").update(text).digest("hex");

test("the case-fold table quest uses is pinned (pair item with lore-cli)", () => {
  const { lines, text } = foldTable();
  // Positive control: the walk read a real table, not an empty one.
  expect(lines.length).toBe(EXPECTED_ENTRIES);
  expect(digestOf(text)).toBe(EXPECTED_DIGEST);
});

test("the digest goes red when one entry or the entry count drifts", () => {
  const { lines } = foldTable();
  const perturbed = [...lines];
  perturbed[0] = `${perturbed[0]}0`;
  expect(digestOf(`${perturbed.join("\n")}\n`)).not.toBe(EXPECTED_DIGEST);
  const shorter = lines.slice(0, -1);
  expect(digestOf(`${shorter.join("\n")}\n`)).not.toBe(EXPECTED_DIGEST);
});
