import { ServerConfig } from "../../../configuration";
import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import {
  autoCompleteParentHierarchy,
  updateParentHierarchy,
} from "../../../utils";
import { validateStatusTransition } from "../../../validation/validateStatusTransition";
import { updateObject } from "../updateObject";

// Mock the validateStatusTransition function
jest.mock("../../../validation/validateStatusTransition", () => ({
  validateStatusTransition: jest.fn(),
}));

// Mock the utils functions
jest.mock("../../../utils", () => ({
  updateParentHierarchy: jest.fn(),
  autoCompleteParentHierarchy: jest.fn(),
}));

const mockValidateStatusTransition =
  validateStatusTransition as jest.MockedFunction<
    typeof validateStatusTransition
  >;

const mockUpdateParentHierarchy = updateParentHierarchy as jest.MockedFunction<
  typeof updateParentHierarchy
>;

const mockAutoCompleteParentHierarchy =
  autoCompleteParentHierarchy as jest.MockedFunction<
    typeof autoCompleteParentHierarchy
  >;

describe("updateObject", () => {
  let mockRepository: jest.Mocked<Repository>;
  let mockServerConfig: jest.Mocked<ServerConfig>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    mockServerConfig = {
      mode: "local",
      autoCompleteParent: true,
      autoPrune: 0,
    };

    jest.clearAllMocks();
  });

  const createMockObject = (
    type: TrellisObjectType,
    overrides: Partial<TrellisObject> = {},
  ): TrellisObject => ({
    id: "T-test-task",
    type,
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
    ...overrides,
  });

  describe("successful updates", () => {
    it("should update all properties of a task", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.HIGH,
        ["T-prereq-1", "T-prereq-2"],
        "Updated body content",
        TrellisObjectStatus.DRAFT,
        false,
      );

      const expectedUpdatedObject = {
        ...mockTask,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: ["T-prereq-1", "T-prereq-2"],
        body: "Updated body content",
        status: TrellisObjectStatus.DRAFT,
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
    });

    it("should update only priority for a project", async () => {
      const mockProject = createMockObject(TrellisObjectType.PROJECT, {
        id: "P-test-project",
      });
      mockRepository.getObjectById.mockResolvedValue(mockProject);
      mockRepository.saveObject.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "P-test-project",
        undefined,
        TrellisObjectPriority.LOW,
      );

      const expectedUpdatedObject = {
        ...mockProject,
        priority: TrellisObjectPriority.LOW,
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should update only prerequisites for an epic", async () => {
      const mockEpic = createMockObject(TrellisObjectType.EPIC, {
        id: "E-test-epic",
        prerequisites: ["E-other-epic"],
      });
      mockRepository.getObjectById.mockResolvedValue(mockEpic);
      mockRepository.saveObject.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "E-test-epic",
        undefined,
        undefined,
        ["E-new-prereq", "E-another-prereq"],
      );

      const expectedUpdatedObject = {
        ...mockEpic,
        prerequisites: ["E-new-prereq", "E-another-prereq"],
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should update only body content for a feature", async () => {
      const mockFeature = createMockObject(TrellisObjectType.FEATURE, {
        id: "F-test-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockFeature);
      mockRepository.saveObject.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "F-test-feature",
        undefined,
        undefined,
        undefined,
        "New detailed feature description",
      );

      const expectedUpdatedObject = {
        ...mockFeature,
        body: "New detailed feature description",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should update only title for a task", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        "Updated Task Title",
      );

      const expectedUpdatedObject = {
        ...mockTask,
        title: "Updated Task Title",
      };

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expectedUpdatedObject,
      );
      expect(result.content[0].text).toContain("Successfully updated object:");
    });
  });

  describe("priority updates", () => {
    it("should update priority to high", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: TrellisObjectPriority.HIGH,
        }),
      );
    });

    it("should update priority to medium", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        priority: TrellisObjectPriority.HIGH,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.MEDIUM,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: TrellisObjectPriority.MEDIUM,
        }),
      );
    });

    it("should update priority to low", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.LOW,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: TrellisObjectPriority.LOW,
        }),
      );
    });
  });

  describe("prerequisites array updates", () => {
    it("should add prerequisites to empty array", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        prerequisites: [],
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        ["T-prereq-1", "T-prereq-2"],
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: ["T-prereq-1", "T-prereq-2"],
        }),
      );
    });

    it("should replace existing prerequisites", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        prerequisites: ["T-old-prereq"],
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        ["T-new-prereq-1", "T-new-prereq-2"],
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: ["T-new-prereq-1", "T-new-prereq-2"],
        }),
      );
    });

    it("should clear prerequisites with empty array", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        prerequisites: ["T-prereq-1", "T-prereq-2"],
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        [],
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: [],
        }),
      );
    });
  });

  describe("status transitions", () => {
    it("should validate status transition from open to in-progress", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TrellisObjectStatus.IN_PROGRESS,
        }),
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalled();
    });

    it("should validate status transition from in-progress to done", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TrellisObjectStatus.DONE,
        }),
        mockRepository,
      );
    });

    it("should bypass validation when force is true", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
        true,
      );

      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TrellisObjectStatus.IN_PROGRESS,
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should return error when object is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-nonexistent",
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(mockValidateStatusTransition).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error: Object with ID 'T-nonexistent' not found",
      );
    });

    it("should return error when status validation fails", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      const validationError = new Error(
        "Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );
      mockValidateStatusTransition.mockRejectedValue(validationError);

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockValidateStatusTransition).toHaveBeenCalled();
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toBe(
        "Error updating object: Cannot update status to 'in-progress' - prerequisites are not complete. Use force=true to override.",
      );
    });

    it("should handle repository getObjectById errors gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database connection failed"),
      );

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      expect(result.content[0].text).toBe(
        "Error updating object: Database connection failed",
      );
    });

    it("should handle repository saveObject errors gracefully", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK);
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockRejectedValue(new Error("Failed to save"));
      mockValidateStatusTransition.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      expect(result.content[0].text).toBe(
        "Error updating object: Failed to save",
      );
    });

    it("should handle non-Error exceptions gracefully", async () => {
      mockRepository.getObjectById.mockRejectedValue("String error");

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(result.content[0].text).toBe(
        "Error updating object: String error",
      );
    });
  });

  describe("edge cases and business logic", () => {
    it("should not update properties when they are undefined", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        priority: TrellisObjectPriority.HIGH,
        prerequisites: ["T-existing"],
        body: "Existing body",
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(mockTask);
    });

    it("should handle complex update with multiple properties and status validation", async () => {
      const objectWithPrereqs = createMockObject(TrellisObjectType.TASK, {
        prerequisites: ["T-prereq-1"],
        priority: TrellisObjectPriority.LOW,
        body: "Original body",
      });

      mockRepository.getObjectById.mockResolvedValue(objectWithPrereqs);
      mockRepository.saveObject.mockResolvedValue();
      mockValidateStatusTransition.mockResolvedValue();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.HIGH,
        ["T-prereq-1", "T-prereq-2", "T-prereq-3"],
        "Updated comprehensive body with new requirements",
        TrellisObjectStatus.IN_PROGRESS,
        false,
      );

      const expectedObject = {
        ...objectWithPrereqs,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: ["T-prereq-1", "T-prereq-2", "T-prereq-3"],
        body: "Updated comprehensive body with new requirements",
        status: TrellisObjectStatus.IN_PROGRESS,
      };

      expect(mockValidateStatusTransition).toHaveBeenCalledWith(
        expectedObject,
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith(expectedObject);
      expect(result.content[0].text).toContain("Successfully updated object:");
    });

    it("should preserve object structure and metadata during update", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        id: "T-preserve-test",
        title: "Important Task",
        parent: "F-important-feature",
        childrenIds: ["T-child-1", "T-child-2"],
        affectedFiles: new Map([["file1.ts", "description"]]),
        log: ["Previous log entry"],
        created: "2025-01-10T08:00:00Z",
        updated: "2025-01-14T12:00:00Z",
        schema: "1.0",
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-preserve-test",
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "T-preserve-test",
          title: "Important Task",
          parent: "F-important-feature",
          childrenIds: ["T-child-1", "T-child-2"],
          affectedFiles: new Map([["file1.ts", "description"]]),
          log: ["Previous log entry"],
          created: "2025-01-10T08:00:00Z",
          updated: "2025-01-14T12:00:00Z",
          schema: "1.0",
          priority: TrellisObjectPriority.HIGH,
        }),
      );
    });
  });

  describe("parent hierarchy updates", () => {
    beforeEach(() => {
      mockUpdateParentHierarchy.mockClear();
      mockAutoCompleteParentHierarchy.mockClear();
    });

    it("should call updateParentHierarchy when status changes to IN_PROGRESS", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockUpdateParentHierarchy.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockUpdateParentHierarchy).toHaveBeenCalledWith(
        "F-parent-feature",
        mockRepository,
      );
    });

    it("should not call updateParentHierarchy when status is already IN_PROGRESS", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockUpdateParentHierarchy).not.toHaveBeenCalled();
    });

    it("should not call updateParentHierarchy when status changes to something other than IN_PROGRESS", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      expect(mockUpdateParentHierarchy).not.toHaveBeenCalled();
    });

    it("should not call updateParentHierarchy when no status change is requested", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(mockUpdateParentHierarchy).not.toHaveBeenCalled();
    });

    it("should handle updateParentHierarchy errors gracefully", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockUpdateParentHierarchy.mockRejectedValue(
        new Error("Parent hierarchy update failed"),
      );

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockUpdateParentHierarchy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to update parent hierarchy:",
        expect.any(Error),
      );
      expect(result.content[0].text).toContain("Successfully updated object:");

      consoleSpy.mockRestore();
    });

    it("should not call updateParentHierarchy when object has no parent", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: undefined,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockUpdateParentHierarchy).toHaveBeenCalledWith(
        undefined,
        mockRepository,
      );
    });

    it("should call autoCompleteParentHierarchy when status changes to DONE", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockAutoCompleteParentHierarchy.mockResolvedValue();

      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: true,
        autoPrune: 0,
      };

      await updateObject(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
        false,
      );

      expect(mockAutoCompleteParentHierarchy).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          status: TrellisObjectStatus.DONE,
          parent: "F-parent-feature",
        }),
      );
    });

    it("should call autoCompleteParentHierarchy when status changes to WONT_DO", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockAutoCompleteParentHierarchy.mockResolvedValue();

      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: true,
        autoPrune: 0,
      };

      await updateObject(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.WONT_DO,
        false,
      );

      expect(mockAutoCompleteParentHierarchy).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          status: TrellisObjectStatus.WONT_DO,
          parent: "F-parent-feature",
        }),
      );
    });

    it("should not call autoCompleteParentHierarchy when status is already DONE", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.DONE,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      expect(mockAutoCompleteParentHierarchy).not.toHaveBeenCalled();
    });

    it("should not call autoCompleteParentHierarchy when status changes to something other than DONE or WONT_DO", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.OPEN,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await updateObject(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockAutoCompleteParentHierarchy).not.toHaveBeenCalled();
    });

    it("should handle autoCompleteParentHierarchy errors gracefully", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockAutoCompleteParentHierarchy.mockRejectedValue(
        new Error("Auto-complete hierarchy update failed"),
      );

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: true,
        autoPrune: 0,
      };

      const result = await updateObject(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
        false,
      );

      expect(mockAutoCompleteParentHierarchy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to auto-complete parent hierarchy:",
        expect.any(Error),
      );
      expect(result.content[0].text).toContain("Successfully updated object:");

      consoleSpy.mockRestore();
    });
  });

  describe("serverConfig behavior", () => {
    it("should call autoCompleteParentHierarchy when serverConfig.autoCompleteParent is true", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();
      mockAutoCompleteParentHierarchy.mockResolvedValue();

      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: true,
        autoPrune: 0,
      };

      await updateObject(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
        false,
      );

      expect(mockAutoCompleteParentHierarchy).toHaveBeenCalledWith(
        mockRepository,
        expect.objectContaining({
          status: TrellisObjectStatus.DONE,
          parent: "F-parent-feature",
        }),
      );
    });

    it("should not call autoCompleteParentHierarchy when serverConfig.autoCompleteParent is false", async () => {
      const mockTask = createMockObject(TrellisObjectType.TASK, {
        status: TrellisObjectStatus.IN_PROGRESS,
        parent: "F-parent-feature",
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: false,
        autoPrune: 0,
      };

      await updateObject(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
        false,
      );

      expect(mockAutoCompleteParentHierarchy).not.toHaveBeenCalled();
    });
  });
});
