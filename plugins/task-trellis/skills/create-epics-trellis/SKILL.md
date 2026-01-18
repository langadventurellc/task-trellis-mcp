---
name: create-epics-trellis
description: This skill should be used when the user asks to "create epics", "create an epic", "new epic", "break down project into epics", "decompose project", or mentions creating epics. Supports both standalone epic creation and breaking down a project into major epics by analyzing specifications and gathering requirements.
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
  - **Acceptance Criteria**: Specific, measurable requirements as applicable (functional deliverables, integration requirements, quality standards, security/compliance needs)
  - Technical considerations
  - Dependencies on other epics
  - Estimated scale (number of features)
  - **User Stories** - Key user scenarios this epic addresses
  - **Non-functional Requirements** - Performance, security, scalability considerations as applicable

### 5. Create Epics Using MCP

For each epic, use `create_issue` with type `"epic"`, the generated title and description, and set `parent` to the project ID. Include `prerequisites` for any epic dependencies. Set status to `"open"` or `"draft"` based on user preference.

**For standalone epics**: Omit the `parent` parameter.

### 6. Output Format

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
