// The Quest board's non-drawing half: the argv every read and write builds, the
// parsers for both `task list` shapes, and repository discovery.
//
// It is a separate module from `register.tsx` so each of those can be tested
// against the engine without a surface -- the tests import this file directly.

import type {
  Coverage,
  FsLike,
  QuestTask,
  RepoRow,
  StatusFilter,
  TaskDetail,
} from "../types";

export const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "In Progress", label: "In progress" },
  { value: "open", label: "All open" },
  { value: "To Do", label: "To do" },
  { value: "Paused", label: "Paused" },
  { value: "Done", label: "Done (latest 50)" },
  { value: "Closed", label: "Closed (latest 50)" },
];

// The kanban's columns: the open statuses, in the order work moves.
export const COLUMNS = ["To Do", "In Progress", "Paused"] as const;

/**
 * The arguments one `quest task list` read takes.
 *
 * The across-refs read answers about the repository -- origin/dev plus every
 * open pull request head into it -- where the plain read answers about the
 * checkout, uncommitted records included. It costs a forge call per
 * repository, which is why it is the toggle and not the default.
 *
 * `--allow-partial` keeps a ref the run could not read from turning the whole
 * read into a refusal (exit 6): the row draws the incompleteness instead,
 * which is the point the flag exists for.
 */
export function listArgs(status: StatusFilter, readRefs: boolean): string[] {
  const isTerminal = status === "Done" || status === "Closed";
  const filters =
    status === "open"
      ? ["--exclude-status", "Done", "--exclude-status", "Closed", "--limit", "200"]
      : ["--status", status, "--limit", isTerminal ? "50" : "200"];

  return readRefs ? ["--across-refs", "--allow-partial", ...filters] : filters;
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

/** Reads `quest task list --json` output down to the fields the list draws. */
export function parseTaskList(stdout: string): QuestTask[] {
  const parsed = JSON.parse(stdout) as { data?: unknown };
  if (!Array.isArray(parsed.data)) {
    throw new Error("quest output has no data array");
  }

  return parsed.data.map((raw) => {
    const task = raw as Record<string, unknown>;

    return {
      id: String(task.id ?? "?"),
      title: String(task.title ?? ""),
      status: String(task.status ?? ""),
      priority: typeof task.priority === "string" ? task.priority : null,
      labels: asStrings(task.labels),
      proposedBy: null,
      conflict: false,
    };
  });
}

type AcrossRefState = { status?: unknown; refProvenance?: { ref?: unknown } };

/**
 * The status to draw for an id whose states may disagree.
 *
 * `origin/dev` is the landed truth; an entry that exists only on a pull
 * request head carries that state instead. The first state is the fallback,
 * and `conflict` on the entry is what tells the reader the others exist.
 */
export function pickState(states: readonly AcrossRefState[]): string {
  const landed = states.find((state) => state.refProvenance?.ref === "origin/dev");
  const chosen = landed ?? states[0];

  return typeof chosen?.status === "string" ? chosen.status : "";
}

export function parseCoverage(value: unknown): Coverage | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const coverage = value as { complete?: unknown; refsRead?: unknown; refsUnreadable?: unknown };

  return {
    complete: coverage.complete === true,
    refsRead: Array.isArray(coverage.refsRead) ? coverage.refsRead.length : 0,
    refsUnreadable: asStrings(coverage.refsUnreadable),
  };
}

/**
 * Reads `quest task list --across-refs --json` output.
 *
 * The envelope differs from the plain read in both directions: the entries
 * carry `states` per ref rather than a single status, and coverage sits beside
 * `data` at the top level, not inside it.
 */
export function parseAcrossRefs(stdout: string): {
  tasks: QuestTask[];
  coverage: Coverage | null;
} {
  const parsed = JSON.parse(stdout) as { data?: unknown; coverage?: unknown };
  if (!Array.isArray(parsed.data)) {
    throw new Error("quest output has no data array");
  }

  const tasks = parsed.data.map((raw) => {
    const entry = raw as {
      id?: unknown;
      title?: unknown;
      proposedBy?: unknown;
      conflict?: unknown;
      states?: unknown;
    };
    const states = Array.isArray(entry.states) ? (entry.states as AcrossRefState[]) : [];

    return {
      id: String(entry.id ?? "?"),
      title: String(entry.title ?? ""),
      status: pickState(states),
      priority: null,
      labels: [],
      proposedBy: typeof entry.proposedBy === "string" ? entry.proposedBy : null,
      conflict: entry.conflict === true,
    };
  });

  return { tasks, coverage: parseCoverage(parsed.coverage) };
}

/** Reads `quest task view --json` output down to the fields the detail draws. */
export function parseTaskView(stdout: string): TaskDetail {
  const parsed = JSON.parse(stdout) as { data?: unknown };
  const task = parsed.data as Record<string, unknown> | undefined;
  if (!task || typeof task !== "object") {
    throw new Error("quest output has no task");
  }
  const criteria = Array.isArray(task.acceptanceCriteria) ? task.acceptanceCriteria : [];
  const notes = asStrings(task.implementationNotes);
  const dependencies = Array.isArray(task.dependencies)
    ? task.dependencies.map((dep) =>
        typeof dep === "string" ? dep : String((dep as { id?: unknown }).id ?? "?"),
      )
    : [];

  return {
    id: String(task.id ?? "?"),
    title: String(task.title ?? ""),
    status: String(task.status ?? ""),
    priority: typeof task.priority === "string" ? task.priority : null,
    type: typeof task.type === "string" ? task.type : null,
    labels: asStrings(task.labels),
    description: String(task.description ?? ""),
    revision: typeof task.revision === "string" ? task.revision : null,
    criteria: criteria.map((item, at) => {
      const one = item as { text?: unknown; checked?: unknown; position?: unknown };

      return {
        text: String(one.text ?? ""),
        isChecked: one.checked === true,
        position: typeof one.position === "number" ? one.position : at + 1,
      };
    }),
    comments: (Array.isArray(task.comments) ? task.comments : []).map((item) => {
      const one = item as { authorId?: unknown; body?: unknown; createdAt?: unknown };

      return {
        author: String(one.authorId ?? "?"),
        body: String(one.body ?? ""),
        createdAt: String(one.createdAt ?? ""),
      };
    }),
    dependencies,
    latestNote: notes.length > 0 ? (notes[notes.length - 1] ?? null) : null,
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : null,
  };
}

/** The search and repo filters, applied to what was fetched. */
export function filterRows(rows: RepoRow[], query: string, repo: string): RepoRow[] {
  const needle = query.trim().toLowerCase();

  return rows
    .filter((row) => repo === "all" || row.repo === repo)
    .map((row) => ({
      ...row,
      tasks: needle
        ? row.tasks.filter((task) =>
            [task.id, task.title, ...task.labels].some((field) =>
              field.toLowerCase().includes(needle),
            ),
          )
        : row.tasks,
    }));
}

// The arguments every pane edit adds: the operator, acting in their own pane.
export function actorArgs(id: string): string[] {
  return ["--actor", id, "--actor-kind", "human"];
}

/** A comment as Quest stores one. */
export function commentArg(author: string, body: string, nowMs: number): string {
  const createdAt = new Date(nowMs).toISOString();

  return JSON.stringify([{ id: `c-${nowMs}`, authorId: author, body, createdAt }]);
}

/** A Quest workspace is a directory holding `.quest/workspace.toml`. */
export const QUEST_WORKSPACE = ".quest/workspace.toml";

export function parentOf(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const at = trimmed.lastIndexOf("/");

  return at <= 0 ? "/" : trimmed.slice(0, at);
}

/** The Quest workspaces directly under one directory, by name. */
export async function reposUnder(fs: FsLike, root: string): Promise<string[]> {
  let entries: readonly { name: string; kind: string }[];
  try {
    entries = await fs.list(root);
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    if (entry.kind !== "dir" || entry.name.startsWith(".")) {
      continue;
    }
    if (await fs.exists(`${root}/${entry.name}/${QUEST_WORKSPACE}`)) {
      found.push(entry.name);
    }
  }

  return found.sort();
}

/**
 * The fleet root: the nearest ancestor of the session's own directory holding
 * Quest workspaces.
 *
 * Walking up from the session is what keeps a machine path out of the mod --
 * the prototype carried the operator's checkout root as a constant. Five
 * levels is enough for a worktree, which sits three below the root.
 */
export async function discoverRoot(
  fs: FsLike,
  startDir: string,
  levels = 5,
): Promise<{ root: string; repos: string[] } | null> {
  let dir = parentOf(startDir);
  for (let step = 0; step < levels; step += 1) {
    const repos = await reposUnder(fs, dir);
    if (repos.length > 0) {
      return { root: dir, repos };
    }
    const next = parentOf(dir);
    if (next === dir) {
      break;
    }
    dir = next;
  }

  return null;
}

/**
 * The session's own repository, by name.
 *
 * `git rev-parse --git-common-dir` names the repository rather than the
 * worktree the session may be running in, so a worktree session still keys its
 * row -- and its writes -- to the repository the operator knows.
 */
export function repoNameFromGitCommonDir(root: string, commonDir: string | null): string {
  const fallback = root.replace(/\/+$/, "").split("/").pop() ?? root;
  if (!commonDir) {
    return fallback;
  }
  const dotGit = (commonDir.startsWith("/") ? commonDir : `${root}/${commonDir}`).replace(
    /\/+$/,
    "",
  );
  if (!dotGit.endsWith(".git")) {
    return fallback;
  }

  return dotGit.slice(0, -"/.git".length).split("/").pop() ?? fallback;
}
