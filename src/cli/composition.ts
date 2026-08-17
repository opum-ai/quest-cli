import { LocalAgentInstructionPort } from "../adapters/agents/local-agent-instructions.ts";
import { LocalPlanningRepository } from "../adapters/planning/local-planning-repository.ts";
import { LocalWorkspacePort } from "../adapters/workspaces/local-workspaces.ts";
import { PlanningService } from "../application/planning/planning.ts";

/** The sole CLI composition root permitted to construct concrete adapters. */
export function createAgentInstructionPort(root: string) {
  return new LocalAgentInstructionPort(root);
}

export function createPlanningService(root: string): PlanningService {
  return new PlanningService(new LocalPlanningRepository(root));
}

export function createWorkspacePort() {
  return new LocalWorkspacePort();
}
