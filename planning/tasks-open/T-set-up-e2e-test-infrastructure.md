---
kind: task
id: T-set-up-e2e-test-infrastructure
title: Set up E2E test infrastructure for MCP protocol testing
status: open
priority: high
prerequisites: []
created: "2025-08-05T16:40:49.369722"
updated: "2025-08-05T16:40:49.369722"
schema_version: "1.1"
---

Create the foundation for end-to-end testing that validates the full MCP protocol communication.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      infrastructure/
        server.e2e.test.ts          # Basic server startup/shutdown
        client.e2e.test.ts          # MCP client setup and communication
      utils/
        testEnvironment.ts          # Test environment utilities
        mcpTestClient.ts           # MCP client for testing
        serverProcess.ts           # Server process management
        cleanup.ts                 # Test data cleanup utilities
```

### Test Template Structure:

```typescript
import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";

describe("E2E Infrastructure", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    client = new McpTestClient(testEnv.serverProcess);
    await client.connect();
  });

  afterEach(async () => {
    await client?.disconnect();
    await testEnv?.cleanup();
  });

  it("should establish MCP connection", async () => {
    const response = await client.initialize();
    expect(response.capabilities.tools).toBeDefined();
  });
});
```

## Implementation Requirements:

1. **TestEnvironment Class**:
   - Create temporary `.trellis` directories for each test
   - Manage server process lifecycle (start/stop)
   - Provide cleanup methods for test isolation

2. **McpTestClient Class**:
   - Wrapper around MCP SDK client
   - Handle stdio transport to server process
   - Provide methods for common MCP operations (initialize, listTools, callTool)

3. **Server Process Management**:
   - Spawn server with test configuration
   - Handle process stdout/stderr for debugging
   - Graceful shutdown with timeout handling

4. **Test Data Cleanup**:
   - Remove temporary directories after each test
   - Kill any orphaned server processes
   - Reset environment state between tests

### Log
