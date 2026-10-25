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
  /** Where a project-local settings file disables this plugin, which the
   * runtime's listing does not report (DEC-238 (a6), QCLI-531). */
  readonly override?: AgentPluginOverride;
}

/**
 * A Claude settings file that disables a plugin, and the `--scope` a command
 * must name to reach that same file. The listing reports the row's install
 * scope, not this: a local override beside a user-scope row lists as `user`,
 * and an enable command with that scope fails "already enabled at user
 * scope" (DEC-238 (a6) Q1, RULED A).
 */
export interface AgentPluginOverride {
  /** The settings file, relative to the checkout root. */
  readonly file: string;
  /** local for .claude/settings.local.json, project for .claude/settings.json. */
  readonly scope: string;
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
