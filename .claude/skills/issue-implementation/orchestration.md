# Orchestrate Issue Implementation

Orchestrate the implementation of a parent issue (project, epic, or feature) by executing its child issues sequentially.

## Goal

Complete all planned child issues within a parent by coordinating their execution in the correct order, respecting dependencies, and ensuring each child completes successfully before proceeding.

## Issue Hierarchy

| Parent Type | Child Type | Child's Children |
| ----------- | ---------- | ---------------- |
| Project     | Epics      | Features → Tasks |
| Epic        | Features   | Tasks            |
| Feature     | Tasks      | (none)           |

## Process

### 1. Identify Parent Issue

#### Input

`$ARGUMENTS` - Can specify:

- **Issue ID**: Specific issue to implement (e.g., "P-xxx", "E-xxx", or "F-xxx")
- **Scope**: Limit search to issues within a parent scope

Use `get_issue` to retrieve the issue details. If no ID is specified, use `get_next_available_issue` with the appropriate `issueType` to find the next available issue.

### 2. Verify Planned Work Exists

**CRITICAL**: Before starting, verify all work is planned.

1. Use `list_issues` to get all direct children of this issue
2. For each child, recursively verify its children exist (down to tasks)
3. Review the complete work breakdown for completeness

**Verification depth by parent type:**

- **Feature**: Verify tasks exist
- **Epic**: Verify features exist, and each feature has tasks
- **Project**: Verify epics exist, each epic has features, and each feature has tasks

**If children are missing:**

- **STOP immediately**
- Inform the user that the issue has unplanned work
- List what appears to be missing:
  - Children that have no sub-children
  - Functionality from the description not covered
- Ask the user to complete the planning before proceeding
- **Do NOT create issues yourself** - implementation does not include planning

### 3. Determine Execution Order

Analyze the direct children to determine the correct execution order:

1. **Check prerequisites**: Each child may have `prerequisites` listing IDs that must complete first
2. **Check status**: Skip children that are already `done` or `wont-do`
3. **Build execution queue**: Order children so all prerequisites are satisfied before each runs

**Execution Rules:**

- A child can only start when ALL its prerequisite issues are `done`
- If a child has no prerequisites, it can start immediately (after any currently running child)
- Execute children **sequentially** - wait for each to complete before starting the next

### 4. Execute Children

For each child in the execution queue:

#### 4.1 Verify Child is Ready

- Check all prerequisites are `done`
- Check child status is `open` or `draft` (not already `in-progress` or `done`)
- If not ready, skip and check next child

#### 4.2 Launch Child Implementation

Use the `Task` tool to spawn a subagent that implements the child:

```
Task tool parameters:
- subagent_type: "general-purpose"
- description: "Implement [CHILD_TYPE] [CHILD_ID]"
- prompt: |
    Use the /implement-task skill to implement [CHILD_TYPE] [CHILD_ID].

    Context:
    - Parent: [PARENT_ID] - [PARENT_TITLE]
    - [CHILD_TYPE]: [CHILD_ID] - [CHILD_TITLE]

    Follow the implementation workflow for this issue type.
    If it's a task, implement it directly.
    If it's a feature, epic, or project, orchestrate its children.

    If you encounter any errors or blockers, STOP and report back.
    Do NOT continue to other issues - only implement this single [CHILD_TYPE].
```

**Wait for the subagent to complete** before proceeding to the next child.

#### 4.3 Verify Child Completion

After the subagent returns:

1. Use `get_issue` to check the child's status
2. If status is `done`: Proceed to next child
3. If status is NOT `done`: **STOP** and handle the error

### 5. Handle Errors

If a child fails or the subagent reports an error:

1. **Stop execution** - Do not proceed to other children
2. **Log the failure** - Use `append_issue_log` on the parent to record what happened
3. **Ask the user** - Use AskUserQuestion to report the failure and ask how to proceed:
   - Retry the failed child
   - Skip the failed child and continue
   - Stop orchestration entirely
4. **Follow user direction** - Do what the user decides

### 6. Complete Parent Issue

When all children are done:

1. Verify all children have status `done` (or `wont-do` if skipped by user direction)
2. Update the parent status to `done` using `update_issue`
3. Log completion using `append_issue_log`
4. Report summary to user:
   - Total direct children completed
   - Total descendants completed (all levels)
   - Any issues skipped
   - Overall outcome

## Progress Tracking

Throughout orchestration:

- Use `append_issue_log` on the parent to record progress
- Report status to user after each child completes
- Keep user informed of which child is currently running

## Important Constraints

- **No parallel execution**: Run only one child at a time
- **No creating work**: Do not create new issues; only execute planned work
- **Respect dependencies**: Never start a child before its prerequisites are done
- **Stop on failure**: Always stop and ask user when something goes wrong
- **Ask questions**: Use AskUserQuestion when uncertain about anything
