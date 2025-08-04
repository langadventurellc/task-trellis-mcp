import { extractMarkdownIds } from "../extractMarkdownIds";

describe("extractMarkdownIds", () => {
  it("should extract project IDs from project file paths", () => {
    const filePaths = [
      ".trellis/p/P-my-project/P-my-project.md",
      ".trellis/p/P-another-project/P-another-project.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["P-another-project", "P-my-project"]);
  });

  it("should extract epic IDs from epic file paths", () => {
    const filePaths = [
      ".trellis/p/P-my-project/e/E-my-epic/E-my-epic.md",
      ".trellis/p/P-project/e/E-another-epic/E-another-epic.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["E-another-epic", "E-my-epic"]);
  });

  it("should extract feature IDs from feature file paths", () => {
    const filePaths = [
      ".trellis/p/P-project/e/E-epic/f/F-user-auth/F-user-auth.md",
      ".trellis/f/F-api-documentation/F-api-documentation.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["F-api-documentation", "F-user-auth"]);
  });

  it("should extract task IDs from various task locations", () => {
    const filePaths = [
      // Hierarchical tasks
      ".trellis/p/P-project/e/E-epic/f/F-feature/t/open/T-login-form.md",
      // Feature tasks
      ".trellis/f/F-user-auth/t/open/T-implement-login.md",
      // Standalone tasks
      ".trellis/t/open/T-setup-database.md",
      ".trellis/t/closed/T-project-initialization.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual([
      "T-implement-login",
      "T-login-form",
      "T-project-initialization",
      "T-setup-database",
    ]);
  });

  it("should extract mixed IDs from various file paths", () => {
    const filePaths = [
      ".trellis/p/P-my-project/P-my-project.md",
      ".trellis/p/P-my-project/e/E-my-epic/E-my-epic.md",
      ".trellis/p/P-my-project/e/E-my-epic/f/F-user-auth/F-user-auth.md",
      ".trellis/p/P-my-project/e/E-my-epic/f/F-user-auth/t/open/T-login-form.md",
      ".trellis/f/F-api-docs/F-api-docs.md",
      ".trellis/t/open/T-setup-database.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual([
      "E-my-epic",
      "F-api-docs",
      "F-user-auth",
      "P-my-project",
      "T-login-form",
      "T-setup-database",
    ]);
  });

  it("should ignore files that don't match the Trellis naming convention", () => {
    const filePaths = [
      ".trellis/p/P-my-project/P-my-project.md", // valid
      ".trellis/p/P-my-project/README.md", // invalid - no prefix
      ".trellis/p/P-my-project/e/E-epic/some-file.md", // invalid - no prefix
      ".trellis/p/P-my-project/e/E-epic/E-epic.md", // valid
      "docs/documentation.md", // invalid - no prefix
      ".trellis/invalid-prefix.md", // invalid - no prefix
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["E-epic", "P-my-project"]);
  });

  it("should handle absolute file paths", () => {
    const filePaths = [
      "/home/user/planning/.trellis/p/P-my-project/P-my-project.md",
      "/home/user/planning/.trellis/t/open/T-setup-auth.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["P-my-project", "T-setup-auth"]);
  });

  it("should return empty array for empty input", () => {
    const result = extractMarkdownIds([]);

    expect(result).toEqual([]);
  });

  it("should return empty array when no valid IDs found", () => {
    const filePaths = [
      "docs/README.md",
      "src/index.ts",
      "package.json",
      ".trellis/invalid-file.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual([]);
  });

  it("should handle Windows-style paths", () => {
    const filePaths = [
      ".trellis\\p\\P-my-project\\P-my-project.md",
      ".trellis\\t\\open\\T-setup-auth.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["P-my-project", "T-setup-auth"]);
  });

  it("should sort the results alphabetically", () => {
    const filePaths = [
      ".trellis/p/P-zebra/P-zebra.md",
      ".trellis/p/P-alpha/P-alpha.md",
      ".trellis/p/P-beta/P-beta.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual(["P-alpha", "P-beta", "P-zebra"]);
  });

  it("should handle real test data structure", () => {
    const filePaths = [
      ".trellis/p/P-ecommerce-platform/P-ecommerce-platform.md",
      ".trellis/p/P-mobile-app/P-mobile-app.md",
      ".trellis/f/F-user-authentication/F-user-authentication.md",
      ".trellis/t/open/T-setup-database.md",
      ".trellis/t/closed/T-project-initialization.md",
    ];

    const result = extractMarkdownIds(filePaths);

    expect(result).toEqual([
      "F-user-authentication",
      "P-ecommerce-platform",
      "P-mobile-app",
      "T-project-initialization",
      "T-setup-database",
    ]);
  });
});
