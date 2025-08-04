import { join } from "path";
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

    expect(result).toBeDefined();
    expect(result.id).toBe("P-ecommerce-platform");
    expect(result.type).toBe(TrellisObjectType.PROJECT);
    expect(result.title).toBe("E-commerce Platform");
    expect(result.status).toBe(TrellisObjectStatus.IN_PROGRESS);
    expect(result.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result.body).toContain("# E-commerce Platform");
  });

  it("should find and return a Task object by ID", async () => {
    const result = await getObjectById("T-setup-database", testPlanningRoot);

    expect(result).toBeDefined();
    expect(result.id).toBe("T-setup-database");
    expect(result.type).toBe(TrellisObjectType.TASK);
    expect(result.title).toBe("Setup Database Connection");
    expect(result.status).toBe(TrellisObjectStatus.OPEN);
    expect(result.priority).toBe(TrellisObjectPriority.HIGH);
    expect(result.body).toContain("# Setup Database Connection");
  });

  it("should find and return a Feature object by ID", async () => {
    const result = await getObjectById(
      "F-user-authentication",
      testPlanningRoot,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe("F-user-authentication");
    expect(result.type).toBe(TrellisObjectType.FEATURE);
    expect(result.title).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.priority).toBeDefined();
  });

  it("should throw an error when object ID is not found", async () => {
    await expect(
      getObjectById("non-existent-id", testPlanningRoot),
    ).rejects.toThrow("No object found with ID: non-existent-id");
  });

  it("should throw an error when planning root does not exist", async () => {
    await expect(
      getObjectById("T-setup-database", "/non/existent/path"),
    ).rejects.toThrow();
  });
});
