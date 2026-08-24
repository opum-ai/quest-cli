import { LocalAgentInstructionPort } from "../adapters/agents/local-agent-instructions.ts";
import { BacklogImporter } from "../adapters/migration/backlog/importer.ts";
import { LocalPlanningRepository } from "../adapters/planning/local-planning-repository.ts";
import { LocalWorkspacePort } from "../adapters/workspaces/local-workspaces.ts";
import { PlanningService } from "../application/planning/planning.ts";
import { TaskService } from "../application/tasks/tasks.ts";
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
    new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      new LocalPlanningRepository(root),
    ),
  );
}

import {
  LocalClaimEvidence,
  LocalTaskRelationshipRepository,
} from "../adapters/claims/local-claim-evidence.ts";
import {
  OpumAgentWorkflowBindingService,
  type TaskBindingReadModel,
} from "../application/claims/opum-agent-workflow.ts";

/** Read model for the public opum-agent-workflow/v1 binding surface. */
export async function createTaskBindingModel(
  root: string,
): Promise<TaskBindingReadModel> {
  const claims = new LocalClaimEvidence(root);
  const relationships = new LocalTaskRelationshipRepository(root);
  const workspace = await createWorkspacePort().inspect(root);
  return {
    subject: async (reference) => {
      try {
        const task = await new TaskService(
          new LocalTaskRepository(join(root, ".quest", "tasks")),
        ).view(reference);
        return { id: task.id, status: task.status };
      } catch {
        return null;
      }
    },
    claimEvents: (taskId) => claims.events(taskId),
    actors: () => claims.actors(),
    relationship: (id) => relationships.find(id),
    repositoryId: async () => workspace.commonDirectory,
  };
}

export function createTaskBindingService(model: TaskBindingReadModel) {
  return new OpumAgentWorkflowBindingService(model);
}
