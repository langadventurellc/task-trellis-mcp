import path from "path";

describe("copyBasicClaudeAgents functionality", () => {
  const mockProjectRoot = "/test/project";
  const mockTargetDir = path.join(mockProjectRoot, ".claude", "agents");

  // Basic test to ensure test file structure is valid
  describe("test setup", () => {
    it("should have correct target directory path", () => {
      expect(mockTargetDir).toBe("/test/project/.claude/agents");
    });

    it("should be able to construct paths correctly", () => {
      const sourcePath = path.join("resources", "basic-claude", "agents");
      expect(sourcePath).toBe("resources/basic-claude/agents");
    });
  });

  // Note: Since copyBasicClaudeAgents is not exported, integration tests
  // will be added to serverStartup.test.ts to test the functionality
  // through the server startup process.
});
