/** File operations needed to maintain an opted-in project agent instruction file. */
export interface AgentInstructionPort {
  read(path: string): Promise<string | undefined>;
  write(path: string, content: string): Promise<void>;
}

/** Stable failure type shared by instruction use cases and filesystem adapters. */
export class AgentInstructionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentInstructionError";
  }
}
