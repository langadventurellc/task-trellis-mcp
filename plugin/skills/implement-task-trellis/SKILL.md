---
name: implement-task-trellis
description: This skill should be used when the user asks to "implement task", "claim task", "work on task", "start working", or mentions implementing or claiming a Trellis task. Claims and implements a task following Research and Plan -> Implement workflow.
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

# Implement Task

Claim and implement the next available task from the backlog using the Trellis task management system with the Research and Plan -> Implement workflow.

### Trellis System Overview

The Trellis task management system organizes work in a hierarchical structure:

- **Projects**: Large-scale initiatives or products (e.g., "E-commerce Platform Redesign")
- **Epics**: Major work streams within a project (e.g., "User Authentication", "Payment Processing")
- **Features**: Specific functionality within epics (e.g., "Login Form", "Password Reset")
- **Tasks**: Atomic units of work, 1-2 hours each (e.g., "Create user model", "Add email validation")

## Goal

Automatically claim the highest-priority available task and implement it following project standards, with comprehensive research, planning, and quality checks before marking complete.

## Process

### 1. Claim Next Available Task

Command: `claim_task`

#### Input

```
$ARGUMENTS
```

(optional) - Can specify:

- Specific task ID to claim (e.g., "T-create-user-model") (optional)
- `--scope (issue-id)` - Hierarchical scope for task filtering (P-, E-, F- prefixed)
- `--force` - Bypass validation when claiming specific task (only with `taskId`)
- Additional context or preferences

#### Instructions

Claims are made against the current working directory's task trellis system (tasks are managed in `.trellis` folder).

### 2. Research and Planning Phase (MANDATORY)

**Delegate research to planner, but verify critical details:**

The research phase uses the Implementation Plan Generator subagent to analyze the codebase and create a detailed plan, but you must verify key assumptions before implementation.

- **Read parent issues for context**: Use MCP `get_issue` to read the parent feature (if it has one) for context and requirements. Do not continue until you have claimed or loaded an already claimed task.
- **Generate Implementation Plan**: Use the Implementation Plan Generator subagent, providing:
  - The task description and requirements
  - Parent issue context you've gathered
  - Any project-specific constraints or standards
- **CRITICAL - If No Response From Subagent**: **STOP IMMEDIATELY** and alert the user
- **CRITICAL - Verify the Plan**: Before implementing, spot-check the plan for accuracy:
  - Verify 2-3 key file paths actually exist where the plan says they do
  - Confirm at least one pattern/convention the plan identified
  - Check that any imports or dependencies the plan references are real
  - If the plan makes assumptions, verify at least the most critical ones

```
Research Phase for T-create-user-model

1. Reading parent issues for context...
   - `get_issue` for task's feature, epic, and project

2. Generating detailed implementation plan...
   - Subagent analyzing codebase patterns and structure
   - Receiving comprehensive file modification plan

3. Verifying plan accuracy...
   - Confirmed models directory exists at src/models/
   - Verified BaseModel pattern in existing User.js
   - Checked bcrypt is installed in package.json
   - Plan references src/utils/validators but it's actually src/helpers/validators

Plan verified with corrections noted. Proceeding with implementation...
```

**Trust but Verify Principles:**

- **The plan is your guide, not gospel** - It provides excellent structure but may contain inaccuracies
- **Question suspicious patterns** - If something seems off, investigate before implementing
- **Course-correct as needed** - If you discover the plan is wrong, adapt based on reality
- **Common hallucination points to check**:
  - File paths and directory structures
  - Import statements and module names
  - Method/function names in existing code
  - Configuration file locations
  - Database schema or field names

**When You Find Discrepancies:**

1. **Minor issues** (wrong path, different naming): Adapt and continue with the correct information
2. **Major issues** (entire approach wrong, critical files don't exist): **STOP IMMEDIATELY** and alert the user
3. **Pattern mismatches**: Follow the actual codebase pattern, not the plan's suggestion
4. **Missing dependencies**: Check if they need to be installed or if there's an alternative

### 3. Implementation Phase

**Execute the plan with progress updates:**

The implementation phase is where the actual coding happens. During this phase:

- **Write clean code**: Follow project conventions and best practices
- **Implement incrementally**: Build and test small pieces before moving to the next
- **Run quality checks frequently**: Format, lint, and test after each major change
- **Write tests alongside code**: Don't leave testing for the end
- **Document as you go**: Add comments for complex logic or decisions
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
Completing task: T-create-user-model

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

Task completed and moved to done folder!
```

**STOP!** - Do not proceed. Complete one task and one task only. Do not implement another task.

## Security & Performance Principles

### Security Always:

- **Validate ALL inputs** - Never trust user data
- **Use secure defaults** - Fail closed, not open
- **Parameterized queries** - Never concatenate SQL/queries
- **Secure random** - Use cryptographically secure generators
- **Least privilege** - Request minimum permissions needed
- **Error handling** - Don't expose internal details

### Forbidden Patterns:

- **NO "any" types** - Use specific, concrete types
- **NO sleep/wait loops** - Use proper async patterns
- **NO keeping old and new code together** - Delete replaced code immediately
- **NO hardcoded secrets or environment values**
- **NO concatenating user input into queries** - Use parameterized queries

## Quality Standards

During implementation, ensure:

- **Research First**: Never skip research phase, unless specifically instructed to by the user
- **One Export Per File**: Enforced by linting
- **Test Coverage**: Write tests in same task
- **Security**: Validate all inputs

## Workflow Guidelines

- Always follow Research and Plan -> Implement
- Write tests alongside implementation

<rules>
  <critical>ALWAYS follow Research and Plan -> Implement workflow</critical>
  <critical>NEVER skip quality checks before completing task</critical>
  <critical>All tests must pass before marking task complete</critical>
  <critical>One export per file rule must be followed</critical>
  <important>Use context7 for library documentation</important>
  <important>Search codebase for patterns before implementing</important>
  <important>Write tests in the same task as implementation</important>
  <important>Apply security best practices to all code</important>
</rules>
