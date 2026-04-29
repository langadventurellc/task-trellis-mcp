import { Repository } from "../../../repositories";
import { readProjectFile } from "../readProjectFile";

describe("readProjectFile service function", () => {
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

  it("returns file contents on success", async () => {
    mockRepository.readProjectFile.mockResolvedValue("hello world");
    const result = await readProjectFile(mockRepository, "foo.md");
    expect(result).toEqual({
      content: [{ type: "text", text: "hello world" }],
    });
  });

  it("returns error message when file does not exist", async () => {
    mockRepository.readProjectFile.mockRejectedValue(
      new Error("Project file 'foo.md' does not exist"),
    );
    const result = await readProjectFile(mockRepository, "foo.md");
    expect(result).toEqual({
      content: [{ type: "text", text: "Project file 'foo.md' does not exist" }],
    });
  });
});
