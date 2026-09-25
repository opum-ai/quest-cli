// Types for the local, interactive release publish tooling (QCLI-135,
// extended by QCLI-285). The implementation is plain ESM so it can run with
// node, without a Bun toolchain or a build step, in the same terminal an
// operator runs `npm login` in.

export interface TokenShape {
  readonly length: number;
  readonly prefix: "npm_" | "OTHER";
  readonly hasWhitespace: boolean;
}

export function tokenShape(token: string): TokenShape;
export function isValidGranularTokenShape(shape: TokenShape): boolean;

export interface ResolvedToken {
  readonly token: string | null;
  readonly source: string | null;
}

export function resolveToken(options?: {
  env?: Record<string, string | undefined>;
  keychainService?: string;
  findKeychainPassword?: (service: string) => Promise<string | null>;
}): Promise<ResolvedToken>;

export function isPublished(
  pkgName: string,
  version: string,
  options?: {
    execFile?: (
      command: string,
      args: readonly string[],
    ) => Promise<{ stdout: string; stderr: string }>;
  },
): Promise<boolean>;

// QCLI-299: the wrapper publish is gated on a consumer-side read of every
// platform package, so the sequence and its failure reporting are exported
// with every side effect injectable.

import type {
  PublishErrorState,
  VersionClassification,
} from "./qualification/registry-visibility.d.mts";

export interface PublishTarget {
  readonly name: string;
  readonly cwd: string;
}

export interface GateResult {
  readonly ok: boolean;
  readonly timedOut?: boolean;
  readonly attempts?: number;
  readonly missing?: readonly string[];
}

export interface PublishOutcome {
  readonly ok: boolean;
  readonly wrapperPublished: boolean;
  readonly visibility: GateResult;
  readonly platformNames: readonly string[];
}

export function publishPlatformsThenWrapper(options: {
  platforms: readonly PublishTarget[];
  wrapper: PublishTarget;
  publish: (target: PublishTarget) => Promise<unknown>;
  alreadyPublished: (name: string) => Promise<boolean>;
  gate: (names: readonly string[]) => Promise<GateResult>;
  log?: (message: string) => void;
}): Promise<PublishOutcome>;

export function describeUnresolvedPackages(
  names: readonly string[],
  version: string,
  options?: {
    classify?: (
      pkgName: string,
      version: string,
      options?: Record<string, unknown>,
    ) => Promise<VersionClassification>;
  },
): Promise<{ lines: string[]; states: Record<string, string> }>;

export function diagnoseStaged(
  target: PublishTarget,
  options: { publish: (target: PublishTarget) => Promise<unknown> },
): Promise<{
  state: PublishErrorState | "was-absent-now-published";
  detail: string | null;
}>;

// QCLI-366: the opum-cli-e2e qualification gate, with the GitHub reads and
// the receipt gate injectable.

import type { QualificationResult } from "./qualification/e2e-receipt.d.mts";

export function qualifyBundle(options: {
  runId: string | number;
  commit: string;
  version: string;
  into: string;
  gh?: (args: string[]) => Promise<{ stdout: string; stderr: string }>;
  gate?: (input: {
    bundleDir: string;
    version: string;
    commit: string;
    releaseRunId: string | number;
  }) => Promise<Partial<QualificationResult> & { ok: boolean; problems: string[] }>;
}): Promise<Partial<QualificationResult> & { ok: boolean; problems: string[] }>;

import type { HeldTarball } from "./qualification/bundle-integrity.d.mts";

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
