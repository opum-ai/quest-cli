import { atom, read, update } from "claude-code";
import type { EngineInterface, Register } from "claude-code";

import type { FsLike, RepoRow, Scope, StatusFilter, Tab, TaskDetail, View } from "../types";
import {
  COLUMNS,
  STATUSES,
  actorArgs,
  commentArg,
  discoverRoot,
  filterRows,
  listArgs,
  parseAcrossRefs,
  parseTaskList,
  parseTaskView,
  parentOf,
  repoNameFromGitCommonDir,
  reposUnder,
} from "./quest";

const PANE = "quest-board";
const REFRESH_MS = 60_000;
const PREFS_KEY = "opum-quest.board.view";
const DOCK_COLUMNS = 64;
const RAIL_COLUMNS = 22;

const board = atom({ plugin: "opum-quest", key: "board" } as const, {
  rows: [],
  refreshedAt: null,
  isLoading: false,
});
const view = atom({ plugin: "opum-quest", key: "view" } as const, {
  tab: "list",
  scope: "fleet",
  status: "In Progress",
  query: "",
  repo: "all",
  isCollapsed: false,
  readRefs: false,
  selected: null,
  pending: null,
});
const detail = atom({ plugin: "opum-quest", key: "detail" } as const, {
  key: null,
  task: null,
  error: null,
  isLoading: false,
});
const edits = atom({ plugin: "opum-quest", key: "edits" } as const, {
  isWriting: false,
  uncommitted: 0,
});

// Who pane edits are recorded as; the plugin's `actor` option.
let actor = "jdnewhouse";

// The fleet, discovered at session start: the root it was found under, the
// repository names under it, and where each one's checkout is. Local mode adds
// the session's own root.
let fleetRoot: string | null = null;
let repos: string[] = [];
let localRepo: string | null = null;
let discoveryNote: string | null = null;
let isFleetResolved = false;
let pluginOptions: Record<string, unknown> = {};
const dirs = new Map<string, string>();

/**
 * Discovers the fleet once, on whichever comes first: `session.start`, or the
 * first read.
 *
 * The second path is not a fallback for an error -- a pane mounted without a
 * session start (a test, and any host that draws a component without running
 * the session lifecycle) would otherwise draw an empty fleet, and an empty
 * fleet looks exactly like a fleet with nothing in it.
 */
async function ensureFleet($: EngineInterface): Promise<void> {
  if (isFleetResolved) {
    return;
  }
  await resolveFleet($, pluginOptions);
  isFleetResolved = true;
}

function dirFor(repo: string): string {
  return dirs.get(repo) ?? (fleetRoot ? `${fleetRoot}/${repo}` : repo);
}

// Reads this session's own repo, the one place the pane may write, from the session.
async function resolveLocal($: EngineInterface): Promise<string> {
  const root = await $.session.root();
  let name = root.replace(/\/+$/, "").split("/").pop() ?? root;
  try {
    const ran = await $.process.run(["git", "-C", root, "rev-parse", "--git-common-dir"], {
      timeoutMs: 10_000,
    });
    if (ran.exitCode === 0) {
      name = repoNameFromGitCommonDir(root, ran.stdout.trim() || null);
    }
  } catch {
    // Not a checkout, or git is not on PATH: the directory name will do.
  }
  localRepo = name;
  dirs.set(name, root);

  return name;
}

function parseRepoList(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return [...new Set(value.split(/[\s,]+/).filter((one) => one.trim() !== ""))];
}

/**
 * Where the fleet comes from, in the order the plugin's options give it: an
 * explicit list, then an explicit root, then the nearest ancestor of the
 * session's own directory that holds Quest workspaces.
 *
 * Discovery rather than a constant is the point: the list drawn here is the
 * operator's own set of Quest workspaces, not a roster this file has to be
 * edited to follow.
 */
async function resolveFleet($: EngineInterface, options: Record<string, unknown>): Promise<void> {
  dirs.clear();
  fleetRoot = null;
  discoveryNote = null;
  repos = [];
  // A noun of `$` is never passed as a value, so the two calls discovery needs
  // are spelled out at the call site.
  const fs: FsLike = {
    list: (path) => $.fs.list(path),
    exists: (path) => $.fs.exists(path),
  };
  const configured = parseRepoList(options.repos);
  if (configured.length > 0) {
    repos = configured;
    if (typeof options.root === "string" && options.root.trim()) {
      fleetRoot = options.root.trim();
    }
  } else {
    const root = typeof options.root === "string" ? options.root.trim() : "";
    const root_ = root !== "" ? root : null;
    if (root_) {
      fleetRoot = root_;
      repos = await reposUnder(fs, root_);
    } else {
      const sessionRoot = await $.session.root();
      const found = await discoverRoot(fs, sessionRoot);
      if (found) {
        fleetRoot = found.root;
        repos = found.repos;
      } else {
        discoveryNote = `No Quest workspaces found above ${parentOf(sessionRoot)}. Add the plugin's root or repos option, or use this-repo scope.`;
      }
    }
  }
  if (fleetRoot) {
    for (const repo of repos) {
      dirs.set(repo, `${fleetRoot}/${repo}`);
    }
  }
  // The session's own repository is always on the board, even when it sits
  // outside the discovered root -- and it keeps the session's path, not the
  // discovered one, because that is the tree this pane may write in.
  if (localRepo && !repos.includes(localRepo)) {
    repos = [...repos, localRepo].sort();
  }
}

async function quest($: EngineInterface, repo: string, args: string[]) {
  const ran = await $.process.run(["quest", ...args, "--json"], {
    cwd: dirFor(repo),
    timeoutMs: 20_000,
  });
  if (ran.exitCode !== 0) {
    let reason = ran.stderr.trim().split("\n")[0] || `exit ${ran.exitCode}`;
    try {
      const body = JSON.parse(ran.stdout || ran.stderr) as { message?: unknown };
      if (typeof body.message === "string") {
        reason = body.message;
      }
    } catch {
      // Not JSON: keep the first stderr line.
    }
    throw Object.assign(new Error(reason), { exitCode: ran.exitCode });
  }

  return ran.stdout;
}

async function readRepo(
  $: EngineInterface,
  repo: string,
  status: StatusFilter,
  readRefs: boolean,
): Promise<RepoRow> {
  try {
    const stdout = await quest($, repo, ["task", "list", ...listArgs(status, readRefs)]);
    if (readRefs) {
      const { tasks, coverage } = parseAcrossRefs(stdout);

      return { repo, tasks, error: null, coverage };
    }

    return { repo, tasks: parseTaskList(stdout), error: null, coverage: null };
  } catch (error) {
    return {
      repo,
      tasks: [],
      error: error instanceof Error ? error.message : String(error),
      coverage: null,
    };
  }
}

let isRefreshing = false;
let isRefreshQueued = false;

/**
 * Reads every repository in scope.
 *
 * A refresh asked for while one is in flight is not dropped -- it is queued,
 * and the loop reads again with the view as it stands then. Dropping it left
 * the board drawing the previous scope: a toggle or a filter pressed during a
 * read settled back into the read it was meant to replace.
 */
async function refresh($: EngineInterface): Promise<void> {
  if (isRefreshing) {
    isRefreshQueued = true;
    return;
  }
  isRefreshing = true;
  try {
    do {
      isRefreshQueued = false;
      await readScopes($);
    } while (isRefreshQueued);
  } finally {
    isRefreshing = false;
  }
}

async function readScopes($: EngineInterface): Promise<void> {
  await resolveLocal($);
  await ensureFleet($);
  const { scope, status: picked, tab, readRefs } = await read($, view);
  const status: StatusFilter = tab === "kanban" ? "open" : picked;
  const shown = scope === "local" ? (localRepo ? [localRepo] : []) : repos;
  await update($, board, (current) => ({ ...current, isLoading: true }));
  const rows = await Promise.all(shown.map((repo) => readRepo($, repo, status, readRefs)));
  const refreshedAt = await $.clock.now();
  await update($, board, () => ({ rows, refreshedAt, isLoading: false }));
}

async function loadDetail($: EngineInterface, repo: string, id: string): Promise<void> {
  const key = `${repo}:${id}`;
  await update($, detail, () => ({ key, task: null, error: null, isLoading: true }));
  try {
    const stdout = await quest($, repo, ["task", "view", id, "--max-notes", "3"]);
    const task = parseTaskView(stdout);
    await update($, detail, (current) =>
      current.key === key ? { key, task, error: null, isLoading: false } : current,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await update($, detail, (current) =>
      current.key === key ? { key, task: null, error: message, isLoading: false } : current,
    );
  }
}

async function countUncommitted($: EngineInterface): Promise<void> {
  await resolveLocal($);
  if (!localRepo) {
    return;
  }
  const ran = await $.process.run(["git", "status", "--porcelain", "--", ".quest"], {
    cwd: dirFor(localRepo),
    timeoutMs: 10_000,
  });
  const uncommitted =
    ran.exitCode === 0 ? ran.stdout.split("\n").filter((line) => line.trim() !== "").length : 0;
  await update($, edits, (current) => ({ ...current, uncommitted }));
}

// Runs one Quest write in this session's own repo, then reloads what it touched.
async function write(
  $: EngineInterface,
  id: string,
  args: string[],
  done: string,
): Promise<boolean> {
  if (!localRepo) {
    return false;
  }
  const repo = localRepo;
  let isSaved = false;
  await update($, edits, (current) => ({ ...current, isWriting: true }));
  try {
    await quest($, repo, [...args, ...actorArgs(actor)]);
    $.ui.toast(done);
    isSaved = true;
  } catch (error) {
    const failure = error as Error & { exitCode?: number };
    $.ui.toast(
      failure.exitCode === 5
        ? `${id} changed since you opened it. It has been reloaded; try again.`
        : `Could not save ${id}: ${failure.message}`,
    );
  } finally {
    await update($, edits, (current) => ({ ...current, isWriting: false }));
  }
  const { selected } = await read($, view);
  if (selected && selected.repo === repo && selected.id === id) {
    await loadDetail($, repo, id);
  }
  await refresh($);
  await countUncommitted($);

  return isSaved;
}

async function editTask($: EngineInterface, task: TaskDetail, args: string[], done: string) {
  const guard = task.revision ? ["--if-revision", task.revision] : [];
  await write($, task.id, ["task", "edit", task.id, ...args, ...guard], done);
}

async function createTask($: EngineInterface, title: string): Promise<void> {
  const trimmed = title.trim();
  if (!trimmed || !localRepo) {
    return;
  }
  const repo = localRepo;
  try {
    const stdout = await quest($, repo, ["task", "create", trimmed, ...actorArgs(actor)]);
    const id = String((JSON.parse(stdout) as { data?: { id?: unknown } }).data?.id ?? "");
    $.ui.toast(id ? `Created ${id}` : "Created the task");
    await refresh($);
    await countUncommitted($);
    if (id) {
      await select($, repo, id);
    }
  } catch (error) {
    $.ui.toast(
      `Could not create the task: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function closeTask($: EngineInterface, task: TaskDetail): Promise<void> {
  const answer = await $.ui.ask(`Close ${task.id} as won't do?`, ["Close it", "Keep it"]);
  if (answer === "Close it") {
    await write($, task.id, ["task", "close", task.id, "--resolution", "wont-do"], `Closed ${task.id}`);
  }
}

async function savePrefs($: EngineInterface): Promise<void> {
  const { tab, scope, status, isCollapsed, readRefs } = await read($, view);
  await $.store.set(PREFS_KEY, { tab, scope, status, isCollapsed, readRefs });
}

async function openPane($: EngineInterface, isCollapsed: boolean): Promise<void> {
  await $.ui.open({
    id: PANE,
    title: isCollapsed ? "Quest" : "Quest board",
    columns: isCollapsed ? RAIL_COLUMNS : DOCK_COLUMNS,
  });
}

async function setCollapsed($: EngineInterface, isCollapsed: boolean): Promise<void> {
  await update($, view, (current) => ({ ...current, isCollapsed }));
  await savePrefs($);
  await $.ui.close({ id: PANE });
  await openPane($, isCollapsed);
}

async function setScope($: EngineInterface, scope: Scope): Promise<void> {
  await update($, view, (current) => ({ ...current, scope, repo: "all", selected: null }));
  await savePrefs($);
  await refresh($);
}

async function setTab($: EngineInterface, tab: Tab): Promise<void> {
  await update($, view, (current) => ({ ...current, tab, selected: null }));
  await savePrefs($);
  await refresh($);
}

async function setStatus($: EngineInterface, status: StatusFilter): Promise<void> {
  await update($, view, (current) => ({ ...current, status, selected: null }));
  await savePrefs($);
  await refresh($);
}

async function setReadRefs($: EngineInterface, readRefs: boolean): Promise<void> {
  await update($, view, (current) => ({ ...current, readRefs, selected: null }));
  await savePrefs($);
  await refresh($);
}

async function select($: EngineInterface, repo: string, id: string): Promise<void> {
  await update($, view, (current) => ({ ...current, selected: { repo, id }, pending: null }));
  await loadDetail($, repo, id);
}

function clockTime(ms: number): string {
  return new Date(ms).toISOString().slice(11, 16);
}

function statusWords(status: StatusFilter): string {
  return status === "open" ? "open" : status.toLowerCase();
}

function shortName(repo: string): string {
  return repo.replace(/^opum-/, "");
}

/** What the across-refs read managed to read, folded over the rows. */
export function coverageLine(rows: RepoRow[], readRefs: boolean): string | null {
  if (!readRefs) {
    return null;
  }
  const read = rows.filter((row) => row.coverage !== null);
  if (read.length === 0) {
    return null;
  }
  const refs = read.reduce((sum, row) => sum + (row.coverage?.refsRead ?? 0), 0);
  const partial = read.filter((row) => row.coverage?.complete !== true);
  if (partial.length === 0) {
    return `Across refs: ${refs} ref${refs === 1 ? "" : "s"} read, complete.`;
  }

  return `Across refs: ${refs} read, INCOMPLETE in ${partial
    .map((row) => row.repo)
    .join(", ")} -- a ref could not be read there, so an empty row is unread rather than empty.`;
}

function isStoredView(
  value: unknown,
): value is Pick<View, "tab" | "scope" | "status" | "isCollapsed" | "readRefs"> {
  const v = value as Partial<View> | null;

  return (
    !!v &&
    (v.tab === "list" || v.tab === "kanban") &&
    (v.scope === "local" || v.scope === "fleet") &&
    STATUSES.some((s) => s.value === v.status) &&
    typeof v.isCollapsed === "boolean" &&
    (typeof v.readRefs === "boolean" || v.readRefs === undefined)
  );
}

export const register: Register = (on, options) => {
  pluginOptions = options;
  if (typeof options.actor === "string" && options.actor.trim()) {
    actor = options.actor.trim();
  }

  on("session.start", async ($, e, next) => {
    await resolveLocal($);
    await ensureFleet($);

    const stored = await $.store.get(PREFS_KEY);
    if (isStoredView(stored)) {
      await update($, view, (current) => ({
        ...current,
        ...stored,
        readRefs: stored.readRefs === true,
        selected: null,
      }));
    }

    await $.command.register({
      name: "quest-board",
      description: "Open the Quest board. Add fleet, local, refs, collapse or expand.",
    });
    const { isCollapsed } = await read($, view);
    void openPane($, isCollapsed);
    void refresh($);
    void countUncommitted($);
    $.clock.every(REFRESH_MS, () => {
      void (async () => {
        const panes = await $.ui.panes();
        if (panes.some((pane) => pane.id === PANE && pane.isShown)) {
          await refresh($);
          await countUncommitted($);
        }
      })();
    });

    return next(e);
  });

  on("command.run", { command: "quest-board" }, async ($, e) => {
    const arg = e.args.trim().toLowerCase();
    if (arg === "fleet" || arg === "local") {
      await setScope($, arg);
    }
    if (arg === "refs") {
      await setReadRefs($, !(await read($, view)).readRefs);

      return { text: "Quest board read across refs." };
    }
    if (arg === "collapse" || arg === "expand") {
      await setCollapsed($, arg === "collapse");

      return { text: arg === "collapse" ? "Quest board collapsed." : "Quest board expanded." };
    }
    const { isCollapsed, scope } = await read($, view);
    await openPane($, isCollapsed);
    void refresh($);

    return { text: `Quest board opened, showing ${scope === "fleet" ? "the fleet" : "this repo"}.` };
  });

  on("ui.render", { component: "Pane", requestId: PANE }, async ($, e) => {
    const { rows, refreshedAt, isLoading } = await read($, board);
    if (e.surface === "mobile") {
      const { Box, Text } = $.ui.resolve(e);
      const total = rows.reduce((sum, row) => sum + row.tasks.length, 0);

      return (
        <Box flexDirection="column">
          <Text>{total} tasks. Open the board in the terminal or desktop to filter.</Text>
        </Box>
      );
    }
    const { Box, Button, Input, Markdown, Select, Text } = $.ui.resolve(e);
    const current = await read($, view);
    const width = Math.max(16, e.props.bodyColumns);

    const shown = filterRows(rows, current.query, current.repo);
    const busy = shown.filter((row) => row.tasks.length > 0);
    const failed = rows.filter((row) => row.error !== null);
    const total = busy.reduce((sum, row) => sum + row.tasks.length, 0);
    const refsLine = coverageLine(rows, current.readRefs);
    const hasConflict = rows.some((row) => row.tasks.some((task) => task.conflict));

    if (current.isCollapsed) {
      return (
        <Box flexDirection="column">
          {rows.map((row) => (
            <Text dimColor={row.tasks.length === 0} color={row.error ? "red" : undefined} wrap="truncate">
              {shortName(row.repo).padEnd(width - 4)}
              {row.error ? " ?" : String(row.tasks.length).padStart(3)}
            </Text>
          ))}
          <Box marginTop={1}>
            <Text dimColor>
              {total} {statusWords(current.status)}{" "}
            </Text>
          </Box>
          <Button key="expand" label="Expand" hotkey="c" onPress={() => void setCollapsed($, false)} />
        </Box>
      );
    }

    const summary =
      refreshedAt === null
        ? "Reading the trackers…"
        : `${total} ${statusWords(current.status)} ${total === 1 ? "task" : "tasks"} in ${busy.length} ${busy.length === 1 ? "repo" : "repos"}, checked ${clockTime(refreshedAt)}${isLoading ? ", refreshing" : ""}${current.readRefs ? " (across refs)" : ""}`;

    const selectedKey = current.selected ? `${current.selected.repo}:${current.selected.id}` : null;
    const open = selectedKey ? await read($, detail) : null;
    const listRoom = open ? Math.max(5, e.props.scroll.bodyRows - 18) : Number.POSITIVE_INFINITY;
    let drawn = 0;
    await resolveLocal($);
    const task = open?.task ?? null;
    const canEdit =
      !!task && current.selected?.repo === localRepo && task.status !== "Done" && task.status !== "Closed";
    const selectedRow = current.selected
      ? rows.find((row) => row.repo === current.selected?.repo)?.tasks.find(
          (one) => one.id === current.selected?.id,
        )
      : undefined;
    const { isWriting, uncommitted } = await read($, edits);
    const banner =
      uncommitted > 0 && localRepo ? (
        <Box marginTop={1}>
          <Text color="yellow" wrap="truncate">
            {uncommitted} tracker {uncommitted === 1 ? "change" : "changes"} in {localRepo} not committed
            yet.{" "}
          </Text>
          <Button
            key="land"
            label="Ask Claude to land them"
            onPress={() =>
              void $.prompt.fill({
                text: `Land the uncommitted Quest tracker changes in ${localRepo} through a branch and pull request, following the opum-sdlc skill.`,
                mode: "replace",
              })
            }
          />
        </Box>
      ) : null;

    const tabs = (
      <Box>
        <Button
          key="tab-list"
          label="List"
          hotkey="1"
          variant={current.tab === "list" ? "primary" : undefined}
          onPress={() => void setTab($, "list")}
        />
        <Text> </Text>
        <Button
          key="tab-kanban"
          label="Kanban"
          hotkey="2"
          variant={current.tab === "kanban" ? "primary" : undefined}
          onPress={() => void setTab($, "kanban")}
        />
      </Box>
    );

    if (current.tab === "kanban") {
      const columnWidth = Math.max(10, Math.floor((width - 2) / COLUMNS.length));
      const tasks = shown.flatMap((row) => row.tasks.map((task) => ({ repo: row.repo, task })));

      return (
        <Box flexDirection="column">
          {tabs}
          <Input
            key="search"
            placeholder="Filter by id, title or label"
            value={current.query}
            submitLabel="Filter"
            onInput={(value: string) => void update($, view, (v) => ({ ...v, query: value }))}
            onSubmit={(value: string) => void update($, view, (v) => ({ ...v, query: value }))}
          />
          <Text dimColor wrap="truncate">
            {refreshedAt === null
              ? "Reading the trackers…"
              : `${tasks.length} open ${tasks.length === 1 ? "task" : "tasks"} ${current.scope === "fleet" ? "in the fleet" : `in ${localRepo}`}, checked ${clockTime(refreshedAt)}. Read-only: open a task from the List tab to change it.`}
          </Text>
          {banner}
          <Box marginTop={1}>
            {COLUMNS.map((column) => {
              const cards = tasks.filter((item) => item.task.status === column);

              return (
                <Box flexDirection="column" width={columnWidth} marginRight={1}>
                  <Text bold wrap="truncate">
                    {column} ({cards.length})
                  </Text>
                  {cards.slice(0, 30).map((item) => (
                    <Text wrap="truncate" color={item.task.priority === "high" ? "yellow" : undefined}>
                      {item.task.id}
                    </Text>
                  ))}
                  {cards.length > 30 && <Text dimColor>{cards.length - 30} more</Text>}
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }

    return (
      <Box flexDirection="column">
        {tabs}
        <Box>
          <Button
            key="fleet"
            label="Fleet"
            hotkey="f"
            variant={current.scope === "fleet" ? "primary" : undefined}
            onPress={() => void setScope($, "fleet")}
          />
          <Text> </Text>
          <Button
            key="local"
            label={localRepo ?? "This repo"}
            hotkey="l"
            variant={current.scope === "local" ? "primary" : undefined}
            onPress={() => void setScope($, "local")}
          />
          <Text> </Text>
          <Button
            key="refs"
            label="Refs"
            hotkey="g"
            variant={current.readRefs ? "primary" : undefined}
            onPress={() => void setReadRefs($, !current.readRefs)}
          />
          <Text> </Text>
          <Button key="refresh" label="Refresh" hotkey="r" onPress={() => void refresh($)} />
          <Text> </Text>
          <Button key="collapse" label="Collapse" hotkey="c" onPress={() => void setCollapsed($, true)} />
        </Box>
        <Input
          key="search"
          placeholder="Filter by id, title or label"
          value={current.query}
          submitLabel="Filter"
          onInput={(value: string) => void update($, view, (v) => ({ ...v, query: value, selected: null }))}
          onSubmit={(value: string) => void update($, view, (v) => ({ ...v, query: value }))}
        />
        <Box>
          <Select
            key="status"
            label="Status"
            value={current.status}
            options={STATUSES}
            onSelect={(value: string) => void setStatus($, value as StatusFilter)}
          />
          {current.scope === "fleet" && (
            <Select
              key="repo"
              label="Repo"
              value={current.repo}
              options={[{ value: "all", label: "All repos" }, ...repos.map((repo) => ({ value: repo }))]}
              onSelect={(value: string) =>
                void update($, view, (v) => ({ ...v, repo: value, selected: null }))
              }
            />
          )}
        </Box>
        <Text dimColor wrap="truncate">
          {summary}
        </Text>
        {refsLine && (
          <Text dimColor={!refsLine.includes("INCOMPLETE")} color={refsLine.includes("INCOMPLETE") ? "yellow" : undefined} wrap="truncate">
            {refsLine}
          </Text>
        )}
        {discoveryNote && current.scope === "fleet" && (
          <Text dimColor wrap="truncate">
            {discoveryNote}
          </Text>
        )}
        {hasConflict && (
          <Text dimColor wrap="truncate">
            * marks a task whose refs disagree about its status; origin/dev is drawn where it has one.
            Resolving it is that repository&apos;s session&apos;s call.
          </Text>
        )}
        {current.scope === "local" && localRepo && (
          <Input
            key="new-task"
            placeholder={`New task in ${localRepo}`}
            submitLabel="Create"
            onSubmit={(value: string) => void createTask($, value)}
          />
        )}
        {banner}

        {refreshedAt !== null && total === 0 && failed.length === 0 && (
          <Box marginTop={1}>
            <Text dimColor>
              {current.query
                ? "No tasks match. Clear the filter or pick another status."
                : `No ${statusWords(current.status)} tasks ${current.scope === "fleet" ? "in the fleet" : "in this repo"}.`}
            </Text>
          </Box>
        )}

        {busy.map((row) => {
          if (drawn >= listRoom) {
            return null;
          }

          return (
            <Box key={row.repo} flexDirection="column" marginTop={1}>
              <Text bold>{row.repo}</Text>
              {row.tasks.map((task) => {
                drawn += 1;
                if (drawn > listRoom) {
                  return null;
                }
                const key = `${row.repo}:${task.id}`;
                const mark = task.conflict ? "*" : task.priority === "high" ? "!" : " ";
                const proposed = task.proposedBy ? `  [${task.proposedBy}]` : "";
                const label = `${mark} ${task.id}  ${task.title}${proposed}`;
                if (key === selectedKey) {
                  return (
                    <Text key={key} inverse wrap="truncate">
                      {label}
                    </Text>
                  );
                }

                return (
                  <Button
                    key={`row:${key}`}
                    plain
                    label={label.length > width ? `${label.slice(0, width - 1)}…` : label}
                    onPress={() => void select($, row.repo, task.id)}
                  />
                );
              })}
            </Box>
          );
        })}
        {drawn > listRoom && (
          <Text dimColor>{drawn - listRoom} more. Close the details to see them all.</Text>
        )}

        {failed.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="red">Could not read:</Text>
            {failed.map((row) => (
              <Text key={row.repo} dimColor wrap="truncate">
                {"  "}
                {row.repo}: {row.error}
              </Text>
            ))}
          </Box>
        )}

        {open && (
          <Box flexDirection="column" marginTop={1}>
            <Text dimColor>{"─".repeat(width)}</Text>
            {open.isLoading && <Text dimColor>Loading {current.selected?.id}…</Text>}
            {open.error && (
              <Text color="red">
                Could not load {current.selected?.id}: {open.error}
              </Text>
            )}
            {open.error && selectedRow?.proposedBy && (
              <Text dimColor wrap="wrap">
                {current.selected?.id} exists on {selectedRow.proposedBy} and not in this checkout, so the
                detail reads nothing here. It is on the board from the refs read.
              </Text>
            )}
            {open.task && (
              <Box flexDirection="column">
                <Text bold wrap="wrap">
                  {open.task.id} {open.task.title}
                </Text>
                <Text dimColor wrap="truncate">
                  {[
                    open.task.status,
                    open.task.priority ? `${open.task.priority} priority` : null,
                    open.task.type,
                    open.task.updatedAt
                      ? `updated ${open.task.updatedAt.slice(0, 16).replace("T", " ")}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Text>
                {open.task.labels.length > 0 && (
                  <Text dimColor wrap="truncate">
                    Labels: {open.task.labels.join(", ")}
                  </Text>
                )}
                {open.task.description && (
                  <Box marginTop={1}>
                    <Markdown
                      text={
                        open.task.description.length > 700
                          ? `${open.task.description.slice(0, 700)}…`
                          : open.task.description
                      }
                    />
                  </Box>
                )}
                {open.task.criteria.length > 0 && (
                  <Box flexDirection="column" marginTop={1}>
                    <Text>
                      Acceptance criteria, {open.task.criteria.filter((c) => c.isChecked).length} of{" "}
                      {open.task.criteria.length} checked
                    </Text>
                    {open.task.criteria.slice(0, 8).map((item) =>
                      canEdit && task ? (
                        <Button
                          key={`ac:${item.position}`}
                          plain
                          label={`${item.isChecked ? "☑" : "☐"} ${item.text}`.slice(0, width)}
                          onPress={() =>
                            void editTask(
                              $,
                              task,
                              [item.isChecked ? "--uncheck-ac" : "--check-ac", String(item.position)],
                              `${item.isChecked ? "Unchecked" : "Checked"} criterion ${item.position} on ${task.id}`,
                            )
                          }
                        />
                      ) : (
                        <Text key={`ac:${item.position}`} dimColor={item.isChecked} wrap="truncate">
                          {item.isChecked ? "☑ " : "☐ "}
                          {item.text}
                        </Text>
                      ),
                    )}
                  </Box>
                )}
                {open.task.dependencies.length > 0 && (
                  <Text dimColor wrap="truncate">
                    Depends on {open.task.dependencies.join(", ")}
                  </Text>
                )}
                {open.task.latestNote && (
                  <Box flexDirection="column" marginTop={1}>
                    <Text>Latest note</Text>
                    <Text dimColor wrap="wrap">
                      {open.task.latestNote.length > 400
                        ? `${open.task.latestNote.slice(0, 400)}…`
                        : open.task.latestNote}
                    </Text>
                  </Box>
                )}
              </Box>
            )}
            {open.task && open.task.comments.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text>Comments</Text>
                {open.task.comments.slice(-3).map((comment) => (
                  <Text
                    key={`${comment.author}-${comment.createdAt}`}
                    dimColor
                    wrap="wrap"
                  >
                    {comment.author}, {comment.createdAt.slice(0, 16).replace("T", " ")}:{" "}
                    {comment.body.length > 300 ? `${comment.body.slice(0, 300)}…` : comment.body}
                  </Text>
                ))}
              </Box>
            )}
            {open.task && current.selected && current.selected.repo !== localRepo && (
              <Box marginTop={1}>
                <Text dimColor wrap="wrap">
                  Read-only here. {current.selected.repo} is edited from its own session.
                </Text>
              </Box>
            )}
            {canEdit && task && (
              <Box flexDirection="column" marginTop={1}>
                <Box>
                  {(task.status === "To Do" || task.status === "Paused") && (
                    <Button
                      key="start"
                      label={task.status === "Paused" ? "Resume" : "Start"}
                      hotkey="s"
                      onPress={() =>
                        void write(
                          $,
                          task.id,
                          ["task", "start", task.id],
                          `${task.status === "Paused" ? "Resumed" : "Started"} ${task.id}`,
                        )
                      }
                    />
                  )}
                  {task.status === "In Progress" && (
                    <Button
                      key="pause"
                      label="Pause"
                      hotkey="p"
                      onPress={() => void write($, task.id, ["task", "pause", task.id], `Paused ${task.id}`)}
                    />
                  )}
                  {task.status === "In Progress" && <Text> </Text>}
                  {task.status === "In Progress" && (
                    <Button
                      key="complete"
                      label="Complete"
                      hotkey="d"
                      onPress={() =>
                        void update($, view, (v) => ({ ...v, pending: "complete" as const }))
                      }
                    />
                  )}
                  <Text> </Text>
                  <Button key="close-task" label="Close as won't do" onPress={() => void closeTask($, task)} />
                </Box>
                {current.pending === "complete" && (
                  <Box flexDirection="column" marginTop={1}>
                    <Input
                      key="final-summary"
                      label="Final summary"
                      placeholder="What happened, in a sentence or two"
                      submitLabel="Complete"
                      onSubmit={(value: string) =>
                        void (async () => {
                          const summaryText = value.trim();
                          const isSaved = await write(
                            $,
                            task.id,
                            [
                              "task",
                              "complete",
                              task.id,
                              ...(summaryText ? ["--final-summary", summaryText] : []),
                            ],
                            `Completed ${task.id}`,
                          );
                          if (isSaved) {
                            await update($, view, (v) => ({ ...v, pending: null }));
                          }
                        })()
                      }
                    />
                    <Button
                      key="cancel-complete"
                      label="Cancel"
                      onPress={() => void update($, view, (v) => ({ ...v, pending: null }))}
                    />
                  </Box>
                )}
                <Select
                  key="priority"
                  label="Priority"
                  value={task.priority ?? "medium"}
                  options={[
                    { value: "high", label: "High" },
                    { value: "medium", label: "Medium" },
                    { value: "low", label: "Low" },
                  ]}
                  onSelect={(value: string) =>
                    void (
                      value !== task.priority &&
                      editTask($, task, ["--priority", value], `Set ${task.id} to ${value} priority`)
                    )
                  }
                />
                <Input
                  key="rename"
                  placeholder="Rename to…"
                  submitLabel="Rename"
                  onSubmit={(value: string) =>
                    void (
                      value.trim() &&
                      value.trim() !== task.title &&
                      editTask($, task, ["--title", value.trim()], `Renamed ${task.id}`)
                    )
                  }
                />
                <Input
                  key="label"
                  placeholder="Add a label"
                  submitLabel="Add label"
                  onSubmit={(value: string) =>
                    void (
                      value.trim() &&
                      editTask($, task, ["--add-label", value.trim()], `Labelled ${task.id} ${value.trim()}`)
                    )
                  }
                />
                <Input
                  key="comment"
                  placeholder="Add a comment"
                  submitLabel="Comment"
                  onSubmit={(value: string) =>
                    void (async () => {
                      const body = value.trim();
                      if (!body) {
                        return;
                      }
                      const now = await $.clock.now();
                      await editTask(
                        $,
                        task,
                        ["--add-comment", commentArg(actor, body, now)],
                        `Commented on ${task.id}`,
                      );
                    })()
                  }
                />
                {isWriting && <Text dimColor>Saving…</Text>}
              </Box>
            )}
            <Box marginTop={1}>
              <Button
                key="copy"
                label="Copy id"
                hotkey="y"
                onPress={(pressed) =>
                  void (current.selected && $.ui.copy({ text: current.selected.id, surface: pressed.surface }))
                }
              />
              <Text> </Text>
              <Button
                key="close-detail"
                label="Close details"
                hotkey="x"
                onPress={() => void update($, view, (v) => ({ ...v, selected: null }))}
              />
            </Box>
          </Box>
        )}
      </Box>
    );
  });
}
