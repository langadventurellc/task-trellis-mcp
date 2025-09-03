---
description: Break down a feature into specific, actionable tasks (1-2 hours each)
---

# Create Tasks Command

Break down a feature into specific, actionable tasks using the Trellis task management system. Do not attempt to create multiple tasks in parallel. Do them sequentially one at a time.

## Goal

Analyze a feature's comprehensive specification to create granular tasks that can be individually claimed and completed by developers, ensuring complete implementation of the feature with proper testing and security considerations.

## Process

### 1. Identify Context and Requirements

#### Input

`$ARGUMENTS`

#### Context Determination

The input may contain:

- **Feature ID**: (e.g., "F-user-registration") - Create tasks within a feature hierarchy
- **Task Requirements**: Direct description of standalone work needed
- **Mixed**: Feature ID plus additional task specifications

#### Instructions

**For Hierarchical Tasks:**

- Retrieve the feature using MCP `get_issue` to access its comprehensive description, requirements, and parent epic/project context

**For Standalone Tasks:**

- Analyze the provided requirements directly
- No parent context needed, focus on the specific work described

### 2. Analyze Requirements

**Thoroughly analyze the requirements (feature description OR standalone requirements) to identify required tasks:**

- **Search codebase** for similar task patterns or implementations
- Extract all components and deliverables from the feature description
- Review implementation guidance and technical approach
- Identify testing requirements for comprehensive coverage
- Consider security considerations that need implementation
- Analyze performance requirements and constraints
- Group related implementation work
- Identify task dependencies and sequencing
- Note any specific instructions provided in `input`

### 3. Gather Additional Information

**Ask clarifying questions as needed to refine the task breakdown:**

Use this structured approach:

- **Ask one question at a time** with specific options
- **Focus on task boundaries** - understand what constitutes a complete, testable task
- **Identify implementation details** - specific technical approaches or patterns
- **Continue until complete** - don't stop until you have clear task structure

Key areas to clarify:

- **Implementation Details**: Specific technical approaches or patterns?
  - Include unit testing in the tasks for the implementation.
- **Task Boundaries**: What constitutes a complete, testable task?
- **Dependencies**: Which tasks must complete before others?
- **Testing Approach**: Unit tests, integration tests, or both?
  - Do not create separate tasks just for unit tests. Unit tests should always be included in the same task as the changes to the production code.
  - Do create separate tasks for integration tests.
  - If specifically requested, do create separate tasks for performance tests. But, do not add tasks for performance tests unless specifically requested by the user.
- **Security Implementation**: How to handle validation and authorization?

**Example questioning approach:**

```
How should the user model validation be implemented?
Options:
- A) Basic field validation only (required fields, data types)
- B) Advanced validation with custom rules and error messages
- C) Validation with integration to existing validation framework
```

Continue until the task structure:

- Covers all aspects of the feature specification
- Represents atomic units of work (1-2 hours each)
- Has clear implementation boundaries
- Includes adequate testing and security tasks

### 4. Generate Task Structure

For each task, create:

- **Title**: Clear, actionable description
- **Description**: Detailed explanation including:
  - **Detailed Context**: Enough information for a developer new to the project to complete the work, including:
    - Links to relevant specifications, documentation, or other Trellis issues (tasks, features, epics, projects)
    - References to existing patterns or similar implementations in the codebase
    - Specific technologies, frameworks, or libraries to use
    - File paths and component locations where work should be done
  - **Specific implementation requirements**: What exactly needs to be built
  - **Technical approach to follow**: Step-by-step guidance on implementation
  - **Detailed Acceptance Criteria**: Specific, measurable requirements that define project success, including:
    - Functional deliverables with clear success metrics
    - Performance benchmarks (response times, throughput, capacity)
    - Security requirements and compliance standards
    - User experience criteria and usability standards
    - Integration testing requirements with external systems
    - Deployment and operational readiness criteria
  - **Dependencies on other tasks**: Prerequisites and sequencing
  - **Security considerations**: Validation, authorization, and protection requirements
  - **Testing requirements**: Specific tests to write and coverage expectations

**Task Granularity Guidelines:**

Each task should be sized appropriately for implementation:

- **1-2 hours per task** - Tasks should be completable in one sitting
- **Atomic units of work** - Each task should produce a meaningful, testable change
- **Independent implementation** - Tasks should be workable without blocking others
- **Specific scope** - Implementation approach should be clear from the task description
- **Testable outcome** - Tasks should have defined acceptance criteria

**Default task hierarchy approach:**

- **Prefer flat structure** - Most tasks should be at the same level
- **Only create sub-tasks when necessary** - When a task is genuinely too large (>2 hours)
- **Keep it simple** - Avoid unnecessary complexity in task organization

Group tasks logically:

- **Setup/Configuration**: Initial setup tasks
- **Core Implementation**: Main functionality (includes unit tests and documentation)
- **Security**: Validation and protection (includes related tests and docs)

### 5. Create Tasks Using MCP

For each task, call the Task Trellis MCP `create_issue` tool:

- `type`: Set to `"task"`
- `parent`: The feature ID (optional - omit for standalone tasks)
- `title`: Generated task title
- `status`: Set to `"open"` (default, ready to claim) or `"draft"`
- `priority`: Based on criticality and dependencies (`"high"`, `"medium"`, or `"low"`)
- `prerequisites`: List of task IDs that must complete first
- `description`: Comprehensive task description

**For standalone tasks**: Simply omit the `parent` parameter entirely.

### 6. Verify Created Project

Call the `issue-verifier` sub-agent to validate the created project:

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
- If verdict is `NEEDS REVISION`: Update the project using MCP based on recommendations
- If verdict is `REJECTED`: Recreate the project addressing critical issues

### 7. Output Format

After successful creation:

```
✅ Successfully created [N] tasks for feature "[Feature Title]"

📋 Created Tasks:
Database & Models:
  ✓ T-[id1]: Create user database model with validation and unit tests
  ✓ T-[id2]: Add email verification token system with tests and docs

API Development:
  ✓ T-[id3]: Create POST /api/register endpoint with tests and validation
  ✓ T-[id4]: Implement email verification endpoint with tests
  ✓ T-[id5]: Add rate limiting with monitoring and tests

Frontend:
  ✓ T-[id6]: Create registration form component with tests and error handling
  ✓ T-[id7]: Add client-side validation with unit tests
  ✓ T-[id8]: Implement success/error states with component tests

Integration:
  ✓ T-[id9]: Write end-to-end integration tests for full registration flow

📊 Task Summary:
- Total Tasks: [N]
- High Priority: [X]
```

## Task Creation Guidelines

Ensure tasks are:

- **Atomic**: Completable in one sitting (1-2 hours)
- **Specific**: Clear implementation path
- **Testable**: Defined acceptance criteria. Include instructions for writing unit tests in the same tasks as writing the production code. Integration tests should be in separate tasks.
- **Independent**: Minimal coupling where possible
- **Secure**: Include necessary validations

Common task patterns:

- **Model/Schema**: Create with validation, indexing, unit tests, and docs
- **API Endpoint**: Implement with input validation, error handling, tests, and docs
- **Frontend Component**: Create with interactivity, state handling, tests, and docs
- **Security**: Input validation, authorization, rate limiting with tests and docs

## Question Guidelines

Ask questions that:

- **Clarify implementation**: Specific libraries or approaches?
- **Define boundaries**: What's included in each task?
- **Identify prerequisites**: What must be built first?
- **Confirm testing strategy**: What types of tests are needed?

## Priority Assignment

Assign priorities based on:

- **High**: Blocking other work, security-critical, core functionality
- **Medium**: Standard implementation tasks
- **Low**: Enhancements, optimizations, nice-to-have features

<rules>
  <critical>Use MCP tools for all operations (create_issue, get_issue, etc.)</critical>
  <critical>Each task must be completable in 1-2 hours</critical>
  <critical>Ask one question at a time with specific options</critical>
  <critical>Continue asking questions until you have complete understanding of task boundaries</critical>
  <important>Include testing and documentation within implementation tasks</important>
  <important>Add security validation with tests where applicable</important>
</rules>
