---
name: issue-implementation
description: This skill should be used when the user asks to "implement task", "implement feature", "implement epic", "implement project", "claim task", "work on task", "work on feature", "start working", "execute feature", "execute epic", "execute project", or mentions implementing, claiming, or executing any Trellis issue.
allowed-tools:
  - mcp__task-trellis__claim_task
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__get_next_available_issue
  - mcp__task-trellis__complete_task
  - mcp__task-trellis__append_issue_log
  - mcp__task-trellis__append_modified_files
  - mcp__task-trellis__update_issue
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

# Implement Trellis Issues

Implement issues in the Trellis task management system. This skill supports all issue types: tasks, features, epics, and projects.

## Issue Type Hierarchy

Trellis uses a hierarchical issue structure:

```
Project -> Epic -> Feature -> Task
```

- **Task**: Atomic unit of work (1-2 hours) - directly implemented
- **Feature**: Implementable functionality - orchestrates task execution
- **Epic**: Major work stream - orchestrates feature execution
- **Project**: Top-level container - orchestrates epic execution

## Determining Issue Type

Based on the user's request, determine which issue type to implement:

| User Request                                                      | Issue Type | Reference                            |
| ----------------------------------------------------------------- | ---------- | ------------------------------------ |
| "implement task", "claim task", "work on task", no type specified | Task       | [task.md](task.md)                   |
| "implement feature", "execute feature", "work on feature F-xxx"   | Feature    | [orchestration.md](orchestration.md) |
| "implement epic", "execute epic", "work on epic E-xxx"            | Epic       | [orchestration.md](orchestration.md) |
| "implement project", "execute project", "work on project P-xxx"   | Project    | [orchestration.md](orchestration.md) |

**Default Behavior**: When no issue type is specified or the user simply says "implement" or "work on next task", default to **Task** implementation.

## Instructions

1. **Identify the issue type** the user wants to implement based on their request
2. **Read the appropriate file** for detailed implementation instructions:
   - For tasks: Read [task.md](task.md) - direct implementation
   - For features, epics, or projects: Read [orchestration.md](orchestration.md) - orchestrates child issues
3. **Follow the detailed process** in that file to implement the issue

## Common Principles

All issue types share these principles:

- **Ask clarifying questions** - Use AskUserQuestion when uncertain. Agents tend to be overconfident about what they can infer.
- **Only implement planned work** - Do not create new tasks, features, epics, or projects during implementation. If work is missing, stop and inform the user.
- **Respect dependencies** - Only start work when all prerequisites are completed.
- **Stop on errors** - When encountering failures, stop and ask the user how to proceed.
- **Track progress** - Update issue logs to track what's been done.
