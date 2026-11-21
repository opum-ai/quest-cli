import { createHash } from "node:crypto";
import { expect, test } from "bun:test";
import { caseFold, lookupFolding } from "unicode-case-folding";

/**
 * QCLI-579 / DEC-282 (a12). The lore/quest pair shares ONE case-fold table, and
 * a change to it is a pair change made in both halves together, with a digest
 * test failing in whichever half lags. This pins the fold data quest actually
 * uses: `caseFold` in src/domain/records.ts, from `unicode-case-folding`
 * (package.json ^1.1.1, so a lockfile regeneration that resolves a newer
 * release would otherwise silently diverge from lore).
 *
 * THE TABLE IS C+F: Unicode full default case folding, statuses Common and
 * Full, with Simple (S) and Turkic (T) excluded. So 223 and 7838 fold to
 * [115, 115] (F, not S), 304 folds to [105, 775] (F, not T) and 8072 to
 * [7936, 953]. The pin covers exactly those classes and nothing else.
 *
 * TWO REPRESENTATIONS, ONE TABLE:
 *
 *  1. QUEST'S OWN, `<cp hex>:<mapped hex, comma-separated>\n` per entry. Its
 *     digest and the entry count (1585 at 1.1.1) catch drift in this half.
 *  2. LORE'S EXACT ONE, built here from quest's runtime table: each entry is
 *     `String.fromCodePoint(cp) + String.fromCodePoint(...mapped)`, in
 *     ascending code point order, joined by "\n" with NO trailing newline,
 *     hashed as UTF-8 (lore's scripts/gen-case-fold-table.mjs, and the pin in
 *     lore's test/lcli791-quest-rollup.test.ts). Its digest, LORE_DIGEST, is the
 *     ONE number pinned in BOTH repositories. Two unrelated hex strings cannot
 *     show that two tables are the same; one shared constant can, so "the same
 *     table" is a measurement here and a pair change must edit it in both
 *     halves, or the half that did not change fails against it.
 *
 * Changing either pin means changing the table in lockstep with lore-cli.
 */

const EXPECTED_ENTRIES = 1585;
const QUEST_DIGEST =
  "bea3c0c981538aad99a7574d13b233eade11e092ebd8f75121a0e4ecb56f47c1";
/** Shared with lore-cli; the same constant is pinned there. */
const LORE_DIGEST =
  "ef08b22d969b928737ae158c7a0d2bc4b800769b178f99db69f21bd68255fc13";

type Lookup = (codePoint: number) => readonly number[] | undefined;

/** Walk every code point (surrogates included: `caseFold` iterates a lone
 *  surrogate as a character, so a future key there would change folding). */
function foldTable(lookup: Lookup): {
  readonly lines: readonly string[];
  readonly text: string;
  readonly loreText: string;
} {
  const lines: string[] = [];
  const loreEntries: string[] = [];
  for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
    const mapped = lookup(codePoint);
    if (mapped === undefined) continue;
    lines.push(
      `${codePoint.toString(16)}:${mapped.map((part) => part.toString(16)).join(",")}`,
    );
    loreEntries.push(
      String.fromCodePoint(codePoint) + String.fromCodePoint(...mapped),
    );
  }
  return {
    lines,
    text: `${lines.join("\n")}\n`,
    loreText: loreEntries.join("\n"),
  };
}

const digestOf = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

test("the case-fold table quest uses is pinned, in quest's form and lore's (pair item with lore-cli)", () => {
  const { lines, text, loreText } = foldTable(lookupFolding);
  // Positive control: the walk read a real table, not an empty one.
  expect(lines.length).toBe(EXPECTED_ENTRIES);
  expect(digestOf(text)).toBe(QUEST_DIGEST);
  // The digest lore pins over ITS representation of this same table.
  expect(digestOf(loreText)).toBe(LORE_DIGEST);
});

test("the function src calls, caseFold, agrees with the hashed table at every code point", () => {
  // `src/domain/records.ts` calls `caseFold`, not `lookupFolding`; a release
  // that changed one without the other would otherwise leave the digest green.
  for (let codePoint = 0; codePoint <= 0x10ffff; codePoint++) {
    const char = String.fromCodePoint(codePoint);
    const expected = String.fromCodePoint(
      ...(lookupFolding(codePoint) ?? [codePoint]),
    );
    if (caseFold(char) !== expected)
      throw new Error(
        `caseFold(U+${codePoint.toString(16)}) disagrees with lookupFolding`,
      );
  }
});

test("the pins reject a table that drifts: an altered entry and a dropped code point each move both digests", () => {
  // Mutate the CHECK, not its input: the SAME foldTable() the pin test runs, fed
  // wrappers over the real lookup, must land on a different digest.
  const alteredEntry: Lookup = (codePoint) =>
    codePoint === 223 ? [115] : lookupFolding(codePoint);
  const droppedCodePoint: Lookup = (codePoint) =>
    codePoint === 0x41 ? undefined : lookupFolding(codePoint);

  for (const wrapper of [alteredEntry, droppedCodePoint]) {
    const { text, loreText } = foldTable(wrapper);
    expect(digestOf(text)).not.toBe(QUEST_DIGEST);
    expect(digestOf(loreText)).not.toBe(LORE_DIGEST);
  }
  // CONTROL: the unmutated lookup still lands on both pins.
  const control = foldTable(lookupFolding);
  expect(digestOf(control.text)).toBe(QUEST_DIGEST);
  expect(digestOf(control.loreText)).toBe(LORE_DIGEST);
});
