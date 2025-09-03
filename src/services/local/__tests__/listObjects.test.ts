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
      getChildrenOf: jest.fn(),
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
      parent: null,
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
        [TrellisObjectType.PROJECT],
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
        [TrellisObjectType.TASK],
        [TrellisObjectStatus.IN_PROGRESS],
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
        [TrellisObjectType.TASK],
        undefined,
        [TrellisObjectPriority.HIGH],
      );
    });

    it("should filter objects by scope", async () => {
      mockRepository.getObjects.mockResolvedValue(mockObjects);
      const scope = "P-my-project";

      await listObjects(mockRepository, TrellisObjectType.EPIC, scope);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        scope,
        [TrellisObjectType.EPIC],
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
        [TrellisObjectType.TASK],
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
        [TrellisObjectType.TASK],
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
        [TrellisObjectType.TASK],
        [TrellisObjectStatus.IN_PROGRESS],
        [TrellisObjectPriority.MEDIUM],
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
        [objectType],
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
        [TrellisObjectType.TASK],
        [status],
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
        [TrellisObjectType.TASK],
        undefined,
        [priority],
      );
    });
  });

  describe("array input processing", () => {
    describe("multiple type filtering", () => {
      it("should accept multiple type values as array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, [
          TrellisObjectType.PROJECT,
          TrellisObjectType.TASK,
        ]);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.PROJECT, TrellisObjectType.TASK],
          undefined,
          undefined,
        );
      });

      it("should handle single type value wrapped in array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, [TrellisObjectType.PROJECT]);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.PROJECT],
          undefined,
          undefined,
        );
      });

      it("should handle undefined type", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, undefined);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          undefined,
          undefined,
          undefined,
        );
      });
    });

    describe("multiple status filtering", () => {
      it("should accept multiple status values as array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, TrellisObjectType.TASK, undefined, [
          TrellisObjectStatus.OPEN,
          TrellisObjectStatus.IN_PROGRESS,
        ]);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS],
          undefined,
        );
      });

      it("should handle single status value wrapped in array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, TrellisObjectType.TASK, undefined, [
          TrellisObjectStatus.OPEN,
        ]);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          [TrellisObjectStatus.OPEN],
          undefined,
        );
      });
    });

    describe("multiple priority filtering", () => {
      it("should accept multiple priority values as array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          undefined,
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          undefined,
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
        );
      });

      it("should handle single priority value wrapped in array", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          undefined,
          [TrellisObjectPriority.HIGH],
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          undefined,
          [TrellisObjectPriority.HIGH],
        );
      });
    });

    describe("mixed single and multiple value inputs", () => {
      it("should handle mixed single type and multiple status", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(mockRepository, TrellisObjectType.TASK, undefined, [
          TrellisObjectStatus.OPEN,
          TrellisObjectStatus.IN_PROGRESS,
        ]);

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.IN_PROGRESS],
          undefined,
        );
      });

      it("should handle multiple types with single priority", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          [TrellisObjectType.FEATURE, TrellisObjectType.TASK],
          undefined,
          undefined,
          TrellisObjectPriority.HIGH,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.FEATURE, TrellisObjectType.TASK],
          undefined,
          [TrellisObjectPriority.HIGH],
        );
      });

      it("should handle complex mixed array and single value combinations", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          [TrellisObjectType.PROJECT, TrellisObjectType.EPIC],
          "P-project-scope",
          TrellisObjectStatus.OPEN,
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
          true,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          true,
          "P-project-scope",
          [TrellisObjectType.PROJECT, TrellisObjectType.EPIC],
          [TrellisObjectStatus.OPEN],
          [TrellisObjectPriority.HIGH, TrellisObjectPriority.MEDIUM],
        );
      });
    });

    describe("input normalization logic", () => {
      it("should normalize single values to arrays", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          TrellisObjectType.TASK,
          undefined,
          TrellisObjectStatus.OPEN,
          TrellisObjectPriority.HIGH,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK],
          [TrellisObjectStatus.OPEN],
          [TrellisObjectPriority.HIGH],
        );
      });

      it("should preserve arrays as arrays", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          [TrellisObjectType.TASK, TrellisObjectType.FEATURE],
          undefined,
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.DONE],
          [TrellisObjectPriority.HIGH],
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.TASK, TrellisObjectType.FEATURE],
          [TrellisObjectStatus.OPEN, TrellisObjectStatus.DONE],
          [TrellisObjectPriority.HIGH],
        );
      });

      it("should handle undefined values as undefined", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          undefined,
          undefined,
          undefined,
          undefined,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          undefined,
          undefined,
          undefined,
        );
      });
    });

    describe("backward compatibility", () => {
      it("should maintain compatibility with existing single value calls", async () => {
        mockRepository.getObjects.mockResolvedValue(mockObjects);

        await listObjects(
          mockRepository,
          TrellisObjectType.PROJECT,
          "P-project",
          TrellisObjectStatus.OPEN,
          TrellisObjectPriority.HIGH,
          true,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          true,
          "P-project",
          [TrellisObjectType.PROJECT],
          [TrellisObjectStatus.OPEN],
          [TrellisObjectPriority.HIGH],
        );

        const result = await listObjects(
          mockRepository,
          TrellisObjectType.PROJECT,
        );
        expect(result.content[0].type).toBe("text");
        expect(JSON.parse(result.content[0].text)).toHaveLength(
          mockObjects.length,
        );
      });

      it("should work with all existing test scenarios", async () => {
        mockRepository.getObjects.mockResolvedValue([mockObjects[0]]);

        const result = await listObjects(
          mockRepository,
          TrellisObjectType.PROJECT,
        );

        expect(mockRepository.getObjects).toHaveBeenCalledWith(
          false,
          undefined,
          [TrellisObjectType.PROJECT],
          undefined,
          undefined,
        );

        expect(result).toEqual({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                [
                  {
                    id: mockObjects[0].id,
                    type: mockObjects[0].type,
                    title: mockObjects[0].title,
                    status: mockObjects[0].status,
                    priority: mockObjects[0].priority,
                    parent: mockObjects[0].parent,
                    prerequisites: mockObjects[0].prerequisites,
                    childrenIds: mockObjects[0].childrenIds,
                    created: mockObjects[0].created,
                    updated: mockObjects[0].updated,
                  },
                ],
                null,
                2,
              ),
            },
          ],
        });
      });
    });
  });
});
