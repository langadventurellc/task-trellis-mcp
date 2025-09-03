import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories";
import { appendAffectedFiles } from "../appendAffectedFiles";

describe("appendAffectedFiles service function", () => {
  const createMockTrellisObject = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "T-test-task",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.IN_PROGRESS,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "F-test-feature",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    childrenIds: [],
    body: "This is a test task",
    ...overrides,
  });

  const createMockRepository = (): jest.Mocked<Repository> =>
    ({
      getObjectById: jest.fn(),
      saveObject: jest.fn(),
    }) as unknown as jest.Mocked<Repository>;

  it("should add new files to empty affectedFiles map", async () => {
    const repository = createMockRepository();
    const trellisObject = createMockTrellisObject({ parent: null });
    const filesChanged = {
      "src/components/Button.tsx": "Added new button component",
      "src/utils/helpers.ts": "Created utility functions",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/components/Button.tsx")).toBe(
      "Added new button component",
    );
    expect(trellisObject.affectedFiles.get("src/utils/helpers.ts")).toBe(
      "Created utility functions",
    );
  });

  it("should add new files to existing affectedFiles map", async () => {
    const repository = createMockRepository();
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing file"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
      parent: null,
    });
    const filesChanged = {
      "src/new.ts": "New file added",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing file",
    );
    expect(trellisObject.affectedFiles.get("src/new.ts")).toBe(
      "New file added",
    );
  });

  it("should merge descriptions for existing files", async () => {
    const repository = createMockRepository();
    const existingAffectedFiles = new Map([
      ["src/components/Button.tsx", "Initial implementation"],
      ["src/utils/helpers.ts", "Basic utilities"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
      parent: null,
    });
    const filesChanged = {
      "src/components/Button.tsx": "Added click handler",
      "src/utils/helpers.ts": "Added validation functions",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/components/Button.tsx")).toBe(
      "Initial implementation; Added click handler",
    );
    expect(trellisObject.affectedFiles.get("src/utils/helpers.ts")).toBe(
      "Basic utilities; Added validation functions",
    );
  });

  it("should handle mix of new and existing files", async () => {
    const repository = createMockRepository();
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing description"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
      parent: null,
    });
    const filesChanged = {
      "src/existing.ts": "Updated functionality",
      "src/new.ts": "New file created",
      "src/another.ts": "Another new file",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(3);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing description; Updated functionality",
    );
    expect(trellisObject.affectedFiles.get("src/new.ts")).toBe(
      "New file created",
    );
    expect(trellisObject.affectedFiles.get("src/another.ts")).toBe(
      "Another new file",
    );
  });

  it("should handle empty filesChanged object", async () => {
    const repository = createMockRepository();
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing file"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
      parent: null,
    });
    const filesChanged = {};

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(1);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing file",
    );
  });

  it("should handle files with empty descriptions", async () => {
    const repository = createMockRepository();
    const trellisObject = createMockTrellisObject({ parent: null });
    const filesChanged = {
      "src/empty.ts": "",
      "src/normal.ts": "Normal description",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/empty.ts")).toBe("");
    expect(trellisObject.affectedFiles.get("src/normal.ts")).toBe(
      "Normal description",
    );
  });

  it("should merge empty description with existing description", async () => {
    const repository = createMockRepository();
    const existingAffectedFiles = new Map([
      ["src/test.ts", "Existing description"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
      parent: null,
    });
    const filesChanged = {
      "src/test.ts": "",
    };

    await appendAffectedFiles(repository, trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(1);
    expect(trellisObject.affectedFiles.get("src/test.ts")).toBe(
      "Existing description; ",
    );
  });

  it("should recursively update parent objects when they exist", async () => {
    const repository = createMockRepository();
    const parentObject = createMockTrellisObject({
      id: "F-parent-feature",
      parent: null,
    });
    const childObject = createMockTrellisObject({
      id: "T-child-task",
      parent: "F-parent-feature",
    });

    repository.getObjectById.mockResolvedValue(parentObject);

    const filesChanged = {
      "src/new-feature.ts": "Added new feature",
    };

    await appendAffectedFiles(repository, childObject, filesChanged);

    expect(repository.getObjectById).toHaveBeenCalledWith("F-parent-feature");
    expect(repository.saveObject).toHaveBeenCalledWith(parentObject);
    expect(childObject.affectedFiles.get("src/new-feature.ts")).toBe(
      "Added new feature",
    );
    expect(parentObject.affectedFiles.get("src/new-feature.ts")).toBe(
      "Added new feature",
    );
  });

  it("should recursively update multiple levels of parent hierarchy", async () => {
    const repository = createMockRepository();
    const grandparentObject = createMockTrellisObject({
      id: "P-grandparent-project",
      parent: null,
    });
    const parentObject = createMockTrellisObject({
      id: "F-parent-feature",
      parent: "P-grandparent-project",
    });
    const childObject = createMockTrellisObject({
      id: "T-child-task",
      parent: "F-parent-feature",
    });

    repository.getObjectById
      .mockResolvedValueOnce(parentObject)
      .mockResolvedValueOnce(grandparentObject);

    const filesChanged = {
      "src/deep-feature.ts": "Deep nested feature",
    };

    await appendAffectedFiles(repository, childObject, filesChanged);

    expect(repository.getObjectById).toHaveBeenCalledWith("F-parent-feature");
    expect(repository.getObjectById).toHaveBeenCalledWith(
      "P-grandparent-project",
    );
    expect(repository.saveObject).toHaveBeenCalledWith(parentObject);
    expect(repository.saveObject).toHaveBeenCalledWith(grandparentObject);
    expect(childObject.affectedFiles.get("src/deep-feature.ts")).toBe(
      "Deep nested feature",
    );
    expect(parentObject.affectedFiles.get("src/deep-feature.ts")).toBe(
      "Deep nested feature",
    );
    expect(grandparentObject.affectedFiles.get("src/deep-feature.ts")).toBe(
      "Deep nested feature",
    );
  });

  it("should handle case when parent object is not found", async () => {
    const repository = createMockRepository();
    const childObject = createMockTrellisObject({
      id: "T-child-task",
      parent: "F-nonexistent-parent",
    });

    repository.getObjectById.mockResolvedValue(null);

    const filesChanged = {
      "src/orphan-feature.ts": "Orphaned feature",
    };

    await appendAffectedFiles(repository, childObject, filesChanged);

    expect(repository.getObjectById).toHaveBeenCalledWith(
      "F-nonexistent-parent",
    );
    expect(repository.saveObject).not.toHaveBeenCalled();
    expect(childObject.affectedFiles.get("src/orphan-feature.ts")).toBe(
      "Orphaned feature",
    );
  });
});
