import { McpTestClient, TestEnvironment, readObjectFile } from "../utils";

describe("E2E Workflow - Task Lifecycle", () => {
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

  describe("Complete Task Workflow", () => {
    it("should complete full lifecycle: create -> claim -> work -> complete", async () => {
      // Step 1: Create task
      const createResult = await client.callTool("create_object", {
        type: "task",
        title: "Full Lifecycle Task",
        priority: "high",
        description: "Task for testing complete lifecycle",
      });
      const taskId =
        createResult.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // Verify initial state (tasks start as draft by default)
      let file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );
      expect(file.yaml.status).toBe("draft");

      // Update to open so it can be claimed
      await client.callTool("update_object", {
        id: taskId,
        status: "open",
      });

      // Step 2: Claim task
      const claimResult = await client.callTool("claim_task", {
        taskId: taskId,
      });
      expect(claimResult.content[0].text).toContain("Successfully claimed");

      // Verify claimed state
      file = await readObjectFile(testEnv.projectRoot, `t/open/${taskId}.md`);
      expect(file.yaml.status).toBe("in-progress");

      // Step 3: Add progress logs
      await client.callTool("append_object_log", {
        id: taskId,
        contents: "Started implementation",
      });

      await client.callTool("append_object_log", {
        id: taskId,
        contents: "Added unit tests",
      });

      // Step 4: Complete task
      const completeResult = await client.callTool("complete_task", {
        taskId: taskId,
        summary: "Successfully implemented feature with tests",
        filesChanged: {
          "src/feature.ts": "Implemented new feature",
          "test/feature.test.ts": "Added comprehensive tests",
        },
      });
      expect(completeResult.content[0].text).toContain(
        "completed successfully",
      );

      // Verify final state
      file = await readObjectFile(testEnv.projectRoot, `t/closed/${taskId}.md`);
      expect(file.yaml.status).toBe("done");
      expect(file.yaml.log).toEqual(
        expect.arrayContaining([
          "Started implementation",
          "Added unit tests",
          "Successfully implemented feature with tests",
        ]),
      );
    });

    it("should handle workflow with prerequisites", async () => {
      // Create prerequisite task
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite Task",
        status: "open",
      });
      const prereqId =
        prereqResult.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // Create dependent task
      const dependentResult = await client.callTool("create_object", {
        type: "task",
        title: "Dependent Task",
        prerequisites: [prereqId],
        status: "open",
      });
      const dependentId =
        dependentResult.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // Try to claim dependent task (should fail)
      const failedClaim = await client.callTool("claim_task", {
        taskId: dependentId,
      });
      expect(failedClaim.content[0].text).toContain("Not all prerequisites");

      // Complete prerequisite
      await client.callTool("claim_task", { taskId: prereqId });
      await client.callTool("complete_task", {
        taskId: prereqId,
        summary: "Prerequisite completed",
        filesChanged: {},
      });

      // Now claim and complete dependent task
      const successClaim = await client.callTool("claim_task", {
        taskId: dependentId,
      });
      expect(successClaim.content[0].text).toContain("Successfully claimed");

      await client.callTool("complete_task", {
        taskId: dependentId,
        summary: "Dependent task completed",
        filesChanged: {},
      });

      // Verify both tasks are done
      const prereqFile = await readObjectFile(
        testEnv.projectRoot,
        `t/closed/${prereqId}.md`,
      );
      const dependentFile = await readObjectFile(
        testEnv.projectRoot,
        `t/closed/${dependentId}.md`,
      );
      expect(prereqFile.yaml.status).toBe("done");
      expect(dependentFile.yaml.status).toBe("done");
    });
  });

  describe("Complex Project Workflow", () => {
    it("should handle project -> epic -> feature -> task hierarchy", async () => {
      // Create project
      const projectResult = await client.callTool("create_object", {
        type: "project",
        title: "Complex Project",
        status: "open",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z0-9-]+)/)![1];

      // Create epic
      const epicResult = await client.callTool("create_object", {
        type: "epic",
        title: "Major Epic",
        parent: projectId,
        status: "open",
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z0-9-]+)/)![1];

      // Create feature
      const featureResult = await client.callTool("create_object", {
        type: "feature",
        title: "Core Feature",
        parent: epicId,
        status: "open",
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z0-9-]+)/)![1];

      // Create multiple tasks
      const taskIds: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const taskResult = await client.callTool("create_object", {
          type: "task",
          title: `Task ${i}`,
          parent: featureId,
          status: "open",
          priority: i === 1 ? "high" : "medium",
        });
        const taskId = taskResult.content[0].text.match(
          /ID: (T-[a-z0-9-]+)/,
        )![1] as string;
        taskIds.push(taskId);
      }

      // Claim and complete tasks
      for (const taskId of taskIds) {
        await client.callTool("claim_task", { taskId });
        await client.callTool("append_object_log", {
          id: taskId,
          contents: `Working on ${taskId}`,
        });
        await client.callTool("complete_task", {
          taskId,
          summary: `Completed ${taskId}`,
          filesChanged: { [`${taskId}.ts`]: "Implementation" },
        });
      }

      // Verify all tasks completed
      for (const taskId of taskIds) {
        const file = await readObjectFile(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/f/${featureId}/t/closed/${taskId}.md`,
        );
        expect(file.yaml.status).toBe("done");
      }

      // Update feature status
      await client.callTool("update_object", {
        id: featureId,
        status: "done",
      });

      // Verify feature marked as done
      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/${featureId}/${featureId}.md`,
      );
      expect(featureFile.yaml.status).toBe("done");
    });
  });

  describe("Workflow Interruptions", () => {
    it("should handle task abandonment (wont-do)", async () => {
      // Create and claim task
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Task to Abandon",
        status: "open",
      });
      const taskId = result.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      await client.callTool("claim_task", { taskId });
      await client.callTool("append_object_log", {
        id: taskId,
        contents: "Started work but found blocker",
      });

      // Mark as wont-do instead of completing
      await client.callTool("update_object", {
        id: taskId,
        status: "wont-do",
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/closed/${taskId}.md`,
      );
      expect(file.yaml.status).toBe("wont-do");
      expect(file.yaml.log).toContain("Started work but found blocker");
    });

    it("should handle task re-assignment", async () => {
      // Create task
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Task to Reassign",
        status: "open",
      });
      const taskId = result.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // First claim
      await client.callTool("claim_task", { taskId });
      await client.callTool("append_object_log", {
        id: taskId,
        contents: "First attempt - need to hand off",
      });

      // Reset to open for reassignment
      await client.callTool("update_object", {
        id: taskId,
        status: "open",
      });

      // Second claim
      await client.callTool("claim_task", { taskId });
      await client.callTool("append_object_log", {
        id: taskId,
        contents: "Taking over task",
      });

      // Complete
      await client.callTool("complete_task", {
        taskId,
        summary: "Completed after reassignment",
        filesChanged: {},
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/closed/${taskId}.md`,
      );
      expect(file.yaml.status).toBe("done");
      expect(file.yaml.log).toEqual(
        expect.arrayContaining([
          "First attempt - need to hand off",
          "Taking over task",
          "Completed after reassignment",
        ]),
      );
    });
  });

  describe("Status Transition Validation", () => {
    it("should enforce valid status transitions", async () => {
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Status Transition Test",
        status: "open",
      });
      const taskId = result.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // open -> in-progress (via claim)
      await client.callTool("claim_task", { taskId });

      // in-progress -> done (via complete)
      await client.callTool("complete_task", {
        taskId,
        summary: "Testing status transitions",
        filesChanged: {},
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/closed/${taskId}.md`,
      );
      expect(file.yaml.status).toBe("done");
    });

    it("should prevent invalid status transitions", async () => {
      const result = await client.callTool("create_object", {
        type: "task",
        title: "Invalid Transition Test",
        status: "open",
      });
      const taskId = result.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // Try to complete without claiming (open -> done invalid)
      try {
        await client.callTool("complete_task", {
          taskId,
          summary: "Skipping in-progress",
          filesChanged: {},
        });
        expect(true).toBe(false); // Should not reach this line
      } catch (error: any) {
        expect(error.message).toContain("not in progress");
      }
    });
  });

  describe("Auto-claiming Next Task", () => {
    it("should auto-claim highest priority available task", async () => {
      // Create multiple tasks with different priorities
      const tasks = [
        { title: "Low Priority Task", priority: "low" },
        { title: "High Priority Task", priority: "high" },
        { title: "Medium Priority Task", priority: "medium" },
      ];

      for (const task of tasks) {
        await client.callTool("create_object", {
          type: "task",
          title: task.title,
          priority: task.priority,
          status: "open",
        });
      }

      // Claim next available task (should be highest priority)
      const result = await client.callTool("claim_task", {});

      expect(result.content[0].text).toContain("High Priority Task");
    });

    it("should consider prerequisites when auto-claiming", async () => {
      // Create prerequisite task
      const prereqResult = await client.callTool("create_object", {
        type: "task",
        title: "Prerequisite for High Priority",
        status: "open",
      });
      const prereqId =
        prereqResult.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      // Create high priority task with prerequisite
      await client.callTool("create_object", {
        type: "task",
        title: "High Priority with Prereq",
        priority: "high",
        prerequisites: [prereqId],
        status: "open",
      });

      // Create medium priority task without prerequisite
      await client.callTool("create_object", {
        type: "task",
        title: "Medium Priority Available",
        priority: "medium",
        status: "open",
      });

      // Auto-claim should get medium priority (high priority is blocked)
      const result = await client.callTool("claim_task", {});

      expect(result.content[0].text).toContain("Medium Priority Available");
    });
  });

  describe("Concurrent Task Management", () => {
    it("should handle multiple tasks being worked on simultaneously", async () => {
      // Create multiple tasks
      const taskIds: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const taskResult = await client.callTool("create_object", {
          type: "task",
          title: `Concurrent Task ${i}`,
          status: "open",
        });
        const taskId = taskResult.content[0].text.match(
          /ID: (T-[a-z0-9-]+)/,
        )![1] as string;
        taskIds.push(taskId);
      }

      // Claim all tasks
      for (const taskId of taskIds) {
        await client.callTool("claim_task", { taskId });
      }

      // Work on tasks (add logs to all)
      for (const taskId of taskIds) {
        await client.callTool("append_object_log", {
          id: taskId,
          contents: `Working on ${taskId}`,
        });
      }

      // Complete tasks in different order
      await client.callTool("complete_task", {
        taskId: taskIds[1], // Complete second task first
        summary: "Second task completed first",
        filesChanged: {},
      });

      await client.callTool("complete_task", {
        taskId: taskIds[0], // Complete first task second
        summary: "First task completed second",
        filesChanged: {},
      });

      await client.callTool("complete_task", {
        taskId: taskIds[2], // Complete third task last
        summary: "Third task completed last",
        filesChanged: {},
      });

      // Verify all completed
      for (const taskId of taskIds) {
        const file = await readObjectFile(
          testEnv.projectRoot,
          `t/closed/${taskId}.md`,
        );
        expect(file.yaml.status).toBe("done");
      }
    });
  });
});
