import { TrellisObject } from "../../models/TrellisObject";
import { TrellisObjectType } from "../../models/TrellisObjectType";
import { TrellisObjectStatus } from "../../models/TrellisObjectStatus";
import { TrellisObjectPriority } from "../../models/TrellisObjectPriority";
import { Repository } from "../../repositories/Repository";
import { checkHierarchicalPrerequisitesComplete } from "../checkHierarchicalPrerequisitesComplete";
import { checkPrerequisitesComplete } from "../checkPrerequisitesComplete";

// Mock the checkPrerequisitesComplete function
jest.mock("../checkPrerequisitesComplete");
const mockCheckPrerequisitesComplete = jest.mocked(checkPrerequisitesComplete);

describe("checkHierarchicalPrerequisitesComplete", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
    jest.clearAllMocks();
  });

  const createMockObject = (
    id: string,
    parent?: string,
    prerequisites: string[] = [],
  ): TrellisObject => ({
    id,
    type: TrellisObjectType.TASK,
    title: `Test ${id}`,
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent,
    prerequisites,
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    created: "2023-01-01T00:00:00.000Z",
    updated: "2023-01-01T00:00:00.000Z",
    body: "",
  });

  describe("object with no prerequisites and no parent", () => {
    it("should return true when object has no prerequisites and no parent", async () => {
      const testObject = createMockObject("T-test");
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
    });
  });

  describe("object with prerequisites but no parent", () => {
    it("should return true when object has complete prerequisites and no parent", async () => {
      const testObject = createMockObject("T-test", undefined, ["T-prereq"]);
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
    });

    it("should return false when object has incomplete prerequisites", async () => {
      const testObject = createMockObject("T-test", undefined, ["T-prereq"]);
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(false);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
    });
  });

  describe("object with parent hierarchy", () => {
    it("should return true when object and parent both have complete prerequisites", async () => {
      const parent = createMockObject("F-parent", undefined, ["F-prereq"]);
      const testObject = createMockObject("T-test", "F-parent", ["T-prereq"]);

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById.mockResolvedValue(parent);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(2);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        parent,
        mockRepository,
      );
      expect(mockRepository.getObjectById).toHaveBeenCalledWith("F-parent");
    });

    it("should return false when object has complete prerequisites but parent has incomplete prerequisites", async () => {
      const parent = createMockObject("F-parent", undefined, ["F-prereq"]);
      const testObject = createMockObject("T-test", "F-parent", ["T-prereq"]);

      mockCheckPrerequisitesComplete
        .mockResolvedValueOnce(true) // Object's prerequisites complete
        .mockResolvedValueOnce(false); // Parent's prerequisites incomplete

      mockRepository.getObjectById.mockResolvedValue(parent);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(false);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(2);
      expect(mockRepository.getObjectById).toHaveBeenCalledWith("F-parent");
    });

    it("should return false when object has incomplete prerequisites regardless of parent", async () => {
      const testObject = createMockObject("T-test", "F-parent", ["T-prereq"]);

      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(false);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(1);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
    });
  });

  describe("deep hierarchy", () => {
    it("should check prerequisites through multiple parent levels", async () => {
      const grandparent = createMockObject("E-grandparent", undefined, [
        "E-prereq",
      ]);
      const parent = createMockObject("F-parent", "E-grandparent", [
        "F-prereq",
      ]);
      const testObject = createMockObject("T-test", "F-parent", ["T-prereq"]);

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById
        .mockResolvedValueOnce(parent) // First call for F-parent
        .mockResolvedValueOnce(grandparent); // Second call for E-grandparent

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(3);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        parent,
        mockRepository,
      );
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        grandparent,
        mockRepository,
      );
      expect(mockRepository.getObjectById).toHaveBeenCalledWith("F-parent");
      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "E-grandparent",
      );
    });

    it("should return false when grandparent has incomplete prerequisites", async () => {
      const grandparent = createMockObject("E-grandparent", undefined, [
        "E-prereq",
      ]);
      const parent = createMockObject("F-parent", "E-grandparent", [
        "F-prereq",
      ]);
      const testObject = createMockObject("T-test", "F-parent", ["T-prereq"]);

      mockCheckPrerequisitesComplete
        .mockResolvedValueOnce(true) // Object's prerequisites complete
        .mockResolvedValueOnce(true) // Parent's prerequisites complete
        .mockResolvedValueOnce(false); // Grandparent's prerequisites incomplete

      mockRepository.getObjectById
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce(grandparent);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(false);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(3);
    });
  });

  describe("missing parent handling", () => {
    it("should return true when parent object is not found", async () => {
      const testObject = createMockObject("T-test", "F-missing-parent");

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "F-missing-parent",
      );
    });

    it("should return true when getObjectById throws an error", async () => {
      const testObject = createMockObject("T-test", "F-error-parent");

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById.mockRejectedValue(
        new Error("Database error"),
      );

      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );

      expect(result).toBe(true);
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledWith(
        testObject,
        mockRepository,
      );
      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "F-error-parent",
      );
    });
  });

  describe("circular reference protection", () => {
    it("should prevent infinite loops with circular parent references", async () => {
      const objectA = createMockObject("T-object-a", "T-object-b");
      const objectB = createMockObject("T-object-b", "T-object-a");

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById
        .mockResolvedValueOnce(objectB) // First call returns object B
        .mockResolvedValueOnce(objectA); // Second call returns object A

      const result = await checkHierarchicalPrerequisitesComplete(
        objectA,
        mockRepository,
      );

      expect(result).toBe(true);
      // Should only check prerequisites for objectA and objectB once each
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(2);
      expect(mockRepository.getObjectById).toHaveBeenCalledTimes(2);
    });

    it("should handle self-referencing objects", async () => {
      const selfReferencing = createMockObject("T-self", "T-self");

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById.mockResolvedValue(selfReferencing);

      const result = await checkHierarchicalPrerequisitesComplete(
        selfReferencing,
        mockRepository,
      );

      expect(result).toBe(true);
      // Should only check prerequisites once due to circular reference protection
      expect(mockCheckPrerequisitesComplete).toHaveBeenCalledTimes(1);
      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-self");
    });
  });

  describe("performance", () => {
    it("should complete within acceptable time for typical hierarchy", async () => {
      const grandparent = createMockObject("E-grandparent");
      const parent = createMockObject("F-parent", "E-grandparent");
      const testObject = createMockObject("T-test", "F-parent");

      mockCheckPrerequisitesComplete.mockResolvedValue(true);
      mockRepository.getObjectById
        .mockResolvedValueOnce(parent)
        .mockResolvedValueOnce(grandparent);

      const startTime = Date.now();
      const result = await checkHierarchicalPrerequisitesComplete(
        testObject,
        mockRepository,
      );
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });
});
