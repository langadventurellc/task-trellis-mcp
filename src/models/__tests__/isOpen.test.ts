import { isOpen } from "../isOpen";
import { TrellisObject } from "../TrellisObject";
import { TrellisObjectPriority } from "../TrellisObjectPriority";
import { TrellisObjectStatus } from "../TrellisObjectStatus";
import { TrellisObjectType } from "../TrellisObjectType";

describe("isOpen", () => {
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
    parent: null,
  });

  describe("open states", () => {
    it("should return true for DRAFT status", () => {
      const object = createMockObject(TrellisObjectStatus.DRAFT);
      expect(isOpen(object)).toBe(true);
    });

    it("should return true for OPEN status", () => {
      const object = createMockObject(TrellisObjectStatus.OPEN);
      expect(isOpen(object)).toBe(true);
    });

    it("should return true for IN_PROGRESS status", () => {
      const object = createMockObject(TrellisObjectStatus.IN_PROGRESS);
      expect(isOpen(object)).toBe(true);
    });
  });

  describe("closed states", () => {
    it("should return false for DONE status", () => {
      const object = createMockObject(TrellisObjectStatus.DONE);
      expect(isOpen(object)).toBe(false);
    });

    it("should return false for WONT_DO status", () => {
      const object = createMockObject(TrellisObjectStatus.WONT_DO);
      expect(isOpen(object)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should work with different object types", () => {
      const epicObject: TrellisObject = {
        id: "E-test-epic",
        type: TrellisObjectType.EPIC,
        title: "Test Epic",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.HIGH,
        parent: null,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "1.0",
        childrenIds: [],
        body: "Test epic body",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      expect(isOpen(epicObject)).toBe(true);
    });

    it("should handle objects with various properties", () => {
      const complexObject: TrellisObject = {
        id: "F-complex-feature",
        type: TrellisObjectType.FEATURE,
        title: "Complex Feature",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.LOW,
        parent: "E-parent-epic",
        prerequisites: ["F-prereq-1", "F-prereq-2"],
        affectedFiles: new Map([
          ["feature.ts", "modified"],
          ["test.ts", "added"],
        ]),
        log: ["Created feature", "Started development"],
        schema: "1.0",
        childrenIds: ["T-child-1", "T-child-2"],
        body: "Complex feature with many properties",
        created: "2025-01-15T10:00:00Z",
        updated: "2025-01-15T10:00:00Z",
      };

      expect(isOpen(complexObject)).toBe(true);
    });
  });
});
