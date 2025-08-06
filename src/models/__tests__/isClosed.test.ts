import { isClosed } from "../isClosed";
import { TrellisObject } from "../TrellisObject";
import { TrellisObjectStatus } from "../TrellisObjectStatus";
import { TrellisObjectType } from "../TrellisObjectType";
import { TrellisObjectPriority } from "../TrellisObjectPriority";

describe("isClosed", () => {
  const createMockObject = (status: TrellisObjectStatus): TrellisObject => ({
    id: "test-id",
    type: TrellisObjectType.TASK,
    title: "Test Object",
    status,
    priority: TrellisObjectPriority.MEDIUM,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "Test body",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
  });

  describe("closed states", () => {
    it("should return true for DONE status", () => {
      const object = createMockObject(TrellisObjectStatus.DONE);
      expect(isClosed(object)).toBe(true);
    });

    it("should return true for WONT_DO status", () => {
      const object = createMockObject(TrellisObjectStatus.WONT_DO);
      expect(isClosed(object)).toBe(true);
    });
  });

  describe("open states", () => {
    it("should return false for DRAFT status", () => {
      const object = createMockObject(TrellisObjectStatus.DRAFT);
      expect(isClosed(object)).toBe(false);
    });

    it("should return false for OPEN status", () => {
      const object = createMockObject(TrellisObjectStatus.OPEN);
      expect(isClosed(object)).toBe(false);
    });

    it("should return false for IN_PROGRESS status", () => {
      const object = createMockObject(TrellisObjectStatus.IN_PROGRESS);
      expect(isClosed(object)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should work with different object types", () => {
      const projectObject: TrellisObject = {
        id: "P-test-project",
        type: TrellisObjectType.PROJECT,
        title: "Test Project",
        status: TrellisObjectStatus.DONE,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "1.0",
        childrenIds: [],
        body: "Test project body",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      expect(isClosed(projectObject)).toBe(true);
    });

    it("should handle objects with various properties", () => {
      const complexObject: TrellisObject = {
        id: "T-complex-task",
        type: TrellisObjectType.TASK,
        title: "Complex Task",
        status: TrellisObjectStatus.WONT_DO,
        priority: TrellisObjectPriority.LOW,
        parent: "F-parent-feature",
        prerequisites: ["T-prereq-1", "T-prereq-2"],
        affectedFiles: new Map([
          ["file1.ts", "modified"],
          ["file2.ts", "added"],
        ]),
        log: ["Created task", "Updated status"],
        schema: "1.0",
        childrenIds: ["T-child-1"],
        body: "Complex task with many properties",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      expect(isClosed(complexObject)).toBe(true);
    });
  });
});
