/**
 * Pure agent-plugin text rules shared by the application layer and the CLI
 * agent-plugin adapter, which may import only domain and ports. One copy, so
 * the decoder and the report cannot read the same runtime text two ways.
 */

/**
 * Runtime-supplied text as one printable line (QCLI-380). The Claude
 * decoder ranks a scope in this form too (QCLI-381), so a padded
 * "managed " decides first, as it is then treated as managed. Whitespace, line
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

/**
 * The agent runtimes whose marketplace plugin Quest checks (QCLI-371, opum-doc
 * ADR "Distribute lore and quest agent skills through the plugin
 * marketplace"). Each is reached only through its own public CLI.
 */
export type AgentRuntime = "claude" | "codex";

/** The opum-quest plugin as both runtimes name it: plugin@marketplace. */
export const questPluginId = "opum-quest@opum";
export const marketplaceName = "opum";
export const marketplaceRepository = "opum-ai/opum-marketplace";

/** A scope goes into a command a user may paste into a shell, and into the
 * update's argv, only when it is a plain token (QCLI-380). Every scope Claude
 * reports (local, project, user, managed, synced) is one. */
export function plainScope(scope: string | undefined): string | undefined {
  return scope !== undefined && /^[A-Za-z0-9_-]+$/.test(scope)
    ? scope
    : undefined;
}

/**
 * The argv of each step that updates an installed plugin: the ONE source for
 * both the command the adapter runs and the command a report prints, so the
 * two cannot drift (QCLI-384, lore-cli lorePluginUpdateSteps at 46133fc0).
 * Claude names the deciding scope (ruling 26 iii). Codex has no per-plugin
 * update (codex-cli 0.155.1): refreshing the marketplace and re-adding the
 * plugin is its equivalent, and that refresh covers EVERY plugin the opum
 * marketplace serves (ruling 25). A Claude managed row has NO steps: it is
 * never updated (ruling 28), so `--scope managed` is never built into argv.
 */
export function questPluginUpdateSteps(
  runtime: AgentRuntime,
  scope?: string,
): string[][] {
  if (runtime === "claude" && scope === "managed") return [];
  const token = plainScope(scope);
  return runtime === "claude"
    ? [
        [
          "claude",
          "plugin",
          "update",
          questPluginId,
          ...(token !== undefined ? ["--scope", token] : []),
        ],
      ]
    : [
        ["codex", "plugin", "marketplace", "upgrade", marketplaceName],
        ["codex", "plugin", "add", questPluginId],
      ];
}
