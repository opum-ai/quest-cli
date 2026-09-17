// Types for the CI-side wrapper-publish gate (QCLI-300). Plain ESM for the
// same reason as the rest of this directory: it runs with node during a
// release, with no build step between the operator and the gate.

import type {
  VersionClassification,
  VisibilityResult,
} from "./registry-visibility.d.mts";

export const REQUIRED_PLATFORMS: readonly string[];

export function platformPackageNames(
  platforms?: readonly string[],
): readonly string[];

export interface RequirePlatformVisibilityOptions {
  version: string;
  names?: readonly string[];
  /** Injected so the refusal path can be exercised without the network. */
  wait?: (
    packageNames: readonly string[],
    version: string,
    options?: Record<string, unknown>,
  ) => Promise<VisibilityResult>;
  classify?: (
    pkgName: string,
    version: string,
    options?: Record<string, unknown>,
  ) => Promise<VersionClassification>;
  log?: (line: string) => void;
  error?: (line: string) => void;
  waitOptions?: Record<string, unknown>;
}

export function requirePlatformVisibility(
  options: RequirePlatformVisibilityOptions,
): Promise<{ ok: boolean; visibility: VisibilityResult }>;

export function parseArgs(argv: readonly string[]): {
  version: string | undefined;
  options: { maxWaitMs?: number; registry?: string };
};
