import { matchesScope, filterByScope } from "../scopeFilter";

describe("scopeFilter", () => {
  describe("matchesScope", () => {
    it("should return true when no scope is provided", () => {
      const filePath = "/path/to/project/P-test-project/file.md";
      const result = matchesScope(filePath, "");

      expect(result).toBe(true);
    });

    it("should match files within project scope", () => {
      const filePath = "/path/to/project/P-ecommerce-platform/epic/file.md";
      const scope = "P-ecommerce-platform";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(true);
    });

    it("should match files within epic scope", () => {
      const filePath = "/path/to/project/E-user-management/feature/file.md";
      const scope = "E-user-management";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(true);
    });

    it("should match files within feature scope", () => {
      const filePath = "/path/to/project/F-user-registration/task/file.md";
      const scope = "F-user-registration";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(true);
    });

    it("should not match files outside of scope", () => {
      const filePath = "/path/to/project/P-different-project/file.md";
      const scope = "P-ecommerce-platform";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(false);
    });

    it("should handle paths with multiple directory separators correctly", () => {
      const filePath =
        "/root/p/P-project/e/E-epic/f/F-feature/t/open/T-task.md";
      const scope = "P-project";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(true);
    });

    it("should not match partial scope names", () => {
      const filePath = "/path/to/project/P-ecommerce-platform-extended/file.md";
      const scope = "P-ecommerce-platform";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(false);
    });

    it("should match scope at the end of path", () => {
      const filePath = "/path/to/F-user-auth/F-user-auth.md";
      const scope = "F-user-auth";
      const result = matchesScope(filePath, scope);

      expect(result).toBe(true);
    });
  });

  describe("filterByScope", () => {
    const testPaths = [
      "/root/p/P-ecommerce/e/E-users/E-users.md",
      "/root/p/P-ecommerce/e/E-products/E-products.md",
      "/root/p/P-mobile/e/E-sync/E-sync.md",
      "/root/f/F-standalone/F-standalone.md",
      "/root/t/open/T-standalone-task.md",
    ];

    it("should return all paths when no scope is provided", () => {
      const result = filterByScope(testPaths);

      expect(result).toEqual(testPaths);
      expect(result).toHaveLength(5);
    });

    it("should return all paths when scope is undefined", () => {
      const result = filterByScope(testPaths, undefined);

      expect(result).toEqual(testPaths);
      expect(result).toHaveLength(5);
    });

    it("should filter by project scope", () => {
      const result = filterByScope(testPaths, "P-ecommerce");

      expect(result).toHaveLength(2);
      expect(result).toContain("/root/p/P-ecommerce/e/E-users/E-users.md");
      expect(result).toContain(
        "/root/p/P-ecommerce/e/E-products/E-products.md",
      );
      expect(result).not.toContain("/root/p/P-mobile/e/E-sync/E-sync.md");
    });

    it("should filter by epic scope", () => {
      const result = filterByScope(testPaths, "E-users");

      expect(result).toHaveLength(1);
      expect(result).toContain("/root/p/P-ecommerce/e/E-users/E-users.md");
    });

    it("should filter by feature scope", () => {
      const result = filterByScope(testPaths, "F-standalone");

      expect(result).toHaveLength(1);
      expect(result).toContain("/root/f/F-standalone/F-standalone.md");
    });

    it("should return empty array for non-existent scope", () => {
      const result = filterByScope(testPaths, "P-non-existent");

      expect(result).toEqual([]);
    });

    it("should handle empty file paths array", () => {
      const result = filterByScope([], "P-test");

      expect(result).toEqual([]);
    });

    it("should preserve order of matching files", () => {
      const orderedPaths = [
        "/root/p/P-test/a.md",
        "/root/p/P-test/b.md",
        "/root/p/P-test/c.md",
      ];

      const result = filterByScope(orderedPaths, "P-test");

      expect(result).toEqual(orderedPaths);
    });
  });
});
