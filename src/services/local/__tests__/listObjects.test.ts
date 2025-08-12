import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectSummary,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import { listObjects } from "../listObjects";

describe("listObjects", () => {
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

  const mockObjects: TrellisObject[] = [
    {
      id: "P-project-1",
      type: TrellisObjectType.PROJECT,
      title: "Project 1",
      status: TrellisObjectStatus.OPEN,
      priority: TrellisObjectPriority.HIGH,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Project 1 body",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    },
    {
      id: "T-task-1",
      type: TrellisObjectType.TASK,
      title: "Task 1",
      status: TrellisObjectStatus.IN_PROGRESS,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "F-feature-1",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "v1.0",
      childrenIds: [],
      body: "Task 1 body",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
    },
  ];

  describe("object filtering", () => {
    it("should filter objects by type", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      const result = await listObjects(
        mockRepository,
        TrellisObjectType.PROJECT,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.PROJECT,
        undefined,
        undefined,
      );

      const expectedSummaries: TrellisObjectSummary[] = mockObjects.map(
        (obj) => ({
          id: obj.id,
          type: obj.type,
          title: obj.title,
          status: obj.status,
          priority: obj.priority,
          parent: obj.parent,
          prerequisites: obj.prerequisites,
          childrenIds: obj.childrenIds,
          created: obj.created,
          updated: obj.updated,
        }),
      );

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(expectedSummaries, null, 2),
          },
        ],
      });
    });

    it("should filter objects by status", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        TrellisObjectStatus.IN_PROGRESS,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        TrellisObjectStatus.IN_PROGRESS,
        undefined,
      );
    });

    it("should filter objects by priority", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        undefined,
        TrellisObjectPriority.HIGH,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        TrellisObjectPriority.HIGH,
      );
    });

    it("should filter objects by scope", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);
      const scope = "P-my-project";

      await listObjects(mockRepository, TrellisObjectType.EPIC, scope);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        scope,
        TrellisObjectType.EPIC,
        undefined,
        undefined,
      );
    });

    it("should handle includeClosed parameter", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        undefined,
        undefined,
        true,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        true,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        undefined,
      );
    });

    it("should default includeClosed to false", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(mockRepository, TrellisObjectType.TASK);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        undefined,
      );
    });

    it("should handle complex filtering scenarios", async () => {
      const filteredObjects = [mockObjects[1]]; // Only the task
      mockRepository.getObjects.mockResolvedValue(filteredObjects);

      const result = await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        "F-feature-1",
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.MEDIUM,
        true,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        true,
        "F-feature-1",
        TrellisObjectType.TASK,
        TrellisObjectStatus.IN_PROGRESS,
        TrellisObjectPriority.MEDIUM,
      );

      const expectedSummaries: TrellisObjectSummary[] = filteredObjects.map(
        (obj) => ({
          id: obj.id,
          type: obj.type,
          title: obj.title,
          status: obj.status,
          priority: obj.priority,
          parent: obj.parent,
          prerequisites: obj.prerequisites,
          childrenIds: obj.childrenIds,
          created: obj.created,
          updated: obj.updated,
        }),
      );

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(expectedSummaries, null, 2),
          },
        ],
      });
    });
  });

  describe("result formatting", () => {
    it("should return object summaries as JSON array", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      const result = await listObjects(
        mockRepository,
        TrellisObjectType.PROJECT,
      );

      const expectedSummaries: TrellisObjectSummary[] = mockObjects.map(
        (obj) => ({
          id: obj.id,
          type: obj.type,
          title: obj.title,
          status: obj.status,
          priority: obj.priority,
          parent: obj.parent,
          prerequisites: obj.prerequisites,
          childrenIds: obj.childrenIds,
          created: obj.created,
          updated: obj.updated,
        }),
      );

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify(expectedSummaries, null, 2),
          },
        ],
      });
    });

    it("should return empty array when no objects found", async () => {
      mockRepository.getObjects.mockResolvedValue([]);

      const result = await listObjects(mockRepository, TrellisObjectType.TASK);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: JSON.stringify([], null, 2),
          },
        ],
      });
    });
  });

  describe("error handling", () => {
    it("should handle repository errors gracefully", async () => {
      const errorMessage = "Database connection failed";
      mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

      const result = await listObjects(mockRepository, TrellisObjectType.TASK);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error listing objects: ${errorMessage}`,
          },
        ],
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockRepository.getObjects.mockRejectedValue("String error");

      const result = await listObjects(mockRepository, TrellisObjectType.TASK);

      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: "Error listing objects: String error",
          },
        ],
      });
    });
  });

  describe("enum filtering verification", () => {
    it.each([
      TrellisObjectType.PROJECT,
      TrellisObjectType.EPIC,
      TrellisObjectType.FEATURE,
      TrellisObjectType.TASK,
    ])("should handle object type %s correctly", async (objectType) => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(mockRepository, objectType);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        objectType,
        undefined,
        undefined,
      );
    });

    it.each([
      TrellisObjectStatus.DRAFT,
      TrellisObjectStatus.OPEN,
      TrellisObjectStatus.IN_PROGRESS,
      TrellisObjectStatus.DONE,
      TrellisObjectStatus.WONT_DO,
    ])("should handle status %s correctly", async (status) => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        status,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        status,
        undefined,
      );
    });

    it.each([
      TrellisObjectPriority.HIGH,
      TrellisObjectPriority.MEDIUM,
      TrellisObjectPriority.LOW,
    ])("should handle priority %s correctly", async (priority) => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);

      await listObjects(
        mockRepository,
        TrellisObjectType.TASK,
        undefined,
        undefined,
        priority,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
        undefined,
        priority,
      );
    });
  });
});
