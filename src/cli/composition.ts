import { LocalAgentInstructionPort } from "../adapters/agents/local-agent-instructions.ts";
import { BacklogImporter } from "../adapters/migration/backlog/importer.ts";
import { LocalPlanningRepository } from "../adapters/planning/local-planning-repository.ts";
import { LocalWorkspacePort } from "../adapters/workspaces/local-workspaces.ts";
import { PlanningService } from "../application/planning/planning.ts";
import { BacklogImportService } from "../application/migration/backlog-public.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import { join } from "node:path";

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

export function createBacklogImportService(
  root: string,
  source: string,
  backlogDirectory?: string,
) {
  return new BacklogImportService(
    root,
    new BacklogImporter(source, { backlogDirectory }),
    new LocalTaskRepository(join(root, ".quest", "tasks")),
  );
}
