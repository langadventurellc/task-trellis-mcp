---
id: F-convert-task-trellis-mcp-to
title: Convert Task Trellis MCP to Claude Code Plugin
status: open
priority: medium
parent: none
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2026-01-17T21:28:19.544Z
updated: 2026-01-17T21:28:19.544Z
---

# Feature: Convert Task Trellis MCP to Claude Code Plugin

## Purpose and Functionality

Convert the Task Trellis MCP server repository into a Claude Code plugin that bundles:

- **Skills** (converted from MCP prompt resources) - Auto-triggered contextually AND manually invocable as slash commands
- **Forked-context skills** (converted from subagents) - `implementation-planner` and `issue-verifier` running in isolated contexts
- **Hooks** - Pre-complete-task quality validation and post-edit linting
- **MCP server integration** - Bundled MCP server for task management tools

This feature also includes **cleanup** of the now-obsolete MCP prompt/resource system code.

## Key Components to Implement

### 1. Plugin Directory Structure

```
task-trellis-mcp/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── skills/
│   ├── create-project-trellis/
│   │   └── SKILL.md
│   ├── create-epics-trellis/
│   │   └── SKILL.md
│   ├── create-features-trellis/
│   │   └── SKILL.md
│   ├── create-tasks-trellis/
│   │   └── SKILL.md
│   ├── implement-task-trellis/
│   │   └── SKILL.md
│   ├── detailed-implementation-planner/
│   │   └── SKILL.md             # context: fork
│   └── issue-verifier/
│       └── SKILL.md             # context: fork
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       ├── pre-complete-task.sh
│       └── post-edit.sh
├── .mcp.json                    # MCP server configuration
└── [existing MCP server code]
```

### 2. Skill Conversions

Convert 5 MCP prompt resources to skills with proper frontmatter:

| Current File                                        | Target Skill                              | Description                    |
| --------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| `resources/basic-claude/prompts/create-project.md`  | `skills/create-project-trellis/SKILL.md`  | Create projects in Trellis     |
| `resources/basic-claude/prompts/create-epics.md`    | `skills/create-epics-trellis/SKILL.md`    | Break down projects into epics |
| `resources/basic-claude/prompts/create-features.md` | `skills/create-features-trellis/SKILL.md` | Break down epics into features |
| `resources/basic-claude/prompts/create-tasks.md`    | `skills/create-tasks-trellis/SKILL.md`    | Break down features into tasks |
| `resources/basic-claude/prompts/implement-task.md`  | `skills/implement-task-trellis/SKILL.md`  | Claim and implement tasks      |

Each skill must have:

- `name` field matching directory name
- `description` with specific trigger phrases for auto-activation
- `allowed-tools` pre-allowing Task Trellis MCP tools
- Content adapted from existing prompt markdown

### 3. Forked-Context Skills (Former Subagents)

Convert 2 subagents to skills with `context: fork`:

| Current File                                              | Target Skill                                      | Configuration   |
| --------------------------------------------------------- | ------------------------------------------------- | --------------- |
| `resources/basic-claude/agents/implementation-planner.md` | `skills/detailed-implementation-planner/SKILL.md` | `context: fork` |
| `resources/basic-claude/agents/issue-verifier.md`         | `skills/issue-verifier/SKILL.md`                  | `context: fork` |

Frontmatter example:

```yaml
---
name: detailed-implementation-planner
description: Creates detailed file-by-file implementation plans. Use when planning task implementation, creating implementation blueprints, or when the user asks to "plan the implementation" or "create an implementation plan".
context: fork
allowed-tools:
  - Glob
  - Grep
  - LS
  - Read
  - WebFetch
  - TodoWrite
  - WebSearch
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---
```

### 4. Plugin Manifest

Create `.claude-plugin/plugin.json`:

```json
{
  "name": "task-trellis",
  "version": "1.0.0",
  "description": "Task Trellis - Hierarchical task management for AI coding agents with project/epic/feature/task breakdown",
  "mcpServers": "../.mcp.json",
  "hooks": "../hooks/hooks.json"
}
```

### 5. MCP Configuration

Create/update `.mcp.json` using git root detection:

```json
{
  "mcpServers": {
    "task-trellis": {
      "type": "stdio",
      "command": "bash",
      "args": [
        "-c",
        "node \"$(git rev-parse --show-toplevel)/dist/server.js\" --projectRootFolder \"$(git rev-parse --show-toplevel)\""
      ],
      "env": {}
    }
  }
}
```

**Rationale**: `${CLAUDE_PLUGIN_ROOT}` is shared across projects, and `${CLAUDE_PROJECT_DIR}` doesn't populate in `.mcp.json`. The git root approach provides project-specific paths.

### 6. Hooks Configuration

Create `hooks/hooks.json` using `${CLAUDE_PROJECT_DIR}`:

```json
{
  "description": "Task Trellis quality validation hooks",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__task-trellis__complete_task",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/scripts/pre-complete-task.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PROJECT_DIR}/hooks/scripts/post-edit.sh"
          }
        ]
      }
    ]
  }
}
```

**Note**: Serena-specific matchers removed per requirements.

### 7. Code Cleanup (Removal)

Remove obsolete prompt/resource system:

- Delete `src/prompts/` directory entirely
- Delete `resources/` directory entirely
- Remove prompt-related code from `src/server.ts`:
  - Remove `--prompt-package` CLI argument
  - Remove prompt handler registration
  - Remove prompt-related imports
- Remove `copy-prompts` script from `package.json`
- Update build process to not copy resources

## Detailed Acceptance Criteria

### Plugin Structure

- [ ] `.claude-plugin/plugin.json` exists with correct manifest
- [ ] `skills/` directory contains 7 skill subdirectories
- [ ] Each skill has a valid `SKILL.md` with required frontmatter
- [ ] `hooks/hooks.json` exists with correct wrapper format
- [ ] Hook scripts exist in `hooks/scripts/`
- [ ] `.mcp.json` uses git root detection for paths

### Skill Functionality

- [ ] All 5 workflow skills are invocable as `/skill-name` commands
- [ ] All 5 workflow skills auto-trigger on relevant user requests
- [ ] `detailed-implementation-planner` runs in forked context
- [ ] `issue-verifier` runs in forked context
- [ ] Skills have appropriate `allowed-tools` for MCP tool access
- [ ] Skill descriptions contain specific trigger phrases

### Hooks

- [ ] Pre-complete-task hook runs quality checks before `complete_task`
- [ ] Post-edit hook runs lint/type-check after Edit/Write operations
- [ ] Hooks use `${CLAUDE_PROJECT_DIR}` for portable paths
- [ ] Hook scripts are executable and function correctly

### MCP Integration

- [ ] MCP server starts correctly when plugin is enabled
- [ ] All 10 MCP tools are accessible (`create_issue`, `update_issue`, etc.)
- [ ] MCP uses git root for `--projectRootFolder` argument
- [ ] Tasks are stored in `.trellis/` within the project

### Code Cleanup

- [ ] `src/prompts/` directory removed
- [ ] `resources/` directory removed
- [ ] `--prompt-package` CLI argument removed from server
- [ ] Prompt handler registration removed from server
- [ ] `copy-prompts` npm script removed
- [ ] Build process updated (no resource copying)
- [ ] All tests pass after cleanup
- [ ] Quality checks pass (`npm run quality`)

## Technical Requirements

### Skill Frontmatter Format

```yaml
---
name: skill-name-here
description: Description with trigger phrases like "create a project", "break down into epics", etc.
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
---
```

### For Forked-Context Skills

```yaml
---
name: skill-name
description: Description with trigger phrases
context: fork
allowed-tools: [tool list]
---
```

## Dependencies on Other Features

None - this is a standalone feature.

## Implementation Guidance

1. **Start with plugin structure** - Create directory layout and manifest first
2. **Convert skills one at a time** - Test each skill conversion before moving to next
3. **Configure hooks** - Set up hooks.json and verify scripts work
4. **Update MCP config** - Modify .mcp.json for git root detection
5. **Remove old code** - Delete prompt system after skills are verified working
6. **Run full test suite** - Ensure all tests pass after cleanup
7. **Test plugin end-to-end** - Verify skills, hooks, and MCP tools work together

## Testing Requirements

### Manual Testing

- Install plugin in a test project
- Verify `/create-project-trellis` command works
- Verify skill auto-triggers when asking "help me create a project"
- Verify `detailed-implementation-planner` runs in forked context
- Verify pre-complete-task hook blocks completion when quality fails
- Verify MCP tools are accessible

### Automated Testing

- All existing unit tests must pass
- Quality checks (`npm run quality`) must pass
- Build must succeed (`npm run build`)

## Security Considerations

- Hook scripts should not expose sensitive information
- MCP server should only access `.trellis/` within project root
- Skills should pre-allow only necessary tools

## Performance Requirements

- Plugin should load quickly (skill metadata only loaded at startup)
- MCP server should start within reasonable time
- Hooks should complete within timeout limits
