import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import * as filterUtils from "../../../utils/filterUnavailableObjects";
import * as sortUtils from "../../../utils/sortTrellisObjects";
import { claimTask } from "../claimTask";

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

describe("claimTask service function", () => {
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
    body: "This is a test task",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    ...overrides,
  });

  const createMockProject = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "P-test-project",
    type: TrellisObjectType.PROJECT,
    title: "Test Project",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.HIGH,
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "This is a test project",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    ...overrides,
  });

  const createMockFeature = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "F-test-feature",
    type: TrellisObjectType.FEATURE,
    title: "Test Feature",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "E-test-epic",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "This is a test feature",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    ...overrides,
  });

  const createMockEpic = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "E-test-epic",
    type: TrellisObjectType.EPIC,
    title: "Test Epic",
    status: TrellisObjectStatus.OPEN,
    priority: TrellisObjectPriority.HIGH,
    parent: "P-test-project",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    childrenIds: [],
    body: "This is a test epic",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    // Reset mocks
    mockFilterUnavailableObjects.mockReset();
    mockSortTrellisObjects.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("with taskId specified", () => {
    it("should successfully claim a valid task", async () => {
      const mockTask = createMockTask();
      const mockFeature = createMockFeature();
      const mockEpic = createMockEpic();
      const mockProject = createMockProject();

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // First call for the task
        .mockResolvedValueOnce(mockFeature) // Second call for feature parent
        .mockResolvedValueOnce(mockEpic) // Third call for epic parent
        .mockResolvedValueOnce(mockProject); // Fourth call for project parent

      mockRepository.getObjects.mockResolvedValue([mockTask]);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should throw error when task is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-nonexistent",
      );

      expect(result.content[0].text).toContain(
        'Task with ID "T-nonexistent" not found',
      );
    });

    it("should throw error when object is not a task", async () => {
      const mockProject = createMockProject();
      mockRepository.getObjectById.mockResolvedValue(mockProject);

      const result = await claimTask(
        mockRepository,
        undefined,
        "P-test-project",
      );

      expect(result.content[0].text).toContain(
        'Object with ID "P-test-project" is not a task',
      );
    });

    it("should throw error when task status is not draft or open (without force)", async () => {
      const mockTask = createMockTask({
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "cannot be claimed (status: in-progress)",
      );
    });

    it("should throw error when prerequisites are not complete (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: ["T-prerequisite"] });
      const mockPrerequisite = createMockTask({
        id: "T-prerequisite",
        status: TrellisObjectStatus.OPEN,
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask, mockPrerequisite]);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "Not all prerequisites are complete",
      );
    });

    it("should allow claiming when prerequisites are done (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: ["T-prerequisite"] });
      const mockPrerequisite = createMockTask({
        id: "T-prerequisite",
        status: TrellisObjectStatus.DONE,
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask, mockPrerequisite]);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should allow claiming when prerequisites are wont-do (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: ["T-prerequisite"] });
      const mockPrerequisite = createMockTask({
        id: "T-prerequisite",
        status: TrellisObjectStatus.WONT_DO,
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask, mockPrerequisite]);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should allow claiming when prerequisites are external (not in system)", async () => {
      const mockTask = createMockTask({
        prerequisites: ["EXTERNAL-prerequisite"],
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask]);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should bypass all checks when force is true", async () => {
      const mockTask = createMockTask({
        status: TrellisObjectStatus.IN_PROGRESS,
        prerequisites: ["T-incomplete-prerequisite"],
      });
      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        true,
      );

      expect(mockRepository.getObjects).not.toHaveBeenCalled();
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should still validate object type even with force", async () => {
      const mockProject = createMockProject();
      mockRepository.getObjectById.mockResolvedValue(mockProject);

      const result = await claimTask(
        mockRepository,
        undefined,
        "P-test-project",
        true,
      );

      expect(result.content[0].text).toContain(
        'Object with ID "P-test-project" is not a task',
      );
    });
  });

  describe("without taskId specified", () => {
    it("should claim highest priority available task", async () => {
      const mockTasks = [
        createMockTask({ id: "T-task-1", priority: TrellisObjectPriority.LOW }),
        createMockTask({
          id: "T-task-2",
          priority: TrellisObjectPriority.HIGH,
        }),
        createMockTask({
          id: "T-task-3",
          priority: TrellisObjectPriority.MEDIUM,
        }),
      ];

      const availableTasks = [mockTasks[1]]; // Only high priority task is available
      const sortedTasks = [mockTasks[1]]; // Highest priority first

      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockFilterUnavailableObjects.mockReturnValue(availableTasks);
      mockSortTrellisObjects.mockReturnValue(sortedTasks);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
      );
      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(mockTasks);
      expect(mockSortTrellisObjects).toHaveBeenCalledWith(availableTasks);
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTasks[1],
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should use scope when provided", async () => {
      const mockTasks = [createMockTask()];
      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockFilterUnavailableObjects.mockReturnValue(mockTasks);
      mockSortTrellisObjects.mockReturnValue(mockTasks);
      mockRepository.saveObject.mockResolvedValue();

      await claimTask(mockRepository, "F-test-feature");

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        "F-test-feature",
        TrellisObjectType.TASK,
      );
    });

    it("should throw error when no available tasks", async () => {
      mockRepository.getObjects.mockResolvedValue([]);
      mockFilterUnavailableObjects.mockReturnValue([]);

      const result = await claimTask(mockRepository);

      expect(result.content[0].text).toContain("No available tasks to claim");
    });

    it("should throw error when all tasks are filtered out", async () => {
      const mockTasks = [
        createMockTask({ status: TrellisObjectStatus.IN_PROGRESS }),
        createMockTask({ status: TrellisObjectStatus.DONE }),
      ];

      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockFilterUnavailableObjects.mockReturnValue([]);

      const result = await claimTask(mockRepository);

      expect(result.content[0].text).toContain("No available tasks to claim");
    });
  });

  describe("error handling", () => {
    it("should handle repository getObjectById errors", async () => {
      const errorMessage = "Database connection failed";
      mockRepository.getObjectById.mockRejectedValue(new Error(errorMessage));

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(result.content[0].text).toContain(
        `Error claiming task: ${errorMessage}`,
      );
    });

    it("should handle repository getObjects errors", async () => {
      const errorMessage = "Database query failed";
      mockRepository.getObjects.mockRejectedValue(new Error(errorMessage));

      const result = await claimTask(mockRepository);

      expect(result.content[0].text).toContain(
        `Error claiming task: ${errorMessage}`,
      );
    });

    it("should handle repository saveObject errors", async () => {
      const mockTask = createMockTask();
      const errorMessage = "Save operation failed";

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask]);
      mockRepository.saveObject.mockRejectedValue(new Error(errorMessage));

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(result.content[0].text).toContain(
        `Error claiming task: ${errorMessage}`,
      );
    });

    it("should handle non-Error exceptions", async () => {
      const errorValue = "String error";
      mockRepository.getObjectById.mockRejectedValue(errorValue);

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(result.content[0].text).toContain(
        `Error claiming task: ${errorValue}`,
      );
    });
  });

  describe("parent hierarchy updates", () => {
    it("should update feature parent to in-progress when claiming task", async () => {
      const mockFeature = createMockFeature({
        status: TrellisObjectStatus.OPEN,
      });
      const mockTask = createMockTask({ parent: "F-test-feature" });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // First call for the task
        .mockResolvedValueOnce(mockFeature); // Second call for the parent feature
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(1, {
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should update full hierarchy (feature → epic → project) when claiming task", async () => {
      const mockProject = createMockProject({
        status: TrellisObjectStatus.OPEN,
      });
      const mockEpic = createMockEpic({ status: TrellisObjectStatus.OPEN });
      const mockFeature = createMockFeature({
        status: TrellisObjectStatus.OPEN,
      });
      const mockTask = createMockTask({ parent: "F-test-feature" });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // Task
        .mockResolvedValueOnce(mockFeature) // Feature
        .mockResolvedValueOnce(mockEpic) // Epic
        .mockResolvedValueOnce(mockProject); // Project
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(4);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(1, {
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(3, {
        ...mockEpic,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(4, {
        ...mockProject,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should stop updating hierarchy when parent is already in-progress", async () => {
      const mockEpic = createMockEpic({
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      const mockFeature = createMockFeature({
        status: TrellisObjectStatus.OPEN,
      });
      const mockTask = createMockTask({ parent: "F-test-feature" });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // Task
        .mockResolvedValueOnce(mockFeature) // Feature
        .mockResolvedValueOnce(mockEpic); // Epic (already in progress)
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(1, {
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      // Should not save the epic since it's already in progress
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should handle task with no parent gracefully", async () => {
      const mockTask = createMockTask({ parent: undefined });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should handle non-existent parent gracefully", async () => {
      const mockTask = createMockTask({ parent: "F-nonexistent" });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // Task exists
        .mockResolvedValueOnce(null); // Parent doesn't exist
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should handle parent hierarchy update errors without failing task claim", async () => {
      const mockTask = createMockTask({ parent: "F-test-feature" });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // Task lookup succeeds
        .mockRejectedValueOnce(new Error("Parent lookup failed")); // Parent lookup fails
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository, undefined, "T-test-task");

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should update parents even when using force flag", async () => {
      const mockFeature = createMockFeature({
        status: TrellisObjectStatus.OPEN,
      });
      const mockTask = createMockTask({
        parent: "F-test-feature",
        status: TrellisObjectStatus.IN_PROGRESS, // Already in progress
      });

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        true,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });
  });
});
