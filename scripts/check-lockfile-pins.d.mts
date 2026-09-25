// Types for the bun.lock platform-pin check (QCLI-292).

export interface LockfilePinResult {
  readonly problems: readonly string[];
  readonly pinsRead: number;
  readonly expected: number;
}

export function parseBunLock(text: string): unknown;
export function lockfilePinProblems(
  rootPackage: { readonly version: string },
  lock: unknown,
): LockfilePinResult;
export function checkLockfilePins(directory?: string): Promise<LockfilePinResult>;
