// Types for the candidate bundle assembler (QCLI-135 follow-through).

export const REQUIRED_PLATFORMS: readonly string[];
export function executableFor(platform: string): string;

export function buildCandidateBundle(options: {
  commit: string;
  out: string;
  /** Refuse rebuilt artifacts outright: a release publishes committed bytes. */
  releaseRef?: boolean;
  directory?: string;
  /** The staged launcher is X-rc.<rcNumber> (QCLI-399). Defaults to 1. */
  rcNumber?: number;
}): Promise<{
  readonly version: string;
  readonly rcVersion: string;
  readonly commit: string;
  readonly out: string;
  readonly artifactProvenance: "committed" | "rebuilt";
  readonly packages: readonly { readonly name: string; readonly tarball: string }[];
  /** The seven staged archives: the rc launcher first, then the platforms. */
  readonly digests: readonly {
    readonly filename: string;
    readonly digest: string;
  }[];
  /** The X launcher, in final/, published to latest by promote-release.mjs. */
  readonly final: { readonly filename: string; readonly digest: string };
}>;

export function resolveRcNumber(options: {
  version: string;
  explicit?: string;
  releaseRef: boolean;
  readVersions?: () => Promise<unknown>;
}): Promise<number>;
