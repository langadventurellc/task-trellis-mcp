---
description: Break down an epic into specific features by analyzing the epic specification
argument-hint: [epic-id] [additional context or instructions]
---

# Create Features Command

Break down an epic into specific features using the Trellis task management system by analyzing the epic specification and gathering additional requirements as needed. Do not attempt to create multiple features in parallel. Do them sequentially one at a time.

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

Analyze an epic's comprehensive specification to create well-structured features that represent implementable functionality, ensuring complete coverage of the epic's scope and enabling effective task decomposition.

**Note**: Features can be created either as part of an epic hierarchy OR as standalone features. Both approaches are valid depending on your project structure and needs.

**IMPORTANT**: Features must include actual changes, implementations, or deliverables. Do not create features that are purely research tasks or analysis tasks without any tangible output. Since all features and tasks are executed independently without context from other features or tasks, purely analytical work provides no value.

## Hierarchical vs Standalone Features

### **Hierarchical Features** (with epic parent):

- Use when breaking down a large epic into manageable components
- Provides clear organization and dependency tracking
- Epic context helps inform feature scope and requirements
- Input typically includes an epic ID

### **Standalone Features** (no parent):

- Use for independent functionality that doesn't fit into an existing epic
- Suitable for bug fixes, small enhancements, or self-contained features
- Can be created directly from user requirements without epic context
- Input typically describes the standalone feature requirements

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

- Retrieve the epic using MCP `get_object` to access its comprehensive description, requirements, and parent project context

**For Standalone Features:**

- Analyze the provided requirements directly
- No parent context needed, focus on the specific functionality described

### 2. Analyze Requirements

**Thoroughly analyze the requirements (epic description OR standalone requirements) to identify natural feature boundaries:**

- **Use context7 MCP tool** to research technical approaches and best practices
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

**Example questioning approach:**

```
How should the user registration feature be scoped?
Options:
- A) Basic registration only (email, password, confirmation)
- B) Full registration with profile setup and email verification
- C) Registration with social login integration included
```

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

- **6-20 tasks per feature** - Features should represent enough work to be meaningful but not overwhelming
- **1-2 hours per task** - When broken down, each task should be completable in 1-2 hours
- **Independent implementation** - Features should be implementable without blocking other features
- **Testable boundaries** - Features should have clear success criteria and testing strategies

### 5. Create Features Using MCP

For each feature, call the Task Trellis MCP `create_object` tool:

- `type`: Set to `"feature"`
- `parent`: The epic ID (optional - omit for standalone features)
- `title`: Generated feature title
- `status`: Set to `"open"` (default, ready to begin work) or `"draft"` unless specified
- `prerequisites`: List of feature IDs that must complete first
- `description`: Comprehensive feature description with all elements from step 4

**For standalone features**: Simply omit the `parent` parameter entirely.

### 6. Output Format

After successful creation:

```
✅ Successfully created [N] features for epic "[Epic Title]"

📋 Created Features:
1. F-[id1]: [Feature 1 Title]
   → Dependencies: none

2. F-[id2]: [Feature 2 Title]
   → Dependencies: F-[id1]

3. F-[id3]: [Feature 3 Title]
   → Dependencies: F-[id1], F-[id2]

📊 Feature Summary:
- Total Features: [N]
- Dependencies Configured: ✓

Next step:
Use /create-tasks to break down features into implementable tasks
```

## Example Feature Structures

### User Authentication Epic

```
1. User Registration
   - Account creation, email verification, profile setup
   - Dependencies: none

2. Login System
   - Authentication, session management, remember me
   - Dependencies: User Registration

3. Password Management
   - Reset, change, strength requirements
   - Dependencies: Login System

4. Two-Factor Authentication
   - TOTP setup, backup codes, recovery
   - Dependencies: Login System

5. OAuth Integration
   - Social login providers, account linking
   - Dependencies: Login System
```

### Data Management Epic

```
1. Core Data Models
   - Entity definitions, relationships, validation
   - Dependencies: none

2. Database Migrations
   - Schema versioning, rollback support
   - Dependencies: Core Data Models

3. Data Access Layer
   - Repository pattern, query optimization
   - Dependencies: Core Data Models

4. Caching Strategy
   - Redis integration, cache invalidation
   - Dependencies: Data Access Layer
```

## Simplicity Principles

When creating features, follow these guidelines:

### Keep It Simple:

- **No over-engineering** - Create only the features needed for the epic
- **No extra features** - Don't add functionality that wasn't requested
- **Choose straightforward approaches** - Simple feature structure over complex designs
- **Solve the actual problem** - Don't anticipate future requirements

### Forbidden Patterns:

- **NO premature optimization** - Don't optimize feature structure unless requested
- **NO feature creep** - Stick to the specified epic requirements
- **NO complex dependencies** - Keep feature relationships simple and clear
- **NO unnecessary abstractions** - Choose direct, maintainable approaches
- **NO pure research/analysis features** - Every feature must produce actual code, configuration, or tangible deliverables

### Modular Architecture:

- **Clear boundaries** - Each feature should have distinct, well-defined responsibilities
- **Minimal coupling** - Features should interact through clean interfaces, not internal dependencies
- **High cohesion** - Related functionality should be grouped within the same feature
- **Avoid big ball of mud** - Prevent tangled cross-dependencies between features
- **Clean interfaces** - Define clear contracts between features for data and functionality exchange

## Question Guidelines

Ask questions that:

- **Define feature scope**: What's included vs excluded?
- **Clarify technical approach**: Specific technologies or patterns?
- **Identify dependencies**: Build order and integration points?
- **Consider testing**: How to verify feature completeness?

## Error Handling

- **Epic not found**: Provide clear error message
- **Invalid dependencies**: Detect and prevent circular dependencies
- **Missing epic description**: Request epic details be added first

<rules>
  <critical>Epic ID is required (from arguments or context)</critical>
  <critical>Base feature breakdown primarily on epic description</critical>
  <critical>Never directly access `.trellis/` directory directly</critical>
  <critical>Use MCP tools for all operations (create_object, get_object, etc.)</critical>
  <critical>Ask one question at a time with specific options</critical>
  <critical>Continue asking questions until you have complete understanding of feature boundaries</critical>
  <important>Use context7 MCP tool to research technical approaches and best practices</important>
  <important>Feature descriptions must be detailed enough for task creation</important>
  <important>Include implementation guidance and testing requirements</important>
  <important>Configure dependencies to enable parallel work</important>
  <important>Size features appropriately for 6-20 tasks of 1-2 hours each</important>
</rules>
