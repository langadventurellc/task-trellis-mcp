import { parse, stringify } from "yaml";
import {
  McpTestClient,
  TestEnvironment,
  fileExists,
  readObjectFile,
} from "../utils";

describe("E2E File Validation", () => {
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

  describe("YAML Front-matter Structure Validation", () => {
    it("should validate required fields in project YAML", async () => {
      const result = await client.callTool("create_issue", {
        type: "project",
        title: "YAML Validation Project",
        description: "Testing YAML structure",
      });

      const projectId = result.content[0].text.match(/ID: (P-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/${projectId}.md`,
      );

      // Validate required fields
      expect(file.yaml).toHaveProperty("id", projectId);
      expect(file.yaml).toHaveProperty("title", "YAML Validation Project");
      expect(file.yaml).toHaveProperty("status");
      expect(file.yaml).toHaveProperty("priority");
      expect(file.yaml).toHaveProperty("prerequisites");
      expect(file.yaml).toHaveProperty("schema");
      expect(file.yaml.parent).toBe("none"); // Projects don't have parents
    });

    it("should validate all object types have correct YAML structure", async () => {
      // Create hierarchy: Project -> Epic -> Feature -> Task
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Structure Test Project",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Structure Test Epic",
        parent: projectId,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Structure Test Feature",
        parent: epicId,
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Structure Test Task",
        parent: featureId,
      });
      const taskId = taskResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Validate epic YAML
      const epicFile = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/${epicId}.md`,
      );
      expect(epicFile.yaml.parent).toBe(projectId);

      // Validate feature YAML
      const featureFile = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/${featureId}/${featureId}.md`,
      );
      expect(featureFile.yaml.parent).toBe(epicId);

      // Validate task YAML
      const taskFile = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
      );
      expect(taskFile.yaml.parent).toBe(featureId);
    });

    it("should handle empty and null values correctly", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Empty Values Test",
        prerequisites: [],
        description: "",
      });

      const taskId = result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );

      expect(file.yaml.prerequisites).toEqual([]);
      expect(file.body).toBe("");
      expect(file.yaml.parent).toBe("none");
    });
  });

  describe("Special Characters Handling", () => {
    it("should handle quotes in YAML fields", async () => {
      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Task with \"double quotes\" and 'single quotes'",
        description: 'Body with "quotes" and special chars',
      });

      const taskId = result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );

      expect(file.yaml.title).toBe(
        "Task with \"double quotes\" and 'single quotes'",
      );
      expect(file.body).toBe('Body with "quotes" and special chars');

      // Verify YAML can be re-parsed
      const yamlString = stringify(file.yaml);
      expect(() => parse(yamlString)).not.toThrow();
    });

    it("should handle colons and YAML special symbols", async () => {
      const result = await client.callTool("create_issue", {
        type: "feature",
        title: "Feature: with: colons: everywhere",
        description: "key: value pairs in body\nshould: not: break: parsing",
      });

      const featureId = result.content[0].text.match(/ID: (F-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/${featureId}.md`,
      );

      expect(file.yaml.title).toBe("Feature: with: colons: everywhere");
      expect(file.body).toContain("key: value pairs");
    });

    it("should handle multi-line content in arrays", async () => {
      // First create a task
      const createResult = await client.callTool("create_issue", {
        type: "task",
        title: "Multi-line Log Test",
      });
      const taskId = createResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Add multi-line log entries
      await client.callTool("append_issue_log", {
        id: taskId,
        contents:
          "Multi-line entry:\n- Point 1\n- Point 2\n  - Nested point\n- Point 3",
      });

      await client.callTool("append_issue_log", {
        id: taskId,
        contents: "Another entry with:\n\nParagraph breaks\n\nAnd formatting",
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );

      expect(file.yaml.log).toContain(
        "Multi-line entry:\n- Point 1\n- Point 2\n  - Nested point\n- Point 3",
      );
      expect(file.yaml.log).toContain(
        "Another entry with:\n\nParagraph breaks\n\nAnd formatting",
      );
    });

    it("should handle unicode and emojis", async () => {
      const result = await client.callTool("create_issue", {
        type: "project",
        title: "Unicode Project 🚀 你好世界",
        description: "Testing émojis 😀 and spëcial çhars",
      });

      const projectId = result.content[0].text.match(/ID: (P-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/${projectId}.md`,
      );

      expect(file.yaml.title).toBe("Unicode Project 🚀 你好世界");
      expect(file.body).toBe("Testing émojis 😀 and spëcial çhars");
    });

    it("should preserve YAML-like content in markdown body", async () => {
      const yamlLikeBody = `Configuration example:

\`\`\`yaml
---
config:
  name: example
  values:
    - item1
    - item2
---
\`\`\`

This should not confuse the parser.`;

      const result = await client.callTool("create_issue", {
        type: "task",
        title: "YAML in Body Test",
        description: yamlLikeBody,
      });

      const taskId = result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];
      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );

      expect(file.body).toBe(yamlLikeBody);
    });
  });

  describe("Directory Structure Validation", () => {
    it("should create correct directory hierarchy for nested objects", async () => {
      // Create complete hierarchy
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Hierarchy Test",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        title: "Hierarchy Epic",
        parent: projectId,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Hierarchy Feature",
        parent: epicId,
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Hierarchy Task",
        parent: featureId,
        status: "open",
      });
      const taskId = taskResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify directory structure
      // Project directory
      expect(
        await fileExists(testEnv.projectRoot, `p/${projectId}/${projectId}.md`),
      ).toBe(true);

      // Epic directory under project
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/${epicId}.md`,
        ),
      ).toBe(true);

      // Feature directory under epic
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/f/${featureId}/${featureId}.md`,
        ),
      ).toBe(true);

      // Task in open folder under feature
      expect(
        await fileExists(
          testEnv.projectRoot,
          `p/${projectId}/e/${epicId}/f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(true);
    });

    it("should handle standalone features correctly", async () => {
      const result = await client.callTool("create_issue", {
        type: "feature",
        title: "Standalone Feature",
      });
      const featureId = result.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      expect(
        await fileExists(testEnv.projectRoot, `f/${featureId}/${featureId}.md`),
      ).toBe(true);
    });

    it("should handle standalone tasks correctly", async () => {
      const openResult = await client.callTool("create_issue", {
        type: "task",
        title: "Standalone Open Task",
        status: "open",
      });
      const openTaskId =
        openResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      const closedResult = await client.callTool("create_issue", {
        type: "task",
        title: "Standalone Closed Task",
        status: "done",
      });
      const closedTaskId =
        closedResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      expect(
        await fileExists(testEnv.projectRoot, `t/open/${openTaskId}.md`),
      ).toBe(true);
      expect(
        await fileExists(testEnv.projectRoot, `t/closed/${closedTaskId}.md`),
      ).toBe(true);
    });
  });

  describe("Task Status Directory Transitions", () => {
    it("should move task file when status changes from open to closed", async () => {
      // Create task in open status
      const createResult = await client.callTool("create_issue", {
        type: "task",
        title: "Status Transition Task",
        status: "open",
      });
      const taskId = createResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify initial location
      expect(await fileExists(testEnv.projectRoot, `t/open/${taskId}.md`)).toBe(
        true,
      );
      expect(
        await fileExists(testEnv.projectRoot, `t/closed/${taskId}.md`),
      ).toBe(false);

      // Update status to done
      await client.callTool("update_issue", {
        id: taskId,
        status: "done",
        force: true,
      });

      // Verify file moved
      expect(await fileExists(testEnv.projectRoot, `t/open/${taskId}.md`)).toBe(
        false,
      );
      expect(
        await fileExists(testEnv.projectRoot, `t/closed/${taskId}.md`),
      ).toBe(true);
    });

    it("should move task file when status changes from closed to open", async () => {
      // Create task in done status
      const createResult = await client.callTool("create_issue", {
        type: "task",
        title: "Reopen Task",
        status: "done",
      });
      const taskId = createResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify initial location
      expect(
        await fileExists(testEnv.projectRoot, `t/closed/${taskId}.md`),
      ).toBe(true);

      // Update status to in-progress
      await client.callTool("update_issue", {
        id: taskId,
        status: "in-progress",
        force: true,
      });

      // Verify file moved
      expect(
        await fileExists(testEnv.projectRoot, `t/closed/${taskId}.md`),
      ).toBe(false);
      expect(await fileExists(testEnv.projectRoot, `t/open/${taskId}.md`)).toBe(
        true,
      );
    });

    it("should handle status transitions for tasks in hierarchy", async () => {
      // Create feature with task
      const featureResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Parent Feature",
      });
      const featureId =
        featureResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const taskResult = await client.callTool("create_issue", {
        type: "task",
        title: "Hierarchical Task",
        parent: featureId,
        status: "open",
      });
      const taskId = taskResult.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      // Verify initial location
      expect(
        await fileExists(
          testEnv.projectRoot,
          `f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(true);

      // First change status to in-progress
      await client.callTool("update_issue", {
        id: taskId,
        status: "in-progress",
        force: true,
      });

      // Complete the task
      await client.callTool("complete_task", {
        taskId: taskId,
        summary: "Task completed successfully",
        filesChanged: {},
      });

      // Verify file moved to closed folder
      expect(
        await fileExists(
          testEnv.projectRoot,
          `f/${featureId}/t/open/${taskId}.md`,
        ),
      ).toBe(false);
      expect(
        await fileExists(
          testEnv.projectRoot,
          `f/${featureId}/t/closed/${taskId}.md`,
        ),
      ).toBe(true);
    });
  });

  describe("Content Integrity", () => {
    it("should preserve complex markdown content through operations", async () => {
      const complexBody = `# Complex Documentation

## Section 1: Code Examples

\`\`\`typescript
interface ComplexType {
  id: string;
  data: Record<string, unknown>;
  process: (input: string) => Promise<void>;
}
\`\`\`

## Section 2: Lists and Tables

### Ordered List
1. First item
2. Second item with **bold** text
3. Third item with \`inline code\`

### Table
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| More     | Even more| Last     |

## Section 3: Special Content

> **Note**: This is a blockquote with **formatting**

---

Additional content after horizontal rule.

![Image description](image.png)
[Link text](https://example.com)`;

      const createResult = await client.callTool("create_issue", {
        type: "feature",
        title: "Complex Content Feature",
        description: complexBody,
      });
      const featureId =
        createResult.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      // Read and verify content preservation
      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/${featureId}.md`,
      );
      expect(file.body).toBe(complexBody);

      // Update the feature and verify content still preserved
      await client.callTool("update_issue", {
        id: featureId,
        priority: "high",
      });

      const updatedFile = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/${featureId}.md`,
      );
      expect(updatedFile.body).toBe(complexBody);
      expect(updatedFile.yaml.priority).toBe("high");
    });

    it("should handle file encoding and newlines correctly", async () => {
      const mixedNewlines = "Line 1\nLine 2\r\nLine 3\rLine 4";

      const result = await client.callTool("create_issue", {
        type: "task",
        title: "Newline Test",
        description: mixedNewlines,
      });
      const taskId = result.content[0].text.match(/ID: (T-[a-z-]+)/)![1];

      const file = await readObjectFile(
        testEnv.projectRoot,
        `t/open/${taskId}.md`,
      );

      // Verify newlines are normalized
      expect(file.body).toContain("Line 1");
      expect(file.body).toContain("Line 2");
      expect(file.body).toContain("Line 3");
      expect(file.body).toContain("Line 4");
    });

    it("should validate round-trip serialization", async () => {
      const testData = {
        title: "Round-trip Test",
        description: "Test content with various elements",
        priority: "high",
        status: "in-progress",
        prerequisites: ["dep1", "dep2"],
      };

      // Need to create project first for epic
      const projectResult = await client.callTool("create_issue", {
        type: "project",
        title: "Parent Project",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const epicResult = await client.callTool("create_issue", {
        type: "epic",
        parent: projectId,
        ...testData,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      // Get the object through MCP
      const getResult = await client.callTool("get_issue", {
        id: epicId,
      });

      // Verify all data preserved
      expect(getResult.content[0].text).toContain(testData.title);
      expect(getResult.content[0].text).toContain(testData.description);
      expect(getResult.content[0].text).toContain(testData.priority);
      expect(getResult.content[0].text).toContain(testData.status);
    });
  });
});
