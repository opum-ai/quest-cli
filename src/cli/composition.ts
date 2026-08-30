import { join } from "node:path";
import { LocalAgentInstructionPort } from "../adapters/agents/local-agent-instructions.ts";
import { BacklogImporter } from "../adapters/migration/backlog/importer.ts";
import { LocalPlanningRepository } from "../adapters/planning/local-planning-repository.ts";
import { LocalWorkspacePort } from "../adapters/workspaces/local-workspaces.ts";
import { BacklogImportService } from "../application/migration/backlog-public.ts";
import { PlanningService } from "../application/planning/planning.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import {
  defaultTaskLifecyclePolicy,
  TaskService,
} from "../application/tasks/tasks.ts";

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
  taskIdPrefix?: string,
) {
  return new BacklogImportService(
    root,
    new BacklogImporter(source, { backlogDirectory }),
    new LocalTaskRepository(
      join(root, ".quest", "tasks"),
      new LocalPlanningRepository(root),
    ),
    new LocalPlanningRepository(root),
    taskIdPrefix,
  );
}

import { GitSnapshotEvidence } from "../adapters/claims/local-claim-evidence.ts";
import { LocalGitPort } from "../adapters/git/local-git.ts";
import {
  OpumAgentWorkflowBindingService,
  type TaskBindingReadModel,
} from "../application/claims/opum-agent-workflow.ts";

/** Read model for the public opum-agent-workflow/v1 binding surface. */
export async function createTaskBindingModel(
  root: string,
): Promise<TaskBindingReadModel> {
  const git = new LocalGitPort();
  // One immutable revision snapshot backs every evidence read. A freshly
  // initialized workspace may have no commits yet; all evidence reads then
  // resolve to absent.
  let revision: string;
  try {
    revision = await git.readRevision(root, "HEAD");
  } catch {
    const workspace2 = await createWorkspacePort().inspect(root);
    return {
      subject: async () => null,
      claimEvents: async () => [],
      actors: async () => [],
      relationship: async () => null,
      repositoryId: async () => workspace2.commonDirectory,
    };
  }
  const snapshot = new GitSnapshotEvidence(git, root, revision);
  const workspace = await createWorkspacePort().inspect(root);
  return {
    subject: (reference) => snapshot.task(reference),
    claimEvents: (taskId) => snapshot.events(taskId),
    actors: () => snapshot.actors(),
    relationship: (id) => snapshot.relationship(id),
    relationshipForTask: (taskId) => snapshot.relationshipForTask(taskId),
    repositoryId: async () => workspace.commonDirectory,
  };
}

export function createTaskBindingService(model: TaskBindingReadModel) {
  return new OpumAgentWorkflowBindingService(model);
}

/** Sole composition root for the CLI task service with milestone closure capability. */
export function createTaskService(root: string): TaskService {
  const repository = new LocalTaskRepository(
    join(root, ".quest", "tasks"),
    new LocalPlanningRepository(root),
  );
  return new TaskService(
    repository,
    defaultTaskLifecyclePolicy,
    undefined,
    new LocalPlanningRepository(root),
    // Real typed batch capability port (QCLI-122 blocker #4): no casting.
    repository,
  );
}
