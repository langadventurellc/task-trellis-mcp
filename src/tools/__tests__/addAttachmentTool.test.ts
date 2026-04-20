import { Repository } from "../../repositories/Repository";
import { TaskTrellisService } from "../../services/TaskTrellisService";
import { handleAddAttachment } from "../addAttachmentTool";

describe("addAttachmentTool", () => {
  let mockService: TaskTrellisService;
  let mockRepository: jest.Mocked<Repository>;
  let addAttachmentSpy: jest.Mock;

  beforeEach(() => {
    addAttachmentSpy = jest.fn();
    mockService = {
      addAttachment: addAttachmentSpy,
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
    };

    jest.clearAllMocks();
  });

  it("delegates to service and returns result", async () => {
    const mockResult = {
      content: [
        { type: "text", text: "Attachment 'report.pdf' added to F-feat" },
      ],
    };
    addAttachmentSpy.mockResolvedValue(mockResult);

    const result = await handleAddAttachment(mockService, mockRepository, {
      id: "F-feat",
      sourcePath: "/tmp/report.pdf",
    });

    expect(addAttachmentSpy).toHaveBeenCalledWith(
      mockRepository,
      "F-feat",
      "/tmp/report.pdf",
    );
    expect(result).toBe(mockResult);
  });

  it("surfaces service errors", async () => {
    const errorResult = {
      content: [
        { type: "text", text: "Source file '/tmp/missing.pdf' does not exist" },
      ],
    };
    addAttachmentSpy.mockResolvedValue(errorResult);

    const result = await handleAddAttachment(mockService, mockRepository, {
      id: "F-feat",
      sourcePath: "/tmp/missing.pdf",
    });

    expect(result).toBe(errorResult);
  });
});
