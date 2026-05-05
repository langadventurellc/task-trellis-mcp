import * as fsp from "fs/promises";
import {
  TrellisObjectPriority,
  TrellisObjectStatus,
  TrellisObjectType,
} from "../../../models";
import * as getAttachmentsFolderModule from "../getAttachmentsFolder";
import * as getObjectByIdModule from "../getObjectById";
import { copyAttachment } from "../copyAttachment";

jest.mock("fs/promises");
jest.mock("../getAttachmentsFolder");
jest.mock("../getObjectById");

const mockAccess = jest.mocked(fsp.access);
const mockMkdir = jest.mocked(fsp.mkdir);
const mockCopyFile = jest.mocked(fsp.copyFile);
const mockGetAttachmentsFolder = jest.mocked(
  getAttachmentsFolderModule.getAttachmentsFolder,
);
const mockGetObjectById = jest.mocked(getObjectByIdModule.getObjectById);

const mockObj = {
  id: "F-feat",
  type: TrellisObjectType.FEATURE,
  title: "Test Feature",
  status: TrellisObjectStatus.OPEN,
  priority: TrellisObjectPriority.MEDIUM,
  parent: null,
  prerequisites: [],
  affectedFiles: new Map(),
  log: [],
  schema: "1.0",
  childrenIds: [],
  labels: [],
  body: "",
  created: "2025-01-15T10:00:00Z",
  updated: "2025-01-15T10:00:00Z",
};

describe("copyAttachment", () => {
  const root = "/planning";
  const folder = "/planning/f/F-feat/attachments";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetObjectById.mockResolvedValue(mockObj);
    mockGetAttachmentsFolder.mockResolvedValue(folder);
    // Default: source exists, dest does not exist
    mockAccess.mockImplementation((p) => {
      if (String(p).includes("attachments/report.pdf")) {
        return Promise.reject(
          Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
        );
      }
      return Promise.resolve();
    });
    mockMkdir.mockResolvedValue(undefined as unknown as string);
    mockCopyFile.mockResolvedValue(undefined);
  });

  it("copies file and returns filename on success", async () => {
    const result = await copyAttachment("F-feat", "/tmp/report.pdf", root);
    expect(result).toBe("report.pdf");
    expect(mockMkdir).toHaveBeenCalledWith(folder, { recursive: true });
    expect(mockCopyFile).toHaveBeenCalledWith(
      "/tmp/report.pdf",
      `${folder}/report.pdf`,
    );
  });

  it("throws when source file does not exist", async () => {
    mockAccess.mockRejectedValueOnce(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" }),
    );
    await expect(
      copyAttachment("F-feat", "/tmp/missing.pdf", root),
    ).rejects.toThrow("Source file '/tmp/missing.pdf' does not exist");
  });

  it("throws when issue does not exist", async () => {
    mockGetObjectById.mockResolvedValueOnce(null);
    await expect(
      copyAttachment("F-missing", "/tmp/report.pdf", root),
    ).rejects.toThrow("Object with ID 'F-missing' not found");
  });

  it("throws on filename collision", async () => {
    // Both source and dest exist
    mockAccess.mockResolvedValue(undefined);
    await expect(
      copyAttachment("F-feat", "/tmp/report.pdf", root),
    ).rejects.toThrow(
      "File 'report.pdf' already exists in attachments for F-feat",
    );
  });
});
