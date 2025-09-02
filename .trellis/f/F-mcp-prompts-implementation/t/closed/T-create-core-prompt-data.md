---
id: T-create-core-prompt-data
title: Create core prompt data models and TypeScript interfaces
status: done
priority: high
parent: F-mcp-prompts-implementation
prerequisites: []
affectedFiles:
  src/prompts/TrellisPrompt.ts:
    Created TrellisPrompt interface with comprehensive
    JSDoc comments, following feature specification exactly with name, title,
    description, arguments, systemRules, and userTemplate fields
  src/prompts/PromptArgument.ts: Created PromptArgument interface with proper
    TypeScript typing including name, type, required, and description fields
    with string literal type union
  src/prompts/index.ts:
    Created barrel export file consolidating TrellisPrompt and
    PromptArgument exports following existing codebase patterns
  src/prompts/__tests__/TrellisPrompt.test.ts: Comprehensive unit tests for
    TrellisPrompt interface including structure validation, optional fields,
    kebab-case names, and complex integration scenarios
  src/prompts/__tests__/PromptArgument.test.ts: Complete unit tests for
    PromptArgument interface covering required fields, optional type field, and
    TypeScript type system validation
log:
  - Successfully implemented core TypeScript interfaces for MCP prompts
    functionality. Created TrellisPrompt and PromptArgument interfaces following
    the feature specification exactly, with comprehensive JSDoc documentation.
    Followed existing codebase patterns with one-export-per-file rule compliance
    and proper test coverage. All interfaces are fully tested with 10
    comprehensive unit tests covering structure validation, optional fields,
    type constraints, and integration scenarios. Quality checks pass with no
    linting, formatting, or TypeScript errors.
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
