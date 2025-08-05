import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../models";
import { Repository } from "../../repositories/Repository";
import { checkPrerequisitesComplete } from "../checkPrerequisitesComplete";

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
}

describe("checkPrerequisitesComplete", () => {
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
  });

  it("should return true when object has no prerequisites", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, []);
    const repository = new MockRepository();

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return true when object has empty prerequisites array", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN);
    // Ensure prerequisites is an empty array
    object.prerequisites = [];
    const repository = new MockRepository();

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return true when all prerequisites are DONE", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.DONE);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "prereq-2",
    ]);

    const repository = new MockRepository([prereq1, prereq2]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return true when all prerequisites are WONT_DO", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.WONT_DO);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.WONT_DO);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "prereq-2",
    ]);

    const repository = new MockRepository([prereq1, prereq2]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return true when prerequisites are mix of DONE and WONT_DO", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.WONT_DO);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "prereq-2",
    ]);

    const repository = new MockRepository([prereq1, prereq2]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return false when prerequisite is OPEN", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.OPEN);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(false);
  });

  it("should return false when prerequisite is IN_PROGRESS", async () => {
    const prereq1 = createMockObject(
      "prereq-1",
      TrellisObjectStatus.IN_PROGRESS,
    );
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(false);
  });

  it("should return false when prerequisite is DRAFT", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DRAFT);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(false);
  });

  it("should return false when any prerequisite is incomplete", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.OPEN);
    const prereq3 = createMockObject("prereq-3", TrellisObjectStatus.WONT_DO);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "prereq-2",
      "prereq-3",
    ]);

    const repository = new MockRepository([prereq1, prereq2, prereq3]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(false);
  });

  it("should return true when prerequisite does not exist in repository (external dependency)", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "nonexistent-prereq",
    ]);

    const repository = new MockRepository([]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return true when some prerequisites exist (complete) and some don't (external)", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "nonexistent-prereq",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should return false when some prerequisites exist (incomplete) and some don't (external)", async () => {
    const prereq1 = createMockObject(
      "prereq-1",
      TrellisObjectStatus.IN_PROGRESS,
    );
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "nonexistent-prereq",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(false);
  });

  it("should handle multiple prerequisites with various statuses", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const prereq2 = createMockObject("prereq-2", TrellisObjectStatus.WONT_DO);
    const prereq3 = createMockObject("prereq-3", TrellisObjectStatus.DONE);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
      "prereq-2",
      "prereq-3",
    ]);

    const repository = new MockRepository([prereq1, prereq2, prereq3]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should handle single prerequisite", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should work regardless of the main object's status", async () => {
    const prereq1 = createMockObject("prereq-1", TrellisObjectStatus.DONE);
    const object = createMockObject("task-1", TrellisObjectStatus.IN_PROGRESS, [
      "prereq-1",
    ]);

    const repository = new MockRepository([prereq1]);

    const result = await checkPrerequisitesComplete(object, repository);

    expect(result).toBe(true);
  });

  it("should handle repository errors gracefully", async () => {
    const object = createMockObject("task-1", TrellisObjectStatus.OPEN, [
      "prereq-1",
    ]);

    // Mock repository that throws an error on getObjects
    const mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn().mockRejectedValue(new Error("Repository error")),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    await expect(
      checkPrerequisitesComplete(object, mockRepository),
    ).rejects.toThrow("Repository error");
  });
});
