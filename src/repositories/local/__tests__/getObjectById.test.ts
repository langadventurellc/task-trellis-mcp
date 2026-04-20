jest.mock("fs/promises", () => {
  const actual =
    jest.requireActual<typeof import("fs/promises")>("fs/promises");
  return { ...actual, readFile: jest.fn(actual.readFile) };
});

import { join } from "path";
import { readFile } from "fs/promises";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { getObjectById } from "../getObjectById";

describe("getObjectById", () => {
  const testPlanningRoot = join(__dirname, "schema1_0", ".trellis");

  it("should find and return a Project object by ID", async () => {
    const result = await getObjectById(
      "P-ecommerce-platform",
      testPlanningRoot,
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe("P-ecommerce-platform");
    expect(result!.type).toBe(TrellisObjectType.PROJECT);
    expect(result!.title).toBe("E-commerce Platform");
    expect(result!.status).toBe(TrellisObjectStatus.IN_PROGRESS);
    expect(result!.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result!.body).toContain("# E-commerce Platform");
    expect(result!.childrenIds).toEqual(
      expect.arrayContaining(["E-product-catalog", "E-user-management"]),
    );
  });

  it("should find and return a Task object by ID", async () => {
    const result = await getObjectById("T-setup-database", testPlanningRoot);

    expect(result).not.toBeNull();
    expect(result!.id).toBe("T-setup-database");
    expect(result!.type).toBe(TrellisObjectType.TASK);
    expect(result!.title).toBe("Setup Database Connection");
    expect(result!.status).toBe(TrellisObjectStatus.OPEN);
    expect(result!.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result!.body).toContain("# Setup Database Connection");
  });

  it("should find and return a Feature object by ID", async () => {
    const result = await getObjectById(
      "F-user-authentication",
      testPlanningRoot,
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe("F-user-authentication");
    expect(result!.type).toBe(TrellisObjectType.FEATURE);
    expect(result!.title).toBeDefined();
    expect(result!.status).toBeDefined();
    expect(result!.priority).toBeDefined();
    expect(result!.childrenIds).toEqual(
      expect.arrayContaining(["T-implement-login", "T-setup-auth-models"]),
    );
  });

  it("should return null when object ID is not found", async () => {
    const result = await getObjectById("non-existent-id", testPlanningRoot);
    expect(result).toBeNull();
  });

  it("should return null when planning root does not exist", async () => {
    const result = await getObjectById(
      "T-setup-database",
      "/non/existent/path",
    );
    expect(result).toBeNull();
  });

  it("should not read child files when fetching a parent with children", async () => {
    const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
    mockReadFile.mockClear();

    await getObjectById("P-ecommerce-platform", testPlanningRoot);

    const readPaths = mockReadFile.mock.calls.map((c) => c[0] as string);
    expect(readPaths.some((p) => p.includes("E-product-catalog"))).toBe(false);
    expect(readPaths.some((p) => p.includes("E-user-management"))).toBe(false);
  });
});
