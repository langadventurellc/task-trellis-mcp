import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  parseListObjectsResponse,
} from "../utils";

describe("E2E CRUD - listObjects", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
    await client.connect();

    // Activate server in local mode
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  describe("Type Filtering", () => {
    beforeEach(async () => {
      // Create test objects of each type
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-test-project",
        createObjectContent({
          id: "P-test-project",
          title: "Test Project",
          status: "open",
          priority: "high",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-test-epic",
        createObjectContent({
          id: "E-test-epic",
          title: "Test Epic",
          status: "in-progress",
          parent: "P-test-project",
        }),
        { projectId: "P-test-project" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-test-feature",
        createObjectContent({
          id: "F-test-feature",
          title: "Test Feature",
          status: "open",
          priority: "medium",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-test-task",
        createObjectContent({
          id: "T-test-task",
          title: "Test Task",
          status: "open",
          priority: "low",
        }),
        { status: "open" },
      );
    });

    it("should list only projects when type=project", async () => {
      const result = await client.callTool("list_objects", {
        type: "project",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("P-test-project");
      expect(objects[0].type).toBe("project");
    });

    it("should list only tasks when type=task", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("T-test-task");
      expect(objects[0].type).toBe("task");
    });

    it("should list only epics when type=epic", async () => {
      const result = await client.callTool("list_objects", {
        type: "epic",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("E-test-epic");
      expect(objects[0].type).toBe("epic");
    });

    it("should list only features when type=feature", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("F-test-feature");
      expect(objects[0].type).toBe("feature");
    });

    it("should return empty array when no objects of specified type exist", async () => {
      // Test with a scope that doesn't exist to get empty results
      const result = await client.callTool("list_objects", {
        type: "task",
        scope: "E-nonexistent-epic",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toEqual([]);
    });
  });

  describe("Status Filtering", () => {
    beforeEach(async () => {
      // Create tasks with different statuses
      const statuses = ["draft", "open", "in-progress", "done", "wont-do"];
      for (const status of statuses) {
        const taskId = `T-${status}-task`;
        const folder =
          status === "done" || status === "wont-do" ? "closed" : "open";

        await createObjectFile(
          testEnv.projectRoot,
          "task",
          taskId,
          createObjectContent({
            id: taskId,
            title: `${status} Task`,
            status: status,
          }),
          { status: folder },
        );
      }
    });

    it("should filter objects by status", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "in-progress",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].status).toBe("in-progress");
    });

    it("should exclude closed tasks by default", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      const closedTasks = objects.filter(
        (o) => o.status === "done" || o.status === "wont-do",
      );
      expect(closedTasks).toHaveLength(0);
    });

    it("should include closed tasks when includeClosed=true", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        includeClosed: true,
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(5);
      const closedTasks = objects.filter(
        (o) => o.status === "done" || o.status === "wont-do",
      );
      expect(closedTasks).toHaveLength(2);
    });

    it("should filter open tasks correctly", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "open",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].status).toBe("open");
      expect(objects[0].id).toBe("T-open-task");
    });
  });

  describe("Priority Filtering", () => {
    beforeEach(async () => {
      const priorities = ["high", "medium", "low"];

      for (const priority of priorities) {
        await createObjectFile(
          testEnv.projectRoot,
          "feature",
          `F-${priority}-priority`,
          createObjectContent({
            id: `F-${priority}-priority`,
            title: `${priority} Priority Feature`,
            priority: priority,
          }),
        );
      }
    });

    it("should filter objects by priority", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
        priority: "high",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].priority).toBe("high");
      expect(objects[0].id).toBe("F-high-priority");
    });

    it("should filter objects by medium priority", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
        priority: "medium",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].priority).toBe("medium");
      expect(objects[0].id).toBe("F-medium-priority");
    });

    it("should filter objects by low priority", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
        priority: "low",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].priority).toBe("low");
      expect(objects[0].id).toBe("F-low-priority");
    });

    it("should return all priorities when no filter specified", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(3);
      const priorities = objects.map((o) => o.priority);
      expect(priorities).toContain("high");
      expect(priorities).toContain("medium");
      expect(priorities).toContain("low");
    });
  });

  describe("Scope Filtering", () => {
    beforeEach(async () => {
      // Create hierarchical structure
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-parent",
        createObjectContent({
          id: "P-parent",
          title: "Parent Project",
          childrenIds: ["E-child-1", "E-child-2"],
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-child-1",
        createObjectContent({
          id: "E-child-1",
          title: "Child Epic 1",
          parent: "P-parent",
          childrenIds: ["F-grandchild-1"],
        }),
        { projectId: "P-parent" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-child-2",
        createObjectContent({
          id: "E-child-2",
          title: "Child Epic 2",
          parent: "P-parent",
        }),
        { projectId: "P-parent" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-grandchild-1",
        createObjectContent({
          id: "F-grandchild-1",
          title: "Grandchild Feature",
          parent: "E-child-1",
        }),
        { projectId: "P-parent", epicId: "E-child-1" },
      );

      // Create standalone objects outside scope
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-standalone",
        createObjectContent({
          id: "F-standalone",
          title: "Standalone Feature",
        }),
      );
    });

    it("should list objects within project scope", async () => {
      const result = await client.callTool("list_objects", {
        type: "epic",
        scope: "P-parent",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(2);
      expect(objects.map((o) => o.id)).toContain("E-child-1");
      expect(objects.map((o) => o.id)).toContain("E-child-2");
    });

    it("should list objects within epic scope", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
        scope: "E-child-1",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("F-grandchild-1");
    });

    it("should not include objects outside of scope", async () => {
      const result = await client.callTool("list_objects", {
        type: "feature",
        scope: "P-parent",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects.map((o) => o.id)).toContain("F-grandchild-1");
      expect(objects.map((o) => o.id)).not.toContain("F-standalone");
    });

    it("should return empty array for non-existent scope", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        scope: "P-nonexistent",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toEqual([]);
    });
  });

  describe("Combined Filters", () => {
    beforeEach(async () => {
      // Create complex hierarchy with varied attributes
      const projectId = "P-complex";
      const epicId = "E-complex";
      const featureId = "F-complex";

      // Create project
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        projectId,
        createObjectContent({
          id: projectId,
          title: "Complex Project",
        }),
      );

      // Create epic within project
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        epicId,
        createObjectContent({
          id: epicId,
          title: "Complex Epic",
          parent: projectId,
        }),
        { projectId },
      );

      // Create feature within epic
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        featureId,
        createObjectContent({
          id: featureId,
          title: "Complex Feature",
          parent: epicId,
        }),
        { projectId, epicId },
      );

      // Create tasks with various combinations within the feature
      const taskConfigs: Array<{
        id: string;
        status: string;
        priority: string;
        folder: "open" | "closed";
      }> = [
        { id: "T-high-open", status: "open", priority: "high", folder: "open" },
        {
          id: "T-high-done",
          status: "done",
          priority: "high",
          folder: "closed",
        },
        {
          id: "T-medium-progress",
          status: "in-progress",
          priority: "medium",
          folder: "open",
        },
        { id: "T-low-open", status: "open", priority: "low", folder: "open" },
      ];

      for (const config of taskConfigs) {
        await createObjectFile(
          testEnv.projectRoot,
          "task",
          config.id,
          createObjectContent({
            id: config.id,
            title: `Task ${config.id}`,
            status: config.status,
            priority: config.priority,
            parent: featureId,
          }),
          {
            projectId,
            epicId,
            featureId,
            status: config.folder,
          },
        );
      }
    });

    it("should apply multiple filters simultaneously", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "open",
        priority: "high",
        scope: "P-complex",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("T-high-open");
    });

    it("should combine includeClosed with other filters", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        priority: "high",
        scope: "P-complex",
        includeClosed: true,
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(2);
      expect(objects.map((o) => o.id)).toContain("T-high-open");
      expect(objects.map((o) => o.id)).toContain("T-high-done");
    });

    it("should return empty when combined filters match nothing", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "draft",
        priority: "high",
        scope: "P-complex",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toEqual([]);
    });

    it("should combine status and priority filters", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "in-progress",
        priority: "medium",
        scope: "P-complex",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].id).toBe("T-medium-progress");
    });
  });

  describe("Object Structure Validation", () => {
    it("should return complete object structure for each item", async () => {
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-detailed",
        createObjectContent({
          id: "P-detailed",
          title: "Detailed Project",
          status: "open",
          priority: "high",
          prerequisites: ["P-dep1", "P-dep2"],
          affectedFiles: { "src/index.ts": "Main file" },
          log: ["Created", "Updated"],
          schema: "1.1",
          childrenIds: ["E-child"],
          body: "Project description",
        }),
      );

      // Create the expected child epic
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-child",
        createObjectContent({
          id: "E-child",
          title: "Child Epic",
          parent: "P-detailed",
        }),
        { projectId: "P-detailed" },
      );

      const result = await client.callTool("list_objects", {
        type: "project",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);

      const project = objects[0];
      expect(project).toMatchObject({
        id: "P-detailed",
        type: "project",
        title: "Detailed Project",
        status: "open",
        priority: "high",
        prerequisites: ["P-dep1", "P-dep2"],
        log: ["Created", "Updated"],
        schema: "1.1",
        childrenIds: ["E-child"],
        body: "Project description",
      });

      // Verify no parent field for projects
      expect(project.parent).toBeUndefined();
    });

    it("should handle objects with minimal fields", async () => {
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-minimal",
        createObjectContent({
          id: "T-minimal",
          title: "Minimal Task",
        }),
        { status: "open" },
      );

      const result = await client.callTool("list_objects", {
        type: "task",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      const task = objects[0];

      expect(task.id).toBe("T-minimal");
      expect(task.title).toBe("Minimal Task");
      expect(task.status).toBe("open");
      expect(task.priority).toBe("medium");
      expect(task.prerequisites).toEqual([]);
      expect(task.body).toBe("");
    });

    it("should preserve object hierarchy relationships", async () => {
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-hierarchy",
        createObjectContent({
          id: "P-hierarchy",
          title: "Hierarchy Project",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-hierarchy",
        createObjectContent({
          id: "E-hierarchy",
          title: "Hierarchy Epic",
          parent: "P-hierarchy",
        }),
        { projectId: "P-hierarchy" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-hierarchy",
        createObjectContent({
          id: "F-hierarchy",
          title: "Hierarchy Feature",
          parent: "E-hierarchy",
        }),
        { projectId: "P-hierarchy", epicId: "E-hierarchy" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-hierarchy",
        createObjectContent({
          id: "T-hierarchy",
          title: "Hierarchy Task",
          parent: "F-hierarchy",
        }),
        {
          projectId: "P-hierarchy",
          epicId: "E-hierarchy",
          featureId: "F-hierarchy",
          status: "open",
        },
      );

      const result = await client.callTool("list_objects", {
        type: "task",
        scope: "P-hierarchy",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(1);
      expect(objects[0].parent).toBe("F-hierarchy");
    });
  });

  describe("Large Dataset Handling", () => {
    it("should handle listing many objects efficiently", async () => {
      const NUM_OBJECTS = 20; // Reduced for faster test execution

      // Create many tasks
      for (let i = 0; i < NUM_OBJECTS; i++) {
        const priority = ["high", "medium", "low"][i % 3];
        const status = ["open", "in-progress", "done"][i % 3];
        const folder: "open" | "closed" = status === "done" ? "closed" : "open";

        await createObjectFile(
          testEnv.projectRoot,
          "task",
          `T-bulk-${i.toString().padStart(3, "0")}`,
          createObjectContent({
            id: `T-bulk-${i.toString().padStart(3, "0")}`,
            title: `Bulk Task ${i}`,
            status: status,
            priority: priority,
          }),
          { status: folder },
        );
      }

      const startTime = Date.now();
      const result = await client.callTool("list_objects", {
        type: "task",
        includeClosed: true,
      });
      const duration = Date.now() - startTime;

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(NUM_OBJECTS);

      // Performance check - should complete within reasonable time
      expect(duration).toBeLessThan(3000);

      // Verify all objects have correct structure
      objects.forEach((obj) => {
        expect(obj.id).toMatch(/^T-bulk-\d{3}$/);
        expect(obj.type).toBe("task");
        expect(obj.title).toMatch(/^Bulk Task \d+$/);
      });
    });

    it("should filter large datasets correctly", async () => {
      const NUM_OBJECTS = 15;

      for (let i = 0; i < NUM_OBJECTS; i++) {
        const priority = i < 5 ? "high" : i < 10 ? "medium" : "low";

        await createObjectFile(
          testEnv.projectRoot,
          "feature",
          `F-filter-${i.toString().padStart(3, "0")}`,
          createObjectContent({
            id: `F-filter-${i.toString().padStart(3, "0")}`,
            title: `Filter Feature ${i}`,
            priority: priority,
          }),
        );
      }

      const result = await client.callTool("list_objects", {
        type: "feature",
        priority: "high",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(objects).toHaveLength(5);
      expect(objects.every((o) => o.priority === "high")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid type parameter", async () => {
      const result = await client.callTool("list_objects", {
        type: "invalid-type",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid type value: invalid-type",
      );
    });

    it("should handle invalid status parameter", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        status: "invalid-status",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid status value: invalid-status",
      );
    });

    it("should handle invalid priority parameter", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
        priority: "critical",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid priority value: critical",
      );
    });

    it("should handle malformed object files gracefully", async () => {
      // Create an invalid markdown file
      const fs = await import("fs/promises");
      const path = await import("path");
      const invalidPath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "t",
        "open",
        "T-invalid.md",
      );
      await fs.mkdir(path.dirname(invalidPath), { recursive: true });
      await fs.writeFile(
        invalidPath,
        "Invalid YAML content\n---\nBody",
        "utf-8",
      );

      // Should skip invalid files and continue
      const result = await client.callTool("list_objects", {
        type: "task",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      // Should return empty array or only valid objects
      expect(Array.isArray(objects)).toBe(true);
    });

    it("should handle empty directories gracefully", async () => {
      const result = await client.callTool("list_objects", {
        type: "task",
      });

      const objects = parseListObjectsResponse(
        result.content[0].text as string,
      );
      expect(Array.isArray(objects)).toBe(true);
      expect(objects).toEqual([]);
    });
  });
});
