import type { GitPort } from "../../ports/git.ts";
import type {
  DiscoveredPullRequest,
  OriginRemote,
  RefDiscoveryPort,
} from "../../ports/ref-discovery.ts";

/**
 * QCLI-417 / DEC-40 D1: the production discovery seam for
 * `quest task list --across-refs`, shelling out to `gh`.
 *
 * The population the view needs is "open pull requests INTO dev", and only the
 * forge knows it. The measurement that settled this (recorded on QCLI-417 and
 * agreed with lore-cli): `git ls-remote origin "refs/pull/<N>/head"` returns 435
 * refs on this repository while `gh pr list --state open` returns 0 -- the
 * namespace is historical and carries no base information, so a Git-only probe
 * cannot back the `open-prs` population or a `complete: true`.
 *
 * `gh` is asked with no `--repo`: the command runs IN the repository, so the
 * forge it consults is the same origin the slug came from and the two cannot
 * drift apart. The slug is used to LABEL the rows (`owner/repo#N`), and the
 * url each row carries is preferred for that label because it names the pull
 * request the forge actually returned.
 *
 * A discovery failure REJECTS rather than degrading here: the caller records
 * it as one unreadable ref and decides (per --allow-partial) whether the answer
 * is an exit-6 error or a dev-only view. Nothing about a missing `gh` escapes
 * as an uncaught error.
 */

/** `gh pr list` is a network call; a hung forge must not hang a listing. */
const GH_TIMEOUT_MS = 60_000;

/** A PR listing is small; anything past this is not a listing. */
const MAX_OUTPUT_BYTES = 1024 * 1024;

class DiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscoveryError";
  }
}

interface CommandOutcome {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Runs `gh` with a hard deadline. The deadline kills the whole process group
 * where the platform has one (QCLI-378's finding, reused here): killing only
 * the direct child leaves a grandchild holding the output pipes, and the
 * promise then never settles even though the deadline won.
 */
async function runGh(
  repositoryPath: string,
  args: readonly string[],
): Promise<CommandOutcome> {
  const argv = ["gh", ...args];
  let child: ReturnType<typeof Bun.spawn>;
  try {
    child = Bun.spawn(argv, {
      cwd: repositoryPath,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      ...(process.platform === "win32" ? {} : { detached: true }),
    });
  } catch (error) {
    const code = (error as { code?: unknown }).code;
    throw new DiscoveryError(
      code === "ENOENT"
        ? "gh was not found on PATH, so no pull request could be listed."
        : `gh could not be run: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (
    !(child.stdout instanceof ReadableStream) ||
    !(child.stderr instanceof ReadableStream)
  )
    throw new DiscoveryError("gh output streams are unavailable.");

  const stdoutReader = child.stdout.getReader();
  const stderrReader = child.stderr.getReader();
  const read = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ): Promise<string> => {
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_OUTPUT_BYTES)
        throw new DiscoveryError(
          `gh printed more than ${MAX_OUTPUT_BYTES} bytes.`,
        );
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  };
  const stop = (): void => {
    try {
      if (process.platform === "win32") child.kill("SIGKILL");
      else process.kill(-child.pid, "SIGKILL");
    } catch {
      // Already gone.
    }
    void stdoutReader.cancel().catch(() => undefined);
    void stderrReader.cancel().catch(() => undefined);
    child.unref();
  };
  const completed = Promise.all([
    child.exited,
    read(stdoutReader),
    read(stderrReader),
  ]);
  completed.catch(() => undefined);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const outcome = await Promise.race([
    completed,
    new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), GH_TIMEOUT_MS);
    }),
  ]);
  clearTimeout(timer);
  if (outcome === "timeout") {
    stop();
    throw new DiscoveryError(
      `gh did not finish within ${GH_TIMEOUT_MS / 1000}s.`,
    );
  }
  const [exitCode, stdout, stderr] = outcome;
  if (exitCode !== 0)
    throw new DiscoveryError(
      `gh pr list failed (exit ${exitCode})${firstLine(stderr) === "" ? "" : `: ${firstLine(stderr)}`}`,
    );
  return { exitCode, stdout, stderr };
}

function firstLine(text: string): string {
  const line = text
    .split("\n")
    .map((value) => value.trim())
    .find((value) => value.length > 0);
  return line ?? "";
}

/**
 * `owner/repo` from a GitHub remote URL, or null for any other host. Handles
 * the three shapes Git writes: `git@github.com:owner/repo.git` (scp-like),
 * `https://github.com/owner/repo.git`, and `ssh://git@github.com/owner/repo.git`.
 * A non-GitHub remote is NOT null here -- the caller distinguishes "no origin"
 * from "an origin we cannot ask" by which shape this returns.
 */
export function githubSlug(url: string): string | null {
  const trimmed = url.trim();
  const scp = /^(?:[^@/@]+@)?github\.com:(?<path>.+)$/u.exec(trimmed);
  if (scp?.groups?.path) return normalizeRepoPath(scp.groups.path);
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  if (parsed.hostname.toLowerCase() !== "github.com") return null;
  return normalizeRepoPath(parsed.pathname);
}

function normalizeRepoPath(path: string): string | null {
  const parts = path
    .replace(/^\/+/u, "")
    .replace(/\.git$/u, "")
    .split("/")
    .filter((part) => part.length > 0);
  return parts.length === 2 ? `${parts[0]}/${parts[1]}` : null;
}

/** `owner/repo#N` from a pull request's html url, or null when it is not one. */
export function pullRequestLabel(url: string): string | null {
  const match =
    /^https?:\/\/(?:[^/]*@)?[^/]+\/(?<repo>[^/]+\/[^/]+)\/pull\/(?<n>[0-9]+)\/?$/u.exec(
      url.trim(),
    );
  const repo = match?.groups?.repo;
  const number = match?.groups?.n;
  if (repo === undefined || number === undefined) return null;
  return `${repo.replace(/\.git$/u, "")}#${number}`;
}

export class GhRefDiscovery implements RefDiscoveryPort {
  constructor(private readonly git: GitPort) {}

  async origin(repositoryPath: string): Promise<OriginRemote> {
    const url = await this.git.remoteUrl(repositoryPath, "origin");
    if (url === null) return { kind: "absent" };
    const slug = githubSlug(url);
    return slug === null
      ? { kind: "unsupported", url }
      : { kind: "github", slug };
  }

  async listOpenPullRequests(
    repositoryPath: string,
    slug: string,
    base: string,
  ): Promise<readonly DiscoveredPullRequest[]> {
    const outcome = await runGh(repositoryPath, [
      "pr",
      "list",
      "--state",
      "open",
      "--base",
      base,
      "--json",
      "number,headRefName,headRefOid,url",
    ]);
    let parsed: unknown;
    try {
      parsed = JSON.parse(outcome.stdout);
    } catch {
      throw new DiscoveryError(
        `gh pr list did not return JSON${firstLine(outcome.stderr) === "" ? "" : `: ${firstLine(outcome.stderr)}`}`,
      );
    }
    if (!Array.isArray(parsed))
      throw new DiscoveryError("gh pr list did not return a JSON array.");
    const rows: DiscoveredPullRequest[] = [];
    for (const row of parsed) {
      if (typeof row !== "object" || row === null) continue;
      const record = row as Record<string, unknown>;
      const number = record.number;
      const headRefOid = record.headRefOid;
      if (
        typeof number !== "number" ||
        !Number.isSafeInteger(number) ||
        typeof headRefOid !== "string" ||
        !/^[0-9a-f]{40}$/u.test(headRefOid)
      )
        continue;
      rows.push({
        number,
        headRefName:
          typeof record.headRefName === "string" ? record.headRefName : "",
        headRefOid,
        ...(typeof record.url === "string" ? { url: record.url } : {}),
      });
    }
    // `slug` is the origin's own owner/repo; naming it in the error keeps a
    // "no open PRs" answer attributable to the repository it was asked about.
    if (rows.length === 0 && firstLine(outcome.stderr).length > 0)
      throw new DiscoveryError(
        `gh pr list reported no usable rows for ${slug}: ${firstLine(outcome.stderr)}`,
      );
    return rows;
  }
}
