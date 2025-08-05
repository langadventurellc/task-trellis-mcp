---
kind: task
id: T-test-task-management-workflow
title: Test task management workflow via MCP protocol
status: open
priority: high
prerequisites:
  - T-test-crud-operations-via-mcp
created: "2025-08-05T16:41:03.122684"
updated: "2025-08-05T16:41:03.122684"
schema_version: "1.1"
---

Test the complete task lifecycle and management features through MCP protocol.

## Test Location and Structure

Create tests in: `src/__tests__/e2e/workflow/`

### Directory Structure to Create:

```
src/
  __tests__/
    e2e/
      workflow/
        claimTask.e2e.test.ts       # Test claim_task tool
        completeTask.e2e.test.ts    # Test complete_task tool
        appendLog.e2e.test.ts       # Test append_object_log tool
        pruneClosed.e2e.test.ts     # Test prune_closed tool
        taskLifecycle.e2e.test.ts   # Complete workflow tests
        prerequisites.e2e.test.ts   # Dependency chain tests
```

### Test Template Structure:

```typescript
import { TestEnvironment } from "../utils/testEnvironment";
import { McpTestClient } from "../utils/mcpTestClient";
import { readFile } from "fs/promises";
import path from "path";
import yaml from "yaml";

describe("Task Management Workflow E2E", () => {
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

  describe("Task Lifecycle", () => {
    it("should complete full task workflow: create -> claim -> complete", async () => {
      // Create prerequisite task (completed)
      const prereqResponse = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite Task",
        status: "done",
      });
      const prereqId =
        prereqResponse.content[0].text.match(/ID: (T-[^\\s]+)/)[1];

      // Create main task with prerequisite
      const taskResponse = await client.callTool("create_object", {
        type: "task",
        title: "Main Task",
        prerequisites: [prereqId],
        status: "open",
      });
      const taskId = taskResponse.content[0].text.match(/ID: (T-[^\\s]+)/)[1];

      // Claim the task
      const claimResponse = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimResponse.content[0].text).toMatch(/Claimed task/);

      // Complete the task
      const completeResponse = await client.callTool("complete_task", {
        taskId: taskId,
        summary: "Task completed successfully",
      });
      expect(completeResponse.content[0].text).toMatch(/Completed task/);

      // Verify task status in file
      const taskFile = await testEnv.getTaskFile(taskId);
      const content = await readFile(taskFile, "utf-8");
      const frontMatter = yaml.parse(content.split("---")[1]);
      expect(frontMatter.status).toBe("done");
    });
  });
});
```

## Test Implementation Requirements:

1. **Claim Task Tests** (`claimTask.e2e.test.ts`):
   - Test claiming available tasks (prerequisites completed)
   - Test claiming unavailable tasks (prerequisites incomplete)
   - Verify status change from 'open' to 'in-progress'
   - Test claiming non-existent tasks
   - Verify file updates persist claim status

2. **Complete Task Tests** (`completeTask.e2e.test.ts`):
   - Test completing in-progress tasks
   - Test completing tasks with summary and affected files
   - Verify status change to 'done'
   - Test completing non-claimed tasks (should fail)
   - Test completing already-completed tasks

3. **Append Log Tests** (`appendLog.e2e.test.ts`):
   - Test adding log entries to existing objects
   - Test log entry format and timestamps
   - Verify log entries persist in markdown files
   - Test appending to different object types
   - Test invalid object ID handling

4. **Prune Closed Tests** (`pruneClosed.e2e.test.ts`):
   - Test removing completed tasks from open directories
   - Test moving files to closed directories
   - Verify directory structure after pruning
   - Test pruning with various object types
   - Test pruning empty projects/epics/features

5. **Task Lifecycle Tests** (`taskLifecycle.e2e.test.ts`):
   - Test complete workflow: create -> claim -> work -> complete -> prune
   - Test multiple tasks with interdependencies
   - Test workflow interruptions and recovery
   - Test status transition validations

6. **Prerequisites Tests** (`prerequisites.e2e.test.ts`):
   - Test simple prerequisite chains (A -> B -> C)
   - Test complex dependency graphs
   - Test circular dependency detection
   - Test claiming behavior with partial prerequisites
   - Test prerequisite validation edge cases

### Log
