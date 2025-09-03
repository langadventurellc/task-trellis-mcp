import { readFile } from "fs/promises";
import { parsePromptFile } from "../PromptParser";

jest.mock("fs/promises");

describe("PromptParser", () => {
  const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parsePromptFile", () => {
    it("should parse a valid prompt file with all fields", async () => {
      const mockContent = `---
description: "Create a new project"
title: "Project Creation"
args:
  - name: spec
    type: string
    required: true
    description: "Project specification"
  - name: verbose
    type: boolean
    required: false
    description: "Enable verbose output"
---
<rules>
Never access .trellis directly
Use MCP tools only
</rules>

# Create Project

This is the prompt body with $ARGUMENTS placeholder.`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/create-project.md");

      expect(result).toEqual({
        name: "create-project",
        title: "Project Creation",
        description: "Create a new project",
        arguments: [
          {
            name: "spec",
            type: "string",
            required: true,
            description: "Project specification",
          },
          {
            name: "verbose",
            type: "boolean",
            required: false,
            description: "Enable verbose output",
          },
        ],
        userTemplate:
          "<rules>\nNever access .trellis directly\nUse MCP tools only\n</rules>\n\n# Create Project\n\nThis is the prompt body with $ARGUMENTS placeholder.",
      });
    });

    it("should use default input argument when args not specified", async () => {
      const mockContent = `---
description: "Simple prompt"
---
Prompt body content`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/simple.md");

      expect(result.arguments).toEqual([
        {
          name: "input",
          required: false,
          description: "Free-text input",
        },
      ]);
    });

    it("should handle missing optional fields", async () => {
      const mockContent = `---
description: "Minimal prompt"
---
Body content`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/minimal.md");

      expect(result.title).toBeUndefined();
    });

    it("should keep rules blocks inline in userTemplate", async () => {
      const mockContent = `---
description: "Multiple rules"
---
<rules>First rule</rules>
Content here
<rules>Second rule</rules>
More content`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/multiple-rules.md");

      expect(result.userTemplate).toBe(
        "<rules>First rule</rules>\nContent here\n<rules>Second rule</rules>\nMore content",
      );
    });

    it("should keep rules tags with any case inline", async () => {
      const mockContent = `---
description: "Case test"
---
<RULES>Upper case</RULES>
Some content here
<Rules>Mixed case</Rules>`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/case-test.md");

      expect(result.userTemplate).toBe(
        "<RULES>Upper case</RULES>\nSome content here\n<Rules>Mixed case</Rules>",
      );
    });

    it("should keep empty rules blocks inline", async () => {
      const mockContent = `---
description: "Empty rules"
---
<rules></rules>
Content only`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/empty-rules.md");

      expect(result.userTemplate).toBe("<rules></rules>\nContent only");
    });

    it("should generate kebab-case names from filenames", async () => {
      const mockContent = `---
description: "Test naming"
---
Content`;

      mockReadFile.mockResolvedValue(mockContent);

      const result = await parsePromptFile("/path/to/create_project_task.md");

      expect(result.name).toBe("create-project-task");
    });

    it("should throw error for missing description", async () => {
      const mockContent = `---
title: "No description"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/invalid.md")).rejects.toThrow(
        "Missing required 'description' field",
      );
    });

    it("should throw error for invalid YAML", async () => {
      const mockContent = `---
description: "Invalid YAML
  missing quote
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/invalid.md")).rejects.toThrow(
        "Invalid YAML frontmatter",
      );
    });

    it("should throw error for missing frontmatter", async () => {
      const mockContent = `No frontmatter here
Just plain content`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(
        parsePromptFile("/path/to/no-frontmatter.md"),
      ).rejects.toThrow("Expected YAML frontmatter delimited by --- markers");
    });

    it("should throw error for duplicate argument names", async () => {
      const mockContent = `---
description: "Duplicate args"
args:
  - name: input
    required: true
    description: "First input"
  - name: input
    required: false
    description: "Duplicate input"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/duplicate.md")).rejects.toThrow(
        "Duplicate argument name 'input'",
      );
    });

    it("should throw error for invalid argument type", async () => {
      const mockContent = `---
description: "Invalid type"
args:
  - name: test
    type: number
    required: true
    description: "Invalid type"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/invalid-type.md")).rejects.toThrow(
        "Invalid argument type 'number'",
      );
    });

    it("should throw error for non-kebab-case filename", async () => {
      const mockContent = `---
description: "Valid content"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/123invalid.md")).rejects.toThrow(
        "Must be kebab-case",
      );
    });

    it("should throw error for empty body", async () => {
      const mockContent = `---
description: "No body"
---
   `;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/empty-body.md")).rejects.toThrow(
        "Empty prompt body",
      );
    });

    it("should handle file read errors", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      await expect(parsePromptFile("/path/to/missing.md")).rejects.toThrow(
        "Failed to parse prompt file /path/to/missing.md: File not found",
      );
    });

    it("should handle invalid args structure", async () => {
      const mockContent = `---
description: "Invalid args"
args: "not an array"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(parsePromptFile("/path/to/invalid-args.md")).rejects.toThrow(
        "Invalid 'args' field: Expected an array",
      );
    });

    it("should handle invalid argument object", async () => {
      const mockContent = `---
description: "Invalid arg object"
args:
  - "not an object"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(
        parsePromptFile("/path/to/invalid-arg-obj.md"),
      ).rejects.toThrow("Invalid argument at index 0: Expected an object");
    });

    it("should handle missing argument name", async () => {
      const mockContent = `---
description: "Missing arg name"
args:
  - required: true
    description: "No name"
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(
        parsePromptFile("/path/to/missing-arg-name.md"),
      ).rejects.toThrow("Missing argument name");
    });

    it("should handle missing argument description", async () => {
      const mockContent = `---
description: "Missing arg desc"
args:
  - name: test
    required: true
---
Body`;

      mockReadFile.mockResolvedValue(mockContent);

      await expect(
        parsePromptFile("/path/to/missing-arg-desc.md"),
      ).rejects.toThrow("Missing description for argument 'test'");
    });
  });
});
