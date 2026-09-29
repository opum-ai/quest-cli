/**
 * QCLI-417 / DEC-40: the discovery seam behind `quest task list --across-refs`.
 *
 * The view is over `origin/dev` plus the head of every OPEN PR whose base is
 * `dev`, and the second half of that population is a forge question no amount
 * of local Git can answer. Measured, and the measurement is why this port
 * exists rather than a `git ls-remote "refs/pull/<N>/head"` probe: on this
 * repository `ls-remote` returns 435 `refs/pull/<N>/head` refs while
 * `gh pr list --state
 * open` returns 0 -- the namespace is historical (PR 1 through 435, merged or
 * closed, and including a promotion PR whose base was `main`) and carries no
 * base information at all, so it can back neither the `open-prs` population
 * nor `complete: true`.
 *
 * Two calls, deliberately separate. `origin` answers "is this repository even
 * on a forge we can ask" and is a Git read; `listOpenPullRequests` is the
 * forge read. Keeping them apart is what lets the view distinguish the three
 * outcomes the ADR names separately: no origin remote at all (exit 3), an
 * origin that is not GitHub (incomplete coverage, exit 6, named), and a forge
 * that could not be reached (also incomplete coverage, exit 6, named).
 */

/** One row of the forge's open-PR listing. `url` is optional because it is the
 * wire shape the real adapter requests, not something the contract needs: the
 * `owner/repo#N` label is derived from it when present and from the origin
 * slug otherwise, and a test seam need not supply it. */
export interface DiscoveredPullRequest {
  readonly number: number;
  readonly headRefName: string;
  readonly headRefOid: string;
  readonly url?: string;
}

/**
 * Where this repository's `origin` remote lives. `absent` is a not-found about
 * the repository (QCLI-417 exit 3); `unsupported` is a coverage failure about
 * a ref that cannot be planned (exit 6) -- the two are different answers and
 * only the first is the caller's to fix by adding a remote.
 */
export type OriginRemote =
  | { readonly kind: "github"; readonly slug: string }
  | { readonly kind: "absent" }
  | { readonly kind: "unsupported"; readonly url: string };

export interface RefDiscoveryPort {
  /** `owner/repo` for the origin remote, or why it cannot be used. */
  origin(repositoryPath: string): Promise<OriginRemote>;
  /**
   * Open pull requests targeting `base`, as the forge reports them. Rejects
   * when the forge cannot be reached (no `gh` on PATH, no network, a refused
   * call): the caller records that as an unreadable ref rather than letting it
   * escape as an uncaught error.
   */
  listOpenPullRequests(
    repositoryPath: string,
    slug: string,
    base: string,
  ): Promise<readonly DiscoveredPullRequest[]>;
}
