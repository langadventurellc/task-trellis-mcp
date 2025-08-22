import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  parseUpdateObjectResponse,
  readObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E CRUD - updateObject", () => {
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

  describe("Individual Field Updates", () => {
    it("should update priority field and persist to file", async () => {
      // Create initial task
      const taskData: ObjectData = {
        id: "T-priority-test",
        title: "Priority Test Task",
        status: "open",
        priority: "low",
        body: "Original body content",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-priority-test",
        createObjectContent(taskData),
      );

      // Update priority
      const result = await client.callTool("update_issue", {
        id: "T-priority-test",
        priority: "high",
      });

      expect(result.content[0].type).toBe("text");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.priority).toBe("high");
      expect(updatedObject.title).toBe("Priority Test Task");
      expect(updatedObject.body).toBe("Original body content");

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-priority-test.md",
      );
      expect(file.yaml.priority).toBe("high");
      expect(file.body).toBe("Original body content");
    });

    it("should update status field and persist to file", async () => {
      // Create initial project
      const projectData: ObjectData = {
        id: "P-status-test",
        title: "Status Test Project",
        status: "draft",
        priority: "medium",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-status-test",
        createObjectContent(projectData),
      );

      // Update status
      const result = await client.callTool("update_issue", {
        id: "P-status-test",
        status: "open",
      });

      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("open");

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-status-test/P-status-test.md",
      );
      expect(file.yaml.status).toBe("open");
    });

    it("should update body content", async () => {
      // Create initial feature
      const featureData: ObjectData = {
        id: "F-body-test",
        title: "Body Test Feature",
        body: "Original description",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-body-test",
        createObjectContent(featureData),
      );

      // Update body
      const newBody = `# Updated Feature Description

## Overview
This is the new body content with markdown formatting.

## Details
- Point 1
- Point 2`;

      const result = await client.callTool("update_issue", {
        id: "F-body-test",
        body: newBody,
      });

      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.body).toBe(newBody);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "f/F-body-test/F-body-test.md",
      );
      expect(file.body).toBe(newBody);
    });

    it("should update prerequisites array for tasks", async () => {
      // Create prerequisite tasks
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-1",
        createObjectContent({
          id: "T-prereq-1",
          title: "Prerequisite 1",
          status: "done",
        }),
      );
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-2",
        createObjectContent({
          id: "T-prereq-2",
          title: "Prerequisite 2",
          status: "done",
        }),
      );

      // Create main task
      const taskData: ObjectData = {
        id: "T-deps-test",
        title: "Dependencies Test Task",
        prerequisites: ["T-prereq-1"],
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-deps-test",
        createObjectContent(taskData),
      );

      // Update prerequisites
      const result = await client.callTool("update_issue", {
        id: "T-deps-test",
        prerequisites: ["T-prereq-1", "T-prereq-2", "F-external-dep"],
      });

      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.prerequisites).toEqual([
        "T-prereq-1",
        "T-prereq-2",
        "F-external-dep",
      ]);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-deps-test.md",
      );
      expect(file.yaml.prerequisites).toEqual([
        "T-prereq-1",
        "T-prereq-2",
        "F-external-dep",
      ]);
    });
  });

  describe("Multiple Field Updates", () => {
    it("should update multiple fields simultaneously", async () => {
      // Create initial epic
      const epicData: ObjectData = {
        id: "E-multi-update",
        title: "Multi Update Epic",
        status: "draft",
        priority: "low",
        parent: "P-parent-project",
        body: "Initial content",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-multi-update",
        createObjectContent(epicData),
        { projectId: "P-parent-project" },
      );

      // Update multiple fields
      const result = await client.callTool("update_issue", {
        id: "E-multi-update",
        priority: "high",
        status: "open",
        body: "Completely new content with updated priority and status",
        prerequisites: ["P-dep-1", "E-dep-2"],
      });

      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.priority).toBe("high");
      expect(updatedObject.status).toBe("open");
      expect(updatedObject.body).toBe(
        "Completely new content with updated priority and status",
      );
      expect(updatedObject.prerequisites).toEqual(["P-dep-1", "E-dep-2"]);
      expect(updatedObject.title).toBe("Multi Update Epic"); // Unchanged
      expect(updatedObject.parent).toBe("P-parent-project"); // Unchanged

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-parent-project/e/E-multi-update/E-multi-update.md",
      );
      expect(file.yaml.priority).toBe("high");
      expect(file.yaml.status).toBe("open");
      expect(file.yaml.prerequisites).toEqual(["P-dep-1", "E-dep-2"]);
      expect(file.body).toBe(
        "Completely new content with updated priority and status",
      );
    });

    it("should preserve unchanged fields during update", async () => {
      // Create parent hierarchy first
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-project",
        createObjectContent({
          id: "P-project",
          title: "Test Project",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-parent-epic",
        createObjectContent({
          id: "E-parent-epic",
          title: "Parent Epic",
          parent: "P-project",
        }),
        { projectId: "P-project" },
      );

      const featureData: ObjectData = {
        id: "F-preserve-test",
        title: "Preserve Test Feature",
        status: "in-progress",
        priority: "medium",
        parent: "E-parent-epic",
        prerequisites: ["F-dep-1", "T-dep-2"],
        childrenIds: ["T-child-1", "T-child-2"],
        affectedFiles: { "src/main.ts": "Added feature" },
        log: ["Created feature", "Updated status"],
        schema: "1.1",
        body: "Detailed feature description",
      };

      // Create feature in hierarchy
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-preserve-test",
        createObjectContent(featureData),
        { projectId: "P-project", epicId: "E-parent-epic" },
      );

      // Create the expected child tasks
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-child-1",
        createObjectContent({
          id: "T-child-1",
          title: "Child Task 1",
          parent: "F-preserve-test",
        }),
        {
          projectId: "P-project",
          epicId: "E-parent-epic",
          featureId: "F-preserve-test",
          status: "open",
        },
      );
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-child-2",
        createObjectContent({
          id: "T-child-2",
          title: "Child Task 2",
          parent: "F-preserve-test",
        }),
        {
          projectId: "P-project",
          epicId: "E-parent-epic",
          featureId: "F-preserve-test",
          status: "open",
        },
      );

      // Update only priority
      const result = await client.callTool("update_issue", {
        id: "F-preserve-test",
        priority: "high",
      });

      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );

      // Verify only priority changed
      expect(updatedObject.priority).toBe("high");

      // Verify all other fields preserved
      expect(updatedObject.title).toBe("Preserve Test Feature");
      expect(updatedObject.status).toBe("in-progress");
      expect(updatedObject.parent).toBe("E-parent-epic");
      expect(updatedObject.prerequisites).toEqual(["F-dep-1", "T-dep-2"]);
      expect(updatedObject.childrenIds).toEqual(["T-child-1", "T-child-2"]);
      expect(updatedObject.log).toEqual(["Created feature", "Updated status"]);
      expect(updatedObject.body).toBe("Detailed feature description");
    });
  });

  describe("Status Transition Validation", () => {
    it("should allow status change to in-progress when prerequisites are complete", async () => {
      // Create completed prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-done",
        createObjectContent({
          id: "T-prereq-done",
          title: "Completed Prerequisite",
          status: "done",
        }),
      );

      // Create task with prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-can-progress",
        createObjectContent({
          id: "T-can-progress",
          title: "Can Progress Task",
          status: "open",
          prerequisites: ["T-prereq-done"],
        }),
      );

      // Update status to in-progress
      const result = await client.callTool("update_issue", {
        id: "T-can-progress",
        status: "in-progress",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("in-progress");
    });

    it("should reject status change to in-progress when prerequisites incomplete", async () => {
      // Create incomplete prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-incomplete",
        createObjectContent({
          id: "T-prereq-incomplete",
          title: "Incomplete Prerequisite",
          status: "open",
        }),
      );

      // Create task with incomplete prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-blocked",
        createObjectContent({
          id: "T-blocked",
          title: "Blocked Task",
          status: "open",
          prerequisites: ["T-prereq-incomplete"],
        }),
      );

      // Attempt to update status to in-progress
      const result = await client.callTool("update_issue", {
        id: "T-blocked",
        status: "in-progress",
      });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        "Error updating object: Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );

      // Verify file was not updated
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-blocked.md",
      );
      expect(file.yaml.status).toBe("open");
    });

    it("should reject status change to done when prerequisites incomplete", async () => {
      // Create mixed prerequisites
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-done-2",
        createObjectContent({
          id: "T-prereq-done-2",
          title: "Done Prerequisite",
          status: "done",
        }),
      );
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-open",
        createObjectContent({
          id: "T-prereq-open",
          title: "Open Prerequisite",
          status: "open",
        }),
      );

      // Create feature with mixed prerequisites
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-blocked-done",
        createObjectContent({
          id: "F-blocked-done",
          title: "Feature Blocked from Done",
          status: "in-progress",
          prerequisites: ["T-prereq-done-2", "T-prereq-open"],
        }),
      );

      // Attempt to update status to done
      const result = await client.callTool("update_issue", {
        id: "F-blocked-done",
        status: "done",
      });

      expect(result.content[0].text).toBe(
        "Error updating object: Cannot update status to 'done' - prerequisites are not complete. Use force=true to override.",
      );
    });

    it("should allow force update bypassing validation", async () => {
      // Create incomplete prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-prereq-incomplete-2",
        createObjectContent({
          id: "T-prereq-incomplete-2",
          title: "Incomplete Prerequisite 2",
          status: "in-progress",
        }),
      );

      // Create task with incomplete prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-force-update",
        createObjectContent({
          id: "T-force-update",
          title: "Force Update Task",
          status: "open",
          prerequisites: ["T-prereq-incomplete-2"],
        }),
      );

      // Force update status to done
      const result = await client.callTool("update_issue", {
        id: "T-force-update",
        status: "done",
        force: true,
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("done");

      // Verify file moved to closed folder
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/closed/T-force-update.md",
      );
      expect(file.yaml.status).toBe("done");
    });

    it("should allow status changes to draft without validation", async () => {
      // Create task with incomplete prerequisites
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-to-draft",
        createObjectContent({
          id: "T-to-draft",
          title: "To Draft Task",
          status: "open",
          prerequisites: ["T-nonexistent"],
        }),
      );

      // Update to draft (no validation required)
      const result = await client.callTool("update_issue", {
        id: "T-to-draft",
        status: "draft",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("draft");
    });

    it("should allow status changes to wont-do without validation", async () => {
      // Create task with incomplete prerequisites
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-to-wontdo",
        createObjectContent({
          id: "T-to-wontdo",
          title: "To Wont-Do Task",
          status: "open",
          prerequisites: ["T-incomplete"],
        }),
      );

      // Update to wont-do (no validation required)
      const result = await client.callTool("update_issue", {
        id: "T-to-wontdo",
        status: "wont-do",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("wont-do");
    });

    it("should consider wont-do prerequisites as complete", async () => {
      // Create wont-do prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-wontdo-prereq",
        createObjectContent({
          id: "T-wontdo-prereq",
          title: "Wont-Do Prerequisite",
          status: "wont-do",
        }),
      );

      // Create task with wont-do prerequisite
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-with-wontdo",
        createObjectContent({
          id: "T-with-wontdo",
          title: "Task with Wont-Do Prerequisite",
          status: "open",
          prerequisites: ["T-wontdo-prereq"],
        }),
      );

      // Should allow progression since wont-do is considered complete
      const result = await client.callTool("update_issue", {
        id: "T-with-wontdo",
        status: "done",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.status).toBe("done");
    });
  });

  describe("Error Handling", () => {
    it("should handle non-existent object IDs", async () => {
      const result = await client.callTool("update_issue", {
        id: "T-nonexistent",
        priority: "high",
      });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should handle invalid priority values", async () => {
      // Create test task
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-invalid-priority",
        createObjectContent({
          id: "T-invalid-priority",
          title: "Invalid Priority Test",
        }),
      );

      // Attempt update with invalid priority
      const result = await client.callTool("update_issue", {
        id: "T-invalid-priority",
        priority: "critical", // Invalid value
      });

      // The tool accepts any string but may fail on save or return as-is
      // Check the actual behavior
      const responseText = result.content[0].text as string;

      if (responseText.startsWith("Successfully")) {
        // If it accepts invalid values, verify it's stored
        const updatedObject = parseUpdateObjectResponse(responseText);
        expect(updatedObject.priority).toBe("critical");
      } else {
        // If it rejects invalid values
        expect(responseText).toContain("Error");
      }
    });

    it("should handle invalid status values", async () => {
      // Create test project
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-invalid-status",
        createObjectContent({
          id: "P-invalid-status",
          title: "Invalid Status Test",
        }),
      );

      // Attempt update with invalid status
      const result = await client.callTool("update_issue", {
        id: "P-invalid-status",
        status: "completed", // Invalid value (should be "done")
      });

      const responseText = result.content[0].text as string;

      if (responseText.startsWith("Successfully")) {
        // If it accepts invalid values, verify it's stored
        const updatedObject = parseUpdateObjectResponse(responseText);
        expect(updatedObject.status).toBe("completed");
      } else {
        // If it rejects invalid values
        expect(responseText).toContain("Error");
      }
    });

    it("should handle malformed object IDs", async () => {
      const malformedIds = [
        "invalid-id",
        "X-unknown-prefix",
        "T_wrong_separator",
        "",
        "T-", // Missing slug
      ];

      for (const id of malformedIds) {
        const result = await client.callTool("update_issue", {
          id,
          priority: "high",
        });

        expect(result.content[0].type).toBe("text");
        expect(result.content[0].text).toContain("Error");
      }
    });

    it("should handle empty prerequisites array", async () => {
      // Create task with prerequisites
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-clear-prereqs",
        createObjectContent({
          id: "T-clear-prereqs",
          title: "Clear Prerequisites Test",
          prerequisites: ["T-dep-1", "T-dep-2"],
        }),
      );

      // Clear prerequisites
      const result = await client.callTool("update_issue", {
        id: "T-clear-prereqs",
        prerequisites: [],
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.prerequisites).toEqual([]);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-clear-prereqs.md",
      );
      expect(file.yaml.prerequisites).toEqual([]);
    });

    it("should handle very long body content", async () => {
      // Create test feature
      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-long-body",
        createObjectContent({
          id: "F-long-body",
          title: "Long Body Test",
        }),
      );

      // Create very long body content
      const longBody = "A".repeat(10000) + "\n\n" + "B".repeat(10000);

      const result = await client.callTool("update_issue", {
        id: "F-long-body",
        body: longBody,
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.body).toBe(longBody);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "f/F-long-body/F-long-body.md",
      );
      expect(file.body).toBe(longBody);
    });

    it("should handle special characters in body content", async () => {
      // Create test epic
      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-special-chars",
        createObjectContent({
          id: "E-special-chars",
          title: "Special Characters Test",
          parent: "P-parent",
        }),
        { projectId: "P-parent" },
      );

      // Body with special characters
      const specialBody = `# Special Characters Test

## Code blocks
\`\`\`typescript
const test = "value with 'quotes' and 'double quotes'";
\`\`\`

## Special symbols
- Unicode: 🚀 ✅ ❌ 
- Math: α β γ δ ε
- Arrows: → ← ↑ ↓
- Other: & < > | \\ / * ? : " ' \` ~ ! @ # $ % ^ & * ( ) [ ] { }`;

      const result = await client.callTool("update_issue", {
        id: "E-special-chars",
        body: specialBody,
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.body).toBe(specialBody);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-parent/e/E-special-chars/E-special-chars.md",
      );
      expect(file.body).toBe(specialBody);
    });
  });

  describe("Complex Hierarchy Updates", () => {
    it("should update objects in deep hierarchy", async () => {
      // Create complete hierarchy
      const projectId = "P-hierarchy";
      const epicId = "E-hierarchy";
      const featureId = "F-hierarchy";
      const taskId = "T-hierarchy";

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

      // Create epic
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

      // Create feature
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

      // Create task
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        taskId,
        createObjectContent({
          id: taskId,
          title: "Hierarchy Task",
          parent: featureId,
          status: "open",
        }),
        { projectId, epicId, featureId, status: "open" },
      );

      // Update task in deep hierarchy
      const result = await client.callTool("update_issue", {
        id: taskId,
        priority: "high",
        status: "done",
        body: "Updated task in deep hierarchy",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.priority).toBe("high");
      expect(updatedObject.status).toBe("done");
      expect(updatedObject.parent).toBe(featureId);

      // Verify file moved to closed folder
      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/${featureId}/t/closed/${taskId}.md`,
      );
      expect(file.yaml.status).toBe("done");
      expect(file.yaml.priority).toBe("high");
      expect(file.body).toBe("Updated task in deep hierarchy");
    });

    it("should handle updates with cross-hierarchy prerequisites", async () => {
      // Create objects in different hierarchies
      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-proj-1",
        createObjectContent({
          id: "P-proj-1",
          title: "Project 1",
          status: "done",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-feat-1",
        createObjectContent({
          id: "F-feat-1",
          title: "Feature 1",
          status: "done",
        }),
      );

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-cross-deps",
        createObjectContent({
          id: "T-cross-deps",
          title: "Cross Dependencies Task",
          status: "open",
          prerequisites: [],
        }),
      );

      // Update with cross-hierarchy prerequisites
      const result = await client.callTool("update_issue", {
        id: "T-cross-deps",
        prerequisites: ["P-proj-1", "F-feat-1", "E-external"],
        status: "in-progress",
      });

      expect(result.content[0].text).toContain("Successfully updated object");
      const updatedObject = parseUpdateObjectResponse(
        result.content[0].text as string,
      );
      expect(updatedObject.prerequisites).toEqual([
        "P-proj-1",
        "F-feat-1",
        "E-external",
      ]);
      expect(updatedObject.status).toBe("in-progress");
    });
  });

  describe("Concurrent Updates", () => {
    it("should handle sequential updates to same object", async () => {
      // Create initial task
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-sequential",
        createObjectContent({
          id: "T-sequential",
          title: "Sequential Updates Task",
          priority: "low",
          status: "draft",
          body: "Initial",
        }),
      );

      // First update
      const result1 = await client.callTool("update_issue", {
        id: "T-sequential",
        priority: "medium",
      });
      expect(result1.content[0].text).toContain("Successfully updated object");

      // Second update
      const result2 = await client.callTool("update_issue", {
        id: "T-sequential",
        status: "open",
      });
      expect(result2.content[0].text).toContain("Successfully updated object");

      // Third update
      const result3 = await client.callTool("update_issue", {
        id: "T-sequential",
        body: "Final content after multiple updates",
      });
      expect(result3.content[0].text).toContain("Successfully updated object");

      // Verify final state
      const finalObject = parseUpdateObjectResponse(
        result3.content[0].text as string,
      );
      expect(finalObject.priority).toBe("medium");
      expect(finalObject.status).toBe("open");
      expect(finalObject.body).toBe("Final content after multiple updates");

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-sequential.md",
      );
      expect(file.yaml.priority).toBe("medium");
      expect(file.yaml.status).toBe("open");
      expect(file.body).toBe("Final content after multiple updates");
    });
  });
});
