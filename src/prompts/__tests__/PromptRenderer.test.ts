import { PromptRenderer } from "../PromptRenderer";
import { TrellisPrompt } from "../TrellisPrompt";
import { PromptMessage } from "../PromptMessage";

describe("PromptRenderer", () => {
  let renderer: PromptRenderer;

  beforeEach(() => {
    renderer = new PromptRenderer();
  });

  describe("renderPrompt", () => {
    it("should render a simple prompt without arguments", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Hello, world!",
      };

      const result = renderer.renderPrompt(prompt, {});

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe("user");
      expect(result[0].content.text).toBe("Hello, world!");
    });

    it("should include system message when systemRules is present", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [],
        userTemplate: "User message",
        systemRules: "System rules",
      };

      const result = renderer.renderPrompt(prompt, {});

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("system");
      expect(result[0].content.text).toBe("System rules");
      expect(result[1].role).toBe("user");
      expect(result[1].content.text).toBe("User message");
    });

    it("should throw error for missing required arguments", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "name", required: true, description: "User's name" },
        ],
        userTemplate: "Hello ${name}",
      };

      expect(() => renderer.renderPrompt(prompt, {})).toThrow(
        "Missing required argument: name. Description: User's name",
      );
    });

    it("should throw error for empty required arguments", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "name", required: true, description: "User's name" },
        ],
        userTemplate: "Hello ${name}",
      };

      expect(() => renderer.renderPrompt(prompt, { name: "  " })).toThrow(
        "Missing required argument: name. Description: User's name",
      );
    });

    it("should not throw error for provided required arguments", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "name", required: true, description: "User's name" },
        ],
        userTemplate: "Hello ${name}",
      };

      expect(() =>
        renderer.renderPrompt(prompt, { name: "John" }),
      ).not.toThrow();
    });
  });

  describe("substituteArguments", () => {
    it("should replace $ARGUMENTS with single input value", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "input", required: true, description: "Input data" },
        ],
        userTemplate: "Process this: $ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, { input: "test data" });

      expect(result[0].content.text).toBe("Process this: test data");
    });

    it("should handle empty single input argument", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "input", required: false, description: "Input data" },
        ],
        userTemplate: "Process this: $ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, { input: "" });

      expect(result[0].content.text).toBe("Process this: ");
    });

    it("should format multiple arguments as block", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "arg1", required: false, description: "First argument" },
          { name: "arg2", required: false, description: "Second argument" },
        ],
        userTemplate: "Here are the inputs:\n$ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, {
        arg1: "value1",
        arg2: "value2",
      });

      const text = result[0].content.text;
      expect(text).toContain("## Inputs");
      expect(text).toContain("**arg1**: value1");
      expect(text).toContain("**arg2**: value2");
      expect(text).toContain("*First argument*");
      expect(text).toContain("*Second argument*");
    });

    it("should handle missing values in multiple arguments block", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "arg1", required: false, description: "First argument" },
          { name: "arg2", required: false, description: "Second argument" },
        ],
        userTemplate: "Here are the inputs:\n$ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, { arg1: "value1" });

      const text = result[0].content.text;
      expect(text).toContain("**arg1**: value1");
      expect(text).toContain("**arg2**: (not provided)");
    });

    it("should handle no arguments gracefully", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Here are the inputs:\n$ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, {});

      expect(result[0].content.text).toBe("Here are the inputs:\n");
    });

    it("should leave template unchanged when no $ARGUMENTS placeholder", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "input", required: false, description: "Input data" },
        ],
        userTemplate: "No arguments here",
      };

      const result = renderer.renderPrompt(prompt, { input: "test" });

      expect(result[0].content.text).toBe("No arguments here");
    });
  });

  describe("substitutePlaceholders", () => {
    it("should replace ${argName} placeholders", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "firstName", required: true, description: "First name" },
          { name: "lastName", required: true, description: "Last name" },
        ],
        userTemplate: "Hello ${firstName} ${lastName}!",
      };

      const result = renderer.renderPrompt(prompt, {
        firstName: "John",
        lastName: "Doe",
      });

      expect(result[0].content.text).toBe("Hello John Doe!");
    });

    it("should handle missing optional arguments", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "name", required: true, description: "Name" },
          { name: "age", required: false, description: "Age" },
        ],
        userTemplate: "Name: ${name}, Age: ${age}",
      };

      const result = renderer.renderPrompt(prompt, { name: "John" });

      expect(result[0].content.text).toBe("Name: John, Age: (not provided)");
    });

    it("should handle empty argument values", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "name", required: false, description: "Name" }],
        userTemplate: "Name: ${name}",
      };

      const result = renderer.renderPrompt(prompt, { name: "" });

      expect(result[0].content.text).toBe("Name: ");
    });

    it("should leave undefined placeholders as-is when not in arguments schema", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "name", required: true, description: "Name" }],
        userTemplate: "Name: ${name}, Unknown: ${unknown}",
      };

      const result = renderer.renderPrompt(prompt, { name: "John" });

      expect(result[0].content.text).toBe("Name: John, Unknown: ${unknown}");
    });

    it("should handle placeholders with whitespace", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "name", required: true, description: "Name" }],
        userTemplate: "Name: ${ name }",
      };

      const result = renderer.renderPrompt(prompt, { name: "John" });

      expect(result[0].content.text).toBe("Name: John");
    });

    it("should throw error for missing required argument in placeholder", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "name", required: true, description: "Name" }],
        userTemplate: "Name: ${name}",
      };

      // This should be caught by validation, but test the fallback
      expect(() => {
        const renderer = new PromptRenderer();
        // Bypass validation by directly calling substitutePlaceholders
        const template = "Name: ${name}";
        const args = {};
        // This is a protected method, so we need to access it via (renderer as any)
        (renderer as any).substitutePlaceholders(template, prompt, args);
      }).toThrow("Missing required argument in placeholder: name");
    });
  });

  describe("sanitization", () => {
    it("should sanitize values to prevent injection", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "input", required: true, description: "Input" }],
        userTemplate: "Input: ${input}",
      };

      const maliciousInput = "test`code`$ARGUMENTS<script>alert()</script>";
      const result = renderer.renderPrompt(prompt, { input: maliciousInput });

      const text = result[0].content.text;
      expect(text).toContain("\\`");
      expect(text).toContain("\\$");
      expect(text).toContain("&lt;script&gt;");
      expect(text).toContain("&lt;/script&gt;");
    });

    it("should sanitize backslashes", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "input", required: true, description: "Input" }],
        userTemplate: "Input: ${input}",
      };

      const result = renderer.renderPrompt(prompt, { input: "test\\path" });

      expect(result[0].content.text).toContain("test\\\\path");
    });

    it("should limit consecutive newlines", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "input", required: true, description: "Input" }],
        userTemplate: "Input: ${input}",
      };

      const result = renderer.renderPrompt(prompt, {
        input: "line1\n\n\n\n\nline2",
      });

      expect(result[0].content.text).toBe("Input: line1\n\nline2");
    });
  });

  describe("edge cases", () => {
    it("should handle prompt with no arguments array", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Simple template",
      };

      const result = renderer.renderPrompt(prompt, {});

      expect(result[0].content.text).toBe("Simple template");
    });

    it("should handle multiple $ARGUMENTS placeholders", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [{ name: "input", required: false, description: "Input" }],
        userTemplate: "First: $ARGUMENTS, Second: $ARGUMENTS",
      };

      const result = renderer.renderPrompt(prompt, { input: "test" });

      expect(result[0].content.text).toBe("First: test, Second: test");
    });

    it("should handle mixed placeholder types", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [
          { name: "input", required: false, description: "Input" },
          { name: "name", required: false, description: "Name" },
        ],
        userTemplate: "Arguments: $ARGUMENTS\nName: ${name}",
      };

      const result = renderer.renderPrompt(prompt, {
        input: "data",
        name: "John",
      });

      const text = result[0].content.text;
      expect(text).toContain("## Inputs");
      expect(text).toContain("**input**: data");
      expect(text).toContain("Name: John");
    });

    it("should return proper PromptMessage structure", () => {
      const prompt: TrellisPrompt = {
        name: "test",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Test",
        systemRules: "Rules",
      };

      const result = renderer.renderPrompt(prompt, {});

      // Type assertion to ensure proper typing
      const messages: PromptMessage[] = result;
      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[0].content.type).toBe("text");
      expect(messages[1].role).toBe("user");
      expect(messages[1].content.type).toBe("text");
    });
  });
});
