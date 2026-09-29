/** A complete, predeclared authored file effect. `null` removes the path. */
export interface OwnedFileChange {
  readonly path: string;
  readonly content: string | null;
}

/** The application supplies every owned path before the adapter begins I/O. */
export interface GitOperation {
  readonly repositoryPath: string;
  readonly targetRef: string;
  readonly expectedRevision: string;
  readonly operationId: string;
  readonly message: string;
  readonly ownedPaths: readonly string[];
  readonly changes: readonly OwnedFileChange[];
  readonly checkpoint?: GitCheckpoint;
}

/** Test and host seam; production callers normally omit it. */
export type GitCheckpoint = (
  phase: "staged" | "committed" | "cas",
) => void | Promise<void>;

export interface GitOperationSuccess {
  readonly kind: "success";
  readonly revision: string;
  /** True when a previous invocation had already committed this operation. */
  readonly recovered: boolean;
}

export interface GitOperationConflict {
  readonly kind: "conflict";
  readonly code:
    | "cas_conflict"
    | "integration_conflict"
    | "operation_conflict"
    | "push_rejected";
  readonly expectedRevision: string;
  readonly actualRevision: string;
  readonly paths: readonly string[];
}

export type GitOperationResult = GitOperationSuccess | GitOperationConflict;

export interface GitSynchronization {
  readonly repositoryPath: string;
  readonly targetRef: string;
  readonly expectedRevision: string;
  readonly sourceRevision: string;
  readonly operationId: string;
  readonly message: string;
  /** Prefixes whose concurrent changes are never integrated automatically. */
  readonly sharedNamespaces?: readonly string[];
  readonly checkpoint?: GitCheckpoint;
}

export interface GitPush {
  readonly repositoryPath: string;
  readonly remote: string;
  readonly sourceRef: string;
  readonly targetRef: string;
}

export interface GitPort {
  readRevision(repositoryPath: string, ref: string): Promise<string>;
  /**
   * Revision-pinned blob read: returns the object content at
   * `<revision>:<path>` or null when absent. Immune to worktree symlinks.
   */
  readBlob(
    repositoryPath: string,
    revision: string,
    path: string,
  ): Promise<string | null>;
  /** Revision-pinned recursive file listing under a tree prefix. Answers `[]`
   * for a prefix that holds nothing AND for a listing Git refused, so a caller
   * that cannot tolerate the second must use {@link listFilesRequired}. A
   * prefix that is simply absent from the tree is NOT a failure: `git ls-tree`
   * exits 0 with no output for one, which is what makes the strict variant
   * safe to use on a repository with no `.quest/completed` yet. */
  listFiles(
    repositoryPath: string,
    revision: string,
    prefix: string,
  ): Promise<readonly string[]>;
  /**
   * QCLI-417: the same listing, except a failure REJECTS instead of answering
   * `[]`.
   *
   * `listFiles`'s defensive `[]` is right where an empty answer is a usable
   * one (QCLI-316's cross-ref id difference degrades, it does not decide), and
   * wrong for the across-refs view, where `[]` and "the listing failed" must
   * not render the same way: a ref whose tree cannot be listed would read as a
   * ref that carried no records, and the coverage report would call that
   * COMPLETE. Measured with a commit whose tree object was deleted: the view
   * answered `complete: true`, `refsUnreadable: []`, `data: []`, exit 0 -- the
   * exact false green it exists to remove.
   */
  listFilesRequired(
    repositoryPath: string,
    revision: string,
    prefix: string,
  ): Promise<readonly string[]>;
  /**
   * QCLI-415: the best common ancestor of two revisions, as `git merge-base
   * <a> <b>` resolves it. Rejects when either revision is unresolvable or the
   * histories are unrelated.
   *
   * The continuity check needs the merge base rather than the base ref's own
   * tip: a branch that is behind its base never carried ids added to the base
   * after the branch point, and reading the tip would charge it for records it
   * could not have kept.
   */
  mergeBase(repositoryPath: string, a: string, b: string): Promise<string>;
  /**
   * Every local branch and remote-tracking ref, as full ref names (e.g.
   * `refs/heads/dev`). Current tips only -- a for-each-ref listing, never a
   * history walk.
   */
  listRefs(repositoryPath: string): Promise<readonly string[]>;
  /**
   * The checked-out branch's short name, or null when HEAD is detached or the
   * path is not a Git repository (QCLI-316). Needed because a task listing has
   * to be able to NAME the object it answered about, and a SHA does not tell a
   * reader which branch they are standing on.
   */
  currentBranch(repositoryPath: string): Promise<string | null>;
  /**
   * QCLI-417: the SHA a REMOTE advertises for one ref, straight from
   * `git ls-remote`, or null when the remote does not advertise it. Remote
   * truth on purpose -- `origin/dev` locally is whatever the last fetch left
   * behind, and the across-refs view promises the repository's dev, not this
   * checkout's idea of it.
   *
   * Rejects when the remote itself cannot be reached, which is a different
   * fact from a remote that answered "no such ref": the first is a ref that
   * could not be read, the second is a dev branch that does not exist
   * (QCLI-417 exit 3).
   */
  remoteRevision(
    repositoryPath: string,
    remote: string,
    ref: string,
  ): Promise<string | null>;
  /**
   * QCLI-417: fetches one ref's objects from a remote so a read at a
   * discovered SHA can proceed. Passed a bare refspec (`refs/pull/7/head`,
   * never `a:b`) so it writes objects and FETCH_HEAD only.
   *
   * The bare refspec is NOT sufficient on its own, which is why this carries
   * an explicit empty `--refmap=`: with the remote's default
   * `+refs/heads/*:refs/remotes/origin/*` mapping, Git opportunistically
   * updates the matching remote-tracking ref from a destination-less refspec
   * too. Measured: `git fetch --no-tags origin refs/heads/dev` moved
   * `refs/remotes/origin/dev` (and what `origin/HEAD` resolves to) from the
   * old tip to the new one, which falsified the read-only promise and changed
   * a later QCLI-316 `scope` answer. `--refmap=` makes the same fetch write
   * FETCH_HEAD and objects and move nothing.
   *
   * Rejects when the fetch fails; the caller records that as an unreadable ref.
   */
  fetchRef(repositoryPath: string, remote: string, ref: string): Promise<void>;
  /**
   * QCLI-417: whether a revision resolves to a commit object ALREADY present
   * in this repository, without touching the network. `listFiles` answers `[]`
   * and `readBlob` answers `null` for both "absent" and "the read failed", so
   * neither can decide whether a fetch is needed before a read -- and fetching
   * an object that is already present is network work the view should not do.
   */
  hasRevision(repositoryPath: string, revision: string): Promise<boolean>;
  /**
   * QCLI-417: the configured URL of one remote, or null when no such remote
   * exists. Read-only, and deliberately the URL rather than a parsed slug:
   * which hosts count as a forge is a question for the adapter that asks the
   * forge, not for the Git port.
   */
  remoteUrl(repositoryPath: string, remote: string): Promise<string | null>;
  commit(operation: GitOperation): Promise<GitOperationResult>;
  synchronize(operation: GitSynchronization): Promise<GitOperationResult>;
  push(operation: GitPush): Promise<GitOperationResult>;
}
