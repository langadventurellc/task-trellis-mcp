import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  readObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E Workflow - appendObjectLog", () => {
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

  describe("Appending to Different Object Types", () => {
    it("should append log to task", async () => {
      const taskData: ObjectData = {
        id: "T-log-test",
        title: "Log Test Task",
        status: "in-progress",
        priority: "medium",
        log: ["Initial log entry"],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-log-test",
        createObjectContent(taskData),
      );

      const result = await client.callTool("append_object_log", {
        id: "T-log-test",
        contents: "Progress update: 50% complete",
      });

      expect(result.content[0].text).toContain("Successfully appended");
      expect(result.content[0].text).toContain('"totalLogEntries": 2');

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-log-test.md",
      );
      expect(file.yaml.log).toHaveLength(2);
      expect(file.yaml.log[1]).toBe("Progress update: 50% complete");
    });

    it("should append log to project", async () => {
      const result = await client.callTool("create_issue", {
        type: "project",
        title: "Log Test Project",
      });
      const projectId = result.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const logResult = await client.callTool("append_object_log", {
        id: projectId,
        contents: "Project milestone reached",
      });

      expect(logResult.content[0].text).toContain("Successfully appended");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/${projectId}.md`,
      );
      expect(file.yaml.log).toContain("Project milestone reached");
    });

    it("should append log to epic", async () => {
      // Create project first
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Parent Project",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      // Create epic
      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Log Test Epic",
        parent: projectId,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      const logResult = await client.callTool("append_object_log", {
        id: epicId,
        contents: "Epic progress note",
      });

      expect(logResult.content[0].text).toContain("Successfully appended");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/${epicId}.md`,
      );
      expect(file.yaml.log).toContain("Epic progress note");
    });

    it("should append log to feature", async () => {
      const result = await client.callTool("create_issue", {
        type: "feature",
        title: "Log Test Feature",
      });
      const featureId = result.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const logResult = await client.callTool("append_object_log", {
        id: featureId,
        contents: "Feature implementation note",
      });

      expect(logResult.content[0].text).toContain("Successfully appended");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/${featureId}.md`,
      );
      expect(file.yaml.log).toContain("Feature implementation note");
    });
  });

  describe("Log Entry Formatting", () => {
    it("should preserve log entry format and special characters", async () => {
      const taskData: ObjectData = {
        id: "T-format-test",
        title: "Format Test Task",
        status: "open",
        priority: "low",
        log: [],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-format-test",
        createObjectContent(taskData),
      );

      const specialContent = `Multi-line log entry:
- Bullet point 1
- Bullet point 2
"Quoted text" and 'single quotes'
Special chars: @#$%^&*()`;

      await client.callTool("append_object_log", {
        id: "T-format-test",
        contents: specialContent,
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-format-test.md",
      );
      expect(file.yaml.log[0]).toBe(specialContent);
    });

    it("should handle empty log entries", async () => {
      const taskData: ObjectData = {
        id: "T-empty-log",
        title: "Empty Log Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-empty-log",
        createObjectContent(taskData),
      );

      const result = await client.callTool("append_object_log", {
        id: "T-empty-log",
        contents: "",
      });

      expect(result.content[0].text).toContain("Successfully appended");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-empty-log.md",
      );
      expect(file.yaml.log).toContain("");
    });
  });

  describe("Error Handling", () => {
    it("should fail to append log to non-existent object", async () => {
      const result = await client.callTool("append_object_log", {
        id: "T-nonexistent",
        contents: "This should fail",
      });

      expect(result.content[0].text).toContain("not found");
    });

    it("should handle invalid object IDs", async () => {
      const result = await client.callTool("append_object_log", {
        id: "invalid-id-format",
        contents: "Invalid ID test",
      });

      expect(result.content[0].text).toContain("Error");
    });
  });

  describe("Multiple Log Entries", () => {
    it("should maintain chronological order of log entries", async () => {
      const taskData: ObjectData = {
        id: "T-chronological",
        title: "Chronological Task",
        status: "in-progress",
        priority: "high",
        log: ["Entry 1", "Entry 2"],
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-chronological",
        createObjectContent(taskData),
      );

      await client.callTool("append_object_log", {
        id: "T-chronological",
        contents: "Entry 3",
      });

      await client.callTool("append_object_log", {
        id: "T-chronological",
        contents: "Entry 4",
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-chronological.md",
      );
      expect(file.yaml.log).toEqual([
        "Entry 1",
        "Entry 2",
        "Entry 3",
        "Entry 4",
      ]);
    });
  });
});
