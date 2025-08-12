import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleReplaceObjectBodyRegex } from "../replaceObjectBodyRegexTool";

describe("replaceObjectBodyRegexTool", () => {
  let mockService: jest.Mocked<TaskTrellisService>;
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockService = {
      createObject: jest.fn(),
      updateObject: jest.fn(),
      claimTask: jest.fn(),
      completeTask: jest.fn(),
      listObjects: jest.fn(),
      appendObjectLog: jest.fn(),
      pruneClosed: jest.fn(),
      replaceObjectBodyRegex: jest.fn(),
      appendModifiedFiles: jest.fn(),
    };

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("handleReplaceObjectBodyRegex", () => {
    it("should call service.replaceObjectBodyRegex with correct parameters", async () => {
      const expectedResult = {
        content: [
          {
            type: "text",
            text: 'Successfully replaced content in object body using pattern "test". Object ID: T-test-task',
          },
        ],
      };

      mockService.replaceObjectBodyRegex.mockResolvedValue(expectedResult);

      const result = await handleReplaceObjectBodyRegex(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          regex: "test",
          replacement: "new text",
          allowMultipleOccurrences: true,
        },
      );

      expect(mockService.replaceObjectBodyRegex).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "test",
        "new text",
        true,
      );
      expect(result).toEqual(expectedResult);
    });

    it("should use default value for allowMultipleOccurrences when not provided", async () => {
      const expectedResult = {
        content: [{ type: "text", text: "Success" }],
      };

      mockService.replaceObjectBodyRegex.mockResolvedValue(expectedResult);

      await handleReplaceObjectBodyRegex(mockService, mockRepository, {
        id: "T-test-task",
        regex: "pattern",
        replacement: "replacement",
      });

      expect(mockService.replaceObjectBodyRegex).toHaveBeenCalledWith(
        mockRepository,
        "T-test-task",
        "pattern",
        "replacement",
        false,
      );
    });

    it("should pass through service result directly", async () => {
      const serviceResult = {
        content: [
          {
            type: "text",
            text: "Error: Object with ID 'T-nonexistent' not found",
          },
        ],
      };

      mockService.replaceObjectBodyRegex.mockResolvedValue(serviceResult);

      const result = await handleReplaceObjectBodyRegex(
        mockService,
        mockRepository,
        {
          id: "T-nonexistent",
          regex: "test",
          replacement: "new",
        },
      );

      expect(result).toEqual(serviceResult);
    });

    it("should handle different parameter combinations", async () => {
      const serviceResult = { content: [{ type: "text", text: "Success" }] };
      mockService.replaceObjectBodyRegex.mockResolvedValue(serviceResult);

      await handleReplaceObjectBodyRegex(mockService, mockRepository, {
        id: "T-another-task",
        regex: "complex (\\w+) pattern",
        replacement: "simple $1 replacement",
        allowMultipleOccurrences: false,
      });

      expect(mockService.replaceObjectBodyRegex).toHaveBeenCalledWith(
        mockRepository,
        "T-another-task",
        "complex (\\w+) pattern",
        "simple $1 replacement",
        false,
      );
    });
  });
});
