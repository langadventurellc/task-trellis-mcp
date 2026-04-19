---
id: T-add-resolvedatadir-module
title: Add resolveDataDir module with data-root and project-key helpers
status: done
priority: high
parent: F-browser-ui-for-task-trellis
prerequisites: []
affectedFiles:
  src/configuration/resolveDataDir.ts: "New file: resolveDataDir() pure function
    returning TRELLIS_DATA_DIR env var or ~/.trellis; New file: resolveDataDir()
    pure function"
  src/configuration/resolveProjectKey.ts: "New file: resolveProjectKey() pure
    function returning 12-char hex sha1 of git origin URL or absolute path; New
    file: resolveProjectKey() pure function"
  src/configuration/index.ts: Added re-exports for resolveDataDir and
    resolveProjectKey; Added re-exports for new modules
  src/configuration/__tests__/resolveDataDir.test.ts: "New file: unit tests for
    both resolveDataDir and resolveProjectKey (4 test cases); New file: unit
    tests for both functions"
log:
  - "Starting implementation: creating src/configuration/resolveDataDir.ts with
    resolveDataDir() and resolveProjectKey() pure functions, updating index.ts
    exports, and writing unit tests."
  - Created resolveDataDir.ts and resolveProjectKey.ts as separate files (one
    export each per lint rule). resolveDataDir() returns TRELLIS_DATA_DIR env or
    ~/.trellis. resolveProjectKey() shells to git remote get-url origin, falls
    back to sha1(absolutePath) on any error. Both exported from
    configuration/index.ts. 4 unit tests added; all 686 tests pass, quality
    clean.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:45:21.266Z
updated: 2026-04-19T03:45:21.266Z
---

## Context

Part of the Browser UI / shared-storage migration for `F-browser-ui-for-task-trellis`. The current server stores data under a per-repo `.trellis/` folder pointed to by `--projectRootFolder`. The new design moves data to a shared `~/.trellis/` directory so a single HTTP leader can serve all projects. This task creates the pure configuration helpers that resolve that directory and compute the per-project storage key. No server wiring happens here.

Relevant files:

- `src/configuration/ServerConfig.ts` — existing config interface; `planningRootFolder` will eventually point into the new data dir (wired in a separate task)
- `src/configuration/index.ts` — re-exports everything from `configuration/`

## What to Build

Create `src/configuration/resolveDataDir.ts` exporting two pure functions:

### `resolveDataDir(): string`

Returns `process.env.TRELLIS_DATA_DIR` if set and non-empty, otherwise `~/.trellis` (i.e., `path.join(os.homedir(), '.trellis')`).

### `resolveProjectKey(projectDir: string): string`

Returns a 12-character hex string that uniquely identifies the project:

1. Shell out to `git remote get-url origin` with cwd set to `projectDir`.
2. If the command succeeds and returns a non-empty string, use that URL as the hash input.
3. On any error (non-zero exit, timeout, `git` not found, etc.), fall back to `path.resolve(projectDir)` as the hash input.
4. Return `sha1(input).slice(0, 12)` — use Node's built-in `crypto.createHash('sha1')`.

Both functions must be pure with respect to their inputs (no global state mutation). `resolveProjectKey` may shell out but must not throw — all errors fall back to the path hash.

Export both from `src/configuration/index.ts`.

## Implementation Notes

- Use Node built-ins only: `node:crypto`, `node:os`, `node:path`, `node:child_process` (`execSync` or `spawnSync`) — no new dependencies.
- Wrap the `execSync`/`spawnSync` call in a try/catch; treat any exception as a signal to fall back to the absolute path.
- `resolveDataDir` is a one-liner; keep it that way.
- File should be ≤ 40 LOC.

## Acceptance Criteria

- `resolveDataDir()` returns `process.env.TRELLIS_DATA_DIR` when set, otherwise `path.join(os.homedir(), '.trellis')`.
- `resolveProjectKey('/path/to/git-repo')` returns a 12-char lowercase hex string matching `sha1(gitOriginUrl).slice(0, 12)` when `git remote get-url origin` succeeds.
- `resolveProjectKey('/path/to/non-git-dir')` returns `sha1(absolutePath).slice(0, 12)` without throwing.
- Both functions are exported from `src/configuration/index.ts`.
- `mise run quality` and `mise run test` pass.

## Testing Requirements

Unit tests in `src/configuration/__tests__/resolveDataDir.test.ts`:

- `resolveDataDir` with `TRELLIS_DATA_DIR` set → returns the env value.
- `resolveDataDir` without `TRELLIS_DATA_DIR` → returns `path.join(os.homedir(), '.trellis')`.
- `resolveProjectKey` when git succeeds → returns `sha1(remoteUrl).slice(0, 12)`.
- `resolveProjectKey` when git fails → returns `sha1(absolutePath).slice(0, 12)`.

Mock `child_process` exec and `process.env` in tests — do not shell out in the test suite.

## Out of Scope

- Wiring `resolveDataDir` or `resolveProjectKey` into `ServerConfig` or `server.ts` — that is a separate task.
- Creating the `~/.trellis` directory on disk.
- Any HTTP server or leader-election logic.
- Migrating existing `.trellis/` folders.
