---
kind: task
id: T-test-error-handling-and-edge
title: Test error handling and edge cases via MCP protocol
status: open
priority: normal
prerequisites:
  - T-test-task-management-workflow
  - T-test-server-configuration-and
created: "2025-08-05T16:41:25.784094"
updated: "2025-08-05T16:41:25.784094"
schema_version: "1.1"
---

Test comprehensive error handling and edge cases through MCP protocol.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/errors/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      errors/
        invalidRequests.e2e.test.ts     # Test malformed and invalid requests
        validation.e2e.test.ts          # Test input parameter validation
        dependencies.e2e.test.ts        # Test circular dependencies and constraints
        corruption.e2e.test.ts          # Test corrupted data handling
        concurrency.e2e.test.ts         # Test concurrent operations
        recovery.e2e.test.ts            # Test server recovery scenarios
        errorMessages.e2e.test.ts       # Test error message quality
```

### Test Template Structure:

```typescript
import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";
import { writeFile, chmod } from "fs/promises";
import path from "path";

describe("Error Handling E2E", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    client = new McpTestClient(testEnv.serverProcess);
    await client.connect();
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  });

  afterEach(async () => {
    await client?.disconnect();
    await testEnv?.cleanup();
  });

  describe("Invalid Requests", () => {
    it("should handle unknown tool calls gracefully", async () => {
      const response = await client.callTool("nonexistent_tool", {});

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toMatch(/Unknown tool/);
    });

    it("should validate required parameters", async () => {
      const response = await client.callTool("create_object", {
        // Missing required 'type' and 'title'
        description: "Invalid object",
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toMatch(/required/i);
    });

    it("should handle malformed JSON gracefully", async () => {
      // This tests the MCP client's handling of malformed requests
      const response = await client.sendRawRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "create_object",
          arguments: "{ invalid json }", // Malformed JSON string
        },
      });

      expect(response.error).toBeDefined();
    });
  });

  describe("Circular Dependencies", () => {
    it("should detect circular dependencies in prerequisites", async () => {
      // Create Task A
      const taskAResponse = await client.callTool("create_object", {
        type: "task",
        title: "Task A",
      });
      const taskAId = taskAResponse.content[0].text.match(/ID: (T-[^\\s]+)/)[1];

      // Create Task B with A as prerequisite
      const taskBResponse = await client.callTool("create_object", {
        type: "task",
        title: "Task B",
        prerequisites: [taskAId],
      });
      const taskBId = taskBResponse.content[0].text.match(/ID: (T-[^\\s]+)/)[1];

      // Try to update Task A to have B as prerequisite (creates cycle)
      const response = await client.callTool("update_object", {
        id: taskAId,
        prerequisites: [taskBId],
      });

      expect(response.isError).toBe(true);
      expect(response.content[0].text).toMatch(/circular|cycle/i);
    });
  });
});
```

## Test Implementation Requirements:

1. **Invalid Requests Tests** (`invalidRequests.e2e.test.ts`):
   - Test unknown tool names
   - Test missing required parameters
   - Test invalid parameter types (string instead of array, etc.)
   - Test malformed JSON in requests
   - Test oversized request payloads
   - Test invalid MCP protocol messages

2. **Validation Tests** (`validation.e2e.test.ts`):
   - Test invalid object types
   - Test invalid status transitions
   - Test invalid priority values
   - Test malformed object IDs
   - Test invalid parent-child relationships
   - Test duplicate object IDs
   - Test invalid prerequisite references

3. **Dependencies Tests** (`dependencies.e2e.test.ts`):
   - Test circular dependency detection (A -> B -> A)
   - Test complex circular chains (A -> B -> C -> A)
   - Test self-references in prerequisites
   - Test deleting objects with active dependents
   - Test prerequisite validation on task claiming
   - Test orphaned objects after parent deletion

4. **Corruption Tests** (`corruption.e2e.test.ts`):
   - Test handling of corrupted YAML front-matter
   - Test handling of missing markdown files
   - Test handling of invalid file permissions
   - Test recovery from partial file writes
   - Test handling of invalid UTF-8 sequences
   - Test directory structure corruption

5. **Concurrency Tests** (`concurrency.e2e.test.ts`):
   - Test multiple clients connecting simultaneously
   - Test concurrent task claiming
   - Test concurrent file modifications
   - Test race conditions in object creation
   - Test server state consistency under load
   - Test file locking behavior

6. **Recovery Tests** (`recovery.e2e.test.ts`):
   - Test server restart with incomplete operations
   - Test recovery from process crashes
   - Test handling of locked files after crash
   - Test data consistency after unexpected shutdown
   - Test recovery from network interruptions
   - Test client reconnection after server restart

7. **Error Messages Tests** (`errorMessages.e2e.test.ts`):
   - Test error message clarity and specificity
   - Test error messages contain actionable information
   - Test consistent error format across all tools
   - Test error messages don't expose sensitive data
   - Test localization support for error messages
   - Test error codes are meaningful and documented

## Error Testing Patterns:

```typescript
// Pattern for testing error responses
describe("Error Response Pattern", () => {
  it("should return structured error response", async () => {
    const response = await client.callTool("invalid_tool", {});

    expect(response).toMatchObject({
      isError: true,
      content: [
        {
          type: "text",
          text: expect.stringMatching(/clear error message/),
        },
      ],
    });
  });
});

// Pattern for testing validation errors
describe("Validation Error Pattern", () => {
  it("should validate input and provide helpful message", async () => {
    const response = await client.callTool("create_object", {
      type: "invalid_type",
      title: "Test",
    });

    expect(response.content[0].text).toMatch(
      /valid object types.*project.*epic.*feature.*task/,
    );
  });
});
```

## Special Test Considerations:

- **Error Message Quality**: All error messages should be clear, specific, and actionable
- **State Consistency**: Ensure server state remains consistent after errors
- **Resource Cleanup**: Verify no resource leaks after error conditions
- **Graceful Degradation**: Server should continue operating after handling errors

### Log
