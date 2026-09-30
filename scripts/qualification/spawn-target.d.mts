// Types for the Windows npm-spawn helper (QCLI-426).

export interface SpawnTarget {
  /** The executable to hand to execFile: the file itself, or cmd.exe. */
  readonly executable: string;
  /** Arguments for that executable, already a command line on Windows. */
  readonly argv: readonly string[];
  /** Set when argv is a finished command line and must not be re-quoted. */
  readonly verbatim: boolean;
}

/**
 * The absolute path of a Windows command shim, or the bare name when it cannot
 * be found. `env` and `exists` are injectable so the search is testable off
 * Windows.
 */
export function resolveShim(
  env?: Record<string, string | undefined>,
  exists?: (path: string) => boolean,
): string;

/**
 * `platform` defaults to the running one; it is a parameter so the win32 shape
 * can be asserted from any host, which is the only verification available
 * without a Windows runner.
 */
export function spawnTarget(
  file: string,
  args: readonly string[],
  platform?: string,
  env?: Record<string, string | undefined>,
  exists?: (path: string) => boolean,
): SpawnTarget;
