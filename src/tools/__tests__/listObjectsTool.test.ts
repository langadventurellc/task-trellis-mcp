import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { handleListObjects } from "../listObjectsTool";

describe("listObjectsTool", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("handleListObjects", () => {
    const mockObjects: TrellisObject[] = [
      {
        id: "P-project-1",
        type: TrellisObjectType.PROJECT,
        title: "Project 1",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "Project 1 body",
      },
      {
        id: "T-task-1",
        type: TrellisObjectType.TASK,
        title: "Task 1",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.MEDIUM,
        parent: "F-feature-1",
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "Task 1 body",
      },
    ];

    it("should successfully list objects with valid type", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      const result = await handleListObjects(mockRepository, {
        type: "project",
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.PROJECT,
        undefined,
        undefined,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockObjects, null, 2),
          },
        ],
      });
    });

    it("should list objects with all parameters provided", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      const result = await handleListObjects(mockRepository, {
        type: "task",
        scope: "F-feature-1",
        status: "in-progress",
        priority: "high",
        includeClosed: true,
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        true,
        "F-feature-1",
        TrellisObjectType.TASK,
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.HIGH,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(mockObjects, null, 2),
          },
        ],
      });
    });

    it("should handle includeClosed parameter correctly", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await handleListObjects(mockRepository, {
        type: "task",
        includeClosed: false,
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        undefined,
      );
    });

    it("should default includeClosed to false when not provided", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await handleListObjects(mockRepository, {
        type: "task",
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        undefined,
      );
    });

    describe("type parameter validation", () => {
      it.each([
        { type: "project", expectedType: TrellisObjectType.PROJECT },
        { type: "epic", expectedType: TrellisObjectType.EPIC },
        { type: "feature", expectedType: TrellisObjectType.FEATURE },
        { type: "task", expectedType: TrellisObjectType.TASK },
      ])(
        "should convert valid type string '$type' to enum",
        async ({ type, expectedType }) => {
          mockRepository.getObjects.mockResolvedValue(mockObjects);

          await handleListObjects(mockRepository, { type });

          expect(mockRepository.getObjects).toHaveBeenCalledWith(
            false,
            undefined,
            expectedType,
            undefined,
            undefined,
          );
        },
      );

      it("should return error for invalid type", async () => {
        const result = await handleListObjects(mockRepository, {
          type: "invalid-type",
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid type value: invalid-type",
            },
          ],
        });
        expect(mockRepository.getObjects).not.toHaveBeenCalled();
      });
    });

    describe("status parameter validation", () => {
      it.each([
        { status: "draft", expectedStatus: TrellisObjectStatus.DRAFT },
        { status: "open", expectedStatus: TrellisObjectStatus.OPEN },
        {
          status: "in-progress",
          expectedStatus: TrellisObjectStatus.IN_PROGRESS,
        },
        { status: "done", expectedStatus: TrellisObjectStatus.DONE },
        { status: "wont-do", expectedStatus: TrellisObjectStatus.WONT_DO },
      ])(
        "should convert valid status string '$status' to enum",
        async ({ status, expectedStatus }) => {
          mockRepository.getObjects.mockResolvedValue(mockObjects);

          await handleListObjects(mockRepository, {
            type: "task",
            status,
          });

          expect(mockRepository.getObjects).toHaveBeenCalledWith(
            false,
            undefined,
            TrellisObjectType.TASK,
            expectedStatus,
            undefined,
          );
        },
      );

      it("should return error for invalid status", async () => {
        const result = await handleListObjects(mockRepository, {
          type: "task",
          status: "invalid-status",
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid status value: invalid-status",
            },
          ],
        });
        expect(mockRepository.getObjects).not.toHaveBeenCalled();
      });
    });

    describe("priority parameter validation", () => {
      it.each([
        { priority: "high", expectedPriority: TrellisObjectPriority.HIGH },
        { priority: "medium", expectedPriority: TrellisObjectPriority.MEDIUM },
        { priority: "low", expectedPriority: TrellisObjectPriority.LOW },
      ])(
        "should convert valid priority string '$priority' to enum",
        async ({ priority, expectedPriority }) => {
          mockRepository.getObjects.mockResolvedValue(mockObjects);

          await handleListObjects(mockRepository, {
            type: "task",
            priority,
          });

          expect(mockRepository.getObjects).toHaveBeenCalledWith(
            false,
            undefined,
            TrellisObjectType.TASK,
            undefined,
            expectedPriority,
          );
        },
      );

      it("should return error for invalid priority", async () => {
        const result = await handleListObjects(mockRepository, {
          type: "task",
          priority: "invalid-priority",
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid priority value: invalid-priority",
            },
          ],
        });
        expect(mockRepository.getObjects).not.toHaveBeenCalled();
      });
    });

    it("should handle optional parameters as undefined when not provided", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await handleListObjects(mockRepository, {
        type: "task",
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        undefined,
      );
    });

    it("should pass scope parameter through unchanged", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);
      const scope = "P-my-project";

      await handleListObjects(mockRepository, {
        type: "epic",
        scope,
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        scope,
        TrellisObjectType.EPIC,
        undefined,
        undefined,
      );
    });

    it("should handle repository errors gracefully", async () => {
      const errorMessage = "Database connection failed";
      mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

      const result = await handleListObjects(mockRepository, {
        type: "task",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error listing objects: ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockRepository.getObjects.mockRejectedValue("String error");

      const result = await handleListObjects(mockRepository, {
        type: "task",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error listing objects: String error",
          },
        ],
      });
    });

    it("should return empty array when repository returns no objects", async () => {
      mockRepository.getObjects.mockResolvedValue([]);

      const result = await handleListObjects(mockRepository, {
        type: "task",
      });

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify([], null, 2),
          },
        ],
      });
    });

    it("should handle complex filtering scenarios", async () => {
      const filteredObjects = [mockObjects[1]]; // Only the task
      mockRepository.getObjects.mockResolvedValue(filteredObjects);

      const result = await handleListObjects(mockRepository, {
        type: "task",
        scope: "F-feature-1",
        status: "in-progress",
        priority: "medium",
        includeClosed: true,
      });

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        true,
        "F-feature-1",
        TrellisObjectType.TASK,
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.MEDIUM,
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(filteredObjects, null, 2),
          },
        ],
      });
    });
  });
});
