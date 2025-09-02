---
id: T-create-prompt-manager-for
title: Create prompt manager for lifecycle and caching
status: open
priority: high
parent: F-mcp-prompts-implementation
prerequisites:
  - T-implement-markdown-prompt
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:44:55.946Z
updated: 2025-09-02T18:44:55.946Z
---

# Create Prompt Manager for Lifecycle and Caching

## Context

The MCP prompts system needs a central manager to handle prompt loading, caching, and lifecycle management. This component will scan the `prompts/basic/` directory, load prompt definitions, and provide access methods for the MCP registry.

## Technical Approach

Create `src/prompts/PromptManager.ts` that:

- Scans `prompts/basic/` directory on startup (no hot reload)
- Loads and caches prompt definitions using PromptParser
- Provides methods for listing and retrieving prompts
- Handles validation and error logging for invalid files

## Detailed Implementation Requirements

### Core Manager Class

Implement `PromptManager` class with these methods:

- `constructor()` - Initialize empty cache
- `load(): void` - Scan directory and load all prompts (startup only)
- `list(): TrellisPrompt[]` - Return all loaded prompts
- `get(name: string): TrellisPrompt | undefined` - Get prompt by name
- `has(name: string): boolean` - Check if prompt exists

### Directory Scanning Logic

1. **Find markdown files** in `prompts/basic/` directory
2. **Parse each file** using PromptParser
3. **Cache valid prompts** in internal Map<string, TrellisPrompt>
4. **Log invalid files** with filename and error details
5. **Continue processing** other files even if some fail

### Caching Strategy

- Use `Map<string, TrellisPrompt>` for efficient lookup by name
- Load once on startup, no hot reload (as specified in requirements)
- Store prompts by their `name` field (kebab-case identifier)

### Error Handling and Logging

- Log invalid files with descriptive error messages
- Include filename and specific parsing/validation failure
- Use appropriate logging level (warn for invalid files)
- Don't fail the entire load process for individual file errors

### File Location

- Create `src/prompts/PromptManager.ts`
- Use Node.js fs operations for directory scanning
- Follow existing codebase patterns for error handling

### Integration Points

- Export class for use by MCP registry
- Ensure thread-safe access (though single-threaded Node.js)
- Support both development and production environments

### Acceptance Criteria

- [ ] Scan `prompts/basic/` directory for `.md` files
- [ ] Load and cache all valid prompts on startup
- [ ] Provide `list()` method returning all cached prompts
- [ ] Provide `get(name)` method for individual prompt lookup
- [ ] Log descriptive errors for invalid files without failing load
- [ ] Handle directory not existing gracefully (empty cache)
- [ ] Unit tests covering directory scanning, caching, and error cases
- [ ] Integration tests with actual prompt files from `prompts/basic/`

## Dependencies

- Task: Implement markdown prompt file parser with frontmatter support

## Out of Scope

- Hot reload functionality - explicitly not required per feature spec
- Template rendering - handled by separate renderer task
- MCP endpoint implementation - handled by registry task
- Prompt file creation/editing - this is read-only functionality

## Security Considerations

- Validate file paths during directory scanning
- Ensure only `.md` files are processed to prevent unauthorized file access
- Handle filesystem permission errors gracefully
