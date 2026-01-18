---
id: T-convert-2-subagents-to-forked
title: Convert 2 subagents to forked-context skills
status: done
priority: high
parent: F-add-claude-code-plugin-to
prerequisites:
  - T-create-plugin-infrastructure
affectedFiles:
  plugin/skills/detailed-implementation-planner/SKILL.md: Created forked-context
    skill with implementation plan generator instructions, research phase
    requirements, plan structure template, and quality checklist. Includes
    allowed-tools list for codebase analysis.
  plugin/skills/issue-verifier/SKILL.md: Created forked-context skill with issue
    verification process, completeness/correctness/scope assessment criteria,
    and structured output format for verification reports.
log:
  - "Converted 2 subagent definitions (implementation-planner and
    issue-verifier) to Claude Code skills with forked context. Each skill was
    created with proper YAML frontmatter including `context: fork` for isolated
    subagent execution, `agent: general-purpose` for agent type, and
    `allowed-tools` list (with ListMcpResourcesTool and ReadMcpResourceTool
    removed as specified). The skill descriptions include trigger phrases for
    auto-discovery and the body content preserves all instructions, role
    definitions, and output formats from the original agent files."
schema: v1.0
childrenIds: []
created: 2026-01-17T22:41:17.169Z
updated: 2026-01-17T22:41:17.169Z
---

# Convert 2 Subagents to Forked-Context Skills

## Overview

Convert the 2 existing subagent definitions (implementation-planner and issue-verifier) into Claude Code skills that use `context: fork` to run in isolated subagent contexts. This enables the same subagent behavior through the skill system, with the benefit of auto-triggering and slash command invocation.

## Context

- **Parent Feature**: F-add-claude-code-plugin-to (Add Claude Code Plugin to Repository)
- **Prerequisite**: T-create-plugin-infrastructure (plugin directory must exist)
- **Source Files**: `resources/basic-claude/agents/*.md`
- **Target Location**: `plugin/skills/*/SKILL.md`

## Key Concept: Forked Context Skills

Skills with `context: fork` run in an isolated conversation context, similar to subagents:

- Separate conversation history from main session
- Own tool permissions via `allowed-tools`
- Can specify agent type via `agent` field
- Return results to main conversation when complete

This provides subagent-like isolation while benefiting from skill auto-discovery and slash command invocation.

## Skills to Create

### 1. detailed-implementation-planner

**Source**: `resources/basic-claude/agents/implementation-planner.md`
**Location**: `plugin/skills/detailed-implementation-planner/SKILL.md`

**Frontmatter**:

```yaml
---
name: detailed-implementation-planner
description: This skill should be used when the user asks to "create implementation plan", "plan the implementation", "detailed plan", "file-by-file plan", or mentions needing a comprehensive implementation plan before coding. Creates detailed file-by-file implementation plans by researching the codebase and outputting specific changes needed.
context: fork
agent: general-purpose
allowed-tools:
  - Glob
  - Grep
  - LS
  - Read
  - WebFetch
  - WebSearch
  - TodoWrite
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---
```

**Body Transformations**:

- Remove old frontmatter fields (`name:`, `description:`, `tools:`)
- Keep all instructions, role definition, and output format
- Remove references to `ListMcpResourcesTool` and `ReadMcpResourceTool` (no longer needed)
- Keep `ExitPlanMode` reference if planning workflow is used

### 2. issue-verifier

**Source**: `resources/basic-claude/agents/issue-verifier.md`
**Location**: `plugin/skills/issue-verifier/SKILL.md`

**Frontmatter**:

```yaml
---
name: issue-verifier
description: This skill should be used when the user asks to "verify issue", "validate trellis issue", "check issue completeness", "review created issue", or mentions verifying that a Trellis issue matches requirements. Verifies Trellis issues (projects, epics, features, tasks) against original requirements for completeness, correctness, and appropriate scope.
context: fork
agent: general-purpose
allowed-tools:
  - Glob
  - Grep
  - LS
  - Read
  - WebFetch
  - WebSearch
  - TodoWrite
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---
```

**Body Transformations**:

- Remove old frontmatter fields (`name:`, `description:`, `tools:`)
- Keep all verification process, input requirements, and output format
- Remove references to `ListMcpResourcesTool` and `ReadMcpResourceTool`

## Implementation Steps

For each skill:

1. **Create skill directory**:

   ```bash
   mkdir -p plugin/skills/{skill-name}
   ```

2. **Read source agent definition**:
   - Open `resources/basic-claude/agents/{agent-name}.md`
   - Note the existing structure: frontmatter with `name`, `description`, `tools`

3. **Create SKILL.md**:
   - Add new YAML frontmatter with skill-specific fields
   - Add `context: fork` to enable isolated execution
   - Add `agent: general-purpose` to specify agent type
   - Transform `tools:` list to `allowed-tools:` format
   - Remove `ListMcpResourcesTool` and `ReadMcpResourceTool`
   - Copy body content, removing any old frontmatter references

4. **Validate frontmatter**:
   - Ensure YAML is valid
   - Verify `context: fork` is present
   - Confirm `agent` field is specified
   - Check `allowed-tools` list is properly formatted

## Frontmatter Field Mapping

| Old Agent Field | New Skill Field  | Notes                       |
| --------------- | ---------------- | --------------------------- |
| `name:`         | `name:`          | Keep same value             |
| `description:`  | `description:`   | Expand with trigger phrases |
| `tools:`        | `allowed-tools:` | Remove MCP resource tools   |
| (none)          | `context:`       | Add `fork`                  |
| (none)          | `agent:`         | Add `general-purpose`       |

## Tools to Remove

These MCP resource tools are no longer needed since prompts are now skills:

- `ListMcpResourcesTool` - was for listing MCP prompt resources
- `ReadMcpResourceTool` - was for reading MCP prompt resources

## Acceptance Criteria

- [ ] 2 skill directories created under `plugin/skills/`
- [ ] Each skill has valid `SKILL.md` with proper YAML frontmatter
- [ ] Both skills have `context: fork` in frontmatter
- [ ] Both skills have `agent: general-purpose` in frontmatter
- [ ] Both skills have `allowed-tools` list (without MCP resource tools)
- [ ] Skills load correctly when plugin is enabled
- [ ] Skills run in isolated context (verify with debug mode)
- [ ] At least one skill triggers automatically when matching phrase is used
- [ ] At least one skill works via `/skill-name` invocation

## Testing

```bash
# Load plugin with debug
claude --plugin-dir /path/to/task-trellis-mcp/plugin --debug

# Verify skills loaded
# Ask: "What skills are available?"
# Should list both forked-context skills

# Test auto-trigger for implementation planner
# Ask: "I need a detailed implementation plan for this feature"
# Should trigger detailed-implementation-planner in forked context

# Test auto-trigger for issue verifier
# Ask: "Verify that task T-xyz matches its requirements"
# Should trigger issue-verifier in forked context

# Test slash command
# Type: /issue-verifier Check T-some-task against its parent feature
# Should invoke skill directly in forked context
```

## Verifying Forked Context

When a forked-context skill runs:

1. Claude will show it's invoking the skill
2. The skill runs with its own isolated conversation
3. Results return to the main conversation
4. Debug mode (`--debug`) shows context forking

## Files to Create

1. `plugin/skills/detailed-implementation-planner/SKILL.md`
2. `plugin/skills/issue-verifier/SKILL.md`

## Out of Scope

- Workflow skills (done in T-convert-5-workflow-prompts-to)
- Plugin manifest or MCP config changes (done in T-create-plugin-infrastructure)
- Removing MCP agent resources (separate follow-up)
