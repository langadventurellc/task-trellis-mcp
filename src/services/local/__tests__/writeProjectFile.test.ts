import { Repository } from "../../../repositories";
import { writeProjectFile } from "../writeProjectFile";

describe("writeProjectFile service function", () => {
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

  it("returns success message on write", async () => {
    mockRepository.writeProjectFile.mockResolvedValue();
    const result = await writeProjectFile(mockRepository, "foo.md", "content");
    expect(result).toEqual({
      content: [{ type: "text", text: "Project file 'foo.md' written" }],
    });
  });

  it("passes failIfExists: undefined when not provided", async () => {
    mockRepository.writeProjectFile.mockResolvedValue();
    await writeProjectFile(mockRepository, "foo.md", "content");
    expect(mockRepository.writeProjectFile).toHaveBeenCalledWith(
      "foo.md",
      "content",
      undefined,
    );
  });

  it("forwards failIfExists: true to repository", async () => {
    mockRepository.writeProjectFile.mockResolvedValue();
    await writeProjectFile(mockRepository, "foo.md", "content", true);
    expect(mockRepository.writeProjectFile).toHaveBeenCalledWith(
      "foo.md",
      "content",
      true,
    );
  });

  it("returns error message when repository throws", async () => {
    mockRepository.writeProjectFile.mockRejectedValue(
      new Error("Project file 'foo.md' already exists"),
    );
    const result = await writeProjectFile(
      mockRepository,
      "foo.md",
      "content",
      true,
    );
    expect(result).toEqual({
      content: [{ type: "text", text: "Project file 'foo.md' already exists" }],
    });
  });
});
