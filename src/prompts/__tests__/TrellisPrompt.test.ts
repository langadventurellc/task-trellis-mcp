import { TrellisPrompt } from "../TrellisPrompt";
import { PromptArgument } from "../PromptArgument";

describe("TrellisPrompt", () => {
  describe("interface structure", () => {
    it("should accept valid prompt with all required fields", () => {
      const prompt: TrellisPrompt = {
        name: "create-project",
        description: "Creates a new project with the specified configuration",
        arguments: [],
        userTemplate: "Create a project named {{projectName}}",
      };

      expect(prompt.name).toBe("create-project");
      expect(prompt.description).toBeDefined();
      expect(prompt.arguments).toEqual([]);
      expect(prompt.userTemplate).toBeDefined();
    });

    it("should accept prompt with optional title field", () => {
      const prompt: TrellisPrompt = {
        name: "test-prompt",
        title: "Test Prompt Title",
        description: "A test prompt",
        arguments: [],
        userTemplate: "Test template",
      };

      expect(prompt.title).toBe("Test Prompt Title");
    });

    it("should accept prompt with optional systemRules field", () => {
      const prompt: TrellisPrompt = {
        name: "test-prompt",
        description: "A test prompt",
        arguments: [],
        systemRules: "Follow these system rules",
        userTemplate: "Test template",
      };

      expect(prompt.systemRules).toBe("Follow these system rules");
    });

    it("should accept prompt with arguments", () => {
      const args: PromptArgument[] = [
        {
          name: "projectName",
          type: "string",
          required: true,
          description: "Name of the project",
        },
        {
          name: "includeTests",
          type: "boolean",
          required: false,
          description: "Whether to include test files",
        },
      ];

      const prompt: TrellisPrompt = {
        name: "create-project",
        description: "Creates a new project",
        arguments: args,
        userTemplate: "Create {{projectName}} with tests: {{includeTests}}",
      };

      expect(prompt.arguments).toHaveLength(2);
      expect(prompt.arguments[0].name).toBe("projectName");
      expect(prompt.arguments[1].type).toBe("boolean");
    });
  });

  describe("kebab-case name validation", () => {
    it("should accept kebab-case names", () => {
      const validNames = [
        "create-project",
        "update-task-status",
        "generate-epic-summary",
        "add-prerequisite",
      ];

      validNames.forEach((name) => {
        const prompt: TrellisPrompt = {
          name,
          description: "Test",
          arguments: [],
          userTemplate: "Test",
        };
        expect(prompt.name).toBe(name);
      });
    });
  });
});

describe("Integration scenarios", () => {
  it("should support complex prompt with multiple arguments", () => {
    const prompt: TrellisPrompt = {
      name: "create-feature-with-tasks",
      title: "Create Feature with Tasks",
      description: "Creates a feature and associated tasks",
      arguments: [
        {
          name: "featureName",
          type: "string",
          required: true,
          description: "Name of the feature",
        },
        {
          name: "epicId",
          type: "string",
          required: true,
          description: "Parent epic ID",
        },
        {
          name: "generateTests",
          type: "boolean",
          required: false,
          description: "Auto-generate test tasks",
        },
      ],
      systemRules: "Ensure all tasks follow the naming convention",
      userTemplate: `Create a feature named "{{featureName}}" under epic {{epicId}}.
{{#if generateTests}}Include test tasks for each component.{{/if}}`,
    };

    expect(prompt.arguments).toHaveLength(3);
    expect(prompt.arguments.filter((a) => a.required)).toHaveLength(2);
    expect(prompt.systemRules).toBeDefined();
    expect(prompt.userTemplate).toContain("{{featureName}}");
  });
});
