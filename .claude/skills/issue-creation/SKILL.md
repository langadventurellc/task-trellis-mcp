---
name: issue-creation
description: This skill should be used when the user asks to create Trellis issues including "create a project", "create epics", "create features", "create tasks", "new project", "new epic", "new feature", "new task", "break down project into epics", "break down epic into features", "break down feature into tasks", "decompose project", "decompose epic", "decompose feature", or mentions creating any type of issue in Trellis.
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

# Create Trellis Issues

Create issues in the Trellis task management system. This skill supports creating all issue types: projects, epics, features, and tasks.

## Issue Type Hierarchy

Trellis uses a hierarchical issue structure:

```
Project -> Epic -> Feature -> Task
```

- **Project**: Top-level container representing a complete initiative
- **Epic**: Major work stream within a project
- **Feature**: Implementable functionality within an epic
- **Task**: Atomic unit of work (1-2 hours) within a feature

Each type can be created standalone or within its parent hierarchy.

## Determining Issue Type

Based on the user's request, determine which issue type to create:

| User Request                                                         | Issue Type | Reference                |
| -------------------------------------------------------------------- | ---------- | ------------------------ |
| "create a project", "new project", "set up project management"       | Project    | [project.md](project.md) |
| "create epics", "break down project into epics", "decompose project" | Epic       | [epic.md](epic.md)       |
| "create features", "break down epic into features", "decompose epic" | Feature    | [feature.md](feature.md) |
| "create tasks", "break down feature into tasks", "decompose feature" | Task       | [task.md](task.md)       |

## Instructions

1. **Identify the issue type** the user wants to create based on their request
2. **Read the appropriate type-specific file** for detailed creation instructions:
   - For projects: Read [project.md](project.md)
   - For epics: Read [epic.md](epic.md)
   - For features: Read [feature.md](feature.md)
   - For tasks: Read [task.md](task.md)
3. **Follow the detailed process** in that file to gather requirements and create the issue(s)

## Common Principles

All issue types share these principles:

- **Ask clarifying questions** - Use AskUserQuestion when uncertain. Agents tend to be overconfident about what they can infer.
- **Search the codebase** - Look for existing patterns and conventions before creating issues.
- **Include acceptance criteria** - All issues should have measurable success criteria.
- **Keep it simple** - Follow KISS, YAGNI principles. Don't over-engineer the structure.
- **Create sequentially** - When creating multiple issues, do them one at a time, not in parallel.
