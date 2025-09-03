---
id: T-create-get-next-available
title: Create get_next_available_issue MCP tool definition with schema and handler
status: open
priority: high
parent: F-get-next-available-issue-mcp
prerequisites:
  - T-create-getnextavailableissue
affectedFiles: {}
log: []
schema: v1.0
childrenIds: []
created: 2025-09-03T00:36:48.297Z
updated: 2025-09-03T00:36:48.297Z
---

Create the MCP tool definition following existing patterns in the codebase.

**Implementation Location**: `src/tools/getNextAvailableIssueTool.ts`

**Technical Approach**:

- Follow the exact pattern from `src/tools/claimTaskTool.ts` for structure and naming
- Create tool object with `name`, `description`, and `inputSchema` properties
- Tool name: `"get_next_available_issue"`

**Input Schema**:

- `scope` (optional string): Filter issues within specific scope boundary
- `issueType` (optional): Single TrellisObjectType or array of types to filter by

**Tool Handler Function**:

- Accept MCP CallToolRequest with proper type checking
- Extract and validate parameters from request
- Delegate to `getNextAvailableIssue` service function
- Return success response with complete TrellisObject data
- Handle errors gracefully with descriptive messages

**Documentation Requirements**:

- Comprehensive JSDoc description explaining purpose and usage
- Clear parameter documentation with examples
- Error condition documentation
- Usage examples showing scope and type filtering

**Response Format**:

```typescript
{
  content: [
    {
      type: "text",
      text: JSON.stringify(foundIssue, null, 2),
    },
  ];
}
```

**Error Handling**:

- Catch service errors and return formatted error responses
- Provide clear error messages for common scenarios
- Follow existing error handling patterns from other tools

**Unit Tests** (`src/tools/__tests__/getNextAvailableIssueTool.test.ts`):

- Test successful issue discovery with various parameters
- Test parameter validation (valid and invalid inputs)
- Test service error propagation
- Test response formatting
- Mock service layer following patterns from `claimTaskTool.test.ts`

**Acceptance Criteria**:

- Tool follows exact naming and structure patterns from existing tools
- Input schema properly validates parameters
- Handler delegates correctly to service layer
- Response format matches existing tool patterns
- Comprehensive error handling with user-friendly messages
- 100% unit test coverage
- All TypeScript types properly defined
