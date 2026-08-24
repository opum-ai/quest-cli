import { join } from "node:path";
import type { Actor, CanonicalId } from "../../domain/records.ts";
import type { ClaimEvent } from "../../domain/claims/claims.ts";
import type {
  ClaimEvidencePort,
  TaskRelationshipPort,
  TaskRelationshipRecord,
} from "../../ports/claims.ts";

/**
 * Local, read-only claim evidence over Quest's own `.quest/claims` layout:
 * one `<taskId>.jsonl` file of immutable events plus an optional
 * `actors.json`. External consumers never read these files; only Quest does.
 */
export class LocalClaimEvidence implements ClaimEvidencePort {
  constructor(private readonly root: string) {}

  async events(taskId: CanonicalId): Promise<readonly ClaimEvent[]> {
    const path = join(this.root, ".quest", "claims", `${taskId}.jsonl`);
    const file = Bun.file(path);
    if (!(await file.exists())) return [];
    const text = await file.text();
    return text
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as ClaimEvent);
  }

  async actors(): Promise<readonly Actor[]> {
    const file = Bun.file(join(this.root, ".quest", "claims", "actors.json"));
    if (!(await file.exists())) return [];
    return (await file.json()) as Actor[];
  }
}

const RELATIONSHIP_SCHEMA_VERSION = 1;

/**
 * Repository-native relationship records under `.quest/relationships`,
 * one versioned JSON document per identity. `write` is the repository-owned
 * update seam; external consumers only ever get read access.
 */
export class LocalTaskRelationshipRepository implements TaskRelationshipPort {
  constructor(private readonly root: string) {}

  private path(id: string): string {
    return join(this.root, ".quest", "relationships", `${id}.json`);
  }

  async find(id: string): Promise<TaskRelationshipRecord | null> {
    const file = Bun.file(this.path(id));
    if (!(await file.exists())) return null;
    const record = (await file.json()) as TaskRelationshipRecord;
    if (record.schemaVersion !== RELATIONSHIP_SCHEMA_VERSION) return null;
    return record;
  }

  async write(record: TaskRelationshipRecord): Promise<void> {
    if (record.schemaVersion !== RELATIONSHIP_SCHEMA_VERSION) {
      throw new Error("Unsupported relationship record schema.");
    }
    await Bun.write(
      this.path(record.id),
      `${JSON.stringify(record, null, 2)}\n`,
    );
  }
}
