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
