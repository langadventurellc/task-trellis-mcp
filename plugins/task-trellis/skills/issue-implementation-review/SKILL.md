---
name: issue-implementation-review
description: Reviews code changes from a completed task implementation for correctness, completeness, and simplicity. Use when asked to "review implementation", "review task code", "code review", "verify implementation", or after completing an issue implementation.
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
  - AskUserQuestion
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---

# Issue Implementation Review

Review the code changes from a completed task implementation to verify correctness, completeness, and adherence to simplicity principles.

## Goal

Provide a thorough code review of task implementation changes, ensuring the code correctly and completely solves the issue without over-engineering.

## Required Inputs

- **Task ID**: The Trellis task ID that was implemented (e.g., "T-add-user-validation")
- **Additional Context** (optional): Any decisions or constraints from implementation

## Asking Questions

**When in doubt, ask.** If the task ID is missing or you need clarification about implementation context, use AskUserQuestion to gather what you need. Don't make assumptions about what was intended.

## Review Process

### 1. Gather Issue Context

Retrieve the full context for the implemented task:

- **Get the task**: Use `get_issue` to retrieve the task details, including:
  - Task description and requirements
  - Modified files list (tracked during implementation)
  - Implementation log entries
- **Get parent context**: Retrieve the parent feature (and epic/project if relevant) to understand broader requirements and acceptance criteria
- **Note the scope**: Understand what was requested vs. what should have been delivered

### 2. Review Changed Files

For each file listed in the task's modified files:

- **Read the file**: Examine the actual code changes
- **Understand the changes**: What was added, modified, or removed?
- **Check related files**: Look at imports, tests, and integration points

### 3. Correctness Review

Verify the implementation is technically correct:

- **Logic correctness**: Does the code do what it's supposed to do?
- **Error handling**: Are edge cases and errors handled appropriately?
- **Integration**: Does it integrate correctly with existing code?
- **Pattern consistency**: Does it follow codebase conventions and patterns?
- **Type safety**: Are types correct and complete (no `any` abuse)?
- **Security**: No obvious vulnerabilities (injection, XSS, etc.)?

### 4. Completeness Review

Verify all requirements are addressed:

- **Functional requirements**: All requirements from the task are implemented
- **Acceptance criteria**: Parent feature/epic criteria that apply are satisfied
- **Test coverage**: Tests exist for the new functionality
- **Quality checks**: Code passes linting, formatting, and type checks

### 5. Simplicity Review

Evaluate for over-engineering:

- **YAGNI violations**: Features or abstractions not required by the task
- **Premature optimization**: Performance optimizations without evidence of need
- **Unnecessary complexity**: Could this be simpler while still meeting requirements?
- **Scope creep**: Changes beyond what was requested (unless explicitly justified)
- **Dead code**: Unused imports, variables, or functions
- **Over-abstraction**: Helpers or utilities for one-time operations

**Guideline**: Three similar lines of code is often better than a premature abstraction.

## Output

Provide a review report with the following sections:

### Review Report Template

```
## Implementation Review: [Task ID] - [Task Title]

### Context Summary
- **Task**: [Brief description of what was implemented]
- **Files Changed**: [Count and list of modified files]
- **Parent Feature**: [Feature ID and title if applicable]

### Correctness Assessment
**Status**: Correct / Issues Found

**Findings**:
- [Specific correctness observations]
- [Any bugs, logic errors, or integration issues]

### Completeness Assessment
**Status**: Complete / Partial / Incomplete

**Requirements Coverage**:
- [x] [Requirement 1 - met/not met]
- [x] [Requirement 2 - met/not met]

**Gaps** (if any):
- [Missing functionality or requirements]

### Simplicity Assessment
**Status**: Appropriate / Over-engineered

**Observations**:
- [Scope alignment with requirements]
- [Any unnecessary complexity identified]

### Code Quality
- **Tests**: Present/Missing - [observation]
- **Patterns**: Consistent/Inconsistent - [observation]
- **Error Handling**: Adequate/Needs Improvement - [observation]

### Recommendations
**Critical** (must fix):
- [Issues that must be addressed]

**Suggested** (nice to have):
- [Improvements that would enhance the code]

### Verdict
**APPROVED** / **NEEDS REVISION** / **REJECTED**

[Summary of decision rationale]
```

## Review Standards

- **Evidence-based**: Support findings with specific code references (file:line)
- **Actionable**: Recommendations should be specific and implementable
- **Proportionate**: Don't nitpick style when substance matters more
- **Fair**: Acknowledge good implementation decisions, not just problems
