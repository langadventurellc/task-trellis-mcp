import { McpTestClient, TestEnvironment } from "../utils";

describe("E2E Workflow - Prerequisites", () => {
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

  describe("Simple Prerequisite Chains", () => {
    it("should handle linear dependency chain A -> B -> C", async () => {
      // Create tasks A, B, C with dependencies
      const taskA = await client.callTool("create_object", {
        type: "task",
        title: "Task A - Foundation",
        status: "open",
      });
      const taskAId = taskA.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const taskB = await client.callTool("create_object", {
        type: "task",
        title: "Task B - Middle",
        status: "open",
        prerequisites: [taskAId],
      });
      const taskBId = taskB.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const taskC = await client.callTool("create_object", {
        type: "task",
        title: "Task C - Final",
        status: "open",
        prerequisites: [taskBId],
      });
      const taskCId = taskC.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to claim C (should fail)
      let result = await client.callTool("claim_task", { taskId: taskCId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Try to claim B (should fail)
      result = await client.callTool("claim_task", { taskId: taskBId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Claim and complete A
      await client.callTool("claim_task", { taskId: taskAId });
      await client.callTool("complete_task", {
        taskId: taskAId,
        summary: "Foundation complete",
        filesChanged: {},
      });

      // Now claim and complete B
      await client.callTool("claim_task", { taskId: taskBId });
      await client.callTool("complete_task", {
        taskId: taskBId,
        summary: "Middle layer complete",
        filesChanged: {},
      });

      // Finally claim and complete C
      result = await client.callTool("claim_task", { taskId: taskCId });
      expect(result.content[0].text).toContain("Successfully claimed");
      await client.callTool("complete_task", {
        taskId: taskCId,
        summary: "Final task complete",
        filesChanged: {},
      });
    });

    it("should handle parallel prerequisites", async () => {
      // Create two independent prerequisites
      const prereq1 = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite 1",
        status: "open",
      });
      const prereq1Id = prereq1.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const prereq2 = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite 2",
        status: "open",
      });
      const prereq2Id = prereq2.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create task depending on both
      const mainTask = await client.callTool("create_object", {
        type: "task",
        title: "Task with Multiple Prerequisites",
        status: "open",
        prerequisites: [prereq1Id, prereq2Id],
      });
      const mainTaskId = mainTask.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to claim main task (should fail)
      const failResult = await client.callTool("claim_task", {
        taskId: mainTaskId,
      });
      expect(failResult.content[0].text).toContain("Not all prerequisites");

      // Complete only prereq1
      await client.callTool("claim_task", { taskId: prereq1Id });
      await client.callTool("complete_task", {
        taskId: prereq1Id,
        summary: "First prerequisite done",
        filesChanged: {},
      });

      // Try to claim main task (should still fail)
      const failResult2 = await client.callTool("claim_task", {
        taskId: mainTaskId,
      });
      expect(failResult2.content[0].text).toContain("Not all prerequisites");

      // Complete prereq2
      await client.callTool("claim_task", { taskId: prereq2Id });
      await client.callTool("complete_task", {
        taskId: prereq2Id,
        summary: "Second prerequisite done",
        filesChanged: {},
      });

      // Now can claim main task
      const result = await client.callTool("claim_task", {
        taskId: mainTaskId,
      });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Complex Dependency Graphs", () => {
    it("should handle diamond dependency pattern", async () => {
      //     A
      //    / \
      //   B   C
      //    \ /
      //     D

      const taskA = await client.callTool("create_object", {
        type: "task",
        title: "Task A - Root",
        status: "open",
      });
      const taskAId = taskA.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const taskB = await client.callTool("create_object", {
        type: "task",
        title: "Task B - Left Branch",
        status: "open",
        prerequisites: [taskAId],
      });
      const taskBId = taskB.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const taskC = await client.callTool("create_object", {
        type: "task",
        title: "Task C - Right Branch",
        status: "open",
        prerequisites: [taskAId],
      });
      const taskCId = taskC.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const taskD = await client.callTool("create_object", {
        type: "task",
        title: "Task D - Convergence",
        status: "open",
        prerequisites: [taskBId, taskCId],
      });
      const taskDId = taskD.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Complete A
      await client.callTool("claim_task", { taskId: taskAId });
      await client.callTool("complete_task", {
        taskId: taskAId,
        summary: "Root complete",
        filesChanged: {},
      });

      // B and C can now be claimed in parallel
      await client.callTool("claim_task", { taskId: taskBId });
      await client.callTool("claim_task", { taskId: taskCId });

      // Try to claim D (should fail)
      let result = await client.callTool("claim_task", { taskId: taskDId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Complete B and C
      await client.callTool("complete_task", {
        taskId: taskBId,
        summary: "Left branch complete",
        filesChanged: {},
      });
      await client.callTool("complete_task", {
        taskId: taskCId,
        summary: "Right branch complete",
        filesChanged: {},
      });

      // Now D can be claimed
      result = await client.callTool("claim_task", { taskId: taskDId });
      expect(result.content[0].text).toContain("Successfully claimed");
    });

    it("should handle cross-type dependencies", async () => {
      // Create project -> epic -> feature hierarchy
      const projectResult = await client.callTool("create_object", {
        type: "project",
        title: "Cross-Type Project",
        status: "open",
      });
      const projectId = projectResult.content[0].text.match(
        /ID: (P-[a-z0-9-]+)/,
      )![1] as string;

      const epicResult = await client.callTool("create_object", {
        type: "epic",
        title: "Cross-Type Epic",
        parent: projectId,
        status: "open",
      });
      const epicId = epicResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      const featureResult = await client.callTool("create_object", {
        type: "feature",
        title: "Cross-Type Feature",
        parent: epicId,
        status: "open",
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task1 under feature
      const task1Result = await client.callTool("create_object", {
        type: "task",
        title: "Task 1 - Under Feature",
        parent: featureId,
        status: "open",
      });
      const task1Id = task1Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create standalone task2 depending on task1
      const task2Result = await client.callTool("create_object", {
        type: "task",
        title: "Task 2 - Standalone",
        status: "open",
        prerequisites: [task1Id],
      });
      const task2Id = task2Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to claim task2 (should fail)
      const crossTypeFailResult = await client.callTool("claim_task", {
        taskId: task2Id,
      });
      expect(crossTypeFailResult.content[0].text).toContain(
        "Not all prerequisites",
      );

      // Complete task1
      await client.callTool("claim_task", { taskId: task1Id });
      await client.callTool("complete_task", {
        taskId: task1Id,
        summary: "Feature task complete",
        filesChanged: {},
      });

      // Now task2 can be claimed
      const result = await client.callTool("claim_task", { taskId: task2Id });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Circular Dependency Detection", () => {
    it("should handle self-referencing prerequisites gracefully", async () => {
      // Create task with self-reference (should be prevented at creation)
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Self-Referencing Task",
        status: "open",
        prerequisites: ["T-self-ref"], // Its own ID
      });
      const taskId = result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // The task gets created but prerequisite won't exist
      // Try to claim (prerequisite doesn't exist so should succeed)
      const claimResult = await client.callTool("claim_task", { taskId });
      expect(claimResult.content[0].text).toContain("Successfully claimed");
    });

    it("should handle mutual dependencies", async () => {
      // Create task A
      const taskA = await client.callTool("create_object", {
        type: "task",
        title: "Task A - Mutual",
        status: "open",
      });
      const taskAId = taskA.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create task B depending on A
      const taskB = await client.callTool("create_object", {
        type: "task",
        title: "Task B - Mutual",
        status: "open",
        prerequisites: [taskAId],
      });
      const taskBId = taskB.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to update A to depend on B (creating cycle)
      await client.callTool("update_object", {
        id: taskAId,
        prerequisites: [taskBId],
      });

      // Both tasks should now be unclaimable
      let result = await client.callTool("claim_task", { taskId: taskAId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      result = await client.callTool("claim_task", { taskId: taskBId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Force claim should work
      result = await client.callTool("claim_task", {
        taskId: taskAId,
        force: true,
      });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Partial Prerequisites", () => {
    it("should handle wont-do prerequisites", async () => {
      // Create prerequisite that will be marked wont-do
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite - Will Cancel",
        status: "open",
      });
      const prereqId = prereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create dependent task
      const mainResult = await client.callTool("create_object", {
        type: "task",
        title: "Task with Cancelled Prerequisite",
        status: "open",
        prerequisites: [prereqId],
      });
      const mainId = mainResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Mark prerequisite as wont-do
      await client.callTool("update_object", {
        id: prereqId,
        status: "wont-do",
      });

      // Main task should now be claimable
      const result = await client.callTool("claim_task", { taskId: mainId });
      expect(result.content[0].text).toContain("Successfully claimed");
    });

    it("should handle external prerequisites", async () => {
      // Create task with external (non-existent) prerequisite
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Task with External Dependency",
        status: "open",
        prerequisites: ["EXTERNAL-API-READY", "EXTERNAL-DOCS-COMPLETE"],
      });
      const taskId = result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Should be claimable since external prerequisites are assumed complete
      const claimResult = await client.callTool("claim_task", { taskId });
      expect(claimResult.content[0].text).toContain("Successfully claimed");
    });

    it("should handle mixed internal and external prerequisites", async () => {
      // Create internal prerequisite
      const internalResult = await client.callTool("create_object", {
        type: "task",
        title: "Internal Prerequisite",
        status: "open",
      });
      const internalId = internalResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create task with both internal and external prerequisites
      const mainResult = await client.callTool("create_object", {
        type: "task",
        title: "Mixed Prerequisites Task",
        status: "open",
        prerequisites: [internalId, "EXTERNAL-APPROVAL"],
      });
      const mainId = mainResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Should not be claimable (internal not complete)
      let result = await client.callTool("claim_task", { taskId: mainId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Complete internal prerequisite
      await client.callTool("claim_task", { taskId: internalId });
      await client.callTool("complete_task", {
        taskId: internalId,
        summary: "Internal work done",
        filesChanged: {},
      });

      // Now should be claimable
      result = await client.callTool("claim_task", { taskId: mainId });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Prerequisites Edge Cases", () => {
    it("should handle empty prerequisites array", async () => {
      const result = await client.callTool("create_object", {
        type: "task",
        title: "No Prerequisites Task",
        status: "open",
        prerequisites: [],
      });
      const taskId = result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Should be immediately claimable
      const claimResult = await client.callTool("claim_task", { taskId });
      expect(claimResult.content[0].text).toContain("Successfully claimed");
    });

    it("should handle prerequisites on different object types", async () => {
      // Create feature with prerequisites
      const task1Result = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite Task for Feature",
        status: "open",
      });
      const task1Id = task1Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const featureResult = await client.callTool("create_object", {
        type: "feature",
        title: "Feature with Prerequisites",
        status: "open",
        prerequisites: [task1Id],
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task depending on feature
      const task2Result = await client.callTool("create_object", {
        type: "task",
        title: "Task Depending on Feature",
        status: "open",
        prerequisites: [featureId],
      });
      const task2Id = task2Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Complete task1
      await client.callTool("claim_task", { taskId: task1Id });
      await client.callTool("complete_task", {
        taskId: task1Id,
        summary: "Prerequisite for feature done",
        filesChanged: {},
      });

      // Mark feature as done
      await client.callTool("update_object", {
        id: featureId,
        status: "done",
      });

      // Now task2 should be claimable
      const result = await client.callTool("claim_task", { taskId: task2Id });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Dynamic Prerequisite Updates", () => {
    it("should handle adding prerequisites to existing tasks", async () => {
      // Create tasks
      const task1Result = await client.callTool("create_object", {
        type: "task",
        title: "Task 1 - Independent",
        status: "open",
      });
      const task1Id = task1Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      const task2Result = await client.callTool("create_object", {
        type: "task",
        title: "Task 2 - Initially Independent",
        status: "open",
        prerequisites: [],
      });
      const task2Id = task2Result.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Task 2 should be claimable initially
      let result = await client.callTool("claim_task", { taskId: task2Id });
      expect(result.content[0].text).toContain("Successfully claimed");

      // Reset task 2 to open
      await client.callTool("update_object", {
        id: task2Id,
        status: "open",
      });

      // Add prerequisite to task 2
      await client.callTool("update_object", {
        id: task2Id,
        prerequisites: [task1Id],
      });

      // Now task 2 should not be claimable
      result = await client.callTool("claim_task", { taskId: task2Id });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Complete task 1
      await client.callTool("claim_task", { taskId: task1Id });
      await client.callTool("complete_task", {
        taskId: task1Id,
        summary: "Prerequisite completed",
        filesChanged: {},
      });

      // Now task 2 should be claimable
      result = await client.callTool("claim_task", { taskId: task2Id });
      expect(result.content[0].text).toContain("Successfully claimed");
    });

    it("should handle removing prerequisites from existing tasks", async () => {
      // Create prerequisite task
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite Task",
        status: "open",
      });
      const prereqId = prereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create dependent task
      const dependentResult = await client.callTool("create_object", {
        type: "task",
        title: "Dependent Task",
        status: "open",
        prerequisites: [prereqId],
      });
      const dependentId = dependentResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Should not be claimable initially
      let result = await client.callTool("claim_task", { taskId: dependentId });
      expect(result.content[0].text).toContain("Not all prerequisites");

      // Remove prerequisite
      await client.callTool("update_object", {
        id: dependentId,
        prerequisites: [],
      });

      // Now should be claimable
      result = await client.callTool("claim_task", { taskId: dependentId });
      expect(result.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Priority with Prerequisites", () => {
    it("should claim highest priority task among available tasks", async () => {
      // Create prerequisite
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Completed Prerequisite",
        status: "done",
      });
      const prereqId = prereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create high priority task with completed prerequisite
      await client.callTool("create_object", {
        type: "task",
        title: "High Priority Available",
        priority: "high",
        status: "open",
        prerequisites: [prereqId],
      });

      // Create medium priority task without prerequisites
      await client.callTool("create_object", {
        type: "task",
        title: "Medium Priority Independent",
        priority: "medium",
        status: "open",
        prerequisites: [],
      });

      // Auto-claim should get high priority task
      const result = await client.callTool("claim_task", {});
      expect(result.content[0].text).toContain("High Priority Available");
    });

    it("should skip blocked high priority tasks and claim available lower priority", async () => {
      // Create incomplete prerequisite
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Incomplete Prerequisite",
        status: "open",
        priority: "low",
      });
      const prereqId = prereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create high priority task with incomplete prerequisite
      await client.callTool("create_object", {
        type: "task",
        title: "High Priority Blocked",
        priority: "high",
        status: "open",
        prerequisites: [prereqId],
      });

      // Create medium priority task without prerequisites
      await client.callTool("create_object", {
        type: "task",
        title: "Medium Priority Available",
        priority: "medium",
        status: "open",
        prerequisites: [],
      });

      // Auto-claim should get medium priority task (high is blocked)
      const result = await client.callTool("claim_task", {});
      expect(result.content[0].text).toContain("Medium Priority Available");
    });
  });
});
