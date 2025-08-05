import { join } from "path";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
  TrellisObject,
} from "../../../models";
import { getObjectFilePath } from "../getObjectFilePath";
import * as getObjectByIdModule from "../getObjectById";

// Mock the getObjectById function
jest.mock("../getObjectById");
const mockGetObjectById = jest.mocked(getObjectByIdModule.getObjectById);

describe("getObjectFilePath", () => {
  const testPlanningRoot = "/test/planning/root";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockObject = (
    id: string,
    type: TrellisObjectType,
    parent?: string,
    status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
  ): TrellisObject => ({
    id,
    type,
    title: `Test ${id}`,
    status,
    priority: TrellisObjectPriority.MEDIUM,
    parent,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "",
  });

  describe("Project objects", () => {
    it("should return correct path for project", async () => {
      const project = createMockObject(
        "P-test-project",
        TrellisObjectType.PROJECT,
      );

      const result = await getObjectFilePath(project, testPlanningRoot);

      expect(result).toBe(
        join(testPlanningRoot, "p", "P-test-project", "P-test-project.md"),
      );
    });
  });

  describe("Epic objects", () => {
    it("should return correct path for epic with parent", async () => {
      const epic = createMockObject(
        "E-test-epic",
        TrellisObjectType.EPIC,
        "P-test-project",
      );

      const result = await getObjectFilePath(epic, testPlanningRoot);

      expect(result).toBe(
        join(
          testPlanningRoot,
          "p",
          "P-test-project",
          "e",
          "E-test-epic",
          "E-test-epic.md",
        ),
      );
    });

    it("should throw error for epic without parent", async () => {
      const epic = createMockObject("E-test-epic", TrellisObjectType.EPIC);

      await expect(getObjectFilePath(epic, testPlanningRoot)).rejects.toThrow(
        "Epic E-test-epic must have a parent project",
      );
    });
  });

  describe("Feature objects", () => {
    it("should return correct path for standalone feature", async () => {
      const feature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
      );

      const result = await getObjectFilePath(feature, testPlanningRoot);

      expect(result).toBe(
        join(testPlanningRoot, "f", "F-test-feature", "F-test-feature.md"),
      );
    });

    it("should return correct path for feature under epic", async () => {
      const feature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "E-test-epic",
      );
      const mockEpic = createMockObject(
        "E-test-epic",
        TrellisObjectType.EPIC,
        "P-test-project",
      );

      mockGetObjectById.mockResolvedValueOnce(mockEpic);

      const result = await getObjectFilePath(feature, testPlanningRoot);

      expect(result).toBe(
        join(
          testPlanningRoot,
          "p",
          "P-test-project",
          "e",
          "E-test-epic",
          "f",
          "F-test-feature",
          "F-test-feature.md",
        ),
      );
      expect(mockGetObjectById).toHaveBeenCalledWith(
        "E-test-epic",
        testPlanningRoot,
      );
    });

    it("should throw error when epic parent has no project", async () => {
      const feature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "E-test-epic",
      );
      const mockEpic = createMockObject("E-test-epic", TrellisObjectType.EPIC); // No parent

      mockGetObjectById.mockResolvedValueOnce(mockEpic);

      await expect(
        getObjectFilePath(feature, testPlanningRoot),
      ).rejects.toThrow("Epic E-test-epic must have a parent project");
    });

    it("should throw error when feature parent is not epic", async () => {
      const feature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "P-test-project",
      );
      const mockProject = createMockObject(
        "P-test-project",
        TrellisObjectType.PROJECT,
      );

      mockGetObjectById.mockResolvedValueOnce(mockProject);

      await expect(
        getObjectFilePath(feature, testPlanningRoot),
      ).rejects.toThrow("Feature F-test-feature parent must be an epic");
    });
  });

  describe("Task objects", () => {
    it("should return correct path for standalone task with open status", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        undefined,
        TrellisObjectStatus.OPEN,
      );

      const result = await getObjectFilePath(task, testPlanningRoot);

      expect(result).toBe(
        join(testPlanningRoot, "t", "open", "T-test-task.md"),
      );
    });

    it("should return correct path for standalone task with closed status", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        undefined,
        TrellisObjectStatus.DONE,
      );

      const result = await getObjectFilePath(task, testPlanningRoot);

      expect(result).toBe(
        join(testPlanningRoot, "t", "closed", "T-test-task.md"),
      );
    });

    it("should return correct path for standalone task with wont-do status", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        undefined,
        TrellisObjectStatus.WONT_DO,
      );

      const result = await getObjectFilePath(task, testPlanningRoot);

      expect(result).toBe(
        join(testPlanningRoot, "t", "closed", "T-test-task.md"),
      );
    });

    it("should return correct path for task under standalone feature", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        "F-test-feature",
        TrellisObjectStatus.OPEN,
      );
      const mockFeature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
      ); // No parent

      mockGetObjectById.mockResolvedValueOnce(mockFeature);

      const result = await getObjectFilePath(task, testPlanningRoot);

      expect(result).toBe(
        join(
          testPlanningRoot,
          "f",
          "F-test-feature",
          "t",
          "open",
          "T-test-task.md",
        ),
      );
    });

    it("should return correct path for task under feature in project hierarchy", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        "F-test-feature",
        TrellisObjectStatus.IN_PROGRESS,
      );
      const mockFeature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "E-test-epic",
      );
      const mockEpic = createMockObject(
        "E-test-epic",
        TrellisObjectType.EPIC,
        "P-test-project",
      );

      mockGetObjectById.mockResolvedValueOnce(mockFeature);
      mockGetObjectById.mockResolvedValueOnce(mockEpic);

      const result = await getObjectFilePath(task, testPlanningRoot);

      expect(result).toBe(
        join(
          testPlanningRoot,
          "p",
          "P-test-project",
          "e",
          "E-test-epic",
          "f",
          "F-test-feature",
          "t",
          "open",
          "T-test-task.md",
        ),
      );
    });

    it("should throw error when task parent is not feature", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        "E-test-epic",
      );
      const mockEpic = createMockObject(
        "E-test-epic",
        TrellisObjectType.EPIC,
        "P-test-project",
      );

      mockGetObjectById.mockResolvedValueOnce(mockEpic);

      await expect(getObjectFilePath(task, testPlanningRoot)).rejects.toThrow(
        "Task T-test-task parent must be a feature",
      );
    });

    it("should throw error when feature parent is not epic", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        "F-test-feature",
      );
      const mockFeature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "E-test-epic",
      );
      const mockProject = createMockObject(
        "P-test-project",
        TrellisObjectType.PROJECT,
      ); // Wrong type

      mockGetObjectById.mockResolvedValueOnce(mockFeature);
      mockGetObjectById.mockResolvedValueOnce(mockProject);

      await expect(getObjectFilePath(task, testPlanningRoot)).rejects.toThrow(
        "Feature parent E-test-epic must be an epic",
      );
    });

    it("should throw error when epic has no parent project", async () => {
      const task = createMockObject(
        "T-test-task",
        TrellisObjectType.TASK,
        "F-test-feature",
      );
      const mockFeature = createMockObject(
        "F-test-feature",
        TrellisObjectType.FEATURE,
        "E-test-epic",
      );
      const mockEpic = createMockObject("E-test-epic", TrellisObjectType.EPIC); // No parent

      mockGetObjectById.mockResolvedValueOnce(mockFeature);
      mockGetObjectById.mockResolvedValueOnce(mockEpic);

      await expect(getObjectFilePath(task, testPlanningRoot)).rejects.toThrow(
        "Epic E-test-epic must have a parent project",
      );
    });
  });

  describe("Unknown object type", () => {
    it("should throw error for unknown object type", async () => {
      const unknownObject = {
        ...createMockObject("X-unknown", TrellisObjectType.PROJECT),
        type: "unknown" as any,
      };

      await expect(
        getObjectFilePath(unknownObject, testPlanningRoot),
      ).rejects.toThrow("Unknown object type: unknown");
    });
  });
});
