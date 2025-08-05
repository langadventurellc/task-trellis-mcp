import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { validateObjectCreation } from "../validateObjectCreation";
import { ValidationError, ValidationErrorCodes } from "../ValidationError";

// Mock the validateParentExists function to test orchestration
jest.mock("../validateParentExists");
import { validateParentExists } from "../validateParentExists";
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
      id: "test-123",
      type: TrellisObjectType.TASK,
      title: "Test Task",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "parent-123",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Test task description",
    };

    jest.clearAllMocks();
  });

  it("should pass validation when all checks succeed", async () => {
    mockValidateParentExists.mockResolvedValue(undefined);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).resolves.toBeUndefined();

    expect(mockValidateParentExists).toHaveBeenCalledWith(
      "parent-123",
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
      "Parent object with ID 'parent-123' does not exist",
      ValidationErrorCodes.PARENT_NOT_FOUND,
      "parent",
    );
    mockValidateParentExists.mockRejectedValue(validationError);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).rejects.toThrow(ValidationError);

    await expect(
      validateObjectCreation(testObject, mockRepository),
    ).rejects.toThrow("Parent object with ID 'parent-123' does not exist");

    expect(mockValidateParentExists).toHaveBeenCalledWith(
      "parent-123",
      mockRepository,
    );
  });

  it("should validate all object types", async () => {
    mockValidateParentExists.mockResolvedValue(undefined);

    const objectTypes = [
      TrellisObjectType.PROJECT,
      TrellisObjectType.EPIC,
      TrellisObjectType.FEATURE,
      TrellisObjectType.TASK,
    ];

    for (const type of objectTypes) {
      const objectOfType = { ...testObject, type };

      await expect(
        validateObjectCreation(objectOfType, mockRepository),
      ).resolves.toBeUndefined();
    }

    expect(mockValidateParentExists).toHaveBeenCalledTimes(objectTypes.length);
  });
});
