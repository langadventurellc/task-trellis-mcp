# Create Features

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
  - **Acceptance Criteria**: Specific, measurable requirements as applicable to the feature type (functional behavior, UI requirements, validation criteria, integration points, performance/security needs)
  - Technical requirements
  - Dependencies on other features
  - **Implementation Guidance** - Technical approach and patterns to follow
  - **Testing Requirements** - How to verify the feature works correctly
  - **Security Considerations** - Input validation, authorization, data protection needs as applicable
  - **Performance Requirements** - Response times, resource usage constraints as applicable

**Feature Granularity Guidelines:**

Each feature should be sized appropriately for task breakdown:

- **1-2 hours per task** - When broken down, each task should be completable in 1-2 hours
- **Independent implementation** - Features should be implementable without blocking other features
- **Testable boundaries** - Features should have clear success criteria and testing strategies

### 5. Create Features Using MCP

For each feature, use `create_issue` with type `"feature"`, the generated title and description, and set `parent` to the epic ID if applicable. Include `prerequisites` for any feature dependencies. Set status to `"open"` or `"draft"` based on user preference.

**For standalone features**: Omit the `parent` parameter.

### 6. Output Format

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
