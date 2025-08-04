import { generateUniqueId } from "../generateUniqueId";
import { TrellisObjectType } from "../../models/TrellisObjectType";

describe("generateUniqueId", () => {
  describe("basic functionality", () => {
    it("should generate ID with correct prefix for each type", () => {
      const title = "Test Item";
      const existingIds: string[] = [];

      expect(
        generateUniqueId(title, TrellisObjectType.PROJECT, existingIds),
      ).toBe("P-test-item");
      expect(generateUniqueId(title, TrellisObjectType.EPIC, existingIds)).toBe(
        "E-test-item",
      );
      expect(
        generateUniqueId(title, TrellisObjectType.FEATURE, existingIds),
      ).toBe("F-test-item");
      expect(generateUniqueId(title, TrellisObjectType.TASK, existingIds)).toBe(
        "T-test-item",
      );
    });

    it("should slugify titles correctly", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId("Simple Title", TrellisObjectType.TASK, existingIds),
      ).toBe("T-simple-title");
      expect(
        generateUniqueId(
          "Title With Spaces",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-title-with-spaces");
      expect(
        generateUniqueId(
          "Title_With_Underscores",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-title-with-underscores");
      expect(
        generateUniqueId(
          "Title-With-Hyphens",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-title-with-hyphens");
    });

    it("should handle special characters", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId(
          "Title@#$%^&*()+={}[]|\\:;\"'<>?,./",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-title");
      expect(
        generateUniqueId(
          "API & Database Integration!",
          TrellisObjectType.FEATURE,
          existingIds,
        ),
      ).toBe("F-api-database-integration");
      expect(
        generateUniqueId(
          "User's Profile (v2.0)",
          TrellisObjectType.EPIC,
          existingIds,
        ),
      ).toBe("E-users-profile-v20");
    });

    it("should handle mixed case", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId("MixedCaseTitle", TrellisObjectType.TASK, existingIds),
      ).toBe("T-mixedcasetitle");
      expect(
        generateUniqueId(
          "UPPERCASE TITLE",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-uppercase-title");
      expect(
        generateUniqueId(
          "lowercase title",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-lowercase-title");
    });

    it("should handle leading and trailing whitespace", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId(
          "  Trimmed Title  ",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-trimmed-title");
      expect(
        generateUniqueId(
          "\t\nTabbed Title\t\n",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-tabbed-title");
    });

    it("should handle multiple consecutive spaces and hyphens", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId(
          "Multiple    Spaces",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-multiple-spaces");
      expect(
        generateUniqueId(
          "Multiple----Hyphens",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-multiple-hyphens");
      expect(
        generateUniqueId(
          "Mixed   ---  Separators",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-mixed-separators");
    });
  });

  describe("length handling", () => {
    it("should truncate long titles to reasonable length", () => {
      const longTitle =
        "This is a very long title that should be truncated to a reasonable length for ID generation";
      const existingIds: string[] = [];

      const result = generateUniqueId(
        longTitle,
        TrellisObjectType.TASK,
        existingIds,
      );

      // Should be truncated (T- prefix + 30 chars max = 32 total, but truncated at word boundary)
      expect(result.length).toBeLessThanOrEqual(32);
      expect(result).toBe("T-this-is-a-very-long-title");
    });

    it("should prefer word boundaries when truncating", () => {
      const title =
        "User authentication and authorization system implementation";
      const existingIds: string[] = [];

      const result = generateUniqueId(
        title,
        TrellisObjectType.FEATURE,
        existingIds,
      );

      // Should cut at a word boundary, not mid-word
      expect(result).toBe("F-user-authentication-and");
      expect(result).not.toContain("authori"); // Should not cut mid-word
    });

    it("should handle titles that are exactly at max length", () => {
      const title = "A".repeat(30); // Exactly 30 characters
      const existingIds: string[] = [];

      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe(`T-${"a".repeat(30)}`);
    });

    it("should handle titles shorter than max length", () => {
      const title = "Short";
      const existingIds: string[] = [];

      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe("T-short");
    });
  });

  describe("uniqueness handling", () => {
    it("should add counter when ID already exists", () => {
      const title = "Duplicate Title";
      const existingIds = ["T-duplicate-title"];

      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe("T-duplicate-title-1");
    });

    it("should increment counter for multiple duplicates", () => {
      const title = "Popular Title";
      const existingIds = [
        "F-popular-title",
        "F-popular-title-1",
        "F-popular-title-2",
        "F-popular-title-3",
      ];

      const result = generateUniqueId(
        title,
        TrellisObjectType.FEATURE,
        existingIds,
      );
      expect(result).toBe("F-popular-title-4");
    });

    it("should handle non-sequential existing IDs", () => {
      const title = "Test Title";
      const existingIds = [
        "T-test-title",
        "T-test-title-1",
        "T-test-title-3", // Note: missing 2
        "T-test-title-5",
      ];

      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe("T-test-title-2"); // Should use the first available number
    });

    it("should handle empty existing IDs array", () => {
      const title = "New Title";
      const existingIds: string[] = [];

      const result = generateUniqueId(
        title,
        TrellisObjectType.PROJECT,
        existingIds,
      );
      expect(result).toBe("P-new-title");
    });

    it("should be case-sensitive for existing IDs", () => {
      const title = "Title";
      const existingIds = ["T-TITLE"]; // Different case

      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe("T-title"); // Should not conflict
    });

    it("should handle large numbers of duplicates efficiently", () => {
      const title = "Common Title";
      const existingIds = Array.from({ length: 1000 }, (_, i) =>
        i === 0 ? "T-common-title" : `T-common-title-${i}`,
      );

      const start = Date.now();
      const result = generateUniqueId(
        title,
        TrellisObjectType.TASK,
        existingIds,
      );
      const end = Date.now();

      expect(result).toBe("T-common-title-1000");
      expect(end - start).toBeLessThan(100); // Should be fast (less than 100ms)
    });
  });

  describe("edge cases and error handling", () => {
    it("should throw error for empty title", () => {
      const existingIds: string[] = [];

      expect(() =>
        generateUniqueId("", TrellisObjectType.TASK, existingIds),
      ).toThrow("Title cannot be empty");
      expect(() =>
        generateUniqueId("   ", TrellisObjectType.TASK, existingIds),
      ).toThrow("Title cannot be empty");
      expect(() =>
        generateUniqueId("\t\n", TrellisObjectType.TASK, existingIds),
      ).toThrow("Title cannot be empty");
    });

    it("should throw error for title with no alphanumeric characters", () => {
      const existingIds: string[] = [];

      expect(() =>
        generateUniqueId("!@#$%^&*()", TrellisObjectType.TASK, existingIds),
      ).toThrow("Title must contain at least one alphanumeric character");
      expect(() =>
        generateUniqueId("---___   ", TrellisObjectType.TASK, existingIds),
      ).toThrow("Title must contain at least one alphanumeric character");
    });

    it("should handle title with only numbers", () => {
      const existingIds: string[] = [];

      const result = generateUniqueId(
        "12345",
        TrellisObjectType.TASK,
        existingIds,
      );
      expect(result).toBe("T-12345");
    });

    it("should handle title with mixed numbers and letters", () => {
      const existingIds: string[] = [];

      const result = generateUniqueId(
        "Version 2.0 Release",
        TrellisObjectType.EPIC,
        existingIds,
      );
      expect(result).toBe("E-version-20-release");
    });

    it("should handle unicode characters", () => {
      const existingIds: string[] = [];

      const result = generateUniqueId(
        "Café & Naïve résumé",
        TrellisObjectType.FEATURE,
        existingIds,
      );
      expect(result).toBe("F-caf-nave-rsum");
    });
  });

  describe("real-world scenarios", () => {
    it("should generate realistic IDs for common task titles", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId(
          "Set up database connection",
          TrellisObjectType.TASK,
          existingIds,
        ),
      ).toBe("T-set-up-database-connection");
      expect(
        generateUniqueId(
          "Implement user authentication",
          TrellisObjectType.FEATURE,
          existingIds,
        ),
      ).toBe("F-implement-user-authentication");
      expect(
        generateUniqueId(
          "Mobile App Development",
          TrellisObjectType.EPIC,
          existingIds,
        ),
      ).toBe("E-mobile-app-development");
      expect(
        generateUniqueId(
          "E-commerce Platform",
          TrellisObjectType.PROJECT,
          existingIds,
        ),
      ).toBe("P-e-commerce-platform");
    });

    it("should handle complex project names", () => {
      const existingIds: string[] = [];

      expect(
        generateUniqueId(
          "Customer Relationship Management (CRM) System v3.0",
          TrellisObjectType.PROJECT,
          existingIds,
        ),
      ).toBe("P-customer-relationship");
      expect(
        generateUniqueId(
          "AI/ML Model Training & Deployment Pipeline",
          TrellisObjectType.EPIC,
          existingIds,
        ),
      ).toBe("E-aiml-model-training");
    });

    it("should work with existing realistic project structure", () => {
      const existingIds = [
        "P-ecommerce-platform",
        "E-user-management",
        "E-product-catalog",
        "F-user-registration",
        "F-user-authentication",
        "F-product-search",
        "T-setup-database",
        "T-implement-login",
        "T-create-user-schema",
      ];

      expect(
        generateUniqueId(
          "User Management",
          TrellisObjectType.EPIC,
          existingIds,
        ),
      ).toBe("E-user-management-1");
      expect(
        generateUniqueId(
          "Product Search",
          TrellisObjectType.FEATURE,
          existingIds,
        ),
      ).toBe("F-product-search-1");
      expect(
        generateUniqueId("Setup Database", TrellisObjectType.TASK, existingIds),
      ).toBe("T-setup-database-1");
    });
  });
});
