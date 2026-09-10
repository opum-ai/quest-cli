import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";

import type {
  PlanningBoard,
  PlanningService,
  ProjectOverview,
} from "../planning/planning.ts";
import type { TaskReader } from "../tasks/tasks.ts";

export const defaultBrowserHost = "127.0.0.1";

export interface BrowserDependencies {
  readonly tasks: TaskReader;
  readonly planning: Pick<PlanningService, "overview" | "board">;
}

export interface BrowserServerOptions {
  /** A loopback address only. Defaults to IPv4 loopback rather than every interface. */
  readonly host?: string;
  /** The port is deliberately caller-controlled; use 0 for an ephemeral port. */
  readonly port?: number;
}

export interface StartedBrowserServer {
  readonly host: string;
  readonly port: number;
  readonly server: Server;
  close(): Promise<void>;
}

type BrowserPayload =
  | { readonly kind: "browser.overview"; readonly overview: ProjectOverview }
  | { readonly kind: "browser.board"; readonly board: PlanningBoard };

function isLoopbackHost(host: string): boolean {
  return host === "127.0.0.1" || host === "::1";
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "x-content-type-options": "nosniff",
  });
  response.end(`${JSON.stringify(body)}\n`);
}

function sendMethodNotAllowed(response: ServerResponse): void {
  response.writeHead(405, { allow: "GET", "cache-control": "no-store" });
  response.end();
}

/**
 * Creates the read-only HTTP request boundary used by the optional local browser
 * surface. It deliberately has no browser-launch or persistence capability.
 */
export function createBrowserHandler(dependencies: BrowserDependencies) {
  return async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    if (request.method !== "GET") return sendMethodNotAllowed(response);

    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    try {
      const payload: BrowserPayload | undefined =
        path === "/" || path === "/overview"
          ? {
              kind: "browser.overview",
              overview: await dependencies.planning.overview(
                dependencies.tasks,
              ),
            }
          : path === "/board"
            ? {
                kind: "browser.board",
                board: await dependencies.planning.board(dependencies.tasks),
              }
            : undefined;
      if (!payload) return sendJson(response, 404, { error: "not_found" });
      return sendJson(response, 200, payload);
    } catch {
      // Do not disclose local repository details through the loopback surface.
      return sendJson(response, 500, { error: "browser_data_unavailable" });
    }
  };
}

/** Creates an unbound local HTTP server; callers opt in to listening separately. */
export function createBrowserServer(dependencies: BrowserDependencies): Server {
  const handler = createBrowserHandler(dependencies);
  return createServer((request, response) => {
    void handler(request, response);
  });
}

/** Starts the read-only server on a loopback address, never launching a browser. */
export async function startBrowserServer(
  dependencies: BrowserDependencies,
  options: BrowserServerOptions = {},
): Promise<StartedBrowserServer> {
  const host = options.host ?? defaultBrowserHost;
  if (!isLoopbackHost(host)) throw new Error("browser_host_must_be_loopback");
  const server = createBrowserServer(dependencies);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 0, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    throw new Error("browser_server_address_unavailable");
  }
  return {
    host,
    port: address.port,
    server,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}
