import type { AgentRuntime } from "../domain/agent-plugins.ts";

export type { AgentRuntime } from "../domain/agent-plugins.ts";

/** One plugin row as the runtime's own list command reports it. `enabled`
 * is absent when the runtime does not report enablement; it is never
 * inferred. */
export interface ListedAgentPlugin {
  readonly id: string;
  readonly enabled?: boolean;
  readonly version?: string;
  /** The install scope whose row decided this entry, where the runtime has
   * scopes (Claude: local, project, user, managed). */
  readonly scope?: string;
}

/** A runtime's installed plugins, or why they could not be read. An
 * unreadable listing is never an empty one: "no plugins" and "could not
 * ask" are different answers. */
export type AgentPluginListing =
  | { readonly kind: "listed"; readonly plugins: readonly ListedAgentPlugin[] }
  | { readonly kind: "unavailable"; readonly reason: string };

export interface AgentPluginUpdateOutcome {
  readonly ok: boolean;
  readonly detail: string;
  /** How many update steps exited 0 before the run stopped: what lets the
   * Codex report say whether the marketplace-wide refresh (step 1) actually
   * happened (QCLI-384, lore-cli 46133fc0). */
  readonly completed: number;
}

/** Reads and updates a runtime's installed plugins. Installing and enabling
 * are deliberately absent: Quest prints those commands, never runs them. */
export interface AgentPluginPort {
  list(runtime: AgentRuntime): Promise<AgentPluginListing>;
  /** Runs questPluginUpdateSteps(runtime, scope), stopping at the first
   * step that fails. */
  update(
    runtime: AgentRuntime,
    scope?: string,
  ): Promise<AgentPluginUpdateOutcome>;
}
