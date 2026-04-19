---
id: T-refactor-cli-surface-replace
title: "Refactor CLI surface: replace --projectRootFolder with --projectDir and
  shared data root"
status: done
priority: high
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-add-resolvedatadir-module
affectedFiles:
  src/server.ts: Replaced --projectRootFolder option with --projectDir; updated
    CliOptions interface; added fail-fast validation for local mode; derived
    planningRootFolder from resolveDataDir()/resolveProjectKey(); Fixed stale
    comment referencing projectRootFolder (line 192)
  src/__tests__/e2e/utils/mcpTestClient.ts: Updated --projectRootFolder arg to --projectDir
  src/__tests__/e2e/utils/serverProcess.ts: Updated --projectRootFolder arg to --projectDir
  src/__tests__/e2e/configuration/commandLineArgs.e2e.test.ts:
    "Replaced all --projectRootFolder references with --projectDir; Fixed 2
    failing tests: added --projectDir to 'should start server with --mode local'
    and 'should default to local mode when --mode not specified'"
  src/__tests__/e2e/autoPrune.e2e.test.ts: Replaced all --projectRootFolder
    references with --projectDir; Added TRELLIS_DATA_DIR env var to server
    process; added getTrellisRoot() helper using resolveProjectKey; updated
    createObjectWithAge to write to the resolved data path instead of
    projectRoot/.trellis
  src/__tests__/e2e/configuration/preActivation.e2e.test.ts: Updated
    --projectRootFolder comment to --projectDir; Deleted — entire pre-activation
    flow (tools blocked without projectDir) no longer reachable in local mode
  src/__tests__/e2e/configuration/activation.e2e.test.ts: Updated
    --projectRootFolder comment to --projectDir; Rewrote
    connectWithoutProjectRoot() to connectInRemoteMode() (remote mode doesn't
    require --projectDir); removed stale pre-activation error assertion from
    'should allow tool usage after activation'
  mise.toml: Updated inspector task to use --projectDir instead of removed
    --projectRootFolder flag
  src/__tests__/e2e/configuration/directorySetup.e2e.test.ts: Changed beforeEach
    server spawn from --mode local to --mode remote; tests use activate tool to
    configure local mode, keeping .trellis path assertions intact
  src/__tests__/e2e/configuration/invalidConfig.e2e.test.ts: Changed beforeEach
    server spawn from --mode local to --mode remote; same activate-based pattern
log:
  - Replaced --projectRootFolder with --projectDir (and $TRELLIS_PROJECT_DIR env
    fallback) in server.ts CLI. Added fail-fast validation in local mode when
    neither is provided. Derived planningRootFolder via
    resolveDataDir()/resolveProjectKey() helpers. Updated all e2e test files
    referencing --projectRootFolder to use --projectDir. All quality checks and
    686 unit tests pass.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:46:01.768Z
updated: 2026-04-19T03:46:01.768Z
---

## Context

Part of the Browser UI / shared-storage migration for `F-browser-ui-for-task-trellis`. Currently `src/server.ts` accepts `--projectRootFolder <path>` and stores data under `<path>/.trellis/`. This task migrates the CLI surface to accept `--projectDir <path>` (or `$TRELLIS_PROJECT_DIR`) and derive `planningRootFolder` from the shared data directory using the helpers introduced in `T-add-resolvedatadir-module`.

Prerequisite: `T-add-resolvedatadir-module` (the `resolveDataDir` and `resolveProjectKey` helpers must exist).

Relevant files:

- `src/server.ts` — CLI parsing, config construction, tool registration
- `src/configuration/ServerConfig.ts` — `planningRootFolder` field

## What to Build

### 1. CLI flag changes in `src/server.ts`

Remove the `--projectRootFolder <path>` option from the `commander` program definition and from the `CliOptions` interface.

Add `--projectDir <path>` option (description: "Project directory path").

Honor `$TRELLIS_PROJECT_DIR` as a fallback when `--projectDir` is not supplied.

### 2. Fail-fast validation in local mode

After parsing, in local mode only, check that at least one of `--projectDir` or `process.env.TRELLIS_PROJECT_DIR` is provided. If neither is present, print a clear error to stderr and exit:

```
Error: --projectDir or $TRELLIS_PROJECT_DIR is required in local mode
```

### 3. Derive `planningRootFolder`

Replace the current `planningRootFolder` construction (`path.join(projectRootFolder, '.trellis')`) with:

```ts
import { resolveDataDir, resolveProjectKey } from "./configuration";

const projectDir = options.projectDir ?? process.env.TRELLIS_PROJECT_DIR;
const dataRoot = resolveDataDir();
const projectKey = resolveProjectKey(projectDir);
planningRootFolder = path.join(dataRoot, "projects", projectKey);
```

The resulting `ServerConfig.planningRootFolder` value must follow the pattern `<dataRoot>/projects/<12-char-key>`.

### 4. Keep everything else unchanged

- `--mode`, `--no-auto-complete-parent`, `--auto-prune` flags are unchanged.
- Tool list, request handlers, auto-prune logic, STDIO startup — all unchanged.
- Do not touch the `activate` tool in this task (removal is a separate task).
- Do not implement HTTP or leader election here.

## Acceptance Criteria

- `node dist/server.js --projectDir /path/to/project` starts successfully; `planningRootFolder` resolves to `<dataRoot>/projects/<key>`.
- `TRELLIS_PROJECT_DIR=/path/to/project node dist/server.js` works equivalently (no `--projectDir` needed).
- `node dist/server.js` (no project dir in local mode) exits with code 1 and a clear error message.
- `node dist/server.js --projectRootFolder /old/path` is rejected as an unrecognized option by commander (old flag is gone).
- `TRELLIS_DATA_DIR=/tmp/foo node dist/server.js --projectDir /my/repo` yields `planningRootFolder = /tmp/foo/projects/<key>`.
- `mise run quality` and `mise run test` pass (update any existing tests that reference `--projectRootFolder` or the old `planningRootFolder` construction).

## Testing Requirements

Update existing unit/e2e tests that supply `--projectRootFolder` to instead use `--projectDir`. If the test environment sets `planningRootFolder` directly on `ServerConfig`, no change is needed there.

No new unit tests are required for the CLI parsing itself beyond updating existing coverage.

## Out of Scope

- Removing the `activate` MCP tool — separate task.
- HTTP server, leader election, or port binding.
- Writing `meta.json` to disk.
- Migrating data from old `.trellis/` folders.
- Any changes to `LocalRepository` internals or `ServerConfig` fields beyond `planningRootFolder`.
