import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { validateParentExists } from "../validateParentExists";
import { ValidationError, ValidationErrorCodes } from "../ValidationError";

describe("validateParentExists", () => {
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

  it("should pass validation when no parent is specified", async () => {
    await expect(
      validateParentExists(undefined, mockRepository),
    ).resolves.toBeUndefined();

    expect(mockRepository.getObjectById).not.toHaveBeenCalled();
  });

  it("should pass validation when parent exists", async () => {
    const mockParentObject: TrellisObject = {
      id: "parent-123",
      type: TrellisObjectType.PROJECT,
      title: "Parent Project",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.MEDIUM,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Parent project description",
    };

    mockRepository.getObjectById.mockResolvedValue(mockParentObject);

    await expect(
      validateParentExists("parent-123", mockRepository),
    ).resolves.toBeUndefined();

    expect(mockRepository.getObjectById).toHaveBeenCalledWith("parent-123");
    expect(mockRepository.getObjectById).toHaveBeenCalledTimes(1);
  });

  it("should throw ValidationError when parent does not exist", async () => {
    mockRepository.getObjectById.mockResolvedValue(null);

    await expect(
      validateParentExists("nonexistent-parent", mockRepository),
    ).rejects.toThrow(ValidationError);

    try {
      await validateParentExists("nonexistent-parent", mockRepository);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const validationError = error as ValidationError;
      expect(validationError.message).toBe(
        "Parent object with ID 'nonexistent-parent' does not exist",
      );
      expect(validationError.code).toBe(ValidationErrorCodes.PARENT_NOT_FOUND);
      expect(validationError.field).toBe("parent");
    }

    expect(mockRepository.getObjectById).toHaveBeenCalledWith(
      "nonexistent-parent",
    );
    expect(mockRepository.getObjectById).toHaveBeenCalledTimes(2); // Called twice due to expect and try/catch
  });

  it("should handle empty string as no parent", async () => {
    await expect(
      validateParentExists("", mockRepository),
    ).resolves.toBeUndefined();

    expect(mockRepository.getObjectById).not.toHaveBeenCalled();
  });
});
