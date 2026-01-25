# Implement Task

Claim and implement a task from the backlog using the Research and Plan → Implement workflow.

## Goal

Claim a task and implement it following project standards, with comprehensive research, planning, and quality checks before marking complete.

## Process

### 1. Claim Task

#### Input

`$ARGUMENTS` (optional) - Can specify:

- **Task ID**: Specific task ID to claim (e.g., "T-create-user-model")
- **Scope**: Hierarchical scope for task filtering (P-, E-, F- prefixed)
- **Force**: Bypass validation when claiming specific task (only with task ID)

Use `claim_task` to claim the task. Tasks are managed in the `.trellis` folder.

**If no task ID specified**: Claims the next available task based on priority and readiness (prerequisites satisfied).

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
- **Log progress**: Use `append_issue_log` to record significant progress milestones

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

## Error Handling

If you encounter errors during implementation:

1. **Stop immediately** - Do not continue with broken code
2. **Log the error** - Use `append_issue_log` to document what went wrong
3. **Ask for help** - Use AskUserQuestion to inform the user and ask how to proceed
4. **Do not skip** - Never mark a failed task as complete
