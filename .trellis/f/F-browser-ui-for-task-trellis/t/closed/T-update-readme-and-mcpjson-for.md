---
id: T-update-readme-and-mcpjson-for
title: Update README and .mcp.json for new CLI surface and browser UI
status: done
priority: medium
parent: F-browser-ui-for-task-trellis
prerequisites:
  - T-refactor-cli-surface-replace
  - T-add-http-leader-election
affectedFiles:
  README.md: Added Configuration section with CLI flags/env vars table, shared
    data dir layout, browser UI description, and breaking-change callouts;
    removed activate tool from Available Tools; updated Troubleshooting to
    reference --projectDir
  .mcp.json: Replaced --projectRootFolder /Users/zach/code/task-trellis-mcp with
    --projectDir ${CLAUDE_PROJECT_DIR}
log:
  - "Updated README.md with a Configuration section covering --projectDir, env
    vars (TRELLIS_PROJECT_DIR, TRELLIS_DATA_DIR, TRELLIS_UI_PORT), shared data
    directory layout, browser UI leader-election behavior, and breaking-change
    callouts for removed --projectRootFolder and activate tool. Updated
    .mcp.json to use --projectDir with ${CLAUDE_PROJECT_DIR}. Removed activate
    tool from Available Tools list. Note for companion plugin: replace
    --projectRootFolder with --projectDir and use ${CLAUDE_PROJECT_DIR} in its
    .mcp.json."
schema: v1.0
childrenIds: []
created: 2026-04-19T03:50:35.785Z
updated: 2026-04-19T03:50:35.785Z
---

## Context

Part of the Browser UI for `F-browser-ui-for-task-trellis`. This task documents the breaking changes introduced by the storage migration and HTTP UI, and updates the companion plugin's MCP config to use the new flag.

Prerequisites:

- `T-refactor-cli-surface-replace` — CLI surface must be stable before documenting it.
- `T-add-http-leader-election` — UI port and leader-election semantics must be stable.

Relevant files:

- `README.md` — primary user-facing documentation
- `.mcp.json` — this repo's local MCP server config (currently uses `--projectRootFolder`)
- `plugins/task-trellis-teams/` or equivalent companion plugin dir (if present in this repo)

## What to Build

### 1. Update `README.md`

Add or update a **Configuration** section (before the Available Tools section) covering:

#### CLI flags and env vars

| Flag / Env var         | Description                                                 | Required            |
| ---------------------- | ----------------------------------------------------------- | ------------------- |
| `--projectDir <path>`  | Absolute path to the project directory for this MCP session | Yes (local mode)    |
| `$TRELLIS_PROJECT_DIR` | Same as `--projectDir`; used when the flag is not passed    | Yes if flag omitted |
| `$TRELLIS_DATA_DIR`    | Override the shared data root (default: `~/.trellis`)       | No                  |
| `$TRELLIS_UI_PORT`     | Override the browser UI port (default: `3717`)              | No                  |

#### Shared data directory layout

```
~/.trellis/
  projects/
    <12-char-key>/        ← sha1(gitOriginUrl or absolutePath).slice(0,12)
      p/ e/ f/ t/         ← issues (unchanged internal layout)
      meta.json           ← { "label": "<gitOriginUrl or absolutePath>" }
```

Note: data is stored in `~/.trellis/` (shared across all sessions), not in the repo directory.

#### Browser UI

Briefly describe the browser UI:

- When the first Claude Code session starts, it binds `http://127.0.0.1:3717` and logs `Task Trellis UI: http://127.0.0.1:3717`.
- Subsequent sessions detect the port is taken and run STDIO-only.
- The UI is read-only; it shows all projects under `~/.trellis/projects/`.
- When the leader session exits, the port is released.

#### Breaking changes (callout box or `> **Breaking change**` blockquote)

- `--projectRootFolder` is removed. Replace with `--projectDir`.
- The `activate` MCP tool is removed. Configure the project dir via CLI flag or env var instead.
- Data previously stored in `<repo>/.trellis/` is not migrated automatically.

### 2. Update `.mcp.json`

Replace `--projectRootFolder` with `--projectDir`. If the current value is an absolute hardcoded path, replace it with a placeholder or use `${CLAUDE_PROJECT_DIR}` if the MCP config syntax supports env var substitution. Example:

```json
{
  "mcpServers": {
    "task-trellis": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/server.js", "--projectDir", "${CLAUDE_PROJECT_DIR}"],
      "env": {}
    }
  }
}
```

### 3. Note on companion plugin `.mcp.json`

The `task-trellis-teams` companion plugin lives in a separate repo. Include a note in the PR description (or a comment in the task log) specifying the exact change needed in that repo:

> In the companion `task-trellis-teams` plugin's `.mcp.json`, replace `--projectRootFolder` with `--projectDir` and use `${CLAUDE_PROJECT_DIR}` as the argument value so Claude Code injects the current project directory automatically.

## Acceptance Criteria

- `README.md` documents `--projectDir`, `$TRELLIS_PROJECT_DIR`, `$TRELLIS_DATA_DIR`, and `$TRELLIS_UI_PORT`.
- `README.md` includes the shared data dir layout (`~/.trellis/projects/<key>/`).
- `README.md` documents the browser UI URL and leader-election behavior.
- `README.md` has a clear breaking-change callout for removed `--projectRootFolder` and `activate` tool.
- `.mcp.json` uses `--projectDir` instead of `--projectRootFolder`.
- `mise run quality` passes (markdown formatting checks, if any).

## Testing Requirements

No code tests required. Verify docs render correctly in a markdown preview and that `.mcp.json` is valid JSON.

## Out of Scope

- Updating the companion plugin's repo directly — flag it as a follow-up if not co-located.
- Adding screenshots or GIFs of the UI.
- Comprehensive API reference documentation.
