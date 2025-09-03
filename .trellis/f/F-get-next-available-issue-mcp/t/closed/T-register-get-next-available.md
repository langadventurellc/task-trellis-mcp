---
id: T-register-get-next-available
title: Register get_next_available_issue tool with MCP server and update exports
status: done
priority: medium
parent: F-get-next-available-issue-mcp
prerequisites:
  - T-create-get-next-available
affectedFiles: {}
log:
  - Task was already completed in a previous implementation cycle. Verified that
    the get_next_available_issue tool is fully integrated into the MCP server
    with proper exports, imports, registration, and handler implementation. All
    integration points specified in the task description are correctly
    implemented following existing MCP tool patterns.
schema: v1.0
childrenIds: []
created: 2025-09-03T00:37:03.417Z
updated: 2025-09-03T00:37:03.417Z
---

Integrate the new MCP tool into the server and export system.

**Integration Points**:

1. **Tool Export** (`src/tools/index.ts`):
   - Add export for `getNextAvailableIssueTool`
   - Follow alphabetical ordering of existing exports

2. **MCP Server Registration** (`src/server.ts`):
   - Import the new tool from tools index
   - Add to tools array in MCP server setup
   - Follow existing registration patterns

**Technical Approach**:

- Examine existing tool registration in `src/server.ts`
- Follow exact patterns for importing and registering tools
- Ensure tool is available in MCP server's tool list
- Maintain consistency with existing tool organization

**Verification Steps**:

- Confirm tool appears in MCP server's available tools
- Test basic tool invocation through MCP interface
- Verify proper error handling at server level

**Unit Tests**:

- Update server startup tests if they exist
- Verify tool registration in server configuration
- Test tool availability through MCP protocol

**Files Modified**:

- `src/tools/index.ts` - Add export
- `src/server.ts` - Register tool with MCP server

**Acceptance Criteria**:

- Tool successfully exported from tools module
- Tool registered and available in MCP server
- Integration follows existing patterns exactly
- No breaking changes to existing tool registrations
- Server starts successfully with new tool included
