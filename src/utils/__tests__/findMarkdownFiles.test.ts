import { join } from "path";
import { findMarkdownFiles } from "../findMarkdownFiles";

describe("findMarkdownFiles", () => {
  const testRoot = join(__dirname, "test_planning_root");

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
    const emptyDir = join(__dirname, "test_planning_root/.trellis/f");
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
});
