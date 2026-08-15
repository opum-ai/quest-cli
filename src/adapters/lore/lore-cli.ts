export class LoreUnavailableError extends Error {
  readonly kind = "unavailable" as const;
}

interface LoreProjection {
  readonly schemaVersion: 1;
  readonly kind: "projection.export";
  readonly data: {
    readonly projectionSchemaVersion: "1.0";
    readonly records: readonly unknown[];
  };
}

/** Invokes only Lore's published `export --json` command; no Lore storage is read. */
export class LoreCliProjectionReader {
  constructor(
    private readonly options: {
      readonly executable?: string;
      readonly cwd?: string;
    } = {},
  ) {}

  async exportProjection(): Promise<LoreProjection> {
    let child: ReturnType<typeof Bun.spawn>;
    try {
      child = Bun.spawn(
        [this.options.executable ?? "lore", "export", "--json"],
        { cwd: this.options.cwd, stdout: "pipe", stderr: "pipe" },
      );
    } catch {
      throw new LoreUnavailableError("Lore could not be started.");
    }
    if (
      !(child.stdout instanceof ReadableStream) ||
      !(child.stderr instanceof ReadableStream)
    )
      throw new LoreUnavailableError("Lore export streams are unavailable.");
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    if (exitCode !== 0)
      throw new LoreUnavailableError(stderr.trim() || "Lore export failed.");
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new LoreUnavailableError("Lore export did not return JSON.");
    }
    return parsed as LoreProjection;
  }
}
