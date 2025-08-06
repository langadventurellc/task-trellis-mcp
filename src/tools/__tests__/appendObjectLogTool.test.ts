import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { handleAppendObjectLog } from "../appendObjectLogTool";

describe("appendObjectLogTool", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("handleAppendObjectLog", () => {
    const mockTrellisObject: TrellisObject = {
      id: "T-test-task",
      type: TrellisObjectType.TASK,
      title: "Test Task",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "F-test-feature",
      prerequisites: [],
      affectedFiles: new Map(),
      log: ["Initial log entry", "Second log entry"],
      schema: "1.0",
      childrenIds: [],
      body: "This is a test task",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    };

    it("should successfully append to object log", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: "New log entry",
      });

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        log: ["Initial log entry", "Second log entry", "New log entry"],
      };

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain(
        "Successfully appended to object log:",
      );
      expect(result.content[0].text).toContain("T-test-task");
      expect(result.content[0].text).toContain("New log entry");
      expect(result.content[0].text).toContain('totalLogEntries": 3');
    });

    it("should append to empty log", async () => {
      const objectWithEmptyLog = {
        ...mockTrellisObject,
        log: [],
      };
      mockRepository.getObjectById.mockResolvedValue(objectWithEmptyLog);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: "First log entry",
      });

      const expectedUpdatedObject = {
        ...objectWithEmptyLog,
        log: ["First log entry"],
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain('totalLogEntries": 1');
    });

    it("should return error when object is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-nonexistent",
        contents: "Test content",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should handle getObjectById errors gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: "Test content",
      });

      expect(result.content[0].text).toBe(
        "Error appending to object log: Database connection failed",
      );
    });

    it("should handle saveObject errors gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockRejectedValue(new Error("Failed to save"));

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: "Test content",
      });

      expect(result.content[0].text).toBe(
        "Error appending to object log: Failed to save",
      );
    });

    it("should handle empty contents string", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: "",
      });

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        log: ["Initial log entry", "Second log entry", ""],
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain(
        "Successfully appended to object log:",
      );
    });

    it("should handle multiline contents", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const multilineContent = "Line 1\nLine 2\nLine 3";

      const result = await handleAppendObjectLog(mockRepository, {
        id: "T-test-task",
        contents: multilineContent,
      });

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        log: ["Initial log entry", "Second log entry", multilineContent],
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain(
        "Successfully appended to object log:",
      );
    });
  });
});
