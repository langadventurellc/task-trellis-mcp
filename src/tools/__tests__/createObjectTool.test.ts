import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { handleCreateObject } from "../createObjectTool";
import { generateUniqueId } from "../../utils/generateUniqueId";

// Mock the generateUniqueId utility
jest.mock("../../utils/generateUniqueId");
const mockGenerateUniqueId = generateUniqueId as jest.MockedFunction<
  typeof generateUniqueId
>;

describe("createObjectTool", () => {
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

  describe("handleCreateObject", () => {
    const existingObjects: TrellisObject[] = [
      {
        id: "P-existing-project",
        type: TrellisObjectType.PROJECT,
        title: "Existing Project",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "Existing project body",
      },
    ];

    beforeEach(() => {
      mockRepository.getObjects.mockResolvedValue(existingObjects);
      mockGenerateUniqueId.mockReturnValue("T-generated-id");
    });

    it("should create a task with minimal required parameters", async () => {
      const args = {
        kind: "task",
        title: "Test Task",
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
      expect(mockGenerateUniqueId).toHaveBeenCalledWith(
        "Test Task",
        TrellisObjectType.TASK,
        ["P-existing-project"],
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        id: "T-generated-id",
        type: TrellisObjectType.TASK,
        title: "Test Task",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.MEDIUM,
        parent: undefined,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "",
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: T-generated-id",
          },
        ],
      });
    });

    it("should create a project with all parameters specified", async () => {
      mockGenerateUniqueId.mockReturnValue("P-new-project");

      const args = {
        kind: "project",
        title: "New Project",
        parent: "P-parent-project",
        priority: "high",
        status: "open",
        prerequisites: ["P-dependency1", "P-dependency2"],
        description: "This is a new project description",
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockGenerateUniqueId).toHaveBeenCalledWith(
        "New Project",
        TrellisObjectType.PROJECT,
        ["P-existing-project"],
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        id: "P-new-project",
        type: TrellisObjectType.PROJECT,
        title: "New Project",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        parent: "P-parent-project",
        prerequisites: ["P-dependency1", "P-dependency2"],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "This is a new project description",
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: P-new-project",
          },
        ],
      });
    });

    it("should create an epic with default values", async () => {
      mockGenerateUniqueId.mockReturnValue("E-epic-id");

      const args = {
        kind: "epic",
        title: "Epic Title",
        parent: "P-project",
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        id: "E-epic-id",
        type: TrellisObjectType.EPIC,
        title: "Epic Title",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.MEDIUM,
        parent: "P-project",
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "",
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: E-epic-id",
          },
        ],
      });
    });

    it("should create a feature with low priority", async () => {
      mockGenerateUniqueId.mockReturnValue("F-feature-id");

      const args = {
        kind: "feature",
        title: "Feature Title",
        priority: "low",
        status: "in-progress",
        description: "Feature description",
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        id: "F-feature-id",
        type: TrellisObjectType.FEATURE,
        title: "Feature Title",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.LOW,
        parent: undefined,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "Feature description",
      });
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: F-feature-id",
          },
        ],
      });
    });

    it("should handle objects with prerequisites", async () => {
      mockGenerateUniqueId.mockReturnValue("T-task-with-prereqs");

      const args = {
        kind: "task",
        title: "Task with Prerequisites",
        prerequisites: ["T-setup", "T-config", "F-auth"],
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          prerequisites: ["T-setup", "T-config", "F-auth"],
        }),
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: T-task-with-prereqs",
          },
        ],
      });
    });

    it("should pass existing IDs to generateUniqueId for uniqueness checking", async () => {
      const multipleExistingObjects: TrellisObject[] = [
        {
          id: "T-task-1",
          type: TrellisObjectType.TASK,
          title: "Task 1",
          status: TrellisObjectStatus.OPEN,
          priority: TrellisObjectPriority.MEDIUM,
          prerequisites: [],
          affectedFiles: new Map(),
          log: [],
          schema: "v1.0",
          childrenIds: [],
          body: "",
        },
        {
          id: "F-feature-1",
          type: TrellisObjectType.FEATURE,
          title: "Feature 1",
          status: TrellisObjectStatus.DRAFT,
          priority: TrellisObjectPriority.HIGH,
          prerequisites: [],
          affectedFiles: new Map(),
          log: [],
          schema: "v1.0",
          childrenIds: [],
          body: "",
        },
      ];

      mockRepository.getObjects.mockResolvedValue(multipleExistingObjects);
      mockGenerateUniqueId.mockReturnValue("P-unique-project");

      const args = {
        kind: "project",
        title: "Unique Project",
      };

      await handleCreateObject(mockRepository, args);

      expect(mockGenerateUniqueId).toHaveBeenCalledWith(
        "Unique Project",
        TrellisObjectType.PROJECT,
        ["T-task-1", "F-feature-1"],
      );
    });

    it("should handle repository getObjects error gracefully", async () => {
      const errorMessage = "Failed to fetch existing objects";
      mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

      const args = {
        kind: "task",
        title: "Test Task",
      };

      await expect(handleCreateObject(mockRepository, args)).rejects.toThrow(
        errorMessage,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should handle repository saveObject error gracefully", async () => {
      const errorMessage = "Failed to save object";
      mockRepository.saveObject.mockRejectedValue(new Error(errorMessage));

      const args = {
        kind: "task",
        title: "Test Task",
      };

      await expect(handleCreateObject(mockRepository, args)).rejects.toThrow(
        errorMessage,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
      expect(mockRepository.saveObject).toHaveBeenCalled();
    });

    it("should handle empty existing objects array", async () => {
      mockRepository.getObjects.mockResolvedValue([]);
      mockGenerateUniqueId.mockReturnValue("T-first-task");

      const args = {
        kind: "task",
        title: "First Task",
      };

      const result = await handleCreateObject(mockRepository, args);

      expect(mockGenerateUniqueId).toHaveBeenCalledWith(
        "First Task",
        TrellisObjectType.TASK,
        [],
      );
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Created object with ID: T-first-task",
          },
        ],
      });
    });

    it("should handle all object types correctly", async () => {
      const testCases = [
        { kind: "project", expectedType: TrellisObjectType.PROJECT },
        { kind: "epic", expectedType: TrellisObjectType.EPIC },
        { kind: "feature", expectedType: TrellisObjectType.FEATURE },
        { kind: "task", expectedType: TrellisObjectType.TASK },
      ];

      for (const testCase of testCases) {
        mockRepository.saveObject.mockClear();
        mockGenerateUniqueId.mockReturnValue(`ID-${testCase.kind}`);

        const args = {
          kind: testCase.kind,
          title: `Test ${testCase.kind}`,
        };

        await handleCreateObject(mockRepository, args);

        expect(mockRepository.saveObject).toHaveBeenCalledWith(
          expect.objectContaining({
            type: testCase.expectedType,
          }),
        );
      }
    });

    it("should handle all status types correctly", async () => {
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
        mockRepository.saveObject.mockClear();
        mockGenerateUniqueId.mockReturnValue(`T-status-test`);

        const args = {
          kind: "task",
          title: "Status Test",
          status: testCase.status,
        };

        await handleCreateObject(mockRepository, args);

        expect(mockRepository.saveObject).toHaveBeenCalledWith(
          expect.objectContaining({
            status: testCase.expectedStatus,
          }),
        );
      }
    });

    it("should handle all priority types correctly", async () => {
      const testCases = [
        { priority: "high", expectedPriority: TrellisObjectPriority.HIGH },
        { priority: "medium", expectedPriority: TrellisObjectPriority.MEDIUM },
        { priority: "low", expectedPriority: TrellisObjectPriority.LOW },
      ];

      for (const testCase of testCases) {
        mockRepository.saveObject.mockClear();
        mockGenerateUniqueId.mockReturnValue(`T-priority-test`);

        const args = {
          kind: "task",
          title: "Priority Test",
          priority: testCase.priority,
        };

        await handleCreateObject(mockRepository, args);

        expect(mockRepository.saveObject).toHaveBeenCalledWith(
          expect.objectContaining({
            priority: testCase.expectedPriority,
          }),
        );
      }
    });
  });
});
