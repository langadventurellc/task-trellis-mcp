import { ServerConfig } from "../../configuration";
import { TrellisObjectPriority, TrellisObjectStatus } from "../../models";
import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleUpdateObject } from "../updateObjectTool";

describe("updateObjectTool", () => {
  let mockService: jest.Mocked<TaskTrellisService>;
  let mockRepository: jest.Mocked<Repository>;
  let mockServerConfig: jest.Mocked<ServerConfig>;

  beforeEach(() => {
    mockService = {
      updateObject: jest.fn(),
    } as unknown as jest.Mocked<TaskTrellisService>;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
    };

    mockServerConfig = {
      mode: "local",
      autoCompleteParent: true,
    };

    jest.clearAllMocks();
  });

  describe("handleUpdateObject", () => {
    const mockResult = {
      content: [
        {
          type: "text",
          text: "Successfully updated object: {...}",
        },
      ],
    };

    it("should call service.updateObject with correct parameters for all properties", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);

      const result = await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          priority: "high",
          prerequisites: ["T-prereq-1", "T-prereq-2"],
          body: "Updated body content",
          status: "draft",
          force: true,
        },
        mockServerConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        "high" as TrellisObjectPriority,
        ["T-prereq-1", "T-prereq-2"],
        "Updated body content",
        "draft" as TrellisObjectStatus,
        true,
      );
      expect(result).toBe(mockResult);
    });

    it("should call service.updateObject with only specified properties", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);

      const result = await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          priority: "low",
        },
        mockServerConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        "low" as TrellisObjectPriority,
        undefined,
        undefined,
        undefined,
        false,
      );
      expect(result).toBe(mockResult);
    });

    it("should call service.updateObject with title parameter", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);

      const result = await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          title: "Updated Task Title",
        },
        mockServerConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        "Updated Task Title",
        undefined,
        undefined,
        undefined,
        undefined,
        false,
      );
      expect(result).toBe(mockResult);
    });

    it("should handle missing optional parameters correctly", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);

      const result = await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          status: "in-progress",
        },
        mockServerConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        "in-progress" as TrellisObjectStatus,
        false,
      );
      expect(result).toBe(mockResult);
    });

    it("should default force to false when not provided", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);

      await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          status: "done",
        },
        mockServerConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        mockServerConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        "done" as TrellisObjectStatus,
        false,
      );
    });

    it("should pass through service errors", async () => {
      const errorResult = {
        content: [
          {
            type: "text",
            text: "Error updating object: Object not found",
          },
        ],
      };
      mockService.updateObject.mockResolvedValue(errorResult);

      const result = await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-nonexistent",
          priority: "high",
        },
        mockServerConfig,
      );

      expect(result).toBe(errorResult);
    });

    it("should handle service rejections", async () => {
      mockService.updateObject.mockRejectedValue(new Error("Service error"));

      await expect(
        handleUpdateObject(
          mockService,
          mockRepository,
          {
            id: "T-test-task",
            status: "done",
          },
          mockServerConfig,
        ),
      ).rejects.toThrow("Service error");
    });

    it("should pass serverConfig to service when provided", async () => {
      mockService.updateObject.mockResolvedValue(mockResult);
      const serverConfig: ServerConfig = {
        mode: "local",
        autoCompleteParent: true,
      };

      await handleUpdateObject(
        mockService,
        mockRepository,
        {
          id: "T-test-task",
          status: "done",
        },
        serverConfig,
      );

      expect(mockService.updateObject).toHaveBeenCalledWith(
        mockRepository,
        serverConfig,
        "T-test-task",
        undefined,
        undefined,
        undefined,
        undefined,
        "done" as TrellisObjectStatus,
        false,
      );
    });
  });
});
