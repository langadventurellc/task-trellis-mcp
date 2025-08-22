import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleClaimTask } from "../claimTaskTool";

describe("claimTaskTool", () => {
  let mockRepository: jest.Mocked<Repository>;
  let mockService: jest.Mocked<TaskTrellisService>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    mockService = {
      createObject: jest.fn(),
      updateObject: jest.fn(),
      claimTask: jest.fn(),
      completeTask: jest.fn(),
      listObjects: jest.fn(),
      appendObjectLog: jest.fn(),
      pruneClosed: jest.fn(),
      appendModifiedFiles: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("handleClaimTask", () => {
    it("should call service.claimTask with correct parameters", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {
        scope: "F-test-feature",
        taskId: "T-test-task",
        force: true,
      };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        "F-test-feature",
        "T-test-task",
        true,
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle undefined scope parameter", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
        force: false,
      };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle undefined taskId parameter", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {
        scope: "F-test-feature",
        force: true,
      };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        "F-test-feature",
        undefined,
        true,
      );
      expect(result).toBe(expectedResult);
    });

    it("should default force to false when not provided", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {
        taskId: "T-test-task",
      };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle empty args object", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {};

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        undefined,
        undefined,
        false,
      );
      expect(result).toBe(expectedResult);
    });

    it("should handle args with extra properties", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Successfully claimed task: {...}" }],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = {
        scope: "F-test-feature",
        taskId: "T-test-task",
        force: true,
        extraProperty: "should be ignored",
        anotherExtra: 123,
      };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(mockService.claimTask).toHaveBeenCalledWith(
        mockRepository,
        "F-test-feature",
        "T-test-task",
        true,
      );
      expect(result).toBe(expectedResult);
    });

    it("should return whatever the service returns", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: "Error claiming task: Task not found",
          },
        ],
      };
      mockService.claimTask.mockResolvedValue(expectedResult);

      const args = { taskId: "T-nonexistent" };

      const result = await handleClaimTask(mockService, mockRepository, args);

      expect(result).toBe(expectedResult);
    });
  });
});
