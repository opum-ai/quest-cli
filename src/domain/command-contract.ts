export const exitCodes = {
  success: 0,
  uncaught: 1,
  usage: 2,
  notFound: 3,
  denied: 4,
  conflict: 5,
  validationOrDrift: 6,
} as const;

export type ExitCode = (typeof exitCodes)[keyof typeof exitCodes];

export interface ResultEnvelope<TData extends object | readonly unknown[]> {
  readonly schemaVersion: 1;
  readonly kind: `${string}.${string}`;
  readonly data: TData;
  readonly principal: null;
}

export interface DiagnosticEnvelope {
  readonly error_type:
    | "uncaught"
    | "usage"
    | "not_found"
    | "denied"
    | "conflict"
    | "validation"
    | "drift";
  readonly message: string;
  readonly hint?: string;
  readonly input?: object;
  readonly principal: null;
}
