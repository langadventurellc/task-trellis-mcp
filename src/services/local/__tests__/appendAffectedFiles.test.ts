import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../../models";
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

  it("should add new files to empty affectedFiles map", () => {
    const trellisObject = createMockTrellisObject();
    const filesChanged = {
      "src/components/Button.tsx": "Added new button component",
      "src/utils/helpers.ts": "Created utility functions",
    };

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/components/Button.tsx")).toBe(
      "Added new button component",
    );
    expect(trellisObject.affectedFiles.get("src/utils/helpers.ts")).toBe(
      "Created utility functions",
    );
  });

  it("should add new files to existing affectedFiles map", () => {
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing file"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });
    const filesChanged = {
      "src/new.ts": "New file added",
    };

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing file",
    );
    expect(trellisObject.affectedFiles.get("src/new.ts")).toBe(
      "New file added",
    );
  });

  it("should merge descriptions for existing files", () => {
    const existingAffectedFiles = new Map([
      ["src/components/Button.tsx", "Initial implementation"],
      ["src/utils/helpers.ts", "Basic utilities"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });
    const filesChanged = {
      "src/components/Button.tsx": "Added click handler",
      "src/utils/helpers.ts": "Added validation functions",
    };

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/components/Button.tsx")).toBe(
      "Initial implementation; Added click handler",
    );
    expect(trellisObject.affectedFiles.get("src/utils/helpers.ts")).toBe(
      "Basic utilities; Added validation functions",
    );
  });

  it("should handle mix of new and existing files", () => {
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing description"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });
    const filesChanged = {
      "src/existing.ts": "Updated functionality",
      "src/new.ts": "New file created",
      "src/another.ts": "Another new file",
    };

    appendAffectedFiles(trellisObject, filesChanged);

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

  it("should handle empty filesChanged object", () => {
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing file"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });
    const filesChanged = {};

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(1);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing file",
    );
  });

  it("should handle files with empty descriptions", () => {
    const trellisObject = createMockTrellisObject();
    const filesChanged = {
      "src/empty.ts": "",
      "src/normal.ts": "Normal description",
    };

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/empty.ts")).toBe("");
    expect(trellisObject.affectedFiles.get("src/normal.ts")).toBe(
      "Normal description",
    );
  });

  it("should merge empty description with existing description", () => {
    const existingAffectedFiles = new Map([
      ["src/test.ts", "Existing description"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });
    const filesChanged = {
      "src/test.ts": "",
    };

    appendAffectedFiles(trellisObject, filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(1);
    expect(trellisObject.affectedFiles.get("src/test.ts")).toBe(
      "Existing description; ",
    );
  });
});
