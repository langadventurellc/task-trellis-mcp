import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import { generateUniqueId } from "../../../utils/generateUniqueId";
import { validateObjectCreation } from "../../../validation/validateObjectCreation";
import { createObject } from "../createObject";

// Mock the dependencies
jest.mock("../../../utils/generateUniqueId");
jest.mock("../../../validation/validateObjectCreation");

const mockGenerateUniqueId = generateUniqueId as jest.MockedFunction<
  typeof generateUniqueId
>;
const mockValidateObjectCreation =
  validateObjectCreation as jest.MockedFunction<typeof validateObjectCreation>;

describe("createObject", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    jest.clearAllMocks();
  });

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
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
      parent: null,
    },
  ];

  beforeEach(() => {
    mockRepository.getObjects.mockResolvedValue(existingObjects);
    mockGenerateUniqueId.mockReturnValue("T-generated-id");
    mockValidateObjectCreation.mockResolvedValue();
  });

  it("should create a task with minimal required parameters", async () => {
    const result = await createObject(
      mockRepository,
      TrellisObjectType.TASK,
      "Test Task",
    );

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
    expect(mockGenerateUniqueId).toHaveBeenCalledWith(
      "Test Task",
      TrellisObjectType.TASK,
      ["P-existing-project"],
    );
    expect(mockValidateObjectCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "T-generated-id",
        type: TrellisObjectType.TASK,
        title: "Test Task",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        parent: null,
        prerequisites: [],
        body: "",
      }),
      mockRepository,
    );
    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "T-generated-id",
        type: TrellisObjectType.TASK,
        title: "Test Task",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.MEDIUM,
        parent: null,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "",
        created: expect.any(String),
        updated: expect.any(String),
      }),
    );
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

    const result = await createObject(
      mockRepository,
      TrellisObjectType.PROJECT,
      "New Project",
      undefined,
      TrellisObjectPriority.HIGH,
      TrellisObjectStatus.IN_PROGRESS,
      ["P-dependency1", "P-dependency2"],
      "This is a new project description",
    );

    expect(mockGenerateUniqueId).toHaveBeenCalledWith(
      "New Project",
      TrellisObjectType.PROJECT,
      ["P-existing-project"],
    );
    expect(mockValidateObjectCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "P-new-project",
        type: TrellisObjectType.PROJECT,
        title: "New Project",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        parent: null,
        prerequisites: ["P-dependency1", "P-dependency2"],
        body: "This is a new project description",
      }),
      mockRepository,
    );
    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "P-new-project",
        type: TrellisObjectType.PROJECT,
        title: "New Project",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        parent: null,
        prerequisites: ["P-dependency1", "P-dependency2"],
        body: "This is a new project description",
      }),
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Created object with ID: P-new-project",
        },
      ],
    });
  });

  it("should create an epic with parent", async () => {
    mockGenerateUniqueId.mockReturnValue("E-epic-id");

    const result = await createObject(
      mockRepository,
      TrellisObjectType.EPIC,
      "Epic Title",
      "P-project",
    );

    expect(mockValidateObjectCreation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "E-epic-id",
        type: TrellisObjectType.EPIC,
        title: "Epic Title",
        parent: "P-project",
      }),
      mockRepository,
    );
    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "E-epic-id",
        type: TrellisObjectType.EPIC,
        title: "Epic Title",
        parent: "P-project",
      }),
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Created object with ID: E-epic-id",
        },
      ],
    });
  });

  it("should create a feature with custom priority and status", async () => {
    mockGenerateUniqueId.mockReturnValue("F-feature-id");

    const result = await createObject(
      mockRepository,
      TrellisObjectType.FEATURE,
      "Feature Title",
      undefined,
      TrellisObjectPriority.LOW,
      TrellisObjectStatus.DRAFT,
      [],
      "Feature description",
    );

    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "F-feature-id",
        type: TrellisObjectType.FEATURE,
        title: "Feature Title",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.LOW,
        body: "Feature description",
      }),
    );
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

    const result = await createObject(
      mockRepository,
      TrellisObjectType.TASK,
      "Task with Prerequisites",
      undefined,
      TrellisObjectPriority.MEDIUM,
      TrellisObjectStatus.OPEN,
      ["T-setup", "T-config", "F-auth"],
    );

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
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
        parent: null,
      },
      {
        id: "F-feature-1",
        type: TrellisObjectType.FEATURE,
        title: "Feature 1",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: "",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
        parent: null,
      },
    ];

    mockRepository.getObjects.mockResolvedValue(multipleExistingObjects);
    mockGenerateUniqueId.mockReturnValue("P-unique-project");

    await createObject(
      mockRepository,
      TrellisObjectType.PROJECT,
      "Unique Project",
    );

    expect(mockGenerateUniqueId).toHaveBeenCalledWith(
      "Unique Project",
      TrellisObjectType.PROJECT,
      ["T-task-1", "F-feature-1"],
    );
  });

  it("should handle repository getObjects error gracefully", async () => {
    const errorMessage = "Failed to fetch existing objects";
    mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

    await expect(
      createObject(mockRepository, TrellisObjectType.TASK, "Test Task"),
    ).rejects.toThrow(errorMessage);

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
    expect(mockRepository.saveObject).not.toHaveBeenCalled();
  });

  it("should handle validation error gracefully", async () => {
    const errorMessage = "Validation failed";
    mockValidateObjectCreation.mockRejectedValue(new Error(errorMessage));

    await expect(
      createObject(mockRepository, TrellisObjectType.TASK, "Test Task"),
    ).rejects.toThrow(errorMessage);

    expect(mockValidateObjectCreation).toHaveBeenCalled();
    expect(mockRepository.saveObject).not.toHaveBeenCalled();
  });

  it("should handle repository saveObject error gracefully", async () => {
    const errorMessage = "Failed to save object";
    mockRepository.saveObject.mockRejectedValue(new Error(errorMessage));

    await expect(
      createObject(mockRepository, TrellisObjectType.TASK, "Test Task"),
    ).rejects.toThrow(errorMessage);

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true);
    expect(mockValidateObjectCreation).toHaveBeenCalled();
    expect(mockRepository.saveObject).toHaveBeenCalled();
  });

  it("should handle empty existing objects array", async () => {
    mockRepository.getObjects.mockResolvedValue([]);
    mockGenerateUniqueId.mockReturnValue("T-first-task");

    const result = await createObject(
      mockRepository,
      TrellisObjectType.TASK,
      "First Task",
    );

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
      {
        type: TrellisObjectType.PROJECT,
        expectedId: "P-project",
      },
      {
        type: TrellisObjectType.EPIC,
        expectedId: "E-epic",
      },
      {
        type: TrellisObjectType.FEATURE,
        expectedId: "F-feature",
      },
      {
        type: TrellisObjectType.TASK,
        expectedId: "T-task",
      },
    ];

    for (const testCase of testCases) {
      mockRepository.saveObject.mockClear();
      mockGenerateUniqueId.mockReturnValue(testCase.expectedId);

      await createObject(
        mockRepository,
        testCase.type,
        `Test ${testCase.type}`,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          type: testCase.type,
        }),
      );
    }
  });

  it("should handle all status types correctly", async () => {
    const testCases = [
      TrellisObjectStatus.DRAFT,
      TrellisObjectStatus.OPEN,
      TrellisObjectStatus.IN_PROGRESS,
      TrellisObjectStatus.DONE,
      TrellisObjectStatus.WONT_DO,
    ];

    for (const status of testCases) {
      mockRepository.saveObject.mockClear();
      mockGenerateUniqueId.mockReturnValue(`T-status-test`);

      await createObject(
        mockRepository,
        TrellisObjectType.TASK,
        "Status Test",
        undefined,
        TrellisObjectPriority.MEDIUM,
        status,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          status: status,
        }),
      );
    }
  });

  it("should handle all priority types correctly", async () => {
    const testCases = [
      TrellisObjectPriority.HIGH,
      TrellisObjectPriority.MEDIUM,
      TrellisObjectPriority.LOW,
    ];

    for (const priority of testCases) {
      mockRepository.saveObject.mockClear();
      mockGenerateUniqueId.mockReturnValue(`T-priority-test`);

      await createObject(
        mockRepository,
        TrellisObjectType.TASK,
        "Priority Test",
        undefined,
        priority,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: priority,
        }),
      );
    }
  });

  it("should create objects with correct timestamps", async () => {
    // Mock Date.now to control timestamp
    const mockDate = "2025-01-15T12:30:45.123Z";
    jest.spyOn(Date.prototype, "toISOString").mockReturnValue(mockDate);

    await createObject(mockRepository, TrellisObjectType.TASK, "Test Task");

    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        created: mockDate,
        updated: mockDate,
      }),
    );

    // Restore original Date implementation
    jest.restoreAllMocks();
  });

  it("should create objects with correct default structure", async () => {
    await createObject(mockRepository, TrellisObjectType.TASK, "Test Task");

    expect(mockRepository.saveObject).toHaveBeenCalledWith(
      expect.objectContaining({
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
      }),
    );
  });
});
