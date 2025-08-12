import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../../models";
import { Repository } from "../../../repositories";
import { appendModifiedFiles } from "../appendModifiedFiles";

describe("appendModifiedFiles service function", () => {
  let mockRepository: jest.Mocked<Repository>;

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

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it("should append files to object and save it", async () => {
    const trellisObject = createMockTrellisObject();
    const filesChanged = {
      "src/components/Button.tsx": "Added new button component",
      "src/utils/helpers.ts": "Created utility functions",
    };

    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    const result = await appendModifiedFiles(
      mockRepository,
      "T-test-task",
      filesChanged,
    );

    expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
    expect(mockRepository.saveObject).toHaveBeenCalledWith(trellisObject);
    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/components/Button.tsx")).toBe(
      "Added new button component",
    );
    expect(trellisObject.affectedFiles.get("src/utils/helpers.ts")).toBe(
      "Created utility functions",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Successfully appended 2 modified files to object T-test-task",
        },
      ],
    });
  });

  it("should handle object not found", async () => {
    mockRepository.getObjectById.mockResolvedValue(null);

    const result = await appendModifiedFiles(mockRepository, "T-nonexistent", {
      "test.ts": "Test file",
    });

    expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-nonexistent");
    expect(mockRepository.saveObject).not.toHaveBeenCalled();
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Object with ID T-nonexistent not found",
        },
      ],
    });
  });

  it("should handle empty filesChanged object", async () => {
    const trellisObject = createMockTrellisObject();
    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    const result = await appendModifiedFiles(mockRepository, "T-test-task", {});

    expect(mockRepository.saveObject).toHaveBeenCalledWith(trellisObject);
    expect(trellisObject.affectedFiles.size).toBe(0);
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Successfully appended 0 modified files to object T-test-task",
        },
      ],
    });
  });

  it("should handle single file", async () => {
    const trellisObject = createMockTrellisObject();
    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    const result = await appendModifiedFiles(mockRepository, "T-test-task", {
      "README.md": "Updated documentation",
    });

    expect(trellisObject.affectedFiles.size).toBe(1);
    expect(trellisObject.affectedFiles.get("README.md")).toBe(
      "Updated documentation",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Successfully appended 1 modified file to object T-test-task",
        },
      ],
    });
  });

  it("should merge with existing affected files", async () => {
    const existingAffectedFiles = new Map([
      ["src/existing.ts", "Existing file"],
    ]);
    const trellisObject = createMockTrellisObject({
      affectedFiles: existingAffectedFiles,
    });

    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    const result = await appendModifiedFiles(mockRepository, "T-test-task", {
      "src/existing.ts": "Updated functionality",
      "src/new.ts": "New file created",
    });

    expect(trellisObject.affectedFiles.size).toBe(2);
    expect(trellisObject.affectedFiles.get("src/existing.ts")).toBe(
      "Existing file; Updated functionality",
    );
    expect(trellisObject.affectedFiles.get("src/new.ts")).toBe(
      "New file created",
    );
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: "Successfully appended 2 modified files to object T-test-task",
        },
      ],
    });
  });

  it("should use correct singular/plural form for file count", async () => {
    const trellisObject = createMockTrellisObject();
    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    // Test singular
    const singleResult = await appendModifiedFiles(
      mockRepository,
      "T-test-task",
      { "single.ts": "Single file" },
    );

    expect(singleResult.content[0].text).toContain("1 modified file");

    // Test plural
    const pluralResult = await appendModifiedFiles(
      mockRepository,
      "T-test-task",
      {
        "file1.ts": "First file",
        "file2.ts": "Second file",
      },
    );

    expect(pluralResult.content[0].text).toContain("2 modified files");
  });

  it("should handle complex file paths", async () => {
    const trellisObject = createMockTrellisObject();
    mockRepository.getObjectById.mockResolvedValue(trellisObject);
    mockRepository.saveObject.mockResolvedValue();

    const filesChanged = {
      "src/components/forms/auth/LoginForm.tsx": "Login form implementation",
      "tests/e2e/auth/login.spec.ts": "E2E tests for login flow",
      "docs/api/authentication.md": "API documentation for auth endpoints",
    };

    await appendModifiedFiles(mockRepository, "T-test-task", filesChanged);

    expect(trellisObject.affectedFiles.size).toBe(3);
    expect(
      trellisObject.affectedFiles.get(
        "src/components/forms/auth/LoginForm.tsx",
      ),
    ).toBe("Login form implementation");
    expect(
      trellisObject.affectedFiles.get("tests/e2e/auth/login.spec.ts"),
    ).toBe("E2E tests for login flow");
    expect(trellisObject.affectedFiles.get("docs/api/authentication.md")).toBe(
      "API documentation for auth endpoints",
    );
  });
});
