---
id: T-remove-mode-flag-from-e2e
title: Remove --mode flag from e2e test server spawn calls
status: done
priority: medium
parent: F-remove-remote-backend
prerequisites: []
affectedFiles:
  src/__tests__/e2e/utils/mcpTestClient.ts:
    Removed --mode local from default args
    array (already done in prior partial run)
  src/__tests__/e2e/utils/serverProcess.ts:
    Removed --mode local from server args
    array (already done in prior partial run)
  src/__tests__/e2e/configuration/commandLineArgs.e2e.test.ts:
    Removed the 'should start server with --mode local' test case entirely;
    removed --mode local from all remaining startServerWithArgs calls
  src/__tests__/e2e/autoPrune.e2e.test.ts: Removed --mode local from all ~23 startServerWithArgs invocations
log:
  - Removed all \"--mode\", \"local\" argument pairs from e2e test server spawn
    calls. Deleted the \"should start server with --mode local\" test case from
    commandLineArgs.e2e.test.ts. Verified zero --mode occurrences remain in any
    e2e test file. All 702 unit tests pass and quality checks pass.
schema: v1.0
childrenIds: []
created: 2026-04-19T06:59:23.294Z
updated: 2026-04-19T06:59:23.294Z
---

## What

Remove every `"--mode", "local"` argument pair from server spawn calls in the e2e test suite. The flag is a no-op now (default is already `local`), and this cleanup is required before the source-removal task drops `--mode` from the CLI entirely.

## Files to Change

- **`src/__tests__/e2e/configuration/commandLineArgs.e2e.test.ts`** — remove `"--mode", "local"` from every `startServerWithArgs([...])` call. Also remove the `"should start server with --mode local"` test case (line ~60) and any other tests that exist solely to verify `--mode` is accepted.
- **`src/__tests__/e2e/autoPrune.e2e.test.ts`** — remove `"--mode", "local"` from every server spawn invocation (~23 occurrences).
- **`src/__tests__/e2e/utils/mcpTestClient.ts`** — remove `"--mode", "local"` from the default args array (line ~26).
- **`src/__tests__/e2e/utils/serverProcess.ts`** — remove `"--mode", "local"` from the server args array (line ~19).

## Implementation Note

This task is intended to land **before or together with** the source-code strip task. Removing `--mode` from source while tests still pass it will break CI.

## Acceptance Criteria

- No `"--mode"` strings remain in any e2e test file.
- `mise run test:e2e` passes.
