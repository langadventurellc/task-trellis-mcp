---
id: T-remove-activate-mcp-tool-and
title: Remove activate MCP tool and its e2e test
status: done
priority: medium
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-refactor-cli-surface-replace
affectedFiles:
  src/tools/activateTool.ts: Deleted entirely
  src/tools/index.ts: Removed activateTool and handleActivate exports
  src/server.ts: Removed activateTool import, conditional tool-push block,
    planningRootFolder guard block, and activate case from switch statement
  src/__tests__/e2e/configuration/activation.e2e.test.ts: Deleted entirely
  src/__tests__/e2e/configuration/directorySetup.e2e.test.ts: Deleted entirely (all tests relied on activate tool)
  src/__tests__/e2e/configuration/invalidConfig.e2e.test.ts: Deleted entirely (all tests relied on activate tool)
  src/__tests__/e2e/configuration/commandLineArgs.e2e.test.ts: Removed 3 tests that called activate; removed unused path import
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
  src/__tests__/e2e/configuration/preActivation.e2e.test.ts: Deleted entirely
    (deleted by prerequisite task T-refactor-cli-surface-replace; recorded here
    for completeness)
log:
  - Removed the activate MCP tool and all its traces. Deleted activateTool.ts,
    activation.e2e.test.ts, directorySetup.e2e.test.ts, and
    invalidConfig.e2e.test.ts. Cleaned up server.ts (removed activateTool
    import, conditional tool-push, guard block, and activate case),
    tools/index.ts (removed activateTool/handleActivate export), and removed all
    stale callTool("activate") setup calls from 13 remaining e2e test files. All
    686 unit tests pass and quality checks are clean.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:46:30.772Z
updated: 2026-04-19T03:46:30.772Z
---

## Context

Part of the Browser UI / shared-storage migration for `F-browser-ui-for-task-trellis`. Now that `--projectDir` / `$TRELLIS_PROJECT_DIR` is the authoritative project-root source (see `T-refactor-cli-surface-replace`), the `activate` MCP tool is no longer needed. This task removes all traces of it.

Prerequisite: `T-refactor-cli-surface-replace` must be complete so there is no gap where the server has no way to obtain a project root.

## What to Build

### 1. Delete files

- `src/tools/activateTool.ts` — delete entirely.
- `src/__tests__/e2e/configuration/activation.e2e.test.ts` — delete entirely.
- `src/__tests__/e2e/configuration/preActivation.e2e.test.ts` — delete entirely. This test starts the server with no args (which will fail-fast after the CLI refactor), calls `activate` directly, asserts `activate` appears in the tool list, and checks the `"Planning root folder is not configured"` guard — all of which are removed by this change.

### 2. Update `src/server.ts`

Remove:

- The `import { activateTool, ... }` named import of `activateTool` (and `handleActivate` if imported separately).
- The conditional tool-push block:
  ```ts
  if (serverConfig.mode === "local" && !serverConfig.planningRootFolder) {
    tools.push(activateTool);
  }
  ```
- The `case "activate":` branch inside the `CallToolRequestSchema` handler.
- The guard block that returns an error when `!serverConfig.planningRootFolder && toolName !== "activate"` — after the CLI refactor this guard is no longer needed (the fail-fast at startup ensures `planningRootFolder` is always set in local mode).

### 3. Clean up `src/tools/index.ts` (if it exists)

Remove any re-export of `activateTool` or `handleActivate` from the tools barrel file.

### 4. Verify no remaining references

After deletions, run a quick search to confirm `activateTool`, `handleActivate`, and the string `"activate"` as a tool name no longer appear in the `src/` tree (excluding any test utilities that may reference the old activation e2e test path).

## Acceptance Criteria

- `src/tools/activateTool.ts` is deleted.
- `src/__tests__/e2e/configuration/activation.e2e.test.ts` is deleted.
- `src/__tests__/e2e/configuration/preActivation.e2e.test.ts` is deleted.
- `src/server.ts` contains no reference to `activateTool`, `handleActivate`, or the `"activate"` tool case.
- Calling any MCP tool (e.g., `list_issues`) works without needing to call `activate` first.
- `mise run quality` and `mise run test` pass (both deleted e2e tests no longer run).

## Testing Requirements

No new tests required. The deletion of `activation.e2e.test.ts` and `preActivation.e2e.test.ts` are the test changes; verify the remaining e2e suite still passes.

## Out of Scope

- Any changes to `resolveDataDir`, `ServerConfig`, or `--projectDir` logic (handled in `T-refactor-cli-surface-replace`).
- HTTP server, leader election, or UI work.
- Remote mode tooling changes.
