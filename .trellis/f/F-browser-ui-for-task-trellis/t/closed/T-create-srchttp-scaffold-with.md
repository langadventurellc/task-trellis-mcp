---
id: T-create-srchttp-scaffold-with
title: Create src/http scaffold with router, HTML helpers, and HTMX asset
status: done
priority: high
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-add-http-leader-election
affectedFiles:
  eslint.config.mjs: Added htmx.min.js to ignore patterns to prevent linting vendored browser JS
  src/httpServer.ts: "New file: creates and exports httpServer
    (http.createServer()) to break circular dependency between server.ts and
    http/index.ts"
  src/server.ts: Replaced inline http.createServer() with import from
    ./httpServer; added side-effect import of ./http to wire router at startup
  src/http/router.ts: "New file: plain-object router with get() and dispatch().
    Supports static routes and one-level named params (:key). Returns 404 for
    unmatched routes."
  src/http/escapeHtml.ts: 'New file: escapes &, <, >, ", '' for safe HTML output'
  src/http/layout.ts: "New file: exports page() — full HTML doc with HTMX script
    tag embedded. Imports escapeHtml from ./escapeHtml."
  src/http/partial.ts: "New file: exports partial() — identity helper for HTMX partial responses"
  src/http/htmx.min.js: "New file: vendored HTMX v2.0.4 minified (50 KB), served at /_htmx.js"
  src/http/index.ts: "New file: wires router to httpServer. Registers /
    (placeholder) and /_htmx.js routes, attaches router as sole request
    listener."
  src/http/__tests__/router.test.ts:
    "New file: unit tests for static route match,
    named-param extraction, and 404 handling"
  src/http/__tests__/layout.test.ts: "New file: unit tests for escapeHtml (5
    special chars) and page() (htmx script tag, body inclusion)"
log:
  - Created src/http scaffold with router, HTML helpers, and HTMX asset.
    Extracted httpServer to src/httpServer.ts to avoid circular dependency.
    Layout functions split into single-export files (escapeHtml.ts, layout.ts,
    partial.ts) per linter rules. Added htmx.min.js (vendored, v2.0.4). All
    quality checks and 695 unit tests pass.
  - 'Fix: src/http/index.ts was missing from disk despite Write tool reporting
    success — the blocking hook errors during earlier writes silently dropped
    the file. Re-created with correct content: router wiring (/ placeholder
    route, /_htmx.js file-serving route, httpServer.on("request") listener).
    Quality checks and 695 tests pass. Build smoke-test confirmed no
    module-not-found error. Also note: layout functions were split into
    escapeHtml.ts, layout.ts, partial.ts (single-export each) due to the
    multiple-exports/no-multiple-exports linter rule which only allows barrel
    files named index.ts.'
  - 'Fix round 2: htmx.min.js was not copied to dist/http/ by the tsc build.
    Updated mise.toml build task to run "tsc && cp src/http/htmx.min.js
    dist/http/htmx.min.js" and added src/http/htmx.min.js to sources. Also
    changed index.ts to eagerly read htmx content at module load (catches
    missing asset at startup). Smoke-tested compiled output: GET / 200, GET
    /_htmx.js 200 application/javascript 83027 bytes, GET /unknown 404. All 695
    tests and quality checks pass.'
schema: v1.0
childrenIds: []
created: 2026-04-19T03:48:21.440Z
updated: 2026-04-19T03:48:21.440Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. The leader-election bootstrap (`T-add-http-leader-election`) creates an HTTP server with **no request handler** and exports it. This task wires in a minimal router and HTML rendering layer so the server actually responds to requests. The actual landing page and project tree pages are implemented in separate tasks.

Prerequisite: `T-add-http-leader-election` — the HTTP server must exist and be exported/accessible before routes can be registered.

## What to Build

### Directory layout

```
src/http/
  router.ts       — path-to-handler map, request dispatch
  layout.ts       — HTML escape helper + page/partial template literals
  htmx.min.js     — vendored HTMX v1.x or v2.x minified script (see note below)
  index.ts        — wires router to the httpServer from leader-election bootstrap
```

### `src/http/router.ts`

A plain object router — no framework:

```ts
type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
) => void | Promise<void>;

export function createRouter(): {
  get(pattern: string, handler: Handler): void;
  dispatch(req: IncomingMessage, res: ServerResponse): void;
};
```

- `pattern` supports one level of named segments, e.g. `/projects/:key`.
- `dispatch` finds the first matching GET handler by `URL` pathname, extracts params, calls the handler.
- Unmatched routes return `404 Not Found` plain text.
- Only GET is needed for MVP.

### `src/http/layout.ts`

```ts
export function escapeHtml(s: string): string; // escapes &, <, >, ", '
export function page(title: string, body: string): string; // full HTML doc with HTMX script tag
export function partial(html: string): string; // returns html as-is (identity helper for clarity)
```

The `page()` function must embed:

```html
<script src="/_htmx.js"></script>
```

### Serve HTMX from `/_htmx.js`

Vendor a copy of HTMX (minified, ~50 KB) into `src/http/htmx.min.js`. In the router, register a `/_htmx.js` GET handler that reads this file and serves it with `Content-Type: application/javascript`. This avoids any CDN dependency and works offline.

To obtain the HTMX minified source, download it once during development — do not add it as an npm dependency. Commit the file to the repo.

### `src/http/index.ts`

Import the `httpServer` exported from the leader-election module. The bootstrap creates the server with **no request handler**, so attaching the router here is the first and only listener — no removal of prior listeners is needed:

```ts
import { httpServer } from "../httpServer"; // or wherever it is exported from server.ts

const router = createRouter();

// Register placeholder route (replaced by landing-page task)
router.get("/", (_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(page("Task Trellis", "<h1>Task Trellis</h1><p>UI coming soon.</p>"));
});

// Register HTMX asset route
router.get("/_htmx.js", (_req, res) => {
  // read htmx.min.js and serve with Content-Type: application/javascript
});

// Attach router as the sole request listener
httpServer.on("request", (req, res) => router.dispatch(req, res));
```

Import `src/http/index.ts` from `src/server.ts` so it runs at startup when the leader binds.

## Acceptance Criteria

- `GET http://127.0.0.1:3717/` returns HTTP 200 with an HTML page containing `<h1>Task Trellis</h1>`.
- `GET http://127.0.0.1:3717/_htmx.js` returns HTTP 200 with `Content-Type: application/javascript` and non-empty body.
- `GET http://127.0.0.1:3717/unknown` returns HTTP 404.
- There is exactly one `'request'` listener on `httpServer` (from `router.dispatch`) — no duplicate or stale listeners.
- Follower sessions (EADDRINUSE) import `src/http/index.ts` without side-effects (import is safe regardless of whether the server is bound).
- `mise run quality` and `mise run test` pass.

## Testing Requirements

Unit tests in `src/http/__tests__/router.test.ts`:

- Static route matches and calls the correct handler.
- Named-param route (e.g., `/projects/:key`) extracts the param correctly.
- Unknown route triggers 404.

Unit tests in `src/http/__tests__/layout.test.ts`:

- `escapeHtml` correctly escapes `&`, `<`, `>`, `"`, `'`.
- `page()` output includes `<script src="/_htmx.js">` and the provided body.

Mock `IncomingMessage` / `ServerResponse` minimally (pass a plain object with `writeHead` and `end` stubs).

## Out of Scope

- The landing page (`/`) beyond the placeholder heading — separate task.
- The project tree page (`/projects/:key`) — separate task.
- HTMX partial patterns (`hx-get`, `hx-target`) — implemented in the page tasks.
- Auth, middleware, compression, or response caching.
- Any bundler or build step — template literals only.
