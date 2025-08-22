import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { isRequiredForOtherObjects } from "../isRequiredForOtherObjects";

// Mock repository implementation for testing
class MockRepository implements Repository {
  private objects: Map<string, TrellisObject> = new Map();

  constructor(objects: TrellisObject[] = []) {
    objects.forEach((obj) => this.objects.set(obj.id, obj));
  }

  async getObjectById(id: string): Promise<TrellisObject | null> {
    return Promise.resolve(this.objects.get(id) || null);
  }

  async getObjects(_includeClosed?: boolean): Promise<TrellisObject[]> {
    return Promise.resolve(Array.from(this.objects.values()));
  }

  async saveObject(trellisObject: TrellisObject): Promise<void> {
    this.objects.set(trellisObject.id, trellisObject);
    return Promise.resolve();
  }

  async deleteObject(id: string): Promise<void> {
    this.objects.delete(id);
    return Promise.resolve();
  }

  async getChildrenOf(
    parentId: string,
    _includeClosed?: boolean,
  ): Promise<TrellisObject[]> {
    const children = Array.from(this.objects.values()).filter(
      (obj) => obj.parent === parentId,
    );
    return Promise.resolve(children);
  }
}

describe("isRequiredForOtherObjects", () => {
  const createMockObject = (
    id: string,
    status: TrellisObjectStatus,
    prerequisites: string[] = [],
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
  });

  it("should return false when no other objects exist", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN);
    const repository = new MockRepository([object]);

    const result = await isRequiredForOtherObjects(object, repository);

    expect(result).toBe(false);
  });

  it("should return false when no other objects have this object as prerequisite", async () => {
    const object1 = createMockObject("task-1", TrellisObjectStatus.OPEN);
    const object2 = createMockObject("task-2", TrellisObjectStatus.OPEN, [
      "task-3",
    ]);
    const object3 = createMockObject("task-3", TrellisObjectStatus.DONE);

    const repository = new MockRepository([object1, object2, object3]);

    const result = await isRequiredForOtherObjects(object1, repository);

    expect(result).toBe(false);
  });

  it("should return true when an open object has this object as prerequisite", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const dependentObject = createMockObject(
      "task-1",
      TrellisObjectStatus.OPEN,
      ["prereq-1"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      dependentObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should return true when an in-progress object has this object as prerequisite", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const dependentObject = createMockObject(
      "task-1",
      TrellisObjectStatus.IN_PROGRESS,
      ["prereq-1"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      dependentObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should return true when a draft object has this object as prerequisite", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const dependentObject = createMockObject(
      "task-1",
      TrellisObjectStatus.DRAFT,
      ["prereq-1"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      dependentObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should return false when only closed objects have this object as prerequisite", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const doneObject = createMockObject("task-1", TrellisObjectStatus.DONE, [
      "prereq-1",
    ]);
    const wontDoObject = createMockObject(
      "task-2",
      TrellisObjectStatus.WONT_DO,
      ["prereq-1"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      doneObject,
      wontDoObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(false);
  });

  it("should return true when mix of closed and non-closed objects have this object as prerequisite", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const doneObject = createMockObject("task-1", TrellisObjectStatus.DONE, [
      "prereq-1",
    ]);
    const openObject = createMockObject("task-2", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([
      prerequisiteObject,
      doneObject,
      openObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should handle multiple objects requiring the same object", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const openObject1 = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);
    const openObject2 = createMockObject("task-2", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([
      prerequisiteObject,
      openObject1,
      openObject2,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should handle objects with multiple prerequisites where target is one of them", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.DONE,
    );
    const otherPrereq = createMockObject("prereq-2", TrellisObjectStatus.DONE);
    const dependentObject = createMockObject(
      "task-1",
      TrellisObjectStatus.OPEN,
      ["prereq-1", "prereq-2", "prereq-3"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      otherPrereq,
      dependentObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should not consider the object itself as a dependent", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "task-1",
    ]); // Self-referencing prerequisites (edge case)

    const repository = new MockRepository([object]);

    const result = await isRequiredForOtherObjects(object, repository);

    expect(result).toBe(false);
  });

  it("should handle empty repository", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN);
    const repository = new MockRepository([]);

    const result = await isRequiredForOtherObjects(object, repository);

    expect(result).toBe(false);
  });

  it("should work with different object types", async () => {
    const prerequisiteProject = {
      ...createMockObject("proj-1", TrellisObjectStatus.DONE),
      type: TrellisObjectType.PROJECT,
    };
    const dependentEpic = {
      ...createMockObject("epic-1", TrellisObjectStatus.OPEN, ["proj-1"]),
      type: TrellisObjectType.EPIC,
    };

    const repository = new MockRepository([prerequisiteProject, dependentEpic]);

    const result = await isRequiredForOtherObjects(
      prerequisiteProject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should handle repository errors gracefully", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN);

    // Mock repository that throws an error
    const mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn().mockRejectedValue(new Error("Repository error")),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    await expect(
      isRequiredForOtherObjects(object, mockRepository),
    ).rejects.toThrow("Repository error");
  });

  it("should work regardless of the target object's status", async () => {
    const prerequisiteObject = createMockObject(
      "prereq-1",
      TrellisObjectStatus.OPEN, // Target object is open
    );
    const dependentObject = createMockObject(
      "task-1",
      TrellisObjectStatus.IN_PROGRESS,
      ["prereq-1"],
    );

    const repository = new MockRepository([
      prerequisiteObject,
      dependentObject,
    ]);

    const result = await isRequiredForOtherObjects(
      prerequisiteObject,
      repository,
    );

    expect(result).toBe(true);
  });

  it("should handle complex scenario with multiple objects and statuses", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.OPEN);

    // Objects that depend on prereq-1
    const doneTask = createMockObject("task-1", TrellisObjectStatus.DONE, [
      "prereq-1",
    ]);
    const wontDoTask = createMockObject("task-2", TrellisObjectStatus.WONT_DO, [
      "prereq-1",
    ]);
    const openTask = createMockObject("task-3", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    // Object that depends on prereq-2
    const inProgressTask = createMockObject(
      "task-4",
      TrellisObjectStatus.IN_PROGRESS,
      ["prereq-2"],
    );

    // Object with no dependencies
    const independentTask = createMockObject(
      "task-5",
      TrellisObjectStatus.OPEN,
    );

    const repository = new MockRepository([
      prereq1,
      prereq2,
      doneTask,
      wontDoTask,
      openTask,
      inProgressTask,
      independentTask,
    ]);

    // prereq-1 should be required because openTask depends on it and is not closed
    const result1 = await isRequiredForOtherObjects(prereq1, repository);
    expect(result1).toBe(true);

    // prereq-2 should be required because inProgressTask depends on it and is not closed
    const result2 = await isRequiredForOtherObjects(prereq2, repository);
    expect(result2).toBe(true);

    // independentTask should not be required by anyone
    const result3 = await isRequiredForOtherObjects(
      independentTask,
      repository,
    );
    expect(result3).toBe(false);
  });
});
