/** File operations needed to maintain an opted-in project agent instruction file. */
export interface AgentInstructionPort {
  read(path: string): Promise<string | undefined>;
  write(path: string, content: string): Promise<void>;
}
