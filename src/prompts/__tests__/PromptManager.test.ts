import { jest } from "@jest/globals";
import * as fs from "fs/promises";
import { PromptManager } from "../PromptManager.js";
import { TrellisPrompt } from "../TrellisPrompt.js";

// Mock fs/promises
jest.mock("fs/promises");

// Mock parsePromptFile
jest.mock("../PromptParser.js", () => ({
  parsePromptFile: jest.fn(),
}));

describe("PromptManager", () => {
  let manager: PromptManager;
  let mockAccess: jest.MockedFunction<typeof fs.access>;
  let mockReaddir: jest.MockedFunction<any>;
  let mockConsoleError: any;

  beforeEach(() => {
    manager = new PromptManager(); // Default to "basic" package

    // Setup mocks
    mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
    mockReaddir = fs.readdir as jest.MockedFunction<any>;
    mockConsoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    jest.clearAllMocks();
  });

  afterEach(() => {
    mockConsoleError.mockRestore();
  });

  describe("constructor", () => {
    it("should initialize with empty cache", () => {
      expect(manager.list()).toEqual([]);
      expect(manager.size()).toBe(0);
    });
  });

  describe("load", () => {
    it("should handle non-existent directory gracefully", async () => {
      mockAccess.mockRejectedValue(new Error("Directory not found"));

      await manager.load();

      expect(manager.list()).toEqual([]);
      expect(manager.size()).toBe(0);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("Prompts directory does not exist"),
      );
    });

    it("should load valid prompt files", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([
        "test-prompt.md",
        "another.md",
        "readme.txt",
      ] as string[]);

      const mockPrompt1: TrellisPrompt = {
        name: "test-prompt",
        description: "A test prompt",
        arguments: [],
        userTemplate: "Test template",
      };

      const mockPrompt2: TrellisPrompt = {
        name: "another-prompt",
        description: "Another prompt",
        arguments: [],
        userTemplate: "Another template",
      };

      mockParsePromptFile.mockImplementation((filePath: string) => {
        if (filePath.includes("test-prompt.md")) {
          return Promise.resolve(mockPrompt1);
        } else if (filePath.includes("another.md")) {
          return Promise.resolve(mockPrompt2);
        }
        return Promise.reject(new Error("File not found"));
      });

      await manager.load();

      expect(manager.size()).toBe(2);
      expect(manager.has("test-prompt")).toBe(true);
      expect(manager.has("another-prompt")).toBe(true);
      expect(manager.get("test-prompt")).toEqual(mockPrompt1);
      expect(manager.get("another-prompt")).toEqual(mockPrompt2);
    });

    it("should skip invalid prompt files", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["invalid.md", "valid.md"] as string[]);

      const mockValidPrompt: TrellisPrompt = {
        name: "valid-prompt",
        description: "Valid prompt",
        arguments: [],
        userTemplate: "Valid template",
      };

      mockParsePromptFile.mockImplementation((filePath: string) => {
        if (filePath.includes("invalid.md")) {
          return Promise.reject(new Error("Parse error"));
        } else if (filePath.includes("valid.md")) {
          return Promise.resolve(mockValidPrompt);
        }
        return Promise.reject(new Error("File not found"));
      });

      await manager.load();

      expect(manager.size()).toBe(1);
      expect(manager.has("valid-prompt")).toBe(true);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to parse prompt file invalid.md:",
        expect.any(Error),
      );
    });

    it("should skip prompts with missing names", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["no-name.md"] as string[]);

      const mockPromptNoName: TrellisPrompt = {
        name: "",
        description: "No name prompt",
        arguments: [],
        userTemplate: "Template",
      };

      mockParsePromptFile.mockResolvedValue(mockPromptNoName);

      await manager.load();

      expect(manager.size()).toBe(0);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Invalid prompt file no-name.md: missing name",
      );
    });

    it("should handle duplicate prompt names", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["first.md", "second.md"] as string[]);

      const mockDuplicatePrompt: TrellisPrompt = {
        name: "duplicate-name",
        description: "Duplicate prompt",
        arguments: [],
        userTemplate: "Template content",
      };

      mockParsePromptFile.mockResolvedValue(mockDuplicatePrompt);

      await manager.load();

      expect(manager.size()).toBe(1);
      expect(mockConsoleError).toHaveBeenCalledWith(
        'Duplicate prompt name "duplicate-name" found in file second.md',
      );
    });

    it("should only load once", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([]);

      await manager.load();
      await manager.load();

      expect(mockReaddir).toHaveBeenCalledTimes(1);
    });

    it("should handle readdir error", async () => {
      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockRejectedValue(new Error("Read error"));

      await manager.load();

      expect(manager.size()).toBe(0);
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Failed to read prompts directory:",
        expect.any(Error),
      );
    });
  });

  describe("list", () => {
    it("should return all loaded prompts", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["prompt1.md", "prompt2.md"] as string[]);

      const mockPrompt1: TrellisPrompt = {
        name: "prompt-one",
        description: "Prompt One",
        arguments: [],
        userTemplate: "Template one",
      };

      const mockPrompt2: TrellisPrompt = {
        name: "prompt-two",
        description: "Prompt Two",
        arguments: [],
        userTemplate: "Template two",
      };

      mockParsePromptFile.mockImplementation((filePath: string) => {
        if (filePath.includes("prompt1.md")) {
          return Promise.resolve(mockPrompt1);
        } else if (filePath.includes("prompt2.md")) {
          return Promise.resolve(mockPrompt2);
        }
        return Promise.reject(new Error("File not found"));
      });

      await manager.load();
      const prompts = manager.list();

      expect(prompts).toHaveLength(2);
      expect(prompts.map((p) => p.name).sort()).toEqual([
        "prompt-one",
        "prompt-two",
      ]);
    });

    it("should return empty array when no prompts loaded", () => {
      const prompts = manager.list();
      expect(prompts).toEqual([]);
    });
  });

  describe("get", () => {
    beforeEach(async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["test.md"] as string[]);

      const mockPrompt: TrellisPrompt = {
        name: "test-prompt",
        description: "Test description",
        arguments: [],
        userTemplate: "Test template",
      };

      mockParsePromptFile.mockResolvedValue(mockPrompt);

      await manager.load();
    });

    it("should return prompt by name", () => {
      const prompt = manager.get("test-prompt");

      expect(prompt).toBeDefined();
      expect(prompt?.name).toBe("test-prompt");
      expect(prompt?.description).toBe("Test description");
      expect(prompt?.userTemplate).toBe("Test template");
    });

    it("should return undefined for non-existent prompt", () => {
      const prompt = manager.get("non-existent");

      expect(prompt).toBeUndefined();
    });
  });

  describe("has", () => {
    beforeEach(async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["test.md"] as string[]);

      const mockPrompt: TrellisPrompt = {
        name: "test-prompt",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Test template",
      };

      mockParsePromptFile.mockResolvedValue(mockPrompt);

      await manager.load();
    });

    it("should return true for existing prompt", () => {
      expect(manager.has("test-prompt")).toBe(true);
    });

    it("should return false for non-existent prompt", () => {
      expect(manager.has("non-existent")).toBe(false);
    });
  });

  describe("size", () => {
    it("should return 0 for empty cache", () => {
      expect(manager.size()).toBe(0);
    });

    it("should return correct count after loading", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["prompt1.md", "prompt2.md"] as string[]);

      mockParsePromptFile.mockImplementation((filePath: string) => {
        const name = filePath.includes("prompt1.md") ? "prompt1" : "prompt2";
        return Promise.resolve({
          name,
          description: `${name} description`,
          arguments: [],
          userTemplate: `${name} template`,
        });
      });

      await manager.load();

      expect(manager.size()).toBe(2);
    });
  });

  describe("clear", () => {
    it("should clear all cached prompts", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["test.md"] as string[]);

      mockParsePromptFile.mockResolvedValue({
        name: "test",
        description: "Test",
        arguments: [],
        userTemplate: "Test",
      });

      await manager.load();
      expect(manager.size()).toBeGreaterThan(0);

      manager.clear();

      expect(manager.size()).toBe(0);
      expect(manager.list()).toEqual([]);
      expect(manager.has("test")).toBe(false);
      expect(manager.get("test")).toBeUndefined();
    });

    it("should allow loading again after clear", async () => {
      manager.clear();

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue([]);

      await manager.load();

      // Should not throw and should complete normally
      expect(manager.size()).toBe(0);
    });
  });

  describe("promptPackage parameter", () => {
    it("should default to 'basic' package when no parameter provided", () => {
      const defaultManager = new PromptManager();
      // Internal state not exposed, but we can test behavior through load()
      expect(defaultManager).toBeDefined();
    });

    it("should accept custom package parameter", () => {
      const customManager = new PromptManager("basic-claude");
      expect(customManager).toBeDefined();
    });

    it("should use correct path for 'basic' package", async () => {
      const basicManager = new PromptManager("basic");

      mockAccess.mockRejectedValue(new Error("Directory not found"));

      await basicManager.load();

      // Verify the correct path was checked (basic package)
      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining("resources/basic/prompts"),
      );
    });

    it("should use correct path for 'basic-claude' package", async () => {
      const claudeManager = new PromptManager("basic-claude");

      mockAccess.mockRejectedValue(new Error("Directory not found"));

      await claudeManager.load();

      // Verify the correct path was checked (basic-claude package)
      expect(mockAccess).toHaveBeenCalledWith(
        expect.stringContaining("resources/basic-claude/prompts"),
      );
    });

    it("should include package name in error messages", async () => {
      const claudeManager = new PromptManager("basic-claude");

      mockAccess.mockRejectedValue(new Error("Directory not found"));

      await claudeManager.load();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("for package 'basic-claude'"),
      );
    });

    it("should include package name in success messages", async () => {
      const mockParsePromptFile = require("../PromptParser.js").parsePromptFile;
      const claudeManager = new PromptManager("basic-claude");

      mockAccess.mockResolvedValue(undefined);
      mockReaddir.mockResolvedValue(["test.md"] as string[]);

      const mockPrompt: TrellisPrompt = {
        name: "test-prompt",
        description: "Test prompt",
        arguments: [],
        userTemplate: "Test template",
      };

      mockParsePromptFile.mockResolvedValue(mockPrompt);

      await claudeManager.load();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining("from package 'basic-claude'"),
      );
    });
  });
});
