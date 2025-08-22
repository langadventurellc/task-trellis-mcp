import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleCreateObject } from "../createObjectTool";

describe("createObjectTool", () => {
  let mockService: jest.Mocked<TaskTrellisService>;
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockService = {
      createObject: jest.fn(),
    } as unknown as jest.Mocked<TaskTrellisService>;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("handleCreateObject", () => {
    const mockResult = {
      content: [
        {
          type: "text",
          text: "Created object with ID: T-generated-id",
        },
      ],
    };

    beforeEach(() => {
      mockService.createObject.mockResolvedValue(mockResult);
    });

    it("should delegate to service.createObject with minimal required parameters", async () => {
      const args = {
        type: "task",
        title: "Test Task",
      };

      const result = await handleCreateObject(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.createObject).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        "Test Task",
        undefined,
        TrellisObjectPriority.MEDIUM,
        TrellisObjectStatus.OPEN,
        [],
        "",
      );
      expect(result).toEqual(mockResult);
    });

    it("should delegate to service.createObject with all parameters specified", async () => {
      const args = {
        type: "project",
        title: "New Project",
        parent: "P-parent",
        priority: "high",
        status: "in-progress",
        prerequisites: ["P-dependency1", "P-dependency2"],
        description: "This is a new project description",
      };

      const result = await handleCreateObject(
        mockService,
        mockRepository,
        args,
      );

      expect(mockService.createObject).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.PROJECT,
        "New Project",
        "P-parent",
        TrellisObjectPriority.HIGH,
        TrellisObjectStatus.IN_PROGRESS,
        ["P-dependency1", "P-dependency2"],
        "This is a new project description",
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle default values correctly", async () => {
      const args = {
        type: "epic",
        title: "Epic Title",
        parent: "P-project",
      };

      await handleCreateObject(mockService, mockRepository, args);

      expect(mockService.createObject).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.EPIC,
        "Epic Title",
        "P-project",
        TrellisObjectPriority.MEDIUM,
        TrellisObjectStatus.OPEN,
        [],
        "",
      );
    });

    it("should convert all object types correctly", async () => {
      const testCases = [
        { type: "project", expectedType: TrellisObjectType.PROJECT },
        { type: "epic", expectedType: TrellisObjectType.EPIC },
        { type: "feature", expectedType: TrellisObjectType.FEATURE },
        { type: "task", expectedType: TrellisObjectType.TASK },
      ];

      for (const testCase of testCases) {
        mockService.createObject.mockClear();

        const args = {
          type: testCase.type,
          title: `Test ${testCase.type}`,
        };

        await handleCreateObject(mockService, mockRepository, args);

        expect(mockService.createObject).toHaveBeenCalledWith(
          mockRepository,
          testCase.expectedType,
          `Test ${testCase.type}`,
          undefined,
          TrellisObjectPriority.MEDIUM,
          TrellisObjectStatus.OPEN,
          [],
          "",
        );
      }
    });

    it("should convert all status types correctly", async () => {
      const testCases = [
        { status: "draft", expectedStatus: TrellisObjectStatus.DRAFT },
        { status: "open", expectedStatus: TrellisObjectStatus.OPEN },
        {
          status: "in-progress",
          expectedStatus: TrellisObjectStatus.IN_PROGRESS,
        },
        { status: "done", expectedStatus: TrellisObjectStatus.DONE },
        { status: "wont-do", expectedStatus: TrellisObjectStatus.WONT_DO },
      ];

      for (const testCase of testCases) {
        mockService.createObject.mockClear();

        const args = {
          type: "task",
          title: "Status Test",
          status: testCase.status,
        };

        await handleCreateObject(mockService, mockRepository, args);

        expect(mockService.createObject).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          "Status Test",
          undefined,
          TrellisObjectPriority.MEDIUM,
          testCase.expectedStatus,
          [],
          "",
        );
      }
    });

    it("should convert all priority types correctly", async () => {
      const testCases = [
        { priority: "high", expectedPriority: TrellisObjectPriority.HIGH },
        { priority: "medium", expectedPriority: TrellisObjectPriority.MEDIUM },
        { priority: "low", expectedPriority: TrellisObjectPriority.LOW },
      ];

      for (const testCase of testCases) {
        mockService.createObject.mockClear();

        const args = {
          type: "task",
          title: "Priority Test",
          priority: testCase.priority,
        };

        await handleCreateObject(mockService, mockRepository, args);

        expect(mockService.createObject).toHaveBeenCalledWith(
          mockRepository,
          TrellisObjectType.TASK,
          "Priority Test",
          undefined,
          testCase.expectedPriority,
          TrellisObjectStatus.OPEN,
          [],
          "",
        );
      }
    });

    it("should handle prerequisites array", async () => {
      const args = {
        type: "task",
        title: "Task with Prerequisites",
        prerequisites: ["T-setup", "T-config", "F-auth"],
      };

      await handleCreateObject(mockService, mockRepository, args);

      expect(mockService.createObject).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        "Task with Prerequisites",
        undefined,
        TrellisObjectPriority.MEDIUM,
        TrellisObjectStatus.OPEN,
        ["T-setup", "T-config", "F-auth"],
        "",
      );
    });

    it("should propagate service errors", async () => {
      const errorMessage = "Service error occurred";
      mockService.createObject.mockRejectedValue(new Error(errorMessage));

      const args = {
        type: "task",
        title: "Test Task",
      };

      await expect(
        handleCreateObject(mockService, mockRepository, args),
      ).rejects.toThrow(errorMessage);

      expect(mockService.createObject).toHaveBeenCalledWith(
        mockRepository,
        TrellisObjectType.TASK,
        "Test Task",
        undefined,
        TrellisObjectPriority.MEDIUM,
        TrellisObjectStatus.OPEN,
        [],
        "",
      );
    });
  });
});
