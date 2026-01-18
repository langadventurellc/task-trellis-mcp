---
name: create-features-trellis
description: This skill should be used when the user asks to "create features", "create a feature", "new feature", "break down epic into features", "decompose epic", or mentions creating features. Supports both standalone feature creation and breaking down an epic into specific features by analyzing specifications and gathering requirements.
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

# Create Features Command

Break down an epic into specific features using the Trellis task management system by analyzing the epic specification and gathering additional requirements as needed. Do not attempt to create multiple features in parallel. Do them sequentially one at a time.

## Goal

Analyze an epic's comprehensive specification to create well-structured features that represent implementable functionality, ensuring complete coverage of the epic's scope and enabling effective task decomposition.

**IMPORTANT**: Features must include actual changes, implementations, or deliverables. Do not create features that are purely research tasks or analysis tasks without any tangible output. Since all features and tasks are executed independently without context from other features or tasks, purely analytical work provides no value.

## Process

### 1. Identify Context and Requirements

#### Input

`$ARGUMENTS`

#### Context Determination

The input may contain:

- **Epic ID**: (e.g., "E-user-auth") - Create features within an epic hierarchy
- **Feature Requirements**: Direct description of standalone functionality needed
- **Mixed**: Epic ID plus additional feature specifications

#### Instructions

**For Hierarchical Features:**

- Retrieve the epic using MCP `get_issue` to access its comprehensive description, requirements, and parent project context

**For Standalone Features:**

- Analyze the provided requirements directly
- No parent context needed, focus on the specific functionality described

### 2. Analyze Requirements

**Thoroughly analyze the requirements (epic description OR standalone requirements) to identify natural feature boundaries:**

- **Search codebase** for similar feature patterns or implementations
- Extract all deliverables and components from the epic description
- Review architecture diagrams and technical specifications
- Analyze user stories to identify discrete user-facing functionality
- Consider non-functional requirements that need specific implementation
- Group related functionality into cohesive features
- Identify dependencies between features
- Note any specific instructions provided in `input`

### 3. Gather Additional Information

**Ask clarifying questions as needed to refine the feature structure:**

Use this structured approach:

- **Ask one question at a time** with specific options
- **Focus on feature boundaries** - understand what constitutes a complete, testable feature
- **Identify component relationships** - how features interact with each other
- **Continue until complete** - don't stop until you have clear feature structure

Key areas to clarify:

- **Feature Boundaries**: What constitutes a complete, testable feature?
- **Dependencies**: Which features must be implemented before others?
- **Technical Approach**: How should complex functionality be divided?
- **Testing Strategy**: How can features be tested independently?
- **Integration Points**: Where do features interface with each other?

**When in doubt, ask.** Use the AskUserQuestion tool to clarify requirements. Agents tend to be overconfident about what they can infer - a human developer would ask more questions, not fewer. If you're making assumptions, stop and ask instead.

Continue until the feature structure:

- Covers all aspects of the epic specification
- Represents 6-20 tasks worth of work per feature
- Has clear implementation boundaries
- Enables independent development and testing

### 4. Generate Feature Structure

For each feature, create:

- **Title**: Clear, specific name (3-5 words)
- **Description**: Comprehensive explanation including:
  - Purpose and functionality
  - Key components to implement
  - **Detailed Acceptance Criteria**: Specific, measurable requirements that define feature completion, including:
    - Functional behavior with specific input/output expectations
    - User interface requirements and interaction patterns
    - Data validation and error handling criteria
    - Integration points with other features or systems
    - Performance benchmarks and response time requirements
    - Security validation and access control requirements
    - Browser/platform compatibility requirements
    - Accessibility and usability standards
  - Technical requirements
  - Dependencies on other features
  - **Implementation Guidance** - Technical approach and patterns to follow
  - **Testing Requirements** - How to verify the feature works correctly
  - **Security Considerations** - Input validation, authorization, data protection needs
  - **Performance Requirements** - Response times, resource usage constraints

**Feature Granularity Guidelines:**

Each feature should be sized appropriately for task breakdown:

- **1-2 hours per task** - When broken down, each task should be completable in 1-2 hours
- **Independent implementation** - Features should be implementable without blocking other features
- **Testable boundaries** - Features should have clear success criteria and testing strategies

### 5. Create Features Using MCP

For each feature, call the Task Trellis MCP `create_issue` tool:

- `type`: Set to `"feature"`
- `parent`: The epic ID (optional - omit for standalone features)
- `title`: Generated feature title
- `status`: Set to `"open"` (default, ready to begin work) or `"draft"` unless specified
- `prerequisites`: List of feature IDs that must complete first
- `description`: Comprehensive feature description with all elements from step 4

**For standalone features**: Simply omit the `parent` parameter entirely.

### 6. Verify Created Project

Use the `verify-issue` skill (via Task tool with forked context) to validate the created project:

**Prepare verification inputs:**

- Original specifications from `$ARGUMENTS`
- Created issue ID(s) from the MCP response
- Any additional context gathered during requirement gathering phase

**Call the verifier:**

```
Verify the created project for completeness and correctness:
- Original requirements: [Include the original $ARGUMENTS specifications]
- Created issue ID(s): [issue-id from MCP response]
- Additional context: [Include any clarifications, decisions, or requirements gathered during the interactive Q&A phase]
```

**Review verification results:**

- If verdict is `APPROVED`: Proceed to output format
- If verdict is `NEEDS REVISION`: Evaluate the feedback and, if applicable, update the project using MCP based on recommendations
- If verdict is `REJECTED`: Evaluate the feedback and, if applicable, recreate the project addressing critical issues

If you're not 100% sure of the correctness of the feedback, **STOP** and ask the user for clarification.

### 7. Output Format

After successful creation:

```
Successfully created [N] features for epic "[Epic Title]"

Created Features:
1. F-[id1]: [Feature 1 Title]
   -> Dependencies: none

2. F-[id2]: [Feature 2 Title]
   -> Dependencies: F-[id1]

3. F-[id3]: [Feature 3 Title]
   -> Dependencies: F-[id1], F-[id2]

Feature Summary:
- Total Features: [N]
```

## Question Guidelines

Ask questions that:

- **Define feature scope**: What's included vs excluded?
- **Clarify technical approach**: Specific technologies or patterns?
- **Identify dependencies**: Build order and integration points?
- **Consider testing**: How to verify feature completeness?

<rules>
  <critical>Use MCP tools for all operations (create_issue, get_issue, etc.)</critical>
  <critical>Continue asking questions until you have complete understanding of feature boundaries</critical>
  <important>Feature descriptions must be detailed enough for task creation</important>
  <important>Include implementation guidance and testing requirements</important>
</rules>
