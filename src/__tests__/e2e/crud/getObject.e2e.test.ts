import * as fs from "fs/promises";
import * as path from "path";
import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  parseGetObjectResponse,
  type ObjectData,
} from "../utils";

describe("E2E CRUD - getObject", () => {
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

  describe("Retrieve Existing Objects", () => {
    it("should retrieve an existing project with all fields", async () => {
      const projectData: ObjectData = {
        id: "P-test-project",
        title: "Test Project",
        status: "open",
        priority: "high",
        prerequisites: ["P-dep1", "P-dep2"],
        affectedFiles: { "src/index.ts": "Initial setup" },
        log: ["Created project", "Updated priority"],
        schema: "1.1",
        childrenIds: ["E-child-epic"],
        body: "This is the project description",
      };

      const content = createObjectContent(projectData);
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-test-project",
        content,
      );

      // Create the expected child epic
      const epicData: ObjectData = {
        id: "E-child-epic",
        title: "Child Epic",
        status: "open",
        priority: "normal",
        parent: "P-test-project",
        body: "Child epic description",
      };
      const epicContent = createObjectContent(epicData);
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-child-epic",
        epicContent,
        { projectId: "P-test-project" },
      );

      const result = await client.callTool("get_issue", {
        id: "P-test-project",
      });

      expect(result.content[0].type).toBe("text");
      const object = parseGetObjectResponse(result.content[0].text as string);

      expect(object.id).toBe("P-test-project");
      expect(object.type).toBe("project");
      expect(object.title).toBe("Test Project");
      expect(object.status).toBe("open");
      expect(object.priority).toBe("high");
      expect(object.parent).toBeUndefined();
      expect(object.prerequisites).toEqual(["P-dep1", "P-dep2"]);
      expect(object.affectedFiles).toEqual({ "src/index.ts": "Initial setup" });
      expect(object.log).toEqual(["Created project", "Updated priority"]);
      expect(object.schema).toBe("1.1");
      expect(object.body).toBe("This is the project description");
    });

    it("should retrieve an epic with parent project", async () => {
      const epicData: ObjectData = {
        id: "E-test-epic",
        title: "Test Epic",
        status: "in-progress",
        priority: "medium",
        parent: "P-parent-project",
        body: "Epic description",
      };

      const content = createObjectContent(epicData);
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-test-epic",
        content,
        { projectId: "P-parent-project" },
      );

      const result = await client.callTool("get_issue", {
        id: "E-test-epic",
      });

      const object = parseGetObjectResponse(result.content[0].text as string);
      expect(object.id).toBe("E-test-epic");
      expect(object.type).toBe("epic");
      expect(object.parent).toBe("P-parent-project");
    });

    it("should retrieve a standalone feature", async () => {
      const featureData: ObjectData = {
        id: "F-standalone-feature",
        title: "Standalone Feature",
        status: "draft",
        priority: "low",
      };

      const content = createObjectContent(featureData);
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-standalone-feature",
        content,
      );

      const result = await client.callTool("get_issue", {
        id: "F-standalone-feature",
      });

      const object = parseGetObjectResponse(result.content[0].text as string);
      expect(object.id).toBe("F-standalone-feature");
      expect(object.type).toBe("feature");
      expect(object.parent).toBeUndefined();
    });

    it("should retrieve a task with various statuses", async () => {
      // Open task
      const openTaskData: ObjectData = {
        id: "T-open-task",
        title: "Open Task",
        status: "open",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-open-task",
        createObjectContent(openTaskData),
        { status: "open" },
      );

      // Closed task
      const closedTaskData: ObjectData = {
        id: "T-closed-task",
        title: "Closed Task",
        status: "done",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-closed-task",
        createObjectContent(closedTaskData),
        { status: "closed" },
      );

      const openResult = await client.callTool("get_issue", {
        id: "T-open-task",
      });
      const openObject = parseGetObjectResponse(
        openResult.content[0].text as string,
      );
      expect(openObject.status).toBe("open");

      const closedResult = await client.callTool("get_issue", {
        id: "T-closed-task",
      });
      const closedObject = parseGetObjectResponse(
        closedResult.content[0].text as string,
      );
      expect(closedObject.status).toBe("done");
    });
  });

  describe("Complex Hierarchies", () => {
    it("should retrieve objects in a complete hierarchy", async () => {
      // Create complete hierarchy: Project -> Epic -> Feature -> Task
      const projectId = "P-hierarchy-project";
      const epicId = "E-hierarchy-epic";
      const featureId = "F-hierarchy-feature";
      const taskId = "T-hierarchy-task";

      // Create project
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        projectId,
        createObjectContent({
          id: projectId,
          title: "Hierarchy Project",
          childrenIds: [epicId],
        }),
      );

      // Create epic under project
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        epicId,
        createObjectContent({
          id: epicId,
          title: "Hierarchy Epic",
          parent: projectId,
          childrenIds: [featureId],
        }),
        { projectId },
      );

      // Create feature under epic
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        featureId,
        createObjectContent({
          id: featureId,
          title: "Hierarchy Feature",
          parent: epicId,
          childrenIds: [taskId],
        }),
        { projectId, epicId },
      );

      // Create task under feature
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        taskId,
        createObjectContent({
          id: taskId,
          title: "Hierarchy Task",
          parent: featureId,
          prerequisites: [epicId, featureId],
        }),
        { projectId, epicId, featureId, status: "open" },
      );

      // Verify each object can be retrieved and has correct parent/children
      const projectResult = await client.callTool("get_issue", {
        id: projectId,
      });
      const project = parseGetObjectResponse(
        projectResult.content[0].text as string,
      );
      expect(project.childrenIds).toContain(epicId);
      expect(project.parent).toBeUndefined();

      const epicResult = await client.callTool("get_issue", { id: epicId });
      const epic = parseGetObjectResponse(epicResult.content[0].text as string);
      expect(epic.parent).toBe(projectId);
      expect(epic.childrenIds).toContain(featureId);

      const featureResult = await client.callTool("get_issue", {
        id: featureId,
      });
      const feature = parseGetObjectResponse(
        featureResult.content[0].text as string,
      );
      expect(feature.parent).toBe(epicId);
      expect(feature.childrenIds).toContain(taskId);

      const taskResult = await client.callTool("get_issue", { id: taskId });
      const task = parseGetObjectResponse(taskResult.content[0].text as string);
      expect(task.parent).toBe(featureId);
      expect(task.prerequisites).toEqual([epicId, featureId]);
    });

    it("should retrieve standalone feature with tasks", async () => {
      const featureId = "F-standalone-with-tasks";
      const task1Id = "T-task-one";
      const task2Id = "T-task-two";

      // Create standalone feature
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        featureId,
        createObjectContent({
          id: featureId,
          title: "Feature with Tasks",
          childrenIds: [task1Id, task2Id],
        }),
      );

      // Create tasks under standalone feature
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        task1Id,
        createObjectContent({
          id: task1Id,
          title: "Task One",
          parent: featureId,
        }),
        { featureId, status: "open" },
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        task2Id,
        createObjectContent({
          id: task2Id,
          title: "Task Two",
          parent: featureId,
          status: "done",
        }),
        { featureId, status: "closed" },
      );

      const featureResult = await client.callTool("get_issue", {
        id: featureId,
      });
      const feature = parseGetObjectResponse(
        featureResult.content[0].text as string,
      );
      expect(feature.childrenIds).toEqual([task1Id, task2Id]);

      const task1Result = await client.callTool("get_issue", { id: task1Id });
      const task1 = parseGetObjectResponse(
        task1Result.content[0].text as string,
      );
      expect(task1.parent).toBe(featureId);

      const task2Result = await client.callTool("get_issue", { id: task2Id });
      const task2 = parseGetObjectResponse(
        task2Result.content[0].text as string,
      );
      expect(task2.parent).toBe(featureId);
      expect(task2.status).toBe("done");
    });

    it("should properly display affected files in response (regression test)", async () => {
      // This test specifically validates the bug fix where affected files
      // weren't being properly serialized due to Map JSON.stringify issue
      const taskData: ObjectData = {
        id: "T-affected-files-test",
        title: "Task with Affected Files",
        status: "in-progress",
        priority: "high",
        affectedFiles: {
          "src/components/Button.tsx": "Added new button component",
          "src/styles/theme.css": "Updated button theme",
          "tests/Button.test.tsx": "Added comprehensive tests",
          "docs/components.md": "Updated component documentation",
        },
        log: [
          "Started implementation",
          "Added component structure",
          "Implemented styling",
          "Added tests and documentation",
        ],
      };

      const content = createObjectContent(taskData);
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-affected-files-test",
        content,
      );

      const result = await client.callTool("get_issue", {
        id: "T-affected-files-test",
      });

      expect(result.content[0].type).toBe("text");
      const object = parseGetObjectResponse(result.content[0].text as string);

      // Verify affected files are properly populated (not empty)
      expect(object.affectedFiles).toBeDefined();
      expect(typeof object.affectedFiles).toBe("object");
      expect(
        Object.keys(object.affectedFiles as Record<string, string>),
      ).toHaveLength(4);

      // Verify specific affected files
      expect(object.affectedFiles["src/components/Button.tsx"]).toBe(
        "Added new button component",
      );
      expect(object.affectedFiles["src/styles/theme.css"]).toBe(
        "Updated button theme",
      );
      expect(object.affectedFiles["tests/Button.test.tsx"]).toBe(
        "Added comprehensive tests",
      );
      expect(object.affectedFiles["docs/components.md"]).toBe(
        "Updated component documentation",
      );

      // Verify log is also properly populated
      expect(object.log).toHaveLength(4);
      expect(object.log).toContain("Started implementation");
      expect(object.log).toContain("Added tests and documentation");

      // Verify that the response text contains the affected files content
      const responseText = result.content[0].text as string;
      expect(responseText).toContain("src/components/Button.tsx");
      expect(responseText).toContain("Added new button component");
      expect(responseText).toContain("src/styles/theme.css");
      expect(responseText).toContain("Updated button theme");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent object IDs", async () => {
      const result = await client.callTool("get_issue", {
        id: "P-nonexistent",
      });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        'Object with ID "P-nonexistent" not found',
      );
    });

    it("should handle malformed object IDs", async () => {
      const malformedIds = [
        "invalid-id",
        "X-unknown-prefix",
        "P_wrong_separator",
        "",
        "P-", // Missing slug
        "-missing-prefix",
      ];

      for (const id of malformedIds) {
        const result = await client.callTool("get_issue", { id });

        expect(result.content[0].type).toBe("text");
        const text = result.content[0].text;

        // Should either be "not found" or contain "Error"
        const isNotFound = text === `Object with ID "${id}" not found`;
        const isError = text.startsWith(
          `Error retrieving object with ID "${id}":`,
        );

        expect(isNotFound || isError).toBe(true);
      }
    });

    it("should handle corrupted object files", async () => {
      // Create a file with invalid YAML frontmatter
      const corruptedContent =
        "---\ninvalid yaml: [unclosed\n---\n\nBody content";
      const filePath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-corrupted",
        "P-corrupted.md",
      );

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, corruptedContent, "utf-8");

      const result = await client.callTool("get_issue", {
        id: "P-corrupted",
      });

      expect(result.content[0].type).toBe("text");
      // Should either not find it or report an error
      const text = result.content[0].text;
      expect(text.includes("not found") || text.includes("Error")).toBe(true);
    });

    it("should handle missing required fields in object", async () => {
      // Create object with missing required fields
      const incompleteContent = `---
id: P-incomplete
# Missing title, status, priority
---

Body content`;

      const filePath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-incomplete",
        "P-incomplete.md",
      );

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, incompleteContent, "utf-8");

      const result = await client.callTool("get_issue", {
        id: "P-incomplete",
      });

      // The system should either not find it or report an error
      expect(result.content[0].type).toBe("text");
      const text = result.content[0].text;
      expect(text.includes("not found") || text.includes("Error")).toBe(true);
    });
  });

  describe("Object Type Inference", () => {
    it("should correctly infer object types from ID prefixes", async () => {
      const testCases = [
        { id: "P-project", type: "project", objectType: "project" },
        {
          id: "E-epic",
          type: "epic",
          objectType: "epic",
          hierarchy: { projectId: "P-parent" },
        },
        { id: "F-feature", type: "feature", objectType: "feature" },
        { id: "T-task", type: "task", objectType: "task" },
      ];

      for (const testCase of testCases) {
        const content = createObjectContent({
          id: testCase.id,
          title: `Test ${testCase.type}`,
          parent: testCase.hierarchy?.projectId,
        });

        await createObjectFile(
          testEnv.projectRoot,
          testCase.objectType,
          testCase.id,
          content,
          testCase.hierarchy,
        );

        const result = await client.callTool("get_issue", {
          id: testCase.id,
        });

        const object = parseGetObjectResponse(result.content[0].text as string);
        expect(object.type).toBe(testCase.type);
        expect(object.id).toBe(testCase.id);
      }
    });

    it("should handle mixed case and special characters in IDs", async () => {
      // Note: Based on existing tests, IDs are typically lowercase with hyphens
      // but we should test the system's handling of edge cases
      const specialIds = [
        "P-MixedCase-Project",
        "E-epic-with-numbers-123",
        "F-feature_with_underscores",
        "T-task-with-many-hyphens",
      ];

      // Test that the system handles these IDs gracefully
      for (const id of specialIds) {
        const result = await client.callTool("get_issue", { id });

        expect(result.content[0].type).toBe("text");
        // Should return "not found" since we haven't created these
        expect(result.content[0].text).toContain("not found");
      }
    });
  });

  describe("Field Combinations", () => {
    it("should handle objects with minimal fields", async () => {
      const minimalContent = `---
id: P-minimal
title: Minimal Project
status: draft
priority: low
prerequisites: []
affectedFiles: {}
log: []
schema: "1.0"
childrenIds: []
created: "2024-01-01T00:00:00.000Z"
updated: "2024-01-01T00:00:00.000Z"
---

`;

      const filePath = path.join(
        testEnv.projectRoot,
        ".trellis",
        "p",
        "P-minimal",
        "P-minimal.md",
      );

      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, minimalContent, "utf-8");

      const result = await client.callTool("get_issue", {
        id: "P-minimal",
      });

      const object = parseGetObjectResponse(result.content[0].text as string);
      expect(object.id).toBe("P-minimal");
      expect(object.prerequisites).toEqual([]);
      expect(object.affectedFiles).toEqual({});
      expect(object.body).toBe("");
    });

    it("should handle objects with maximum complexity", async () => {
      const complexData = {
        id: "T-complex",
        title: "Complex Task with All Fields",
        status: "in-progress",
        priority: "high",
        parent: "F-parent-feature",
        prerequisites: [
          "T-prereq1",
          "T-prereq2",
          "F-feature-dep",
          "E-epic-dep",
        ],
        affectedFiles: {
          "src/index.ts": "Updated main entry",
          "src/utils/helper.ts": "Added utility function",
          "tests/index.test.ts": "Added test coverage",
        },
        log: [
          "2024-01-01: Created task",
          "2024-01-02: Updated priority to critical",
          "2024-01-03: Added prerequisites",
          "2024-01-04: Started implementation",
        ],
        schema: "2.0",
        childrenIds: [], // Tasks don't have children
        body: `# Complex Task Implementation

## Description
This task involves multiple components and dependencies.

## Implementation Details
- Step 1: Analyze requirements
- Step 2: Design solution
- Step 3: Implement changes
- Step 4: Test thoroughly

## Notes
This is a complex task with extensive documentation.`,
      };

      const content = createObjectContent(complexData);
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-complex",
        content,
        { featureId: "F-parent-feature", status: "open" },
      );

      const result = await client.callTool("get_issue", {
        id: "T-complex",
      });

      const object = parseGetObjectResponse(result.content[0].text as string);
      expect(object.id).toBe("T-complex");
      expect(object.prerequisites).toHaveLength(4);
      expect(Object.keys(object.affectedFiles as object)).toHaveLength(3);
      expect(object.affectedFiles).toEqual({
        "src/index.ts": "Updated main entry",
        "src/utils/helper.ts": "Added utility function",
        "tests/index.test.ts": "Added test coverage",
      });
      expect(object.log).toHaveLength(4);
      expect(object.body).toContain("# Complex Task Implementation");
      expect(object.body).toContain("This is a complex task");
    });
  });
});
