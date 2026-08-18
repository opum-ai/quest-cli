import type { TaskLocation, TaskState } from "../domain/tasks/tasks.ts";

export interface BacklogImportRecord {
  readonly sourceFolder: string;
  readonly sourceIdentifier: string;
  readonly sourcePath: string;
  readonly contentFingerprint: string;
  readonly aliases: readonly string[];
  readonly rawMarkdown: string;
  readonly git: { readonly commit?: string; readonly blob?: string };
  readonly title: string;
  readonly status?: string;
  readonly priority?: string;
  readonly type?: string;
  readonly assignees: readonly string[];
  readonly labels: readonly string[];
  readonly ordinal?: number;
  readonly parentTaskId?: string;
  readonly dependencies: readonly string[];
  readonly acceptanceCriteria: readonly {
    readonly index: number;
    readonly text: string;
    readonly checked: boolean;
  }[];
  readonly definitionOfDone: readonly {
    readonly index: number;
    readonly text: string;
    readonly checked: boolean;
  }[];
  readonly implementationPlan?: string;
  readonly implementationNotes?: string;
  readonly finalSummary?: string;
  readonly comments: readonly {
    readonly index: number;
    readonly body: string;
    readonly author?: string;
    readonly createdAt?: string;
  }[];
  readonly references: readonly string[];
  readonly documentation: readonly string[];
  readonly modifiedFiles: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

export interface BacklogImportSource {
  readSnapshot(): Promise<{
    readonly fingerprint: string;
    readonly records: readonly BacklogImportRecord[];
    readonly crossFolderDuplicateIds: readonly string[];
  }>;
}

export interface PublicTaskRepository {
  readAll(): Promise<{
    readonly revision: string;
    readonly taskRecords: readonly {
      readonly task: TaskState;
      readonly location: TaskLocation;
    }[];
  }>;
  write(request: {
    readonly task: TaskState;
    readonly expectedRevision: string;
    readonly operationId: string;
    readonly ownedPaths: readonly string[];
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | { readonly kind: "conflict" }
  >;
  writeLifecycle(request: {
    readonly expectedRevision: string;
    readonly operationId: string;
    readonly ownedPaths: readonly string[];
    readonly taskChanges: readonly {
      readonly taskId: string;
      readonly location: TaskLocation;
      readonly remove: true;
    }[];
    readonly draftChanges: readonly [];
  }): Promise<
    | { readonly kind: "success"; readonly revision: string }
    | { readonly kind: "conflict" }
  >;
}
