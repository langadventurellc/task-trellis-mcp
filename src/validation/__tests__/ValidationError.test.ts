import { ValidationError, ValidationErrorCodes } from "../ValidationError";

describe("ValidationError", () => {
  it("should create error with message and code", () => {
    const error = new ValidationError(
      "Test error message",
      ValidationErrorCodes.PARENT_NOT_FOUND,
    );

    expect(error.message).toBe("Test error message");
    expect(error.code).toBe(ValidationErrorCodes.PARENT_NOT_FOUND);
    expect(error.name).toBe("ValidationError");
    expect(error.field).toBeUndefined();
  });

  it("should create error with message, code, and field", () => {
    const error = new ValidationError(
      "Parent validation failed",
      ValidationErrorCodes.PARENT_NOT_FOUND,
      "parent",
    );

    expect(error.message).toBe("Parent validation failed");
    expect(error.code).toBe(ValidationErrorCodes.PARENT_NOT_FOUND);
    expect(error.name).toBe("ValidationError");
    expect(error.field).toBe("parent");
  });

  it("should be instance of Error", () => {
    const error = new ValidationError(
      "Test error",
      ValidationErrorCodes.INVALID_PARENT_TYPE,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ValidationError);
  });
});

describe("ValidationErrorCodes", () => {
  it("should contain expected error codes", () => {
    expect(ValidationErrorCodes.PARENT_NOT_FOUND).toBe("PARENT_NOT_FOUND");
    expect(ValidationErrorCodes.INVALID_PARENT_TYPE).toBe(
      "INVALID_PARENT_TYPE",
    );
  });
});
