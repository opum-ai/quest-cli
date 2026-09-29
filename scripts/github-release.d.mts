// Types for the GitHub Release step (QCLI-398). The implementation is plain
// ESM so it runs with node, in the terminal an operator promotes from.

export const RELEASE_REPOSITORY: "github.com/opum-ai/quest-cli";

export function changelogSection(
  changelog: string,
  version: string,
): { heading: string; body: string } | null;

export function releaseTitle(version: string, heading?: string): string;

/** QCLI-410: the recorded reason a legacy release's stored body is kept, or undefined. */
export function recordedLegacyReason(version: string): string | undefined;

/** QCLI-410: every version in the recorded table, ascending. */
export function recordedLegacyVersions(): string[];

export type ExecFile = (
  file: string,
  args: readonly string[],
) => Promise<{ stdout: string; stderr?: string }>;

export interface ReleaseOutcome {
  readonly ok: boolean;
  readonly action:
    | "created"
    | "exists"
    | "marked-latest"
    | "would-create"
    | "would-mark-latest"
    // QCLI-410: the release exists and its stored body differs from the
    // tagged section by a recorded decision -- reported with its reason,
    // never repaired and never marked latest.
    | "recorded-exception"
    | "none";
  readonly detail: string;
}

export function ensureGitHubRelease(options: {
  version: string;
  notes: string;
  title?: string;
  latest?: boolean;
  dryRun?: boolean;
  execFile?: ExecFile;
}): Promise<ReleaseOutcome>;

export function changelogAt(
  commit: string,
  options?: { execFile?: ExecFile },
): Promise<{ text: string | null; commit: string; error: string | null }>;

export function releaseNotesFor(
  version: string,
  options?: { commit: string; execFile?: ExecFile },
): Promise<
  { ok: true; notes: string; title: string } | { ok: false; detail: string }
>;
