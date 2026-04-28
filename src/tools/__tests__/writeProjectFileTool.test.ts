import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import {
  handleWriteProjectFile,
  writeProjectFileTool,
} from "../writeProjectFileTool";

describe("writeProjectFileTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let writeProjectFileSpy: jest.Mock;

  beforeEach(() => {
    writeProjectFileSpy = jest.fn();
    mockService = {
      writeProjectFile: writeProjectFileSpy,
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
      expect(writeProjectFileTool.name).toBe("write_project_file");
    });

    it("requires filename and content", () => {
      expect(writeProjectFileTool.inputSchema.required).toEqual([
        "filename",
        "content",
      ]);
    });

    it("has failIfExists property with default false", () => {
      const { failIfExists } = writeProjectFileTool.inputSchema.properties;
      expect(failIfExists.type).toBe("boolean");
      expect(failIfExists.default).toBe(false);
    });
  });

  describe("handler", () => {
    it("delegates to service without failIfExists when absent", async () => {
      const mockResult = {
        content: [{ type: "text", text: "Project file 'foo.md' written" }],
      };
      writeProjectFileSpy.mockResolvedValue(mockResult);

      const result = await handleWriteProjectFile(mockService, mockRepository, {
        filename: "foo.md",
        content: "hello",
      });

      expect(writeProjectFileSpy).toHaveBeenCalledWith(
        mockRepository,
        "foo.md",
        "hello",
        undefined,
      );
      expect(result).toBe(mockResult);
    });

    it("forwards failIfExists: true to service", async () => {
      const mockResult = {
        content: [{ type: "text", text: "Project file 'foo.md' written" }],
      };
      writeProjectFileSpy.mockResolvedValue(mockResult);

      await handleWriteProjectFile(mockService, mockRepository, {
        filename: "foo.md",
        content: "hello",
        failIfExists: true,
      });

      expect(writeProjectFileSpy).toHaveBeenCalledWith(
        mockRepository,
        "foo.md",
        "hello",
        true,
      );
    });

    it("returns whatever the service returns", async () => {
      const errorResult = {
        content: [
          { type: "text", text: "Project file 'foo.md' already exists" },
        ],
      };
      writeProjectFileSpy.mockResolvedValue(errorResult);

      const result = await handleWriteProjectFile(mockService, mockRepository, {
        filename: "foo.md",
        content: "hello",
        failIfExists: true,
      });

      expect(result).toBe(errorResult);
    });
  });
});
