---
id: T-implement-template-renderer
title: Implement template renderer for placeholder substitution
status: done
priority: medium
parent: F-mcp-prompts-implementation
prerequisites:
  - T-create-core-prompt-data
affectedFiles:
  src/prompts/PromptRenderer.ts: Created comprehensive template renderer class
    with methods for argument validation, $ARGUMENTS substitution, ${argName}
    placeholder substitution, argument block formatting, and input sanitization
  src/prompts/PromptMessage.ts: Created PromptMessage interface defining the
    structure for MCP API message responses with system/user roles and text
    content
  src/prompts/__tests__/PromptRenderer.test.ts:
    Created extensive unit test suite
    with 27 test cases covering all renderer functionality including edge cases,
    error conditions, and security sanitization
  src/prompts/index.ts:
    Added exports for PromptRenderer and PromptMessage to the
    prompts module barrel file
log:
  - >-
    Implemented template renderer for placeholder substitution in the Task
    Trellis MCP system. The renderer handles both $ARGUMENTS blocks and
    individual ${argName} substitutions with comprehensive validation and
    security features.


    Key features implemented:

    - Main renderPrompt() method that processes templates and returns structured
    PromptMessage arrays

    - $ARGUMENTS substitution with special handling for single 'input' arguments
    vs multiple arguments formatted as blocks

    - ${argName} placeholder substitution with proper validation and error
    handling

    - Argument validation ensuring required arguments are present and non-empty

    - Comprehensive sanitization to prevent injection attacks (escapes
    backticks, dollar signs, HTML tags)

    - System message generation when systemRules are present

    - Full error handling with descriptive messages for missing required
    arguments


    The implementation follows project standards with TypeScript strict typing,
    comprehensive Jest unit tests (27 test cases), and adheres to the "one
    export per file" rule. All quality checks pass and 731 total tests remain
    passing.
schema: v1.0
childrenIds: []
created: 2025-09-02T18:45:17.252Z
updated: 2025-09-02T18:45:17.252Z
---

# Implement Template Renderer for Placeholder Substitution

## Context

The MCP prompts system needs to render prompt templates by substituting placeholders with provided argument values. This includes handling `$ARGUMENTS` blocks and individual `${argName}` substitutions as specified in the feature design.

## Technical Approach

Create `src/prompts/PromptRenderer.ts` that:

- Substitutes `$ARGUMENTS` with formatted argument blocks
- Handles individual `${argName}` placeholder substitution
- Formats arguments appropriately (single input vs multiple args)
- Returns structured messages for MCP API consumption

## Detailed Implementation Requirements

### Core Renderer Functions

Implement the following functions:

- `renderPrompt(prompt: TrellisPrompt, args: Record<string, string>): PromptMessage[]` - Main rendering entry point
- `substituteArguments(template: string, args: Record<string, string>): string` - Handle `$ARGUMENTS` substitution
- `substitutePlaceholders(template: string, args: Record<string, string>): string` - Handle `${argName}` substitution
- `formatArgumentsBlock(args: Record<string, string>, promptArgs: PromptArgument[]): string` - Create arguments display

### Placeholder Substitution Logic

#### `$ARGUMENTS` Substitution

- **Single 'input' argument**: Inject raw input value or labeled block
- **Multiple arguments**: Render "Inputs" section with `name: value` pairs
- **Format example for multiple args**:
  ```
  ## Inputs
  - projectId: P-12345
  - scope: development
  - input: Additional context here
  ```

#### `${argName}` Substitution

- Replace individual placeholders with provided argument values
- For missing optional arguments: leave empty or render "(not provided)"
- Handle missing required arguments with descriptive error

### Message Structure Generation

Return array of `PromptMessage` objects:

```typescript
type PromptMessage = {
  role: "system" | "user";
  content: [{ type: "text"; text: string }];
};
```

Generate:

1. **System message** (if systemRules present) - behavioral guidance from `<rules>`
2. **User message** - rendered template with substituted placeholders

### Argument Validation

- Check required arguments are present and non-empty after trim
- Throw descriptive errors for missing required arguments
- Coerce boolean arguments from string inputs when useful

### File Location

- Create `src/prompts/PromptRenderer.ts`
- Follow existing codebase patterns for string manipulation
- Use TypeScript for strong typing of message structures

### Acceptance Criteria

- [ ] Substitute `$ARGUMENTS` placeholder with formatted argument block
- [ ] Handle single 'input' argument by injecting raw value
- [ ] Handle multiple arguments by creating formatted "Inputs" section
- [ ] Substitute individual `${argName}` placeholders correctly
- [ ] Return properly structured PromptMessage array with system/user roles
- [ ] Validate required arguments and throw descriptive errors
- [ ] Handle missing optional arguments gracefully
- [ ] Unit tests covering single/multiple args, missing values, edge cases

## Dependencies

- Task: Create core prompt data models and TypeScript interfaces

## Out of Scope

- Prompt loading/caching - handled by PromptManager
- Complex template expressions - only simple placeholder substitution
- MCP API integration - handled by registry task
- File I/O operations - works with in-memory prompt objects

## Security Considerations

- Sanitize argument values to prevent injection attacks in rendered output
- Validate argument names match expected patterns
- Ensure template substitution doesn't introduce security vulnerabilities
