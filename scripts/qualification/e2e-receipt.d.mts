// Types for the opum-cli-e2e qualification gate on publication (QCLI-366).

export const RECEIPT_KIND: "opum.qualification-receipt.v1";
export const RECEIPT_REPOSITORY: string;
export const PRODUCT: "quest";

export function receiptPath(version: string): string;
export function expectedTarballNames(version: string): string[];

export interface Bundle {
  readonly metadata: Record<string, unknown>;
  readonly directory: string;
  readonly tarballs: Record<string, string>;
}

export function readBundle(bundleDir: string): Promise<Bundle>;

export interface ReceiptVerdict {
  readonly ok: boolean;
  readonly problems: string[];
  readonly override: Record<string, unknown> | null;
}

export function evaluateReceipt(
  doc: unknown,
  facts: {
    version: string;
    commit: string;
    releaseRunId: string | number;
    tarballs: Record<string, string>;
  },
): ReceiptVerdict;

export interface FetchedReceipt {
  readonly doc: unknown;
  readonly source: string;
  readonly error?: string;
}

export function fetchReceipt(
  version: string,
  options?: {
    execFile?: (
      command: string,
      args: readonly string[],
      options?: Record<string, unknown>,
    ) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<FetchedReceipt>;

export interface QualificationResult extends ReceiptVerdict {
  readonly bundle: Bundle;
  readonly source: string;
}

export function requireQualification(options: {
  bundleDir: string;
  version: string;
  commit: string;
  releaseRunId: string | number;
  fetch?: (version: string) => Promise<FetchedReceipt>;
}): Promise<QualificationResult>;

export function describeOverride(
  override: Record<string, unknown>,
  source: string,
): string;
