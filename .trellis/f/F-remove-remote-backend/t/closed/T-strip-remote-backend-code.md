---
id: T-strip-remote-backend-code
title: Strip remote-backend code from TypeScript source
status: done
priority: medium
parent: F-remove-remote-backend
prerequisites:
  - T-remove-mode-flag-from-e2e
affectedFiles:
  src/configuration/ServerConfig.ts: Removed mode, remoteRepositoryUrl,
    remoteProjectId, remoteRepositoryApiToken fields
  src/server.ts: Removed --mode option, CliOptions.mode, const mode,
    serverConfig.mode; collapsed getRepository and _getService to return local
    impls directly; removed remote sentence from description
  src/repositories/local/LocalRepository.ts: Removed mode guard in constructor
  src/repositories/local/deleteObjectById.ts: "Removed mode: local from internal ServerConfig literal"
  src/http/landingPage.ts: "Removed mode: local from LocalRepository constructor call"
  src/http/projectTreePage/childrenPartialHandler.ts: "Removed mode: local from LocalRepository constructor call"
  src/http/projectTreePage/detailPartialHandler.ts: "Removed mode: local from LocalRepository constructor call"
  src/http/projectTreePage/projectTreeHandler.ts: "Removed mode: local from LocalRepository constructor call"
  src/services/local/__tests__/completeTask.test.ts: "Removed mode: local from ServerConfig fixtures"
  src/services/local/__tests__/updateObject.test.ts: "Removed mode: local from ServerConfig fixtures"
  src/tools/__tests__/completeTaskTool.test.ts: "Removed mode: local from ServerConfig fixtures"
  src/tools/__tests__/updateObjectTool.test.ts: "Removed mode: local from ServerConfig fixtures"
log:
  - 'Removed all remote-backend dead code: stripped mode/remoteRepository*
    fields from ServerConfig interface, removed --mode CLI option and
    CliOptions.mode, deleted the mode variable and serverConfig.mode entry in
    server.ts, collapsed getRepository() and _getService() to return local
    implementations directly, removed the remote-repository sentence from the
    server description. Cascaded mode: "local" removals across all usages in
    http handlers, repositories, and test fixtures. All quality checks and 702
    unit tests pass.'
schema: v1.0
childrenIds: []
created: 2026-04-19T06:58:59.281Z
updated: 2026-04-19T06:58:59.281Z
---

## What

Remove all abandoned remote-backend code from `src/configuration/ServerConfig.ts` and `src/server.ts`.

## Changes

### `src/configuration/ServerConfig.ts`

Remove these fields from the `ServerConfig` interface:

- `mode: "local" | "remote"`
- `remoteRepositoryUrl?: string`
- `remoteProjectId?: string`
- `remoteRepositoryApiToken?: string`

### `src/server.ts`

- Remove `.option("--mode <mode>", "Server mode", "local")` from the Commander program definition.
- Remove the `mode?: string` field from `CliOptions`.
- Remove `const mode = options.mode === "remote" ? "remote" : "local"`.
- Remove the `mode` property from the `serverConfig` object literal.
- Collapse `getRepository()` to return `new LocalRepository(serverConfig)` directly (no mode branch, no throw).
- Collapse `_getService()` to return `new LocalTaskTrellisService()` directly (no mode branch, no throw).
- Remove the "supports both local file-based storage and configurable remote repositories" sentence from the server `description` string.

## Implementation Note

This task must land **together with or after** the e2e-test `--mode` cleanup task. Removing `--mode` from source while tests still pass `--mode local` causes Commander to reject the flag and fail CI.

## Acceptance Criteria

- `tsc` passes with no references to `mode` or `remoteRepository*` remaining in either file.
- `mise run quality` passes (lint, format, type-check).
