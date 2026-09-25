import { realpathSync } from "node:fs";
import { sep } from "node:path";
import type {
  AgentPluginListing,
  AgentPluginPort,
  AgentPluginUpdateOutcome,
  AgentRuntime,
  ListedAgentPlugin,
} from "../../ports/agent-plugins.ts";

/** Listing is a local read (measured 0.14s claude, 0.44s codex); a hung
 * runtime must not hang init or --check. */
const defaultListTimeoutMs = 15_000;
/** Updating fetches the marketplace; `codex plugin marketplace upgrade` was
 * measured at over two minutes on a git fetch. */
const defaultUpdateTimeoutMs = 600_000;

type RunResult =
  | {
      readonly exitCode: number;
      readonly stdout: string;
      readonly stderr: string;
    }
  | { readonly failure: string };

/**
 * Runs one runtime command with a HARD deadline. Bun's own `timeout` sends a
 * single SIGTERM and then still waits for the output pipes, which a
 * grandchild can hold open (the codex Node launcher forwards TERM to its
 * native binary and waits for it), so the deadline here stops waiting,
 * SIGKILLs the child, and returns (QCLI-371 review).
 */
async function run(
  argv: readonly string[],
  timeoutMs: number,
  env: Record<string, string | undefined> | undefined,
): Promise<RunResult> {
  let child: ReturnType<typeof Bun.spawn>;
  try {
    child = Bun.spawn([...argv], {
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      ...(env ? { env } : {}),
    });
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    return {
      failure:
        code === "ENOENT"
          ? `${argv[0]} was not found on PATH.`
          : `${argv[0]} could not be started (${String(code ?? error)}).`,
    };
  }
  if (
    !(child.stdout instanceof ReadableStream) ||
    !(child.stderr instanceof ReadableStream)
  )
    return { failure: `${argv[0]} output streams are unavailable.` };
  const completed = Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), timeoutMs);
  });
  const outcome = await Promise.race([completed, deadline]);
  clearTimeout(timer);
  if (outcome === "timeout") {
    child.kill("SIGKILL");
    // Do not keep this process alive for pipes a grandchild still holds.
    child.unref();
    return {
      failure: `${argv.join(" ")} did not finish within ${timeoutMs / 1000}s.`,
    };
  }
  const [exitCode, stdout, stderr] = outcome;
  if (child.signalCode !== null)
    return {
      failure: `${argv.join(" ")} was terminated by ${child.signalCode}.`,
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
  scope?: string,
): ListedAgentPlugin | undefined {
  if (typeof id !== "string") return undefined;
  return {
    id,
    ...(typeof row.enabled === "boolean" ? { enabled: row.enabled } : {}),
    ...(typeof row.version === "string" ? { version: row.version } : {}),
    ...(scope !== undefined ? { scope } : {}),
  };
}

function canonical(path: string): string {
  try {
    return realpathSync(path);
  } catch {
    return path;
  }
}

/** Claude's scope precedence, most specific first: a local or project
 * setting overrides the user's, which overrides a managed default. */
const claudeScopePrecedence = ["local", "project", "user", "managed", "synced"];

/**
 * `claude plugin list --json`: an array with one row PER SCOPE, each
 * {id, scope, enabled, version, projectPath}. A local or project row
 * carries the projectPath it belongs to, and applies only there, so rows for
 * other projects are dropped and the most specific applicable row decides
 * enablement (QCLI-371 review: a foreign local row read as installed, and a
 * this-project disabled row could be masked by an enabled user row).
 */
function decodeClaude(
  parsed: unknown,
  root: string,
): readonly ListedAgentPlugin[] | undefined {
  if (!Array.isArray(parsed)) return undefined;
  const here = canonical(root);
  const byId = new Map<string, { rank: number; listed: ListedAgentPlugin }>();
  let decodable = 0;
  for (const row of parsed) {
    if (!isRecord(row) || typeof row.id !== "string") continue;
    decodable += 1;
    const scope = typeof row.scope === "string" ? row.scope : "user";
    if (typeof row.projectPath === "string") {
      const project = canonical(row.projectPath);
      if (here !== project && !here.startsWith(`${project}${sep}`)) continue;
    }
    const rank = claudeScopePrecedence.indexOf(scope);
    const effectiveRank = rank < 0 ? claudeScopePrecedence.length : rank;
    const listed = toListed(row.id, row, scope);
    const current = byId.get(row.id);
    if (listed && (!current || effectiveRank < current.rank))
      byId.set(row.id, { rank: effectiveRank, listed });
  }
  // Rows present but none readable means the shape moved, not that nothing
  // is installed: not-detectable, never not-installed.
  if (parsed.length > 0 && decodable === 0) return undefined;
  return [...byId.values()].map((entry) => entry.listed);
}

/** `codex plugin list --json`: {installed: [{pluginId, enabled, version,
 * ...}], available: [...]}; only `installed` rows are installed. */
function decodeCodex(
  parsed: unknown,
): readonly ListedAgentPlugin[] | undefined {
  if (!isRecord(parsed) || !Array.isArray(parsed.installed)) return undefined;
  const listed = parsed.installed.flatMap((row) => {
    const decoded = isRecord(row) ? toListed(row.pluginId, row) : undefined;
    return decoded ? [decoded] : [];
  });
  if (parsed.installed.length > 0 && listed.length === 0) return undefined;
  return listed;
}

function marketplaceOf(pluginId: string): string {
  return pluginId.slice(pluginId.indexOf("@") + 1);
}

/** Reaches each runtime only through its public CLI, never its internal
 * files (ADR ruling (d): lore and quest detect the same way). */
export class CliAgentPluginPort implements AgentPluginPort {
  constructor(
    private readonly root: string,
    private readonly options: {
      readonly env?: Record<string, string | undefined>;
      readonly listTimeoutMs?: number;
      readonly updateTimeoutMs?: number;
    } = {},
  ) {}

  async list(runtime: AgentRuntime): Promise<AgentPluginListing> {
    const result = await run(
      [runtime, "plugin", "list", "--json"],
      this.options.listTimeoutMs ?? defaultListTimeoutMs,
      this.options.env,
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
      runtime === "claude"
        ? decodeClaude(parsed, this.root)
        : decodeCodex(parsed);
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
    scope?: string,
  ): Promise<AgentPluginUpdateOutcome> {
    const marketplace = marketplaceOf(pluginId);
    // Codex has no `plugin update` (codex-cli 0.155.1): refreshing the
    // marketplace and re-adding the plugin is its equivalent, and the
    // refresh covers every plugin from that marketplace.
    const steps: readonly (readonly string[])[] =
      runtime === "claude"
        ? [
            [
              "claude",
              "plugin",
              "update",
              pluginId,
              ...(scope !== undefined ? ["--scope", scope] : []),
            ],
          ]
        : [
            ["codex", "plugin", "marketplace", "upgrade", marketplace],
            ["codex", "plugin", "add", pluginId],
          ];
    for (const argv of steps) {
      const result = await run(
        argv,
        this.options.updateTimeoutMs ?? defaultUpdateTimeoutMs,
        this.options.env,
      );
      if ("failure" in result) return { ok: false, detail: result.failure };
      if (result.exitCode !== 0)
        return {
          ok: false,
          detail: `${argv.join(" ")} exited ${result.exitCode}: ${(result.stderr || result.stdout).trim().slice(0, 300)}`,
        };
    }
    // Ruling 25: the marketplace-wide side effect is said where it happens.
    return {
      ok: true,
      detail:
        runtime === "codex"
          ? `refreshed the ${marketplace} marketplace for Codex (every ${marketplace} plugin, including opum-lore), then re-added ${pluginId}`
          : steps.map((argv) => argv.join(" ")).join(" && "),
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
