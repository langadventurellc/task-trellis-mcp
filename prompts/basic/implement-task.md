---
description: Claim and implement a task following Research and Plan → Implement workflow
argument-hint: [task-id] --worktree [worktree-path] --scope [issue-id] --force [additional context or instructions]
---

# Implement Task Command

Claim and implement the next available task from the backlog using the Trellis task management system with the Research and Plan → Implement workflow.

## MCP Server Setup

Ensure the Task Trellis MCP server is properly configured. The server can be activated with:

- `activate` tool with `mode: "local"` and `projectRoot: "/path/to/project"` (if not configured via command line)
- Or started with command line arguments: `--mode local --projectRootFolder /path/to/project`

This creates a `.trellis` folder inside the project root for task storage.

### Trellis System Overview

The Trellis task management system organizes work in a hierarchical structure:

- **Projects**: Large-scale initiatives or products (e.g., "E-commerce Platform Redesign")
- **Epics**: Major work streams within a project (e.g., "User Authentication", "Payment Processing")
- **Features**: Specific functionality within epics (e.g., "Login Form", "Password Reset")
- **Tasks**: Atomic units of work, 1-2 hours each (e.g., "Create user model", "Add email validation")

This hierarchy enables parallel development, clear dependencies, and manageable work units.

## Goal

Automatically claim the highest-priority available task and implement it following project standards, with comprehensive research, planning, and quality checks before marking complete.

## Process

### 1. Claim Next Available Task

Command: `claim_task`

#### Input

`$ARGUMENTS` (optional) - Can specify:

- Specific task ID to claim (e.g., "T-create-user-model")
- `--worktree (worktree-path)` - Worktree identifier to stamp on claimed task (currently informational only)
- `--scope (issue-id)` - Hierarchical scope for task filtering (P-, E-, F- prefixed)
- `--force` - Bypass validation when claiming specific task (only with `taskId`)
- Additional context or preferences

#### Instructions

Claims are made against the current working directory's task trellis system (tasks are managed in `.trellis` folder).

### 2. Research and Planning Phase (MANDATORY)

**Never skip research - understand before coding:**

The research phase is critical for understanding the context and requirements before writing any code. During this phase:

- **Read parent issues for context**: Use MCP `get_issue` to read the parent feature (if it has one) for additional context, specifications, and requirements that may not be fully detailed in the task description.
- **Research**: Review the task requirements and related materials to identify key considerations, potential challenges, and relevant patterns or practices. Analyze the existing codebase for similar implementations or patterns. If necessary, perform external research via MCP tools or web searches.

```
📚 Research Phase for T-create-user-model

1️⃣ Reading parent issues for context...
   - `get_issue` for task's feature, epic, and project

2️⃣ Using research and implementation planner subagent for comprehensive research and planning...

✅ Research and planning complete. Implementing plan...
```

### 3. Implementation Phase

**Execute the plan with progress updates:**

The implementation phase is where the actual coding happens. During this phase:

- **Write clean code**: Follow project conventions and best practices
- **Run quality checks frequently**: Format, lint, and test after each major change
- **Write tests alongside code**: Don't leave testing for the end
- **Apply security measures**: Implement validation, sanitization, and protection as planned
- **Handle errors gracefully**: Include proper error handling and user feedback

### 4. Complete Task

**Update task and provide summary:**

The completion phase ensures the task is properly documented and marked as done. This phase includes:

- **Verify all requirements met**: Check that the implementation satisfies the task description
- **Confirm quality checks pass**: Ensure all tests, linting, and formatting are clean
- **Write meaningful summary**: Describe what was implemented and any important decisions
- **List all changed files**: Document what was created or modified
- **Update task status**: Use MCP to mark the task as complete
- **Note any follow-up needed**: Identify if additional tasks should be created

Use MCP `complete_task` with:

- Task ID
- Summary of work done
- List of files changed

Example for a database model task:

```
✅ Completing task: T-create-user-model

Summary:
Implemented User model with all required fields including secure password
hashing, email validation, and unique constraints. Added comprehensive
test coverage and database migrations. Password hashing uses bcrypt with 12
rounds for security. Email validation includes regex pattern and uniqueness
constraints. All tests passing with 100% coverage.

Files changed:
- models/User.js (new) - User model with validation methods
- models/index.js (modified) - Added User export
- migrations/001_create_users.sql (new) - Database schema
- tests/models/User.test.js (new) - Comprehensive test suite
- package.json (modified) - Added bcrypt dependency

✅ Task completed and moved to done folder!
```

### 5. Next Steps

**Provide clear next actions:**

```
🎯 Task Complete: T-create-user-model

Next available task:
- T-add-user-validation: Add validation rules for user model
  (Depends on the task you just completed)

Run /implement-task again to claim and implement the next task.

Note: Your completed task has unblocked dependent tasks!
```

**STOP!** - Do not proceed. Complete one task and one task only. Do not implement another task.

### During Research and Planning Phase

```
⚠️ Research issue: Cannot find existing model patterns

Attempting alternative approaches:
- Checking documentation...
- Searching for examples...
- Using web search for best practices...

[If still stuck]
❓ Need clarification:
The project doesn't seem to have existing models.
Should I:
A) Create the first model and establish patterns
B) Check if models are in a different location
C) Use a different approach (raw SQL, different ORM)
```

## Security & Performance Principles

### Security Always:

- **Validate ALL inputs** - Never trust user data
- **Use secure defaults** - Fail closed, not open
- **Parameterized queries** - Never concatenate SQL/queries
- **Secure random** - Use cryptographically secure generators
- **Least privilege** - Request minimum permissions needed
- **Error handling** - Don't expose internal details

## Quality Standards

During implementation, ensure:

- **Research First**: Never skip research phase
- **Test Coverage**: Write tests in same task
- **Security**: Validate all inputs
- **Documentation**: Comment complex logic
- **Quality Checks**: All must pass before completion

## Communication Standards

### Suggesting Improvements:

"The current approach works, but I notice [observation].
Would you like me to [specific improvement]?"

## Common Implementation Patterns

## Workflow Guidelines

- Always follow Research and Plan → Implement
- Run quality checks after each major change
- Write tests alongside implementation
- Commit only when all checks pass
- Document decisions in code comments

<rules>
  <critical>ALWAYS follow Research and Plan → Implement workflow</critical>
  <critical>NEVER skip quality checks before completing task</critical>
  <critical>All tests must pass before marking task complete</critical>
  <important>Search codebase for patterns before implementing</important>
  <important>Write tests in the same task as implementation</important>
  <important>Apply security best practices to all code</important>
</rules>
