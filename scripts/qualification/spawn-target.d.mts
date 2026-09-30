// Types for the Windows npm-spawn helper (QCLI-426).

export interface SpawnTarget {
  /** The executable to hand to execFile: the file itself, or cmd.exe. */
  readonly executable: string;
  /** Arguments for that executable, already a command line on Windows. */
  readonly argv: readonly string[];
  /** Set when argv is a finished command line and must not be re-quoted. */
  readonly verbatim: boolean;
}

export function spawnTarget(
  file: string,
  args: readonly string[],
  platform?: string,
): SpawnTarget;
