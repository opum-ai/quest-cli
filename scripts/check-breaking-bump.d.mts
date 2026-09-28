// Types for the breaking-change bump check (QCLI-328).

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
}

export function breakingBumpProblems(
  changelog: string,
  version: string,
): BreakingBumpResult;

export function checkBreakingBump(options?: {
  directory?: string;
  next?: string;
}): Promise<BreakingBumpResult>;
