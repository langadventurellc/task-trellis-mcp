import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import {
  handleReadProjectFile,
  readProjectFileTool,
} from "../readProjectFileTool";

describe("readProjectFileTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let readProjectFileSpy: jest.Mock;

  beforeEach(() => {
    readProjectFileSpy = jest.fn();
    mockService = {
      readProjectFile: readProjectFileSpy,
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
      expect(readProjectFileTool.name).toBe("read_project_file");
    });

    it("requires filename", () => {
      expect(readProjectFileTool.inputSchema.required).toEqual(["filename"]);
    });
  });

  describe("handler", () => {
    it("delegates to service and returns result", async () => {
      const mockResult = {
        content: [{ type: "text", text: "file contents here" }],
      };
      readProjectFileSpy.mockResolvedValue(mockResult);

      const result = await handleReadProjectFile(mockService, mockRepository, {
        filename: "foo.md",
      });

      expect(readProjectFileSpy).toHaveBeenCalledWith(mockRepository, "foo.md");
      expect(result).toBe(mockResult);
    });

    it("returns service error result", async () => {
      const errorResult = {
        content: [
          { type: "text", text: "Project file 'foo.md' does not exist" },
        ],
      };
      readProjectFileSpy.mockResolvedValue(errorResult);

      const result = await handleReadProjectFile(mockService, mockRepository, {
        filename: "foo.md",
      });

      expect(result).toBe(errorResult);
    });
  });
});
