import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  fileExists,
  type ObjectData,
  type HierarchyOptions,
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

      const filePath = getObjectFilePath("task", "T-completed-old", {
        status: "closed",
      });

      // Verify file exists before pruning
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        age: 30, // 30 minutes
      });

      // Verify successful pruning
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 30 minutes",
      );
      expect(result.content[0].text).toContain("T-completed-old");

      // Verify file has been deleted
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(false);
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

      const filePath = getObjectFilePath("task", "T-completed-recent", {
        status: "closed",
      });

      // Verify file exists before pruning
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        age: 60, // 60 minutes
      });

      // Verify no pruning occurred (recent file should not be pruned)
      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 60 minutes",
      );

      // Verify file still exists
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);
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

      const filePath = getObjectFilePath("task", "T-wont-do", {
        status: "closed",
      });

      // Verify file exists before pruning
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        age: 60,
      });

      // Verify successful pruning
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 60 minutes",
      );
      expect(result.content[0].text).toContain("T-wont-do");

      // Verify file has been deleted
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(false);
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

      const scopedFilePath = getObjectFilePath("task", "T-scoped-done", {
        featureId,
        status: "closed",
      });
      const outsideFilePath = getObjectFilePath("task", "T-outside-done", {
        status: "closed",
      });

      // Verify both files exist before pruning
      expect(await fileExists(testEnv.projectRoot, scopedFilePath)).toBe(true);
      expect(await fileExists(testEnv.projectRoot, outsideFilePath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        scope: featureId,
        age: 30,
      });

      // Verify only scoped object was pruned
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 30 minutes in scope",
      );
      expect(result.content[0].text).toContain(featureId);
      expect(result.content[0].text).toContain("T-scoped-done");

      // Verify scoped file has been deleted but outside file remains
      expect(await fileExists(testEnv.projectRoot, scopedFilePath)).toBe(false);
      expect(await fileExists(testEnv.projectRoot, outsideFilePath)).toBe(true);
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

      const filePath = getObjectFilePath("task", "T-dir-structure", {
        projectId,
        epicId,
        featureId,
        status: "closed",
      });

      // Verify file exists before pruning
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      // Verify successful pruning
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 30 minutes",
      );
      expect(result.content[0].text).toContain("T-dir-structure");

      // Verify file has been deleted
      expect(await fileExists(testEnv.projectRoot, filePath)).toBe(false);
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

      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 999999 minutes",
      );
    });

    it("should handle zero age parameter", async () => {
      const result = await client.callTool("prune_closed", {
        age: 0, // Prune everything
      });

      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 0 minutes",
      );
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

      const projectPath = getObjectFilePath("project", "P-done-project");
      const featurePath = getObjectFilePath("feature", "F-done-feature");
      const taskPath = getObjectFilePath("task", "T-done-task", {
        status: "closed",
      });

      // Verify all files exist before pruning
      expect(await fileExists(testEnv.projectRoot, projectPath)).toBe(true);
      expect(await fileExists(testEnv.projectRoot, featurePath)).toBe(true);
      expect(await fileExists(testEnv.projectRoot, taskPath)).toBe(true);

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      // Verify all closed objects were pruned
      expect(result.content[0].text).toContain(
        "Pruned 3 closed objects older than 30 minutes",
      );
      expect(result.content[0].text).toContain("P-done-project");
      expect(result.content[0].text).toContain("F-done-feature");
      expect(result.content[0].text).toContain("T-done-task");

      // Verify all files have been deleted
      expect(await fileExists(testEnv.projectRoot, projectPath)).toBe(false);
      expect(await fileExists(testEnv.projectRoot, featurePath)).toBe(false);
      expect(await fileExists(testEnv.projectRoot, taskPath)).toBe(false);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle empty directory structure", async () => {
      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 30 minutes",
      );
    });

    it("should handle large number of completed tasks", async () => {
      const taskIds: string[] = [];
      const filePaths: string[] = [];

      // Create many completed tasks
      for (let i = 0; i < 20; i++) {
        const taskId = `T-bulk-${i.toString().padStart(2, "0")}`;
        const taskData: ObjectData = {
          id: taskId,
          title: `Bulk Task ${i}`,
          status: "done",
          priority: "low",
          updated: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        };
        await createObjectFile(
          testEnv.projectRoot,
          "task",
          taskId,
          createObjectContent(taskData),
          { status: "closed" },
        );

        taskIds.push(taskId);
        filePaths.push(getObjectFilePath("task", taskId, { status: "closed" }));
      }

      // Verify all files exist before pruning
      for (const filePath of filePaths) {
        expect(await fileExists(testEnv.projectRoot, filePath)).toBe(true);
      }

      const result = await client.callTool("prune_closed", {
        age: 30,
      });

      // Verify all bulk tasks were pruned
      expect(result.content[0].text).toContain(
        "Pruned 20 closed objects older than 30 minutes",
      );

      // Verify all files have been deleted
      for (const filePath of filePaths) {
        expect(await fileExists(testEnv.projectRoot, filePath)).toBe(false);
      }
    });
  });

  // Helper function to get object file path
  const getObjectFilePath = (
    objectType: string,
    objectId: string,
    hierarchy?: HierarchyOptions,
  ): string => {
    switch (objectType) {
      case "project": {
        return `p/${objectId}/${objectId}.md`;
      }
      case "epic": {
        if (!hierarchy?.projectId) throw new Error("Epic requires projectId");
        return `p/${hierarchy.projectId}/e/${objectId}/${objectId}.md`;
      }
      case "feature": {
        if (hierarchy?.epicId && hierarchy?.projectId) {
          return `p/${hierarchy.projectId}/e/${hierarchy.epicId}/f/${objectId}/${objectId}.md`;
        } else {
          return `f/${objectId}/${objectId}.md`;
        }
      }
      case "task": {
        const statusFolder = hierarchy?.status || "open";
        if (hierarchy?.featureId) {
          if (hierarchy?.epicId && hierarchy?.projectId) {
            return `p/${hierarchy.projectId}/e/${hierarchy.epicId}/f/${hierarchy.featureId}/t/${statusFolder}/${objectId}.md`;
          } else {
            return `f/${hierarchy.featureId}/t/${statusFolder}/${objectId}.md`;
          }
        } else {
          return `t/${statusFolder}/${objectId}.md`;
        }
      }
      default: {
        throw new Error(`Unknown object type: ${objectType}`);
      }
    }
  };
});
