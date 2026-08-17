import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  PlanningRepository,
  PlanningSnapshot,
} from "../../application/planning/planning.ts";
import {
  type Decision,
  decision,
  type Milestone,
  milestone,
} from "../../domain/planning/planning.ts";
import { RecordValidationError } from "../../domain/records.ts";

interface StoredPlanning {
  readonly milestones: readonly Milestone[];
  readonly decisions: readonly Decision[];
}

function validateUniqueRecords<T extends { readonly id: string }>(
  values: readonly T[],
  name: string,
): readonly T[] {
  if (new Set(values.map((value) => value.id)).size !== values.length)
    throw new RecordValidationError(`${name}_duplicate_identity`);
  return values;
}

/** A single replace-on-success planning snapshot; unlike task lifecycle it has no cross-file move. */
export class LocalPlanningRepository implements PlanningRepository {
  constructor(private readonly root: string) {}

  private path(): string {
    return join(this.root, ".quest", "planning.json");
  }
  private lockPath(): string {
    return `${this.path()}.lock`;
  }
  private revision(value: StoredPlanning): string {
    return new Bun.CryptoHasher("sha256")
      .update(JSON.stringify(value))
      .digest("hex");
  }
  private async stored(): Promise<StoredPlanning> {
    try {
      const value = JSON.parse(
        await readFile(this.path(), "utf8"),
      ) as StoredPlanning;
      return {
        milestones: validateUniqueRecords(
          value.milestones.map(milestone),
          "milestone",
        ),
        decisions: validateUniqueRecords(
          value.decisions.map(decision),
          "decision",
        ),
      };
    } catch (error) {
      if ((error as { code?: string }).code === "ENOENT")
        return { milestones: [], decisions: [] };
      if (error instanceof RecordValidationError) throw error;
      throw new RecordValidationError("Invalid planning storage.");
    }
  }
  async read(): Promise<PlanningSnapshot> {
    const value = await this.stored();
    return { revision: this.revision(value), ...value };
  }
  private async acquireLock(): Promise<boolean> {
    const deadline = Date.now() + 500;
    while (Date.now() < deadline) {
      try {
        await mkdir(this.lockPath());
        return true;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      await Bun.sleep(5);
    }
    return false;
  }
  async write(request: Parameters<PlanningRepository["write"]>[0]) {
    if (!request.operationId.trim())
      throw new RecordValidationError("operation_id_required");
    await mkdir(dirname(this.path()), { recursive: true });
    if (!(await this.acquireLock())) return { kind: "conflict" as const };
    try {
      const current = await this.read();
      if (current.revision !== request.expectedRevision)
        return { kind: "conflict" as const };
      const value: StoredPlanning = {
        milestones: validateUniqueRecords(
          request.milestones.map(milestone),
          "milestone",
        ),
        decisions: validateUniqueRecords(
          request.decisions.map(decision),
          "decision",
        ),
      };
      const path = this.path();
      const temporary = `${path}.${crypto.randomUUID()}.tmp`;
      await writeFile(temporary, `${JSON.stringify(value)}\n`, "utf8");
      await rename(temporary, path);
      return { kind: "success" as const, revision: this.revision(value) };
    } finally {
      await rm(this.lockPath(), { recursive: true, force: true });
    }
  }
}
