---
id: T-implement-projectskey-tree
title: Implement /projects/:key tree page with HTMX expand/collapse and detail pane
status: done
priority: medium
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-create-srchttp-scaffold-with
  - T-implement-http-landing-page
affectedFiles:
  src/http/projectTreePage/index.ts: Barrel re-exporting all three route handlers
  src/http/projectTreePage/treeNode.ts: Renders collapsible HTMX tree node HTML for a TrellisObject
  src/http/projectTreePage/renderDetail.ts: Renders detail pane HTML fragment for a TrellisObject
  src/http/projectTreePage/projectTreeHandler.ts: GET /projects/:key — full page with root-level tree and empty detail pane
  src/http/projectTreePage/childrenPartialHandler.ts: GET /projects/:key/issues/:id/children — HTMX partial returning child nodes
  src/http/projectTreePage/detailPartialHandler.ts: GET /projects/:key/issues/:id/detail — HTMX partial returning object detail
  src/http/index.ts: Registered 3 new project tree routes
  src/http/__tests__/projectTreePage.test.ts: Unit tests for childrenPartialHandler and detailPartialHandler
log:
  - Implemented /projects/:key tree page with HTMX expand/collapse and detail
    pane. Created projectTreePage directory with one-export-per-file structure
    (treeNode, renderDetail, projectTreeHandler, childrenPartialHandler,
    detailPartialHandler, index barrel). Registered 3 routes in
    src/http/index.ts. Unit tests pass (4 tests covering both partials). All 702
    tests pass, quality clean.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:49:37.740Z
updated: 2026-04-19T03:49:37.740Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. The landing page links each project to `/projects/<key>`. This task implements that route as a hierarchical Project → Epic → Feature → Task tree with HTMX-powered expand/collapse and a detail pane, all server-rendered.

Prerequisite: `T-create-srchttp-scaffold-with` — router, `page()`, `escapeHtml()`, and `/_htmx.js` must be available.

Relevant files:

- `src/http/index.ts` — where new routes are registered
- `src/http/layout.ts` — `page()`, `escapeHtml()`
- `src/repositories/local/LocalRepository.ts` — `getObjects()`, `getChildrenOf()`
- `src/repositories/local/getChildrenOf.ts` — returns child objects for a given parent

## What to Build

### New files

```
src/http/projectTreePage.ts  — full-page and partial handlers
```

### Routes to register in `src/http/index.ts`

| Method | Path                                 | Handler                                 |
| ------ | ------------------------------------ | --------------------------------------- |
| GET    | `/projects/:key`                     | `projectTreeHandler` — full page        |
| GET    | `/projects/:key/issues/:id/children` | `childrenPartialHandler` — HTMX partial |
| GET    | `/projects/:key/issues/:id/detail`   | `detailPartialHandler` — HTMX partial   |

### `projectTreeHandler`

1. Build `planningRootFolder = <resolveDataDir()>/projects/<key>`.
2. Instantiate `LocalRepository` for that folder.
3. Fetch all open root-level issues (no parent) using `getObjects(false)`.
4. Render each root issue as a collapsible tree node. Each node has:
   - A toggle button using `hx-get="/projects/<key>/issues/<id>/children"` and `hx-target` pointing to a sibling `<div>` for children.
   - A link/button using `hx-get="/projects/<key>/issues/<id>/detail"` and `hx-target="#detail-pane"` to load the detail pane on the right.
   - Status and priority badges rendered as `<span>` tags.
5. Include an empty `<div id="detail-pane">` on the right side of the layout.
6. Wrap in `page('Task Trellis — <key>', body)`.
7. Return 404 if the project directory does not exist.

### `childrenPartialHandler`

1. Resolve `planningRootFolder` from `<key>`.
2. Call `repository.getChildrenOf(id, false)`.
3. Render each child as a tree node (same structure as root nodes, recursive-capable).
4. Return the fragment HTML — do NOT wrap in `page()`.
5. Return an empty `<div>` if no children found.

### `detailPartialHandler`

1. Resolve repository from `<key>`.
2. Call `repository.getObjectById(id)`.
3. Render the detail pane fragment with:
   - Title, type, status, priority badges
   - Body (rendered as preformatted text or simple markdown-to-HTML)
   - Prerequisites: list of IDs (link to their detail pane)
   - Log entries: timestamped list
   - Modified files: bullet list
4. Return fragment HTML only.
5. Return a "Not found" message fragment if the object does not exist.

### HTML structure guidelines

- Use semantic HTML: `<details>`/`<summary>` elements are acceptable for collapsible nodes as a fallback, but HTMX lazy-load is preferred.
- Apply `escapeHtml()` to all dynamic text content.
- Status badges: `<span class="badge status-<status>">` (CSS is not required to be comprehensive — basic inline styles are acceptable for MVP).
- Priority badges: `<span class="badge priority-<priority>">`.

## Acceptance Criteria

- `GET /projects/<key>` returns HTTP 200 with a full HTML page listing root-level open issues.
- Clicking a tree node fires an HTMX GET that inserts the children fragment.
- Clicking a node's title fires an HTMX GET that populates `#detail-pane` with body, status, priority, prerequisites, log, and modified files.
- All dynamic content is HTML-escaped.
- `GET /projects/nonexistent-key` returns HTTP 404.
- Manual browser refresh reflects current data.
- `mise run quality` and `mise run test` pass.

## Testing Requirements

Unit tests in `src/http/__tests__/projectTreePage.test.ts`:

- `childrenPartialHandler` returns child node HTML when children exist.
- `childrenPartialHandler` returns empty `<div>` when no children.
- `detailPartialHandler` renders body, status, prerequisites, and log fields.
- `detailPartialHandler` returns "Not found" fragment for unknown IDs.

Mock `LocalRepository` — do not touch the real filesystem in tests.

## Out of Scope

- Write operations (create/update/delete/claim/complete) via the UI.
- Auto-refresh, SSE, or WebSocket connections.
- CSS styling beyond minimal inline badge styles.
- Authentication or access control.
- Closed/done issues are excluded by default; no filtering UI is required for MVP.
