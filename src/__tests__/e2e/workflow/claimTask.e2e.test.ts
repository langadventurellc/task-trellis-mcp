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
});
