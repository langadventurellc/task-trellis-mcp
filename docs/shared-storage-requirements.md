# Shared Persistent Storage — Requirements

## Summary

Move Task Trellis MCP server storage out of each project repo's `.trellis/` folder into a single shared user-level location at `~/.trellis/`, with per-project scoping derived from the project's identity (git remote URL, falling back to a hash of its absolute path). Stays NPX-distributed, Claude-Code-only, single-user-machine.

This is a **breaking change**. No migration. No backwards-compatibility shims.

---

## Motivation

- Today's repo-local storage forces a bad choice: commit `.trellis/` (noise in git, merge conflicts) or gitignore it (data loss, no portability across clones).
- Centralizing per-user state removes the "should this be in git?" question and makes backups trivial.
- The single-user-machine assumption keeps the design simple — no Docker, no remote service, no auth.

## Scope

- Affects **local mode only**. The existing `remote` mode (`ServerConfig.mode = "remote"`, calls a remote API) is untouched.
- Affects the MCP server itself. The companion `task-trellis-teams` plugin's `.mcp.json` will need a follow-up edit (separate repo) to pass the project path.

---

## Where in the codebase

- `src/server.ts` — CLI parsing, `ServerConfig` construction, tool registration. Drop `--projectRootFolder`. Add `--projectDir`. Drop the `activate` tool registration.
- `src/configuration/ServerConfig.ts` — `planningRootFolder` semantics change (it now lives under `~/.trellis/projects/<key>/`, computed at startup).
- `src/repositories/local/getObjectFilePath.ts` — no change to internal `p/e/f/t` layout.
- `src/repositories/Repository.ts` / `LocalRepository` — no interface change; the existing abstraction already isolates the storage root.
- `src/tools/activateTool.ts` — **delete**.
- `src/__tests__/e2e/configuration/activation.e2e.test.ts` — delete or rewrite.
- New module: `src/configuration/resolveDataDir.ts` (or similar) — encapsulates: env-var override → default `~/.trellis` → `projects/<project-key>/`, where `<project-key>` is `sha1(gitRemoteUrl ?? absoluteProjectPath).slice(0, 12)`.

---

## Behavior

### Storage root resolution

1. If `$TRELLIS_DATA_DIR` is set → use it as the data root.
2. Otherwise → `~/.trellis`.

### Project-path source

- Server reads the project path **at startup** from:
  1. `--projectDir <path>` CLI arg, OR
  2. `$TRELLIS_PROJECT_DIR` env var.
- One of these is **required** at startup; server fails fast with a clear error if neither is provided.
- Do **not** use `process.cwd()` — Claude Code does not reliably set the MCP child's CWD.
- The plugin's `.mcp.json` is expected to pass `${CLAUDE_PROJECT_DIR}` into one of these.

### Per-project key resolution

Run once at startup against the resolved project path:

1. If the path is inside a git repo with an `origin` remote (`git remote get-url origin`) → use that URL.
2. Otherwise → use the absolute project path.
3. Hash whichever value won: `sha1(value).slice(0, 12)`. That's the project key.

Hashing both branches keeps the code path uniform — no slug-sanitization edge cases for SSH vs HTTPS remotes, no special characters to escape. Fixed-length opaque keys.

### On-disk layout

```
~/.trellis/
└── projects/
    └── <12-char-hash>/
        ├── p/...
        ├── e/...
        ├── f/...
        └── t/{open,closed}/...
```

The internal `p/e/f/t` hierarchy from `getObjectFilePath.ts` is unchanged.

### CLI / env surface

| Flag / Env             | Purpose                                   | Required?     |
| ---------------------- | ----------------------------------------- | ------------- |
| `--projectDir <path>`  | Project path the server scopes storage to | Yes (or env)  |
| `$TRELLIS_PROJECT_DIR` | Same as above, env-var form               | Yes (or flag) |
| `$TRELLIS_DATA_DIR`    | Override the `~/.trellis` data root       | No            |

**Removed**:

- `--projectRootFolder` CLI arg.
- `activate` MCP tool.

### Migration

None. Existing in-repo `.trellis/` folders are ignored. If the user wants to keep historical data, they manually copy files into the new location.

---

## Done when

- `--projectRootFolder` and the `activate` tool are gone from the codebase and tests.
- Server fails to start (with a clear error) if neither `--projectDir` nor `$TRELLIS_PROJECT_DIR` is provided in local mode.
- Server creates no files inside the user's project repo. All writes land under `~/.trellis/projects/<key>/`.
- Two different repos → two different `<key>` directories.
- Same repo cloned in two locations (same `origin`) → ONE shared directory.
- A non-git project directory works without error (path-hash fallback).
- `TRELLIS_DATA_DIR=/tmp/foo` redirects all writes to `/tmp/foo/projects/<key>/`.
- Remote mode behavior is unchanged.
- `mise run quality` and `mise run test` pass.
- README updated. Companion `task-trellis-teams` plugin's `.mcp.json` updated to pass `${CLAUDE_PROJECT_DIR}`.
