import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
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

/** A single replace-on-success planning snapshot; unlike task lifecycle it has no cross-file move. */
export class LocalPlanningRepository implements PlanningRepository {
  constructor(private readonly root: string) {}

  private path(): string {
    return join(this.root, ".quest", "planning.json");
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
        milestones: value.milestones.map(milestone),
        decisions: value.decisions.map(decision),
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
  async write(request: Parameters<PlanningRepository["write"]>[0]) {
    const current = await this.read();
    if (current.revision !== request.expectedRevision)
      return { kind: "conflict" as const };
    const value: StoredPlanning = {
      milestones: request.milestones.map(milestone),
      decisions: request.decisions.map(decision),
    };
    const path = this.path();
    await mkdir(dirname(path), { recursive: true });
    const temporary = `${path}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, `${JSON.stringify(value)}\n`, "utf8");
    await rename(temporary, path);
    return { kind: "success" as const, revision: this.revision(value) };
  }
}
