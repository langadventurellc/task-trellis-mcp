import { IncomingMessage, ServerResponse } from "node:http";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) => void | Promise<void>;

interface Route {
  pattern: string;
  segments: string[];
  handler: Handler;
}

function matchRoute(
  route: Route,
  pathname: string,
): Record<string, string> | null {
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

export function createRouter() {
  const routes: Route[] = [];

  return {
    get(pattern: string, handler: Handler): void {
      routes.push({
        pattern,
        segments: pattern.split("/").filter(Boolean),
        handler,
      });
    },

    dispatch(req: IncomingMessage, res: ServerResponse): void {
      const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

      for (const route of routes) {
        const params = matchRoute(route, pathname);
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
