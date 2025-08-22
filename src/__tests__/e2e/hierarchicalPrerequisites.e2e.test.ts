import { McpTestClient, TestEnvironment } from "./utils";

describe("E2E Hierarchical Prerequisites", () => {
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

  describe("Complete Workflow Test", () => {
    it("should prevent claiming task when parent has incomplete prerequisites", async () => {
      // 1. Create Epic A (prerequisite for Epic B)
      const epicAResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Epic A - Foundation",
        status: "open",
        priority: "high",
      });
      const epicAId = epicAResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      // 2. Create Epic B with prerequisite on Epic A
      const epicBResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Epic B - Dependent",
        status: "open",
        priority: "medium",
        prerequisites: [epicAId],
      });
      const epicBId = epicBResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      // 3. Create Feature under Epic B
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature under Epic B",
        status: "open",
        priority: "medium",
        parent: epicBId,
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // 4. Create Task under Feature
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task under Feature",
        status: "open",
        priority: "high",
        parent: featureId,
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // 5. Attempt to claim Task - should fail due to parent hierarchy prerequisites
      const claimFailResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimFailResult.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );

      // 6. Complete Epic A
      await client.callTool("update_issue", {
        id: epicAId,
        status: "done",
      });

      // 7. Claim Task - should now succeed
      const claimSuccessResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimSuccessResult.content[0].text).toContain(
        "Successfully claimed",
      );
    });

    it("should handle complex hierarchy with multiple prerequisite levels", async () => {
      // Create Project A (prerequisite)
      const projectAResult = await client.callTool("create_issue", {
        type: "project",
        title: "Project A - Infrastructure",
        status: "open",
        priority: "high",
      });
      const projectAId = projectAResult.content[0].text.match(
        /ID: (P-[a-z0-9-]+)/,
      )![1] as string;

      // Create Project B with prerequisite on Project A
      const projectBResult = await client.callTool("create_issue", {
        type: "project",
        title: "Project B - Application",
        status: "open",
        priority: "medium",
        prerequisites: [projectAId],
      });
      const projectBId = projectBResult.content[0].text.match(
        /ID: (P-[a-z0-9-]+)/,
      )![1] as string;

      // Create Epic under Project B
      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Epic under Project B",
        status: "open",
        priority: "medium",
        parent: projectBId,
      });
      const epicId = epicResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      // Create Feature under Epic
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature under Epic",
        status: "open",
        priority: "medium",
        parent: epicId,
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create Task under Feature
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task in deep hierarchy",
        status: "open",
        priority: "high",
        parent: featureId,
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Task should not be claimable due to grandparent prerequisite
      const claimFailResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimFailResult.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );

      // Complete Project A
      await client.callTool("update_issue", {
        id: projectAId,
        status: "done",
      });

      // Now task should be claimable
      const claimSuccessResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimSuccessResult.content[0].text).toContain(
        "Successfully claimed",
      );
    });
  });

  describe("Error Message Validation", () => {
    it("should return appropriate error messages for blocked tasks", async () => {
      // Create prerequisite feature
      const prereqFeatureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Prerequisite Feature",
        status: "open",
        priority: "medium",
      });
      const prereqFeatureId = prereqFeatureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create feature with prerequisite
      const parentFeatureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Parent Feature with Prereq",
        status: "open",
        priority: "medium",
        prerequisites: [prereqFeatureId],
      });
      const parentFeatureId = parentFeatureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task under parent feature (task has no direct prerequisites)
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task under feature with prereqs",
        status: "open",
        priority: "high",
        parent: parentFeatureId,
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to claim task - should get specific parent hierarchy error
      const claimResult = await client.callTool("claim_task", {
        taskId: taskId,
      });

      expect(claimResult.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );
      expect(claimResult.content[0].text).not.toContain(
        "Not all prerequisites are complete",
      );
    });

    it("should distinguish between task prerequisites and parent hierarchy prerequisites", async () => {
      // Create prerequisite task for task itself
      const taskPrereqResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task Prerequisite",
        status: "open",
        priority: "low",
      });
      const taskPrereqId = taskPrereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create prerequisite for parent feature
      const featurePrereqResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature Prerequisite",
        status: "open",
        priority: "low",
      });
      const featurePrereqId = featurePrereqResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create parent feature with prerequisite
      const parentFeatureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature with prerequisites",
        status: "open",
        priority: "medium",
        prerequisites: [featurePrereqId],
      });
      const parentFeatureId = parentFeatureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task with both own prerequisites and parent with prerequisites
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task with mixed prerequisites",
        status: "open",
        priority: "high",
        parent: parentFeatureId,
        prerequisites: [taskPrereqId],
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Try to claim - should fail due to both task and parent prerequisites
      const claimResult1 = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimResult1.content[0].text).toContain(
        "Not all prerequisites are complete",
      );

      // Complete task prerequisite only
      await client.callTool("update_issue", {
        id: taskPrereqId,
        status: "done",
      });

      // Try to claim - should now fail only due to parent prerequisites
      const claimResult2 = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimResult2.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );

      // Complete feature prerequisite
      await client.callTool("update_issue", {
        id: featurePrereqId,
        status: "done",
      });

      // Now task should be claimable
      const claimResult3 = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimResult3.content[0].text).toContain("Successfully claimed");
    });
  });

  describe("Force Flag Override", () => {
    it("should allow force claiming despite parent prerequisites", async () => {
      // Create prerequisite epic
      const prereqEpicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Incomplete Prerequisite Epic",
        status: "open",
        priority: "low",
      });
      const prereqEpicId = prereqEpicResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      // Create feature with prerequisite
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature with Epic Prerequisite",
        status: "open",
        priority: "medium",
        prerequisites: [prereqEpicId],
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task under feature
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task to Force Claim",
        status: "open",
        priority: "high",
        parent: featureId,
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Normal claim should fail
      const normalClaimResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(normalClaimResult.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );

      // Force claim should succeed
      const forceClaimResult = await client.callTool("claim_task", {
        taskId: taskId,
        force: true,
      });
      expect(forceClaimResult.content[0].text).toContain(
        "Successfully claimed",
      );
    });

    it("should force claim with both task and parent prerequisites incomplete", async () => {
      // Create task prerequisite
      const taskPrereqResult = await client.callTool("create_issue", {
        type: "task",
        title: "Incomplete Task Prerequisite",
        status: "open",
        priority: "low",
      });
      const taskPrereqId = taskPrereqResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Create feature prerequisite
      const featurePrereqResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Incomplete Feature Prerequisite",
        status: "open",
        priority: "low",
      });
      const featurePrereqId = featurePrereqResult.content[0].text.match(
        /ID: (E-[a-z0-9-]+)/,
      )![1] as string;

      // Create feature with prerequisite
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Blocked Feature",
        status: "open",
        priority: "medium",
        prerequisites: [featurePrereqId],
      });
      const featureId = featureResult.content[0].text.match(
        /ID: (F-[a-z0-9-]+)/,
      )![1] as string;

      // Create task with both own and parent prerequisites
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Multiply Blocked Task",
        status: "open",
        priority: "high",
        parent: featureId,
        prerequisites: [taskPrereqId],
      });
      const taskId = taskResult.content[0].text.match(
        /ID: (T-[a-z0-9-]+)/,
      )![1] as string;

      // Force claim should still work
      const forceClaimResult = await client.callTool("claim_task", {
        taskId: taskId,
        force: true,
      });
      expect(forceClaimResult.content[0].text).toContain(
        "Successfully claimed",
      );
    });
  });
});
