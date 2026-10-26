#!/usr/bin/env node
// DEC-240 (3): the Quest version a workflow reads from CLAUDE.md comes only
// from inside the managed block's markers, and must be exactly X.Y.Z.
// Anything else fails by name and prints nothing, so a partial or ranged
// value ("0.14", "^0.14.1", "0.14.1-rc.1", "0.14.1 and 0.15.0") can never
// reach a later step or an npm command line.
//
// Usage: node scripts/read-declared-quest-version.mjs [path-to-CLAUDE.md]
// Prints the version on stdout; exits 1 with a `::error` annotation otherwise.
import { readFileSync } from "node:fs";

const BEGIN = "<!-- quest:agent-instructions:begin -->";
const END = "<!-- quest:agent-instructions:end -->";
const EXACT = /^[0-9]+\.[0-9]+\.[0-9]+$/;

function fail(file, message) {
  console.error(`::error file=${file}::${message}`);
  process.exit(1);
}

const file = process.argv[2] ?? "CLAUDE.md";
let text;
try {
  text = readFileSync(file, "utf8");
} catch (error) {
  // A missing or unreadable file is a named failure, not an uncaught throw.
  fail(
    file,
    `cannot read the file to find the Quest version: ${error.code ?? error.message}.`,
  );
}
// Each marker exactly once: a missing, repeated or reversed marker means the
// block's extent is ambiguous, and a version read from an ambiguous block is
// not a version this job may trust. Line endings do not matter (CRLF files
// carry the same markers).
const count = (needle) => text.split(needle).length - 1;
const start = text.indexOf(BEGIN);
const stop = text.indexOf(END);
if (count(BEGIN) !== 1 || count(END) !== 1 || stop < start)
  fail(
    file,
    `the managed Quest block markers must each appear exactly once and in order (begin x${count(BEGIN)}, end x${count(END)}).`,
  );

const block = text.slice(start + BEGIN.length, stop);
// Every `Quest CLI <token>` inside the block whose whole whitespace-delimited
// word carries a digit, so a partial version or a range is read as itself and
// rejected rather than truncated to a prefix that happens to look valid. Prose
// such as "Quest CLI version" carries no digit and is not a declaration.
const declared = [...block.matchAll(/Quest CLI (\S*[0-9]\S*)/g)].map(
  (m) => m[1],
);
if (declared.length === 0)
  fail(
    file,
    "No 'Quest CLI <version>' line found inside the managed block. Tracker integrity cannot be checked against an undeclared version.",
  );
// A sentence-ending full stop or comma is punctuation, not part of the version.
const versions = [...new Set(declared.map((v) => v.replace(/[.,;:)]+$/, "")))];
if (versions.length !== 1)
  fail(
    file,
    `the managed block declares more than one Quest CLI version: ${versions.join(", ")}.`,
  );
if (!EXACT.test(versions[0]))
  fail(
    file,
    `the managed block's Quest CLI version ${JSON.stringify(versions[0])} is not exactly X.Y.Z (^[0-9]+\\.[0-9]+\\.[0-9]+$); a partial version or a range is refused by name and never reaches npm.`,
  );
console.log(versions[0]);
