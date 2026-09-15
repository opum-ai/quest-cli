// Types for the consumer-shaped registry visibility reads (QCLI-299). The
// implementation is plain ESM for the same reason the rest of this directory
// is: it runs with node during a release, with no build step between the
// operator and the gate.

export type ConsumerVersionState = "public" | "absent" | "unreadable";

export interface ConsumerVersionRead {
  readonly state: ConsumerVersionState;
  readonly publishedAt: string | null;
  readonly problem: string | null;
}

export interface FetchLikeResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchLike = (
  url: string,
  init: { headers: Record<string, string> },
) => Promise<FetchLikeResponse>;

export interface ConsumerReadOptions {
  fetchImpl?: FetchLike;
  registry?: string;
}

export const CONSUMER_REGISTRY: string;
export const PUBLISHER_EARLY_LAG_MS: number;

export function packumentUrl(pkgName: string, registry?: string): string;

export function readConsumerVersion(
  pkgName: string,
  version: string,
  options?: ConsumerReadOptions,
): Promise<ConsumerVersionRead>;

export interface VisibilityProgress {
  readonly state: "visible" | "regressed" | "settling";
  readonly name?: string;
  readonly publishedAt?: string | null;
  readonly problem?: string | null;
  readonly waitMs?: number;
}

export interface VisibilityResult {
  readonly ok: boolean;
  readonly timedOut: boolean;
  readonly attempts: number;
  readonly missing: readonly string[];
  readonly settleMs: number;
  readonly lastSeen: Record<string, ConsumerVersionRead>;
}

export function waitForConsumerVisibility(
  packageNames: readonly string[],
  version: string,
  options?: ConsumerReadOptions & {
    maxWaitMs?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    settleMs?: number;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    read?: (
      pkgName: string,
      version: string,
      options?: ConsumerReadOptions,
    ) => Promise<ConsumerVersionRead>;
    onProgress?: (event: VisibilityProgress) => void;
  },
): Promise<VisibilityResult>;

export interface StageEntry {
  readonly version?: string;
  readonly id?: string;
  readonly stageId?: string;
}

export interface StageListResult {
  readonly supported: boolean;
  readonly entries: readonly StageEntry[];
  readonly problem: string | null;
}

export function readStageList(
  pkgName: string,
  options?: {
    execFile?: (
      command: string,
      args: readonly string[],
      options?: Record<string, unknown>,
    ) => Promise<{ stdout: string; stderr: string }>;
    env?: Record<string, string | undefined>;
  },
): Promise<StageListResult>;

export type VersionState =
  | "public"
  | "staged"
  | "absent-or-staged"
  | "unreadable";

export interface VersionClassification {
  readonly state: VersionState;
  readonly publishedAt: string | null;
  readonly stageId: string | null;
  readonly evidence: string | null;
}

export function classifyVersion(
  pkgName: string,
  version: string,
  options?: ConsumerReadOptions & {
    read?: (
      pkgName: string,
      version: string,
      options?: ConsumerReadOptions,
    ) => Promise<ConsumerVersionRead>;
    stageList?: (
      pkgName: string,
      options?: Record<string, unknown>,
    ) => Promise<StageListResult>;
  },
): Promise<VersionClassification>;

export function describeVersionState(
  pkgName: string,
  version: string,
  classification: VersionClassification,
): string[];

export type PublishErrorState =
  | "staged"
  | "public"
  | "unauthorized-or-absent"
  | "unknown";

export function classifyPublishError(error: {
  stderr?: string;
  stdout?: string;
  message?: string;
}): PublishErrorState;
