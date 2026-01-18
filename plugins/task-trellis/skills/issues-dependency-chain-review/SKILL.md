---
name: issues-dependency-chain-review
description: Validates dependency chains between newly created Trellis issues for correctness, identifies parallelizable work, and detects issues like circular dependencies. Use when asked to "validate dependencies", "review dependency chain", "check prerequisites", or after creating multiple related issues.
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
  - mcp__task-trellis__update_issue
---

# Issues Dependency Chain Review

Validate the dependency chain between newly created Trellis issues to ensure prerequisites are logical, identify parallel execution opportunities, and detect structural problems.

## Required Inputs

- **Issue IDs**: List of newly created issue IDs to validate (e.g., "E-epic1, E-epic2, E-epic3" or "F-feature1, F-feature2")
- **Context** (optional): Description of what was created and why

### Input

`$ARGUMENTS`

## Asking Questions

**When in doubt, ask.** If the issue IDs are not provided or unclear, use AskUserQuestion to gather the list of issues to validate. Don't make assumptions about which issues to analyze.

## Validation Process

### 1. Gather Issue Data

For each provided issue ID:

- Use `get_issue` to retrieve full issue details
- Extract: ID, title, type, status, parent, prerequisites array
- Build a map of all issues being validated

### 2. Structural Validation

Check for fundamental structural problems:

#### Circular Dependencies

Detect dependency cycles where A→B→C→A:

- Build a directed graph from prerequisites
- Perform depth-first traversal to detect cycles
- Report any cycles found with the full chain (e.g., "E-a → E-b → E-c → E-a")

#### Broken References

Check that all prerequisites reference valid issues:

- Prerequisites should reference existing issues
- Prerequisites should be of the same type or higher in hierarchy (epics can depend on epics, features on features or epics, etc.)
- Flag any prerequisites pointing to non-existent IDs

#### Self-References

Ensure no issue lists itself as a prerequisite.

### 3. Logical Validation

Evaluate whether the dependencies make sense:

#### Dependency Direction

- Work should flow from foundational/infrastructure issues to dependent/consumer issues
- Core functionality should precede features that build on it
- Shared components should precede features that use them

#### Scope Alignment

- Prerequisites should be at the same scope level or higher
- Tasks shouldn't block epics; epics shouldn't block tasks directly
- Parent-child relationships should align with prerequisite relationships

#### Completeness

- Issues with no prerequisites should represent entry points (can start immediately)
- Issues with prerequisites should have all their dependencies represented in the set

### 4. Parallel Execution Analysis

Identify opportunities for concurrent work:

#### Independent Groups

Find issues that have no dependencies between them:

- Group issues that can be worked on simultaneously
- Identify the "critical path" (longest chain of dependencies)
- Calculate maximum parallelism possible

#### Execution Waves

Organize issues into waves based on dependencies:

- **Wave 1**: Issues with no prerequisites (can start immediately)
- **Wave 2**: Issues whose prerequisites are all in Wave 1
- **Wave N**: Issues whose prerequisites are all in Waves 1 through N-1

### 5. Recommendations

Based on analysis, provide actionable recommendations:

- **Fix circular dependencies**: Suggest which prerequisite to remove
- **Add missing dependencies**: Suggest logical dependencies that may be missing
- **Optimize parallelism**: Suggest restructuring to enable more parallel work
- **Simplify chains**: Suggest removing unnecessary transitive dependencies

## Output Format

Provide a comprehensive validation report:

```
## Dependency Chain Review

### Issues Analyzed
| ID | Title | Type | Prerequisites |
|----|-------|------|---------------|
| E-a | Epic A | epic | none |
| E-b | Epic B | epic | E-a |
| E-c | Epic C | epic | E-a, E-b |

### Structural Validation
- ✅ No circular dependencies detected
- ✅ All prerequisite references are valid
- ✅ No self-references found

OR

- ❌ Circular dependency detected: E-a → E-b → E-c → E-a
- ❌ Broken reference: E-b references non-existent "E-missing"
- ❌ Self-reference: E-a lists itself as prerequisite

### Logical Assessment
[Analysis of whether dependencies make sense, e.g.:]
- E-b correctly depends on E-a (database must exist before API layer)
- E-c correctly depends on both (UI needs both backend components)

### Parallel Execution Plan

**Maximum Parallelism**: [N] issues can run concurrently

**Execution Waves**:
- **Wave 1** (Start immediately): E-a
- **Wave 2** (After Wave 1): E-b
- **Wave 3** (After Wave 2): E-c

**Critical Path**: E-a → E-b → E-c (3 sequential steps)

### Recommendations
1. [Specific recommendation if any issues found]
2. [Or "No changes recommended - dependency structure is valid"]

### Verdict
✅ **VALID** - Dependency chain is well-structured
OR
⚠️ **NEEDS ATTENTION** - Minor issues identified (see recommendations)
OR
❌ **INVALID** - Critical issues must be resolved before proceeding
```

## Fixing Issues

If structural problems are found and the user requests fixes:

- Use `update_issue` to modify prerequisites
- Remove circular dependencies by breaking the cycle at the most logical point
- Remove broken references
- Document changes made

## Simplicity Principles

### Keep Analysis Focused

- Only analyze the provided issues, not the entire system
- Don't over-complicate the dependency graph
- Focus on actionable findings

### Pragmatic Recommendations

- Not every issue needs explicit prerequisites
- Some parallel work is implied by scope separation
- Don't add dependencies just for completeness
