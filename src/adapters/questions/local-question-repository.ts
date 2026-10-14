import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import {
  type Question,
  questionRecord,
  questionRecordSchema,
} from "../../domain/questions/questions.ts";
import { RecordValidationError } from "../../domain/records.ts";
import type { QuestionRepository } from "../../ports/questions.ts";
import {
  decodeAuthoredRecord,
  encodeAuthoredRecord,
} from "../records/codec.ts";

const QUESTION_FILE = /^Q-[1-9][0-9]*\.json$/;

function sequence(id: string): number {
  return Number(id.slice("Q-".length));
}

/**
 * One JSON file per question under `<root>/.quest/questions/`, matching the
 * record path opum-doc's design fixes (`Q-N.json`). Decoding is strict (the
 * shared `codec`), and writes are atomic (`write` a temp file, then `rename`),
 * so a reader never observes a half-written record.
 */
export class LocalQuestionRepository implements QuestionRepository {
  constructor(private readonly root: string) {}

  private directory(): string {
    return join(this.root, ".quest", "questions");
  }

  async readAll(): Promise<readonly Question[]> {
    let names: readonly string[];
    try {
      names = await readdir(this.directory());
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw new RecordValidationError("Invalid question storage.");
    }
    const records: Question[] = [];
    for (const name of names) {
      if (!QUESTION_FILE.test(name)) continue;
      const bytes = new Uint8Array(
        await readFile(join(this.directory(), name)),
      );
      const decoded = decodeAuthoredRecord(bytes, questionRecordSchema);
      records.push(questionRecord(decoded as Question));
    }
    return records.sort(
      (left, right) => sequence(left.id) - sequence(right.id),
    );
  }

  async write(record: Question): Promise<void> {
    const validated = questionRecord(record);
    await mkdir(this.directory(), { recursive: true });
    const target = join(this.directory(), `${validated.id}.json`);
    const temporary = `${target}.${crypto.randomUUID()}.tmp`;
    await writeFile(
      temporary,
      encodeAuthoredRecord(validated, questionRecordSchema),
    );
    await rename(temporary, target);
  }
}
