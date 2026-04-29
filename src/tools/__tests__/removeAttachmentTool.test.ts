import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleRemoveAttachment } from "../removeAttachmentTool";

describe("removeAttachmentTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let removeAttachmentSpy: jest.Mock;

  beforeEach(() => {
    removeAttachmentSpy = jest.fn();
    mockService = {
      removeAttachment: removeAttachmentSpy,
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

  it("delegates to service and returns result", async () => {
    const mockResult = {
      content: [
        { type: "text", text: "Attachment 'report.pdf' removed from F-feat" },
      ],
    };
    removeAttachmentSpy.mockResolvedValue(mockResult);

    const result = await handleRemoveAttachment(mockService, mockRepository, {
      id: "F-feat",
      filename: "report.pdf",
    });

    expect(removeAttachmentSpy).toHaveBeenCalledWith(
      mockRepository,
      "F-feat",
      "report.pdf",
    );
    expect(result).toBe(mockResult);
  });

  it("surfaces service errors", async () => {
    const errorResult = {
      content: [
        {
          type: "text",
          text: "File 'missing.pdf' does not exist in attachments for F-feat",
        },
      ],
    };
    removeAttachmentSpy.mockResolvedValue(errorResult);

    const result = await handleRemoveAttachment(mockService, mockRepository, {
      id: "F-feat",
      filename: "missing.pdf",
    });

    expect(result).toBe(errorResult);
  });
});
