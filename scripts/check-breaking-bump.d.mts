// Types for the breaking-change bump check (QCLI-328), and its pair form
// over lore-cli's CHANGELOG (QCLI-403).

export const BREAKING_HEADING: RegExp;

export function bumpLevel(
  previous: string,
  next: string,
): "major" | "minor" | "patch" | null;

export interface BreakingBumpResult {
  readonly problems: readonly string[];
  readonly version: string;
  readonly previous: string | null;
  readonly level: "major" | "minor" | "patch" | null;
  readonly source: string;
  readonly breaking: boolean;
  readonly sectionsRead: number;
  readonly versionSectionsRead: number;
}

export function breakingBumpProblems(
  changelog: string,
  version: string,
  options?: { name?: string },
): BreakingBumpResult;

export function checkBreakingBump(options?: {
  directory?: string;
  next?: string;
}): Promise<BreakingBumpResult>;

export const LORE: { readonly repository: string; readonly ref: string };

export interface LoreChangelogRead {
  readonly text: string | null;
  readonly ref: string;
  readonly sha: string | null;
  readonly error?: string;
}

type Run = (
  command: string,
  args: readonly string[],
  options?: object,
) => Promise<{ stdout: string; stderr?: string }>;

export function readLoreChangelog(options?: {
  ref?: string;
  execFile?: Run;
}): Promise<LoreChangelogRead>;

export interface PairBreakingBumpResult {
  readonly quest: BreakingBumpResult;
  readonly lore: BreakingBumpResult | null;
  readonly loreRef: string;
  readonly loreSha: string | null;
  readonly problems: readonly string[];
}

export function checkPairBreakingBump(options?: {
  directory?: string;
  next?: string;
  loreRef?: string;
  read?: (options: { ref: string }) => Promise<LoreChangelogRead>;
}): Promise<PairBreakingBumpResult>;

export function describe(result: BreakingBumpResult, label?: string): string;
