---
kind: task
id: T-test-crud-operations-via-mcp
title: Test CRUD operations via MCP protocol
status: open
priority: high
prerequisites:
  - T-set-up-e2e-test-infrastructure
created: "2025-08-05T16:40:56.243741"
updated: "2025-08-05T16:40:56.243741"
schema_version: "1.1"
---

Implement comprehensive E2E tests for basic CRUD operations through MCP protocol.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/crud/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      crud/
        createObject.e2e.test.ts    # Test create_object tool
        getObject.e2e.test.ts       # Test get_object tool
        updateObject.e2e.test.ts    # Test update_object tool
        deleteObject.e2e.test.ts    # Test delete_object tool
        listObjects.e2e.test.ts     # Test list_objects tool
        fileValidation.e2e.test.ts  # Validate markdown file structure
```

### Test Template Structure:

```typescript
import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";
import { readFile, access } from "fs/promises";
import path from "path";
import yaml from "yaml";

describe("CRUD Operations E2E", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
    client = new McpTestClient(testEnv.serverProcess);
    await client.connect();

    // Activate server with test directory
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  });

  afterEach(async () => {
    await client?.disconnect();
    await testEnv?.cleanup();
  });

  describe("create_object", () => {
    it("should create a project and validate markdown file", async () => {
      const response = await client.callTool("create_object", {
        type: "project",
        title: "Test Project",
        description: "A test project",
        priority: "high",
      });

      expect(response.content[0].text).toMatch(/Created object with ID: P-/);

      // Extract ID from response
      const id = response.content[0].text.match(/ID: (P-[^\\s]+)/)[1];

      // Verify file was created
      const filePath = path.join(testEnv.trellisDir, "p", id, `${id}.md`);
      await expect(access(filePath)).resolves.not.toThrow();

      // Verify file content
      const content = await readFile(filePath, "utf-8");
      const [frontMatter, body] = content.split("---\\n").slice(1);
      const parsed = yaml.parse(frontMatter);

      expect(parsed.kind).toBe("project");
      expect(parsed.title).toBe("Test Project");
      expect(parsed.priority).toBe("high");
      expect(body.trim()).toBe("A test project");
    });
  });
});
```

## Test Implementation Requirements:

1. **Create Object Tests** (`createObject.e2e.test.ts`):
   - Test all object types: project, epic, feature, task
   - Test with minimal vs full parameters
   - Verify file creation in correct directory structure
   - Test prerequisite handling
   - Test parent-child relationships (epic->project, feature->epic, etc.)

2. **Get Object Tests** (`getObject.e2e.test.ts`):
   - Test valid object retrieval by ID
   - Test invalid/non-existent ID handling
   - Verify returned object structure matches expected format
   - Test object types with different complexities

3. **Update Object Tests** (`updateObject.e2e.test.ts`):
   - Test updating individual fields (title, status, priority)
   - Test prerequisite updates
   - Test body content updates
   - Verify file updates are persisted correctly
   - Test invalid update scenarios

4. **Delete Object Tests** (`deleteObject.e2e.test.ts`):
   - Test single object deletion
   - Test cascading deletion behavior
   - Verify file system cleanup
   - Test deletion with dependencies (should fail)

5. **List Objects Tests** (`listObjects.e2e.test.ts`):
   - Test listing all objects
   - Test filtering by type, status, priority
   - Test scoped listing (by parent)
   - Verify returned object structure

6. **File Validation Tests** (`fileValidation.e2e.test.ts`):
   - Verify YAML front-matter structure
   - Test markdown body content handling
   - Test special characters and encoding
   - Verify directory organization follows hierarchy

### Log
