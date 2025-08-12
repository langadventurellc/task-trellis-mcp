import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handlePruneClosed } from "../pruneClosedTool";

describe("pruneClosedTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let pruneClosedSpy: jest.Mock;

  beforeEach(() => {
    pruneClosedSpy = jest.fn();
    mockService = {
      pruneClosed: pruneClosedSpy,
    } as unknown as TaskTrellisService;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("handlePruneClosed", () => {
    it("should call service.pruneClosed with correct parameters", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Pruned 2 closed objects older than 60 minutes",
          },
        ],
      };

      pruneClosedSpy.mockResolvedValue(mockResult);

      const args = {
        age: 60,
        scope: "F-test-feature",
      };

      const result = await handlePruneClosed(mockService, mockRepository, args);

      expect(pruneClosedSpy).toHaveBeenCalledWith(
        mockRepository,
        60,
        "F-test-feature",
      );
      expect(result).toBe(mockResult);
    });

    it("should call service.pruneClosed without scope parameter", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Pruned 0 closed objects older than 120 minutes",
          },
        ],
      };

      pruneClosedSpy.mockResolvedValue(mockResult);

      const args = {
        age: 120,
      };

      const result = await handlePruneClosed(mockService, mockRepository, args);

      expect(pruneClosedSpy).toHaveBeenCalledWith(
        mockRepository,
        120,
        undefined,
      );
      expect(result).toBe(mockResult);
    });

    it("should handle arguments correctly with type coercion", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Pruned 1 closed objects older than 30 minutes",
          },
        ],
      };

      pruneClosedSpy.mockResolvedValue(mockResult);

      // Test that args are properly typed
      const args = {
        age: "30", // String that should be coerced to number in real usage
        scope: "P-project-1",
      } as unknown;

      const result = await handlePruneClosed(mockService, mockRepository, args);

      expect(pruneClosedSpy).toHaveBeenCalledWith(
        mockRepository,
        "30", // The function passes through the value as-is, service handles conversion
        "P-project-1",
      );
      expect(result).toBe(mockResult);
    });

    it("should propagate service results", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Error pruning closed objects: Database connection failed",
          },
        ],
      };

      pruneClosedSpy.mockResolvedValue(mockResult);

      const args = {
        age: 60,
      };

      const result = await handlePruneClosed(mockService, mockRepository, args);

      expect(result).toBe(mockResult);
    });

    it("should handle zero age parameter", async () => {
      const mockResult = {
        content: [
          {
            type: "text",
            text: "Pruned 5 closed objects older than 0 minutes",
          },
        ],
      };

      pruneClosedSpy.mockResolvedValue(mockResult);

      const args = {
        age: 0,
      };

      const result = await handlePruneClosed(mockService, mockRepository, args);

      expect(pruneClosedSpy).toHaveBeenCalledWith(mockRepository, 0, undefined);
      expect(result).toBe(mockResult);
    });
  });
});
