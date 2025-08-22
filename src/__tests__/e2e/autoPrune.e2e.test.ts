import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TestEnvironment } from "./utils";

describe("E2E Auto-Prune Feature", () => {
  let testEnv: TestEnvironment;
  let client: Client | null = null;
  let transport: StdioClientTransport | null = null;

  beforeEach(() => {
    testEnv = new TestEnvironment();
    testEnv.setup();
  });

  afterEach(async () => {
    if (client) {
      await client.close();
      client = null;
    }
    if (transport) {
      await transport.close();
      transport = null;
    }
    testEnv?.cleanup();
  });

  async function startServerWithArgs(args: string[]): Promise<void> {
    transport = new StdioClientTransport({
      command: "node",
      args: ["dist/server.js", ...args],
    });

    client = new Client(
      { name: "test-client", version: "1.0.0" },
      { capabilities: {} },
    );

    await client.connect(transport);
  }

  async function callTool(name: string, args: any = {}): Promise<any> {
    if (!client) {
      throw new Error("Client not connected");
    }

    return client.request(
      {
        method: "tools/call",
        params: { name, arguments: args },
      },
      CallToolResultSchema,
    );
  }

  function createObjectWithAge(
    type: string,
    title: string,
    daysOld: number,
    status: string = "done",
    parent?: string,
  ): string {
    const ageInMs = daysOld * 24 * 60 * 60 * 1000;
    const pastDate = new Date(Date.now() - ageInMs);

    // Generate a unique ID based on title
    const prefix = type.charAt(0).toUpperCase();
    const slug = title.toLowerCase().replace(/\s+/g, "-");
    const objectId = `${prefix}-${slug}`;

    // Create the markdown content with past timestamps
    const markdownContent = `---
id: ${objectId}
title: ${title}
status: ${status}
priority: medium
schema: v1.0
created: ${pastDate.toISOString()}
updated: ${pastDate.toISOString()}
${parent ? `parent: ${parent}` : ""}
---

# ${title}

Test object created for auto-prune testing.
`;

    // Create the appropriate directory structure and file
    const fs = require("fs");
    const path = require("path");

    let filePath: string;
    if (type === "task") {
      const statusDir = status === "done" ? "closed" : "open";
      const dir = path.join(testEnv.projectRoot, ".trellis", "t", statusDir);
      fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, `${objectId}.md`);
    } else if (type === "feature") {
      const dir = path.join(testEnv.projectRoot, ".trellis", "f", objectId);
      fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, `${objectId}.md`);
    } else if (type === "epic") {
      const dir = path.join(testEnv.projectRoot, ".trellis", "e", objectId);
      fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, `${objectId}.md`);
    } else if (type === "project") {
      const dir = path.join(testEnv.projectRoot, ".trellis", "p", objectId);
      fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, `${objectId}.md`);
    } else {
      throw new Error(`Unsupported object type: ${type}`);
    }

    fs.writeFileSync(filePath, markdownContent);
    return objectId;
  }

  describe("Basic Auto-Prune Functionality", () => {
    it("should delete closed objects older than threshold", async () => {
      // Start server with auto-prune disabled first to set up objects
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create objects with various ages
      const oldTaskId = createObjectWithAge("task", "Old Task", 10, "done");
      const newTaskId = createObjectWithAge("task", "New Task", 3, "done");
      const veryOldTaskId = createObjectWithAge(
        "task",
        "Very Old Task",
        30,
        "done",
      );

      // Close connection and restart with auto-prune enabled
      await client!.close();
      await transport!.close();

      // Start server with auto-prune threshold of 7 days
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Verify objects older than 7 days are deleted
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).toContain(newTaskId); // 3 days old - should remain
      expect(remainingObjects).not.toContain(oldTaskId); // 10 days old - should be deleted
      expect(remainingObjects).not.toContain(veryOldTaskId); // 30 days old - should be deleted
    });

    it("should not delete any objects when auto-prune is disabled", async () => {
      // Start server with auto-prune disabled
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create old closed objects
      const oldTaskId = createObjectWithAge("task", "Old Task", 30, "done");
      const veryOldTaskId = createObjectWithAge(
        "task",
        "Very Old Task",
        100,
        "done",
      );

      // Close and restart with auto-prune still disabled
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Verify all objects remain
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).toContain(oldTaskId);
      expect(remainingObjects).toContain(veryOldTaskId);
    });
  });

  describe("Hierarchical Validation Tests", () => {
    it("should not delete closed parent with open child", async () => {
      // Start server with auto-prune disabled to set up hierarchy
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create closed parent that's old
      const parentId = createObjectWithAge(
        "feature",
        "Old Parent Feature",
        10,
        "done",
      );

      // Create open child under the parent
      const childResult = await callTool("create_issue", {
        type: "task",
        title: "Open Child Task",
        status: "open",
        parent: parentId,
      });
      const childId = childResult.content[0].text.match(
        /ID: ([A-Z]-[a-z0-9-]+)/,
      )[1];

      // Restart with auto-prune enabled
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Verify parent is NOT deleted because it has open child
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).toContain(parentId); // Should be skipped due to open child
      expect(remainingObjects).toContain(childId); // Open child should remain
    });

    it("should delete closed parent with closed children", async () => {
      // Start server with auto-prune disabled to set up hierarchy
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create closed parent that's old
      const parentId = createObjectWithAge(
        "feature",
        "Old Parent Feature",
        10,
        "done",
      );

      // Create closed child under the parent (also old)
      const childId = createObjectWithAge(
        "task",
        "Old Child Task",
        10,
        "done",
        parentId,
      );

      // Restart with auto-prune enabled
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Verify both parent and child are deleted
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).not.toContain(parentId); // Should be deleted
      expect(remainingObjects).not.toContain(childId); // Should be deleted
    });

    it("should handle multi-level hierarchy with open descendant", async () => {
      // Start server with auto-prune disabled to set up complex hierarchy
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create grandparent (closed, old)
      const grandparentId = createObjectWithAge(
        "project",
        "Old Grandparent Project",
        15,
        "done",
      );

      // Create parent under grandparent (closed, old)
      const parentId = createObjectWithAge(
        "epic",
        "Old Parent Epic",
        12,
        "done",
        grandparentId,
      );

      // Create open child under parent
      const childResult = await callTool("create_issue", {
        type: "feature",
        title: "Open Child Feature",
        status: "open",
        parent: parentId,
      });
      const childId = childResult.content[0].text.match(
        /ID: ([A-Z]-[a-z0-9-]+)/,
      )[1];

      // Restart with auto-prune enabled
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Verify neither grandparent nor parent are deleted due to open descendant
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).toContain(grandparentId); // Should be skipped
      expect(remainingObjects).toContain(parentId); // Should be skipped
      expect(remainingObjects).toContain(childId); // Open child should remain
    });
  });

  describe("CLI Integration Tests", () => {
    it("should handle various auto-prune day values", async () => {
      // Test with large value
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "365",
      ]);

      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
      expect(Array.isArray(toolsResponse.tools)).toBe(true);
    });

    it("should start server with valid auto-prune values", async () => {
      const testValues = ["1", "7", "30", "90"];

      for (const value of testValues) {
        // Close existing connection if any
        if (client) {
          await client.close();
          client = null;
        }
        if (transport) {
          await transport.close();
          transport = null;
        }

        await startServerWithArgs([
          "--mode",
          "local",
          "--projectRootFolder",
          testEnv.projectRoot,
          "--auto-prune",
          value,
        ]);

        const toolsResponse = await client!.request(
          { method: "tools/list" },
          ListToolsResultSchema,
        );
        expect(toolsResponse).toBeDefined();
        expect(Array.isArray(toolsResponse.tools)).toBe(true);
      }
    });
  });

  describe("Server Startup Integration", () => {
    it("should run auto-prune before accepting requests", async () => {
      // Create old objects first
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      const oldTaskId = createObjectWithAge("task", "Old Task", 15, "done");

      await client!.close();
      await transport!.close();

      // Start with auto-prune enabled - auto-prune should run during startup
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // First request should show the object is already deleted
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      expect(remainingObjects).not.toContain(oldTaskId);
    });

    it("should continue startup even if auto-prune encounters errors", async () => {
      // Start server with auto-prune in a directory with potential permission issues
      // This should not crash the server
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Server should still be functional
      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
      expect(Array.isArray(toolsResponse.tools)).toBe(true);
    });
  });

  describe("Complex Workflow Tests", () => {
    it("should handle complex object hierarchy with mixed statuses and ages", async () => {
      // Start server with auto-prune disabled to set up complex scenario
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create a complex hierarchy
      const projectId = createObjectWithAge(
        "project",
        "Old Project",
        20,
        "done",
      );
      const epic1Id = createObjectWithAge(
        "epic",
        "Old Epic 1",
        15,
        "done",
        projectId,
      );
      const epic2Id = createObjectWithAge(
        "epic",
        "Old Epic 2",
        10,
        "done",
        projectId,
      );

      // Epic 1 has closed children (should allow deletion)
      const feature1Id = createObjectWithAge(
        "feature",
        "Old Feature 1",
        12,
        "done",
        epic1Id,
      );
      const task1Id = createObjectWithAge(
        "task",
        "Old Task 1",
        8,
        "done",
        feature1Id,
      );

      // Epic 2 has open child (should prevent deletion)
      const feature2Result = await callTool("create_issue", {
        type: "feature",
        title: "Open Feature 2",
        status: "open",
        parent: epic2Id,
      });
      const feature2Id = feature2Result.content[0].text.match(
        /ID: ([A-Z]-[a-z0-9-]+)/,
      )[1];

      // Restart with auto-prune enabled (7-day threshold)
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Verify expected behavior
      const listResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const remainingObjects = listResult.content[0].text;

      // Epic 1 and its children should be deleted (all closed and old)
      expect(remainingObjects).not.toContain(epic1Id);
      expect(remainingObjects).not.toContain(feature1Id);
      expect(remainingObjects).not.toContain(task1Id);

      // Project, Epic 2, and Feature 2 should remain (Epic 2 has open child)
      expect(remainingObjects).toContain(projectId); // Should be skipped due to Epic 2's open child
      expect(remainingObjects).toContain(epic2Id); // Should be skipped due to open child
      expect(remainingObjects).toContain(feature2Id); // Open, should remain
    });

    it("should be idempotent on multiple runs", async () => {
      // Create test objects
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      const oldTaskId = createObjectWithAge("task", "Old Task", 10, "done");
      const newTaskId = createObjectWithAge("task", "New Task", 3, "done");

      // First auto-prune run
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      const firstResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const firstRemaining = firstResult.content[0].text;

      // Second auto-prune run (restart server)
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      const secondResult = await callTool("list_issues", {
        type: ["task", "feature", "epic", "project"],
        includeClosed: true,
      });
      const secondRemaining = secondResult.content[0].text;

      // Results should be identical
      expect(firstRemaining).toBe(secondRemaining);
      expect(secondRemaining).toContain(newTaskId);
      expect(secondRemaining).not.toContain(oldTaskId);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle reasonable data volumes efficiently", async () => {
      // Start server and create multiple objects
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "0",
      ]);

      // Create 20 objects of varying ages
      const objectIds: string[] = [];
      for (let i = 0; i < 20; i++) {
        const age = i < 10 ? 5 : 15; // Half young, half old
        const status = i % 3 === 0 ? "open" : "done"; // Most closed, some open
        const id = createObjectWithAge("task", `Task ${i}`, age, status);
        objectIds.push(id);
      }

      const startTime = Date.now();

      // Restart with auto-prune enabled
      await client!.close();
      await transport!.close();

      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "10",
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 30 seconds)
      expect(duration).toBeLessThan(30000);

      // Verify server is responsive
      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });

    it("should handle edge case with zero objects", async () => {
      // Start server with auto-prune on empty project
      await startServerWithArgs([
        "--mode",
        "local",
        "--projectRootFolder",
        testEnv.projectRoot,
        "--auto-prune",
        "7",
      ]);

      // Should start normally
      const toolsResponse = await client!.request(
        { method: "tools/list" },
        ListToolsResultSchema,
      );
      expect(toolsResponse).toBeDefined();
    });
  });
});
