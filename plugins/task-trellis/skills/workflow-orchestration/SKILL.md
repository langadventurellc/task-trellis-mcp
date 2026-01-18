---
name: workflow-orchestration
description: Orchestrates the full implementation workflow from requirements through task completion. Use when asked to "orchestrate implementation", "execute full workflow", "implement project/epic/feature", "coordinate work", or when explicit orchestration is requested. Coordinates requirements gathering, incremental issue breakdown, reviews, and task implementation.
allowed-tools:
  - Skill
  - Task
  - Glob
  - Grep
  - Read
  - AskUserQuestion
  - TodoWrite
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
  - mcp__task-trellis__get_next_available_issue
---

# Workflow Orchestration

Orchestrate the complete implementation lifecycle: from requirements through task completion. This skill coordinates other specialized skills to deliver complete bodies of work incrementally.

## Overview

This skill manages the full workflow:

1. **Requirements** → Gather and document requirements (if needed)
2. **Human Approval** → Pause for user approval of requirements
3. **Incremental Breakdown** → Create issues just-in-time, not all upfront
4. **Reviews** → Validate issues and implementations
5. **Implementation** → Execute tasks in dependency order
6. **Repeat** → Continue until the body of work is complete

## Key Principle: Incremental Breakdown

Do NOT create all issues upfront. Break down work just-in-time:

1. Create the parent issue (project/epic/feature)
2. Create immediate children only (not grandchildren)
3. Implement those tasks
4. Then break down the next phase

**Why:** Later phases benefit from learnings during implementation. Creating all issues upfront locks in assumptions before you have implementation experience.

**Example for a new project:**

1. Create project
2. Create ALL epics for the project
3. Create features for the FIRST epic only
4. Create tasks for the FIRST feature only
5. Implement all tasks for the first feature
6. Create tasks for the SECOND feature
7. Implement those tasks
8. Continue until first epic is complete
9. Create features for the SECOND epic
10. Repeat...

## Input

`$ARGUMENTS` - Optional. May contain:

- Scope identifier (e.g., `P-my-project`, `E-my-epic`, `F-my-feature`, `T-my-task`)
- Specific instructions about where to start or what to do
- Requirements or specifications to work from

## Process

### 1. Assess Current State

**Step 1a: Check for user-provided scope**

If `$ARGUMENTS` contains a Trellis ID (starts with `P-`, `E-`, `F-`, or `T-`):

- Use `get_issue` to retrieve that issue
- This is your starting scope

**Step 1b: Query Trellis for existing work**

Use `list_issues` to find issues in the relevant scope:

- If scope is a project: list its epics, their features, their tasks
- If scope is an epic: list its features and their tasks
- If scope is a feature: list its tasks
- Note statuses: `open`, `in-progress`, `done`

**Step 1c: Determine if requirements exist**

Requirements exist if ANY of the following are true:

- User provided specifications or requirements in `$ARGUMENTS`
- A parent issue exists with a detailed description
- User explicitly states requirements are already defined

Requirements do NOT exist if:

- User has only a vague idea ("I want to build X")
- No parent issue exists and no specs were provided

**Step 1d: Determine entry point**

Based on what you found:

| Condition                              | Action                                           |
| -------------------------------------- | ------------------------------------------------ |
| No requirements exist                  | Go to Phase 2 (Requirements)                     |
| Requirements exist but no parent issue | Go to Phase 3 (Issue Creation) - create parent   |
| Parent exists but has no children      | Go to Phase 3 (Issue Creation) - create children |
| Children exist with `open` tasks       | Go to Phase 5 (Implementation)                   |
| Some tasks `done`, some `open`         | Go to Phase 5 (Implementation) - continue        |
| All tasks `done` for current feature   | Go to Phase 6 (Next Phase)                       |

**Override:** If user specifies where to start, follow their guidance.

### 2. Requirements Phase

**When:** No requirements exist (see 1c above).

**Action:** Invoke the requirements-generator skill:

```
Skill tool:
  skill: "requirements-generator"
  args: <any context from $ARGUMENTS>
```

**After skill completes:**

The skill will produce a requirements document. Present it to the user.

**MANDATORY CHECKPOINT - STOP AND WAIT:**

Ask the user using AskUserQuestion:

- Question: "Are these requirements approved to proceed?"
- Options: "Yes, proceed" / "No, needs changes"

Do NOT continue until user selects "Yes, proceed".

If user selects "No", work with them to refine requirements, then ask again.

### 3. Issue Creation Phase

**Determine what to create:**

| Starting Point                | What to Create                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Have requirements, no project | Create project, then all epics, then features for first epic, then tasks for first feature |
| Have project, no epics        | Create all epics, then features for first epic, then tasks for first feature               |
| Have epic, no features        | Create all features, then tasks for first feature                                          |
| Have feature, no tasks        | Create all tasks                                                                           |

**Action:** Invoke the issue-creation skill for each level:

```
Skill tool:
  skill: "issue-creation"
  args: "<issue-type> for <parent-id>: <requirements/context>"
```

Example invocations:

- `"project: <paste requirements summary>"`
- `"epics for P-my-project"`
- `"features for E-first-epic"`
- `"tasks for F-first-feature"`

**Track what you create:** Maintain a list of issue IDs created in this phase. You will need these for review.

### 4. Issue Review Phase

**When:** After creating any issues in Phase 3.

**What to review:** Only the issues you just created, not pre-existing issues.

**Action 1:** Invoke issue-creation-review:

```
Skill tool:
  skill: "issue-creation-review"
  args: "<comma-separated list of issue IDs you created> against <original requirements summary>"
```

**Action 2:** If you created multiple related issues, invoke dependency review:

```
Skill tool:
  skill: "issues-dependency-chain-review"
  args: "<comma-separated list of issue IDs you created>"
```

**Handle results:**

| Review Verdict             | Action                                                  |
| -------------------------- | ------------------------------------------------------- |
| APPROVED                   | Continue to Phase 5                                     |
| NEEDS REVISION + clear fix | Fix issues using the feedback, re-run review            |
| NEEDS REVISION + unclear   | Ask user how to proceed using AskUserQuestion, then fix |
| REJECTED                   | Stop and ask user for direction                         |

**Retry limit:** If a review fails twice after fixes, stop and escalate to user.

### 5. Implementation Phase

**When:** Tasks exist and are ready to implement.

**For each task** (in dependency order based on prerequisites):

**Step 5a:** Invoke implementation:

```
Skill tool:
  skill: "issue-implementation"
  args: "<task-id>" OR "scope:<parent-id>" to claim next available
```

**Step 5b:** After task completes, invoke review:

```
Skill tool:
  skill: "issue-implementation-review"
  args: "<task-id that was just completed>"
```

**Step 5c:** Handle review results:

| Review Verdict             | Action                           |
| -------------------------- | -------------------------------- |
| APPROVED                   | Move to next task                |
| NEEDS REVISION + clear fix | Fix automatically, re-run review |
| NEEDS REVISION + unclear   | Ask user, then fix               |
| REJECTED                   | Stop and ask user                |

**Continue** until all tasks for the current feature are `done`.

### 6. Continue to Next Phase

After completing all tasks for a feature:

**Check 1: More features in current epic?**

```
Use list_issues to find features under current epic
Filter for status != done
```

If yes:

- Get the next feature (by priority or dependency order)
- Go to Phase 3 to create tasks for that feature
- Then Phase 4 to review
- Then Phase 5 to implement

**Check 2: More epics in current project?**

```
Use list_issues to find epics under current project
Filter for status != done
```

If yes:

- Get the next epic
- Go to Phase 3 to create features for that epic, then tasks for first feature
- Continue workflow

**Check 3: All work complete?**

If no more epics/features/tasks remain:

- Go to Phase 7 (Completion)

### 7. Completion

When the body of work is complete:

1. **Summarize:** List what was accomplished
2. **Report:** Show all issues created with final statuses
3. **Note:** Flag any issues skipped or needing attention
4. **Ask:** "Do you want to continue with additional work?"

## Error Handling

**Skill invocation fails:**

1. Log what failed and why
2. Ask user: "Retry / Skip / Abort?"

**Review fails repeatedly (2+ times):**

1. Stop attempting fixes
2. Present all feedback to user
3. Ask: "How should I proceed?"

**Task implementation fails:**

1. Log the error
2. Ask user: "Retry / Skip task / Abort workflow?"

## Guidelines

**Do:**

- Query Trellis before and after each phase to stay aware of state
- Use TodoWrite to track your progress through phases
- Ask clarifying questions when anything is unclear
- Provide status updates as you complete each phase

**Don't:**

- Don't create all issues upfront - break down incrementally
- Don't skip reviews - they catch issues early
- Don't continue past requirements without explicit user approval
- Don't implement tasks in parallel (sequential only for now)
- Don't assume - ask when uncertain
