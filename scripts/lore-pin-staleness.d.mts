// Types for the lore pin staleness detector (QCLI-358).

export const LORE_PACKAGE: string;
export const GATE_WORKFLOW: string;
export const ISSUE_LABEL: string;

type Run = (
  command: string,
  args: readonly string[],
  options?: Record<string, unknown>,
) => Promise<{ stdout: string; stderr: string }>;

export type Schemas = ReadonlyMap<string, string>;

export type Verdict =
  | { readonly state: "current"; readonly pin: string; readonly newest: string }
  | {
      readonly state: "behind";
      readonly pin: string;
      readonly newest: string;
      readonly schemaChanging: boolean;
      readonly differences: readonly string[];
      readonly schemasRead: Readonly<Record<string, number>>;
    };

export function readPin(workflowText: string): string;

export function compareVersions(a: string, b: string): number;

export function readNewest(options?: { run?: Run }): Promise<string>;

export function exportSchemas(
  version: string,
  options?: { run?: Run },
): Promise<Schemas>;

export function schemaDifferences(a: Schemas, b: Schemas): string[];

export function evaluate(options: {
  pin: string;
  newest: string;
  schemasAt: (version: string) => Promise<Schemas>;
}): Promise<Verdict>;

export function issueTitle(verdict: Verdict): string;

export function issueBody(verdict: Verdict): string;

export function syncIssue(
  verdict: Verdict,
  options?: { run?: Run },
): Promise<string>;
