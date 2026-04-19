---
id: T-add-http-leader-election
title: Add HTTP leader-election bootstrap to server startup
status: done
priority: high
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-refactor-cli-surface-replace
  - T-remove-activate-mcp-tool-and
  - T-write-metajson-to-project
affectedFiles:
  src/server.ts: Added http import, exported httpServer (no handler), added port
    binding logic in startServer() with graceful EADDRINUSE handling
  src/__tests__/e2e/utils/serverProcess.ts: Added TRELLIS_UI_PORT=0 env var to avoid port conflicts in e2e tests
log:
  - Added HTTP leader-election bootstrap to server startup. Exported httpServer
    (no request handler) at module level. In startServer(), reads
    TRELLIS_UI_PORT (default 3717), attempts to bind on 127.0.0.1 — logs warning
    on EADDRINUSE and continues, logs error on other failures and continues.
    STDIO MCP transport starts in all cases. E2e test helper passes
    TRELLIS_UI_PORT=0 to avoid port conflicts.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:47:47.209Z
updated: 2026-04-19T03:47:47.209Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. The design calls for exactly one Claude Code session to serve the HTTP UI — whichever session starts first and successfully binds the port wins leadership. All other sessions detect `EADDRINUSE` and run STDIO-only. This task implements the bootstrap handshake only; HTTP route registration is handled separately in `T-create-srchttp-scaffold-with`.

Prerequisite: `T-refactor-cli-surface-replace` (server startup flow must be stable before adding the HTTP bind).

Relevant file: `src/server.ts` — the `startServer()` function.

## What to Build

### 1. Resolve the UI port

At the top of `startServer()` (after arg parsing), read the port:

```ts
const uiPort = parseInt(process.env.TRELLIS_UI_PORT ?? "3717", 10);
```

### 2. Create the HTTP server with no request handler

Use Node's built-in `node:http` module — no new dependencies. Create the server with **no default request handler** so the route-registration task (`T-create-srchttp-scaffold-with`) can attach the sole `'request'` listener cleanly:

```ts
import http from "node:http";

const httpServer = http.createServer(); // no handler — routes attached separately
```

### 3. Attempt to bind the port

Inside `startServer()`, attempt to listen before starting STDIO:

```ts
await new Promise<void>((resolve) => {
  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn("UI already served by another instance");
    } else {
      console.error("HTTP server error:", err.message);
    }
    resolve(); // always continue to STDIO
  });
  httpServer.listen(uiPort, "127.0.0.1", () => {
    console.log(`Task Trellis UI: http://127.0.0.1:${uiPort}`);
    resolve();
  });
});
```

### 4. Keep `httpServer` accessible for route registration

Export the `httpServer` instance (e.g., from a module-level `export const httpServer = http.createServer()`) so `src/http/index.ts` can import it and attach the router as the one and only `'request'` listener.

### 5. Lifecycle

The `httpServer` stays alive for the full process lifetime. No explicit `close()` call is needed — when the process exits the port is released automatically.

## Acceptance Criteria

- First session to start logs `Task Trellis UI: http://127.0.0.1:3717` (or custom port) and binds the port.
- Second session logs `UI already served by another instance` and proceeds with STDIO-only — no exit, no error thrown.
- `TRELLIS_UI_PORT=4000` moves the bind to port 4000.
- Any non-`EADDRINUSE` HTTP error is logged to stderr but does not crash the process.
- The created `httpServer` has **no** `'request'` listener attached at this point — route registration is deferred to `T-create-srchttp-scaffold-with`.
- STDIO MCP transport starts and accepts tool calls in all cases (leader and follower).
- `mise run quality` and `mise run test` pass.

## Testing Requirements

No new unit tests required for this bootstrap logic — it is tested indirectly by the e2e suite. If any existing e2e tests start a server and would conflict on the port, pass `TRELLIS_UI_PORT=0` (or a dedicated test port) in the test environment to avoid conflicts.

## Out of Scope

- HTTP route registration (landing page, project tree) — separate task.
- Any UI rendering or HTMX partials.
- A placeholder 503 handler — the server starts with no request handler.
- Cross-process discovery or leadership takeover.
- Auth, TLS, or non-localhost binding.
