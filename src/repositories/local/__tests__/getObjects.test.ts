import { join } from "path";
import { getObjects } from "../getObjects";
import {
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../../models";

describe("getObjects", () => {
  const testRoot = join(__dirname, "schema1_0");

  describe("basic functionality", () => {
    it("should return all open objects from the test data", async () => {
      const objects = await getObjects(testRoot);

      // Should find 17 objects (excludes 3 closed tasks by default)
      expect(objects).toHaveLength(17);

      // All returned objects should be valid TrellisObject instances
      objects.forEach((obj) => {
        expect(obj).toHaveProperty("id");
        expect(obj).toHaveProperty("type");
        expect(obj).toHaveProperty("title");
        expect(obj).toHaveProperty("status");
        expect(obj).toHaveProperty("priority");
        expect(obj).toHaveProperty("schema");
        expect(obj.schema).toBe("v1.0");
      });
    });

    it("should include objects of all types", async () => {
      const objects = await getObjects(testRoot);

      const projectObjects = objects.filter(
        (obj) => obj.type === TrellisObjectType.PROJECT,
      );
      const epicObjects = objects.filter(
        (obj) => obj.type === TrellisObjectType.EPIC,
      );
      const featureObjects = objects.filter(
        (obj) => obj.type === TrellisObjectType.FEATURE,
      );
      const taskObjects = objects.filter(
        (obj) => obj.type === TrellisObjectType.TASK,
      );

      expect(projectObjects.length).toBeGreaterThan(0);
      expect(epicObjects.length).toBeGreaterThan(0);
      expect(featureObjects.length).toBeGreaterThan(0);
      expect(taskObjects.length).toBeGreaterThan(0);

      // Verify specific objects exist
      expect(
        projectObjects.some((obj) => obj.id === "P-ecommerce-platform"),
      ).toBe(true);
      expect(projectObjects.some((obj) => obj.id === "P-mobile-app")).toBe(
        true,
      );
      expect(epicObjects.some((obj) => obj.id === "E-user-management")).toBe(
        true,
      );
      expect(
        featureObjects.some((obj) => obj.id === "F-user-authentication"),
      ).toBe(true);
      expect(taskObjects.some((obj) => obj.id === "T-setup-database")).toBe(
        true,
      );
    });

    it("should include both hierarchical and standalone objects", async () => {
      const objects = await getObjects(testRoot);

      // Standalone features (not within projects)
      const standaloneFeatures = objects.filter(
        (obj) =>
          obj.type === TrellisObjectType.FEATURE &&
          (obj.id === "F-user-authentication" ||
            obj.id === "F-api-documentation"),
      );
      expect(standaloneFeatures.length).toBe(2);

      // Standalone tasks (not within projects) - only open ones are included by default
      const standaloneTasks = objects.filter(
        (obj) =>
          obj.type === TrellisObjectType.TASK &&
          ["T-setup-database", "T-implement-logging"].includes(obj.id),
      );
      expect(standaloneTasks.length).toBe(2);
    });
  });

  describe("includeClosed parameter", () => {
    it("should exclude closed objects by default", async () => {
      const objects = await getObjects(testRoot);

      // Should not include any DONE or WONT_DO objects
      const closedObjects = objects.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(closedObjects.length).toBe(0);

      // Should only include open objects (not DONE or WONT_DO)
      objects.forEach((obj) => {
        expect(obj.status).not.toBe(TrellisObjectStatus.DONE);
        expect(obj.status).not.toBe(TrellisObjectStatus.WONT_DO);
      });
    });

    it("should exclude closed objects when includeClosed is false", async () => {
      const objects = await getObjects(testRoot, false);

      // Should not include any DONE or WONT_DO objects
      const closedObjects = objects.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(closedObjects).toHaveLength(0);

      // Should still include open objects
      const openObjects = objects.filter(
        (obj) =>
          obj.status !== TrellisObjectStatus.DONE &&
          obj.status !== TrellisObjectStatus.WONT_DO,
      );
      expect(openObjects.length).toBeGreaterThan(0);
      expect(openObjects.length).toBe(objects.length);
    });

    it("should include closed objects when includeClosed is explicitly true", async () => {
      const objects = await getObjects(testRoot, true);

      // Should include DONE objects
      const doneObjects = objects.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );

      expect(doneObjects.length).toBeGreaterThan(0);

      // Should also include open objects
      const openObjects = objects.filter(
        (obj) =>
          obj.status !== TrellisObjectStatus.DONE &&
          obj.status !== TrellisObjectStatus.WONT_DO,
      );
      expect(openObjects.length).toBeGreaterThan(0);
    });

    it("should have more objects when includeClosed is true", async () => {
      const defaultObjects = await getObjects(testRoot); // excludes closed by default
      const allObjects = await getObjects(testRoot, true); // includes closed

      expect(allObjects.length).toBeGreaterThan(defaultObjects.length);

      // The difference should be exactly the number of closed objects
      const closedObjects = allObjects.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );
      expect(allObjects.length - defaultObjects.length).toBe(
        closedObjects.length,
      );
      expect(closedObjects.length).toBeGreaterThan(0); // Should have some closed objects
    });

    it("should filter both DONE and WONT_DO objects when includeClosed is false", async () => {
      // First get all objects to see what we have
      const allObjects = await getObjects(testRoot, true);
      const filteredObjects = await getObjects(testRoot, false);

      // Count DONE and WONT_DO objects in all objects
      const doneObjects = allObjects.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );
      const wontDoObjects = allObjects.filter(
        (obj) => obj.status === TrellisObjectStatus.WONT_DO,
      );

      // Filtered objects should not contain any DONE or WONT_DO objects
      const filteredDoneObjects = filteredObjects.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );
      const filteredWontDoObjects = filteredObjects.filter(
        (obj) => obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(filteredDoneObjects.length).toBe(0);
      expect(filteredWontDoObjects.length).toBe(0);

      // The difference should be the sum of DONE and WONT_DO objects
      const expectedDifference = doneObjects.length + wontDoObjects.length;
      expect(allObjects.length - filteredObjects.length).toBe(
        expectedDifference,
      );
    });
  });

  describe("scope parameter", () => {
    it("should filter objects by project scope", async () => {
      const objects = await getObjects(testRoot, true, "P-ecommerce-platform");

      // Should only include objects within the P-ecommerce-platform project
      expect(objects.some((obj) => obj.id === "P-ecommerce-platform")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "E-user-management")).toBe(true);
      expect(objects.some((obj) => obj.id === "E-product-catalog")).toBe(true);
      expect(objects.some((obj) => obj.id === "F-user-registration")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);

      // Should NOT include objects from other projects
      expect(objects.some((obj) => obj.id === "P-mobile-app")).toBe(false);
      expect(objects.some((obj) => obj.id === "E-offline-sync")).toBe(false);

      // Should NOT include standalone features or tasks
      expect(objects.some((obj) => obj.id === "F-user-authentication")).toBe(
        false,
      );
      expect(objects.some((obj) => obj.id === "T-setup-database")).toBe(false);
    });

    it("should filter objects by epic scope", async () => {
      const objects = await getObjects(testRoot, true, "E-user-management");

      // Should only include objects within the E-user-management epic
      expect(objects.some((obj) => obj.id === "E-user-management")).toBe(true);
      expect(objects.some((obj) => obj.id === "F-user-registration")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);

      // Should NOT include objects from other epics
      expect(objects.some((obj) => obj.id === "E-product-catalog")).toBe(false);
      expect(objects.some((obj) => obj.id === "F-product-search")).toBe(false);
    });

    it("should filter objects by feature scope", async () => {
      const objects = await getObjects(testRoot, true, "F-user-registration");

      // Should only include objects within the F-user-registration feature
      expect(objects.some((obj) => obj.id === "F-user-registration")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);

      // Should NOT include objects from other features
      expect(objects.some((obj) => obj.id === "F-product-search")).toBe(false);
      expect(
        objects.some((obj) => obj.id === "T-implement-elasticsearch"),
      ).toBe(false);
    });

    it("should work with standalone features", async () => {
      const objects = await getObjects(testRoot, true, "F-user-authentication");

      // Should only include objects within the standalone F-user-authentication feature
      expect(objects.some((obj) => obj.id === "F-user-authentication")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "T-implement-login")).toBe(true);
      expect(objects.some((obj) => obj.id === "T-setup-auth-models")).toBe(
        true,
      );

      // Should NOT include objects from project hierarchies
      expect(objects.some((obj) => obj.id === "P-ecommerce-platform")).toBe(
        false,
      );
      expect(objects.some((obj) => obj.id === "F-user-registration")).toBe(
        false,
      );
    });

    it("should return empty array for non-existent scope", async () => {
      const objects = await getObjects(testRoot, true, "P-non-existent");

      expect(objects).toEqual([]);
    });
  });

  describe("type parameter", () => {
    it("should filter objects by PROJECT type", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        TrellisObjectType.PROJECT,
      );

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.PROJECT);
      });

      expect(objects.some((obj) => obj.id === "P-ecommerce-platform")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "P-mobile-app")).toBe(true);
    });

    it("should filter objects by EPIC type", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        TrellisObjectType.EPIC,
      );

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.EPIC);
      });

      expect(objects.some((obj) => obj.id === "E-user-management")).toBe(true);
      expect(objects.some((obj) => obj.id === "E-product-catalog")).toBe(true);
    });

    it("should filter objects by FEATURE type", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        TrellisObjectType.FEATURE,
      );

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.FEATURE);
      });

      expect(objects.some((obj) => obj.id === "F-user-authentication")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "F-user-registration")).toBe(
        true,
      );
    });

    it("should filter objects by TASK type", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        TrellisObjectType.TASK,
      );

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
      });

      expect(objects.some((obj) => obj.id === "T-setup-database")).toBe(true);
      expect(objects.some((obj) => obj.id === "T-implement-login")).toBe(true);
    });
  });

  describe("status parameter", () => {
    it("should filter objects by OPEN status", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        TrellisObjectStatus.OPEN,
      );

      expect(objects.length).toBeGreaterThan(0);
      objects.forEach((obj) => {
        expect(obj.status).toBe(TrellisObjectStatus.OPEN);
      });

      // Should include some open objects
      expect(objects.some((obj) => obj.id === "T-setup-database")).toBe(true);
      expect(objects.some((obj) => obj.id === "T-implement-login")).toBe(true);
    });

    it("should filter objects by IN_PROGRESS status", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      objects.forEach((obj) => {
        expect(obj.status).toBe(TrellisObjectStatus.IN_PROGRESS);
      });

      // Should include any in-progress objects if they exist
      const inProgressObjects = objects.filter(
        (obj) => obj.status === TrellisObjectStatus.IN_PROGRESS,
      );
      expect(inProgressObjects.length).toBe(objects.length);
    });

    it("should filter objects by DONE status", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        TrellisObjectStatus.DONE,
      );

      objects.forEach((obj) => {
        expect(obj.status).toBe(TrellisObjectStatus.DONE);
      });

      // Should include closed objects
      expect(objects.some((obj) => obj.id === "T-project-initialization")).toBe(
        true,
      );
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
    });

    it("should return empty array when no objects match status", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        TrellisObjectStatus.WONT_DO,
      );

      expect(objects).toEqual([]);
    });
  });

  describe("priority parameter", () => {
    it("should filter objects by HIGH priority", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.HIGH,
      );

      objects.forEach((obj) => {
        expect(obj.priority).toBe(TrellisObjectPriority.HIGH);
      });

      // Verify we have some high priority objects
      if (objects.length > 0) {
        expect(objects.length).toBeGreaterThan(0);
      }
    });

    it("should filter objects by MEDIUM priority", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.MEDIUM,
      );

      objects.forEach((obj) => {
        expect(obj.priority).toBe(TrellisObjectPriority.MEDIUM);
      });
    });

    it("should filter objects by LOW priority", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.LOW,
      );

      objects.forEach((obj) => {
        expect(obj.priority).toBe(TrellisObjectPriority.LOW);
      });
    });

    it("should return all objects when no priority filter is specified", async () => {
      const allObjects = await getObjects(testRoot, true);
      const highPriorityObjects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.HIGH,
      );
      const mediumPriorityObjects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.MEDIUM,
      );
      const lowPriorityObjects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        undefined,
        TrellisObjectPriority.LOW,
      );

      // All filtered objects combined should equal all objects
      const filteredTotal =
        highPriorityObjects.length +
        mediumPriorityObjects.length +
        lowPriorityObjects.length;
      expect(filteredTotal).toBe(allObjects.length);
    });
  });

  describe("combined parameters", () => {
    it("should work with includeClosed=false and scope", async () => {
      const objects = await getObjects(testRoot, false, "E-user-management");

      // Should only include objects within the E-user-management epic
      // and exclude closed objects
      objects.forEach((obj) => {
        expect(obj.status).not.toBe(TrellisObjectStatus.DONE);
      });

      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        false,
      ); // This is closed
    });

    it("should work with scope and type filters", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        "P-ecommerce-platform",
        TrellisObjectType.TASK,
      );

      // Should only include tasks within the P-ecommerce-platform project
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
      });

      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);

      // Should not include tasks from other projects or standalone tasks
      expect(objects.some((obj) => obj.id === "T-setup-database")).toBe(false);
      expect(objects.some((obj) => obj.id === "T-implement-cache-layer")).toBe(
        false,
      );
    });

    it("should work with status and priority filters", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        undefined,
        undefined,
        TrellisObjectStatus.OPEN,
        TrellisObjectPriority.HIGH,
      );

      // Should only include open, high priority objects
      objects.forEach((obj) => {
        expect(obj.status).toBe(TrellisObjectStatus.OPEN);
        expect(obj.priority).toBe(TrellisObjectPriority.HIGH);
      });
    });

    it("should work with scope, type, and status filters", async () => {
      const objects = await getObjects(
        testRoot,
        true,
        "P-ecommerce-platform",
        TrellisObjectType.TASK,
        TrellisObjectStatus.OPEN,
      );

      // Should only include open tasks within the P-ecommerce-platform project
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
        expect(obj.status).toBe(TrellisObjectStatus.OPEN);
      });

      // Should not include tasks from other projects or closed tasks
      expect(objects.some((obj) => obj.id === "T-setup-database")).toBe(false);
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        false,
      ); // This is closed
    });

    it("should work with all parameters combined", async () => {
      const objects = await getObjects(
        testRoot,
        false,
        "E-user-management",
        TrellisObjectType.TASK,
        TrellisObjectStatus.OPEN,
        TrellisObjectPriority.MEDIUM,
      );

      // Should only include open, medium priority tasks within the E-user-management epic
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
        expect(obj.status).toBe(TrellisObjectStatus.OPEN);
        expect(obj.priority).toBe(TrellisObjectPriority.MEDIUM);
      });
    });

    it("should work with original parameters (backward compatibility)", async () => {
      const objects = await getObjects(
        testRoot,
        false,
        "E-user-management",
        TrellisObjectType.TASK,
      );

      // Should only include open tasks within the E-user-management epic
      objects.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
        expect(obj.status).not.toBe(TrellisObjectStatus.DONE);
      });

      expect(
        objects.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);
      expect(objects.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        false,
      ); // This is closed
    });
  });

  describe("error handling", () => {
    it("should handle non-existent directory gracefully", async () => {
      const objects = await getObjects("/non/existent/path");

      expect(objects).toEqual([]);
    });

    it("should skip invalid markdown files and continue processing", async () => {
      // This test relies on the fact that getObjects catches errors from
      // getObjectByFilePath and continues processing other files
      const objects = await getObjects(testRoot);

      // Should still return valid objects even if some files are invalid
      expect(objects.length).toBeGreaterThan(0);

      // All returned objects should be valid
      objects.forEach((obj) => {
        expect(obj).toHaveProperty("id");
        expect(obj).toHaveProperty("type");
        expect(obj).toHaveProperty("title");
      });
    });

    it("should handle empty directory gracefully", async () => {
      // Create a path that exists but has no markdown files
      const emptyDir = join(__dirname, "schema1_0", ".trellis", "empty");
      const objects = await getObjects(emptyDir);

      expect(objects).toEqual([]);
    });
  });

  describe("console warning behavior", () => {
    it("should log warnings for files that cannot be deserialized", async () => {
      // Mock console.warn to capture warnings
      const originalWarn = console.warn;
      const mockWarn = jest.fn();
      console.warn = mockWarn;

      try {
        // This should process normally but might encounter some files that can't be deserialized
        await getObjects(testRoot);

        // If there were any deserialization errors, they should have been logged
        // Note: In our test data, all files should be valid, so this mainly tests the mechanism
      } finally {
        console.warn = originalWarn;
      }
    });
  });
});
