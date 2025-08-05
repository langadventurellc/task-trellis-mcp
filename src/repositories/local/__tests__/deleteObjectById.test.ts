import { join } from "path";
import { cp, rm, access, readdir, writeFile } from "fs/promises";
import { constants } from "fs";
import { TrellisObjectType } from "../../../models";
import { deleteObjectById } from "../deleteObjectById";
import { getObjectById } from "../getObjectById";

describe("deleteObjectById - Integration Tests", () => {
  const sourceSchemaPath = join(__dirname, "schema1_0");
  const tempPath = join(__dirname, "temp");
  const testPlanningRoot = join(tempPath, ".trellis");

  beforeEach(async () => {
    // Clean up temp directory if it exists
    try {
      await rm(tempPath, { recursive: true, force: true });
    } catch {
      // Directory doesn't exist, which is fine
    }

    // Copy schema1_0 to temp directory for testing
    await cp(sourceSchemaPath, tempPath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory after each test
    try {
      await rm(tempPath, { recursive: true, force: true });
    } catch {
      // Directory might not exist, which is fine
    }
  });

  describe("Task deletion", () => {
    it("should delete a standalone task file", async () => {
      // Verify the task exists first
      const task = await getObjectById("T-setup-database", testPlanningRoot);
      expect(task).not.toBeNull();
      expect(task!.type).toBe(TrellisObjectType.TASK);

      // Delete the task
      await deleteObjectById("T-setup-database", testPlanningRoot);

      // Verify the task no longer exists
      const result = await getObjectById("T-setup-database", testPlanningRoot);
      expect(result).toBeNull();
    });

    it("should delete a task within a feature folder", async () => {
      // Verify the task exists first
      const task = await getObjectById("T-implement-login", testPlanningRoot);
      expect(task).not.toBeNull();
      expect(task!.type).toBe(TrellisObjectType.TASK);

      // Delete the task
      await deleteObjectById("T-implement-login", testPlanningRoot);

      // Verify the task no longer exists
      const result = await getObjectById("T-implement-login", testPlanningRoot);
      expect(result).toBeNull();

      // Verify the feature folder still exists (only the task file should be deleted)
      const featureFolderPath = join(
        testPlanningRoot,
        "f",
        "F-user-authentication",
      );
      await expect(
        access(featureFolderPath, constants.F_OK),
      ).resolves.not.toThrow();
    });
  });

  describe("Feature deletion", () => {
    it("should delete a feature file and its associated folder", async () => {
      // Verify the feature exists first
      const feature = await getObjectById(
        "F-user-authentication",
        testPlanningRoot,
      );
      expect(feature).not.toBeNull();
      expect(feature!.type).toBe(TrellisObjectType.FEATURE);

      // Verify the feature folder exists
      const featureFolderPath = join(
        testPlanningRoot,
        "f",
        "F-user-authentication",
      );
      await expect(
        access(featureFolderPath, constants.F_OK),
      ).resolves.not.toThrow();

      // Delete the feature
      await deleteObjectById("F-user-authentication", testPlanningRoot);

      // Verify the feature no longer exists
      const result = await getObjectById(
        "F-user-authentication",
        testPlanningRoot,
      );
      expect(result).toBeNull();

      // Verify the feature folder no longer exists
      await expect(access(featureFolderPath, constants.F_OK)).rejects.toThrow();
    });

    it("should delete a nested feature and its folder", async () => {
      // Verify the nested feature exists first
      const feature = await getObjectById("F-product-search", testPlanningRoot);
      expect(feature).not.toBeNull();
      expect(feature!.type).toBe(TrellisObjectType.FEATURE);

      // Verify the feature folder exists
      const featureFolderPath = join(
        testPlanningRoot,
        "p",
        "P-ecommerce-platform",
        "e",
        "E-product-catalog",
        "f",
        "F-product-search",
      );
      await expect(
        access(featureFolderPath, constants.F_OK),
      ).resolves.not.toThrow();

      // Delete the feature
      await deleteObjectById("F-product-search", testPlanningRoot);

      // Verify the feature no longer exists
      const result = await getObjectById("F-product-search", testPlanningRoot);
      expect(result).toBeNull();

      // Verify the feature folder no longer exists
      await expect(access(featureFolderPath, constants.F_OK)).rejects.toThrow();

      // Verify the parent epic folder still exists
      const epicFolderPath = join(
        testPlanningRoot,
        "p",
        "P-ecommerce-platform",
        "e",
        "E-product-catalog",
      );
      await expect(
        access(epicFolderPath, constants.F_OK),
      ).resolves.not.toThrow();
    });
  });

  describe("Epic deletion", () => {
    it("should delete an epic file and its associated folder with all contents", async () => {
      // Verify the epic exists first
      const epic = await getObjectById("E-product-catalog", testPlanningRoot);
      expect(epic).not.toBeNull();
      expect(epic!.type).toBe(TrellisObjectType.EPIC);

      // Verify the epic folder exists and has contents
      const epicFolderPath = join(
        testPlanningRoot,
        "p",
        "P-ecommerce-platform",
        "e",
        "E-product-catalog",
      );
      await expect(
        access(epicFolderPath, constants.F_OK),
      ).resolves.not.toThrow();

      const epicContents = await readdir(epicFolderPath);
      expect(epicContents.length).toBeGreaterThan(0);

      // Delete the epic
      await deleteObjectById("E-product-catalog", testPlanningRoot);

      // Verify the epic no longer exists
      const result = await getObjectById("E-product-catalog", testPlanningRoot);
      expect(result).toBeNull();

      // Verify the epic folder no longer exists
      await expect(access(epicFolderPath, constants.F_OK)).rejects.toThrow();

      // Verify the parent project folder still exists
      const projectFolderPath = join(
        testPlanningRoot,
        "p",
        "P-ecommerce-platform",
      );
      await expect(
        access(projectFolderPath, constants.F_OK),
      ).resolves.not.toThrow();
    });
  });

  describe("Project deletion", () => {
    it("should delete a project file and its associated folder with all contents", async () => {
      // Verify the project exists first
      const project = await getObjectById(
        "P-ecommerce-platform",
        testPlanningRoot,
      );
      expect(project).not.toBeNull();
      expect(project!.type).toBe(TrellisObjectType.PROJECT);

      // Verify the project folder exists and has contents
      const projectFolderPath = join(
        testPlanningRoot,
        "p",
        "P-ecommerce-platform",
      );
      await expect(
        access(projectFolderPath, constants.F_OK),
      ).resolves.not.toThrow();

      const projectContents = await readdir(projectFolderPath);
      expect(projectContents.length).toBeGreaterThan(0);

      // Delete the project
      await deleteObjectById("P-ecommerce-platform", testPlanningRoot);

      // Verify the project no longer exists
      const result = await getObjectById(
        "P-ecommerce-platform",
        testPlanningRoot,
      );
      expect(result).toBeNull();

      // Verify the project folder no longer exists
      await expect(access(projectFolderPath, constants.F_OK)).rejects.toThrow();

      // Verify the parent projects folder still exists
      const projectsRootPath = join(testPlanningRoot, "p");
      await expect(
        access(projectsRootPath, constants.F_OK),
      ).resolves.not.toThrow();
    });
  });

  describe("Force parameter functionality", () => {
    beforeEach(async () => {
      // Create test objects with prerequisite relationships
      const taskWithPrerequisite = `---
id: T-dependent-task
title: Dependent Task
status: open
priority: medium
schema: v1.0
prerequisites:
  - T-setup-database
parent: F-user-authentication
created: 2025-01-15T14:00:00Z
updated: 2025-01-15T14:00:00Z
---

# Dependent Task

This task depends on T-setup-database.
`;

      await writeFile(
        join(
          testPlanningRoot,
          "f",
          "F-user-authentication",
          "t",
          "open",
          "T-dependent-task.md",
        ),
        taskWithPrerequisite,
      );
    });

    it("should throw error when trying to delete object required by others without force", async () => {
      // Try to delete T-setup-database which is required by T-dependent-task
      await expect(
        deleteObjectById("T-setup-database", testPlanningRoot),
      ).rejects.toThrow(
        "Cannot delete object T-setup-database because it is required by other objects. Use force=true to override.",
      );

      // Verify the object still exists
      const task = await getObjectById("T-setup-database", testPlanningRoot);
      expect(task).not.toBeNull();
    });

    it("should delete object required by others when force=true", async () => {
      // Verify the prerequisite relationship exists
      const dependentTask = await getObjectById(
        "T-dependent-task",
        testPlanningRoot,
      );
      expect(dependentTask).not.toBeNull();
      expect(dependentTask!.prerequisites).toContain("T-setup-database");

      // Delete T-setup-database with force=true
      await deleteObjectById("T-setup-database", testPlanningRoot, true);

      // Verify the object no longer exists
      const result = await getObjectById("T-setup-database", testPlanningRoot);
      expect(result).toBeNull();
    });

    it("should delete object not required by others without force parameter", async () => {
      // Delete a task that has no dependencies (T-dependent-task doesn't depend on T-implement-login)
      await deleteObjectById("T-implement-login", testPlanningRoot);

      // Verify the task no longer exists
      const result = await getObjectById("T-implement-login", testPlanningRoot);
      expect(result).toBeNull();
    });

    it("should delete object not required by others with force=false", async () => {
      // Delete a task that has no dependencies with explicit force=false
      await deleteObjectById("T-implement-login", testPlanningRoot, false);

      // Verify the task no longer exists
      const result = await getObjectById("T-implement-login", testPlanningRoot);
      expect(result).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should throw an error when trying to delete a non-existent object", async () => {
      await expect(
        deleteObjectById("non-existent-id", testPlanningRoot),
      ).rejects.toThrow("No object found with ID: non-existent-id");
    });

    it("should throw an error when planning root does not exist", async () => {
      await expect(
        deleteObjectById("T-setup-database", "/non/existent/path"),
      ).rejects.toThrow();
    });
  });

  describe("Folder structure integrity", () => {
    it("should not affect other objects when deleting one object", async () => {
      // Verify multiple objects exist
      const project = await getObjectById(
        "P-ecommerce-platform",
        testPlanningRoot,
      );
      const otherProject = await getObjectById(
        "P-mobile-app",
        testPlanningRoot,
      );
      const task = await getObjectById("T-setup-database", testPlanningRoot);

      expect(project).toBeDefined();
      expect(otherProject).toBeDefined();
      expect(task).toBeDefined();

      // Delete one project
      await deleteObjectById("P-ecommerce-platform", testPlanningRoot);

      // Verify other objects still exist
      const mobileApp = await getObjectById("P-mobile-app", testPlanningRoot);
      expect(mobileApp).not.toBeNull();
      const taskAgain = await getObjectById(
        "T-setup-database",
        testPlanningRoot,
      );
      expect(taskAgain).not.toBeNull();

      // Verify the deleted project is gone
      const result = await getObjectById(
        "P-ecommerce-platform",
        testPlanningRoot,
      );
      expect(result).toBeNull();
    });
  });
});
