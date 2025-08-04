import { inferObjectType } from "../inferObjectType";
import { TrellisObjectType } from "../TrellisObjectType";

describe("inferObjectType", () => {
  it("should return PROJECT for IDs starting with P", () => {
    expect(inferObjectType("P-123")).toBe(TrellisObjectType.PROJECT);
    expect(inferObjectType("PROJECT-ABC")).toBe(TrellisObjectType.PROJECT);
    expect(inferObjectType("p-lowercase")).toBe(TrellisObjectType.PROJECT);
  });

  it("should return EPIC for IDs starting with E", () => {
    expect(inferObjectType("E-456")).toBe(TrellisObjectType.EPIC);
    expect(inferObjectType("EPIC-XYZ")).toBe(TrellisObjectType.EPIC);
    expect(inferObjectType("e-lowercase")).toBe(TrellisObjectType.EPIC);
  });

  it("should return FEATURE for IDs starting with F", () => {
    expect(inferObjectType("F-789")).toBe(TrellisObjectType.FEATURE);
    expect(inferObjectType("FEATURE-DEF")).toBe(TrellisObjectType.FEATURE);
    expect(inferObjectType("f-lowercase")).toBe(TrellisObjectType.FEATURE);
  });

  it("should return TASK for IDs starting with T", () => {
    expect(inferObjectType("T-101")).toBe(TrellisObjectType.TASK);
    expect(inferObjectType("TASK-GHI")).toBe(TrellisObjectType.TASK);
    expect(inferObjectType("t-lowercase")).toBe(TrellisObjectType.TASK);
  });

  it("should throw an error for invalid ID formats", () => {
    expect(() => inferObjectType("X-123")).toThrow(
      "Invalid ID format: 'X-123'. ID must start with P, E, F, or T",
    );
    expect(() => inferObjectType("123-ABC")).toThrow(
      "Invalid ID format: '123-ABC'. ID must start with P, E, F, or T",
    );
    expect(() => inferObjectType("Z-invalid")).toThrow(
      "Invalid ID format: 'Z-invalid'. ID must start with P, E, F, or T",
    );
  });

  it("should throw an error for empty IDs", () => {
    expect(() => inferObjectType("")).toThrow("ID cannot be empty");
  });
});
