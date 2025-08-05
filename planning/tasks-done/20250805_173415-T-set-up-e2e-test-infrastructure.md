---
kind: task
id: T-set-up-e2e-test-infrastructure
status: done
title: Set up E2E test infrastructure for MCP protocol testing
priority: high
prerequisites: []
created: "2025-08-05T16:40:49.369722"
updated: "2025-08-05T17:19:15.104436"
schema_version: "1.1"
worktree: null
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

## Implementation Attempt Analysis (2025-08-05)

**ATTEMPT STATUS: INFRASTRUCTURE CREATED BUT MCP PROTOCOL COMMUNICATION FAILING**

### What Was Successfully Implemented

1. **Dependencies Added to package.json**:
   - `tmp@0.2.3` and `@types/tmp@0.2.6` - For temporary directory management
   - `tree-kill@1.2.2` - For reliable process cleanup across platforms

2. **Directory Structure Created**:
   - Complete E2E test structure as specified in requirements
   - All utility classes implemented (TestEnvironment, McpTestClient, ServerProcess, TestCleanup)
   - Infrastructure tests created (server.e2e.test.ts, client.e2e.test.ts)

3. **Core Infrastructure Working**:
   - TestEnvironment successfully creates temporary `.trellis` directories
   - Server process spawning and management works
   - Basic MCP client-server connection establishment succeeds
   - Process cleanup and resource management functional
   - All linting and type checking passes

### Critical Issues Discovered

**PRIMARY ISSUE: MCP Protocol Schema Validation Failures**

The fundamental problem is not with the infrastructure setup, but with MCP protocol message exchange:

```
ZodError: [
  {
    "code": "invalid_literal",
    "expected": "tools/list",
    "path": ["method"],
    "message": "Invalid literal value, expected \"tools/list\""
  }
]
```

**Root Cause Analysis**:

1. **CLIENT-SIDE Schema Misuse** (PRIMARY ISSUE):
   - Used `ListToolsRequestSchema` to validate responses, but this is for REQUEST validation only
   - Server responses are likely MCP-compliant (using official MCP SDK)
   - Need to find correct response schemas (ListToolsResultSchema?) or remove validation
   - Error occurs because response `{ tools: [...] }` doesn't match request schema expecting `{ method: "tools/list" }`

2. **MCP Client Initialization**:
   - Manual `initialize()` calls cause errors
   - MCP SDK Client handles initialization automatically in `connect()`
   - Client expects specific MCP protocol handshake sequence

### Key Technical Findings

1. **MCP SDK Client Behavior**:

   ```typescript
   // WRONG - causes schema validation errors
   await client.connect();
   await client.initialize(); // Don't do this

   // CORRECT - initialization handled automatically
   await client.connect(); // This handles full MCP handshake
   ```

2. **Response Schema Problem**:

   ```typescript
   // Current failing approach
   await this.client.request(
     { method: "tools/list" },
     ListToolsRequestSchema, // This is WRONG - validates request, not response
   );

   // Correct approaches:
   // Option 1: Use proper response schema
   await this.client.request(
     { method: "tools/list" },
     ListToolsResultSchema, // Need to import this from MCP SDK
   );

   // Option 2: Let SDK handle validation (recommended)
   await this.client.request({ method: "tools/list" });
   ```

3. **Server is Likely Fine**:
   - Server uses official MCP SDK patterns correctly
   - Server handlers return proper `{ tools: [...] }` format
   - No server changes needed - issue is purely client-side schema misuse

### Remaining Work for Next Developer

**IMMEDIATE PRIORITIES:**

1. **Fix Client-Side Schema Usage** (SIMPLE FIX):
   - Replace `ListToolsRequestSchema` with `ListToolsResultSchema` in mcpTestClient.ts
   - Or remove schema validation entirely and let MCP SDK handle it
   - Apply same fix to `CallToolRequestSchema` usage
   - This should resolve all E2E test failures

2. **Find Correct Response Schemas**:
   - Import `ListToolsResultSchema`, `CallToolResultSchema` from MCP SDK
   - Check MCP SDK exports: `import { ListToolsResultSchema, CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';`
   - If response schemas don't exist, remove validation parameter entirely

3. **Simple Test Fixes**:
   - Update mcpTestClient.ts methods to use correct schemas or no validation
   - Server code is fine - no changes needed there
   - Focus purely on client test code corrections

**INFRASTRUCTURE IS SOLID - FOCUS ON PROTOCOL LAYER**

The test infrastructure foundation is complete and working. The issue is specifically in the MCP protocol message exchange layer. Basic connection works, but tool invocation fails due to schema validation.

**Debugging Commands for Next Developer**:

```bash
# Test basic connection (this works)
npm test -- --testNamePattern="should establish MCP connection"

# See full E2E failures (protocol issues)
npm test -- src/__tests__/e2e

# All unit tests pass - infrastructure is solid
npm test -- --testPathIgnorePatterns="e2e"
```

**Files Created During This Attempt**:

- `src/__tests__/e2e/utils/testEnvironment.ts` - ✅ Working
- `src/__tests__/e2e/utils/mcpTestClient.ts` - ⚠️ Needs MCP schema fixes
- `src/__tests__/e2e/utils/serverProcess.ts` - ✅ Working
- `src/__tests__/e2e/utils/cleanup.ts` - ✅ Working
- `src/__tests__/e2e/infrastructure/server.e2e.test.ts` - ⚠️ Basic connection works
- `src/__tests__/e2e/infrastructure/client.e2e.test.ts` - ❌ Tool calls fail

**Quality Status**: All linting, formatting, and type checking passes. Only E2E protocol tests fail.

**2025-08-05T22:34:15.655456Z** - Successfully implemented comprehensive E2E test infrastructure for MCP protocol testing. Fixed previous implementation issues with MCP client schema validation by using proper result schemas (ListToolsResultSchema, CallToolResultSchema) instead of request schemas. Created complete test suite with TestEnvironment, McpTestClient, ServerProcess, and cleanup utilities. All tests passing and code quality checks successful.

- filesChanged: ["src/__tests__/e2e/utils/testEnvironment.ts", "src/__tests__/e2e/utils/mcpTestClient.ts", "src/__tests__/e2e/utils/serverProcess.ts", "src/__tests__/e2e/utils/cleanup.ts", "src/__tests__/e2e/infrastructure/server.e2e.test.ts", "src/__tests__/e2e/infrastructure/client.e2e.test.ts", "jest.config.mjs", "package.json"]
