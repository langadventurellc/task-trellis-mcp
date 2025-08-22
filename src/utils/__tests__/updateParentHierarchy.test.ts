import { TrellisObject } from "../../models/TrellisObject";
import { TrellisObjectType } from "../../models/TrellisObjectType";
import { TrellisObjectStatus } from "../../models/TrellisObjectStatus";
import { TrellisObjectPriority } from "../../models/TrellisObjectPriority";
import { Repository } from "../../repositories/Repository";
import { updateParentHierarchy } from "../updateParentHierarchy";

describe("updateParentHierarchy", () => {
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
    status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
    parent?: string,
  ): TrellisObject => ({
    id,
    type: TrellisObjectType.TASK,
    title: `Test ${id}`,
    status,
    priority: TrellisObjectPriority.MEDIUM,
    parent,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "v1.0",
    childrenIds: [],
    created: "2023-01-01T00:00:00.000Z",
    updated: "2023-01-01T00:00:00.000Z",
    body: "",
  });

  describe("when parentId is undefined", () => {
    it("should return early without making any repository calls", async () => {
      await updateParentHierarchy(undefined, mockRepository);

      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });
  });

  describe("when parent does not exist", () => {
    it("should return early without making save calls", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-parent");
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });
  });

  describe("when parent is already in progress", () => {
    it("should return early without making save calls", async () => {
      const parentObject = createMockObject(
        "P-parent",
        TrellisObjectStatus.IN_PROGRESS,
      );
      mockRepository.getObjectById.mockResolvedValue(parentObject);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-parent");
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });
  });

  describe("when parent needs to be updated", () => {
    it("should update parent status to in-progress", async () => {
      const parentObject = createMockObject(
        "P-parent",
        TrellisObjectStatus.OPEN,
      );
      mockRepository.getObjectById.mockResolvedValue(parentObject);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-parent");
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...parentObject,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
    });

    it("should update parent hierarchy recursively", async () => {
      const grandParentObject = createMockObject(
        "GP-grandparent",
        TrellisObjectStatus.OPEN,
      );
      const parentObject = createMockObject(
        "P-parent",
        TrellisObjectStatus.OPEN,
        "GP-grandparent",
      );

      mockRepository.getObjectById
        .mockResolvedValueOnce(parentObject)
        .mockResolvedValueOnce(grandParentObject);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-parent");
      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "GP-grandparent",
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...parentObject,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...grandParentObject,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
    });

    it("should stop recursion when encountering an already in-progress parent", async () => {
      const grandParentObject = createMockObject(
        "GP-grandparent",
        TrellisObjectStatus.IN_PROGRESS,
      );
      const parentObject = createMockObject(
        "P-parent",
        TrellisObjectStatus.OPEN,
        "GP-grandparent",
      );

      mockRepository.getObjectById
        .mockResolvedValueOnce(parentObject)
        .mockResolvedValueOnce(grandParentObject);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-parent");
      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "GP-grandparent",
      );
      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...parentObject,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
    });
  });

  describe("infinite recursion prevention", () => {
    it("should prevent infinite recursion with visited IDs", async () => {
      const parentObject = createMockObject(
        "P-parent",
        TrellisObjectStatus.OPEN,
        "P-parent",
      );
      mockRepository.getObjectById.mockResolvedValue(parentObject);

      await updateParentHierarchy("P-parent", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should handle circular references in parent hierarchy", async () => {
      const parentA = createMockObject("P-A", TrellisObjectStatus.OPEN, "P-B");
      const parentB = createMockObject("P-B", TrellisObjectStatus.OPEN, "P-A");

      mockRepository.getObjectById.mockImplementation((id: string) => {
        if (id === "P-A") return Promise.resolve(parentA);
        if (id === "P-B") return Promise.resolve(parentB);
        return Promise.resolve(null);
      });

      await updateParentHierarchy("P-A", mockRepository);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-A");
      expect(mockRepository.getObjectById).toHaveBeenCalledWith("P-B");
      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
    });
  });

  describe("with custom visited IDs set", () => {
    it("should respect pre-existing visited IDs", async () => {
      const visitedIds = new Set(["P-parent"]);

      await updateParentHierarchy("P-parent", mockRepository, visitedIds);

      expect(mockRepository.getObjectById).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });
  });
});
