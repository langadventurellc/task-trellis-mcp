---
description: Break down a project into major epics by analyzing the project specification
argument-hint: [project-id] [additional context or instructions]
---

# Create Epics Command

Break down a project into major epics using the Trellis task management system by analyzing the project specification and gathering additional requirements as needed. Do not attempt to create multiple epics in parallel. Do them sequentially one at a time.

Use ULTRATHINK.

## MCP Server Setup

Ensure the Task Trellis MCP server is properly configured. The server can be activated with:

- `activate` tool with `mode: "local"` and `projectRoot: "/path/to/project"` (if not configured via command line)
- Or started with command line arguments: `--mode local --projectRootFolder /path/to/project`

This creates a `.trellis` folder inside the project root for task storage.

## Trellis System Overview

The Trellis task management system organizes work in a hierarchical structure:

- **Projects**: Large-scale initiatives or products (e.g., "E-commerce Platform Redesign")
- **Epics**: Major work streams within a project (e.g., "User Authentication", "Payment Processing")
- **Features**: Specific functionality within epics (e.g., "Login Form", "Password Reset")
- **Tasks**: Atomic units of work, 1-2 hours each (e.g., "Create user model", "Add email validation")

This hierarchy enables parallel development, clear dependencies, and manageable work units.

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

**Example questioning approach:**

```
How should the authentication system be organized as an epic?
Options:
- A) Separate epic for all authentication (login, registration, password reset)
- B) Integrate authentication into each functional epic
- C) Split into multiple epics (core auth, advanced features, integrations)
```

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

### 6. Output Format

After successful creation:

```
✅ Successfully created [N] epics for project "[Project Title]"

📋 Created Epics:
1. E-[id1]: [Epic 1 Title]
   → Dependencies: none

2. E-[id2]: [Epic 2 Title]
   → Dependencies: E-[id1]

3. E-[id3]: [Epic 3 Title]
   → Dependencies: E-[id1], E-[id2]

📊 Epic Summary:
- Total Epics: [N]
- Dependencies Configured: ✓

Next step:
Use /create-features to break down each epic into implementable features.
```

## Example Epic Structures

### Web Application Project

```
1. Core Infrastructure
   - Database design, base architecture, development environment
   - Includes: Database schema diagrams, deployment architecture

2. User Management
   - Authentication, authorization, user profiles
   - Includes: Auth flow diagrams, user stories for login/registration

3. Business Logic
   - Core features specific to the application
   - Includes: Business process diagrams, domain model

4. External Integrations
   - Third-party APIs, payment systems, etc.
   - Includes: Integration architecture, API sequence diagrams

5. Testing & Quality
   - Test infrastructure, test suite development
   - Includes: Testing strategy, coverage requirements

6. Deployment & Operations
   - CI/CD, monitoring, production setup
   - Includes: Deployment architecture, monitoring dashboards
```

### API/Library Project

```
1. Core API Design
   - Interface definitions, contracts
   - Includes: API structure diagrams, usage examples

2. Implementation
   - Core functionality development
   - Includes: Component architecture, algorithms

3. Documentation
   - API docs, guides, examples
   - Includes: Documentation structure, example apps

4. Testing Framework
   - Unit, integration, performance tests
   - Includes: Test architecture, coverage goals

5. Distribution & Publishing
   - Package management, versioning
   - Includes: Release process, compatibility matrix
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
- **NO unnecessary technical debt** - Choose maintainable approaches

### Modular Architecture:

- **Clear boundaries** - Each epic should have distinct, well-defined responsibilities
- **Minimal coupling** - Epics should interact through clean interfaces, not internal dependencies
- **High cohesion** - Related functionality should be grouped within the same epic
- **Avoid big ball of mud** - Prevent tangled cross-dependencies between epics
- **Clean interfaces** - Define clear contracts between epics for data and functionality exchange

## Question Guidelines

Ask questions that:

- **Clarify epic boundaries**: What functionality belongs together?
- **Identify dependencies**: What must be built first?
- **Consider team structure**: Can epics be worked on in parallel?
- **Plan for phases**: MVP vs full implementation?
- **Address non-functionals**: Where do performance/security requirements fit?

## Error Handling

- **Project not found**: Provide clear error message
- **Invalid dependencies**: Detect and prevent circular dependencies
- **Missing project description**: Request project details be added first

<rules>
  <critical>Never directly access `.trellis/` directory directly</critical>
  <critical>Use MCP tools for all operations (create_issue, get_issue, etc.)</critical>
  <critical>Ask one question at a time with specific options</critical>
  <critical>Continue asking questions until you have complete understanding of epic boundaries</critical>
  <important>Epic descriptions must be detailed enough for feature creation</important>
</rules>
