import {
  TrellisObject,
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import { Repository } from "../../../repositories/Repository";
import * as checkHierarchicalUtils from "../../../utils/checkHierarchicalPrerequisitesComplete";
import * as checkPrereqUtils from "../../../utils/checkPrerequisitesComplete";
import * as filterUtils from "../../../utils/filterUnavailableObjects";
import * as sortUtils from "../../../utils/sortTrellisObjects";
import { claimTask } from "../claimTask";

// Mock the utility functions
jest.mock("../../../utils/filterUnavailableObjects");
jest.mock("../../../utils/sortTrellisObjects");
jest.mock("../../../utils/checkHierarchicalPrerequisitesComplete");
jest.mock("../../../utils/checkPrerequisitesComplete");
jest.mock("../../../utils/updateParentHierarchy");

const mockFilterUnavailableObjects =
  filterUtils.filterUnavailableObjects as jest.MockedFunction<
    typeof filterUtils.filterUnavailableObjects
  >;
const mockSortTrellisObjects =
  sortUtils.sortTrellisObjects as jest.MockedFunction<
    typeof sortUtils.sortTrellisObjects
  >;
const mockCheckHierarchicalPrerequisitesComplete =
  checkHierarchicalUtils.checkHierarchicalPrerequisitesComplete as jest.MockedFunction<
    typeof checkHierarchicalUtils.checkHierarchicalPrerequisitesComplete
  >;
const mockCheckPrerequisitesComplete =
  checkPrereqUtils.checkPrerequisitesComplete as jest.MockedFunction<
    typeof checkPrereqUtils.checkPrerequisitesComplete
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
    mockCheckHierarchicalPrerequisitesComplete.mockReset();
    mockCheckPrerequisitesComplete.mockReset();

    // Default mocking for prerequisite checks (most tests expect tasks to be claimable)
    mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(true);
    mockCheckPrerequisitesComplete.mockResolvedValue(true);
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
      const mockUpdatedTask = {
        ...mockTask,
        status: TrellisObjectStatus.IN_PROGRESS,
      };

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask) // First call for the task
        .mockResolvedValueOnce(mockUpdatedTask) // Second call to re-read after save
        .mockResolvedValueOnce(mockFeature) // Third call for feature parent
        .mockResolvedValueOnce(mockEpic) // Fourth call for epic parent
        .mockResolvedValueOnce(mockProject); // Fifth call for project parent

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

    it("should throw error when task's own prerequisites are not complete (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: ["T-prerequisite"] });
      const mockPrerequisite = createMockTask({
        id: "T-prerequisite",
        status: TrellisObjectStatus.OPEN,
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask, mockPrerequisite]);

      // Mock hierarchical check to fail
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(false);
      // Mock own prerequisites check to also fail (task's own prerequisites incomplete)
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

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

    it("should throw error when parent hierarchy has incomplete prerequisites (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: [] });

      mockRepository.getObjectById.mockResolvedValue(mockTask);

      // Mock hierarchical check to fail (parent prerequisites incomplete)
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(false);
      // Mock own prerequisites check to pass (task's own prerequisites are complete)
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );
    });

    it("should allow claiming when hierarchical prerequisites are complete (without force)", async () => {
      const mockTask = createMockTask({ prerequisites: ["T-prerequisite"] });
      const mockPrerequisite = createMockTask({
        id: "T-prerequisite",
        status: TrellisObjectStatus.DONE,
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.getObjects.mockResolvedValue([mockTask, mockPrerequisite]);
      mockRepository.saveObject.mockResolvedValue();

      // Mock hierarchical prerequisites as complete (default setup should handle this)
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(true);

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

    it("should bypass hierarchical prerequisite checks when force is true", async () => {
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

      // Force should bypass prerequisite checks entirely
      expect(mockCheckHierarchicalPrerequisitesComplete).not.toHaveBeenCalled();
      expect(mockCheckPrerequisitesComplete).not.toHaveBeenCalled();
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
      const updatedTask = {
        ...mockTasks[1],
        status: TrellisObjectStatus.IN_PROGRESS,
      };

      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockRepository.getObjectById.mockResolvedValue(updatedTask); // Re-read after save
      mockFilterUnavailableObjects.mockResolvedValue(availableTasks);
      mockSortTrellisObjects.mockReturnValue(sortedTasks);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository);

      expect(mockRepository.getObjects).toHaveBeenCalledWith(
        false,
        undefined,
        TrellisObjectType.TASK,
      );
      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        mockTasks,
        mockRepository,
      );
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
      mockFilterUnavailableObjects.mockResolvedValue(mockTasks);
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
      mockFilterUnavailableObjects.mockResolvedValue([]);

      const result = await claimTask(mockRepository);

      expect(result.content[0].text).toContain("No available tasks to claim");
    });

    it("should throw error when all tasks are filtered out", async () => {
      const mockTasks = [
        createMockTask({ status: TrellisObjectStatus.IN_PROGRESS }),
        createMockTask({ status: TrellisObjectStatus.DONE }),
      ];

      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockFilterUnavailableObjects.mockResolvedValue([]);

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

  describe("hierarchical prerequisite checking", () => {
    it("should prevent claiming task when parent feature has incomplete prerequisites", async () => {
      const mockTask = createMockTask({
        parent: "F-test-feature",
        prerequisites: [], // Task itself has no prerequisites
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);

      // Mock hierarchical check to fail due to parent prerequisites
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(false);
      // Mock own prerequisites check to pass (task has no prerequisites)
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );
      expect(mockCheckHierarchicalPrerequisitesComplete).toHaveBeenCalledWith(
        mockTask,
        mockRepository,
      );
    });

    it("should prevent claiming task when grandparent epic has incomplete prerequisites", async () => {
      const mockTask = createMockTask({
        parent: "F-test-feature",
        prerequisites: [],
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);

      // Mock hierarchical check to fail due to grandparent prerequisites
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(false);
      // Mock own prerequisites check to pass
      mockCheckPrerequisitesComplete.mockResolvedValue(true);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "Parent hierarchy has incomplete prerequisites",
      );
    });

    it("should allow claiming task when all hierarchical prerequisites are complete", async () => {
      const mockTask = createMockTask({
        parent: "F-test-feature",
        prerequisites: ["T-complete-prereq"],
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      // Mock all prerequisite checks to pass
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(true);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(mockRepository.saveObject).toHaveBeenCalled();
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should exclude hierarchically blocked tasks in findNextAvailableTask", async () => {
      const mockTask1 = createMockTask({
        id: "T-task-1",
        priority: TrellisObjectPriority.HIGH,
      });
      const mockTask2 = createMockTask({
        id: "T-task-2",
        priority: TrellisObjectPriority.MEDIUM,
      });
      const mockTasks = [mockTask1, mockTask2];

      // filterUnavailableObjects should handle hierarchical filtering
      const availableTasks = [mockTask2]; // Task1 filtered out due to hierarchical prerequisites
      const sortedTasks = [mockTask2];
      const updatedTask = {
        ...mockTask2,
        status: TrellisObjectStatus.IN_PROGRESS,
      };

      mockRepository.getObjects.mockResolvedValue(mockTasks);
      mockRepository.getObjectById.mockResolvedValue(updatedTask);
      mockFilterUnavailableObjects.mockResolvedValue(availableTasks);
      mockSortTrellisObjects.mockReturnValue(sortedTasks);
      mockRepository.saveObject.mockResolvedValue();

      const result = await claimTask(mockRepository);

      expect(mockFilterUnavailableObjects).toHaveBeenCalledWith(
        mockTasks,
        mockRepository,
      );
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask2,
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      expect(result.content[0].text).toContain("Successfully claimed task:");
    });

    it("should provide specific error message for task's own incomplete prerequisites", async () => {
      const mockTask = createMockTask({
        prerequisites: ["T-incomplete-prereq"],
      });

      mockRepository.getObjectById.mockResolvedValue(mockTask);

      // Mock hierarchical check to fail
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(false);
      // Mock own prerequisites check to also fail (task's own prerequisites incomplete)
      mockCheckPrerequisitesComplete.mockResolvedValue(false);

      const result = await claimTask(
        mockRepository,
        undefined,
        "T-test-task",
        false,
      );

      expect(result.content[0].text).toContain(
        "Not all prerequisites are complete",
      );
      expect(result.content[0].text).not.toContain(
        "Parent hierarchy has incomplete prerequisites",
      );
    });

    it("should use checkHierarchicalPrerequisitesComplete instead of checkPrerequisitesComplete", async () => {
      const mockTask = createMockTask({ prerequisites: [] });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      // Mock hierarchical prerequisites as complete
      mockCheckHierarchicalPrerequisitesComplete.mockResolvedValue(true);

      await claimTask(mockRepository, undefined, "T-test-task", false);

      // Should call hierarchical check for validation
      expect(mockCheckHierarchicalPrerequisitesComplete).toHaveBeenCalledWith(
        mockTask,
        mockRepository,
      );
    });
  });
});
