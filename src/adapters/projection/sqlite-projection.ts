import { Database } from "bun:sqlite";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  type ClaimEvent,
  replayClaimHistory,
} from "../../domain/claims/claims.ts";
import { type Actor, aliasKey, declareActors } from "../../domain/records.ts";
import { type TaskState, taskState } from "../../domain/tasks/tasks.ts";

export const projectionSchemaVersion = 1;

type ProjectionCounts = Readonly<Record<string, number>>;

export interface GitCheckpoint {
  readonly revision: string;
  readonly observedAt: string;
}

export interface SourceMapping {
  readonly taskId: string;
  readonly system: string;
  readonly reference: string;
  readonly importedAt?: string;
}

/** Git-derived input only; the adapter never reads a prior SQLite row as input. */
export interface AuthoritativeProjectionSnapshot {
  readonly workspaceId: string;
  readonly checkpoint: GitCheckpoint;
  readonly tasks: readonly TaskState[];
  readonly actors: readonly Actor[];
  readonly claimEvents: readonly ClaimEvent[];
  readonly sourceMappings?: readonly SourceMapping[];
  readonly checkpoints?: readonly GitCheckpoint[];
}

export interface AuthoritativeProjectionSource {
  enumerate(): Promise<AuthoritativeProjectionSnapshot>;
}

export interface ProjectionRebuildResult {
  readonly kind: "rebuilt";
  readonly checkpoint: GitCheckpoint;
}

export type ProjectionRefreshResult =
  | ProjectionRebuildResult
  | { readonly kind: "reused"; readonly checkpoint: GitCheckpoint };

export type ProjectionFreshness =
  | "fresh"
  | "stale"
  | "missing"
  | "corrupt"
  | "recovering";

export interface ProjectionStatus {
  readonly schemaVersion: number | undefined;
  readonly checkpoint: GitCheckpoint | undefined;
  readonly authoritativeCheckpoint: GitCheckpoint;
  readonly freshness: ProjectionFreshness;
  readonly corruption: boolean;
  readonly recovery: "none" | "sync" | "rebuild";
}

export interface ProjectionSyncResult {
  readonly kind: "caught_up" | "resumed" | "interrupted";
  readonly checkpoint: GitCheckpoint;
  readonly resumedFrom: number;
  readonly processed: number;
}

interface SyncProgress {
  readonly checkpoint: GitCheckpoint;
  readonly nextTask: number;
}

const schema = `
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE tasks (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE TABLE dependencies (
  task_id TEXT NOT NULL, dependency_id TEXT NOT NULL,
  PRIMARY KEY (task_id, dependency_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE aliases (
  task_id TEXT NOT NULL, alias TEXT NOT NULL, alias_key TEXT NOT NULL,
  PRIMARY KEY (task_id, alias_key), FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE actors (id TEXT PRIMARY KEY, kind TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE claims (
  task_id TEXT PRIMARY KEY, holder_id TEXT NOT NULL, lease_generation TEXT NOT NULL,
  expires_at TEXT NOT NULL, FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE gates (
  task_id TEXT NOT NULL, gate_id TEXT NOT NULL, title TEXT NOT NULL,
  blocking INTEGER NOT NULL, state TEXT NOT NULL, satisfied_by TEXT,
  PRIMARY KEY (task_id, gate_id), FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE evidence (
  task_id TEXT NOT NULL, gate_id TEXT NOT NULL, evidence_id TEXT NOT NULL,
  reference TEXT NOT NULL, actor_id TEXT NOT NULL, submitted_at TEXT NOT NULL,
  payload TEXT NOT NULL, PRIMARY KEY (task_id, gate_id, evidence_id),
  FOREIGN KEY (task_id, gate_id) REFERENCES gates(task_id, gate_id)
);
CREATE TABLE events (
  event_id TEXT PRIMARY KEY, operation_id TEXT NOT NULL UNIQUE, task_id TEXT NOT NULL,
  stream TEXT NOT NULL, kind TEXT NOT NULL, ordinal INTEGER NOT NULL, payload TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE source_mappings (
  task_id TEXT NOT NULL, system TEXT NOT NULL, reference TEXT NOT NULL,
  imported_at TEXT, PRIMARY KEY (task_id, system, reference),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
CREATE TABLE git_checkpoints (
  revision TEXT PRIMARY KEY, observed_at TEXT NOT NULL, ordinal INTEGER NOT NULL
);
`;

function count(db: Database, table: string): number {
  return (
    db.query(`SELECT COUNT(*) AS value FROM ${table}`).get() as {
      value: number;
    }
  ).value;
}

function insert(
  db: Database,
  sql: string,
  values: readonly (string | number | null)[],
): void {
  db.query(sql).run(...values);
}

function allSourceMappings(
  snapshot: AuthoritativeProjectionSnapshot,
): readonly SourceMapping[] {
  const mappings = [
    ...snapshot.tasks.flatMap((task) =>
      task.source
        ? [{ taskId: task.id, ...task.source }]
        : ([] as readonly SourceMapping[]),
    ),
    ...(snapshot.sourceMappings ?? []),
  ];
  const seen = new Set<string>();
  return mappings.filter((mapping) => {
    const key = `${mapping.taskId}\u0000${mapping.system}\u0000${mapping.reference}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Validate authoritative replay before opening a replacement projection. */
function validate(snapshot: AuthoritativeProjectionSnapshot): void {
  if (!snapshot.workspaceId || !snapshot.checkpoint.revision)
    throw new Error("projection_authoritative_checkpoint_invalid");
  const tasks = snapshot.tasks.map(taskState);
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length)
    throw new Error("projection_authoritative_task_duplicate");
  const actors = declareActors(snapshot.actors);
  const claimsByTask = new Map<string, ClaimEvent[]>();
  for (const event of snapshot.claimEvents) {
    const events = claimsByTask.get(event.taskId) ?? [];
    claimsByTask.set(event.taskId, [...events, event]);
  }
  for (const events of claimsByTask.values())
    replayClaimHistory(events, actors);
  const taskIds = new Set(tasks.map((task) => task.id));
  const eventIds = new Set<string>();
  const operationIds = new Set<string>();
  for (const event of [
    ...tasks.flatMap((task) => task.gateEvents),
    ...snapshot.claimEvents,
  ]) {
    if (!taskIds.has(event.taskId))
      throw new Error("projection_authoritative_event_unknown_task");
    if (eventIds.has(event.eventId) || operationIds.has(event.operationId))
      throw new Error("projection_authoritative_event_duplicate");
    eventIds.add(event.eventId);
    operationIds.add(event.operationId);
  }
  for (const mapping of allSourceMappings(snapshot)) {
    if (!taskIds.has(mapping.taskId))
      throw new Error("projection_source_mapping_unknown_task");
  }
  const revisions = new Set<string>();
  for (const checkpoint of [
    snapshot.checkpoint,
    ...(snapshot.checkpoints ?? []),
  ]) {
    if (
      !checkpoint.revision ||
      !checkpoint.observedAt ||
      revisions.has(checkpoint.revision)
    )
      throw new Error(
        "projection_authoritative_checkpoint_duplicate_or_invalid",
      );
    revisions.add(checkpoint.revision);
  }
}

function expectedCounts(
  snapshot: AuthoritativeProjectionSnapshot,
): ProjectionCounts {
  const tasks = snapshot.tasks;
  return {
    tasks: tasks.length,
    dependencies: tasks.reduce(
      (total, task) => total + task.dependencies.length,
      0,
    ),
    aliases: tasks.reduce((total, task) => total + task.aliases.length, 0),
    actors: snapshot.actors.length,
    claims: tasks.filter((task) => task.claim).length,
    gates: tasks.reduce((total, task) => total + task.gates.length, 0),
    evidence: tasks.reduce(
      (total, task) =>
        total +
        task.gateEvents.filter((event) => event.kind === "evidence-submitted")
          .length,
      0,
    ),
    events:
      snapshot.claimEvents.length +
      tasks.reduce((total, task) => total + task.gateEvents.length, 0),
    source_mappings: allSourceMappings(snapshot).length,
    git_checkpoints: 1 + (snapshot.checkpoints?.length ?? 0),
  };
}

function populate(
  db: Database,
  snapshot: AuthoritativeProjectionSnapshot,
): void {
  insert(db, "INSERT INTO metadata VALUES (?, ?)", [
    "schema_version",
    String(projectionSchemaVersion),
  ]);
  insert(db, "INSERT INTO metadata VALUES (?, ?)", [
    "workspace_id",
    snapshot.workspaceId,
  ]);
  for (const task of snapshot.tasks) {
    insert(db, "INSERT INTO tasks VALUES (?, ?, ?, ?)", [
      task.id,
      task.title,
      task.status,
      JSON.stringify(task),
    ]);
    for (const dependency of task.dependencies)
      insert(db, "INSERT INTO dependencies VALUES (?, ?)", [
        task.id,
        dependency,
      ]);
    for (const alias of task.aliases)
      insert(db, "INSERT INTO aliases VALUES (?, ?, ?)", [
        task.id,
        alias,
        aliasKey(alias),
      ]);
    if (task.claim)
      insert(db, "INSERT INTO claims VALUES (?, ?, ?, ?)", [
        task.id,
        task.claim.holderId,
        task.claim.leaseGeneration,
        task.claim.expiresAt,
      ]);
    for (const gate of task.gates)
      insert(db, "INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?)", [
        task.id,
        gate.id,
        gate.title,
        gate.blocking === false ? 0 : 1,
        gate.state,
        gate.satisfiedBy ?? null,
      ]);
    for (const [ordinal, event] of task.gateEvents.entries()) {
      insert(db, "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)", [
        event.eventId,
        event.operationId,
        task.id,
        "gate",
        event.kind,
        ordinal,
        JSON.stringify(event),
      ]);
      if (event.kind === "evidence-submitted")
        insert(db, "INSERT INTO evidence VALUES (?, ?, ?, ?, ?, ?, ?)", [
          task.id,
          event.gateId,
          event.evidence.id,
          event.evidence.reference,
          event.evidence.actor.id,
          event.evidence.submittedAt,
          JSON.stringify(event.evidence),
        ]);
    }
  }
  for (const actor of snapshot.actors)
    insert(db, "INSERT INTO actors VALUES (?, ?, ?)", [
      actor.id,
      actor.kind,
      JSON.stringify(actor),
    ]);
  for (const [ordinal, event] of snapshot.claimEvents.entries())
    insert(db, "INSERT INTO events VALUES (?, ?, ?, ?, ?, ?, ?)", [
      event.eventId,
      event.operationId,
      event.taskId,
      "claim",
      event.kind,
      ordinal,
      JSON.stringify(event),
    ]);
  for (const mapping of allSourceMappings(snapshot))
    insert(db, "INSERT INTO source_mappings VALUES (?, ?, ?, ?)", [
      mapping.taskId,
      mapping.system,
      mapping.reference,
      mapping.importedAt ?? null,
    ]);
  for (const [ordinal, checkpoint] of [
    snapshot.checkpoint,
    ...(snapshot.checkpoints ?? []),
  ].entries())
    insert(db, "INSERT INTO git_checkpoints VALUES (?, ?, ?)", [
      checkpoint.revision,
      checkpoint.observedAt,
      ordinal,
    ]);
}

type ProjectionRow = Readonly<Record<string, string | number | null>>;

function sameRows(
  actual: readonly ProjectionRow[],
  expected: readonly ProjectionRow[],
): boolean {
  const encoded = (rows: readonly ProjectionRow[]) =>
    rows
      .map((row) => JSON.stringify(row))
      .sort()
      .join("\n");
  return encoded(actual) === encoded(expected);
}

async function retryWindowsFileRelease(
  operation: () => Promise<void>,
): Promise<void> {
  // Windows ARM runners can retain Bun's SQLite handle for several seconds
  // after close(). Preserve atomic replacement by waiting for that release,
  // rather than replacing the database in place.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      await operation();
      return;
    } catch (error) {
      const code = (error as { code?: unknown }).code;
      if ((code !== "EBUSY" && code !== "EPERM") || attempt === 99) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

function rowsMatch(
  db: Database,
  query: string,
  expected: readonly ProjectionRow[],
): boolean {
  return sameRows(db.query(query).all() as ProjectionRow[], expected);
}

/** Compare every disposable row with the just-enumerated Git snapshot. */
function matchesAuthoritativeSnapshot(
  db: Database,
  snapshot: AuthoritativeProjectionSnapshot,
): boolean {
  const taskRows: ProjectionRow[] = [];
  const dependencyRows: ProjectionRow[] = [];
  const aliasRows: ProjectionRow[] = [];
  const claimRows: ProjectionRow[] = [];
  const gateRows: ProjectionRow[] = [];
  const evidenceRows: ProjectionRow[] = [];
  const eventRows: ProjectionRow[] = [];
  for (const task of snapshot.tasks) {
    taskRows.push({
      id: task.id,
      title: task.title,
      status: task.status,
      payload: JSON.stringify(task),
    });
    for (const dependency of task.dependencies)
      dependencyRows.push({ task_id: task.id, dependency_id: dependency });
    for (const alias of task.aliases)
      aliasRows.push({ task_id: task.id, alias, alias_key: aliasKey(alias) });
    if (task.claim)
      claimRows.push({
        task_id: task.id,
        holder_id: task.claim.holderId,
        lease_generation: task.claim.leaseGeneration,
        expires_at: task.claim.expiresAt,
      });
    for (const gate of task.gates)
      gateRows.push({
        task_id: task.id,
        gate_id: gate.id,
        title: gate.title,
        blocking: gate.blocking === false ? 0 : 1,
        state: gate.state,
        satisfied_by: gate.satisfiedBy ?? null,
      });
    for (const [ordinal, event] of task.gateEvents.entries()) {
      eventRows.push({
        event_id: event.eventId,
        operation_id: event.operationId,
        task_id: task.id,
        stream: "gate",
        kind: event.kind,
        ordinal,
        payload: JSON.stringify(event),
      });
      if (event.kind === "evidence-submitted")
        evidenceRows.push({
          task_id: task.id,
          gate_id: event.gateId,
          evidence_id: event.evidence.id,
          reference: event.evidence.reference,
          actor_id: event.evidence.actor.id,
          submitted_at: event.evidence.submittedAt,
          payload: JSON.stringify(event.evidence),
        });
    }
  }
  for (const [ordinal, event] of snapshot.claimEvents.entries())
    eventRows.push({
      event_id: event.eventId,
      operation_id: event.operationId,
      task_id: event.taskId,
      stream: "claim",
      kind: event.kind,
      ordinal,
      payload: JSON.stringify(event),
    });
  return [
    rowsMatch(db, "SELECT key, value FROM metadata", [
      { key: "schema_version", value: String(projectionSchemaVersion) },
      { key: "workspace_id", value: snapshot.workspaceId },
    ]),
    rowsMatch(db, "SELECT id, title, status, payload FROM tasks", taskRows),
    rowsMatch(
      db,
      "SELECT task_id, dependency_id FROM dependencies",
      dependencyRows,
    ),
    rowsMatch(db, "SELECT task_id, alias, alias_key FROM aliases", aliasRows),
    rowsMatch(
      db,
      "SELECT id, kind, payload FROM actors",
      snapshot.actors.map((actor) => ({
        id: actor.id,
        kind: actor.kind,
        payload: JSON.stringify(actor),
      })),
    ),
    rowsMatch(
      db,
      "SELECT task_id, holder_id, lease_generation, expires_at FROM claims",
      claimRows,
    ),
    rowsMatch(
      db,
      "SELECT task_id, gate_id, title, blocking, state, satisfied_by FROM gates",
      gateRows,
    ),
    rowsMatch(
      db,
      "SELECT task_id, gate_id, evidence_id, reference, actor_id, submitted_at, payload FROM evidence",
      evidenceRows,
    ),
    rowsMatch(
      db,
      "SELECT event_id, operation_id, task_id, stream, kind, ordinal, payload FROM events",
      eventRows,
    ),
    rowsMatch(
      db,
      "SELECT task_id, system, reference, imported_at FROM source_mappings",
      allSourceMappings(snapshot).map((mapping) => ({
        task_id: mapping.taskId,
        system: mapping.system,
        reference: mapping.reference,
        imported_at: mapping.importedAt ?? null,
      })),
    ),
    rowsMatch(
      db,
      "SELECT revision, observed_at, ordinal FROM git_checkpoints",
      [snapshot.checkpoint, ...(snapshot.checkpoints ?? [])].map(
        (checkpoint, ordinal) => ({
          revision: checkpoint.revision,
          observed_at: checkpoint.observedAt,
          ordinal,
        }),
      ),
    ),
  ].every(Boolean);
}

function validateReplacement(
  db: Database,
  snapshot: AuthoritativeProjectionSnapshot,
): void {
  const integrity = db.query("PRAGMA integrity_check").get() as {
    integrity_check: string;
  };
  if (integrity.integrity_check !== "ok")
    throw new Error("projection_integrity_failed");
  for (const [table, expected] of Object.entries(expectedCounts(snapshot))) {
    if (count(db, table) !== expected)
      throw new Error(`projection_count_mismatch:${table}`);
  }
  const replayed = db.query("SELECT payload FROM tasks ORDER BY id").all() as {
    payload: string;
  }[];
  for (const row of replayed) taskState(JSON.parse(row.payload));
  if (!matchesAuthoritativeSnapshot(db, snapshot))
    throw new Error("projection_content_mismatch");
}

/** Bun SQLite adapter for a disposable, workspace-local projection database. */
export class SqliteProjectionStore {
  constructor(private readonly databasePath: string) {}

  private progressPath(): string {
    return `${this.databasePath}.sync.json`;
  }

  private async readProgress(): Promise<SyncProgress | undefined> {
    try {
      const parsed: unknown = JSON.parse(
        await readFile(this.progressPath(), "utf8"),
      );
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !Number.isSafeInteger((parsed as SyncProgress).nextTask) ||
        (parsed as SyncProgress).nextTask < 0 ||
        typeof (parsed as SyncProgress).checkpoint?.revision !== "string" ||
        typeof (parsed as SyncProgress).checkpoint?.observedAt !== "string"
      )
        return undefined;
      return parsed as SyncProgress;
    } catch {
      return undefined;
    }
  }

  private async writeProgress(progress: SyncProgress): Promise<void> {
    await mkdir(dirname(this.databasePath), { recursive: true });
    const temporary = `${this.progressPath()}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(progress)}\n`, "utf8");
    await rename(temporary, this.progressPath());
  }

  /**
   * Inspects cache state without creating, repairing, or refreshing files.
   * The caller receives recovery guidance rather than an implicit mutation.
   */
  async status(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionStatus> {
    const snapshot = await source.enumerate();
    validate(snapshot);
    const progress = await this.readProgress();
    if (progress?.checkpoint.revision === snapshot.checkpoint.revision)
      return {
        schemaVersion: undefined,
        checkpoint: progress.checkpoint,
        authoritativeCheckpoint: snapshot.checkpoint,
        freshness: "recovering",
        corruption: false,
        recovery: "sync",
      };
    try {
      await stat(this.databasePath);
    } catch {
      return {
        schemaVersion: undefined,
        checkpoint: undefined,
        authoritativeCheckpoint: snapshot.checkpoint,
        freshness: "missing",
        corruption: false,
        recovery: "rebuild",
      };
    }
    try {
      const db = new Database(this.databasePath, {
        readonly: true,
        strict: true,
      });
      try {
        const version = db
          .query("SELECT value FROM metadata WHERE key = 'schema_version'")
          .get() as { value?: string } | null;
        const checkpoint = db
          .query(
            "SELECT revision, observed_at FROM git_checkpoints ORDER BY ordinal ASC LIMIT 1",
          )
          .get() as { revision?: string; observed_at?: string } | null;
        const current =
          checkpoint?.revision && checkpoint.observed_at
            ? {
                revision: checkpoint.revision,
                observedAt: checkpoint.observed_at,
              }
            : undefined;
        const fresh =
          version?.value === String(projectionSchemaVersion) &&
          current?.revision === snapshot.checkpoint.revision &&
          matchesAuthoritativeSnapshot(db, snapshot);
        return {
          schemaVersion:
            version?.value && Number.isFinite(Number(version.value))
              ? Number(version.value)
              : undefined,
          checkpoint: current,
          authoritativeCheckpoint: snapshot.checkpoint,
          freshness: fresh ? "fresh" : "stale",
          corruption: false,
          recovery: fresh ? "none" : "sync",
        };
      } finally {
        db.close();
      }
    } catch {
      return {
        schemaVersion: undefined,
        checkpoint: undefined,
        authoritativeCheckpoint: snapshot.checkpoint,
        freshness: "corrupt",
        corruption: true,
        recovery: "rebuild",
      };
    }
  }

  /**
   * A projection-only refresh records every completed task cursor durably.
   * A caller may use interruptAfter to model process loss in integration tests;
   * the next call resumes from that cursor and still rebuilds from Git alone.
   */
  async synchronize(
    source: AuthoritativeProjectionSource,
    options: { readonly interruptAfter?: number } = {},
  ): Promise<ProjectionSyncResult> {
    const snapshot = await source.enumerate();
    validate(snapshot);
    const previous = await this.readProgress();
    const resumedFrom =
      previous?.checkpoint.revision === snapshot.checkpoint.revision
        ? Math.min(previous.nextTask, snapshot.tasks.length)
        : 0;
    if (resumedFrom === snapshot.tasks.length) {
      await this.rebuildSnapshot(snapshot);
      await rm(this.progressPath(), { force: true });
      return {
        kind: resumedFrom ? "resumed" : "caught_up",
        checkpoint: snapshot.checkpoint,
        resumedFrom,
        processed: 0,
      };
    }
    for (let index = resumedFrom; index < snapshot.tasks.length; index += 1) {
      // Validate each authoritative record before advancing the durable cursor.
      const task = snapshot.tasks[index];
      if (!task) throw new Error("projection_sync_task_missing");
      taskState(task);
      const nextTask = index + 1;
      await this.writeProgress({ checkpoint: snapshot.checkpoint, nextTask });
      if (options.interruptAfter === nextTask)
        return {
          kind: "interrupted",
          checkpoint: snapshot.checkpoint,
          resumedFrom,
          processed: nextTask - resumedFrom,
        };
    }
    await this.rebuildSnapshot(snapshot);
    await rm(this.progressPath(), { force: true });
    return {
      kind: resumedFrom ? "resumed" : "caught_up",
      checkpoint: snapshot.checkpoint,
      resumedFrom,
      processed: snapshot.tasks.length - resumedFrom,
    };
  }

  private async healthy(
    snapshot: AuthoritativeProjectionSnapshot,
  ): Promise<GitCheckpoint | undefined> {
    try {
      await stat(this.databasePath);
      const db = new Database(this.databasePath, {
        readonly: true,
        strict: true,
      });
      try {
        const integrity = db.query("PRAGMA integrity_check").get() as {
          integrity_check: string;
        };
        const version = db
          .query("SELECT value FROM metadata WHERE key = 'schema_version'")
          .get() as { value?: string } | null;
        const checkpoint = db
          .query(
            "SELECT revision, observed_at FROM git_checkpoints ORDER BY ordinal ASC LIMIT 1",
          )
          .get() as { revision?: string; observed_at?: string } | null;
        if (
          integrity.integrity_check !== "ok" ||
          version?.value !== String(projectionSchemaVersion) ||
          !checkpoint?.revision ||
          !checkpoint.observed_at ||
          checkpoint.revision !== snapshot.checkpoint.revision
        )
          return undefined;
        // Integrity_check only covers SQLite page consistency. Compare every
        // projected row, including metadata and checkpoints, with Git input.
        if (!matchesAuthoritativeSnapshot(db, snapshot)) return undefined;
        const replayed = db
          .query("SELECT payload FROM tasks ORDER BY id")
          .all() as { payload: string }[];
        for (const row of replayed) taskState(JSON.parse(row.payload));
        return {
          revision: checkpoint.revision,
          observedAt: checkpoint.observed_at,
        };
      } finally {
        db.close();
      }
    } catch {
      return undefined;
    }
  }

  async rebuild(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionRebuildResult> {
    const snapshot = await source.enumerate();
    return this.rebuildSnapshot(snapshot);
  }

  private async rebuildSnapshot(
    snapshot: AuthoritativeProjectionSnapshot,
  ): Promise<ProjectionRebuildResult> {
    validate(snapshot);
    await mkdir(dirname(this.databasePath), { recursive: true });
    const temporary = `${this.databasePath}.${crypto.randomUUID()}.rebuild`;
    let db: Database | undefined;
    try {
      db = new Database(temporary, { create: true, strict: true });
      db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = DELETE;");
      db.exec(schema);
      db.exec("BEGIN IMMEDIATE");
      populate(db, snapshot);
      db.exec("COMMIT");
      validateReplacement(db, snapshot);
      db.close();
      db = undefined;
      await retryWindowsFileRelease(() => rename(temporary, this.databasePath));
      return { kind: "rebuilt", checkpoint: snapshot.checkpoint };
    } catch (error) {
      try {
        db?.exec("ROLLBACK");
      } catch {
        // The replacement is discarded below; the prior projection remains intact.
      }
      db?.close();
      try {
        await retryWindowsFileRelease(() => rm(temporary, { force: true }));
      } catch {
        // Preserve the original rebuild failure; a later rebuild can discard the temp file.
      }
      throw error;
    }
  }

  async rebuildIfNeeded(
    source: AuthoritativeProjectionSource,
  ): Promise<ProjectionRefreshResult> {
    // Enumeration is intentionally Git-only. It lets health detect a valid
    // SQLite file whose contents are stale or semantically incomplete.
    const snapshot = await source.enumerate();
    validate(snapshot);
    const checkpoint = await this.healthy(snapshot);
    return checkpoint
      ? { kind: "reused", checkpoint }
      : this.rebuildSnapshot(snapshot);
  }
}

/** Opens an existing SQLite projection strictly read-only for query routing. */
export class SqliteProjectionTaskReader {
  constructor(private readonly databasePath: string) {}

  async readAll(): Promise<{
    readonly workspaceId: string;
    readonly revision: string;
    readonly tasks: readonly TaskState[];
  }> {
    const db = new Database(this.databasePath, {
      readonly: true,
      strict: true,
    });
    try {
      const workspace = db
        .query("SELECT value FROM metadata WHERE key = 'workspace_id'")
        .get() as { value?: string } | null;
      const checkpoint = db
        .query(
          "SELECT revision FROM git_checkpoints ORDER BY ordinal ASC LIMIT 1",
        )
        .get() as { revision?: string } | null;
      if (!workspace?.value || !checkpoint?.revision)
        throw new Error("projection_query_metadata_missing");
      const rows = db.query("SELECT payload FROM tasks ORDER BY id").all() as {
        payload: string;
      }[];
      return {
        workspaceId: workspace.value,
        revision: checkpoint.revision,
        tasks: rows.map((row) => taskState(JSON.parse(row.payload))),
      };
    } finally {
      db.close();
    }
  }
}
