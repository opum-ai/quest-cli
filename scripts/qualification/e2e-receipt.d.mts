// Types for the opum-cli-e2e qualification gate on publication (QCLI-366).

export const RECEIPT_KIND: "opum.qualification-receipt.v1";
export const RECEIPT_REPOSITORY: string;
export const PRODUCT: "quest";

export const LAUNCHER: "@opum-ai/quest";

export function receiptPath(version: string): string;
/** QCLI-399: is `launcherVersion` exactly `<version>-rc.<N>`, N >= 1? */
export function isLauncherVersionOf(
  version: string,
  launcherVersion: unknown,
): boolean;
export function tarballName(pkgName: string, version: string): string;
/** The seven staged archives: the launcher at its rc, the platforms at X. */
export function expectedTarballNames(
  version: string,
  launcherVersion: string,
): string[];

export interface Bundle {
  readonly metadata: Record<string, unknown>;
  readonly directory: string;
  readonly tarballs: Record<string, string>;
  readonly finalDirectory: string;
  readonly final: Record<string, string>;
}

export function readBundle(bundleDir: string): Promise<Bundle>;

export interface FinalLauncher {
  readonly filename: string;
  readonly path: string;
  readonly sha256: string;
}

export type BundleLauncher =
  | {
      readonly ok: true;
      readonly problems: string[];
      readonly stagedVersion: string;
      readonly stagedTarball: string;
      readonly final: FinalLauncher;
    }
  | { readonly ok: false; readonly problems: string[] };

export function bundleLauncher(bundle: Bundle, version: string): BundleLauncher;

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
    launcherVersion: string;
    finalTarball: { filename: string; sha256: string };
  },
): ReceiptVerdict;

export interface FetchedReceipt {
  readonly doc: unknown;
  readonly source: string;
  readonly error?: string;
}

export function evaluateVerdict(doc: { verdict?: unknown; override?: unknown }): {
  problems: string[];
  override: Record<string, unknown> | null;
};

export function fetchReceipt(
  version: string,
  options?: {
    path?: string;
    execFile?: (
      command: string,
      args: readonly string[],
      options?: Record<string, unknown>,
    ) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<FetchedReceipt>;

export interface QualificationResult extends ReceiptVerdict {
  readonly bundle: Bundle;
  readonly launcher?: Extract<BundleLauncher, { ok: true }>;
  readonly source: string | null;
}

export function requireQualification(options: {
  bundleDir: string;
  version: string;
  commit: string;
  releaseRunId: string | number;
  fetch?: (version: string) => Promise<FetchedReceipt>;
  checkEquivalence?: (options: {
    rcTarball: string;
    finalTarball: string;
    rcVersion: string;
    version: string;
  }) => Promise<{ ok: boolean; problems: string[] }>;
}): Promise<QualificationResult>;

export function describeOverride(
  override: Record<string, unknown>,
  source: string,
): string;
