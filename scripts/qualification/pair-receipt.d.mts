// Types for the opum-cli-e2e gate on moving `latest` (QCLI-388).

import type { FetchedReceipt } from "./e2e-receipt.d.mts";

export const PAIR_RECEIPT_KIND: "opum.pair-qualification-receipt.v1";
export function pairReceiptPath(version: string): string;
export function tarballName(pkgName: string, version: string): string;

export interface RegistryObservation {
  readonly integrities: Record<string, string>;
  readonly gitHead: string | null;
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

export function observeRegistry(
  version: string,
  packages: readonly string[],
  options?: {
    execFile?: (
      command: string,
      args: readonly string[],
    ) => Promise<{ stdout: string; stderr?: string }>;
  },
): Promise<RegistryObservation>;

export function requirePairQualification(options: {
  version: string;
  packages: readonly string[];
  fetch?: (version: string) => Promise<FetchedReceipt>;
  observe?: (version: string) => Promise<RegistryObservation>;
}): Promise<PairVerdict & { readonly source: string }>;
