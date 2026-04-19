---
id: F-browser-ui-for-task-trellis
title: Browser UI for Task Trellis Issues
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  src/configuration/resolveDataDir.ts: "New file: resolveDataDir() pure function
    returning TRELLIS_DATA_DIR env var or ~/.trellis; New file: resolveDataDir()
    pure function"
  src/configuration/resolveProjectKey.ts: "New file: resolveProjectKey() pure
    function returning 12-char hex sha1 of git origin URL or absolute path; New
    file: resolveProjectKey() pure function; Refactored to delegate to
    resolveProjectLabel for DRY label resolution"
  src/configuration/index.ts: Added re-exports for resolveDataDir and
    resolveProjectKey; Added re-exports for new modules; Added export for
    resolveProjectLabel
  src/configuration/__tests__/resolveDataDir.test.ts: "New file: unit tests for
    both resolveDataDir and resolveProjectKey (4 test cases); New file: unit
    tests for both functions"
  src/server.ts: Replaced --projectRootFolder option with --projectDir; updated
    CliOptions interface; added fail-fast validation for local mode; derived
    planningRootFolder from resolveDataDir()/resolveProjectKey(); Fixed stale
    comment referencing projectRootFolder (line 192); Removed activateTool
    import, conditional tool-push block, planningRootFolder guard block, and
    activate case from switch statement; Import resolveProjectLabel and populate
    projectLabel in serverConfig; Added http import, exported httpServer (no
    handler), added port binding logic in startServer() with graceful EADDRINUSE
    handling; Replaced inline http.createServer() with import from ./httpServer;
    added side-effect import of ./http to wire router at startup
  src/__tests__/e2e/utils/mcpTestClient.ts: Updated --projectRootFolder arg to --projectDir
  src/__tests__/e2e/utils/serverProcess.ts: Updated --projectRootFolder arg to
    --projectDir; Added TRELLIS_UI_PORT=0 env var to avoid port conflicts in e2e
    tests
  src/__tests__/e2e/configuration/commandLineArgs.e2e.test.ts:
    "Replaced all --projectRootFolder references with --projectDir; Fixed 2
    failing tests: added --projectDir to 'should start server with --mode local'
    and 'should default to local mode when --mode not specified'; Removed 3
    tests that called activate; removed unused path import"
  src/__tests__/e2e/autoPrune.e2e.test.ts: Replaced all --projectRootFolder
    references with --projectDir; Added TRELLIS_DATA_DIR env var to server
    process; added getTrellisRoot() helper using resolveProjectKey; updated
    createObjectWithAge to write to the resolved data path instead of
    projectRoot/.trellis
  src/__tests__/e2e/configuration/preActivation.e2e.test.ts: Updated
    --projectRootFolder comment to --projectDir; Deleted — entire pre-activation
    flow (tools blocked without projectDir) no longer reachable in local mode;
    Deleted entirely (deleted by prerequisite task
    T-refactor-cli-surface-replace; recorded here for completeness)
  src/__tests__/e2e/configuration/activation.e2e.test.ts: Updated
    --projectRootFolder comment to --projectDir; Rewrote
    connectWithoutProjectRoot() to connectInRemoteMode() (remote mode doesn't
    require --projectDir); removed stale pre-activation error assertion from
    'should allow tool usage after activation'; Deleted entirely
  mise.toml: Updated inspector task to use --projectDir instead of removed
    --projectRootFolder flag
  src/__tests__/e2e/configuration/directorySetup.e2e.test.ts: Changed beforeEach
    server spawn from --mode local to --mode remote; tests use activate tool to
    configure local mode, keeping .trellis path assertions intact; Deleted
    entirely (all tests relied on activate tool)
  src/__tests__/e2e/configuration/invalidConfig.e2e.test.ts: Changed beforeEach
    server spawn from --mode local to --mode remote; same activate-based
    pattern; Deleted entirely (all tests relied on activate tool)
  src/tools/activateTool.ts: Deleted entirely
  src/tools/index.ts: Removed activateTool and handleActivate exports
  src/__tests__/e2e/infrastructure/client.e2e.test.ts: Removed activate-specific
    test; removed activate setup calls from 2 remaining tests
  src/__tests__/e2e/crud/createObject.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/crud/fileValidation.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/crud/getObject.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/crud/listObjects.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/crud/updateObject.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/crud/deleteObject.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/prerequisites.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/appendLog.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/appendModifiedFiles.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/claimTask.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/getNextAvailableIssue.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/taskLifecycle.e2e.test.ts: Removed activate call from beforeEach
  src/__tests__/e2e/workflow/completeTask.e2e.test.ts: Removed activate calls from both main and nested beforeEach
  src/__tests__/e2e/hierarchicalPrerequisites.e2e.test.ts: Removed activate call from beforeEach
  src/configuration/resolveProjectLabel.ts: "New file: exports
    resolveProjectLabel() returning git remote origin URL or absolute path"
  src/configuration/ServerConfig.ts: Added optional projectLabel field
  src/repositories/local/writeProjectMeta.ts: "New file: idempotent meta.json writer"
  src/repositories/local/LocalRepository.ts: saveObject now calls writeProjectMeta before delegating to saveObjectImpl
  src/repositories/local/__tests__/writeProjectMeta.test.ts: "New unit tests: first write, idempotency, fallback label"
  eslint.config.mjs: Added htmx.min.js to ignore patterns to prevent linting vendored browser JS
  src/httpServer.ts: "New file: creates and exports httpServer
    (http.createServer()) to break circular dependency between server.ts and
    http/index.ts"
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
    listener.; Replaced placeholder / handler with import and delegation to
    landingPageHandler; Registered 3 new project tree routes"
  src/http/__tests__/router.test.ts:
    "New file: unit tests for static route match,
    named-param extraction, and 404 handling"
  src/http/__tests__/layout.test.ts: "New file: unit tests for escapeHtml (5
    special chars) and page() (htmx script tag, body inclusion)"
  README.md: Added Configuration section with CLI flags/env vars table, shared
    data dir layout, browser UI description, and breaking-change callouts;
    removed activate tool from Available Tools; updated Troubleshooting to
    reference --projectDir
  .mcp.json: Replaced --projectRootFolder /Users/zach/code/task-trellis-mcp with
    --projectDir ${CLAUDE_PROJECT_DIR}
  src/http/landingPage.ts: New handler module — landingPageHandler enumerates
    project dirs, reads meta.json labels, computes issue counts, renders HTML
    landing page
  src/http/__tests__/landingPage.test.ts: "Unit tests: label/fallback rendering,
    accurate count calculation, empty-state on readdir failure"
  src/http/projectTreePage/index.ts: Barrel re-exporting all three route handlers
  src/http/projectTreePage/treeNode.ts: Renders collapsible HTMX tree node HTML for a TrellisObject
  src/http/projectTreePage/renderDetail.ts: Renders detail pane HTML fragment for a TrellisObject
  src/http/projectTreePage/projectTreeHandler.ts: GET /projects/:key — full page with root-level tree and empty detail pane
  src/http/projectTreePage/childrenPartialHandler.ts: GET /projects/:key/issues/:id/children — HTMX partial returning child nodes
  src/http/projectTreePage/detailPartialHandler.ts: GET /projects/:key/issues/:id/detail — HTMX partial returning object detail
  src/http/__tests__/projectTreePage.test.ts: Unit tests for childrenPartialHandler and detailPartialHandler
log:
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-add-http-leader-election
  - T-add-resolvedatadir-module
  - T-create-srchttp-scaffold-with
  - T-implement-http-landing-page
  - T-implement-projectskey-tree
  - T-refactor-cli-surface-replace
  - T-remove-activate-mcp-tool-and
  - T-update-readme-and-mcpjson-for
  - T-write-metajson-to-project
created: 2026-04-19T03:38:46.796Z
updated: 2026-04-19T03:38:46.796Z
---

## Overview

Convert the task-trellis-mcp server into a dual-surface tool: unchanged STDIO MCP interface for Claude Code agents, plus an HTTP server on `127.0.0.1` that renders a read-only browser UI showing issues across all projects on the user's machine.

This feature bundles two workstreams:

1. **Shared-storage migration** — move data from per-repo `.trellis/` into `~/.trellis/projects/<key>/`, keyed by a 12-char SHA-1 of the git remote origin URL (or absolute path for non-git dirs). Remove `--projectRootFolder` and the `activate` MCP tool.
2. **HTTP server + HTMX browser UI** — server-rendered HTML partials served by whichever Claude Code session wins the leader-election port bind on startup.

## Scope

### In scope (MVP — read-only)

- `src/server.ts`: drop `--projectRootFolder`; require `--projectDir` or `$TRELLIS_PROJECT_DIR` (fail fast otherwise); leader-election HTTP bind on startup; on success log the URL (e.g., `Task Trellis UI: http://127.0.0.1:3717`) so users can copy it.
- `src/configuration/ServerConfig.ts`: `planningRootFolder` resolves to `~/.trellis/projects/<key>/`.
- New `src/configuration/resolveDataDir.ts`: resolves `$TRELLIS_DATA_DIR || ~/.trellis` and computes per-project key `sha1(gitRemoteOrigin ?? absoluteProjectPath).slice(0, 12)`.
- Delete `src/tools/activateTool.ts` and its e2e test.
- New `src/http/` (or `src/ui/`): Node built-in `http` module, HTMX-driven server-rendered partials, template literals — no bundler, no SPA framework.
- Leader election: attempt `server.listen(port, '127.0.0.1')`; on `EADDRINUSE` log "UI already served by another instance" and continue STDIO-only.
- Default port `3717`; overridable via `TRELLIS_UI_PORT` env var.
- HTTP routes: `/` (project list with name/id/counts) and `/projects/<key>` (Project → Epic → Feature → Task tree with status/priority badges and detail pane for body, status, priority, prerequisites, logs, modified files).
- Small `meta.json` per project dir written at first write to store human-readable label (gitOriginUrl or absolute path) for UI display.
- HTTP handlers aggregate across `~/.trellis/projects/*/` using existing `LocalRepository`.
- README updated to document new CLI flags, shared data dir, and UI port.
- Companion `task-trellis-teams` plugin's `.mcp.json` updated to pass `${CLAUDE_PROJECT_DIR}` into `--projectDir`.

### Out of scope (MVP)

- UI mutations (create/update/delete/claim/complete).
- Auth, cross-origin access, or remote access.
- Auto-refresh, websockets, SSE, file-change notifications.
- Daemon mode or keeping UI alive after the last session closes.
- Docker packaging, HTTP-based MCP transport.
- Migration tooling for existing in-repo `.trellis/` folders.

## Acceptance Criteria

- STDIO MCP behavior is unchanged for all existing tools except `activate` (removed).
- Server fails fast at startup if neither `--projectDir` nor `$TRELLIS_PROJECT_DIR` is provided.
- All writes land under `~/.trellis/projects/<key>/`; nothing is created in the user's repo.
- Two different repos → two distinct `<key>` dirs; same origin cloned twice → one shared dir; non-git dir resolves via absolute-path hash.
- `TRELLIS_DATA_DIR=/tmp/foo` redirects all writes to `/tmp/foo/projects/<key>/`.
- With one Claude Code session running, `http://127.0.0.1:3717` loads the project list and tree views for every project under the shared data dir.
- When the leader session starts, it logs the UI URL (e.g., `Task Trellis UI: http://127.0.0.1:3717`) to stdout.
- A second Claude Code session detects `EADDRINUSE`, logs "UI already served by another instance," and runs STDIO-only without error.
- When the leader session exits the port is released; a subsequent MCP launch can bind it.
- `TRELLIS_UI_PORT=4000` moves the UI to port 4000.
- README updated to document new CLI flags, shared data dir layout, and UI port.
- Companion `task-trellis-teams` plugin's `.mcp.json` updated to pass `${CLAUDE_PROJECT_DIR}` into `--projectDir`.
- `mise run quality` and `mise run test` pass.

## Implementation Guidance

- Reuse `LocalRepository` for HTTP data access — no new data layer.
- Template-literal HTML rendering is sufficient; avoid any build tooling.
- Leader election is fire-and-forget at startup; no retry or cross-process discovery mechanism.
- Manual browser refresh to pick up new data — no polling.
