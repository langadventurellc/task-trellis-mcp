import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleAppendObjectLog } from "../appendObjectLogTool";

describe("appendObjectLogTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let appendObjectLogSpy: jest.Mock;

  beforeEach(() => {
    appendObjectLogSpy = jest.fn();
    mockService = {
      appendObjectLog: appendObjectLogSpy,
    } as unknown as TaskTrellisService;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("handleAppendObjectLog", () => {
    it("should call service.appendObjectLog with correct parameters", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Successfully appended to object log",
          },
        ],
      };

      appendObjectLogSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-test-task",
        contents: "New log entry",
      };

      const result = await handleAppendObjectLog(
        mockService,
        mockRepository,
        args,
      );

      expect(appendObjectLogSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "New log entry",
      );
      expect(result).toBe(mockResult);
    });

    it("should handle argument parsing", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Success",
          },
        ],
      };

      appendObjectLogSpy.mockResolvedValue(mockResult);

      const args = {
        id: "T-example",
        contents: "Test content",
      };

      await handleAppendObjectLog(mockService, mockRepository, args);

      expect(appendObjectLogSpy).toHaveBeenCalledWith(
        mockRepository,
        "T-example",
        "Test content",
      );
    });
  });
});
