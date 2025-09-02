---
id: T-create-core-prompt-data
title: Create core prompt data models and TypeScript interfaces
status: open
priority: high
parent: F-mcp-prompts-implementation
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:44:17.376Z
updated: 2025-09-02T18:44:17.376Z
---

# Create Core Prompt Data Models and TypeScript Interfaces

## Context

Implementing MCP prompts functionality requires well-defined TypeScript interfaces to model prompt data, arguments, and internal structures. These models will be used throughout the prompts system for type safety and clear contracts.

## Technical Approach

Create `src/prompts/types.ts` with the interfaces specified in the feature design:

- `TrellisPrompt` interface for internal prompt representation
- `PromptArgument` interface for argument definitions
- Additional utility types as needed

## Detailed Implementation Requirements

### Core Interfaces

Implement the following interfaces based on the feature specification:

```typescript
interface TrellisPrompt {
  name: string; // kebab-case identifier (e.g., "create-project")
  title?: string; // Optional human-readable title (internal)
  description: string; // Single-sentence summary for slash command help
  arguments: PromptArgument[];
  systemRules?: string; // Extracted from <rules> ... </rules>
  userTemplate: string; // Markdown body with placeholders
}

interface PromptArgument {
  name: string;
  type?: "string" | "boolean"; // Internal hint; treat all inputs as strings in API
  required: boolean;
  description: string;
}
```

### File Location

- Create `src/prompts/types.ts`
- Export all interfaces for use throughout the prompts system
- Follow existing codebase patterns for TypeScript interface definitions

### Acceptance Criteria

- [ ] `TrellisPrompt` interface implemented with all required fields
- [ ] `PromptArgument` interface implemented with proper typing
- [ ] All interfaces exported from `src/prompts/types.ts`
- [ ] Interfaces match the feature specification exactly
- [ ] Unit tests created for type validation and usage
- [ ] JSDoc comments added for interface documentation

## Dependencies

None - this is foundational work

## Out of Scope

- Implementation logic (parsing, rendering, etc.) - handled by other tasks
- MCP API integration - handled by registry task
- File I/O operations - handled by parser task

## Security Considerations

- Ensure type safety prevents injection attacks through argument validation
- Types should support validation of required vs optional arguments
