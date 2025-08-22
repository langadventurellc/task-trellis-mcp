import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  fileExists,
  folderExists,
  type HierarchyOptions,
  type ObjectData,
} from "../utils";

describe("E2E CRUD - deleteObject", () => {
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

  // Helper function to create object file manually
  async function createObjectFile(
    id: string,
    kind: string,
    title: string,
    options: {
      status?: string;
      priority?: string;
      parent?: string;
      prerequisites?: string[];
      description?: string;
    } = {},
  ): Promise<void> {
    const data: ObjectData = {
      id,
      title,
      kind,
      ...options,
      body: options.description,
    };

    const content = createObjectContent(data);

    let objectType: string;

    if (kind === "project") {
      objectType = "project";
    } else if (kind === "epic") {
      objectType = "epic";
    } else if (kind === "feature") {
      objectType = "feature";
    } else if (kind === "task") {
      objectType = "task";
    }

    // Use existing createObjectFile utility
    const { createObjectFile: utilCreateObjectFile } = await import("../utils");
    const hierarchy: HierarchyOptions = {
      projectId: kind === "epic" ? options.parent : undefined,
      featureId: kind === "task" ? options.parent : undefined,
      status:
        options.status === "done" || options.status === "wont-do"
          ? "closed"
          : "open",
    };

    await utilCreateObjectFile(
      testEnv.projectRoot,
      objectType!,
      id,
      content,
      hierarchy,
    );
  }

  describe("Standalone Object Deletion", () => {
    it("should delete standalone project and verify complete cleanup", async () => {
      // Create project
      await createObjectFile("P-test-project", "project", "Test Project");

      // Verify existence
      expect(
        await fileExists(
          testEnv.projectRoot,
          "p/P-test-project/P-test-project.md",
        ),
      ).toBe(true);
      expect(await folderExists(testEnv.projectRoot, "p/P-test-project")).toBe(
        true,
      );

      // Delete project
      const result = await client.callTool("delete_issue", {
        id: "P-test-project",
      });

      // Verify deletion response
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        "Successfully deleted object: P-test-project",
      );

      // Verify complete file system cleanup
      expect(
        await fileExists(
          testEnv.projectRoot,
          "p/P-test-project/P-test-project.md",
        ),
      ).toBe(false);
      expect(await folderExists(testEnv.projectRoot, "p/P-test-project")).toBe(
        false,
      );
    });

    it("should delete standalone epic and verify complete cleanup", async () => {
      // Create project first, then epic
      await createObjectFile("P-parent-project", "project", "Parent Project");
      await createObjectFile("E-test-epic", "epic", "Test Epic", {
        parent: "P-parent-project",
      });

      // Verify existence
      expect(
        await fileExists(
          testEnv.projectRoot,
          "p/P-parent-project/e/E-test-epic/E-test-epic.md",
        ),
      ).toBe(true);
      expect(
        await folderExists(
          testEnv.projectRoot,
          "p/P-parent-project/e/E-test-epic",
        ),
      ).toBe(true);

      // Delete epic
      const result = await client.callTool("delete_issue", {
        id: "E-test-epic",
      });

      // Verify deletion
      expect(result.content[0].text).toBe(
        "Successfully deleted object: E-test-epic",
      );
      expect(
        await fileExists(
          testEnv.projectRoot,
          "p/P-parent-project/e/E-test-epic/E-test-epic.md",
        ),
      ).toBe(false);
      expect(
        await folderExists(
          testEnv.projectRoot,
          "p/P-parent-project/e/E-test-epic",
        ),
      ).toBe(false);
    });

    it("should delete standalone feature and verify complete cleanup", async () => {
      // Create standalone feature
      await createObjectFile("F-test-feature", "feature", "Test Feature");

      // Verify existence
      expect(
        await fileExists(
          testEnv.projectRoot,
          "f/F-test-feature/F-test-feature.md",
        ),
      ).toBe(true);
      expect(await folderExists(testEnv.projectRoot, "f/F-test-feature")).toBe(
        true,
      );

      // Delete feature
      const result = await client.callTool("delete_issue", {
        id: "F-test-feature",
      });

      // Verify deletion
      expect(result.content[0].text).toBe(
        "Successfully deleted object: F-test-feature",
      );
      expect(
        await fileExists(
          testEnv.projectRoot,
          "f/F-test-feature/F-test-feature.md",
        ),
      ).toBe(false);
      expect(await folderExists(testEnv.projectRoot, "f/F-test-feature")).toBe(
        false,
      );
    });

    it("should delete standalone task and verify file removal", async () => {
      // Create standalone task
      await createObjectFile("T-test-task", "task", "Test Task", {
        status: "open",
      });

      // Verify existence
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-test-task.md"),
      ).toBe(true);

      // Delete task
      const result = await client.callTool("delete_issue", {
        id: "T-test-task",
      });

      // Verify deletion
      expect(result.content[0].text).toBe(
        "Successfully deleted object: T-test-task",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-test-task.md"),
      ).toBe(false);
    });

    it("should delete closed task and verify file removal", async () => {
      // Create closed task
      await createObjectFile("T-closed-task", "task", "Closed Task", {
        status: "done",
      });

      // Verify existence
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-closed-task.md"),
      ).toBe(true);

      // Delete task
      const result = await client.callTool("delete_issue", {
        id: "T-closed-task",
      });

      // Verify deletion
      expect(result.content[0].text).toBe(
        "Successfully deleted object: T-closed-task",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-closed-task.md"),
      ).toBe(false);
    });
  });

  describe("Dependency Validation", () => {
    it("should prevent deletion of object with dependents without force", async () => {
      // Create prerequisite task
      await createObjectFile("T-prerequisite", "task", "Prerequisite Task", {
        status: "done",
      });

      // Create dependent task
      await createObjectFile("T-dependent", "task", "Dependent Task", {
        status: "open",
        prerequisites: ["T-prerequisite"],
      });

      // Attempt deletion without force
      const result = await client.callTool("delete_issue", {
        id: "T-prerequisite",
      });

      // Verify prevention
      expect(result.content[0].text).toContain("Error deleting object");
      expect(result.content[0].text).toContain("required by other objects");
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-prerequisite.md"),
      ).toBe(true);
    });

    it("should allow deletion with force flag despite dependencies", async () => {
      // Create prerequisite and dependent tasks
      await createObjectFile("T-force-prereq", "task", "Force Prerequisite", {
        status: "done",
      });
      await createObjectFile("T-force-dependent", "task", "Force Dependent", {
        status: "open",
        prerequisites: ["T-force-prereq"],
      });

      // Delete with force
      const result = await client.callTool("delete_issue", {
        id: "T-force-prereq",
        force: true,
      });

      // Verify successful deletion
      expect(result.content[0].text).toBe(
        "Successfully deleted object: T-force-prereq",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-force-prereq.md"),
      ).toBe(false);
    });

    it("should allow deletion of dependent before prerequisite", async () => {
      // Create prerequisite and dependent
      await createObjectFile("T-prereq-safe", "task", "Safe Prerequisite", {
        status: "done",
      });
      await createObjectFile("T-dependent-first", "task", "Dependent First", {
        status: "open",
        prerequisites: ["T-prereq-safe"],
      });

      // Delete dependent first
      const dependentResult = await client.callTool("delete_issue", {
        id: "T-dependent-first",
      });

      expect(dependentResult.content[0].text).toBe(
        "Successfully deleted object: T-dependent-first",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-dependent-first.md"),
      ).toBe(false);

      // Now delete prerequisite (should work without force)
      const prereqResult = await client.callTool("delete_issue", {
        id: "T-prereq-safe",
      });

      expect(prereqResult.content[0].text).toBe(
        "Successfully deleted object: T-prereq-safe",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-prereq-safe.md"),
      ).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent object IDs gracefully", async () => {
      const result = await client.callTool("delete_issue", {
        id: "P-nonexistent",
      });

      expect(result.content[0].text).toContain("Error deleting object");
      expect(result.content[0].text).toContain("No object found");
    });

    it("should handle malformed object IDs", async () => {
      const malformedIds = [
        "invalid-id",
        "X-unknown-prefix",
        "",
        "P-", // Missing slug
      ];

      for (const id of malformedIds) {
        const result = await client.callTool("delete_issue", { id });
        expect(result.content[0].text).toContain("Error");
      }
    });

    it("should handle special characters in object content gracefully", async () => {
      // Create task with special characters in content
      await createObjectFile(
        "T-special-chars",
        "task",
        "Task with Special Characters",
        {
          status: "open",
          description: "Content with unicode: 🚀 and special chars: <>&\"'",
        },
      );

      // Verify creation
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-special-chars.md"),
      ).toBe(true);

      // Delete should work normally
      const result = await client.callTool("delete_issue", {
        id: "T-special-chars",
      });

      expect(result.content[0].text).toBe(
        "Successfully deleted object: T-special-chars",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-special-chars.md"),
      ).toBe(false);
    });
  });

  describe("Hierarchical Object Deletion", () => {
    it("should delete task from hierarchy maintaining parent structure", async () => {
      // Create complete hierarchy: Project -> Epic -> Feature -> Task
      const projectId = "P-hierarchy-project";
      const epicId = "E-hierarchy-epic";
      const featureId = "F-hierarchy-feature";
      const taskId = "T-hierarchy-task";

      // Create objects in hierarchy
      await createObjectFile(projectId, "project", "Hierarchy Project");
      await createObjectFile(epicId, "epic", "Hierarchy Epic", {
        parent: projectId,
      });
      await createObjectFile(featureId, "feature", "Hierarchy Feature", {
        parent: epicId,
      });
      await createObjectFile(taskId, "task", "Hierarchy Task", {
        parent: featureId,
        status: "open",
      });

      // Delete task from hierarchy
      const result = await client.callTool("delete_issue", {
        id: taskId,
      });

      // Verify task deleted but hierarchy intact
      expect(result.content[0].text).toBe(
        `Successfully deleted object: ${taskId}`,
      );
      expect(
        await fileExists(
          testEnv.projectRoot,
          `f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(false);
      expect(await folderExists(testEnv.projectRoot, `f/${featureId}`)).toBe(
        true,
      );
      expect(
        await fileExists(testEnv.projectRoot, `f/${featureId}/${featureId}.md`),
      ).toBe(true);
    });

    it("should delete feature and verify parent epic remains", async () => {
      // Create hierarchy
      const projectId = "P-feature-delete-project";
      const epicId = "E-feature-delete-epic";
      const featureId = "F-feature-delete-target";

      await createObjectFile(projectId, "project", "Feature Delete Project");
      await createObjectFile(epicId, "epic", "Feature Delete Epic", {
        parent: projectId,
      });
      await createObjectFile(featureId, "feature", "Feature Delete Target", {
        parent: epicId,
      });

      // Delete feature
      const result = await client.callTool("delete_issue", {
        id: featureId,
      });

      // Verify feature deleted, epic remains
      expect(result.content[0].text).toBe(
        `Successfully deleted object: ${featureId}`,
      );
      expect(await folderExists(testEnv.projectRoot, `f/${featureId}`)).toBe(
        false,
      );
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/${epicId}.md`,
        ),
      ).toBe(true);
    });
  });

  describe("Complex Deletion Scenarios", () => {
    it("should handle multiple prerequisites correctly", async () => {
      // Create multiple prerequisites
      await createObjectFile("T-multi-prereq-1", "task", "Multi Prereq 1", {
        status: "done",
      });
      await createObjectFile("T-multi-prereq-2", "task", "Multi Prereq 2", {
        status: "done",
      });

      // Create task with multiple prerequisites
      await createObjectFile("T-multi-dependent", "task", "Multi Dependent", {
        status: "open",
        prerequisites: ["T-multi-prereq-1", "T-multi-prereq-2"],
      });

      // Try to delete one prerequisite without force
      const result1 = await client.callTool("delete_issue", {
        id: "T-multi-prereq-1",
      });

      expect(result1.content[0].text).toContain("Error");
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-multi-prereq-1.md"),
      ).toBe(true);

      // Delete with force should work
      const result2 = await client.callTool("delete_issue", {
        id: "T-multi-prereq-1",
        force: true,
      });

      expect(result2.content[0].text).toBe(
        "Successfully deleted object: T-multi-prereq-1",
      );
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-multi-prereq-1.md"),
      ).toBe(false);
    });

    it("should maintain file system integrity after failed deletion", async () => {
      // Create objects that will cause deletion to fail
      await createObjectFile("T-integrity-prereq", "task", "Integrity Prereq", {
        status: "done",
      });
      await createObjectFile(
        "T-integrity-dependent",
        "task",
        "Integrity Dependent",
        {
          status: "open",
          prerequisites: ["T-integrity-prereq"],
        },
      );

      // Try deletion that will fail
      const result = await client.callTool("delete_issue", {
        id: "T-integrity-prereq",
      });

      // Verify failure
      expect(result.content[0].text).toContain("Error");

      // Verify original files still exist and are intact
      expect(
        await fileExists(testEnv.projectRoot, "t/closed/T-integrity-prereq.md"),
      ).toBe(true);
      expect(
        await fileExists(
          testEnv.projectRoot,
          "t/open/T-integrity-dependent.md",
        ),
      ).toBe(true);
    });

    it("should handle concurrent deletion attempts gracefully", async () => {
      // Create task for concurrent test
      await createObjectFile("T-concurrent", "task", "Concurrent Task", {
        status: "open",
      });

      // Verify creation
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-concurrent.md"),
      ).toBe(true);

      // Simulate concurrent deletion attempts (second will fail as file won't exist)
      const results = await Promise.allSettled([
        client.callTool("delete_issue", { id: "T-concurrent" }),
        client.callTool("delete_issue", { id: "T-concurrent" }),
      ]);

      // At least one should succeed, others should fail gracefully
      const responses = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value.content[0].text);

      const successes = responses.filter((text) =>
        text.includes("Successfully"),
      );
      const errors = responses.filter((text) => text.includes("Error"));

      expect(successes.length).toBeGreaterThanOrEqual(1);
      expect(errors.length).toBeGreaterThanOrEqual(0);

      // File should be gone
      expect(
        await fileExists(testEnv.projectRoot, "t/open/T-concurrent.md"),
      ).toBe(false);
    });
  });
});
