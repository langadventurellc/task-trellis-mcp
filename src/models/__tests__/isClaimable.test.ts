import { isClaimable } from "../isClaimable";
import { TrellisObject } from "../TrellisObject";
import { TrellisObjectPriority } from "../TrellisObjectPriority";
import { TrellisObjectStatus } from "../TrellisObjectStatus";
import { TrellisObjectType } from "../TrellisObjectType";

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
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    parent: null,
  });

  describe("claimable states", () => {
    it("should return true for OPEN status", () => {
      const object = createMockObject(TrellisObjectStatus.OPEN);
      expect(isClaimable(object)).toBe(true);
    });
  });

  describe("non-claimable states", () => {
    it("should return true for DRAFT status", () => {
      const object = createMockObject(TrellisObjectStatus.DRAFT);
      expect(isClaimable(object)).toBe(false);
    });

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
});
