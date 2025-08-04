import { TrellisObjectType } from "../../models";
import { inferObjectType } from "../inferObjectType";

describe("inferObjectType", () => {
  it("should return PROJECT for IDs with P- pattern", () => {
    expect(inferObjectType("P-123")).toBe(TrellisObjectType.PROJECT);
    expect(inferObjectType("P-project-name")).toBe(TrellisObjectType.PROJECT);
    expect(inferObjectType("p-lowercase")).toBe(TrellisObjectType.PROJECT);
  });

  it("should return EPIC for IDs with E- pattern", () => {
    expect(inferObjectType("E-456")).toBe(TrellisObjectType.EPIC);
    expect(inferObjectType("E-epic-name")).toBe(TrellisObjectType.EPIC);
    expect(inferObjectType("e-lowercase")).toBe(TrellisObjectType.EPIC);
  });

  it("should return FEATURE for IDs with F- pattern", () => {
    expect(inferObjectType("F-789")).toBe(TrellisObjectType.FEATURE);
    expect(inferObjectType("F-feature-name")).toBe(TrellisObjectType.FEATURE);
    expect(inferObjectType("f-lowercase")).toBe(TrellisObjectType.FEATURE);
  });

  it("should return TASK for IDs with T- pattern", () => {
    expect(inferObjectType("T-101")).toBe(TrellisObjectType.TASK);
    expect(inferObjectType("T-task-name")).toBe(TrellisObjectType.TASK);
    expect(inferObjectType("t-lowercase")).toBe(TrellisObjectType.TASK);
  });

  it("should throw an error for invalid letter prefixes", () => {
    expect(() => inferObjectType("X-123")).toThrow(
      "Invalid ID format: 'X-123'. ID must follow pattern X- where X is P, E, F, or T",
    );
    expect(() => inferObjectType("Z-invalid")).toThrow(
      "Invalid ID format: 'Z-invalid'. ID must follow pattern X- where X is P, E, F, or T",
    );
  });

  it("should throw an error for IDs without proper hyphen pattern", () => {
    expect(() => inferObjectType("PROJECT-ABC")).toThrow(
      "Invalid ID format: 'PROJECT-ABC'. ID must follow pattern X- where X is P, E, F, or T",
    );
    expect(() => inferObjectType("EPIC-XYZ")).toThrow(
      "Invalid ID format: 'EPIC-XYZ'. ID must follow pattern X- where X is P, E, F, or T",
    );
    expect(() => inferObjectType("P123")).toThrow(
      "Invalid ID format: 'P123'. ID must follow pattern X- where X is P, E, F, or T",
    );
    expect(() => inferObjectType("123-ABC")).toThrow(
      "Invalid ID format: '123-ABC'. ID must follow pattern X- where X is P, E, F, or T",
    );
  });

  it("should throw an error for empty IDs", () => {
    expect(() => inferObjectType("")).toThrow("ID cannot be empty");
  });

  it("should throw an error for single character IDs", () => {
    expect(() => inferObjectType("P")).toThrow(
      "Invalid ID format: 'P'. ID must follow pattern X- where X is P, E, F, or T",
    );
  });
});
