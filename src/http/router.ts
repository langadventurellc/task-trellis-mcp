import { IncomingMessage, ServerResponse } from "node:http";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) => void | Promise<void>;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface Route {
  method: HttpMethod;
  pattern: string;
  segments: string[];
  handler: Handler;
}

function matchRoute(
  route: Route,
  method: string,
  pathname: string,
): Record<string, string> | null {
  if (route.method !== method) return null;

  const incoming = pathname.split("/").filter(Boolean);
  const pattern = route.segments;

  if (incoming.length !== pattern.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < pattern.length; i++) {
    const seg = pattern[i];
    if (seg.startsWith(":")) {
      params[seg.slice(1)] = decodeURIComponent(incoming[i]);
    } else if (seg !== incoming[i]) {
      return null;
    }
  }
  return params;
}

function addRoute(
  routes: Route[],
  method: HttpMethod,
  pattern: string,
  handler: Handler,
): void {
  routes.push({
    method,
    pattern,
    segments: pattern.split("/").filter(Boolean),
    handler,
  });
}

export function createRouter() {
  const routes: Route[] = [];

  return {
    get(pattern: string, handler: Handler): void {
      addRoute(routes, "GET", pattern, handler);
    },

    post(pattern: string, handler: Handler): void {
      addRoute(routes, "POST", pattern, handler);
    },

    put(pattern: string, handler: Handler): void {
      addRoute(routes, "PUT", pattern, handler);
    },

    delete(pattern: string, handler: Handler): void {
      addRoute(routes, "DELETE", pattern, handler);
    },

    dispatch(req: IncomingMessage, res: ServerResponse): void {
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
      const method = req.method ?? "GET";

      for (const route of routes) {
        const params = matchRoute(route, method, pathname);
        if (params !== null) {
          void Promise.resolve(route.handler(req, res, params));
          return;
        }
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    },
  };
}
