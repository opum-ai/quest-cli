// Types for the `latest` promotion step (QCLI-385). The implementation is
// plain ESM so it runs with node, in the terminal an operator publishes from.

export const PROMOTE_TAG: "latest";
export const RECORD_KIND: "quest.promotion-record.v1";
export const RELEASE_PACKAGES: readonly string[];

export type DistTags = Readonly<Record<string, string>>;
export type ReadTags = (name: string) => Promise<DistTags>;
export type SetTag = (name: string, version: string, tag: string) => Promise<unknown>;

export interface PromotionRecord {
  readonly schemaVersion: 1;
  readonly kind: "quest.promotion-record.v1";
  readonly version: string;
  readonly recordedAt: string;
  readonly packages: readonly { readonly name: string; readonly priorLatest: string }[];
}

export function readDistTags(
  name: string,
  options?: { fetchFn?: typeof fetch },
): Promise<DistTags>;

export function planPromotion(options: {
  version: string;
  packages?: readonly string[];
  readTags?: ReadTags;
  now?: () => Date;
  resuming?: boolean;
}): Promise<
  | { ok: true; record: PromotionRecord }
  | { ok: false; problems: string[] }
>;

export function validateRecord(
  record: unknown,
  options?: { version?: string; packages?: readonly string[] },
): { ok: boolean; problems: string[] };

export function checkRollbackState(options: {
  record: PromotionRecord;
  readTags?: ReadTags;
}): Promise<{ ok: boolean; problems: string[] }>;

export function promote(options: {
  record: PromotionRecord;
  setTag: SetTag;
  log?: (line: string) => void;
}): Promise<
  | { ok: true; moved: string[] }
  | {
      ok: false;
      moved: string[];
      failed: string;
      restored: { ok: boolean; failed: string[] };
    }
>;

export function rollback(options: {
  record: PromotionRecord;
  setTag: SetTag;
  log?: (line: string) => void;
}): Promise<{ ok: boolean; failed: string[] }>;

export function verifyTags(options: {
  expected: Readonly<Record<string, string>>;
  readTags?: ReadTags;
  attempts?: number;
  delayMs?: number;
  sleep?: (ms: number) => Promise<void>;
}): Promise<{ ok: boolean; attempts: number; wrong: string[] }>;
