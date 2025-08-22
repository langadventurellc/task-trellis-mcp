import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { handleGetObject } from "../getObjectTool";

describe("getObjectTool", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };
  });

  describe("handleGetObject", () => {
    const mockTrellisObject: TrellisObject = {
      id: "T-test-task",
      type: TrellisObjectType.TASK,
      title: "Test Task",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "F-test-feature",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "1.0",
      childrenIds: [],
      body: "This is a test task",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    };

    it("should successfully retrieve and return an object", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await handleGetObject(mockRepository, {
        id: "T-test-task",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Retrieved object: ${JSON.stringify(mockTrellisObject, null, 2)}`,
          },
        ],
      });
    });

    it("should return not found message when object does not exist", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await handleGetObject(mockRepository, {
        id: "T-nonexistent",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: 'Object with ID "T-nonexistent" not found',
          },
        ],
      });
    });

    it("should handle repository errors gracefully", async () => {
      const errorMessage = "Database connection failed";
      mockRepository.getObjectById.mockRejectedValue(new Error(errorMessage));

      const result = await handleGetObject(mockRepository, {
        id: "T-test-task",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error retrieving object with ID "T-test-task": ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle non-Error exceptions", async () => {
      const errorValue = "String error";
      mockRepository.getObjectById.mockRejectedValue(errorValue);

      const result = await handleGetObject(mockRepository, {
        id: "T-test-task",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error retrieving object with ID "T-test-task": ${errorValue}`,
          },
        ],
      });
    });

    it("should extract id from args object correctly", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);

      const result = await handleGetObject(mockRepository, {
        id: "T-test-task",
        extraProperty: "should be ignored",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(result.content[0].text).toContain("Retrieved object:");
    });

    it("should handle different object types correctly", async () => {
      const projectObject: TrellisObject = {
        id: "P-test-project",
        type: TrellisObjectType.PROJECT,
        title: "Test Project",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "1.0",
        childrenIds: [],
        body: "This is a test project",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      mockRepository.getObjectById.mockResolvedValue(projectObject);

      const result = await handleGetObject(mockRepository, {
        id: "P-test-project",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "P-test-project",
      );
      expect(result.content[0].text).toContain(
        JSON.stringify(projectObject, null, 2),
      );
    });
  });
});
