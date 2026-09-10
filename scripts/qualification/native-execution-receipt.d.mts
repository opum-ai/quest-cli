// Types for the native-execution receipt tooling (QCLI-135). The
// implementation is plain ESM so CI can run it with node, without a Bun
// toolchain or a build step, on a runner that has already published.

export interface PlatformEvidence {
  readonly platform: string;
  readonly packageName: string;
  readonly executableSha256: string;
  readonly declaredIn: string;
}

export interface CiJob {
  readonly name: string;
  /** null while a job is still running — the GitHub API's own shape. */
  readonly conclusion: string | null;
}

export interface NativeExecutionReceipt {
  readonly schemaVersion: 1;
  readonly kind: "opum.native-execution-receipt.v1";
  readonly source: {
    readonly repository: string;
    readonly commit: string;
    readonly version?: string;
  };
  readonly ciRun: {
    readonly id: number;
    readonly url: string;
    readonly event: string;
    readonly headSha: string;
    readonly conclusion: string;
    readonly jobs: readonly CiJob[];
  };
  readonly platforms: readonly PlatformEvidence[];
  readonly coverageClaim: readonly string[];
  readonly notClaimed: readonly string[];
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly problems: readonly string[];
}

export const REQUIRED_PLATFORMS: readonly string[];
export const REQUIRED_JOBS: readonly string[];

export function executableFor(platform: string): string;
export function sha256(bytes: Uint8Array | string): string;

export function platformEvidence(
  platform: string,
  options?: { directory?: string },
): Promise<PlatformEvidence>;

export function buildReceipt(options: {
  commit: string;
  version?: string;
  runId: number;
  runUrl?: string;
  runEvent?: string;
  jobs: readonly CiJob[];
  selfJobName?: string;
  directory?: string;
}): Promise<NativeExecutionReceipt>;

export function validateReceipt(
  doc: unknown,
  options?: { commit?: string; version?: string; directory?: string },
): Promise<ValidationResult>;

export function verifyPublished(
  receipt: NativeExecutionReceipt,
  version: string,
): Promise<ValidationResult>;

export function verifyCommitted(
  target: string,
  options?: { directory?: string },
): Promise<{
  readonly ok: boolean;
  readonly target: string;
  readonly committedBlob: string;
  readonly workingBlob: string;
  readonly declared: string;
  readonly digest: string;
}>;
