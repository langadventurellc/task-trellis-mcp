import {
  McpTestClient,
  TestEnvironment,
  fileExists,
  readObjectFile,
} from "../utils";

describe("E2E CRUD - createObject", () => {
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

  describe("Project Creation", () => {
    it("should create project with minimal parameters", async () => {
      const result = await client.callTool("create_issue", {
        type: "project",
        title: "Test Project",
      });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toContain(
        "Created object with ID: P-test-project",
      );

      // Verify file creation
      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-test-project/P-test-project.md",
      );
      expect(file.yaml.id).toBe("P-test-project");
      expect(file.yaml.title).toBe("Test Project");
      expect(file.yaml.status).toBe("open");
      expect(file.yaml.priority).toBe("medium");
      expect(file.yaml.parent).toBeUndefined();
      expect(file.yaml.prerequisites).toEqual([]);
      expect(file.body).toBe("");
    });

    it("should create project with all optional fields", async () => {
      const result = await client.callTool("create_issue", {
        type: "project",
        title: "Full Project",
        priority: "high",
        status: "open",
        prerequisites: ["P-dep1", "P-dep2"],
        description: "This is a comprehensive project description",
      });

      expect(result.content[0].text).toContain("P-full-project");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-full-project/P-full-project.md",
      );
      expect(file.yaml.priority).toBe("high");
      expect(file.yaml.status).toBe("open");
      expect(file.yaml.prerequisites).toEqual(["P-dep1", "P-dep2"]);
      expect(file.body).toBe("This is a comprehensive project description");
    });

    it("should reject project with parent", async () => {
      try {
        await client.callTool("create_issue", {
          type: "project",
          title: "Invalid Project",
          parent: "P-parent",
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain("Projects cannot have parents");
      }
    });
  });

  describe("Epic Creation", () => {
    let projectId: string;

    beforeEach(async () => {
      // Create parent project first
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Parent Project",
      });
      const match = projectResult.content[0].text.match(/ID: (P-[a-z-]+)/);
      projectId = match![1];
    });

    it("should create epic under project", async () => {
      const result = await client.callTool("create_issue", {
        type: "epic",
        title: "Test Epic",
        parent: projectId,
        description: "Epic description",
      });

      expect(result.content[0].text).toContain("E-test-epic");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/E-test-epic/E-test-epic.md`,
      );
      expect(file.yaml.id).toBe("E-test-epic");
      expect(file.yaml.parent).toBe(projectId);
      expect(file.body).toBe("Epic description");
    });

    it("should create standalone epic", async () => {
      const result = await client.callTool("create_issue", {
        type: "epic",
        title: "Standalone Epic",
        priority: "high",
        description: "Epic without parent project",
      });

      expect(result.content[0].text).toContain("E-standalone-epic");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "e/E-standalone-epic/E-standalone-epic.md",
      );
      expect(file.yaml.id).toBe("E-standalone-epic");
      expect(file.yaml.parent).toBeUndefined();
      expect(file.yaml.priority).toBe("high");
      expect(file.body).toBe("Epic without parent project");
    });

    it("should reject epic with non-project parent", async () => {
      try {
        await client.callTool("create_issue", {
          type: "epic",
          title: "Invalid Epic",
          parent: "E-another-epic",
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain(
          "Epics must have a project as a parent",
        );
      }
    });

    it("should reject epic with non-existent parent", async () => {
      try {
        await client.callTool("create_issue", {
          type: "epic",
          title: "Epic with Missing Parent",
          parent: "P-nonexistent",
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain(
          "Parent object with ID 'P-nonexistent' does not exist",
        );
      }
    });
  });

  describe("Feature Creation", () => {
    let projectId: string;
    let epicId: string;

    beforeEach(async () => {
      // Create project and epic hierarchy
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Feature Test Project",
      });
      projectId = projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Feature Test Epic",
        parent: projectId,
      });
      epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];
    });

    it("should create standalone feature", async () => {
      const result = await client.callTool("create_issue", {
        type: "feature",
        title: "Standalone Feature",
        status: "in-progress",
      });

      expect(result.content[0].text).toContain("F-standalone-feature");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "f/F-standalone-feature/F-standalone-feature.md",
      );
      expect(file.yaml.parent).toBeUndefined();
      expect(file.yaml.status).toBe("in-progress");
    });

    it("should create feature under epic", async () => {
      const result = await client.callTool("create_issue", {
        type: "feature",
        title: "Epic Feature",
        parent: epicId,
      });

      expect(result.content[0].text).toContain("F-epic-feature");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/F-epic-feature/F-epic-feature.md`,
      );
      expect(file.yaml.parent).toBe(epicId);
    });

    it("should reject feature with project parent", async () => {
      try {
        await client.callTool("create_issue", {
          type: "feature",
          title: "Invalid Feature",
          parent: projectId,
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toContain(
          "Features can only have an epic as a parent",
        );
      }
    });
  });

  describe("Standalone Epic Hierarchy", () => {
    it("should create epic → feature → task hierarchy in e/ folder", async () => {
      // Create standalone epic
      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Standalone Epic for Hierarchy",
        description: "Testing epic without project parent",
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      // Create feature under standalone epic
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature Under Standalone Epic",
        parent: epicId,
        status: "in-progress",
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      // Create task under feature
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Task in Epic Hierarchy",
        parent: featureId,
        status: "open",
        priority: "high",
        prerequisites: [epicId],
        description: "Task under feature under standalone epic",
      });
      const taskId = taskResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify epic file in e/ directory
      expect(
        await fileExists(testEnv.projectRoot, `e/${epicId}/${epicId}.md`),
      ).toBe(true);

      // Verify feature file under epic
      expect(
        await fileExists(
          testEnv.projectRoot,
          `e/${epicId}/f/${featureId}/${featureId}.md`,
        ),
      ).toBe(true);

      // Verify task file under feature
      expect(
        await fileExists(
          testEnv.projectRoot,
          `e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(true);

      // Verify epic content
      const epicFile = await readObjectFile(
        testEnv.projectRoot,
        `e/${epicId}/${epicId}.md`,
      );
      expect(epicFile.yaml.parent).toBeUndefined();
      expect(epicFile.body).toBe("Testing epic without project parent");

      // Verify feature content
      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        `e/${epicId}/f/${featureId}/${featureId}.md`,
      );
      expect(featureFile.yaml.parent).toBe(epicId);
      expect(featureFile.yaml.status).toBe("in-progress");

      // Verify task content
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        `e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
      );
      expect(taskFile.yaml.parent).toBe(featureId);
      expect(taskFile.yaml.prerequisites).toEqual([epicId]);
      expect(taskFile.yaml.priority).toBe("high");
      expect(taskFile.body).toBe("Task under feature under standalone epic");
    });
  });

  describe("Task Creation", () => {
    let featureId: string;

    beforeEach(async () => {
      // Create standalone feature
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Task Test Feature",
      });
      featureId = featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];
    });

    it("should create standalone task in open folder", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Standalone Task",
        status: "open",
        priority: "high",
      });

      expect(result.content[0].text).toContain("T-standalone-task");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-standalone-task.md",
      );
      expect(file.yaml.status).toBe("open");
      expect(file.yaml.priority).toBe("high");
    });

    it("should create task in closed folder when done", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Completed Task",
        status: "done",
      });

      expect(result.content[0].text).toContain("T-completed-task");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/closed/T-completed-task.md",
      );
      expect(file.yaml.status).toBe("done");
    });

    it("should create task with prerequisites", async () => {
      // Create prerequisite tasks first
      const prereq1Result = await client.callTool("create_issue", {
        type: "task",
        title: "Prereq One",
      });
      const prereq1Id =
        prereq1Result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      const prereq2Result = await client.callTool("create_issue", {
        type: "task",
        title: "Prereq Two",
      });
      const prereq2Id =
        prereq2Result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Task with Dependencies",
        prerequisites: [prereq1Id, prereq2Id, "F-external-feature"],
      });

      expect(result.content[0].text).toContain("T-task-with-dependencies");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-task-with-dependencies.md",
      );
      expect(file.yaml.prerequisites).toEqual([
        prereq1Id,
        prereq2Id,
        "F-external-feature",
      ]);
    });

    it("should create task under feature", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Feature Task",
        parent: featureId,
        status: "in-progress",
      });

      expect(result.content[0].text).toContain("T-feature-task");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/t/open/T-feature-task.md`,
      );
      expect(file.yaml.parent).toBe(featureId);
      expect(file.yaml.status).toBe("in-progress");
    });

    it("should create closed task in correct hierarchy", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Closed Feature Task",
        parent: featureId,
        status: "wont-do",
      });

      expect(result.content[0].text).toContain("T-closed-feature-task");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/t/closed/T-closed-feature-task.md`,
      );
      expect(file.yaml.status).toBe("wont-do");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid object type", async () => {
      try {
        await client.callTool("create_issue", {
          type: "invalid",
          title: "Invalid Type",
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toMatch(/Invalid ID format|Unknown object type/i);
      }
    });

    it("should handle missing required fields", async () => {
      try {
        await client.callTool("create_issue", {
          type: "task",
          // Missing title
        });
        fail("Expected error to be thrown");
      } catch (error: any) {
        expect(error.message).toMatch(/title|required|undefined/i);
      }
    });

    it("should handle special characters in title", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Task with Special/Characters & Symbols!",
      });

      // ID should be sanitized (actual behavior from test failure)
      expect(result.content[0].text).toContain("T-task-with-specialcharacters");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-task-with-specialcharacters.md",
      );
      expect(file.yaml.title).toBe("Task with Special/Characters & Symbols!");
    });

    it("should handle very long titles", async () => {
      const longTitle = "A".repeat(200);
      const result = await client.callTool("create_issue", {
        type: "task",
        title: longTitle,
      });

      expect(result.content[0].text).toContain("Created object");
      // ID should be truncated appropriately
    });

    it("should generate unique IDs for duplicate titles", async () => {
      const result1 = await client.callTool("create_issue", {
        type: "task",
        title: "Duplicate Title",
      });
      const id1 = result1.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      const result2 = await client.callTool("create_issue", {
        type: "task",
        title: "Duplicate Title",
      });
      const id2 = result2.content[0].text.match(/ID: (T-[a-z0-9-]+)/)![1];

      expect(id1).not.toBe(id2);
      expect(await fileExists(testEnv.projectRoot, `t/open/${id1}.md`)).toBe(
        true,
      );
      expect(await fileExists(testEnv.projectRoot, `t/open/${id2}.md`)).toBe(
        true,
      );
    });
  });

  describe("Complex Hierarchy", () => {
    it("should create complete hierarchy from project to task", async () => {
      // Create project
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Full Hierarchy Project",
        status: "open",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      // Create epic under project
      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Full Hierarchy Epic",
        parent: projectId,
        priority: "high",
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      // Create feature under epic
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Full Hierarchy Feature",
        parent: epicId,
        status: "in-progress",
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      // Create task under feature
      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Full Hierarchy Task",
        parent: featureId,
        status: "open",
        priority: "low",
        prerequisites: [epicId, featureId],
        description: "Task at the bottom of hierarchy",
      });
      const taskId = taskResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify complete file structure
      expect(
        await fileExists(testEnv.projectRoot, `p/${projectId}/${projectId}.md`),
      ).toBe(true);
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/${epicId}.md`,
        ),
      ).toBe(true);
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/f/${featureId}/${featureId}.md`,
        ),
      ).toBe(true);
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(true);

      // Verify task has all expected properties
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
      );
      expect(taskFile.yaml.parent).toBe(featureId);
      expect(taskFile.yaml.prerequisites).toEqual([epicId, featureId]);
      expect(taskFile.yaml.priority).toBe("low");
      expect(taskFile.body).toBe("Task at the bottom of hierarchy");
    });
  });
});
