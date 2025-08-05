import { isClaimable } from "../isClaimable";
import { TrellisObject } from "../TrellisObject";
import { TrellisObjectStatus } from "../TrellisObjectStatus";
import { TrellisObjectType } from "../TrellisObjectType";
import { TrellisObjectPriority } from "../TrellisObjectPriority";

describe("isClaimable", () => {
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
  });

  describe("claimable states", () => {
    it("should return true for DRAFT status", () => {
      const object = createMockObject(TrellisObjectStatus.DRAFT);
      expect(isClaimable(object)).toBe(true);
    });

    it("should return true for OPEN status", () => {
      const object = createMockObject(TrellisObjectStatus.OPEN);
      expect(isClaimable(object)).toBe(true);
    });
  });

  describe("non-claimable states", () => {
    it("should return false for IN_PROGRESS status", () => {
      const object = createMockObject(TrellisObjectStatus.IN_PROGRESS);
      expect(isClaimable(object)).toBe(false);
    });

    it("should return false for DONE status", () => {
      const object = createMockObject(TrellisObjectStatus.DONE);
      expect(isClaimable(object)).toBe(false);
    });

    it("should return false for WONT_DO status", () => {
      const object = createMockObject(TrellisObjectStatus.WONT_DO);
      expect(isClaimable(object)).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should work with different object types", () => {
      const featureObject: TrellisObject = {
        id: "F-test-feature",
        type: TrellisObjectType.FEATURE,
        title: "Test Feature",
        status: TrellisObjectStatus.OPEN,
        priority: TrellisObjectPriority.HIGH,
        prerequisites: [],
        affectedFiles: new Map(),
        log: [],
        schema: "1.0",
        childrenIds: [],
        body: "Test feature body",
      };

      expect(isClaimable(featureObject)).toBe(true);
    });

    it("should handle objects with various properties in draft state", () => {
      const complexObject: TrellisObject = {
        id: "T-complex-task",
        type: TrellisObjectType.TASK,
        title: "Complex Task",
        status: TrellisObjectStatus.DRAFT,
        priority: TrellisObjectPriority.LOW,
        parent: "F-parent-feature",
        prerequisites: ["T-prereq-1", "T-prereq-2"],
        affectedFiles: new Map([
          ["file1.ts", "created"],
          ["file2.ts", "modified"],
        ]),
        log: ["Task created", "Requirements added"],
        schema: "1.0",
        childrenIds: [],
        body: "Complex task in draft state",
      };

      expect(isClaimable(complexObject)).toBe(true);
    });

    it("should handle objects with various properties in non-claimable state", () => {
      const complexObject: TrellisObject = {
        id: "T-active-task",
        type: TrellisObjectType.TASK,
        title: "Active Task",
        status: TrellisObjectStatus.IN_PROGRESS,
        priority: TrellisObjectPriority.HIGH,
        parent: "F-parent-feature",
        prerequisites: [],
        affectedFiles: new Map([["implementation.ts", "modified"]]),
        log: ["Task claimed", "Work started"],
        schema: "1.0",
        childrenIds: [],
        body: "Task currently being worked on",
      };

      expect(isClaimable(complexObject)).toBe(false);
    });
  });
});
