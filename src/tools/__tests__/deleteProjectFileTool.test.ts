import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import {
  deleteProjectFileTool,
  handleDeleteProjectFile,
} from "../deleteProjectFileTool";

describe("deleteProjectFileTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let deleteProjectFileSpy: jest.Mock;

  beforeEach(() => {
    deleteProjectFileSpy = jest.fn();
    mockService = {
      deleteProjectFile: deleteProjectFileSpy,
    } as unknown as TaskTrellisService;

    mockRepository = {
      getObjectById: jest.fn(),
      getObjects: jest.fn(),
      saveObject: jest.fn(),
      deleteObject: jest.fn(),
      getChildrenOf: jest.fn(),
      getAttachmentsFolder: jest.fn(),
      listAttachments: jest.fn(),
      copyAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
      writeProjectFile: jest.fn(),
      readProjectFile: jest.fn(),
      listProjectFiles: jest.fn(),
      deleteProjectFile: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe("descriptor", () => {
    it("has correct name", () => {
      expect(deleteProjectFileTool.name).toBe("delete_project_file");
    });

    it("requires filename", () => {
      expect(deleteProjectFileTool.inputSchema.required).toEqual(["filename"]);
    });
  });

  describe("handler", () => {
    it("delegates to service and returns result", async () => {
      const mockResult = {
        content: [{ type: "text", text: "Project file 'foo.md' deleted" }],
      };
      deleteProjectFileSpy.mockResolvedValue(mockResult);

      const result = await handleDeleteProjectFile(
        mockService,
        mockRepository,
        { filename: "foo.md" },
      );

      expect(deleteProjectFileSpy).toHaveBeenCalledWith(
        mockRepository,
        "foo.md",
      );
      expect(result).toBe(mockResult);
    });

    it("returns service error result", async () => {
      const errorResult = {
        content: [
          { type: "text", text: "Project file 'foo.md' does not exist" },
        ],
      };
      deleteProjectFileSpy.mockResolvedValue(errorResult);

      const result = await handleDeleteProjectFile(
        mockService,
        mockRepository,
        { filename: "foo.md" },
      );

      expect(result).toBe(errorResult);
    });
  });
});
