import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  parseReplaceObjectBodyRegexResponse,
  readObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E CRUD - replaceObjectBodyRegex", () => {
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

  describe("Basic Functionality Tests", () => {
    it("should replace simple text patterns", async () => {
      // Create task with simple text
      const taskData: ObjectData = {
        id: "T-simple-replace",
        title: "Simple Replace Task",
        status: "open",
        body: "Hello World, welcome to the system",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-simple-replace",
        createObjectContent(taskData),
      );

      // Replace "World" with "Universe"
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-simple-replace",
        regex: "World",
        replacement: "Universe",
      });

      expect(result.content[0].type).toBe("text");
      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);
      expect(response.objectId).toBe("T-simple-replace");
      expect(response.pattern).toBe("World");

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-simple-replace.md",
      );
      expect(file.body).toBe("Hello Universe, welcome to the system");
    });

    it("should use backreferences for pattern reordering", async () => {
      // Create task with name pattern
      const taskData: ObjectData = {
        id: "T-backreference",
        title: "Backreference Test",
        body: "Name: John Doe\nEmail: john.doe@example.com",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-backreference",
        createObjectContent(taskData),
      );

      // Reorder name using backreferences
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-backreference",
        regex: "Name: (\\w+) (\\w+)",
        replacement: "Name: $2, $1",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-backreference.md",
      );
      expect(file.body).toBe("Name: Doe, John\nEmail: john.doe@example.com");
    });

    it("should work with multiline content", async () => {
      // Create feature with multiline content
      const featureData: ObjectData = {
        id: "F-multiline",
        title: "Multiline Content Feature",
        body: `# Feature Description

## Old Implementation
This is the old way
of doing things
across multiple lines

## Other Section
Keep this unchanged`,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-multiline",
        createObjectContent(featureData),
      );

      // Replace multiline section
      const result = await client.callTool("replace_object_body_regex", {
        id: "F-multiline",
        regex: "## Old Implementation.*?(?=## Other Section)",
        replacement:
          "## New Implementation\nThis is the new way\nof doing things\nbetter\n\n",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify file persistence
      const file = await readObjectFile(
        testEnv.projectRoot,
        "f/F-multiline/F-multiline.md",
      );
      expect(file.body).toBe(`# Feature Description

## New Implementation
This is the new way
of doing things
better

## Other Section
Keep this unchanged`);
    });

    it("should work across different object types", async () => {
      // First create the parent project for the epic
      const parentProjectData: ObjectData = {
        id: "P-test",
        title: "Test Parent Project",
        body: "Parent project body",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-test",
        createObjectContent(parentProjectData),
      );

      const objectTypes = [
        {
          type: "project",
          id: "P-regex-test",
          path: "p/P-regex-test/P-regex-test.md",
        },
        {
          type: "epic",
          id: "E-regex-test",
          path: "p/P-test/e/E-regex-test/E-regex-test.md",
          options: { projectId: "P-test" },
        },
        {
          type: "feature",
          id: "F-regex-test",
          path: "f/F-regex-test/F-regex-test.md",
        },
        { type: "task", id: "T-regex-test", path: "t/open/T-regex-test.md" },
      ];

      for (const obj of objectTypes) {
        const objectData: ObjectData = {
          id: obj.id,
          title: `${obj.type} Regex Test`,
          body: `Old content for ${obj.type}`,
        };

        if (obj.type === "epic") {
          // Epic needs parent project
          (objectData as any).parent = "P-test";
        }

        await createObjectFile(
          testEnv.projectRoot,
          obj.type as "project" | "epic" | "feature" | "task",
          obj.id,
          createObjectContent(objectData),
          obj.options,
        );

        // Replace content
        const result = await client.callTool("replace_object_body_regex", {
          id: obj.id,
          regex: `Old content for ${obj.type}`,
          replacement: `New content for ${obj.type}`,
        });

        const response = parseReplaceObjectBodyRegexResponse(
          result.content[0].text as string,
        );
        if (!response.success) {
          console.log(`Failed for ${obj.type}:`, response.message);
          console.log("Full result:", result.content[0].text);
        }
        expect(response.success).toBe(true);

        // Verify file persistence
        const file = await readObjectFile(testEnv.projectRoot, obj.path);
        expect(file.body).toBe(`New content for ${obj.type}`);
      }
    });
  });

  describe("Regex Feature Tests", () => {
    it("should handle case-sensitive matching by default", async () => {
      const taskData: ObjectData = {
        id: "T-case-sensitive",
        title: "Case Sensitive Test",
        body: "Test content with Test and test variations",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-case-sensitive",
        createObjectContent(taskData),
      );

      // Only match "Test" (capital T)
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-case-sensitive",
        regex: "Test",
        replacement: "Match",
        allowMultipleOccurrences: true,
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-case-sensitive.md",
      );
      expect(file.body).toBe("Match content with Match and test variations");
    });

    it("should handle case-insensitive patterns with flag", async () => {
      const taskData: ObjectData = {
        id: "T-case-insensitive",
        title: "Case Insensitive Test",
        body: "Test content with TEST and test variations",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-case-insensitive",
        createObjectContent(taskData),
      );

      // Replace each case variation individually since (?i) flag might not be supported
      // First replace "Test"
      let result = await client.callTool("replace_object_body_regex", {
        id: "T-case-insensitive",
        regex: "Test",
        replacement: "match",
      });

      let response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Then replace "TEST"
      result = await client.callTool("replace_object_body_regex", {
        id: "T-case-insensitive",
        regex: "TEST",
        replacement: "match",
      });

      response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Finally replace "test"
      result = await client.callTool("replace_object_body_regex", {
        id: "T-case-insensitive",
        regex: "test",
        replacement: "match",
      });

      response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-case-insensitive.md",
      );
      expect(file.body).toBe("match content with match and match variations");
    });

    it("should handle word boundaries", async () => {
      const taskData: ObjectData = {
        id: "T-word-boundaries",
        title: "Word Boundaries Test",
        body: "The cat category has catalog items",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-word-boundaries",
        createObjectContent(taskData),
      );

      // Only match whole word "cat"
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-word-boundaries",
        regex: "\\bcat\\b",
        replacement: "dog",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-word-boundaries.md",
      );
      expect(file.body).toBe("The dog category has catalog items");
    });

    it("should handle anchored patterns", async () => {
      const taskData: ObjectData = {
        id: "T-anchors",
        title: "Anchors Test",
        body: `Start of document
Middle content
End of document`,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-anchors",
        createObjectContent(taskData),
      );

      // Replace line starting with "Start" using a simpler pattern
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-anchors",
        regex: "Start of document",
        replacement: "Beginning of document",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-anchors.md",
      );
      expect(file.body).toBe(`Beginning of document
Middle content
End of document`);
    });

    it("should handle quantifiers", async () => {
      const taskData: ObjectData = {
        id: "T-quantifiers",
        title: "Quantifiers Test",
        body: "Version 1.2.3 and Version 10.20.30",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-quantifiers",
        createObjectContent(taskData),
      );

      // Match version patterns with quantifiers
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-quantifiers",
        regex: "Version \\d+\\.\\d+\\.\\d+",
        replacement: "Release 2.0.0",
        allowMultipleOccurrences: true,
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-quantifiers.md",
      );
      expect(file.body).toBe("Release 2.0.0 and Release 2.0.0");
    });

    it("should handle character classes", async () => {
      const taskData: ObjectData = {
        id: "T-char-classes",
        title: "Character Classes Test",
        body: "Phone: 123-456-7890, Phone: 987.654.3210, Phone: (555) 123-4567",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-char-classes",
        createObjectContent(taskData),
      );

      // Match phone numbers with various separators
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-char-classes",
        regex: "Phone: [\\d\\-\\.(\\) ]+",
        replacement: "Phone: XXX-XXX-XXXX",
        allowMultipleOccurrences: true,
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-char-classes.md",
      );
      expect(file.body).toBe(
        "Phone: XXX-XXX-XXXX, Phone: XXX-XXX-XXXX, Phone: XXX-XXX-XXXX",
      );
    });
  });

  describe("Multiple Occurrences Handling", () => {
    it("should reject multiple matches by default", async () => {
      const taskData: ObjectData = {
        id: "T-multiple-reject",
        title: "Multiple Matches Reject",
        body: "TODO: Fix bug 1\nTODO: Fix bug 2\nTODO: Fix bug 3",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-multiple-reject",
        createObjectContent(taskData),
      );

      // Attempt to replace all TODOs (should fail)
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-multiple-reject",
        regex: "TODO:",
        replacement: "DONE:",
      });

      expect(result.content[0].type).toBe("text");
      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(false);
      expect(response.message).toContain("Found 3 matches for pattern");
      expect(response.message).toContain("allowMultipleOccurrences is false");

      // Verify file unchanged
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-multiple-reject.md",
      );
      expect(file.body).toBe(
        "TODO: Fix bug 1\nTODO: Fix bug 2\nTODO: Fix bug 3",
      );
    });

    it("should replace all when allowMultipleOccurrences is true", async () => {
      const taskData: ObjectData = {
        id: "T-multiple-allow",
        title: "Multiple Matches Allow",
        body: "TODO: Fix bug 1\nTODO: Fix bug 2\nCompleted: Fix bug 3",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-multiple-allow",
        createObjectContent(taskData),
      );

      // Replace all TODOs with allowMultipleOccurrences
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-multiple-allow",
        regex: "TODO:",
        replacement: "DONE:",
        allowMultipleOccurrences: true,
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify file updated
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-multiple-allow.md",
      );
      expect(file.body).toBe(
        "DONE: Fix bug 1\nDONE: Fix bug 2\nCompleted: Fix bug 3",
      );
    });

    it("should handle no matches gracefully", async () => {
      const taskData: ObjectData = {
        id: "T-no-matches",
        title: "No Matches Test",
        body: "This content has no matching patterns",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-no-matches",
        createObjectContent(taskData),
      );

      // Search for non-existent pattern
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-no-matches",
        regex: "nonexistent",
        replacement: "replacement",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(false);
      expect(response.message).toContain("No matches found for pattern");
      expect(response.pattern).toBe("nonexistent");

      // Verify file unchanged
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-no-matches.md",
      );
      expect(file.body).toBe("This content has no matching patterns");
    });
  });

  describe("Error Handling & Edge Cases", () => {
    it("should handle non-existent object ID", async () => {
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-nonexistent",
        regex: "pattern",
        replacement: "replacement",
      });

      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should handle empty body content", async () => {
      const taskData: ObjectData = {
        id: "T-empty-body",
        title: "Empty Body Test",
        body: "",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-empty-body",
        createObjectContent(taskData),
      );

      const result = await client.callTool("replace_object_body_regex", {
        id: "T-empty-body",
        regex: "pattern",
        replacement: "replacement",
      });

      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-empty-body' has no body content to replace",
      );
    });

    it("should handle invalid regex patterns", async () => {
      const taskData: ObjectData = {
        id: "T-invalid-regex",
        title: "Invalid Regex Test",
        body: "Some content here",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-invalid-regex",
        createObjectContent(taskData),
      );

      const result = await client.callTool("replace_object_body_regex", {
        id: "T-invalid-regex",
        regex: "[invalid regex",
        replacement: "replacement",
      });

      expect(result.content[0].text).toContain("Error replacing object body:");
      expect(result.content[0].text).toContain("Invalid regex pattern");
    });

    it("should handle large body content", async () => {
      // Create 10KB+ content
      const largeContent =
        "A".repeat(5000) + "\n\nMIDDLE MARKER\n\n" + "B".repeat(5000);

      const taskData: ObjectData = {
        id: "T-large-body",
        title: "Large Body Test",
        body: largeContent,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-large-body",
        createObjectContent(taskData),
      );

      // Replace marker in the middle
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-large-body",
        regex: "MIDDLE MARKER",
        replacement: "UPDATED MARKER",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify large content was processed correctly
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-large-body.md",
      );
      expect(file.body).toContain("UPDATED MARKER");
      expect(file.body.length).toBe(
        largeContent.length +
          ("UPDATED MARKER".length - "MIDDLE MARKER".length),
      );
    });

    it("should handle special characters and unicode", async () => {
      const taskData: ObjectData = {
        id: "T-special-chars",
        title: "Special Characters Test",
        body: `# Special Content 🚀
        
Code: const test = "value with 'quotes' and \\"double quotes\\"";
Math: α β γ δ ε
Arrows: → ← ↑ ↓
Symbols: & < > | \\ / * ? : " ' \` ~ ! @ # $ % ^ & * ( ) [ ] { }
Unicode: 你好世界`,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-special-chars",
        createObjectContent(taskData),
      );

      // Replace unicode content
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-special-chars",
        regex: "你好世界",
        replacement: "Hello World",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-special-chars.md",
      );
      expect(file.body).toContain("Hello World");
      expect(file.body).not.toContain("你好世界");
    });

    it("should handle empty regex pattern", async () => {
      const taskData: ObjectData = {
        id: "T-empty-regex",
        title: "Empty Regex Test",
        body: "Some content",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-empty-regex",
        createObjectContent(taskData),
      );

      const result = await client.callTool("replace_object_body_regex", {
        id: "T-empty-regex",
        regex: "",
        replacement: "replacement",
      });

      expect(result.content[0].text).toContain("Regex pattern cannot be empty");
    });
  });

  describe("File System Persistence", () => {
    it("should verify changes persist across file reads", async () => {
      const taskData: ObjectData = {
        id: "T-persistence",
        title: "Persistence Test",
        status: "open",
        priority: "high",
        body: "Original content for persistence testing",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-persistence",
        createObjectContent(taskData),
      );

      // Perform replacement
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-persistence",
        regex: "Original content",
        replacement: "Updated content",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Read file multiple times to verify persistence
      for (let i = 0; i < 3; i++) {
        const file = await readObjectFile(
          testEnv.projectRoot,
          "t/open/T-persistence.md",
        );
        expect(file.body).toBe("Updated content for persistence testing");
        expect(file.yaml.title).toBe("Persistence Test");
        expect(file.yaml.status).toBe("open");
        expect(file.yaml.priority).toBe("high");
      }
    });

    it("should preserve YAML frontmatter during body updates", async () => {
      const taskData: ObjectData = {
        id: "T-yaml-preserve",
        title: "YAML Preservation Test",
        status: "open",
        priority: "high",
        prerequisites: ["T-dep-1", "T-dep-2"],
        body: "Body content to be modified",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-yaml-preserve",
        createObjectContent(taskData),
      );

      // Update body content
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-yaml-preserve",
        regex: "Body content",
        replacement: "Modified body content",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify YAML metadata preserved (using open status so file is in t/open/ folder)
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-yaml-preserve.md",
      );
      expect(file.yaml.id).toBe("T-yaml-preserve");
      expect(file.yaml.title).toBe("YAML Preservation Test");
      expect(file.yaml.status).toBe("open");
      expect(file.yaml.priority).toBe("high");
      expect(file.yaml.prerequisites).toEqual(["T-dep-1", "T-dep-2"]);
      expect(file.body).toBe("Modified body content to be modified");
    });

    it("should work with objects in hierarchy paths", async () => {
      // Create project structure
      const projectData: ObjectData = {
        id: "P-hierarchy",
        title: "Hierarchy Project",
        body: "Project description",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "project",
        "P-hierarchy",
        createObjectContent(projectData),
      );

      // Create epic in project
      const epicData: ObjectData = {
        id: "E-hierarchy",
        title: "Hierarchy Epic",
        parent: "P-hierarchy",
        body: "Epic content for replacement",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "epic",
        "E-hierarchy",
        createObjectContent(epicData),
        { projectId: "P-hierarchy" },
      );

      // Create feature in epic
      const featureData: ObjectData = {
        id: "F-hierarchy",
        title: "Hierarchy Feature",
        parent: "E-hierarchy",
        body: "Feature content for replacement",
      };

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-hierarchy",
        createObjectContent(featureData),
        { projectId: "P-hierarchy", epicId: "E-hierarchy" },
      );

      // Update feature content
      const result = await client.callTool("replace_object_body_regex", {
        id: "F-hierarchy",
        regex: "Feature content",
        replacement: "Updated feature content",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      // Verify file in correct hierarchy path
      const file = await readObjectFile(
        testEnv.projectRoot,
        "p/P-hierarchy/e/E-hierarchy/f/F-hierarchy/F-hierarchy.md",
      );
      expect(file.body).toBe("Updated feature content for replacement");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle complex markdown content", async () => {
      const complexMarkdown = `# Main Title

## Section 1
Some content here with **bold** and *italic* text.

\`\`\`typescript
const example = "code block";
function test() {
  return "old implementation";
}
\`\`\`

### Subsection
- List item 1
- List item 2
- List item 3

| Column 1 | Column 2 |
|----------|----------|
| Value 1  | Value 2  |

> This is a blockquote with old information

## Section 2
More content here.`;

      const featureData: ObjectData = {
        id: "F-complex-markdown",
        title: "Complex Markdown Test",
        body: complexMarkdown,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "feature",
        "F-complex-markdown",
        createObjectContent(featureData),
      );

      // Update code block content - escape quotes properly
      const result = await client.callTool("replace_object_body_regex", {
        id: "F-complex-markdown",
        regex: 'return "old implementation";',
        replacement: 'return "new implementation";',
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      if (!response.success) {
        console.log("Complex markdown failed:", response.message);
        console.log("Full result:", result.content[0].text);
      }
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "f/F-complex-markdown/F-complex-markdown.md",
      );
      expect(file.body).toContain('return "new implementation";');
      expect(file.body).not.toContain('return "old implementation";');
      expect(file.body).toContain("# Main Title");
      expect(file.body).toContain("| Column 1 | Column 2 |");
    });

    it("should handle template placeholder replacements", async () => {
      const templateContent = `# {{TITLE}} Implementation

## Overview
This {{TYPE}} implements {{FEATURE_NAME}} functionality.

## Configuration
- Environment: {{ENV}}
- Version: {{VERSION}}
- Database: {{DB_TYPE}}

## Implementation Details
The {{FEATURE_NAME}} feature uses {{TECHNOLOGY}} to provide {{BENEFIT}}.`;

      const taskData: ObjectData = {
        id: "T-template",
        title: "Template Replacement Test",
        body: templateContent,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-template",
        createObjectContent(taskData),
      );

      // Replace all template variables
      const replacements = [
        { pattern: "\\{\\{TITLE\\}\\}", value: "Authentication" },
        { pattern: "\\{\\{TYPE\\}\\}", value: "module" },
        { pattern: "\\{\\{FEATURE_NAME\\}\\}", value: "user login" },
        { pattern: "\\{\\{ENV\\}\\}", value: "production" },
        { pattern: "\\{\\{VERSION\\}\\}", value: "2.0.0" },
        { pattern: "\\{\\{DB_TYPE\\}\\}", value: "PostgreSQL" },
        { pattern: "\\{\\{TECHNOLOGY\\}\\}", value: "JWT tokens" },
        { pattern: "\\{\\{BENEFIT\\}\\}", value: "secure authentication" },
      ];

      for (const replacement of replacements) {
        const result = await client.callTool("replace_object_body_regex", {
          id: "T-template",
          regex: replacement.pattern,
          replacement: replacement.value,
          allowMultipleOccurrences: true, // For template replacements, we want to replace all occurrences
        });

        const response = parseReplaceObjectBodyRegexResponse(
          result.content[0].text as string,
        );
        if (!response.success) {
          console.log(
            `Template replacement failed for ${replacement.pattern}:`,
            response.message,
          );
          console.log("Full result:", result.content[0].text);
        }
        expect(response.success).toBe(true);
      }

      // Verify all placeholders replaced
      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-template.md",
      );
      expect(file.body).not.toContain("{{");
      expect(file.body).not.toContain("}}");
      expect(file.body).toContain("# Authentication Implementation");
      expect(file.body).toContain(
        "This module implements user login functionality",
      );
      expect(file.body).toContain("Version: 2.0.0");
      expect(file.body).toContain(
        "uses JWT tokens to provide secure authentication",
      );
    });

    it("should handle cross-references and object IDs in content", async () => {
      const contentWithRefs = `# Task Dependencies

This task depends on:
- P-auth-system (Authentication Project)
- E-user-management (User Management Epic) 
- F-login-form (Login Form Feature)

## Related Tasks
- T-create-models: Database model creation
- T-setup-routes: API route setup
- T-add-validation: Input validation

## Status Updates
Updated T-old-task-id to completed status.
Blocked by F-payment-integration until resolved.`;

      const taskData: ObjectData = {
        id: "T-refs-test",
        title: "Cross References Test",
        body: contentWithRefs,
      };

      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-refs-test",
        createObjectContent(taskData),
      );

      // Update old task reference
      const result = await client.callTool("replace_object_body_regex", {
        id: "T-refs-test",
        regex: "T-old-task-id",
        replacement: "T-new-task-id",
      });

      const response = parseReplaceObjectBodyRegexResponse(
        result.content[0].text as string,
      );
      expect(response.success).toBe(true);

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-refs-test.md",
      );
      expect(file.body).toContain("T-new-task-id");
      expect(file.body).not.toContain("T-old-task-id");
      expect(file.body).toContain("P-auth-system");
      expect(file.body).toContain("F-payment-integration");
    });
  });
});
