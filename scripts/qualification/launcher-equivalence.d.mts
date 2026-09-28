// Types for the root launcher's rc-to-final equivalence check (QCLI-399).

export function launcherRcVersion(version: string, n: number): string;
export function nextRcNumber(
  version: string,
  publishedVersions: readonly string[],
): number;
export function substituteBytes(bytes: Buffer, from: string, to: string): Buffer;

export interface TreeEntry {
  readonly mode: number;
  readonly bytes: Buffer | null;
  readonly special?: boolean;
}
export function compareTrees(
  rcTree: ReadonlyMap<string, TreeEntry>,
  finalTree: ReadonlyMap<string, TreeEntry>,
  versions: { rcVersion: string; version: string },
): string[];

export function checkLauncherEquivalence(options: {
  rcTarball: string;
  finalTarball: string;
  rcVersion: string;
  version: string;
}): Promise<{ ok: boolean; problems: string[] }>;
