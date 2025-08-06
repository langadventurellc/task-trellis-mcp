import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { validateObjectCreation } from "../validateObjectCreation";
import { validateParentExists } from "../validateParentExists";
import { ValidationError } from "../ValidationError";
import { ValidationErrorCodes } from "../ValidationErrorCodes";

// Mock the validateParentExists function to test orchestration
jest.mock("../validateParentExists");
const mockValidateParentExists = validateParentExists as jest.MockedFunction<
  typeof validateParentExists
>;

describe("validateObjectCreation", () => {
  let mockRepository: jest.Mocked<Repository>;
  let testObject: TrellisObject;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    testObject = {
      id: "T-test-123",
      type: TrellisObjectType.TASK,
      title: "Test Task",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "F-parent-123",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Test task description",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    };

    jest.clearAllMocks();
  });

  it("should pass validation when all checks succeed", async () => {
    mockValidateParentExists.mockResolvedValue(undefined);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).resolves.toBeUndefined();

    expect(mockValidateParentExists).toHaveBeenCalledWith(
      "F-parent-123",
      mockRepository,
    );
    expect(mockValidateParentExists).toHaveBeenCalledTimes(1);
  });

  it("should pass validation for object without parent", async () => {
    const objectWithoutParent = { ...testObject, parent: undefined };
    mockValidateParentExists.mockResolvedValue(undefined);

    await expect(
      validateObjectCreation(objectWithoutParent, mockRepository),
    ).resolves.toBeUndefined();

    expect(mockValidateParentExists).toHaveBeenCalledWith(
      undefined,
      mockRepository,
    );
    expect(mockValidateParentExists).toHaveBeenCalledTimes(1);
  });

  it("should throw ValidationError when parent validation fails", async () => {
    const validationError = new ValidationError(
      "Parent object with ID 'F-parent-123' does not exist",
      ValidationErrorCodes.PARENT_NOT_FOUND,
      "parent",
    );
    mockValidateParentExists.mockRejectedValue(validationError);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).rejects.toThrow(ValidationError);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).rejects.toThrow("Parent object with ID 'F-parent-123' does not exist");

    expect(mockValidateParentExists).toHaveBeenCalledWith(
      "F-parent-123",
      mockRepository,
    );
  });

  it("should validate all object types with appropriate parents", async () => {
    mockValidateParentExists.mockResolvedValue(undefined);

    const testCases = [
      {
        type: TrellisObjectType.PROJECT,
        id: "P-project-123",
        parent: undefined,
      },
      {
        type: TrellisObjectType.EPIC,
        id: "E-epic-123",
        parent: "P-project-123",
      },
      {
        type: TrellisObjectType.FEATURE,
        id: "F-feature-123",
        parent: "E-epic-123",
      },
      {
        type: TrellisObjectType.TASK,
        id: "T-task-123",
        parent: "F-feature-123",
      },
    ];

    for (const testCase of testCases) {
      const objectOfType = {
        ...testObject,
        type: testCase.type,
        id: testCase.id,
        parent: testCase.parent,
      };

      await expect(
        validateObjectCreation(objectOfType, mockRepository),
      ).resolves.toBeUndefined();
    }

    expect(mockValidateParentExists).toHaveBeenCalledTimes(testCases.length);
  });
});
