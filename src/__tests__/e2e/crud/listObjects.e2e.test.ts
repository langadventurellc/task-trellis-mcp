import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  extractObjectIds,
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
      const result = await client.callTool("list_issues", {
        type: "project",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("P-test-project");
    });

    it("should list only tasks when type=task", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("T-test-task");
    });

    it("should list only epics when type=epic", async () => {
      const result = await client.callTool("list_issues", {
        type: "epic",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("E-test-epic");
    });

    it("should list only features when type=feature", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("F-test-feature");
    });

    it("should return empty array when no objects of specified type exist", async () => {
      // Test with a scope that doesn't exist to get empty results
      const result = await client.callTool("list_issues", {
        type: "task",
        scope: "E-nonexistent-epic",
      });

      const objects = extractObjectIds(result.content[0].text as string);
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
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "in-progress",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
    });

    it("should exclude closed tasks by default", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Note: Can't filter by status since only IDs are returned
      // Expect only open objects to be returned by default (3 in this case)
      expect(objects).toHaveLength(3);
    });

    it("should include closed tasks when includeClosed=true", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(5);
      // Note: Can't test individual object status since only IDs are returned
    });

    it("should filter open tasks correctly", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "open",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("T-open-task");
    });
  });

  describe("includeClosed Flag with Different Object Types", () => {
    beforeEach(async () => {
      // Create projects with different statuses
      const projectStatuses: Array<{
        status: string;
        folder: "open" | "closed";
      }> = [
        { status: "open", folder: "open" },
        { status: "done", folder: "closed" },
        { status: "wont-do", folder: "closed" },
      ];

      for (const config of projectStatuses) {
        await createObjectFile(
          testEnv.projectRoot,
          "project",
          `P-${config.status}-project`,
          createObjectContent({
            id: `P-${config.status}-project`,
            title: `${config.status} Project`,
            status: config.status,
          }),
        );
      }

      // Create a project first for epics to belong to
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-epic-container",
        createObjectContent({
          id: "P-epic-container",
          title: "Epic Container Project",
          status: "open",
        }),
      );

      // Create epics with different statuses within the project
      const epicStatuses: Array<{
        status: string;
        folder: "open" | "closed";
      }> = [
        { status: "open", folder: "open" },
        { status: "in-progress", folder: "open" },
        { status: "done", folder: "closed" },
        { status: "wont-do", folder: "closed" },
      ];

      for (const config of epicStatuses) {
        await createObjectFile(
          testEnv.projectRoot,
          "epic",
          `E-${config.status}-epic`,
          createObjectContent({
            id: `E-${config.status}-epic`,
            title: `${config.status} Epic`,
            status: config.status,
            parent: "P-epic-container",
          }),
          { projectId: "P-epic-container" },
        );
      }

      // Create features with different statuses
      const featureStatuses: Array<{
        status: string;
        folder: "open" | "closed";
      }> = [
        { status: "draft", folder: "open" },
        { status: "open", folder: "open" },
        { status: "done", folder: "closed" },
        { status: "wont-do", folder: "closed" },
      ];

      for (const config of featureStatuses) {
        await createObjectFile(
          testEnv.projectRoot,
          "feature",
          `F-${config.status}-feature`,
          createObjectContent({
            id: `F-${config.status}-feature`,
            title: `${config.status} Feature`,
            status: config.status,
          }),
        );
      }

      // Create tasks with different statuses (already covered in other tests, but adding for completeness)
      const taskStatuses: Array<{
        status: string;
        folder: "open" | "closed";
      }> = [
        { status: "draft", folder: "open" },
        { status: "open", folder: "open" },
        { status: "in-progress", folder: "open" },
        { status: "done", folder: "closed" },
        { status: "wont-do", folder: "closed" },
      ];

      for (const config of taskStatuses) {
        await createObjectFile(
          testEnv.projectRoot,
          "task",
          `T-${config.status}-includeclosed`,
          createObjectContent({
            id: `T-${config.status}-includeclosed`,
            title: `${config.status} Task`,
            status: config.status,
          }),
          { status: config.folder },
        );
      }
    });

    it("should exclude closed projects by default", async () => {
      const result = await client.callTool("list_issues", {
        type: "project",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Filter to only the objects we created in this test (excluding the epic container)
      const testObjects = objects.filter(
        (id) => id.includes("-project") && !id.includes("epic-container"),
      );
      expect(testObjects).toHaveLength(1);
      expect(testObjects).toContain("P-open-project");
      expect(testObjects).not.toContain("P-done-project");
      expect(testObjects).not.toContain("P-wont-do-project");
    });

    it("should include closed projects when includeClosed=true", async () => {
      const result = await client.callTool("list_issues", {
        type: "project",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Filter to only the objects we created in this test (excluding the epic container)
      const testObjects = objects.filter(
        (id) => id.includes("-project") && !id.includes("epic-container"),
      );
      expect(testObjects).toHaveLength(3);
      expect(testObjects).toContain("P-open-project");
      expect(testObjects).toContain("P-done-project");
      expect(testObjects).toContain("P-wont-do-project");
    });

    it("should exclude closed epics by default", async () => {
      const result = await client.callTool("list_issues", {
        type: "epic",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(2);
      expect(objects).toContain("E-open-epic");
      expect(objects).toContain("E-in-progress-epic");
      expect(objects).not.toContain("E-done-epic");
      expect(objects).not.toContain("E-wont-do-epic");
    });

    it("should include closed epics when includeClosed=true", async () => {
      const result = await client.callTool("list_issues", {
        type: "epic",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(4);
      expect(objects).toContain("E-open-epic");
      expect(objects).toContain("E-in-progress-epic");
      expect(objects).toContain("E-done-epic");
      expect(objects).toContain("E-wont-do-epic");
    });

    it("should exclude closed features by default", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(2);
      expect(objects).toContain("F-draft-feature");
      expect(objects).toContain("F-open-feature");
      expect(objects).not.toContain("F-done-feature");
      expect(objects).not.toContain("F-wont-do-feature");
    });

    it("should include closed features when includeClosed=true", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(4);
      expect(objects).toContain("F-draft-feature");
      expect(objects).toContain("F-open-feature");
      expect(objects).toContain("F-done-feature");
      expect(objects).toContain("F-wont-do-feature");
    });

    it("should exclude closed tasks by default", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Filter to only the objects we created in this test
      const testObjects = objects.filter((id) => id.includes("includeclosed"));
      expect(testObjects).toHaveLength(3);
      expect(testObjects).toContain("T-draft-includeclosed");
      expect(testObjects).toContain("T-open-includeclosed");
      expect(testObjects).toContain("T-in-progress-includeclosed");
      expect(testObjects).not.toContain("T-done-includeclosed");
      expect(testObjects).not.toContain("T-wont-do-includeclosed");
    });

    it("should include closed tasks when includeClosed=true", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Filter to only the objects we created in this test
      const testObjects = objects.filter((id) => id.includes("includeclosed"));
      expect(testObjects).toHaveLength(5);
      expect(testObjects).toContain("T-draft-includeclosed");
      expect(testObjects).toContain("T-open-includeclosed");
      expect(testObjects).toContain("T-in-progress-includeclosed");
      expect(testObjects).toContain("T-done-includeclosed");
      expect(testObjects).toContain("T-wont-do-includeclosed");
    });

    it("should work with includeClosed and status filters for projects", async () => {
      const result = await client.callTool("list_issues", {
        type: "project",
        status: "done",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects).toContain("P-done-project");
    });

    it("should work with includeClosed and status filters for epics", async () => {
      const result = await client.callTool("list_issues", {
        type: "epic",
        status: "wont-do",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects).toContain("E-wont-do-epic");
    });

    it("should return empty array when status filter requires closed objects but includeClosed=false", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        status: "done",
        includeClosed: false,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toEqual([]);
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
      const result = await client.callTool("list_issues", {
        type: "feature",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("F-high-priority");
    });

    it("should filter objects by medium priority", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        priority: "medium",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("F-medium-priority");
    });

    it("should filter objects by low priority", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        priority: "low",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("F-low-priority");
    });

    it("should return all priorities when no filter specified", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(3);
      // Note: Can't test individual priorities since only IDs are returned
      // Just verify we have all the expected feature IDs
      expect(objects).toContain("F-high-priority");
      expect(objects).toContain("F-medium-priority");
      expect(objects).toContain("F-low-priority");
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
      const result = await client.callTool("list_issues", {
        type: "epic",
        scope: "P-parent",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(2);
      expect(objects).toContain("E-child-1");
      expect(objects).toContain("E-child-2");
    });

    it("should list objects within epic scope", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        scope: "E-child-1",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("F-grandchild-1");
    });

    it("should not include objects outside of scope", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        scope: "P-parent",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("F-grandchild-1");
      expect(objects).not.toContain("F-standalone");
    });

    it("should return empty array for non-existent scope", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        scope: "P-nonexistent",
      });

      const objects = extractObjectIds(result.content[0].text as string);
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
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "open",
        priority: "high",
        scope: "P-complex",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("T-high-open");
    });

    it("should combine includeClosed with other filters", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        priority: "high",
        scope: "P-complex",
        includeClosed: true,
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(2);
      expect(objects).toContain("T-high-open");
      expect(objects).toContain("T-high-done");
    });

    it("should return empty when combined filters match nothing", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "draft",
        priority: "high",
        scope: "P-complex",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toEqual([]);
    });

    it("should combine status and priority filters", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "in-progress",
        priority: "medium",
        scope: "P-complex",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      expect(objects[0]).toBe("T-medium-progress");
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

      const result = await client.callTool("list_issues", {
        type: "project",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);

      // Note: Only object IDs are returned, not full objects
      expect(objects[0]).toBe("P-detailed");
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

      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Note: Only object IDs are returned, not full objects
      expect(objects[0]).toBe("T-minimal");
      // Note: Only IDs returned, cannot test object properties
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

      const result = await client.callTool("list_issues", {
        type: "task",
        scope: "P-hierarchy",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(1);
      // Note: Only object IDs are returned, not full objects with parent property
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
      const result = await client.callTool("list_issues", {
        type: "task",
        includeClosed: true,
      });
      const duration = Date.now() - startTime;

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toHaveLength(NUM_OBJECTS);

      // Performance check - should complete within reasonable time
      expect(duration).toBeLessThan(3000);

      // Verify all objects have correct structure
      // Note: Only IDs returned, cannot test object properties
      objects.forEach((id) => {
        expect(id).toMatch(/^T-bulk-\d{3}$/);
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

      const result = await client.callTool("list_issues", {
        type: "feature",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Note: Only IDs returned, cannot test object properties - just verify count
      expect(objects).toHaveLength(5);
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid type parameter", async () => {
      const result = await client.callTool("list_issues", {
        type: "invalid-type",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid type value: invalid-type",
      );
    });

    it("should handle invalid status parameter", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "invalid-status",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid status value: invalid-status",
      );
    });

    it("should handle invalid priority parameter", async () => {
      const result = await client.callTool("list_issues", {
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
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Should return empty array or only valid objects
      expect(Array.isArray(objects)).toBe(true);
    });

    it("should handle empty directories gracefully", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(Array.isArray(objects)).toBe(true);
      expect(objects).toEqual([]);
    });
  });

  describe("Multiple Value Filtering", () => {
    beforeEach(async () => {
      // Create diverse test objects for comprehensive filtering validation

      // Projects with different priorities
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-high-priority-multi",
        createObjectContent({
          id: "P-high-priority-multi",
          title: "High Priority Project",
          priority: "high",
          status: "open",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-medium-priority-multi",
        createObjectContent({
          id: "P-medium-priority-multi",
          title: "Medium Priority Project",
          priority: "medium",
          status: "in-progress",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-low-priority-multi",
        createObjectContent({
          id: "P-low-priority-multi",
          title: "Low Priority Project",
          priority: "low",
          status: "done",
        }),
      );

      // Epics with different statuses
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-open-multi",
        createObjectContent({
          id: "E-open-multi",
          title: "Open Epic",
          status: "open",
          priority: "high",
          parent: "P-high-priority-multi",
        }),
        { projectId: "P-high-priority-multi" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-progress-multi",
        createObjectContent({
          id: "E-progress-multi",
          title: "In Progress Epic",
          status: "in-progress",
          priority: "medium",
          parent: "P-medium-priority-multi",
        }),
        { projectId: "P-medium-priority-multi" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-done-multi",
        createObjectContent({
          id: "E-done-multi",
          title: "Done Epic",
          status: "done",
          priority: "low",
          parent: "P-low-priority-multi",
        }),
        { projectId: "P-low-priority-multi" },
      );

      // Features with various combinations
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-high-open-multi",
        createObjectContent({
          id: "F-high-open-multi",
          title: "High Priority Open Feature",
          status: "open",
          priority: "high",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-medium-progress-multi",
        createObjectContent({
          id: "F-medium-progress-multi",
          title: "Medium Priority In Progress Feature",
          status: "in-progress",
          priority: "medium",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-low-draft-multi",
        createObjectContent({
          id: "F-low-draft-multi",
          title: "Low Priority Draft Feature",
          status: "draft",
          priority: "low",
        }),
      );

      // Tasks with different combinations
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-open-high-multi",
        createObjectContent({
          id: "T-open-high-multi",
          title: "Open High Priority Task",
          status: "open",
          priority: "high",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-progress-medium-multi",
        createObjectContent({
          id: "T-progress-medium-multi",
          title: "In Progress Medium Priority Task",
          status: "in-progress",
          priority: "medium",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-done-low-multi",
        createObjectContent({
          id: "T-done-low-multi",
          title: "Done Low Priority Task",
          status: "done",
          priority: "low",
        }),
        { status: "closed" },
      );
    });

    describe("Multiple Type Filtering", () => {
      it("should filter for multiple types using array", async () => {
        const result = await client.callTool("list_issues", {
          type: ["feature", "task"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        // Should include all features and tasks, but no projects or epics
        const features = objects.filter((id) => id.startsWith("F-"));
        const tasks = objects.filter((id) => id.startsWith("T-"));
        const projects = objects.filter((id) => id.startsWith("P-"));
        const epics = objects.filter((id) => id.startsWith("E-"));

        expect(features.length).toBeGreaterThan(0);
        expect(tasks.length).toBeGreaterThan(0);
        expect(projects.length).toBe(0);
        expect(epics.length).toBe(0);
      });

      it("should filter for project and epic types", async () => {
        const result = await client.callTool("list_issues", {
          type: ["project", "epic"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        const projects = objects.filter((id) => id.startsWith("P-"));
        const epics = objects.filter((id) => id.startsWith("E-"));
        const features = objects.filter((id) => id.startsWith("F-"));
        const tasks = objects.filter((id) => id.startsWith("T-"));

        expect(projects.length).toBeGreaterThan(0);
        expect(epics.length).toBeGreaterThan(0);
        expect(features.length).toBe(0);
        expect(tasks.length).toBe(0);
      });

      it("should handle single type in array format", async () => {
        const result = await client.callTool("list_issues", {
          type: ["task"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        const tasks = objects.filter((id) => id.startsWith("T-"));
        const nonTasks = objects.filter((id) => !id.startsWith("T-"));

        expect(tasks.length).toBeGreaterThan(0);
        expect(nonTasks.length).toBe(0);
      });
    });

    describe("Multiple Status Filtering", () => {
      it("should filter for multiple statuses using array", async () => {
        const result = await client.callTool("list_issues", {
          type: "task",
          status: ["open", "in-progress"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        // Should include T-open-high-multi and T-progress-medium-multi
        expect(objects).toContain("T-open-high-multi");
        expect(objects).toContain("T-progress-medium-multi");
        expect(objects).not.toContain("T-done-low-multi");
      });

      it("should filter for draft and open statuses", async () => {
        const result = await client.callTool("list_issues", {
          type: "feature",
          status: ["draft", "open"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("F-high-open-multi");
        expect(objects).toContain("F-low-draft-multi");
        expect(objects).not.toContain("F-medium-progress-multi");
      });

      it("should handle closed statuses with includeClosed flag", async () => {
        const result = await client.callTool("list_issues", {
          type: "task",
          status: ["done", "wont-do"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("T-done-low-multi");
      });
    });

    describe("Multiple Priority Filtering", () => {
      it("should filter for multiple priorities using array", async () => {
        const result = await client.callTool("list_issues", {
          type: "feature",
          priority: ["high", "medium"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("F-high-open-multi");
        expect(objects).toContain("F-medium-progress-multi");
        expect(objects).not.toContain("F-low-draft-multi");
      });

      it("should filter for low priority across all types", async () => {
        const result = await client.callTool("list_issues", {
          type: ["project", "epic", "feature", "task"],
          priority: ["low"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("P-low-priority-multi");
        expect(objects).toContain("E-done-multi");
        expect(objects).toContain("F-low-draft-multi");
        expect(objects).toContain("T-done-low-multi");
      });

      it("should handle high and low priorities", async () => {
        const result = await client.callTool("list_issues", {
          type: "task",
          priority: ["high", "low"],
          includeClosed: true,
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("T-open-high-multi");
        expect(objects).toContain("T-done-low-multi");
        expect(objects).not.toContain("T-progress-medium-multi");
      });
    });

    describe("Combined Multiple Filters", () => {
      it("should combine multiple type and status filters", async () => {
        const result = await client.callTool("list_issues", {
          type: ["feature", "task"],
          status: ["open", "in-progress"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("F-high-open-multi");
        expect(objects).toContain("F-medium-progress-multi");
        expect(objects).toContain("T-open-high-multi");
        expect(objects).toContain("T-progress-medium-multi");
        expect(objects).not.toContain("F-low-draft-multi");
        expect(objects).not.toContain("T-done-low-multi");
      });

      it("should combine multiple filters across all parameters", async () => {
        const result = await client.callTool("list_issues", {
          type: ["feature", "task"],
          status: ["open", "in-progress"],
          priority: ["high", "medium"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("F-high-open-multi");
        expect(objects).toContain("F-medium-progress-multi");
        expect(objects).toContain("T-open-high-multi");
        expect(objects).toContain("T-progress-medium-multi");
        expect(objects).not.toContain("F-low-draft-multi");
        expect(objects).not.toContain("T-done-low-multi");
      });

      it("should apply AND logic between different filter types", async () => {
        const result = await client.callTool("list_issues", {
          type: ["task"],
          status: ["open"],
          priority: ["high"],
        });

        const objects = extractObjectIds(result.content[0].text as string);
        expect(objects).toContain("T-open-high-multi");
        expect(objects).not.toContain("T-progress-medium-multi");
        expect(objects).not.toContain("T-done-low-multi");
      });
    });
  });

  describe("Optional Type Parameter", () => {
    beforeEach(async () => {
      // Create objects of all types with same status/priority for testing
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-optional-type",
        createObjectContent({
          id: "P-optional-type",
          title: "Optional Type Project",
          status: "open",
          priority: "high",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-optional-type",
        createObjectContent({
          id: "E-optional-type",
          title: "Optional Type Epic",
          status: "open",
          priority: "high",
          parent: "P-optional-type",
        }),
        { projectId: "P-optional-type" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-optional-type",
        createObjectContent({
          id: "F-optional-type",
          title: "Optional Type Feature",
          status: "open",
          priority: "high",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-optional-type",
        createObjectContent({
          id: "T-optional-type",
          title: "Optional Type Task",
          status: "open",
          priority: "high",
        }),
        { status: "open" },
      );
    });

    it("should return all object types when type parameter is omitted", async () => {
      const result = await client.callTool("list_issues", {
        status: "open",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("P-optional-type");
      expect(objects).toContain("E-optional-type");
      expect(objects).toContain("F-optional-type");
      expect(objects).toContain("T-optional-type");
    });

    it("should filter by status across all types when type is omitted", async () => {
      // Add objects with different statuses
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-different-status",
        createObjectContent({
          id: "T-different-status",
          title: "Different Status Task",
          status: "in-progress",
          priority: "high",
        }),
        { status: "open" },
      );

      const result = await client.callTool("list_issues", {
        status: "open",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("P-optional-type");
      expect(objects).toContain("E-optional-type");
      expect(objects).toContain("F-optional-type");
      expect(objects).toContain("T-optional-type");
      expect(objects).not.toContain("T-different-status");
    });

    it("should filter by priority across all types when type is omitted", async () => {
      // Add objects with different priorities
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-different-priority",
        createObjectContent({
          id: "F-different-priority",
          title: "Different Priority Feature",
          status: "open",
          priority: "low",
        }),
      );

      const result = await client.callTool("list_issues", {
        status: "open",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("P-optional-type");
      expect(objects).toContain("E-optional-type");
      expect(objects).toContain("F-optional-type");
      expect(objects).toContain("T-optional-type");
      expect(objects).not.toContain("F-different-priority");
    });
  });

  describe("Mixed Single and Multiple Value Tests", () => {
    beforeEach(async () => {
      // Create test objects for mixed filtering scenarios
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-mixed-high-open",
        createObjectContent({
          id: "T-mixed-high-open",
          title: "Mixed High Open Task",
          status: "open",
          priority: "high",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-mixed-high-progress",
        createObjectContent({
          id: "T-mixed-high-progress",
          title: "Mixed High Progress Task",
          status: "in-progress",
          priority: "high",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-mixed-medium-open",
        createObjectContent({
          id: "T-mixed-medium-open",
          title: "Mixed Medium Open Task",
          status: "open",
          priority: "medium",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-mixed-high-open",
        createObjectContent({
          id: "F-mixed-high-open",
          title: "Mixed High Open Feature",
          status: "open",
          priority: "high",
        }),
      );
    });

    it("should handle single type with multiple statuses", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: ["open", "in-progress"],
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-mixed-high-open");
      expect(objects).toContain("T-mixed-high-progress");
      expect(objects).not.toContain("T-mixed-medium-open");
    });

    it("should handle multiple types with single status", async () => {
      const result = await client.callTool("list_issues", {
        type: ["task", "feature"],
        status: "open",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-mixed-high-open");
      expect(objects).toContain("F-mixed-high-open");
      expect(objects).not.toContain("T-mixed-high-progress");
      expect(objects).not.toContain("T-mixed-medium-open");
    });

    it("should handle single type and status with multiple priorities", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "open",
        priority: ["high", "medium"],
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-mixed-high-open");
      expect(objects).toContain("T-mixed-medium-open");
      expect(objects).not.toContain("T-mixed-high-progress");
    });

    it("should handle mixed array and single value parameters", async () => {
      const result = await client.callTool("list_issues", {
        type: ["task", "feature"],
        status: ["open", "in-progress"],
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-mixed-high-open");
      expect(objects).toContain("T-mixed-high-progress");
      expect(objects).toContain("F-mixed-high-open");
      expect(objects).not.toContain("T-mixed-medium-open");
    });
  });

  describe("Backward Compatibility Validation", () => {
    beforeEach(async () => {
      // Create objects to test that existing single-value behavior is preserved
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-compat-single",
        createObjectContent({
          id: "T-compat-single",
          title: "Compatibility Single Task",
          status: "open",
          priority: "high",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-compat-single",
        createObjectContent({
          id: "F-compat-single",
          title: "Compatibility Single Feature",
          status: "in-progress",
          priority: "medium",
        }),
      );
    });

    it("should preserve existing single value type filtering", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      const tasks = objects.filter((id) => id.startsWith("T-"));
      const nonTasks = objects.filter((id) => !id.startsWith("T-"));

      expect(tasks.length).toBeGreaterThan(0);
      expect(nonTasks.length).toBe(0);
    });

    it("should preserve existing single value status filtering", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "open",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-compat-single");
    });

    it("should preserve existing single value priority filtering", async () => {
      const result = await client.callTool("list_issues", {
        type: "feature",
        priority: "medium",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("F-compat-single");
    });

    it("should preserve existing combined single value filters", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: "open",
        priority: "high",
      });

      const objects = extractObjectIds(result.content[0].text as string);
      expect(objects).toContain("T-compat-single");
    });

    it("should maintain existing error behavior for invalid single values", async () => {
      const result = await client.callTool("list_issues", {
        type: "invalid-type",
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid type value: invalid-type",
      );
    });
  });

  describe("Error Handling for Array Inputs", () => {
    it("should handle invalid array values for type parameter", async () => {
      const result = await client.callTool("list_issues", {
        type: ["invalid-type"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid type value: invalid-type",
      );
    });

    it("should handle mixed valid and invalid values in type array", async () => {
      const result = await client.callTool("list_issues", {
        type: ["task", "invalid-type"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid type value: invalid-type",
      );
    });

    it("should handle invalid array values for status parameter", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: ["invalid-status"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid status value: invalid-status",
      );
    });

    it("should handle mixed valid and invalid values in status array", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: ["open", "invalid-status"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid status value: invalid-status",
      );
    });

    it("should handle invalid array values for priority parameter", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        priority: ["invalid-priority"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain(
        "Invalid priority value: invalid-priority",
      );
    });

    it("should handle multiple invalid values in priority array", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        priority: ["invalid1", "invalid2"],
      });

      expect(result.content[0].text).toContain("Error listing objects");
      expect(result.content[0].text).toContain("Invalid priority value");
    });

    it("should handle empty arrays as no filter provided", async () => {
      const result = await client.callTool("list_issues", {
        type: "task",
        status: [],
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Empty array should be treated as no filter, so all tasks should be returned
      expect(Array.isArray(objects)).toBe(true);
    });

    it("should return all objects when no filters are provided", async () => {
      // Create some test objects first
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-no-filter-test",
        createObjectContent({
          id: "T-no-filter-test",
          title: "No Filter Test Task",
          status: "open",
          priority: "high",
        }),
        { status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-no-filter-test",
        createObjectContent({
          id: "P-no-filter-test",
          title: "No Filter Test Project",
          status: "open",
          priority: "medium",
        }),
      );

      const result = await client.callTool("list_issues", {});

      const objects = extractObjectIds(result.content[0].text as string);
      // Should return all objects without error
      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBeGreaterThan(0);
      expect(objects).toContain("T-no-filter-test");
      expect(objects).toContain("P-no-filter-test");
    });

    it("should handle empty arrays in all parameters as no filter", async () => {
      // Create some test objects first
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-empty-array-test",
        createObjectContent({
          id: "F-empty-array-test",
          title: "Empty Array Test Feature",
          status: "open",
          priority: "low",
        }),
      );

      const result = await client.callTool("list_issues", {
        type: [],
        status: [],
        priority: [],
      });

      const objects = extractObjectIds(result.content[0].text as string);
      // Should return all objects without error
      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBeGreaterThan(0);
      expect(objects).toContain("F-empty-array-test");
    });
  });
});
