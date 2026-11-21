import { join } from "node:path";
import {
  CliAgentPluginPort,
  DisabledAgentPluginPort,
} from "../adapters/agents/cli-agent-plugins.ts";
import { LocalAgentInstructionPort } from "../adapters/agents/local-agent-instructions.ts";
import { BacklogImporter } from "../adapters/migration/backlog/importer.ts";
import { LocalPlanningRepository } from "../adapters/planning/local-planning-repository.ts";
import { LocalQuestionRepository } from "../adapters/questions/local-question-repository.ts";
import { LocalWorkspacePort } from "../adapters/workspaces/local-workspaces.ts";
import {
  type BacklogIdAllocation,
  BacklogImportService,
} from "../application/migration/backlog-public.ts";
import { PlanningService } from "../application/planning/planning.ts";
import { QuestionService } from "../application/questions/questions.ts";
import { LocalTaskRepository } from "../application/tasks/local-task-repository.ts";
import {
  defaultTaskLifecyclePolicy,
  TaskService,
  type TaskVocabularyContext,
} from "../application/tasks/tasks.ts";

/** The sole CLI composition root permitted to construct concrete adapters. */
export function createAgentInstructionPort(root: string) {
  return new LocalAgentInstructionPort(root);
}

/** QCLI-378: overrides the plugin list deadline, in milliseconds, so a test
 * can prove the deadline bounds the process exit without waiting out the 15s
 * default. Unset, non-numeric or non-positive keeps the default. Matches
 * lore-cli's LORE_AGENT_PLUGINS_TIMEOUT_MS. */
function pluginTimeoutMs(name: string): number | undefined {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** QCLI-371: reads and updates the opum-quest marketplace plugin through
 * each agent runtime's own CLI, unless QUEST_AGENT_PLUGINS=off.
 * QUEST_AGENT_PLUGINS_UPDATE_TIMEOUT_MS overrides the UPDATE deadline, per
 * step, separately from the list's (QCLI-384, lore-cli's
 * LORE_AGENT_PLUGINS_UPDATE_TIMEOUT_MS): the listing budget is seconds and
 * the update budget minutes, and one knob for both would either starve the
 * Codex upgrade or let a hung listing hold init for ten minutes. */
export function createAgentPluginPort(root: string) {
  const listTimeoutMs = pluginTimeoutMs("QUEST_AGENT_PLUGINS_TIMEOUT_MS");
  const updateTimeoutMs = pluginTimeoutMs(
    "QUEST_AGENT_PLUGINS_UPDATE_TIMEOUT_MS",
  );
  return process.env.QUEST_AGENT_PLUGINS === "off"
    ? new DisabledAgentPluginPort()
    : new CliAgentPluginPort(root, {
        ...(listTimeoutMs !== undefined ? { listTimeoutMs } : {}),
        ...(updateTimeoutMs !== undefined ? { updateTimeoutMs } : {}),
      });
}

export function createPlanningService(root: string): PlanningService {
  return new PlanningService(new LocalPlanningRepository(root));
}

/** QCLI-445: the operator-question record store, one file per question. */
export function createQuestionService(root: string): QuestionService {
  return new QuestionService(new LocalQuestionRepository(root));
}

export function createWorkspacePort() {
  return new LocalWorkspacePort();
}

/**
 * QCLI-520: `allocation` wires the migration's minted ids through the SHARED
 * allocator (QCLI-495's lock, ledger and worktree scan). `preview` and `apply`
 * REFUSE by name without it (round 1, MINOR 5); a caller with no Git
 * repository behind its store passes an allocation whose `commonDirectory()`
 * resolves null, which the allocator degrades correctly. Omitted is therefore
 * only for `status`/`rollback`, which mint no id.
 */
export function createBacklogImportService(
  root: string,
  source: string,
  backlogDirectory?: string,
  taskIdPrefix?: string,
  allocation?: BacklogIdAllocation,
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
    allocation,
  );
}

import { GitSnapshotEvidence } from "../adapters/claims/local-claim-evidence.ts";
import { LocalGitPort } from "../adapters/git/local-git.ts";
import { GhRefDiscovery } from "../adapters/refs/gh-ref-discovery.ts";
import { ContinuityCheckService } from "../application/checks/continuity.ts";
import {
  OpumAgentWorkflowBindingService,
  type TaskBindingReadModel,
} from "../application/claims/opum-agent-workflow.ts";
import { AcrossRefsViewService } from "../application/refs/across-refs.ts";
import {
  AcrossRefsLockedService,
  type AcrossRefsView,
} from "../application/refs/across-refs-locked.ts";

/** Inferred rather than annotated with the `ports/git.ts` interface type:
 * `cli` may depend on `application`, never on `ports` directly (see
 * scripts/check-layers.mjs); only this file's construction of the concrete
 * adapter is exempted. */
export function createGitPort() {
  return new LocalGitPort();
}

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
export function createTaskService(
  root: string,
  /** QCLI-330: the workspace's `[tasks]` table, plus any problem reading it. */
  context: TaskVocabularyContext = { vocabulary: {} },
): TaskService {
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
    undefined,
    context.vocabulary,
    context.problem,
    // QCLI-448: readiness derives question-named blockers from this store.
    new LocalQuestionRepository(root),
  );
}

/** QCLI-415: `quest check --continuity` reads a historical record set through
 * the git port and resolves it against the live store through the task
 * service's own all-locations listing, so the check compares exactly the
 * population every other command resolves references against. */
export function createContinuityCheckService(
  root: string,
  tasks: TaskService,
): ContinuityCheckService {
  return new ContinuityCheckService(new LocalGitPort(), tasks, root);
}

/**
 * QCLI-568 Q568-INT (A): the ONE canonical spelling of a clone's common git
 * directory.
 *
 * Two call sites need it, and they spell it differently today:
 *
 *  - the `--across-refs` LOCK resolves it through the workspace port's
 *    `inspect(...).commonDirectory`, which is OS-NATIVE realpath'd
 *    (`src/adapters/workspaces/local-workspaces.ts`, R9/N1). This is the
 *    CANONICAL form and must not be weakened;
 *  - Part B's read CACHE resolves it through `LocalGitPort.commonDirectory`,
 *    which is a plain `resolve` with NO realpath -- a second spelling of the
 *    same directory (on Windows, an 8.3 short name vs the long name).
 *
 * One spelling is what makes every worktree of a clone share one lock AND one
 * cache. Both call sites MUST route through here; the native realpath is the
 * form returned.
 *
 * PART B MUST SWITCH EXACTLY ONE LINE. In `AcrossRefsViewService.resolveCache`
 * (`src/application/refs/across-refs.ts`, the `#763` read-cache, landed as
 * 518acf58), the call
 *
 *     resolved = AcrossRefsCache.underCommonDirectory(
 *       await this.git.commonDirectory(repositoryPath),
 *     );
 *
 * must become this resolver fed the same `repositoryPath`, i.e.
 * `await resolveCanonicalCommonDir(repositoryPath, workspace)` with a
 * `LocalWorkspacePort`. Nothing else in `#763` changes.
 */
export async function resolveCanonicalCommonDir(
  repositoryPath: string,
  workspace: ReturnType<typeof createWorkspacePort>,
): Promise<string> {
  return (await workspace.inspect(repositoryPath)).commonDirectory;
}

/** QCLI-417: the read-only across-refs view. The forge seam is the real `gh`
 * shell-out here; the tests that cannot use a forge inject their own
 * RefDiscoveryPort into AcrossRefsViewService directly.
 *
 * QCLI-568: the view is wrapped in the advisory common-directory lock so two
 * runs from different worktrees of one clone serialise. The lock's common
 * directory comes from {@link resolveCanonicalCommonDir}, i.e. the workspace
 * port's native-realpath'd `inspect(...).commonDirectory` (F9) -- passing the
 * raw relative value would create a stray `<wrong-root>/quest` in the main
 * worktree.
 *
 * QCLI-568 Q568-INT B item 2: the SAME resolver feeds the view's read cache, so
 * the lock and the cache are one spelling of one directory. (Before this, the
 * cache used `LocalGitPort.commonDirectory`'s plain `resolve`, a second
 * spelling of the same place.)
 *
 * R4: `onNote` receives the one-line notes the invocation reports on stderr:
 * the unlocked-path note of DEC-282 (a8), and (QCLI-563 / DEC-282 (a11)) the
 * single note a read-cache FAILURE reports. The CLI passes a collector so the
 * lines travel on `InvocationResult.stderr` on the ORDINARY path. LIMIT: on a
 * THROWN view the CLI writes the collected notes to the REAL `process.stderr`
 * ahead of the error envelope (`src/cli/main.ts`, `acrossRefsListing`) because
 * that envelope is built outside this call -- so an in-process `runQuest`
 * caller sees those notes on the stream, NOT in `result.stderr`. Omitting
 * `onNote` falls back to the lock wrapper's own default sink, and a failed
 * cache stays silent. */
export function createAcrossRefsService(
  onNote?: (line: string) => void,
): AcrossRefsView {
  const git = new LocalGitPort();
  const workspace = createWorkspacePort();
  const canonicalDirectory = (repositoryPath: string) =>
    resolveCanonicalCommonDir(repositoryPath, workspace);
  // One note per invocation across BOTH sinks. DEC-282 (a8) item 2 and (a11)
  // each promise ONE stderr line; a broken common directory fails the lock and
  // the cache for the same cause, and would otherwise report twice. The first
  // note wins (the lock is attempted first); the second would only repeat the
  // cause. A decision for the pair owner if the two lines should both appear.
  let noted = false;
  const once =
    onNote === undefined
      ? undefined
      : (line: string) => {
          if (noted) return;
          noted = true;
          onNote(line);
        };
  const view = new AcrossRefsViewService(
    git,
    new GhRefDiscovery(git),
    undefined,
    undefined,
    undefined,
    once,
    canonicalDirectory,
  );
  return new AcrossRefsLockedService(
    view,
    canonicalDirectory,
    once === undefined ? {} : { writeNote: once },
  );
}
