import type {
  AgentPluginListing,
  AgentPluginPort,
  AgentPluginUpdateOutcome,
  AgentRuntime,
  ListedAgentPlugin,
} from "../../ports/agent-plugins.ts";

/** Listing is a local read (measured 0.14s claude, 0.44s codex); a hung
 * runtime must not hang init or --check. */
const listTimeoutMs = 15_000;
/** Updating fetches the marketplace; `codex plugin marketplace upgrade` was
 * measured at over two minutes on a git fetch. */
const updateTimeoutMs = 600_000;

interface RunResult {
  readonly exitCode: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

async function run(
  argv: readonly string[],
  timeout: number,
): Promise<RunResult | { readonly failure: string }> {
  let child: ReturnType<typeof Bun.spawn>;
  try {
    child = Bun.spawn([...argv], {
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      timeout,
    });
  } catch {
    return { failure: `${argv[0]} was not found on PATH.` };
  }
  if (
    !(child.stdout instanceof ReadableStream) ||
    !(child.stderr instanceof ReadableStream)
  )
    return { failure: `${argv[0]} output streams are unavailable.` };
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (child.signalCode !== null)
    return {
      failure: `${argv.join(" ")} did not finish within ${timeout / 1000}s.`,
    };
  return { exitCode, stdout, stderr };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Keeps `enabled` only when the runtime reported it as a boolean; a missing
 * or malformed field stays absent rather than being guessed. */
function toListed(
  id: unknown,
  row: Record<string, unknown>,
): ListedAgentPlugin | undefined {
  if (typeof id !== "string") return undefined;
  return {
    id,
    ...(typeof row.enabled === "boolean" ? { enabled: row.enabled } : {}),
    ...(typeof row.version === "string" ? { version: row.version } : {}),
  };
}

/** `claude plugin list --json`: an array of {id, enabled, version, ...}. */
function decodeClaude(
  parsed: unknown,
): readonly ListedAgentPlugin[] | undefined {
  if (!Array.isArray(parsed)) return undefined;
  return parsed.flatMap((row) => {
    const listed = isRecord(row) ? toListed(row.id, row) : undefined;
    return listed ? [listed] : [];
  });
}

/** `codex plugin list --json`: {installed: [{pluginId, enabled, version,
 * ...}], available: [...]}; only `installed` rows are installed. */
function decodeCodex(
  parsed: unknown,
): readonly ListedAgentPlugin[] | undefined {
  if (!isRecord(parsed) || !Array.isArray(parsed.installed)) return undefined;
  return parsed.installed.flatMap((row) => {
    const listed = isRecord(row) ? toListed(row.pluginId, row) : undefined;
    return listed ? [listed] : [];
  });
}

function marketplaceOf(pluginId: string): string {
  return pluginId.slice(pluginId.indexOf("@") + 1);
}

/** Reaches each runtime only through its public CLI, never its internal
 * files (ADR ruling (d): lore and quest detect the same way). */
export class CliAgentPluginPort implements AgentPluginPort {
  async list(runtime: AgentRuntime): Promise<AgentPluginListing> {
    const result = await run(
      [runtime, "plugin", "list", "--json"],
      listTimeoutMs,
    );
    if ("failure" in result)
      return { kind: "unavailable", reason: result.failure };
    if (result.exitCode !== 0)
      return {
        kind: "unavailable",
        reason: `${runtime} plugin list exited ${result.exitCode}: ${result.stderr.trim().slice(0, 200)}`,
      };
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.stdout);
    } catch {
      return {
        kind: "unavailable",
        reason: `${runtime} plugin list --json did not return JSON.`,
      };
    }
    const plugins =
      runtime === "claude" ? decodeClaude(parsed) : decodeCodex(parsed);
    return plugins === undefined
      ? {
          kind: "unavailable",
          reason: `${runtime} plugin list --json returned an unrecognised shape.`,
        }
      : { kind: "listed", plugins };
  }

  async update(
    runtime: AgentRuntime,
    pluginId: string,
  ): Promise<AgentPluginUpdateOutcome> {
    // Codex has no `plugin update` (codex-cli 0.155.1): refreshing the
    // marketplace and re-adding the plugin is its equivalent.
    const steps: readonly (readonly string[])[] =
      runtime === "claude"
        ? [["claude", "plugin", "update", pluginId]]
        : [
            [
              "codex",
              "plugin",
              "marketplace",
              "upgrade",
              marketplaceOf(pluginId),
            ],
            ["codex", "plugin", "add", pluginId],
          ];
    for (const argv of steps) {
      const result = await run(argv, updateTimeoutMs);
      if ("failure" in result) return { ok: false, detail: result.failure };
      if (result.exitCode !== 0)
        return {
          ok: false,
          detail: `${argv.join(" ")} exited ${result.exitCode}: ${(result.stderr || result.stdout).trim().slice(0, 300)}`,
        };
    }
    return {
      ok: true,
      detail: steps.map((argv) => argv.join(" ")).join(" && "),
    };
  }
}

/** QUEST_AGENT_PLUGINS=off: every runtime reads as not detectable and no
 * runtime CLI is ever started. For a test suite or CI job that must not
 * reach, or update, the machine's real agent install. */
export class DisabledAgentPluginPort implements AgentPluginPort {
  async list(): Promise<AgentPluginListing> {
    return {
      kind: "unavailable",
      reason: "plugin detection is off (QUEST_AGENT_PLUGINS=off).",
    };
  }

  async update(): Promise<AgentPluginUpdateOutcome> {
    return {
      ok: false,
      detail: "plugin detection is off (QUEST_AGENT_PLUGINS=off).",
    };
  }
}
