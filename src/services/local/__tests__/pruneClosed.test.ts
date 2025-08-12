import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import { pruneClosed } from "../pruneClosed";

jest.mock("../../../models/isClosed", () => ({
  isClosed: jest.fn(),
}));

const { isClosed } = require("../../../models/isClosed");

describe("pruneClosed", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
    isClosed.mockClear();
  });

  const createMockObject = (
    id: string,
    status: TrellisObjectStatus,
    updatedTime: string,
  ): TrellisObject => ({
    id,
    type: TrellisObjectType.TASK,
    title: `Test ${id}`,
    status,
    priority: TrellisObjectPriority.MEDIUM,
    parent: undefined,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    created: new Date().toISOString(),
    updated: updatedTime,
    body: "",
  });

  it("should prune old closed objects", async () => {
    const oldClosedObject = createMockObject(
      "T-old-closed",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    );

    mockRepository.getObjects.mockResolvedValue([oldClosedObject]);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 60); // 1 hour

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true, undefined);
    expect(isClosed).toHaveBeenCalledWith(oldClosedObject, 0, [
      oldClosedObject,
    ]);
    expect(mockRepository.deleteObject).toHaveBeenCalledWith(
      "T-old-closed",
      true,
    );
    expect(result.content[0].text).toContain(
      "Pruned 1 closed objects older than 60 minutes",
    );
    expect(result.content[0].text).toContain("T-old-closed");
  });

  it("should not prune recent closed objects", async () => {
    const recentClosedObject = createMockObject(
      "T-recent-closed",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    );

    mockRepository.getObjects.mockResolvedValue([recentClosedObject]);
    isClosed.mockReturnValue(true);

    const result = await pruneClosed(mockRepository, 60); // 1 hour

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true, undefined);
    expect(isClosed).toHaveBeenCalledWith(recentClosedObject, 0, [
      recentClosedObject,
    ]);
    expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain(
      "Pruned 0 closed objects older than 60 minutes",
    );
  });

  it("should not prune open objects", async () => {
    const openObject = createMockObject(
      "T-open",
      TrellisObjectStatus.IN_PROGRESS,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    );

    mockRepository.getObjects.mockResolvedValue([openObject]);
    isClosed.mockReturnValue(false);

    const result = await pruneClosed(mockRepository, 60); // 1 hour

    expect(mockRepository.getObjects).toHaveBeenCalledWith(true, undefined);
    expect(isClosed).toHaveBeenCalledWith(openObject, 0, [openObject]);
    expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain(
      "Pruned 0 closed objects older than 60 minutes",
    );
  });

  it("should handle scope parameter", async () => {
    const oldClosedObject = createMockObject(
      "T-scoped-closed",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );

    mockRepository.getObjects.mockResolvedValue([oldClosedObject]);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 60, "F-test-feature");

    expect(mockRepository.getObjects).toHaveBeenCalledWith(
      true,
      "F-test-feature",
    );
    expect(result.content[0].text).toContain("in scope F-test-feature");
  });

  it("should handle mixed object types and statuses", async () => {
    const oldDoneTask = createMockObject(
      "T-old-done",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );
    const oldWontDoTask = createMockObject(
      "T-old-wont-do",
      TrellisObjectStatus.WONT_DO,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );
    const recentDoneTask = createMockObject(
      "T-recent-done",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    );
    const openTask = createMockObject(
      "T-open",
      TrellisObjectStatus.IN_PROGRESS,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );

    mockRepository.getObjects.mockResolvedValue([
      oldDoneTask,
      oldWontDoTask,
      recentDoneTask,
      openTask,
    ]);

    isClosed.mockImplementation(
      (obj: TrellisObject) =>
        obj.status === TrellisObjectStatus.DONE ||
        obj.status === TrellisObjectStatus.WONT_DO,
    );

    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 60);

    expect(mockRepository.deleteObject).toHaveBeenCalledTimes(2);
    expect(mockRepository.deleteObject).toHaveBeenCalledWith(
      "T-old-done",
      true,
    );
    expect(mockRepository.deleteObject).toHaveBeenCalledWith(
      "T-old-wont-do",
      true,
    );
    expect(result.content[0].text).toContain("Pruned 2 closed objects");
    expect(result.content[0].text).toContain("T-old-done");
    expect(result.content[0].text).toContain("T-old-wont-do");
  });

  it("should handle deletion failures gracefully", async () => {
    const oldClosedObject1 = createMockObject(
      "T-old-closed-1",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );
    const oldClosedObject2 = createMockObject(
      "T-old-closed-2",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    );

    mockRepository.getObjects.mockResolvedValue([
      oldClosedObject1,
      oldClosedObject2,
    ]);
    isClosed.mockReturnValue(true);

    // First deletion fails, second succeeds
    mockRepository.deleteObject
      .mockRejectedValueOnce(new Error("Permission denied"))
      .mockResolvedValueOnce(undefined);

    // Mock console.error to check error logging
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    const result = await pruneClosed(mockRepository, 60);

    expect(mockRepository.deleteObject).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to delete object T-old-closed-1:",
      expect.any(Error),
    );
    expect(result.content[0].text).toContain("Pruned 1 closed objects");
    expect(result.content[0].text).toContain("T-old-closed-2");
    expect(result.content[0].text).not.toContain("T-old-closed-1");

    consoleSpy.mockRestore();
  });

  it("should handle repository getObjects error", async () => {
    const errorMessage = "Repository connection failed";
    mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

    const result = await pruneClosed(mockRepository, 60);

    expect(result.content[0].text).toContain("Error pruning closed objects");
    expect(result.content[0].text).toContain(errorMessage);
  });

  it("should handle empty object list", async () => {
    mockRepository.getObjects.mockResolvedValue([]);

    const result = await pruneClosed(mockRepository, 60);

    expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain("Pruned 0 closed objects");
  });

  it("should handle zero age parameter", async () => {
    const oldClosedObject = createMockObject(
      "T-old-closed",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 1000).toISOString(), // 1 second ago
    );

    mockRepository.getObjects.mockResolvedValue([oldClosedObject]);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 0);

    expect(mockRepository.deleteObject).toHaveBeenCalledWith(
      "T-old-closed",
      true,
    );
    expect(result.content[0].text).toContain(
      "Pruned 1 closed objects older than 0 minutes",
    );
  });

  it("should handle large age parameter", async () => {
    const veryOldObject = createMockObject(
      "T-ancient",
      TrellisObjectStatus.DONE,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    );

    mockRepository.getObjects.mockResolvedValue([veryOldObject]);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 999999);

    expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain(
      "Pruned 0 closed objects older than 999999 minutes",
    );
  });

  it("should handle non-Error exceptions", async () => {
    const errorValue = "String error";
    mockRepository.getObjects.mockRejectedValue(errorValue);

    const result = await pruneClosed(mockRepository, 60);

    expect(result.content[0].text).toContain("Error pruning closed objects");
    expect(result.content[0].text).toContain(errorValue);
  });

  it("should calculate cutoff time correctly for different age values", async () => {
    const currentTime = Date.now();
    const testCases = [
      { age: 30, expectedCutoff: currentTime - 30 * 60 * 1000 },
      { age: 120, expectedCutoff: currentTime - 120 * 60 * 1000 },
      { age: 1440, expectedCutoff: currentTime - 1440 * 60 * 1000 }, // 24 hours
    ];

    for (const { age, expectedCutoff } of testCases) {
      const objectBeforeCutoff = createMockObject(
        `T-before-${age}`,
        TrellisObjectStatus.DONE,
        new Date(expectedCutoff - 1000).toISOString(), // 1 second before cutoff
      );
      const objectAfterCutoff = createMockObject(
        `T-after-${age}`,
        TrellisObjectStatus.DONE,
        new Date(expectedCutoff + 1000).toISOString(), // 1 second after cutoff
      );

      mockRepository.getObjects.mockResolvedValue([
        objectBeforeCutoff,
        objectAfterCutoff,
      ]);
      isClosed.mockReturnValue(true);
      mockRepository.deleteObject.mockResolvedValue(undefined);

      const result = await pruneClosed(mockRepository, age);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        `T-before-${age}`,
        true,
      );
      expect(result.content[0].text).toContain("Pruned 1 closed objects");

      // Reset mocks for next iteration
      mockRepository.deleteObject.mockClear();
    }
  });

  it("should handle objects with different timestamps", async () => {
    const objects = [
      createMockObject(
        "T-1-hour-ago",
        TrellisObjectStatus.DONE,
        new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      ),
      createMockObject(
        "T-2-hours-ago",
        TrellisObjectStatus.DONE,
        new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ),
      createMockObject(
        "T-30-minutes-ago",
        TrellisObjectStatus.DONE,
        new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      ),
    ];

    mockRepository.getObjects.mockResolvedValue(objects);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 90); // 1.5 hours

    expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
    expect(mockRepository.deleteObject).toHaveBeenCalledWith(
      "T-2-hours-ago",
      true,
    );
    expect(result.content[0].text).toContain("Pruned 1 closed objects");
    expect(result.content[0].text).toContain("T-2-hours-ago");
  });

  it("should handle bulk deletion scenarios", async () => {
    const objectCount = 50;
    const objects = Array.from({ length: objectCount }, (_, i) =>
      createMockObject(
        `T-bulk-${i}`,
        TrellisObjectStatus.DONE,
        new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // All 2 hours old
      ),
    );

    mockRepository.getObjects.mockResolvedValue(objects);
    isClosed.mockReturnValue(true);
    mockRepository.deleteObject.mockResolvedValue(undefined);

    const result = await pruneClosed(mockRepository, 60);

    expect(mockRepository.deleteObject).toHaveBeenCalledTimes(objectCount);
    expect(result.content[0].text).toContain(
      `Pruned ${objectCount} closed objects`,
    );
  });
});
