---
id: T-write-metajson-to-project
title: Write meta.json to project data dir on first write for UI display labels
status: done
priority: medium
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-refactor-cli-surface-replace
  - T-remove-activate-mcp-tool-and
affectedFiles:
  src/configuration/resolveProjectLabel.ts: "New file: exports
    resolveProjectLabel() returning git remote origin URL or absolute path"
  src/configuration/resolveProjectKey.ts: Refactored to delegate to resolveProjectLabel for DRY label resolution
  src/configuration/index.ts: Added export for resolveProjectLabel
  src/configuration/ServerConfig.ts: Added optional projectLabel field
  src/server.ts: Import resolveProjectLabel and populate projectLabel in serverConfig
  src/repositories/local/writeProjectMeta.ts: "New file: idempotent meta.json writer"
  src/repositories/local/LocalRepository.ts: saveObject now calls writeProjectMeta before delegating to saveObjectImpl
  src/repositories/local/__tests__/writeProjectMeta.test.ts: "New unit tests: first write, idempotency, fallback label"
log:
  - Added resolveProjectLabel helper, projectLabel to ServerConfig, populated it
    in server.ts, created writeProjectMeta.ts (idempotent, creates meta.json on
    first write), wired into LocalRepository.saveObject, and added unit tests
    with mocked fs/promises. All quality checks and 689 tests pass.
schema: v1.0
childrenIds: []
created: 2026-04-19T03:47:17.773Z
updated: 2026-04-19T03:47:17.773Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. The HTTP UI lists all projects under `~/.trellis/projects/*/` but the directory names are opaque 12-char SHA-1 keys. `meta.json` is a lightweight file written alongside project data that lets the UI show a human-readable label (git remote URL or absolute path) instead.

Prerequisite: `T-refactor-cli-surface-replace` — `planningRootFolder` must resolve to `~/.trellis/projects/<key>/` and `projectDir` must be available before this task can implement the write.

Relevant files:

- `src/repositories/local/LocalRepository.ts` — `saveObject` is the write entry point
- `src/repositories/local/saveObject.ts` — low-level write; calls `mkdir` then `writeFile`
- `src/configuration/ServerConfig.ts` — will need a `projectLabel` field added

## What to Build

### 1. Add `projectLabel` to `ServerConfig`

In `src/configuration/ServerConfig.ts`, add an optional field:

```ts
projectLabel?: string;  // gitOriginUrl or absoluteProjectPath, for meta.json
```

### 2. Populate `projectLabel` in `src/server.ts`

After computing `planningRootFolder`, capture the label string (the same value passed to `resolveProjectKey` before hashing — i.e., the git remote origin URL if available, otherwise `path.resolve(projectDir)`). Set it on `serverConfig.projectLabel`. This value is already known at startup as a side-effect of calling `resolveProjectKey`.

> To avoid duplicating the git-detection logic, consider exporting a `resolveProjectLabel(projectDir: string): string` helper alongside `resolveProjectKey` in `src/configuration/resolveDataDir.ts` that returns the raw label string (git URL or absolute path) without hashing it.

### 3. Write `meta.json` on first write

In `src/repositories/local/LocalRepository.ts`, override `saveObject` to call a `writeProjectMeta` helper before delegating to the existing save logic:

```ts
async saveObject(trellisObject: TrellisObject): Promise<void> {
  await writeProjectMeta(this.config.planningRootFolder!, this.config.projectLabel);
  const { saveObject: saveObjectImpl } = await import('./saveObject');
  await saveObjectImpl(trellisObject, this.config.planningRootFolder!);
}
```

Create `src/repositories/local/writeProjectMeta.ts`:

```ts
// Writes meta.json to planningRoot if it does not already exist.
// Idempotent: existing file is never overwritten.
export async function writeProjectMeta(
  planningRoot: string,
  label?: string,
): Promise<void> {
  const metaPath = path.join(planningRoot, "meta.json");
  try {
    await access(metaPath);
    return; // already exists
  } catch {
    // does not exist — write it
  }
  await mkdir(planningRoot, { recursive: true });
  const content = JSON.stringify({ label: label ?? planningRoot }, null, 2);
  await writeFile(metaPath, content, "utf8");
}
```

The `label` field value must be the git remote origin URL when available, otherwise the absolute project directory path.

## Acceptance Criteria

- After any MCP write operation (create, update, complete, etc.) on a project for the first time, `~/.trellis/projects/<key>/meta.json` is created containing `{ "label": "<gitOriginUrl or absolutePath>" }`.
- Subsequent write operations do not overwrite or modify `meta.json`.
- When `projectLabel` is not set on `ServerConfig` (e.g., remote mode), `meta.json` is not written (or falls back gracefully).
- Read-only operations (`get_issue`, `list_issues`) do not write `meta.json`.
- `mise run quality` and `mise run test` pass.

## Testing Requirements

Unit tests in `src/repositories/local/__tests__/writeProjectMeta.test.ts`:

- First call creates `meta.json` with the correct label.
- Second call with a different label does not overwrite the file.
- Call with no label uses `planningRoot` as fallback label.

Mock `fs/promises` (`access`, `mkdir`, `writeFile`) — do not touch the real filesystem in tests.

## Out of Scope

- Reading `meta.json` in the HTTP handler — that is handled in the HTTP server task.
- Any changes to the issue data format or markdown serialization.
- Writing `meta.json` on reads.
- HTTP server or leader-election logic.
