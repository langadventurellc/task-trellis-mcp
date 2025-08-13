---
description: Create a new project in the Trellis task management system by analyzing specifications and gathering requirements
argument-hint: [project specifications or path to spec file]
---

# Create Project Trellis Command

Create a new project in the Trellis task management system by analyzing specifications provided and gathering additional requirements as needed.

Use ULTRATHINK.

## MCP Server Setup

Ensure the Task Trellis MCP server is properly configured. If the server needs activation, use:

- `activate` tool with `mode: "local"` and `projectRoot: "/path/to/project"`
- **Note**: If the `activate` tool is not available, the server was already configured correctly via command line arguments (`--mode local --projectRootFolder /path/to/project`) and no activation is needed.

The system creates a `.trellis` folder inside the project root for task storage.

## Trellis System Overview

The Trellis task management system organizes work in a hierarchical structure:

- **Projects**: Large-scale initiatives or products (e.g., "E-commerce Platform Redesign")
- **Epics**: Major work streams within a project (e.g., "User Authentication", "Payment Processing")
- **Features**: Specific functionality within epics (e.g., "Login Form", "Password Reset")
- **Tasks**: Atomic units of work, 1-2 hours each (e.g., "Create user model", "Add email validation")

This hierarchy enables parallel development, clear dependencies, and manageable work units.

## Goal

Transform project specifications into a comprehensive project definition with full context and requirements that enable other agents to effectively create epics, features, and ultimately implementable tasks.

## Process

### 1. Parse Input Specifications

#### Specification Input

`$ARGUMENTS`

#### Instructions

Read and analyze the specifications:

- Extract key project goals, requirements, and constraints

### 2. Analyze Project Context

**Before gathering requirements, research the existing system:**

- **Use context7 MCP tool** to research current tech stack and best practices
- **Search codebase** for similar projects or patterns
- **Identify existing architecture** and conventions
- **Document discovered technologies** for consistency

### 3. Gather Additional Requirements

**Continue asking questions until you can create a complete project specification:**

Use this structured approach:

- **Ask one question at a time** with specific options
- **Focus on decomposition** - break large concepts into smaller components
- **Clarify boundaries** - understand where one component ends and another begins
- **Continue until complete** - don't stop until you have full understanding

Key areas to explore:

- **Functional Requirements**: What specific capabilities must the system provide?
- **Technical Architecture**: What technologies, frameworks, and patterns should be used?
- **Integration Points**: What external systems or APIs need to be integrated?
- **User Types**: Who will use this system and what are their needs?
- **Performance Requirements**: What are the response time, load, and scaling needs?
- **Security Requirements**: What authentication, authorization, and data protection is needed?
- **Deployment Environment**: Where and how will this be deployed?
- **Timeline & Phases**: Are there specific deadlines or phase requirements?
- **Success Metrics**: How will project success be measured?

**Example questioning approach:**

```
How should user authentication be handled in this project?
Options:
- A) Use existing authentication system (specify integration points)
- B) Implement new authentication mechanism (specify requirements)
- C) No authentication needed for this project
```

Continue asking clarifying questions until you have enough information to create a comprehensive project description that would enable another agent to:

- Understand the full scope and vision
- Create appropriate epics covering all aspects
- Make informed technical decisions
- Understand constraints and requirements

### 4. Generate Project Title and Description

Based on gathered information:

- **Title**: Create a clear, concise project title (5-7 words)
- **Description**: Write comprehensive project specification including:
  - Executive summary
  - Detailed functional requirements
  - Technical requirements and constraints
  - Architecture overview
  - Architecture diagrams (if applicable) written in Mermaid
  - User stories or personas
  - Non-functional requirements (performance, security, etc.)
  - Integration requirements
  - Deployment strategy
  - **Detailed Acceptance Criteria**: Specific, measurable requirements that define feature completion, including:
    - Functional behavior with specific input/output expectations
    - User interface requirements and interaction patterns
    - Data validation and error handling criteria
    - Integration points with other features or systems
    - Performance benchmarks and response time requirements
    - Security validation and access control requirements
    - Browser/platform compatibility requirements
    - Accessibility and usability standards
  - Any other context needed for epic creation

**Architecture Diagram Guidelines:**

Include Mermaid diagrams when they add value for:

- **System Architecture**: Overall system components and relationships
- **Data Flow**: How information moves through the system
- **Integration Points**: External system connections
- **Deployment Architecture**: Infrastructure and deployment strategy

### 5. Create Project Using MCP

Call the Task Trellis MCP `create_object` tool to create the project with the following parameters:

- `type`: Set to `"project"`
- `title`: The generated project title
- `status`: Set to `"open"` (default, ready to begin work) or `"draft"` unless specified
- `description`: The comprehensive project description generated in the previous step

### 6. Output Format

After successful creation:

```
✅ Project created successfully!

📁 Project: [Generated Title]
📍 ID: [generated-id]
📊 Status: [actual-status]

📝 Project Summary:
[First paragraph of description]

The project has been initialized in the task trellis system.

Next steps:
Use /create-epics to break down this project into major work streams.
```

## Simplicity Principles

When creating projects, follow these guidelines:

### Keep It Simple:

- **No over-engineering** - Create only the specifications needed for the project
- **No extra features** - Don't add functionality that wasn't requested
- **Choose straightforward approaches** - Simple project structure over complex architectures
- **Solve the actual problem** - Don't anticipate future requirements

### Forbidden Patterns:

- **NO premature optimization** - Don't optimize project structure unless requested
- **NO feature creep** - Stick to the specified project requirements
- **NO complex architectures** - Choose simple, maintainable approaches
- **NO unnecessary abstractions** - Use direct solutions that work

### Modular Architecture:

- **Clear boundaries** - Project should define distinct modules with well-defined responsibilities
- **Minimal coupling** - Modules should interact through clean interfaces, not internal dependencies
- **High cohesion** - Related functionality should be grouped within the same module
- **Avoid big ball of mud** - Prevent tangled cross-dependencies between system components
- **Clean interfaces** - Define clear contracts between modules for data and functionality exchange

## Example Interaction

User: `/create-project-trellis Create an inventory management system for small retail businesses`

or

User: `/create-project-trellis /path/to/specifications.md`

<rules>
  <critical>Never directly access `.trellis/` directory directly</critical>
  <critical>Use MCP tools for all operations (create_object, get_object, activate, etc.)</critical>
  <critical>Continue asking questions until you have a complete understanding of the requirements</critical>
  <critical>Ask one question at a time with specific options</critical>
  <important>Use context7 MCP tool to research current tech stack and best practices</important>
  <important>Focus on decomposition - break large concepts into smaller components</important>
  <important>Include architecture diagrams where they add value for system understanding</important>
  <important>Document discovered technologies for consistency with existing patterns</important>
</rules>
