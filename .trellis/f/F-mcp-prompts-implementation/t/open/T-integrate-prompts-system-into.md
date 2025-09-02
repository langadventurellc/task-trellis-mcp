---
id: T-integrate-prompts-system-into
title: Integrate prompts system into main server and add initialization
status: open
priority: high
parent: F-mcp-prompts-implementation
prerequisites:
  - T-create-mcp-prompts-registry
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-02T18:46:01.714Z
updated: 2025-09-02T18:46:01.714Z
---

# Integrate Prompts System into Main Server and Add Initialization

## Context

The MCP prompts system components need to be integrated into the main server (`src/server.ts`) to enable prompts functionality. This includes initializing the PromptManager, registering MCP handlers, and ensuring proper startup sequence.

## Technical Approach

Modify `src/server.ts` to:

- Initialize PromptManager and load prompts on startup
- Register prompts handlers with the MCP server
- Update server capabilities to include prompts
- Handle initialization errors gracefully

## Detailed Implementation Requirements

### Server Initialization Changes

1. **Import prompts components** at the top of `src/server.ts`
2. **Initialize PromptManager** and call `load()` during server setup
3. **Register prompt handlers** using the registry function
4. **Update server capabilities** to advertise prompts support

### Integration Points

Modify the server setup around line 126-153 where the MCP server is created:

#### Add Imports

```typescript
import { PromptManager } from "./prompts/PromptManager";
import { registerPromptHandlers } from "./prompts/registry";
```

#### Initialize Prompts

Add prompt initialization after server creation but before request handlers:

```typescript
// Initialize prompts system
const promptManager = new PromptManager();
promptManager.load(); // Load prompts on startup

// Register prompt handlers
registerPromptHandlers(server, promptManager);
```

#### Update Server Capabilities

Modify the server capabilities to include prompts:

```typescript
capabilities: {
  tools: {},
  prompts: {},  // Add this line
}
```

### Error Handling

- Handle PromptManager initialization errors gracefully
- Log prompts loading issues without failing server startup
- Ensure server can start even if prompts directory is missing/empty
- Continue with core Trellis functionality if prompts system fails

### Startup Logging

- Log successful prompts initialization with count of loaded prompts
- Log warnings for prompts loading issues
- Use appropriate log levels consistent with existing codebase

### File Location

- Modify existing `src/server.ts` file
- Follow existing patterns for imports and initialization
- Maintain existing server structure and organization

### Acceptance Criteria

- [ ] Import prompts components in main server file
- [ ] Initialize PromptManager and call load() on server startup
- [ ] Register prompts handlers with MCP server instance
- [ ] Update server capabilities to advertise prompts support
- [ ] Handle prompts initialization errors without failing server startup
- [ ] Log successful prompts loading with loaded prompt count
- [ ] Maintain compatibility with existing tools functionality

## Dependencies

- Task: Create MCP prompts registry with list and get endpoints

## Out of Scope

- New configuration options - use existing patterns and defaults
- CLI argument changes - no new command line options needed
- Backwards compatibility concerns - this is new functionality
- Performance optimization - focus on correct integration first

## Security Considerations

- Ensure prompts system doesn't interfere with existing tool security
- Validate prompts initialization doesn't expose sensitive server internals
- Maintain existing error handling security practices
