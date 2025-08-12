import {
  McpTestClient,
  TestEnvironment,
  createObjectContent,
  createObjectFile,
  readObjectFile,
  type ObjectData,
} from "../utils";

describe("E2E Workflow - appendModifiedFiles", () => {
  let testEnv: TestEnvironment;
  let client: McpTestClient;

  beforeEach(async () => {
    testEnv = new TestEnvironment();
    testEnv.setup();
    client = new McpTestClient(testEnv.projectRoot);
    await client.connect();
    await client.callTool("activate", {
      mode: "local",
      projectRoot: testEnv.projectRoot,
    });
  }, 30000);

  afterEach(async () => {
    await client?.disconnect();
    testEnv?.cleanup();
  });

  describe("Appending Modified Files to Different Object Types", () => {
    it("should append modified files to task", async () => {
      const taskData: ObjectData = {
        id: "T-files-test",
        title: "Files Test Task",
        status: "in-progress",
        priority: "medium",
        affectedFiles: {
          "existing.ts": "Original implementation",
        },
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-files-test",
        createObjectContent(taskData),
      );

      const result = await client.callTool("append_modified_files", {
        id: "T-files-test",
        filesChanged: {
          "src/components/Button.tsx": "Added new button component",
          "src/utils/helpers.ts": "Created utility functions",
        },
      });

      expect(result.content[0].text).toContain("Successfully appended");
      expect(result.content[0].text).toContain("2 modified files");
      expect(result.content[0].text).toContain("T-files-test");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-files-test.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "existing.ts": "Original implementation",
        "src/components/Button.tsx": "Added new button component",
        "src/utils/helpers.ts": "Created utility functions",
      });
    });

    it("should append modified files to project", async () => {
      const result = await client.callTool("create_object", {
        type: "project",
        title: "Files Test Project",
      });
      const projectId = result.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      const filesResult = await client.callTool("append_modified_files", {
        id: projectId,
        filesChanged: {
          "README.md": "Updated project documentation",
          "package.json": "Added new dependencies",
        },
      });

      expect(filesResult.content[0].text).toContain("Successfully appended");
      expect(filesResult.content[0].text).toContain("2 modified files");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/${projectId}.md`,
      );
      expect(file.yaml.affectedFiles).toEqual({
        "README.md": "Updated project documentation",
        "package.json": "Added new dependencies",
      });
    });

    it("should append modified files to epic", async () => {
      // Create project first
      const projectResult = await client.callTool("create_object", {
        type: "project",
        title: "Parent Project",
      });
      const projectId =
        projectResult.content[0].text.match(/ID: (P-[a-z-]+)/)![1];

      // Create epic
      const epicResult = await client.callTool("create_object", {
        type: "epic",
        title: "Files Test Epic",
        parent: projectId,
      });
      const epicId = epicResult.content[0].text.match(/ID: (E-[a-z-]+)/)![1];

      const filesResult = await client.callTool("append_modified_files", {
        id: epicId,
        filesChanged: {
          "src/features/auth/index.ts": "Authentication feature implementation",
        },
      });

      expect(filesResult.content[0].text).toContain("Successfully appended");
      expect(filesResult.content[0].text).toContain("1 modified file");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `p/${projectId}/e/${epicId}/${epicId}.md`,
      );
      expect(file.yaml.affectedFiles).toEqual({
        "src/features/auth/index.ts": "Authentication feature implementation",
      });
    });

    it("should append modified files to feature", async () => {
      const result = await client.callTool("create_object", {
        type: "feature",
        title: "Files Test Feature",
      });
      const featureId = result.content[0].text.match(/ID: (F-[a-z-]+)/)![1];

      const filesResult = await client.callTool("append_modified_files", {
        id: featureId,
        filesChanged: {
          "src/components/Modal.tsx": "Implemented modal component",
          "src/hooks/useModal.ts": "Custom hook for modal state",
          "tests/Modal.test.tsx": "Unit tests for modal component",
        },
      });

      expect(filesResult.content[0].text).toContain("Successfully appended");
      expect(filesResult.content[0].text).toContain("3 modified files");

      const file = await readObjectFile(
        testEnv.projectRoot,
        `f/${featureId}/${featureId}.md`,
      );
      expect(file.yaml.affectedFiles).toEqual({
        "src/components/Modal.tsx": "Implemented modal component",
        "src/hooks/useModal.ts": "Custom hook for modal state",
        "tests/Modal.test.tsx": "Unit tests for modal component",
      });
    });
  });

  describe("File Merging Behavior", () => {
    it("should merge descriptions for existing files", async () => {
      const taskData: ObjectData = {
        id: "T-merge-test",
        title: "Merge Test Task",
        status: "open",
        priority: "low",
        affectedFiles: {
          "src/utils/helpers.ts": "Initial helper functions",
          "src/components/Button.tsx": "Basic button component",
        },
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-merge-test",
        createObjectContent(taskData),
      );

      await client.callTool("append_modified_files", {
        id: "T-merge-test",
        filesChanged: {
          "src/utils/helpers.ts": "Added validation functions",
          "src/components/Input.tsx": "New input component",
        },
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-merge-test.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "src/utils/helpers.ts":
          "Initial helper functions; Added validation functions",
        "src/components/Button.tsx": "Basic button component",
        "src/components/Input.tsx": "New input component",
      });
    });

    it("should handle complex file paths and descriptions", async () => {
      const taskData: ObjectData = {
        id: "T-complex-paths",
        title: "Complex Paths Task",
        status: "in-progress",
        priority: "high",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-complex-paths",
        createObjectContent(taskData),
      );

      const complexFiles = {
        "src/components/forms/auth/LoginForm.tsx":
          "Implemented login form with validation & error handling",
        "tests/e2e/auth/login.spec.ts": "E2E tests for login flow",
        "docs/api/authentication.md": "API documentation for auth endpoints",
        "config/webpack.config.js":
          "Updated webpack config for new build process",
      };

      await client.callTool("append_modified_files", {
        id: "T-complex-paths",
        filesChanged: complexFiles,
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-complex-paths.md",
      );
      expect(file.yaml.affectedFiles).toEqual(complexFiles);
    });

    it("should preserve special characters in descriptions", async () => {
      const taskData: ObjectData = {
        id: "T-special-chars",
        title: "Special Characters Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-special-chars",
        createObjectContent(taskData),
      );

      const specialDescriptions = {
        "src/components/Modal.tsx":
          "Added modal with escape key handling & backdrop click",
        "src/styles/globals.css":
          "Updated CSS variables for theme switching; added dark mode support",
        "src/utils/api.ts":
          "API client with retry logic (3 attempts) & error handling",
      };

      await client.callTool("append_modified_files", {
        id: "T-special-chars",
        filesChanged: specialDescriptions,
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-special-chars.md",
      );
      expect(file.yaml.affectedFiles).toEqual(specialDescriptions);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty filesChanged object", async () => {
      const taskData: ObjectData = {
        id: "T-empty-files",
        title: "Empty Files Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-empty-files",
        createObjectContent(taskData),
      );

      const result = await client.callTool("append_modified_files", {
        id: "T-empty-files",
        filesChanged: {},
      });

      expect(result.content[0].text).toContain("Successfully appended");
      expect(result.content[0].text).toContain("0 modified files");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-empty-files.md",
      );
      expect(file.yaml.affectedFiles || {}).toEqual({});
    });

    it("should handle single file modification", async () => {
      const taskData: ObjectData = {
        id: "T-single-file",
        title: "Single File Task",
        status: "open",
        priority: "low",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-single-file",
        createObjectContent(taskData),
      );

      const result = await client.callTool("append_modified_files", {
        id: "T-single-file",
        filesChanged: {
          "CHANGELOG.md": "Added release notes for v1.2.0",
        },
      });

      expect(result.content[0].text).toContain("Successfully appended");
      expect(result.content[0].text).toContain("1 modified file");

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-single-file.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "CHANGELOG.md": "Added release notes for v1.2.0",
      });
    });

    it("should handle files with empty descriptions", async () => {
      const taskData: ObjectData = {
        id: "T-empty-descriptions",
        title: "Empty Descriptions Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-empty-descriptions",
        createObjectContent(taskData),
      );

      await client.callTool("append_modified_files", {
        id: "T-empty-descriptions",
        filesChanged: {
          "empty.ts": "",
          "normal.ts": "Normal description",
        },
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-empty-descriptions.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "empty.ts": "",
        "normal.ts": "Normal description",
      });
    });
  });

  describe("Error Handling", () => {
    it("should fail to append files to non-existent object", async () => {
      const result = await client.callTool("append_modified_files", {
        id: "T-nonexistent",
        filesChanged: {
          "test.ts": "This should fail",
        },
      });

      expect(result.content[0].text).toContain("not found");
    });

    it("should handle invalid object IDs", async () => {
      const result = await client.callTool("append_modified_files", {
        id: "invalid-id-format",
        filesChanged: {
          "test.ts": "Invalid ID test",
        },
      });

      expect(result.content[0].text).toContain("not found");
    });
  });

  describe("Multiple Operations", () => {
    it("should handle multiple sequential append operations", async () => {
      const taskData: ObjectData = {
        id: "T-sequential",
        title: "Sequential Operations Task",
        status: "in-progress",
        priority: "high",
        affectedFiles: {
          "initial.ts": "Initial file",
        },
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-sequential",
        createObjectContent(taskData),
      );

      // First append
      await client.callTool("append_modified_files", {
        id: "T-sequential",
        filesChanged: {
          "first.ts": "First modification",
          "initial.ts": "Updated initial file",
        },
      });

      // Second append
      await client.callTool("append_modified_files", {
        id: "T-sequential",
        filesChanged: {
          "second.ts": "Second modification",
          "first.ts": "Updated first file",
        },
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-sequential.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "initial.ts": "Initial file; Updated initial file",
        "first.ts": "First modification; Updated first file",
        "second.ts": "Second modification",
      });
    });

    it("should maintain affected files across different operations", async () => {
      const taskData: ObjectData = {
        id: "T-mixed-operations",
        title: "Mixed Operations Task",
        status: "open",
        priority: "medium",
      };
      await createObjectFile(
        testEnv.projectRoot,
        "task",
        "T-mixed-operations",
        createObjectContent(taskData),
      );

      // Append files
      await client.callTool("append_modified_files", {
        id: "T-mixed-operations",
        filesChanged: {
          "file1.ts": "First implementation",
        },
      });

      // Append log (should not affect files)
      await client.callTool("append_object_log", {
        id: "T-mixed-operations",
        contents: "Added initial implementation",
      });

      // Append more files
      await client.callTool("append_modified_files", {
        id: "T-mixed-operations",
        filesChanged: {
          "file2.ts": "Second implementation",
        },
      });

      const file = await readObjectFile(
        testEnv.projectRoot,
        "t/open/T-mixed-operations.md",
      );
      expect(file.yaml.affectedFiles).toEqual({
        "file1.ts": "First implementation",
        "file2.ts": "Second implementation",
      });
      expect(file.yaml.log).toContain("Added initial implementation");
    });
  });
});
