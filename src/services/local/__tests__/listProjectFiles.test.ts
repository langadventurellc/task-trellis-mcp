import { Repository } from "../../../repositories";
import { listProjectFiles } from "../listProjectFiles";

describe("listProjectFiles service function", () => {
  let mockRepository: jest.Mocked<Repository>;

  beforeEach(() => {
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

  it("returns JSON-stringified list of filenames", async () => {
    mockRepository.listProjectFiles.mockResolvedValue(["a.md", "b.txt"]);
    const result = await listProjectFiles(mockRepository);
    expect(result).toEqual({
      content: [{ type: "text", text: '["a.md","b.txt"]' }],
    });
  });

  it("returns '[]' for empty list", async () => {
    mockRepository.listProjectFiles.mockResolvedValue([]);
    const result = await listProjectFiles(mockRepository);
    expect(result).toEqual({
      content: [{ type: "text", text: "[]" }],
    });
  });

  it("returns error message when repository throws", async () => {
    mockRepository.listProjectFiles.mockRejectedValue(
      new Error("Permission denied"),
    );
    const result = await listProjectFiles(mockRepository);
    expect(result).toEqual({
      content: [{ type: "text", text: "Permission denied" }],
    });
  });
});
