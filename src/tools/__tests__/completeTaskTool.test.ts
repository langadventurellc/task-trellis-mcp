import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleCompleteTask } from "../completeTaskTool";
import { ServerConfig } from "../../configuration";

describe("completeTaskTool", () => {
  let mockService: jest.Mocked<TaskTrellisService>;
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockService = {
      completeTask: jest.fn(),
      createObject: jest.fn(),
      updateObject: jest.fn(),
      claimTask: jest.fn(),
      listObjects: jest.fn(),
      appendObjectLog: jest.fn(),
      pruneClosed: jest.fn(),
      replaceObjectBodyRegex: jest.fn(),
    };

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
  });

  describe("handleCompleteTask", () => {
    it("should call service.completeTask with correct parameters", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Task "T-test-task" completed successfully. Updated 2 affected files.',
          },
        ],
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        summary: "Task completed successfully",
        filesChanged: {
          "src/file1.ts": "Added new feature",
          "src/file2.ts": "Fixed bug",
        },
      };

      const result = await handleCompleteTask(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "Task completed successfully",
        {
          "src/file1.ts": "Added new feature",
          "src/file2.ts": "Fixed bug",
        },
        undefined,
      );
      expect(result).toBe(expectedResult);
    });

    it("should pass serverConfig to service.completeTask when provided", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Task "T-test-task" completed successfully.',
          },
        ],
      };

      const serverConfig: ServerConfig = {
        mode: "local",
        planningRootFolder: "/test",
        autoCompleteParent: true,
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        summary: "Task completed",
        filesChanged: {},
      };

      const result = await handleCompleteTask(
        mockService,
        mockRepository,
        args,
        serverConfig,
      );

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "Task completed",
        {},
        serverConfig,
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle empty filesChanged object", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Task "T-test-task" completed successfully. Updated 0 affected files.',
          },
        ],
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        summary: "Task completed with no file changes",
        filesChanged: {},
      };

      const result = await handleCompleteTask(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "Task completed with no file changes",
        {},
        undefined,
      );
      expect(result).toBe(expectedResult);
    });

    it("should propagate service errors", async () => {
      const errorMessage = "Task not found";
      mockService.completeTask.mockRejectedValue(new Error(errorMessage));

      const args = {
        taskId: "T-nonexistent",
        summary: "Summary",
        filesChanged: {},
      };

      await expect(
        handleCompleteTask(mockService, mockRepository, args),
      ).rejects.toThrow(errorMessage);

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-nonexistent",
        "Summary",
        {},
        undefined,
      );
    });

    it("should handle complex filesChanged object", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Task "T-test-task" completed successfully. Updated 3 affected files.',
          },
        ],
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        summary: "Multiple files changed",
        filesChanged: {
          "file1.ts": "First file",
          "file2.js": "Second file",
          "config.json": "Configuration file",
        },
      };

      const result = await handleCompleteTask(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "Multiple files changed",
        {
          "file1.ts": "First file",
          "file2.js": "Second file",
          "config.json": "Configuration file",
        },
        undefined,
      );
      expect(result).toBe(expectedResult);
    });

    it("should ignore extra properties in args object", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Task "T-test-task" completed successfully.',
          },
        ],
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        summary: "Test summary",
        filesChanged: { "test.ts": "Test file" },
        extraProperty: "should be ignored",
        anotherExtra: 123,
      };

      const result = await handleCompleteTask(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "Test summary",
        { "test.ts": "Test file" },
        undefined,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe("parameter extraction", () => {
    it("should correctly extract taskId, summary, and filesChanged from args", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Success" }],
      };

      mockService.completeTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-extract-test",
        summary: "Extraction test summary",
        filesChanged: {
          "extract.ts": "Extraction test",
        },
      };

      await handleCompleteTask(mockService, mockRepository, args);

      expect(mockService.completeTask).toHaveBeenCalledWith(
        mockRepository,
        "T-extract-test",
        "Extraction test summary",
        { "extract.ts": "Extraction test" },
        undefined,
      );
    });
  });
});
