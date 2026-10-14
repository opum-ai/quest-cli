import type { Question } from "../domain/questions/questions.ts";

/**
 * Persistence boundary for the question record store (QCLI-445). One record per
 * file at `.quest/questions/<id>.json` -- the shape opum-doc's design specifies
 * -- so unlike the single-file planning snapshot there is no cross-record write
 * and no workspace revision to compare and swap.
 */
export interface QuestionRepository {
  /** Every stored question, in ascending id order. */
  readAll(): Promise<readonly Question[]>;
  /** Persist one question, replacing any record that already holds its id. */
  write(record: Question): Promise<void>;
}
