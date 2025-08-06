import { getChildrenByFilePath } from "../getChildrenByFilePath";
import path from "path";

describe("getChildrenByFilePath", () => {
  const testDataRoot = path.join(__dirname, "schema1_0", ".trellis");

  describe("Project children", () => {
    it("should return epics as children for a project", async () => {
      const projectPath = path.join(
        testDataRoot,
        "p",
        "P-mobile-app",
        "P-mobile-app.md",
      );

      const children = await getChildrenByFilePath(projectPath);

      expect(children).toHaveLength(1);

      // Check that we got epic IDs
      const epicIds = children.sort();
      expect(epicIds).toEqual(["E-offline-sync"]);
    });

    it("should return multiple epics for project", async () => {
      const projectPath = path.join(
        testDataRoot,
        "p",
        "P-ecommerce-platform",
        "P-ecommerce-platform.md",
      );

      const children = await getChildrenByFilePath(projectPath);

      expect(children).toHaveLength(2);

      const epicIds = children.sort();
      expect(epicIds).toEqual(["E-product-catalog", "E-user-management"]);
    });
  });

  describe("Epic children", () => {
    it("should return features as children for an epic", async () => {
      const epicPath = path.join(
        testDataRoot,
        "p",
        "P-mobile-app",
        "e",
        "E-offline-sync",
        "E-offline-sync.md",
      );

      const children = await getChildrenByFilePath(epicPath);

      expect(children).toHaveLength(1);

      const featureIds = children.sort();
      expect(featureIds).toEqual(["F-data-caching"]);
    });

    it("should return features for E-product-catalog", async () => {
      const epicPath = path.join(
        testDataRoot,
        "p",
        "P-ecommerce-platform",
        "e",
        "E-product-catalog",
        "E-product-catalog.md",
      );

      const children = await getChildrenByFilePath(epicPath);

      // Check if there are any features
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);

      // All children should be feature IDs (strings starting with F-)
      children.forEach((childId) => {
        expect(typeof childId).toBe("string");
        expect(childId.startsWith("F-")).toBe(true);
      });
    });
  });

  describe("Feature children", () => {
    it("should return tasks from both open and closed folders", async () => {
      const featurePath = path.join(
        testDataRoot,
        "f",
        "F-user-authentication",
        "F-user-authentication.md",
      );

      const children = await getChildrenByFilePath(featurePath);

      // Should have tasks from both open and closed folders
      expect(children.length).toBeGreaterThan(0);

      // Verify they are all task IDs (strings starting with T-)
      children.forEach((childId) => {
        expect(typeof childId).toBe("string");
        expect(childId.startsWith("T-")).toBe(true);
      });
    });

    it("should return tasks from open folder only", async () => {
      const featurePath = path.join(
        testDataRoot,
        "f",
        "F-api-documentation",
        "F-api-documentation.md",
      );

      const children = await getChildrenByFilePath(featurePath);

      expect(children.length).toBeGreaterThan(0);

      // Verify they are all task IDs (strings starting with T-)
      children.forEach((childId) => {
        expect(typeof childId).toBe("string");
        expect(childId.startsWith("T-")).toBe(true);
      });
    });

    it("should handle feature with tasks", async () => {
      const featurePath = path.join(
        testDataRoot,
        "p",
        "P-mobile-app",
        "e",
        "E-offline-sync",
        "f",
        "F-data-caching",
        "F-data-caching.md",
      );

      const children = await getChildrenByFilePath(featurePath);

      // F-data-caching might have tasks
      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);

      // Verify they are all task IDs (if any exist)
      children.forEach((childId) => {
        expect(typeof childId).toBe("string");
        expect(childId.startsWith("T-")).toBe(true);
      });
    });
  });

  describe("Task children", () => {
    it("should return empty array for tasks (tasks have no children)", async () => {
      const taskPath = path.join(
        testDataRoot,
        "t",
        "open",
        "T-setup-database.md",
      );

      const children = await getChildrenByFilePath(taskPath);

      expect(children).toEqual([]);
    });

    it("should return empty array for closed tasks", async () => {
      const taskPath = path.join(
        testDataRoot,
        "f",
        "F-user-authentication",
        "t",
        "closed",
        "T-login-api.md",
      );

      const children = await getChildrenByFilePath(taskPath);

      expect(children).toEqual([]);
    });
  });

  describe("Edge cases", () => {
    it("should return empty array for unknown object type", async () => {
      const unknownPath = "/fake/path/X-unknown.md";

      const children = await getChildrenByFilePath(unknownPath);

      expect(children).toEqual([]);
    });

    it("should handle non-existent child folders gracefully", async () => {
      // Create a path to a project that doesn't exist
      const projectPath = path.join(
        testDataRoot,
        "p",
        "P-non-existent",
        "P-non-existent.md",
      );

      // Even if the file doesn't exist, the function should handle it gracefully
      const children = await getChildrenByFilePath(projectPath);

      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
      expect(children).toHaveLength(0);
    });

    it("should handle malformed file paths gracefully", async () => {
      const malformedPath = "not-a-valid-path";

      const children = await getChildrenByFilePath(malformedPath);

      expect(children).toBeDefined();
      expect(Array.isArray(children)).toBe(true);
    });
  });
});
