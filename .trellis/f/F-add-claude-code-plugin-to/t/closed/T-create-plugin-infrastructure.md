---
id: T-create-plugin-infrastructure
title: Create plugin infrastructure (manifest, MCP config, hooks)
status: done
priority: high
parent: F-add-claude-code-plugin-to
prerequisites: []
affectedFiles:
  plugin/.claude-plugin/plugin.json: Created plugin manifest with name
    'task-trellis', version 1.0.0, description, author, repository, license, and
    keywords
  plugin/.mcp.json: Created MCP server configuration using bash wrapper with npx
    to run @langadventurellc/task-trellis-mcp with dynamic project root from git
  plugin/hooks/hooks.json: Created hooks configuration with PreToolUse hook for
    mcp__task-trellis__complete_task that runs pre-complete-task.sh script
  plugin/hooks/scripts/pre-complete-task.sh: Created executable hook script that
    runs npm quality checks and tests, exits with code 2 on failure
log:
  - Created the foundational Claude Code plugin infrastructure for Task Trellis.
    Implemented the plugin manifest (plugin.json) with name, version,
    description, author info, repository link, license, and keywords. Created
    the MCP configuration (.mcp.json) with a bash-wrapped npx command that
    dynamically resolves the project root using git. Set up the hooks
    configuration (hooks.json) with a PreToolUse hook for complete_task that
    runs quality validation. Created an executable pre-complete-task.sh script
    that runs npm quality checks and tests before allowing task completion (exit
    code 2 on failure to feed errors back to Claude). The skills directory is
    ready for subsequent tasks to add workflow skills.
schema: v1.0
childrenIds: []
created: 2026-01-17T22:39:57.231Z
updated: 2026-01-17T22:39:57.231Z
---

# Create Plugin Infrastructure

## Overview

Set up the foundational plugin structure including the manifest, MCP server configuration, and hooks for quality validation. This task establishes the plugin directory structure that skills will be added to in subsequent tasks.

## Context

- **Parent Feature**: F-add-claude-code-plugin-to (Add Claude Code Plugin to Repository)
- **Plugin Location**: `plugin/` subdirectory at repository root
- **Purpose**: Enable Task Trellis MCP server integration via Claude Code plugin system

## Implementation Requirements

### 1. Create Directory Structure

```bash
mkdir -p plugin/.claude-plugin
mkdir -p plugin/skills
mkdir -p plugin/hooks/scripts
```

### 2. Plugin Manifest (`plugin/.claude-plugin/plugin.json`)

Create the plugin manifest with the following content:

```json
{
  "name": "task-trellis",
  "version": "1.0.0",
  "description": "Task Trellis - Hierarchical task management for AI coding agents",
  "author": {
    "name": "Lang Adventure LLC"
  },
  "repository": "https://github.com/langadventurellc/task-trellis-mcp",
  "license": "GPL-3.0",
  "keywords": ["task-management", "project-management", "ai-agents", "trellis"]
}
```

### 3. MCP Configuration (`plugin/.mcp.json`)

Create the MCP server configuration that uses npx to run the published package:

```json
{
  "mcpServers": {
    "task-trellis": {
      "type": "stdio",
      "command": "bash",
      "args": [
        "-c",
        "npx -y @langadventurellc/task-trellis-mcp --projectRootFolder \"$(git rev-parse --show-toplevel)\""
      ],
      "env": {}
    }
  }
}
```

**Technical Notes**:

- Uses `bash -c` wrapper to enable shell command substitution
- `$(git rev-parse --show-toplevel)` provides the project root dynamically
- `npx -y` auto-accepts installation of the package
- Environment variables like `${CLAUDE_PROJECT_DIR}` do NOT work in .mcp.json

### 4. Hooks Configuration (`plugin/hooks/hooks.json`)

Create the hooks configuration using the plugin wrapper format:

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
            "command": "bash ${CLAUDE_PROJECT_DIR}/plugin/hooks/scripts/pre-complete-task.sh"
          }
        ]
      }
    ]
  }
}
```

**Technical Notes**:

- Plugin hooks.json uses wrapper format with `description` and `hooks` fields
- `${CLAUDE_PROJECT_DIR}` works correctly in hooks.json (unlike .mcp.json)
- Hook runs BEFORE `complete_task` tool executes

### 5. Hook Script (`plugin/hooks/scripts/pre-complete-task.sh`)

Create the quality validation script:

```bash
#!/bin/bash

# Pre-tool use hook for Trellis Complete Task
# Runs lint and test before completing tasks

echo "🔧 Running pre-completion checks for Trellis task..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

echo "📝 Running quality checks..."
if ! npm run quality; then
    echo "❌ Quality checks failed - fix issues before completing task" >&2
    exit 2
fi

echo "✅ Quality checks passed"

echo "🧪 Running tests..."
if ! npm run test; then
    echo "❌ Tests failed - fix issues before completing task" >&2
    exit 2
fi

echo "✅ Tests passed"
echo "🎉 Pre-completion checks successful - proceeding with task completion"
exit 0
```

**Technical Notes**:

- Exit code 2 feeds stderr back to Claude as error feedback
- Script is adapted from existing `.claude/hooks/pre-complete-task.sh`
- Uses git to find project root for portability

### 6. Make Hook Script Executable

```bash
chmod +x plugin/hooks/scripts/pre-complete-task.sh
```

## Acceptance Criteria

- [ ] `plugin/.claude-plugin/plugin.json` exists with valid JSON and required fields (name, version, description)
- [ ] `plugin/.mcp.json` exists with task-trellis server configuration
- [ ] `plugin/hooks/hooks.json` exists with PreToolUse hook for complete_task
- [ ] `plugin/hooks/scripts/pre-complete-task.sh` exists and is executable
- [ ] `plugin/skills/` directory exists (empty, ready for skill tasks)
- [ ] Plugin can be loaded with `claude --plugin-dir plugin/` without errors
- [ ] MCP server starts correctly when plugin is loaded (verify with `/mcp` command)

## Testing

```bash
# Test plugin loads
claude --plugin-dir /path/to/task-trellis-mcp/plugin

# Inside Claude Code session:
# 1. Run /mcp to verify task-trellis server appears
# 2. Ask "What skills are available?" (should show none yet)
# 3. Try to complete a task to verify hook triggers
```

## Out of Scope

- Creating skills (separate tasks T-convert-workflow-prompts-to and T-convert-subagents-to-forked)
- Modifying existing `.claude/` configuration
- Publishing to plugin marketplace
- Changes to MCP server source code

## Files to Create

1. `plugin/.claude-plugin/plugin.json`
2. `plugin/.mcp.json`
3. `plugin/hooks/hooks.json`
4. `plugin/hooks/scripts/pre-complete-task.sh`
5. `plugin/skills/` (directory only)
