import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { handleUpdateObject } from "../updateObjectTool";

// Mock the validateStatusTransition function
jest.mock("../../validation/validateStatusTransition", () => ({
  validateStatusTransition: jest.fn(),
}));

import { validateStatusTransition } from "../../validation/validateStatusTransition";

const mockValidateStatusTransition =
  validateStatusTransition as jest.MockedFunction<
    typeof validateStatusTransition
  >;

describe("updateObjectTool", () => {
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

  describe("handleUpdateObject", () => {
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

    it("should successfully update an object with all properties", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        priority: "high",
        prerequisites: ["T-prereq-1", "T-prereq-2"],
        body: "Updated body content",
        status: "draft",
      });

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        priority: "high",
        prerequisites: ["T-prereq-1", "T-prereq-2"],
        body: "Updated body content",
        status: "draft",
      };

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expectedUpdatedObject,
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully updated object:");
      expect(result.content[0].text).toContain("T-test-task");
    });

    it("should successfully update only specified properties", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        priority: "low",
      });

      const expectedUpdatedObject = {
        ...mockTrellisObject,
        priority: "low",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should return error when object is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await handleUpdateObject(mockRepository, {
        id: "T-nonexistent",
        priority: "high",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should validate status transition when status changes to in-progress", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "in-progress",
      });

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTrellisObject,
          status: "in-progress",
        }),
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should validate status transition when status changes to done", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "done",
      });

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTrellisObject,
          status: "done",
        }),
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should reject status change when validation fails", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      const validationError = new Error(
        "Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );
      mockValidateStatusTransition.mockRejectedValue(validationError);

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "in-progress",
      });

      expect(mockValidateStatusTransition).toHaveBeenCalled();
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error updating object: Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );
    });

    it("should bypass validation when force is true", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "in-progress",
        force: true,
      });

      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should not validate status transitions for non-status updates", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        priority: "high",
        body: "Updated body",
      });

      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should handle repository errors gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "done",
      });

      expect(result.content[0].text).toBe(
        "Error updating object: Database connection failed",
      );
    });

    it("should handle saveObject errors gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockRepository.saveObject.mockRejectedValue(new Error("Failed to save"));
      mockValidateStatusTransition.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "done",
      });

      expect(result.content[0].text).toBe(
        "Error updating object: Failed to save",
      );
    });

    it("should handle validation errors gracefully", async () => {
      mockRepository.getObjectById.mockResolvedValue(mockTrellisObject);
      mockValidateStatusTransition.mockRejectedValue(
        new Error("Validation failed"),
      );

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        status: "in-progress",
      });

      expect(result.content[0].text).toBe(
        "Error updating object: Validation failed",
      );
    });

    it("should handle complex update with multiple properties and status validation", async () => {
      const objectWithPrereqs = {
        ...mockTrellisObject,
        prerequisites: ["T-prereq-1"],
      };

      mockRepository.getObjectById.mockResolvedValue(objectWithPrereqs);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await handleUpdateObject(mockRepository, {
        id: "T-test-task",
        priority: "high",
        prerequisites: ["T-prereq-1", "T-prereq-2", "T-prereq-3"],
        body: "Updated body with new requirements",
        status: "in-progress",
      });

      const expectedUpdatedObject = {
        ...objectWithPrereqs,
        priority: "high",
        prerequisites: ["T-prereq-1", "T-prereq-2", "T-prereq-3"],
        body: "Updated body with new requirements",
        status: "in-progress",
      };

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expectedUpdatedObject,
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully updated object:");
    });
  });
});
