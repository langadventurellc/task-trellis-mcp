import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { filterUnavailableObjects } from "../filterUnavailableObjects";

describe("filterUnavailableObjects", () => {
  const createMockObject = (
    id: string,
    status: TrellisObjectStatus,
    prerequisites: string[] = [],
    parent?: string,
  ): TrellisObject => ({
    id,
    title: `Task ${id}`,
    status,
    priority: TrellisObjectPriority.MEDIUM,
    prerequisites,
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    body: `Body for ${id}`,
    type: TrellisObjectType.TASK,
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    parent,
  });

  const createMockRepository = (objects: TrellisObject[] = []): Repository => {
    const objectMap = new Map<string, TrellisObject>();
    objects.forEach((obj) => objectMap.set(obj.id, obj));

    return {
      getObjectById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(objectMap.get(id) || null);
      }),
      getObjects: jest.fn().mockResolvedValue(objects),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
  };

  it("should only include claimable objects", async () => {
    const objects: TrellisObject[] = [
      createMockObject("open-1", TrellisObjectStatus.OPEN),
      createMockObject("draft-1", TrellisObjectStatus.DRAFT),
      createMockObject("in-progress-1", TrellisObjectStatus.IN_PROGRESS),
      createMockObject("done-1", TrellisObjectStatus.DONE),
      createMockObject("wont-do-1", TrellisObjectStatus.WONT_DO),
      createMockObject("open-2", TrellisObjectStatus.OPEN),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("open-1");
    expect(result[1].id).toBe("open-2");
  });

  it("should include objects with external prerequisites (not in list)", async () => {
    const objects: TrellisObject[] = [
      createMockObject("task-1", TrellisObjectStatus.OPEN, [
        "external-1",
        "external-2",
      ]),
      createMockObject("task-2", TrellisObjectStatus.OPEN, [
        "another-external",
      ]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("task-1");
    expect(result[1].id).toBe("task-2");
  });

  it("should include objects with prerequisites that are done", async () => {
    const objects: TrellisObject[] = [
      createMockObject("prereq-1", TrellisObjectStatus.DONE),
      createMockObject("prereq-2", TrellisObjectStatus.DONE),
      createMockObject("task-1", TrellisObjectStatus.OPEN, [
        "prereq-1",
        "prereq-2",
      ]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("task-1");
  });

  it("should include objects with prerequisites that are wont-do", async () => {
    const objects: TrellisObject[] = [
      createMockObject("prereq-1", TrellisObjectStatus.WONT_DO),
      createMockObject("prereq-2", TrellisObjectStatus.WONT_DO),
      createMockObject("task-1", TrellisObjectStatus.OPEN, [
        "prereq-1",
        "prereq-2",
      ]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("task-1");
  });

  it("should exclude objects with prerequisites that are not done or wont-do", async () => {
    const objects: TrellisObject[] = [
      createMockObject("prereq-1", TrellisObjectStatus.OPEN),
      createMockObject("prereq-2", TrellisObjectStatus.IN_PROGRESS),
      createMockObject("prereq-3", TrellisObjectStatus.DRAFT),
      createMockObject("task-1", TrellisObjectStatus.OPEN, ["prereq-1"]),
      createMockObject("task-2", TrellisObjectStatus.OPEN, ["prereq-2"]),
      createMockObject("task-3", TrellisObjectStatus.OPEN, ["prereq-3"]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    // The tasks should be excluded because their prerequisites are not claimable
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("prereq-1");
  });

  it("should handle mixed prerequisites (some external, some internal)", async () => {
    const objects: TrellisObject[] = [
      createMockObject("prereq-1", TrellisObjectStatus.DONE),
      createMockObject("prereq-2", TrellisObjectStatus.OPEN),
      createMockObject("task-1", TrellisObjectStatus.OPEN, [
        "external-1",
        "prereq-1",
      ]), // Should be included
      createMockObject("task-2", TrellisObjectStatus.OPEN, [
        "external-2",
        "prereq-2",
      ]), // Should be excluded
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    // Should include prereq-2 (open with no dependencies) and task-1 (depends on done prereq)
    expect(result).toHaveLength(2);
    expect(result.map((obj) => obj.id).sort()).toEqual(["prereq-2", "task-1"]);
  });

  it("should handle complex prerequisite chains", async () => {
    const objects: TrellisObject[] = [
      createMockObject("foundation", TrellisObjectStatus.DONE),
      createMockObject("blocked-prereq", TrellisObjectStatus.OPEN),
      createMockObject("ready-task", TrellisObjectStatus.OPEN, ["foundation"]),
      createMockObject("blocked-task", TrellisObjectStatus.OPEN, [
        "blocked-prereq",
      ]),
      createMockObject("mixed-task", TrellisObjectStatus.OPEN, [
        "foundation",
        "blocked-prereq",
      ]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    // Should include blocked-prereq (open with no dependencies) and ready-task (depends on done foundation)
    expect(result).toHaveLength(2);
    expect(result.map((obj) => obj.id).sort()).toEqual([
      "blocked-prereq",
      "ready-task",
    ]);
  });

  it("should handle empty prerequisites array", async () => {
    const objects: TrellisObject[] = [
      createMockObject("no-prereqs", TrellisObjectStatus.OPEN, []),
      createMockObject("also-no-prereqs", TrellisObjectStatus.OPEN),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("no-prereqs");
    expect(result[1].id).toBe("also-no-prereqs");
  });

  it("should handle empty input array", async () => {
    const repository = createMockRepository([]);
    const result = await filterUnavailableObjects([], repository);
    expect(result).toEqual([]);
  });

  it("should return a new array without modifying the original", async () => {
    const objects: TrellisObject[] = [
      createMockObject("task-1", TrellisObjectStatus.OPEN),
      createMockObject("task-2", TrellisObjectStatus.DRAFT),
      createMockObject("task-3", TrellisObjectStatus.IN_PROGRESS),
    ];

    const originalLength = objects.length;
    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(objects.length).toBe(originalLength);
    expect(result).not.toBe(objects);
    expect(result.length).toBe(1);
  });

  it("should handle self-referencing prerequisites", async () => {
    const objects: TrellisObject[] = [
      createMockObject("self-ref", TrellisObjectStatus.OPEN, ["self-ref"]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(0); // Should be excluded because it references itself and isn't done
  });

  it("should handle circular prerequisites", async () => {
    const objects: TrellisObject[] = [
      createMockObject("task-a", TrellisObjectStatus.OPEN, ["task-b"]),
      createMockObject("task-b", TrellisObjectStatus.OPEN, ["task-a"]),
    ];

    const repository = createMockRepository(objects);
    const result = await filterUnavailableObjects(objects, repository);

    expect(result).toHaveLength(0); // Both should be excluded due to circular dependency
  });
});
