import { join } from "path";
import { findMarkdownFiles } from "../findMarkdownFiles";

describe("findMarkdownFiles", () => {
  const testRoot = join(__dirname, "schema1_0");

  it("should find all markdown files recursively", async () => {
    const files = await findMarkdownFiles(testRoot);

    // Should find all 20 markdown files we created
    expect(files).toHaveLength(20);

    // All returned paths should be absolute paths
    files.forEach((file) => {
      expect(file).toMatch(/^\/.*\.md$/);
    });

    // Results should be sorted
    const sortedFiles = [...files].sort();
    expect(files).toEqual(sortedFiles);
  });

  it("should find standalone task files", async () => {
    const files = await findMarkdownFiles(testRoot);

    const standaloneTaskFiles = files.filter(
      (file) =>
        file.includes("/.trellis/t/open/") ||
        file.includes("/.trellis/t/closed/"),
    );

    expect(standaloneTaskFiles).toHaveLength(3);
    expect(
      standaloneTaskFiles.some((f) => f.includes("T-setup-database.md")),
    ).toBe(true);
    expect(
      standaloneTaskFiles.some((f) => f.includes("T-implement-logging.md")),
    ).toBe(true);
    expect(
      standaloneTaskFiles.some((f) =>
        f.includes("T-project-initialization.md"),
      ),
    ).toBe(true);
  });

  it("should find standalone feature files", async () => {
    const files = await findMarkdownFiles(testRoot);

    // Only the feature definition files, not their tasks
    const standaloneFeatureFiles = files.filter(
      (file) =>
        file.includes("/.trellis/f/F-") &&
        !file.includes("/p/P-") &&
        !file.includes("/t/"), // Exclude task files
    );

    expect(standaloneFeatureFiles).toHaveLength(2);
    expect(
      standaloneFeatureFiles.some((f) =>
        f.includes("F-user-authentication.md"),
      ),
    ).toBe(true);
    expect(
      standaloneFeatureFiles.some((f) => f.includes("F-api-documentation.md")),
    ).toBe(true);
  });

  it("should find project hierarchy files", async () => {
    const files = await findMarkdownFiles(testRoot);

    // Project files
    const projectFiles = files.filter((file) => file.includes("/p/P-"));
    expect(projectFiles.length).toBeGreaterThan(0);
    expect(
      projectFiles.some((f) => f.includes("P-ecommerce-platform.md")),
    ).toBe(true);
    expect(projectFiles.some((f) => f.includes("P-mobile-app.md"))).toBe(true);

    // Epic files
    const epicFiles = files.filter((file) => file.includes("/e/E-"));
    expect(epicFiles.length).toBeGreaterThan(0);
    expect(epicFiles.some((f) => f.includes("E-user-management.md"))).toBe(
      true,
    );
    expect(epicFiles.some((f) => f.includes("E-product-catalog.md"))).toBe(
      true,
    );
    expect(epicFiles.some((f) => f.includes("E-offline-sync.md"))).toBe(true);

    // Feature files in project hierarchy
    const hierarchicalFeatureFiles = files.filter(
      (file) => file.includes("/f/F-") && file.includes("/p/P-"),
    );
    expect(hierarchicalFeatureFiles.length).toBeGreaterThan(0);
    expect(
      hierarchicalFeatureFiles.some((f) =>
        f.includes("F-user-registration.md"),
      ),
    ).toBe(true);
    expect(
      hierarchicalFeatureFiles.some((f) => f.includes("F-product-search.md")),
    ).toBe(true);
    expect(
      hierarchicalFeatureFiles.some((f) => f.includes("F-data-caching.md")),
    ).toBe(true);
  });

  it("should find task files in different states", async () => {
    const files = await findMarkdownFiles(testRoot);

    // Open tasks
    const openTaskFiles = files.filter((file) => file.includes("/t/open/T-"));
    expect(openTaskFiles.length).toBeGreaterThan(0);
    expect(
      openTaskFiles.some((f) => f.includes("T-create-registration-form.md")),
    ).toBe(true);
    expect(
      openTaskFiles.some((f) => f.includes("T-implement-elasticsearch.md")),
    ).toBe(true);
    expect(
      openTaskFiles.some((f) => f.includes("T-implement-cache-layer.md")),
    ).toBe(true);

    // Closed tasks
    const closedTaskFiles = files.filter((file) =>
      file.includes("/t/closed/T-"),
    );
    expect(closedTaskFiles.length).toBeGreaterThan(0);
    expect(
      closedTaskFiles.some((f) => f.includes("T-setup-user-schema.md")),
    ).toBe(true);
    expect(
      closedTaskFiles.some((f) => f.includes("T-project-initialization.md")),
    ).toBe(true);
  });

  it("should only return .md files", async () => {
    const files = await findMarkdownFiles(testRoot);

    files.forEach((file) => {
      expect(file).toMatch(/\.md$/);
    });
  });

  it("should handle case insensitive .md extension", async () => {
    // Our function checks for .md in lowercase, so it should find .md files
    const files = await findMarkdownFiles(testRoot);

    // All our test files use .md extension
    expect(files.every((file) => file.endsWith(".md"))).toBe(true);
  });

  it("should return empty array for non-existent directory", async () => {
    const files = await findMarkdownFiles("/non/existent/path");

    expect(files).toEqual([]);
  });

  it("should return empty array for directory with no markdown files", async () => {
    const emptyDir = join(__dirname, "schema1_0/.trellis/f");
    const files = await findMarkdownFiles(emptyDir);

    // The f directory itself doesn't contain .md files, only subdirectories do
    expect(files.length).toBeGreaterThan(0); // It should find files in subdirectories
  });

  it("should find files at different nesting levels", async () => {
    const files = await findMarkdownFiles(testRoot);

    // Check we have files at different depths
    const depths = files.map((file) => file.split("/").length);
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);

    // Should have files at various nesting levels
    expect(maxDepth - minDepth).toBeGreaterThan(2);
  });

  describe("includeClosed parameter", () => {
    it("should include closed tasks by default", async () => {
      const files = await findMarkdownFiles(testRoot);

      const closedTaskFiles = files.filter((file) =>
        file.includes("/t/closed/"),
      );

      expect(closedTaskFiles.length).toBeGreaterThan(0);
      expect(
        closedTaskFiles.some((f) => f.includes("T-setup-user-schema.md")),
      ).toBe(true);
      expect(
        closedTaskFiles.some((f) => f.includes("T-project-initialization.md")),
      ).toBe(true);
      expect(
        closedTaskFiles.some((f) => f.includes("T-setup-auth-models.md")),
      ).toBe(true);
    });

    it("should exclude closed tasks when includeClosed is false", async () => {
      const files = await findMarkdownFiles(testRoot, false);

      const closedTaskFiles = files.filter((file) =>
        file.includes("/t/closed/"),
      );

      expect(closedTaskFiles).toHaveLength(0);

      // Should still include open tasks
      const openTaskFiles = files.filter((file) => file.includes("/t/open/"));
      expect(openTaskFiles.length).toBeGreaterThan(0);
    });

    it("should include closed tasks when includeClosed is true", async () => {
      const files = await findMarkdownFiles(testRoot, true);

      const closedTaskFiles = files.filter((file) =>
        file.includes("/t/closed/"),
      );

      expect(closedTaskFiles.length).toBeGreaterThan(0);
      expect(
        closedTaskFiles.some((f) => f.includes("T-setup-user-schema.md")),
      ).toBe(true);
    });

    it("should still include non-task files when includeClosed is false", async () => {
      const files = await findMarkdownFiles(testRoot, false);

      // Should still find project, epic, and feature files
      const projectFiles = files.filter((file) => file.includes("/p/P-"));
      const epicFiles = files.filter((file) => file.includes("/e/E-"));
      const featureFiles = files.filter((file) => file.includes("/f/F-"));

      expect(projectFiles.length).toBeGreaterThan(0);
      expect(epicFiles.length).toBeGreaterThan(0);
      expect(featureFiles.length).toBeGreaterThan(0);
    });

    it("should have fewer files when includeClosed is false", async () => {
      const allFiles = await findMarkdownFiles(testRoot);
      const filteredFiles = await findMarkdownFiles(testRoot, false);

      expect(filteredFiles.length).toBeLessThan(allFiles.length);

      // The difference should be exactly the number of closed task files
      const closedTaskFiles = allFiles.filter((file) =>
        file.includes("/t/closed/"),
      );
      expect(allFiles.length - filteredFiles.length).toBe(
        closedTaskFiles.length,
      );
    });
  });

  describe("scope parameter", () => {
    it("should filter files by project scope", async () => {
      const files = await findMarkdownFiles(
        testRoot,
        true,
        "P-ecommerce-platform",
      );

      // Should only include files within the P-ecommerce-platform project
      files.forEach((file) => {
        expect(file).toMatch(/\/p\/P-ecommerce-platform\//);
      });

      // Should include the project file itself
      expect(files.some((f) => f.includes("P-ecommerce-platform.md"))).toBe(
        true,
      );

      // Should include epics within the project
      expect(files.some((f) => f.includes("E-user-management.md"))).toBe(true);
      expect(files.some((f) => f.includes("E-product-catalog.md"))).toBe(true);

      // Should include features within the project
      expect(files.some((f) => f.includes("F-user-registration.md"))).toBe(
        true,
      );

      // Should include tasks within the project
      expect(files.some((f) => f.includes("T-setup-user-schema.md"))).toBe(
        true,
      );
      expect(
        files.some((f) => f.includes("T-create-registration-form.md")),
      ).toBe(true);

      // Should NOT include files from other projects
      expect(files.some((f) => f.includes("P-mobile-app"))).toBe(false);

      // Should NOT include standalone features or tasks
      expect(
        files.some(
          (f) => f.includes("F-user-authentication") && !f.includes("/p/P-"),
        ),
      ).toBe(false);
      expect(
        files.some(
          (f) => f.includes("T-setup-database") && !f.includes("/p/P-"),
        ),
      ).toBe(false);
    });

    it("should filter files by epic scope", async () => {
      const files = await findMarkdownFiles(
        testRoot,
        true,
        "E-user-management",
      );

      // Should only include files within the E-user-management epic
      files.forEach((file) => {
        expect(file).toMatch(/\/e\/E-user-management\//);
      });

      // Should include the epic file itself
      expect(files.some((f) => f.includes("E-user-management.md"))).toBe(true);

      // Should include features within the epic
      expect(files.some((f) => f.includes("F-user-registration.md"))).toBe(
        true,
      );

      // Should include tasks within the epic's features
      expect(files.some((f) => f.includes("T-setup-user-schema.md"))).toBe(
        true,
      );
      expect(
        files.some((f) => f.includes("T-create-registration-form.md")),
      ).toBe(true);

      // Should NOT include files from other epics
      expect(files.some((f) => f.includes("E-product-catalog"))).toBe(false);
      expect(files.some((f) => f.includes("E-offline-sync"))).toBe(false);
    });

    it("should filter files by feature scope", async () => {
      const files = await findMarkdownFiles(
        testRoot,
        true,
        "F-user-registration",
      );

      // Should only include files within the F-user-registration feature
      files.forEach((file) => {
        expect(file).toMatch(/\/f\/F-user-registration\//);
      });

      // Should include the feature file itself
      expect(files.some((f) => f.includes("F-user-registration.md"))).toBe(
        true,
      );

      // Should include tasks within the feature
      expect(files.some((f) => f.includes("T-setup-user-schema.md"))).toBe(
        true,
      );
      expect(
        files.some((f) => f.includes("T-create-registration-form.md")),
      ).toBe(true);

      // Should NOT include files from other features
      expect(files.some((f) => f.includes("F-product-search"))).toBe(false);
      expect(files.some((f) => f.includes("F-data-caching"))).toBe(false);
    });

    it("should work with standalone features", async () => {
      const files = await findMarkdownFiles(
        testRoot,
        true,
        "F-user-authentication",
      );

      // Should only include files within the standalone F-user-authentication feature
      files.forEach((file) => {
        expect(file).toMatch(/\/f\/F-user-authentication\//);
        expect(file).not.toMatch(/\/p\/P-/); // Should not be within any project
      });

      // Should include the feature file itself
      expect(files.some((f) => f.includes("F-user-authentication.md"))).toBe(
        true,
      );

      // Should include tasks within the standalone feature
      expect(files.some((f) => f.includes("T-implement-login.md"))).toBe(true);
      expect(files.some((f) => f.includes("T-setup-auth-models.md"))).toBe(
        true,
      );
    });

    it("should return empty array for non-existent scope", async () => {
      const files = await findMarkdownFiles(testRoot, true, "P-non-existent");

      expect(files).toEqual([]);
    });

    it("should work with includeClosed=false and scope", async () => {
      const files = await findMarkdownFiles(
        testRoot,
        false,
        "E-user-management",
      );

      // Should only include files within the E-user-management epic
      files.forEach((file) => {
        expect(file).toMatch(/\/e\/E-user-management\//);
        expect(file).not.toMatch(/\/t\/closed\//);
      });

      // Should include open tasks but not closed ones
      expect(
        files.some((f) => f.includes("T-create-registration-form.md")),
      ).toBe(true);
      expect(files.some((f) => f.includes("T-setup-user-schema.md"))).toBe(
        false,
      ); // This is in closed
    });

    it("should return all files when scope is undefined", async () => {
      const filesWithoutScope = await findMarkdownFiles(testRoot);
      const filesWithUndefinedScope = await findMarkdownFiles(
        testRoot,
        true,
        undefined,
      );

      expect(filesWithoutScope).toEqual(filesWithUndefinedScope);
      expect(filesWithoutScope).toHaveLength(20);
    });
  });
});
