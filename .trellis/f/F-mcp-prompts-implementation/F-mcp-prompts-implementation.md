---
id: F-mcp-prompts-implementation
title: MCP Prompts Implementation
status: open
priority: medium
prerequisites: []
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:23:06.976Z
updated: 2025-09-02T18:23:06.976Z
---

# MCP Prompts Implementation

Implement MCP prompts functionality for the Task Trellis server to expose workflow templates as discoverable slash commands in Claude Code, enabling users to invoke structured prompts with intelligent argument handling and autocomplete capabilities.

## Purpose and Functionality

This feature adds MCP prompt support to the Task Trellis server, allowing existing markdown prompt files to be registered as discoverable commands that appear as `/mcp__task-trellis__[prompt-name]` in Claude Code. Users can invoke these prompts with arguments that are validated, processed with template variables, and enhanced with autocomplete for Trellis object IDs.

## Key Components to Implement

### Core Infrastructure

- **PromptManager.ts**: Central lifecycle management for prompt registration, caching, and processing
- **PromptParser.ts**: Parse markdown files with YAML frontmatter and extract template variables
- **ArgumentResolver.ts**: Validate arguments, handle autocomplete, and process template substitution
- **types.ts**: TypeScript interfaces for TrellisPrompt, PromptArgument, and related data structures
- **registry.ts**: MCP server integration for prompt registration and handler setup

### Data Processing Engine

- Parse YAML frontmatter from existing markdown files in `prompts/basic/`
- Extract `<rules>` tags for system message generation
- Process template variables (${variable}, ${variable?fallback}) in prompt body content
- Implement argument validation against defined schemas
- Build autocomplete system for Trellis object IDs using existing MCP tools

### MCP Handler Integration

- Register `/prompts/list` handler returning available prompts with metadata
- Register `/prompts/get` handler for prompt processing and template generation
- Integrate with existing MCP server architecture and tool patterns
- Maintain consistency with current server configuration and error handling

## Detailed Acceptance Criteria

### Functional Behavior

- **Prompt Discovery**: All valid markdown files in `prompts/basic/` are automatically discovered and registered at server startup
- **Template Processing**: Template variables like `${specifications}` and `${projectName?"Please provide a project name"}` are correctly substituted with provided argument values
- **System Rules Extraction**: Content within `<rules>...</rules>` tags is extracted and provided as separate system messages
- **Argument Validation**: Required arguments are validated, optional arguments handle missing values gracefully with fallback text
- **Error Handling**: Invalid prompts are excluded from registration with detailed logging, runtime errors provide clear user feedback

### Autocomplete Integration

- **ID Completion**: Arguments marked with `autocomplete: true` provide dynamic completion for projectId, epicId, featureId, and taskId using existing `list_issues` functionality
- **Contextual Filtering**: Autocomplete results are filtered based on context (e.g., epics within selected project)
- **Graceful Degradation**: Autocomplete failures fall back to manual input without blocking prompt execution

### User Interface Requirements

- **Slash Command Registration**: Prompts appear as `/mcp__task-trellis__[prompt-name]` in Claude Code
- **Form Field Rendering**: Arguments render as form fields with descriptions and type validation
- **Dropdown Suggestions**: Autocomplete-enabled arguments show dropdown menus with available options
- **Inline Help**: Argument descriptions provide clear guidance for expected input

### Data Validation and Error Handling

- **Schema Validation**: All arguments are validated against their defined types (string, boolean) and required status
- **Template Validation**: Template variable references are checked against available arguments
- **Parsing Error Recovery**: Malformed markdown files are logged with specific error details and excluded from registration
- **Runtime Error Messages**: Unknown prompts, missing required arguments, and type mismatches provide actionable error messages

### Integration Points with Existing Systems

- **MCP Tool Compatibility**: Leverage existing `list_issues`, `get_issue` tools for autocomplete data without modifications
- **Server Architecture**: Integrate with current MCP server setup in `src/server.ts` without breaking existing functionality
- **Repository Pattern**: Use established patterns from existing tools for consistency and maintainability

### Performance Requirements

- **Startup Performance**: Prompt registration completes within 100ms for typical prompt file quantities
- **Response Times**: Prompt processing and template generation complete within 200ms
- **Memory Usage**: In-memory prompt cache uses less than 10MB for typical prompt collections
- **Autocomplete Performance**: ID completion queries respond within 500ms

## Security Considerations

### Input Validation

- **Argument Sanitization**: All user-provided arguments are validated against their schemas before template processing
- **Template Security**: Template variable substitution prevents injection attacks through proper escaping
- **File Path Validation**: Only markdown files within designated `prompts/basic/` directory are processed

### Access Control

- **Prompt Visibility**: All registered prompts are available to authenticated MCP clients
- **Argument Access**: No sensitive data is exposed through autocomplete suggestions
- **System Message Isolation**: Rules content is properly isolated from user content in message generation

## Implementation Guidance

### Technical Approach

- **Modular Architecture**: Implement separate modules for parsing, validation, and processing to enable independent testing and maintenance
- **TypeScript Integration**: Use strong typing throughout with Zod schemas for runtime validation consistency
- **Error Boundary Pattern**: Implement comprehensive error handling that prevents individual prompt failures from affecting server stability
- **Caching Strategy**: Build efficient in-memory cache with invalidation support for prompt file changes

### Code Patterns

- **Follow Existing Patterns**: Mirror the structure and patterns established in current `src/tools/` implementations
- **Repository Integration**: Use established repository patterns for data access consistency
- **Validation Consistency**: Apply same validation patterns used in existing object creation and update tools
- **Error Handling**: Use established error handling patterns from existing tools for consistency

### Testing Requirements

- **Unit Test Coverage**: Each module requires comprehensive unit tests covering success and failure scenarios
- **Integration Testing**: Test prompt registration, processing, and MCP handler integration end-to-end
- **Error Case Testing**: Validate error handling for malformed files, invalid arguments, and system failures
- **Performance Testing**: Verify startup time, processing speed, and memory usage requirements
- **Compatibility Testing**: Ensure integration with existing MCP functionality without regressions

### File Structure Implementation

```
src/prompts/
├── PromptManager.ts       # Core lifecycle management
├── PromptParser.ts        # Markdown parsing and template processing
├── ArgumentResolver.ts    # Argument validation and autocomplete
├── types.ts              # TypeScript interfaces
├── registry.ts           # MCP server registration
└── __tests__/
    ├── PromptManager.test.ts
    ├── PromptParser.test.ts
    ├── ArgumentResolver.test.ts
    └── integration.test.ts
```

## Dependencies on Other Features

- **No Prerequisites**: This is a standalone feature that enhances existing functionality without dependencies
- **Integration Points**: Uses existing MCP tool infrastructure (`list_issues`, `get_issue`) for autocomplete functionality
- **Backwards Compatibility**: Does not modify existing tools or workflows, only adds new prompt capabilities
