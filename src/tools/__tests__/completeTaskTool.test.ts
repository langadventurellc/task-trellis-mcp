import { Repository } from "../../repositories/Repository";
import {
  TrellisObject,
  TrellisObjectType,
  TrellisObjectStatus,
  TrellisObjectPriority,
} from "../../models";
import { handleCompleteTask } from "../completeTaskTool";
import { ServerConfig } from "../../configuration";

describe("completeTaskTool", () => {
  let mockRepository: jest.Mocked<Repository>;

  const createMockTask = (
    overrides?: Partial<TrellisObject>,
  ): TrellisObject => ({
    id: "T-test-task",
    type: TrellisObjectType.TASK,
    title: "Test Task",
    status: TrellisObjectStatus.IN_PROGRESS,
    priority: TrellisObjectPriority.MEDIUM,
    parent: "F-test-feature",
    prerequisites: [],
    affectedFiles: new Map(),
    log: [],
    schema: "1.0",
    created: "2025-01-15T10:00:00Z",
    updated: "2025-01-15T10:00:00Z",
    childrenIds: [],
    body: "This is a test task",
    ...overrides,
  });

  beforeEach(() => {
    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };
  });

  describe("handleCompleteTask", () => {
    it("should successfully complete a task in progress", async () => {
      const mockTask = createMockTask();
      const filesChanged = {
        "src/file1.ts": "Added new feature",
        "src/file2.ts": "Fixed bug",
      };

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Task completed successfully",
        filesChanged,
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        affectedFiles: new Map([
          ["src/file1.ts", "Added new feature"],
          ["src/file2.ts", "Fixed bug"],
        ]),
        log: ["Task completed successfully"],
      });
      expect(result.content[0].text).toContain(
        'Task "T-test-task" completed successfully. Updated 2 affected files.',
      );
    });

    it("should append to existing affected files", async () => {
      const existingFiles = new Map([["existing.ts", "Previously changed"]]);
      const mockTask = createMockTask({ affectedFiles: existingFiles });
      const filesChanged = {
        "src/new-file.ts": "Newly added file",
      };

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Added new functionality",
        filesChanged,
      });

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        affectedFiles: new Map([
          ["existing.ts", "Previously changed"],
          ["src/new-file.ts", "Newly added file"],
        ]),
        log: ["Added new functionality"],
      });
    });

    it("should append to existing log entries", async () => {
      const mockTask = createMockTask({ log: ["Previous log entry"] });
      const filesChanged = { "file.ts": "Description" };

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "New log entry",
        filesChanged,
      });

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        log: ["Previous log entry", "New log entry"],
        affectedFiles: new Map([["file.ts", "Description"]]),
      });
    });

    it("should handle empty files changed object", async () => {
      const mockTask = createMockTask();
      const filesChanged = {};

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Task completed with no file changes",
        filesChanged,
      });

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        affectedFiles: new Map(),
        log: ["Task completed with no file changes"],
      });
      expect(result.content[0].text).toContain("Updated 0 affected files");
    });

    it("should throw error when task is not found", async () => {
      mockRepository.getObjectById.mockResolvedValue(null);

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-nonexistent",
          summary: "Summary",
          filesChanged: {},
        }),
      ).rejects.toThrow('Task with ID "T-nonexistent" not found');

      expect(mockRepository.getObjectById).toHaveBeenCalledWith(
        "T-nonexistent",
      );
      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should throw error when task is not in progress", async () => {
      const mockTask = createMockTask({ status: TrellisObjectStatus.OPEN });
      mockRepository.getObjectById.mockResolvedValue(mockTask);

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-test-task",
          summary: "Summary",
          filesChanged: {},
        }),
      ).rejects.toThrow(
        'Task "T-test-task" is not in progress (current status: open)',
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should throw error when task is already done", async () => {
      const mockTask = createMockTask({ status: TrellisObjectStatus.DONE });
      mockRepository.getObjectById.mockResolvedValue(mockTask);

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-test-task",
          summary: "Summary",
          filesChanged: {},
        }),
      ).rejects.toThrow(
        'Task "T-test-task" is not in progress (current status: done)',
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should throw error when task is in draft status", async () => {
      const mockTask = createMockTask({ status: TrellisObjectStatus.DRAFT });
      mockRepository.getObjectById.mockResolvedValue(mockTask);

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-test-task",
          summary: "Summary",
          filesChanged: {},
        }),
      ).rejects.toThrow(
        'Task "T-test-task" is not in progress (current status: draft)',
      );

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should handle repository getObjectById errors", async () => {
      const errorMessage = "Database connection failed";
      mockRepository.getObjectById.mockRejectedValue(new Error(errorMessage));

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-test-task",
          summary: "Summary",
          filesChanged: {},
        }),
      ).rejects.toThrow(errorMessage);

      expect(mockRepository.saveObject).not.toHaveBeenCalled();
    });

    it("should handle repository saveObject errors", async () => {
      const mockTask = createMockTask();
      const errorMessage = "Save operation failed";

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockRejectedValue(new Error(errorMessage));

      await expect(
        handleCompleteTask(mockRepository, {
          taskId: "T-test-task",
          summary: "Summary",
          filesChanged: { "file.ts": "Description" },
        }),
      ).rejects.toThrow(errorMessage);

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(mockRepository.saveObject).toHaveBeenCalled();
    });
  });

  describe("parameter handling", () => {
    it("should handle args object correctly with all parameters", async () => {
      const mockTask = createMockTask();
      const filesChanged = { "test.ts": "Test file" };

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      const result = await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Test summary",
        filesChanged,
        extraProperty: "should be ignored",
      });

      expect(mockRepository.getObjectById).toHaveBeenCalledWith("T-test-task");
      expect(result.content[0].text).toContain("completed successfully");
    });

    it("should properly type filesChanged as Record<string, string>", async () => {
      const mockTask = createMockTask();
      const filesChanged = {
        "file1.ts": "First file",
        "file2.js": "Second file",
        "config.json": "Configuration file",
      };

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Multiple files changed",
        filesChanged,
      });

      const expectedMap = new Map([
        ["file1.ts", "First file"],
        ["file2.js", "Second file"],
        ["config.json", "Configuration file"],
      ]);

      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        affectedFiles: expectedMap,
        log: ["Multiple files changed"],
      });
    });
  });

  describe("auto-complete parent functionality", () => {
    const createMockFeature = (
      id: string,
      childrenIds: string[] = [],
      status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
    ): TrellisObject => ({
      id,
      type: TrellisObjectType.FEATURE,
      title: "Test Feature",
      status,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "E-test-epic",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "1.0",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
      childrenIds,
      body: "This is a test feature",
    });

    const createMockEpic = (
      id: string,
      childrenIds: string[] = [],
      status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
    ): TrellisObject => ({
      id,
      type: TrellisObjectType.EPIC,
      title: "Test Epic",
      status,
      priority: TrellisObjectPriority.MEDIUM,
      parent: "P-test-project",
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "1.0",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
      childrenIds,
      body: "This is a test epic",
    });

    const createMockProject = (
      id: string,
      childrenIds: string[] = [],
      status: TrellisObjectStatus = TrellisObjectStatus.OPEN,
    ): TrellisObject => ({
      id,
      type: TrellisObjectType.PROJECT,
      title: "Test Project",
      status,
      priority: TrellisObjectPriority.MEDIUM,
      prerequisites: [],
      affectedFiles: new Map(),
      log: [],
      schema: "1.0",
      created: "2025-01-15T10:00:00Z",
      updated: "2025-01-15T10:00:00Z",
      childrenIds,
      body: "This is a test project",
    });

    const serverConfigWithAutoComplete: ServerConfig = {
      mode: "local",
      planningRootFolder: "/test",
      autoCompleteParent: true,
    };

    const serverConfigWithoutAutoComplete: ServerConfig = {
      mode: "local",
      planningRootFolder: "/test",
      autoCompleteParent: false,
    };

    it("should not auto-complete parents when autoCompleteParent is false", async () => {
      const mockTask = createMockTask();
      const mockFeature = createMockFeature("F-test-feature", ["T-test-task"]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithoutAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
      expect(mockRepository.saveObject).toHaveBeenCalledWith({
        ...mockTask,
        status: TrellisObjectStatus.DONE,
        affectedFiles: new Map(),
        log: ["Task completed"],
      });
    });

    it("should not auto-complete parents when serverConfig is undefined", async () => {
      const mockTask = createMockTask();

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(mockRepository, {
        taskId: "T-test-task",
        summary: "Task completed",
        filesChanged: {},
      });

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should auto-complete feature when all tasks are done", async () => {
      const mockTask1 = createMockTask({ id: "T-task-1" });
      const mockTask2 = createMockTask({
        id: "T-task-2",
        status: TrellisObjectStatus.DONE,
      });
      const mockFeature = createMockFeature("F-test-feature", [
        "T-task-1",
        "T-task-2",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockTask2);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-task-1",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.DONE,
        log: ["Auto-completed: All child tasks are complete"],
      });
    });

    it("should not auto-complete feature when some tasks are still in progress", async () => {
      const mockTask1 = createMockTask({ id: "T-task-1" });
      const mockTask2 = createMockTask({
        id: "T-task-2",
        status: TrellisObjectStatus.IN_PROGRESS,
      });
      const mockFeature = createMockFeature("F-test-feature", [
        "T-task-1",
        "T-task-2",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockTask2);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-task-1",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should auto-complete feature when all tasks are done or wont-do", async () => {
      const mockTask1 = createMockTask({ id: "T-task-1" });
      const mockTask2 = createMockTask({
        id: "T-task-2",
        status: TrellisObjectStatus.WONT_DO,
      });
      const mockFeature = createMockFeature("F-test-feature", [
        "T-task-1",
        "T-task-2",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask1)
        .mockResolvedValueOnce(mockTask2);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-task-1",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(2, {
        ...mockFeature,
        status: TrellisObjectStatus.DONE,
        log: ["Auto-completed: All child tasks are complete"],
      });
    });

    it("should auto-complete epic when all features are done", async () => {
      const mockTask = createMockTask();
      const mockFeature1 = createMockFeature("F-feature-1", ["T-test-task"]);
      const mockFeature2 = createMockFeature(
        "F-feature-2",
        [],
        TrellisObjectStatus.DONE,
      );
      const mockEpic = createMockEpic("E-test-epic", [
        "F-feature-1",
        "F-feature-2",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature1)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockEpic)
        .mockResolvedValueOnce(mockFeature1)
        .mockResolvedValueOnce(mockFeature2);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(3);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(3, {
        ...mockEpic,
        status: TrellisObjectStatus.DONE,
        log: ["Auto-completed: All child features are complete"],
      });
    });

    it("should auto-complete project when all epics are done", async () => {
      const mockTask = createMockTask();
      const mockFeature = createMockFeature("F-test-feature", ["T-test-task"]);
      const mockEpic1 = createMockEpic("E-epic-1", ["F-test-feature"]);
      const mockEpic2 = createMockEpic(
        "E-epic-2",
        [],
        TrellisObjectStatus.DONE,
      );
      const mockProject = createMockProject("P-test-project", [
        "E-epic-1",
        "E-epic-2",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockEpic1)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(mockEpic1)
        .mockResolvedValueOnce(mockEpic2);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(4);
      expect(mockRepository.saveObject).toHaveBeenNthCalledWith(4, {
        ...mockProject,
        status: TrellisObjectStatus.DONE,
        log: ["Auto-completed: All child epics are complete"],
      });
    });

    it("should handle task with no parent", async () => {
      const mockTask = createMockTask({ parent: undefined });

      mockRepository.getObjectById.mockResolvedValue(mockTask);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should handle parent not found", async () => {
      const mockTask = createMockTask();

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(null);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should not auto-complete parent if already done", async () => {
      const mockTask = createMockTask();
      const mockFeature = createMockFeature(
        "F-test-feature",
        ["T-test-task"],
        TrellisObjectStatus.DONE,
      );

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask); // Additional call for checking children
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(1);
    });

    it("should handle null siblings gracefully", async () => {
      const mockTask = createMockTask();
      const mockFeature = createMockFeature("F-test-feature", [
        "T-test-task",
        "T-missing-task",
      ]);

      mockRepository.getObjectById
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(mockFeature)
        .mockResolvedValueOnce(mockTask)
        .mockResolvedValueOnce(null);
      mockRepository.saveObject.mockResolvedValue();

      await handleCompleteTask(
        mockRepository,
        {
          taskId: "T-test-task",
          summary: "Task completed",
          filesChanged: {},
        },
        serverConfigWithAutoComplete,
      );

      expect(mockRepository.saveObject).toHaveBeenCalledTimes(2);
    });
  });
});
