import { PromptArgument } from "../PromptArgument";

describe("PromptArgument", () => {
  describe("interface structure", () => {
    it("should accept valid argument with all required fields", () => {
      const arg: PromptArgument = {
        name: "testArg",
        required: true,
        description: "A test argument",
      };

      expect(arg.name).toBe("testArg");
      expect(arg.required).toBe(true);
      expect(arg.description).toBeDefined();
      expect(arg.type).toBeUndefined();
    });

    it("should accept argument with optional type field", () => {
      const stringArg: PromptArgument = {
        name: "textInput",
        type: "string",
        required: true,
        description: "A text input field",
      };

      const booleanArg: PromptArgument = {
        name: "enableFeature",
        type: "boolean",
        required: false,
        description: "Toggle feature on/off",
      };

      expect(stringArg.type).toBe("string");
      expect(booleanArg.type).toBe("boolean");
    });

    it("should handle optional arguments", () => {
      const optionalArg: PromptArgument = {
        name: "optionalField",
        required: false,
        description: "An optional field",
      };

      expect(optionalArg.required).toBe(false);
    });
  });

  describe("type system validation", () => {
    it("should only accept 'string' or 'boolean' as type values", () => {
      const validTypes: Array<"string" | "boolean" | undefined> = [
        "string",
        "boolean",
        undefined,
      ];

      validTypes.forEach((type) => {
        const arg: PromptArgument = {
          name: "testArg",
          type,
          required: true,
          description: "Test",
        };
        expect([undefined, "string", "boolean"]).toContain(arg.type);
      });
    });
  });
});
