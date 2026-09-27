// Types for the GitHub Release step (QCLI-398). The implementation is plain
// ESM so it runs with node, in the terminal an operator promotes from.

export const RELEASE_REPOSITORY: "github.com/opum-ai/quest-cli";

export function changelogSection(
  changelog: string,
  version: string,
): { heading: string; body: string } | null;

export function releaseTitle(version: string, heading?: string): string;

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

export function releaseNotesFor(
  version: string,
  options?: { changelogPath?: string },
): Promise<{ notes: string; title: string } | null>;
