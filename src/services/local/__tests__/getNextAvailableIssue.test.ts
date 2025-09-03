import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import * as filterUtils from "../../../utils/filterUnavailableObjects";
import * as sortUtils from "../../../utils/sortTrellisObjects";
import { getNextAvailableIssue } from "../getNextAvailableIssue";

// Mock the utility functions
jest.mock("../../../utils/filterUnavailableObjects");
jest.mock("../../../utils/sortTrellisObjects");

const mockFilterUnavailableObjects =
  filterUtils.filterUnavailableObjects as jest.MockedFunction<
    typeof filterUtils.filterUnavailableObjects
  >;
const mockSortTrellisObjects =
  sortUtils.sortTrellisObjects as jest.MockedFunction<
    typeof sortUtils.sortTrellisObjects
  >;

describe("getNextAvailableIssue service function", () => {
  let mockRepository: jest.Mocked<Repository>;

  const createMockTask = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "T-test-task",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "F-test-feature",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    created: "2025-09-03T00:00:00.000Z",
    updated: "2025-09-03T00:00:00.000Z",
    body: "Test task description",
    ...overrides,
  });

  const createMockFeature = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "F-test-feature",
    type: TrellisObjectType.FEATURE,
    title: "Test Feature",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.HIGH,
    parent: "E-test-epic",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: ["T-test-task"],
    created: "2025-09-03T00:00:00.000Z",
    updated: "2025-09-03T00:00:00.000Z",
    body: "Test feature description",
    ...overrides,
  });

  const _createMockEpic = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "E-test-epic",
    type: TrellisObjectType.EPIC,
    title: "Test Epic",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.LOW,
    parent: "P-test-project",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: ["F-test-feature"],
    created: "2025-09-03T00:00:00.000Z",
    updated: "2025-09-03T00:00:00.000Z",
    body: "Test epic description",
    ...overrides,
  });

  const _createMockProject = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "P-test-project",
    type: TrellisObjectType.PROJECT,
    title: "Test Project",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: undefined,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: ["E-test-epic"],
    created: "2025-09-03T00:00:00.000Z",
    updated: "2025-09-03T00:00:00.000Z",
    body: "Test project description",
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
    };
  });

  describe("Basic Functionality", () => {
    it("should return the highest priority available issue", async () => {
      const lowPriorityTask = createMockTask({
        id: "T-low-priority",
        priority: TrellisObjectPriority.LOW,
      });
      const highPriorityTask = createMockTask({
        id: "T-high-priority",
        priority: TrellisObjectPriority.HIGH,
      });

      mockRepository.getObjects.mockResolvedValue([
        lowPriorityTask,
        highPriorityTask,
      ]);
      mockFilterUnavailableObjects.mockResolvedValue([
        lowPriorityTask,
        highPriorityTask,
      ]);
      mockSortTrellisObjects.mockReturnValue([
        highPriorityTask,
        lowPriorityTask,
      ]);

      const result = await getNextAvailableIssue(mockRepository);

      expect(result).toBe(highPriorityTask);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        undefined,
      );
      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        [lowPriorityTask, highPriorityTask],
        mockRepository,
      );
      expect(mockSortTrellisObjects).toHaveBeenCalledWith([
        lowPriorityTask,
        highPriorityTask,
      ]);
    });
  });

  describe("Type Filtering", () => {
    it("should filter by single issue type", async () => {
      const task = createMockTask();

      mockRepository.getObjects.mockResolvedValue([task]);
      mockFilterUnavailableObjects.mockResolvedValue([task]);
      mockSortTrellisObjects.mockReturnValue([task]);

      const result = await getNextAvailableIssue(
        mockRepository,
        undefined,
        TrellisObjectType.TASK,
      );

      expect(result).toBe(task);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
      );
    });

    it("should filter by array of issue types", async () => {
      const task = createMockTask();
      const feature = createMockFeature();

      mockRepository.getObjects.mockResolvedValue([task, feature]);
      mockFilterUnavailableObjects.mockResolvedValue([task, feature]);
      mockSortTrellisObjects.mockReturnValue([feature, task]);

      const result = await getNextAvailableIssue(mockRepository, undefined, [
        TrellisObjectType.TASK,
        TrellisObjectType.FEATURE,
      ]);

      expect(result).toBe(feature);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(false, undefined, [
        TrellisObjectType.TASK,
        TrellisObjectType.FEATURE,
      ]);
    });
  });

  describe("Scope Filtering", () => {
    it("should filter by scope parameter", async () => {
      const task = createMockTask();

      mockRepository.getObjects.mockResolvedValue([task]);
      mockFilterUnavailableObjects.mockResolvedValue([task]);
      mockSortTrellisObjects.mockReturnValue([task]);

      const result = await getNextAvailableIssue(
        mockRepository,
        "P-test-project",
      );

      expect(result).toBe(task);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        "P-test-project",
        undefined,
      );
    });

    it("should work with both scope and type filtering", async () => {
      const task = createMockTask();

      mockRepository.getObjects.mockResolvedValue([task]);
      mockFilterUnavailableObjects.mockResolvedValue([task]);
      mockSortTrellisObjects.mockReturnValue([task]);

      const result = await getNextAvailableIssue(
        mockRepository,
        "P-test-project",
        TrellisObjectType.TASK,
      );

      expect(result).toBe(task);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        "P-test-project",
        TrellisObjectType.TASK,
      );
    });
  });

  describe("Priority Sorting", () => {
    it("should return high priority issues before medium and low", async () => {
      const lowPriorityIssue = createMockTask({
        id: "T-low",
        priority: TrellisObjectPriority.LOW,
      });
      const mediumPriorityIssue = createMockTask({
        id: "T-medium",
        priority: TrellisObjectPriority.MEDIUM,
      });
      const highPriorityIssue = createMockTask({
        id: "T-high",
        priority: TrellisObjectPriority.HIGH,
      });

      mockRepository.getObjects.mockResolvedValue([
        lowPriorityIssue,
        mediumPriorityIssue,
        highPriorityIssue,
      ]);
      mockFilterUnavailableObjects.mockResolvedValue([
        lowPriorityIssue,
        mediumPriorityIssue,
        highPriorityIssue,
      ]);
      mockSortTrellisObjects.mockReturnValue([
        highPriorityIssue,
        mediumPriorityIssue,
        lowPriorityIssue,
      ]);

      const result = await getNextAvailableIssue(mockRepository);

      expect(result).toBe(highPriorityIssue);
      expect(mockSortTrellisObjects).toHaveBeenCalledWith([
        lowPriorityIssue,
        mediumPriorityIssue,
        highPriorityIssue,
      ]);
    });
  });

  describe("Error Scenarios", () => {
    it("should throw descriptive error when no available issues found", async () => {
      mockRepository.getObjects.mockResolvedValue([]);
      mockFilterUnavailableObjects.mockResolvedValue([]);

      await expect(getNextAvailableIssue(mockRepository)).rejects.toThrow(
        "No available issues found matching criteria",
      );

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        undefined,
      );
      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        [],
        mockRepository,
      );
      expect(mockSortTrellisObjects).not.toHaveBeenCalled();
    });

    it("should throw descriptive error when filtering removes all issues", async () => {
      const unavailableTask = createMockTask({
        status: TrellisObjectStatus.IN_PROGRESS,
      });

      mockRepository.getObjects.mockResolvedValue([unavailableTask]);
      mockFilterUnavailableObjects.mockResolvedValue([]);

      await expect(getNextAvailableIssue(mockRepository)).rejects.toThrow(
        "No available issues found matching criteria",
      );

      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        [unavailableTask],
        mockRepository,
      );
      expect(mockSortTrellisObjects).not.toHaveBeenCalled();
    });
  });

  describe("Repository Integration", () => {
    it("should call repository.getObjects with correct parameters", async () => {
      const task = createMockTask();

      mockRepository.getObjects.mockResolvedValue([task]);
      mockFilterUnavailableObjects.mockResolvedValue([task]);
      mockSortTrellisObjects.mockReturnValue([task]);

      await getNextAvailableIssue(
        mockRepository,
        "P-project",
        TrellisObjectType.FEATURE,
      );

      expect(mockRepository.getObjects).toHaveBeenCalledTimes(1);
      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        "P-project",
        TrellisObjectType.FEATURE,
      );
    });

    it("should handle repository errors gracefully", async () => {
      const repositoryError = new Error("Repository connection failed");
      mockRepository.getObjects.mockRejectedValue(repositoryError);

      await expect(getNextAvailableIssue(mockRepository)).rejects.toThrow(
        "Repository connection failed",
      );

      expect(mockFilterUnavailableObjects).not.toHaveBeenCalled();
      expect(mockSortTrellisObjects).not.toHaveBeenCalled();
    });
  });

  describe("Utility Integration", () => {
    it("should call filterUnavailableObjects with repository and objects", async () => {
      const task1 = createMockTask({ id: "T-task-1" });
      const task2 = createMockTask({ id: "T-task-2" });
      const allTasks = [task1, task2];

      mockRepository.getObjects.mockResolvedValue(allTasks);
      mockFilterUnavailableObjects.mockResolvedValue([task1]);
      mockSortTrellisObjects.mockReturnValue([task1]);

      await getNextAvailableIssue(mockRepository);

      expect(mockFilterUnavailableObjects).toHaveBeenCalledTimes(1);
      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        allTasks,
        mockRepository,
      );
    });

    it("should call sortTrellisObjects with available objects", async () => {
      const task1 = createMockTask({ id: "T-task-1" });
      const task2 = createMockTask({ id: "T-task-2" });
      const availableTasks = [task1, task2];

      mockRepository.getObjects.mockResolvedValue([task1, task2]);
      mockFilterUnavailableObjects.mockResolvedValue(availableTasks);
      mockSortTrellisObjects.mockReturnValue([task2, task1]);

      const result = await getNextAvailableIssue(mockRepository);

      expect(mockSortTrellisObjects).toHaveBeenCalledTimes(1);
      expect(mockSortTrellisObjects).toHaveBeenCalledWith(availableTasks);
      expect(result).toBe(task2);
    });

    it("should handle utility function errors gracefully", async () => {
      const task = createMockTask();
      const utilityError = new Error("Filtering failed");

      mockRepository.getObjects.mockResolvedValue([task]);
      mockFilterUnavailableObjects.mockRejectedValue(utilityError);

      await expect(getNextAvailableIssue(mockRepository)).rejects.toThrow(
        "Filtering failed",
      );

      expect(mockSortTrellisObjects).not.toHaveBeenCalled();
    });
  });
});
