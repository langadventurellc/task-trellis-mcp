import { ValidationError } from "../ValidationError";
import { ValidationErrorCodes } from "../ValidationErrorCodes";
import { validateLabels } from "../validateLabels";

describe("validateLabels", () => {
  it("passes for empty array", () => {
    expect(() => validateLabels([])).not.toThrow();
  });

  it("passes for single short label", () => {
    expect(() => validateLabels(["bug"])).not.toThrow();
  });

  it("passes for multiple short labels", () => {
    expect(() => validateLabels(["bug", "auth", "p0"])).not.toThrow();
  });

  it("passes for a label of exactly 100 characters", () => {
    expect(() => validateLabels(["a".repeat(100)])).not.toThrow();
  });

  it("throws for a label of 101 characters", () => {
    try {
      validateLabels(["a".repeat(101)]);
      fail("expected ValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const ve = error as ValidationError;
      expect(ve.code).toBe(ValidationErrorCodes.LABEL_TOO_LONG);
      expect(ve.field).toBe("labels");
    }
  });

  it("throws for a mixed array with one invalid label and reports its index", () => {
    try {
      validateLabels(["ok", "a".repeat(101), "ok2"]);
      fail("expected ValidationError");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const ve = error as ValidationError;
      expect(ve.code).toBe(ValidationErrorCodes.LABEL_TOO_LONG);
      expect(ve.field).toBe("labels");
      expect(ve.message).toMatch(/index 1/);
    }
  });
});
