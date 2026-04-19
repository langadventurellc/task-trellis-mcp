---
id: T-remove-remote-mode-references
title: Remove remote-mode references from user-facing docs
status: done
priority: medium
parent: F-remove-remote-backend
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
log:
  - "Removed all remote-backend-mode references from docs: stripped --mode CLI
    arg entry and JSON args from docs/installation.md, removed remote-option
    clause from docs/issues.md, replaced remote-mode scope note in
    docs/shared-storage-requirements.md, and removed 'Remote mode behavior is
    unchanged' from the Done-when checklist."
schema: v1.0
childrenIds: []
created: 2026-04-19T06:59:47.654Z
updated: 2026-04-19T06:59:47.654Z
---

## What

Remove all references to the abandoned remote-backend mode from three documentation files. Do **not** touch `src/` — the word "remote" in `resolveProjectLabel.ts` refers to git remotes, which is unrelated.

## Files to Change

### `docs/installation.md`

- **Line 5** — Remove the `--mode <mode>` bullet from the "CLI Arguments" list:
  ```
  - **--mode <mode>**: Server mode. `local` or `remote` (default: `local`) (`remote` not yet supported)
  ```
- **Lines 138–140** — Remove the entire `--mode <mode>` entry and its sub-bullets from the "Configuration Options" section:
  ```
  - `--mode <mode>` - Server mode (default: "local")
    - `local` - Use local file-based storage
    - `remote` - Use remote repository (planned feature)
  ```
- **Lines 168–170** — Remove `"--mode"` and `"local"` from the "Advanced Configuration Example" JSON args array.

### `docs/issues.md`

- **Line 25** — Remove or reword the remote-mode mention in the sentence:

  > "…but a remote option is in development now and should be available soon."

  The paragraph should still read naturally after the edit. Example rewrite: remove the remote-option clause entirely, leaving the sentence focused on the shared network drive workaround.

### `docs/shared-storage-requirements.md`

- **Line 19** — Remove the parenthetical about remote mode:

  > "Affects **local mode only**. The existing `remote` mode (`ServerConfig.mode = "remote"`, calls a remote API) is untouched."

  Replace with a plain scope statement that omits the remote-mode caveat, e.g.:

  > "Affects the local file-based storage path only."

- **Line 104** — Remove the line:

  > "Remote mode behavior is unchanged."

  The surrounding "Done when" checklist should read naturally after removal.

## Acceptance Criteria

- `grep -ri "remote" docs/` returns no results except intentional git-remote mentions in `docs/installation.md`, `docs/project-hierarchy.md`, and `docs/shared-storage-requirements.md` (describing the `git remote get-url origin` lookup used for project keys).
- `--mode` appears nowhere in `docs/`.
