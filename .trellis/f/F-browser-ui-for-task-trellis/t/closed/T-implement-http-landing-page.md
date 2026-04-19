---
id: T-implement-http-landing-page
title: Implement HTTP landing page listing all projects with counts
status: done
priority: medium
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-create-srchttp-scaffold-with
  - T-write-metajson-to-project
affectedFiles:
  src/http/landingPage.ts: New handler module — landingPageHandler enumerates
    project dirs, reads meta.json labels, computes issue counts, renders HTML
    landing page
  src/http/index.ts:
    Replaced placeholder / handler with import and delegation to
    landingPageHandler
  src/http/__tests__/landingPage.test.ts: "Unit tests: label/fallback rendering,
    accurate count calculation, empty-state on readdir failure"
log:
  - Implemented HTTP landing page handler that enumerates projects under
    ~/.trellis/projects/, reads meta.json for human-readable labels, computes
    open/in-progress/done counts via LocalRepository.getObjects(), and renders
    server-side HTML. Replaced the placeholder / route in index.ts. Includes
    unit tests for label fallback, count accuracy, and empty-state on readdir
    failure.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:48:56.578Z
updated: 2026-04-19T03:48:56.578Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. The HTTP scaffold (`T-create-srchttp-scaffold-with`) registered a placeholder `/` route. This task replaces that placeholder with a real landing page that enumerates all projects stored under the shared data dir and renders them as a linked list with counts.

Prerequisites:

- `T-create-srchttp-scaffold-with` — router, `page()`, `escapeHtml()` must exist.
- `T-write-metajson-to-project` — `meta.json` format must be stable before reading it here.

Relevant files:

- `src/http/index.ts` — where the `/` route is currently registered as a placeholder
- `src/http/layout.ts` — `page()` and `escapeHtml()` helpers
- `src/repositories/local/LocalRepository.ts` — `getObjects()` for count queries
- `src/configuration/resolveDataDir.ts` — `resolveDataDir()` to find `~/.trellis`

## What to Build

### `src/http/landingPage.ts`

A handler module for the `/` route:

```ts
export async function landingPageHandler(
  _req: IncomingMessage,
  res: ServerResponse,
): Promise<void>;
```

Implementation steps inside the handler:

1. **Enumerate projects**: list directories under `<resolveDataDir()>/projects/`.  
   Use `fs/promises` `readdir` with `{ withFileTypes: true }` and filter for directories only. Each directory name is a `<key>`.

2. **Read `meta.json`**: for each `<key>`, attempt to read `<dataRoot>/projects/<key>/meta.json`. Parse `label` from JSON; fall back to the bare `<key>` string if the file is absent or unparseable.

3. **Compute counts**: instantiate a `LocalRepository` with `planningRootFolder = <dataRoot>/projects/<key>/` (mode `"local"`, `autoCompleteParent: false`, `autoPrune: 0`). Call `getObjects(true)` to fetch all objects (including closed), then compute:
   - `total`: all issues
   - `open`: issues where `isOpen(obj)` is true
   - `inProgress`: status `"in-progress"`
   - `done`: status `"done"`

4. **Render HTML**: emit a server-rendered page with no JavaScript interactions required:

   ```html
   <h1>Task Trellis</h1>
   <ul>
     <li><a href="/projects/<key>"><label></a> — <open> open, <inProgress> in-progress, <done> done</li>
     …
   </ul>
   ```

   Use `escapeHtml()` on all dynamic strings. Wrap in `page('Task Trellis — Projects', body)`.

5. **Empty state**: if no project directories exist, render `<p>No projects found under <dataRoot>/projects/.</p>`.

6. **Error handling**: if `readdir` fails (e.g., directory does not exist yet), render the empty state rather than returning a 500.

### Register the route

In `src/http/index.ts`, replace the placeholder `/` handler with an import and call to `landingPageHandler`.

## Acceptance Criteria

- `GET /` lists all project directories discovered under `~/.trellis/projects/`.
- Each project shows its human-readable `label` from `meta.json`, or the 12-char key as fallback.
- Each project entry is a hyperlink to `/projects/<key>`.
- Issue counts (open, in-progress, done) are accurate.
- When no project directories exist, a friendly empty-state message is shown.
- `escapeHtml` is applied to all dynamic content (label, key).
- `mise run quality` and `mise run test` pass.

## Testing Requirements

Unit tests in `src/http/__tests__/landingPage.test.ts`:

- Mock `readdir` to return two fake project dirs; mock `fs.readFile` to return `meta.json` for one and reject for the other. Verify both appear in rendered HTML with correct label/key fallback.
- Mock `LocalRepository.getObjects` to return a fixed set of objects. Verify counts in the rendered output.
- Mock `readdir` to throw; verify the empty-state message is rendered (no 500).

## Out of Scope

- HTMX partial updates or auto-refresh on the landing page.
- Project creation, deletion, or management actions.
- The `/projects/<key>` tree page — separate task.
- Any CSS styling beyond basic semantic HTML.
