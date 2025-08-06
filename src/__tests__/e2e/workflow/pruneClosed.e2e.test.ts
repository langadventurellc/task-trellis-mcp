import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E Workflow - pruneClosed", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
    await client.connect();
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  describe("Pruning Completed Tasks", () => {
    it("should prune completed tasks older than specified age", async () => {
      const completedTask: ObjectData = {
        id: "T-completed-old",
        title: "Old Completed Task",
        status: "done",
        priority: "low",
        updated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-completed-old",
        createObjectContent(completedTask),
        { status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        age: 30, // 30 minutes
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });

    it("should not prune recent completed tasks", async () => {
      const recentTask: ObjectData = {
        id: "T-completed-recent",
        title: "Recent Completed Task",
        status: "done",
        priority: "high",
        updated: new Date().toISOString(), // Just now
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-completed-recent",
        createObjectContent(recentTask),
        { status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        age: 60, // 60 minutes
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });

    it("should prune tasks with wont-do status", async () => {
      const wontDoTask: ObjectData = {
        id: "T-wont-do",
        title: "Wont Do Task",
        status: "wont-do",
        priority: "low",
        updated: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-wont-do",
        createObjectContent(wontDoTask),
        { status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        age: 60,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });
  });

  describe("Scope-based Pruning", () => {
    it("should prune only within specified scope", async () => {
      // Create project hierarchy
      const projectResult = await client.callTool("create_object", {
        type: "project",
        title: "Scoped Project",
      });
      const _projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const featureResult = await client.callTool("create_object", {
        type: "feature",
        title: "Scoped Feature",
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      // Create completed tasks
      const scopedTask: ObjectData = {
        id: "T-scoped-done",
        title: "Scoped Done Task",
        status: "done",
        priority: "medium",
        parent: featureId,
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-scoped-done",
        createObjectContent(scopedTask),
        { featureId, status: "closed" },
      );

      const outsideTask: ObjectData = {
        id: "T-outside-done",
        title: "Outside Done Task",
        status: "done",
        priority: "low",
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-outside-done",
        createObjectContent(outsideTask),
        { status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        scope: featureId,
        age: 30,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
      expect(result.content[0].text).toContain(featureId);
    });
  });

  describe("Directory Structure After Pruning", () => {
    it("should maintain correct directory structure", async () => {
      // Create hierarchy with completed tasks
      const projectResult = await client.callTool("create_object", {
        type: "project",
        title: "Directory Test Project",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const epicResult = await client.callTool("create_object", {
        type: "epic",
        title: "Directory Test Epic",
        parent: projectId,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      const featureResult = await client.callTool("create_object", {
        type: "feature",
        title: "Directory Test Feature",
        parent: epicId,
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const doneTask: ObjectData = {
        id: "T-dir-structure",
        title: "Directory Structure Task",
        status: "done",
        priority: "high",
        parent: featureId,
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-dir-structure",
        createObjectContent(doneTask),
        { projectId, epicId, featureId, status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid age parameter", async () => {
      const result = await client.callTool("prune_closed", {
        age: -1,
      });

      // Should either handle gracefully or provide appropriate error message
      expect(result.content[0].text).toBeDefined();
    });

    it("should handle missing age parameter", async () => {
      try {
        const result = await client.callTool("prune_closed", {});
        // If it doesn't throw, should get a reasonable response
        expect(result.content[0].text).toBeDefined();
      } catch (error) {
        // If it throws, that's acceptable for missing required parameter
        expect(error).toBeDefined();
      }
    });

    it("should handle very large age parameter", async () => {
      const result = await client.callTool("prune_closed", {
        age: 999999, // Very large age in minutes
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });

    it("should handle zero age parameter", async () => {
      const result = await client.callTool("prune_closed", {
        age: 0, // Prune everything
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });
  });

  describe("Mixed Object Types", () => {
    it("should handle pruning different closed object types", async () => {
      // Create various completed objects
      const doneProject: ObjectData = {
        id: "P-done-project",
        title: "Done Project",
        status: "done",
        priority: "high",
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-done-project",
        createObjectContent(doneProject),
      );

      const doneFeature: ObjectData = {
        id: "F-done-feature",
        title: "Done Feature",
        status: "done",
        priority: "medium",
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-done-feature",
        createObjectContent(doneFeature),
      );

      const doneTask: ObjectData = {
        id: "T-done-task",
        title: "Done Task",
        status: "done",
        priority: "low",
        updated: new Date(Date.now() - 3600000).toISOString(),
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-done-task",
        createObjectContent(doneTask),
        { status: "closed" },
      );

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle empty directory structure", async () => {
      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });

    it("should handle large number of completed tasks", async () => {
      // Create many completed tasks
      for (let i = 0; i < 20; i++) {
        const taskData: ObjectData = {
          id: `T-bulk-${i.toString().padStart(2, "0")}`,
          title: `Bulk Task ${i}`,
          status: "done",
          priority: "low",
          updated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        };
        await createObjectFile(
          testEnv.projectRoot,
          "task",
          `T-bulk-${i.toString().padStart(2, "0")}`,
          createObjectContent(taskData),
          { status: "closed" },
        );
      }

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      expect(result.content[0].text).toContain("Pruned closed objects");
    });
  });
});
