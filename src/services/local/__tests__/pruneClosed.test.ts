import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import { pruneClosed } from "../pruneClosed";

describe("pruneClosed", () => {
  let mockRepository: jest.Mocked<Repository>;
  const mockDate = new Date("2025-01-15T12:00:00Z");

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };

    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockObject = (
    id: string,
    status: TrellisObjectStatus,
    daysAgo: number,
  ): TrellisObject => {
    const updatedTime = new Date(
      mockDate.getTime() - daysAgo * 24 * 60 * 60 * 1000,
    );
    return {
      id,
      type: TrellisObjectType.TASK,
      title: `Test ${id}`,
      status,
      priority: TrellisObjectPriority.MEDIUM,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "",
      created: updatedTime.toISOString(),
      updated: updatedTime.toISOString(),
    };
  };

  describe("day-based age calculation", () => {
    it("should delete objects older than 1 day", async () => {
      const objects = [
        createMockObject("T-old", TrellisObjectStatus.DONE, 2), // 2 days old
        createMockObject("T-recent", TrellisObjectStatus.DONE, 0), // Today
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith("T-old", true);
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain("Deleted objects: T-old");
    });

    it("should delete objects older than 7 days", async () => {
      const objects = [
        createMockObject("T-very-old", TrellisObjectStatus.DONE, 10), // 10 days old
        createMockObject("T-old", TrellisObjectStatus.DONE, 5), // 5 days old
        createMockObject("T-recent", TrellisObjectStatus.DONE, 1), // 1 day old
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 7);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-very-old",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 7 days",
      );
    });

    it("should delete objects older than 30 days", async () => {
      const objects = [
        createMockObject("T-ancient", TrellisObjectStatus.DONE, 45), // 45 days old
        createMockObject("T-old", TrellisObjectStatus.DONE, 20), // 20 days old
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 30);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-ancient",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 30 days",
      );
    });
  });

  describe("objects with no children", () => {
    it("should delete closed objects with no children (existing behavior)", async () => {
      const objects = [
        createMockObject("T-done", TrellisObjectStatus.DONE, 5),
        createMockObject("T-wont-do", TrellisObjectStatus.WONT_DO, 3),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith("T-done", true);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-wont-do",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 2 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain(
        "Deleted objects: T-done, T-wont-do",
      );
    });

    it("should not delete open objects", async () => {
      const objects = [
        createMockObject("T-open", TrellisObjectStatus.OPEN, 5),
        createMockObject("T-in-progress", TrellisObjectStatus.IN_PROGRESS, 5),
        createMockObject("T-done", TrellisObjectStatus.DONE, 5),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith("T-done", true);
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );
    });
  });

  describe("hierarchical child validation", () => {
    it("should skip closed parent with open children", async () => {
      const parentObject = createMockObject(
        "F-parent",
        TrellisObjectStatus.DONE,
        5,
      );
      const openChild = createMockObject(
        "T-open-child",
        TrellisObjectStatus.OPEN,
        1,
      );

      mockRepository.getObjects.mockResolvedValue([parentObject]);
      mockRepository.getChildrenOf.mockResolvedValue([openChild]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.getChildrenOf).toHaveBeenCalledWith(
        "F-parent",
        true,
      );
      expect(mockRepository.deleteObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain(
        "Skipped 1 objects with open children: F-parent",
      );
    });

    it("should delete closed parent with only closed children", async () => {
      const parentObject = createMockObject(
        "F-parent",
        TrellisObjectStatus.DONE,
        5,
      );
      const closedChild1 = createMockObject(
        "T-done-child",
        TrellisObjectStatus.DONE,
        3,
      );
      const closedChild2 = createMockObject(
        "T-wont-do-child",
        TrellisObjectStatus.WONT_DO,
        2,
      );

      mockRepository.getObjects.mockResolvedValue([parentObject]);
      mockRepository.getChildrenOf.mockResolvedValue([
        closedChild1,
        closedChild2,
      ]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.getChildrenOf).toHaveBeenCalledWith(
        "F-parent",
        true,
      );
      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "F-parent",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain("Deleted objects: F-parent");
    });

    it("should handle mixed scenarios with some parents having open children and others not", async () => {
      const parentWithOpenChild = createMockObject(
        "F-parent-1",
        TrellisObjectStatus.DONE,
        5,
      );
      const parentWithClosedChildren = createMockObject(
        "F-parent-2",
        TrellisObjectStatus.DONE,
        5,
      );
      const parentWithNoChildren = createMockObject(
        "T-orphan",
        TrellisObjectStatus.DONE,
        5,
      );

      const openChild = createMockObject("T-open", TrellisObjectStatus.OPEN, 1);
      const closedChild = createMockObject(
        "T-closed",
        TrellisObjectStatus.DONE,
        1,
      );

      mockRepository.getObjects.mockResolvedValue([
        parentWithOpenChild,
        parentWithClosedChildren,
        parentWithNoChildren,
      ]);

      mockRepository.getChildrenOf.mockImplementation((parentId) => {
        if (parentId === "F-parent-1") return Promise.resolve([openChild]);
        if (parentId === "F-parent-2") return Promise.resolve([closedChild]);
        return Promise.resolve([]); // No children for T-orphan
      });

      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.getChildrenOf).toHaveBeenCalledTimes(3);
      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "F-parent-2",
        true,
      );
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "T-orphan",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 2 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain(
        "Deleted objects: F-parent-2, T-orphan",
      );
      expect(result.content[0].text).toContain(
        "Skipped 1 objects with open children: F-parent-1",
      );
    });
  });

  describe("multi-level hierarchies", () => {
    it("should handle grandparent → parent → child hierarchy correctly", async () => {
      const grandparent = createMockObject(
        "E-grandparent",
        TrellisObjectStatus.DONE,
        5,
      );
      const parent = createMockObject("F-parent", TrellisObjectStatus.DONE, 4);
      const openChild = createMockObject(
        "T-open-child",
        TrellisObjectStatus.OPEN,
        1,
      );

      mockRepository.getObjects.mockResolvedValue([grandparent, parent]);

      mockRepository.getChildrenOf.mockImplementation((parentId) => {
        if (parentId === "E-grandparent") return Promise.resolve([parent]); // Parent is closed
        if (parentId === "F-parent") return Promise.resolve([openChild]); // Child is open
        return Promise.resolve([]);
      });

      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1);

      // Grandparent has no direct open children (parent is closed), so it gets deleted
      // Parent should be skipped because it has open children
      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "E-grandparent",
        true,
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain(
        "Deleted objects: E-grandparent",
      );
      expect(result.content[0].text).toContain(
        "Skipped 1 objects with open children: F-parent",
      );
    });
  });

  describe("error handling", () => {
    it("should handle errors when child queries fail gracefully", async () => {
      const objects = [
        createMockObject("F-parent-1", TrellisObjectStatus.DONE, 5),
        createMockObject("F-parent-2", TrellisObjectStatus.DONE, 5),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockImplementation((parentId) => {
        if (parentId === "F-parent-1") {
          return Promise.reject(new Error("Failed to query children"));
        }
        return Promise.resolve([]); // No children for parent-2
      });
      mockRepository.deleteObject.mockResolvedValue();

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await pruneClosed(mockRepository, 1);

      // Should continue processing other objects even if one child query fails
      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.deleteObject).toHaveBeenCalledWith(
        "F-parent-2",
        true,
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to delete object F-parent-1:",
        expect.any(Error),
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );

      consoleSpy.mockRestore();
    });

    it("should handle repository deletion errors gracefully", async () => {
      const objects = [
        createMockObject("T-fail", TrellisObjectStatus.DONE, 5),
        createMockObject("T-success", TrellisObjectStatus.DONE, 5),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockImplementation((id) => {
        if (id === "T-fail") {
          return Promise.reject(new Error("Deletion failed"));
        }
        return Promise.resolve();
      });

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.deleteObject).toHaveBeenCalledTimes(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to delete object T-fail:",
        expect.any(Error),
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days",
      );
      expect(result.content[0].text).toContain("Deleted objects: T-success");

      consoleSpy.mockRestore();
    });

    it("should handle repository getObjects error gracefully", async () => {
      mockRepository.getObjects.mockRejectedValue(
        new Error("Failed to fetch objects"),
      );

      const result = await pruneClosed(mockRepository, 1);

      expect(result.content[0].text).toContain(
        "Error pruning closed objects: Failed to fetch objects",
      );
      expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    });
  });

  describe("scope filtering", () => {
    it("should include scope in message when provided", async () => {
      const objects = [
        createMockObject("T-scoped", TrellisObjectStatus.DONE, 5),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 1, "P-test-project");

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        true,
        "P-test-project",
      );
      expect(result.content[0].text).toContain(
        "Pruned 1 closed objects older than 1 days in scope P-test-project",
      );
    });

    it("should handle empty results with scope", async () => {
      mockRepository.getObjects.mockResolvedValue([]);

      const result = await pruneClosed(mockRepository, 1, "P-empty-project");

      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 1 days in scope P-empty-project",
      );
    });
  });

  describe("edge cases", () => {
    it("should handle objects with no updated timestamp gracefully", async () => {
      const objectWithoutTimestamp = {
        ...createMockObject("T-no-timestamp", TrellisObjectStatus.DONE, 0),
        updated: "", // Invalid timestamp
      };

      mockRepository.getObjects.mockResolvedValue([objectWithoutTimestamp]);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const _result = await pruneClosed(mockRepository, 1);

      // Invalid date comparisons result in false, so object won't be considered old enough
      expect(mockRepository.deleteObject).not.toHaveBeenCalled();
    });

    it("should handle zero age gracefully", async () => {
      const objects = [
        createMockObject("T-recent", TrellisObjectStatus.DONE, 0),
      ];

      mockRepository.getObjects.mockResolvedValue(objects);
      mockRepository.getChildrenOf.mockResolvedValue([]);
      mockRepository.deleteObject.mockResolvedValue();

      const result = await pruneClosed(mockRepository, 0);

      // With age=0, cutoff is exactly now, so objects updated exactly at mockDate won't be older
      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 0 days",
      );
    });

    it("should handle empty object list", async () => {
      mockRepository.getObjects.mockResolvedValue([]);

      const result = await pruneClosed(mockRepository, 1);

      expect(mockRepository.getChildrenOf).not.toHaveBeenCalled();
      expect(mockRepository.deleteObject).not.toHaveBeenCalled();
      expect(result.content[0].text).toContain(
        "Pruned 0 closed objects older than 1 days",
      );
    });
  });
});
