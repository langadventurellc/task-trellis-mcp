---
id: T-convert-5-workflow-prompts-to
title: Convert 5 workflow prompts to skills
status: done
priority: high
parent: F-add-claude-code-plugin-to
prerequisites:
  - T-create-plugin-infrastructure
affectedFiles:
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
  - Converted 5 MCP workflow prompts to Claude Code skills. Each skill includes
    proper YAML frontmatter with name, description (containing trigger phrases
    in third person), and allowed-tools. All skills contain the $ARGUMENTS
    placeholder for user input and have been updated to reference the
    verify-issue skill via Task tool with forked context instead of the original
    sub-agent pattern. Quality checks pass (lint, format, type-check) and all
    758 unit tests pass.
schema: v1.0
childrenIds: []
created: 2026-01-17T22:40:40.530Z
updated: 2026-01-17T22:40:40.530Z
---

# Convert 5 Workflow Prompts to Skills

## Overview

Convert the 5 existing MCP prompt resources into Claude Code skills. Each skill must be auto-triggered based on context AND invocable via `/skill-name` slash commands. This enables the same workflows currently available through MCP prompts to work natively in Claude Code.

## Context

- **Parent Feature**: F-add-claude-code-plugin-to (Add Claude Code Plugin to Repository)
- **Prerequisite**: T-create-plugin-infrastructure (plugin directory must exist)
- **Source Files**: `resources/basic-claude/prompts/*.md`
- **Target Location**: `plugin/skills/*/SKILL.md`

## Skills to Create

### 1. create-project-trellis

**Source**: `resources/basic-claude/prompts/create-project.md`
**Location**: `plugin/skills/create-project-trellis/SKILL.md`

**Frontmatter**:

```yaml
---
name: create-project-trellis
description: This skill should be used when the user asks to "create a project", "new trellis project", "start a project", "set up project management", or mentions creating a new project in Trellis. Creates a new project in the Trellis task management system by analyzing specifications and gathering requirements.
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
  - Glob
  - Grep
  - Read
  - AskUserQuestion
---
```

**Body**: Adapt content from source, ensuring:

- Remove MCP-specific `description:` line from original frontmatter
- Keep all process steps and guidelines
- Ensure `$ARGUMENTS` placeholder is used for user input
- Update references to call `issue-verifier` skill instead of sub-agent

### 2. create-epics-trellis

**Source**: `resources/basic-claude/prompts/create-epics.md`
**Location**: `plugin/skills/create-epics-trellis/SKILL.md`

**Frontmatter**:

```yaml
---
name: create-epics-trellis
description: This skill should be used when the user asks to "create epics", "break down project into epics", "decompose project", or mentions creating epics from a project. Breaks down a project into major epics by analyzing the project specification.
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
  - Glob
  - Grep
  - Read
  - AskUserQuestion
---
```

### 3. create-features-trellis

**Source**: `resources/basic-claude/prompts/create-features.md`
**Location**: `plugin/skills/create-features-trellis/SKILL.md`

**Frontmatter**:

```yaml
---
name: create-features-trellis
description: This skill should be used when the user asks to "create features", "break down epic into features", "decompose epic", or mentions creating features from an epic. Breaks down an epic into specific features by analyzing the epic specification.
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
  - Glob
  - Grep
  - Read
  - AskUserQuestion
---
```

### 4. create-tasks-trellis

**Source**: `resources/basic-claude/prompts/create-tasks.md`
**Location**: `plugin/skills/create-tasks-trellis/SKILL.md`

**Frontmatter**:

```yaml
---
name: create-tasks-trellis
description: This skill should be used when the user asks to "create tasks", "break down feature into tasks", "decompose feature", or mentions creating tasks from a feature. Breaks down a feature into specific, actionable tasks (1-2 hours each).
allowed-tools:
  - mcp__task-trellis__create_issue
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__update_issue
  - mcp__task-trellis__list_issues
  - Task
  - Glob
  - Grep
  - Read
  - AskUserQuestion
---
```

### 5. implement-task-trellis

**Source**: `resources/basic-claude/prompts/implement-task.md`
**Location**: `plugin/skills/implement-task-trellis/SKILL.md`

**Frontmatter**:

```yaml
---
name: implement-task-trellis
description: This skill should be used when the user asks to "implement task", "claim task", "work on task", "start working", or mentions implementing or claiming a Trellis task. Claims and implements a task following Research and Plan → Implement workflow.
allowed-tools:
  - mcp__task-trellis__claim_task
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__complete_task
  - mcp__task-trellis__append_issue_log
  - mcp__task-trellis__append_modified_files
  - mcp__task-trellis__list_issues
  - Task
  - Glob
  - Grep
  - Read
  - Edit
  - Write
  - Bash
  - AskUserQuestion
---
```

## Implementation Steps

For each skill:

1. **Create skill directory**:

   ```bash
   mkdir -p plugin/skills/{skill-name}
   ```

2. **Read source prompt**:
   - Open `resources/basic-claude/prompts/{prompt-name}.md`
   - Note the existing structure and content

3. **Create SKILL.md**:
   - Add new YAML frontmatter with `name`, `description`, `allowed-tools`
   - Copy the body content from source
   - Update any references to sub-agents to use skill invocation pattern
   - Ensure `$ARGUMENTS` is present for user input capture

4. **Validate frontmatter**:
   - Ensure YAML is valid (starts with `---`, ends with `---`)
   - Verify `name` matches directory name
   - Confirm `description` includes trigger phrases in third person

## Skill Content Transformation Rules

### Frontmatter Changes

- **Remove**: Old `description:` line (single line)
- **Add**: New multi-field frontmatter with `name`, `description`, `allowed-tools`

### Body Changes

- **Keep**: All process steps, guidelines, rules, examples
- **Update**: References to "sub-agent" → use `Task` tool with skill invocation
- **Keep**: `$ARGUMENTS` placeholder (skills support this)
- **Remove**: Any MCP-specific resource references

### Sub-agent Reference Update Pattern

**Before** (in prompts):

```
Call the `issue-verifier` sub-agent to validate...
```

**After** (in skills):

```
Use the `issue-verifier` skill (via Task tool with forked context) to validate...
```

## Acceptance Criteria

- [ ] 5 skill directories created under `plugin/skills/`
- [ ] Each skill has a valid `SKILL.md` with proper YAML frontmatter
- [ ] All skills have `name` field matching directory name
- [ ] All skills have `description` with specific trigger phrases (third person)
- [ ] All skills have appropriate `allowed-tools` list
- [ ] All skills contain `$ARGUMENTS` for user input
- [ ] Skills load correctly when plugin is enabled (`claude --plugin-dir plugin/`)
- [ ] Skills appear in "What skills are available?" response
- [ ] At least one skill triggers automatically when matching phrase is used
- [ ] At least one skill works via `/skill-name` invocation

## Testing

```bash
# Load plugin
claude --plugin-dir /path/to/task-trellis-mcp/plugin

# Verify skills loaded
# Ask: "What skills are available?"
# Should list all 5 workflow skills

# Test auto-trigger
# Ask: "Help me create a new project for a todo app"
# Should trigger create-project-trellis skill

# Test slash command
# Type: /create-tasks-trellis F-some-feature
# Should invoke skill directly
```

## Files to Create

1. `plugin/skills/create-project-trellis/SKILL.md`
2. `plugin/skills/create-epics-trellis/SKILL.md`
3. `plugin/skills/create-features-trellis/SKILL.md`
4. `plugin/skills/create-tasks-trellis/SKILL.md`
5. `plugin/skills/implement-task-trellis/SKILL.md`

## Out of Scope

- Forked-context skills (separate task: T-convert-subagents-to-forked)
- Removing MCP prompt resources (separate follow-up)
- Plugin manifest or MCP config changes (done in T-create-plugin-infrastructure)
