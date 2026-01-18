---
name: issue-creation-review
description: This skill should be used when the user asks to "verify issue", "validate trellis issue", "check issue completeness", "review created issue", or mentions verifying that a Trellis issue matches requirements. Verifies Trellis issues (projects, epics, features, tasks) against original requirements for completeness, correctness, and appropriate scope.
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
  - mcp__task-trellis__get_issue
  - mcp__task-trellis__list_issues
---

# Issue Creation Review Sub-Agent

Evaluate created Trellis issues against original requirements to ensure completeness, correctness, and appropriate scope.

## Goal

Verify that a created issue (project, epic, feature, or task) accurately reflects the original user requirements without over-engineering or missing critical elements.

## Input Requirements

The calling agent should provide:

- **Original Requirements**: The user's initial request or specifications
- **Created Issue**: The issue ID or full issue details from Trellis
- **Additional Context**: Any clarifications or decisions made during creation

## Verification Process

### 1. Parse Inputs

Extract and analyze:

- Original user requirements and constraints
- Created issue details (title, description, acceptance criteria)
- Any additional context provided

### 2. Research Codebase Context

**Investigate the existing system to validate appropriateness:**

- **Search for similar implementations** to verify consistency
- **Check architectural patterns** used in the codebase
- **Identify existing utilities/libraries** that should be leveraged
- **Verify integration points** mentioned are valid

### 3. Completeness Check

Verify the created issue includes all required elements:

**For Projects:**

- All functional requirements from user input are addressed
- Technical architecture is specified
- Integration points are defined
- Acceptance criteria are measurable and complete

**For Epics:**

- Covers complete functional area
- Clear scope boundaries
- Logical grouping of related features

**For Features:**

- Specific user-facing capability defined
- Clear acceptance criteria
- Integration with other features specified

**For Tasks:**

- Implementable unit of work
- Clear technical specifications
- Dependencies identified

### 4. Correctness Check

Validate accuracy and appropriateness:

- **Technical Accuracy**: Verify proposed solutions align with codebase patterns
- **Requirement Alignment**: Ensure interpretation matches user intent
- **Feasibility**: Confirm approach is technically viable
- **Consistency**: Check alignment with existing system architecture

### 5. Scope Assessment

Evaluate for over-engineering:

- **Compare scope to requirements**: Identify additions beyond user request
- **Assess complexity**: Flag unnecessary complexity
- **Check for premature optimization**: Identify optimizations not required
- **Validate abstractions**: Ensure abstractions are justified by requirements

**Note**: If user explicitly requested comprehensive or future-proofed solution, expanded scope is acceptable.

### 6. Generate Evaluation Report

## Output Format

Return structured evaluation:

```
# Issue Verification Report

## Issue Details
- Type: [project/epic/feature/task]
- ID: [issue-id]
- Title: [issue-title]

## Completeness Assessment
[Complete] | [Partial] | [Incomplete]

**Required Elements:**
- [Element]: [Status/Comments]
- [Element]: [Status/Comments]

**Missing Requirements:** (if any)
- [Requirement not addressed]

## Correctness Assessment
[Correct] | [Issues Found] | [Major Problems]

**Findings:**
- [Finding with specific details]

**Codebase Alignment:**
- [Pattern/Convention]: [Aligned/Misaligned - details]

## Scope Assessment
[Appropriate] | [Minor Over-engineering] | [Significant Over-engineering]

**Scope Analysis:**
- User requested: [Summary of original scope]
- Issue includes: [Summary of created scope]
- Additional elements: [List any additions]
- Justification: [Valid/Invalid - explanation]

## Recommendations

**Critical Issues:** (if any)
- [Issue requiring immediate correction]

**Suggested Improvements:** (if any)
- [Non-critical improvement suggestion]

## Overall Verdict
[APPROVED / NEEDS REVISION / REJECTED]

**Summary:**
[Brief summary of the evaluation outcome]
```

## Rules

- **Be objective**: Base assessments on requirements and codebase evidence
- **Provide specifics**: Include concrete examples in findings
- **Consider context**: Account for clarifications made during creation
- **Focus on value**: Flag over-engineering only when it adds complexity without benefit
- **Research thoroughly**: Use codebase search before claiming something doesn't exist
