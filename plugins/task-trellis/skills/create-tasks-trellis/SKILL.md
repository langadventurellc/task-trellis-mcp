---
name: create-tasks-trellis
description: This skill should be used when the user asks to "create tasks", "create a task", "new task", "break down feature into tasks", "decompose feature", or mentions creating tasks. Supports both standalone task creation and breaking down a feature into specific, actionable tasks (1-2 hours each) by analyzing specifications and gathering requirements.
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

**When in doubt, ask.** Use the AskUserQuestion tool to clarify requirements. Agents tend to be overconfident about what they can infer - a human developer would ask more questions, not fewer. If you're making assumptions, stop and ask instead.

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
  - **Acceptance Criteria**: Specific, measurable requirements as applicable (functional deliverables, performance benchmarks, security requirements, testing expectations)
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

For each task, use `create_issue` with type `"task"`, the generated title and description, and set `parent` to the feature ID if applicable. Include `prerequisites` for task dependencies. Set `priority` based on criticality (high for blockers/security-critical, medium for standard work, low for enhancements). Set status to `"open"` or `"draft"` based on user preference.

**For standalone tasks**: Omit the `parent` parameter.

### 6. Output Format

After successful creation:

```
Successfully created [N] tasks for feature "[Feature Title]"

Created Tasks:
Database & Models:
  T-[id1]: Create user database model with validation and unit tests
  T-[id2]: Add email verification token system with tests and docs

API Development:
  T-[id3]: Create POST /api/register endpoint with tests and validation
  T-[id4]: Implement email verification endpoint with tests
  T-[id5]: Add rate limiting with monitoring and tests

Frontend:
  T-[id6]: Create registration form component with tests and error handling
  T-[id7]: Add client-side validation with unit tests
  T-[id8]: Implement success/error states with component tests

Integration:
  T-[id9]: Write end-to-end integration tests for full registration flow

Task Summary:
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
