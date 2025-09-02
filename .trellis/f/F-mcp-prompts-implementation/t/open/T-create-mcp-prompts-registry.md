---
id: T-create-mcp-prompts-registry
title: Create MCP prompts registry with list and get endpoints
status: open
priority: high
parent: F-mcp-prompts-implementation
prerequisites:
  - T-create-prompt-manager-for
  - T-implement-template-renderer
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:45:41.589Z
updated: 2025-09-02T18:45:41.589Z
---

# Create MCP Prompts Registry with List and Get Endpoints

## Context

The MCP prompts system needs to expose official MCP prompt endpoints (`prompts/list` and `prompts/get`) using the `@modelcontextprotocol/sdk`. This registry will integrate PromptManager and PromptRenderer to provide slash command functionality in Claude Code.

## Technical Approach

Create `src/prompts/registry.ts` that:

- Implements MCP prompt endpoints using `@modelcontextprotocol/sdk`
- Integrates with PromptManager for prompt access
- Uses PromptRenderer for template processing
- Follows MCP protocol specifications exactly

## Detailed Implementation Requirements

### MCP Endpoint Implementation

Implement both required MCP prompt endpoints:

#### 1. `prompts/list` Endpoint

- Returns catalog of prompts shown as slash commands in Claude Code
- Maps internal `TrellisPrompt` to external API format
- Omits internal-only fields (title, systemRules, userTemplate)
- Returns structured JSON matching MCP specification

Expected response format:

```json
{
  "prompts": [
    {
      "name": "create-project",
      "description": "Create a new project by analyzing specs and gathering requirements",
      "arguments": [
        {
          "name": "input",
          "description": "Project specifications or path",
          "required": false
        }
      ]
    }
  ]
}
```

#### 2. `prompts/get` Endpoint

- Accepts `name` and `arguments` (all values as strings from client UI)
- Performs server-side template rendering and placeholder substitution
- Returns messages suitable for chat insertion
- Uses only `system` and `user` roles with rich text blocks

Expected response format:

```json
{
  "messages": [
    {
      "role": "system",
      "content": [
        {
          "type": "text",
          "text": "Never directly access .trellis. Use MCP tools only."
        }
      ]
    },
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "# Create Project Trellis Command\n...rendered markdown..."
        }
      ]
    }
  ]
}
```

### Integration Architecture

- **Import PromptManager** for accessing cached prompts
- **Import PromptRenderer** for template processing
- **Create singleton instances** or dependency injection
- **Handle errors gracefully** with descriptive MCP error responses

### Server Registration Function

Export `registerPromptHandlers(server: McpServer)` function that:

1. Registers `prompts/list` handler
2. Registers `prompts/get` handler
3. Integrates with existing server instance
4. Follows existing tool registration patterns in codebase

### Error Handling

- Return proper MCP error responses for unknown prompts
- Validate required arguments and return descriptive errors
- Handle internal errors (parsing, rendering) gracefully
- Log errors appropriately without exposing internal details

### File Location

- Create `src/prompts/registry.ts`
- Export registration function for use in main server setup
- Follow existing codebase patterns for MCP server integration

### Type Safety and Validation

- Use TypeScript for strong typing of MCP requests/responses
- Validate argument presence and types before processing
- Ensure MCP protocol compliance with proper error codes

### Acceptance Criteria

- [ ] Implement `prompts/list` endpoint returning properly formatted prompt catalog
- [ ] Implement `prompts/get` endpoint with template rendering and message generation
- [ ] Export `registerPromptHandlers(server)` function for server integration
- [ ] Handle unknown prompt names with descriptive errors
- [ ] Validate required arguments and return proper error responses
- [ ] Omit internal-only fields from `prompts/list` responses
- [ ] Generate proper MCP message format with system/user roles
- [ ] Unit tests covering both endpoints with valid/invalid inputs

## Dependencies

- Task: Create prompt manager for lifecycle and caching
- Task: Implement template renderer for placeholder substitution

## Out of Scope

- Server startup/configuration - handled by main server integration task
- Prompt file parsing - handled by parser/manager tasks
- Custom MCP extensions - stick to official MCP protocol only
- Authentication/authorization - not required for MCP prompts

## Security Considerations

- Validate all input parameters to prevent injection attacks
- Ensure error messages don't leak internal system information
- Follow MCP security best practices for request/response handling
