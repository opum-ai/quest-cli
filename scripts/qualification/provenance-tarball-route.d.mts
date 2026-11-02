// Types for the tarball-route provenance check (QCLI-555).

export interface TarballRouteResult {
  readonly ok: boolean;
  readonly problems: readonly string[];
  readonly source?: string;
  readonly override?: string | null;
}

export function verifyTarballRoute(options: {
  name: string;
  bundleDir: string;
  version: string;
  postVersion: string;
  commit: string;
  runId: string;
  requireReceipt?: (options: {
    bundleDir: string;
    version: string;
    commit: string;
    releaseRunId: string;
  }) => Promise<{
    ok: boolean;
    problems: readonly string[];
    override?: unknown;
    source?: string | null;
    launcher?: {
      stagedVersion: string;
      stagedTarball: string;
      final: { path: string };
    };
  }>;
  registryHolds?: (
    name: string,
    version: string,
    tarball: string,
  ) => Promise<{ ok: boolean; expected: string; actual: string | null }>;
}): Promise<TarballRouteResult>;
