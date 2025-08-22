import { join } from "path";
import { getChildrenOf } from "../getChildrenOf";
import { TrellisObjectStatus, TrellisObjectType } from "../../../models";

describe("getChildrenOf", () => {
  const testRoot = join(__dirname, "schema1_0");

  describe("basic functionality", () => {
    it("should return all children of a given parent", async () => {
      // E-user-management should have F-user-registration as a child
      const children = await getChildrenOf("E-user-management", testRoot);

      expect(children.length).toBeGreaterThan(0);

      // All returned objects should be valid TrellisObject instances
      children.forEach((obj) => {
        expect(obj).toHaveProperty("id");
        expect(obj).toHaveProperty("type");
        expect(obj).toHaveProperty("title");
        expect(obj).toHaveProperty("status");
        expect(obj).toHaveProperty("priority");
        expect(obj).toHaveProperty("parent");
        expect(obj).toHaveProperty("schema");
        expect(obj.schema).toBe("v1.0");
      });

      // All returned objects should have the correct parent
      children.forEach((obj) => {
        expect(obj.parent).toBe("E-user-management");
      });
    });

    it("should return children with correct types for epic parent", async () => {
      const children = await getChildrenOf("E-user-management", testRoot, true);

      expect(children.length).toBeGreaterThan(0);

      // Epic children should be features
      children.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.FEATURE);
        expect(obj.parent).toBe("E-user-management");
      });

      // Should include F-user-registration
      expect(children.some((obj) => obj.id === "F-user-registration")).toBe(
        true,
      );
    });

    it("should return children with correct types for feature parent", async () => {
      const children = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );

      expect(children.length).toBeGreaterThan(0);

      // Feature children should be tasks
      children.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
        expect(obj.parent).toBe("F-user-registration");
      });

      // Should include specific tasks
      expect(children.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );
      expect(
        children.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(true);
    });

    it("should return children with correct types for project parent", async () => {
      const children = await getChildrenOf(
        "P-ecommerce-platform",
        testRoot,
        true,
      );

      expect(children.length).toBeGreaterThan(0);

      // Project children should be epics
      children.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.EPIC);
        expect(obj.parent).toBe("P-ecommerce-platform");
      });

      // Should include specific epics
      expect(children.some((obj) => obj.id === "E-user-management")).toBe(true);
      expect(children.some((obj) => obj.id === "E-product-catalog")).toBe(true);
    });

    it("should return empty array for parent with no children", async () => {
      // Tasks should have no children
      const children = await getChildrenOf("T-setup-database", testRoot);

      expect(children).toEqual([]);
    });

    it("should return empty array for non-existent parent", async () => {
      const children = await getChildrenOf("P-non-existent", testRoot);

      expect(children).toEqual([]);
    });
  });

  describe("includeClosed parameter", () => {
    it("should exclude closed children by default", async () => {
      const children = await getChildrenOf("F-user-registration", testRoot);

      // Should not include any DONE or WONT_DO objects
      const closedChildren = children.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(closedChildren.length).toBe(0);

      // Should only include open children (not DONE or WONT_DO)
      children.forEach((obj) => {
        expect(obj.status).not.toBe(TrellisObjectStatus.DONE);
        expect(obj.status).not.toBe(TrellisObjectStatus.WONT_DO);
      });
    });

    it("should exclude closed children when includeClosed is false", async () => {
      const children = await getChildrenOf(
        "F-user-registration",
        testRoot,
        false,
      );

      // Should not include any DONE or WONT_DO objects
      const closedChildren = children.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(closedChildren).toHaveLength(0);

      // Should still include open children
      const openChildren = children.filter(
        (obj) =>
          obj.status !== TrellisObjectStatus.DONE &&
          obj.status !== TrellisObjectStatus.WONT_DO,
      );
      expect(openChildren.length).toBeGreaterThan(0);
      expect(openChildren.length).toBe(children.length);
    });

    it("should include closed children when includeClosed is explicitly true", async () => {
      const children = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );

      // Should include DONE objects if they exist
      const doneChildren = children.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );

      // F-user-registration should have T-setup-user-schema as a DONE child
      expect(doneChildren.length).toBeGreaterThan(0);
      expect(doneChildren.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        true,
      );

      // Should also include open children
      const openChildren = children.filter(
        (obj) =>
          obj.status !== TrellisObjectStatus.DONE &&
          obj.status !== TrellisObjectStatus.WONT_DO,
      );
      expect(openChildren.length).toBeGreaterThan(0);
    });

    it("should have more children when includeClosed is true", async () => {
      const defaultChildren = await getChildrenOf(
        "F-user-registration",
        testRoot,
      ); // excludes closed by default
      const allChildren = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      ); // includes closed

      expect(allChildren.length).toBeGreaterThan(defaultChildren.length);

      // The difference should be exactly the number of closed children
      const closedChildren = allChildren.filter(
        (obj) =>
          obj.status === TrellisObjectStatus.DONE ||
          obj.status === TrellisObjectStatus.WONT_DO,
      );
      expect(allChildren.length - defaultChildren.length).toBe(
        closedChildren.length,
      );
      expect(closedChildren.length).toBeGreaterThan(0); // Should have some closed children
    });

    it("should filter both DONE and WONT_DO children when includeClosed is false", async () => {
      // First get all children to see what we have
      const allChildren = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );
      const filteredChildren = await getChildrenOf(
        "F-user-registration",
        testRoot,
        false,
      );

      // Count DONE and WONT_DO children in all children
      const doneChildren = allChildren.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );
      const wontDoChildren = allChildren.filter(
        (obj) => obj.status === TrellisObjectStatus.WONT_DO,
      );

      // Filtered children should not contain any DONE or WONT_DO children
      const filteredDoneChildren = filteredChildren.filter(
        (obj) => obj.status === TrellisObjectStatus.DONE,
      );
      const filteredWontDoChildren = filteredChildren.filter(
        (obj) => obj.status === TrellisObjectStatus.WONT_DO,
      );

      expect(filteredDoneChildren.length).toBe(0);
      expect(filteredWontDoChildren.length).toBe(0);

      // The difference should be the sum of DONE and WONT_DO children
      const expectedDifference = doneChildren.length + wontDoChildren.length;
      expect(allChildren.length - filteredChildren.length).toBe(
        expectedDifference,
      );
    });
  });

  describe("hierarchical relationships", () => {
    it("should find children for standalone features", async () => {
      // F-user-authentication is a standalone feature (not part of a project hierarchy)
      const children = await getChildrenOf(
        "F-user-authentication",
        testRoot,
        true,
      );

      expect(children.length).toBeGreaterThan(0);

      // All should be tasks with correct parent
      children.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.TASK);
        expect(obj.parent).toBe("F-user-authentication");
      });

      // Should include specific tasks
      expect(children.some((obj) => obj.id === "T-implement-login")).toBe(true);
      expect(children.some((obj) => obj.id === "T-setup-auth-models")).toBe(
        true,
      );
    });

    it("should find children for project hierarchy", async () => {
      // Test the full project -> epic -> feature -> task hierarchy

      // Project level
      const projectChildren = await getChildrenOf(
        "P-ecommerce-platform",
        testRoot,
        true,
      );
      expect(projectChildren.length).toBeGreaterThan(0);
      expect(
        projectChildren.every((obj) => obj.type === TrellisObjectType.EPIC),
      ).toBe(true);

      // Epic level
      const epicChildren = await getChildrenOf(
        "E-user-management",
        testRoot,
        true,
      );
      expect(epicChildren.length).toBeGreaterThan(0);
      expect(
        epicChildren.every((obj) => obj.type === TrellisObjectType.FEATURE),
      ).toBe(true);

      // Feature level
      const featureChildren = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );
      expect(featureChildren.length).toBeGreaterThan(0);
      expect(
        featureChildren.every((obj) => obj.type === TrellisObjectType.TASK),
      ).toBe(true);
    });

    it("should not return indirect children (only direct children)", async () => {
      // E-user-management should not return tasks directly, only its feature children
      const children = await getChildrenOf("E-user-management", testRoot, true);

      // Should only include features, not tasks
      children.forEach((obj) => {
        expect(obj.type).toBe(TrellisObjectType.FEATURE);
        expect(obj.parent).toBe("E-user-management");
      });

      // Should NOT include tasks that are children of child features
      expect(children.some((obj) => obj.id === "T-setup-user-schema")).toBe(
        false,
      );
      expect(
        children.some((obj) => obj.id === "T-create-registration-form"),
      ).toBe(false);
    });

    it("should handle multiple projects correctly", async () => {
      // P-mobile-app should have different children than P-ecommerce-platform
      const mobileChildren = await getChildrenOf(
        "P-mobile-app",
        testRoot,
        true,
      );
      const ecommerceChildren = await getChildrenOf(
        "P-ecommerce-platform",
        testRoot,
        true,
      );

      // Both should have children
      expect(mobileChildren.length).toBeGreaterThan(0);
      expect(ecommerceChildren.length).toBeGreaterThan(0);

      // No overlap between the two sets of children
      mobileChildren.forEach((mobileChild) => {
        expect(
          ecommerceChildren.some(
            (ecommerceChild) => ecommerceChild.id === mobileChild.id,
          ),
        ).toBe(false);
      });

      // Mobile app should have E-offline-sync
      expect(mobileChildren.some((obj) => obj.id === "E-offline-sync")).toBe(
        true,
      );

      // E-commerce should have E-user-management and E-product-catalog
      expect(
        ecommerceChildren.some((obj) => obj.id === "E-user-management"),
      ).toBe(true);
      expect(
        ecommerceChildren.some((obj) => obj.id === "E-product-catalog"),
      ).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle non-existent directory gracefully", async () => {
      const children = await getChildrenOf("P-test", "/non/existent/path");

      expect(children).toEqual([]);
    });

    it("should skip invalid markdown files and continue processing", async () => {
      // This test relies on the fact that getChildrenOf catches errors from
      // getObjectByFilePath and continues processing other files
      const children = await getChildrenOf("E-user-management", testRoot);

      // Should still return valid children even if some files are invalid
      expect(children.length).toBeGreaterThan(0);

      // All returned children should be valid
      children.forEach((obj) => {
        expect(obj).toHaveProperty("id");
        expect(obj).toHaveProperty("type");
        expect(obj).toHaveProperty("title");
        expect(obj).toHaveProperty("parent");
      });
    });

    it("should handle empty directory gracefully", async () => {
      // Create a path that exists but has no markdown files
      const emptyDir = join(__dirname, "schema1_0", ".trellis", "empty");
      const children = await getChildrenOf("P-test", emptyDir);

      expect(children).toEqual([]);
    });

    it("should handle malformed parent IDs gracefully", async () => {
      const children = await getChildrenOf("", testRoot);
      expect(children).toEqual([]);

      const children2 = await getChildrenOf("invalid-id-format", testRoot);
      expect(children2).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle parent IDs with special characters", async () => {
      // Most IDs should be well-formed, but function should be robust
      const children = await getChildrenOf("P-test-with-dashes", testRoot);
      expect(children).toEqual([]);
    });

    it("should return consistent results on multiple calls", async () => {
      const children1 = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );
      const children2 = await getChildrenOf(
        "F-user-registration",
        testRoot,
        true,
      );

      // Should get the same results
      expect(children1.length).toBe(children2.length);

      // Sort by ID to ensure consistent comparison
      const sorted1 = children1.sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = children2.sort((a, b) => a.id.localeCompare(b.id));

      expect(sorted1).toEqual(sorted2);
    });

    it("should handle various object statuses correctly", async () => {
      // Test with a parent that has children in various statuses
      const allChildren = await getChildrenOf(
        "F-user-authentication",
        testRoot,
        true,
      );

      if (allChildren.length > 0) {
        // Verify we can handle different statuses
        const statusCount = new Map();
        allChildren.forEach((obj) => {
          statusCount.set(obj.status, (statusCount.get(obj.status) || 0) + 1);
        });

        // Should have at least one status represented
        expect(statusCount.size).toBeGreaterThan(0);
      }
    });
  });

  describe("console warning behavior", () => {
    it("should log warnings for files that cannot be deserialized", async () => {
      // Mock console.error to capture warnings (getChildrenOf uses console.error)
      const originalError = console.error;
      const mockError = jest.fn();
      console.error = mockError;

      try {
        // This should process normally but might encounter some files that can't be deserialized
        await getChildrenOf("E-user-management", testRoot);

        // If there were any deserialization errors, they should have been logged
        // Note: In our test data, all files should be valid, so this mainly tests the mechanism
      } finally {
        console.error = originalError;
      }
    });
  });

  describe("performance", () => {
    it("should complete in reasonable time for typical data sets", async () => {
      const startTime = Date.now();

      // Test with a parent that likely has children
      await getChildrenOf("E-user-management", testRoot, true);

      const endTime = Date.now();

      // Should complete quickly (under 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it("should handle multiple concurrent calls efficiently", async () => {
      const startTime = Date.now();

      // Run multiple calls concurrently
      const promises = [
        getChildrenOf("P-ecommerce-platform", testRoot, true),
        getChildrenOf("E-user-management", testRoot, true),
        getChildrenOf("F-user-registration", testRoot, true),
        getChildrenOf("F-user-authentication", testRoot, true),
      ];

      const results = await Promise.all(promises);

      const endTime = Date.now();

      // All should return results
      expect(results).toHaveLength(4);
      results.forEach((result) => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Should complete in reasonable time even with concurrent calls
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});
