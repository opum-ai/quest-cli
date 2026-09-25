import type {
  AgentPluginPort,
  AgentRuntime,
} from "../../ports/agent-plugins.ts";
import type { AgentInstructionTarget } from "./agent-instructions.ts";

export type { AgentRuntime } from "../../ports/agent-plugins.ts";

/** The opum-quest plugin as both runtimes name it: plugin@marketplace. */
export const questPluginId = "opum-quest@opum";
const marketplaceName = "opum";
const marketplaceRepository = "opum-ai/opum-marketplace";

/**
 * QCLI-371, ADR Amendment 2 (ruling 20): four states. "disabled" is
 * installed with enabled:false and is never reported as installed, because
 * a disabled plugin's skill does not reach the agent. "not-detectable" is
 * reported when the runtime's own CLI could not be asked (absent, failed, or
 * unparseable), and is never folded into "not-installed".
 */
export type AgentPluginState =
  | "installed"
  | "disabled"
  | "not-installed"
  | "not-detectable";

export interface AgentPluginCheck {
  readonly runtime: AgentRuntime;
  readonly id: string;
  readonly state: AgentPluginState;
  readonly version?: string;
  /** The install scope that decided the state, where the runtime has one. */
  readonly scope?: string;
  /** Why the state is not-detectable. */
  readonly reason?: string;
  /** What to run next, printed and never executed by init or --check. */
  readonly remedy?: string;
}

/** The outcome of `agents --update-instructions`' plugin step. */
export interface AgentPluginUpdateReport extends AgentPluginCheck {
  /** "ran" only for an installed plugin; every other state is reported with
   * its remedy and nothing is run (ruling 21: never install, never enable). */
  readonly update: "ran" | "not-run";
  readonly updateOk?: boolean;
  readonly updateDetail?: string;
}

/** The runtime whose plugin serves an instruction target; antigravity has
 * no marketplace plugin, so it gets no check. */
export function runtimeForTarget(
  target: AgentInstructionTarget | undefined,
): AgentRuntime | undefined {
  if (target === "claude") return "claude";
  if (target === "codex" || target === undefined) return "codex";
  return undefined;
}

export function questPluginUpdateCommand(
  runtime: AgentRuntime,
  scope?: string,
): string {
  return runtime === "claude"
    ? `claude plugin update ${questPluginId}${scope !== undefined ? ` --scope ${scope}` : ""}`
    : `codex plugin marketplace upgrade ${marketplaceName} && codex plugin add ${questPluginId}`;
}

function remedyFor(
  runtime: AgentRuntime,
  state: AgentPluginState,
  scope?: string,
): string | undefined {
  const cli = runtime === "claude" ? "claude" : "codex";
  if (state === "not-installed")
    return runtime === "claude"
      ? `${cli} plugin marketplace add ${marketplaceRepository} && ${cli} plugin install ${questPluginId}`
      : `${cli} plugin marketplace add ${marketplaceRepository} && ${cli} plugin add ${questPluginId}`;
  if (state === "disabled")
    // Codex has no enable command (codex-cli 0.155.1); enablement is this
    // config key, which is what its own list command reads.
    return runtime === "claude"
      ? `${cli} plugin enable ${questPluginId}${scope !== undefined ? ` --scope ${scope}` : ""}`
      : `set enabled = true under [plugins."${questPluginId}"] in $CODEX_HOME/config.toml (default ~/.codex/config.toml)`;
  if (state === "installed") return questPluginUpdateCommand(runtime, scope);
  return undefined;
}

/** Detects the opum-quest plugin through the runtime's own list command.
 * Read-only: init and --check call only this (ruling 19). */
export async function detectQuestPlugin(
  port: AgentPluginPort,
  runtime: AgentRuntime,
): Promise<AgentPluginCheck> {
  const listing = await port.list(runtime);
  if (listing.kind === "unavailable")
    return {
      runtime,
      id: questPluginId,
      state: "not-detectable",
      reason: listing.reason,
    };
  const row = listing.plugins.find((plugin) => plugin.id === questPluginId);
  const state: AgentPluginState =
    row === undefined
      ? "not-installed"
      : row.enabled === false
        ? "disabled"
        : "installed";
  const remedy = remedyFor(runtime, state, row?.scope);
  return {
    runtime,
    id: questPluginId,
    state,
    ...(row?.version !== undefined ? { version: row.version } : {}),
    ...(row?.scope !== undefined ? { scope: row.scope } : {}),
    ...(remedy !== undefined ? { remedy } : {}),
  };
}

/**
 * The manual update command's plugin step (ruling 19, second bullet):
 * invoking `agents --update-instructions` is consent to updating an
 * installed plugin, so it runs the update. It is not consent to installing
 * or enabling one (ruling 21), so every other state is only reported.
 */
export async function updateQuestPlugin(
  port: AgentPluginPort,
  runtime: AgentRuntime,
  runtimeNamed: boolean,
): Promise<AgentPluginUpdateReport> {
  const detected = await detectQuestPlugin(port, runtime);
  // Ruling 25: consent covers only a runtime the user NAMED with --target.
  // A bare call resolves to the codex default for the instructions, but for
  // the plugin it reports and prints the update command without running it.
  if (detected.state !== "installed" || !runtimeNamed)
    return { ...detected, update: "not-run" };
  const outcome = await port.update(runtime, questPluginId, detected.scope);
  const { remedy: _remedy, ...rest } = detected;
  return {
    ...rest,
    update: "ran",
    updateOk: outcome.ok,
    updateDetail: outcome.detail,
    // A failed update keeps its command visible so it can be run by hand.
    ...(outcome.ok
      ? {}
      : { remedy: questPluginUpdateCommand(runtime, detected.scope) }),
  };
}
