---
name: create-epics-trellis
description: This skill should be used when the user asks to "create epics", "break down project into epics", "decompose project", or mentions creating epics from a project. Breaks down a project into major epics by analyzing the project specification.
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

# Create Epics Command

Break down a project into major epics using the Trellis task management system by analyzing the project specification and gathering additional requirements as needed. Do not attempt to create multiple epics in parallel. Do them sequentially one at a time.

## Goal

Analyze a project's comprehensive specification to create well-structured epics that represent major work streams, ensuring complete coverage of all project requirements and enabling effective feature decomposition.

## Process

### 1. Identify Target Project

#### Input

`$ARGUMENTS`

#### Project Context

The project ID may be:

- Provided in `input` (e.g., "P-inventory-mgmt")
- Known from previous conversation context
- Specified along with additional instructions in `input`

#### Instructions

Retrieve the project using MCP `get_issue` to access its comprehensive description and requirements.

### 2. Analyze Project Specification

**Thoroughly analyze the project description to identify natural epic boundaries:**

- **Use context7 MCP tool** to research architectural patterns and best practices
- **Search codebase** for similar epic structures or patterns
- Extract all functional requirements from the project description
- Identify major technical components and systems
- Consider cross-cutting concerns (security, testing, deployment, monitoring)
- Group related functionality into cohesive work streams
- Identify dependencies between work streams
- Consider development phases and prerequisites
- Note any specific instructions provided in `input`

### 3. Gather Additional Information

**Ask clarifying questions as needed to refine the epic structure:**

Use this structured approach:

- **Ask one question at a time** with specific options
- **Focus on epic boundaries** - understand where one epic ends and another begins
- **Identify component relationships** - how epics interact with each other
- **Continue until complete** - don't stop until you have clear epic structure

Key areas to clarify:

- **Epic Boundaries**: Where does one epic end and another begin?
- **Dependencies**: Which epics must complete before others can start?
- **Technical Grouping**: Should technical concerns be separate epics or integrated?
- **Phases**: Should there be phase-based epics (MVP, Enhancement, etc.)?
- **Non-functional**: How to handle security, performance, monitoring as epics?

**When in doubt, ask.** Use the AskUserQuestion tool to clarify requirements. Agents tend to be overconfident about what they can infer - a human developer would ask more questions, not fewer. If you're making assumptions, stop and ask instead.

Continue until the epic structure:

- Covers all aspects of the project specification
- Has clear boundaries and scope
- Enables parallel development where possible
- Supports logical feature breakdown

### 4. Generate Epic Structure

For each epic, create:

- **Title**: Clear, descriptive name (3-5 words)
- **Description**: Comprehensive explanation including:
  - Purpose and goals
  - Major components and deliverables
  - **Detailed Acceptance Criteria**: Specific, measurable requirements that define epic completion, including:
    - Functional deliverables with clear success metrics
    - Integration requirements with other epics or external systems
    - Performance and quality standards specific to this epic
    - Security and compliance requirements
    - User experience and usability criteria
    - Testing and validation requirements
  - Technical considerations
  - Dependencies on other epics
  - Estimated scale (number of features)
  - **User Stories** - Key user scenarios this epic addresses
  - **Non-functional Requirements** - Performance, security, scalability considerations specific to this epic

### 5. Create Epics Using MCP

For each epic, call the Task Trellis MCP `create_issue` tool:

- `type`: Set to `"epic"`
- `parent`: The project ID
- `title`: Generated epic title
- `status`: Set to `"open"` (default, ready to begin work) or `"draft"` unless specified
- `prerequisites`: List of epic IDs that must complete first
- `description`: Comprehensive epic description with all elements from step 4

**For standalone epics**: Simply omit the `parent` parameter entirely.

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
Successfully created [N] epics for project "[Project Title]"

Created Epics:
1. E-[id1]: [Epic 1 Title]
   -> Dependencies: none

2. E-[id2]: [Epic 2 Title]
   -> Dependencies: E-[id1]

3. E-[id3]: [Epic 3 Title]
   -> Dependencies: E-[id1], E-[id2]

Epic Summary:
- Total Epics: [N]
```

## Simplicity Principles

When creating epics, follow these guidelines:

### Keep It Simple:

- **No over-engineering** - Create only the epics needed for the project
- **No extra features** - Don't add functionality that wasn't requested
- **Choose straightforward approaches** - Simple epic structure over complex hierarchies
- **Solve the actual problem** - Don't anticipate future requirements

### Forbidden Patterns:

- **NO premature optimization** - Don't optimize epic structure unless requested
- **NO feature creep** - Stick to the specified project requirements
- **NO complex dependencies** - Keep epic relationships simple and clear

### Modular Architecture:

- **Clear boundaries** - Each epic should have distinct, well-defined responsibilities
- **Minimal coupling** - Epics should interact through clean interfaces, not internal dependencies
- **High cohesion** - Related functionality should be grouped within the same epic
- **Clean interfaces** - Define clear contracts between epics for data and functionality exchange

## Question Guidelines

Ask questions that:

- **Clarify epic boundaries**: What functionality belongs together?
- **Identify dependencies**: What must be built first?
- **Consider team structure**: Can epics be worked on in parallel?
- **Plan for phases**: MVP vs full implementation?
- **Address non-functionals**: Where do performance/security requirements fit?

<rules>
  <critical>Use MCP tools for all operations (create_issue, get_issue, etc.)</critical>
  <critical>Ask one question at a time with specific options</critical>
  <critical>Continue asking questions until you have complete understanding of epic boundaries</critical>
  <important>Epic descriptions must be detailed enough for feature creation</important>
</rules>
