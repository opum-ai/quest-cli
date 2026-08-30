// Types for the candidate bundle assembler (QCLI-135 follow-through).

export const REQUIRED_PLATFORMS: readonly string[];
export function executableFor(platform: string): string;

export function buildCandidateBundle(options: {
  commit: string;
  out: string;
  /** Refuse rebuilt artifacts outright: a release publishes committed bytes. */
  releaseRef?: boolean;
  directory?: string;
}): Promise<{
  readonly version: string;
  readonly commit: string;
  readonly out: string;
  readonly artifactProvenance: "committed" | "rebuilt";
  readonly packages: readonly { readonly name: string; readonly tarball: string }[];
  readonly digests: readonly {
    readonly filename: string;
    readonly digest: string;
  }[];
}>;
