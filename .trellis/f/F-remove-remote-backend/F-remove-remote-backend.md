---
id: F-remove-remote-backend
title: Remove remote backend
status: done
priority: medium
parent: none
prerequisites: []
affectedFiles:
  docs/installation.md: Removed --mode entry from Configuration Options section;
    removed --mode/local args from Advanced Configuration Example JSON; Removed
    stale 'in local mode' qualifier from --projectDir bullet (reviewer finding)
  docs/issues.md:
    Removed remote-option-in-development clause from paragraph about
    multi-developer limitations
  docs/shared-storage-requirements.md:
    Replaced remote-mode scope note with plain
    scope statement; removed 'Remote mode behavior is unchanged' from Done-when
    checklist
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
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-remove-mode-flag-from-e2e
  - T-remove-remote-mode-references
  - T-strip-remote-backend-code
created: 2026-04-19T06:53:47.717Z
updated: 2026-04-19T06:53:47.717Z
---

## Motivation

The remote backend was stubbed but never implemented. The initiative is entirely abandoned. The sole user has confirmed the breaking CLI change is acceptable and will update external configs after the next publish.

## Scope

### `src/configuration/ServerConfig.ts`

Remove the `mode: "local" | "remote"` field and the three unused remote fields: `remoteRepositoryUrl`, `remoteProjectId`, `remoteRepositoryApiToken`.

### `src/server.ts`

- Remove the `--mode <mode>` Commander option.
- Remove the `mode` constant computation.
- Collapse `getRepository()` and `_getService()` factories to instantiate `LocalRepository` / `LocalTaskTrellisService` directly (removing the "not yet implemented" throws).
- Remove the `CliOptions.mode` field.
- Remove the "configurable remote repositories" language from the server description string.

### `docs/installation.md`

- Remove the `--mode <mode>` row from the CLI arguments table.
- Remove the `--mode <mode>` bullet with its `local`/`remote` sub-bullets from the Configuration Options section.

### `docs/issues.md`

- Remove the line telling users "a remote option is in development now and should be available soon," rewording the surrounding sentence so it still reads naturally.

### `docs/shared-storage-requirements.md`

- Remove the parenthetical callouts about remote mode being untouched (approximately lines 19 and 104). The rest of the document stands.

### `src/__tests__/e2e/` (notably `configuration/commandLineArgs.e2e.test.ts` and `autoPrune.e2e.test.ts`)

- Remove all `"--mode", "local"` argument pairs from server spawn calls — the flag no longer exists.

## Out of Scope

- `src/configuration/resolveProjectLabel.ts` uses `git remote get-url origin`. This is standard git-remote terminology, unrelated to the dropped remote-backend initiative, and must be preserved.
- The `Repository` and `TaskTrellisService` interfaces stay as-is; only the mode-dispatching factory code changes.
- No deprecation shim for `--mode`. The breaking change is intentional and accepted.
- No package version bump or external config updates — that is post-publish work done by the user.

## Acceptance Criteria

- No references to remote mode remain in `src/` or `docs/` except the unrelated `git remote get-url origin` usage in `resolveProjectLabel.ts`.
- `mise run quality` passes (lint, format, type-check).
- `mise run test` passes (unit tests).
- The `--mode` CLI flag is fully removed with no compatibility shim.
