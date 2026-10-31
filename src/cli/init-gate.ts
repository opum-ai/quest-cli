/**
 * QCLI-543 / ODOC-556: the one place `quest init` decides whether its wizard
 * runs, and what it says when it does not.
 *
 * Before this, a bare `quest init` on a stream that did not report as a TTY
 * (an IDE terminal, Git Bash/mintty on Windows, a CI runner) quietly took the
 * scripted path, wrote no agent instructions or skill, and printed nothing --
 * indistinguishable from the wizard having run and the user choosing nothing.
 * The decision is a pure function of its inputs so it can be tested with
 * Windows-shaped stream properties without a Windows host.
 */

export interface InitGateInput {
  readonly reconfigure: boolean;
  readonly stdoutIsTty: boolean;
  readonly stdinIsTty: boolean;
  /** --json or --plain was given: the caller chose a machine mode. */
  readonly explicitOutputMode: boolean;
  /** Any of --agent-instructions, --name, --task-id-prefix, --skill-source. */
  readonly explicitFlagsGiven: boolean;
}

export interface InitGate {
  /** Run the wizard. */
  readonly interactive: boolean;
  /** Print the non-interactive notice: the run is BARE (the caller asked for
   * nothing specific) and the wizard cannot run only because a stream is not a
   * terminal. A caller that passed any flag or an output mode made a
   * deliberate scripted call and gets a clean stderr. */
  readonly notice: boolean;
}

export function initGate(input: InitGateInput): InitGate {
  const bare =
    !input.reconfigure &&
    !input.explicitOutputMode &&
    !input.explicitFlagsGiven;
  const terminal = input.stdoutIsTty && input.stdinIsTty;
  return { interactive: bare && terminal, notice: bare && !terminal };
}

/** The shared notice wording (agreed with lore-cli, tool name the only
 * variable). Goes to stderr; the exit code is unchanged and the workspace is
 * still initialized. */
export function nonInteractiveInitNotice(input: {
  readonly stdinIsTty: boolean;
  readonly stdoutIsTty: boolean;
}): string {
  return `quest init: no interactive terminal was detected (stdin is a TTY: ${input.stdinIsTty}, stdout is a TTY: ${input.stdoutIsTty}), so the wizard did not run and no agent instructions or skill were written. Re-run in a terminal, or pass the flags: --agent-instructions --target <claude|codex|antigravity> (and --skill-source <repo|plugin|none>).\n`;
}
