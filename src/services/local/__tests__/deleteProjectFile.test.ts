import { Repository } from "../../../repositories";
import { deleteProjectFile } from "../deleteProjectFile";

describe("deleteProjectFile service function", () => {
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

  it("returns success message on delete", async () => {
    mockRepository.deleteProjectFile.mockResolvedValue();
    const result = await deleteProjectFile(mockRepository, "foo.md");
    expect(result).toEqual({
      content: [{ type: "text", text: "Project file 'foo.md' deleted" }],
    });
  });

  it("returns error message when repository throws", async () => {
    mockRepository.deleteProjectFile.mockRejectedValue(
      new Error("Project file 'foo.md' does not exist"),
    );
    const result = await deleteProjectFile(mockRepository, "foo.md");
    expect(result).toEqual({
      content: [{ type: "text", text: "Project file 'foo.md' does not exist" }],
    });
  });
});
