import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  readObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E Workflow - claimTask", () => {
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

  describe("Claiming Available Tasks", () => {
    it("should claim open task with no prerequisites", async () => {
      // Create task
      const taskData: ObjectData = {
        id: "T-available-task",
        title: "Available Task",
        status: "open",
        priority: "high",
        body: "Task ready to claim",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-available-task",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-available-task",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify status change
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-available-task.md",
      );
      expect(file.yaml.status).toBe("in-progress");
    });

    it("should claim task with completed prerequisites", async () => {
      // Create prerequisite task (completed)
      const prereqData: ObjectData = {
        id: "T-prerequisite",
        title: "Prerequisite Task",
        status: "done",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prerequisite",
        createObjectContent(prereqData),
        { status: "closed" },
      );

      // Create main task
      const taskData: ObjectData = {
        id: "T-dependent-task",
        title: "Dependent Task",
        status: "open",
        priority: "high",
        prerequisites: ["T-prerequisite"],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-dependent-task",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-dependent-task",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");
    });
  });

  describe("Claiming Unavailable Tasks", () => {
    it("should fail to claim task with incomplete prerequisites", async () => {
      // Create incomplete prerequisite
      const prereqData: ObjectData = {
        id: "T-incomplete-prereq",
        title: "Incomplete Prerequisite",
        status: "open",
        priority: "high",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-incomplete-prereq",
        createObjectContent(prereqData),
      );

      // Create dependent task
      const taskData: ObjectData = {
        id: "T-blocked-task",
        title: "Blocked Task",
        status: "open",
        priority: "medium",
        prerequisites: ["T-incomplete-prereq"],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-blocked-task",
        createObjectContent(taskData),
      );

      // Try to claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-blocked-task",
      });

      expect(result.content[0].text).toContain(
        "Not all prerequisites are complete",
      );
    });

    it("should fail to claim non-existent task", async () => {
      const result = await client.callTool("claim_task", {
        taskId: "T-nonexistent",
      });

      expect(result.content[0].text).toContain("not found");
    });

    it("should fail to claim already in-progress task", async () => {
      const taskData: ObjectData = {
        id: "T-in-progress",
        title: "In Progress Task",
        status: "in-progress",
        priority: "high",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-in-progress",
        createObjectContent(taskData),
      );

      const result = await client.callTool("claim_task", {
        taskId: "T-in-progress",
      });

      expect(result.content[0].text).toContain("cannot be claimed");
    });
  });

  describe("Force Claiming", () => {
    it("should force claim task with incomplete prerequisites", async () => {
      const taskData: ObjectData = {
        id: "T-force-claim",
        title: "Force Claim Task",
        status: "open",
        priority: "high",
        prerequisites: ["T-incomplete"],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-force-claim",
        createObjectContent(taskData),
      );

      const result = await client.callTool("claim_task", {
        taskId: "T-force-claim",
        force: true,
      });

      expect(result.content[0].text).toContain("Successfully claimed task");
    });
  });

  describe("Auto-selection", () => {
    it("should claim highest priority available task when no taskId specified", async () => {
      // Create multiple tasks
      const tasks = [
        { id: "T-low", title: "Low Priority", status: "open", priority: "low" },
        {
          id: "T-high",
          title: "High Priority",
          status: "open",
          priority: "high",
        },
        {
          id: "T-medium",
          title: "Medium Priority",
          status: "open",
          priority: "medium",
        },
      ];

      for (const task of tasks) {
        await createObjectFile(
          testEnv.projectRoot,
          "task",
          task.id,
          createObjectContent(task as ObjectData),
        );
      }

      const result = await client.callTool("claim_task", {});

      expect(result.content[0].text).toContain("T-high");
    });
  });

  describe("Parent Hierarchy Updates", () => {
    it("should update feature parent to in-progress when claiming task", async () => {
      // Create feature parent
      const featureData: ObjectData = {
        id: "F-test-feature",
        title: "Test Feature",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-test-feature",
        createObjectContent(featureData),
      );

      // Create task with parent
      const taskData: ObjectData = {
        id: "T-hierarchy-task",
        title: "Hierarchy Task",
        status: "open",
        priority: "high",
        parent: "F-test-feature",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-hierarchy-task",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-hierarchy-task",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify task status
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-hierarchy-task.md",
      );
      expect(taskFile.yaml.status).toBe("in-progress");

      // Verify feature parent status
      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        "f/open/F-test-feature.md",
      );
      expect(featureFile.yaml.status).toBe("in-progress");
    });

    it("should update full hierarchy (project → epic → feature → task)", async () => {
      // Create project
      const projectData: ObjectData = {
        id: "P-test-project",
        title: "Test Project",
        status: "open",
        priority: "high",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-test-project",
        createObjectContent(projectData),
      );

      // Create epic with project parent
      const epicData: ObjectData = {
        id: "E-test-epic",
        title: "Test Epic",
        status: "open",
        priority: "high",
        parent: "P-test-project",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-test-epic",
        createObjectContent(epicData),
      );

      // Create feature with epic parent
      const featureData: ObjectData = {
        id: "F-full-hierarchy",
        title: "Full Hierarchy Feature",
        status: "open",
        priority: "medium",
        parent: "E-test-epic",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-full-hierarchy",
        createObjectContent(featureData),
      );

      // Create task with feature parent
      const taskData: ObjectData = {
        id: "T-full-hierarchy",
        title: "Full Hierarchy Task",
        status: "open",
        priority: "high",
        parent: "F-full-hierarchy",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-full-hierarchy",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-full-hierarchy",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify all levels are in-progress
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-full-hierarchy.md",
      );
      expect(taskFile.yaml.status).toBe("in-progress");

      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        "f/open/F-full-hierarchy.md",
      );
      expect(featureFile.yaml.status).toBe("in-progress");

      const epicFile = await readObjectFile(
        testEnv.projectRoot,
        "e/open/E-test-epic.md",
      );
      expect(epicFile.yaml.status).toBe("in-progress");

      const projectFile = await readObjectFile(
        testEnv.projectRoot,
        "p/open/P-test-project.md",
      );
      expect(projectFile.yaml.status).toBe("in-progress");
    });

    it("should stop updating hierarchy when parent is already in-progress", async () => {
      // Create project (already in progress)
      const projectData: ObjectData = {
        id: "P-active-project",
        title: "Active Project",
        status: "in-progress",
        priority: "high",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-active-project",
        createObjectContent(projectData),
      );

      // Create feature with project parent (open)
      const featureData: ObjectData = {
        id: "F-stopping-hierarchy",
        title: "Stopping Hierarchy Feature",
        status: "open",
        priority: "medium",
        parent: "P-active-project",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-stopping-hierarchy",
        createObjectContent(featureData),
      );

      // Create task with feature parent
      const taskData: ObjectData = {
        id: "T-stopping-hierarchy",
        title: "Stopping Hierarchy Task",
        status: "open",
        priority: "high",
        parent: "F-stopping-hierarchy",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-stopping-hierarchy",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-stopping-hierarchy",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify task and feature are in-progress
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-stopping-hierarchy.md",
      );
      expect(taskFile.yaml.status).toBe("in-progress");

      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        "f/open/F-stopping-hierarchy.md",
      );
      expect(featureFile.yaml.status).toBe("in-progress");

      // Project should remain unchanged (still in-progress, not updated)
      const projectFile = await readObjectFile(
        testEnv.projectRoot,
        "p/open/P-active-project.md",
      );
      expect(projectFile.yaml.status).toBe("in-progress");
    });

    it("should handle task with no parent gracefully", async () => {
      // Create task without parent
      const taskData: ObjectData = {
        id: "T-orphan-task",
        title: "Orphan Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-orphan-task",
        createObjectContent(taskData),
      );

      // Claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-orphan-task",
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify only task status changed
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-orphan-task.md",
      );
      expect(taskFile.yaml.status).toBe("in-progress");
    });

    it("should update parents even with force claiming", async () => {
      // Create feature parent
      const featureData: ObjectData = {
        id: "F-force-feature",
        title: "Force Feature",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-force-feature",
        createObjectContent(featureData),
      );

      // Create task that's already in progress with parent
      const taskData: ObjectData = {
        id: "T-force-hierarchy",
        title: "Force Hierarchy Task",
        status: "in-progress",
        priority: "high",
        parent: "F-force-feature",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-force-hierarchy",
        createObjectContent(taskData),
      );

      // Force claim task
      const result = await client.callTool("claim_task", {
        taskId: "T-force-hierarchy",
        force: true,
      });

      expect(result.content[0].text).toContain("Successfully claimed task");

      // Verify feature parent was still updated
      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        "f/open/F-force-feature.md",
      );
      expect(featureFile.yaml.status).toBe("in-progress");
    });
  });
});
