---
kind: task
id: T-test-server-configuration-and
title: Test server configuration and activation via MCP protocol
status: open
priority: normal
prerequisites:
  - T-set-up-e2e-test-infrastructure
created: "2025-08-05T16:41:10.455950"
updated: "2025-08-05T16:41:10.455950"
schema_version: "1.1"
---

Test server configuration, activation, and initialization through MCP protocol.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/configuration/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      configuration/
        activation.e2e.test.ts       # Test activate tool
        commandLineArgs.e2e.test.ts  # Test CLI argument handling
        preActivation.e2e.test.ts    # Test behavior before activation
        invalidConfig.e2e.test.ts    # Test error scenarios
        directorySetup.e2e.test.ts   # Test .trellis directory creation
```

### Test Template Structure:

```typescript
import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";
import { access, mkdir } from "fs/promises";
import path from "path";

describe("Server Configuration E2E", () => {
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

  describe("Activation", () => {
    it("should activate server with local mode", async () => {
      const response = await client.callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      expect(response.content[0].text).toMatch(/Activated in local mode/);
      expect(response.content[0].text).toContain(testEnv.projectRoot);

      // Verify .trellis directory was created
      const trellisDir = path.join(testEnv.projectRoot, ".trellis");
      await expect(access(trellisDir)).resolves.not.toThrow();
    });

    it("should allow tool usage after activation", async () => {
      // Activate first
      await client.callTool("activate", {
        mode: "local",
        projectRoot: testEnv.projectRoot,
      });

      // Should now be able to use other tools
      const response = await client.callTool("list_objects", {});
      expect(response.content[0].text).not.toMatch(/not configured/);
    });
  });
});
```

## Test Implementation Requirements:

1. **Activation Tests** (`activation.e2e.test.ts`):
   - Test activate tool with local mode
   - Test activation response messages
   - Test multiple activations (should update config)
   - Test activation parameter validation
   - Verify configuration is persisted in server state

2. **Command Line Args Tests** (`commandLineArgs.e2e.test.ts`):
   - Test server startup with --mode argument
   - Test server startup with --projectRootFolder argument
   - Test server startup with combined arguments
   - Verify CLI args are used as default configuration
   - Test invalid command line argument handling

3. **Pre-Activation Tests** (`preActivation.e2e.test.ts`):
   - Test that tools (except activate) fail before activation
   - Verify specific error messages for unconfigured server
   - Test list_tools works before activation
   - Test server initialization and MCP handshake
   - Test server capabilities before activation

4. **Invalid Config Tests** (`invalidConfig.e2e.test.ts`):
   - Test activation with missing required parameters
   - Test activation with invalid project root paths
   - Test activation with non-existent directories
   - Test activation with insufficient permissions
   - Test server behavior with corrupted configuration

5. **Directory Setup Tests** (`directorySetup.e2e.test.ts`):
   - Test .trellis directory creation structure
   - Test subdirectory creation (p/, e/, f/, t/)
   - Test directory permissions and access
   - Test directory creation with existing files
   - Test cleanup and re-creation scenarios

## Special Test Considerations:

- **Server Process Management**: Each test should start server with different CLI args
- **File System Permissions**: Test directory creation under various permission scenarios
- **Configuration State**: Verify server maintains configuration between tool calls
- **Error Message Validation**: Ensure error messages are clear and actionable

### Log
