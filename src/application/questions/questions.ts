import {
  answerQuestion,
  askQuestion,
  type Question,
  type QuestionAnswerInput,
  type QuestionAskInput,
  type QuestionStatus,
  type QuestionWithdrawInput,
  withdrawQuestion,
} from "../../domain/questions/questions.ts";
import { RecordValidationError } from "../../domain/records.ts";
import type { QuestionRepository } from "../../ports/questions.ts";

const QUESTION_STATUSES: readonly QuestionStatus[] = [
  "open",
  "answered",
  "withdrawn",
];

/**
 * The question use cases opum-doc's seq 179(a) design specifies: `ask`,
 * `answer`, `withdraw`, `list` and `view`. The record validation and the
 * state-transition rules live in the domain module; this service owns only the
 * read-modify-write against the repository.
 */
export class QuestionService {
  constructor(private readonly repository: QuestionRepository) {}

  async list(status?: string): Promise<readonly Question[]> {
    if (
      status !== undefined &&
      !QUESTION_STATUSES.includes(status as QuestionStatus)
    ) {
      throw new RecordValidationError("question_status_invalid");
    }
    const all = await this.repository.readAll();
    return status === undefined
      ? all
      : all.filter((record) => record.status === status);
  }

  async view(id: string): Promise<Question> {
    const record = (await this.repository.readAll()).find(
      (entry) => entry.id === id,
    );
    if (!record) throw new RecordValidationError("question_not_found");
    return record;
  }

  async ask(id: string, input: QuestionAskInput): Promise<Question> {
    if ((await this.repository.readAll()).some((record) => record.id === id))
      throw new RecordValidationError("question_already_exists");
    const record = askQuestion(id, input);
    await this.repository.write(record);
    return record;
  }

  async answer(id: string, input: QuestionAnswerInput): Promise<Question> {
    const next = answerQuestion(await this.view(id), input);
    await this.repository.write(next);
    return next;
  }

  async withdraw(id: string, input: QuestionWithdrawInput): Promise<Question> {
    const next = withdrawQuestion(await this.view(id), input);
    await this.repository.write(next);
    return next;
  }
}
