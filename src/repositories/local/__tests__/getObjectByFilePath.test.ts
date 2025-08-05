import { getObjectByFilePath } from "../getObjectByFilePath";
import {
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../../models";
import path from "path";

describe("getObjectByFilePath", () => {
  const testDataRoot = path.join(__dirname, "schema1_0", ".trellis");

  describe("successful deserialization", () => {
    it("should deserialize a task object correctly", async () => {
      const filePath = path.join(
        testDataRoot,
        "t",
        "open",
        "T-setup-database.md",
      );

      const result = await getObjectByFilePath(filePath);

      expect(result).toEqual({
        id: "T-setup-database",
        type: TrellisObjectType.TASK,
        title: "Setup Database Connection",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: expect.stringContaining("Configure the database connection"),
      });
    });

    it("should deserialize a feature object correctly", async () => {
      const filePath = path.join(
        testDataRoot,
        "f",
        "F-user-authentication",
        "F-user-authentication.md",
      );

      const result = await getObjectByFilePath(filePath);

      expect(result).toEqual({
        id: "F-user-authentication",
        type: TrellisObjectType.FEATURE,
        title: "User Authentication Feature",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: expect.stringContaining(
          "Implement comprehensive user authentication",
        ),
      });
    });

    it("should deserialize a closed/completed task correctly", async () => {
      const filePath = path.join(
        testDataRoot,
        "t",
        "closed",
        "T-project-initialization.md",
      );

      const result = await getObjectByFilePath(filePath);

      expect(result).toEqual({
        id: "T-project-initialization",
        type: TrellisObjectType.TASK,
        title: "Project Initialization",
        status: TrellisObjectStatus.DONE,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "v1.0",
        childrenIds: [],
        body: expect.stringContaining("Initialize the project structure"),
      });
    });
  });

  describe("error handling", () => {
    it("should throw error for non-existent file", async () => {
      const filePath = path.join(testDataRoot, "non-existent-file.md");

      await expect(getObjectByFilePath(filePath)).rejects.toThrow();
    });

    it("should throw error for invalid markdown file", async () => {
      // Create a temporary invalid file path (this will fail at file read level)
      const filePath = path.join(testDataRoot, "invalid-file.md");

      await expect(getObjectByFilePath(filePath)).rejects.toThrow();
    });
  });

  describe("different object types", () => {
    it("should handle nested task within feature correctly", async () => {
      const filePath = path.join(
        testDataRoot,
        "f",
        "F-user-authentication",
        "t",
        "open",
        "T-implement-login.md",
      );

      const result = await getObjectByFilePath(filePath);

      expect(result.id).toBe("T-implement-login");
      expect(result.type).toBe(TrellisObjectType.TASK);
      expect(result.title).toBeTruthy();
      expect(result.status).toBeDefined();
      expect(result.priority).toBeDefined();
    });

    it("should handle closed task within feature correctly", async () => {
      const filePath = path.join(
        testDataRoot,
        "f",
        "F-user-authentication",
        "t",
        "closed",
        "T-setup-auth-models.md",
      );

      const result = await getObjectByFilePath(filePath);

      expect(result.id).toBe("T-setup-auth-models");
      expect(result.type).toBe(TrellisObjectType.TASK);
      expect(result.title).toBeTruthy();
      expect(result.status).toBeDefined();
      expect(result.priority).toBeDefined();
    });
  });
});
