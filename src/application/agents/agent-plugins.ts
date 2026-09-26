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

/**
 * Runtime-supplied text as one printable line (QCLI-380). Whitespace, line
 * breaks included, collapses to one space first; then ANSI escape sequences
 * and every remaining control byte are removed. A line break would forge a
 * record in --plain output, and an escape sequence would let a runtime drive
 * the reader's terminal.
 *
 * Both regexes are lore-cli's stripAnsiAndControls (src/errors.ts at
 * dc09ca98) byte for byte, so the same runtime text yields the same string
 * from both CLIs (ADR ruling (d)). Keep them identical: an OSC needs its
 * terminator, so an unterminated one loses only its ESC and never swallows
 * the diagnostic text after it.
 */
export function printable(text: string): string {
  return (
    text
      .replace(/\s+/g, " ")
      .replace(
        // CSI, terminated OSC, and two-byte ESC sequences.
        // biome-ignore lint/suspicious/noControlCharactersInRegex: matching control bytes is the purpose
        /\x1b(?:\[[0-9;:<=>?]*[ -/]*[@-~]|\][^\x07\x1b]*(?:\x07|\x1b\\)|[ -~])/g,
        "",
      )
      // biome-ignore lint/suspicious/noControlCharactersInRegex: matching control bytes is the purpose
      .replace(/[\x00-\x1f\x7f-\x9f]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** A scope goes into a command a user may paste into a shell, and into the
 * update's argv, only when it is a plain token (QCLI-380). Every scope Claude
 * reports (local, project, user, managed, synced) is one. */
export function plainScope(scope: string | undefined): string | undefined {
  return scope !== undefined && /^[A-Za-z0-9_-]+$/.test(scope)
    ? scope
    : undefined;
}

/** ` --scope <scope>`, or nothing when the scope is absent or not a token. */
function scopeFlag(scope: string | undefined): string {
  const token = plainScope(scope);
  return token !== undefined ? ` --scope ${token}` : "";
}

export function questPluginUpdateCommand(
  runtime: AgentRuntime,
  scope?: string,
): string {
  return runtime === "claude"
    ? `claude plugin update ${questPluginId}${scopeFlag(scope)}`
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
      ? `${cli} plugin enable ${questPluginId}${scopeFlag(scope)}`
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
      reason: printable(listing.reason),
    };
  const row = listing.plugins.find((plugin) => plugin.id === questPluginId);
  const state: AgentPluginState =
    row === undefined
      ? "not-installed"
      : row.enabled === false
        ? "disabled"
        : "installed";
  const version =
    row?.version !== undefined ? printable(row.version) : undefined;
  const scope = row?.scope !== undefined ? printable(row.scope) : undefined;
  const remedy = remedyFor(runtime, state, scope);
  return {
    runtime,
    id: questPluginId,
    state,
    ...(version ? { version } : {}),
    ...(scope ? { scope } : {}),
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
  const outcome = await port.update(
    runtime,
    questPluginId,
    plainScope(detected.scope),
  );
  const { remedy: _remedy, ...rest } = detected;
  return {
    ...rest,
    update: "ran",
    updateOk: outcome.ok,
    updateDetail: printable(outcome.detail),
    // A failed update keeps its command visible so it can be run by hand.
    ...(outcome.ok
      ? {}
      : { remedy: questPluginUpdateCommand(runtime, detected.scope) }),
  };
}
