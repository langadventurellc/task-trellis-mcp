import { Repository } from "../../repositories/Repository";
import { handleDeleteObject } from "../deleteObjectTool";

describe("deleteObjectTool", () => {
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

  describe("handleDeleteObject", () => {
    it("should successfully delete an object", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await handleDeleteObject(mockRepository, {
        id: "T-test-task",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-test-task",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Successfully deleted object: T-test-task",
          },
        ],
      });
    });

    it("should successfully delete an object with force flag", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await handleDeleteObject(mockRepository, {
        id: "P-test-project",
        force: true,
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "P-test-project",
        true,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Successfully deleted object: P-test-project",
          },
        ],
      });
    });

    it("should handle force flag defaulting to false", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await handleDeleteObject(mockRepository, {
        id: "E-test-epic",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "E-test-epic",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Successfully deleted object: E-test-epic",
          },
        ],
      });
    });

    it("should handle repository errors when object is not found", async () => {
      const errorMessage = "No object found with ID: T-nonexistent";
      mockRepository.deleteObject.mockRejectedValue(new Error(errorMessage));

      const result = await handleDeleteObject(mockRepository, {
        id: "T-nonexistent",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-nonexistent",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error deleting object with ID "T-nonexistent": ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle repository errors when object has dependencies", async () => {
      const errorMessage =
        "Cannot delete object T-required-task because it is required by other objects. Use force=true to override.";
      mockRepository.deleteObject.mockRejectedValue(new Error(errorMessage));

      const result = await handleDeleteObject(mockRepository, {
        id: "T-required-task",
        force: false,
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-required-task",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error deleting object with ID "T-required-task": ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle file system errors gracefully", async () => {
      const errorMessage = "Permission denied";
      mockRepository.deleteObject.mockRejectedValue(new Error(errorMessage));

      const result = await handleDeleteObject(mockRepository, {
        id: "F-test-feature",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "F-test-feature",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error deleting object with ID "F-test-feature": ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle non-Error exceptions", async () => {
      const errorValue = "String error";
      mockRepository.deleteObject.mockRejectedValue(errorValue);

      const result = await handleDeleteObject(mockRepository, {
        id: "T-test-task",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-test-task",
        false,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error deleting object with ID "T-test-task": ${errorValue}`,
          },
        ],
      });
    });

    it("should extract parameters from args object correctly", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await handleDeleteObject(mockRepository, {
        id: "T-test-task",
        force: true,
        extraProperty: "should be ignored",
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-test-task",
        true,
      );
      expect(result.content[0].text).toBe(
        "Successfully deleted object: T-test-task",
      );
    });

    it("should handle different object types correctly", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      // Test Project
      await handleDeleteObject(mockRepository, { id: "P-test-project" });
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "P-test-project",
        false,
      );

      // Test Epic
      await handleDeleteObject(mockRepository, { id: "E-test-epic" });
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "E-test-epic",
        false,
      );

      // Test Feature
      await handleDeleteObject(mockRepository, { id: "F-test-feature" });
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "F-test-feature",
        false,
      );

      // Test Task
      await handleDeleteObject(mockRepository, { id: "T-test-task" });
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-test-task",
        false,
      );
    });

    it("should handle force deletion of objects with dependencies", async () => {
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await handleDeleteObject(mockRepository, {
        id: "T-prerequisite-task",
        force: true,
      });

      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-prerequisite-task",
        true,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Successfully deleted object: T-prerequisite-task",
          },
        ],
      });
    });
  });
});
