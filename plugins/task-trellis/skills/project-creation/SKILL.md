---
name: project-creation
description: This skill should be used when the user asks to "create a project", "new trellis project", "start a project", "set up project management", or mentions creating a new project in Trellis. Creates a new project in the Trellis task management system by analyzing specifications and gathering requirements.
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

Key areas to explore (prioritize based on project scale):

**Essential for all projects:**

- **Functional Requirements**: What specific capabilities must the system provide?
- **Technical Architecture**: What technologies, frameworks, and patterns should be used?
- **Integration Points**: What external systems or APIs need to be integrated?

**Important for larger projects:**

- **User Types**: Who will use this system and what are their needs?
- **Performance Requirements**: What are the response time, load, and scaling needs?
- **Security Requirements**: What authentication, authorization, and data protection is needed?
- **Deployment Environment**: Where and how will this be deployed?
- **Timeline & Phases**: Are there specific deadlines or phase requirements?
- **Success Metrics**: How will project success be measured?

**When in doubt, ask.** Use the AskUserQuestion tool to clarify requirements. Agents tend to be overconfident about what they can infer - a human developer would ask more questions, not fewer. If you're making assumptions, stop and ask instead.

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
  - **Acceptance Criteria**: Specific, measurable requirements as applicable to the project type (e.g., functional behavior, performance benchmarks, security requirements, compatibility needs)
  - Any other context needed for epic creation

### 5. Create Project Using MCP

Create the project using `create_issue` with type `"project"`, the generated title and description. Set status to `"open"` or `"draft"` based on user preference.

### 6. Output Format

After successful creation:

```
Project created successfully!

Project: [Generated Title]
ID: [generated-id]
Status: [actual-status]

Project Summary:
[First paragraph of description]
```
