import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import {
  handleListProjectFiles,
  listProjectFilesTool,
} from "../listProjectFilesTool";

describe("listProjectFilesTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let listProjectFilesSpy: jest.Mock;

  beforeEach(() => {
    listProjectFilesSpy = jest.fn();
    mockService = {
      listProjectFiles: listProjectFilesSpy,
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
      expect(listProjectFilesTool.name).toBe("list_project_files");
    });

    it("has empty properties and additionalProperties false", () => {
      expect(listProjectFilesTool.inputSchema.properties).toEqual({});
      expect(listProjectFilesTool.inputSchema.additionalProperties).toBe(false);
    });
  });

  describe("handler", () => {
    it("delegates to service with repository only and returns result", async () => {
      const mockResult = {
        content: [{ type: "text", text: '["foo.md","bar.txt"]' }],
      };
      listProjectFilesSpy.mockResolvedValue(mockResult);

      const result = await handleListProjectFiles(mockService, mockRepository);

      expect(listProjectFilesSpy).toHaveBeenCalledWith(mockRepository);
      expect(result).toBe(mockResult);
    });

    it("returns empty list result from service", async () => {
      const emptyResult = {
        content: [{ type: "text", text: "[]" }],
      };
      listProjectFilesSpy.mockResolvedValue(emptyResult);

      const result = await handleListProjectFiles(mockService, mockRepository);

      expect(result).toBe(emptyResult);
    });
  });
});
