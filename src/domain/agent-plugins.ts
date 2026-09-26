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
