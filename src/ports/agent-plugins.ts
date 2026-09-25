/**
 * The agent runtimes whose marketplace plugin Quest checks (QCLI-371, opum-doc
 * ADR "Distribute lore and quest agent skills through the plugin
 * marketplace"). Each is reached only through its own public CLI.
 */
export type AgentRuntime = "claude" | "codex";

/** One plugin row as the runtime's own list command reports it. `enabled`
 * is absent when the runtime does not report enablement; it is never
 * inferred. */
export interface ListedAgentPlugin {
  readonly id: string;
  readonly enabled?: boolean;
  readonly version?: string;
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
}

/** Reads and updates a runtime's installed plugins. Installing and enabling
 * are deliberately absent: Quest prints those commands, never runs them. */
export interface AgentPluginPort {
  list(runtime: AgentRuntime): Promise<AgentPluginListing>;
  update(
    runtime: AgentRuntime,
    pluginId: string,
  ): Promise<AgentPluginUpdateOutcome>;
}
