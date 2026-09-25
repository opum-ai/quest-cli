// Types for the whole-tarball registry comparison (QCLI-368).

export interface HeldTarball {
  readonly ok: boolean;
  readonly expected: string;
  readonly actual: string | null;
}

export function registryHoldsTarball(
  pkgName: string,
  version: string,
  tarball: string,
  options?: {
    execFile?: (
      command: string,
      args: readonly string[],
    ) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<HeldTarball>;

export function packageNames(): string[];

export function verifyRegistryHoldsBundle(options: {
  bundleDir: string;
  version: string;
  attempts?: number;
  delayMs?: number;
  check?: (
    pkgName: string,
    version: string,
    tarball: string,
  ) => Promise<HeldTarball>;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{
  ok: boolean;
  problems: string[];
  results: Record<string, HeldTarball>;
}>;
