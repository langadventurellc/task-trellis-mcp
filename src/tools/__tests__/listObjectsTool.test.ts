import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleListObjects } from "../listObjectsTool";

describe("listObjectsTool", () => {
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
      getNextAvailableIssue: jest.fn(),
      completeTask: jest.fn(),
      listObjects: jest.fn(),
      appendObjectLog: jest.fn(),
      pruneClosed: jest.fn(),
      appendModifiedFiles: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("handleListObjects", () => {
    const mockSummaries = [
      {
        id: "P-project-1",
        type: "project",
        title: "Project 1",
        status: "open",
        priority: "high",
        prerequisites: [],
        childrenIds: [],
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      },
      {
        id: "T-task-1",
        type: "task",
        title: "Task 1",
        status: "in-progress",
        priority: "medium",
        parent: "F-feature-1",
        prerequisites: [],
        childrenIds: [],
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      },
    ];

    const mockResponse = {
      content: [
        {
          type: "text",
          text: JSON.stringify(mockSummaries, null, 2),
        },
      ],
    };

    it("should call service.listObjects with correct parameters for type only", async () => {
      mockService.listObjects.mockResolvedValue(mockResponse);

      const result = await handleListObjects(mockService, mockRepository, {
        type: "project",
      });

      expect(mockService.listObjects).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.PROJECT,
        undefined,
        undefined,
        undefined,
        false,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should call service.listObjects with all parameters provided", async () => {
      mockService.listObjects.mockResolvedValue(mockResponse);

      const result = await handleListObjects(mockService, mockRepository, {
        type: "task",
        scope: "F-feature-1",
        status: "in-progress",
        priority: "high",
        includeClosed: true,
      });

      expect(mockService.listObjects).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        "F-feature-1",
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.HIGH,
        true,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should default includeClosed to false when not provided", async () => {
      mockService.listObjects.mockResolvedValue(mockResponse);

      await handleListObjects(mockService, mockRepository, {
        type: "task",
      });

      expect(mockService.listObjects).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        undefined,
        undefined,
        false,
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
          mockService.listObjects.mockResolvedValue(mockResponse);

          await handleListObjects(mockService, mockRepository, { type });

          expect(mockService.listObjects).toHaveBeenCalledWith(
            mockRepository,
            expectedType,
            undefined,
            undefined,
            undefined,
            false,
          );
        },
      );

      it("should return error for invalid type", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
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
        expect(mockService.listObjects).not.toHaveBeenCalled();
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
          mockService.listObjects.mockResolvedValue(mockResponse);

          await handleListObjects(mockService, mockRepository, {
            type: "task",
            status,
          });

          expect(mockService.listObjects).toHaveBeenCalledWith(
            mockRepository,
            TrellisObjectType.TASK,
            undefined,
            expectedStatus,
            undefined,
            false,
          );
        },
      );

      it("should return error for invalid status", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
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
        expect(mockService.listObjects).not.toHaveBeenCalled();
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
          mockService.listObjects.mockResolvedValue(mockResponse);

          await handleListObjects(mockService, mockRepository, {
            type: "task",
            priority,
          });

          expect(mockService.listObjects).toHaveBeenCalledWith(
            mockRepository,
            TrellisObjectType.TASK,
            undefined,
            undefined,
            expectedPriority,
            false,
          );
        },
      );

      it("should return error for invalid priority", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
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
        expect(mockService.listObjects).not.toHaveBeenCalled();
      });
    });

    it("should pass scope parameter through unchanged", async () => {
      mockService.listObjects.mockResolvedValue(mockResponse);
      const scope = "P-my-project";

      await handleListObjects(mockService, mockRepository, {
        type: "epic",
        scope,
      });

      expect(mockService.listObjects).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.EPIC,
        scope,
        undefined,
        undefined,
        false,
      );
    });

    it("should handle service errors gracefully", async () => {
      const errorMessage = "Service error";
      mockService.listObjects.mockRejectedValue(new Error(errorMessage));

      const result = await handleListObjects(mockService, mockRepository, {
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

    it("should handle non-Error exceptions from service", async () => {
      mockService.listObjects.mockRejectedValue("String error");

      const result = await handleListObjects(mockService, mockRepository, {
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

    it("should handle complex parameter scenarios", async () => {
      mockService.listObjects.mockResolvedValue(mockResponse);

      const result = await handleListObjects(mockService, mockRepository, {
        type: "task",
        scope: "F-feature-1",
        status: "in-progress",
        priority: "medium",
        includeClosed: true,
      });

      expect(mockService.listObjects).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        "F-feature-1",
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.MEDIUM,
        true,
      );
      expect(result).toEqual(mockResponse);
    });

    describe("array input handling", () => {
      it("should handle array of types", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: ["project", "epic"],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          [TrellisObjectType.PROJECT, TrellisObjectType.EPIC],
          undefined,
          undefined,
          undefined,
          false,
        );
      });

      it("should handle array of statuses", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: "task",
          status: ["open", "in-progress"],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS],
          undefined,
          false,
        );
      });

      it("should handle array of priorities", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: "task",
          priority: ["high", "medium"],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          undefined,
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
          false,
        );
      });

      it("should handle single element arrays as single values", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: ["task"],
          status: ["open"],
          priority: ["high"],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          TrellisObjectStatus.OPEN,
          TrellisObjectPriority.HIGH,
          false,
        );
      });

      it("should handle mixed single and array parameters", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: "task",
          status: ["open", "in-progress"],
          priority: "high",
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS],
          TrellisObjectPriority.HIGH,
          false,
        );
      });

      it("should handle optional type parameter with other filters", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          status: "open",
          priority: "high",
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          undefined,
          undefined,
          TrellisObjectStatus.OPEN,
          TrellisObjectPriority.HIGH,
          false,
        );
      });

      it("should handle all parameters as arrays", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: ["feature", "task"],
          status: ["open", "in-progress"],
          priority: ["high", "medium"],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          [TrellisObjectType.FEATURE, TrellisObjectType.TASK],
          undefined,
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS],
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
          false,
        );
      });

      it("should return error for invalid type in array", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
          type: ["task", "invalid-type"],
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid type value: invalid-type",
            },
          ],
        });
        expect(mockService.listObjects).not.toHaveBeenCalled();
      });

      it("should return error for invalid status in array", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
          type: "task",
          status: ["open", "invalid-status"],
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid status value: invalid-status",
            },
          ],
        });
        expect(mockService.listObjects).not.toHaveBeenCalled();
      });

      it("should return error for invalid priority in array", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
          type: "task",
          priority: ["high", "invalid-priority"],
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid priority value: invalid-priority",
            },
          ],
        });
        expect(mockService.listObjects).not.toHaveBeenCalled();
      });

      it("should return error for multiple invalid values in array", async () => {
        const result = await handleListObjects(mockService, mockRepository, {
          type: ["task", "invalid-type", "another-invalid"],
        });

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: "Error listing objects: Invalid type values: invalid-type, another-invalid",
            },
          ],
        });
        expect(mockService.listObjects).not.toHaveBeenCalled();
      });

      it("should handle empty arrays as no filter provided", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: [],
          status: "open",
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          undefined,
          undefined,
          TrellisObjectStatus.OPEN,
          undefined,
          false,
        );
      });

      it("should handle empty arrays as no filter provided", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        const result = await handleListObjects(mockService, mockRepository, {
          type: [],
          status: [],
          priority: [],
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        expect(result).toEqual(mockResponse);
      });

      it("should handle empty parameter object with scope filter", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          scope: "P-project-1",
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          undefined,
          "P-project-1",
          undefined,
          undefined,
          false,
        );
      });

      it("should handle no filter parameters and return all objects", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        const result = await handleListObjects(mockService, mockRepository, {});

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          undefined,
          undefined,
          undefined,
          undefined,
          false,
        );
        expect(result).toEqual(mockResponse);
      });

      // Backward compatibility tests
      it("should maintain backward compatibility with single string values", async () => {
        mockService.listObjects.mockResolvedValue(mockResponse);

        await handleListObjects(mockService, mockRepository, {
          type: "task",
          status: "open",
          priority: "high",
        });

        expect(mockService.listObjects).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          TrellisObjectStatus.OPEN,
          TrellisObjectPriority.HIGH,
          false,
        );
      });
    });
  });
});
