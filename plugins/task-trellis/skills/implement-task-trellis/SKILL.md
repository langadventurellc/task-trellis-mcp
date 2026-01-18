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

Claim and implement the next available task from the backlog using the Research and Plan → Implement workflow.

## Goal

Claim the highest-priority available task and implement it following project standards, with comprehensive research, planning, and quality checks before marking complete.

## Process

### 1. Claim Next Available Task

#### Input

`$ARGUMENTS` (optional) - Can specify:

- `taskId` - Specific task ID to claim (e.g., "T-create-user-model")
- `scope` - Hierarchical scope for task filtering (P-, E-, F- prefixed)
- `force` - Bypass validation when claiming specific task (only with `taskId`)

Use `claim_task` to claim. Tasks are managed in the `.trellis` folder.

### 2. Research and Planning Phase (MANDATORY)

**Delegate research to planner, but verify critical details:**

- **Read parent issues for context**: Use `get_issue` to read the parent feature for context and requirements. Do not continue until you have claimed a task.
- **Generate Implementation Plan**: Use the Implementation Plan Generator subagent with the task description, parent context, and project constraints.
- **CRITICAL - If No Response From Subagent**: **STOP IMMEDIATELY** and alert the user.
- **CRITICAL - Verify the Plan**: Spot-check before implementing:
  - Verify 2-3 key file paths actually exist
  - Confirm at least one pattern/convention identified
  - Check that referenced imports or dependencies are real

**Trust but Verify:**

- The plan is your guide, not gospel—it may contain inaccuracies
- Question suspicious patterns; investigate before implementing
- Course-correct based on reality, not the plan

**Common hallucination points:** File paths, import statements, method names, config locations.

**When You Find Discrepancies:**

- **Minor issues** (wrong path, naming): Adapt and continue
- **Major issues** (approach wrong, files don't exist): **STOP** and alert the user
- **Pattern mismatches**: Follow actual codebase patterns
- **Missing dependencies**: Check if installation needed or find alternatives

### 3. Clarify Before Implementing

**When in doubt, ask.** Use AskUserQuestion to clarify requirements or approach. Agents tend to be overconfident about what they can infer—a human developer would ask more questions, not fewer. If you're making assumptions, stop and ask instead.

Ask questions when:

- Requirements are ambiguous or incomplete
- Multiple valid approaches exist
- You're unsure about architectural decisions
- The task scope seems unclear

### 4. Implementation Phase

**Execute the plan with progress updates:**

- **Write clean code**: Follow project conventions and best practices
- **Implement incrementally**: Build and test small pieces before moving on
- **Run quality checks frequently**: Format, lint, and test after each major change
- **Write tests alongside code**: Don't leave testing for the end
- **Handle errors gracefully**: Include proper error handling

### 5. Complete Task

**Verify and document completion:**

- **Verify all requirements met**: Check implementation satisfies task description
- **Confirm quality checks pass**: All tests, linting, and formatting clean
- **Write meaningful summary**: Describe what was implemented and key decisions
- **List all changed files**: Document what was created or modified

Use `complete_task` with task ID, summary, and files changed.

**STOP!** - Complete one task only. Do not implement another task.

## Quality Standards

- **Research First**: Never skip research phase unless specifically instructed by the user
- **Test Coverage**: Write tests in same task
- **Quality Checks**: All tests must pass before marking task complete
