// Types for the opum-cli-e2e gate on moving `latest` (QCLI-388).

import type { FetchedReceipt } from "./e2e-receipt.d.mts";

export const PAIR_RECEIPT_KIND: "opum.pair-qualification-receipt.v1";
export function pairReceiptPath(version: string): string;
export function tarballName(pkgName: string, version: string): string;

export interface RegistryObservation {
  readonly integrities: Record<string, string>;
  readonly gitHead: string | null;
  readonly commit: string | null;
  readonly commitSource?: string;
  readonly commitError?: string;
}

export interface PairVerdict {
  readonly ok: boolean;
  readonly problems: string[];
  readonly override: Record<string, unknown> | null;
}

export function evaluatePairReceipt(
  doc: unknown,
  facts: { version: string; observed: RegistryObservation },
): PairVerdict;

export function viewVersion(
  name: string,
  version: string,
  options?: { execFile?: ExecFile },
): Promise<Record<string, unknown> | null>;

export const MAX_PEEL_DEPTH: number;

export function resolveTagCommit(
  version: string,
  options?: { execFile?: ExecFile },
): Promise<{ commit: string | null; chain: string[]; error?: string }>;

export function observeRegistry(
  version: string,
  packages: readonly string[],
  options?: {
    execFile?: ExecFile;
    resolveCommit?: (
      version: string,
    ) => Promise<{ commit: string | null; error?: string }>;
  },
): Promise<RegistryObservation>;

type ExecFile = (
  command: string,
  args: readonly string[],
  options?: Record<string, unknown>,
) => Promise<{ stdout: string; stderr?: string }>;

export function requirePairQualification(options: {
  version: string;
  packages: readonly string[];
  fetch?: (version: string) => Promise<FetchedReceipt>;
  observe?: (version: string) => Promise<RegistryObservation>;
}): Promise<PairVerdict & { readonly source: string }>;
