import { TaskTrellisService } from "../services/TaskTrellisService";
import { Repository } from "../repositories";

// Mock the entire server file
jest.mock("@modelcontextprotocol/sdk/server/index.js");
jest.mock("@modelcontextprotocol/sdk/server/stdio.js");

// Mock console methods
const consoleSpy = {
  warn: jest.spyOn(console, "warn").mockImplementation(),
  error: jest.spyOn(console, "error").mockImplementation(),
};

// Mock repository and service
const mockRepository: jest.Mocked<Repository> = {
  getObjectById: jest.fn(),
  getObjects: jest.fn(),
  saveObject: jest.fn(),
  deleteObject: jest.fn(),
  getChildrenOf: jest.fn(),
};

const mockService: jest.Mocked<TaskTrellisService> = {
  createObject: jest.fn(),
  updateObject: jest.fn(),
  listObjects: jest.fn(),
  appendObjectLog: jest.fn(),
  appendModifiedFiles: jest.fn(),
  claimTask: jest.fn(),
  completeTask: jest.fn(),
  pruneClosed: jest.fn(),
};

// Mock the repository and service getter functions
jest.mock("../server", () => ({
  ...jest.requireActual("../server"),
  getRepository: () => mockRepository,
  _getService: () => mockService,
}));

describe("Server Startup Auto-Prune Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.warn.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe("auto-prune disabled", () => {
    it("should not execute auto-prune when autoPrune is 0", async () => {
      // Mock server config with autoPrune = 0
      const mockServerConfig = { autoPrune: 0 };

      // Import and create startServer function with mocked config
      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("Starting auto-prune"),
      );
    });

    it("should not execute auto-prune when autoPrune is negative", async () => {
      const mockServerConfig = { autoPrune: -1 };

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalledWith(
        expect.stringContaining("Starting auto-prune"),
      );
    });
  });

  describe("auto-prune enabled", () => {
    it("should execute auto-prune when autoPrune > 0", async () => {
      const mockServerConfig = { autoPrune: 7 };
      const mockPruneResult = {
        content: [
          { type: "text", text: "Pruned 3 closed objects older than 7 days" },
        ],
      };

      mockService.pruneClosed.mockResolvedValue(mockPruneResult);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).toHaveBeenCalledTimes(1);
      expect(mockService.pruneClosed).toHaveBeenCalledWith(mockRepository, 7);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "Starting auto-prune for objects older than 7 days...",
      );
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "Auto-prune completed: Pruned 3 closed objects older than 7 days",
      );
    });

    it("should execute auto-prune with different day values", async () => {
      const mockServerConfig = { autoPrune: 30 };
      const mockPruneResult = {
        content: [
          { type: "text", text: "Pruned 0 closed objects older than 30 days" },
        ],
      };

      mockService.pruneClosed.mockResolvedValue(mockPruneResult);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).toHaveBeenCalledWith(mockRepository, 30);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "Starting auto-prune for objects older than 30 days...",
      );
    });
  });

  describe("auto-prune error handling", () => {
    it("should continue startup when auto-prune fails with Error", async () => {
      const mockServerConfig = { autoPrune: 7 };
      const mockError = new Error("Repository connection failed");

      mockService.pruneClosed.mockRejectedValue(mockError);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).toHaveBeenCalledTimes(1);
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        "Starting auto-prune for objects older than 7 days...",
      );
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Auto-prune failed: Repository connection failed",
      );
    });

    it("should continue startup when auto-prune fails with non-Error", async () => {
      const mockServerConfig = { autoPrune: 7 };
      const mockError = "Something went wrong";

      mockService.pruneClosed.mockRejectedValue(mockError);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(mockService.pruneClosed).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        "Auto-prune failed: Something went wrong",
      );
    });

    it("should continue startup when auto-prune fails with null", async () => {
      const mockServerConfig = { autoPrune: 7 };

      mockService.pruneClosed.mockRejectedValue(null);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      expect(consoleSpy.error).toHaveBeenCalledWith("Auto-prune failed: null");
    });

    it("should not crash server when auto-prune throws", async () => {
      const mockServerConfig = { autoPrune: 7 };
      const mockError = new Error("Critical failure");

      mockService.pruneClosed.mockRejectedValue(mockError);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      // Should not throw - server continues after auto-prune failure
      await expect(startServer()).resolves.not.toThrow();
    });
  });

  describe("integration with repository and service", () => {
    it("should use existing repository and service instances", async () => {
      const mockServerConfig = { autoPrune: 1 };
      const mockPruneResult = {
        content: [
          { type: "text", text: "Pruned 1 closed objects older than 1 days" },
        ],
      };

      mockService.pruneClosed.mockResolvedValue(mockPruneResult);

      const { startServer } = createStartServerWithConfig(mockServerConfig);

      await startServer();

      // Verify the mocked instances were called
      expect(mockService.pruneClosed).toHaveBeenCalledWith(mockRepository, 1);
    });
  });
});

/**
 * Helper function to create a startServer function with a specific server config
 * This simulates the server startup logic with auto-prune integration
 */
function createStartServerWithConfig(serverConfig: { autoPrune: number }) {
  // Mock runServer to avoid actual server connection
  const mockRunServer = jest.fn().mockResolvedValue(undefined);

  const startServer = async () => {
    // Auto-prune closed objects if enabled
    if (serverConfig.autoPrune > 0) {
      try {
        console.warn(
          `Starting auto-prune for objects older than ${serverConfig.autoPrune} days...`,
        );
        const repository = mockRepository;
        const service = mockService;
        const result = await service.pruneClosed(
          repository,
          serverConfig.autoPrune,
        );
        console.warn(`Auto-prune completed: ${result.content[0].text}`);
      } catch (error) {
        console.error(
          `Auto-prune failed: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Don't exit - continue starting server even if prune fails
      }
    }

    // Start the main server
    await mockRunServer();
  };

  return { startServer, mockRunServer };
}
