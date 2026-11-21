import { expect, test } from "bun:test";

import { parseBlobListing } from "../src/adapters/git/local-git.ts";

/**
 * QCLI-568 Q568-INT B nit 4 (#763 round-5): `listBlobsRequired` parses
 * `git ls-tree -r` output strictly. A row it cannot parse is a FAILURE, never a
 * silently skipped record -- a shorter record set that reports success is the
 * false green the across-refs read exists to avoid.
 */

const OID = "a".repeat(40);

test("parses real ls-tree rows", () => {
  expect(
    parseBlobListing(
      `100644 blob ${OID}\t.quest/tasks/T-1.json\n`,
      "git ls-tree -r HEAD .quest/tasks",
    ),
  ).toEqual([{ path: ".quest/tasks/T-1.json", oid: OID }]);
  // An absent prefix is empty output, not a failure.
  expect(parseBlobListing("", "git ls-tree -r HEAD .quest/tasks")).toEqual([]);
  // The trailing newline is ignored; two real rows both parse.
  expect(
    parseBlobListing(
      `100644 blob ${OID}\t.quest/tasks/T-1.json\n100644 blob ${OID}\t.quest/tasks/T-2.json\n`,
      "ctx",
    ),
  ).toHaveLength(2);
});

test("throws on a row with no tab separator", () => {
  expect(() =>
    parseBlobListing("100644 blob definitely-not-a-listing\n", "ctx"),
  ).toThrow(/unparseable row/u);
});

test("throws when the object name is not 40 hex characters", () => {
  expect(() =>
    parseBlobListing("100644 blob zzzz\t.quest/tasks/T-1.json\n", "ctx"),
  ).toThrow(/unparseable row/u);
  expect(() =>
    parseBlobListing("100644 blob \t.quest/tasks/T-1.json\n", "ctx"),
  ).toThrow(/unparseable row/u);
});
