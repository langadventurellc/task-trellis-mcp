---
id: F-add-claude-code-plugin-to
title: Add Claude Code Plugin to Repository
status: done
priority: medium
parent: none
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
  plugin/skills/detailed-implementation-planner/SKILL.md: Created forked-context
    skill with implementation plan generator instructions, research phase
    requirements, plan structure template, and quality checklist. Includes
    allowed-tools list for codebase analysis.
  plugin/skills/issue-verifier/SKILL.md: Created forked-context skill with issue
    verification process, completeness/correctness/scope assessment criteria,
    and structured output format for verification reports.
  plugin/skills/create-project-trellis/SKILL.md: Created skill for creating new
    Trellis projects with requirements gathering workflow. Frontmatter includes
    name, description with trigger phrases, and allowed-tools for MCP
    operations.
  plugin/skills/create-epics-trellis/SKILL.md: Created skill for breaking down
    projects into major epics. Frontmatter includes name, description with
    trigger phrases, and allowed-tools for MCP operations.
  plugin/skills/create-features-trellis/SKILL.md:
    Created skill for breaking down
    epics into specific features. Frontmatter includes name, description with
    trigger phrases, and allowed-tools for MCP operations.
  plugin/skills/create-tasks-trellis/SKILL.md: Created skill for breaking down
    features into actionable tasks (1-2 hours each). Frontmatter includes name,
    description with trigger phrases, and allowed-tools for MCP operations.
  plugin/skills/implement-task-trellis/SKILL.md: Created skill for claiming and
    implementing tasks following Research and Plan -> Implement workflow.
    Frontmatter includes name, description with trigger phrases, and extended
    allowed-tools including Edit, Write, and Bash for implementation.
log:
  - "Auto-completed: All child tasks are complete"
schema: v1.0
childrenIds:
  - T-convert-2-subagents-to-forked
  - T-convert-5-workflow-prompts-to
  - T-create-plugin-infrastructure
created: 2026-01-17T22:37:52.574Z
updated: 2026-01-17T22:37:52.574Z
---

# Add Claude Code Plugin to Repository

## Overview

Add a Claude Code plugin to the Task Trellis MCP repository that provides skills, hooks, and MCP integration for task management workflows. The plugin will be located in a `plugin/` subdirectory, keeping it separate from the MCP server code while allowing both to coexist in the same repository.

## Background

The Task Trellis MCP server currently provides prompt resources through MCP's prompts/list and prompts/get endpoints. These prompt resources should be migrated to Claude Code skills, which provide equivalent functionality with additional benefits:

- Auto-triggered based on context (Claude decides when to use them)
- User-invocable via `/skill-name` slash commands
- Support for `context: fork` to run in isolated subagent contexts
- Better integration with Claude Code's permission and tool systems

## Goals

1. Create a Claude Code plugin in `plugin/` subdirectory
2. Convert 5 prompt resources to skills (auto-triggered AND slash-command invocable)
3. Convert 2 subagent definitions to forked-context skills
4. Configure MCP server integration using npx
5. Configure pre-complete-task hook for quality validation
6. Keep existing `.claude/` configuration intact for development use
7. Prepare for eventual removal of MCP prompt/resource system (separate task)

## Plugin Structure

```
plugin/
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
│   │   └── SKILL.md
│   └── issue-verifier/
│       └── SKILL.md
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── pre-complete-task.sh
└── .mcp.json
```

## Detailed Requirements

### 1. Plugin Manifest (`plugin/.claude-plugin/plugin.json`)

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

### 2. Skills (Converted from Prompts)

Each skill must have:

- **YAML frontmatter** with `name` and `description`
- **Strong trigger phrases** in description for auto-discovery
- **`allowed-tools`** to pre-approve MCP tools
- **`$ARGUMENTS`** placeholder for user input

#### 2.1 create-project-trellis

- **Purpose**: Create new projects in Trellis by analyzing specifications
- **Triggers**: "create a project", "new trellis project", "start a project"
- **Source**: `resources/basic-claude/prompts/create-project.md`

#### 2.2 create-epics-trellis

- **Purpose**: Break down projects into major epics
- **Triggers**: "create epics", "break down project", "decompose into epics"
- **Source**: `resources/basic-claude/prompts/create-epics.md`

#### 2.3 create-features-trellis

- **Purpose**: Break down epics into specific features
- **Triggers**: "create features", "break down epic", "decompose into features"
- **Source**: `resources/basic-claude/prompts/create-features.md`

#### 2.4 create-tasks-trellis

- **Purpose**: Break down features into actionable tasks (1-2 hours each)
- **Triggers**: "create tasks", "break down feature", "decompose into tasks"
- **Source**: `resources/basic-claude/prompts/create-tasks.md`

#### 2.5 implement-task-trellis

- **Purpose**: Claim and implement tasks using Research → Plan → Implement workflow
- **Triggers**: "implement task", "claim task", "work on task"
- **Source**: `resources/basic-claude/prompts/implement-task.md`

### 3. Forked-Context Skills (Converted from Subagents)

These skills use `context: fork` to run in isolated subagent contexts.

#### 3.1 detailed-implementation-planner

- **Purpose**: Creates detailed file-by-file implementation plans
- **Frontmatter**: `context: fork`, `agent: general-purpose`
- **Triggers**: "create implementation plan", "plan the implementation", "detailed plan"
- **Source**: `resources/basic-claude/agents/implementation-planner.md`
- **Note**: Remove `ListMcpResourcesTool` and `ReadMcpResourceTool` from tools list

#### 3.2 issue-verifier

- **Purpose**: Verifies Trellis issues against original requirements
- **Frontmatter**: `context: fork`, `agent: general-purpose`
- **Triggers**: "verify issue", "validate trellis issue", "check issue completeness"
- **Source**: `resources/basic-claude/agents/issue-verifier.md`
- **Note**: Remove `ListMcpResourcesTool` and `ReadMcpResourceTool` from tools list

### 4. MCP Configuration (`plugin/.mcp.json`)

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

**Key decisions**:

- Use `bash -c` wrapper to enable command substitution
- Use `$(git rev-parse --show-toplevel)` for project root (env vars don't work in .mcp.json)
- Use `npx -y` to auto-install the published package

### 5. Hooks Configuration (`plugin/hooks/hooks.json`)

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

**Key decisions**:

- Use wrapper format with `description` and `hooks` fields (plugin format)
- Use `${CLAUDE_PROJECT_DIR}` for script path (works in hooks.json)
- Reference script in plugin directory

### 6. Hook Script (`plugin/hooks/scripts/pre-complete-task.sh`)

Copy and adapt from `.claude/hooks/pre-complete-task.sh`:

- Change to project root using git
- Run `npm run quality` and `npm run test`
- Exit with code 2 on failure (feeds error back to Claude)

## Acceptance Criteria

### Functional Requirements

- [ ] Plugin can be installed in any project using `--plugin-dir` or marketplace
- [ ] All 5 workflow skills trigger automatically when user requests related actions
- [ ] All 5 workflow skills can be invoked via `/skill-name` slash commands
- [ ] `$ARGUMENTS` correctly captures user input in skills
- [ ] Implementation planner skill runs in forked context (isolated conversation)
- [ ] Issue verifier skill runs in forked context (isolated conversation)
- [ ] MCP server starts correctly with project root from git
- [ ] Pre-complete-task hook runs quality checks before task completion
- [ ] Hook blocks task completion if quality checks fail

### Technical Requirements

- [ ] Plugin structure follows Claude Code conventions
- [ ] SKILL.md files have valid YAML frontmatter
- [ ] Trigger descriptions are specific and include keyword phrases
- [ ] `allowed-tools` pre-approves necessary MCP tools
- [ ] Forked-context skills specify `context: fork` and `agent`
- [ ] MCP config uses bash wrapper for command substitution
- [ ] Hooks config uses `${CLAUDE_PROJECT_DIR}` for paths

### Non-Functional Requirements

- [ ] Existing `.claude/` configuration remains unchanged
- [ ] Plugin can be tested locally before publishing
- [ ] Documentation explains how to install and use the plugin

## Implementation Guidance

### Skill Frontmatter Pattern

```yaml
---
name: skill-name-trellis
description: This skill should be used when the user asks to "trigger phrase 1", "trigger phrase 2", or mentions related-keyword. Purpose description here.
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
---
```

### Forked-Context Skill Pattern

```yaml
---
name: forked-skill-name
description: This skill should be used when the user asks to "trigger phrase". Purpose description.
context: fork
agent: general-purpose
allowed-tools:
  - Glob
  - Grep
  - Read
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---
```

### Testing the Plugin

```bash
# Test locally
claude --plugin-dir /path/to/task-trellis-mcp/plugin

# Verify skills loaded
# Ask: "What skills are available?"

# Test auto-trigger
# Ask: "Help me create a new project for a todo app"

# Test slash command
# Type: /create-project-trellis Build a REST API for user management
```

## Out of Scope

- Removing MCP prompt/resource system (separate follow-up task)
- Publishing to plugin marketplace
- Changes to existing `.claude/` configuration
- Changes to MCP server code (except eventual resource removal)

## Dependencies

- Task Trellis MCP package must be published to npm (@langadventurellc/task-trellis-mcp)
- Claude Code with plugin support

## References

- Current prompts: `resources/basic-claude/prompts/`
- Current agents: `resources/basic-claude/agents/`
- Current hooks: `.claude/hooks/`
- Plugin structure docs: Claude Code plugin documentation
- Skills docs: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/
