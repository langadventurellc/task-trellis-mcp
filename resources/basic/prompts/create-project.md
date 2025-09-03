---
description: Create a new project in the Trellis task management system by analyzing specifications and gathering requirements
---

# Create Project Trellis Command

Create a new project in the Trellis task management system by analyzing specifications provided and gathering additional requirements as needed.

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

### 5. Create Project Using MCP

Call the Task Trellis MCP `create_issue` tool to create the project with the following parameters:

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
```

<rules>
  <critical>Use MCP tools for all operations (create_issue, get_issue, activate, etc.)</critical>
  <critical>Continue asking questions until you have a complete understanding of the requirements</critical>
  <critical>Ask one question at a time with specific options</critical>
</rules>
