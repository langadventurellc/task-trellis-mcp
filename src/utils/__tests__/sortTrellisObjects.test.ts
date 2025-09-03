import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { sortTrellisObjects } from "../sortTrellisObjects";

describe("sortTrellisObjects", () => {
  const createMockObject = (
    id: string,
    priority: TrellisObjectPriority,
  ): TrellisObject => ({
    id,
    title: `Task ${id}`,
    status: TrellisObjectStatus.OPEN,
    priority,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    body: `Body for ${id}`,
    type: TrellisObjectType.TASK,
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    parent: null,
  });

  it("should sort objects by priority: high, medium, low", () => {
    const objects: TrellisObject[] = [
      createMockObject("low-1", TrellisObjectPriority.LOW),
      createMockObject("high-1", TrellisObjectPriority.HIGH),
      createMockObject("medium-1", TrellisObjectPriority.MEDIUM),
      createMockObject("low-2", TrellisObjectPriority.LOW),
      createMockObject("high-2", TrellisObjectPriority.HIGH),
    ];

    const sorted = sortTrellisObjects(objects);

    expect(sorted).toHaveLength(5);
    expect(sorted[0].priority).toBe(TrellisObjectPriority.HIGH);
    expect(sorted[1].priority).toBe(TrellisObjectPriority.HIGH);
    expect(sorted[2].priority).toBe(TrellisObjectPriority.MEDIUM);
    expect(sorted[3].priority).toBe(TrellisObjectPriority.LOW);
    expect(sorted[4].priority).toBe(TrellisObjectPriority.LOW);

    expect(sorted[0].id).toBe("high-1");
    expect(sorted[1].id).toBe("high-2");
    expect(sorted[2].id).toBe("medium-1");
    expect(sorted[3].id).toBe("low-1");
    expect(sorted[4].id).toBe("low-2");
  });

  it("should return a new array without modifying the original", () => {
    const objects: TrellisObject[] = [
      createMockObject("low", TrellisObjectPriority.LOW),
      createMockObject("high", TrellisObjectPriority.HIGH),
    ];

    const originalOrder = objects.map((obj) => obj.id);
    const sorted = sortTrellisObjects(objects);

    expect(objects.map((obj) => obj.id)).toEqual(originalOrder);
    expect(sorted).not.toBe(objects);
    expect(sorted[0].id).toBe("high");
    expect(sorted[1].id).toBe("low");
  });

  it("should handle empty array", () => {
    const result = sortTrellisObjects([]);
    expect(result).toEqual([]);
  });

  it("should handle single object", () => {
    const objects = [createMockObject("single", TrellisObjectPriority.MEDIUM)];
    const result = sortTrellisObjects(objects);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("single");
    expect(result[0].priority).toBe(TrellisObjectPriority.MEDIUM);
  });

  it("should handle all objects with same priority", () => {
    const objects: TrellisObject[] = [
      createMockObject("first", TrellisObjectPriority.HIGH),
      createMockObject("second", TrellisObjectPriority.HIGH),
      createMockObject("third", TrellisObjectPriority.HIGH),
    ];

    const result = sortTrellisObjects(objects);

    expect(result).toHaveLength(3);
    result.forEach((obj) => {
      expect(obj.priority).toBe(TrellisObjectPriority.HIGH);
    });
  });

  it("should maintain stable sort for objects with same priority", () => {
    const objects: TrellisObject[] = [
      createMockObject("high-first", TrellisObjectPriority.HIGH),
      createMockObject("high-second", TrellisObjectPriority.HIGH),
      createMockObject("medium-first", TrellisObjectPriority.MEDIUM),
      createMockObject("medium-second", TrellisObjectPriority.MEDIUM),
    ];

    const result = sortTrellisObjects(objects);

    expect(result[0].id).toBe("high-first");
    expect(result[1].id).toBe("high-second");
    expect(result[2].id).toBe("medium-first");
    expect(result[3].id).toBe("medium-second");
  });

  it("should work with mixed object types", () => {
    const objects: TrellisObject[] = [
      {
        ...createMockObject("project", TrellisObjectPriority.LOW),
        type: TrellisObjectType.PROJECT,
      },
      {
        ...createMockObject("epic", TrellisObjectPriority.HIGH),
        type: TrellisObjectType.EPIC,
      },
      {
        ...createMockObject("feature", TrellisObjectPriority.MEDIUM),
        type: TrellisObjectType.FEATURE,
      },
      {
        ...createMockObject("task", TrellisObjectPriority.HIGH),
        type: TrellisObjectType.TASK,
      },
    ];

    const result = sortTrellisObjects(objects);

    expect(result[0].priority).toBe(TrellisObjectPriority.HIGH);
    expect(result[1].priority).toBe(TrellisObjectPriority.HIGH);
    expect(result[2].priority).toBe(TrellisObjectPriority.MEDIUM);
    expect(result[3].priority).toBe(TrellisObjectPriority.LOW);
  });
});
